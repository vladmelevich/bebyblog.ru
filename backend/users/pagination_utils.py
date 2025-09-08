"""
Утилиты для оптимизированной пагинации
"""
from django.core.paginator import Paginator
from django.db.models import QuerySet
from typing import Dict, Any, List


def get_optimized_paginated_data(
    queryset: QuerySet,
    page: int = 1,
    page_size: int = 20,
    max_page_size: int = 100
) -> Dict[str, Any]:
    """
    Оптимизированная пагинация с ограничениями для производительности
    
    Args:
        queryset: QuerySet для пагинации
        page: Номер страницы (начиная с 1)
        page_size: Размер страницы
        max_page_size: Максимальный размер страницы
    
    Returns:
        Словарь с данными пагинации
    """
    # Ограничиваем размер страницы для производительности
    page_size = min(page_size, max_page_size)
    
    # Создаем пагинатор
    paginator = Paginator(queryset, page_size)
    
    # Получаем страницу
    try:
        page_obj = paginator.get_page(page)
    except:
        page_obj = paginator.get_page(1)
    
    return {
        'results': list(page_obj),
        'count': paginator.count,
        'num_pages': paginator.num_pages,
        'current_page': page_obj.number,
        'has_next': page_obj.has_next(),
        'has_previous': page_obj.has_previous(),
        'next_page': page_obj.next_page_number() if page_obj.has_next() else None,
        'previous_page': page_obj.previous_page_number() if page_obj.has_previous() else None,
    }


def get_cursor_paginated_data(
    queryset: QuerySet,
    cursor: str = None,
    page_size: int = 20,
    ordering_field: str = 'id'
) -> Dict[str, Any]:
    """
    Курсорная пагинация для больших наборов данных
    
    Args:
        queryset: QuerySet для пагинации
        cursor: Курсор для следующей страницы
        page_size: Размер страницы
        ordering_field: Поле для сортировки
    
    Returns:
        Словарь с данными курсорной пагинации
    """
    # Ограничиваем размер страницы
    page_size = min(page_size, 100)
    
    # Применяем курсор если есть
    if cursor:
        try:
            cursor_value = int(cursor)
            queryset = queryset.filter(**{f'{ordering_field}__gt': cursor_value})
        except (ValueError, TypeError):
            pass
    
    # Получаем данные
    results = list(queryset.order_by(ordering_field)[:page_size + 1])
    
    # Определяем есть ли следующая страница
    has_next = len(results) > page_size
    if has_next:
        results = results[:page_size]
    
    # Получаем курсор для следующей страницы
    next_cursor = None
    if has_next and results:
        last_item = results[-1]
        next_cursor = str(getattr(last_item, ordering_field))
    
    return {
        'results': results,
        'has_next': has_next,
        'next_cursor': next_cursor,
        'count': len(results),
    }
