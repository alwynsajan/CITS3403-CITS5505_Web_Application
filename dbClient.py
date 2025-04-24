from models import User
from werkzeug.security import generatePasswordHash

class dbClient: 
    def __init__(self, dbSession):
        self.dbSession = dbSession  

    def getLastUserId(self):  

        """Returns the highest user ID or 0 if empty"""
        lastUser = User.query.order_by(User.id.desc()).first()
        return lastUser.id if lastUser else 0

    def addUser(self, username, password, firstName, lastName):  
        
        """Adds new user with auto-incremented ID"""
        if User.query.filter_by(username=username).first():
            return None  # Username exists

        newId = self.getLastUserId() + 1  
        newUser = User(
            id=newId,
            username=username,
            password=generatePasswordHash(password),  
            firstName=firstName,
            lastName=lastName
        )
        
        self.dbSession.add(newUser)
        try:
            self.dbSession.commit()
            return newId
        except Exception as e:
            self.dbSession.rollback()
            raise e

    def checkCredentials(self, username, password): 

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
        return None 
