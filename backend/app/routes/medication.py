from flask import Blueprint, request, jsonify
from flask_login import login_required, current_user
from app.models import MedicationLog
from app import db, limiter

medlog_bp = Blueprint('medication_log', __name__)

@medlog_bp.route('/test', methods=['POST'])
@limiter.limit("60 per minute")
def test_medication():
    """Test endpoint without authentication that saves to database"""
    try:
        data = request.get_json()
        
        # Get or create test user
        from app.models import User
        test_user = User.query.filter_by(email='test@example.com').first()
        if not test_user:
            test_user = User(
                email='test@example.com',
                first_name='Test',
                last_name='User',
                cat_name='Test Cat'
            )
            test_user.set_password('testpass123')
            db.session.add(test_user)
            db.session.flush()  # Get the ID without committing
        
        # Create medication log with user_id
        log = MedicationLog(
            user_id=test_user.id,
            medication_name=data.get('medication_name'),
            dosage=data.get('dosage'),
            amount_ml=data.get('amount_ml', 0),
            route=data.get('route', 'E-tube'),
            notes=data.get('notes', ''),
            flushed_before=data.get('flushed_before', True),
            flushed_after=data.get('flushed_after', True)
        )
        db.session.add(log)
        db.session.commit()

        return jsonify({
            "message": "Medication logged to database!",
            "data": log.to_dict()
        }), 201

    except Exception as e:
        db.session.rollback()
        return jsonify({"error": str(e)}), 500

@medlog_bp.route('/', methods=['POST'])
@login_required
@limiter.limit("60 per minute")
def create_medlog():
    # print("POST /api/medication_log/ called")

    try:
        data = request.get_json()
        # print("Received JSON:", data)

        # Create medication log with user association
        log = MedicationLog(user_id=current_user.id, **data)
        db.session.add(log)
        db.session.commit()

        return jsonify({"message": "Medication logged."}), 201

    except Exception as e:
        db.session.rollback()
        # print("Exception while saving medication log:", str(e))
        return jsonify({"error": str(e)}), 500

@medlog_bp.route('/', methods=['GET'])
def get_medlogs():
    logs = MedicationLog.query.order_by(MedicationLog.time_given.desc()).all()
    return jsonify([log.to_dict() for log in logs])