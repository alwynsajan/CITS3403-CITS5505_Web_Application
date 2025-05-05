<<<<<<< HEAD
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
=======
from flask import Flask, render_template, request, redirect, url_for, session,jsonify
from datetime import timedelta
from dbClient import dbClient
from models import db

app = Flask(__name__)
# Secret key for encrypting session data
app.secret_key = 'C1TS3403_C1T5S0S_Gr0UP_4!'

# Set session lifetime to 7 days
app.permanent_session_lifetime = timedelta(days=7)

# Database config to use 'Analyser' as the database name
app.config['SQLALCHEMY_DATABASE_URI'] = 'sqlite:///Analyzer.db'
app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False

# Initialize the database with the app
db.init_app(app)
with app.app_context():
    db.create_all()  # Creates tables if they don't exist

# Initialize the database client to interact with the database
DBClient = dbClient(db)

# Home route
# This ensures both `/` and `/login` go to the login page
@app.route('/')
@app.route('/login')
def loginPage():
    # If the user is already logged in, redirect them to the dashboard
    if 'username' in session:
        return redirect(url_for('dashboard'))
    # Otherwise, show the login page

    #To show login failed msg in Login page.
    data= {"check" : True}
    return render_template('login.html',data = data)

@app.route('/login', methods=['POST'])
def login():
        
        # Get the username and password from the login form
        username = request.form['username']
        password = request.form['password']

        # Check if the credentials are valid
        user_id = DBClient.checkCredentials(username, password)
        
        # If user_id is returned, credentials are valid
        if user_id:  
            session.permanent = True
            session['username'] = username

            return redirect(url_for('dashboard'))
        else:
            # If the credentials are invalid, show an error message in login page.
            data= { "check" : False }
            return render_template('login.html',data = data)


@app.route('/dashboard')
def dashboard():

    # Check if the user is logged in by verifying if the username exists in the session
    if 'username' in session:
        # Access the username and user role from the session
        username = session['username']

        #Fetch user data from DB!! Need to edit this part later.
        data= {}

        # Render the dashboard template, passing the username and user role as variables
        return render_template('dashboard.html', username=username, data=data)
    
    # If the user is not logged in, redirect to the login page
    return redirect(url_for('loginPage'))

@app.route('/logout')
def logout():

    # Remove user data from the session when logging out
    session.pop('username', None)

    data= {"check" : True}
    return render_template('login.html',data = data)

@app.route('/addUser', methods=['POST'])
def add_user():
    data = request.get_json()
    
    # Validate required fields
    if not all(field in data for field in ['username', 'password', 'firstName', 'lastName']):
        return jsonify({"error": "Missing required fields"}), 400
    
    # Validate password strength (customize as needed)
    if len(data['password']) < 8:
        return jsonify({"error": "Password must be at least 8 characters"}), 400
    
    try:
        user_id = dbClient.addUser(
            username=data['username'],
            password=data['password'],
            firstname=data['firstName'],
            lastname=data['lastName']
        )
        
        if user_id:
            return jsonify({
                "success": True,
                "user_id": user_id,
                "message": "User created successfully"
            }), 201
        return jsonify({"error": "Username already exists"}), 409
        
    except Exception as e:
        return jsonify({"error": str(e)}), 500

if __name__ == '__main__':
    # Start the Flask application in debug mode
    app.run(debug=False)
    

>>>>>>> 89e353d75072266c31e8b3234967ed06edce7b4b
