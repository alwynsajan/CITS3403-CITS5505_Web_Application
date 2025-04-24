from models import User,Goal,Expense
from werkzeug.security import generate_password_hash

class dbClient: 
    def __init__(self, dbSession):
        self.dbSession = dbSession  

    def getLastId(self, table):

        """Returns the highest ID in a table or 0 if empty"""
        lastEntry = table.query.order_by(table.id.desc()).first()
        return lastEntry.id if lastEntry else 0

    def addUser(self, username, password, firstName, lastName):  
        
        """Adds new user with auto-incremented ID"""
        if User.query.filter_by(username=username).first():
            # Username exists
            return {
                "status": "Failed",
                "statusCode":400,
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
        
        self.dbSession.add(newUser)
        try:
            self.dbSession.commit()
            return {
                    "status": "Success",
                    "statusCode":200,
                    "message": "User created successfully",
                    "data": {"username":username,
                             "userID": newId}
                }
        except Exception as e:
            return {
                "status": "Failed",
                "statusCode":400,
                "message": str(e)}

    def checkCredentials(self, username, password): 

        user = User.query.filter_by(username=username).first()

        # Check if the user exists
        if not user:
            return {
                "status": "Failed",
                "statusCode": 404,
                "message": "User not found"
            }

        # Check if the password matches
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

    def getAccountBalance(self, userID):
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
                "message": str(e)
            }
        
    def addNewGoal(self, username, data):
        
        """Adds a new goal for the specified user"""
        try:
            # Validate user exists by username
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
                duration=int(data["timeDuration"]),
                percentageAllocation=int(data["percentageAllocation"])
            )
            self.dbSession.add(newGoal)
            self.dbSession.commit()

            return {
                "status": "Success",
                "statusCode": 200,
                "message": f"Goal '{data['goalName']}' added for user {username}",
                "data":None
            }
        
        except Exception as e:
            self.dbSession.rollback()
            return {
                "status": "Failed",
                "statusCode": 400,
                "message": str(e)
            }
        
    def getGoalsByUserId(self, userID):

        """Fetches all goals for a given user ID"""
        try:
            goals = Goal.query.filter_by(userId=userID).all()
            goalsData = [
                {
                    "goalID": goal.id,
                    "goalName": goal.goalName,
                    "targetAmount": goal.targetAmount,
                    "duration": goal.duration,
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
        
    def getMonthlyExpenses(self, userID):
        """Fetches all expenses for a given user ID"""
        try:
            expenses = Expense.query.filter_by(userid=userID).all()
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
                "message": str(e)
            }


