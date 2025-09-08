from django.db import models
from django.contrib.auth import get_user_model
from django.utils.translation import gettext_lazy as _
from django.utils.text import slugify
from django.urls import reverse
import uuid

User = get_user_model()

class Category(models.Model):
    """Категории постов"""
    name = models.CharField(max_length=100, verbose_name=_('Название'))
    slug = models.SlugField(max_length=100, unique=True, verbose_name=_('Slug'))
    description = models.TextField(blank=True, verbose_name=_('Описание'))
    created_at = models.DateTimeField(auto_now_add=True, verbose_name=_('Дата создания'))
    
    class Meta:
        verbose_name = _('Категория')
        verbose_name_plural = _('Категории')
        ordering = ['name']
    
    def __str__(self):
        return self.name
    
    def save(self, *args, **kwargs):
        if not self.slug or self.slug == '':
            # Простая транслитерация для кириллицы
            translit_map = {
                'а': 'a', 'б': 'b', 'в': 'v', 'г': 'g', 'д': 'd', 'е': 'e', 'ё': 'yo',
                'ж': 'zh', 'з': 'z', 'и': 'i', 'й': 'y', 'к': 'k', 'л': 'l', 'м': 'm',
                'н': 'n', 'о': 'o', 'п': 'p', 'р': 'r', 'с': 's', 'т': 't', 'у': 'u',
                'ф': 'f', 'х': 'h', 'ц': 'ts', 'ч': 'ch', 'ш': 'sh', 'щ': 'sch',
                'ъ': '', 'ы': 'y', 'ь': '', 'э': 'e', 'ю': 'yu', 'я': 'ya',
                ' ': '-', '-': '-', '_': '-'
            }
            
            # Транслитерируем название
            transliterated = ''
            for char in self.name.lower():
                transliterated += translit_map.get(char, char)
            
            # Убираем все кроме букв, цифр и дефисов
            import re
            base_slug = re.sub(r'[^a-z0-9-]', '', transliterated)
            base_slug = re.sub(r'-+', '-', base_slug).strip('-')
            
            if not base_slug:
                base_slug = f"category-{self.id or 'new'}"
            self.slug = base_slug
        super().save(*args, **kwargs)

class Post(models.Model):
    """Модель поста"""
    STATUS_CHOICES = [
        ('draft', _('Черновик')),
        ('published', _('Опубликован')),
    ]
    

    
    # Основная информация
    title = models.CharField(max_length=200, verbose_name=_('Заголовок'))
    slug = models.SlugField(max_length=200, unique=True, blank=True, verbose_name=_('Slug'))
    short_description = models.CharField(max_length=100, default='Пост', verbose_name=_('Краткое описание (1-2 слова)'))
    content = models.TextField(verbose_name=_('Содержание'))
    
    # Автор и категория
    author = models.ForeignKey(User, on_delete=models.CASCADE, related_name='posts', verbose_name=_('Автор'))
    category = models.ForeignKey(Category, on_delete=models.CASCADE, related_name='posts', verbose_name=_('Категория'))
    
    # Статус
    status = models.CharField(max_length=10, choices=STATUS_CHOICES, default='draft', verbose_name=_('Статус'))
    
    # SEO поля
    meta_title = models.CharField(max_length=60, blank=True, verbose_name=_('Meta Title'))
    meta_description = models.TextField(max_length=160, blank=True, verbose_name=_('Meta Description'))
    meta_keywords = models.CharField(max_length=255, blank=True, verbose_name=_('Meta Keywords'))
    

    
    # Статистика
    views_count = models.PositiveIntegerField(default=0, verbose_name=_('Количество просмотров'))
    likes_count = models.PositiveIntegerField(default=0, verbose_name=_('Количество лайков'))
    comments_count = models.PositiveIntegerField(default=0, verbose_name=_('Количество комментариев'))
    
    # Даты
    created_at = models.DateTimeField(auto_now_add=True, verbose_name=_('Дата создания'))
    updated_at = models.DateTimeField(auto_now=True, verbose_name=_('Дата обновления'))
    published_at = models.DateTimeField(blank=True, null=True, verbose_name=_('Дата публикации'))
    
    # Уникальный идентификатор для SEO
    uuid = models.UUIDField(editable=False, unique=True, null=True)
    
    class Meta:
        verbose_name = _('Пост')
        verbose_name_plural = _('Посты')
        ordering = ['-created_at']
        indexes = [
            models.Index(fields=['status', 'published_at']),
            models.Index(fields=['category', 'status']),
            models.Index(fields=['author', 'status']),
        ]
    
    def __str__(self):
        return self.title
    
    @property
    def can_comment(self):
        """Комментарии всегда разрешены"""
        return True
    
    def save(self, *args, **kwargs):
        # Генерируем slug если его нет
        if not self.slug:
            base_slug = slugify(self.title)
            if not base_slug:
                # Используем ID поста вместо 'post' для избежания конфликтов
                base_slug = f"post-{self.id or 'new'}"
            
            # Проверяем уникальность slug
            slug = base_slug
            counter = 1
            while Post.objects.filter(slug=slug).exclude(id=self.id).exists():
                slug = f"{base_slug}-{counter}"
                counter += 1
            
            self.slug = slug
        
        # Дополнительная проверка: если slug все еще проблематичный, исправляем его
        problematic_slugs = ['post', 'api', 'admin', 'static', 'media', 'login', 'register', 'logout', 'create', 'edit', 'delete']
        if self.slug in problematic_slugs:
            # Создаем новый slug на основе заголовка или ID
            new_base = slugify(self.title) or f"post-{self.id}"
            if new_base in problematic_slugs:
                new_base = f"post-{self.id}"
            
            # Проверяем уникальность нового slug
            new_slug = new_base
            counter = 1
            while Post.objects.filter(slug=new_slug).exclude(id=self.id).exists():
                new_slug = f"{new_base}-{counter}"
                counter += 1
            
            self.slug = new_slug
        
        # Генерируем UUID если его нет
        if not self.uuid:
            self.uuid = uuid.uuid4()
        
        # Автоматически заполняем SEO поля
        self._auto_fill_seo_fields()
        
        # Устанавливаем дату публикации при первом опубликовании
        if self.status == 'published' and not self.published_at:
            from django.utils import timezone
            self.published_at = timezone.now()
        
        super().save(*args, **kwargs)
    
    def _auto_fill_seo_fields(self):
        """Автоматическое заполнение SEO полей на основе данных поста"""
        # Meta Title - используем заголовок поста (до 60 символов)
        if not self.meta_title:
            self.meta_title = self.title[:60]
        
        # Meta Description - используем краткое описание + начало контента (до 160 символов)
        if not self.meta_description:
            description = self.short_description
            if len(description) < 160 and self.content:
                # Добавляем начало контента, убирая HTML теги
                import re
                clean_content = re.sub(r'<[^>]+>', '', self.content)
                clean_content = re.sub(r'\s+', ' ', clean_content).strip()
                
                remaining_chars = 160 - len(description) - 3  # 3 для " - "
                if remaining_chars > 0:
                    content_preview = clean_content[:remaining_chars]
                    if len(clean_content) > remaining_chars:
                        content_preview = content_preview.rsplit(' ', 1)[0] + '...'
                    description = f"{description} - {content_preview}"
            
            self.meta_description = description[:160]
        
        # Meta Keywords - используем категорию + ключевые слова из заголовка
        if not self.meta_keywords:
            keywords = []
            
            # Добавляем категорию
            if self.category:
                keywords.append(self.category.name.lower())
            
            # Извлекаем ключевые слова из заголовка (слова длиннее 3 букв)
            import re
            title_words = re.findall(r'\b\w{4,}\b', self.title.lower())
            # Исключаем стоп-слова
            stop_words = {'это', 'быть', 'что', 'как', 'для', 'если', 'когда', 'где', 'почему', 'какой', 'какая', 'какие', 'какое', 'мой', 'моя', 'мои', 'мое', 'наш', 'наша', 'наши', 'наше', 'ваш', 'ваша', 'ваши', 'ваше', 'их', 'ее', 'его', 'их', 'себя', 'сам', 'сама', 'сами', 'само', 'очень', 'более', 'менее', 'самый', 'самая', 'самые', 'самое', 'все', 'вся', 'все', 'все', 'каждый', 'каждая', 'каждые', 'каждое', 'любой', 'любая', 'любые', 'любое', 'другой', 'другая', 'другие', 'другое', 'такой', 'такая', 'такие', 'такое', 'тот', 'та', 'те', 'то', 'этот', 'эта', 'эти', 'это', 'таков', 'такова', 'таковы', 'таково'}
            title_keywords = [word for word in title_words if word not in stop_words][:5]
            keywords.extend(title_keywords)
            
            # Добавляем общие ключевые слова для блога мам
            mom_keywords = ['мама', 'материнство', 'дети', 'ребенок', 'семья', 'воспитание', 'беременность', 'роды', 'грудное вскармливание', 'прикорм', 'развитие', 'здоровье', 'уход']
            keywords.extend(mom_keywords)
            
            # Убираем дубликаты и ограничиваем длину
            unique_keywords = list(dict.fromkeys(keywords))  # Сохраняет порядок
            self.meta_keywords = ', '.join(unique_keywords[:10])  # Максимум 10 ключевых слов
    
    def get_absolute_url(self):
        return reverse('post_detail', kwargs={'slug': self.slug})
    
    def increment_views(self):
        """Увеличивает счетчик просмотров"""
        # Используем F() для атомарного увеличения, чтобы избежать race conditions
        from django.db.models import F
        print(f"Увеличиваем просмотры для поста {self.id} (текущее значение: {self.views_count})")
        Post.objects.filter(id=self.id).update(views_count=F('views_count') + 1)
        # Обновляем локальный объект
        self.refresh_from_db(fields=['views_count'])
        print(f"Просмотры увеличены для поста {self.id} (новое значение: {self.views_count})")
    
    @property
    def is_published(self):
        return self.status == 'published'
    


class Comment(models.Model):
    """Комментарии к постам"""
    post = models.ForeignKey(Post, on_delete=models.CASCADE, related_name='comments', verbose_name=_('Пост'))
    author = models.ForeignKey(User, on_delete=models.CASCADE, related_name='comments', verbose_name=_('Автор'))
    parent = models.ForeignKey('self', on_delete=models.CASCADE, null=True, blank=True, related_name='replies', verbose_name=_('Родительский комментарий'))
    
    content = models.TextField(verbose_name=_('Содержание'))
    is_approved = models.BooleanField(default=False, verbose_name=_('Одобрен'))
    
    created_at = models.DateTimeField(auto_now_add=True, verbose_name=_('Дата создания'))
    updated_at = models.DateTimeField(auto_now=True, verbose_name=_('Дата обновления'))
    
    class Meta:
        verbose_name = _('Комментарий')
        verbose_name_plural = _('Комментарии')
        ordering = ['-created_at']
    
    def __str__(self):
        return f'Комментарий от {self.author} к посту {self.post.title}'
    
    def save(self, *args, **kwargs):
        super().save(*args, **kwargs)
        # Обновляем счетчик комментариев в посте
        self.post.comments_count = self.post.comments.filter(is_approved=True).count()
        self.post.save(update_fields=['comments_count'])
        
        # Создаем уведомление для автора поста о новом комментарии
        if self.is_approved and self.author != self.post.author:
            try:
                from users.models import Notification
                Notification.objects.create(
                    recipient=self.post.author,
                    sender=self.author,
                    notification_type='comment',
                    message=f'{self.author.first_name or self.author.username} оставил комментарий к вашему посту "{self.post.title}"',
                    post=self.post
                )
            except Exception as e:
                # Логируем ошибку, но не прерываем сохранение комментария
                print(f"Ошибка создания уведомления о комментарии: {e}")

class Like(models.Model):
    """Лайки к постам"""
    post = models.ForeignKey(Post, on_delete=models.CASCADE, related_name='likes', verbose_name=_('Пост'))
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='likes', verbose_name=_('Пользователь'))
    created_at = models.DateTimeField(auto_now_add=True, verbose_name=_('Дата создания'))
    
    class Meta:
        verbose_name = _('Лайк')
        verbose_name_plural = _('Лайки')
        unique_together = ['post', 'user']
        ordering = ['-created_at']
    
    def __str__(self):
        return f'Лайк от {self.user} к посту {self.post.title}'
    
    def save(self, *args, **kwargs):
        super().save(*args, **kwargs)
        # Обновляем счетчик лайков в посте
        self.post.likes_count = self.post.likes.count()
        self.post.save(update_fields=['likes_count'])
        
        # Создаем уведомление для автора поста о новом лайке
        if self.user != self.post.author:
            try:
                from users.models import Notification
                Notification.objects.create(
                    recipient=self.post.author,
                    sender=self.user,
                    notification_type='like',
                    message=f'{self.user.first_name or self.user.username} поставил лайк вашему посту "{self.post.title}"',
                    post=self.post
                )
            except Exception as e:
                # Логируем ошибку, но не прерываем сохранение лайка
                print(f"Ошибка создания уведомления о лайке: {e}")
    
    def delete(self, *args, **kwargs):
        super().delete(*args, **kwargs)
        # Обновляем счетчик лайков в посте
        self.post.likes_count = self.post.likes.count()
        self.post.save(update_fields=['likes_count'])
