from dbClient import dbClient
import calculations
from datetime import datetime
from models import User

class serviceHandler():
    """
    Main service handler class that acts as an intermediary between the API layer and database layer.
    Handles business logic, data validation, and orchestrates database operations with calculations.
    """

    def __init__(self):
        """Initialize the service handler with a database client instance"""
        self.DBClient = dbClient()

    # def checkCredentials(self,username, password):
    #     status = self.DBClient.checkCredentials(username, password)
    #     return status

    """
    Centralized error handling method
    Args:
        error: Exception object
        context: String describing what operation was being attempted
    Returns:
        dict: Standard error response format
    """
    def handleError(self, error, context="operation"):
        
        # Log the full error to terminal for debugging
        print(f"SYSTEM ERROR during {context}: {str(error)}")
        
        # Return user-friendly message
        return {
            "status": "Failed",
            "statusCode": 500,
            "message": f"An error occurred while processing your request. Please try again."
        }
    
    """
    Register a new user with validation checks
    
    Args:
        data (dict): Contains user registration data (username, password, firstName, lastName)
        
    Returns:
        dict: Status dictionary with success/failure information
    """
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
                firstName=data['firstName'],
                lastName=data['lastName']
            )

            return status
            
        except Exception as e:
            return self.handleError(e, "user registration")
        
    """
    Add a new financial goal for a user with allocation validation
    
    Args:
        username (str): Username of the goal creator
        userID (int): ID of the user
        data (dict): Goal data including name, targetAmount, etc.
        
    Returns:
        dict: Status with goal progress list if successful
    """
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
            status = self.DBClient.checkAndAddGoalAllocation(userID,data["percentageAllocation"])

            if status["status"] == "Success":
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
            return self.handleError(e, "adding new goal")
        
    """
    Record a new salary entry and update account balance
    
    Args:
        username (str): Username (unused in current implementation)
        userID (int): ID of the user
        data (dict): Salary data including amount and date
        
    Returns:
        dict: Status with monthly salary list if successful
    """
    def addNewSalary(self,username,userID,data):

        # Validate all required fields
        for key, value in data.items():
            if value is None or str(value).strip() == "":
                return {
                    "status": "Failed",
                    "statusCode": 400,
                    "message": f"Missing required field: {key}"
                }
            
        salaryDate = datetime.strptime(data["salaryDate"], "%Y-%m-%d").date()
            
        status = self.DBClient.getAccountBalance(userID)

        if status["status"] == "Success":
            #Update the previous Account Balance
            previousAccBalance = status["data"]["accountBalance"]
            status = self.DBClient.updatePreviousBalance(userID,float(previousAccBalance) )

            if status["status"] == "Success":
                newBalance = float(previousAccBalance) + float(data["amount"])
                status = self.DBClient.updateAccountBalance(userID, newBalance)

                if status["status"] == "Success":
                    status = self.DBClient.addSalary(userID,float(data["amount"]),salaryDate)

                    if status["status"] == "Success":
                        salaryDataListStatus = self.DBClient.getUserSalaries(userID)

                        if salaryDataListStatus["status"] == "Success" and salaryDataListStatus["data"] != []:
                            monthlySalaryList = calculations.getMonthlySalaryList(salaryDataListStatus["data"])

                            status["data"]["newSalaryData"] = monthlySalaryList
                            return status
                        else:
                            return salaryDataListStatus
                    else:
                        return status

                return status
            else:
                return status
        else:
            return status
    
    """
    Record a new expense and update account balance
    
    Args:
        username (str): Username (unused in current implementation)
        userID (int): ID of the user
        data (dict): Expense data including amount, category and date
        
    Returns:
        dict: Status with updated expense page data if successful
    """
    def addNewExpense(self,username,userID,data):

        try:

            # Validate all required fields
            for key, value in data.items():
                if value is None or str(value).strip() == "":
                    return {
                        "status": "Failed",
                        "statusCode": 400,
                        "message": f"Missing required field: {key}"
                    }
                
            startOfWeek = calculations.getStartOfWeek(data["date"])
            date = datetime.strptime(data["date"], "%Y-%m-%d").date()
            
            status = self.DBClient.getAccountBalance(userID)

            if status["status"] == "Success":
                #Update the previous Account Balance
                previousAccBalance = status["data"]["accountBalance"]
                status = self.DBClient.updatePreviousBalance(userID,float(previousAccBalance) )

                if status["status"] == "Success":
                    newBalance = float(previousAccBalance) - float(data["amount"])
                    status = self.DBClient.updateAccountBalance(userID, newBalance)

                    if status["status"] == "Success":
                        status = self.DBClient.addNewExpense(userID, data["amount"], data["category"], date,startOfWeek)
                        # return status #for testing

                        if status["status"] == "Success":
                            #Call functions to update the graph data for expense page.
                            expensePageData = self.getExpensePageData(userID)
                            return expensePageData
                        else:
                            return status

                    else:
                        return status
                else:
                    return status
            else:
                return status
            
        except Exception as e:
            return self.handleError(e, "adding new expense")
        
    """
    Retrieve a user's first name
    
    Args:
        userID (int): ID of the user
        
    Returns:
        dict: Status with first name if successful
    """
    def getUserFirstName(self,userID):

        try:
            status = self.DBClient.getUserFirstName(userID)
            return status
        
        except Exception as e:
            return self.handleError(e, "Fetching user firstname")

    """
    Get monthly aggregated expense data for a user
    
    Args:
        userID (int): ID of the user
        
    Returns:
        dict: Status with monthly expense list if successful
    """
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
            return self.handleError(e, "Fetching user monthly expenses.")
        
    """
    Compile all data needed for the user dashboard
    
    Args:
        userID (int): ID of the user
        
    Returns:
        dict: Complete dashboard data including:
            - Account balance information
            - Goal progress
            - Monthly spending
            - Budget suggestions
    """
    def getDashboardData(self,userID):

        try:

            dashboardData = {}

            accBalanceStatus = self.DBClient.getAccountBalance(userID)

            accountBalance = 0.0
            previousBalance = 0.0

            #Fetch Account Data:
            if accBalanceStatus["status"] == "Success":
                if accBalanceStatus["data"]["accountBalance"] != 0:
                    accountBalance = accBalanceStatus["data"]["accountBalance"]
                    dashboardData["hasAccountBalance"] = True

                    previousAccBalanceStatus = self.DBClient.getPreviousAccountBalance(userID)
                    if previousAccBalanceStatus["status"] == "Success":
                        previousBalance = previousAccBalanceStatus["data"]["previousBalance"]
                    accountData = calculations.getAccountData(float(accountBalance),float(previousBalance))

                    dashboardData["accountData"] = accountData
                else:
                    dashboardData["hasAccountBalance"] = False

            else:
                dashboardData["hasAccountBalance"] = False
                dashboardData["accountData"] = {}

            #Fetch GoalData:
            getGoalsStatus = self.DBClient.getGoalsByUserId(userID)
            #Get the goal progress
            if getGoalsStatus["status"] == "Success" and getGoalsStatus["data"] != []:
                goalProgressList = calculations.getGoalProgress(getGoalsStatus["data"],float(accountBalance))
                dashboardData["hasGoal"] = True
                dashboardData["goalData"] = goalProgressList
                
            else:
                dashboardData["hasGoal"] = False
                dashboardData["goalData"] = []

            # sharedReportNumberStatus = self.DBClient.getReportNumber(userID)
            # if sharedReportNumberStatus["status"] == "Success":
            #     dashboardData["reportCount"] = sharedReportNumberStatus["data"]["reportCount"]

            #Fetch Montly expenses:
            status = self.DBClient.getMonthlyExpenses(userID)
            if status["status"] == "Success" and status["data"] != []:
                #Get the monthly expenses in a list.
                monthlyExpenseList = calculations.getMonthlyExpenseList(status["data"])
                dashboardData["hasExpense"] = True
                dashboardData["monthlySpendData"] = monthlyExpenseList
                
                lastestExpensestatus = self.DBClient.getLastFiveExpenses(userID)

                if lastestExpensestatus["status"] == "Success":
                    dashboardData["transaction"] = lastestExpensestatus["data"]["transaction"]

            else:
                dashboardData["hasExpense"] = False
                dashboardData["monthlySpendData"] = []

            #Fetch BudgetSuggestionData:
            salaryStatus  = self.DBClient.getLastSalary(userID)
            if  salaryStatus["status"] == "Success" and salaryStatus["data"] != None:
                salarySuggestions = calculations.calculate_50_30_20_Percentages(float(salaryStatus["data"]["amount"]))
                salarySuggestions["salaryDate"] = salaryStatus["data"]["salaryDate"]
                dashboardData["budgetSuggestionData"] = salarySuggestions
                dashboardData["hasSalary"] = True
            else:
                dashboardData["hasSalary"] = False
                dashboardData["budgetSuggestionData"] = {}

            return dashboardData
        
        except Exception as e:
            return self.handleError(e, "loading dashboard data")
    
    """
    Compile all data needed for the expense tracking page
    
    Args:
        userID (int): ID of the user
        
    Returns:
        dict: Complete expense page data including:
            - Salary information (if exists)
            - Expense breakdown by month and category
            - Weekly spending data
    """
    def getExpensePageData(self,userID):

        try:
            expenseData = {}
            expenseAndSalary = {}

            salaryDataListStatus = self.DBClient.getUserSalaries(userID)

            if salaryDataListStatus["status"] == "Success" and salaryDataListStatus["data"] != []:
                monthlySalaryList = calculations.getMonthlySalaryList(salaryDataListStatus["data"])
                expenseData["hasSalary"] = True
                expenseAndSalary["salaryData"] = monthlySalaryList
                expenseData["expenseAndSalary"] = expenseAndSalary
            else:
                expenseData["hasSalary"] = False

            expenseDataListStatus = self.DBClient.getMonthlyExpenses(userID)
            if expenseDataListStatus["status"] == "Success" and expenseDataListStatus["data"] != []:
                monthlyExpenseList,weeklyExpense,categoryexpensePercentage = calculations.getExpensePageData(expenseDataListStatus["data"])
                expenseData["hasExpense"] = True
                expenseAndSalary["expenseData"] = monthlyExpenseList
                expenseData["expenseAndSalary"] = expenseAndSalary
                expenseData["weeklyExpense"] = weeklyExpense
                expenseData["monthlyCategoryExpenses"] = categoryexpensePercentage

            else:
                expenseData["hasExpense"] = False

            return expenseData
        
        except Exception as e:
            return self.handleError(e, "loading expense data")
    
    """
    Retrieve list of usernames and IDs (excluding current user)
    
    Args:
        userID (int): ID of the current user
        
    Returns:
        dict: Status with list of other users if successful
    """
    def getUsernamesAndIDs(self,userID,query):

        try:
            status = self.DBClient.getUsernamesAndIDs(userID,query)
            return status
        
        except Exception as e:
            return self.handleError(e, "get username and id")

    """
    Share a financial report with another user
    
    Args:
        userID (int): ID of the sender
        receiverID (int): ID of the recipient
        
    Returns:
        dict: Status indicating success/failure of report sharing
    """
    def sendReport(self, userID, receiverID):
        try:
            # Validate sender and receiver
            validationResult = self.DBClient.validateUsersExist(userID, receiverID)
            if validationResult["status"] != "Success":
                return validationResult

            sender = validationResult["sender"]
            receiver = validationResult["receiver"]

            # Fetch dashboard and expense data
            dashboardData = self.getDashboardData(userID)
            expenseData = self.getExpensePageData(userID)

            # Combine into a single dictionary
            combinedData = {
                "senderFirstName":sender.firstName,
                "senderLastName":sender.lastName,
                "dashboardData": dashboardData,
                "expenseData": expenseData
            }

            saveStatus = self.DBClient.saveSharedReport(
            senderID=userID,
            senderFirstName=sender.firstName,
            senderLastName=sender.lastName,
            receiverID=receiverID,
            data=combinedData
            )

            if saveStatus["status"] != "Success":
                return saveStatus

            return {
                "status": "Success",
                "statusCode": 200,
                "message": f"Report shared with {receiver.firstName}",
                "data": None
                    }
        except Exception as e:
            return self.handleError(e, "sharing report")
        
    """
    Retrieve details of users who have shared reports with current user
    
    Args:
        userID (int): ID of the current user
        
    Returns:
        dict: Status with sender details if successful
    """
    def getSenderDetails(self,userID):
        try:
            status = self.DBClient.getSenderDetails(userID)
            return status
        except Exception as e:
            return self.handleError(e, "sharing report")
        
    """
    Retrieve a specific shared report's data
    
    Args:
        userID (int): ID of the recipient
        sendersID (int): ID of the sender
        sharedDate (str): Date when report was shared
        
    Returns:
        dict: Status with report data if successful
    """
    def getReportData(self,userID,sendersID,reportID):

        try:
            # Validate sender and receiver
            validationResult = self.DBClient.validateUsersExist(userID, sendersID)
            if validationResult["status"] != "Success":
                return validationResult
                        
            reportStatus = self.DBClient.getReportData(userID,sendersID,reportID)

            return reportStatus
            
        except Exception as e:
            return self.handleError(e, "retrieving report")
        
    """
    Get IDs of unread reports for a user
    
    Args:
        userID (int): ID of the user
        
    Returns:
        dict: Status with list of unread report IDs if successful
    """  
    def getUnreadReportIds(self,userID):
        try:
            status = self.DBClient.getUnreadReportIds(userID)
            return status
        except Exception as e:
            return self.handleError(e, "retrieving unread report ids")
        
    """
    Get count of unread reports for a user
    
    Args:
        userID (int): ID of the user
        
    Returns:
        dict: Status with unread count if successful
    """
    def getUnreadReportCount(self,userID):
        try:
            status = self.DBClient.getUnreadReportCount(userID)
            return status
        except Exception as e:
            return self.handleError(e, "retrieving unread report count")
        
    """
    Mark a report as read for a user
    
    Args:
        userID (int): ID of the user
        reportID (int): ID of the report to mark as read
        
    Returns:
        dict: Status indicating success/failure
    """
    def markReportAsRead(self,userID,reportID):
        try:
            status = self.DBClient.markReportAsRead(userID,reportID)
            return status
        except Exception as e:
            return self.handleError(e, "marking report as read")

    """
    Retrieve user settings

    Args:
        userId (int): ID of the user

    Returns:
        dict: User settings or error information
    """
    def getUserSettings(self, userId):
        try:
            status = self.DBClient.getUserSettings(userId)
            return status
        except Exception as e:
            return self.handleError(e, "Fetching user Settings.")

    """
    Update a user's name

    Args:
        userId (int): ID of the user
        firstName (str): New first name
        lastName (str): New last name

    Returns:
        dict: Status of update operation
    """
    def updateUserName(self, userId, firstName, lastName):
        return self.DBClient.updateUserName(userId, firstName, lastName)

    """
    Update a user's password

    Args:
        userId (int): ID of the user
        currentPassword (str): Current password
        newPassword (str): New password
        confirmPassword (str): Confirmation of the new password

    Returns:
        dict: Status indicating success/failure and messages for error cases
    """
    def updateUserPassword(self, userId, currentPassword, newPassword, confirmPassword):
        try:
            user = User.query.get(userId)
            if not user:
                return {
                    "status": "Failed",
                    "statusCode": 404,
                    "message": "User not found"
                }

            if not user.checkPassword(currentPassword):
                return {
                    "status": "Failed",
                    "statusCode": 401,
                    "message": "Incorrect current password"
                }

            if newPassword != confirmPassword:
                return {
                    "status": "Failed",
                    "statusCode": 400,
                    "message": "New password and confirmation do not match"
                }

            return self.DBClient.updateUserPassword(userId, newPassword)

        except Exception as e:
            return self.handleError(e, "update user password")
        
    """
    Get the account balance and related data for a user

    Args:
        userID (int): ID of the user

    Returns:
        dict: Account data including current and previous balances, and computed insights
    """
    def getAccountData(self,userID):

        try:
            accBalanceStatus = self.DBClient.getAccountBalance(userID)
            hasAccountBalance = False
            accountBalance = 0.0
            previousBalance = 0.0
            data= {"status":None,
                    "statusCode":None,
                    "data": {"accountData":None,
                             "hasAccountBalance":False
                             }
                    
                    }

            #Fetch Account Data:
            if accBalanceStatus["status"] == "Success":
                if accBalanceStatus["data"]["accountBalance"] != 0:
                    accountBalance = accBalanceStatus["data"]["accountBalance"]
                    hasAccountBalance = True

                    previousAccBalanceStatus = self.DBClient.getPreviousAccountBalance(userID)
                    if previousAccBalanceStatus["status"] == "Success":
                        previousBalance = previousAccBalanceStatus["data"]["previousBalance"]
                    accountData = calculations.getAccountData(float(accountBalance),float(previousBalance))

                    data["status"] = "Success"
                    data["statusCode"] = 200
                    data["data"]["accountData"] = accountData
                    data["data"]["hasAccountBalance"] = hasAccountBalance

                    return data
                
            return accBalanceStatus
        
        except Exception as e:
            return self.handleError(e, "Fetching user account Data.")
        

    """
    Retrieve the latest transactions and monthly expense summary for a user

    Args:
        userID (int): ID of the user

    Returns:
        dict: Latest transactions, monthly expenses, and metadata
    """
    def getLatestTransactions(self, userID):
        try:
            data= {"status":None,
                    "statusCode":None,
                    "data": None,
                    "monthlyExpenses": None,
                    "hasExpense":False
                    }
            
            lastestExpensestatus = self.DBClient.getLastFiveExpenses(userID)
            data['data'] = lastestExpensestatus["data"]["transaction"]

            status = self.DBClient.getMonthlyExpenses(userID)

            if status["status"] == "Success" and status["data"] != []:
                #Get the monthly expenses in a list.
                monthlyExpenseList = calculations.getMonthlyExpenseList(status["data"])
                data["monthlyExpenses"] = monthlyExpenseList
                data["hasExpense"] = True
                data["status"] = "Success"
                data["statusCode"] = 200

            return data
        except Exception as e:
            return self.handleError(e, "Fetching last Transaction")
        

    """
    Update allocation settings for a user

    Args:
        userID (int): ID of the user
        data (dict): Dictionary containing goal name to update

    Returns:
        dict: Status indicating success/failure
    """
    def updateAllocation(self,userID, data):

        try:
            status = self.DBClient.updateAllocation(userID,data["goalName"])
            return status

        except Exception as e:
            return self.handleError(e, "update user password")
        
    """
    Retrieve goals for a user

    Args:
        userID (int): ID of the user

    Returns:
        dict: Goals data or error message
    """
    def getGoals(self,userID):

        try:
            getGoalsStatus = self.DBClient.getGoalsByUserId(userID)
            return getGoalsStatus

        except Exception as e:
            return self.handleError(e, "update user password")



        







                    

    
        
