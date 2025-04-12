from app import db
from datetime import datetime

class Book(db.Model):
    __tablename__ = 'books'

    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey('users.id'))
    original_filename = db.Column(db.String(255), nullable=False)
    storage_path = db.Column(db.String(255), nullable=False)
    file_size = db.Column(db.Integer, nullable=False)
    page_count = db.Column(db.Integer)
    char_count = db.Column(db.Integer)
    source_language = db.Column(db.String(5))
    upload_date = db.Column(db.DateTime, default=datetime.utcnow)

    # Зв'язки
    translations = db.relationship('TranslationJob', backref='book', lazy=True)

    def to_dict(self):
        return {
            'id': self.id,
            'original_filename': self.original_filename,
            'file_size': self.file_size,
            'page_count': self.page_count,
            'char_count': self.char_count,
            'source_language': self.source_language,
            'upload_date': self.upload_date.isoformat()
        }

class TranslationJob(db.Model):
    __tablename__ = 'translation_jobs'

    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey('users.id'))
    book_id = db.Column(db.Integer, db.ForeignKey('books.id'))
    target_language = db.Column(db.String(5), nullable=False)
    model_type = db.Column(db.SmallInteger, nullable=False)  # 1: 30 центів/сторінка, 2: 80 центів/1860 символів
    status = db.Column(db.String(50), nullable=False)  # pending, processing, completed, failed
    estimated_cost = db.Column(db.Numeric(10, 2))
    actual_cost = db.Column(db.Numeric(10, 2))
    result_path = db.Column(db.String(255))
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    completed_at = db.Column(db.DateTime)

    def to_dict(self):
        return {
            'id': self.id,
            'book_id': self.book_id,
            'target_language': self.target_language,
            'model_type': self.model_type,
            'status': self.status,
            'estimated_cost': float(self.estimated_cost) if self.estimated_cost else None,
            'actual_cost': float(self.actual_cost) if self.actual_cost else None,
            'result_path': self.result_path,
            'created_at': self.created_at.isoformat(),
            'completed_at': self.completed_at.isoformat() if self.completed_at else None
        }