import { spawn } from 'child_process';
import { createProxyMiddleware } from 'http-proxy-middleware';
import type { Express } from 'express';

let fastapiProcess: any = null;

export function startFastAPI() {
  if (fastapiProcess) {
    return;
  }

  console.log('Starting FastAPI backend...');
  fastapiProcess = spawn('python', ['-m', 'uvicorn', 'main:app', '--host', '0.0.0.0', '--port', '8000'], {
    stdio: ['ignore', 'pipe', 'pipe'],
    detached: false
  });

  fastapiProcess.stdout?.on('data', (data: Buffer) => {
    console.log(`[FastAPI] ${data.toString()}`);
  });

  fastapiProcess.stderr?.on('data', (data: Buffer) => {
    console.error(`[FastAPI Error] ${data.toString()}`);
  });

  fastapiProcess.on('close', (code: number) => {
    console.log(`FastAPI process exited with code ${code}`);
    fastapiProcess = null;
  });

  // Give FastAPI time to start
  return new Promise(resolve => setTimeout(resolve, 3000));
}

export function setupFastAPIProxy(app: Express) {
  // Mock user endpoint
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

  // Proxy other API routes to FastAPI
  const apiProxy = createProxyMiddleware({
    target: 'http://localhost:8000',
    changeOrigin: true,
    timeout: 10000,
    proxyTimeout: 10000
  });

  app.use('/api/bots', apiProxy);
  app.use('/api/stats', apiProxy);
  app.use('/api/knowledge-files', apiProxy);
  app.use('/api/recent-activity', apiProxy);
}

export function stopFastAPI() {
  if (fastapiProcess) {
    fastapiProcess.kill();
    fastapiProcess = null;
  }
}