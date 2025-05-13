from models import db,User, Goal, Expense, Salary, ShareReport
from werkzeug.security import generate_password_hash
from datetime import datetime
from sqlalchemy import extract

"""
Database client class that handles all database operations.
Provides meaningful error messages to users while logging technical details.
"""
class dbClient:

    def handleError(self, error, context="database operation"):
        """
        Centralized error handling method
        Args:
            error: Exception object
            context: String describing what operation was being attempted
        Returns:
            dict: Standard error response format
        """
        error_msg = f"Error during {context}: {str(error)}"
        print(f"DB ERROR: {error_msg}")  # Log technical error to console
        return {
            "status": "Failed",
            "statusCode": 400,
            "message": "A system error occurred. Please try again later."
        }

    # Get the last ID used in a given table
    def getLastId(self, table):
        """Returns the highest ID in a table or 0 if empty"""
        try:
            lastEntry = table.query.order_by(table.id.desc()).first()
            return lastEntry.id if lastEntry else 0
        except Exception as e:
            print(f"Error getting last ID: {str(e)}")
            return 0

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
            db.session.rollback()
            return self.handleError(e, "user registration")

    # Validate user login credentials
    def checkCredentials(self, username, password): 
        """Validates user credentials with secure error messages"""
        try:
            user = User.query.filter_by(username=username).first()

            if not user:
                return {
                    "status": "Failed",
                    "statusCode": 404,
                    "message": "Account not found. Please check your username."
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
            return {
                "status": "Failed",
                "statusCode": 401,
                "message": "Incorrect password. Please try again."
            }
        except Exception as e:
            return self.handleError(e, "login validation")
        
    # Fetch first name of user
    def getUserFirstName(self, userID):
        """Retrieves the first name of the user"""
        try:
            user = User.query.get(userID)
            if user:
                return {
                    "status": "Success",
                    "statusCode": 200,
                    "message": "User first name retrieved successfully",
                    "data": {
                        "userID": userID,
                        "firstName": user.firstName
                    }
                }
            else:
                return {
                    "status": "Failed",
                    "statusCode": 404,
                    "message": f"User not found"
                }
        except Exception as e:
            return self.handleError(e, "User Firsname retrieval")


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
                    "message": f"User not found"
                }
        except Exception as e:
            return self.handleError(e, "balance retrieval")

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
                    "message": f"User not found"
                }
        except Exception as e:
            return self.handleError(e, "previous balance retrieval")
        
    #Checks if a new goal allocation exceeds 100%, and updates it if valid.
    def checkAndAddGoalAllocation(self, userID, percentageAllocation):
        
        try:
            user = User.query.get(userID)
            if not user:
                return {
                    "status": "Failed",
                    "statusCode": 404,
                    "message": "User not found"
                }

            currentAllocation = user.goalAllocationPercent

            # Check if the new allocation exceeds 100%
            if currentAllocation + percentageAllocation > 100:
                if currentAllocation == 100:
                    message = "Allocation limit reached. You cannot allocate any more!"
                else:
                    message = f"Allocation exceeds limit. You can only allocate {100 - currentAllocation:.2f}% more."
                return {
                    "status": "Failed",
                    "statusCode": 400,
                    "message": message
                }
            else:
                user.goalAllocationPercent += percentageAllocation
                db.session.commit()
                return {
                    "status": "Success",
                    "statusCode": 200,
                    "message": "Allocation updated successfully",
                    "newAllocation": user.goalAllocationPercent
                }

        except Exception as e:
            db.session.rollback()
            return self.handleError(e, "goal allocation update")
        
    # Get the last 5 expenses of a user.
    def getLastFiveExpenses(self, userID):
        try:
            user = User.query.get(userID)
            if not user:
                return {
                    "status": "Failed",
                    "statusCode": 404,
                    "message": f"User not exist"
                }

            # Fetching last 5 expense records ordered by date
            expenses = Expense.query.filter_by(userId=userID).order_by(Expense.date.desc()).limit(5).all()

            transaction = [
                        {"category": expense.category, "amount": expense.amount}
                        for expense in expenses
                    ]

            return {
                "status": "Success",
                "statusCode": 200,
                "data": {
                    "transaction": transaction
                }
            }

        except Exception as e:
            return self.handleError(e, "fetching recent expenses")

    # Get all goals created by a user
    def getGoalsByUserId(self, userID):
        """Fetches all goals for a given user ID"""
        try:
            goals = Goal.query.filter_by(userId=userID).all()
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
            return self.handleError(e, "fetching user goals")

    # Get all expense entries for a user
    def getMonthlyExpenses(self, userID):
        """Fetches all expenses for a given user ID"""
        try:
            # Get the current year
            current_year = datetime.now().year

            # Filter expenses by user ID and the current year
            expenses = Expense.query.filter(
            Expense.userId == userID,
            extract('year', Expense.date) == current_year
        ).all()
            expensesData = [
                {
                    "expenseID": expense.id,
                    "category": expense.category,
                    "amount": expense.amount,
                    "date": expense.date.strftime("%Y-%m-%d"),
                    "weekStartDate": expense.weekStartDate.strftime("%Y-%m-%d"),
                } for expense in expenses
            ]
            return {
                "status": "Success",
                "statusCode": 200,
                "data": expensesData
            }
        except Exception as e:
            return self.handleError(e, "fetching monthly expenses")

    # Get the most recent salary received by user
    def getLastSalary(self, userID):
        """Fetches latest salary entry and total salary amount for the same month"""
        try:
            lastSalary = Salary.query.filter_by(userId=userID).order_by(Salary.salaryDate.desc()).first()
            
            if lastSalary:
                year = lastSalary.salaryDate.year
                month = lastSalary.salaryDate.month

                monthlyTotal = (
                    Salary.query
                    .filter_by(userId=userID)
                    .filter(db.extract('year', Salary.salaryDate) == year)
                    .filter(db.extract('month', Salary.salaryDate) == month)
                    .with_entities(db.func.sum(Salary.amount))
                    .scalar() or 0
                )

                return {
                    "status": "Success",
                    "statusCode": 200,
                    "data": {
                        "amount": monthlyTotal,
                        "salaryDate": lastSalary.salaryDate.strftime("%Y-%m-%d"),
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
            return self.handleError(e, "fetching salary information")
        
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
                timeDuration=float(data["timeDuration"]),
                percentageAllocation=float(data["percentageAllocation"])
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
            return self.handleError(e, "creating new goal")
        
    #Fetching usernames, first names, last names, and IDs of all users except the given userID    
    def getUsernamesAndIDs(self, userID, query):
        try:
            # Prepare lowercase query for case-insensitive search
            query = (query or "").strip().lower()

            # Filter users (excluding current user)
            users = User.query.filter(User.id != userID).all()

            # Filter based on firstName + lastName containing the query
            filteredUsers = [
                user for user in users
                if query in (user.firstName + user.lastName).lower()
            ]

            userData = [
                {
                    "userID": user.id,
                    "username": user.username,
                    "firstName": user.firstName,
                    "lastName": user.lastName
                }
                for user in filteredUsers
            ]

            return {
                "status": "Success",
                "statusCode": 200,
                "data": userData
            }

        except Exception as e:
            return self.handleError(e, "Fetching username and id")

    # Update the previous account balance for a given user
    def updatePreviousBalance(self, userID, newBalance):
        """Updates the previous account balance for the specified user"""
        try:
            user = User.query.get(userID)
            if not user:
                return {
                    "status": "Failed",
                    "statusCode": 404,
                    "message": f"User not found"
                }

            user.previousBalance = float(newBalance)
            db.session.commit()

            return {
                "status": "Success",
                "statusCode": 200,
                "message": f"Previous balance updated to {newBalance} for user."
            }

        except Exception as e:
            db.session.rollback()
            return self.handleError(e, "Updaying previous balance")
        
    # Add a new salary entry for a user
    def addSalary(self, userID, amount, salaryDate):
        """Adds a new salary entry for the specified user"""
        try:
            user = User.query.get(userID)
            if not user:
                return {
                    "status": "Failed",
                    "statusCode": 404,
                    "message": f"User not found"
                }

            newSalaryId = self.getLastId(Salary) + 1

            newSalary = Salary.addSalary(
            id=newSalaryId,
            userId=userID,
            amount=amount,
            salaryDate=salaryDate
                    )

            db.session.add(newSalary)
            db.session.commit()

            return {
                "status": "Success",
                "statusCode": 200,
                "message": f"Salary of {amount} added.",
                "data": {
                    "salaryID": newSalaryId,
                    "userID": userID,
                    "amount": amount,
                    "salaryDate": salaryDate.strftime("%Y-%m-%d")
                }
            }

        except Exception as e:
            db.session.rollback()
            return self.handleError(e, "add salary")

    # Update the account balance for a given user
    def updateAccountBalance(self, userID, newBalance):
        """Updates the current account balance for the specified user"""
        try:
            user = User.query.get(userID)
            if not user:
                return {
                    "status": "Failed",
                    "statusCode": 404,
                    "message": f"User not nfound"
                }

            user.accountBalance = float(newBalance)
            db.session.commit()

            return {
                "status": "Success",
                "statusCode": 200,
                "message": f"Account balance updated to {newBalance}"
            }

        except Exception as e:
            db.session.rollback()
            return self.handleError(e, "Updating account balance")
        
    # Add a new expense to the database
    def addNewExpense(self,userId, amount, category, date,startOfWeek):
        """Adds a new expense with an auto-incremented ID (no description)"""
        try:
            newId = (db.session.query(Expense).order_by(Expense.id.desc()).first().id + 1) if db.session.query(Expense).first() else 1

            newExpense = Expense(
                id=newId,
                userId=userId,
                amount=amount,
                category=category,
                date=date,
                weekStartDate=startOfWeek
            )

            db.session.add(newExpense)
            db.session.commit()

            return {
                "status": "Success",
                "statusCode": 200,
                "message": "Expense added successfully",
                "data": {
                    "expenseId": newId,
                    "userId": userId,
                    "amount": amount,
                    "category": category,
                    "date": date
                }
            }

        except Exception as e:
            return self.handleError(e, "Adding new expense")
        
    # Get all expense entries for a user
    # def getUserExpenses(self, userID):
    #     """Fetches all expenses for a given user ID"""
    #     try:
    #         expenses = Expense.query.filter_by(userId=userID).all()
    #         expensesData = [
    #             {
    #                 "expenseID": expense.id,
    #                 "category": expense.category,
    #                 "amount": expense.amount,
    #                 "date": expense.date.strftime("%Y-%m-%d"),
    #                 "weekStartDate": expense.weekStartDate.strftime("%Y-%m-%d")
    #             } for expense in expenses
    #         ]
    #         return {
    #             "status": "Success",
    #             "statusCode": 200,
    #             "data": expensesData
    #         }
    #     except Exception as e:
    #         return {
    #             "status": "Failed",
    #             "statusCode": 400,
    #             "message": "Error : " + str(e)
    #         }
        
    # Get all salary entries for a user
    def getUserSalaries(self, userID):
        """Fetches all salaries for a given user ID"""
        try:
            salaries = Salary.query.filter_by(userId=userID).all()
            salaryData = [
                {
                    "salaryID": salary.id,
                    "amount": salary.amount,
                    "salaryDate": salary.salaryDate.strftime("%Y-%m-%d")
                } for salary in salaries
            ]
            return {
                "status": "Success",
                "statusCode": 200,
                "data": salaryData
            }
        except Exception as e:
            return self.handleError(e, "Fetching user salaries")

    #Checks if the senderID and receiverID is present in DB.
    def validateUsersExist(self, senderID, receiverID):
        """Validates both sender and receiver users exist in the database"""
        try:
            # Validate sender exists
            sender = User.query.filter_by(id=senderID).first()
            if not sender:
                return {
                    "status": "Failed",
                    "statusCode": 404,
                    "message": "Sender account not found. Please check the user ID.",
                    "sender": None,
                    "receiver": None
                }

            # Validate receiver exists
            receiver = User.query.filter_by(id=receiverID).first()
            if not receiver:
                return {
                    "status": "Failed",
                    "statusCode": 404,
                    "message": "Recipient account not found. Please check the user ID.",
                    "sender": None,
                    "receiver": None
                }

            return {
                "status": "Success",
                "statusCode": 200,
                "message": "Both users validated successfully",
                "sender": sender,
                "receiver": receiver
            }

        except Exception as e:
            # Use centralized error handler for unexpected errors
            return self.handleError(e, "user validation")
    
    #The shared report is saved in the shareReport table with relevant sender details.
    def saveSharedReport(self, senderID, senderFirstName, senderLastName, receiverID, data):
        """Saves the shared report data to the ShareReport table"""
        try:
            newReport = ShareReport(
                senderID=senderID,
                senderFirstName=senderFirstName,
                senderLastName=senderLastName,
                receiverID=receiverID,
                data=data,
                sharedDate=datetime.now(),
                readFlag=0
            )
            db.session.add(newReport)
            db.session.commit()

            return {
                "status": "Success",
                "statusCode": 200,
                "message": "Report successfully saved",
                "data": None
            }

        except Exception as e:
            db.session.rollback()
            return self.handleError(e, "report sharing")
        
    #Returns the number of reports shared with the given userID
    def getReportNumber(self, userID):
        
        try:
            reportCount = ShareReport.query.filter_by(receiverID=userID).count()

            return {
                "status": "Success",
                "statusCode": 200,
                "data": {
                    "reportCount": reportCount
                }
            }
        except Exception as e:
            return {
                "status": "Failed",
                "statusCode": 400,
                "message": "Error: " + str(e)
            }
        
    #Fetches all sender details from shareReport table where receiverID equals the passed userID.
    def getSenderDetails(self, userID):
        
        try:
            senderRecords = ShareReport.query.filter_by(receiverID=userID).all()

            if not senderRecords:
                return {
                    "status": "Success",
                    "statusCode": 200,
                    "message": "No reports shared with this user.",
                    "data": []
                }

            senders = []
            for record in senderRecords:
                senders.append({
                    "reportId":record.id,
                    "senderID": record.senderID,
                    "senderFirstName": record.senderFirstName,
                    "senderLastName": record.senderLastName,
                    "sharedDate" : record.sharedDate.strftime("%Y-%m-%d %H:%M:%S")
                })

            return {
                "status": "Success",
                "statusCode": 200,
                "data": senders
            }

        except Exception as e:
            return self.handleError(e, "Fetching sender details")
        
    #Fetches the shared report based on receiver ID, sender ID, and shared date
    def getReportData(self, userID, senderID, reportID):
       
        try:
            report = ShareReport.query.filter_by(
                receiverID=userID,
                senderID=senderID,
                id=reportID
            ).first()

            if report:
                return {
                    "status": "Success",
                    "statusCode": 200,
                    "message": "Report found",
                    "data": report.data
                }
            else:
                return {
                    "status": "Failed",
                    "statusCode": 404,
                    "message": "No matching report found"
                }

        except Exception as e:
            return self.handleError(e, "report retrieval")
        
    # Fetches all unread shared report IDs for a specific user.
    # A report is considered unread if readFlag == 0 and the receiverID matches the given userId.    
    def getUnreadReportIds(self, userId):
        try:
            reports = ShareReport.query.filter_by(
                receiverID=userId,
                readFlag=0
            ).all()

            reportIds = [report.id for report in reports]

            return {
                "status": "Success",
                "statusCode": 200,
                "message": f"Found {len(reportIds)} unread report(s)",
                "data": {
                    "unreadReportIds": reportIds
                }
            }

        except Exception as e:
            return self.handleError(e, "Fetching unread report ids")
        
    # Returns the count of unread shared reports for a specific user.
    # A report is considered unread if readFlag == 0 and receiverID matches the given userId.
    def getUnreadReportCount(self, userId):
        try:
            reportCount = ShareReport.query.filter_by(
                receiverID=userId,
                readFlag=0
            ).count()

            return {
                "status": "Success",
                "statusCode": 200,
                "message": f"Unread report count fetched successfully",
                "reportCount": reportCount
                
            }

        except Exception as e:
            return self.handleError(e, "Fetching unread report count")
        

    # Updates the readFlag for the given reportID to 1.
    def markReportAsRead(self, userId, reportId):
        try:
            report = ShareReport.query.filter_by(
                id=reportId,
                receiverID=userId
            ).first()

            if report:
                report.readFlag = 1
                db.session.commit()
                return {
                    "status": "Success",
                    "statusCode": 200,
                    "message": f"Report ID {reportId} marked as read"
                }
            else:
                return {
                    "status": "Failed",
                    "statusCode": 404,
                    "message": f"No unread report found for user ID {userId} and report ID {reportId}"
                }

        except Exception as e:
            db.session.rollback()
            return self.handleError(e, "marking report as read")













