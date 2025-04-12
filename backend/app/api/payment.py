from flask import Blueprint, request, jsonify, current_app
import paypalrestsdk
from app import db
from app.models.user import User, UserBalance
from app.models.payment import Subscription, PaymentTransaction
from app.utils.auth import token_required
from datetime import datetime, timedelta

payment_bp = Blueprint('payment', __name__)

# Налаштування PayPal SDK
paypalrestsdk.configure({
    "mode": current_app.config.get('PAYPAL_MODE', 'sandbox'),
    "client_id": current_app.config.get('PAYPAL_CLIENT_ID'),
    "client_secret": current_app.config.get('PAYPAL_CLIENT_SECRET')
})

@payment_bp.route('/create', methods=['POST'])
@token_required
def create_payment(current_user):
    """Створення одноразової оплати через PayPal"""
    data = request.json
    amount = data.get('amount')

    if not amount or float(amount) <= 0:
        return jsonify({'error': 'Invalid amount'}), 400

    try:
        # Створення платежу в PayPal
        payment = paypalrestsdk.Payment({
            "intent": "sale",
            "payer": {
                "payment_method": "paypal"
            },
            "redirect_urls": {
                "return_url": f"{request.host_url}api/payment/success",
                "cancel_url": f"{request.host_url}api/payment/cancel"
            },
            "transactions": [{
                "amount": {
                    "total": str(amount),
                    "currency": "USD"
                },
                "description": f"Add funds to translator balance - {amount} USD"
            }]
        })

        if payment.create():
            # Збереження інформації про транзакції в БД для подальшої обробки
            transaction = PaymentTransaction(
                user_id=current_user.id,
                transaction_id=payment.id,
                amount=float(amount),
                currency="USD",
                status="pending",
                payment_method="paypal"
            )
            db.session.add(transaction)
            db.session.commit()

            # Повернення URL для перенаправлення на PayPal
            for link in payment.links:
                if link.rel == "approval_url":
                    return jsonify({
                        'payment_id': payment.id,
                        'approval_url': link.href
                    })
        else:
            return jsonify({'error': payment.error}), 400

    except Exception as e:
        return jsonify({'error': str(e)}), 500

@payment_bp.route('/success', methods=['GET'])
def payment_success():
    """Обробка успішної оплати від PayPal"""
    payment_id = request.args.get('paymentId')
    payer_id = request.args.get('PayerID')

    if not payment_id or not payer_id:
        return jsonify({'error': 'Missing payment information'}), 400

    try:
        payment = paypalrestsdk.Payment.find(payment_id)

        if payment.execute({"payer_id": payer_id}):
            # Оновлення статусу транзакції
            transaction = PaymentTransaction.query.filter_by(transaction_id=payment_id).first()

            if transaction:
                transaction.status = "completed"

                # Оновлення балансу користувача
                user_balance = UserBalance.query.filter_by(user_id=transaction.user_id).first()
                if user_balance:
                    user_balance.balance = float(user_balance.balance) + float(transaction.amount)
                    user_balance.last_updated = datetime.utcnow()

                db.session.commit()

                return jsonify({
                    'message': 'Payment successful',
                    'transaction_id': transaction.id
                })
            else:
                return jsonify({'error': 'Transaction not found'}), 404
        else:
            return jsonify({'error': payment.error}), 400

    except Exception as e:
        return jsonify({'error': str(e)}), 500

@payment_bp.route('/subscribe', methods=['POST'])
@token_required
def create_subscription(current_user):
    """Створення підписки через PayPal"""
    data = request.json
    plan_id = data.get('plan_id')

    if not plan_id:
        return jsonify({'error': 'Missing plan ID'}), 400

    try:
        # В реальному коді тут би отримувався план з PayPal або з локальної БД
        # Для демонстрації використовуємо фіксовані значення
        plans = {
            "basic": {"amount": 10.00, "bonus": 5},
            "standard": {"amount": 25.00, "bonus": 10},
            "premium": {"amount": 50.00, "bonus": 20}
        }

        if plan_id not in plans:
            return jsonify({'error': 'Invalid plan ID'}), 400

        plan = plans[plan_id]

        # Створення платежу для підписки
        payment = paypalrestsdk.Payment({
            "intent": "sale",
            "payer": {
                "payment_method": "paypal"
            },
            "redirect_urls": {
                "return_url": f"{request.host_url}api/payment/subscription/success",
                "cancel_url": f"{request.host_url}api/payment/subscription/cancel"
            },
            "transactions": [{
                "amount": {
                    "total": str(plan["amount"]),
                    "currency": "USD"
                },
                "description": f"Subscription to {plan_id.capitalize()} plan"
            }]
        })

        if payment.create():
            # Створення підписки в БД
            subscription = Subscription(
                user_id=current_user.id,
                paypal_subscription_id=payment.id,
                status="pending",
                amount=plan["amount"],
                currency="USD",
                bonus_percentage=plan["bonus"],
                start_date=datetime.utcnow(),
                end_date=datetime.utcnow() + timedelta(days=30)
            )
            db.session.add(subscription)
            db.session.commit()

            # Створення транзакції для цієї підписки
            transaction = PaymentTransaction(
                user_id=current_user.id,
                subscription_id=subscription.id,
                transaction_id=payment.id,
                amount=plan["amount"],
                currency="USD",
                status="pending",
                payment_method="paypal"
            )
            db.session.add(transaction)
            db.session.commit()

            # Повернення URL для перенаправлення на PayPal
            for link in payment.links:
                if link.rel == "approval_url":
                    return jsonify({
                        'payment_id': payment.id,
                        'approval_url': link.href,
                        'subscription_id': subscription.id
                    })

        else:
            return jsonify({'error': payment.error}), 400

    except Exception as e:
        return jsonify({'error': str(e)}), 500

@payment_bp.route('/subscription/success', methods=['GET'])
def subscription_success():
    """Обробка успішної оплати підписки"""
    payment_id = request.args.get('paymentId')
    payer_id = request.args.get('PayerID')

    if not payment_id or not payer_id:
        return jsonify({'error': 'Missing payment information'}), 400

    try:
        payment = paypalrestsdk.Payment.find(payment_id)

        if payment.execute({"payer_id": payer_id}):
            # Оновлення статусу підписки
            subscription = Subscription.query.filter_by(paypal_subscription_id=payment_id).first()

            if subscription:
                subscription.status = "active"

                # Оновлення статусу транзакції
                transaction = PaymentTransaction.query.filter_by(transaction_id=payment_id).first()
                if transaction:
                    transaction.status = "completed"

                # Оновлення балансу користувача з бонусом
                user_balance = UserBalance.query.filter_by(user_id=subscription.user_id).first()
                if user_balance:
                    bonus_amount = subscription.amount * (1 + subscription.bonus_percentage / 100)
                    user_balance.balance = float(user_balance.balance) + float(bonus_amount)
                    user_balance.last_updated = datetime.utcnow()

                db.session.commit()

                return jsonify({
                    'message': 'Subscription successful',
                    'subscription_id': subscription.id
                })
            else:
                return jsonify({'error': 'Subscription not found'}), 404
        else:
            return jsonify({'error': payment.error}), 400

    except Exception as e:
        return jsonify({'error': str(e)}), 500

@payment_bp.route('/plans', methods=['GET'])
@token_required
def get_subscription_plans(current_user):
    """Отримання доступних планів підписки"""
    plans = [
        {
            "id": "basic",
            "name": "Basic",
            "price": 10.00,
            "bonus_percentage": 5,
            "description": "Basic subscription with 5% bonus credit"
        },
        {
            "id": "standard",
            "name": "Standard",
            "price": 25.00,
            "bonus_percentage": 10,
            "description": "Standard subscription with 10% bonus credit"
        },
        {
            "id": "premium",
            "name": "Premium",
            "price": 50.00,
            "bonus_percentage": 20,
            "description": "Premium subscription with 20% bonus credit"
        }
    ]

    return jsonify(plans)

@payment_bp.route('/transactions', methods=['GET'])
@token_required
def get_transactions(current_user):
    """Отримання історії транзакцій користувача"""
    transactions = PaymentTransaction.query.filter_by(user_id=current_user.id).order_by(PaymentTransaction.created_at.desc()).all()

    result = []
    for transaction in transactions:
        transaction_data = {
            "id": transaction.id,
            "transaction_id": transaction.transaction_id,
            "amount": float(transaction.amount),
            "currency": transaction.currency,
            "status": transaction.status,
            "payment_method": transaction.payment_method,
            "created_at": transaction.created_at.isoformat(),
            "subscription_id": transaction.subscription_id
        }
        result.append(transaction_data)

    return jsonify(result)