from flask import Flask
from flask_cors import CORS
from flask_sqlalchemy import SQLAlchemy
from flask_migrate import Migrate

db = SQLAlchemy()
migrate = Migrate()


def create_app():
    app = Flask(__name__)
    app.config.from_object("app.config.Config")

    db.init_app(app)
    migrate.init_app(app, db)
    CORS(app, supports_credentials=True)

    from app.routes.analisis import bp as analisis_bp
    from app.routes.admin import bp as admin_bp
    from app.routes.auth import bp as auth_bp
    from app.routes.dashboard import bp as dashboard_bp

    app.register_blueprint(analisis_bp)
    app.register_blueprint(admin_bp)
    app.register_blueprint(auth_bp)
    app.register_blueprint(dashboard_bp)

    return app
