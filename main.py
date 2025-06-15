from fastapi import FastAPI, HTTPException, Depends, UploadFile, File
from fastapi.middleware.cors import CORSMiddleware
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from sqlalchemy import create_engine, Column, Integer, String, Boolean, DateTime, Text, ForeignKey
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker, Session, relationship
from sqlalchemy.sql import func
from pydantic import BaseModel
from typing import List, Optional
import os
import shutil
from datetime import datetime
import uvicorn

# Database setup
DATABASE_URL = os.getenv("DATABASE_URL")
if not DATABASE_URL:
    raise ValueError("DATABASE_URL environment variable is required")

engine = create_engine(DATABASE_URL)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = declarative_base()

# Models
class User(Base):
    __tablename__ = "users"
    
    id = Column(String, primary_key=True)
    email = Column(String, unique=True)
    first_name = Column(String)
    last_name = Column(String)
    profile_image_url = Column(String)
    created_at = Column(DateTime, default=func.now())
    updated_at = Column(DateTime, default=func.now(), onupdate=func.now())
    
    bots = relationship("Bot", back_populates="user")
    knowledge_files = relationship("KnowledgeFile", back_populates="user")

class Bot(Base):
    __tablename__ = "bots"
    
    id = Column(Integer, primary_key=True, autoincrement=True)
    user_id = Column(String, ForeignKey("users.id"))
    platform = Column(String, nullable=False)  # telegram, whatsapp, instagram
    name = Column(String, nullable=False)
    token = Column(String)
    webhook_url = Column(String)
    is_active = Column(Boolean, default=False)
    config = Column(Text)  # JSON config
    created_at = Column(DateTime, default=func.now())
    updated_at = Column(DateTime, default=func.now(), onupdate=func.now())
    
    user = relationship("User", back_populates="bots")
    message_logs = relationship("MessageLog", back_populates="bot")

class KnowledgeFile(Base):
    __tablename__ = "knowledge_files"
    
    id = Column(Integer, primary_key=True, autoincrement=True)
    user_id = Column(String, ForeignKey("users.id"))
    file_name = Column(String, nullable=False)
    original_name = Column(String, nullable=False)
    file_path = Column(String, nullable=False)
    file_size = Column(Integer, nullable=False)
    mime_type = Column(String, nullable=False)
    is_processed = Column(Boolean, default=False)
    created_at = Column(DateTime, default=func.now())
    
    user = relationship("User", back_populates="knowledge_files")

class MessageLog(Base):
    __tablename__ = "message_logs"
    
    id = Column(Integer, primary_key=True, autoincrement=True)
    bot_id = Column(Integer, ForeignKey("bots.id"))
    platform = Column(String, nullable=False)
    message_id = Column(String)
    sender_id = Column(String)
    message_text = Column(Text)
    response_text = Column(Text)
    response_time = Column(Integer)  # in milliseconds
    is_auto_response = Column(Boolean, default=True)
    created_at = Column(DateTime, default=func.now())
    
    bot = relationship("Bot", back_populates="message_logs")

# Create tables
Base.metadata.create_all(bind=engine)

# Pydantic models
class UserCreate(BaseModel):
    id: str
    email: Optional[str] = None
    first_name: Optional[str] = None
    last_name: Optional[str] = None
    profile_image_url: Optional[str] = None

class UserResponse(BaseModel):
    id: str
    email: Optional[str]
    first_name: Optional[str]
    last_name: Optional[str]
    profile_image_url: Optional[str]
    created_at: datetime
    updated_at: datetime

class BotCreate(BaseModel):
    platform: str
    name: str
    token: Optional[str] = None
    webhook_url: Optional[str] = None
    is_active: bool = False
    config: Optional[str] = None

class BotResponse(BaseModel):
    id: int
    user_id: str
    platform: str
    name: str
    token: Optional[str]
    webhook_url: Optional[str]
    is_active: bool
    config: Optional[str]
    created_at: datetime
    updated_at: datetime

class MessageLogCreate(BaseModel):
    bot_id: int
    platform: str
    message_id: Optional[str] = None
    sender_id: Optional[str] = None
    message_text: Optional[str] = None
    response_text: Optional[str] = None
    response_time: Optional[int] = None
    is_auto_response: bool = True

class StatsResponse(BaseModel):
    total_messages: int
    active_bots: int
    avg_response_time: int

# FastAPI app
app = FastAPI(title="AI Assistant API", version="1.0.0")

# CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Security
security = HTTPBearer()

# Dependency to get DB session
def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

# Simple auth for development
def get_current_user():
    # For development, return a mock user
    return "test_user_123"

# Routes
@app.get("/api/auth/user", response_model=UserResponse)
async def get_user(current_user: str = Depends(get_current_user), db: Session = Depends(get_db)):
    user = db.query(User).filter(User.id == current_user).first()
    if not user:
        # Create a default user for development
        user = User(
            id=current_user,
            email="test@example.com",
            first_name="Test",
            last_name="User",
            profile_image_url=None
        )
        db.add(user)
        db.commit()
        db.refresh(user)
    return user

@app.get("/api/bots", response_model=List[BotResponse])
async def get_bots(current_user: str = Depends(get_current_user), db: Session = Depends(get_db)):
    bots = db.query(Bot).filter(Bot.user_id == current_user).all()
    return bots

@app.post("/api/bots", response_model=BotResponse)
async def create_bot(bot_data: BotCreate, current_user: str = Depends(get_current_user), db: Session = Depends(get_db)):
    bot = Bot(user_id=current_user, **bot_data.dict())
    db.add(bot)
    db.commit()
    db.refresh(bot)
    return bot

@app.patch("/api/bots/{bot_id}", response_model=BotResponse)
async def update_bot(bot_id: int, bot_data: dict, current_user: str = Depends(get_current_user), db: Session = Depends(get_db)):
    bot = db.query(Bot).filter(Bot.id == bot_id, Bot.user_id == current_user).first()
    if not bot:
        raise HTTPException(status_code=404, detail="Bot not found")
    
    for key, value in bot_data.items():
        if hasattr(bot, key):
            setattr(bot, key, value)
    
    db.commit()
    db.refresh(bot)
    return bot

@app.delete("/api/bots/{bot_id}")
async def delete_bot(bot_id: int, current_user: str = Depends(get_current_user), db: Session = Depends(get_db)):
    bot = db.query(Bot).filter(Bot.id == bot_id, Bot.user_id == current_user).first()
    if not bot:
        raise HTTPException(status_code=404, detail="Bot not found")
    
    db.delete(bot)
    db.commit()
    return {"message": "Bot deleted"}

@app.get("/api/knowledge-files")
async def get_knowledge_files(current_user: str = Depends(get_current_user), db: Session = Depends(get_db)):
    files = db.query(KnowledgeFile).filter(KnowledgeFile.user_id == current_user).all()
    return files

@app.post("/api/knowledge-files")
async def upload_knowledge_file(
    file: UploadFile = File(...),
    current_user: str = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    # Create uploads directory if it doesn't exist
    os.makedirs("uploads", exist_ok=True)
    
    # Save file
    file_path = f"uploads/{file.filename}"
    with open(file_path, "wb") as buffer:
        shutil.copyfileobj(file.file, buffer)
    
    # Create database record
    knowledge_file = KnowledgeFile(
        user_id=current_user,
        file_name=file.filename,
        original_name=file.filename,
        file_path=file_path,
        file_size=os.path.getsize(file_path),
        mime_type=file.content_type or "application/octet-stream"
    )
    db.add(knowledge_file)
    db.commit()
    db.refresh(knowledge_file)
    
    return knowledge_file

@app.delete("/api/knowledge-files/{file_id}")
async def delete_knowledge_file(file_id: int, current_user: str = Depends(get_current_user), db: Session = Depends(get_db)):
    file_record = db.query(KnowledgeFile).filter(KnowledgeFile.id == file_id, KnowledgeFile.user_id == current_user).first()
    if not file_record:
        raise HTTPException(status_code=404, detail="File not found")
    
    # Delete physical file
    if os.path.exists(file_record.file_path):
        os.remove(file_record.file_path)
    
    # Delete database record
    db.delete(file_record)
    db.commit()
    return {"message": "File deleted"}

@app.get("/api/stats", response_model=StatsResponse)
async def get_stats(current_user: str = Depends(get_current_user), db: Session = Depends(get_db)):
    # Get user's bots
    user_bots = db.query(Bot).filter(Bot.user_id == current_user).all()
    bot_ids = [bot.id for bot in user_bots]
    
    # Count total messages
    total_messages = 0
    avg_response_time = 0
    
    if bot_ids:
        message_logs = db.query(MessageLog).filter(MessageLog.bot_id.in_(bot_ids)).all()
        total_messages = len(message_logs)
        
        response_times = [log.response_time for log in message_logs if log.response_time]
        if response_times:
            avg_response_time = sum(response_times) // len(response_times)
    
    # Count active bots
    active_bots = len([bot for bot in user_bots if bot.is_active])
    
    return StatsResponse(
        total_messages=total_messages,
        active_bots=active_bots,
        avg_response_time=avg_response_time
    )

@app.get("/api/recent-activity")
async def get_recent_activity(current_user: str = Depends(get_current_user), db: Session = Depends(get_db)):
    # Get user's bots
    user_bots = db.query(Bot).filter(Bot.user_id == current_user).all()
    bot_ids = [bot.id for bot in user_bots]
    
    if not bot_ids:
        return []
    
    # Get recent messages
    recent_messages = (
        db.query(MessageLog)
        .filter(MessageLog.bot_id.in_(bot_ids))
        .order_by(MessageLog.created_at.desc())
        .limit(20)
        .all()
    )
    
    return recent_messages

# Webhook endpoints for different platforms
@app.post("/api/webhook/telegram/{bot_id}")
async def telegram_webhook(bot_id: int, update: dict, db: Session = Depends(get_db)):
    if "message" in update:
        message_log = MessageLog(
            bot_id=bot_id,
            platform="telegram",
            message_id=str(update["message"]["message_id"]),
            sender_id=str(update["message"]["from"]["id"]),
            message_text=update["message"].get("text", ""),
            response_time=1000  # Mock response time
        )
        db.add(message_log)
        db.commit()
    
    return {"ok": True}

@app.post("/api/webhook/whatsapp/{bot_id}")
async def whatsapp_webhook(bot_id: int, update: dict, db: Session = Depends(get_db)):
    if "messages" in update:
        for message in update["messages"]:
            message_log = MessageLog(
                bot_id=bot_id,
                platform="whatsapp",
                message_id=message["id"],
                sender_id=message["from"],
                message_text=message.get("text", {}).get("body", ""),
                response_time=1200  # Mock response time
            )
            db.add(message_log)
            db.commit()
    
    return {"status": "success"}

@app.post("/api/webhook/instagram/{bot_id}")
async def instagram_webhook(bot_id: int, update: dict, db: Session = Depends(get_db)):
    if "entry" in update:
        for entry in update["entry"]:
            if "messaging" in entry:
                for messaging in entry["messaging"]:
                    if "message" in messaging:
                        message_log = MessageLog(
                            bot_id=bot_id,
                            platform="instagram",
                            message_id=messaging["message"]["mid"],
                            sender_id=messaging["sender"]["id"],
                            message_text=messaging["message"].get("text", ""),
                            response_time=800  # Mock response time
                        )
                        db.add(message_log)
                        db.commit()
    
    return {"status": "success"}

if __name__ == "__main__":
    uvicorn.run(app, host="0.0.0.0", port=8000)