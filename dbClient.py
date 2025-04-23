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
    
    def getAccountBalance(self, userID):
        # Fetch the user by ID and return their account balance
        user = User.query.get(userID)
        if user:
            return user.accountBalance
        return 0.0  # Return 0 if user not found

    