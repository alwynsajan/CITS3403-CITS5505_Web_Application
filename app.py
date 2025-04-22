from flask import Flask, render_template

app = Flask(__name__)

@app.route('/')
def dashboard():
    # Sample data dictionary with all flags set to False initially
    data = {
        "hasAccountBlance": False,
        "hasGoal": False,
        "hasExpense": False,
        "hasSalary": False
    }
    return render_template('dashboard.html', data=data)

@app.route('/expenses')
def expenses():
    return render_template('expenses.html')

@app.route('/settings')
def settings():
    return "<h1>Settings Page Coming Soon</h1>"

if __name__ == '__main__':
    app.run(debug=True)