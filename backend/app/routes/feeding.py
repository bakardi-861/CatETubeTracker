from datetime import date
from flask import Blueprint, request, jsonify
from flask_login import login_required, current_user
from app.models import FeedingLog, DailyFeedingTracker
from app import db, cache, limiter

feeding_bp = Blueprint('feeding', __name__)

def get_or_create_today_tracker(user_id):
    """Get or create today's feeding tracker for a specific user"""
    today = date.today()
    tracker = DailyFeedingTracker.query.filter_by(
        user_id=user_id, 
        target_date=today
    ).first()
    
    if not tracker:
        # Get user's default daily target
        from app.models import User
        user = User.query.get(user_id)
        daily_target = user.daily_target_ml if user else 210.0
        
        tracker = DailyFeedingTracker(
            user_id=user_id,
            daily_target_ml=daily_target,
            target_date=today
        )
        db.session.add(tracker)
        # print(f"Created new tracker for user {user_id} on {today}")
    
    return tracker

# Test endpoint removed for production security

@feeding_bp.route('/', methods=['POST'])
@login_required
@limiter.limit("60 per minute")
def create_feeding():
    """Log feeding for authenticated user"""
    try:
        data = request.get_json()
        
        # Validate required fields
        if not data or 'amount_ml' not in data:
            return jsonify({"error": "amount_ml is required"}), 400
            
        amount_ml = data.get('amount_ml', 0)
        if amount_ml <= 0:
            return jsonify({"error": "amount_ml must be greater than 0"}), 400

        # Create feeding log with user association
        log = FeedingLog(
            user_id=current_user.id,
            amount_ml=amount_ml,
            flushed_before=data.get('flushed_before', True),
            flushed_after=data.get('flushed_after', True)
        )
        db.session.add(log)
        
        # Update daily tracker
        tracker = get_or_create_today_tracker(current_user.id)
        tracker.add_feeding(amount_ml)
        
        # Clear cache for this user's tracker
        cache.delete(f'tracker_today_{current_user.id}')
        
        # Commit both the feeding log and tracker update
        db.session.commit()
        
        return jsonify({
            "message": "Feeding logged successfully",
            "data": {
                "id": log.id,
                "amount_ml": log.amount_ml,
                "time_given": log.time_given.isoformat(),
                "flushed_before": log.flushed_before,
                "flushed_after": log.flushed_after
            },
            "tracker": {
                "remaining_ml": tracker.remaining_ml,
                "total_fed_ml": tracker.total_fed_ml,
                "daily_target_ml": tracker.daily_target_ml,
                "progress_percentage": tracker.get_progress_percentage(),
                "feeding_count": tracker.feeding_count,
                "is_completed": tracker.is_completed()
            }
        }), 201

    except Exception as e:
        db.session.rollback()
        return jsonify({"error": "Failed to log feeding"}), 500

@feeding_bp.route('/', methods=['GET'])
@login_required
@limiter.limit("200 per minute")
def get_feedings():
    try:
        page = request.args.get('page', 1, type=int)
        per_page = min(request.args.get('per_page', 50, type=int), 100)
        
        # Use pagination for better performance
        logs = FeedingLog.query.filter_by(user_id=current_user.id)\
            .order_by(FeedingLog.time_given.desc())\
            .paginate(
                page=page, 
                per_page=per_page, 
                error_out=False
            )
        
        return jsonify({
            'logs': [log.to_dict() for log in logs.items],
            'pagination': {
                'page': page,
                'pages': logs.pages,
                'per_page': per_page,
                'total': logs.total,
                'has_next': logs.has_next,
                'has_prev': logs.has_prev
            }
        })
        
    except Exception as e:
        # print(f"Error getting feedings: {str(e)}")
        return jsonify({"error": str(e)}), 500
