from django.urls import path
from rest_framework_simplejwt.views import TokenRefreshView 
from .views import (
    FastUserRegistrationView, 
    FastUserLoginView, 
    UserLogoutView,
    UserDetailView,
    PerformanceMonitorView,
    UserProfileView,
    CurrentUserProfileView,
    user_info_view,

    UserProfileWithPostsView,
    UserSearchView,
    FollowView,
    UnfollowView,
    FollowersListView,
    FollowingListView,
    NotificationsListView,
    MarkNotificationAsReadView,
    MarkAllNotificationsAsReadView,
    ChildrenListView,
    ChildDetailView,
    CheckSubscriptionView,
    FriendsListView,
    send_post_to_friend,
    toggle_post_archive,
    check_archive_status,
    ArchivedPostsView,
    ReceivedPostsView,
    ChatListView,
    ChatCreateView,
    ChatDetailView,
    MessageCreateView,
    MessageUpdateView,
    MessageDeleteView,
    AsyncChatListView,
    AsyncChatCreateView,
    AsyncChatMessagesView,
    AsyncChatMessageCreateView,
    AsyncChatMessageUpdateView,
    AsyncChatMessageDeleteView,
    DeleteAdminMessagesView,
    performance_stats
)

app_name = 'users'

urlpatterns = [
    path('register/', FastUserRegistrationView.as_view(), name='register'),
    path('login/', FastUserLoginView.as_view(), name='login'),
    path('logout/', UserLogoutView.as_view(), name='logout'),
    path('token/refresh/', TokenRefreshView.as_view(), name='token_refresh'),
    path('me/', user_info_view, name='user_info'),
    path('profile/', UserDetailView.as_view(), name='user_detail'),
    path('performance/', PerformanceMonitorView.as_view(), name='performance'),
    path('<int:pk>/', UserProfileView.as_view(), name='user_profile'),
    path('profile-with-posts/<int:pk>/', UserProfileWithPostsView.as_view(), name='user_profile_with_posts'),
    path('profile/', CurrentUserProfileView.as_view(), name='current_user_profile'),

    
    # API для друзей и подписок
    path('search/', UserSearchView.as_view(), name='user_search'),
    path('follow/<int:user_id>/', FollowView.as_view(), name='follow_user'),
    path('unfollow/<int:user_id>/', UnfollowView.as_view(), name='unfollow_user'),
    path('check-subscription/<int:user_id>/', CheckSubscriptionView.as_view(), name='check_subscription'),
    path('followers/', FollowersListView.as_view(), name='followers_list'),
    path('following/', FollowingListView.as_view(), name='following_list'),
    path('friends/', FriendsListView.as_view(), name='friends_list'),
    
    # API для уведомлений
    path('notifications/', NotificationsListView.as_view(), name='notifications_list'),
    path('notifications/<int:notification_id>/read/', MarkNotificationAsReadView.as_view(), name='mark_notification_read'),
    path('notifications/mark-all-read/', MarkAllNotificationsAsReadView.as_view(), name='mark_all_notifications_read'),
    
    # API для детей
    path('children/', ChildrenListView.as_view(), name='children_list'),
    path('children/<int:pk>/', ChildDetailView.as_view(), name='child_detail'),
    
    # API для отправки постов друзьям
    path('send-post/', send_post_to_friend, name='send_post_to_friend'),
    
    # API для архива постов
    path('archive/', ArchivedPostsView.as_view(), name='archived_posts'),
    path('received-posts/', ReceivedPostsView.as_view(), name='received_posts'),

    # Chat URLs
    path('chats/', ChatListView.as_view(), name='chat-list'),
    path('chats/create/', ChatCreateView.as_view(), name='chat-create'),
    path('chats/<int:chat_id>/', ChatDetailView.as_view(), name='chat-detail'),
    path('chats/<int:chat_id>/messages/', MessageCreateView.as_view(), name='message-create'),
    path('chats/<int:chat_id>/messages/<int:message_id>/', MessageUpdateView.as_view(), name='message-update'),
    path('chats/<int:chat_id>/messages/<int:message_id>/delete/', MessageDeleteView.as_view(), name='message-delete'),
    
    # Async Chat URLs
    path('async/chats/', AsyncChatListView.as_view(), name='async-chat-list'),
    path('async/chats/create/<int:user_id>/', AsyncChatCreateView.as_view(), name='async-chat-create'),
    path('async/chats/<int:user_id>/messages/', AsyncChatMessagesView.as_view(), name='async-chat-messages'),
    path('async/chats/<int:user_id>/messages/create/', AsyncChatMessageCreateView.as_view(), name='async-message-create'),
    path('async/messages/<int:message_id>/update/', AsyncChatMessageUpdateView.as_view(), name='async-message-update'),
    path('async/messages/<int:message_id>/delete/', AsyncChatMessageDeleteView.as_view(), name='async-message-delete'),
    
    # Delete admin messages
    path('delete-admin-messages/', DeleteAdminMessagesView.as_view(), name='delete-admin-messages'),
    
    # Performance monitoring
    path('performance-stats/', performance_stats, name='performance-stats'),
]
