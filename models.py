from flask_sqlalchemy import SQLAlchemy
from werkzeug.security import check_password_hash

db = SQLAlchemy()

class User(db.Model):
    __tablename__ = 'users'

    id = db.Column(db.Integer, primary_key=True)  # Unique ID for each user
    username = db.Column(db.String(80), unique=True, nullable=False)  
    password = db.Column(db.String(200), nullable=False)  
    firstName = db.Column(db.String(100), nullable=False)  
    lastName = db.Column(db.String(100), nullable=False)
    accountBalance = db.Column(db.Float, nullable=False, default=0.0)
    previousBalance = db.Column(db.Float, nullable=False, default=0.0)
    goalAllocationPercent = db.Column(db.Float, nullable=False, default=0.0)

    # Method to verify the password
    def checkPassword(self, password):
        return check_password_hash(self.password, password)

