from flask import Flask, render_template, request, redirect, url_for, session,jsonify
from datetime import timedelta
from serviceHandler import serviceHandler
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
        
    # Get the username and password from the login form
    username = request.form['username']
    password = request.form['password']

    # Check if the credentials are valid
    requestStatus = handler.checkCredentials(username, password)
    
    # If userID is returned, credentials are valid
    if requestStatus["status"] == "Success":  
        session.permanent = True
        session['username'] = username
        session['userID'] = requestStatus["data"]["userID"]
        return redirect(url_for('dashboard'))
    else:
       
        return render_template('login.html',data = requestStatus)

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
    return render_template('login.html',data = data)

@app.route('/dashboard')
def dashboard():

    # Check if the user is logged in by verifying if the username exists in the session
    if 'username' in session:
        # Access the username and user role from the session
        username = session['username']

        #Fetch required user data to update dashboard from DB!!
        data = handler.getDashboardData(session["userID"])

        # Render the dashboard template, passing the username and user role as variables
        return render_template('dashboard.html', username=username, data=data)
    
    # If the user is not logged in, redirect to the login page
    return redirect(url_for('loginPage'))

@app.route('/addUser', methods=['POST'])
def addUser():

    data = {
        "username": request.form.get('username'),
        "password": request.form.get('password'),
        "firstName": request.form.get('firstName'),
        "lastName": request.form.get('lastName')
    }

    requestStatus = handler.addNewUser(data)

    if requestStatus["status"] == "Success":
        return render_template('login.html', data = requestStatus)
    
    return jsonify(requestStatus) #might have to render signUP  page again.

@app.route('/dashboard/addGoal', methods=['POST'])
def addGoal():

    if 'username' in session:
        username = session['username']
        userID = session["userID"]
    else:
        return { 
        "status" : "Failed",
        "statusCode":400,
        "message":"Username not Found, Please login again!"}
    
    data = {}
    # Get data from form.
    data["goalName"] = request.form.get('goalName')
    data["targetAmount"] = request.form.get('targetAmount')
    data["timeDuration"] = request.form.get('timeDuration')
    data["percentageAllocation"] = request.form.get('percentageAllocation')

    requestStatus = handler.addNewGoal(username,userID,data)

    return jsonify(requestStatus) 
    

if __name__ == '__main__':
    # Start the Flask application in debug mode
    app.run(debug=False)
    

