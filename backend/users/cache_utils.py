"""
Утилиты для работы с кэшем пользователей
"""
from django.core.cache import cache
from django.contrib.auth import get_user_model

User = get_user_model()

def cache_user_data(user, timeout=300):
    """
    Кэширует данные пользователя во всех необходимых ключах
    """
    cache_keys = {
        f"user_auth_{user.email}": timeout,  # 5 минут для авторизации
        f"user_profile_{user.id}": 600,      # 10 минут для профиля
        f"user_detail_{user.id}": timeout    # 5 минут для деталей
    }
    
    for key, ttl in cache_keys.items():
        cache.set(key, user, ttl)
    
    print(f"Пользователь {user.email} кэширован в {len(cache_keys)} ключах")

def get_cached_user(email=None, user_id=None):
    """
    Получает пользователя из кэша по email или ID
    """
    if email:
        return cache.get(f"user_auth_{email}")
    elif user_id:
        return cache.get(f"user_detail_{user_id}")
    return None

def clear_user_cache(user):
    """
    Очищает весь кэш пользователя
    """
    cache_keys = [
        f"user_auth_{user.email}",
        f"user_profile_{user.id}",
        f"user_detail_{user.id}"
    ]
    
    for key in cache_keys:
        cache.delete(key)
    
    print(f"Кэш пользователя {user.email} очищен")

def update_user_cache(user, timeout=300):
    """
    Обновляет кэш пользователя
    """
    clear_user_cache(user)
    cache_user_data(user, timeout)

def get_cache_stats():
    """
    Получает статистику кэша
    """
    # Это базовая реализация, в продакшене можно использовать Redis INFO
    return {
        'cache_backend': cache.__class__.__name__,
        'cache_location': getattr(cache, '_cache', {}).get('LOCATION', 'unknown')
    }





















