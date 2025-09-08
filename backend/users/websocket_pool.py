"""
Пул WebSocket соединений для оптимизации производительности
"""
import asyncio
import json
from typing import Dict, Set, Any
from channels.generic.websocket import AsyncWebsocketConsumer
from django.core.cache import cache


class WebSocketConnectionPool:
    """Пул для управления WebSocket соединениями"""
    
    def __init__(self):
        self.connections: Dict[str, Set[AsyncWebsocketConsumer]] = {}
        self.user_connections: Dict[int, Set[AsyncWebsocketConsumer]] = {}
        self.lock = asyncio.Lock()
    
    async def add_connection(self, consumer: AsyncWebsocketConsumer, user_id: int, room_name: str = None):
        """Добавить соединение в пул"""
        async with self.lock:
            # Добавляем в общий пул
            if room_name not in self.connections:
                self.connections[room_name] = set()
            self.connections[room_name].add(consumer)
            
            # Добавляем в пул пользователя
            if user_id not in self.user_connections:
                self.user_connections[user_id] = set()
            self.user_connections[user_id].add(consumer)
    
    async def remove_connection(self, consumer: AsyncWebsocketConsumer, user_id: int, room_name: str = None):
        """Удалить соединение из пула"""
        async with self.lock:
            # Удаляем из общего пула
            if room_name and room_name in self.connections:
                self.connections[room_name].discard(consumer)
                if not self.connections[room_name]:
                    del self.connections[room_name]
            
            # Удаляем из пула пользователя
            if user_id in self.user_connections:
                self.user_connections[user_id].discard(consumer)
                if not self.user_connections[user_id]:
                    del self.user_connections[user_id]
    
    async def send_to_room(self, room_name: str, message: Dict[str, Any]):
        """Отправить сообщение всем в комнате"""
        if room_name in self.connections:
            disconnected = set()
            for consumer in self.connections[room_name]:
                try:
                    await consumer.send(text_data=json.dumps(message))
                except Exception:
                    disconnected.add(consumer)
            
            # Удаляем отключенные соединения
            for consumer in disconnected:
                self.connections[room_name].discard(consumer)
    
    async def send_to_user(self, user_id: int, message: Dict[str, Any]):
        """Отправить сообщение конкретному пользователю"""
        if user_id in self.user_connections:
            disconnected = set()
            for consumer in self.user_connections[user_id]:
                try:
                    await consumer.send(text_data=json.dumps(message))
                except Exception:
                    disconnected.add(consumer)
            
            # Удаляем отключенные соединения
            for consumer in disconnected:
                self.user_connections[user_id].discard(consumer)
    
    async def get_connection_count(self, room_name: str = None) -> int:
        """Получить количество активных соединений"""
        if room_name:
            return len(self.connections.get(room_name, set()))
        return sum(len(connections) for connections in self.connections.values())
    
    async def get_user_connection_count(self, user_id: int) -> int:
        """Получить количество соединений пользователя"""
        return len(self.user_connections.get(user_id, set()))


# Глобальный пул соединений
connection_pool = WebSocketConnectionPool()


class OptimizedChatConsumer(AsyncWebsocketConsumer):
    """Оптимизированный потребитель WebSocket для чата"""
    
    async def connect(self):
        self.room_name = self.scope['url_route']['kwargs']['room_name']
        self.room_group_name = f'chat_{self.room_name}'
        self.user = self.scope['user']
        
        # Добавляем соединение в пул
        await connection_pool.add_connection(
            self, 
            self.user.id, 
            self.room_group_name
        )
        
        # Присоединяемся к группе
        await self.channel_layer.group_add(
            self.room_group_name,
            self.channel_name
        )
        
        await self.accept()
        
        # Отправляем информацию о подключении
        await self.send(text_data=json.dumps({
            'type': 'connection_established',
            'message': 'Подключение установлено',
            'user_id': self.user.id,
            'room': self.room_name
        }))
    
    async def disconnect(self, close_code):
        # Удаляем соединение из пула
        await connection_pool.remove_connection(
            self, 
            self.user.id, 
            self.room_group_name
        )
        
        # Покидаем группу
        await self.channel_layer.group_discard(
            self.room_group_name,
            self.channel_name
        )
    
    async def receive(self, text_data):
        try:
            data = json.loads(text_data)
            message_type = data.get('type')
            
            if message_type == 'chat_message':
                await self.handle_chat_message(data)
            elif message_type == 'typing':
                await self.handle_typing(data)
            elif message_type == 'ping':
                await self.send(text_data=json.dumps({'type': 'pong'}))
                
        except json.JSONDecodeError:
            await self.send(text_data=json.dumps({
                'type': 'error',
                'message': 'Неверный формат JSON'
            }))
        except Exception as e:
            await self.send(text_data=json.dumps({
                'type': 'error',
                'message': f'Ошибка: {str(e)}'
            }))
    
    async def handle_chat_message(self, data):
        """Обработка сообщения чата"""
        message = data.get('message', '')
        
        if message.strip():
            # Отправляем сообщение в группу
            await self.channel_layer.group_send(
                self.room_group_name,
                {
                    'type': 'chat_message',
                    'message': message,
                    'user_id': self.user.id,
                    'username': self.user.username,
                    'timestamp': data.get('timestamp')
                }
            )
    
    async def handle_typing(self, data):
        """Обработка индикатора печати"""
        is_typing = data.get('is_typing', False)
        
        await self.channel_layer.group_send(
            self.room_group_name,
            {
                'type': 'typing',
                'user_id': self.user.id,
                'username': self.user.username,
                'is_typing': is_typing
            }
        )
    
    async def chat_message(self, event):
        """Получить сообщение чата"""
        await self.send(text_data=json.dumps({
            'type': 'chat_message',
            'message': event['message'],
            'user_id': event['user_id'],
            'username': event['username'],
            'timestamp': event.get('timestamp')
        }))
    
    async def typing(self, event):
        """Получить индикатор печати"""
        await self.send(text_data=json.dumps({
            'type': 'typing',
            'user_id': event['user_id'],
            'username': event['username'],
            'is_typing': event['is_typing']
        }))
