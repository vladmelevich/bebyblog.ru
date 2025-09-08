#!/usr/bin/env python3
"""
Скрипт для запуска бэкенда чата
"""

import os
import sys
import subprocess
from pathlib import Path

def check_python_version():
    """Проверка версии Python"""
    if sys.version_info < (3, 8):
        print("❌ Требуется Python 3.8 или выше")
        sys.exit(1)
    print(f"✅ Python {sys.version_info.major}.{sys.version_info.minor}")

def check_requirements():
    """Проверка и установка зависимостей"""
    requirements_file = Path(__file__).parent / "requirements.txt"
    
    if not requirements_file.exists():
        print("❌ Файл requirements.txt не найден")
        sys.exit(1)
    
    print("📦 Установка зависимостей...")
    try:
        subprocess.run([sys.executable, "-m", "pip", "install", "-r", str(requirements_file)], 
                      check=True, capture_output=True)
        print("✅ Зависимости установлены")
    except subprocess.CalledProcessError as e:
        print(f"❌ Ошибка установки зависимостей: {e}")
        sys.exit(1)

def check_env_file():
    """Проверка файла .env"""
    env_file = Path(__file__).parent / ".env"
    env_example = Path(__file__).parent / "env_example"
    
    if not env_file.exists():
        if env_example.exists():
            print("📝 Создание файла .env из примера...")
            with open(env_example, 'r', encoding='utf-8') as f:
                content = f.read()
            with open(env_file, 'w', encoding='utf-8') as f:
                f.write(content)
            print("✅ Файл .env создан. Отредактируйте его перед запуском!")
            return False
        else:
            print("❌ Файл .env не найден и нет примера")
            sys.exit(1)
    
    print("✅ Файл .env найден")
    return True

def create_directories():
    """Создание необходимых директорий"""
    media_dir = Path(__file__).parent / "media"
    avatars_dir = media_dir / "avatars"
    messages_dir = media_dir / "messages"
    
    for directory in [media_dir, avatars_dir, messages_dir]:
        directory.mkdir(exist_ok=True)
    
    print("✅ Директории созданы")

def start_server():
    """Запуск сервера"""
    print("🚀 Запуск сервера...")
    print("📍 Сервер будет доступен по адресу: http://localhost:8000")
    print("📖 API документация: http://localhost:8000/docs")
    print("🔄 WebSocket: ws://localhost:8000/ws/{user_id}")
    print("\n" + "="*50)
    
    try:
        subprocess.run([sys.executable, "main.py"], cwd=Path(__file__).parent)
    except KeyboardInterrupt:
        print("\n👋 Сервер остановлен")

def main():
    """Основная функция"""
    print("🎯 Запуск бэкенда чата")
    print("="*50)
    
    # Проверки
    check_python_version()
    check_requirements()
    create_directories()
    
    if not check_env_file():
        print("\n⚠️  Отредактируйте файл .env и запустите скрипт снова")
        return
    
    # Запуск сервера
    start_server()

if __name__ == "__main__":
    main()







