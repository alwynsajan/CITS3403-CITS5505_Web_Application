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
    accountBalance = db.Column(db.Float, nullable=False, default=0.0)
    previousBalance = db.Column(db.Float, nullable=False, default=0.0)
    goalAllocationPercent = db.Column(db.Float, nullable=False, default=0.0)

    # Method to verify the password
    def checkPassword(self, password):
        return checkPasswordHash(self.password, password)
    
    def createUser(username, password, firstName, lastName):
        """Helper method to create new user with hashed password"""
        return User(
            username=username,
            password=generatePasswordHash(password),
            firstName=firstName,
            lastName=lastName
        )

class Goal(db.Model):
    __tablename__ = 'goals'
    
    id = db.Column(db.Integer, primary_key=True)
    userId = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=False)
    goalName = db.Column(db.String(100), nullable=False)
    targetAmount = db.Column(db.Float, nullable=False)
    duration = db.Column(db.Integer, nullable=False)
    percentageAllocation = db.Column(db.Integer, nullable=False)