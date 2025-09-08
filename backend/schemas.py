from pydantic import BaseModel, EmailStr
from typing import Optional, List
from datetime import datetime

class UserCreate(BaseModel):
    email: EmailStr
    name: str
    password: str
    city: Optional[str] = None
    avatar: Optional[str] = None

class UserResponse(BaseModel):
    id: int
    email: str
    name: str
    city: Optional[str] = None
    avatar: Optional[str] = None
    access_token: Optional[str] = None
    
    class Config:
        from_attributes = True

class ChatCreate(BaseModel):
    user2_id: int

class ChatResponse(BaseModel):
    id: int
    user1_id: int
    user2_id: int
    created_at: datetime
    
    class Config:
        from_attributes = True

class MessageFileResponse(BaseModel):
    id: int
    filename: str
    file_path: str
    file_size: int
    file_type: str
    
    class Config:
        from_attributes = True

class MessageCreate(BaseModel):
    text: str

class MessageUpdate(BaseModel):
    text: str

class MessageResponse(BaseModel):
    id: int
    chat_id: int
    sender_id: int
    text: Optional[str] = None
    created_at: datetime
    edited_at: Optional[datetime] = None
    files: List[MessageFileResponse] = []
    
    class Config:
        from_attributes = True







