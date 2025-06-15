# Руководство по развертыванию AI Assistant Platform

## Готовые файлы для деплоя

Проект полностью готов к развертыванию. Все необходимые файлы созданы:

### Основные файлы
- `deploy.py` - Production-ready FastAPI приложение
- `Dockerfile` - Конфигурация Docker контейнера
- `docker-compose.yml` - Оркестрация с PostgreSQL
- `.env.example` - Шаблон переменных окружения
- `deploy.sh` - Автоматический скрипт деплоя
- `python-requirements.txt` - Python зависимости

### Архитектура
- **Frontend**: React + TypeScript + Tailwind CSS (собран в `/dist`)
- **Backend**: FastAPI + SQLAlchemy + PostgreSQL
- **Аутентификация**: JWT токены с bcrypt хешированием
- **База данных**: PostgreSQL с автоматическим созданием таблиц

## Способы развертывания

### 1. Docker Compose (рекомендуется)
```bash
# Копировать переменные окружения
cp .env.example .env
nano .env  # Настроить DATABASE_PASSWORD и SESSION_SECRET

# Запуск
docker-compose up -d

# Приложение доступно на порту 8000
```

### 2. Ручное развертывание
```bash
# Запуск скрипта автоматической сборки
./deploy.sh

# Настройка переменных окружения
cp .env.example .env
nano .env

# Запуск приложения
python deploy.py
```

### 3. Replit Deployment
Проект готов для развертывания на Replit:
- Переменные окружения настроены автоматически
- PostgreSQL подключается через DATABASE_URL
- Нажмите кнопку Deploy для публикации

## Конфигурация переменных

Обязательные переменные в `.env`:
```env
DATABASE_URL=postgresql://user:password@host:port/database
SESSION_SECRET=your_random_secret_key_here
NODE_ENV=production
PORT=8000
```

## API Endpoints

Приложение предоставляет полный REST API:
- Аутентификация: `/auth/register`, `/auth/login`
- Пользователи: `/user`
- Боты: `/bots` (CRUD операции)
- База знаний: `/knowledge-files`
- Аналитика: `/stats`, `/recent-activity`
- Webhooks: `/webhooks/{platform}/{bot_id}`

## Безопасность

- JWT аутентификация с автоматическим истечением токенов
- bcrypt хеширование паролей
- CORS настройки для production
- Валидация входных данных через Pydantic
- Защита от SQL инъекций через SQLAlchemy ORM

## Мониторинг

В production режиме:
- Автоматическое создание таблиц базы данных
- Логирование всех HTTP запросов
- Статическая раздача frontend файлов
- Отключение интерактивной документации API

## Масштабирование

Приложение готово для горизонтального масштабирования:
- Stateless архитектура
- Внешняя база данных PostgreSQL
- Поддержка нескольких worker процессов
- Контейнеризация с Docker

Проект полностью готов к развертыванию в продакшене!