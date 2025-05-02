from dbClient import dbClient
import calculations
from datetime import datetime

class serviceHandler():

    def __init__(self):
        self.DBClient = dbClient()

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
                firstName=data['firstName'],
                lastName=data['lastName']
            )

            return status
            
        except Exception as e:
            return {
                "status": "Failed",
                "statusCode":400,
                "message": "Error : "+str(e)
                }
        
    #adds new goal to the db and return the whole goalProgressList.
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
            return {
                "status": "Failed",
                "statusCode":400,
                "message": "Error : "+str(e)
                }
        
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

                return status
            else:
                return status
        else:
            return status
            
    def addNewExpense(self,username,userID,data):

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
        
    def getUserFirstName(self,userID):

        try:
            status = self.DBClient.getUserFirstName(userID)
            return status
        
        except Exception as e:
            return {
                "status": "Failed",
                "statusCode":400,
                "message": "Error : "+str(e)
                }

    #Gets  the monthlyExpenseList from the db.Returns a list of expenses based on months. 
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
                "message": "Error : "+str(e)
                }
        
    #Gets all the necessary data from the db for dashboard.
    def getDashboardData(self,userID):

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
        salaryStatus  = self.DBClient.getLastSalary(userID)
        if  salaryStatus["status"] == "Success" and salaryStatus["data"] != None:
            salarySuggestions = calculations.calculate_50_30_20_Percentages(float(salaryStatus["data"]["amount"]))
            salarySuggestions["salaryDate"] = salaryStatus["data"]["salaryDate"]
            dashboardData["budgetSuggestionData"] = salarySuggestions
            dashboardData["hasSalary"] = True
        else:
            dashboardData["hasSalary"] = False

        return dashboardData
    
    def getExpensePageData(self,userID):

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

        expenseDataListStatus = self.DBClient.getUserExpenses(userID)
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



                    

    
        
