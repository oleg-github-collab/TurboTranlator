from flask import Blueprint, request, jsonify
from app import db
from app.models.user import User, UserProfile, UserBalance
from app.utils.auth import generate_token
from werkzeug.security import check_password_hash
from sqlalchemy.exc import IntegrityError
from datetime import datetime

auth_bp = Blueprint('auth', __name__)

@auth_bp.route('/register', methods=['POST'])
def register():
    """Реєстрація нового користувача"""
    data = request.json

    # Перевірка необхідних полів
    if not all(k in data for k in ['email', 'password']):
        return jsonify({'error': 'Missing required fields'}), 400

    # Перевірка на існуючу email
    if User.query.filter_by(email=data['email']).first():
        return jsonify({'error': 'Email already registered'}), 409

    try:
        # Створення користувача
        user = User(email=data['email'])
        user.set_password(data['password'])
        db.session.add(user)
        db.session.flush()  # отримати ID без коміту

        # Створення профілю
        profile = UserProfile(
            user_id=user.id,
            first_name=data.get('first_name', ''),
            last_name=data.get('last_name', ''),
            language=data.get('language', 'uk')
        )
        db.session.add(profile)

        # Створення балансу
        balance = UserBalance(user_id=user.id, balance=0.00)
        db.session.add(balance)

        db.session.commit()

        # Генерація токена
        token = generate_token(user.id)

        return jsonify({
            'message': 'User registered successfully',
            'token': token,
            'user': {
                'id': user.id,
                'email': user.email,
                'profile': profile.to_dict()
            }
        }), 201

    except IntegrityError:
        db.session.rollback()
        return jsonify({'error': 'Registration failed'}), 500

@auth_bp.route('/login', methods=['POST'])
def login():
    """Вхід користувача"""
    data = request.json

    if not all(k in data for k in ['email', 'password']):
        return jsonify({'error': 'Missing email or password'}), 400

    user = User.query.filter_by(email=data['email']).first()

    if not user or not check_password_hash(user.password, data['password']):
        return jsonify({'error': 'Invalid credentials'}), 401

    # Оновити дату останнього входу
    user.last_login = datetime.utcnow()
    db.session.commit()

    token = generate_token(user.id)

    return jsonify({
        'message': 'Login successful',
        'token': token,
        'user': user.to_dict()
    }), 200

@auth_bp.route('/check-token', methods=['GET'])
def check_token():
    """Перевірка валідності токена"""
    from app.utils.auth import token_required

    @token_required
    def validate_token(current_user):
        return jsonify({
            'valid': True,
            'user': current_user.to_dict()
        }), 200

    return validate_token()