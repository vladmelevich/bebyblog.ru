"""
Production settings for kwork_site
"""

import os
from .settings import *

# Безопасность
DEBUG = False
SECRET_KEY = os.environ.get('SECRET_KEY', 'your-very-secret-key-change-this-in-production-2024')

# Разрешенные хосты
ALLOWED_HOSTS = ['*']

# База данных MySQL
DATABASES = {
    'default': {
        'ENGINE': 'django.db.backends.mysql',
        'NAME': 'my_kwork',
        'USER': 'root',
        'PASSWORD': 'Vmelvladmlvh1211',
        'HOST': 'db',
        'PORT': '3306',
        'OPTIONS': {
            'charset': 'utf8mb4',
            'init_command': "SET sql_mode='STRICT_TRANS_TABLES'",
            'autocommit': True,
        },
        'CONN_MAX_AGE': 60,
        'CONN_HEALTH_CHECKS': True,
    }
}

# Redis для кэширования
CACHES = {
    'default': {
        'BACKEND': 'django_redis.cache.RedisCache',
        'LOCATION': os.environ.get('REDIS_URL', 'redis://redis:6379/0'),
        'OPTIONS': {
            'CLIENT_CLASS': 'django_redis.client.DefaultClient',
        }
    }
}

# CORS настройки
CORS_ALLOWED_ORIGINS = [
    "http://93.183.80.220",
    "https://93.183.80.220",
    "http://localhost:3000",
    "http://127.0.0.1:3000",
]

CORS_ALLOW_ALL_ORIGINS = True

# Отключаем CSRF для API endpoints
CSRF_TRUSTED_ORIGINS = [
    "http://93.183.80.220",
    "https://93.183.80.220",
    "http://localhost:3000",
    "http://127.0.0.1:3000",
]

# Полностью отключаем CSRF для API
CSRF_COOKIE_SECURE = False
CSRF_COOKIE_HTTPONLY = False
CSRF_USE_SESSIONS = False

# Отключаем CSRF middleware в production
MIDDLEWARE = [
    'corsheaders.middleware.CorsMiddleware',
    'django.middleware.security.SecurityMiddleware',
    'django.contrib.sessions.middleware.SessionMiddleware',
    'django.middleware.common.CommonMiddleware',
    # 'django.middleware.csrf.CsrfViewMiddleware',  # Отключен для API
    'django.contrib.auth.middleware.AuthenticationMiddleware',
    'django.contrib.messages.middleware.MessageMiddleware',
    'django.middleware.clickjacking.XFrameOptionsMiddleware',
    
    # Оптимизация производительности
    'core.middleware.CompressionMiddleware',
    'core.middleware.CacheMiddleware',
    'core.middleware.PerformanceMiddleware',
]

# Статические файлы
STATIC_URL = '/static/'
STATIC_ROOT = '/app/staticfiles'

# Медиа файлы
MEDIA_URL = '/media/'
MEDIA_ROOT = '/app/media'

# Безопасность
SECURE_BROWSER_XSS_FILTER = True
SECURE_CONTENT_TYPE_NOSNIFF = True
X_FRAME_OPTIONS = 'DENY'

# Логирование: пишем в stdout/stderr контейнера (Docker best practice)
LOGGING = {
    'version': 1,
    'disable_existing_loggers': False,
    'handlers': {
        'console': {
            'level': 'INFO',
            'class': 'logging.StreamHandler',
        },
    },
    'loggers': {
        'django': {
            'handlers': ['console'],
            'level': 'INFO',
            'propagate': True,
        },
    },
}

# Email настройки
EMAIL_BACKEND = 'django.core.mail.backends.smtp.EmailBackend'
EMAIL_HOST = 'smtp.gmail.com'
EMAIL_PORT = 587
EMAIL_USE_TLS = True
EMAIL_HOST_USER = os.environ.get('EMAIL_HOST_USER', '')
EMAIL_HOST_PASSWORD = os.environ.get('EMAIL_HOST_PASSWORD', '')

# Настройки сессий/CSRF (CSRF отключен, куки не помечаем как secure/httpOnly для простоты)
SESSION_COOKIE_SECURE = False
CSRF_COOKIE_SECURE = False
SESSION_COOKIE_HTTPONLY = True
CSRF_COOKIE_HTTPONLY = False
