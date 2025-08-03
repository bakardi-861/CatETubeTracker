from flask import Blueprint, request, jsonify, session
from flask_login import login_user, logout_user, login_required, current_user
from app.models import User
from app import db
import re
from datetime import datetime
from sqlalchemy.exc import IntegrityError, SQLAlchemyError

auth_bp = Blueprint('auth', __name__)

def validate_email(email):
    """Validate email format"""
    pattern = r'^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$'
    return re.match(pattern, email) is not None

def validate_password(password):
    """Validate password strength"""
    if len(password) < 8:
        return False, "Password must be at least 8 characters long"
    if not re.search(r'[A-Z]', password):
        return False, "Password must contain at least one uppercase letter"
    if not re.search(r'[a-z]', password):
        return False, "Password must contain at least one lowercase letter"
    if not re.search(r'\d', password):
        return False, "Password must contain at least one number"
    return True, "Password is valid"

@auth_bp.route('/register', methods=['POST'])
def register():
    """Register a new user"""
    try:
        data = request.get_json()
        
        # Validate required fields
        required_fields = ['email', 'password', 'first_name']
        for field in required_fields:
            if not data.get(field):
                return jsonify({'error': f'{field} is required'}), 400
        
        email = data['email'].lower().strip()
        password = data['password']
        first_name = data['first_name'].strip()
        last_name = data.get('last_name', '').strip()
        
        # Validate email
        if not validate_email(email):
            return jsonify({'error': 'Invalid email format'}), 400
        
        # Check if user already exists
        if User.query.filter_by(email=email).first():
            return jsonify({'error': 'Email already registered'}), 409
        
        # Validate password
        is_valid, message = validate_password(password)
        if not is_valid:
            return jsonify({'error': message}), 400
        
        # Create new user
        user = User(
            email=email,
            first_name=first_name,
            last_name=last_name,
            cat_name=data.get('cat_name', ''),
            cat_breed=data.get('cat_breed', ''),
            cat_age=data.get('cat_age'),
            cat_weight=data.get('cat_weight'),
            daily_target_ml=data.get('daily_target_ml', 210.0),
            timezone=data.get('timezone', 'UTC')
        )
        user.set_password(password)
        
        db.session.add(user)
        db.session.commit()
        
        # Log the user in
        login_user(user, remember=True) # False for logging out on every refresh.
        
        return jsonify({
            'message': 'Registration successful',
            'user': user.to_dict()
        }), 201
        
    except Exception as e:
        db.session.rollback()
        # print(f"Registration error: {str(e)}")
        return jsonify({'error': 'Registration failed'}), 500

@auth_bp.route('/login', methods=['POST'])
def login():
    """User login"""
    try:
        data = request.get_json()
        
        email = data.get('email', '').lower().strip()
        password = data.get('password', '')
        
        if not email or not password:
            return jsonify({'error': 'Email and password are required'}), 400
        
        # Find user
        user = User.query.filter_by(email=email).first()
        
        if not user or not user.check_password(password):
            return jsonify({'error': 'Invalid email or password'}), 401
        
        if not user.is_active:
            #TODO: Prompt user to re-activate or stay deactivated. Show their total deactivated days If days reaches 120, account will be deleted automatically. 
            # user.check_activity()
            return jsonify({'error': 'Account is deactivated'}), 401
        
        # Update last login
        user.last_login = datetime.utcnow()
        db.session.commit()
        
        # Log user in
        login_user(user, remember=data.get('remember_me', True))
        
        return jsonify({
            'message': 'Login successful',
            'user': user.to_dict()
        }), 200
        
    except Exception as e:
        # print(f"Login error: {str(e)}")
        return jsonify({'error': 'Login failed'}), 500

@auth_bp.route('/logout', methods=['POST'])
@login_required
def logout():
    """User logout"""
    try:
        logout_user()
        return jsonify({'message': 'Logout successful'}), 200
    except Exception as e:
        # print(f"Logout error: {str(e)}")
        return jsonify({'error': 'Logout failed'}), 500

@auth_bp.route('/me', methods=['GET'])
@login_required
def get_current_user():
    """Get current user info"""
    try:
        return jsonify({'user': current_user.to_dict()}), 200
    except Exception as e:
        # print(f"Get user error: {str(e)}")
        return jsonify({'error': 'Failed to get user info'}), 500

@auth_bp.route('/profile', methods=['PUT'])
@login_required
def update_profile():
    """Update user profile"""
    try:
        data = request.get_json()
        
        # Update allowed fields
        updatable_fields = [
            'first_name', 'last_name', 'cat_name', 'cat_breed', 
            'cat_age', 'cat_weight', 'daily_target_ml', 'timezone'
        ]
        
        for field in updatable_fields:
            if field in data:
                setattr(current_user, field, data[field])
        
        db.session.commit()
        
        return jsonify({
            'message': 'Profile updated successfully',
            'user': current_user.to_dict()
        }), 200
        
    except Exception as e:
        db.session.rollback()
        # print(f"Profile update error: {str(e)}")
        return jsonify({'error': 'Failed to update profile'}), 500

@auth_bp.route('/change-password', methods=['POST'])
@login_required
def change_password():
    """Change user password"""
    try:
        data = request.get_json()
        
        current_password = data.get('current_password')
        new_password = data.get('new_password')
        
        if not current_password or not new_password:
            return jsonify({'error': 'Current and new passwords are required'}), 400
        
        # Verify current password
        if not current_user.check_password(current_password):
            return jsonify({'error': 'Current password is incorrect'}), 401
        
        # Validate new password
        is_valid, message = validate_password(new_password)
        if not is_valid:
            return jsonify({'error': message}), 400
        
        # Update password
        current_user.set_password(new_password)
        db.session.commit()
        
        return jsonify({'message': 'Password changed successfully'}), 200
        
    except Exception as e:
        db.session.rollback()
        # print(f"Password change error: {str(e)}")
        return jsonify({'error': 'Failed to change password'}), 500

@auth_bp.route('/deactivate', methods=['POST'])
@login_required
def deactivate_account():
    """Deactivate user account"""
    try:
        data = request.get_json()
        password = data.get('password')
        
        if not password:
            return jsonify({'error': 'Password confirmation required'}), 400
        
        if not current_user.check_password(password):
            return jsonify({'error': 'Incorrect password'}), 401
        
        current_user.is_active = False
        db.session.commit()
        
        logout_user()
        
        return jsonify({'message': 'Account deactivated successfully'}), 200
        
    except Exception as e:
        db.session.rollback()
        # print(f"Account deactivation error: {str(e)}")
        return jsonify({'error': 'Failed to deactivate account'}), 500

@auth_bp.route('/delete', methods=['POST'])
@login_required
def delete_account():
    """Delete user account"""
    try:
        data = request.get_json()
        password = data.get('password')
        
        if not password:
            return jsonify({'error': 'Password confirmation required'}), 400
        
        if not current_user.check_password(password):
            return jsonify({'error': 'Incorrect password'}), 401

        # Check if user still exists (handle concurrent deletion)
        user_to_delete = User.query.get(current_user.id)
        if not user_to_delete:
            return jsonify({'error': 'User already deleted'}), 404
        
        # Logout first to clear session
        logout_user()
        
        # Delete user (cascades to all related data via model relationships)
        db.session.delete(user_to_delete)
        db.session.commit()
        
        return jsonify({'message': 'Account deleted successfully'}), 200
        
    except IntegrityError:
        db.session.rollback()
        return jsonify({'error': 'Cannot delete account due to data dependencies'}), 409
    except SQLAlchemyError:
        db.session.rollback()
        return jsonify({'error': 'Database error occurred'}), 500
    except Exception as e:
        db.session.rollback()
        # print(f"Account deletion error: {str(e)}")
        return jsonify({'error': 'Failed to delete account'}), 500

@auth_bp.route('/cleanup-inactive', methods=['POST'])
@login_required
def cleanup_inactive_users():
    """Manual trigger for inactive user cleanup (admin only)"""
    try:
        # Simple admin check - you might want to add proper role-based access
        if not current_user.email.endswith('@admin.com'):  # Replace with your admin logic
            return jsonify({'error': 'Admin access required'}), 403
        
        result = User.cleanup_inactive_users()
        
        return jsonify({
            'message': 'User cleanup completed',
            'result': result
        }), 200
        
    except Exception as e:
        return jsonify({'error': 'Failed to cleanup users'}), 500