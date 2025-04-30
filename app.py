import os
from flask import Flask, render_template, request, jsonify, send_from_directory, session, redirect, url_for
from datetime import datetime

app = Flask(__name__)

# 模拟数据
mock_data = {
    "accountData": {
        "balance": 950.0,
        "percentChange": -5.0,
        "trendType": "down"
    },
    "budgetSuggestionData": {
        "needs": 500.0,
        "salary": 1000.0,
        "salaryDate": "2025-04-25",
        "savings": 200.0,
        "wants": 300.0
    },
    "goalData": [
        {
            "goalName": "Laptop",
            "message": "Save at least $750.00 per month to reach your goal!",
            "progressPercentage": 12.67,
            "remaining": 2620.0,
            "saved": 380.0,
            "target": 3000.0
        }
    ],
    "hasAccountBalance": True,
    "hasExpense": True,
    "hasGoal": True,
    "hasSalary": True,
    "monthlySpendData": [0, 0, 0, 50.0, 0, 0, 0, 0, 0, 0, 0, 0],
    "username": "Ashley"
}

@app.route("/")
def index():
    return render_template("dashboard.html", data=mock_data)

@app.route("/dashboard")
def dashboard():
    return render_template("dashboard.html", data=mock_data)

@app.route("/add_salary", methods=["POST"])
def add_salary():
    req = request.get_json()
    amount = req.get("amount", 0)
    date = req.get("date", datetime.now().strftime("%Y-%m-%d"))
    # 简单模拟：加到余额
    mock_data["accountData"]["balance"] += float(amount)
    mock_data["budgetSuggestionData"]["salary"] = float(amount)
    mock_data["budgetSuggestionData"]["salaryDate"] = date
    # 简单预算建议
    salary = float(amount)
    mock_data["budgetSuggestionData"]["needs"] = round(salary * 0.5, 2)
    mock_data["budgetSuggestionData"]["wants"] = round(salary * 0.3, 2)
    mock_data["budgetSuggestionData"]["savings"] = round(salary * 0.2, 2)
    return jsonify({
        "new_balance": mock_data["accountData"]["balance"],
        "budgetSuggestions": mock_data["budgetSuggestionData"]
    })

@app.route("/dashboard/addGoal", methods=["POST"])
def add_goal():
    req = request.get_json()
    goal = {
        "goalName": req.get("goalName", "New Goal"),
        "message": f"Save at least ${req.get('targetAmount', 0)/max(1, req.get('timeDuration', 1)):.2f} per month to reach your goal!",
        "progressPercentage": 0.0,
        "remaining": req.get("targetAmount", 0),
        "saved": 0.0,
        "target": req.get("targetAmount", 0)
    }
    mock_data["goalData"].append(goal)
    return jsonify({"data": mock_data["goalData"]})

@app.route('/static/<path:filename>')
def static_files(filename):
    return send_from_directory('static', filename)

@app.route('/logout')
def logout():
    session.clear()
    return redirect(url_for('login'))

if __name__ == "__main__":
    app.run(debug=True) 