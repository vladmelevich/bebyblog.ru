from django.contrib import admin
from django.contrib.auth.admin import UserAdmin as BaseUserAdmin
from django.utils.translation import gettext_lazy as _
from .models import User, Child, ChatMessage, Chat


@admin.register(User)
class UserAdmin(BaseUserAdmin):
    list_display = ('email', 'username', 'first_name', 'last_name', 'status', 'city', 'is_staff')
    list_filter = ('status', 'is_staff', 'is_superuser', 'is_active', 'groups')
    search_fields = ('email', 'username', 'first_name', 'last_name', 'city')
    ordering = ('email',)
    
    fieldsets = (
        (None, {'fields': ('email', 'password')}),
        (_('Personal info'), {'fields': ('username', 'first_name', 'last_name', 'status', 'city', 'birth_date', 'avatar')}),
        (_('Permissions'), {
            'fields': ('is_active', 'is_staff', 'is_superuser', 'groups', 'user_permissions'),
        }),
        (_('Important dates'), {'fields': ('last_login', 'date_joined')}),
    )
    
    add_fieldsets = (
        (None, {
            'classes': ('wide',),
            'fields': ('email', 'username', 'password1', 'password2'),
        }),
    )


@admin.register(Child)
class ChildAdmin(admin.ModelAdmin):
    list_display = ('name', 'user', 'gender', 'age', 'birth_date')
    list_filter = ('gender', 'birth_date')
    search_fields = ('name', 'user__first_name', 'user__last_name')
    ordering = ('name',)


@admin.register(ChatMessage)
class ChatMessageAdmin(admin.ModelAdmin):
    list_display = ['sender', 'chat', 'content', 'is_read', 'created_at']
    list_filter = ['is_read', 'created_at', 'sender']
    search_fields = ['content', 'sender__username']
    readonly_fields = ['created_at']
    ordering = ['-created_at']

@admin.register(Chat)
class ChatAdmin(admin.ModelAdmin):
    list_display = ['get_participants', 'created_at', 'updated_at']
    list_filter = ['created_at', 'updated_at']
    search_fields = ['participants__username', 'participants__first_name']
    readonly_fields = ['created_at', 'updated_at']
    ordering = ['-updated_at']
    
    def get_participants(self, obj):
        return ', '.join([user.username for user in obj.participants.all()])
    get_participants.short_description = 'Участники'
