from flask import Flask, render_template, jsonify, request, redirect, url_for
import os
import json
import datetime

app = Flask(__name__)

# Sample data matching the actual backend structure
sample_data = {
    "accountData": {
        "balance": 4975.0,
        "percentChange": -0.5,
        "trendType": "down"
    },
    "budgetSuggestionData": {
        "needs": 2500.0,
        "salary": 5000.0,
        "salaryDate": "2025-04-25",
        "savings": 1000.0,
        "wants": 1500.0
    },
    "goalData": [
        {
            "goalName": "iphone",
            "message": "Save at least $500.00 per month to reach your goal!",
            "progressPercentage": 99.5,
            "remaining": 10.0,
            "saved": 1990.0,
            "target": 2000.0
        },
        {
            "goalName": "Laptop",
            "message": "Save at least $750.00 per month to reach your goal!",
            "progressPercentage": 66.33,
            "remaining": 1010.0,
            "saved": 1990.0,
            "target": 3000.0
        }
    ],
    "hasAccountBlance": True,
    "hasExpense": True,
    "hasGoal": True,
    "hasSalary": True,
    "monthlySpendData": [
        0, 0, 0, 25.0, 0, 0, 0, 0, 0, 0, 0, 0
    ]
}

# Prepare monthly data with month labels
def prepare_monthly_data():
    """
    Prepare the monthly spending data for display in the chart.
    Transforms raw monthly spending data into a format usable by Chart.js.
    """
    # Create month labels
    month_names = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"]
    
    # Get expenses data
    monthly_expenses = sample_data["monthlySpendData"]
    
    # Add some sample data to make the chart more interesting for demo purposes
    if all(expense == 0 for expense in monthly_expenses) or sum(monthly_expenses) < 100:
        # If all values are 0 or sum is too small, add some sample data
        monthly_expenses = [450, 610, 480, 700, 520, 590, 430, 510, 605, 490, 550, 580]
    
    return {
        'labels': json.dumps(month_names),
        'expenses': json.dumps(monthly_expenses)
    }

# Routes
@app.route('/')
def index():
    """Redirect to dashboard page"""
    return redirect(url_for('dashboard'))

@app.route('/dashboard')
def dashboard():
    """Render the dashboard page with all necessary data"""
    # Prepare monthly data
    monthly_data = prepare_monthly_data()
    
    # Prepare goal data (if it exists)
    has_multiple_goals = False
    if sample_data.get("hasGoal") and sample_data.get("goalData"):
        has_multiple_goals = len(sample_data["goalData"]) > 1
    
    # Copy data and add additional flags
    data = sample_data.copy()
    data["hasMultipleGoals"] = has_multiple_goals
    data["hasAccountBalance"] = data.get("hasAccountBlance", False)  # Fix spelling error
    
    # If we have only one goal, make it available as singleGoalData
    if data.get("hasGoal") and len(data.get("goalData", [])) > 0:
        data["singleGoalData"] = data["goalData"][0]
    
    # JSON for multiple goals
    goals_json = json.dumps(data.get("goalData", []))
    
    return render_template('dashboard.html', data=data, monthly_data=monthly_data, goals_json=goals_json)

@app.route('/expenses')
def expenses():
    """Placeholder for expenses page"""
    return "Expenses page coming soon!"

@app.route('/settings')
def settings():
    """Placeholder for settings page"""
    return "Settings page coming soon!"

# API endpoints
@app.route('/dashboard/addGoal', methods=['POST'])
def add_goal():
    """Handle adding a new goal"""
    if request.method == 'POST':
        try:
            # Get data from request
            if request.is_json:
                goal_data = request.get_json()
            else:
                # Handle form data
                goal_data = {
                    'goalName': request.form.get('goalName'),
                    'targetAmount': float(request.form.get('targetAmount', 0)),
                    'timeDuration': int(request.form.get('timeDuration', 1)),
                    'allocation': int(request.form.get('allocation', 10))
                }
            
            print("Received goal data:", goal_data)
            
            # Calculate values
            target = float(goal_data.get('targetAmount', 1000))
            time_duration = int(goal_data.get('timeDuration', 3))
            saved = target * 0.1  # Initial progress (10%)
            remaining = target - saved
            monthly_save = remaining / time_duration
            
            # Create new goal object
            new_goal = {
                "goalName": goal_data.get('goalName', 'New Goal'),
                "progressPercentage": 10,
                "target": target,
                "saved": saved,
                "remaining": remaining,
                "message": f"Save at least ${monthly_save:.2f} per month to reach your goal!"
            }
            
            # Add to existing goals (in a real app, this would be saved to a database)
            if "goalData" not in sample_data:
                sample_data["goalData"] = []
            
            sample_data["goalData"].append(new_goal)
            sample_data["hasGoal"] = True
            
            # Return all goals for UI update
            return jsonify({
                "status": "success",
                "message": "Goal added successfully!",
                "data": sample_data["goalData"]
            })
        except Exception as e:
            print(f"Error processing goal: {str(e)}")
            return jsonify({
                "status": "error",
                "message": f"Failed to process goal: {str(e)}"
            }), 400

@app.route('/dashboard/export/<format>')
def export_data(format):
    """Handle data export in different formats"""
    if format == 'csv':
        return "CSV export functionality would be implemented here."
    elif format == 'pdf':
        return "PDF export functionality would be implemented here."
    else:
        return "Invalid export format."

if __name__ == '__main__':
    app.run(debug=True)