#!/usr/bin/env python3
"""
AI Assistant Platform - Simplified Production Server
Standalone FastAPI application for production deployment
"""

from fastapi import FastAPI, Depends, HTTPException, File, UploadFile
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse, HTMLResponse
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

# Application Configuration
app = FastAPI(
    title="AI Assistant Platform",
    description="Production-ready AI Assistant Platform",
    version="1.0.0",
    docs_url=None,  # Disable docs in production
    redoc_url=None
)

# CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Database setup
DATABASE_URL = os.getenv("DATABASE_URL")
if not DATABASE_URL:
    raise ValueError("DATABASE_URL environment variable is required")

engine = create_engine(DATABASE_URL, pool_pre_ping=True, pool_recycle=300)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = declarative_base()

# Security
security = HTTPBearer()
SECRET_KEY = os.getenv("SESSION_SECRET", "fallback-secret-key")
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 30

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
    platform = Column(String, nullable=False)
    name = Column(String, nullable=False)
    token = Column(String)
    webhook_url = Column(String)
    is_active = Column(Boolean, default=False)
    config = Column(Text)
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
    response_time = Column(Integer)
    is_auto_response = Column(Boolean, default=True)
    created_at = Column(DateTime, default=func.now())
    bot = relationship("Bot", back_populates="message_logs")

# Pydantic models
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

# Dependencies
def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

# Auth functions
def create_access_token(data: dict, expires_delta: Optional[timedelta] = None):
    to_encode = data.copy()
    if expires_delta:
        expire = datetime.utcnow() + expires_delta
    else:
        expire = datetime.utcnow() + timedelta(minutes=15)
    to_encode.update({"exp": expire})
    return jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)

def verify_token(token: str):
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        return payload.get("sub")
    except jwt.PyJWTError:
        return None

def get_current_user(credentials: HTTPAuthorizationCredentials = Depends(security), db: Session = Depends(get_db)):
    user_id = verify_token(credentials.credentials)
    if not user_id:
        raise HTTPException(status_code=401, detail="Invalid token")
    
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=401, detail="User not found")
    return user_id

# Health check
@app.get("/health")
async def health():
    return {"status": "healthy", "version": "1.0.0"}

# Auth routes
@app.post("/auth/register", response_model=Token)
async def register(user_data: UserRegister, db: Session = Depends(get_db)):
    existing = db.query(User).filter(User.email == user_data.email).first()
    if existing:
        raise HTTPException(status_code=400, detail="Email already registered")
    
    user = User(
        id=str(uuid.uuid4()),
        email=user_data.email,
        first_name=user_data.firstName,
        last_name=user_data.lastName
    )
    db.add(user)
    db.commit()
    db.refresh(user)
    
    token = create_access_token({"sub": user.id}, timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES))
    return Token(access_token=token, token_type="bearer", user=UserResponse.from_orm(user))

@app.post("/auth/login", response_model=Token)
async def login(login_data: UserLogin, db: Session = Depends(get_db)):
    user = db.query(User).filter(User.email == login_data.email).first()
    if not user:
        raise HTTPException(status_code=401, detail="Invalid credentials")
    
    token = create_access_token({"sub": user.id}, timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES))
    return Token(access_token=token, token_type="bearer", user=UserResponse.from_orm(user))

# API routes
@app.get("/user", response_model=UserResponse)
async def get_user(current_user: str = Depends(get_current_user), db: Session = Depends(get_db)):
    user = db.query(User).filter(User.id == current_user).first()
    return user

@app.get("/bots", response_model=List[BotResponse])
async def get_bots(current_user: str = Depends(get_current_user), db: Session = Depends(get_db)):
    return db.query(Bot).filter(Bot.user_id == current_user).all()

@app.post("/bots", response_model=BotResponse)
async def create_bot(bot_data: BotCreate, current_user: str = Depends(get_current_user), db: Session = Depends(get_db)):
    bot = Bot(**bot_data.dict(), user_id=current_user)
    db.add(bot)
    db.commit()
    db.refresh(bot)
    return bot

@app.get("/knowledge-files")
async def get_knowledge_files(current_user: str = Depends(get_current_user), db: Session = Depends(get_db)):
    return db.query(KnowledgeFile).filter(KnowledgeFile.user_id == current_user).all()

@app.post("/knowledge-files")
async def upload_file(file: UploadFile = File(...), current_user: str = Depends(get_current_user), db: Session = Depends(get_db)):
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

@app.get("/stats", response_model=StatsResponse)
async def get_stats(current_user: str = Depends(get_current_user), db: Session = Depends(get_db)):
    bots = db.query(Bot).filter(Bot.user_id == current_user).all()
    bot_ids = [bot.id for bot in bots]
    
    total_messages = db.query(MessageLog).filter(MessageLog.bot_id.in_(bot_ids)).count() if bot_ids else 0
    active_bots = db.query(Bot).filter(Bot.user_id == current_user, Bot.is_active == True).count()
    avg_response_time = db.query(func.avg(MessageLog.response_time)).filter(MessageLog.bot_id.in_(bot_ids)).scalar() or 0
    
    return StatsResponse(
        total_messages=total_messages,
        active_bots=active_bots,
        avg_response_time=int(avg_response_time)
    )

@app.get("/recent-activity")
async def get_recent_activity(current_user: str = Depends(get_current_user), db: Session = Depends(get_db)):
    bots = db.query(Bot).filter(Bot.user_id == current_user).all()
    bot_ids = [bot.id for bot in bots]
    
    return db.query(MessageLog).filter(
        MessageLog.bot_id.in_(bot_ids)
    ).order_by(MessageLog.created_at.desc()).limit(10).all() if bot_ids else []

# Webhook endpoints
@app.post("/webhooks/telegram/{bot_id}")
async def telegram_webhook(bot_id: int, update: dict):
    return {"status": "success"}

@app.post("/webhooks/whatsapp/{bot_id}")
async def whatsapp_webhook(bot_id: int, update: dict):
    return {"status": "success"}

@app.post("/webhooks/instagram/{bot_id}")
async def instagram_webhook(bot_id: int, update: dict):
    return {"status": "success"}

# Static file serving
if Path("dist").exists():
    app.mount("/assets", StaticFiles(directory="dist/assets"), name="assets")
    
    @app.get("/{full_path:path}")
    async def serve_spa(full_path: str):
        file_path = Path(f"dist/{full_path}")
        if file_path.is_file():
            return FileResponse(str(file_path))
        return FileResponse("dist/index.html")

# Create tables
Base.metadata.create_all(bind=engine)

if __name__ == "__main__":
    import uvicorn
    port = int(os.getenv("PORT", 8000))
    uvicorn.run(
        "production:app",
        host="0.0.0.0",
        port=port,
        workers=1,
        access_log=False
    )