"""
URL configuration for core project.

The `urlpatterns` list routes URLs to views. For more information please see:
    https://docs.djangoproject.com/en/4.2/topics/http/urls/
Examples:
Function views
    1. Add an import:  from my_app import views
    2. Add a URL to urlpatterns:  path('', views.home, name='home')
Class-based views
    1. Add an import:  from other_app.views import Home
    2. Add a URL to urlpatterns:  path('', Home.as_view(), name='home')
Including another URLconf
    1. Import the include() function: from django.urls import include, path
    2. Add a URL to urlpatterns:  path('blog/', include('blog.urls'))
"""
from django.contrib import admin
from django.urls import path, include
from django.conf import settings
from django.conf.urls.static import static
from django.http import JsonResponse

def health_check(request):
    return JsonResponse({'status': 'healthy'})

def test_users_api(request):
    return JsonResponse({'status': 'users_api_working', 'path': request.path})

def test_children_api(request):
    return JsonResponse({'status': 'children_api_working', 'path': request.path, 'method': request.method})

def test_user_profile_api(request, user_id):
    return JsonResponse({'status': 'user_profile_working', 'path': request.path, 'user_id': user_id})

urlpatterns = [
    path('admin/', admin.site.urls),
    path('api/health/', health_check, name='health'),
    path('api/test-users/', test_users_api, name='test_users'),
    
    # Прямые тестовые маршруты
    path('api/users/children/', test_children_api, name='test_children'),
    path('api/users/<int:user_id>/', test_user_profile_api, name='test_user_profile'),
    path('api/users/profile-with-posts/<int:user_id>/', test_user_profile_api, name='test_user_profile_with_posts'),
    
    # Основные маршруты
    path('api/auth/', include('users.urls')),
    path('api/users/', include('users.urls')),
    path('api/posts/', include('posts.urls')),
]

# Добавляем медиа файлы для разработки
if settings.DEBUG:
    urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)
