#!/bin/bash

# AI Assistant Platform - Production Deployment Script
echo "🚀 Deploying AI Assistant Platform..."

# Check if required tools are installed
command -v npm >/dev/null 2>&1 || { echo "❌ npm is required but not installed. Aborting." >&2; exit 1; }
command -v python3 >/dev/null 2>&1 || { echo "❌ Python 3 is required but not installed. Aborting." >&2; exit 1; }

# Set production environment
export NODE_ENV=production

# Build frontend
echo "📦 Building React frontend..."
npm install
npm run build

# Install Python dependencies
echo "🐍 Installing Python dependencies..."
pip install -r python-requirements.txt 2>/dev/null || pip install fastapi uvicorn sqlalchemy psycopg2-binary pydantic python-jose bcrypt python-multipart

# Create uploads directory
mkdir -p uploads

# Check if .env file exists
if [ ! -f .env ]; then
    echo "⚠️  Warning: .env file not found. Copying from .env.example..."
    cp .env.example .env
    echo "📝 Please edit .env file with your configuration before running the application."
fi

# Set default port if not specified
export PORT=${PORT:-8000}

echo "✅ Build complete!"
echo "🌟 To start the application:"
echo "   python deploy.py"
echo ""
echo "🐳 Or use Docker:"
echo "   docker-compose up -d"
echo ""
echo "📍 Application will be available at: http://localhost:${PORT}"