# Production Dockerfile для AI Assistant Platform
FROM node:18-alpine AS frontend-builder

# Сборка React frontend
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production

COPY client/ ./client/
COPY shared/ ./shared/
COPY vite.config.ts tsconfig.json tailwind.config.ts postcss.config.js components.json ./
RUN npm run build

# Python backend
FROM python:3.11-slim AS backend

# Установка системных зависимостей
RUN apt-get update && apt-get install -y \
    gcc \
    g++ \
    curl \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app

# Установка Python зависимостей
COPY pyproject.toml ./
RUN pip install --no-cache-dir -e .

# Копирование файлов приложения
COPY production.py ./

# Копирование собранного frontend
COPY --from=frontend-builder /app/dist ./dist

# Создание директории для загрузок
RUN mkdir -p uploads

# Порт для FastAPI
EXPOSE 8000

# Переменные окружения для production
ENV NODE_ENV=production
ENV PYTHONUNBUFFERED=1

# Запуск приложения
CMD ["python", "production.py"]