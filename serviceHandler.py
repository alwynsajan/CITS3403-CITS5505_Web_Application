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

        # Validate required fields for empty or None
        for field, value in data.items():
            if not value:  # catches None, '', and falsy values
                return {
                    "status": "Failed",
                    "statusCode": 400,
                    "message": f"Missing or empty value for field: {field}"
                }
        
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
                        goalProgressList = calculations.getGoalProgress(getGoalsStatus["data"],float(accBalanceStatus["data"]["accountBalance"]))
                        status["data"] = goalProgressList

            return status
            
        except Exception as e:
            return {
                "status": "Failed",
                "statusCode":400,
                "message": str(e)
                }
        
    def getMonthlyExpenses(self,userID):

        try:
            #Get the expense data for the user
            status = self.DBClient.getMonthlyExpenses(userID)

            if status["status"] == "Success" and status["data"] != []:

                #Get the monthly expenses in a list.
                monthlyExpenseList = calculations.getMonthlyExpenseList(status["data"])
                status["data"] = monthlyExpenseList
                return status
            
            return status
            
        except Exception as e:
            return {
                "status": "Failed",
                "statusCode":400,
                "message": str(e)
                }
        
    def getDashboardData(self,userID):

        dashboardData = {}

        accBalanceStatus = self.DBClient.getAccountBalance(userID)

        accountBalance = 0.0
        previousBalance = 0.0

        #Fetch Account Data:
        if accBalanceStatus["status"] == "Success":
            if accBalanceStatus["data"]["accountBalance"] != 0:
                accountBalance = accBalanceStatus["data"]["accountBalance"]
                dashboardData["hasAccountBlance"] = True

                previousAccBalanceStatus = self.DBClient.getPreviousAccountBalance(userID)
                if previousAccBalanceStatus["status"] == "Success":
                    previousBalance = previousAccBalanceStatus["data"]["previousBalance"]
                accountData = calculations.getAccountData(float(accountBalance),float(previousBalance))

                dashboardData["accountData"] = accountData

        else:
            dashboardData["hasAccountBlance"] = False

        #Fetch GoalData:
        getGoalsStatus = self.DBClient.getGoalsByUserId(userID)
        #Get the goal progress
        if getGoalsStatus["status"] == "Success" and getGoalsStatus["data"] != []:
            goalProgressList = calculations.getGoalProgress(getGoalsStatus["data"],float(accountBalance))
            dashboardData["hasGoal"] = True
            dashboardData["goalData"] = goalProgressList
            
        else:
            dashboardData["hasGoal"] = False

        #Fetch Montly expenses:
        status = self.DBClient.getMonthlyExpenses(userID)
        if status["status"] == "Success" and status["data"] != []:
            #Get the monthly expenses in a list.
            monthlyExpenseList = calculations.getMonthlyExpenseList(status["data"])
            dashboardData["hasExpense"] = True
            dashboardData["monthlySpendData"] = monthlyExpenseList

        else:
            dashboardData["hasExpense"] = False

        #Fetch BudgetSuggestionData:

        return dashboardData

                    

    
        
