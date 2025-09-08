from fastapi import WebSocket
from typing import Dict, List, Set
import json

class ConnectionManager:
    def __init__(self):
        # Активные соединения: {user_id: websocket}
        self.active_connections: Dict[int, WebSocket] = {}
        # Пользователи в чатах: {chat_id: {user_id1, user_id2}}
        self.chat_users: Dict[int, Set[int]] = {}

    async def connect(self, websocket: WebSocket, user_id: int):
        """Подключение пользователя"""
        await websocket.accept()
        self.active_connections[user_id] = websocket

    def disconnect(self, user_id: int):
        """Отключение пользователя"""
        if user_id in self.active_connections:
            del self.active_connections[user_id]
        
        # Удаляем пользователя из всех чатов
        for chat_id in self.chat_users:
            self.chat_users[chat_id].discard(user_id)

    async def join_chat(self, user_id: int, chat_id: int):
        """Присоединение пользователя к чату"""
        if chat_id not in self.chat_users:
            self.chat_users[chat_id] = set()
        self.chat_users[chat_id].add(user_id)

    async def leave_chat(self, user_id: int, chat_id: int):
        """Покидание пользователем чата"""
        if chat_id in self.chat_users:
            self.chat_users[chat_id].discard(user_id)

    async def send_message_to_user(self, user_id: int, message: dict):
        """Отправка сообщения конкретному пользователю"""
        if user_id in self.active_connections:
            try:
                await self.active_connections[user_id].send_text(json.dumps(message))
            except:
                # Если соединение разорвано, удаляем его
                self.disconnect(user_id)

    async def send_message_to_chat(self, chat_id: int, message: dict):
        """Отправка сообщения всем пользователям в чате"""
        if chat_id in self.chat_users:
            for user_id in self.chat_users[chat_id]:
                await self.send_message_to_user(user_id, message)

    async def send_typing_indicator(self, chat_id: int, user_id: int, is_typing: bool):
        """Отправка индикатора набора текста"""
        message = {
            "type": "typing",
            "user_id": user_id,
            "is_typing": is_typing
        }
        await self.send_message_to_chat(chat_id, message)



