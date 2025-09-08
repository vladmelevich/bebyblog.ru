from rest_framework import serializers
from django.contrib.auth import authenticate
from django.contrib.auth.password_validation import validate_password
from django.utils import timezone
from .models import User, Child, Follow, Notification, ChatMessage, Chat


class UserRegistrationSerializer(serializers.ModelSerializer):
    password = serializers.CharField(write_only=True, validators=[validate_password])
    confirm_password = serializers.CharField(write_only=True)
    avatar = serializers.ImageField(required=False, allow_null=True)
    
    class Meta:
        model = User
        fields = ('email', 'username', 'first_name', 'last_name', 'password', 'confirm_password', 'status', 'city', 'birth_date', 'avatar')
        extra_kwargs = {
            'email': {'required': True},
            'username': {'required': True},
            'first_name': {'required': True},
            'last_name': {'required': True},
            'status': {'required': True},
            'city': {'required': True},
            'birth_date': {'required': True},
        }
    
    def validate(self, attrs):
        if attrs['password'] != attrs['confirm_password']:
            raise serializers.ValidationError("Пароли не совпадают")
        return attrs
    
    def create(self, validated_data):
        validated_data.pop('confirm_password')
        user = User.objects.create_user(**validated_data)
        return user


class UserProfileSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = ('id', 'email', 'username', 'first_name', 'last_name', 'status', 'city', 'birth_date', 'avatar')
        read_only_fields = ('id', 'email')


class UserLoginSerializer(serializers.Serializer):
    email = serializers.EmailField()
    password = serializers.CharField(write_only=True)
    remember_me = serializers.BooleanField(default=False, required=False)
    
    def validate(self, attrs):
        email = attrs.get('email')
        password = attrs.get('password')
        
        if email and password:
            try:
                user = User.objects.get(email=email)
                if user.check_password(password):
                    attrs['user'] = user
                    return attrs
                else:
                    raise serializers.ValidationError('Неверный пароль')
            except User.DoesNotExist:
                raise serializers.ValidationError('Пользователь не найден')
        else:
            raise serializers.ValidationError('Необходимо указать email и пароль')
        
        return attrs


class UserDetailSerializer(serializers.ModelSerializer):
    full_name = serializers.ReadOnlyField()
    
    class Meta:
        model = User
        fields = ('id', 'email', 'username', 'first_name', 'last_name', 'full_name', 
                 'status', 'city', 'birth_date', 'avatar', 'date_joined')
        read_only_fields = ('id', 'email', 'date_joined')
    
    def to_representation(self, instance):
        data = super().to_representation(instance)
        if instance.avatar:
            request = self.context.get('request')
            if request:
                data['avatar'] = request.build_absolute_uri(instance.avatar.url)
            else:
                data['avatar'] = instance.avatar.url
        return data


class ChildSerializer(serializers.ModelSerializer):
    age = serializers.ReadOnlyField()
    
    class Meta:
        model = Child
        fields = ('id', 'name', 'birth_date', 'gender', 'age', 'created_at')
        read_only_fields = ('id', 'created_at')


class FollowSerializer(serializers.ModelSerializer):
    follower = UserDetailSerializer(read_only=True)
    following = UserDetailSerializer(read_only=True)
    
    class Meta:
        model = Follow
        fields = ('id', 'follower', 'following', 'created_at')
        read_only_fields = ('id', 'created_at')


class NotificationSerializer(serializers.ModelSerializer):
    sender = UserDetailSerializer(read_only=True)
    recipient = UserDetailSerializer(read_only=True)
    post_info = serializers.SerializerMethodField()
    
    class Meta:
        model = Notification
        fields = ('id', 'sender', 'recipient', 'notification_type', 'message', 'post', 'post_info', 'is_read', 'created_at')
        read_only_fields = ('id', 'created_at')
    
    def get_post_info(self, obj):
        """Возвращает информацию о посте для уведомлений о комментариях и лайках"""
        if obj.post:
            return {
                'id': obj.post.id,
                'title': obj.post.title,
                'slug': obj.post.slug,
                'category': obj.post.category.name if obj.post.category else None
            }
        return None


class UserSearchSerializer(serializers.ModelSerializer):
    full_name = serializers.ReadOnlyField()
    is_following = serializers.SerializerMethodField()
    
    class Meta:
        model = User
        fields = ('id', 'username', 'first_name', 'last_name', 'full_name', 'city', 'avatar', 'date_joined', 'is_following')
        read_only_fields = ('id', 'date_joined')
    
    def get_is_following(self, obj):
        request = self.context.get('request')
        if request and request.user.is_authenticated:
            return Follow.objects.filter(follower=request.user, following=obj).exists()
        return False
    
    def to_representation(self, instance):
        data = super().to_representation(instance)
        if instance.avatar:
            request = self.context.get('request')
            if request:
                data['avatar'] = request.build_absolute_uri(instance.avatar.url)
            else:
                data['avatar'] = instance.avatar.url
        return data


class UserProfileWithPostsSerializer(serializers.ModelSerializer):
    full_name = serializers.ReadOnlyField()
    posts_count = serializers.SerializerMethodField()
    published_posts_count = serializers.SerializerMethodField()
    followers_count = serializers.SerializerMethodField()
    following_count = serializers.SerializerMethodField()
    children = ChildSerializer(many=True, read_only=True)
    posts = serializers.SerializerMethodField()
    
    class Meta:
        model = User
        fields = ('id', 'email', 'username', 'first_name', 'last_name', 'full_name', 
                 'status', 'city', 'birth_date', 'avatar', 'date_joined', 
                 'posts_count', 'published_posts_count', 'followers_count', 'following_count', 'children', 'posts')
        read_only_fields = ('id', 'email', 'date_joined')
    
    def get_posts_count(self, obj):
        return obj.posts.count()
    
    def get_published_posts_count(self, obj):
        return obj.posts.filter(status='published').count()
    
    def get_followers_count(self, obj):
        # Подписчики - это те, кто подписан на данного пользователя
        count = obj.followers.count()
        print(f"Подписчики {obj.username}: {count}")
        return count
    
    def get_following_count(self, obj):
        # Подписки - это те, на кого подписан данный пользователь
        count = obj.following.count()
        print(f"Подписки {obj.username}: {count}")
        return count
    
    def get_posts(self, obj):
        """Получаем все посты пользователя (включая черновики)"""
        from posts.serializers import PostListSerializer
        posts = obj.posts.all().order_by('-created_at')
        return PostListSerializer(posts, many=True, context=self.context).data
    
    def to_representation(self, instance):
        data = super().to_representation(instance)
        if instance.avatar:
            request = self.context.get('request')
            if request:
                data['avatar'] = request.build_absolute_uri(instance.avatar.url)
            else:
                data['avatar'] = instance.avatar.url
        return data


class ChatMessageSerializer(serializers.ModelSerializer):
    sender_name = serializers.SerializerMethodField()
    sender_avatar = serializers.SerializerMethodField()
    sender_info = serializers.SerializerMethodField()
    file_url = serializers.SerializerMethodField()
    file_size = serializers.SerializerMethodField()
    reply_to_message = serializers.SerializerMethodField()
    
    class Meta:
        model = ChatMessage
        fields = [
            'id', 'content', 'message_type', 'file_url', 'file_size', 
            'reply_to', 'reply_to_message', 'is_read', 'is_edited', 
            'created_at', 'updated_at', 'sender', 'sender_name', 'sender_avatar', 'sender_info'
        ]
        read_only_fields = ['created_at', 'updated_at']
    
    def get_sender_name(self, obj):
        request = self.context.get('request')
        if request and request.user.is_authenticated:
            # Если отправитель - текущий пользователь, возвращаем "Вы"
            if obj.sender.id == request.user.id:
                return "Вы"
        return obj.sender.first_name or obj.sender.username
    
    def get_sender_avatar(self, obj):
        if obj.sender.avatar:
            request = self.context.get('request')
            if request:
                return request.build_absolute_uri(obj.sender.avatar.url)
            return obj.sender.avatar.url
        return None
    
    def get_sender_info(self, obj):
        """Полная информация об отправителе"""
        request = self.context.get('request')
        avatar_url = None
        if obj.sender.avatar:
            if request:
                avatar_url = request.build_absolute_uri(obj.sender.avatar.url)
            else:
                avatar_url = obj.sender.avatar.url
        
        return {
            'id': obj.sender.id,
            'username': obj.sender.username,
            'first_name': obj.sender.first_name,
            'last_name': obj.sender.last_name,
            'avatar': avatar_url
        }
    
    def get_file_url(self, obj):
        if obj.file:
            request = self.context.get('request')
            if request:
                return request.build_absolute_uri(obj.file.url)
            return obj.file.url
        return None
    
    def get_file_size(self, obj):
        return obj.get_file_size()
    
    def get_reply_to_message(self, obj):
        if obj.reply_to:
            return {
                'id': obj.reply_to.id,
                'content': obj.reply_to.content,
                'sender_name': obj.reply_to.sender.first_name or obj.reply_to.sender.username,
                'message_type': obj.reply_to.message_type
            }
        return None

class ChatSerializer(serializers.ModelSerializer):
    participants = UserDetailSerializer(many=True, read_only=True)
    last_message = ChatMessageSerializer(read_only=True)
    unread_count = serializers.SerializerMethodField()
    other_participant = serializers.SerializerMethodField()
    
    class Meta:
        model = Chat
        fields = [
            'id', 'participants', 'last_message', 'unread_count', 
            'other_participant', 'created_at', 'updated_at', 'is_active'
        ]
        read_only_fields = ['created_at', 'updated_at']
    
    def get_unread_count(self, obj):
        request = self.context.get('request')
        if request and request.user.is_authenticated:
            return obj.unread_count(request.user)
        return 0
    
    def get_other_participant(self, obj):
        request = self.context.get('request')
        if request and request.user.is_authenticated:
            other_user = obj.get_other_participant(request.user)
            if other_user:
                return {
                    'id': other_user.id,
                    'username': other_user.username,
                    'first_name': other_user.first_name,
                    'last_name': other_user.last_name,
                    'avatar': request.build_absolute_uri(other_user.avatar.url) if other_user.avatar else None,
                    'city': other_user.city
                }
        return None

class ChatCreateSerializer(serializers.ModelSerializer):
    participant_id = serializers.IntegerField(write_only=True)
    
    class Meta:
        model = Chat
        fields = ['participant_id']
    
    def create(self, validated_data):
        participant_id = validated_data.pop('participant_id')
        current_user = self.context['request'].user
        
        # Проверяем, существует ли уже чат между этими пользователями
        existing_chat = Chat.objects.filter(
            participants=current_user
        ).filter(
            participants__id=participant_id
        ).first()
        
        if existing_chat:
            return existing_chat
        
        # Создаем новый чат
        chat = Chat.objects.create()
        
        # Получаем объект пользователя по ID
        try:
            participant_user = User.objects.get(id=participant_id)
            chat.participants.add(current_user, participant_user)
        except User.DoesNotExist:
            raise serializers.ValidationError("Пользователь не найден")
        
        return chat

class ChatMessageCreateSerializer(serializers.ModelSerializer):
    class Meta:
        model = ChatMessage
        fields = ['content', 'message_type', 'file', 'reply_to']
    
    def create(self, validated_data):
        chat = self.context['chat']
        sender = self.context['request'].user
        
        print(f"Создаем сообщение: Chat={chat.id}, Sender={sender.id}, Content='{validated_data.get('content', '')}'")
        
        message = ChatMessage.objects.create(
            chat=chat,
            sender=sender,
            **validated_data
        )
        
        print(f"Сообщение создано с ID: {message.id}")
        
        # Обновляем время последнего обновления чата
        chat.updated_at = timezone.now()
        chat.save()
        
        return message