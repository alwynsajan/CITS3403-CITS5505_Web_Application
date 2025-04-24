from dbClient import dbClient
import calculations

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
                "message": str(e)
                }
        
    def addNewGoal(self,username,userID,data):

        # Validate all required fields
        for key, value in data.items():
            if value is None or str(value).strip() == "":
                return {
                    "status": "Failed",
                    "statusCode": 400,
                    "message": f"Missing required field: {key}"
                }
            
        try:
            status = self.DBClient.addNewGoal(username,data)
            
            #Getting Account Balance
            if status["status"] == "Success":
                accBalanceStatus = self.DBClient.getAccountBalance(userID)

                #Get all goal details from db
                if accBalanceStatus["status"] == "Success":
                    getGoalsStatus = self.DBClient.getGoalsByUserId(userID)

                    #Get the goal progress
                    if getGoalsStatus["status"] == "Success":
                        goalProgressList = calculations.getGoalProgress(data,float(accBalanceStatus["data"]["accountBalance"]))
                        status["data"] = goalProgressList

            return status
            
        except Exception as e:
            return {
                "status": "Failed",
                "statusCode":400,
                "message": str(e)
                }
        
    
        
