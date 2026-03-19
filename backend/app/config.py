import os


class Config:
    SECRET_KEY = os.environ.get("SECRET_KEY", "dev-secret-key-canvia-en-produccio")
    SQLALCHEMY_DATABASE_URI = os.environ.get(
        "DATABASE_URL",
        "postgresql://labfa:labfa_password@localhost:5432/labfa",
    )
    SQLALCHEMY_TRACK_MODIFICATIONS = False
