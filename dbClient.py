from models import User
from werkzeug.security import generate_password_hash

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
            # Username exists
            return {
                "status": "Failed",
                "statusCode":400,
                "message": "Username already exists"
                }

        newId = self.getLastUserId() + 1  
        newUser = User(
            id=newId,
            username=username,
            password=generate_password_hash(password),  
            firstName=firstName,
            lastName=lastName
        )
        
        self.dbSession.add(newUser)
        try:
            self.dbSession.commit()
            return {
                    "status": "Success",
                    "statusCode":200,
                    "message": "User created successfully",
                    "data": {"username":username,
                             "userID": newId}
                }
        except Exception as e:
            return {
                "status": "Failed",
                "statusCode":400,
                "message": str(e)}

    def checkCredentials(self, username, password): 

        user = User.query.filter_by(username=username).first()

        # Check if the user exists
        if not user:
            return {
                "status": "Failed",
                "statusCode": 404,
                "message": "User not found"
            }

        # Check if the password matches
        if user.checkPassword(password):
            return {
                "status": "Success",
                "statusCode": 200,
                "message": "Login successful",
                "data": {
                    "username": username,
                    "userID": user.id
                }
            }
        else:
            return {
                "status": "Failed",
                "statusCode": 401,
                "message": "Incorrect password"
            }

    def getAccountBalance(self, userID):
        try:
            user = User.query.get(userID)

            if user:
                return {
                    "status": "Success",
                    "statusCode": 200,
                    "message": "Account balance retrieved successfully",
                    "data": {
                        "userID": userID,
                        "accountBalance": user.accountBalance
                    }
                }
            else:
                return {
                    "status": "Failed",
                    "statusCode": 404,
                    "message": f"User with ID {userID} not found"
                }
        except Exception as e:
            return {
                "status": "Failed",
                "statusCode": 500,
                "message": str(e)
            }

