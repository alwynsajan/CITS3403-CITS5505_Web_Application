from models import User

class dbClient:

    def __init__(self, db):
        self.db = db

    def checkCredentials(self, username, password):

        # Query the database for the user
        user = User.query.filter_by(username=username).first()
        
        # Check if the user exists and the password matches
        if user and user.checkPassword(password):

            # Return user ID if credentials are correct
            return user.id  
        
        # Return None if credentials are invalid
        return None  
    
    def add_user(self, username, password, first_name, last_name):
        """Add new user to database with validation"""
        if User.query.filter_by(username=username).first():
            return None  # Username exists
        
        new_user = User.create_user(username, password, first_name, last_name)
        self.db.session.add(new_user)
        try:
            self.db.session.commit()
            return new_user.id
        except Exception as e:
            self.db.session.rollback()
            raise e