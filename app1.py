import os
from flask import Flask, render_template, request, jsonify, send_from_directory, session, redirect, url_for
from datetime import datetime
import time
import random
import string
from calculations_app1 import calculate_goal_progress

app = Flask(__name__)
app.secret_key = 'your_very_secret_key_here' # Necessary for session simulation

# Mock data based on user specification
# Original mock data with expenses
original_mock_data = {
    "accountData": {
        "balance": 1500.75,
        "percentChange": 3.5,
        "trendType": "up" # up / down
    },
    "goalData": [
        {
            "goalName": "Laptop",
            "progressPercentage": 65,
            "target": 1200,
            "saved": 740,
            "remaining": 200, # Changed to match the specification
            "allocation": 20
        },
    ],
    "transaction": [
        {"category": "Grocery", "amount": 30},
        {"category": "Fuel", "amount": 50},
        {"category": "Grocery", "amount": 20},
        {"category": "Food", "amount": 15},
        {"category": "Bills", "amount": 250}
    ],
    "budgetSuggestionData": {
        "needs": 750,
        "wants": 450,
        "savings": 300,
        "salary": 1500,
        "salaryDate": "2025-04-25"
    },
    "monthlySpendData": {
        "Expenses": [200, 560, 700, 500, 0, 0, 0, 0, 0, 0, 0, 0]
    },
    "reportCount": 2,
    "unreadReportIds": ["report_1", "report_2"],  # Using unique report IDs instead of sender IDs
    "username": "Ashley",
    "hasExpense": True, # Flag for transactions
    "hasAccountBalance": True,
    "hasGoal": True,
    "hasSalary": True
}

# Mock data without expenses (for testing share button disabled state)
no_expense_mock_data = {
    "accountData": {
        "balance": 1500.75,
        "percentChange": 3.5,
        "trendType": "up" # up / down
    },
    "goalData": [
        {
            "goalName": "Laptop",
            "progressPercentage": 65,
            "target": 1200,
            "saved": 740,
            "remaining": 200,
            "allocation": 20
        },
    ],
    "transaction": [], # Empty transactions
    "budgetSuggestionData": {
        "needs": 750,
        "wants": 450,
        "savings": 300,
        "salary": 1500,
        "salaryDate": "2025-04-25"
    },
    "monthlySpendData": {
        "Expenses": [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0] # All zeros
    },
    "reportCount": 2,
    "unreadReportIds": ["report_1", "report_2"],
    "username": "Ashley",
    "hasExpense": False, # Flag for transactions set to False
    "hasAccountBalance": True,
    "hasGoal": True,
    "hasSalary": True
}

# Use original mock data by default
mock_data = original_mock_data.copy()

# Mock data for the Expenses page (as per new specification)
expenses_page_data = {
    "hasExpenses": True,
    "monthlyCategoryExpenses": {
        "April": {"Bills": 250, "Shopping": 150, "Grocery": 300, "Transportation": 100, "total": 800},
        "May": {"Bills": 260, "Shopping": 160, "Grocery": 310, "Transportation": 110, "total": 840},
        "June": {"Bills": 240, "Shopping": 140, "Grocery": 290, "Transportation": 90, "total": 760},
        "July": {"Bills": 270, "Shopping": 170, "Grocery": 320, "Transportation": 120, "total": 880},
        "August": {"Bills": 230, "Shopping": 130, "Grocery": 280, "Transportation": 80, "total": 720}
    },
    "expenseAndSalary": {
        "salaryData": [3000, 3200, 3100, 3300, 3400, 3500, 3600, 3700, 3800, 3900, 4000, 4100],
        "expenseData": [2200, 2500, 2400, 2600, 2700, 2800, 2900, 3000, 3100, 3200, 3300, 3400]
    },
    "weeklyExpense": {
        "2025-07-07": 200,
        "2025-07-14": 210,
        "2025-07-21": 190,
        "2025-07-28": 220,
        "2025-08-04": 180,
        "2025-08-11": 230,
        "2025-08-18": 170,
        "2025-08-25": 240
    }
}

@app.route("/")
def index():
    # Simulate user logged in
    session['username'] = 'user@example.com'
    session['first_name'] = 'Test'
    session['last_name'] = 'User'
    session['user_id'] = 1  # Add user ID to session
    return redirect(url_for('dashboard'))

@app.route("/test")
def test_index():
    """
    Test route that sets up the session and provides links to all test routes.
    """
    # Simulate user logged in
    session['username'] = 'user@example.com'
    session['first_name'] = 'Test'
    session['last_name'] = 'User'
    session['user_id'] = 1  # Add user ID to session

    # Create a simple HTML page with links to all test routes
    html = """
    <!DOCTYPE html>
    <html>
    <head>
        <title>Share Button Test</title>
        <style>
            body { font-family: Arial, sans-serif; margin: 20px; }
            h1 { color: #333; }
            ul { list-style-type: none; padding: 0; }
            li { margin-bottom: 10px; }
            a { display: inline-block; padding: 10px 15px; background-color: #4CAF50; color: white; text-decoration: none; border-radius: 4px; }
            a:hover { background-color: #45a049; }
            p { margin-top: 20px; color: #666; }
        </style>
    </head>
    <body>
        <h1>Share Button Test Routes</h1>
        <ul>
            <li><a href="/dashboard">Normal Dashboard (with expenses)</a></li>
            <li><a href="/test-no-expense">Test No Expense (share button should be disabled)</a></li>
            <li><a href="/test-add-expense">Test Add Expense (share button should be enabled)</a></li>
            <li><a href="/test-add-then-clear-expense">Test Add Then Clear Expense (share button should be disabled)</a></li>
        </ul>
        <p>Click on any of the links above to test the share button functionality.</p>
    </body>
    </html>
    """

    return html

@app.route("/dashboard")
def dashboard():
    if 'username' not in session:
        return redirect(url_for('index')) # Redirect to index which will set up the session

    # Ensure user_id exists in session
    if 'user_id' not in session:
        session['user_id'] = 1

    # Update goal progress before rendering dashboard, but only for goals that are not new
    if mock_data["hasGoal"] and mock_data["goalData"]:
        # Get goals that are not new (have been updated at least once)
        goals_to_update = []
        for goal in mock_data["goalData"]:
            # Check if this goal has the 'isNew' flag
            if not goal.get('isNew', False):
                goals_to_update.append(goal)

        # Only calculate progress for non-new goals
        if goals_to_update:
            updated_goals = calculate_goal_progress(goals_to_update, mock_data["accountData"]["balance"])

            # Update the goals in mock_data
            for updated_goal in updated_goals:
                for i, goal in enumerate(mock_data["goalData"]):
                    if goal["goalName"] == updated_goal["goalName"]:
                        mock_data["goalData"][i] = updated_goal
                        break

    # Pass the whole mock_data, including the username within it if needed by template logic elsewhere
    # Add user_id to template variables
    return render_template("dashboard.html", data=mock_data, username=session['username'], current_user={'id': session.get('user_id', 1)})

@app.route("/test-no-expense")
def test_no_expense():
    """
    Test route to demonstrate the share button being disabled when there are no expenses.
    This route uses the no_expense_mock_data which has hasExpense=False and all zeros in monthlySpendData.
    """
    if 'username' not in session:
        return redirect(url_for('index'))

    # Ensure user_id exists in session
    if 'user_id' not in session:
        session['user_id'] = 1

    # Use the no_expense_mock_data for this test route
    global mock_data
    # Save the current mock_data
    temp_mock_data = mock_data.copy()
    # Set mock_data to no_expense_mock_data
    mock_data = no_expense_mock_data.copy()

    # Render the dashboard with no expense data
    result = render_template("dashboard.html", data=mock_data, username=session['username'], current_user={'id': session.get('user_id', 1)})

    # Restore the original mock_data
    mock_data = temp_mock_data

    return result

@app.route("/test-add-expense")
def test_add_expense():
    """
    Test route to demonstrate the share button being enabled after adding an expense.
    This route first sets up a no-expense state, then adds an expense, and finally renders the dashboard.
    """
    if 'username' not in session:
        return redirect(url_for('index'))

    # Ensure user_id exists in session
    if 'user_id' not in session:
        session['user_id'] = 1

    # Use the no_expense_mock_data for this test route
    global mock_data
    # Save the current mock_data
    temp_mock_data = mock_data.copy()
    # Set mock_data to no_expense_mock_data
    mock_data = no_expense_mock_data.copy()

    # Add an expense
    # Create a new transaction
    new_transaction = {
        "category": "Test Expense",
        "amount": 100,
        "date": datetime.now().strftime("%Y-%m-%d")
    }

    # Add the transaction to the beginning of the list
    mock_data["transaction"].insert(0, new_transaction)
    mock_data["hasExpense"] = True

    # Update monthly expenses data
    current_month = datetime.now().month - 1  # Convert to 0-based index
    mock_data["monthlySpendData"]["Expenses"][current_month] += 100
    print(f"Test route: Updated monthly expenses for month {current_month + 1} to {mock_data['monthlySpendData']['Expenses'][current_month]}")

    # Render the dashboard with the updated data
    result = render_template("dashboard.html", data=mock_data, username=session['username'], current_user={'id': session.get('user_id', 1)})

    # Restore the original mock_data
    mock_data = temp_mock_data

    return result

@app.route("/test-add-then-clear-expense")
def test_add_then_clear_expense():
    """
    Test route to demonstrate the share button being disabled after clearing all expenses.
    This route first adds an expense, then clears all expenses, and finally renders the dashboard.
    """
    if 'username' not in session:
        return redirect(url_for('index'))

    # Ensure user_id exists in session
    if 'user_id' not in session:
        session['user_id'] = 1

    # Use the no_expense_mock_data for this test route
    global mock_data
    # Save the current mock_data
    temp_mock_data = mock_data.copy()
    # Set mock_data to no_expense_mock_data
    mock_data = no_expense_mock_data.copy()

    # First, add an expense
    new_transaction = {
        "category": "Test Expense",
        "amount": 100,
        "date": datetime.now().strftime("%Y-%m-%d")
    }

    # Add the transaction to the beginning of the list
    mock_data["transaction"].insert(0, new_transaction)
    mock_data["hasExpense"] = True

    # Update monthly expenses data
    current_month = datetime.now().month - 1  # Convert to 0-based index
    mock_data["monthlySpendData"]["Expenses"][current_month] += 100
    print(f"Test route: Updated monthly expenses for month {current_month + 1} to {mock_data['monthlySpendData']['Expenses'][current_month]}")

    # Now, clear all expenses
    mock_data["transaction"] = []
    mock_data["hasExpense"] = False
    mock_data["monthlySpendData"]["Expenses"] = [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0]
    print("Test route: Cleared all expenses")

    # Render the dashboard with the updated data
    result = render_template("dashboard.html", data=mock_data, username=session['username'], current_user={'id': session.get('user_id', 1)})

    # Restore the original mock_data
    mock_data = temp_mock_data

    return result

@app.route("/expense")
def expense():
    if 'username' not in session:
        return redirect(url_for('index'))

    # Ensure user_id exists in session
    if 'user_id' not in session:
        session['user_id'] = 1

    # Pass the new expenses_page_data to the template
    return render_template("expense.html", username=session['username'], data=expenses_page_data, current_user={'id': session.get('user_id', 1)})

@app.route("/settings")
def settings():
    if 'username' not in session:
        return redirect(url_for('index'))

    # Ensure user_id exists in session
    if 'user_id' not in session:
        session['user_id'] = 1

    return render_template("settings.html", username=session['username'], current_user={'id': session.get('user_id', 1)})

@app.route("/shared-report-view")
def shared_report_view():
    if 'username' not in session:
        return redirect(url_for('index'))

    # Ensure user_id exists in session
    if 'user_id' not in session:
        session['user_id'] = 1

    # Use data from get_report function directly
    # Create a mock request with userID=1
    userID = 1

    # Get report data for userID=1
    # This is a simplified version that directly uses the data from get_report
    if userID == 1:
        # For dashboardData, use a copy of the main mock_data and adjust monthlySpendData
        temp_dashboard_data = {
            key: value for key, value in mock_data.items() if key not in ['username', 'reportCount']
        }

        # Specifically adjust monthlySpendData to be a direct array
        if 'monthlySpendData' in temp_dashboard_data and isinstance(temp_dashboard_data['monthlySpendData'], dict) and 'Expenses' in temp_dashboard_data['monthlySpendData']:
            temp_dashboard_data['monthlySpendData'] = temp_dashboard_data['monthlySpendData']['Expenses']
        else:
            temp_dashboard_data['monthlySpendData'] = [0, 500.5, 100.5, 200.5, 1001.0, 0, 0, 0, 0, 0, 0, 0]

        report_dashboard_data = {
            "hasAccountBalance": temp_dashboard_data.get("hasAccountBalance", True),
            "accountData": temp_dashboard_data.get("accountData", {"balance": 1997.5, "trendType": "down", "percentChange": -20.04}),
            "hasGoal": temp_dashboard_data.get("hasGoal", True),
            "goalData": temp_dashboard_data.get("goalData", []),
            "hasExpense": temp_dashboard_data.get("hasExpense", True),
            "monthlySpendData": temp_dashboard_data.get("monthlySpendData"),
            "transaction": temp_dashboard_data.get("transaction", []),
            "budgetSuggestionData": temp_dashboard_data.get("budgetSuggestionData", {}),
            "hasSalary": temp_dashboard_data.get("hasSalary", True)
        }

        # 准备报告数据
        report_data = {
            'senderFirstName': "Alwyn",
            'senderLastName': "S",
            'dashboardData': report_dashboard_data,
            'expenseData': {}
        }

        return render_template("report.html", data=report_data, current_user={'id': session.get('user_id', 1)})
    else:
        return render_template("report.html", data={}, current_user={'id': session.get('user_id', 1)})

@app.route("/add_salary", methods=["POST"])
def add_salary():
    if 'username' not in session:
         return jsonify({"status": "Failed", "message": "User not logged in"}), 401

    # Ensure user_id exists in session
    if 'user_id' not in session:
        session['user_id'] = 1

    req = request.get_json()
    print("Received salary data:", req)  # Debug print
    print("Request content type:", request.content_type)
    print("Request headers:", request.headers)

    # Get amount and try to convert to float
    amount = req.get("amount")
    print("Amount from request:", amount, "Type:", type(amount))
    try:
        print("Converting amount:", amount)
        # Convert amount to float if it's a string or number
        if amount is None:
            return jsonify({"status": "Failed", "message": "Amount is missing from request"}), 400

        try:
            amount = float(amount)
        except (ValueError, TypeError) as e:
            print(f"Error converting amount to float: {e}")
            return jsonify({"status": "Failed", "message": f"Could not convert amount to number: {e}"}), 400

        # Check if amount is valid
        if amount <= 0:
            return jsonify({"status": "Failed", "message": "Invalid amount. Must be a positive number."}), 400
        elif amount < 10:
            return jsonify({"status": "Failed", "message": "Salary amount must be at least $10"}), 400
        elif amount > 1000000:
            return jsonify({"status": "Failed", "message": "Salary amount must be less than $1,000,000"}), 400
    except (ValueError, TypeError) as e:
        print(f"Error converting amount: {e}")
        return jsonify({"status": "Failed", "message": "Invalid amount. Must be a positive number."}), 400

    date = req.get("date", datetime.now().strftime("%Y-%m-%d"))

    # Simulate adding salary
    try:
        current_balance = mock_data["accountData"]["balance"]
        mock_data["accountData"]["balance"] += float(amount)
        # Simple trend calculation for demo
        mock_data["accountData"]["percentChange"] = round(((mock_data["accountData"]["balance"] / current_balance) - 1) * 100, 1) if current_balance else 100
        mock_data["accountData"]["trendType"] = "up" if mock_data["accountData"]["balance"] >= current_balance else "down"

        mock_data["budgetSuggestionData"]["salary"] = float(amount)
        mock_data["budgetSuggestionData"]["salaryDate"] = date
        salary = float(amount)
        mock_data["budgetSuggestionData"]["needs"] = round(salary * 0.5, 2)
        mock_data["budgetSuggestionData"]["wants"] = round(salary * 0.3, 2)
        mock_data["budgetSuggestionData"]["savings"] = round(salary * 0.2, 2)
        mock_data["hasSalary"] = True
        mock_data["hasAccountBalance"] = True

        # Update goal progress based on new account balance
        if mock_data["hasGoal"] and mock_data["goalData"]:
            # First, remove the isNew flag from all goals
            for goal in mock_data["goalData"]:
                if "isNew" in goal:
                    goal["isNew"] = False

            # Calculate goal progress based on new account balance
            updated_goals = calculate_goal_progress(mock_data["goalData"], mock_data["accountData"]["balance"])
            # Update goal data in mock_data
            mock_data["goalData"] = updated_goals
            print("Updated goal progress after adding salary:", updated_goals)

        return jsonify({
            "status": "Success",
            "message": "Salary added successfully!",
            "new_balance": mock_data["accountData"]["balance"],
            "budgetSuggestions": mock_data["budgetSuggestionData"],
            "goalData": mock_data["goalData"] if mock_data["hasGoal"] else [],
            "transaction": mock_data["transaction"][:5]  # Include latest transactions
        })
    except Exception as e:
         print(f"Error adding salary: {e}")
         return jsonify({"status": "Failed", "message": f"Server error processing salary: {str(e)}"}), 500

# New route - support frontend call to /dashboard/addSalary
@app.route("/dashboard/addSalary", methods=["POST"])
def dashboard_add_salary():
    # Ensure user_id exists in session
    if 'user_id' not in session:
        session['user_id'] = 1

    # Call the original add_salary function implementation
    return add_salary()

# New route - support frontend call to /expense/addSalary
@app.route("/expense/addSalary", methods=["POST"])
def expense_add_salary():
    # Ensure user_id exists in session
    if 'user_id' not in session:
        session['user_id'] = 1

    # Call the original add_salary function implementation
    return add_salary()

# New route - support frontend call to /expense/addExpense
@app.route("/expense/addExpense", methods=["POST"])
def expense_add_expense():
    # Ensure user_id exists in session
    if 'user_id' not in session:
        session['user_id'] = 1

    # Call the original add_expense function implementation
    return dashboard_add_expense()

@app.route("/dashboard/addExpense", methods=["POST"])
def dashboard_add_expense():
    # Ensure user_id exists in session
    if 'user_id' not in session:
        session['user_id'] = 1

    if 'username' not in session:
        return jsonify({"status": "Failed", "message": "User not logged in"}), 401

    req = request.get_json()

    # Get amount and try to convert to float
    amount = req.get("amount")
    category = req.get("category", "Goal Redemption")  # Default category for goal redemptions
    goal_name = req.get("goalName", "")  # Get goal name if provided

    try:
        # Convert amount to float if it's a string or number
        amount = float(amount) if amount is not None else None

        # Check if amount is valid
        if amount is None or amount <= 0:
            return jsonify({"status": "Failed", "message": "Invalid amount. Must be a positive number."}), 400
    except (ValueError, TypeError) as e:
        print(f"Error converting amount: {e}")
        return jsonify({"status": "Failed", "message": "Invalid amount. Must be a positive number."}), 400

    date = req.get("date", datetime.now().strftime("%Y-%m-%d"))

    # Create a new transaction for the redeemed goal
    try:
        # Use the category passed from the frontend
        transaction_category = category
        # If it's a goal redemption but no specific category was provided, use a default format
        if goal_name and category == "Goal Redemption":
            transaction_category = f"Goal: {goal_name}"

        # Add the new transaction to the beginning of the list
        new_transaction = {
            "category": transaction_category,
            "amount": amount,
            "date": date
        }

        mock_data["transaction"].insert(0, new_transaction)
        mock_data["hasExpense"] = True  # Set hasExpense to True when adding an expense

        # Update monthly expenses data
        # Find the current month (0-based index)
        current_month = datetime.now().month - 1  # Convert to 0-based index

        # Update the monthly expense for the current month
        if "monthlySpendData" in mock_data and "Expenses" in mock_data["monthlySpendData"]:
            # Add the new expense amount to the current month's total
            mock_data["monthlySpendData"]["Expenses"][current_month] += amount
            print(f"Updated monthly expenses for month {current_month + 1} to {mock_data['monthlySpendData']['Expenses'][current_month]}")

        # If this is a goal redemption, update the account balance
        if goal_name:
            # Decrease account balance by the redeemed amount
            mock_data["accountData"]["balance"] -= amount

            # Update trend calculation
            current_balance = mock_data["accountData"]["balance"]
            mock_data["accountData"]["trendType"] = "down"
            mock_data["accountData"]["percentChange"] = -1 * amount / (current_balance + amount) * 100

            # Find and remove the completed goal
            for i, goal in enumerate(mock_data["goalData"]):
                if goal["goalName"] == goal_name:
                    mock_data["goalData"].pop(i)
                    break

            # If no goals left, update hasGoal flag
            if not mock_data["goalData"]:
                mock_data["hasGoal"] = False

        # Get latest transactions for UI update
        latest_transactions = mock_data["transaction"][:5] if mock_data.get("transaction") else []

        return jsonify({
            "status": "Success",
            "message": f"{'Goal redeemed' if goal_name else 'Expense added'} successfully!",
            "transaction": new_transaction,
            "new_balance": mock_data["accountData"]["balance"],
            "goalData": mock_data.get("goalData", []),
            "hasGoal": mock_data.get("hasGoal", False),
            "accountData": mock_data["accountData"],
            "latest_transactions": latest_transactions,
            "monthlyExpenses": mock_data["monthlySpendData"]["Expenses"]  # Include updated monthly expenses
        })
    except Exception as e:
        print(f"Error adding expense: {e}")
        return jsonify({"status": "Failed", "message": f"Server error processing expense: {str(e)}"}), 500

@app.route("/dashboard/addGoal", methods=["POST"])
def add_goal():
    if 'username' not in session:
         return jsonify({"status": "Failed", "message": "User not logged in"}), 401

    # Ensure user_id exists in session
    if 'user_id' not in session:
        session['user_id'] = 1

    req = request.get_json()
    goal_name = req.get("goalName")
    target_amount = req.get("targetAmount")
    time_duration = req.get("timeDuration") # For message calculation
    allocation = req.get("allocation", 0) # Get allocation percentage, default to 0 if not provided

    if not goal_name or not isinstance(target_amount, (int, float)) or target_amount <= 0:
         return jsonify({"status": "Failed", "message": "Invalid goal details"}), 400

    # Validate allocation
    try:
        allocation = float(allocation)
        if allocation < 0 or allocation > 100:
            return jsonify({"status": "Failed", "message": "Allocation must be between 0 and 100%"}), 400

        # Calculate total allocation of existing goals
        total_allocation = 0
        for goal in mock_data["goalData"]:
            if "allocation" in goal:
                total_allocation += float(goal["allocation"])

        # Check if adding this goal would exceed 100%
        if total_allocation + allocation > 100:
            return jsonify({
                "status": "Failed",
                "message": f"Total allocation would exceed 100%. Current total: {total_allocation}%. Maximum available: {100 - total_allocation}%"
            }), 400
    except (ValueError, TypeError):
        return jsonify({"status": "Failed", "message": "Invalid allocation value"}), 400

    try:
        goal = {
            "goalName": goal_name,
            "message": f"Save at least ${target_amount / max(1, time_duration if time_duration else 1):.2f} per month to reach your goal!",
            "progressPercentage": 0.0,  # Always start at 0%
            "remaining": float(target_amount),
            "saved": 0.0,  # Always start with 0 saved
            "target": float(target_amount),
            "allocation": allocation,  # Add allocation to the goal data
            "isNew": True  # Mark as a new goal to prevent automatic progress calculation
        }
        mock_data["goalData"].insert(0, goal)  # Insert at front so newest goal appears first
        mock_data["hasGoal"] = True

        # Return more comprehensive data for UI updates
        return jsonify({
            "status": "Success",
            "message": "Goal added!",
            "data": mock_data["goalData"],
            "goalData": mock_data["goalData"],  # Add explicit goalData field for consistency
            "accountData": mock_data["accountData"],
            "hasAccountBalance": mock_data["hasAccountBalance"],
            "hasGoal": mock_data["hasGoal"],
            "transaction": mock_data["transaction"][:5] if mock_data.get("transaction") else []
        })
    except Exception as e:
         print(f"Error adding goal: {e}")
         return jsonify({"status": "Failed", "message": "Server error processing goal"}), 500



# Simulate logout
@app.route('/logout')
def logout():
    session.pop('username', None)
    session.pop('first_name', None)
    session.pop('last_name', None)
    # In a real app, redirect to a login page
    return "Logged out (simulation)"

# Serve static files (if needed, though often handled by web server in production)
@app.route('/static/<path:filename>')
def static_files(filename):
    return send_from_directory('static', filename)

# API endpoint to get goals data
@app.route('/dashboard/getGoals')
def get_goals():
    """
    Return the current goals data from mock_data.
    """
    if 'username' not in session:
        return jsonify({"status": "Failed", "message": "User not authenticated"}), 401

    # Ensure user_id exists in session
    if 'user_id' not in session:
        session['user_id'] = 1

    # Return the current goals data
    return jsonify({
        "status": "Success",
        "data": mock_data.get("goalData", [])
    })

# API endpoint to get account data
@app.route('/dashboard/getAccountData')
def get_account_data():
    """
    Return the current account data from mock_data.
    """
    if 'username' not in session:
        return jsonify({"status": "Failed", "message": "User not authenticated"}), 401

    # Ensure user_id exists in session
    if 'user_id' not in session:
        session['user_id'] = 1

    # Return the current account data
    return jsonify({
        "status": "Success",
        "data": {
            "accountData": mock_data.get("accountData", {}),
            "hasAccountBalance": mock_data.get("hasAccountBalance", False)
        }
    })



# API endpoint to get latest transactions
@app.route('/dashboard/getLatestTransactions')
def get_latest_transactions():
    """
    Return the latest transactions from mock_data.
    Also includes monthlyExpenses data for updating the share button state.
    """
    if 'username' not in session:
        return jsonify({"status": "Failed", "message": "User not authenticated"}), 401

    # Ensure user_id exists in session
    if 'user_id' not in session:
        session['user_id'] = 1

    # Return the latest transactions and monthly expenses data
    return jsonify({
        "status": "Success",
        "data": mock_data.get("transaction", [])[:5],  # Return only the 5 most recent transactions
        "monthlyExpenses": mock_data.get("monthlySpendData", {}).get("Expenses", [0] * 12),  # Include monthly expenses data
        "hasExpense": mock_data.get("hasExpense", False)  # Include hasExpense flag
    })

# Mock API for "Shared with Me" functionality
@app.route('/dashboard/getUnreadReportCount')
def get_unread_report_count():
    """
    Return the current unread report count from mock_data. Requires authentication.
    """
    if 'username' not in session:
        return jsonify({"status": "Failed", "message": "User not authenticated"}), 401

    # Ensure user_id exists in session
    if 'user_id' not in session:
        session['user_id'] = 1

    # Return the current mock unread report count
    count = mock_data.get('reportCount', 0)
    return jsonify({
        "status": "Success",
        "reportCount": count,
        "statusCode": 200
    })

@app.route('/dashboard/getUnreadReportIds')
def get_unread_report_ids():
    """
    Return the list of unread report IDs from mock_data. Requires authentication.
    """
    if 'username' not in session:
        return jsonify({"status": "Failed", "message": "User not authenticated"}), 401

    # Ensure user_id exists in session
    if 'user_id' not in session:
        session['user_id'] = 1

    # Return list of unread report IDs
    unread_ids = mock_data.get('unreadReportIds', [])
    return jsonify({
        "status": "Success",
        "unreadReportIds": unread_ids,
        "statusCode": 200
    })

@app.route('/dashboard/markReportAsRead', methods=['POST'])
def mark_report_as_read():
    """
    Mark a shared report as read by removing it from unreadReportIds and updating the count.
    """
    if 'username' not in session:
        return jsonify({"status": "Error", "statusCode": 401, "message": "User not authenticated"}), 401

    # Ensure user_id exists in session
    if 'user_id' not in session:
        session['user_id'] = 1

    data = request.get_json() or {}
    report_id = data.get('reportId')
    if report_id is None:
        return jsonify({"status": "Error", "statusCode": 400, "message": "Missing reportId"}), 400

    # Remove report ID from unread list
    unread_ids = mock_data.get('unreadReportIds', [])
    if report_id in unread_ids:
        unread_ids.remove(report_id)
        mock_data['unreadReportIds'] = unread_ids
        # Update unread count
        mock_data['reportCount'] = len(unread_ids)

    return jsonify({
        "status": "Success",
        "reportCount": mock_data['reportCount'],
        "statusCode": 200
    })

@app.route('/dashboard/getSenderDetails')
def get_sender_details():
    if 'username' not in session:
        return jsonify({"status": "Failed", "message": "User not authenticated"}), 401

    # Ensure user_id exists in session
    if 'user_id' not in session:
        session['user_id'] = 1

    # Mock sender details data with unique reportId for each shared report
    return jsonify({
        "data": [
            {
                "senderFirstName": "Alwyn",
                "senderID": 1,
                "senderLastName": "S",
                "sharedDate": "2025-05-02 16:47:23",
                "reportId": "report_1"  # Unique identifier for this specific shared report
            },
            {
                "senderFirstName": "Alwyn2",
                "senderID": 2,
                "senderLastName": "S",
                "sharedDate": "2025-05-02 16:47:23",
                "reportId": "report_2"  # Unique identifier for this specific shared report
            }
        ],
        "status": "Success",
        "statusCode": 200
    })

@app.route('/dashboard/getReport', methods=["POST"])
def get_report():
    if 'username' not in session:
        return jsonify({"status": "Failed", "message": "User not authenticated"}), 401

    # Ensure user_id exists in session
    if 'user_id' not in session:
        session['user_id'] = 1

    req = request.get_json()
    userID = req.get("userID")  # Use parameter name consistent with app.py
    date = req.get("date")       # Use parameter name consistent with app.py

    if not userID:
        return jsonify({"status": "Failed", "message": "Missing userID parameter"}), 400

    if int(userID) == 1:
        # For dashboardData, use a copy of the main mock_data and adjust monthlySpendData
        # This ensures other parts of mock_data (like accountData.percentChange) are consistent
        # with what we set for the main dashboard view.

        temp_dashboard_data = {
            key: value for key, value in mock_data.items() if key not in ['username', 'reportCount']
        } # Create a new dict from mock_data, excluding non-data like username/reportCount

        # Specifically adjust monthlySpendData to be a direct array as per "Data Sent to the report Page" spec
        if 'monthlySpendData' in temp_dashboard_data and isinstance(temp_dashboard_data['monthlySpendData'], dict) and 'Expenses' in temp_dashboard_data['monthlySpendData']:
            temp_dashboard_data['monthlySpendData'] = temp_dashboard_data['monthlySpendData']['Expenses']
        else:
            # Fallback or if it's already an array (though our main mock_data makes it a dict)
             temp_dashboard_data['monthlySpendData'] = [0, 500.5, 100.5, 200.5, 1001.0, 0, 0, 0, 0, 0, 0, 0]


        # Example structure for dashboardData based on spec (filled from our modified temp_dashboard_data)
        report_dashboard_data = {
            "hasAccountBalance": temp_dashboard_data.get("hasAccountBalance", True),
            "accountData": temp_dashboard_data.get("accountData", {"balance": 1997.5, "trendType": "down", "percentChange": -20.04}),
            "hasGoal": temp_dashboard_data.get("hasGoal", True),
            "goalData": temp_dashboard_data.get("goalData", []),
            "hasExpense": temp_dashboard_data.get("hasExpense", True),
            "monthlySpendData": temp_dashboard_data.get("monthlySpendData"), # This is now the direct array
            "transaction": temp_dashboard_data.get("transaction", []),
            "budgetSuggestionData": temp_dashboard_data.get("budgetSuggestionData", {}),
            "hasSalary": temp_dashboard_data.get("hasSalary", True)
        }


        return jsonify({
            "data": {
                "senderInfo": {
                    "firstName": "Alwyn",
                    "lastName": "S"
                },
                "dashboardData": report_dashboard_data
            },
            "status": "Success",
            "statusCode": 200
        })
    elif int(userID) == 2:
        # Generate expense_data according to the new spec for "Data Sent to the report Page"
        expense_report_data_spec = {
            "hasSalary": True,
            "expenseAndSalary": {
                "salaryData": [0, 0, 0, 2000.0, 1800.0, 0, 0, 0, 0, 0, 0, 0],
                "expenseData": [0, 500.5, 100.5, 200.5, 1001.0, 0, 0, 0, 0, 0, 0, 0]
            },
            "hasExpense": True,
            "weeklyExpense": {
                "2025-04-14": 200.5,
                "2025-03-17": 100.5,
                "2025-05-19": 1001.0
            },
            "monthlyCategoryExpenses": {
                "April": {"Groceries": 150.0, "Bills": 50.5, "total": 200.5},
                "March": {"Groceries": 70.0, "Food": 30.5, "total": 100.5},
                "May": {"Groceries": 800.0, "Shopping": 201.0, "total": 1001.0}
            }
        }

        return jsonify({
            "data": {
                "senderInfo": {
                    "firstName": "Alwyn2",
                    "lastName": "S"
                },
                "expenseData": expense_report_data_spec
            },
            "status": "Success",
            "statusCode": 200
        })
    else:
        return jsonify({"status": "Failed", "message": "Report not found for this userID"}), 404

# Support GET request for getReport route
@app.route('/dashboard/getReport', methods=["GET"])
def get_report_get():
    if 'username' not in session:
        return jsonify({"status": "Failed", "message": "User not authenticated"}), 401

    # Ensure user_id exists in session
    if 'user_id' not in session:
        session['user_id'] = 1

    # Process GET request
    data = request.args

    if not data:
        return jsonify({"status": "Failed", "message": "No data received"}), 400

    userID = data.get("userID")  # Use parameter name consistent with app.py

    if not userID:
        return jsonify({"status": "Failed", "message": "Missing userID parameter"}), 400

    # If client accepts HTML, render template
    if "text/html" in request.headers.get("Accept", ""):
        # Get report data based on userID
        if int(userID) == 1:
            # Use the same logic as POST request to get dashboard data
            temp_dashboard_data = {
                key: value for key, value in mock_data.items() if key not in ['username', 'reportCount']
            }

            if 'monthlySpendData' in temp_dashboard_data and isinstance(temp_dashboard_data['monthlySpendData'], dict) and 'Expenses' in temp_dashboard_data['monthlySpendData']:
                temp_dashboard_data['monthlySpendData'] = temp_dashboard_data['monthlySpendData']['Expenses']
            else:
                temp_dashboard_data['monthlySpendData'] = [0, 500.5, 100.5, 200.5, 1001.0, 0, 0, 0, 0, 0, 0, 0]

            report_dashboard_data = {
                "hasAccountBalance": temp_dashboard_data.get("hasAccountBalance", True),
                "accountData": temp_dashboard_data.get("accountData", {"balance": 1997.5, "trendType": "down", "percentChange": -20.04}),
                "hasGoal": temp_dashboard_data.get("hasGoal", True),
                "goalData": temp_dashboard_data.get("goalData", []),
                "hasExpense": temp_dashboard_data.get("hasExpense", True),
                "monthlySpendData": temp_dashboard_data.get("monthlySpendData"),
                "transaction": temp_dashboard_data.get("transaction", []),
                "budgetSuggestionData": temp_dashboard_data.get("budgetSuggestionData", {}),
                "hasSalary": temp_dashboard_data.get("hasSalary", True)
            }

            template_data = report_dashboard_data
        elif int(userID) == 2:
            # Use the same logic as POST request to get expense data
            expense_report_data_spec = {
                "hasSalary": True,
                "expenseAndSalary": {
                    "salaryData": [0, 0, 0, 2000.0, 1800.0, 0, 0, 0, 0, 0, 0, 0],
                    "expenseData": [0, 500.5, 100.5, 200.5, 1001.0, 0, 0, 0, 0, 0, 0, 0]
                },
                "hasExpense": True,
                "weeklyExpense": {
                    "2025-04-14": 200.5,
                    "2025-03-17": 100.5,
                    "2025-05-19": 1001.0
                },
                "monthlyCategoryExpenses": {
                    "April": {"Groceries": 150.0, "Bills": 50.5, "total": 200.5},
                    "March": {"Groceries": 70.0, "Food": 30.5, "total": 100.5},
                    "May": {"Groceries": 800.0, "Shopping": 201.0, "total": 1001.0}
                }
            }

            template_data = expense_report_data_spec
        else:
            return jsonify({"status": "Failed", "message": "Report not found for this userID"}), 404

        return render_template("report.html", data=template_data, current_user={'id': session.get('user_id', 1)})

    # Otherwise return JSON response
    return get_report()

@app.route('/dashboard/getUsernamesAndIDs', methods=['GET'])
def get_usernames_and_ids():
    # This is a mock implementation based on your HLD.
    # In a real application, you would query your database.
    # Also, ensure the current user (sender) is not listed or handled appropriately.

    # Ensure user_id exists in session
    if 'user_id' not in session:
        session['user_id'] = 1

    query = request.args.get('query', '').lower()

    # Mock user data - replace with your actual user data source
    all_users = [
        {'userID': 2, 'username': 'user@example.com', 'firstName': 'John', 'lastName': 'Doe'},
        {'userID': 3, 'username': 'user2@example.com', 'firstName': 'Jane', 'lastName': 'Smith'},
        {'userID': 4, 'username': 'test@example.com', 'firstName': 'Test', 'lastName': 'User'},
        # Add more users as needed for testing
    ]

    # Filter users based on the query (simple name/email check)
    # You might want to make this more sophisticated
    filtered_users = [
        user for user in all_users
        if query in user['username'].lower() or \
           query in user['firstName'].lower() or \
           query in user['lastName'].lower()
    ]

    # Simulate that the current user (e.g., userID 1 if that's your mock sender)
    # shouldn't be in the list of users to share with.
    # You'll need a way to get the actual current user's ID here.
    # For now, let's assume current_user_id is 1 for this mock.
    # current_user_id_from_session = session.get('user_id') # Example if you store user_id in session

    # filtered_users_excluding_sender = [u for u in filtered_users if u['userID'] != current_user_id_from_session]


    return jsonify({
        'status': 'Success',
        'statusCode': 200,
        'data': filtered_users # or filtered_users_excluding_sender
    })



@app.route('/dashboard/sentReport', methods=['POST'])
def share_report():
    if 'username' not in session: # Or however you check for logged-in user
        return jsonify({'status': 'Failed', 'statusCode': 401, 'message': 'User not authenticated'}), 401

    # Ensure user_id exists in session
    if 'user_id' not in session:
        session['user_id'] = 1

    data = request.get_json()
    recipient_id = data.get('recipientID')

    # Use session user_id as sender_id instead of getting it from the request
    sender_id = session.get('user_id', 1)

    if not recipient_id:
        return jsonify({'status': 'Failed', 'statusCode': 400, 'message': 'Missing data: recipientID is required.'}), 400

    # For testing purposes, print the received data
    print(f"Received shareReport request:")
    print(f"  Sender ID: {sender_id} (from session)")
    print(f"  Recipient ID: {recipient_id}")

    # Generate a unique report ID - using timestamp and random string for simplicity
    timestamp = int(time.time())
    random_str = ''.join(random.choices(string.ascii_letters + string.digits, k=6))
    report_id = f"report_{timestamp}_{random_str}"

    # --- Simulate storing report data in database ---
    # In a real application, we would:
    # 1. Store the report sharing information in the database.
    # 2. Update recipient's notification/report count.

    # For testing: Update the mock_data to simulate a recipient receiving a new report
    # Add the new report ID to the unread reports list
    if 'unreadReportIds' in mock_data:
        mock_data['unreadReportIds'].append(report_id)
        mock_data['reportCount'] = len(mock_data['unreadReportIds'])

    # Simulate successful sharing
    return jsonify({
        'status': 'Success',
        'statusCode': 200,
        'reportId': report_id,  # Return the generated report ID to the client
        'message': f'Report shared successfully from sender {sender_id} to recipient {recipient_id}.'
    })

if __name__ == "__main__":
    # Use debug=False for production simulation if desired
    # Use debug=True for development to get auto-reloading and error pages
    app.run(debug=True, port=5004)

