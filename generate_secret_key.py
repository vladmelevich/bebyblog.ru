#!/usr/bin/env python3
"""
Генератор секретного ключа для Django
"""

import secrets
import string

def generate_secret_key():
    """Генерирует безопасный секретный ключ для Django"""
    alphabet = string.ascii_letters + string.digits + '!@#$%^&*(-_=+)'
    secret_key = ''.join(secrets.choice(alphabet) for _ in range(50))
    return secret_key

if __name__ == '__main__':
    secret_key = generate_secret_key()
    print(f"SECRET_KEY={secret_key}")
    print("\nСкопируйте этот ключ в файл env.production")
