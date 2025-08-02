import logging
import os
from logging.handlers import RotatingFileHandler
from datetime import datetime

def setup_logging(app):
    """Setup production logging configuration"""
    
    # Don't setup logging in testing
    if app.config.get('TESTING'):
        return
    
    # Create logs directory if it doesn't exist
    if not os.path.exists('logs'):
        os.mkdir('logs')
    
    # Configure log level based on environment
    log_level = logging.INFO
    if app.config.get('DEBUG'):
        log_level = logging.DEBUG
    
    # File handler for application logs
    file_handler = RotatingFileHandler(
        'logs/catelog.log',
        maxBytes=10240000,  # 10MB
        backupCount=10
    )
    file_handler.setFormatter(logging.Formatter(
        '%(asctime)s %(levelname)s: %(message)s [in %(pathname)s:%(lineno)d]'
    ))
    file_handler.setLevel(log_level)
    
    # Console handler for development
    if app.config.get('DEBUG'):
        console_handler = logging.StreamHandler()
        console_handler.setFormatter(logging.Formatter(
            '%(asctime)s %(levelname)s: %(message)s'
        ))
        console_handler.setLevel(log_level)
        app.logger.addHandler(console_handler)
    
    app.logger.addHandler(file_handler)
    app.logger.setLevel(log_level)
    
    # Log startup
    app.logger.info(f'CatETube Tracker startup - Environment: {os.getenv("FLASK_ENV", "unknown")}')

def get_logger(name):
    """Get a logger instance for a specific module"""
    return logging.getLogger(name)

# Convenience functions to replace print statements
def log_info(message, logger_name='catelog'):
    """Log info message"""
    logger = get_logger(logger_name)
    logger.info(message)

def log_error(message, logger_name='catelog'):
    """Log error message"""
    logger = get_logger(logger_name)
    logger.error(message)

def log_warning(message, logger_name='catelog'):
    """Log warning message"""
    logger = get_logger(logger_name)
    logger.warning(message)

def log_debug(message, logger_name='catelog'):
    """Log debug message"""
    logger = get_logger(logger_name)
    logger.debug(message)