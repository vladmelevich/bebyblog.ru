from django.core.management.base import BaseCommand
from posts.models import Post

class Command(BaseCommand):
    help = 'Проверяет данные постов'

    def handle(self, *args, **options):
        posts = Post.objects.all()
        
        self.stdout.write(f'Всего постов: {posts.count()}')
        
        for post in posts:
            self.stdout.write(f'Пост ID {post.id}:')
            self.stdout.write(f'  Заголовок: {post.title}')
            self.stdout.write(f'  Краткое описание: "{post.short_description}"')
            self.stdout.write(f'  Категория: {post.category.name if post.category else "Нет"}')
            self.stdout.write('---')



















