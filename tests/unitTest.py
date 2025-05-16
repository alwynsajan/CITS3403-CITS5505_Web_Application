import unittest
from datetime import datetime, timedelta
import sys
import os
from models import db,User
from app import app
from werkzeug.security import generate_password_hash
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))
from flask import json


from calculations import (
    getAccountData, getGoalProgress, getMonthlyExpenseList,
    calculate_50_30_20_Percentages, getStartOfWeek,
    getMonthlySalaryList, getExpensePageData
)

class TestBudgetFunctions(unittest.TestCase):

    # Test if the checkPassword method correctly validates a matching password
    def testCheckPasswordCorrect(self):
        password = "mySecret123"
        user = User(
            username="testuser",
            password=generate_password_hash(password),
            firstName="John",
            lastName="Doe"
        )
        self.assertTrue(user.checkPassword("mySecret123"))

    # Test if the checkPassword method correctly identifies an incorrect password
    def testCheckPasswordIncorrect(self):
        password = "mySecret123"
        user = User(
            username="testuser",
            password=generate_password_hash(password),
            firstName="John",
            lastName="Doe"
        )
        self.assertFalse(user.checkPassword("wrongPassword"))

    # Test 50/30/20 rule budget allocation with a given salary
    def testCalculateBudgetPercentages(self):
        salary = 1000
        result = calculate_50_30_20_Percentages(salary)
        self.assertEqual(result["needs"], 500)
        self.assertEqual(result["wants"], 300)
        self.assertEqual(result["savings"], 200)

    # Test if getStartOfWeek returns the correct Monday for a given date
    def testGetStartOfWeek(self):
        date = "2025-05-08"  # Thursday
        result = getStartOfWeek(date)
        self.assertEqual(result.weekday(), 0)  # Monday
        self.assertEqual(result.strftime("%Y-%m-%d"), "2025-05-05")

    # Test account data trend detection when current balance is higher (trend is up)
    def testGetAccountDataUp(self):
        result = getAccountData(1200, 1000)
        self.assertEqual(result["trendType"], "up")
        self.assertAlmostEqual(result["percentageChange"], 20.0)

    # Test account data trend detection when current balance is lower (trend is down)
    def testGetAccountDataDown(self):
        result = getAccountData(800, 1000)
        self.assertEqual(result["trendType"], "down")
        self.assertAlmostEqual(result["percentageChange"], -20.0)

    # Test goal progress when the goal has been fully met
    def testGoalProgressMet(self):
        goalData = [{
            "goalName": "Emergency Fund",
            "targetAmount": 500,
            "percentageAllocation": 50,
            "timeDuration": 5
        }]
        result = getGoalProgress(goalData, 2000)
        self.assertEqual(result[0]["progressPercentage"], 100)
        self.assertEqual(result[0]["remaining"], 0)
        self.assertEqual(result[0]["message"], "Congratulations, Goal met!!")

    # Test goal progress when the goal has not yet been met
    def testGoalProgressUnmet(self):
        goalData = [{
            "goalName": "Vacation",
            "targetAmount": 1000,
            "percentageAllocation": 25,
            "timeDuration": 10
        }]
        result = getGoalProgress(goalData, 2000)
        self.assertLess(result[0]["progressPercentage"], 100)
        self.assertIn("Save at least", result[0]["message"])

    # Test grouping of expenses into monthly totals
    def testGetMonthlyExpenseList(self):
        expenses = [
            {"date": "2025-01-10", "amount": 200},
            {"date": "2025-01-15", "amount": 300},
            {"date": "2025-02-05", "amount": 150}
        ]
        result = getMonthlyExpenseList(expenses)
        self.assertEqual(result[0], 500)
        self.assertEqual(result[1], 150)
        self.assertEqual(result[len(result)-1], 0)

    # Test grouping of salary data into monthly totals
    def testGetMonthlySalaryList(self):
        salaryData = [
            {"salaryDate": "2025-01-05", "amount": 2000},
            {"salaryDate": "2025-01-20", "amount": 1500},
            {"salaryDate": "2025-02-10", "amount": 1800}
        ]
        result = getMonthlySalaryList(salaryData)
        self.assertEqual(result[0], 3500)
        self.assertEqual(result[1], 1800)

    # Test comprehensive expense analysis including monthly, weekly, and category-wise grouping
    def testGetExpensePageData(self):
        today = datetime.today().date()
        expenseData = [
            {
                "date": today.strftime("%Y-%m-%d"),
                "amount": 100,
                "category": "Food",
                "weekStartDate": (today - timedelta(days=today.weekday())).strftime("%Y-%m-%d")
            },
            {
                "date": (today - timedelta(days=30)).strftime("%Y-%m-%d"),
                "amount": 150,
                "category": "Travel",
                "weekStartDate": (today - timedelta(days=30 + (today - timedelta(days=30)).weekday())).strftime("%Y-%m-%d")
            }
        ]
        monthlyExpenseList, weeklyExpenseDict, categoryExpenseDict = getExpensePageData(expenseData)
        
        self.assertTrue(sum(monthlyExpenseList) >= 250)
        self.assertGreaterEqual(len(weeklyExpenseDict), 1)
        self.assertIn("Food", list(categoryExpenseDict.values())[0] or [])
