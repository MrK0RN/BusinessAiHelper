import express, { type Express } from "express";
import { createServer, type Server } from "http";
import { startFastAPI, setupFastAPIProxy } from "./fastapi_proxy";
import multer from "multer";
import path from "path";
import fs from "fs";
import { storage } from "./storage";
import { insertMessageLogSchema } from "@shared/schema";

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
  // Serve static files from public directory
  app.use(express.static('public'));
  
  // Start FastAPI backend
  await startFastAPI();
  
  // Setup FastAPI proxy routes
  setupFastAPIProxy(app);

  // Auth proxy routes
  app.post('/api/auth/register', async (req, res) => {
    try {
      const response = await fetch('http://localhost:8000/auth/register', {
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
