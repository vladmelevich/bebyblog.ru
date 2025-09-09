from django.core.management.base import BaseCommand
from django.contrib.auth import get_user_model
from django.conf import settings
import os

User = get_user_model()

class Command(BaseCommand):
    help = 'Проверяет аватары пользователей'

    def handle(self, *args, **options):
        self.stdout.write('🔍 Проверка аватаров пользователей...')
        
        users = User.objects.all()
        
        for user in users:
            self.stdout.write(f'\n👤 Пользователь: {user.username} (ID: {user.id})')
            self.stdout.write(f'   Имя: {user.first_name} {user.last_name}')
            self.stdout.write(f'   Email: {user.email}')
            
            if user.avatar:
                self.stdout.write(f'   ✅ Аватар есть: {user.avatar}')
                self.stdout.write(f'   📁 Путь к файлу: {user.avatar.path}')
                
                # Проверяем, существует ли файл
                if os.path.exists(user.avatar.path):
                    self.stdout.write(f'   ✅ Файл существует')
                    self.stdout.write(f'   📏 Размер файла: {os.path.getsize(user.avatar.path)} байт')
                else:
                    self.stdout.write(f'   ❌ Файл НЕ существует!')
                
                # Проверяем URL
                self.stdout.write(f'   🌐 URL: {user.avatar.url}')
                self.stdout.write(f'   🔗 Полный URL: http://93.183.80.220{user.avatar.url}')
            else:
                self.stdout.write(f'   ❌ Аватар отсутствует')
        
        self.stdout.write('\n✅ Проверка завершена!')
