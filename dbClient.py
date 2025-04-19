from models import User
from werkzeug.security import check_password_hash

class dbClient:

    def __init__(self, db):
        self.db = db

    def checkCredentials(self, username, password):

        # Query the database for the user
        user = User.query.filter_by(username=username).first()
        
        # Check if the user exists and the password matches
        if user and user.check_password(password):

            # Return user ID if credentials are correct
            return user.id  
        
        # Return None if credentials are invalid
        return None  