from django.contrib.auth.models import AbstractUser
from django.db import models
from django.utils.translation import gettext_lazy as _


class User(AbstractUser):
    STATUS_CHOICES = [
        ('mom', 'Мама'),
        ('pregnant', 'Беременная'),
        ('planning', 'Планирую беременность'),
        ('other', 'Другое'),
    ]
    
    email = models.EmailField(_('email address'), unique=True)
    status = models.CharField(
        max_length=20, 
        choices=STATUS_CHOICES, 
        blank=True, 
        null=True,
        verbose_name=_('Статус')
    )
    city = models.CharField(
        max_length=100, 
        blank=True, 
        null=True,
        verbose_name=_('Город')
    )
    birth_date = models.DateField(
        blank=True, 
        null=True,
        verbose_name=_('Дата рождения')
    )
    avatar = models.ImageField(
        upload_to='avatars/', 
        blank=True, 
        null=True,
        verbose_name=_('Аватар')
    )
    
    # Используем email вместо username для входа
    USERNAME_FIELD = 'email'
    REQUIRED_FIELDS = ['username']
    
    class Meta:
        verbose_name = _('Пользователь')
        verbose_name_plural = _('Пользователи')
        indexes = [
            models.Index(fields=['username']),
            models.Index(fields=['first_name']),
            models.Index(fields=['last_name']),
            models.Index(fields=['email']),
            models.Index(fields=['date_joined']),
        ]
    
    def __str__(self):
        return self.email
    
    @property
    def full_name(self):
        return f"{self.first_name} {self.last_name}".strip()


class Child(models.Model):
    """Модель для детей пользователей"""
    GENDER_CHOICES = [
        ('male', 'Мальчик'),
        ('female', 'Девочка'),
    ]
    
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='children', verbose_name=_('Родитель'))
    name = models.CharField(max_length=100, verbose_name=_('Имя'))
    birth_date = models.DateField(verbose_name=_('Дата рождения'))
    gender = models.CharField(max_length=10, choices=GENDER_CHOICES, verbose_name=_('Пол'))
    created_at = models.DateTimeField(auto_now_add=True, verbose_name=_('Дата добавления'))
    
    class Meta:
        verbose_name = _('Ребенок')
        verbose_name_plural = _('Дети')
        ordering = ['-birth_date']
    
    def __str__(self):
        return f"{self.name} ({self.user.first_name})"
    
    @property
    def age(self):
        """Возвращает возраст ребенка с правильным окончанием"""
        from datetime import date
        today = date.today()
        age = today.year - self.birth_date.year - ((today.month, today.day) < (self.birth_date.month, self.birth_date.day))
        
        if age == 0:
            # Если ребенку меньше года, считаем месяцы
            months = (today.year - self.birth_date.year) * 12 + today.month - self.birth_date.month
            if today.day < self.birth_date.day:
                months -= 1
            
            if months == 0:
                return "новорожденный"
            elif months == 1:
                return "1 месяц"
            elif months >= 2 and months <= 4:
                return f"{months} месяца"
            else:
                return f"{months} месяцев"
        else:
            # Для возраста больше года
            if age >= 11 and age <= 19:
                return f"{age} лет"
            else:
                last_digit = age % 10
                if last_digit == 1:
                    return f"{age} год"
                elif last_digit >= 2 and last_digit <= 4:
                    return f"{age} года"
                else:
                    return f"{age} лет"


class Follow(models.Model):
    """Модель для подписок между пользователями"""
    follower = models.ForeignKey(User, on_delete=models.CASCADE, related_name='following', verbose_name=_('Подписчик'))
    following = models.ForeignKey(User, on_delete=models.CASCADE, related_name='followers', verbose_name=_('Подписка'))
    created_at = models.DateTimeField(auto_now_add=True, verbose_name=_('Дата подписки'))
    
    class Meta:
        verbose_name = _('Подписка')
        verbose_name_plural = _('Подписки')
        unique_together = ('follower', 'following')
        ordering = ['-created_at']
    
    def __str__(self):
        return f"{self.follower.username} подписан на {self.following.username}"


class Notification(models.Model):
    """Модель для уведомлений"""
    NOTIFICATION_TYPES = [
        ('follow', 'Подписка'),
        ('message', 'Сообщение'),
        ('like', 'Лайк'),
        ('comment', 'Комментарий'),
    ]
    
    recipient = models.ForeignKey(User, on_delete=models.CASCADE, related_name='notifications', verbose_name=_('Получатель'))
    sender = models.ForeignKey(User, on_delete=models.CASCADE, related_name='sent_notifications', verbose_name=_('Отправитель'))
    notification_type = models.CharField(max_length=20, choices=NOTIFICATION_TYPES, verbose_name=_('Тип уведомления'))
    message = models.TextField(blank=True, null=True, verbose_name=_('Сообщение'))
    post = models.ForeignKey('posts.Post', on_delete=models.CASCADE, null=True, blank=True, related_name='notifications', verbose_name=_('Пост'))
    is_read = models.BooleanField(default=False, verbose_name=_('Прочитано'))
    created_at = models.DateTimeField(auto_now_add=True, verbose_name=_('Дата создания'))
    
    class Meta:
        verbose_name = _('Уведомление')
        verbose_name_plural = _('Уведомления')
        ordering = ['-created_at']
        indexes = [
            models.Index(fields=['recipient', 'is_read']),
            models.Index(fields=['recipient', 'created_at']),
            models.Index(fields=['notification_type']),
            models.Index(fields=['created_at']),
        ]
    
    def __str__(self):
        return f"{self.sender.username} -> {self.recipient.username}: {self.get_notification_type_display()}"


class Message(models.Model):
    """Модель для сообщений между пользователями"""
    sender = models.ForeignKey(User, on_delete=models.CASCADE, related_name='sent_messages', verbose_name=_('Отправитель'))
    recipient = models.ForeignKey(User, on_delete=models.CASCADE, related_name='received_messages', verbose_name=_('Получатель'))
    content = models.TextField(verbose_name=_('Содержание сообщения'))
    is_read = models.BooleanField(default=False, verbose_name=_('Прочитано'))
    created_at = models.DateTimeField(auto_now_add=True, verbose_name=_('Дата отправки'))
    
    class Meta:
        verbose_name = _('Сообщение')
        verbose_name_plural = _('Сообщения')
        ordering = ['-created_at']
    
    def __str__(self):
        return f"{self.sender.username} -> {self.recipient.username}: {self.content[:50]}..."
    
    def save(self, *args, **kwargs):
        # Создаем уведомление при отправке нового сообщения
        is_new = self.pk is None
        super().save(*args, **kwargs)
        
        if is_new:
            # Создаем уведомление о новом сообщении
            Notification.objects.create(
                recipient=self.recipient,
                sender=self.sender,
                notification_type='message',
                message=f'{self.sender.first_name or self.sender.username} отправил вам сообщение'
            )


class PostArchive(models.Model):
    """Модель для архива постов пользователей"""
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='archived_posts', verbose_name=_('Пользователь'))
    post = models.ForeignKey('posts.Post', on_delete=models.CASCADE, related_name='archived_by', verbose_name=_('Пост'))
    created_at = models.DateTimeField(auto_now_add=True, verbose_name=_('Дата добавления в архив'))
    
    class Meta:
        verbose_name = _('Архив поста')
        verbose_name_plural = _('Архив постов')
        unique_together = ('user', 'post')
        ordering = ['-created_at']
    
    def __str__(self):
        return f"{self.user.username} - {self.post.title}"


class SharedPost(models.Model):
    """Модель для отправленных постов друзьям"""
    sender = models.ForeignKey(User, on_delete=models.CASCADE, related_name='shared_posts', verbose_name=_('Отправитель'))
    recipient = models.ForeignKey(User, on_delete=models.CASCADE, related_name='received_posts', verbose_name=_('Получатель'))
    post = models.ForeignKey('posts.Post', on_delete=models.CASCADE, related_name='shared_with', verbose_name=_('Пост'))
    message = models.TextField(blank=True, null=True, verbose_name=_('Сообщение'))
    is_read = models.BooleanField(default=False, verbose_name=_('Прочитано'))
    created_at = models.DateTimeField(auto_now_add=True, verbose_name=_('Дата отправки'))
    
    class Meta:
        verbose_name = _('Отправленный пост')
        verbose_name_plural = _('Отправленные посты')
        ordering = ['-created_at']
    
    def __str__(self):
        return f"{self.sender.username} -> {self.recipient.username}: {self.post.title}"
    
    def save(self, *args, **kwargs):
        # Создаем уведомление при отправке поста
        is_new = self.pk is None
        super().save(*args, **kwargs)
        
        if is_new:
            # Создаем уведомление о новом сообщении
            Notification.objects.create(
                recipient=self.recipient,
                sender=self.sender,
                notification_type='message',
                message=f'{self.sender.first_name or self.sender.username} поделился с вами постом "{self.post.title}"'
            )


class Chat(models.Model):
    """Модель чата между двумя пользователями"""
    participants = models.ManyToManyField('User', related_name='chats')
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    is_active = models.BooleanField(default=True, verbose_name=_('Активный чат'))
    
    class Meta:
        verbose_name = _('Чат')
        verbose_name_plural = _('Чаты')
        ordering = ['-updated_at']
    
    def __str__(self):
        participant_names = [user.username for user in self.participants.all()]
        return f"Чат между {' и '.join(participant_names)}"
    
    @property
    def last_message(self):
        """Последнее сообщение в чате"""
        return self.messages.order_by('-created_at').first()
    
    def unread_count(self, user):
        """Количество непрочитанных сообщений для пользователя"""
        return self.messages.filter(
            sender__in=self.participants.exclude(id=user.id),
            is_read=False
        ).count()
    
    def get_other_participant(self, user):
        """Получить собеседника для данного пользователя"""
        return self.participants.exclude(id=user.id).first()

class ChatMessage(models.Model):
    """Модель сообщения в чате"""
    MESSAGE_TYPES = [
        ('text', 'Текстовое сообщение'),
        ('image', 'Изображение'),
        ('file', 'Файл'),
        ('voice', 'Голосовое сообщение'),
    ]
    
    chat = models.ForeignKey(Chat, on_delete=models.CASCADE, related_name='messages')
    sender = models.ForeignKey('User', on_delete=models.CASCADE, related_name='sent_chat_messages')
    content = models.TextField(verbose_name=_('Текст сообщения'), blank=True, null=True)
    message_type = models.CharField(max_length=10, choices=MESSAGE_TYPES, default='text', verbose_name=_('Тип сообщения'))
    file = models.FileField(upload_to='chat_files/', blank=True, null=True, verbose_name=_('Файл'))
    reply_to = models.ForeignKey('self', on_delete=models.SET_NULL, blank=True, null=True, related_name='replies', verbose_name=_('Ответ на сообщение'))
    is_read = models.BooleanField(default=False, verbose_name=_('Прочитано'))
    is_edited = models.BooleanField(default=False, verbose_name=_('Отредактировано'))
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        verbose_name = _('Сообщение чата')
        verbose_name_plural = _('Сообщения чатов')
        ordering = ['created_at']
        indexes = [
            models.Index(fields=['chat', 'created_at']),
            models.Index(fields=['sender', 'created_at']),
            models.Index(fields=['is_read']),
            models.Index(fields=['created_at']),
        ]
    
    def __str__(self):
        return f"Сообщение от {self.sender.username} в {self.chat}"
    
    def save(self, *args, **kwargs):
        # Создаем уведомление при отправке нового сообщения
        is_new = self.pk is None
        super().save(*args, **kwargs)
        
        if is_new:
            # Получаем получателя сообщения (собеседника)
            recipient = self.chat.participants.exclude(id=self.sender.id).first()
            if recipient:
                # Создаем уведомление о новом сообщении в чате
                notification = Notification.objects.create(
                    recipient=recipient,
                    sender=self.sender,
                    notification_type='message',
                    message=f'{self.sender.first_name or self.sender.username} отправил вам сообщение в чате'
                )
                
                # Отправляем WebSocket уведомление
                self.send_notification_websocket(notification)
    
    def send_notification_websocket(self, notification):
        """Отправить уведомление через WebSocket"""
        try:
            from channels.layers import get_channel_layer
            from asgiref.sync import async_to_sync
            from .serializers import NotificationSerializer
            
            channel_layer = get_channel_layer()
            if channel_layer:
                # Сериализуем уведомление
                serializer = NotificationSerializer(notification)
                notification_data = serializer.data
                
                # Отправляем уведомление получателю
                async_to_sync(channel_layer.group_send)(
                    f"notifications_{notification.recipient.id}",
                    {
                        'type': 'notification_created',
                        'notification': notification_data
                    }
                )
        except Exception as e:
            # Логируем ошибку, но не прерываем выполнение
            print(f"Ошибка отправки WebSocket уведомления: {e}")
    
    def get_file_size(self):
        """Получить размер файла в читаемом формате"""
        if not self.file:
            return None
        
        size = self.file.size
        if size < 1024:
            return f"{size} B"
        elif size < 1024 * 1024:
            return f"{size / 1024:.1f} KB"
        else:
            return f"{size / (1024 * 1024):.1f} MB"
