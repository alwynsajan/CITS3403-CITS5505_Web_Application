from models import User, db
from werkzeug.security import generatePasswordHash

class DbClient:  # PascalCase for class name
    def __init__(self, dbSession):
        self.dbSession = dbSession  # camelCase

    def getLastUserId(self):  # camelCase
        """Returns the highest user ID or 0 if empty"""
        lastUser = User.query.order_by(User.id.desc()).first()
        return lastUser.id if lastUser else 0

    def addUser(self, username, password, firstName, lastName):  # camelCase
        """Adds new user with auto-incremented ID"""
        if User.query.filter_by(username=username).first():
            return None  # Username exists

        newId = self.getLastUserId() + 1  # camelCase
        newUser = User(
            id=newId,
            username=username,
            password=generatePasswordHash(password),  # camelCase
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

    def checkCredentials(self, username, passwordInput):  # camelCase
        user = User.query.filter_by(username=username).first()
        return user.id if user and user.checkPassword(passwordInput) else None