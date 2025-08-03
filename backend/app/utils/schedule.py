import threading
import time
from datetime import date, datetime, timedelta
from app.models import DailyFeedingTracker, User
from app import db

class TrackerScheduler:
    """Scheduler for automatic tracker reset and maintenance"""
    
    def __init__(self):
        self.running = False
        self.thread = None
        
    def start(self):
        """Start the scheduler"""
        if self.running:
            return
            
        self.running = True
        self.thread = threading.Thread(target=self._schedule_loop, daemon=True)
        self.thread.start()
        # print("Tracker scheduler started")
        
    def stop(self):
        """Stop the scheduler"""
        self.running = False
        if self.thread and self.thread.is_alive():
            self.thread.join()
        # print("Tracker scheduler stopped")
        
    def _schedule_loop(self):
        """Main scheduler loop"""
        last_date = date.today()
        
        while self.running:
            try:
                current_date = date.today()
                
                # Check if we've crossed midnight
                if current_date != last_date:
                    # print(f"Date changed from {last_date} to {current_date}")
                    self._handle_new_day()
                    last_date = current_date
                
                # Sleep for 1 minute before checking again
                time.sleep(60)
                
            except Exception as e:
                # print(f"Error in scheduler loop: {str(e)}")
                time.sleep(60)  # Wait before retrying
                
    def _handle_new_day(self):
        """Handle tasks for a new day"""
        try:
            # Clean up old trackers (keep last 30 days)
            self._cleanup_old_trackers(days_to_keep=30)
            
            # Check user activity and cleanup inactive users
            self._cleanup_inactive_users()
            
            # Note: New trackers are created automatically when needed
            # via get_or_create_today_tracker() in the routes
            
            # print("New day setup completed")
            
        except Exception as e:
            # print(f"Error handling new day: {str(e)}")
            pass
            
    def _cleanup_old_trackers(self, days_to_keep=30):
        """Clean up trackers older than specified days"""
        try:
            cutoff_date = date.today() - timedelta(days=days_to_keep)
            
            # Use app context for database operations
            from app import create_app
            app = create_app()
            
            with app.app_context():
                old_trackers = DailyFeedingTracker.query.filter(
                    DailyFeedingTracker.target_date < cutoff_date
                ).all()
                
                count = len(old_trackers)
                if count > 0:
                    for tracker in old_trackers:
                        db.session.delete(tracker)
                    
                    db.session.commit()
                    # print(f"Cleaned up {count} old trackers")
                else:
                    # print("No old trackers to clean up")
                    pass
                    
        except Exception as e:
            # print(f"Error cleaning up old trackers: {str(e)}")
            pass
            
    def _cleanup_inactive_users(self):
        """Clean up inactive users based on last login activity"""
        try:
            # Use app context for database operations
            from app import create_app
            app = create_app()
            
            with app.app_context():
                result = User.cleanup_inactive_users()
                
                if result['deactivated'] > 0 or result['deleted'] > 0:
                    print(f"User cleanup: {result['deactivated']} deactivated, {result['deleted']} deleted")
                    
        except Exception as e:
            print(f"Error cleaning up inactive users: {str(e)}")
            pass
    
    def force_new_day_reset(self):
        """Manually trigger new day handling (for testing)"""
        # print("Forcing new day reset...")
        self._handle_new_day()
    
    def force_user_cleanup(self):
        """Manually trigger user cleanup (for testing)"""
        print("Forcing user cleanup...")
        self._cleanup_inactive_users()

# Global scheduler instance
tracker_scheduler = TrackerScheduler()

def start_scheduler():
    """Start the global tracker scheduler"""
    tracker_scheduler.start()
    
def stop_scheduler():
    """Stop the global tracker scheduler"""
    tracker_scheduler.stop()
    
def get_scheduler():
    """Get the global scheduler instance"""
    return tracker_scheduler