from flask import Flask, render_template, jsonify, request, redirect, url_for
import os
import random
import json
from datetime import datetime, timedelta
import calendar
from flask_sqlalchemy import SQLAlchemy

app = Flask(__name__)
app.config['SECRET_KEY'] = 'your-secret-key'
app.config['SQLALCHEMY_DATABASE_URI'] = 'sqlite:///app.db'
db = SQLAlchemy(app)

# Define Salary model
class Salary(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    amount = db.Column(db.Float, nullable=False)
    date = db.Column(db.Date, nullable=False)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)

    def __repr__(self):
        return f'<Salary {self.amount} on {self.date}>'

# Generate sample monthly spending data
def generate_monthly_spending():
    months = calendar.month_abbr[1:]
    expenses = [random.randint(2000, 6500) for _ in range(12)]
    return {
        'labels': list(months),
        'expenses': expenses
    }

# Sample data storage
SAMPLE_DATA = {
    'account': {
        'balance': 4850.75,
        'trendType': 'up',
        'percentChange': 12.5
    },
    'salary': {
        'amount': 5000,
        'date': datetime.now().strftime("%Y-%m-%d")
    },
    'budgetSuggestions': {
        'needs': 2500,
        'wants': 1500,
        'savings': 1000,
        'salary': 5000,
        'salaryDate': datetime.now().strftime("%B %d, %Y")
    },
    'goals': [],  
    'monthlySpending': generate_monthly_spending()
}

@app.route('/')
def index():
    return redirect(url_for('dashboard'))

@app.route('/dashboard')
def dashboard():
    # Get username from session or request
    username = request.args.get('username', 'User')  # Default value is 'User'
    
    # Prepare dashboard data
    data = {
        'hasAccountBalance': True,
        'accountData': SAMPLE_DATA['account'],
        'hasGoal': bool(SAMPLE_DATA['goals']),
        'goalData': SAMPLE_DATA['goals'],
        'hasSalary': bool(SAMPLE_DATA['salary']),
        'budgetSuggestionData': SAMPLE_DATA['budgetSuggestions'],
        'hasExpense': True,
        'monthlySpendData': SAMPLE_DATA['monthlySpending']['expenses'],
        'username': username  # Add username to data dictionary
    }
    
    return render_template('dashboard.html', data=data)

@app.route('/expenses')
def expenses():
    # For this demo, we'll just show the dashboard template
    return render_template('expenses_placeholder.html', data={})

@app.route('/settings')
def settings():
    # For this demo, we'll just show the dashboard template
    return render_template('settings_placeholder.html', data={})

@app.route('/dashboard/addGoal', methods=['POST'])
def add_goal():
    try:
        # Get goal data from request
        goal_data = request.json
        
        # Validate required fields
        if not all(key in goal_data for key in ['goalName', 'targetAmount', 'timeDuration', 'allocation']):
            return jsonify({'status': 'error', 'message': 'Missing required fields'}), 400
        
        # Ensure goalName is not empty
        if not goal_data['goalName'].strip():
            return jsonify({
                'status': 'error',
                'message': 'Goal name cannot be empty'
            }), 400
        
        # Process goal name: trim whitespace and convert to lowercase for comparison
        goal_name = goal_data['goalName'].strip().lower()
        
        # Check if a goal with the same name already exists (case-insensitive)
        if SAMPLE_DATA['goals']:  # Only check for duplicates if goals list is not empty
            for goal in SAMPLE_DATA['goals']:
                if goal['goalName'].strip().lower() == goal_name:
                    return jsonify({
                        'status': 'error',
                        'message': 'A goal with this name already exists'
                    }), 400
        
        # Create new goal object, preserving original case
        new_goal = {
            'goalName': goal_data['goalName'].strip(),  # Trim whitespace but preserve original case
            'target': float(goal_data['targetAmount']),
            'saved': 0,
            'remaining': float(goal_data['targetAmount']),
            'progressPercentage': 0,
            'message': f"Save at least ${float(goal_data['targetAmount']) / int(goal_data['timeDuration']):.2f} per month to reach your goal!"
        }
        
        # Add to sample data
        SAMPLE_DATA['goals'].append(new_goal)
        
        # Return updated goals list
        return jsonify({
            'status': 'success',
            'message': 'Goal added successfully',
            'data': SAMPLE_DATA['goals']
        })
        
    except Exception as e:
        print(f"Error in add_goal: {str(e)}")  # Add error logging
        return jsonify({'status': 'error', 'message': str(e)}), 500

@app.route('/dashboard/export/<format>')
def export_dashboard(format):
    if format not in ['csv', 'pdf']:
        return jsonify({'status': 'error', 'message': 'Invalid format'}), 400
    
    # In a real app, we would generate and return a file
    # For this demo, we'll just return a message
    return jsonify({
        'status': 'success',
        'message': f'Dashboard exported as {format.upper()} successfully. (Demo - no actual file generated)'
    })

# Add a route for updating goal progress (for demo purposes)
@app.route('/dashboard/updateGoal/<int:index>/<int:amount>', methods=['POST'])
def update_goal(index, amount):
    try:
        if index < 0 or index >= len(SAMPLE_DATA['goals']):
            return jsonify({'status': 'error', 'message': 'Invalid goal index'}), 400
        
        goal = SAMPLE_DATA['goals'][index]
        goal['saved'] += amount
        goal['remaining'] = max(0, goal['target'] - goal['saved'])
        goal['progressPercentage'] = min(100, round((goal['saved'] / goal['target']) * 100, 2))
        
        return jsonify({
            'status': 'success',
            'message': 'Goal updated successfully',
            'data': goal
        })
        
    except Exception as e:
        return jsonify({'status': 'error', 'message': str(e)}), 500

# Templates for placeholder pages
@app.route('/expenses_placeholder.html')
def expenses_placeholder():
    return render_template('expenses_placeholder.html', data={})

@app.route('/settings_placeholder.html')
def settings_placeholder():
    return render_template('settings_placeholder.html', data={})

# Add simple error handlers
@app.errorhandler(404)
def not_found_error(error):
    return render_template('404.html', data={}), 404

@app.errorhandler(500)
def internal_error(error):
    return render_template('500.html', data={}), 500

# Create placeholder templates if they don't exist
def create_placeholder_templates():
    templates_dir = os.path.join(os.path.dirname(os.path.abspath(__file__)), 'templates')
    os.makedirs(templates_dir, exist_ok=True)
    
    # Create expenses placeholder
    expenses_path = os.path.join(templates_dir, 'expenses_placeholder.html')
    if not os.path.exists(expenses_path):
        with open(expenses_path, 'w') as f:
            f.write('''{% extends "base.html" %}
{% block content %}
<div class="row">
    <div class="col-12">
        <div class="card">
            <div class="card-body text-center py-5">
                <h2>Expenses Page</h2>
                <p class="lead">This is a placeholder for the expenses page.</p>
                <a href="/dashboard" class="btn btn-primary">Back to Dashboard</a>
            </div>
        </div>
    </div>
</div>
{% endblock %}''')
    
    # Create settings placeholder
    settings_path = os.path.join(templates_dir, 'settings_placeholder.html')
    if not os.path.exists(settings_path):
        with open(settings_path, 'w') as f:
            f.write('''{% extends "base.html" %}
{% block content %}
<div class="row">
    <div class="col-12">
        <div class="card">
            <div class="card-body text-center py-5">
                <h2>Settings Page</h2>
                <p class="lead">This is a placeholder for the settings page.</p>
                <a href="/dashboard" class="btn btn-primary">Back to Dashboard</a>
            </div>
        </div>
    </div>
</div>
{% endblock %}''')
    
    # Create error pages
    error_404_path = os.path.join(templates_dir, '404.html')
    if not os.path.exists(error_404_path):
        with open(error_404_path, 'w') as f:
            f.write('''{% extends "base.html" %}
{% block content %}
<div class="row">
    <div class="col-12">
        <div class="card">
            <div class="card-body text-center py-5">
                <h1 class="display-1">404</h1>
                <h2>Page Not Found</h2>
                <p class="lead">The page you are looking for does not exist.</p>
                <a href="/dashboard" class="btn btn-primary">Back to Dashboard</a>
            </div>
        </div>
    </div>
</div>
{% endblock %}''')
    
    error_500_path = os.path.join(templates_dir, '500.html')
    if not os.path.exists(error_500_path):
        with open(error_500_path, 'w') as f:
            f.write('''{% extends "base.html" %}
{% block content %}
<div class="row">
    <div class="col-12">
        <div class="card">
            <div class="card-body text-center py-5">
                <h1 class="display-1">500</h1>
                <h2>Internal Server Error</h2>
                <p class="lead">Something went wrong. Please try again later.</p>
                <a href="/dashboard" class="btn btn-primary">Back to Dashboard</a>
            </div>
        </div>
    </div>
</div>
{% endblock %}''')

@app.route('/add_salary', methods=['POST'])
def add_salary():
    try:
        data = request.get_json()
        amount = float(data.get('amount'))
        date_str = data.get('date')
        
        if not amount or amount <= 0:
            return jsonify({'error': 'Invalid salary amount'}), 400
            
        try:
            salary_date = datetime.strptime(date_str, '%Y-%m-%d').date()
        except ValueError:
            return jsonify({'error': 'Invalid date format'}), 400
            
        new_salary = Salary(
            amount=amount,
            date=salary_date
        )
        
        db.session.add(new_salary)
        
        # Update account balance
        SAMPLE_DATA['account']['balance'] += amount
        
        # Update budget suggestions based on new salary
        SAMPLE_DATA['budgetSuggestions'] = {
            'needs': amount * 0.5,  # 50% for needs
            'wants': amount * 0.3,  # 30% for wants
            'savings': amount * 0.2,  # 20% for savings
            'salary': amount,
            'salaryDate': salary_date.strftime("%B %d, %Y")
        }
        
        db.session.commit()
        
        return jsonify({
            'message': 'Salary added successfully',
            'new_balance': SAMPLE_DATA['account']['balance'],
            'budgetSuggestions': SAMPLE_DATA['budgetSuggestions']
        }), 200
        
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': f'Error adding salary: {str(e)}'}), 500

@app.route('/get_salaries', methods=['GET'])
def get_salaries():
    try:
        # Get query parameters
        start_date = request.args.get('start_date')
        end_date = request.args.get('end_date')
        
        # Build base query
        query = Salary.query
        
        # If start date provided
        if start_date:
            try:
                start = datetime.strptime(start_date, '%Y-%m-%d').date()
                query = query.filter(Salary.date >= start)
            except ValueError:
                return jsonify({'error': 'Invalid start date format'}), 400
                
        # If end date provided
        if end_date:
            try:
                end = datetime.strptime(end_date, '%Y-%m-%d').date()
                query = query.filter(Salary.date <= end)
            except ValueError:
                return jsonify({'error': 'Invalid end date format'}), 400
        
        # Order by date descending and execute query
        salaries = query.order_by(Salary.date.desc()).all()
        
        # Format results
        salary_list = [{
            'id': salary.id,
            'amount': salary.amount,
            'date': salary.date.strftime('%Y-%m-%d'),
            'created_at': salary.created_at.strftime('%Y-%m-%d %H:%M:%S')
        } for salary in salaries]
        
        return jsonify({
            'salaries': salary_list,
            'total_count': len(salary_list),
            'current_balance': SAMPLE_DATA['account']['balance']
        }), 200
        
    except Exception as e:
        return jsonify({'error': f'Error getting salary history: {str(e)}'}), 500

if __name__ == '__main__':
    # Create placeholder templates
    create_placeholder_templates()
    
    with app.app_context():
        # Create database tables
        db.create_all()
    
    # Run the app
    app.run(debug=True)