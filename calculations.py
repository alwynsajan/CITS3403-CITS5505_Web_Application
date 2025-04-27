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
            goalProgressData["remaining"] = data["targetAmount"] - amountSaved
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
        
