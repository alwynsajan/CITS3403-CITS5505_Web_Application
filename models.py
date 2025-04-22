from flask_sqlalchemy import SQLAlchemy
from werkzeug.security import generatePasswordHash, checkPasswordHash

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
        return checkPasswordHash(self.password, password)
    
    @staticmethod
    def createUser(username, password, firstName, lastName):
        """Helper method to create new user with hashed password"""
        return User(
            username=username,
            password=generatePasswordHash(password),
            firstName=firstName,
            lastName=lastName
        )
