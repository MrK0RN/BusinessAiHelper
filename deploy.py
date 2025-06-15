#!/usr/bin/env python3
"""
AI Assistant Platform - Production Deployment Script
Веб-платформа AI-ассистента для бизнеса с интеграцией мессенджеров
"""

from fastapi import FastAPI, Depends, HTTPException, File, UploadFile
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from sqlalchemy import create_engine, Column, String, Integer, Boolean, DateTime, Text, ForeignKey
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker, Session, relationship
from sqlalchemy.sql import func
from pydantic import BaseModel
from datetime import datetime, timedelta
from typing import Optional, List
import jwt
import bcrypt
import os
import uuid
from pathlib import Path

# Production Configuration
app = FastAPI(
    title="AI Assistant Platform",
    description="Многофункциональная AI-ассистент платформа с интегрированными коммуникационными каналами",
    version="1.0.0",
    docs_url="/docs" if os.getenv("NODE_ENV") != "production" else None,
    redoc_url=None
)

# CORS Configuration
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Database Configuration
DATABASE_URL = os.getenv("DATABASE_URL")
if not DATABASE_URL:
    raise ValueError("DATABASE_URL environment variable is required")

engine = create_engine(DATABASE_URL)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = declarative_base()

# Security Configuration
security = HTTPBearer()
SECRET_KEY = os.getenv("SESSION_SECRET", "your-secret-key-change-this")
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 30

# Database Models
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

# Pydantic Models
class UserCreate(BaseModel):
    id: str
    email: Optional[str] = None
    first_name: Optional[str] = None
    last_name: Optional[str] = None
    profile_image_url: Optional[str] = None

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

class StatsResponse(BaseModel):
    total_messages: int
    active_bots: int
    avg_response_time: int

class UserRegister(BaseModel):
    firstName: str
    lastName: str
    email: str
    password: str

class UserLogin(BaseModel):
    email: str
    password: str

class UserResponse(BaseModel):
    id: str
    email: Optional[str]
    first_name: Optional[str]
    last_name: Optional[str]
    profile_image_url: Optional[str]
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True

class Token(BaseModel):
    access_token: str
    token_type: str
    user: UserResponse

# Database Session
def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

# Authentication Functions
def hash_password(password: str) -> str:
    return bcrypt.hashpw(password.encode('utf-8'), bcrypt.gensalt()).decode('utf-8')

def verify_password(password: str, hashed_password: str) -> bool:
    return bcrypt.checkpw(password.encode('utf-8'), hashed_password.encode('utf-8'))

def create_access_token(data: dict, expires_delta: Optional[timedelta] = None):
    to_encode = data.copy()
    if expires_delta:
        expire = datetime.utcnow() + expires_delta
    else:
        expire = datetime.utcnow() + timedelta(minutes=15)
    to_encode.update({"exp": expire})
    encoded_jwt = jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)
    return encoded_jwt

def verify_token(token: str):
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        user_id: str = payload.get("sub")
        if user_id is None:
            return None
        return user_id
    except jwt.PyJWTError:
        return None

def get_current_user(credentials: HTTPAuthorizationCredentials = Depends(security), db: Session = Depends(get_db)):
    token = credentials.credentials
    user_id = verify_token(token)
    if user_id is None:
        raise HTTPException(status_code=401, detail="Invalid authentication credentials")
    
    user = db.query(User).filter(User.id == user_id).first()
    if user is None:
        raise HTTPException(status_code=401, detail="User not found")
    
    return user_id

# Authentication Routes
@app.post("/auth/register", response_model=Token)
async def register(user_data: UserRegister, db: Session = Depends(get_db)):
    existing_user = db.query(User).filter(User.email == user_data.email).first()
    if existing_user:
        raise HTTPException(status_code=400, detail="Email already registered")
    
    user_id = str(uuid.uuid4())
    user = User(
        id=user_id,
        email=user_data.email,
        first_name=user_data.firstName,
        last_name=user_data.lastName
    )
    db.add(user)
    db.commit()
    db.refresh(user)
    
    access_token_expires = timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    access_token = create_access_token(
        data={"sub": user.id}, expires_delta=access_token_expires
    )
    
    return Token(
        access_token=access_token,
        token_type="bearer",
        user=UserResponse.from_orm(user)
    )

@app.post("/auth/login", response_model=Token)
async def login(login_data: UserLogin, db: Session = Depends(get_db)):
    user = db.query(User).filter(User.email == login_data.email).first()
    if not user:
        raise HTTPException(status_code=401, detail="Invalid email or password")
    
    access_token_expires = timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    access_token = create_access_token(
        data={"sub": user.id}, expires_delta=access_token_expires
    )
    
    return Token(
        access_token=access_token,
        token_type="bearer",
        user=UserResponse.from_orm(user)
    )

# API Routes
@app.get("/user", response_model=UserResponse)
async def get_user(current_user: str = Depends(get_current_user), db: Session = Depends(get_db)):
    user = db.query(User).filter(User.id == current_user).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    return user

@app.get("/bots", response_model=List[BotResponse])
async def get_bots(current_user: str = Depends(get_current_user), db: Session = Depends(get_db)):
    bots = db.query(Bot).filter(Bot.user_id == current_user).all()
    return bots

@app.post("/bots", response_model=BotResponse)
async def create_bot(bot_data: BotCreate, current_user: str = Depends(get_current_user), db: Session = Depends(get_db)):
    bot = Bot(**bot_data.dict(), user_id=current_user)
    db.add(bot)
    db.commit()
    db.refresh(bot)
    return bot

@app.put("/bots/{bot_id}", response_model=BotResponse)
async def update_bot(bot_id: int, bot_data: dict, current_user: str = Depends(get_current_user), db: Session = Depends(get_db)):
    bot = db.query(Bot).filter(Bot.id == bot_id, Bot.user_id == current_user).first()
    if not bot:
        raise HTTPException(status_code=404, detail="Bot not found")
    
    for key, value in bot_data.items():
        setattr(bot, key, value)
    
    db.commit()
    db.refresh(bot)
    return bot

@app.delete("/bots/{bot_id}")
async def delete_bot(bot_id: int, current_user: str = Depends(get_current_user), db: Session = Depends(get_db)):
    bot = db.query(Bot).filter(Bot.id == bot_id, Bot.user_id == current_user).first()
    if not bot:
        raise HTTPException(status_code=404, detail="Bot not found")
    
    db.delete(bot)
    db.commit()
    return {"success": True}

@app.get("/knowledge-files")
async def get_knowledge_files(current_user: str = Depends(get_current_user), db: Session = Depends(get_db)):
    files = db.query(KnowledgeFile).filter(KnowledgeFile.user_id == current_user).all()
    return files

@app.post("/knowledge-files")
async def upload_knowledge_file(
    file: UploadFile = File(...),
    current_user: str = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    upload_dir = Path("uploads")
    upload_dir.mkdir(exist_ok=True)
    
    file_extension = Path(file.filename or "").suffix
    unique_filename = f"{uuid.uuid4()}{file_extension}"
    file_path = upload_dir / unique_filename
    
    content = await file.read()
    with open(file_path, "wb") as f:
        f.write(content)
    
    knowledge_file = KnowledgeFile(
        user_id=current_user,
        file_name=unique_filename,
        original_name=file.filename or "unknown",
        file_path=str(file_path),
        file_size=len(content),
        mime_type=file.content_type or "application/octet-stream"
    )
    db.add(knowledge_file)
    db.commit()
    db.refresh(knowledge_file)
    
    return knowledge_file

@app.delete("/knowledge-files/{file_id}")
async def delete_knowledge_file(file_id: int, current_user: str = Depends(get_current_user), db: Session = Depends(get_db)):
    file_record = db.query(KnowledgeFile).filter(
        KnowledgeFile.id == file_id, 
        KnowledgeFile.user_id == current_user
    ).first()
    
    if not file_record:
        raise HTTPException(status_code=404, detail="File not found")
    
    file_path_str = str(file_record.file_path)
    if os.path.exists(file_path_str):
        os.remove(file_path_str)
    
    db.delete(file_record)
    db.commit()
    return {"success": True}

@app.get("/stats", response_model=StatsResponse)
async def get_stats(current_user: str = Depends(get_current_user), db: Session = Depends(get_db)):
    user_bots = db.query(Bot).filter(Bot.user_id == current_user).all()
    bot_ids = [bot.id for bot in user_bots]
    
    total_messages = db.query(MessageLog).filter(MessageLog.bot_id.in_(bot_ids)).count() if bot_ids else 0
    active_bots = db.query(Bot).filter(Bot.user_id == current_user, Bot.is_active == True).count()
    
    avg_response_time = db.query(func.avg(MessageLog.response_time)).filter(
        MessageLog.bot_id.in_(bot_ids)
    ).scalar() or 0
    
    return StatsResponse(
        total_messages=total_messages,
        active_bots=active_bots,
        avg_response_time=int(avg_response_time)
    )

@app.get("/recent-activity")
async def get_recent_activity(current_user: str = Depends(get_current_user), db: Session = Depends(get_db)):
    user_bots = db.query(Bot).filter(Bot.user_id == current_user).all()
    bot_ids = [bot.id for bot in user_bots]
    
    recent_messages = db.query(MessageLog).filter(
        MessageLog.bot_id.in_(bot_ids)
    ).order_by(MessageLog.created_at.desc()).limit(10).all() if bot_ids else []
    
    return recent_messages

# Webhook endpoints
@app.post("/webhooks/telegram/{bot_id}")
async def telegram_webhook(bot_id: int, update: dict, db: Session = Depends(get_db)):
    return {"status": "success"}

@app.post("/webhooks/whatsapp/{bot_id}")
async def whatsapp_webhook(bot_id: int, update: dict, db: Session = Depends(get_db)):
    return {"status": "success"}

@app.post("/webhooks/instagram/{bot_id}")
async def instagram_webhook(bot_id: int, update: dict, db: Session = Depends(get_db)):
    return {"status": "success"}

# Serve static files in production
if os.getenv("NODE_ENV") == "production":
    app.mount("/", StaticFiles(directory="dist", html=True), name="static")

# Create tables
Base.metadata.create_all(bind=engine)

# Production server runner
if __name__ == "__main__":
    import uvicorn
    port = int(os.getenv("PORT", 8000))
    uvicorn.run(
        "deploy:app",
        host="0.0.0.0",
        port=port,
        workers=4 if os.getenv("NODE_ENV") == "production" else 1,
        reload=os.getenv("NODE_ENV") != "production"
    )