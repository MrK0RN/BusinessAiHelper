import type { Express } from "express";
import { createServer, type Server } from "http";
import multer from "multer";
import path from "path";
import fs from "fs";
import { storage } from "./storage";
import { setupAuth, isAuthenticated } from "./replitAuth";
import { insertBotSchema, insertKnowledgeFileSchema, insertMessageLogSchema } from "@shared/schema";

// Configure multer for file uploads
const uploadDir = path.join(process.cwd(), 'uploads');
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

const upload = multer({
  storage: multer.diskStorage({
    destination: uploadDir,
    filename: (req, file, cb) => {
      const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
      cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
    }
  }),
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB limit
  },
  fileFilter: (req, file, cb) => {
    const allowedTypes = ['application/pdf', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', 'text/plain'];
    if (allowedTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Invalid file type. Only PDF, DOCX, and TXT files are allowed.'));
    }
  }
});

export async function registerRoutes(app: Express): Promise<Server> {
  // Auth middleware
  await setupAuth(app);

  // Auth routes
  app.get('/api/auth/user', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const user = await storage.getUser(userId);
      res.json(user);
    } catch (error) {
      console.error("Error fetching user:", error);
      res.status(500).json({ message: "Failed to fetch user" });
    }
  });

  // Bot management routes
  app.get('/api/bots', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const bots = await storage.getUserBots(userId);
      res.json(bots);
    } catch (error) {
      console.error("Error fetching bots:", error);
      res.status(500).json({ message: "Failed to fetch bots" });
    }
  });

  app.post('/api/bots', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const botData = insertBotSchema.parse({ ...req.body, userId });
      const bot = await storage.createBot(botData);
      res.status(201).json(bot);
    } catch (error) {
      console.error("Error creating bot:", error);
      res.status(400).json({ message: "Failed to create bot" });
    }
  });

  app.patch('/api/bots/:id', isAuthenticated, async (req: any, res) => {
    try {
      const botId = parseInt(req.params.id);
      const updates = req.body;
      const bot = await storage.updateBot(botId, updates);
      res.json(bot);
    } catch (error) {
      console.error("Error updating bot:", error);
      res.status(400).json({ message: "Failed to update bot" });
    }
  });

  app.delete('/api/bots/:id', isAuthenticated, async (req: any, res) => {
    try {
      const botId = parseInt(req.params.id);
      await storage.deleteBot(botId);
      res.status(204).send();
    } catch (error) {
      console.error("Error deleting bot:", error);
      res.status(400).json({ message: "Failed to delete bot" });
    }
  });

  // Knowledge base routes
  app.get('/api/knowledge-files', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const files = await storage.getUserKnowledgeFiles(userId);
      res.json(files);
    } catch (error) {
      console.error("Error fetching knowledge files:", error);
      res.status(500).json({ message: "Failed to fetch knowledge files" });
    }
  });

  app.post('/api/knowledge-files', isAuthenticated, upload.single('file'), async (req: any, res) => {
    try {
      if (!req.file) {
        return res.status(400).json({ message: "No file uploaded" });
      }

      const userId = req.user.claims.sub;
      const fileData = insertKnowledgeFileSchema.parse({
        userId,
        fileName: req.file.filename,
        originalName: req.file.originalname,
        filePath: req.file.path,
        fileSize: req.file.size,
        mimeType: req.file.mimetype,
      });

      const file = await storage.createKnowledgeFile(fileData);
      res.status(201).json(file);
    } catch (error) {
      console.error("Error uploading file:", error);
      res.status(400).json({ message: "Failed to upload file" });
    }
  });

  app.delete('/api/knowledge-files/:id', isAuthenticated, async (req: any, res) => {
    try {
      const fileId = parseInt(req.params.id);
      await storage.deleteKnowledgeFile(fileId);
      res.status(204).send();
    } catch (error) {
      console.error("Error deleting file:", error);
      res.status(400).json({ message: "Failed to delete file" });
    }
  });

  // Analytics routes
  app.get('/api/stats', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const stats = await storage.getUserMessageStats(userId);
      res.json(stats);
    } catch (error) {
      console.error("Error fetching stats:", error);
      res.status(500).json({ message: "Failed to fetch stats" });
    }
  });

  app.get('/api/recent-activity', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const bots = await storage.getUserBots(userId);
      
      if (bots.length === 0) {
        return res.json([]);
      }

      // Get recent messages from all user's bots
      const recentMessages = await Promise.all(
        bots.map(bot => storage.getBotMessageLogs(bot.id, 10))
      );
      
      // Flatten and sort by creation time
      const allMessages = recentMessages
        .flat()
        .sort((a, b) => new Date(b.createdAt!).getTime() - new Date(a.createdAt!).getTime())
        .slice(0, 20);

      res.json(allMessages);
    } catch (error) {
      console.error("Error fetching recent activity:", error);
      res.status(500).json({ message: "Failed to fetch recent activity" });
    }
  });

  // Webhook handlers for different platforms
  app.post('/api/webhook/telegram/:botId', async (req, res) => {
    try {
      const botId = parseInt(req.params.botId);
      const update = req.body;
      
      // Process Telegram webhook
      if (update.message) {
        const messageLog = insertMessageLogSchema.parse({
          botId,
          platform: 'telegram',
          messageId: update.message.message_id.toString(),
          senderId: update.message.from.id.toString(),
          messageText: update.message.text,
          responseTime: Date.now(), // Will be updated when response is sent
        });
        
        await storage.createMessageLog(messageLog);
        
        // Here you would integrate with OpenAI and send response
        // For now, just acknowledge receipt
        res.status(200).json({ ok: true });
      } else {
        res.status(200).json({ ok: true });
      }
    } catch (error) {
      console.error("Error processing Telegram webhook:", error);
      res.status(500).json({ message: "Webhook processing failed" });
    }
  });

  app.post('/api/webhook/whatsapp/:botId', async (req, res) => {
    try {
      const botId = parseInt(req.params.botId);
      const update = req.body;
      
      // Process WhatsApp webhook
      if (update.messages) {
        for (const message of update.messages) {
          const messageLog = insertMessageLogSchema.parse({
            botId,
            platform: 'whatsapp',
            messageId: message.id,
            senderId: message.from,
            messageText: message.text?.body || '',
            responseTime: Date.now(),
          });
          
          await storage.createMessageLog(messageLog);
        }
      }
      
      res.status(200).json({ status: 'success' });
    } catch (error) {
      console.error("Error processing WhatsApp webhook:", error);
      res.status(500).json({ message: "Webhook processing failed" });
    }
  });

  app.post('/api/webhook/instagram/:botId', async (req, res) => {
    try {
      const botId = parseInt(req.params.botId);
      const update = req.body;
      
      // Process Instagram webhook
      if (update.entry) {
        for (const entry of update.entry) {
          if (entry.messaging) {
            for (const messaging of entry.messaging) {
              if (messaging.message) {
                const messageLog = insertMessageLogSchema.parse({
                  botId,
                  platform: 'instagram',
                  messageId: messaging.message.mid,
                  senderId: messaging.sender.id,
                  messageText: messaging.message.text || '',
                  responseTime: Date.now(),
                });
                
                await storage.createMessageLog(messageLog);
              }
            }
          }
        }
      }
      
      res.status(200).json({ status: 'success' });
    } catch (error) {
      console.error("Error processing Instagram webhook:", error);
      res.status(500).json({ message: "Webhook processing failed" });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
