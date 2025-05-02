from flask import Flask, render_template, request, redirect, url_for, session,jsonify
from datetime import timedelta
from serviceHandler import serviceHandler
from models import db

from flask_wtf import CSRFProtect

app = Flask(__name__)
# Secret key for encrypting session data
app.secret_key = 'C1TS3403_C1T5S0S_Gr0UP_4!'

# Set session lifetime to 7 days
app.permanent_session_lifetime = timedelta(days=7)

# Database config to use 'Analyser' as the database name
app.config['SQLALCHEMY_DATABASE_URI'] = 'sqlite:///Analyzer.db'
app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False

# CSRF protection
# csrf = CSRFProtect()
# csrf.init_app(app)

# Initialize the database with the app
db.init_app(app) 

# Creates tables if they don't exist
with app.app_context():
    db.create_all()  

# Initialize serviceHandler to interact with the database and do other operations
handler = serviceHandler()

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
    data= { 
        "status" : "Success",
        "statusCode":200,
        "message":None}
    
    return render_template('login.html',data = data)

@app.route('/login', methods=['POST'])
def login():

    formData = request.get_json()

    if formData is None:
        return jsonify({"status" : "Failed",
            "statusCode":400,
            "message":"No data received"})
        
    # Get the username and password from the login form
    username = formData.get('username')
    password = formData.get('password')

    # Check if the credentials are valid
    requestStatus = handler.checkCredentials(username, password)
    
    # If userID is returned, credentials are valid
    if requestStatus["status"] == "Success":

        session.permanent = True
        session['username'] = username
        session['userID'] = requestStatus["data"]["userID"]

        # Return JSON response with redirect information
        return jsonify({
            "status": "Success",
            "statusCode": 200,
            "message": "Login successfully",
            "redirect": url_for('dashboard')  # Tell client where to redirect
        })
    
    return jsonify(requestStatus)
       
@app.route('/logout')
def logout():

    # Remove user data from the session when logging out
    session.pop('username', None)
    session.pop('userID', None)

    data= {
        "status" : "Success",
        "statusCode":200,
        "message":None
        }
    return redirect(url_for('login'))

@app.route('/signup')
def signUp():

    if 'username' in session:
        # Remove user data from the session.
        session.pop('username', None)
        session.pop('userID', None)

    return render_template('signup.html')

@app.route('/dashboard')
def dashboard():

    # Check if the user is logged in by verifying if the username exists in the session
    if 'username' in session:
        # Access the username and user role from the session
        username = session['username']

        status = handler.getUserFirstName(session["userID"])

        if status["status"] == "Success":

            #Fetch required user data to update dashboard from DB!!
            data = handler.getDashboardData(session["userID"])

            # Render the dashboard template, passing the username and user role as variables
            return render_template('dashboard.html', username=status["data"]["firstName"], data=data)
        
        else:
            return redirect(url_for('loginPage'))
    
    # If the user is not logged in, redirect to the login page
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
def addGoal():

    if 'username' in session:
        username = session['username']
        userID = session["userID"]
    else:
        return redirect(url_for('loginPage'))
    
    formData = request.get_json()

    if formData is None:
        return jsonify({"status" : "Failed",
            "statusCode":400,
            "message":"No data received"})

    data = {}
    data["goalName"] = formData.get('goalName')
    data["targetAmount"] = formData.get('targetAmount')
    data["timeDuration"] = formData.get('timeDuration')
    data["percentageAllocation"] = formData.get('allocation')

    requestStatus = handler.addNewGoal(username,userID,data)

    return jsonify(requestStatus) 

@app.route('/dashboard/addSalary', methods=['POST'])
@app.route('/expense/addSalary', methods=['POST'])
def addSalary():

    if 'username' in session:
        username = session['username']
        userID = session["userID"]
    else:
        return redirect(url_for('loginPage'))
    
    formData = request.get_json()

    if formData is None:
        return jsonify({"status" : "Failed",
            "statusCode":400,
            "message":"No data received"})
    
    data = {}
    # Get data from form.
    data["amount"] = formData.get('amount')
    data["salaryDate"] = formData.get('date')

    requestStatus = handler.addNewSalary(username,userID,data)

    return jsonify(requestStatus)

@app.route('/expense/addExpense', methods=['POST'])
def addExpense():

    if 'username' in session:
        username = session['username']
        userID = session["userID"]
    else:
        return redirect(url_for('loginPage'))
    
    formData = request.get_json()

    if formData is None:
        return jsonify({"status" : "Failed",
            "statusCode":400,
            "message":"No data received"})
    
    data = {}
    # Get data from form.
    data["category"] = formData.get('category')
    data["amount"] = formData.get('amount')
    data["date"] = formData.get('date')

    data = handler.addNewExpense(username,userID,data)

    return jsonify(data)

@app.route('/expense', methods=['POST'])
def expensePage():

    if 'username' in session:
        username = session['username']
        userID = session["userID"]
    else:
        return redirect(url_for('loginPage'))
    
    status = handler.getUserFirstName(session["userID"])

    if status["status"] == "Success":

        #Fetch required user data to update expensePage from DB!!
        data = handler.getExpensePageData(userID)

        # Render the expense template, passing the required data for graohs
        return render_template('expense.html',  username=status["data"]["firstName"], data=data)
    
    else:
        return redirect(url_for('loginPage'))
    
@app.route('/dashboard/getUsernamesAndIDs')
def getUsernamesAndIDs():

    if 'username' in session:
        username = session['username']
        userID = session["userID"]
    else:
        return redirect(url_for('loginPage'))
    
    requestStatus = handler.getUsernamesAndIDs(userID)

    print(requestStatus)
    
    return jsonify(requestStatus)

@app.route('/dashboard/sentReport', methods = ['POST'])
def sentReport():

    if 'username' in session:
        username = session['username']
        userID = session["userID"]
    else:
        return redirect(url_for('loginPage'))
    
    data = request.get_json()

    if data is None:
        return jsonify({"status" : "Failed",
            "statusCode":400,
            "message":"No data received"})
    
    receiversID = data.get('userID')

    requestStatus = handler.sendReport(userID,receiversID)

    return jsonify(requestStatus)

@app.route('/dashboard/getSenderDetails')
def getSenderDetails():

    if 'username' in session:
        username = session['username']
        userID = session["userID"]
    else:
        return redirect(url_for('loginPage'))
    
    requestStatus = handler.getSenderDetails(userID)

    return jsonify(requestStatus)

@app.route('/dashboard/getReport')
def getReport():

    if 'username' in session:
        username = session['username']
        userID = session["userID"]
    else:
        return redirect(url_for('loginPage'))
    
    data = request.get_json()

    if data is None:
        return jsonify({"status" : "Failed",
            "statusCode":400,
            "message":"No data received"})
    
    sendersID = data.get('userID')
    sharedDate = data.get('date')

    requestStatus = handler.getReportData(userID,sendersID,sharedDate)

    return render_template("report.html",data = requestStatus[data])


if __name__ == '__main__':
    # Start the Flask application in debug mode
    app.run(debug=True)
    

