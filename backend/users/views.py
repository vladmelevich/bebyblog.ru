import asyncio

import time
import hashlib
from asgiref.sync import sync_to_async
from django.core.cache import cache
from django.conf import settings
from .serializers import (
    UserRegistrationSerializer, 
    UserLoginSerializer, 
    UserDetailSerializer,
    UserProfileWithPostsSerializer,
    FollowSerializer,
    NotificationSerializer,
    UserSearchSerializer
)
from django.contrib.auth import get_user_model
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.response import Response
from rest_framework import status, generics, permissions
from rest_framework.decorators import api_view, permission_classes
from rest_framework_simplejwt.tokens import RefreshToken
from datetime import timedelta
from concurrent.futures import ThreadPoolExecutor
from django.db import transaction, models
from .cache_utils import cache_user_data, get_cached_user, clear_user_cache, update_user_cache, get_cache_stats
from .models import Follow, Notification, PostArchive, SharedPost
from .serializers import ChildSerializer
from .models import Child
from posts.models import Post
from .serializers import ChatSerializer, ChatCreateSerializer, ChatMessageSerializer, ChatMessageCreateSerializer
from .models import Chat, ChatMessage, User
from .performance_monitor import PerformanceMonitor, profile_function
from rest_framework.views import APIView
from django.http import JsonResponse
from django.views.decorators.csrf import csrf_exempt
from django.utils.decorators import method_decorator
from django.utils import timezone
import json
import logging


User = get_user_model()
executor = ThreadPoolExecutor(max_workers=5)

# Асинхронные функции для работы с БД
@sync_to_async
def async_get_user_by_email(email):
    return User.objects.select_related().get(email=email)

@sync_to_async
def async_check_user_password(user, password):
    return user.check_password(password)

@sync_to_async
def async_create_jwt_tokens(user, remember_me):
    refresh = RefreshToken.for_user(user)
    if remember_me:
        access_token_lifetime = timedelta(days=30)
        refresh_token_lifetime = timedelta(days=60)
    else:
        access_token_lifetime = timedelta(days=1)
        refresh_token_lifetime = timedelta(days=7)
    
    refresh.access_token.set_exp(lifetime=access_token_lifetime)
    refresh.set_exp(lifetime=refresh_token_lifetime)
    
    return str(refresh.access_token), str(refresh)

@sync_to_async
def async_get_cached_user(cache_key):
    return cache.get(cache_key)

@sync_to_async
def async_set_cached_user(cache_key, user, timeout=300):
    return cache.set(cache_key, user, timeout)


class FastUserRegistrationView(generics.CreateAPIView):
    """
    Быстрая регистрация пользователей с асинхронными операциями
    """
    serializer_class = UserRegistrationSerializer
    permission_classes = [permissions.AllowAny]
    
    def create(self, request, *args, **kwargs):
        start_time = time.time()
        try:
            
            serializer = self.get_serializer(data=request.data, context={'request': request})
            serializer.is_valid(raise_exception=True)
            
            
            # Асинхронное создание пользователя
            def create_user_async():
                with transaction.atomic():
                    validated_data = serializer.validated_data.copy()
                    validated_data.pop('confirm_password', None)
                    
                    # Создаем пользователя
                    user = User.objects.create_user(**validated_data)
                    
                    # Кэшируем пользователя для быстрого доступа
                    cache_user_data(user)
                    
                    return user
            
            # Выполняем создание в отдельном потоке
            with ThreadPoolExecutor(max_workers=1) as executor:
                future = executor.submit(create_user_async)
                user = future.result()
            
            
            # Асинхронное создание токенов
            def create_tokens_async():
                refresh = RefreshToken.for_user(user)
                access_token = refresh.access_token
                return str(access_token), str(refresh)
            
            # Создаем токены в отдельном потоке
            with ThreadPoolExecutor(max_workers=1) as executor:
                future = executor.submit(create_tokens_async)
                access_token, refresh_token = future.result()
            
            # Сериализация пользователя
            user_serializer = UserDetailSerializer(user, context={'request': request})
            
            execution_time = time.time() - start_time
            
            return Response({
                'success': True,
                'message': 'Пользователь успешно зарегистрирован',
                'id': user.id,
                'email': user.email,
                'username': user.username,
                'first_name': user.first_name,
                'last_name': user.last_name,
                'name': user.full_name,
                'user': user_serializer.data,
                'access_token': access_token,
                'access': access_token,
                'refresh_token': refresh_token,
                'refresh': refresh_token,
                'tokens': {
                    'access': access_token,
                    'refresh': refresh_token,
                },
                'execution_time': execution_time
            }, status=status.HTTP_201_CREATED)
            
        except Exception as e:
            execution_time = time.time() - start_time
            return Response({
                'success': False,
                'message': str(e)
            }, status=status.HTTP_400_BAD_REQUEST)


class FastUserLoginView(generics.GenericAPIView):
    serializer_class = UserLoginSerializer
    permission_classes = [AllowAny]

    def post(self, request, *args, **kwargs):
        start_time = time.time()
        
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        
        email = serializer.validated_data['email']
        password = serializer.validated_data['password']
        remember_me = serializer.validated_data.get('remember_me', False)
        
        
        # Кэширование для ускорения повторных запросов
        cached_user = get_cached_user(email=email)
        
        try:
            if cached_user:
                user = cached_user
            else:
                # Оптимизированный запрос с select_related
                user = User.objects.select_related().get(email=email)
                # Кэшируем пользователя
                cache_user_data(user)
            
            # Быстрая проверка пароля
            if user.check_password(password):
                # Асинхронное создание токенов
                def create_tokens():
                    refresh = RefreshToken.for_user(user)
                    if remember_me:
                        access_token_lifetime = timedelta(days=30)
                        refresh_token_lifetime = timedelta(days=60)
                    else:
                        access_token_lifetime = timedelta(days=1)
                        refresh_token_lifetime = timedelta(days=7)
                    
                    refresh.access_token.set_exp(lifetime=access_token_lifetime)
                    refresh.set_exp(lifetime=refresh_token_lifetime)
                    
                    return str(refresh.access_token), str(refresh)
                
                # Выполняем создание токенов в отдельном потоке
                with ThreadPoolExecutor(max_workers=1) as executor:
                    future = executor.submit(create_tokens)
                    access_token, refresh_token = future.result()
                
                # Сериализация пользователя
                user_serializer = UserDetailSerializer(user, context={'request': request})
                user_data = user_serializer.data
                
                execution_time = time.time() - start_time
                
                return Response({
                    'success': True,
                    'message': 'Авторизация успешна',
                    'access_token': access_token,
                    'access': access_token,
                    'refresh_token': refresh_token,
                    'refresh': refresh_token,
                    'execution_time': execution_time,
                    **user_data  # Распаковываем все данные пользователя напрямую
                })
            else:
                return Response({
                    'success': False,
                    'message': 'Неверный пароль'
                }, status=400)
                
        except User.DoesNotExist:
            return Response({
                'success': False,
                'message': 'Пользователь не найден'
            }, status=400)
        except Exception as e:
            return Response({
                'success': False,
                'message': 'Ошибка сервера'
            }, status=500)


class FastUserProfileView(generics.RetrieveUpdateAPIView):
    """
    Быстрое получение и обновление профиля пользователя
    """
    serializer_class = UserDetailSerializer
    permission_classes = [permissions.IsAuthenticated]
    
    def get_object(self):
        return self.request.user
    
    def retrieve(self, request, *args, **kwargs):
        start_time = time.time()
        try:
            user = self.get_object()
            
            # Проверяем кэш
            cache_key = f"user_profile_{user.id}"
            cached_profile = cache.get(cache_key)
            
            if cached_profile:
                serializer = self.get_serializer(cached_profile)
            else:
                serializer = self.get_serializer(user)
                # Кэшируем профиль на 10 минут
                cache.set(cache_key, user, 600)
            
            execution_time = time.time() - start_time
            
            return Response({
                'success': True,
                'user': serializer.data,
                'execution_time': execution_time
            }, status=status.HTTP_200_OK)
        except Exception as e:
            execution_time = time.time() - start_time
            return Response({
                'success': False,
                'message': str(e)
            }, status=status.HTTP_400_BAD_REQUEST)
    
    def update(self, request, *args, **kwargs):
        start_time = time.time()
        try:
            user = self.get_object()
            serializer = self.get_serializer(user, data=request.data, partial=True)
            serializer.is_valid(raise_exception=True)
            
            # Асинхронное обновление пользователя
            def update_user_async():
                with transaction.atomic():
                    for attr, value in serializer.validated_data.items():
                        setattr(user, attr, value)
                    user.save()
                    
                    # Обновляем кэш
                    cache_key = f"user_auth_{user.email}"
                    cache.set(cache_key, user, 300)
                    
                    profile_cache_key = f"user_profile_{user.id}"
                    cache.set(profile_cache_key, user, 600)
                    
                    return user
            
            # Выполняем обновление в отдельном потоке
            with ThreadPoolExecutor(max_workers=1) as executor:
                future = executor.submit(update_user_async)
                updated_user = future.result()
            
            execution_time = time.time() - start_time
            
            return Response({
                'success': True,
                'message': 'Профиль успешно обновлен',
                'user': UserDetailSerializer(updated_user, context={'request': request}).data,
                'execution_time': execution_time
            }, status=status.HTTP_200_OK)
            
        except Exception as e:
            execution_time = time.time() - start_time
            return Response({
                'success': False,
                'message': str(e)
            }, status=status.HTTP_400_BAD_REQUEST)


@api_view(['POST'])
@permission_classes([permissions.IsAuthenticated])
def logout_view(request):
    """
    Выход из системы
    """
    try:
        refresh_token = request.data.get('refresh_token')
        if refresh_token:
            token = RefreshToken(refresh_token)
            token.blacklist()
        
        return Response({
            'success': True,
            'message': 'Успешный выход из системы'
        }, status=status.HTTP_200_OK)
        
    except Exception as e:
        return Response({
            'success': False,
            'message': str(e)
        }, status=status.HTTP_400_BAD_REQUEST)


@api_view(['GET'])
@permission_classes([permissions.IsAuthenticated])
def user_info_view(request):
    """
    Получение информации о текущем пользователе
    """
    try:
        user = request.user
        serializer = UserDetailSerializer(user, context={'request': request})
        return Response({
            'success': True,
            'id': user.id,
            'email': user.email,
            'username': user.username,
            'first_name': user.first_name,
            'last_name': user.last_name,
            'name': user.full_name,
            'user': serializer.data
        }, status=status.HTTP_200_OK)
        
    except Exception as e:
        return Response({
            'success': False,
            'message': str(e)
        }, status=status.HTTP_400_BAD_REQUEST)


class UserLogoutView(generics.GenericAPIView):
    permission_classes = [IsAuthenticated]

    def post(self, request):
        start_time = time.time()
        try:
            user = request.user
            refresh_token = request.data.get('refresh')
            
            if refresh_token:
                token = RefreshToken(refresh_token)
                token.blacklist()
            
            # Очищаем кэш пользователя
            clear_user_cache(user)
            
            execution_time = time.time() - start_time
            
            return Response({
                'success': True,
                'message': 'Успешный выход',
                'execution_time': execution_time
            })
        except Exception as e:
            execution_time = time.time() - start_time
            return Response({
                'success': False,
                'message': 'Ошибка при выходе'
            }, status=400)


class UserDetailView(generics.RetrieveUpdateAPIView):
    serializer_class = UserDetailSerializer
    permission_classes = [IsAuthenticated]

    def get_object(self):
        return self.request.user
    
    def retrieve(self, request, *args, **kwargs):
        start_time = time.time()
        try:
            user = self.get_object()
            
            # Проверяем кэш
            cache_key = f"user_detail_{user.id}"
            cached_user = cache.get(cache_key)
            
            if cached_user:
                serializer = self.get_serializer(cached_user, context={'request': request})
            else:
                serializer = self.get_serializer(user, context={'request': request})
                # Кэшируем на 5 минут
                cache.set(cache_key, user, 300)
            
            execution_time = time.time() - start_time
            
            return Response({
                'success': True,
                'user': serializer.data,
                'execution_time': execution_time
            })
        except Exception as e:
            execution_time = time.time() - start_time
            return Response({
                'success': False,
                'message': str(e)
            }, status=400)
    
    def update(self, request, *args, **kwargs):
        start_time = time.time()
        try:
            user = self.get_object()
            
            # Обрабатываем данные с учетом файлов
            data = request.data.copy()
            if request.FILES:
                data.update(request.FILES)
            
            serializer = self.get_serializer(user, data=data, partial=True, context={'request': request})
            serializer.is_valid(raise_exception=True)
            
            
            # Обновляем пользователя
            for attr, value in serializer.validated_data.items():
                setattr(user, attr, value)
            user.save()
            
            # Обновляем все кэши
            cache_keys = [
                f"user_auth_{user.email}",
                f"user_profile_{user.id}",
                f"user_detail_{user.id}"
            ]
            for key in cache_keys:
                cache.set(key, user, 300)
            
            execution_time = time.time() - start_time
            
            return Response({
                'success': True,
                'message': 'Данные пользователя обновлены',
                'user': UserDetailSerializer(user, context={'request': request}).data,
                'execution_time': execution_time
            })
        except Exception as e:
            execution_time = time.time() - start_time
            return Response({
                'success': False,
                'message': str(e)
            }, status=400)


class PerformanceMonitorView(generics.GenericAPIView):
    """
    Мониторинг производительности системы
    """
    permission_classes = [IsAuthenticated]
    
    def get(self, request):
        try:
            cache_stats = get_cache_stats()
            
            return Response({
                'success': True,
                'cache_stats': cache_stats,
                'message': 'Статистика производительности получена'
            })
        except Exception as e:
            return Response({
                'success': False,
                'message': str(e)
            }, status=400)


class UserProfileView(generics.RetrieveAPIView):
    """
    Получение профиля пользователя по ID
    """
    serializer_class = UserDetailSerializer
    permission_classes = [permissions.AllowAny]
    queryset = User.objects.all()
    
    def retrieve(self, request, *args, **kwargs):
        try:
            user = self.get_object()
            serializer = self.get_serializer(user, context={'request': request})
            
            return Response({
                'success': True,
                'user': serializer.data
            })
        except Exception as e:
            return Response({
                'success': False,
                'message': str(e)
            }, status=400)


class CurrentUserProfileView(generics.RetrieveAPIView):
    """
    Получение профиля текущего пользователя
    """
    serializer_class = UserDetailSerializer
    permission_classes = [IsAuthenticated]
    
    def get_object(self):
        return self.request.user
    
    def retrieve(self, request, *args, **kwargs):
        try:
            user = self.get_object()
            serializer = self.get_serializer(user, context={'request': request})
            
            return Response({
                'success': True,
                'user': serializer.data
            })
        except Exception as e:
            return Response({
                'success': False,
                'message': str(e)
            }, status=400)


class UserSearchView(generics.ListAPIView):
    """Поиск пользователей"""
    serializer_class = UserSearchSerializer
    permission_classes = [IsAuthenticated]
    
    def get_queryset(self):
        query = self.request.query_params.get('q', '')
        if not query:
            return User.objects.none()
        
        # Создаем ключ кэша на основе запроса
        cache_key = f"user_search_{hashlib.md5(query.encode()).hexdigest()}"
        
        # Проверяем кэш
        cached_results = cache.get(cache_key)
        if cached_results is not None:
            return cached_results
        
        # Выполняем поиск
        results = User.objects.select_related().filter(
            models.Q(username__icontains=query) |
            models.Q(first_name__icontains=query) |
            models.Q(last_name__icontains=query)
        ).exclude(id=self.request.user.id)[:20]  # Ограничиваем результаты для производительности
        
        # Кэшируем результаты на 5 минут
        cache.set(cache_key, results, 300)
        
        return results
    
    def list(self, request, *args, **kwargs):
        queryset = self.get_queryset()
        serializer = self.get_serializer(queryset, many=True, context={'request': request})
        
        return Response({
            'success': True,
            'users': serializer.data
        })


class FollowView(generics.CreateAPIView):
    """Подписка на пользователя"""
    permission_classes = [IsAuthenticated]
    
    def create(self, request, *args, **kwargs):
        try:
            user_id = self.kwargs.get('user_id')
            if not user_id:
                return Response({'success': False, 'message': 'ID пользователя обязателен'}, status=400)
            
            user_to_follow = User.objects.get(id=user_id)
            if user_to_follow == request.user:
                return Response({'success': False, 'message': 'Нельзя подписаться на себя'}, status=400)
            
            # Проверяем, не подписаны ли уже
            if Follow.objects.filter(follower=request.user, following=user_to_follow).exists():
                return Response({'success': False, 'message': 'Вы уже подписаны на этого пользователя'}, status=400)
            
            # Создаем подписку
            follow = Follow.objects.create(follower=request.user, following=user_to_follow)
            
            # Создаем уведомление
            notification = Notification.objects.create(
                recipient=user_to_follow,
                sender=request.user,
                notification_type='follow',
                message=f'{request.user.first_name or request.user.username} подписался на вас'
            )
            
            
            return Response({
                'success': True, 
                'message': 'Подписка выполнена',
                'follow_id': follow.id,
                'notification_id': notification.id
            })
        except User.DoesNotExist:
            return Response({'success': False, 'message': 'Пользователь не найден'}, status=404)
        except Exception as e:
            return Response({'success': False, 'message': str(e)}, status=400)


class UnfollowView(generics.CreateAPIView):
    """Отписка от пользователя"""
    permission_classes = [IsAuthenticated]
    
    def create(self, request, *args, **kwargs):
        try:
            user_id = self.kwargs.get('user_id')
            if not user_id:
                return Response({'success': False, 'message': 'ID пользователя обязателен'}, status=400)
            
            user_to_unfollow = User.objects.get(id=user_id)
            
            # Удаляем подписку
            follow = Follow.objects.filter(follower=request.user, following=user_to_unfollow)
            if follow.exists():
                follow.delete()
                return Response({'success': True, 'message': 'Отписка выполнена'})
            else:
                return Response({'success': False, 'message': 'Вы не подписаны на этого пользователя'}, status=400)
        except User.DoesNotExist:
            return Response({'success': False, 'message': 'Пользователь не найден'}, status=404)
        except Exception as e:
            return Response({'success': False, 'message': str(e)}, status=400)


class FollowersListView(generics.ListAPIView):
    """Список подписчиков (кто подписан на меня)"""
    serializer_class = UserSearchSerializer
    permission_classes = [IsAuthenticated]
    
    def get_queryset(self):
        # Подписчики - это те, кто подписан на текущего пользователя
        # Ищем пользователей, которые подписаны на текущего пользователя
        queryset = User.objects.filter(following__following=self.request.user)
        return queryset
    
    def list(self, request, *args, **kwargs):
        queryset = self.get_queryset()
        serializer = self.get_serializer(queryset, many=True, context={'request': request})
        
        return Response({
            'success': True,
            'followers': serializer.data
        })


class FollowingListView(generics.ListAPIView):
    """Список подписок (на кого подписан я)"""
    serializer_class = UserSearchSerializer
    permission_classes = [IsAuthenticated]
    
    def get_queryset(self):
        # Подписки - это те, на кого подписан текущий пользователь
        # Ищем пользователей, на которых подписан текущий пользователь
        queryset = User.objects.filter(followers__follower=self.request.user)
        return queryset
    
    def list(self, request, *args, **kwargs):
        queryset = self.get_queryset()
        serializer = self.get_serializer(queryset, many=True, context={'request': request})
        
        return Response({
            'success': True,
            'following': serializer.data
        })


class NotificationsListView(generics.ListAPIView):
    """Список уведомлений"""
    serializer_class = NotificationSerializer
    permission_classes = [IsAuthenticated]
    
    def get_queryset(self):
        # Кэшируем уведомления пользователя
        cache_key = f"notifications_{self.request.user.id}"
        cached_notifications = cache.get(cache_key)
        
        if cached_notifications is not None:
            return cached_notifications
        
        # Оптимизированный запрос с select_related
        notifications = Notification.objects.filter(recipient=self.request.user).select_related(
            'sender', 'post'
        ).order_by('-created_at')[:50]  # Ограничиваем количество для производительности
        
        # Кэшируем на 2 минуты
        cache.set(cache_key, notifications, 120)
        
        return notifications
    
    def list(self, request, *args, **kwargs):
        queryset = self.get_queryset()
        serializer = self.get_serializer(queryset, many=True, context={'request': request})
        
        # Кэшируем количество непрочитанных уведомлений
        unread_cache_key = f"unread_count_{request.user.id}"
        unread_count = cache.get(unread_cache_key)
        
        if unread_count is None:
            unread_count = Notification.objects.filter(recipient=request.user, is_read=False).count()
            cache.set(unread_cache_key, unread_count, 60)  # Кэшируем на 1 минуту
        
        return Response({
            'success': True,
            'notifications': serializer.data,
            'unread_count': unread_count
        })


class MarkNotificationAsReadView(generics.CreateAPIView):
    """Отметить уведомление как прочитанное"""
    permission_classes = [IsAuthenticated]
    
    def create(self, request, *args, **kwargs):
        try:
            notification_id = self.kwargs.get('notification_id')
            if not notification_id:
                return Response({'success': False, 'message': 'ID уведомления обязателен'}, status=400)
            
            notification = Notification.objects.get(id=notification_id, recipient=request.user)
            notification.is_read = True
            notification.save()
            
            return Response({'success': True, 'message': 'Уведомление отмечено как прочитанное'})
        except Notification.DoesNotExist:
            return Response({'success': False, 'message': 'Уведомление не найдено'}, status=404)
        except Exception as e:
            return Response({'success': False, 'message': str(e)}, status=400)


class MarkAllNotificationsAsReadView(generics.CreateAPIView):
    """Отметить все уведомления как прочитанные"""
    permission_classes = [IsAuthenticated]
    
    def create(self, request, *args, **kwargs):
        try:
            Notification.objects.filter(recipient=request.user, is_read=False).update(is_read=True)
            return Response({'success': True, 'message': 'Все уведомления отмечены как прочитанные'})
        except Exception as e:
            return Response({'success': False, 'message': str(e)}, status=400)





class UserProfileWithPostsView(generics.RetrieveAPIView):
    """
    Получение профиля пользователя с постами для просмотра другими пользователями
    """
    serializer_class = UserProfileWithPostsSerializer
    permission_classes = [permissions.AllowAny]
    queryset = User.objects.all()
    
    def retrieve(self, request, *args, **kwargs):
        try:
            user = self.get_object()
            
            serializer = self.get_serializer(user, context={'request': request})
            data = serializer.data
            
            return Response({
                'success': True,
                'user': data
            })
        except Exception as e:
            return Response({
                'success': False,
                'message': str(e)
            }, status=400)


# Views для работы с детьми
class ChildrenListView(generics.ListCreateAPIView):
    """
    Получение списка детей и добавление нового ребенка
    """
    serializer_class = ChildSerializer
    permission_classes = [IsAuthenticated]
    
    def get_queryset(self):
        return Child.objects.filter(user=self.request.user)
    
    def list(self, request, *args, **kwargs):
        try:
            queryset = self.get_queryset()
            serializer = self.get_serializer(queryset, many=True)
            
            return Response({
                'success': True,
                'children': serializer.data
            })
        except Exception as e:
            return Response({
                'success': False,
                'message': str(e)
            }, status=400)
    
    def create(self, request, *args, **kwargs):
        try:
            # Добавляем пользователя к данным
            data = request.data.copy()
            data['user'] = request.user.id
            
            serializer = self.get_serializer(data=data)
            serializer.is_valid(raise_exception=True)
            child = serializer.save(user=request.user)
            
            return Response({
                'success': True,
                'message': 'Ребенок успешно добавлен',
                'child': ChildSerializer(child).data
            }, status=201)
        except Exception as e:
            return Response({
                'success': False,
                'message': str(e)
            }, status=400)


class ChildDetailView(generics.RetrieveUpdateDestroyAPIView):
    """
    Получение, обновление и удаление ребенка
    """
    serializer_class = ChildSerializer
    permission_classes = [IsAuthenticated]
    
    def get_queryset(self):
        return Child.objects.filter(user=self.request.user)
    
    def retrieve(self, request, *args, **kwargs):
        try:
            child = self.get_object()
            serializer = self.get_serializer(child)
            
            return Response({
                'success': True,
                'child': serializer.data
            })
        except Exception as e:
            return Response({
                'success': False,
                'message': str(e)
            }, status=400)
    
    def update(self, request, *args, **kwargs):
        try:
            child = self.get_object()
            serializer = self.get_serializer(child, data=request.data, partial=True)
            serializer.is_valid(raise_exception=True)
            updated_child = serializer.save()
            
            return Response({
                'success': True,
                'message': 'Данные ребенка обновлены',
                'child': ChildSerializer(updated_child).data
            })
        except Exception as e:
            return Response({
                'success': False,
                'message': str(e)
            }, status=400)
    
    def destroy(self, request, *args, **kwargs):
        try:
            child = self.get_object()
            child.delete()
            
            return Response({
                'success': True,
                'message': 'Ребенок удален'
            })
        except Exception as e:
            return Response({
                'success': False,
                'message': str(e)
            }, status=400)


class CheckSubscriptionView(generics.RetrieveAPIView):
    """
    Проверка статуса подписки текущего пользователя на другого пользователя
    """
    permission_classes = [IsAuthenticated]
    
    def retrieve(self, request, *args, **kwargs):
        try:
            target_user_id = self.kwargs.get('user_id')
            current_user = request.user
            
            # Проверяем, существует ли подписка
            is_subscribed = Follow.objects.filter(
                follower=current_user,
                following_id=target_user_id
            ).exists()
            
            return Response({
                'success': True,
                'is_subscribed': is_subscribed
            })
        except Exception as e:
            return Response({
                'success': False,
                'message': str(e)
            }, status=400)


class FriendsListView(generics.ListAPIView):
    """
    Список друзей (подписок) текущего пользователя
    """
    permission_classes = [IsAuthenticated]
    
    def list(self, request, *args, **kwargs):
        try:
            current_user = request.user
            
            # Получаем всех пользователей, на которых подписан текущий пользователь
            following = Follow.objects.filter(follower=current_user).select_related('following')
            
            friends_data = []
            for follow in following:
                friend = follow.following
                friends_data.append({
                    'id': friend.id,
                    'first_name': friend.first_name,
                    'last_name': friend.last_name,
                    'username': friend.username,
                    'avatar': request.build_absolute_uri(friend.avatar.url) if friend.avatar else None,
                    'city': friend.city,
                    'status': friend.status
                })
            
            return Response({
                'success': True,
                'results': friends_data
            })
        except Exception as e:
            return Response({
                'success': False,
                'message': str(e)
            }, status=400)


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def send_post_to_friend(request):
    """
    Отправка поста другу
    """
    try:
        recipient_id = request.data.get('recipient_id')
        post_slug = request.data.get('post_slug')
        message = request.data.get('message', '')
        
        if not recipient_id or not post_slug:
            return Response({
                'success': False,
                'message': 'Необходимо указать получателя и пост'
            }, status=400)
        
        # Проверяем, что получатель существует
        try:
            recipient = User.objects.get(id=recipient_id)
        except User.DoesNotExist:
            return Response({
                'success': False,
                'message': 'Получатель не найден'
            }, status=404)
        
        # Проверяем, что пост существует
        try:
            post = Post.objects.get(slug=post_slug)
        except Post.DoesNotExist:
            return Response({
                'success': False,
                'message': 'Пост не найден'
            }, status=404)
        
        # Проверяем, что пользователь подписан на получателя
        is_friend = Follow.objects.filter(
            follower=request.user,
            following=recipient
        ).exists()
        
        if not is_friend:
            return Response({
                'success': False,
                'message': 'Вы можете отправлять посты только своим друзьям'
            }, status=403)
        
        # Создаем запись об отправленном посте
        shared_post = SharedPost.objects.create(
            sender=request.user,
            recipient=recipient,
            post=post,
            message=message
        )
        
        return Response({
            'success': True,
            'message': f'Пост успешно отправлен {recipient.first_name}'
        })
        
    except Exception as e:
        return Response({
            'success': False,
            'message': str(e)
        }, status=400)


@api_view(['POST'])
@permission_classes([IsAuthenticated])
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
@permission_classes([IsAuthenticated])
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


class ArchivedPostsView(generics.ListAPIView):
    """
    Список постов в архиве пользователя
    """
    permission_classes = [IsAuthenticated]
    
    def list(self, request, *args, **kwargs):
        try:
            
            # Получаем все посты в архиве пользователя
            archived_posts = PostArchive.objects.filter(
                user=request.user
            ).select_related('post', 'post__author', 'post__category').order_by('-created_at')
            
            
            posts_data = []
            for archive_entry in archived_posts:
                post = archive_entry.post
                posts_data.append({
                    'id': post.id,
                    'title': post.title,
                    'slug': post.slug,
                    'content': post.content,
                    'short_description': post.short_description,
                    'status': post.status,
                    'created_at': post.created_at,
                    'published_at': post.published_at,
                    'author': {
                        'id': post.author.id,
                        'first_name': post.author.first_name,
                        'last_name': post.author.last_name,
                        'username': post.author.username,
                        'avatar': request.build_absolute_uri(post.author.avatar.url) if post.author.avatar else None,
                        'city': post.author.city
                    },
                    'category': {
                        'id': post.category.id,
                        'name': post.category.name,
                        'slug': post.category.slug
                    } if post.category else None,
                    'archived_at': archive_entry.created_at
                })
            
            
            return Response({
                'success': True,
                'results': posts_data
            })
            
        except Exception as e:
            return Response({
                'success': False,
                'message': str(e)
            }, status=400)


class ReceivedPostsView(generics.ListAPIView):
    """
    Список постов, отправленных пользователю друзьями
    """
    permission_classes = [IsAuthenticated]
    
    def list(self, request, *args, **kwargs):
        try:
            # Получаем все посты, отправленные пользователю
            received_posts = SharedPost.objects.filter(
                recipient=request.user
            ).select_related('sender', 'post', 'post__author', 'post__category').order_by('-created_at')
            
            posts_data = []
            for shared_post in received_posts:
                post = shared_post.post
                posts_data.append({
                    'id': post.id,
                    'title': post.title,
                    'slug': post.slug,
                    'content': post.content,
                    'short_description': post.short_description,
                    'status': post.status,
                    'created_at': post.created_at,
                    'published_at': post.published_at,
                    'sender': {
                        'id': shared_post.sender.id,
                        'first_name': shared_post.sender.first_name,
                        'last_name': shared_post.sender.last_name,
                        'username': shared_post.sender.username,
                        'avatar': request.build_absolute_uri(shared_post.sender.avatar.url) if shared_post.sender.avatar else None,
                        'city': shared_post.sender.city
                    },
                    'author': {
                        'id': post.author.id,
                        'first_name': post.author.first_name,
                        'last_name': post.author.last_name,
                        'username': post.author.username,
                        'avatar': request.build_absolute_uri(post.author.avatar.url) if post.author.avatar else None,
                        'city': post.author.city
                    },
                    'category': {
                        'id': post.category.id,
                        'name': post.category.name,
                        'slug': post.category.slug
                    } if post.category else None,
                    'message': shared_post.message,
                    'is_read': shared_post.is_read,
                    'shared_at': shared_post.created_at
                })
            
            return Response({
                'success': True,
                'results': posts_data
            })
            
        except Exception as e:
            return Response({
                'success': False,
                'message': str(e)
            }, status=400)


class ChatListView(APIView):
    """Список чатов пользователя"""
    permission_classes = [IsAuthenticated]
    
    def get(self, request):
        try:
            user = request.user
            chats = Chat.objects.filter(
                participants=user, 
                is_active=True
            ).order_by('-updated_at')
            
            print(f"Найдено чатов для пользователя {user.id}: {chats.count()}")
            
            serializer = ChatSerializer(chats, many=True, context={'request': request})
            
            return Response({
                'success': True,
                'chats': serializer.data
            })
        except Exception as e:
            return Response({
                'success': False,
                'message': str(e)
            }, status=400)

class ChatCreateView(APIView):
    """Создание нового чата или получение существующего"""
    permission_classes = [IsAuthenticated]
    
    def post(self, request):
        try:
            serializer = ChatCreateSerializer(data=request.data, context={'request': request})
            if serializer.is_valid():
                chat = serializer.save()
                chat_serializer = ChatSerializer(chat, context={'request': request})
                return Response({
                    'success': True,
                    'chat': chat_serializer.data
                }, status=201)
            return Response({
                'success': False,
                'errors': serializer.errors
            }, status=400)
        except Exception as e:
            return Response({
                'success': False,
                'message': str(e)
            }, status=400)

class ChatDetailView(APIView):
    """Детали чата и сообщения"""
    permission_classes = [IsAuthenticated]
    
    def get(self, request, chat_id):
        try:
            chat = Chat.objects.get(id=chat_id, participants=request.user, is_active=True)
        except Chat.DoesNotExist:
            return Response({
                'success': False,
                'message': 'Чат не найден'
            }, status=404)
        
        # Получаем сообщения с пагинацией
        page = int(request.GET.get('page', 1))
        page_size = int(request.GET.get('page_size', 50))
        
        # Оптимизированный запрос с select_related для уменьшения количества запросов к БД
        messages = chat.messages.select_related('sender', 'reply_to', 'reply_to__sender').order_by('created_at')
        total_messages = messages.count()
        print(f"Загружаем сообщения для чата {chat_id}: найдено {total_messages} сообщений")
        
        # Получаем последние сообщения (для отображения снизу)
        skip_count = max(0, total_messages - page_size)
        messages_page = messages[skip_count:]
        
        message_serializer = ChatMessageSerializer(
            messages_page, 
            many=True, 
            context={'request': request}
        )
        
        # Помечаем сообщения как прочитанные
        chat.messages.filter(
            sender__in=chat.participants.exclude(id=request.user.id),
            is_read=False
        ).update(is_read=True)
        
        chat_serializer = ChatSerializer(chat, context={'request': request})
        
        return Response({
            'success': True,
            'chat': chat_serializer.data,
            'messages': message_serializer.data,
            'pagination': {
                'page': page,
                'page_size': page_size,
                'total': messages.count(),
                'has_next': end < messages.count()
            }
        })

class MessageCreateView(APIView):
    """Отправка сообщения в чат"""
    permission_classes = [IsAuthenticated]
    
    def post(self, request, chat_id):
        try:
            chat = Chat.objects.get(id=chat_id, participants=request.user, is_active=True)
        except Chat.DoesNotExist:
            return Response({
                'success': False,
                'message': 'Чат не найден'
            }, status=404)
        
        # Определяем тип сообщения
        message_type = 'text'
        if request.FILES.get('file'):
            file = request.FILES['file']
            if file.content_type.startswith('image/'):
                message_type = 'image'
            elif file.content_type.startswith('audio/'):
                message_type = 'voice'
            else:
                message_type = 'file'
        
        # Создаем сообщение
        message_data = {
            'content': request.data.get('content', ''),
            'message_type': message_type,
            'file': request.FILES.get('file'),
            'reply_to': request.data.get('reply_to')
        }
        
        serializer = ChatMessageCreateSerializer(
            data=message_data, 
            context={'request': request, 'chat': chat}
        )
        
        if serializer.is_valid():
            message = serializer.save()
            print(f"Сообщение сохранено в БД: ID={message.id}, Content='{message.content}', Chat={message.chat.id}, Sender={message.sender.id}")
            message_serializer = ChatMessageSerializer(message, context={'request': request})
            
            return Response({
                'success': True,
                'message': message_serializer.data
            }, status=201)
        
        return Response({
            'success': False,
            'errors': serializer.errors
        }, status=400)

class MessageUpdateView(APIView):
    """Редактирование сообщения"""
    permission_classes = [IsAuthenticated]
    
    def put(self, request, chat_id, message_id):
        try:
            chat = Chat.objects.get(id=chat_id, participants=request.user, is_active=True)
            message = ChatMessage.objects.get(id=message_id, chat=chat, sender=request.user)
        except (Chat.DoesNotExist, ChatMessage.DoesNotExist):
            return Response({
                'success': False,
                'message': 'Сообщение не найдено'
            }, status=404)
        
        content = request.data.get('content')
        if not content:
            return Response({
                'success': False,
                'message': 'Текст сообщения обязателен'
            }, status=400)
        
        message.content = content
        message.is_edited = True
        message.save()
        
        message_serializer = ChatMessageSerializer(message, context={'request': request})
        
        return Response({
            'success': True,
            'message': message_serializer.data
        })

class MessageDeleteView(APIView):
    """Удаление сообщения"""
    permission_classes = [IsAuthenticated]
    
    def delete(self, request, chat_id, message_id):
        try:
            chat = Chat.objects.get(id=chat_id, participants=request.user, is_active=True)
            message = ChatMessage.objects.get(id=message_id, chat=chat, sender=request.user)
        except (Chat.DoesNotExist, ChatMessage.DoesNotExist):
            return Response({
                'success': False,
                'message': 'Сообщение не найдено'
            }, status=404)
        
        message.delete()
        
        return Response({
            'success': True,
            'message': 'Сообщение удалено'
        })


# Асинхронные представления для чата
@sync_to_async
def async_get_or_create_chat(user1, user2):
    """Получить или создать чат между двумя пользователями"""
    # Ищем существующий чат между этими пользователями
    existing_chat = Chat.objects.filter(
        participants=user1,
        is_active=True
    ).filter(
        participants=user2
    ).first()
    
    if existing_chat:
        return existing_chat, False
    
    # Создаем новый чат
    chat = Chat.objects.create(is_active=True, created_at=timezone.now(), updated_at=timezone.now())
    chat.participants.add(user1, user2)
    return chat, True

@sync_to_async
def async_get_chat_messages(chat, page=1, page_size=20):
    """Получить сообщения чата с пагинацией"""
    # Оптимизированный запрос с select_related
    messages = ChatMessage.objects.filter(chat=chat).select_related(
        'sender', 'reply_to', 'reply_to__sender'
    ).order_by('created_at')
    
    # Получаем общее количество сообщений
    total_messages = messages.count()
    
    # Вычисляем, сколько сообщений пропустить с начала
    skip_count = max(0, total_messages - page_size)
    
    # Получаем последние сообщения, отсортированные по времени
    messages_page = messages[skip_count:]
    return list(messages_page)

@sync_to_async
def async_create_chat_message(chat, sender, content, message_type='text', file=None, reply_to=None):
    """Создать сообщение в чате"""
    message = ChatMessage.objects.create(
        chat=chat,
        sender=sender,
        content=content,
        message_type=message_type,
        file=file,
        reply_to=reply_to
    )
    # Обновляем время последнего обновления чата
    chat.updated_at = timezone.now()
    chat.save()
    return message

@sync_to_async
def async_update_chat_message(message_id, user, content):
    """Обновить сообщение в чате"""
    try:
        message = ChatMessage.objects.get(id=message_id, sender=user)
        message.content = content
        message.is_edited = True
        message.updated_at = timezone.now()
        message.save()
        return message
    except ChatMessage.DoesNotExist:
        return None

@sync_to_async
def async_delete_chat_message(message_id, user):
    """Удалить сообщение в чате"""
    try:
        message = ChatMessage.objects.get(id=message_id, sender=user)
        message.delete()
        return True
    except ChatMessage.DoesNotExist:
        return False

@sync_to_async
def async_mark_messages_as_read(chat, user):
    """Отметить сообщения как прочитанные"""
    ChatMessage.objects.filter(
        chat=chat,
        sender__in=chat.participants.exclude(id=user.id),
        is_read=False
    ).update(is_read=True)

@sync_to_async
def async_get_user_chats(user):
    """Получить все чаты пользователя"""
    chats = Chat.objects.filter(
        participants=user,
        is_active=True
    ).prefetch_related(
        'participants', 
        'messages__sender'
    ).order_by('-updated_at')
    return list(chats)

@sync_to_async
def async_serialize_chats(chats, request):
    """Сериализовать чаты"""
    serializer = ChatSerializer(chats, many=True, context={'request': request})
    return serializer.data

@sync_to_async
def async_serialize_messages(messages, request):
    """Сериализовать сообщения"""
    serializer = ChatMessageSerializer(messages, many=True, context={'request': request})
    return serializer.data


class AsyncChatListView(APIView):
    """Асинхронное представление для получения списка чатов"""
    permission_classes = [IsAuthenticated]
    
    def get(self, request):
        try:
            # Используем asyncio.run для запуска асинхронных операций
            chats = asyncio.run(async_get_user_chats(request.user))
            serializer_data = asyncio.run(async_serialize_chats(chats, request))
            
            return Response({
                'success': True,
                'chats': serializer_data
            })
        except Exception as e:
            return Response({
                'success': False,
                'message': str(e)
            }, status=500)

class AsyncChatCreateView(APIView):
    """Асинхронное представление для создания чата"""
    permission_classes = [IsAuthenticated]
    
    def post(self, request, user_id):
        try:
            # Используем asyncio.run для запуска асинхронных операций
            other_user = asyncio.run(sync_to_async(User.objects.get)(id=user_id))
            chat, created = asyncio.run(async_get_or_create_chat(request.user, other_user))
            
            serializer_data = asyncio.run(async_serialize_chats([chat], request))
            
            return Response({
                'success': True,
                'chat': serializer_data[0] if serializer_data else None,
                'created': created
            })
        except User.DoesNotExist:
            return Response({
                'success': False,
                'message': 'Пользователь не найден'
            }, status=404)
        except Exception as e:
            return Response({
                'success': False,
                'message': str(e)
            }, status=500)


class AsyncChatMessagesView(APIView):
    """Асинхронное представление для получения сообщений чата"""
    permission_classes = [IsAuthenticated]
    
    def get(self, request, user_id):
        try:
            # Используем asyncio.run для запуска асинхронных операций
            other_user = asyncio.run(sync_to_async(User.objects.get)(id=user_id))
            chat, created = asyncio.run(async_get_or_create_chat(request.user, other_user))
            
            # Получаем сообщения
            page = int(request.GET.get('page', 1))
            page_size = int(request.GET.get('page_size', 20))
            messages = asyncio.run(async_get_chat_messages(chat, page, page_size))
            
            # Отмечаем сообщения как прочитанные
            asyncio.run(async_mark_messages_as_read(chat, request.user))
            
            serializer_data = asyncio.run(async_serialize_messages(messages, request))
            
            return Response({
                'success': True,
                'messages': serializer_data,
                'chat_id': chat.id,
                'created': created
            })
        except User.DoesNotExist:
            return Response({
                'success': False,
                'message': 'Пользователь не найден'
            }, status=404)
        except Exception as e:
            return Response({
                'success': False,
                'message': str(e)
            }, status=500)


class AsyncChatMessageCreateView(APIView):
    """Асинхронное представление для создания сообщения"""
    permission_classes = [IsAuthenticated]
    
    def post(self, request, user_id):
        try:
            # Используем asyncio.run для запуска асинхронных операций
            other_user = asyncio.run(sync_to_async(User.objects.get)(id=user_id))
            chat, created = asyncio.run(async_get_or_create_chat(request.user, other_user))
            
            # Создаем сообщение
            content = request.data.get('content', '')
            message_type = request.data.get('message_type', 'text')
            reply_to_id = request.data.get('reply_to')
            
            reply_to = None
            if reply_to_id:
                reply_to = asyncio.run(sync_to_async(ChatMessage.objects.get)(id=reply_to_id, chat=chat))
            
            # Обработка файла
            file = request.FILES.get('file')
            if file and message_type in ['image', 'file']:
                message = asyncio.run(async_create_chat_message(
                    chat=chat,
                    sender=request.user,
                    content=content,
                    message_type=message_type,
                    file=file,
                    reply_to=reply_to
                ))
            else:
                message = asyncio.run(async_create_chat_message(
                    chat=chat,
                    sender=request.user,
                    content=content,
                    message_type=message_type,
                    reply_to=reply_to
                ))
            
            serializer_data = asyncio.run(async_serialize_messages([message], request))
            
            return Response({
                'success': True,
                'message': serializer_data[0] if serializer_data else None,
                'chat_id': chat.id
            })
        except User.DoesNotExist:
            return Response({
                'success': False,
                'message': 'Пользователь не найден'
            }, status=404)
        except Exception as e:
            return Response({
                'success': False,
                'message': str(e)
            }, status=500)


class AsyncChatMessageUpdateView(APIView):
    """Асинхронное представление для редактирования сообщения"""
    permission_classes = [IsAuthenticated]
    
    def put(self, request, message_id):
        try:
            content = request.data.get('content', '')
            if not content:
                return Response({
                    'success': False,
                    'message': 'Содержимое сообщения не может быть пустым'
                }, status=400)
            
            message = asyncio.run(async_update_chat_message(message_id, request.user, content))
            
            if not message:
                return Response({
                    'success': False,
                    'message': 'Сообщение не найдено или у вас нет прав на его редактирование'
                }, status=404)
            
            serializer_data = asyncio.run(async_serialize_messages([message], request))
            
            return Response({
                'success': True,
                'message': serializer_data[0] if serializer_data else None
            })
        except Exception as e:
            return Response({
                'success': False,
                'message': str(e)
            }, status=500)


class AsyncChatMessageDeleteView(APIView):
    """Асинхронное представление для удаления сообщения"""
    permission_classes = [IsAuthenticated]
    
    def delete(self, request, message_id):
        try:
            success = asyncio.run(async_delete_chat_message(message_id, request.user))
            
            if not success:
                return Response({
                    'success': False,
                    'message': 'Сообщение не найдено или у вас нет прав на его удаление'
                }, status=404)
            
            return Response({
                'success': True,
                'message': 'Сообщение удалено'
            })
        except Exception as e:
            return Response({
                'success': False,
                'message': str(e)
            }, status=500)


class DeleteAdminMessagesView(APIView):
    """Удаление всех сообщений с пользователем admin"""
    permission_classes = [IsAuthenticated]
    
    def delete(self, request):
        try:
            # Ищем пользователя admin
            try:
                admin_user = User.objects.get(username='admin')
            except User.DoesNotExist:
                return Response({
                    'success': False,
                    'message': 'Пользователь admin не найден'
                }, status=404)
            
            current_user = request.user
            
            # Находим все чаты между текущим пользователем и admin
            chats_with_admin = Chat.objects.filter(
                participants=current_user,
                is_active=True
            ).filter(
                participants=admin_user
            )
            
            deleted_messages_count = 0
            deleted_chats_count = 0
            
            # Удаляем все сообщения в этих чатах
            for chat in chats_with_admin:
                messages_count = chat.messages.count()
                chat.messages.all().delete()
                deleted_messages_count += messages_count
                
                # Если это чат только между двумя пользователями, удаляем весь чат
                if chat.participants.count() == 2:
                    chat.delete()
                    deleted_chats_count += 1
            
            return Response({
                'success': True,
                'message': f'Удалено {deleted_messages_count} сообщений и {deleted_chats_count} чатов с пользователем admin',
                'deleted_messages': deleted_messages_count,
                'deleted_chats': deleted_chats_count
            })
            
        except Exception as e:
            return Response({
                'success': False,
                'message': f'Ошибка при удалении сообщений: {str(e)}'
            }, status=500)


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def performance_stats(request):
    """API для получения статистики производительности (только для админов)"""
    if not request.user.is_staff:
        return Response({'error': 'Доступ запрещен'}, status=403)
    
    try:
        stats = PerformanceMonitor.get_performance_summary()
        return Response({
            'success': True,
            'stats': stats
        })
    except Exception as e:
        return Response({
            'success': False,
            'error': str(e)
        }, status=500)
