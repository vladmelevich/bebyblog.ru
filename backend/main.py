from fastapi import FastAPI, WebSocket, WebSocketDisconnect, HTTPException, Depends, UploadFile, File
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from sqlalchemy.orm import Session
from typing import List, Optional
import json
import os
import uuid
from datetime import datetime
import aiofiles

from database import get_db, engine
from models import Base, User, Chat, Message, MessageFile
from schemas import (
    UserCreate, UserResponse, ChatCreate, ChatResponse, 
    MessageCreate, MessageResponse, MessageUpdate, MessageFileResponse
)
from auth import get_current_user, create_access_token, verify_password, get_password_hash
from websocket_manager import ConnectionManager

# Создаем таблицы
Base.metadata.create_all(bind=engine)

app = FastAPI(title="Chat API", version="1.0.0")

# CORS настройки
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "http://127.0.0.1:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Статические файлы
app.mount("/media", StaticFiles(directory="media"), name="media")

# Менеджер WebSocket соединений
manager = ConnectionManager()

# Создаем директорию для медиа файлов
os.makedirs("media/avatars", exist_ok=True)
os.makedirs("media/messages", exist_ok=True)

@app.post("/api/auth/register", response_model=UserResponse)
async def register(user: UserCreate, db: Session = Depends(get_db)):
    """Регистрация пользователя"""
    # Проверяем, существует ли пользователь
    existing_user = db.query(User).filter(User.email == user.email).first()
    if existing_user:
        raise HTTPException(status_code=400, detail="Email already registered")
    
    # Создаем нового пользователя
    hashed_password = get_password_hash(user.password)
    db_user = User(
        email=user.email,
        name=user.name,
        hashed_password=hashed_password,
        city=user.city,
        avatar=user.avatar
    )
    db.add(db_user)
    db.commit()
    db.refresh(db_user)
    
    # Создаем токен
    access_token = create_access_token(data={"sub": str(db_user.id)})
    
    return UserResponse(
        id=db_user.id,
        email=db_user.email,
        name=db_user.name,
        city=db_user.city,
        avatar=db_user.avatar,
        access_token=access_token
    )

@app.post("/api/auth/login", response_model=UserResponse)
async def login(email: str, password: str, db: Session = Depends(get_db)):
    """Вход пользователя"""
    print(f"=== LOGIN REQUEST ===")
    print(f"Email: {email}")
    
    user = db.query(User).filter(User.email == email).first()
    print(f"User found: {user is not None}")
    if user:
        print(f"User ID: {user.id}")
        print(f"User name: {user.name}")
        print(f"User email: {user.email}")
    
    if not user or not verify_password(password, user.hashed_password):
        print("Invalid credentials")
        raise HTTPException(status_code=401, detail="Invalid credentials")
    
    access_token = create_access_token(data={"sub": str(user.id)})
    print(f"Access token created: {access_token[:20]}...")
    
    response = UserResponse(
        id=user.id,
        email=user.email,
        name=user.name,
        city=user.city,
        avatar=user.avatar,
        access_token=access_token
    )
    
    print(f"Response: {response}")
    return response

@app.get("/api/users/me", response_model=UserResponse)
async def get_current_user_info(current_user: User = Depends(get_current_user)):
    """Получение информации о текущем пользователе"""
    return UserResponse(
        id=current_user.id,
        email=current_user.email,
        name=current_user.name,
        city=current_user.city,
        avatar=current_user.avatar
    )

@app.get("/api/users", response_model=List[UserResponse])
async def get_users(current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    """Получение списка пользователей"""
    users = db.query(User).filter(User.id != current_user.id).all()
    return [
        UserResponse(
            id=user.id,
            email=user.email,
            name=user.name,
            city=user.city,
            avatar=user.avatar
        ) for user in users
    ]

@app.post("/api/chats", response_model=ChatResponse)
async def create_chat(
    chat: ChatCreate, 
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Создание чата"""
    # Проверяем, существует ли чат между пользователями
    existing_chat = db.query(Chat).filter(
        ((Chat.user1_id == current_user.id) & (Chat.user2_id == chat.user2_id)) |
        ((Chat.user1_id == chat.user2_id) & (Chat.user2_id == current_user.id))
    ).first()
    
    if existing_chat:
        return ChatResponse(
            id=existing_chat.id,
            user1_id=existing_chat.user1_id,
            user2_id=existing_chat.user2_id,
            created_at=existing_chat.created_at
        )
    
    # Создаем новый чат
    db_chat = Chat(
        user1_id=current_user.id,
        user2_id=chat.user2_id
    )
    db.add(db_chat)
    db.commit()
    db.refresh(db_chat)
    
    return ChatResponse(
        id=db_chat.id,
        user1_id=db_chat.user1_id,
        user2_id=db_chat.user2_id,
        created_at=db_chat.created_at
    )

@app.get("/api/chats", response_model=List[ChatResponse])
async def get_chats(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Получение списка чатов пользователя"""
    chats = db.query(Chat).filter(
        (Chat.user1_id == current_user.id) | (Chat.user2_id == current_user.id)
    ).all()
    
    return [
        ChatResponse(
            id=chat.id,
            user1_id=chat.user1_id,
            user2_id=chat.user2_id,
            created_at=chat.created_at
        ) for chat in chats
    ]

@app.get("/api/chats/{chat_id}/messages", response_model=List[MessageResponse])
async def get_messages(
    chat_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Получение сообщений чата"""
    # Проверяем, что пользователь имеет доступ к чату
    chat = db.query(Chat).filter(
        Chat.id == chat_id,
        (Chat.user1_id == current_user.id) | (Chat.user2_id == current_user.id)
    ).first()
    
    if not chat:
        raise HTTPException(status_code=404, detail="Chat not found")
    
    messages = db.query(Message).filter(Message.chat_id == chat_id).order_by(Message.created_at).all()
    
    result = []
    for message in messages:
        files = []
        for file in message.files:
            files.append(MessageFileResponse(
                id=file.id,
                filename=file.filename,
                file_path=file.file_path,
                file_size=file.file_size,
                file_type=file.file_type
            ))
        
        result.append(MessageResponse(
            id=message.id,
            chat_id=message.chat_id,
            sender_id=message.sender_id,
            text=message.text,
            created_at=message.created_at,
            edited_at=message.edited_at,
            files=files
        ))
    
    return result

@app.post("/api/chats/{chat_id}/messages", response_model=MessageResponse)
async def create_message(
    chat_id: int,
    message: MessageCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Создание сообщения"""
    # Проверяем, что пользователь имеет доступ к чату
    chat = db.query(Chat).filter(
        Chat.id == chat_id,
        (Chat.user1_id == current_user.id) | (Chat.user2_id == current_user.id)
    ).first()
    
    if not chat:
        raise HTTPException(status_code=404, detail="Chat not found")
    
    # Создаем сообщение
    db_message = Message(
        chat_id=chat_id,
        sender_id=current_user.id,
        text=message.text
    )
    db.add(db_message)
    db.commit()
    db.refresh(db_message)
    
    # Отправляем сообщение через WebSocket
    await manager.send_message_to_chat(chat_id, {
        "type": "new_message",
        "message": {
            "id": db_message.id,
            "chat_id": db_message.chat_id,
            "sender_id": db_message.sender_id,
            "text": db_message.text,
            "created_at": db_message.created_at.isoformat(),
            "edited_at": db_message.edited_at.isoformat() if db_message.edited_at else None,
            "files": []
        }
    })
    
    return MessageResponse(
        id=db_message.id,
        chat_id=db_message.chat_id,
        sender_id=db_message.sender_id,
        text=db_message.text,
        created_at=db_message.created_at,
        edited_at=db_message.edited_at,
        files=[]
    )

@app.put("/api/messages/{message_id}", response_model=MessageResponse)
async def update_message(
    message_id: int,
    message_update: MessageUpdate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Редактирование сообщения"""
    message = db.query(Message).filter(
        Message.id == message_id,
        Message.sender_id == current_user.id
    ).first()
    
    if not message:
        raise HTTPException(status_code=404, detail="Message not found")
    
    # Обновляем сообщение
    message.text = message_update.text
    message.edited_at = datetime.utcnow()
    db.commit()
    db.refresh(message)
    
    # Отправляем обновление через WebSocket
    await manager.send_message_to_chat(message.chat_id, {
        "type": "message_updated",
        "message": {
            "id": message.id,
            "chat_id": message.chat_id,
            "sender_id": message.sender_id,
            "text": message.text,
            "created_at": message.created_at.isoformat(),
            "edited_at": message.edited_at.isoformat() if message.edited_at else None,
            "files": []
        }
    })
    
    return MessageResponse(
        id=message.id,
        chat_id=message.chat_id,
        sender_id=message.sender_id,
        text=message.text,
        created_at=message.created_at,
        edited_at=message.edited_at,
        files=[]
    )

@app.delete("/api/messages/{message_id}")
async def delete_message(
    message_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Удаление сообщения"""
    message = db.query(Message).filter(
        Message.id == message_id,
        Message.sender_id == current_user.id
    ).first()
    
    if not message:
        raise HTTPException(status_code=404, detail="Message not found")
    
    chat_id = message.chat_id
    db.delete(message)
    db.commit()
    
    # Отправляем уведомление об удалении через WebSocket
    await manager.send_message_to_chat(chat_id, {
        "type": "message_deleted",
        "message_id": message_id
    })
    
    return {"message": "Message deleted successfully"}

@app.post("/api/messages/{message_id}/files")
async def upload_file(
    message_id: int,
    file: UploadFile = File(...),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Загрузка файла к сообщению"""
    message = db.query(Message).filter(
        Message.id == message_id,
        Message.sender_id == current_user.id
    ).first()
    
    if not message:
        raise HTTPException(status_code=404, detail="Message not found")
    
    # Сохраняем файл
    file_extension = os.path.splitext(file.filename)[1]
    filename = f"{uuid.uuid4()}{file_extension}"
    file_path = f"media/messages/{filename}"
    
    async with aiofiles.open(file_path, 'wb') as f:
        content = await file.read()
        await f.write(content)
    
    # Создаем запись о файле
    db_file = MessageFile(
        message_id=message_id,
        filename=file.filename,
        file_path=file_path,
        file_size=len(content),
        file_type=file.content_type
    )
    db.add(db_file)
    db.commit()
    db.refresh(db_file)
    
    return MessageFileResponse(
        id=db_file.id,
        filename=db_file.filename,
        file_path=db_file.file_path,
        file_size=db_file.file_size,
        file_type=db_file.file_type
    )

@app.websocket("/ws/{user_id}")
async def websocket_endpoint(websocket: WebSocket, user_id: int):
    """WebSocket соединение для чата"""
    await manager.connect(websocket, user_id)
    try:
        while True:
            data = await websocket.receive_text()
            message_data = json.loads(data)
            
            if message_data["type"] == "join_chat":
                chat_id = message_data["chat_id"]
                await manager.join_chat(user_id, chat_id)
            
            elif message_data["type"] == "leave_chat":
                chat_id = message_data["chat_id"]
                await manager.leave_chat(user_id, chat_id)
                
    except WebSocketDisconnect:
        manager.disconnect(user_id)

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)

