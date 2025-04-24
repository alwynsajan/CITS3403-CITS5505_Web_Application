def getAccountData(accBalance,previousBalance):

    data ={"balance": accBalance}

    if previousBalance > accBalance:
        data["trendType"] = "down"
    else:
        data["trendType"] = "up"

    # Calculate the percentage change, avoiding division by zero
    if previousBalance != 0:
        data["percentChange"] = round(((accBalance - previousBalance) / previousBalance) * 100,2)
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
        amountSaved = round((accBalance * float(data["allocation"])) / 100, 2)

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
