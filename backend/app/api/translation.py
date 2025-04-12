import os
from flask import Blueprint, request, jsonify, current_app
from werkzeug.utils import secure_filename
from app import db
from app.models.user import User, UserBalance
from app.models.translation import Book, TranslationJob
from app.services.translator_service import TranslatorService
from app.utils.auth import token_required

translation_bp = Blueprint('translation', __name__)
translator_service = TranslatorService()

@translation_bp.route('/upload-book', methods=['POST'])
@token_required
def upload_book(current_user):
    """Завантаження книги для перекладу."""
    if 'file' not in request.files:
        return jsonify({'error': 'No file provided'}), 400

    file = request.files['file']
    if file.filename == '':
        return jsonify({'error': 'No file selected'}), 400

    if not file.filename.lower().endswith(('.pdf', '.epub', '.txt', '.docx')):
        return jsonify({'error': 'Unsupported file format'}), 400

    # Зберегти файл
    filename = secure_filename(file.filename)
    file_path = os.path.join(current_app.root_path, 'files', 'uploads', f"user_{current_user.id}_{filename}")
    file.save(file_path)

    # Підрахувати сторінки та символи
    pages, chars = translator_service.count_pages_and_chars(file_path)

    # Зберегти інформацію про книгу
    book = Book(
        user_id=current_user.id,
        original_filename=filename,
        storage_path=file_path,
        file_size=os.path.getsize(file_path),
        page_count=pages,
        char_count=chars,
        source_language=request.form.get('source_language', 'auto')
    )
    db.session.add(book)
    db.session.commit()

    return jsonify({
        'book_id': book.id,
        'filename': filename,
        'pages': pages,
        'chars': chars
    }), 201

@translation_bp.route('/calculate-cost', methods=['POST'])
@token_required
def calculate_cost(current_user):
    """Обчислення вартості перекладу."""
    data = request.json
    book_id = data.get('book_id')
    model_type = data.get('model_type')

    if not book_id or not model_type:
        return jsonify({'error': 'Missing required parameters'}), 400

    book = Book.query.get(book_id)
    if not book or book.user_id != current_user.id:
        return jsonify({'error': 'Book not found'}), 404

    cost = translator_service.calculate_cost(
        model_type=model_type,
        pages=book.page_count,
        chars=book.char_count
    )

    return jsonify({
        'book_id': book_id,
        'model_type': model_type,
        'pages': book.page_count,
        'chars': book.char_count,
        'cost': cost
    })

@translation_bp.route('/start-translation', methods=['POST'])
@token_required
def start_translation(current_user):
    """Запуск процесу перекладу."""
    data = request.json
    book_id = data.get('book_id')
    model_type = data.get('model_type')
    target_language = data.get('target_language')

    if not all([book_id, model_type, target_language]):
        return jsonify({'error': 'Missing required parameters'}), 400

    # Перевірка книги
    book = Book.query.get(book_id)
    if not book or book.user_id != current_user.id:
        return jsonify({'error': 'Book not found'}), 404

    # Обчислення вартості
    cost = translator_service.calculate_cost(
        model_type=model_type,
        pages=book.page_count,
        chars=book.char_count
    )

    # Перевірка балансу
    balance = UserBalance.query.filter_by(user_id=current_user.id).first()
    if not balance or float(balance.balance) < cost:
        return jsonify({'error': 'Insufficient balance'}), 402  # Payment Required

    # Створення завдання на переклад
    job = TranslationJob(
        user_id=current_user.id,
        book_id=book_id,
        target_language=target_language,
        model_type=model_type,
        status="pending",
        estimated_cost=cost
    )
    db.session.add(job)

    # Списання коштів
    balance.balance = float(balance.balance) - cost
    balance.last_updated = db.func.now()

    db.session.commit()

    # Запуск асинхронного завдання на переклад
    from app.celery_worker import translate_document_task
    translate_document_task.delay(job.id)

    return jsonify({
        'job_id': job.id,
        'status': 'pending',
        'cost': cost
    }), 201

@translation_bp.route('/jobs', methods=['GET'])
@token_required
def get_jobs(current_user):
    """Отримання списку завдань на переклад."""
    jobs = TranslationJob.query.filter_by(user_id=current_user.id).order_by(TranslationJob.created_at.desc()).all()

    result = []
    for job in jobs:
        book = Book.query.get(job.book_id)
        job_data = {
            'id': job.id,
            'book_id': job.book_id,
            'filename': book.original_filename if book else None,
            'target_language': job.target_language,
            'model_type': job.model_type,
            'status': job.status,
            'cost': float(job.actual_cost) if job.actual_cost else float(job.estimated_cost),
            'created_at': job.created_at.isoformat(),
            'completed_at': job.completed_at.isoformat() if job.completed_at else None,
            'result_available': bool(job.result_path and job.status == 'completed')
        }
        result.append(job_data)

    return jsonify(result)

@translation_bp.route('/download/<int:job_id>', methods=['GET'])
@token_required
def download_translation(current_user, job_id):
    """Скачування перекладеного документа."""
    job = TranslationJob.query.get(job_id)

    if not job or job.user_id != current_user.id:
        return jsonify({'error': 'Job not found'}), 404

    if job.status != 'completed' or not job.result_path:
        return jsonify({'error': 'Translation not available'}), 404

    # Тут реалізація для скачування файлу
    return jsonify({'result_url': f'/files/translations/{os.path.basename(job.result_path)}'})