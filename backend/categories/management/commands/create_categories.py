from django.core.management.base import BaseCommand
from categories.models import Category

class Command(BaseCommand):
    help = 'Создает основные категории для постов'

    def handle(self, *args, **options):
        categories_data = [
            {'name': 'Беременность', 'description': 'Вопросы о беременности'},
            {'name': 'Роды', 'description': 'Подготовка к родам и роды'},
            {'name': 'Новорожденные', 'description': 'Уход за новорожденными'},
            {'name': 'Дети 1-3 года', 'description': 'Развитие детей от 1 до 3 лет'},
            {'name': 'Дети 3-7 лет', 'description': 'Развитие детей от 3 до 7 лет'},
            {'name': 'Школьники', 'description': 'Вопросы о школьниках'},
            {'name': 'Здоровье', 'description': 'Здоровье детей и мам'},
            {'name': 'Питание', 'description': 'Питание детей и мам'},
            {'name': 'Воспитание', 'description': 'Вопросы воспитания'},
            {'name': 'Семья', 'description': 'Семейные отношения'},
        ]

        created_count = 0
        for cat_data in categories_data:
            category, created = Category.objects.get_or_create(
                name=cat_data['name'],
                defaults={'description': cat_data['description']}
            )
            if created:
                self.stdout.write(
                    self.style.SUCCESS(f'Создана категория: {category.name}')
                )
                created_count += 1
            else:
                self.stdout.write(
                    self.style.WARNING(f'Категория уже существует: {category.name}')
                )

        self.stdout.write(
            self.style.SUCCESS(f'Создано {created_count} новых категорий. Всего категорий: {Category.objects.count()}')
        )
