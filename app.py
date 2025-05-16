from flask import Flask, render_template, request, redirect, url_for, session,jsonify
from flask_login import LoginManager, login_user, login_required, logout_user, current_user
from datetime import timedelta
from serviceHandler import serviceHandler
from flask_migrate import Migrate
from config import Config
from models import db,User
from flask_wtf.csrf import validate_csrf, generate_csrf 
from wtforms.validators import ValidationError 
from flask_wtf import CSRFProtect
import re
from forms import LoginForm,SignupForm


app = Flask(__name__)

app.config.from_object(Config)
if not Config.SECRET_KEY:
    raise RuntimeError("Server misconfiguration: ANALYSER_SECRET_KEY is not set in environment.")

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
csrf = CSRFProtect(app)

@app.after_request
def inject_csrf_token(response):
    response.set_cookie('csrf_token', generate_csrf())
    return response

# Creates tables if they don't exist
with app.app_context():
    db.create_all()  

# Initialize serviceHandler to interact with the database and do other operations
handler = serviceHandler()

# Flask-Login: Load user from DB
@login_manager.user_loader
def load_user(user_id):
    return User.query.get(int(user_id))

# Helper function to validate email
def is_valid_email(email):
    email_regex = r"^[\w\.-]+@[\w\.-]+\.\w+$"
    return re.match(email_regex, email)

# Home route
# This ensures both `/` and `/login` go to the login page
# Login page route (GET)
@app.route('/')
@app.route('/login')
def loginPage():
    form = LoginForm()
    if current_user.is_authenticated:
        return redirect(url_for('dashboard'))

    return render_template('login.html', form=form)

# Login route (POST) - Authenticates user credentials
@app.route('/login', methods=['POST'])
def login():
    try:
        csrf_token = request.headers.get('X-CSRFToken')
        validate_csrf(csrf_token)  # Raises exception if invalid
    except ValidationError:
        return jsonify({
            "status": "Failed",
            "statusCode": 400,
            "message": "Invalid or missing CSRF token"
        }), 400
    
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
    if user:
        if user.checkPassword(password):
            login_user(user, remember=True, duration=timedelta(days=3))

            return jsonify({
                "status": "Success",
                "statusCode": 200,
                "message": "Login successfully",
                "redirect": url_for('dashboard')
            })
        
        return jsonify({
                    "status": "Failed",
                    "statusCode": 401,
                    "message": "Invalid Username or Password."
                }), 401
    else:
        return jsonify({
                    "status": "Failed",
                    "statusCode": 401,
                    "message": "User Not Found."
                }), 401
       
# Logout route
@app.route('/logout')
@login_required
def logout():
    logout_user()
    return redirect(url_for('loginPage'))

# Signup page route
@app.route('/signup')
def signUp():
    if current_user.is_authenticated:
        logout_user()
    form = SignupForm()
    return render_template('signup.html', form=form)

# Dashboard view route
@app.route('/dashboard')
@login_required
def dashboard():
    status = handler.getUserFirstName(current_user.id)
    if status["status"] == "Success":
        data = handler.getDashboardData(current_user.id)
        return render_template('dashboard.html', username=current_user.firstName, data=data)
    return redirect(url_for('loginPage'))

# Route to create a new user account
@app.route('/addUser', methods=['POST'])
def addUser():

    try:
        csrf_token = request.headers.get('X-CSRFToken')
        validate_csrf(csrf_token)  # Raises exception if invalid
    except ValidationError:
        return jsonify({
            "status": "Failed",
            "statusCode": 400,
            "message": "Invalid or missing CSRF token"
        }), 400

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

    # Validate email format
    if not is_valid_email(data["username"]):
        return jsonify({
            "status": "Failed",
            "statusCode": 400,
            "message": "Invalid email address"
        })

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
    
# Route to add a new savings goal
@csrf.exempt
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

# Route to add a new salary entry (accessible from both dashboard and expense pages)
@csrf.exempt
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

# Route to add a new expense entry
@csrf.exempt
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

# Route to add a new expense entry
@csrf.exempt
@app.route('/dashboard/addExpense', methods=['POST'])
@login_required
def addExpenseAndUpadteGoalAllocation():
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
        "date": formData.get('date'),
        "goalName":formData.get('goalName')
    }

    result = handler.addNewExpense(current_user.username, current_user.id, data)
    requestStatus = handler.updateAllocation(current_user.id, data)
    return jsonify(requestStatus)
    return jsonify(result)

# Expense page view route
@app.route('/expense')
@login_required
def expensePage():
    status = handler.getUserFirstName(current_user.id)
    if status["status"] == "Success":
        data = handler.getExpensePageData(current_user.id)
        return render_template('expense.html', username=current_user.firstName, data=data)
    return redirect(url_for('loginPage'))
    
# Route to fetch usernames and their IDs for sharing reports
@app.route('/dashboard/getUsernamesAndIDs')
@login_required
def getUsernamesAndIDs():

    # Get the 'query' parameter from URL
    query = request.args.get('query', '')  
    requestStatus = handler.getUsernamesAndIDs(current_user.id,query)
    return jsonify(requestStatus)

# Route to send report to another user, report is saved in db.
@app.route('/dashboard/sentReport', methods=['POST'])
@login_required
def sentReport():
    data = request.get_json()
    if data is None:
        return jsonify({"status": "Failed", "statusCode": 400, "message": "No data received"})

    receiversID = data.get('receiversID')
    requestStatus = handler.sendReport(current_user.id, receiversID)
    return jsonify(requestStatus)

# Route to get sender details for received reports
@app.route('/dashboard/getSenderDetails')
@login_required
def getSenderDetails():
    requestStatus = handler.getSenderDetails(current_user.id)
    return jsonify(requestStatus)

# Route to view a specific shared report
@app.route('/dashboard/getSharedReport', methods=['POST'])
@login_required
def getReport():
    data = request.get_json()
    if data is None:
        return jsonify({"status": "Failed", "statusCode": 400, "message": "No data received"})

    senderID = data.get('senderID')
    reportID = data.get('reportId')

    # Fetch the report data
    requestStatus = handler.getReportData(current_user.id, senderID, reportID)

    if requestStatus["status"] != "Success":
        return jsonify({
            "status": "Failed",
            "statusCode": 404,
            "message": "Report not found"
        }), 404

    # Render the report HTML using Jinja2 template and send it in the response
    report_html = render_template("report.html", data=requestStatus["data"])

    return jsonify({
        "status": "Success",
        "statusCode": 200,
        "reportHtml": report_html
    })

# Route to get IDs of unread reports
@app.route('/dashboard/getUnreadReportIds')
@login_required
def getUnreadReportIds():
    requestStatus = handler.getUnreadReportIds(current_user.id)
    return jsonify(requestStatus)

# Route to get the count of unread reports
@app.route('/dashboard/getUnreadReportCount')
@login_required
def getUnreadReportCount():
    requestStatus = handler.getUnreadReportCount(current_user.id)
    return jsonify(requestStatus)

# Route to mark a report as read
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
        formData = request.get_json()

        if formData is None:
            return jsonify({
                "status": "Failed",
                "statusCode": 400,
                "message": "No data received"
            })

        first_name = formData.get('firstName')
        last_name = formData.get('lastName')
        current_password = formData.get('currentPassword')
        new_password = formData.get('newPassword')
        confirm_password = formData.get('confirmPassword')

        # Decide if it's just name update
        if first_name and last_name and not (current_password or new_password or confirm_password):
            result = handler.updateUserName(current_user.id, first_name, last_name)
            return jsonify(result)

        # Password change flow
        result = handler.updateUserPassword(current_user.id, current_password, new_password, confirm_password)
        return jsonify(result)

    return render_template('settings.html', username =current_user.firstName, user=current_user)

# Route to get AccountData 
@app.route('/dashboard/getAccountData')
@login_required
def getAccountData():
    requestStatus = handler.getAccountData(current_user.id)
    return jsonify(requestStatus)

# Route to get Latest Transactions  
@app.route('/dashboard/getLatestTransactions')
@login_required
def getLatestTransactions():
    requestStatus = handler.getLatestTransactions(current_user.id)
    return jsonify(requestStatus)

# Route to get Goal List
@app.route('/dashboard/getGoals')
@login_required
def getGoals():
    requestStatus = handler.getGoals(current_user.id)
    return jsonify(requestStatus)




if __name__ == '__main__':
    app.run(debug=True)
    

