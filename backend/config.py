import os
from datetime import timedelta

class Config:
    SECRET_KEY = os.environ.get('SECRET_KEY', 'dev-key-change-in-production')
    SQLALCHEMY_TRACK_MODIFICATIONS = False
    JWT_SECRET_KEY = os.environ.get('JWT_SECRET_KEY', SECRET_KEY)
    JWT_ACCESS_TOKEN_EXPIRES = timedelta(days=1)
    UPLOAD_FOLDER = os.path.join(os.path.dirname(os.path.abspath(__file__)), 'files', 'uploads')
    TRANSLATION_FOLDER = os.path.join(os.path.dirname(os.path.abspath(__file__)), 'files', 'translations')
    MAX_CONTENT_LENGTH = 50 * 1024 * 1024  # 50 MB максимальний розмір завантаження
    OTRANSLATOR_API_URL = 'https://api.otranslator.com/v1'
    OTRANSLATOR_API_KEY = os.environ.get('OTRANSLATOR_API_KEY')
    PAYPAL_CLIENT_ID = os.environ.get('PAYPAL_CLIENT_ID')
    PAYPAL_CLIENT_SECRET = os.environ.get('PAYPAL_CLIENT_SECRET')
    PAYPAL_MODE = os.environ.get('PAYPAL_MODE', 'sandbox')

class DevelopmentConfig(Config):
    DEBUG = True
    SQLALCHEMY_DATABASE_URI = os.environ.get('DATABASE_URL', 'postgresql://translator_user:secure_db_password@db:5432/translator_db')
    REDIS_URL = os.environ.get('REDIS_URL', 'redis://redis:6379/0')

class ProductionConfig(Config):
    DEBUG = False
    SQLALCHEMY_DATABASE_URI = os.environ.get('DATABASE_URL')
    REDIS_URL = os.environ.get('REDIS_URL')
    # Додаткові налаштування для продакшн

class TestingConfig(Config):
    TESTING = True
    SQLALCHEMY_DATABASE_URI = os.environ.get('TEST_DATABASE_URL', 'postgresql://test_user:test_password@db:5432/test_db')

config_by_name = {
    'development': DevelopmentConfig,
    'production': ProductionConfig,
    'testing': TestingConfig
}

def get_config():
    env = os.environ.get('FLASK_ENV', 'development')
    return config_by_name[env]