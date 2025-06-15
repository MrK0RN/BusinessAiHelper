import { spawn, ChildProcess } from 'child_process';
import { createProxyMiddleware } from 'http-proxy-middleware';
import { Express } from 'express';

let fastapiProcess: ChildProcess | null = null;

export function startFastAPI(): Promise<void> {
  return new Promise((resolve, reject) => {
    console.log('Starting FastAPI backend...');
    
    fastapiProcess = spawn('python3', ['run_fastapi.py'], {
      stdio: ['pipe', 'pipe', 'pipe'],
      env: { ...process.env }
    });

    fastapiProcess.stdout?.on('data', (data: Buffer) => {
      const output = data.toString();
      console.log(`[FastAPI] ${output.trim()}`);
      if (output.includes('Uvicorn running on')) {
        resolve();
      }
    });

    fastapiProcess.stderr?.on('data', (data: Buffer) => {
      const error = data.toString();
      console.log(`[FastAPI Error] ${error.trim()}`);
      if (error.includes('Uvicorn running on')) {
        resolve();
      }
    });

    fastapiProcess.on('error', (error) => {
      console.error('FastAPI process error:', error);
      reject(error);
    });

    fastapiProcess.on('close', (code) => {
      console.log(`FastAPI process exited with code ${code}`);
      fastapiProcess = null;
    });

    // Timeout after 10 seconds
    setTimeout(() => {
      if (fastapiProcess && !fastapiProcess.killed) {
        console.log('FastAPI started (timeout reached)');
        resolve();
      }
    }, 10000);
  });
}

export function setupFastAPIProxy(app: Express) {
  // Proxy all API requests to FastAPI backend
  const apiProxy = createProxyMiddleware({
    target: 'http://localhost:8000',
    changeOrigin: true,
    pathRewrite: {
      '^/api/(?!auth|login|logout|callback)': '/', // Rewrite /api/* to /* except auth routes
    },
    onError: (err, req, res) => {
      console.error('FastAPI proxy error:', err.message);
      res.status(500).json({ 
        message: 'Backend service unavailable',
        error: err.message 
      });
    },
    onProxyReq: (proxyReq, req, res) => {
      // Forward authorization header
      if (req.headers.authorization) {
        proxyReq.setHeader('Authorization', req.headers.authorization);
      }
    }
  });

  // Apply proxy to non-auth API routes
  app.use('/api/user', apiProxy);
  app.use('/api/bots', apiProxy);
  app.use('/api/knowledge-files', apiProxy);
  app.use('/api/stats', apiProxy);
  app.use('/api/recent-activity', apiProxy);
  app.use('/api/webhooks', apiProxy);
}

export function stopFastAPI() {
  if (fastapiProcess && !fastapiProcess.killed) {
    console.log('Stopping FastAPI backend...');
    fastapiProcess.kill('SIGTERM');
    fastapiProcess = null;
  }
}