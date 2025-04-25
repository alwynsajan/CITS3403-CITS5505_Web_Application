from models import db,User, Goal, Expense, Salary
from werkzeug.security import generate_password_hash

class dbClient:

    # Get the last ID used in a given table
    def getLastId(self, table):
        """Returns the highest ID in a table or 0 if empty"""
        lastEntry = table.query.order_by(table.id.desc()).first()
        return lastEntry.id if lastEntry else 0

    # Add a new user if the username is not already taken
    def addUser(self, username, password, firstName, lastName):  
        """Adds new user with auto-incremented ID"""
        
        try:
            if User.query.filter_by(username=username).first():

                return {
                    "status": "Failed",
                    "statusCode": 400,
                    "message": "Username already exists"
                }

            newId = self.getLastId(User) + 1 
            newUser = User(
                id=newId,
                username=username,
                password=generate_password_hash(password),  
                firstName=firstName,
                lastName=lastName
            )
            
            db.session.add(newUser)
            db.session.commit()
            return {
                "status": "Success",
                "statusCode": 200,
                "message": "User created successfully",
                "data": {
                    "username": username,
                    "userID": newId
                }
            }
        except Exception as e:
            return {
                "status": "Failed",
                "statusCode": 400,
                "message": "Error : "+str(e)
            }

    # Validate user login credentials
    def checkCredentials(self, username, password): 
        """Validates username and password"""
        user = User.query.filter_by(username=username).first()

        if not user:
            return {
                "status": "Failed",
                "statusCode": 404,
                "message": "User not found"
            }

        if user.checkPassword(password):
            return {
                "status": "Success",
                "statusCode": 200,
                "message": "Login successful",
                "data": {
                    "username": username,
                    "userID": user.id
                }
            }
        else:
            return {
                "status": "Failed",
                "statusCode": 401,
                "message": "Incorrect password"
            }

    # Fetch current account balance of user
    def getAccountBalance(self, userID):
        """Retrieves account balance for user"""
        try:
            user = User.query.get(userID)
            if user:
                return {
                    "status": "Success",
                    "statusCode": 200,
                    "message": "Account balance retrieved successfully",
                    "data": {
                        "userID": userID,
                        "accountBalance": user.accountBalance
                    }
                }
            else:
                return {
                    "status": "Failed",
                    "statusCode": 404,
                    "message": f"User with ID {userID} not found"
                }
        except Exception as e:
            return {
                "status": "Failed",
                "statusCode": 500,
                "message": "Error : "+str(e)
            }

    # Fetch previous account balance of user
    def getPreviousAccountBalance(self, userID):
        """Retrieves previous account balance for user"""
        try:
            user = User.query.get(userID)
            if user:
                return {
                    "status": "Success",
                    "statusCode": 200,
                    "message": "Previous account balance retrieved successfully",
                    "data": {
                        "userID": userID,
                        "previousBalance": user.previousBalance
                    }
                }
            else:
                return {
                    "status": "Failed",
                    "statusCode": 404,
                    "message": f"User with ID {userID} not found"
                }
        except Exception as e:
            return {
                "status": "Failed",
                "statusCode": 500,
                "message": "Error : "+str(e)
            }

    # Add a new savings or financial goal
    def addNewGoal(self, username, data):
        """Adds a new goal for the specified user"""
        try:
            user = User.query.filter_by(username=username).first()
            if not user:
                return {
                    "status": "Failed",
                    "statusCode": 404,
                    "message": f"User with username '{username}' does not exist"
                }

            newGoalId = self.getLastId(Goal) + 1
            newGoal = Goal(
                id=newGoalId,
                userId=user.id,
                goalName=data["goalName"],
                targetAmount=float(data["targetAmount"]),
                timeDuration=int(data["timeDuration"]),
                percentageAllocation=int(data["percentageAllocation"])
            )
            db.session.add(newGoal)
            db.session.commit()

            return {
                "status": "Success",
                "statusCode": 200,
                "message": f"Goal '{data['goalName']}' added for user {username}",
                "data": None
            }
        except Exception as e:
            db.session.rollback()
            return {
                "status": "Failed",
                "statusCode": 400,
                "message": "Error : "+str(e)
            }

    # Get all goals created by a user
    def getGoalsByUserId(self, userID):
        """Fetches all goals for a given user ID"""
        try:
            goals = Goal.query.filter_by(userId=userID).all()
            print(goals)
            goalsData = [
                {
                    "goalID": goal.id,
                    "goalName": goal.goalName,
                    "targetAmount": goal.targetAmount,
                    "timeDuration": goal.timeDuration,
                    "percentageAllocation": goal.percentageAllocation
                } for goal in goals
            ]
            return {
                "status": "Success",
                "statusCode": 200,
                "data": goalsData
            }
        except Exception as e:
            return {
                "status": "Failed",
                "statusCode": 400,
                "message": str(e)
            }

    # Get all expense entries for a user
    def getMonthlyExpenses(self, userID):
        """Fetches all expenses for a given user ID"""
        try:
            expenses = Expense.query.filter_by(userId=userID).all()
            expensesData = [
                {
                    "expenseID": expense.id,
                    "category": expense.category,
                    "amount": expense.amount,
                    "date": expense.date.strftime("%Y-%m-%d"),
                    "weekStartDate": expense.weekStartDate,
                    "weekEndDate": expense.weekEndDate
                } for expense in expenses
            ]
            return {
                "status": "Success",
                "statusCode": 200,
                "data": expensesData
            }
        except Exception as e:
            return {
                "status": "Failed",
                "statusCode": 400,
                "message": "Error : "+str(e)
            }

    # Get the most recent salary received by user
    def getLastSalary(self, userID):
        """Fetches the most recent salary entry for a given user ID"""
        try:
            lastSalary = Salary.query.filter_by(userId=userID).order_by(Salary.salaryDate.desc()).first()
            if lastSalary:
                return {
                    "status": "Success",
                    "statusCode": 200,
                    "data": {
                        "salaryID": lastSalary.id,
                        "amount": lastSalary.amount,
                        "salaryDate": lastSalary.salaryDate.strftime("%Y-%m-%d")
                    }
                }
            else:
                return {
                    "status": "Success",
                    "statusCode": 200,
                    "data": None,
                    "message": "No salary records found"
                }
        except Exception as e:
            return {
                "status": "Failed",
                "statusCode": 400,
                "message": "Error : "+str(e)
            }
