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

  const httpServer = createServer(app);
  return httpServer;
}