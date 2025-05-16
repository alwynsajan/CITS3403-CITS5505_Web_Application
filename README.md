# 💰 Budget Analyzer Web Application

## 📋 Purpose

**Budget Analyzer** is a personal finance management web application designed to help users take control of their financial goals and expenses.  
It offers an intuitive dashboard to monitor expenses, set and track savings goals, visualize financial data, and receive budgeting recommendations based on intelligent algorithms like the **50/30/20 rule**.  
Users can export reports and get insights into their spending patterns to make smarter financial decisions.

---

## 💡 Features

In this section, all the features in the app will be introduced.

### 📝 Signup Page

The **Signup Page** allows new users to quickly create an account on WalletWhiz, commencing their journey to smarter financial management.

| 🔹 Field                             | 💡 Description                                                                                  |
| ------------------------------------ | ----------------------------------------------------------------------------------------------- |
| 👤 **First Name and Last Name**      | Input fields for users to enter their personal identification details.                          |
| 📧 **Email**                         | Field to enter a valid email address for account verification and communication.                |
| 🔒 **Password and Confirm Password** | Secure fields for entering and confirming a password to ensure account security.                |
| 🔘 **Create Account Button**         | A button to submit the signup form and create a new account.                                    |
| 🔗 **Sign In Link**                  | A hyperlink for existing users to navigate to the sign-in page if they already have an account. |

![Signup Screenshot](http://127.0.0.1:5000/signup)

### 🔑 Sign In Page

The **Sign In Page** allows existing users to access their WalletWhiz accounts, providing a seamless and secure login experience.

| 🔹 Field                    | 💡 Description                                                                          |
| --------------------------- | --------------------------------------------------------------------------------------- |
| 📧 **Email**                | Field for users to enter their registered email address for authentication.             |
| 🔒 **Password**             | Secure field to enter the account password ensuring user privacy and security.          |
| 🔗 **Forgot Password Link** | Option to reset the password in case the user has forgotten it.                         |
| 🔘 **Sign In Button**       | A button to submit the login credentials and access the account.                        |
| 🔗 **Sign Up Link**         | A link for new users to navigate to the sign-up page if they don't have an account yet. |

![Sign In Screenshot](http://127.0.0.1:5000/login)

### 📊 Dashboard Module

The **Dashboard** is the main landing page after login, providing users with a quick overview of their financial status and tools to manage their finances efficiently. It includes the following cards:

| 🔹 Section          | 💡 Description                                                                                   |
| ------------------- | ------------------------------------------------------------------------------------------------ |
| 💼 **Balance**      | Quickly add your salary to update your current financial balance and growth tracker.             |
| 🎯 **Goal**         | Set, view, and manage personal savings goals. Stay motivated by tracking progress visually.      |
| 📊 **Budget**       | Receive personalized budget recommendations based on the **50/30/20 rule** once salary is added. |
| 💸 **Spending**     | Analyze your monthly expenses trends. Visualizes your spending patterns and changes over time.   |
| 🔄 **Transactions** | Track and review your recent expenses and transactions to stay on top of your spending history.  |

#### 🎨 Example UI (Dashboard)

![Dashboard Screenshot](http://127.0.0.1:5000/dashboard)

### 💰 Expenses Module

The **Expenses** page allows users to actively manage their income and expenses while visualizing trends and patterns. It provides both data entry and visualization tools.

| 🔹 Section                            | 💡 Description                                                                                                    |
| ------------------------------------- | ----------------------------------------------------------------------------------------------------------------- |
| ➕ **Add Expense**                    | Users can quickly log a new expense by entering the amount, selecting a category, and setting a date.             |
| 💵 **Add Salary (Quick Add)**         | Allows adding salary directly from the Expenses page, updating financial balance for accurate tracking.           |
| 📈 **Weekly Expenses (Last 8 Weeks)** | View spending patterns over the past 8 weeks. If no expenses exist, the module prompts to start logging expenses. |
| 🥧 **Monthly Category Breakdown**     | Visualizes how expenses are distributed across different categories in the current month.                         |

#### 🎨 Example UI (Expenses Module)

![Expenses Screenshot](http://127.0.0.1:5000/expense)

### 🔄 Share Financial Reports

The **Share Financial Reports** feature allows users to share financial insights with others seamlessly. This feature enhances collaboration and transparency among users.

| 🔹 Action                     | 💡 Description                                                                                                            |
| ----------------------------- | ------------------------------------------------------------------------------------------------------------------------- |
| 📤 **Share Your Report**      | Users can search for other users by name or email to share their financial reports.                                       |
| 📥 **Reports Shared With Me** | View a list of reports that have been shared with you, along with details of the sender and timestamp.                    |
| 📈 **View Financial Report**  | Access detailed financial reports shared with you, providing insights into salary versus expenses and category breakdown. |

Detailed view of the financial report received, showing a monthly salary vs. expenses chart, weekly spending insights, and a monthly category breakdown.

### ⚙️ Settings Module

The **Settings** page empowers users to manage their personal account details securely and intuitively. It is structured into separate sections for easy navigation and clarity.

| 🔹 Section                     | 💡 Description                                                                                                                |
| ------------------------------ | ----------------------------------------------------------------------------------------------------------------------------- |
| 👤 **Update Name**             | Users can update their **First Name** and **Last Name** within a dedicated form card.                                         |
| 🔐 **Change Password**         | Users can change their password by entering the **Current Password**, **New Password**, and confirming it in a separate card. |
| ✅ **Validation and Feedback** | The app ensures validation for all inputs and provides clear feedback messages upon success or failure.                       |

#### 🎨 Example UI (Settings Module)

![Settings Screenshot](http://127.0.0.1:5000/settings)

---

## 👥 Group Members

| UWA ID   | Name              | GitHub Username |
| -------- | ----------------- | --------------- |
| 24504806 | Alwyn Sajan       | alwynsajan      |
| 24177393 | Neel Rakesh Patel | NeelPatel-22    |
| 23861854 | Ashley Song       | aaaaashleysong  |
| 24113613 | Yuxuan Zhang      | Zhangyuxuan323  |

---

## 🚀 How to Launch the Application

### Prerequisites:

- Python 3.10+

### Steps:

```bash
# 1. Clone the repository
git clone https://github.com/alwynsajan/CITS3403-CITS5505_Web_Application/tree/Analyzer_1.000v
cd YOUR_REPO

# 2. Install required dependencies
pip install -r requirements.txt

# 3. Set up environment variable for Flask secret key (IMPORTANT)
# Example in Windows PowerShell
$env:ANALYSER_SECRET_KEY = "ANALYSER_SECRET_KEY"

# Example in Linux/Mac
export SECRET_KEY="ANALYSER_SECRET_KEY"

# 4. Run the application
python app.py
```

## 🧪 Testing the Application

Set up the environment and execute tests on the WalletWhiz web application with the following steps:

```bash
#1. Set the environment variable for application analysis:

   `$env:ANALYSER_SECRET_KEY = "ANALYSER_SECRET_KEY"`

#2. Run Unit Tests to verify individual components:

   `python -m unittest tests.unitTest`

#3. Execute Selenium Tests to simulate user interactions:

   `python -m unittest tests.systemTest`
```

Following these steps ensures thorough testing of the application, verifying both component functionality and system stability.

## 📄 License

This project is licensed under the MIT License. This allows for wide use and distribution with minimal restrictions.

## 📧 Contact

For questions, feedback, or contributions, please feel free to reach out:

- **Email**: 24113613@student.uwa.edu.au

We welcome your input and are here to assist with any inquiries related to the WalletWhiz application.
