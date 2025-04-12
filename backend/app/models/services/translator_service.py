import os
import requests
from app import db
from app.models.translation import Book, TranslationJob
from pypdf2 import PdfReader
import tempfile

class TranslatorService:
    def __init__(self):
        self.api_key = os.environ.get('OTRANSLATOR_API_KEY')
        self.api_url = 'https://api.otranslator.com/v1/translate'  # Приклад URL, потрібно підставити реальний

    def count_pages_and_chars(self, file_path):
        """Підраховує кількість сторінок і символів у PDF-файлі."""
        try:
            with open(file_path, 'rb') as f:
                pdf = PdfReader(f)
                pages = len(pdf.pages)

                # Підрахунок символів
                char_count = 0
                for page in pdf.pages:
                    text = page.extract_text()
                    if text:
                        char_count += len(text)

                return pages, char_count
        except Exception as e:
            print(f"Error counting pages and characters: {e}")
            return 0, 0

    def calculate_cost(self, model_type, pages=0, chars=0):
        """Обчислює вартість перекладу на основі моделі."""
        if model_type == 1:  # 30 центів за сторінку
            return round(0.30 * pages, 2)
        elif model_type == 2:  # 80 центів за 1860 символів
            return round(0.80 * (chars / 1860), 2)
        return 0

    def translate_document(self, job_id):
        """Перекладає документ, використовуючи API o.translator."""
        # Отримати інформацію про завдання з бази даних
        job = TranslationJob.query.get(job_id)
        if not job:
            return False, "Job not found"

        book = Book.query.get(job.book_id)
        if not book:
            return False, "Book not found"

        # Оновити статус
        job.status = "processing"
        db.session.commit()

        try:
            # Відправити запит до API o.translator
            headers = {
                "Authorization": f"Bearer {self.api_key}",
                "Content-Type": "application/json"
            }

            # Для demo використовуємо текстовий формат,
            # в реальності потрібно використовувати документи (multipart/form-data)
            with open(book.storage_path, 'rb') as f:
                payload = {
                    "source_language": book.source_language,
                    "target_language": job.target_language,
                    # Тут має бути логіка для відправки файлу та отримання перекладу
                }

                # Псевдокод для демонстрації - насправді треба імплементувати правильно
                # response = requests.post(self.api_url, headers=headers, json=payload, files={'file': f})

                # Для демо просто створюємо файл результату
                with tempfile.NamedTemporaryFile(delete=False, suffix='.pdf') as tf:
                    result_path = os.path.join('files', 'translations', f"translated_{job.id}.pdf")

                    # Тут був би код, який зберігає переклад з відповіді API

                    # Оновити дані у БД
                    job.status = "completed"
                    job.actual_cost = job.estimated_cost  # Для demo припускаємо, що вартість не змінилася
                    job.result_path = result_path
                    job.completed_at = db.func.now()
                    db.session.commit()

                    return True, result_path

        except Exception as e:
            # У випадку помилки
            job.status = "failed"
            db.session.commit()
            return False, str(e)