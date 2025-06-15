import express, { type Express } from "express";
import { createServer, type Server } from "http";
import multer from "multer";
import path from "path";
import fs from "fs";
import { storage } from "./storage";
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
  // Setup Replit Auth
  const { setupAuth, isAuthenticated } = await import("./replitAuth");
  await setupAuth(app);

  // Auth routes for React frontend
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
      res.json(bot);
    } catch (error) {
      console.error("Error creating bot:", error);
      res.status(500).json({ message: "Failed to create bot" });
    }
  });

  app.put('/api/bots/:id', isAuthenticated, async (req: any, res) => {
    try {
      const botId = parseInt(req.params.id);
      const updates = req.body;
      const bot = await storage.updateBot(botId, updates);
      res.json(bot);
    } catch (error) {
      console.error("Error updating bot:", error);
      res.status(500).json({ message: "Failed to update bot" });
    }
  });

  app.delete('/api/bots/:id', isAuthenticated, async (req: any, res) => {
    try {
      const botId = parseInt(req.params.id);
      await storage.deleteBot(botId);
      res.json({ success: true });
    } catch (error) {
      console.error("Error deleting bot:", error);
      res.status(500).json({ message: "Failed to delete bot" });
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
      const userId = req.user.claims.sub;
      const file = req.file;
      
      if (!file) {
        return res.status(400).json({ message: "No file uploaded" });
      }

      const fileData = insertKnowledgeFileSchema.parse({
        userId,
        fileName: file.filename,
        originalName: file.originalname,
        filePath: file.path,
        fileSize: file.size,
        mimeType: file.mimetype,
      });
      
      const knowledgeFile = await storage.createKnowledgeFile(fileData);
      res.json(knowledgeFile);
    } catch (error) {
      console.error("Error uploading knowledge file:", error);
      res.status(500).json({ message: "Failed to upload knowledge file" });
    }
  });

  app.delete('/api/knowledge-files/:id', isAuthenticated, async (req: any, res) => {
    try {
      const fileId = parseInt(req.params.id);
      await storage.deleteKnowledgeFile(fileId);
      res.json({ success: true });
    } catch (error) {
      console.error("Error deleting knowledge file:", error);
      res.status(500).json({ message: "Failed to delete knowledge file" });
    }
  });

  // Statistics routes
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

  // Recent activity routes
  app.get('/api/recent-activity', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const bots = await storage.getUserBots(userId);
      const recentActivity = [];
      
      for (const bot of bots) {
        const logs = await storage.getBotMessageLogs(bot.id, 10);
        recentActivity.push(...logs);
      }
      
      // Sort by creation date and limit to 20
      recentActivity.sort((a, b) => new Date(b.createdAt!).getTime() - new Date(a.createdAt!).getTime());
      res.json(recentActivity.slice(0, 20));
    } catch (error) {
      console.error("Error fetching recent activity:", error);
      res.status(500).json({ message: "Failed to fetch recent activity" });
    }
  });

  // Webhook routes for bot integrations
  app.post('/api/webhooks/telegram/:botId', async (req, res) => {
    try {
      const botId = parseInt(req.params.botId);
      const update = req.body;
      
      // Log the message
      const logData = insertMessageLogSchema.parse({
        botId,
        platform: 'telegram',
        messageId: update.message?.message_id?.toString(),
        senderId: update.message?.from?.id?.toString(),
        messageText: update.message?.text,
        responseText: 'Auto-response placeholder',
        responseTime: 100,
      });
      
      await storage.createMessageLog(logData);
      res.json({ success: true });
    } catch (error) {
      console.error("Error processing Telegram webhook:", error);
      res.status(500).json({ message: "Failed to process webhook" });
    }
  });

  app.post('/api/webhooks/whatsapp/:botId', async (req, res) => {
    try {
      const botId = parseInt(req.params.botId);
      const update = req.body;
      
      const logData = insertMessageLogSchema.parse({
        botId,
        platform: 'whatsapp',
        messageId: update.id,
        senderId: update.from,
        messageText: update.text?.body,
        responseText: 'Auto-response placeholder',
        responseTime: 150,
      });
      
      await storage.createMessageLog(logData);
      res.json({ success: true });
    } catch (error) {
      console.error("Error processing WhatsApp webhook:", error);
      res.status(500).json({ message: "Failed to process webhook" });
    }
  });

  app.post('/api/webhooks/instagram/:botId', async (req, res) => {
    try {
      const botId = parseInt(req.params.botId);
      const update = req.body;
      
      const logData = insertMessageLogSchema.parse({
        botId,
        platform: 'instagram',
        messageId: update.id,
        senderId: update.sender?.id,
        messageText: update.message?.text,
        responseText: 'Auto-response placeholder',
        responseTime: 200,
      });
      
      await storage.createMessageLog(logData);
      res.json({ success: true });
    } catch (error) {
      console.error("Error processing Instagram webhook:", error);
      res.status(500).json({ message: "Failed to process webhook" });
    }
  });
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(req.body)
      });
      
      const data = await response.json();
      
      if (!response.ok) {
        return res.status(response.status).json(data);
      }
      
      res.json(data);
    } catch (error) {
      console.error("Registration error:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  app.post('/api/auth/login', async (req, res) => {
    try {
      const response = await fetch('http://localhost:8000/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(req.body)
      });
      
      const data = await response.json();
      
      if (!response.ok) {
        return res.status(response.status).json(data);
      }
      
      res.json(data);
    } catch (error) {
      console.error("Login error:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  app.get('/api/auth/user', async (req, res) => {
    try {
      const authHeader = req.headers.authorization;
      if (!authHeader) {
        return res.status(401).json({ message: "No authorization header" });
      }

      const response = await fetch('http://localhost:8000/api/auth/user', {
        headers: {
          'Authorization': authHeader
        }
      });
      
      const data = await response.json();
      
      if (!response.ok) {
        return res.status(response.status).json(data);
      }
      
      res.json(data);
    } catch (error) {
      console.error("Error fetching user:", error);
      res.status(500).json({ message: "Failed to fetch user" });
    }
  });

  // Webhook handlers for different platforms (these remain on Express)
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
          responseTime: Date.now(),
        });
        
        await storage.createMessageLog(messageLog);
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

  // Catch all route for SPA - serve index.html for unknown routes
  app.get('*', (req, res) => {
    res.sendFile(path.join(process.cwd(), 'public', 'index.html'));
  });

  const httpServer = createServer(app);
  return httpServer;
}
