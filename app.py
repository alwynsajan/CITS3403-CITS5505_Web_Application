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

if __name__ == '__main__':
    # Start the Flask application in debug mode
    app.run(debug=False)
    
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
            first_name=data['firstName'],
            last_name=data['lastName']
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
