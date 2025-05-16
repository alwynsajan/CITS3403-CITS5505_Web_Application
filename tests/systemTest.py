import time
import unittest
import threading
from app import app
from models import db,User
from selenium import webdriver
from werkzeug.security import generate_password_hash
from selenium.webdriver.support.ui import WebDriverWait
from selenium.webdriver.support import expected_conditions as EC
from selenium.webdriver.common.by import By
from selenium.webdriver.chrome.options import Options


localhostUrl = "http://127.0.0.1:5000/"


class FlaskAppTest(unittest.TestCase):

    def setUp(self):
        # Start the Flask app in a separate thread
        self.serverThread = threading.Thread(target=app.run, kwargs={"use_reloader": False})
        self.serverThread.daemon = True
        self.serverThread.start()

        # Allow time for the server to start
        time.sleep(1)

        # Set Chrome options for headless mode
        chromeOptions = Options()
        chromeOptions.add_argument("--headless")
        chromeOptions.add_argument("--disable-gpu")
        chromeOptions.add_argument("--window-size=1920,1080")

        # Initialize WebDriver
        self.driver = webdriver.Chrome(options=chromeOptions)
        self.driver.get(localhostUrl)

        # Create test user
        with app.app_context():
            db.create_all()
            testUser = User.query.filter_by(username="testuser").first()
            if not testUser:
                newUser = self.createUser("testuser@gmail.com", "password123", "Test", "User")
                db.session.add(newUser)
                db.session.commit()

    def tearDown(self):
        self.driver.quit()

        # Clean up all users whose username starts with 'test'
        with app.app_context():
            usersToDelete = User.query.filter(User.username.like('%test%')).all()
            for user in usersToDelete:
                db.session.delete(user)
            db.session.commit()

    def createUser(self, username, password, firstName, lastName):
        """Helper method to create new user with hashed password"""
        return User(
            username=username,
            password=generate_password_hash(password),
            firstName=firstName,
            lastName=lastName
        )
    
    def login(self):
        self.driver.get(f"{localhostUrl}login")

        WebDriverWait(self.driver, 5).until(
            EC.presence_of_element_located((By.NAME, "username"))
        )
        self.driver.find_element(By.NAME, "username").send_keys("testuser@gmail.com")
        self.driver.find_element(By.NAME, "password").send_keys("password123")
        self.driver.find_element(By.ID, "submitBtn").click()

        time.sleep(10)


    def testLoginPageLoad(self):

        self.assertIn("Login", self.driver.title)

        usernameField = self.driver.find_element(By.ID, "username")
        passwordField = self.driver.find_element(By.ID, "password")
        loginButton = self.driver.find_element(By.ID, "submitBtn")

        self.assertTrue(usernameField.is_displayed())
        self.assertTrue(passwordField.is_displayed())
        self.assertTrue(loginButton.is_displayed())

    def testSuccessfulLogin(self):

        usernameField = self.driver.find_element(By.ID, "username")
        passwordField = self.driver.find_element(By.ID, "password")
        loginButton = self.driver.find_element(By.ID, "submitBtn")

        usernameField.send_keys("testuser@gmail.com")
        passwordField.send_keys("password123")
        loginButton.click()

        # Wait until the URL changes from the old one
        WebDriverWait(self.driver, 5).until( EC.url_changes(self.driver.current_url))

        # Check dashboard page is loaded
        self.assertIn(localhostUrl+"dashboard", self.driver.current_url)

    def testLoginFail(self):
        driver = self.driver

        usernameField = driver.find_element(By.ID, "username")
        passwordField = driver.find_element(By.ID, "password")
        loginButton = driver.find_element(By.ID, "submitBtn")

        # Enter invalid credentials
        usernameField.send_keys("invaliduser@gmail.com")
        passwordField.send_keys("wrongpassword")
        loginButton.click()

        # Wait for the error message element to appear (adjust timeout if needed)
        WebDriverWait(driver, 5).until(
            EC.visibility_of_element_located((By.CLASS_NAME, "alert-danger"))
        )

        errorMessage = driver.find_element(By.CLASS_NAME, "alert-danger")
        self.assertTrue(errorMessage.is_displayed())

    def testAccessDashboardWithoutLogin(self):
        driver = self.driver
        driver.get("http://localhost:5000/dashboard")

        # Verify if we're redirected to the login page
        self.assertIn("Login", driver.title)

    def testSignupFail(self):

        # Go to the signup page
        self.driver.get(localhostUrl+"signup")

        # Fill out the signup form
        self.driver.find_element(By.ID, "firstName").send_keys("New")
        self.driver.find_element(By.ID, "lastName").send_keys("User")
        self.driver.find_element(By.ID, "username").send_keys("testnewusergmail.com")
        self.driver.find_element(By.ID, "password").send_keys("newpassword123")
        self.driver.find_element(By.ID, "confirmPassword").send_keys("newpassword123")

        # Click the sign up button
        self.driver.find_element(By.ID, "signUpBtn").click()

        # Wait for possible page load or success message
        # WebDriverWait(self.driver, 5).until( EC.url_changes(self.driver.current_url))
        time.sleep(5)

        # Assert the title contains "Login" (meaning redirected to login page after signup)
        self.assertIn(localhostUrl+"signup", self.driver.current_url)

    def testExpenseNavigation(self):
        self.login()
        self.driver.find_element(By.ID, "expense").click()
        self.assertIn(localhostUrl+"expense", self.driver.current_url)

    def testSettingsNavigation(self):
        self.login()
        self.driver.find_element(By.ID, "settings").click()
        self.assertIn(localhostUrl+"settings", self.driver.current_url)

if __name__ == '__main__':
    unittest.main()
