from datetime import datetime, date, timedelta
from flask_sqlalchemy import SQLAlchemy
from flask_login import UserMixin
from werkzeug.security import generate_password_hash, check_password_hash
import uuid
from app import db

class User(UserMixin, db.Model):
    id = db.Column(db.String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    email = db.Column(db.String(120), unique=True, nullable=False, index=True)
    password_hash = db.Column(db.String(255), nullable=False)
    first_name = db.Column(db.String(100))
    last_name = db.Column(db.String(100))
    is_active = db.Column(db.Boolean, default=True)
    is_verified = db.Column(db.Boolean, default=False)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    last_login = db.Column(db.DateTime)
    timezone = db.Column(db.String(50), default='UTC')
    
    # Cat profile information
    cat_name = db.Column(db.String(100))
    cat_breed = db.Column(db.String(100))
    cat_age = db.Column(db.Integer)
    cat_weight = db.Column(db.Float)
    daily_target_ml = db.Column(db.Float, default=210.0)
    
    # Relationships
    feeding_logs = db.relationship('FeedingLog', backref='user', lazy='dynamic', cascade='all, delete-orphan')
    medication_logs = db.relationship('MedicationLog', backref='user', lazy='dynamic', cascade='all, delete-orphan')
    daily_trackers = db.relationship('DailyFeedingTracker', backref='user', lazy='dynamic', cascade='all, delete-orphan')

    def set_password(self, password):
        self.password_hash = generate_password_hash(password)

    def check_password(self, password):
        return check_password_hash(self.password_hash, password)

    def to_dict(self):
        return {
            'id': self.id,
            'email': self.email
            'first_name': self.first_name,
            'last_name': self.last_name,
            'cat_name': self.cat_name,
            'cat_breed': self.cat_breed,
            'cat_age': self.cat_age,
            'cat_weight': self.cat_weight,
            'daily_target_ml': self.daily_target_ml,
            'timezone': self.timezone,
            'created_at': self.created_at.isoformat(),
            'last_login': self.last_login.isoformat() if self.last_login else None,
            'is_active': self.is_active
        }

    def check_activity(self):
        """Check user activity and mark for deactivation/deletion based on last login"""
        if not self.last_login:
            return None  # Skip users who have never logged in
        
        now = datetime.utcnow()
        days_inactive = (now - self.last_login).days
        
        # Mark inactive after 60 days of no login
        if days_inactive >= 60 and self.is_active:
            self.is_active = False
            return 'deactivated'
        
        # Mark for deletion after 120 days of no login
        elif days_inactive >= 120:
            return 'delete'
        
        return None
    
    @classmethod
    def cleanup_inactive_users(cls):
        """Class method to find and handle inactive users"""
        inactive_users = cls.query.filter(cls.is_active == True).all()
        users_to_delete = []
        deactivated_count = 0
        
        for user in inactive_users:
            status = user.check_activity()
            if status == 'deactivated':
                deactivated_count += 1
            elif status == 'delete':
                users_to_delete.append(user)
        
        # Delete users marked for deletion
        deleted_count = len(users_to_delete)
        for user in users_to_delete:
            db.session.delete(user)
        
        if deactivated_count > 0 or deleted_count > 0:
            db.session.commit()
        
        return {
            'deactivated': deactivated_count,
            'deleted': deleted_count
        }

class FeedingLog(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.String(36), db.ForeignKey('user.id'), nullable=False, index=True)
    amount_ml = db.Column(db.Float, nullable=False)
    flushed_before = db.Column(db.Boolean, default=False)
    flushed_after = db.Column(db.Boolean, default=False)
    time_given = db.Column(db.DateTime, default=datetime.utcnow, index=True)

    def to_dict(self):
        return {
            "id": self.id,
            "amount_ml": self.amount_ml,
            "flushed_before": self.flushed_before,
            "flushed_after": self.flushed_after,
            "time_given": self.time_given.isoformat()
        }

class MedicationLog(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.String(36), db.ForeignKey('user.id'), nullable=False, index=True)
    medication_name = db.Column(db.String(100), nullable=False)
    dosage = db.Column(db.String(50), nullable=False)  # e.g., "10mg", "1 tablet", "5ml"
    amount_ml = db.Column(db.Float, nullable=False)  # Amount of liquid used to give medication
    route = db.Column(db.String(50), default='E-tube')  # Administration route
    notes = db.Column(db.Text)
    flushed_before = db.Column(db.Boolean, default=False)
    flushed_after = db.Column(db.Boolean, default=False)
    time_given = db.Column(db.DateTime, default=datetime.utcnow, index=True)

    def to_dict(self):
        return {
            "id": self.id,
            "medication_name": self.medication_name,
            "dosage": self.dosage,
            "amount_ml": self.amount_ml,
            "route": self.route,
            "notes": self.notes,
            "flushed_before": self.flushed_before,
            "flushed_after": self.flushed_after,
            "time_given": self.time_given.isoformat()
        }

class DailyFeedingTracker(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.String(36), db.ForeignKey('user.id'), nullable=False, index=True)
    target_date = db.Column(db.Date, nullable=False, default=date.today, index=True)
    daily_target_ml = db.Column(db.Float, nullable=False, default=210.0)
    remaining_ml = db.Column(db.Float, nullable=False)
    total_fed_ml = db.Column(db.Float, nullable=False, default=0.0)
    feeding_count = db.Column(db.Integer, nullable=False, default=0)
    last_updated = db.Column(db.DateTime, default=datetime.utcnow)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    
    # Add unique constraint for user_id + target_date
    __table_args__ = (
        db.UniqueConstraint('user_id', 'target_date', name='unique_user_date'),
        db.Index('idx_user_date', 'user_id', 'target_date'),
    )

    def __init__(self, user_id, daily_target_ml=210.0, target_date=None):
        self.user_id = user_id
        self.daily_target_ml = daily_target_ml
        self.remaining_ml = daily_target_ml
        self.target_date = target_date or date.today()

    def add_feeding(self, amount_ml):
        """Add a feeding and update remaining amount"""
        self.total_fed_ml += amount_ml
        self.remaining_ml = max(0, self.remaining_ml - amount_ml)
        self.feeding_count += 1
        self.last_updated = datetime.utcnow()

    def reset_for_new_day(self, new_daily_target=None):
        """Reset tracker for a new day"""
        if new_daily_target:
            self.daily_target_ml = new_daily_target
        self.remaining_ml = self.daily_target_ml
        self.total_fed_ml = 0.0
        self.feeding_count = 0
        self.target_date = date.today()
        self.last_updated = datetime.utcnow()

    def get_progress_percentage(self):
        """Get feeding progress as percentage"""
        if self.daily_target_ml == 0:
            return 100
        return min(100, (self.total_fed_ml / self.daily_target_ml) * 100)

    def is_completed(self):
        """Check if daily target is reached"""
        return self.total_fed_ml >= self.daily_target_ml

    def is_overdue(self):
        """Check if this tracker is for a past date"""
        return self.target_date < date.today()

    def to_dict(self):
        return {
            "id": self.id,
            "target_date": self.target_date.isoformat(),
            "daily_target_ml": self.daily_target_ml,
            "remaining_ml": self.remaining_ml,
            "total_fed_ml": self.total_fed_ml,
            "feeding_count": self.feeding_count,
            "progress_percentage": self.get_progress_percentage(),
            "is_completed": self.is_completed(),
            "is_overdue": self.is_overdue(),
            "last_updated": self.last_updated.isoformat(),
            "created_at": self.created_at.isoformat()
        }