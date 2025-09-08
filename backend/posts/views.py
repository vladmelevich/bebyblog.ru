from rest_framework import generics, status, permissions
from rest_framework.response import Response
from rest_framework.decorators import api_view, permission_classes
from rest_framework.pagination import PageNumberPagination
from django.shortcuts import get_object_or_404
from django.db.models import Q, Count
from django.utils import timezone
from django.core.cache import cache
import time

from .models import Post, Category, Comment, Like
from .serializers import (
    PostListSerializer, PostDetailSerializer, PostCreateSerializer, PostUpdateSerializer,
    CategorySerializer, CommentSerializer, CommentCreateSerializer, LikeSerializer
)
from users.models import PostArchive

class PostPagination(PageNumberPagination):
    """Пагинация для постов"""
    page_size = 10
    page_size_query_param = 'page_size'
    max_page_size = 100

class CategoryListView(generics.ListAPIView):
    """Список категорий"""
    queryset = Category.objects.all()
    serializer_class = CategorySerializer
    permission_classes = [permissions.AllowAny]

class PostListView(generics.ListAPIView):
    """Список опубликованных постов"""
    serializer_class = PostListSerializer
    pagination_class = PostPagination
    permission_classes = [permissions.AllowAny]
    
    def list(self, request, *args, **kwargs):
        print(f"=== PostListView.list ===")
        response = super().list(request, *args, **kwargs)
        print(f"Ответ содержит {len(response.data.get('results', []))} постов")
        return response
    
    def get_serializer_context(self):
        return {'request': self.request}
    
    def get_queryset(self):
        print(f"=== PostListView.get_queryset ===")
        print(f"Пользователь: {self.request.user.username if self.request.user.is_authenticated else 'Anonymous'}")
        print(f"Параметры запроса: {self.request.query_params}")
        
        # Базовый queryset - только опубликованные посты
        queryset = Post.objects.filter(status='published').select_related('author', 'category').prefetch_related('likes', 'comments')
        
        # Если запрашиваются посты конкретного автора и пользователь аутентифицирован
        author_id = self.request.query_params.get('author')
        if author_id and author_id != 'undefined' and self.request.user.is_authenticated:
            print(f"Запрашиваются посты автора: {author_id}")
            print(f"Текущий пользователь ID: {self.request.user.id}")
            
            # Если пользователь запрашивает свои посты, показываем все (включая черновики)
            if str(self.request.user.id) == str(author_id):
                print("Пользователь запрашивает свои посты - показываем все (включая черновики)")
                queryset = Post.objects.filter(author_id=author_id).select_related('author', 'category').prefetch_related('likes', 'comments')
            else:
                print("Пользователь запрашивает посты другого пользователя - показываем только опубликованные")
                # Если запрашиваются посты другого пользователя, показываем только опубликованные
                queryset = Post.objects.filter(author_id=author_id, status='published').select_related('author', 'category').prefetch_related('likes', 'comments')
        
        # Фильтрация по категории
        category_slug = self.request.query_params.get('category')
        if category_slug:
            queryset = queryset.filter(category__slug=category_slug)
        
        # Фильтрация по друзьям (только посты тех, на кого подписан пользователь)
        friends_only = self.request.query_params.get('friends_only')
        if friends_only and self.request.user.is_authenticated:
            from users.models import Follow
            # Получаем ID пользователей, на которых подписан текущий пользователь
            following_ids = Follow.objects.filter(follower=self.request.user).values_list('following_id', flat=True)
            # Показываем только посты тех, на кого подписан пользователь (не включая свои)
            queryset = queryset.filter(author_id__in=following_ids)
        
        # Поиск
        search = self.request.query_params.get('search')
        if search:
            queryset = queryset.filter(
                Q(title__icontains=search) |
                Q(content__icontains=search) |
                Q(short_description__icontains=search)
            )
        
        # Сортировка
        sort = self.request.query_params.get('sort', 'newest')
        if sort == 'popular':
            queryset = queryset.order_by('-likes_count')
        elif sort == 'oldest':
            queryset = queryset.order_by('published_at')
        else:  # newest
            queryset = queryset.order_by('-created_at')  # Используем created_at для черновиков
        
        print(f"Количество постов в queryset: {queryset.count()}")
        for post in queryset[:5]:  # Показываем первые 5 постов для отладки
            print(f"Пост: {post.title} (ID: {post.id}, Статус: {post.status})")
        
        return queryset

class PostDetailView(generics.RetrieveAPIView):
    """Детальный просмотр поста"""
    serializer_class = PostDetailSerializer
    permission_classes = [permissions.AllowAny]
    lookup_field = 'slug'
    
    def get_queryset(self):
        """Получаем queryset в зависимости от статуса пользователя"""
        # Базовый queryset - только опубликованные посты
        queryset = Post.objects.filter(status='published').select_related('author', 'category').prefetch_related('comments', 'likes')
        
        # Если пользователь аутентифицирован, проверяем, является ли он автором
        if self.request.user.is_authenticated:
            # Получаем slug из URL
            slug = self.kwargs.get('slug')
            if slug:
                # Проверяем, есть ли черновик с таким slug у текущего пользователя
                draft_post = Post.objects.filter(
                    slug=slug, 
                    author=self.request.user, 
                    status='draft'
                ).select_related('author', 'category').prefetch_related('comments', 'likes').first()
                
                if draft_post:
                    # Если это черновик автора, возвращаем queryset, включающий этот пост
                    return Post.objects.filter(
                        Q(status='published') | 
                        Q(id=draft_post.id)
                    ).select_related('author', 'category').prefetch_related('comments', 'likes')
        
        return queryset
    
    def retrieve(self, request, *args, **kwargs):
        start_time = time.time()
        print(f"=== PostDetailView.retrieve вызван для slug: {kwargs.get('slug')} ===")
        print(f"Пользователь: {request.user.username if request.user.is_authenticated else 'Anonymous'} (ID: {request.user.id if request.user.is_authenticated else 'None'})")
        
        try:
            # Получаем пост
            post = self.get_object()
            print(f"Пост найден: {post.title} (ID: {post.id}, Статус: {post.status}, Автор: {post.author.username})")
            
            # Счетчик просмотров отключен
            print("Счетчик просмотров отключен")
            
            # Получаем комментарии только для опубликованных постов
            if post.can_comment:
                comments = post.comments.filter(is_approved=True).select_related('author')
            else:
                comments = []
            
            # Сериализуем данные
            serializer = self.get_serializer(post, context={'request': request})
            data = serializer.data
            data['comments'] = CommentSerializer(comments, many=True, context={'request': request}).data
            
            execution_time = time.time() - start_time
            print(f"Получение поста выполнено за {execution_time:.3f} секунд")
            
            return Response(data)
        except Exception as e:
            print(f"Ошибка при получении поста: {e}")
            raise

class PostCreateView(generics.CreateAPIView):
    """Создание нового поста"""
    serializer_class = PostCreateSerializer
    permission_classes = [permissions.IsAuthenticated]
    
    def create(self, request, *args, **kwargs):
        start_time = time.time()
        
        print(f"=== PostCreateView.create ===")
        print(f"Данные запроса: {request.data}")
        print(f"Пользователь: {request.user.username} (ID: {request.user.id})")
        
        try:
            serializer = self.get_serializer(data=request.data)
            
            if not serializer.is_valid():
                print(f"Ошибки валидации: {serializer.errors}")
                return Response({
                    'success': False,
                    'message': 'Ошибка валидации данных',
                    'errors': serializer.errors
                }, status=status.HTTP_400_BAD_REQUEST)
            
            print(f"Валидные данные: {serializer.validated_data}")
            
            # Создаем пост
            post = serializer.save()
            
            print(f"Пост создан: {post.title} (ID: {post.id}, Статус: {post.status})")
            
            execution_time = time.time() - start_time
            print(f"Создание поста выполнено за {execution_time:.3f} секунд")
            
            return Response({
                'success': True,
                'message': 'Пост успешно создан',
                'post': PostDetailSerializer(post, context={'request': request}).data,
                'execution_time': execution_time
            }, status=status.HTTP_201_CREATED)
            
        except Exception as e:
            print(f"Ошибка при создании поста: {str(e)}")
            return Response({
                'success': False,
                'message': f'Ошибка при создании поста: {str(e)}'
            }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

class PostUpdateView(generics.UpdateAPIView):
    """Обновление поста"""
    serializer_class = PostUpdateSerializer
    permission_classes = [permissions.IsAuthenticated]
    lookup_field = 'slug'
    
    def get_queryset(self):
        return Post.objects.filter(author=self.request.user)
    
    def update(self, request, *args, **kwargs):
        start_time = time.time()
        
        print(f"=== PostUpdateView.update вызван для slug: {kwargs.get('slug')} ===")
        print(f"Пользователь: {request.user.username} (ID: {request.user.id})")
        print(f"Метод запроса: {request.method}")
        print(f"Данные запроса: {request.data}")
        
        partial = kwargs.pop('partial', False)
        instance = self.get_object()
        print(f"Пост для обновления: {instance.title} (ID: {instance.id}, Автор: {instance.author.username})")
        
        # Проверяем, что пользователь является автором поста
        if instance.author != request.user:
            print("ОШИБКА: Пользователь не является автором поста!")
            return Response({
                'error': 'У вас нет прав для редактирования этого поста'
            }, status=status.HTTP_403_FORBIDDEN)
        
        serializer = self.get_serializer(instance, data=request.data, partial=partial)
        serializer.is_valid(raise_exception=True)
        
        # Обновляем пост
        post = serializer.save()
        print(f"Пост {post.title} успешно обновлен")
        
        execution_time = time.time() - start_time
        print(f"Обновление поста выполнено за {execution_time:.3f} секунд")
        
        return Response({
            'success': True,
            'message': 'Пост успешно обновлен',
            'post': PostDetailSerializer(post, context={'request': request}).data,
            'execution_time': execution_time
        })

class PostDeleteView(generics.DestroyAPIView):
    """Удаление поста"""
    permission_classes = [permissions.IsAuthenticated]
    lookup_field = 'slug'
    
    def get_queryset(self):
        print(f"=== PostDeleteView.get_queryset ===")
        print(f"Пользователь: {self.request.user.username} (ID: {self.request.user.id})")
        
        queryset = Post.objects.filter(author=self.request.user)
        print(f"Найдено постов пользователя: {queryset.count()}")
        for post in queryset:
            print(f"  - ID: {post.id}, Заголовок: {post.title}, Slug: {post.slug}, Статус: {post.status}")
        
        return queryset
    
    def destroy(self, request, *args, **kwargs):
        start_time = time.time()
        
        print(f"=== PostDeleteView.destroy вызван для slug: {kwargs.get('slug')} ===")
        print(f"Пользователь: {request.user.username} (ID: {request.user.id})")
        
        instance = self.get_object()
        print(f"Пост для удаления: {instance.title} (ID: {instance.id}, Автор: {instance.author.username})")
        
        # Проверяем, что пользователь является автором поста
        if instance.author != request.user:
            print("ОШИБКА: Пользователь не является автором поста!")
            return Response({
                'error': 'У вас нет прав для удаления этого поста'
            }, status=status.HTTP_403_FORBIDDEN)
        
        self.perform_destroy(instance)
        print(f"Пост {instance.title} успешно удален из базы данных")
        
        execution_time = time.time() - start_time
        print(f"Удаление поста выполнено за {execution_time:.3f} секунд")
        
        return Response({
            'success': True,
            'message': 'Пост успешно удален',
            'execution_time': execution_time
        }, status=status.HTTP_204_NO_CONTENT)

class UserPostsView(generics.ListAPIView):
    """Посты конкретного пользователя"""
    serializer_class = PostListSerializer
    pagination_class = PostPagination
    permission_classes = [permissions.AllowAny]
    
    def get_queryset(self):
        user_id = self.kwargs.get('user_id')
        print(f"=== UserPostsView: запрашиваем посты для пользователя {user_id} ===")
        
        # Проверяем, что user_id определен и не равен 'undefined'
        if not user_id or user_id == 'undefined':
            print(f"Ошибка: user_id не определен или равен 'undefined': {user_id}")
            return Post.objects.none()
        
        # Возвращаем все посты пользователя, включая черновики
        queryset = Post.objects.filter(author_id=user_id).select_related('author', 'category').order_by('-created_at')
        
        print(f"Найдено постов: {queryset.count()}")
        for post in queryset:
            print(f"  - ID: {post.id}, Заголовок: {post.title}, Статус: {post.status}")
        
        return queryset

class CurrentUserPostsView(generics.ListAPIView):
    """Все посты текущего пользователя (включая черновики)"""
    serializer_class = PostListSerializer
    permission_classes = [permissions.IsAuthenticated]
    
    def get_queryset(self):
        return Post.objects.filter(author=self.request.user).select_related('author', 'category').order_by('-created_at')
    
    def list(self, request, *args, **kwargs):
        queryset = self.get_queryset()
        serializer = self.get_serializer(queryset, many=True)
        
        return Response({
            'success': True,
            'posts': serializer.data
        })

class PostPublishView(generics.UpdateAPIView):
    """Публикация черновика"""
    serializer_class = PostUpdateSerializer
    permission_classes = [permissions.IsAuthenticated]
    lookup_field = 'id'
    
    def get_queryset(self):
        return Post.objects.filter(author=self.request.user, status='draft')
    
    def update(self, request, *args, **kwargs):
        instance = self.get_object()
        
        # Обновляем статус на опубликованный
        instance.status = 'published'
        instance.save()
        
        serializer = PostDetailSerializer(instance, context={'request': request})
        
        return Response({
            'success': True,
            'message': 'Черновик успешно опубликован',
            'post': serializer.data
        })

class CommentCreateView(generics.CreateAPIView):
    """Создание комментария"""
    serializer_class = CommentCreateSerializer
    permission_classes = [permissions.IsAuthenticated]
    
    def create(self, request, *args, **kwargs):
        start_time = time.time()
        
        # Получаем пост по slug
        post_slug = self.kwargs.get('slug')
        post = get_object_or_404(Post, slug=post_slug, status='published')
        
        # Проверяем, разрешены ли комментарии
        if not post.can_comment:
            return Response({
                'success': False,
                'message': 'Комментарии к этому посту запрещены'
            }, status=status.HTTP_400_BAD_REQUEST)
        
        # Добавляем пост в данные запроса
        data = request.data.copy()
        data['post'] = post.id
        
        serializer = self.get_serializer(data=data)
        serializer.is_valid(raise_exception=True)
        
        # Создаем комментарий
        comment = serializer.save()
        
        execution_time = time.time() - start_time
        print(f"Создание комментария выполнено за {execution_time:.3f} секунд")
        
        return Response({
            'success': True,
            'message': 'Комментарий добавлен',
            'comment': CommentSerializer(comment, context={'request': request}).data,
            'execution_time': execution_time
        }, status=status.HTTP_201_CREATED)

class CommentDeleteView(generics.DestroyAPIView):
    """Удаление комментария"""
    serializer_class = CommentSerializer
    permission_classes = [permissions.IsAuthenticated]
    
    def get_serializer_context(self):
        return {'request': self.request}
    
    def get_queryset(self):
        # Пользователь может удалять только свои комментарии
        return Comment.objects.filter(author=self.request.user)
    
    def destroy(self, request, *args, **kwargs):
        comment = self.get_object()
        comment.delete()
        
        return Response({
            'success': True,
            'message': 'Комментарий удален'
        }, status=status.HTTP_200_OK)

@api_view(['POST'])
@permission_classes([permissions.IsAuthenticated])
def toggle_like(request, post_slug):
    """Переключение лайка"""
    start_time = time.time()
    
    post = get_object_or_404(Post, slug=post_slug, status='published')
    user = request.user
    
    # Проверяем, есть ли уже лайк
    like = Like.objects.filter(post=post, user=user).first()
    
    if like:
        # Удаляем лайк
        like.delete()
        message = 'Лайк убран'
        is_liked = False
    else:
        # Добавляем лайк
        Like.objects.create(post=post, user=user)
        message = 'Лайк добавлен'
        is_liked = True
    
    execution_time = time.time() - start_time
    print(f"Переключение лайка выполнено за {execution_time:.3f} секунд")
    
    return Response({
        'success': True,
        'message': message,
        'is_liked': is_liked,
        'likes_count': post.likes_count,
        'execution_time': execution_time
    })

@api_view(['GET'])
@permission_classes([permissions.AllowAny])
def search_posts(request):
    """Поиск постов"""
    start_time = time.time()
    
    query = request.query_params.get('q', '')
    if not query:
        return Response({
            'success': False,
            'message': 'Необходимо указать поисковый запрос'
        }, status=status.HTTP_400_BAD_REQUEST)
    
    # Поиск по заголовку, содержанию и краткому описанию
    posts = Post.objects.filter(
        Q(status='published') &
        (Q(title__icontains=query) | Q(content__icontains=query) | Q(short_description__icontains=query))
    ).select_related('author', 'category')
    
    serializer = PostListSerializer(posts, many=True)
    
    execution_time = time.time() - start_time
    print(f"Поиск постов выполнено за {execution_time:.3f} секунд")
    
    return Response({
        'success': True,
        'query': query,
        'results_count': len(serializer.data),
        'posts': serializer.data,
        'execution_time': execution_time
    })

@api_view(['GET'])
@permission_classes([permissions.AllowAny])
def popular_posts(request):
    """Популярные посты"""
    start_time = time.time()
    
    # Получаем посты, отсортированные по лайкам
    posts = Post.objects.filter(status='published').order_by('-likes_count')[:10]
    
    serializer = PostListSerializer(posts, many=True)
    
    execution_time = time.time() - start_time
    print(f"Получение популярных постов выполнено за {execution_time:.3f} секунд")
    
    return Response({
        'success': True,
        'posts': serializer.data,
        'execution_time': execution_time
    })

class PublishedUserPostsView(generics.ListAPIView):
    """Только опубликованные посты конкретного пользователя"""
    serializer_class = PostListSerializer
    pagination_class = PostPagination
    permission_classes = [permissions.AllowAny]
    
    def get_queryset(self):
        user_id = self.kwargs.get('user_id')
        print(f"=== PublishedUserPostsView: запрашиваем опубликованные посты для пользователя {user_id} ===")
        
        # Возвращаем только опубликованные посты пользователя
        queryset = Post.objects.filter(
            author_id=user_id, 
            status='published'
        ).select_related('author', 'category').order_by('-created_at')
        
        print(f"Найдено опубликованных постов: {queryset.count()}")
        for post in queryset:
            print(f"  - ID: {post.id}, Заголовок: {post.title}, Статус: {post.status}")
        
        return queryset
    
    def list(self, request, *args, **kwargs):
        queryset = self.get_queryset()
        serializer = self.get_serializer(queryset, many=True)
        
        return Response({
            'success': True,
            'posts': serializer.data,
            'count': queryset.count()
        })


@api_view(['POST'])
@permission_classes([permissions.IsAuthenticated])
def toggle_post_archive(request, slug):
    """
    Добавление/удаление поста из архива
    """
    try:
        # Проверяем, что пост существует
        try:
            post = Post.objects.get(slug=slug)
        except Post.DoesNotExist:
            return Response({
                'success': False,
                'message': 'Пост не найден'
            }, status=404)
        
        # Проверяем, есть ли пост уже в архиве
        archive_entry = PostArchive.objects.filter(
            user=request.user,
            post=post
        ).first()
        
        if archive_entry:
            # Удаляем из архива
            archive_entry.delete()
            return Response({
                'success': True,
                'message': 'Пост удален из архива',
                'is_in_archive': False
            })
        else:
            # Добавляем в архив
            PostArchive.objects.create(
                user=request.user,
                post=post
            )
            return Response({
                'success': True,
                'message': 'Пост добавлен в архив',
                'is_in_archive': True
            })
            
    except Exception as e:
        return Response({
            'success': False,
            'message': str(e)
        }, status=400)


@api_view(['GET'])
@permission_classes([permissions.IsAuthenticated])
def check_archive_status(request, slug):
    """
    Проверка статуса поста в архиве
    """
    try:
        # Проверяем, что пост существует
        try:
            post = Post.objects.get(slug=slug)
        except Post.DoesNotExist:
            return Response({
                'success': False,
                'message': 'Пост не найден'
            }, status=404)
        
        # Проверяем, есть ли пост в архиве
        is_in_archive = PostArchive.objects.filter(
            user=request.user,
            post=post
        ).exists()
        
        return Response({
            'success': True,
            'is_in_archive': is_in_archive
        })
        
    except Exception as e:
        return Response({
            'success': False,
            'message': str(e)
        }, status=400)
