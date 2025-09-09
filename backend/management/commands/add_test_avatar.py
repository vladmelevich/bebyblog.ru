from django.core.management.base import BaseCommand
from django.contrib.auth import get_user_model
from django.core.files.base import ContentFile
import os

User = get_user_model()

class Command(BaseCommand):
    help = 'Добавляет тестовый аватар пользователю'

    def add_arguments(self, parser):
        parser.add_argument('--user-id', type=int, help='ID пользователя')
        parser.add_argument('--username', type=str, help='Имя пользователя')

    def handle(self, *args, **options):
        user_id = options.get('user_id')
        username = options.get('username')
        
        if user_id:
            try:
                user = User.objects.get(id=user_id)
            except User.DoesNotExist:
                self.stdout.write(f'❌ Пользователь с ID {user_id} не найден')
                return
        elif username:
            try:
                user = User.objects.get(username=username)
            except User.DoesNotExist:
                self.stdout.write(f'❌ Пользователь {username} не найден')
                return
        else:
            # Берем первого пользователя
            user = User.objects.first()
            if not user:
                self.stdout.write('❌ Пользователи не найдены')
                return
        
        self.stdout.write(f'👤 Работаем с пользователем: {user.username} (ID: {user.id})')
        
        # Создаем простой тестовый аватар (цветной квадрат)
        from PIL import Image, ImageDraw
        
        # Создаем изображение 100x100 пикселей
        img = Image.new('RGB', (100, 100), color='#8B5CF6')
        draw = ImageDraw.Draw(img)
        
        # Рисуем инициалы
        try:
            from PIL import ImageFont
            font = ImageFont.truetype("/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf", 40)
        except:
            font = ImageFont.load_default()
        
        # Получаем инициалы
        initials = f"{user.first_name[0] if user.first_name else 'U'}{user.last_name[0] if user.last_name else ''}".upper()
        
        # Центрируем текст
        bbox = draw.textbbox((0, 0), initials, font=font)
        text_width = bbox[2] - bbox[0]
        text_height = bbox[3] - bbox[1]
        x = (100 - text_width) // 2
        y = (100 - text_height) // 2
        
        draw.text((x, y), initials, fill='white', font=font)
        
        # Сохраняем в байты
        from io import BytesIO
        img_io = BytesIO()
        img.save(img_io, format='PNG')
        img_io.seek(0)
        
        # Создаем файл
        filename = f'avatar_{user.id}.png'
        user.avatar.save(filename, ContentFile(img_io.getvalue()), save=True)
        
        self.stdout.write(f'✅ Тестовый аватар добавлен: {user.avatar.url}')
        self.stdout.write(f'🔗 Полный URL: http://93.183.80.220{user.avatar.url}')