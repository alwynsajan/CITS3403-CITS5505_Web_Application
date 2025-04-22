from flask import Flask, render_template, request, jsonify

app = Flask(__name__)

# Sample data to simulate database
# 修改初始数据，将所有标志设为True
sample_data = {
    "hasAccountBlance": True,
    "hasGoal": True,
    "hasExpense": True,
    "hasSalary": True,
    "balance": 1500.75,
    "balance_change": 2.5,
    "goal_name": "New Laptop",
    "goal_progress": 65,
    "goal_target": 1200,
    "goal_saved": 780,
    "needs_amount": 750,
    "wants_amount": 450,
    "savings_amount": 300,
    "monthly_spending": [550, 620, 480, 700, 520, 590]
}

@app.route('/')
def dashboard():
    return render_template('dashboard.html', data=sample_data)

@app.route('/expenses')
def expenses():
    return render_template('expenses.html')

@app.route('/settings')
def settings():
    return "<h1>Settings Page Coming Soon</h1>"

@app.route('/addGoal', methods=['POST'])
def add_goal():
    # Get form data
    goal_name = request.form.get('goal_name')
    target_amount = request.form.get('target_amount')
    time_duration = request.form.get('time_duration')
    duration_value = request.form.get('duration_value')
    income_frequency = request.form.get('income_frequency')
    income_amount = request.form.get('income_amount')
    allocation = request.form.get('allocation')
    
    # Validate data (basic validation)
    if not goal_name or not target_amount or not income_amount or not allocation:
        return jsonify({
            "status": "error",
            "message": "All fields are required"
        })
    
    try:
        # Convert string values to appropriate types
        target_amount = float(target_amount)
        income_amount = float(income_amount)
        allocation = float(allocation)
        
        # Check for valid ranges
        if target_amount <= 0 or income_amount <= 0 or allocation <= 0 or allocation > 100:
            return jsonify({
                "status": "error",
                "message": "Please enter valid positive values. Allocation must be between 1 and 100."
            })
            
        # In a real application, here you would save the data to a database
        # For now, we'll just update our sample data
        global sample_data
        sample_data["hasGoal"] = True
        
        # Simulate initial progress (this would come from real calculations in a full app)
        initial_saved = target_amount * 0.1  # 10% progress as an example
        progress = round((initial_saved / target_amount) * 100)
        
        # Prepare response data
        goal_data = {
            "name": goal_name,
            "target": target_amount,
            "saved": initial_saved,
            "progress": progress
        }
        
        # Return success response with goal data
        return jsonify({
            "status": "success",
            "message": "Goal added successfully!",
            "goal": goal_data
        })
        
    except ValueError:
        return jsonify({
            "status": "error",
            "message": "Please enter valid numeric values"
        })
    except Exception as e:
        return jsonify({
            "status": "error",
            "message": f"An error occurred: {str(e)}"
        })

if __name__ == '__main__':
    app.run(debug=True)