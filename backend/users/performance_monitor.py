"""
Мониторинг производительности приложения
"""
import time
import psutil
import logging
from django.core.cache import cache
from django.db import connection
from typing import Dict, Any

logger = logging.getLogger(__name__)


class PerformanceMonitor:
    """Монитор производительности"""
    
    @staticmethod
    def get_system_stats() -> Dict[str, Any]:
        """Получить статистику системы"""
        return {
            'cpu_percent': psutil.cpu_percent(interval=1),
            'memory_percent': psutil.virtual_memory().percent,
            'disk_usage': psutil.disk_usage('/').percent,
            'load_average': psutil.getloadavg() if hasattr(psutil, 'getloadavg') else None,
        }
    
    @staticmethod
    def get_database_stats() -> Dict[str, Any]:
        """Получить статистику базы данных"""
        with connection.cursor() as cursor:
            # Количество соединений
            cursor.execute("SHOW STATUS LIKE 'Threads_connected'")
            connections = cursor.fetchone()[1] if cursor.fetchone() else 0
            
            # Количество запросов
            cursor.execute("SHOW STATUS LIKE 'Queries'")
            queries = cursor.fetchone()[1] if cursor.fetchone() else 0
            
            # Время работы
            cursor.execute("SHOW STATUS LIKE 'Uptime'")
            uptime = cursor.fetchone()[1] if cursor.fetchone() else 0
            
            return {
                'connections': int(connections),
                'total_queries': int(queries),
                'uptime_seconds': int(uptime),
            }
    
    @staticmethod
    def get_cache_stats() -> Dict[str, Any]:
        """Получить статистику кэша"""
        try:
            # Тестируем кэш
            test_key = 'performance_test'
            cache.set(test_key, 'test_value', 10)
            cache_hit = cache.get(test_key) is not None
            cache.delete(test_key)
            
            return {
                'cache_working': cache_hit,
                'cache_backend': cache.__class__.__name__,
            }
        except Exception as e:
            return {
                'cache_working': False,
                'cache_error': str(e),
            }
    
    @staticmethod
    def log_slow_query(query: str, duration: float, threshold: float = 1.0):
        """Логировать медленные запросы"""
        if duration > threshold:
            logger.warning(f"Медленный запрос ({duration:.3f}s): {query[:200]}...")
    
    @staticmethod
    def get_performance_summary() -> Dict[str, Any]:
        """Получить сводку по производительности"""
        return {
            'system': PerformanceMonitor.get_system_stats(),
            'database': PerformanceMonitor.get_database_stats(),
            'cache': PerformanceMonitor.get_cache_stats(),
            'timestamp': time.time(),
        }


class QueryProfiler:
    """Профилировщик SQL запросов"""
    
    def __init__(self):
        self.queries = []
        self.start_time = None
    
    def start(self):
        """Начать профилирование"""
        self.start_time = time.time()
        self.queries = []
    
    def stop(self) -> Dict[str, Any]:
        """Остановить профилирование и получить результаты"""
        if self.start_time is None:
            return {}
        
        duration = time.time() - self.start_time
        query_count = len(connection.queries)
        
        # Анализируем запросы
        slow_queries = []
        for query in connection.queries:
            query_time = float(query['time'])
            if query_time > 0.1:  # Больше 100ms
                slow_queries.append({
                    'sql': query['sql'][:200] + '...' if len(query['sql']) > 200 else query['sql'],
                    'time': query_time
                })
        
        return {
            'total_duration': duration,
            'query_count': query_count,
            'slow_queries': slow_queries,
            'average_query_time': sum(float(q['time']) for q in connection.queries) / query_count if query_count > 0 else 0,
        }


# Декоратор для профилирования функций
def profile_function(func):
    """Декоратор для профилирования производительности функций"""
    def wrapper(*args, **kwargs):
        start_time = time.time()
        result = func(*args, **kwargs)
        duration = time.time() - start_time
        
        if duration > 0.5:  # Больше 500ms
            logger.warning(f"Медленная функция {func.__name__}: {duration:.3f}s")
        
        return result
    return wrapper


# Контекстный менеджер для профилирования
class ProfileContext:
    """Контекстный менеджер для профилирования"""
    
    def __init__(self, name: str):
        self.name = name
        self.start_time = None
    
    def __enter__(self):
        self.start_time = time.time()
        return self
    
    def __exit__(self, exc_type, exc_val, exc_tb):
        duration = time.time() - self.start_time
        if duration > 0.5:  # Больше 500ms
            logger.warning(f"Медленная операция {self.name}: {duration:.3f}s")
