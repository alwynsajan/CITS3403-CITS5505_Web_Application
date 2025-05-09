import os

basedir = os.path.abspath(os.path.dirname(__file__))
defaultDatabaseLocation = "sqlite:///"+ os.path.join(basedir,"analyzer.db")

class Config:
    SQLALCHEMY_DATABASE_URI = os.getenv("DATABASE_URL") or defaultDatabaseLocation
    SECRET_KEY = os.environ.get("ANALYSER_SECRET_KEY")

