from django.db import models
from django.utils.translation import gettext_lazy as _


class Category(models.Model):
    name = models.CharField(
        max_length=100, 
        unique=True,
        verbose_name=_('Название')
    )
    slug = models.SlugField(
        max_length=100, 
        unique=True,
        verbose_name=_('Slug')
    )
    description = models.TextField(
        blank=True,
        verbose_name=_('Описание')
    )
    icon = models.CharField(
        max_length=50,
        blank=True,
        verbose_name=_('Иконка')
    )
    created_at = models.DateTimeField(
        auto_now_add=True,
        verbose_name=_('Дата создания')
    )
    updated_at = models.DateTimeField(
        auto_now=True,
        verbose_name=_('Дата обновления')
    )
    
    class Meta:
        verbose_name = _('Категория')
        verbose_name_plural = _('Категории')
        ordering = ['name']
    
    def __str__(self):
        return self.name


class Service(models.Model):
    category = models.ForeignKey(
        Category,
        on_delete=models.CASCADE,
        related_name='services',
        verbose_name=_('Категория')
    )
    title = models.CharField(
        max_length=200,
        verbose_name=_('Название')
    )
    description = models.TextField(
        verbose_name=_('Описание')
    )
    icon = models.CharField(
        max_length=50,
        verbose_name=_('Иконка')
    )
    created_at = models.DateTimeField(
        auto_now_add=True,
        verbose_name=_('Дата создания')
    )
    
    class Meta:
        verbose_name = _('Сервис')
        verbose_name_plural = _('Сервисы')
        ordering = ['title']
    
    def __str__(self):
        return self.title
