import threading
import time
from datetime import date, datetime, timedelta
from app.models import DailyFeedingTracker
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
        # print(" Tracker scheduler started")
        
    def stop(self):
        """Stop the scheduler"""
        self.running = False
        if self.thread and self.thread.is_alive():
            self.thread.join()
