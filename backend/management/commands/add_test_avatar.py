from django.core.management.base import BaseCommand
from django.core.files import File
from users.models import User
import os

class Command(BaseCommand):
    help = 'Добавляет тестовый аватар пользователю'

    def handle(self, *args, **options):
        # Найдем пользователя
        try:
            user = User.objects.first()  # Берем первого пользователя
            if not user:
                self.stdout.write(self.style.ERROR('Пользователи не найдены'))
                return
            
            # Путь к тестовому аватару
            test_avatar_path = '/app/media/avatars/baby-with-bunny.jpg'
            
            if os.path.exists(test_avatar_path):
                with open(test_avatar_path, 'rb') as f:
                    user.avatar.save('test_avatar.jpg', File(f), save=True)
                self.stdout.write(self.style.SUCCESS(f'Аватар добавлен пользователю {user.email}'))
            else:
                self.stdout.write(self.style.ERROR(f'Файл аватара не найден: {test_avatar_path}'))
                
        except Exception as e:
            self.stdout.write(self.style.ERROR(f'Ошибка: {e}'))
