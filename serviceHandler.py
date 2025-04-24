from dbClient import dbClient

class serviceHandler():
    def __init__(self, db):
        self.db = db
        self.DBClient = dbClient(db)

    def checkCredentials(self,username, password):
        status = self.DBClient.checkCredentials(username, password)
        return status
    
    def addNewUser(self,data):

        # Validate required fields
        if not all(field in data for field in ['username', 'password', 'firstName', 'lastName']):
            return {
                "status": "Failed",
                "statusCode":400,
                "message": "Missing required fields"}
        
        # Validate password strength (customize as needed)
        if len(data['password']) < 8:
            return {
                "status": "Failed",
                "statusCode":400,
                "message": "Password must be at least 8 characters"}
        
        try:
            status = self.DBClient.addUser(
                username=data['username'],
                password=data['password'],
                firstname=data['firstName'],
                lastname=data['lastName']
            )

            return status
            
        except Exception as e:
            return {
                "status": "Failed",
                "statusCode":400,
                "message": str(e)}