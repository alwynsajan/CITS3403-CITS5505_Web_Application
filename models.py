from flask_sqlalchemy import SQLAlchemy
from werkzeug.security import check_password_hash
from werkzeug.security import generate_password_hash  

db = SQLAlchemy()

class User(db.Model):
    __tablename__ = 'users'

    id = db.Column(db.Integer, primary_key=True)  # Unique ID for each user
    username = db.Column(db.String(80), unique=True, nullable=False)  
    password = db.Column(db.String(200), nullable=False)  
    firstName = db.Column(db.String(100), nullable=False)  
    lastName = db.Column(db.String(100), nullable=False)  

    # Method to verify the password
    def checkPassword(self, password):
        return check_password_hash(self.password, password)
    
    @staticmethod
    def createUser(username, password, first_name, last_name):
        """Helper method to create new user with hashed password"""
        return User(
            username=username,
            password=generate_password_hash(password),
            firstName=first_name,
            lastName=last_name
        )
