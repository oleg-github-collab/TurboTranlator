import os
from flask import Flask
from flask_sqlalchemy import SQLAlchemy
from flask_migrate import Migrate
from flask_cors import CORS
from dotenv import load_dotenv
load_dotenv()


# Ініціалізація розширень
db = SQLAlchemy()
migrate = Migrate()


def create_app():
    app = Flask(__name__)

    # 🔐 Конфігурація
    app.config['SECRET_KEY'] = os.environ.get('SECRET_KEY', 'dev_key')
    app.config['SQLALCHEMY_DATABASE_URI'] = os.environ.get('DATABASE_URL', 'sqlite:///dev.db')
    app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False

    # 🔌 Ініціалізація
    db.init_app(app)
    migrate.init_app(app, db)
    CORS(app)

    # 📦 Імпортуємо моделі (щоб Flask-Migrate бачив їх)
    from app.models import user

    # 🧩 Реєстрація blueprint'ів
    from app.api.auth import auth_bp
    from app.api.user import user_bp
    from app.api.translation import translation_bp
    from app.api.payment import payment_bp

    app.register_blueprint(auth_bp, url_prefix='/api/auth')
    app.register_blueprint(user_bp, url_prefix='/api/user')
    app.register_blueprint(translation_bp, url_prefix='/api/translation')
    app.register_blueprint(payment_bp, url_prefix='/api/payment')

    # 📂 Створення папок для файлів (якщо треба)
    os.makedirs(os.path.join(app.root_path, 'files', 'uploads'), exist_ok=True)
    os.makedirs(os.path.join(app.root_path, 'files', 'translations'), exist_ok=True)

    return app
