from flask import Flask, render_template, request, redirect, url_for, session,jsonify
from flask_login import LoginManager, login_user, login_required, logout_user, current_user
from datetime import timedelta
from serviceHandler import serviceHandler
from flask_migrate import Migrate
from config import Config
from models import db,User
from flask_wtf import CSRFProtect
from flask import flash

app = Flask(__name__)

app.config.from_object(Config)

# Initialize the database with the app
db.init_app(app) 

migrate = Migrate(app,db)

# Flask-Login
login_manager = LoginManager()
# Redirect to this route when not logged in
login_manager.login_view = 'loginPage'  
login_manager.init_app(app)

# Set session lifetime to 7 days
app.permanent_session_lifetime = timedelta(days=7)

# CSRF protection
# csrf = CSRFProtect()
# csrf.init_app(app)

# Creates tables if they don't exist
with app.app_context():
    db.create_all()  

# Initialize serviceHandler to interact with the database and do other operations
handler = serviceHandler()

# Flask-Login: Load user from DB
@login_manager.user_loader
def load_user(user_id):
    return User.query.get(int(user_id))

# Home route
# This ensures both `/` and `/login` go to the login page
@app.route('/')
@app.route('/login')
def loginPage():
    if current_user.is_authenticated:
        return redirect(url_for('dashboard'))

    return render_template('login.html')

@app.route('/login', methods=['POST'])
def login():
    formData = request.get_json()
    if formData is None:
        return jsonify({
            "status": "Failed",
            "statusCode": 400,
            "message": "No data received"
        })

    username = formData.get('username')
    password = formData.get('password')

    user = User.query.filter_by(username=username).first()
    if user and user.checkPassword(password):
        login_user(user, remember=True, duration=timedelta(days=7))

        return jsonify({
            "status": "Success",
            "statusCode": 200,
            "message": "Login successfully",
            "redirect": url_for('dashboard')
        })

    return jsonify({
        "status": "Failed",
        "statusCode": 401,
        "message": "Invalid username or password"
    })
       
@app.route('/logout')
@login_required
def logout():
    logout_user()
    return redirect(url_for('loginPage'))

@app.route('/signup')
def signUp():
    if current_user.is_authenticated:
        logout_user()
    return render_template('signup.html')

@app.route('/dashboard')
@login_required
def dashboard():
    status = handler.getUserFirstName(current_user.id)
    if status["status"] == "Success":
        data = handler.getDashboardData(current_user.id)
        return render_template('dashboard.html', username=status["data"]["firstName"], data=data)
    return redirect(url_for('loginPage'))


@app.route('/addUser', methods=['POST'])
def addUser():

    formData = request.get_json()

    if formData is None:
        return jsonify({"status" : "Failed",
            "statusCode":400,
            "message":"No data received"})

    data = {}

    data = {
        "username": formData.get('username'),
        "password": formData.get('password'),
        "confirmPassword": formData.get("confirmPassword"),
        "firstName": formData.get('firstName'),
        "lastName": formData.get('lastName')
    }

    if data["password"] != data["confirmPassword"]:
        return jsonify({"status" : "Failed",
            "statusCode":400,
            "message":"Password confirmation failed"})

    requestStatus = handler.addNewUser(data)

    if requestStatus["status"] == "Success":
        
        # Return JSON response with redirect information
        return jsonify({
            "status": "Success",
            "statusCode": 200,
            "message": "User created successfully",
            "redirect": url_for('login')  # Tell client where to redirect
        })
    
    return jsonify(requestStatus)
    
@app.route('/dashboard/addGoal', methods=['POST'])
@login_required
def addGoal():
    formData = request.get_json()
    if formData is None:
        return jsonify({"status": "Failed", "statusCode": 400, "message": "No data received"})

    data = {
        "goalName": formData.get('goalName'),
        "targetAmount": formData.get('targetAmount'),
        "timeDuration": formData.get('timeDuration'),
        "percentageAllocation": formData.get('allocation')
    }

    requestStatus = handler.addNewGoal(current_user.username, current_user.id, data)
    return jsonify(requestStatus)

@app.route('/dashboard/addSalary', methods=['POST'])
@app.route('/expense/addSalary', methods=['POST'])
@login_required
def addSalary():
    formData = request.get_json()
    if formData is None:
        return jsonify({"status": "Failed", "statusCode": 400, "message": "No data received"})

    try:
        amount = float(formData.get('amount'))
        if amount <= 0:
            raise ValueError
    except (ValueError, TypeError):
        return jsonify({
            "status": "Failed",
            "statusCode": 400,
            "message": "Invalid amount. Must be a positive number."
        })

    data = {
        "amount": amount,
        "salaryDate": formData.get('date')
    }

    requestStatus = handler.addNewSalary(current_user.username, current_user.id, data)
    return jsonify(requestStatus)

@app.route('/expense/addExpense', methods=['POST'])
@login_required
def addExpense():
    formData = request.get_json()
    if formData is None:
        return jsonify({"status": "Failed", "statusCode": 400, "message": "No data received"})

    try:
        amount = float(formData.get('amount'))
        if amount <= 0:
            raise ValueError
    except (ValueError, TypeError):
        return jsonify({
            "status": "Failed",
            "statusCode": 400,
            "message": "Invalid amount. Must be a positive number."
        })

    data = {
        "amount": amount,
        "category": formData.get('category'),
        "date": formData.get('date')
    }

    result = handler.addNewExpense(current_user.username, current_user.id, data)
    return jsonify(result)

@app.route('/expense')
@login_required
def expensePage():
    status = handler.getUserFirstName(current_user.id)
    if status["status"] == "Success":
        data = handler.getExpensePageData(current_user.id)
        return render_template('expense.html', username=status["data"]["firstName"], data=data)
    return redirect(url_for('loginPage'))
    
@app.route('/dashboard/getUsernamesAndIDs')
@login_required
def getUsernamesAndIDs():
    requestStatus = handler.getUsernamesAndIDs(current_user.id)
    return jsonify(requestStatus)

@app.route('/dashboard/sentReport', methods=['POST'])
@login_required
def sentReport():
    data = request.get_json()
    if data is None:
        return jsonify({"status": "Failed", "statusCode": 400, "message": "No data received"})

    receiversID = data.get('recipientID')
    requestStatus = handler.sendReport(current_user.id, receiversID)
    return jsonify(requestStatus)

@app.route('/dashboard/getSenderDetails')
@login_required
def getSenderDetails():
    requestStatus = handler.getSenderDetails(current_user.id)
    return jsonify(requestStatus)

@app.route('/dashboard/getReport')
@login_required
def getReport():
    data = request.get_json()
    if data is None:
        return jsonify({"status": "Failed", "statusCode": 400, "message": "No data received"})

    sendersID = data.get('userID')
    sharedDate = data.get('date')

    requestStatus = handler.getReportData(current_user.id, sendersID, sharedDate)
    return render_template("report.html", data=requestStatus["data"])

@app.route('/dashboard/getUnreadReportIds')
@login_required
def getUnreadReportIds():
    requestStatus = handler.getUnreadReportIds(current_user.id)
    return jsonify(requestStatus)

@app.route('/dashboard/getUnreadReportCount')
@login_required
def getUnreadReportCount():
    requestStatus = handler.getUnreadReportCount(current_user.id)
    return jsonify(requestStatus)

@app.route('/dashboard/markReportAsRead', methods=['POST'])
@login_required
def markReportAsRead():
    data = request.get_json()
    if data is None:
        return jsonify({"status": "Failed", "statusCode": 400, "message": "No data received"})

    reportID = data.get('reportId')
    requestStatus = handler.markReportAsRead(current_user.id, reportID)
    return jsonify(requestStatus)

@app.route('/settings', methods=['GET', 'POST'])
@login_required
def settings():
    if request.method == 'POST':
        first_name = request.form.get('firstName')
        last_name = request.form.get('lastName')
        password = request.form.get('password')  # optional

        response = handler.updateUserSettings(current_user.id, first_name, last_name, password)

        if response['status'] == 'Success':
            flash('Settings updated successfully!', 'success')
            return redirect(url_for('settings'))
        else:
            flash('Error updating settings: ' + response['message'], 'danger')

    return render_template('settings.html', user=current_user)


if __name__ == '__main__':
    # Start the Flask application in debug mode
    app.run(debug=True)
    

