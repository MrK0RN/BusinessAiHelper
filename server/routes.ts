import type { Express } from "express";
import { createServer, type Server } from "http";
import { createProxyMiddleware } from "http-proxy-middleware";
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
  // Mock user endpoint for development
  app.get('/api/user', (req, res) => {
    res.json({
      id: "test_user_123",
      email: "test@example.com",
      first_name: "Test",
      last_name: "User",
      profile_image_url: null,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    });
  });

  // Proxy specific API routes to FastAPI backend
  app.use('/api/bots', createProxyMiddleware({
    target: 'http://localhost:8000',
    changeOrigin: true
  }));

  app.use('/api/stats', createProxyMiddleware({
    target: 'http://localhost:8000',
    changeOrigin: true
  }));

  app.use('/api/knowledge-files', createProxyMiddleware({
    target: 'http://localhost:8000',
    changeOrigin: true
  }));

  app.use('/api/recent-activity', createProxyMiddleware({
    target: 'http://localhost:8000',
    changeOrigin: true
  }));

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

  const httpServer = createServer(app);
  return httpServer;
}
