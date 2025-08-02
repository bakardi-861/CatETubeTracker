from datetime import date, datetime
from flask import Blueprint, request, jsonify
from app.models import DailyFeedingTracker
from app import db

tracker_bp = Blueprint('tracker', __name__)

def get_test_user():
    """Get the test user for testing tracker functionality"""
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
        db.session.flush()
    return test_user

def get_or_create_today_tracker(user_id, daily_target=210.0):
    """Get today's tracker or create if doesn't exist"""
    today = date.today()
    tracker = DailyFeedingTracker.query.filter_by(user_id=user_id, target_date=today).first()
    
    if not tracker:
        tracker = DailyFeedingTracker(user_id=user_id, daily_target_ml=daily_target, target_date=today)
        db.session.add(tracker)
        db.session.commit()
        # print(f"Created new tracker for user {user_id} on {today} with target {daily_target}mL")
    elif tracker.is_overdue():
        # Reset if somehow we have an old tracker
        tracker.reset_for_new_day(daily_target)
        db.session.commit()
        # print(f"Reset overdue tracker for user {user_id} on {today}")
    
    return tracker

@tracker_bp.route('/test/today', methods=['GET'])
def get_today_tracker_test():
    """Test endpoint: Get today's feeding tracker for test user"""
    try:
        test_user = get_test_user()
        tracker = get_or_create_today_tracker(test_user.id)
        return jsonify(tracker.to_dict())
    except Exception as e:
        # print(f"Error getting today's tracker: {str(e)}")
        return jsonify({"error": str(e)}), 500

@tracker_bp.route('/test/today', methods=['POST'])
def create_or_update_today_tracker_test():
    """Test endpoint: Create or update today's tracker with new daily target"""
    try:
        data = request.get_json()
        daily_target = data.get('daily_target_ml', 210.0)
        
        if daily_target <= 0:
            return jsonify({"error": "Daily target must be greater than 0"}), 400
            
        test_user = get_test_user()
        today = date.today()
        tracker = DailyFeedingTracker.query.filter_by(user_id=test_user.id, target_date=today).first()
        
        if tracker:
            # Update existing tracker
            old_target = tracker.daily_target_ml
            tracker.daily_target_ml = daily_target
            # Recalculate remaining based on new target
            tracker.remaining_ml = max(0, daily_target - tracker.total_fed_ml)
            tracker.last_updated = datetime.utcnow()
            message = f"Updated daily target from {old_target}mL to {daily_target}mL"
        else:
            # Create new tracker
            tracker = DailyFeedingTracker(user_id=test_user.id, daily_target_ml=daily_target, target_date=today)
            db.session.add(tracker)
            message = f"Created new tracker with {daily_target}mL daily target"
            
        db.session.commit()
        # print(f"{message}")
        
        return jsonify({
            "message": message,
            "tracker": tracker.to_dict()
        })
        
    except Exception as e:
        # print(f"Error creating/updating tracker: {str(e)}")
        return jsonify({"error": str(e)}), 500

@tracker_bp.route('/today', methods=['GET'])
def get_today_tracker():
    """Get today's feeding tracker"""
    try:
        tracker = get_or_create_today_tracker()
        return jsonify(tracker.to_dict())
    except Exception as e:
        # print(f"Error getting today's tracker: {str(e)}")
        return jsonify({"error": str(e)}), 500

@tracker_bp.route('/today', methods=['POST'])
def create_or_update_today_tracker():
    """Create or update today's tracker with new daily target"""
    try:
        data = request.get_json()
        daily_target = data.get('daily_target_ml', 210.0)
        
        if daily_target <= 0:
            return jsonify({"error": "Daily target must be greater than 0"}), 400
            
        today = date.today()
        tracker = DailyFeedingTracker.query.filter_by(target_date=today).first()
        
        if tracker:
            # Update existing tracker
            old_target = tracker.daily_target_ml
            tracker.daily_target_ml = daily_target
            # Recalculate remaining based on new target
            tracker.remaining_ml = max(0, daily_target - tracker.total_fed_ml)
            tracker.last_updated = datetime.utcnow()
            message = f"Updated daily target from {old_target}mL to {daily_target}mL"
        else:
            # Create new tracker
            tracker = DailyFeedingTracker(daily_target_ml=daily_target, target_date=today)
            db.session.add(tracker)
            message = f"Created new tracker with {daily_target}mL daily target"
            
        db.session.commit()
        # print(f"{message}")
        
        return jsonify({
            "message": message,
            "tracker": tracker.to_dict()
        })
        
    except Exception as e:
        # print(f"Error creating/updating tracker: {str(e)}")
        return jsonify({"error": str(e)}), 500

@tracker_bp.route('/add-feeding', methods=['POST'])
def add_feeding_to_tracker():
    """Add a feeding amount to today's tracker"""
    try:
        data = request.get_json()
        amount_ml = data.get('amount_ml')
        
        if not amount_ml or amount_ml <= 0:
            return jsonify({"error": "Invalid feeding amount"}), 400
            
        tracker = get_or_create_today_tracker()
        old_remaining = tracker.remaining_ml
        
        tracker.add_feeding(amount_ml)
        db.session.commit()
        
        # print(f"Added {amount_ml}mL feeding. Remaining: {tracker.remaining_ml}mL")
        
        return jsonify({
            "message": f"Added {amount_ml}mL feeding",
            "previous_remaining": old_remaining,
            "tracker": tracker.to_dict()
        })
        
    except Exception as e:
        # print(f"Error adding feeding: {str(e)}")
        return jsonify({"error": str(e)}), 500

@tracker_bp.route('/test/reset', methods=['POST'])
def reset_tracker_test():
    """Test endpoint: Manually reset today's tracker and delete today's feeding records for test user"""
    try:
        data = request.get_json() or {}
        new_daily_target = data.get('daily_target_ml')
        
        test_user = get_test_user()
        today = date.today()
        
        # Delete today's feeding records for this user
        from app.models import FeedingLog
        today_feedings = FeedingLog.query.filter(
            FeedingLog.user_id == test_user.id,
            db.func.date(FeedingLog.time_given) == today
        ).all()
        
        deleted_count = len(today_feedings)
        for feeding in today_feedings:
            db.session.delete(feeding)
        
        # Reset the tracker
        tracker = get_or_create_today_tracker(test_user.id)
        tracker.reset_for_new_day(new_daily_target)
        
        db.session.commit()
        
        # print(f"Deleted {deleted_count} feeding records and reset tracker with target {tracker.daily_target_ml}mL")
        
        return jsonify({
            "message": f"Deleted {deleted_count} feeding records and reset tracker successfully",
            "deleted_feedings": deleted_count,
            "tracker": tracker.to_dict()
        })
        
    except Exception as e:
        db.session.rollback()
        # print(f"Error resetting tracker: {str(e)}")
        return jsonify({"error": str(e)}), 500

@tracker_bp.route('/reset', methods=['POST'])
def reset_tracker():
    """Manually reset today's tracker and delete today's feeding records"""
    try:
        data = request.get_json() or {}
        new_daily_target = data.get('daily_target_ml')
        
        # Note: This would need current_user.id when authentication is implemented
        # For now, this endpoint won't work without authentication
        from flask_login import current_user
        if not current_user.is_authenticated:
            return jsonify({"error": "Authentication required"}), 401
            
        today = date.today()
        
        # Delete today's feeding records for this user
        from app.models import FeedingLog
        today_feedings = FeedingLog.query.filter(
            FeedingLog.user_id == current_user.id,
            db.func.date(FeedingLog.time_given) == today
        ).all()
        
        deleted_count = len(today_feedings)
        for feeding in today_feedings:
            db.session.delete(feeding)
        
        # Reset the tracker
        tracker = get_or_create_today_tracker(current_user.id)
        tracker.reset_for_new_day(new_daily_target)
        
        db.session.commit()
        
        # print(f"Deleted {deleted_count} feeding records and reset tracker with target {tracker.daily_target_ml}mL")
        
        return jsonify({
            "message": f"Deleted {deleted_count} feeding records and reset tracker successfully",
            "deleted_feedings": deleted_count,
            "tracker": tracker.to_dict()
        })
        
    except Exception as e:
        db.session.rollback()
        # print(f"Error resetting tracker: {str(e)}")
        return jsonify({"error": str(e)}), 500

@tracker_bp.route('/history', methods=['GET'])
def get_tracker_history():
    """Get feeding tracker history"""
    try:
        days = request.args.get('days', 7, type=int)
        
        trackers = DailyFeedingTracker.query.order_by(
            DailyFeedingTracker.target_date.desc()
        ).limit(days).all()
        
        return jsonify({
            "trackers": [tracker.to_dict() for tracker in trackers],
            "total_count": len(trackers)
        })
        
    except Exception as e:
        # print(f"Error getting tracker history: {str(e)}")
        return jsonify({"error": str(e)}), 500

@tracker_bp.route('/stats', methods=['GET'])
def get_tracker_stats():
    """Get tracker statistics"""
    try:
        # Get recent trackers for stats
        recent_trackers = DailyFeedingTracker.query.order_by(
            DailyFeedingTracker.target_date.desc()
        ).limit(30).all()
        
        if not recent_trackers:
            return jsonify({
                "total_days": 0,
                "completed_days": 0,
                "completion_rate": 0,
                "average_daily_intake": 0,
                "average_feedings_per_day": 0
            })
        
        total_days = len(recent_trackers)
        completed_days = sum(1 for t in recent_trackers if t.is_completed())
        completion_rate = (completed_days / total_days) * 100 if total_days > 0 else 0
        
        total_intake = sum(t.total_fed_ml for t in recent_trackers)
        average_daily_intake = total_intake / total_days if total_days > 0 else 0
        
        total_feedings = sum(t.feeding_count for t in recent_trackers)
        average_feedings_per_day = total_feedings / total_days if total_days > 0 else 0
        
        return jsonify({
            "total_days": total_days,
            "completed_days": completed_days,
            "completion_rate": round(completion_rate, 1),
            "average_daily_intake": round(average_daily_intake, 1),
            "average_feedings_per_day": round(average_feedings_per_day, 1)
        })
        
    except Exception as e:
        # print(f"Error getting tracker stats: {str(e)}")
        return jsonify({"error": str(e)}), 500

@tracker_bp.route('/cleanup-old', methods=['DELETE'])
def cleanup_old_trackers():
    """Delete trackers older than specified days"""
    try:
        days_to_keep = request.args.get('days', 30, type=int)
        cutoff_date = date.today() - datetime.timedelta(days=days_to_keep)
        
        old_trackers = DailyFeedingTracker.query.filter(
            DailyFeedingTracker.target_date < cutoff_date
        ).all()
        
        count = len(old_trackers)
        for tracker in old_trackers:
            db.session.delete(tracker)
            
        db.session.commit()
        
        # print(f"Cleaned up {count} old trackers")
        
        return jsonify({
            "message": f"Deleted {count} trackers older than {days_to_keep} days",
            "deleted_count": count
        })
        
    except Exception as e:
        # print(f"Error cleaning up old trackers: {str(e)}")
        return jsonify({"error": str(e)}), 500