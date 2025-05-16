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
            usersToDelete = User.query.filter(User.username.like('test%')).all()
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

        # Wait until redirected and sidebar appears
        # WebDriverWait(self.driver, 5).until(
        #     EC.presence_of_element_located((By.ID, "expense"))
        # )
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

    # def testAddSalaryDashboard(self):
    #     self.login()  # Reuse existing login method

    #     # Go to dashboard page
    #     self.driver.get(localhostUrl + 'dashboard')

    #     # Wait for and click the "Add Salary" button
    #     add_salary_button = WebDriverWait(self.driver, 10).until(
    #         EC.element_to_be_clickable((By.CSS_SELECTOR, '.add-salary-btn'))
    #     )
    #     add_salary_button.click()

    #     # Wait for modal to appear (assuming modal inputs exist)
    #     amount_input = WebDriverWait(self.driver, 10).until(
    #         EC.visibility_of_element_located((By.ID, 'salaryAmount'))
    #     )
    #     date_input = self.driver.find_element(By.ID, 'salaryDate')
    #     save_button = self.driver.find_element(By.ID, 'saveSalaryBtn')

    #     # Fill in salary data
    #     amount_input.clear()
    #     amount_input.send_keys('2500')

    #     date_input.clear()
    #     date_input.send_keys('2025-05-15')  # ISO date format

    #     # Submit form
    #     save_button.click()

    #     # Wait for reload after submission
    #     WebDriverWait(self.driver, 10).until(
    #         EC.url_to_be(localhostUrl + 'dashboard')
    #     )

    #     # Confirm success by checking if balance card updates or toast appears
    #     balance = WebDriverWait(self.driver, 10).until(
    #         EC.presence_of_element_located((By.ID, 'balanceAmount'))
    #     )
    #     self.assertIn('$', balance.text)



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





    # def test_update_user_settings(self):
    #     driver = self.driver
    #     # Log in first
    #     username_field = driver.find_element(By.ID, "username")
    #     password_field = driver.find_element(By.ID, "password")
    #     login_button = driver.find_element(By.XPATH, "//button[text()='Login']")
        
    #     username_field.send_keys("testuser")
    #     password_field.send_keys("password123")
    #     login_button.click()

    #     time.sleep(2)  # Wait for login to complete

    #     # Go to settings page
    #     settings_link = driver.find_element(By.LINK_TEXT, "Settings")
    #     settings_link.click()

    #     # Update user name
    #     first_name_field = driver.find_element(By.ID, "firstName")
    #     last_name_field = driver.find_element(By.ID, "lastName")
    #     first_name_field.clear()
    #     last_name_field.clear()
    #     first_name_field.send_keys("Updated")
    #     last_name_field.send_keys("User")
        
    #     save_button = driver.find_element(By.XPATH, "//button[text()='Save Changes']")
    #     save_button.click()

    #     time.sleep(2)

    #     # Check if the changes are saved
    #     self.assertIn("Settings", driver.title)
    #     self.assertTrue("Updated" in driver.page_source)

if __name__ == '__main__':
    unittest.main()
