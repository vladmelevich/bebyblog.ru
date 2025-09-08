from rest_framework import serializers
from .models import Post, Category, Comment, Like
from django.contrib.auth import get_user_model

User = get_user_model()

class CategorySerializer(serializers.ModelSerializer):
    """Сериализатор для категорий"""
    posts_count = serializers.SerializerMethodField()
    
    class Meta:
        model = Category
        fields = ['id', 'name', 'slug', 'description', 'posts_count']
    
    def get_posts_count(self, obj):
        return obj.posts.filter(status='published').count()

class UserSerializer(serializers.ModelSerializer):
    """Сериализатор для автора поста"""
    avatar_url = serializers.SerializerMethodField()
    
    class Meta:
        model = User
        fields = ['id', 'first_name', 'last_name', 'username', 'avatar', 'avatar_url', 'city']
    
    def get_avatar_url(self, obj):
        if obj.avatar:
            request = self.context.get('request')
            if request:
                return request.build_absolute_uri(obj.avatar.url)
            return obj.avatar.url
        return None

class CommentSerializer(serializers.ModelSerializer):
    """Сериализатор для комментариев"""
    author = UserSerializer(read_only=True)
    created_at = serializers.DateTimeField(read_only=True)
    
    class Meta:
        model = Comment
        fields = ['id', 'content', 'author', 'created_at', 'parent', 'is_approved']
        read_only_fields = ['author', 'is_approved']

class PostListSerializer(serializers.ModelSerializer):
    """Сериализатор для списка постов"""
    author = UserSerializer(read_only=True)
    category = CategorySerializer(read_only=True)
    comments_enabled = serializers.SerializerMethodField()
    created_at = serializers.DateTimeField(read_only=True)
    published_at = serializers.DateTimeField(read_only=True)
    
    class Meta:
        model = Post
        fields = [
            'id', 'title', 'slug', 'short_description', 'content', 
            'author', 'category', 'status',
            'likes_count',
            'created_at', 'published_at', 'uuid', 'comments_enabled'
        ]
    
    def get_comments_enabled(self, obj):
        """Комментарии всегда разрешены"""
        return 'enabled'

class PostDetailSerializer(serializers.ModelSerializer):
    """Сериализатор для детального просмотра поста"""
    author = UserSerializer(read_only=True)
    category = CategorySerializer(read_only=True)
    comments = serializers.SerializerMethodField()
    comments_enabled = serializers.SerializerMethodField()
    created_at = serializers.DateTimeField(read_only=True)
    published_at = serializers.DateTimeField(read_only=True)
    is_liked = serializers.SerializerMethodField()
    
    class Meta:
        model = Post
        fields = [
            'id', 'title', 'slug', 'short_description', 'content',
            'author', 'category', 'status',
            'meta_title', 'meta_description', 'meta_keywords',
            'likes_count',
            'created_at', 'published_at', 'uuid', 'comments', 'is_liked', 'comments_enabled'
        ]
    
    def get_is_liked(self, obj):
        request = self.context.get('request')
        if request and request.user.is_authenticated:
            return obj.likes.filter(user=request.user).exists()
        return False
    
    def get_comments_enabled(self, obj):
        """Комментарии всегда разрешены"""
        return 'enabled'
    
    def get_comments(self, obj):
        """Получаем только одобренные комментарии"""
        comments = obj.comments.filter(is_approved=True).select_related('author')
        return CommentSerializer(comments, many=True, context=self.context).data

class PostCreateSerializer(serializers.ModelSerializer):
    """Сериализатор для создания поста"""
    author = UserSerializer(read_only=True)
    comments_enabled = serializers.SerializerMethodField()
    
    class Meta:
        model = Post
        fields = [
            'id', 'title', 'short_description', 'content', 'author', 'category',
            'status', 'created_at', 'comments_enabled'
        ]
        read_only_fields = ['author', 'created_at', 'comments_enabled']
    
    def get_comments_enabled(self, obj):
        """Комментарии всегда разрешены"""
        return 'enabled'
    
    def create(self, validated_data):
        # Автоматически устанавливаем автора
        validated_data['author'] = self.context['request'].user
        return super().create(validated_data)
    
    def validate_title(self, value):
        """Проверяем уникальность заголовка"""
        # Проверяем только среди постов текущего пользователя
        user = self.context['request'].user
        if Post.objects.filter(title=value, author=user).exists():
            raise serializers.ValidationError("У вас уже есть пост с таким заголовком")
        return value
    
    def validate_slug(self, value):
        """Проверяем slug на проблематичные значения"""
        if value:
            problematic_slugs = ['post', 'api', 'admin', 'static', 'media', 'login', 'register', 'logout', 'create', 'edit', 'delete']
            if value in problematic_slugs:
                raise serializers.ValidationError(f"Slug '{value}' зарезервирован системой. Используйте другой slug.")
        return value

class PostUpdateSerializer(serializers.ModelSerializer):
    """Сериализатор для обновления поста"""
    author = UserSerializer(read_only=True)
    comments_enabled = serializers.SerializerMethodField()
    
    class Meta:
        model = Post
        fields = [
            'id', 'title', 'short_description', 'content', 'author', 'category',
            'status', 'updated_at', 'comments_enabled'
        ]
        read_only_fields = ['author', 'updated_at', 'comments_enabled']
    
    def get_comments_enabled(self, obj):
        """Комментарии всегда разрешены"""
        return 'enabled'
    
    def validate_slug(self, value):
        """Проверяем slug на проблематичные значения"""
        if value:
            problematic_slugs = ['post', 'api', 'admin', 'static', 'media', 'login', 'register', 'logout', 'create', 'edit', 'delete']
            if value in problematic_slugs:
                raise serializers.ValidationError(f"Slug '{value}' зарезервирован системой. Используйте другой slug.")
        return value

class CommentCreateSerializer(serializers.ModelSerializer):
    """Сериализатор для создания комментария"""
    author = UserSerializer(read_only=True)
    
    class Meta:
        model = Comment
        fields = ['id', 'content', 'post', 'parent', 'author', 'created_at']
        read_only_fields = ['author', 'created_at']
    
    def create(self, validated_data):
        # Автоматически устанавливаем автора
        validated_data['author'] = self.context['request'].user
        # Автоматически одобряем комментарии (можно убрать для модерации)
        validated_data['is_approved'] = True
        return super().create(validated_data)
    
    def validate(self, attrs):
        # Комментарии всегда разрешены
        return attrs

class LikeSerializer(serializers.ModelSerializer):
    """Сериализатор для лайков"""
    user = UserSerializer(read_only=True)
    
    class Meta:
        model = Like
        fields = ['id', 'post', 'user', 'created_at']
        read_only_fields = ['user', 'created_at']
    
    def create(self, validated_data):
        # Автоматически устанавливаем пользователя
        validated_data['user'] = self.context['request'].user
        return super().create(validated_data)
