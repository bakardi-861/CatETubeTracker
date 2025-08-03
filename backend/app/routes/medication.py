from flask import Blueprint, request, jsonify
from flask_login import login_required, current_user
from app.models import MedicationLog
from app import db, limiter

medlog_bp = Blueprint('medication_log', __name__)

# Test endpoint removed for production security

@medlog_bp.route('/', methods=['POST'])
@login_required
@limiter.limit("60 per minute")
def create_medlog():
    """Log medication for authenticated user"""
    try:
        data = request.get_json()
        
        # Validate required fields
        required_fields = ['medication_name', 'dosage', 'amount_ml']
        for field in required_fields:
            if not data or not data.get(field):
                return jsonify({"error": f"{field} is required"}), 400
        
        # Validate amount
        if data.get('amount_ml', 0) <= 0:
            return jsonify({"error": "amount_ml must be greater than 0"}), 400

        # Create medication log with user association
        log = MedicationLog(
            user_id=current_user.id,
            medication_name=data.get('medication_name'),
            dosage=data.get('dosage'),
            amount_ml=data.get('amount_ml'),
            route=data.get('route', 'E-tube'),
            notes=data.get('notes', ''),
            flushed_before=data.get('flushed_before', True),
            flushed_after=data.get('flushed_after', True)
        )
        db.session.add(log)
        db.session.commit()

        return jsonify({
            "message": "Medication logged successfully",
            "data": log.to_dict()
        }), 201

    except Exception as e:
        db.session.rollback()
        return jsonify({"error": "Failed to log medication"}), 500

@medlog_bp.route('/', methods=['GET'])
def get_medlogs():
    logs = MedicationLog.query.order_by(MedicationLog.time_given.desc()).all()
    return jsonify([log.to_dict() for log in logs])