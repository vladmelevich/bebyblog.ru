from django.urls import path
from . import views

app_name = 'posts'

urlpatterns = [
    # Категории
    path('categories/', views.CategoryListView.as_view(), name='category_list'),
    
    # Посты
    path('', views.PostListView.as_view(), name='post_list'),
    path('create/', views.PostCreateView.as_view(), name='post_create'),
    path('popular/', views.popular_posts, name='popular_posts'),
    path('search/', views.search_posts, name='search_posts'),
    
    # Детальный просмотр поста (SEO-friendly URL)
    path('<slug:slug>/', views.PostDetailView.as_view(), name='post_detail'),
    path('<slug:slug>/edit/', views.PostUpdateView.as_view(), name='post_update'),
    path('<slug:slug>/delete/', views.PostDeleteView.as_view(), name='post_delete'),
    
    # Лайки
    path('<slug:slug>/like/', views.toggle_like, name='toggle_like'),
    
    # Комментарии
    path('<slug:slug>/comments/', views.CommentCreateView.as_view(), name='comment_create'),
    path('comments/<int:pk>/delete/', views.CommentDeleteView.as_view(), name='comment_delete'),
    
    # Посты пользователя
    path('user/<int:user_id>/', views.UserPostsView.as_view(), name='user_posts'),
    path('user/<int:user_id>/published/', views.PublishedUserPostsView.as_view(), name='published_user_posts'),
    path('user-posts/', views.CurrentUserPostsView.as_view(), name='current_user_posts'),
    path('<int:id>/publish/', views.PostPublishView.as_view(), name='post_publish'),
    
    # Архив постов
    path('<slug:slug>/toggle-archive/', views.toggle_post_archive, name='toggle_post_archive'),
    path('<slug:slug>/archive-status/', views.check_archive_status, name='check_archive_status'),
]
