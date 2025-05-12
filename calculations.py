from datetime import datetime,timedelta

def getAccountData(accBalance,previousBalance):

    data ={"balance": accBalance}

    if previousBalance > accBalance:
        data["trendType"] = "down"
    else:
        data["trendType"] = "up"

    # Calculate the percentage change, avoiding division by zero
    if previousBalance != 0:
        data["percentChange"] = round(((float(accBalance) - float(previousBalance)) / float(previousBalance)) * 100,2)
    else:
        data["percentChange"] = 100.0

    return data


def getGoalProgress(goalData, accBalance):

    # List to store progress info for each goal
    goalProgressDataList = []

    for data in goalData:
        goalProgressData = {}

        # Set goal name and target amount
        goalProgressData["goalName"] = data["goalName"]
        goalProgressData["target"] = data["targetAmount"]

        # Calculate amount saved based on allocation and account balance
        amountSaved = round((accBalance * float(data["percentageAllocation"])) / 100, 2)

        # If goal is fully achieved
        if amountSaved >= data["targetAmount"]:
            goalProgressData["progressPercentage"] = 100
            goalProgressData["remaining"] = 0
            goalProgressData["saved"] = data["targetAmount"]
            goalProgressData["message"] = "Congratulations, Goal met!!"
        else:
            # Calculate progress percentage and amount remaining
            goalProgressData["progressPercentage"] = round((amountSaved / float(data["targetAmount"])) * 100, 2)
            goalProgressData["remaining"] = round(data["targetAmount"] - amountSaved,2)
            goalProgressData["saved"] = amountSaved

            # Suggest monthly savings needed to reach the goal
            monthlySavings = round(data["targetAmount"] / data["timeDuration"], 2)
            goalProgressData["message"] = f"Save at least ${monthlySavings:.2f} per month to reach your goal!"

        # Add this goal's progress data to the list
        goalProgressDataList.append(goalProgressData)

    return goalProgressDataList

# Returns a list with total expenses for each month (index 0 = Jan, 11 = Dec)
def getMonthlyExpenseList(data):

    monthlyExpenseList= [0,0,0,0,0,0,0,0,0,0,0,0]

    for expense in data:
        dateObj = datetime.strptime(expense["date"], "%Y-%m-%d")
        index = dateObj.month - 1
        monthlyExpenseList[index]+= float(expense["amount"])

    return monthlyExpenseList

# Calculates 50/30/20 budget rule breakdown from given salary
def calculate_50_30_20_Percentages(salary):

    salary = float(salary)
    return {
        "needs": round(salary * 0.50, 2),
        "wants": round(salary * 0.30, 2),
        "savings": round(salary * 0.20, 2),
        "salary" : salary
    }

# Returns the Monday of the week for a given date
def getStartOfWeek(inputDate):

    # If input is a string, convert to datetime object
    if isinstance(inputDate, str):
        inputDate = datetime.strptime(inputDate, "%Y-%m-%d").date()
    
    # Calculate the Monday of that week
    startOfWeek = inputDate - timedelta(days=inputDate.weekday())
    return startOfWeek

#Returns a list of total salary per month from salary data
def getMonthlySalaryList(salaryData):

    # Initialize list with 12 zeros
    monthlySalaryList = [0] * 12 

    for salary in salaryData:
        dateObj = datetime.strptime(salary["salaryDate"], "%Y-%m-%d")
        index = dateObj.month - 1
        monthlySalaryList[index] += float(salary["amount"])

    return monthlySalaryList

# def getcategoryPercentages(categoryExpenseDict):

#     for month,expenses in categoryExpenseDict.items():
#         for category,expense in expenses.items():
#             if category != "total":
#                 categoryExpenseDict[month][category] = round((expense*100)/categoryExpenseDict[month]["total"],2)

#     return categoryExpenseDict

#Returns a list of total expenses per month from expense data
def getExpensePageData(expenseData):
    
    # Initialize list with 12 zeros
    monthlyExpenseList = [0] * 12 
    weeklyExpenseDict = {}
    categoryExpenseDict = {}
    
    for expense in expenseData:
        dateObj = datetime.strptime(expense["date"], "%Y-%m-%d")
        index = dateObj.month - 1
        monthlyExpenseList[index] += float(expense["amount"])
        
        # Weekly Expense Data (for past 8 weeks)
        weekStart = datetime.strptime(expense["weekStartDate"], "%Y-%m-%d").date()
        if weekStart >= (datetime.today().date() - timedelta(weeks=8)):
            weekEnd = weekStart + timedelta(days=6)
            weekLabel = f"{weekStart.day} {weekStart.strftime('%b')} - {weekEnd.day} {weekEnd.strftime('%b')}"
            
            if weekLabel in weeklyExpenseDict:
                weeklyExpenseDict[weekLabel] += float(expense["amount"])
            else:
                weeklyExpenseDict[weekLabel] = float(expense["amount"])


        # Monthly Category-wise Data (for past 5 months approx)
        if dateObj.date() >= (datetime.today().replace(day=1) - timedelta(days=150)).date():
            month = dateObj.strftime("%B")
            category = expense["category"]
            amount = float(expense["amount"])
            
            if month not in categoryExpenseDict:
                categoryExpenseDict[month] = {category: amount, "total": amount}
            elif category not in categoryExpenseDict[month]:
                categoryExpenseDict[month][category] = amount
                categoryExpenseDict[month]["total"] += amount
            else:
                categoryExpenseDict[month][category] += amount
                categoryExpenseDict[month]["total"] += amount

    return monthlyExpenseList, weeklyExpenseDict, categoryExpenseDict


        
