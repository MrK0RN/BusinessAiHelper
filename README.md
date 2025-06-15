# AI Assistant Platform

Многофункциональная AI-ассистент платформа с интегрированными коммуникационными каналами для мультиплатформенного взаимодействия.

## Возможности

- 🤖 **Управление ботами** - Создание и настройка ботов для различных платформ (Telegram, WhatsApp, Instagram)
- 📊 **Аналитика** - Статистика сообщений, время отклика, активность ботов
- 📁 **База знаний** - Загрузка и управление файлами для обучения AI
- 🔐 **Аутентификация** - Безопасная система входа с JWT токенами
- 🎨 **Современный UI** - React интерфейс с Tailwind CSS
- 🚀 **REST API** - Полнофункциональный FastAPI backend

## Технологический стек

### Frontend
- React 18 + TypeScript
- Vite (сборщик)
- Tailwind CSS (стили)
- shadcn/ui (UI компоненты)
- TanStack Query (состояние сервера)
- Wouter (роутинг)

### Backend
- Python 3.11
- FastAPI (API framework)
- SQLAlchemy (ORM)
- PostgreSQL (база данных)
- JWT (аутентификация)
- bcrypt (хеширование паролей)

## Быстрый старт

### 1. Клонирование репозитория
```bash
git clone <repository-url>
cd ai-assistant-platform
```

### 2. Настройка переменных окружения
```bash
cp .env.example .env
# Отредактируйте .env файл с вашими настройками
```

### 3. Запуск с Docker Compose (рекомендуется)
```bash
# Запуск всего стека (база данных + приложение)
docker-compose up -d

# Приложение будет доступно по адресу: http://localhost:8000
```

### 4. Ручная установка

#### Требования
- Node.js 18+
- Python 3.11+
- PostgreSQL 12+

#### Frontend
```bash
npm install
npm run build
```

#### Backend
```bash
pip install -e .
python deploy.py
```

## Развёртывание в продакшене

### Docker (рекомендуется)
```bash
# 1. Настройте переменные окружения
cp .env.example .env
nano .env

# 2. Запустите приложение
docker-compose up -d

# 3. Проверьте логи
docker-compose logs -f app
```

### VPS/Сервер
```bash
# 1. Сборка приложения
npm run build

# 2. Установка зависимостей Python
pip install -e .

# 3. Настройка базы данных
export DATABASE_URL="postgresql://user:password@host:port/database"

# 4. Запуск приложения
python deploy.py
```

### Replit Deployment
Приложение готово для развёртывания на Replit:
1. Переменные окружения настроены автоматически
2. База данных PostgreSQL подключается через DATABASE_URL
3. Используйте команду `npm run dev` для разработки
4. Для продакшена используйте `python deploy.py`

## API Документация

### Аутентификация
- `POST /auth/register` - Регистрация пользователя
- `POST /auth/login` - Вход в систему
- `GET /user` - Получение информации о пользователе

### Управление ботами
- `GET /bots` - Список ботов пользователя
- `POST /bots` - Создание нового бота
- `PUT /bots/{bot_id}` - Обновление бота
- `DELETE /bots/{bot_id}` - Удаление бота

### База знаний
- `GET /knowledge-files` - Список файлов
- `POST /knowledge-files` - Загрузка файла
- `DELETE /knowledge-files/{file_id}` - Удаление файла

### Аналитика
- `GET /stats` - Статистика пользователя
- `GET /recent-activity` - Последняя активность

### Webhooks
- `POST /webhooks/telegram/{bot_id}` - Telegram webhook
- `POST /webhooks/whatsapp/{bot_id}` - WhatsApp webhook
- `POST /webhooks/instagram/{bot_id}` - Instagram webhook

## Структура проекта

```
ai-assistant-platform/
├── client/                 # React frontend
│   ├── src/
│   │   ├── components/     # UI компоненты
│   │   ├── pages/         # Страницы приложения
│   │   ├── hooks/         # React хуки
│   │   └── lib/           # Утилиты
├── server/                # Express сервер (для разработки)
├── shared/                # Общие типы и схемы
├── deploy.py             # Production backend
├── main.py               # Development backend
├── Dockerfile            # Docker конфигурация
├── docker-compose.yml    # Docker Compose
└── README.md
```

## Переменные окружения

| Переменная | Описание | По умолчанию |
|------------|----------|--------------|
| `DATABASE_URL` | URL подключения к PostgreSQL | - |
| `SESSION_SECRET` | Секретный ключ для JWT | - |
| `NODE_ENV` | Режим приложения | development |
| `PORT` | Порт приложения | 8000 |

## Безопасность

- JWT токены для аутентификации
- bcrypt для хеширования паролей
- CORS настройки
- Валидация данных с Pydantic
- Защита от SQL инъекций через SQLAlchemy ORM

## Мониторинг

В продакшене доступны следующие эндпоинты:
- `/docs` - API документация (только в development)
- `/health` - Проверка состояния приложения

## Поддержка

Для вопросов и поддержки создайте issue в репозитории проекта.

## Лицензия

MIT License