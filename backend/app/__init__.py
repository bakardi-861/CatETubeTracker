from flask import Flask
from flask_cors import CORS
from flask_sqlalchemy import SQLAlchemy
from flask_migrate import Migrate
from flask_login import LoginManager
from flask_limiter import Limiter
from flask_limiter.util import get_remote_address
from flask_caching import Cache
from dotenv import load_dotenv
import os
import redis

db = SQLAlchemy()
migrate = Migrate()
login_manager = LoginManager()
cache = Cache()

# Load environment for Redis URL
load_dotenv()
redis_url = os.getenv('REDIS_URL', 'redis://localhost:6379/0')

# Create limiter with Redis storage
try:
    limiter = Limiter(
        key_func=get_remote_address,
        storage_uri=redis_url,
        default_limits=["1000 per hour"]
    )
    print(f"✅ Rate limiting configured with Redis storage: {redis_url}")
except Exception as e:
    print(f"⚠️ Failed to configure Redis for rate limiting, using in-memory: {e}")
    limiter = Limiter(key_func=get_remote_address)

def create_app(config_name='development'):
    load_dotenv()
    app = Flask(__name__)
    
    # Configuration
    app.config['SECRET_KEY'] = os.getenv('SECRET_KEY', 'dev-secret-key-change-in-production')
    app.config['SQLALCHEMY_DATABASE_URI'] = os.getenv('DATABASE_URL', 'sqlite:///catelog.db')
    app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False
    app.config['SQLALCHEMY_ENGINE_OPTIONS'] = {
        'pool_size': 20,
        'pool_recycle': 3600,
        'pool_pre_ping': True,
        'max_overflow': 30
    }
    
    # Redis configuration
    app.config['CACHE_TYPE'] = 'RedisCache'
    app.config['CACHE_REDIS_URL'] = redis_url
    app.config['CACHE_DEFAULT_TIMEOUT'] = 300
    
    # Rate limiting configuration
    app.config['RATELIMIT_STORAGE_URL'] = redis_url
    app.config['RATELIMIT_DEFAULT'] = "1000 per hour"
    
    # CORS
    CORS(app, 
         origins=os.getenv('CORS_ORIGINS', 'http://localhost:5173').split(','),
         supports_credentials=True,
         allow_headers=['Content-Type', 'Authorization'],
         methods=['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'])
    
    # Initialize extensions
    db.init_app(app)
    migrate.init_app(app, db)
    cache.init_app(app)
    limiter.init_app(app)
    
    # Login manager setup
    login_manager.init_app(app)
    login_manager.login_view = 'auth.login'
    login_manager.login_message = 'Please log in to access this page.'
    
    @login_manager.user_loader
    def load_user(user_id):
        from app.models import User
        return User.query.get(user_id)

    from .routes.auth import auth_bp
    from .routes.feeding import feeding_bp
    from .routes.medication import medlog_bp
    from .routes.report import report_bp
    from .routes.tracker import tracker_bp
    
    app.register_blueprint(auth_bp, url_prefix='/api/auth')
    app.register_blueprint(feeding_bp, url_prefix='/api/feeding')
    app.register_blueprint(medlog_bp, url_prefix='/api/medication_log')
    app.register_blueprint(report_bp, url_prefix='/api/report')
    app.register_blueprint(tracker_bp, url_prefix='/api/tracker')
    
    # Setup logging
    from .utils.logger import setup_logging
    setup_logging(app)
    
    app.logger.info("Registered all blueprints")

    # Start the tracker scheduler only in production or when specified
    if config_name == 'production' or os.getenv('START_SCHEDULER', 'false').lower() == 'true':
        from .utils.schedule import start_scheduler
        start_scheduler()
        app.logger.info("Tracker scheduler started")

    @app.route('/')
    def index():
        return {"message": "CatETube Tracker API", "version": "2.0", "status": "running"}

    @app.route('/health')
    def health_check():
        from datetime import datetime
        return {"status": "healthy", "timestamp": datetime.utcnow().isoformat()}

    return app
