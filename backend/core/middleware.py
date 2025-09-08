"""
Middleware для оптимизации производительности
"""
import gzip
import time
from django.utils.deprecation import MiddlewareMixin
from django.http import HttpResponse
from django.core.cache import cache


class CompressionMiddleware(MiddlewareMixin):
    """Middleware для сжатия ответов"""
    
    def process_response(self, request, response):
        # Проверяем, поддерживает ли клиент gzip
        accept_encoding = request.META.get('HTTP_ACCEPT_ENCODING', '')
        
        if 'gzip' in accept_encoding and response.status_code == 200:
            # Проверяем тип контента
            content_type = response.get('Content-Type', '')
            
            if any(content_type.startswith(ct) for ct in [
                'text/', 'application/json', 'application/javascript', 
                'application/xml', 'application/rss+xml'
            ]):
                # Сжимаем контент
                content = response.content
                if len(content) > 1024:  # Сжимаем только если размер больше 1KB
                    compressed_content = gzip.compress(content)
                    response.content = compressed_content
                    response['Content-Encoding'] = 'gzip'
                    response['Content-Length'] = str(len(compressed_content))
        
        return response


class CacheMiddleware(MiddlewareMixin):
    """Middleware для кэширования статических ответов"""
    
    def process_request(self, request):
        # Кэшируем только GET запросы
        if request.method != 'GET':
            return None
        
        # Создаем ключ кэша
        cache_key = f"response_cache_{hash(request.get_full_path())}"
        
        # Проверяем кэш
        cached_response = cache.get(cache_key)
        if cached_response:
            return HttpResponse(
                cached_response['content'],
                content_type=cached_response['content_type'],
                status=cached_response['status']
            )
        
        return None
    
    def process_response(self, request, response):
        # Кэшируем только успешные GET запросы
        if (request.method == 'GET' and 
            response.status_code == 200 and 
            not request.user.is_authenticated):  # Не кэшируем для авторизованных пользователей
            
            cache_key = f"response_cache_{hash(request.get_full_path())}"
            
            # Проверяем тип ответа перед кэшированием
            try:
                # Для обычных ответов
                if hasattr(response, 'content'):
                    cache.set(cache_key, {
                        'content': response.content,
                        'content_type': response.get('Content-Type', ''),
                        'status': response.status_code
                    }, 300)  # Кэшируем на 5 минут
                # Для FileResponse и других streaming ответов - не кэшируем
                elif hasattr(response, 'streaming_content'):
                    # Не кэшируем файлы и streaming контент
                    pass
            except Exception as e:
                # Если не можем кэшировать - просто пропускаем
                pass
        
        return response


class PerformanceMiddleware(MiddlewareMixin):
    """Middleware для мониторинга производительности"""
    
    def process_request(self, request):
        request.start_time = time.time()
        return None
    
    def process_response(self, request, response):
        if hasattr(request, 'start_time'):
            duration = time.time() - request.start_time
            
            # Добавляем заголовок с временем выполнения
            response['X-Response-Time'] = f"{duration:.3f}s"
            
            # Логируем медленные запросы
            if duration > 1.0:  # Больше 1 секунды
                print(f"Медленный запрос: {request.path} - {duration:.3f}s")
        
        return response
