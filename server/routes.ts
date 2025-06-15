import express, { type Express } from "express";
import { createServer, type Server } from "http";
import { startFastAPI, setupFastAPIProxy } from "./fastapi_proxy";

export async function registerRoutes(app: Express): Promise<Server> {
  // Start FastAPI backend
  await startFastAPI();
  
  // Setup FastAPI proxy routes
  setupFastAPIProxy(app);

  // Simple auth proxy routes - forward everything to FastAPI
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

      const response = await fetch('http://localhost:8000/user', {
        headers: {
          'Authorization': authHeader,
        },
      });

      if (!response.ok) {
        return res.status(response.status).json({ message: "Unauthorized" });
      }

      const data = await response.json();
      res.json(data);
    } catch (error) {
      console.error("User fetch error:", error);
      res.status(500).json({ message: "Failed to fetch user" });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}