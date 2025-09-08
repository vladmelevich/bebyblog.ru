from django.core.management.base import BaseCommand
from posts.models import Category

class Command(BaseCommand):
    help = 'Удаляет тестовые категории из базы данных'

    def handle(self, *args, **options):
        # Удаляем тестовые категории
        test_categories = Category.objects.filter(
            name__icontains='тест'
        )
        
        if test_categories.exists():
            for category in test_categories:
                self.stdout.write(f'Удаляем категорию: {category.name}')
                category.delete()
            
            self.stdout.write(
                self.style.SUCCESS(f'Удалено тестовых категорий: {test_categories.count()}')
            )
        else:
            self.stdout.write(
                self.style.WARNING('Тестовые категории не найдены')
            )
        
        # Показываем все оставшиеся категории
        remaining_categories = Category.objects.all()
        self.stdout.write('\nОставшиеся категории:')
        for category in remaining_categories:
            self.stdout.write(f'- {category.name} (slug: {category.slug})')











