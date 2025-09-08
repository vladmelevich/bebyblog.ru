import json
import asyncio
from channels.generic.websocket import AsyncWebsocketConsumer
from channels.db import database_sync_to_async
from django.contrib.auth import get_user_model
from django.utils import timezone
from .models import Chat, ChatMessage, Notification
from .serializers import ChatMessageSerializer, NotificationSerializer

User = get_user_model()


class ChatConsumer(AsyncWebsocketConsumer):
    async def connect(self):
        # Получаем токен из query параметров
        token = self.scope.get('query_string', b'').decode('utf-8')
        print(f"WebSocket connection attempt, query_string: {token}")
        
        if 'token=' in token:
            token = token.split('token=')[1].split('&')[0]
            print(f"Extracted token: {token[:20]}...")
        else:
            print("No token found in query string")
            await self.close()
            return
        
        # Аутентифицируем пользователя по токену
        self.user = await self.get_user_from_token(token)
        if not self.user:
            print("Authentication failed")
            await self.close()
            return
        
        print(f"User authenticated: {self.user.username}")
        
        # Создаем группу для пользователя
        self.user_group_name = f"user_{self.user.id}"
        
        # Присоединяемся к группе пользователя
        await self.channel_layer.group_add(
            self.user_group_name,
            self.channel_name
        )
        
        await self.accept()
        
        # Отправляем подтверждение подключения
        await self.send(text_data=json.dumps({
            'type': 'connection_established',
            'message': 'Подключение к чату установлено'
        }))

    async def disconnect(self, close_code):
        # Покидаем группу пользователя
        await self.channel_layer.group_discard(
            self.user_group_name,
            self.channel_name
        )

    async def receive(self, text_data):
        try:
            data = json.loads(text_data)
            message_type = data.get('type')
            
            if message_type == 'join_chat':
                await self.join_chat(data)
            elif message_type == 'leave_chat':
                await self.leave_chat(data)
            elif message_type == 'send_message':
                await self.send_message(data)
            elif message_type == 'typing':
                await self.typing(data)
            elif message_type == 'stop_typing':
                await self.stop_typing(data)
                
        except json.JSONDecodeError:
            await self.send(text_data=json.dumps({
                'type': 'error',
                'message': 'Неверный формат JSON'
            }))
        except Exception as e:
            await self.send(text_data=json.dumps({
                'type': 'error',
                'message': str(e)
            }))

    async def join_chat(self, data):
        """Присоединиться к чату"""
        user_id = data.get('user_id')
        if not user_id:
            await self.send(text_data=json.dumps({
                'type': 'error',
                'message': 'ID пользователя не указан'
            }))
            return
        
        # Создаем группу для чата
        chat_group_name = f"chat_{min(self.user.id, int(user_id))}_{max(self.user.id, int(user_id))}"
        
        # Присоединяемся к группе чата
        await self.channel_layer.group_add(
            chat_group_name,
            self.channel_name
        )
        
        # Сохраняем имя группы чата
        self.chat_group_name = chat_group_name
        
        await self.send(text_data=json.dumps({
            'type': 'joined_chat',
            'chat_group': chat_group_name,
            'message': 'Вы присоединились к чату'
        }))

    async def leave_chat(self, data):
        """Покинуть чат"""
        if hasattr(self, 'chat_group_name'):
            await self.channel_layer.group_discard(
                self.chat_group_name,
                self.channel_name
            )
            delattr(self, 'chat_group_name')
            
            await self.send(text_data=json.dumps({
                'type': 'left_chat',
                'message': 'Вы покинули чат'
            }))

    async def send_message(self, data):
        """Отправить сообщение"""
        user_id = data.get('user_id')
        content = data.get('content', '')
        message_type = data.get('message_type', 'text')
        reply_to = data.get('reply_to')
        
        if not user_id or not content:
            await self.send(text_data=json.dumps({
                'type': 'error',
                'message': 'Не указан получатель или содержимое сообщения'
            }))
            return
        
        # Создаем сообщение в базе данных
        message_data = await self.create_message(
            user_id, content, message_type, reply_to
        )
        
        if message_data:
            # Отправляем сообщение всем участникам чата
            chat_group_name = f"chat_{min(self.user.id, int(user_id))}_{max(self.user.id, int(user_id))}"
            
            await self.channel_layer.group_send(
                chat_group_name,
                {
                    'type': 'chat_message',
                    'message': message_data
                }
            )

    async def typing(self, data):
        """Пользователь печатает"""
        user_id = data.get('user_id')
        if user_id and hasattr(self, 'chat_group_name'):
            await self.channel_layer.group_send(
                self.chat_group_name,
                {
                    'type': 'user_typing',
                    'user_id': self.user.id,
                    'user_name': self.user.first_name or self.user.username
                }
            )

    async def stop_typing(self, data):
        """Пользователь перестал печатать"""
        user_id = data.get('user_id')
        if user_id and hasattr(self, 'chat_group_name'):
            await self.channel_layer.group_send(
                self.chat_group_name,
                {
                    'type': 'user_stop_typing',
                    'user_id': self.user.id
                }
            )

    async def chat_message(self, event):
        """Получить сообщение чата"""
        message = event['message']
        await self.send(text_data=json.dumps({
            'type': 'new_message',
            'message': message
        }))

    async def user_typing(self, event):
        """Пользователь печатает"""
        if event['user_id'] != self.user.id:
            await self.send(text_data=json.dumps({
                'type': 'user_typing',
                'user_id': event['user_id'],
                'user_name': event['user_name']
            }))

    async def user_stop_typing(self, event):
        """Пользователь перестал печатать"""
        if event['user_id'] != self.user.id:
            await self.send(text_data=json.dumps({
                'type': 'user_stop_typing',
                'user_id': event['user_id']
            }))

    @database_sync_to_async
    def create_message(self, user_id, content, message_type, reply_to):
        """Создать сообщение в базе данных"""
        try:
            other_user = User.objects.get(id=user_id)
            
            # Получаем или создаем чат
            chat, created = Chat.objects.get_or_create(
                participants__in=[self.user, other_user],
                defaults={'is_active': True}
            )
            if created:
                chat.participants.add(self.user, other_user)
            
            # Создаем сообщение
            message = ChatMessage.objects.create(
                chat=chat,
                sender=self.user,
                content=content,
                message_type=message_type,
                reply_to_id=reply_to
            )
            
            # Обновляем время последнего обновления чата
            chat.updated_at = timezone.now()
            chat.save()
            
            # Сериализуем сообщение
            serializer = ChatMessageSerializer(message)
            return serializer.data
            
        except User.DoesNotExist:
            return None
        except Exception as e:
            print(f"Ошибка создания сообщения: {e}")
            return None

    @database_sync_to_async
    def get_user_from_token(self, token):
        """Получить пользователя по JWT токену"""
        try:
            from rest_framework_simplejwt.tokens import AccessToken
            from rest_framework_simplejwt.exceptions import InvalidToken, TokenError
            
            print(f"Validating token: {token[:20]}...")
            
            # Валидируем токен
            access_token = AccessToken(token)
            user_id = access_token['user_id']
            print(f"Token valid, user_id: {user_id}")
            
            # Получаем пользователя
            user = User.objects.get(id=user_id)
            print(f"User found: {user.username}")
            return user
        except (InvalidToken, TokenError, User.DoesNotExist) as e:
            print(f"Ошибка аутентификации: {e}")
            return None


class NotificationConsumer(AsyncWebsocketConsumer):
    async def connect(self):
        self.user = self.scope["user"]
        if not self.user.is_authenticated:
            await self.close()
            return
        
        # Создаем группу для уведомлений пользователя
        self.notification_group_name = f"notifications_{self.user.id}"
        
        # Присоединяемся к группе уведомлений
        await self.channel_layer.group_add(
            self.notification_group_name,
            self.channel_name
        )
        
        await self.accept()
        
        # Отправляем подтверждение подключения
        await self.send(text_data=json.dumps({
            'type': 'connection_established',
            'message': 'Подключение к уведомлениям установлено'
        }))

    async def disconnect(self, close_code):
        # Покидаем группу уведомлений
        await self.channel_layer.group_discard(
            self.notification_group_name,
            self.channel_name
        )

    async def receive(self, text_data):
        try:
            data = json.loads(text_data)
            message_type = data.get('type')
            
            if message_type == 'mark_notification_read':
                await self.mark_notification_read(data)
            elif message_type == 'mark_all_read':
                await self.mark_all_notifications_read()
                
        except json.JSONDecodeError:
            await self.send(text_data=json.dumps({
                'type': 'error',
                'message': 'Неверный формат JSON'
            }))
        except Exception as e:
            await self.send(text_data=json.dumps({
                'type': 'error',
                'message': str(e)
            }))

    async def notification_created(self, event):
        """Получить новое уведомление"""
        notification = event['notification']
        await self.send(text_data=json.dumps({
            'type': 'new_notification',
            'notification': notification
        }))

    async def notification_updated(self, event):
        """Обновление уведомления"""
        notification = event['notification']
        await self.send(text_data=json.dumps({
            'type': 'notification_updated',
            'notification': notification
        }))

    async def mark_notification_read(self, data):
        """Отметить уведомление как прочитанное"""
        notification_id = data.get('notification_id')
        if notification_id:
            success = await self.mark_notification_as_read(notification_id)
            await self.send(text_data=json.dumps({
                'type': 'notification_marked_read',
                'success': success,
                'notification_id': notification_id
            }))

    async def mark_all_notifications_read(self):
        """Отметить все уведомления как прочитанные"""
        success = await self.mark_all_as_read()
        await self.send(text_data=json.dumps({
            'type': 'all_notifications_marked_read',
            'success': success
        }))

    @database_sync_to_async
    def mark_notification_as_read(self, notification_id):
        """Отметить уведомление как прочитанное в БД"""
        try:
            notification = Notification.objects.get(
                id=notification_id,
                recipient=self.user
            )
            notification.is_read = True
            notification.save()
            return True
        except Notification.DoesNotExist:
            return False

    @database_sync_to_async
    def mark_all_as_read(self):
        """Отметить все уведомления как прочитанные в БД"""
        try:
            Notification.objects.filter(
                recipient=self.user,
                is_read=False
            ).update(is_read=True)
            return True
        except Exception:
            return False
