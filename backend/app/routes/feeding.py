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

@feeding_bp.route('/test', methods=['POST'])
@limiter.limit("60 per minute")
def test_feeding():
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
        
        # Create feeding log
        log = FeedingLog(
            amount_ml=data.get('amount_ml', 0),
            flushed_before=data.get('flushed_before', True),
            flushed_after=data.get('flushed_after', True),
            user_id=test_user.id
        )
        db.session.add(log)
        
        # Update daily tracker
        amount_ml = data.get('amount_ml', 0)
        if amount_ml > 0:
            tracker = get_or_create_today_tracker(test_user.id)
            old_remaining = tracker.remaining_ml
            tracker.add_feeding(amount_ml)
            
            db.session.commit()
            
            return jsonify({
                "message": "Feeding logged to database!",
                "data": {
                    "amount_ml": log.amount_ml,
                    "time_given": log.time_given.isoformat(),
                    "id": log.id,
                    "user_id": log.user_id
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
        else:
            db.session.commit()
            return jsonify({
                "message": "Feeding logged to database!",
                "data": {
                    "amount_ml": log.amount_ml,
                    "time_given": log.time_given.isoformat(),
                    "id": log.id,
                    "user_id": log.user_id
                }
            }), 201
    except Exception as e:
        db.session.rollback()
        return jsonify({"error": str(e)}), 500

@feeding_bp.route('/', methods=['POST'])
@login_required
@limiter.limit("60 per minute")
def create_feeding():
    # print("POST /api/feeding/ called")

    try:
        data = request.get_json()
        # print("Received JSON:", data)

        # Create feeding log with user association
        log = FeedingLog(user_id=current_user.id, **data)
        db.session.add(log)
        
        # Update daily tracker
        amount_ml = data.get('amount_ml', 0)
        if amount_ml > 0:
            tracker = get_or_create_today_tracker(current_user.id)
            old_remaining = tracker.remaining_ml
            tracker.add_feeding(amount_ml)
            
            # Clear cache for this user's tracker
            cache.delete(f'tracker_today_{current_user.id}')
            
            # print(f"Updated tracker: {amount_ml}mL fed, {tracker.remaining_ml}mL remaining")
            
            # Commit both the feeding log and tracker update
            db.session.commit()
            
            return jsonify({
                "message": "Feeding logged and tracker updated.",
                "tracker": {
                    "remaining_ml": tracker.remaining_ml,
                    "total_fed_ml": tracker.total_fed_ml,
                    "daily_target_ml": tracker.daily_target_ml,
                    "progress_percentage": tracker.get_progress_percentage(),
                    "feeding_count": tracker.feeding_count,
                    "is_completed": tracker.is_completed()
                }
            }), 201
        else:
            db.session.commit()
            return jsonify({"message": "Feeding logged."}), 201

    except Exception as e:
        db.session.rollback()
        # print("Exception while saving feeding:", str(e))
        return jsonify({"error": str(e)}), 500

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
