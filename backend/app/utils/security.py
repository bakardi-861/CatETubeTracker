"""Security utilities and middleware for production deployment"""

from flask import request, jsonify, current_app
from functools import wraps
import hashlib
import hmac
import time
from datetime import datetime, timedelta
import re

def add_security_headers(app):
    """Add security headers to all responses"""
    @app.after_request
    def set_security_headers(response):
        # Prevent clickjacking
        response.headers['X-Frame-Options'] = 'DENY'
        
        # Prevent MIME type sniffing
        response.headers['X-Content-Type-Options'] = 'nosniff'
        
        # Enable XSS protection
        response.headers['X-XSS-Protection'] = '1; mode=block'
        
        # Force HTTPS in production
        if not current_app.debug:
            response.headers['Strict-Transport-Security'] = 'max-age=31536000; includeSubDomains'
        
        # Content Security Policy (adjust as needed)
        csp = (
            "default-src 'self'; "
            "script-src 'self' 'unsafe-inline'; "
            "style-src 'self' 'unsafe-inline'; "
            "img-src 'self' data: https:; "
            "font-src 'self'; "
            "connect-src 'self'"
        )
        response.headers['Content-Security-Policy'] = csp
        
        # Prevent referrer leakage
        response.headers['Referrer-Policy'] = 'strict-origin-when-cross-origin'
        
        return response

def validate_request_size(max_size_mb=10):
    """Decorator to limit request size"""
    def decorator(f):
        @wraps(f)
        def wrapper(*args, **kwargs):
            content_length = request.content_length
            if content_length and content_length > max_size_mb * 1024 * 1024:
                return jsonify({"error": "Request too large"}), 413
            return f(*args, **kwargs)
        return wrapper
    return decorator

def sanitize_input(data):
    """Sanitize user input to prevent XSS and injection attacks"""
    if isinstance(data, str):
        # Remove potential script tags and dangerous characters
        data = re.sub(r'<script[^>]*>.*?</script>', '', data, flags=re.IGNORECASE | re.DOTALL)
        data = re.sub(r'javascript:', '', data, flags=re.IGNORECASE)
        data = re.sub(r'on\w+\s*=', '', data, flags=re.IGNORECASE)
        return data.strip()
    elif isinstance(data, dict):
        return {key: sanitize_input(value) for key, value in data.items()}
    elif isinstance(data, list):
        return [sanitize_input(item) for item in data]
    return data

def require_https():
    """Decorator to require HTTPS in production"""
    def decorator(f):
        @wraps(f)
        def wrapper(*args, **kwargs):
            if not current_app.debug and not request.is_secure:
                return jsonify({"error": "HTTPS required"}), 403
            return f(*args, **kwargs)
        return wrapper
    return decorator

def validate_session_token():
    """Additional session validation"""
    def decorator(f):
        @wraps(f)
        def wrapper(*args, **kwargs):
            # Add custom session validation if needed
            # This is already handled by Flask-Login, but you can add extra checks
            return f(*args, **kwargs)
        return wrapper
    return decorator

class SecurityAuditLogger:
    """Log security-related events"""
    
    @staticmethod
    def log_failed_login(email, ip_address):
        """Log failed login attempt"""
        current_app.logger.warning(
            f"Failed login attempt for {email} from {ip_address}",
            extra={
                'event_type': 'failed_login',
                'email': email,
                'ip_address': ip_address,
                'timestamp': datetime.utcnow().isoformat()
            }
        )
    
    @staticmethod
    def log_successful_login(user_id, ip_address):
        """Log successful login"""
        current_app.logger.info(
            f"Successful login for user {user_id} from {ip_address}",
            extra={
                'event_type': 'successful_login',
                'user_id': user_id,
                'ip_address': ip_address,
                'timestamp': datetime.utcnow().isoformat()
            }
        )
    
    @staticmethod
    def log_password_change(user_id, ip_address):
        """Log password change"""
        current_app.logger.info(
            f"Password changed for user {user_id} from {ip_address}",
            extra={
                'event_type': 'password_change',
                'user_id': user_id,
                'ip_address': ip_address,
                'timestamp': datetime.utcnow().isoformat()
            }
        )
    
    @staticmethod
    def log_suspicious_activity(user_id, activity_type, details, ip_address):
        """Log suspicious activity"""
        current_app.logger.warning(
            f"Suspicious activity for user {user_id}: {activity_type}",
            extra={
                'event_type': 'suspicious_activity',
                'user_id': user_id,
                'activity_type': activity_type,
                'details': details,
                'ip_address': ip_address,
                'timestamp': datetime.utcnow().isoformat()
            }
        )

def get_client_ip():
    """Get client IP address, handling proxies"""
    if request.headers.get('X-Forwarded-For'):
        return request.headers.get('X-Forwarded-For').split(',')[0].strip()
    elif request.headers.get('X-Real-IP'):
        return request.headers.get('X-Real-IP')
    else:
        return request.remote_addr

def generate_csrf_token():
    """Generate CSRF token for forms"""
    from flask import session
    import secrets
    if 'csrf_token' not in session:
        session['csrf_token'] = secrets.token_hex(16)
    return session['csrf_token']

def validate_csrf_token(token):
    """Validate CSRF token"""
    from flask import session
    return token and token == session.get('csrf_token')