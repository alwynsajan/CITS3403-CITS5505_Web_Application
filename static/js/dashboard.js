/**
 * Smart Budget Dashboard JavaScript - Modernized Version
 * This file handles all interactive elements of the dashboard with enhanced animations
 */

// Store any data passed from backend
// These variables should be declared in HTML with var keyword to avoid scope issues
// var monthlyLabels = [];
// var monthlyExpenses = [];
// var goalData = [];

// Store initial goal count for reload logic
let initialGoalCount = window.goalData?.length || 0;

// DOM ready handler
document.addEventListener('DOMContentLoaded', function() {
    console.log('Dashboard JS loaded');
    
    // Check if variables were passed from HTML
    console.log('Monthly data:', { 
        monthlyLabels: window.monthlyLabels || [], 
        monthlyExpenses: window.monthlyExpenses || [] 
    });
    
    console.log('Goal data:', window.goalData || []);
    
    // Initialize components with loading animations
    setTimeout(function() {
        initMonthlySpendingChart();
        initGoalProgress();
        // initSalaryVsExpensesChart(); // Removed: barChart ID is not in dashboard.html
        // setupEventListeners();       // Removed: Function not defined in this file; specific listeners handled below or elsewhere
        
        animateCards();
        // setupAddSalaryButton(); // Removed: Functionality handled by DOMContentLoaded listener around line 1269

        // Setup listener for the New Goal button
        const newGoalButton = document.getElementById('newGoalBtn');
        const goalModalElement = document.getElementById('goalModal');
        if (newGoalButton && goalModalElement) {
            const goalModal = new bootstrap.Modal(goalModalElement);
            newGoalButton.addEventListener('click', function() {
                goalModal.show();
            });
        }
        // Ensure saveGoalBtn listener is attached if the button exists (it's also in saveNewGoal, but good to be robust)
        const saveGoalButton = document.getElementById('saveGoalBtn');
        if (saveGoalButton) {
            saveGoalButton.addEventListener('click', saveNewGoal); // saveNewGoal is defined around line 939
        }

        // Add entrance animations to cards
        animateCards();
    }, 300); // Small delay for smoother rendering

    // Hide unread report count by default when page loads
    $('#unreadReportCount').hide();

    // Initial load of unread count
    fetchUnreadReportCount();
    
    // Set up "Shared with me" button click event
    setupSharedWithMeButton();
    
    // Setup active navigation state
    setupActiveNavigation();
    
    // Setup Share Summary button
    setupShareSummaryButton();
});

/**
 * Fetch unread report count
 */
function fetchUnreadReportCount() {
    fetch('/dashboard/getUnreadReportCount')
        .then(response => {
            if (!response.ok) {
                throw new Error('Network response was not ok');
            }
            return response.json();
        })
        .then(data => {
            if (data.status === "Success") {
                const unreadCount = data.reportCount || 0;
                const unreadCountElement = document.getElementById('unreadReportCount');
                
                if (unreadCountElement) {
                    unreadCountElement.textContent = unreadCount > 99 ? '99+' : unreadCount;
                    
                    // Only display count if there are unread messages
                    if (unreadCount > 0) {
                        unreadCountElement.style.display = 'flex';
                        unreadCountElement.style.alignItems = 'center';
                        unreadCountElement.style.justifyContent = 'center';
                    } else {
                        unreadCountElement.style.display = 'none';
                    }
                }
            }
        })
        .catch(error => {
            console.error('Error fetching unread report count:', error);
        });
}

/**
 * Set up "Shared with me" button click event
 */
function setupSharedWithMeButton() {
    const sharedWithMeBtn = document.getElementById('sharedWithMeBtn');
    
    if (sharedWithMeBtn) {
        sharedWithMeBtn.addEventListener('click', function() {
            // Show loading animation
            const modal = new bootstrap.Modal(document.getElementById('sharedReportsModal'));
            modal.show();
            
            // Fetch shared reports list
            fetchSharedReports();
        });
    }
}

/**
 * Fetch shared reports list
 */
function fetchSharedReports() {
    const reportsContainer = document.getElementById('sharedReportsContainer');
    
    if (!reportsContainer) return;
    
    // Show loading indicator
    reportsContainer.innerHTML = `
        <div class="text-center py-4">
            <div class="spinner-border text-primary" role="status">
                <span class="visually-hidden">Loading...</span>
            </div>
            <p class="mt-2">Loading shared reports...</p>
        </div>
    `;
    
    // Send request to fetch report list
    fetch('/dashboard/getSenderDetails')
        .then(response => {
            if (!response.ok) {
                throw new Error('Network response was not ok');
            }
            return response.json();
        })
        .then(data => {
            // Update unread count (possibly read)
            fetchUnreadReportCount();
            
            // Process response data
            if (data.status === "Success") {
                if (!data.data || data.data.length === 0) {
                    // If no messages, display a friendly prompt
                    reportsContainer.innerHTML = `
                        <div class="text-center py-4">
                            <i class="fas fa-inbox fa-3x text-muted mb-3"></i>
                            <p class="text-muted">No shared reports yet.</p>
                        </div>
                    `;
                } else {
                    displaySharedReports(data.data);
                }
            } else {
                throw new Error('Failed to fetch shared reports');
            }
        })
        .catch(error => {
            console.error('Error fetching shared reports:', error);
            
            // Show error message
            reportsContainer.innerHTML = `
                <div class="text-center py-4">
                    <i class="fas fa-exclamation-circle fa-3x text-danger mb-3"></i>
                    <p class="text-danger">Could not load shared reports. Please try again later.</p>
                    <button class="btn btn-outline-primary btn-sm mt-2" onclick="fetchSharedReports()">
                        <i class="fas fa-sync-alt"></i> Retry
                    </button>
                </div>
            `;
        });
}

/**
 * Display shared reports list
 * @param {Array} senders - Array of sender objects
 */
function displaySharedReports(senders) {
    const reportsContainer = document.getElementById('sharedReportsContainer');
    
    if (!reportsContainer) return;
    
    // If no reports, display no data message
    if (!senders || senders.length === 0) {
        reportsContainer.innerHTML = `
            <div class="text-center py-4">
                <i class="fas fa-folder-open fa-3x text-muted mb-3"></i>
                <p class="text-muted">No shared reports yet.</p>
            </div>
        `;
        return;
    }
    
    // Create sender list
    let html = `<div class="list-group">`;
    
    senders.forEach(sender => {
        // Format date display
        const sharedDate = new Date(sender.sharedDate);
        const formattedDate = sharedDate.toLocaleDateString() + ' ' + sharedDate.toLocaleTimeString();
        
        html += `
            <a href="#" class="list-group-item list-group-item-action d-flex justify-content-between align-items-center" 
               data-sender-id="${sender.senderID}" onclick="viewSharedReport(${sender.senderID}); return false;">
                <div>
                    <div class="d-flex align-items-center">
                        <strong>${sender.senderFirstName} ${sender.senderLastName}</strong>
                    </div>
                    <small>
                        <i class="far fa-clock ms-2 me-1"></i> ${formattedDate}
                    </small>
                </div>
                <span class="badge bg-primary rounded-pill">
                    <i class="fas fa-eye"></i> View Report
                </span>
            </a>
        `;
    });
    
    html += `</div>`;
    reportsContainer.innerHTML = html;
}

/**
 * View shared report
 * @param {number} senderID - Sender ID
 */
function viewSharedReport(senderID) {
    // Check if a modal view exists, otherwise create a new page
    const hasModalView = document.getElementById('sharedReportViewModal');
    
    if (hasModalView) {
        const modalBody = document.getElementById('sharedReportViewBody');
        const modalTitle = document.getElementById('sharedReportViewTitle');
        
        if (!modalBody || !modalTitle) return;
        
        // Show loading animation
        modalBody.innerHTML = `
            <div class="text-center py-4">
                <div class="spinner-border text-primary" role="status">
                    <span class="visually-hidden">Loading...</span>
                </div>
                <p class="mt-2">Loading report...</p>
            </div>
        `;
        
        // Close shared reports list modal
        const sharedReportsModal = bootstrap.Modal.getInstance(document.getElementById('sharedReportsModal'));
        if (sharedReportsModal) {
            sharedReportsModal.hide();
        }
        
        // Show report view modal
        const viewModal = new bootstrap.Modal(document.getElementById('sharedReportViewModal'));
        viewModal.show();
    }
    
    // Create current user ID (in a real application, this might be fetched from session or global variable)
    // Assuming there's a global variable currentUserID here
    const currentUserID = window.currentUserID || 1; // Default value is 1, should be replaced with actual value
    
    // Send request to fetch report details
    fetch('/dashboard/getSharedReport', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({
            senderID: senderID,
            recipientID: currentUserID
        })
    })
    .then(response => {
        if (!response.ok) {
            throw new Error('Network response was not ok');
        }
        return response.json();
    })
    .then(data => {
        // Update unread count (read)
        fetchUnreadReportCount();
        
        // If using modal display
        if (hasModalView) {
            const modalBody = document.getElementById('sharedReportViewBody');
            const modalTitle = document.getElementById('sharedReportViewTitle');
            
            // Update modal title
            modalTitle.textContent = `Report from ${data.senderFirstName} ${data.senderLastName}`;
            
            // Create sender information display
            let senderInfo = `
                <div class="alert alert-info d-flex align-items-center mb-4">
                    <i class="fas fa-user-circle fa-2x me-3"></i>
                    <div>
                        <strong>Shared by:</strong> ${data.senderFirstName} ${data.senderLastName}
                    </div>
                </div>
            `;
            
            // Display dashboard report data
            if (data.dashboardData) {
                modalBody.innerHTML = senderInfo + createDashboardReportHTML(data.dashboardData);
            } 
            // Display expense report data
            else if (data.expenseData) {
                modalBody.innerHTML = senderInfo + createExpenseReportHTML(data.expenseData);
            }
            // If both data types exist, prioritize dashboard data
            else if (data.dashboardData && data.expenseData) {
                modalBody.innerHTML = senderInfo + createDashboardReportHTML(data.dashboardData);
            }
            // No data or format mismatch
            else {
                modalBody.innerHTML = `
                    <div class="text-center py-4">
                        <i class="fas fa-exclamation-circle fa-3x text-warning mb-3"></i>
                        <p class="text-warning">The report format is not supported or contains no data.</p>
                    </div>
                `;
            }
        } else {
            // If display in a new page is needed, navigate to another page via window.location
            // Or create page elements dynamically
            // Example implementation: store data in sessionStorage and navigate to a dedicated page
            sessionStorage.setItem('sharedReportData', JSON.stringify(data));
            window.location.href = '/shared-report-view';
        }
    })
    .catch(error => {
        console.error('Error fetching report details:', error);
        
        if (hasModalView) {
            const modalBody = document.getElementById('sharedReportViewBody');
            
            // Show error message
            modalBody.innerHTML = `
                <div class="text-center py-4">
                    <i class="fas fa-exclamation-circle fa-3x text-danger mb-3"></i>
                    <p class="text-danger">Could not load report details. Please try again later.</p>
                    <button class="btn btn-outline-primary btn-sm mt-2" onclick="viewSharedReport(${senderID})">
                        <i class="fas fa-sync-alt"></i> Retry
                    </button>
                </div>
            `;
        }
    });
}

/**
 * Create HTML content for dashboard report
 * @param {Object} dashboardData - Dashboard data
 * @returns {string} HTML content
 */
function createDashboardReportHTML(dashboardData) {
    // Check if account data exists
    const hasAccountBalance = dashboardData.hasAccountBalance && dashboardData.accountData;
    const hasGoals = dashboardData.hasGoal && dashboardData.goalData && dashboardData.goalData.length > 0;
    const hasMonthlyData = dashboardData.hasExpense && dashboardData.monthlySpendData;
    const hasBudget = dashboardData.hasSalary && dashboardData.budgetSuggestionData;
    
    let html = `<div class="dashboard-report">`;
    
    // Account balance card
    if (hasAccountBalance) {
        const accountData = dashboardData.accountData;
        html += `
            <div class="card border-0 shadow-sm mb-4">
                <div class="card-body">
                    <h5 class="card-title">Account Balance</h5>
                    <div class="text-center py-3">
                        <div class="display-5 mb-2" style="color:var(--primary-color);font-weight:700;">
                            $${accountData.balance.toFixed(2)}
                        </div>
                        <div>
                            <span class="badge bg-${accountData.trendType === 'up' ? 'success' : 'danger'} me-2">
                                <i class="fas fa-arrow-${accountData.trendType}"></i>
                                ${accountData.percentageChange}%
                            </span>
                            <div class="text-muted small mt-1">from last update</div>
                        </div>
                    </div>
                </div>
            </div>
        `;
    }
    
    // Goal progress card
    if (hasGoals) {
        const goalData = dashboardData.goalData[0]; // Display the first goal
        html += `
            <div class="card border-0 shadow-sm mb-4">
                <div class="card-body">
                    <h5 class="card-title">Goal Progress: ${goalData.goalName}</h5>
                    <div class="text-center py-3">
                        <div class="progress mb-3" style="height: 20px;">
                            <div class="progress-bar" role="progressbar" style="width: ${goalData.progressPercentage}%;" 
                                aria-valuenow="${goalData.progressPercentage}" aria-valuemin="0" aria-valuemax="100">
                                ${goalData.progressPercentage}%
                            </div>
                        </div>
                        <div class="row g-3 text-center">
                            <div class="col-md-4">
                                <div class="border rounded p-2">
                                    <div class="small text-muted">Target</div>
                                    <div class="fw-bold">$${goalData.target}</div>
                                </div>
                            </div>
                            <div class="col-md-4">
                                <div class="border rounded p-2">
                                    <div class="small text-muted">Saved</div>
                                    <div class="fw-bold">$${goalData.saved}</div>
                                </div>
                            </div>
                            <div class="col-md-4">
                                <div class="border rounded p-2">
                                    <div class="small text-muted">Remaining</div>
                                    <div class="fw-bold">$${goalData.remaining}</div>
                                </div>
                            </div>
                        </div>
                        ${goalData.message ? `<div class="alert alert-info mt-3">${goalData.message}</div>` : ''}
                    </div>
                </div>
            </div>
        `;
    }
    
    // Budget suggestions card
    if (hasBudget) {
        const budgetData = dashboardData.budgetSuggestionData;
        html += `
            <div class="card border-0 shadow-sm mb-4">
                <div class="card-body">
                    <h5 class="card-title">Budget Suggestions</h5>
                    <div class="py-3">
                        <div class="budget-category needs mb-3">
                            <div class="d-flex justify-content-between align-items-center">
                                <div>
                                    <h6 class="mb-0">Needs (50%)</h6>
                                    <small class="text-muted">Essential expenses</small>
                                </div>
                                <div class="fw-bold">$${budgetData.needs.toFixed(2)}</div>
                            </div>
                            <div class="progress mt-1" style="height: 6px;">
                                <div class="progress-bar bg-primary" role="progressbar" style="width: 50%"></div>
                            </div>
                        </div>
                        
                        <div class="budget-category wants mb-3">
                            <div class="d-flex justify-content-between align-items-center">
                                <div>
                                    <h6 class="mb-0">Wants (30%)</h6>
                                    <small class="text-muted">Discretionary spending</small>
                                </div>
                                <div class="fw-bold">$${budgetData.wants.toFixed(2)}</div>
                            </div>
                            <div class="progress mt-1" style="height: 6px;">
                                <div class="progress-bar bg-success" role="progressbar" style="width: 30%"></div>
                            </div>
                        </div>
                        
                        <div class="budget-category savings">
                            <div class="d-flex justify-content-between align-items-center">
                                <div>
                                    <h6 class="mb-0">Savings (20%)</h6>
                                    <small class="text-muted">Future goals</small>
                                </div>
                                <div class="fw-bold">$${budgetData.savings.toFixed(2)}</div>
                            </div>
                            <div class="progress mt-1" style="height: 6px;">
                                <div class="progress-bar bg-info" role="progressbar" style="width: 20%"></div>
                            </div>
                        </div>
                        
                        <div class="text-center mt-3">
                            <small class="text-muted">Based on monthly salary: $${budgetData.salary.toFixed(2)}</small>
                        </div>
                    </div>
                </div>
            </div>
        `;
    }
    
    // Transaction history card
    if (dashboardData.hasExpense && dashboardData.transaction && dashboardData.transaction.length > 0) {
        html += `
            <div class="card border-0 shadow-sm mb-4">
                <div class="card-body">
                    <h5 class="card-title">Recent Transactions</h5>
                    <div class="transaction-list">
                        <div class="list-group">
        `;
        
        // Display recent 5 transactions
        const recentTransactions = dashboardData.transaction.slice(0, 5);
        recentTransactions.forEach(tx => {
            html += `
                <div class="list-group-item d-flex justify-content-between align-items-center">
                    <div>
                        <i class="fas fa-${tx.category === 'Grocery' ? 'shopping-cart' : 
                                          tx.category === 'Fuel' ? 'gas-pump' : 
                                          tx.category === 'Food' ? 'utensils' : 
                                          tx.category === 'Bills' ? 'file-invoice-dollar' : 'money-bill-wave'} me-2"></i>
                        ${tx.category}
                    </div>
                    <div class="text-end">
                        <span class="fw-bold text-danger">-$${tx.amount.toFixed(2)}</span>
                    </div>
                </div>
            `;
        });
        
        html += `
                        </div>
                    </div>
                </div>
            </div>
        `;
    }
    
    html += `</div>`;
    return html;
}

/**
 * Create HTML content for expense report
 * @param {Object} expenseData - Expense data
 * @returns {string} HTML content
 */
function createExpenseReportHTML(expenseData) {
    // Check if expense data exists
    const hasExpense = expenseData.hasExpense;
    const hasSalary = expenseData.hasSalary;
    
    let html = `<div class="expense-report">`;
    
    // If salary and expense information exists
    if (hasSalary && expenseData.expenseAndSalary) {
        const salaryData = expenseData.expenseAndSalary;
        html += `
            <div class="card border-0 shadow-sm mb-4">
                <div class="card-body">
                    <h5 class="card-title">Expense & Salary Summary</h5>
                    <div class="row g-3 text-center my-3">
                        <div class="col-md-4">
                            <div class="border rounded p-3">
                                <div class="small text-muted">Monthly Salary</div>
                                <div class="fw-bold">$${salaryData.salary ? salaryData.salary.toFixed(2) : '0.00'}</div>
                            </div>
                        </div>
                        <div class="col-md-4">
                            <div class="border rounded p-3">
                                <div class="small text-muted">Total Expenses</div>
                                <div class="fw-bold">$${salaryData.totalExpense ? salaryData.totalExpense.toFixed(2) : '0.00'}</div>
                            </div>
                        </div>
                        <div class="col-md-4">
                            <div class="border rounded p-3">
                                <div class="small text-muted">Savings</div>
                                <div class="fw-bold">$${
                                    salaryData.salary && salaryData.totalExpense 
                                    ? (salaryData.salary - salaryData.totalExpense).toFixed(2) 
                                    : '0.00'
                                }</div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        `;
    }
    
    // Weekly expense chart (placeholder, actual chart needs dynamic generation)
    if (hasExpense && expenseData.weeklyExpense) {
        html += `
            <div class="card border-0 shadow-sm mb-4">
                <div class="card-body">
                    <h5 class="card-title">Weekly Expenses</h5>
                    <div class="chart-placeholder p-3 my-3 bg-light text-center rounded">
                        <i class="fas fa-chart-bar fa-3x text-muted mb-3"></i>
                        <p class="text-muted">Weekly expense chart would be rendered here</p>
                    </div>
                </div>
            </div>
        `;
    }
    
    // Monthly category expenses for Pie Chart
    if (hasExpense && expenseData.monthlyCategoryExpenses) {
        const monthlyCategories = expenseData.monthlyCategoryExpenses;
        const firstMonthName = Object.keys(monthlyCategories)[0];
        
        let categoriesForPie = {};
        if (firstMonthName && monthlyCategories[firstMonthName]) {
            // Filter out 'total' key before creating the pie chart
            for (const category in monthlyCategories[firstMonthName]) {
                if (category.toLowerCase() !== 'total') {
                    categoriesForPie[category] = monthlyCategories[firstMonthName][category];
                }
            }
        }

        html += `
            <div class="card border-0 shadow-sm mb-4">
                <div class="card-body">
                    <h5 class="card-title">Category Breakdown (${firstMonthName || 'N/A'})</h5>
        `;

        // Check if there are categories to display after filtering
        if (Object.keys(categoriesForPie).length > 0) {
            const categoryPieChartId = `categoryPieChart_${Date.now()}`;
            html += `<div class="chart-container my-3" style="height: 300px;"><canvas id="${categoryPieChartId}"></canvas></div>`;
            // Delay chart rendering until after HTML is injected
            setTimeout(() => {
                renderChart(
                    categoryPieChartId, 
                    'pie', 
                    Object.keys(categoriesForPie), 
                    Object.values(categoriesForPie),
                    'Category Breakdown'
                );
            }, 0);
        } else {
            html += `
                <div class="text-center py-3 text-muted">
                    <i>No category data available for pie chart.</i>
                </div>
            `;
        }
        html += `
                </div>
            </div>
        `;
    }

    // Monthly category expenses
    if (hasExpense && expenseData.monthlyCategoryExpenses) {
        const categories = expenseData.monthlyCategoryExpenses; // This is the original categories object
        // This part is for the LIST display, not the PIE chart.
        // It iterates through months, and then categories within each month.
        // The current spec for expenseData.monthlyCategoryExpenses is an object where keys are month names.
        // Example: "April": {"Groceries": 100.0, "total": 200.5}
        
        // Displaying all categories for all available months in a list format
        Object.entries(categories).forEach(([month, monthCategories]) => {
            html += `
            <div class="card border-0 shadow-sm mb-4">
                <div class="card-body">
                    <h5 class="card-title">Detailed Expenses for ${month}</h5>
                    <div class="list-group my-3">
            `;
            if (monthCategories && Object.keys(monthCategories).length > 0) {
                Object.entries(monthCategories).forEach(([category, amount]) => {
                    html += `
                        <div class="list-group-item d-flex justify-content-between align-items-center">
                            <div>
                                <i class="fas fa-${
                                    category.toLowerCase() === 'grocery' || category.toLowerCase() === 'groceries' ? 'shopping-cart' : 
                                    category.toLowerCase() === 'fuel' ? 'gas-pump' : 
                                    category.toLowerCase() === 'food' ? 'utensils' : 
                                    category.toLowerCase() === 'bills' ? 'file-invoice-dollar' : 'tag'
                                } me-2"></i>
                                ${category}
                            </div>
                            <div class="badge bg-primary rounded-pill">$${typeof amount === 'number' ? amount.toFixed(2) : amount}</div>
                        </div>
                    `;
                });
            } else {
                html += `
                    <div class="text-center py-3 text-muted">
                        <i>No category data available for ${month}.</i>
                    </div>
                `;
            }
            html += `
                    </div>
                </div>
            </div>
            `;
        });
    }

    html += `</div>`;
    return html;
}

/**
 * Mark report as read
 * @param {number} reportId - Report ID
 */
function markReportAsRead(reportId) {
    fetch(`/api/reports/${reportId}/read`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        }
    })
    .then(response => {
        if (!response.ok) {
            throw new Error('Network response was not ok');
        }
        return response.json();
    })
    .then(data => {
        console.log('Report marked as read:', data);
        // Update unread count
        fetchUnreadReportCount();
    })
    .catch(error => {
        console.error('Error marking report as read:', error);
    });
}

/**
 * Initialize the monthly spending chart with modern styling
 */
function initMonthlySpendingChart() {
    const chartCanvas = document.getElementById('monthlySpendingChart');
    if (!chartCanvas) {
        console.error('Monthly spending chart canvas not found');
        return;
    }

    // Prepare data, filtering out months with 0 expense
    const filteredLabels = [];
    const filteredExpenses = [];
    if (window.monthlyLabels && window.monthlyExpenses && window.monthlyLabels.length === window.monthlyExpenses.length) {
        window.monthlyLabels.forEach((label, index) => {
            if (window.monthlyExpenses[index] > 0) {
                filteredLabels.push(label);
                filteredExpenses.push(window.monthlyExpenses[index]);
            }
        });
    }

    // Check if there is filtered expense data
    if (!filteredExpenses.length) {
        // If there is no data, show placeholder
        const chartContainer = chartCanvas.parentElement;
        chartContainer.innerHTML = `
            <div class="text-center py-4">
                <i class="fas fa-chart-line fa-3x text-muted mb-3"></i>
                <p class="text-muted">No spending data to display</p>
            </div>
        `;
        return;
    }

    // Get chart context
    const ctx = chartCanvas.getContext('2d');

    try {
        // Define modern color scheme
        const computedStyle = getComputedStyle(document.documentElement);
        const chartColors = [
            computedStyle.getPropertyValue('--chart-color-1').trim(),
            computedStyle.getPropertyValue('--chart-color-2').trim(),
            computedStyle.getPropertyValue('--chart-color-3').trim(),
            computedStyle.getPropertyValue('--chart-color-4').trim(),
            computedStyle.getPropertyValue('--chart-color-5').trim()
        ];

        // Create bar chart gradient
        const createGradient = (ctx, colorIndex) => {
            const gradient = ctx.createLinearGradient(0, 0, 0, 250);
            gradient.addColorStop(0, chartColors[colorIndex % chartColors.length]);
            gradient.addColorStop(1, adjustColor(chartColors[colorIndex % chartColors.length], 20));
            return gradient;
        };

        // Prepare bar chart colors using filtered data length
        const backgroundColors = filteredLabels.map((_, i) => createGradient(ctx, i));

        // Create chart using filtered data
        new Chart(ctx, {
            type: 'bar',
            data: {
                labels: filteredLabels, // Use filtered labels
                datasets: [{
                    label: 'Monthly Spending',
                    data: filteredExpenses, // Use filtered expenses
                    backgroundColor: backgroundColors,
                    borderRadius: 10,
                    borderWidth: 0,
                    borderSkipped: false,
                    barThickness: 18,
                    maxBarThickness: 20
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                animation: {
                    duration: 1000,
                    easing: 'easeOutQuart'
                },
                plugins: {
                    legend: {
                        display: false
                    },
                    tooltip: {
                        backgroundColor: 'rgba(255,255,255,0.9)',
                        titleColor: '#333',
                        bodyColor: '#333',
                        titleFont: {
                            family: 'Poppins',
                            size: 14,
                            weight: 'bold'
                        },
                        bodyFont: {
                            family: 'Poppins',
                            size: 13
                        },
                        padding: 12,
                        cornerRadius: 8,
                        boxWidth: 10,
                        usePointStyle: true,
                        borderColor: 'rgba(0,0,0,0.1)',
                        borderWidth: 1,
                        callbacks: {
                            label: function(context) {
                                return `Spending: $${context.raw}`;
                            }
                        }
                    }
                },
                scales: {
                    y: {
                        beginAtZero: true,
                        grid: {
                            color: 'rgba(0,0,0,0.05)',
                            drawBorder: false
                        },
                        ticks: {
                            font: {
                                family: 'Poppins',
                                size: 11
                            },
                            color: '#999',
                            padding: 10,
                            callback: function(value) {
                                return '$' + value;
                            }
                        }
                    },
                    x: {
                        grid: {
                            display: false
                        },
                        ticks: {
                            font: {
                                family: 'Poppins',
                                size: 11
                            },
                            color: '#999',
                            padding: 5
                        }
                    }
                }
            }
        });

        console.log('Chart initialized successfully with filtered data');
    } catch (error) {
        console.error('Error initializing chart:', error);
        // Show error message
        const chartContainer = chartCanvas.parentElement;
        chartContainer.innerHTML = `
            <div class="text-center py-4">
                <i class="fas fa-exclamation-circle fa-3x text-danger mb-3"></i>
                <p class="text-danger">Error loading chart</p>
            </div>
        `;
    }
}

/**
 * Adjust a color's lightness
 * @param {string} color - The color to adjust
 * @param {number} amount - The amount to adjust by
 * @returns {string} The adjusted color
 */
function adjustColor(color, amount) {
    // Convert hex to RGB
    let hex = color;
    if (hex.startsWith('#')) {
        hex = hex.slice(1);
    }
    
    // Convert hex to RGB
    let r = parseInt(hex.substring(0, 2), 16);
    let g = parseInt(hex.substring(2, 4), 16);
    let b = parseInt(hex.substring(4, 6), 16);
    
    // Adjust lightness
    r = Math.max(0, Math.min(255, r + amount));
    g = Math.max(0, Math.min(255, g + amount));
    b = Math.max(0, Math.min(255, b + amount));
    
    // Convert back to hex
    return `#${(r.toString(16).padStart(2, '0'))}${(g.toString(16).padStart(2, '0'))}${(b.toString(16).padStart(2, '0'))}`;
}

/**
 * Initialize goal progress visualization(s) with enhanced animations
 */
function initGoalProgress() {
    // Visualization for multiple goals
    if (window.goalData && window.goalData.length > 0) {
        console.log('Multiple goals found:', window.goalData.length);
        renderMultipleGoals(window.goalData);
    }
    
    // For individual goal progress circles
    const progressCircles = document.querySelectorAll('.progress-circle');
    console.log('Found progress circles:', progressCircles.length);
    
    progressCircles.forEach(function(circle) {
        updateGoalProgressCircle(circle, true);
    });
}

/**
 * Update a specific goal progress circle with animation (SVG version)
 * @param {HTMLElement} circleElement - The progress circle element
 * @param {boolean} animate - Whether to animate the update
 */
function updateGoalProgressCircle(circleElement, animate = false) {
    if (!circleElement) return;
    // SVG version
    const svg = circleElement.querySelector('svg.goal-progress-svg');
    const bar = svg ? svg.querySelector('.progress-bar') : null;
    const percentageElem = circleElement.querySelector('.progress-percentage');
    if (!svg || !bar || !percentageElem) return;
    let percentage = parseFloat(percentageElem.textContent);
    if (isNaN(percentage)) percentage = 0;
    // Circle parameters
    const r = 65;
    const c = 2 * Math.PI * r;
    // Progress
    const progress = Math.max(0, Math.min(percentage, 100));
    const offset = c * (1 - progress / 100);
    bar.setAttribute('stroke-dasharray', c);
    bar.setAttribute('stroke-dashoffset', offset);
    bar.setAttribute('stroke', getComputedStyle(document.documentElement).getPropertyValue('--primary-color').trim());
    bar.setAttribute('style', 'transition: stroke-dashoffset 1s cubic-bezier(0.4,0,0.2,1); transform: rotate(-90deg); transform-origin: 75px 75px;');
}

/**
 * Save a new goal using AJAX with modern animation feedback and error handling
 */
async function saveNewGoal(event) {
    event.preventDefault();

    const form = document.getElementById('goalForm');
    if (!form) {
        console.error('Goal form element not found');
        return;
    }

    const saveButton = document.getElementById('saveGoalBtn');
    if (!saveButton) {
        console.error('Save Goal button not found');
        return;
    }

    // Basic validation
    if (!form.checkValidity()) {
        form.reportValidity();
        return;
    }

    try {
        // Set loading state
        saveButton.disabled = true;
        saveButton.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Saving...';

        const goalData = {
            goalName: form.querySelector('[name="goalName"]').value.trim(),
            targetAmount: parseFloat(form.querySelector('[name="targetAmount"]').value),
            timeDuration: parseInt(form.querySelector('[name="timeDuration"]').value),
            allocation: parseFloat(form.querySelector('[name="allocation"]').value)
        };

        // Send request
        const response = await fetch('/dashboard/addGoal', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(goalData)
        });

        const result = await response.json(); // Always parse JSON

        // Reload for first dynamic addition when there's already at least one goal
        if (initialGoalCount > 0 && result.data?.length > initialGoalCount) {
            window.location.reload();
            return;
        }

        if (!response.ok || result.status !== "Success") {
            // Use message from server if available, otherwise generic error
            throw new Error(result.message || `HTTP error! status: ${response.status}`);
        }

        // Close modal and reload the page to display the newly added goal
        const modal = bootstrap.Modal.getInstance(document.getElementById('goalModal'));
        if (modal) {
            modal.hide();
            const backdrop = document.querySelector('.modal-backdrop');
            if (backdrop) backdrop.remove();
            document.body.classList.remove('modal-open');
            document.body.style.overflow = '';
            document.body.style.paddingRight = '';
        }
        window.location.reload();
        return;

    } catch (error) {
        console.error('Error saving goal:', error);
        showAlert(error.message || 'An error occurred while saving the goal.', 'danger');
    } finally {
        // Restore button state
        if (saveButton) {
            saveButton.disabled = false;
            saveButton.innerHTML = 'Save Goal';
        }
    }
}

/**
 * Update the UI for a single goal with smooth animation
 * @param {Object} goalData - The goal data
 */
function updateSingleGoalUI(goalData) {
    const goalCard = document.querySelector('.goal-card');
    if (!goalCard) return;
    
    console.log('Updating single goal UI with data:', goalData);
    
    // First fade out the card content
    const cardBody = goalCard.querySelector('.card-body');
    cardBody.style.opacity = '0';
    cardBody.style.transform = 'translateY(10px)';
    
    setTimeout(() => {
        // Create new content
        const newContent = `
            <div class="card-body" style="opacity: 0; transform: translateY(10px);">
                <h2 class="card-title">Goal Progress</h2>
                <hr>
                <div class="goal-progress text-center">
                    <div class="progress-circle mx-auto mb-3">
                        <div class="progress-circle-inner">
                            <span class="progress-percentage">${goalData.progressPercentage}%</span>
                            <span class="progress-label">${goalData.goalName}</span>
                        </div>
                    </div>
                    <div class="goal-details">
                        <p><strong>Target:</strong> ${goalData.target}</p>
                        <p><strong>Saved:</strong> ${goalData.saved}</p>
                        <p><strong>Remaining:</strong> ${goalData.remaining}</p>
                        ${goalData.message ? `<p><small>${goalData.message}</small></p>` : ''}
                    </div>
                </div>
            </div>
        `;
        
        // Update card content
        goalCard.innerHTML = newContent;
        
        // Fade in new content
        setTimeout(() => {
            const newCardBody = goalCard.querySelector('.card-body');
            newCardBody.style.opacity = '1';
            newCardBody.style.transform = 'translateY(0)';
            
            // Update progress visualization
            const circle = goalCard.querySelector('.progress-circle');
            updateGoalProgressCircle(circle, true);
        }, 50);
    }, 300);
}

/**
 * Render multiple goals in the UI with animation
 * @param {Array} goals - Array of goal data objects
 */
function renderMultipleGoals(goals) {
    const goalsContainer = document.getElementById('goalsContainer');
    if (!goalsContainer) return;
    
    console.log('Rendering multiple goals:', goals.length);
    
    // Fade out existing content
    goalsContainer.style.opacity = '0';
    goalsContainer.style.transform = 'translateY(10px)';
    
    setTimeout(() => {
        // Clear existing content
        goalsContainer.innerHTML = '';
        
        // Create header
        const header = document.createElement('h2');
        header.className = 'mb-4';
        header.textContent = 'Your Financial Goals';
        goalsContainer.appendChild(header);
        
        // Create goals list
        if (!goals || goals.length === 0) {
            const placeholder = document.createElement('p');
            placeholder.className = 'text-muted text-center py-4';
            placeholder.textContent = 'No goals set yet. Create your first financial goal!';
            goalsContainer.appendChild(placeholder);
        } else {
            const row = document.createElement('div');
            row.className = 'row goals-row';
            
            // Add each goal with staggered animation
            goals.forEach(function(goal, index) {
                const goalCol = document.createElement('div');
                goalCol.className = 'col-md-6 mb-3';
                goalCol.style.opacity = '0';
                goalCol.style.transform = 'translateY(15px)';
                
                goalCol.innerHTML = `
                    <div class="card h-100">
                        <div class="card-body">
                            <h5 class="card-title">${goal.goalName}</h5>
                            <div class="d-flex align-items-center mb-2">
                                <div class="progress flex-grow-1 me-2" style="height: 10px;">
                                    <div class="progress-bar" role="progressbar" 
                                         style="width: 0%;" 
                                         aria-valuenow="${goal.progressPercentage}" 
                                         aria-valuemin="0" aria-valuemax="100"></div>
                                </div>
                                <span class="text-muted small">${goal.progressPercentage}%</span>
                            </div>
                            <div class="goal-details small">
                                <div class="row">
                                    <div class="col-6"><strong>Target:</strong> ${goal.target}</div>
                                    <div class="col-6"><strong>Saved:</strong> ${goal.saved}</div>
                                </div>
                                <div class="row mt-1">
                                    <div class="col-12"><strong>Remaining:</strong> ${goal.remaining}</div>
                                </div>
                                ${goal.message ? `<div class="alert alert-info mt-2 p-2 small">${goal.message}</div>` : ''}
                            </div>
                        </div>
                    </div>
                `;
                
                row.appendChild(goalCol);
                
                // Animate the goals with staggered timing
                setTimeout(() => {
                    goalCol.style.opacity = '1';
                    goalCol.style.transform = 'translateY(0)';
                    
                    // Animate progress bar
                    setTimeout(() => {
                        const progressBar = goalCol.querySelector('.progress-bar');
                        progressBar.style.transition = 'width 1s ease-out';
                        progressBar.style.width = `${goal.progressPercentage}%`;
                    }, 200);
                    
                }, 100 * index);
            });
            
            goalsContainer.appendChild(row);
        }
        
        // Fade in container
        goalsContainer.style.opacity = '1';
        goalsContainer.style.transform = 'translateY(0)';
        
    }, 300);
}

/**
 * Generate a random color for charts using modern color palette
 * @returns {string} A hex color code
 */
function getRandomColor() {
    const style = getComputedStyle(document.documentElement);
    const colors = [
        style.getPropertyValue('--chart-color-1').trim(),
        style.getPropertyValue('--chart-color-2').trim(),
        style.getPropertyValue('--chart-color-3').trim(),
        style.getPropertyValue('--chart-color-4').trim(),
        style.getPropertyValue('--chart-color-5').trim()
    ];
    
    return colors[Math.floor(Math.random() * colors.length)];
}

// Handle salary addition with error handling
document.addEventListener('DOMContentLoaded', function() {
    const addSalaryButtons = document.querySelectorAll('.add-salary-btn'); // Select all buttons
    const salaryModalInstance = document.getElementById('salaryModal') ? new bootstrap.Modal(document.getElementById('salaryModal')) : null;
    const saveSalaryBtn = document.getElementById('saveSalaryBtn');
    const salaryForm = document.getElementById('salaryForm');

    // Handle opening the modal from potentially multiple buttons
    addSalaryButtons.forEach(button => {
        button.addEventListener('click', function() {
            if (salaryModalInstance) {
                 salaryModalInstance.show();
            }
        });
    });

    if (saveSalaryBtn && salaryForm) {
        saveSalaryBtn.addEventListener('click', async function() {
            if (!salaryForm.checkValidity()) {
                salaryForm.reportValidity();
                return;
            }

            const salaryAmount = document.getElementById('salaryAmount').value;
            const salaryDate = document.getElementById('salaryDate').value;

             // Add loading state to button
            saveSalaryBtn.disabled = true;
            saveSalaryBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Saving...';

            try {
                const response = await fetch('/add_salary', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({
                        amount: parseFloat(salaryAmount),
                        date: salaryDate
                    })
                });

                const result = await response.json();

                if (!response.ok || result.status !== "Success") {
                    throw new Error(result.message || `HTTP error! status: ${response.status}`);
                }

                // On success, close modal and reload to update balance card
                if (salaryModalInstance) {
                    salaryModalInstance.hide();
                    const backdrop = document.querySelector('.modal-backdrop');
                    if (backdrop) backdrop.remove();
                    document.body.classList.remove('modal-open');
                    document.body.style.overflow = '';
                    document.body.style.paddingRight = '';
                }
                window.location.reload();
                return;

            } catch (error) {
                console.error('Error adding salary:', error);
                showAlert(error.message || 'Failed to add salary.', 'danger');
            } finally {
                 // Restore button state
                 saveSalaryBtn.disabled = false;
                 saveSalaryBtn.innerHTML = 'Save Salary';
            }
        });
    }
});

function updateGoalsUI(goals) {
    console.log('Updating goals UI with:', goals);
    if (!goals || !goals.length) {
        console.log('No goals to display');
        return;
    }

    // Update the first goal display
    const firstGoal = goals[0];
    const goalName = document.querySelector('.goal-progress h3');
    const progressPercentage = document.querySelector('.progress-percentage');
    const goalTarget = document.getElementById('goalTarget');
    const goalSaved = document.getElementById('goalSaved');
    const goalRemaining = document.getElementById('goalRemaining');
    const goalMessage = document.getElementById('goalMessage');

    if (goalName) goalName.textContent = firstGoal.goalName;
    if (progressPercentage) progressPercentage.textContent = `${firstGoal.progressPercentage}%`;
    if (goalTarget) goalTarget.textContent = firstGoal.target;
    if (goalSaved) goalSaved.textContent = firstGoal.saved;
    if (goalRemaining) goalRemaining.textContent = firstGoal.remaining;
    if (goalMessage) goalMessage.textContent = firstGoal.message || '';

    // Handle goal navigation
    const goalCard = document.querySelector('.goal-card');
    const goalSelectorContainer = document.querySelector('.goal-selector');
    
    if (goals.length > 1) {
        console.log('Multiple goals detected:', goals.length);
        // If selector container doesn't exist, create it
        if (!goalSelectorContainer) {
            console.log('Creating goal selector container');
            const newSelectorContainer = document.createElement('div');
            newSelectorContainer.className = 'goal-selector mb-2';
            newSelectorContainer.innerHTML = `
                <div class="d-flex justify-content-between align-items-center">
                    <button class="btn btn-link goal-nav-btn" id="prevGoalBtn">
                        <i class="fas fa-chevron-left"></i>
                    </button>
                    <span class="goal-counter">1/${goals.length}</span>
                    <button class="btn btn-link goal-nav-btn" id="nextGoalBtn">
                        <i class="fas fa-chevron-right"></i>
                    </button>
                </div>
            `;
            
            // Insert selector after the card title
            const cardTitle = goalCard.querySelector('.card-title');
            if (cardTitle) {
                cardTitle.insertAdjacentElement('afterend', newSelectorContainer);
            }
        }

        // Setup goal navigation
        let currentIndex = 0;
        const prevBtn = document.getElementById('prevGoalBtn');
        const nextBtn = document.getElementById('nextGoalBtn');
        const counter = document.querySelector('.goal-counter');

        console.log('Navigation elements:', { prevBtn, nextBtn, counter });

        function updateGoalDisplay(index) {
            if (index < 0 || index >= goals.length) {
                console.error('Invalid goal index:', index);
                return;
            }

            console.log('Updating goal display for index:', index);
            const goal = goals[index];
            console.log('Current goal:', goal);

            // Update all goal display elements
            const elements = {
                goalName: document.querySelector('.goal-progress h3'),
                progressPercentage: document.querySelector('.progress-percentage'),
                goalTarget: document.getElementById('goalTarget'),
                goalSaved: document.getElementById('goalSaved'),
                goalRemaining: document.getElementById('goalRemaining'),
                goalMessage: document.getElementById('goalMessage')
            };

            // Update each element if it exists
            if (elements.goalName) elements.goalName.textContent = goal.goalName;
            if (elements.progressPercentage) elements.progressPercentage.textContent = `${goal.progressPercentage}%`;
            if (elements.goalTarget) elements.goalTarget.textContent = goal.target;
            if (elements.goalSaved) elements.goalSaved.textContent = goal.saved;
            if (elements.goalRemaining) elements.goalRemaining.textContent = goal.remaining;
            if (elements.goalMessage) elements.goalMessage.textContent = goal.message || '';

            // Update progress circle
            const circle = document.querySelector('.progress-circle');
            if (circle) {
                updateGoalProgressCircle(circle, true);
            }

            // Update counter and button states
            if (counter) counter.textContent = `${index + 1}/${goals.length}`;
            if (prevBtn) prevBtn.disabled = index === 0;
            if (nextBtn) nextBtn.disabled = index === goals.length - 1;
        }

        // Remove existing event listeners
        const newPrevBtn = prevBtn.cloneNode(true);
        const newNextBtn = nextBtn.cloneNode(true);
        prevBtn.parentNode.replaceChild(newPrevBtn, prevBtn);
        nextBtn.parentNode.replaceChild(newNextBtn, nextBtn);

        // Add new event listeners
        newPrevBtn.addEventListener('click', () => {
            console.log('Previous button clicked');
            // Circular navigation: go to last if at the beginning
            if (currentIndex > 0) {
                currentIndex--;
            } else {
                currentIndex = goals.length - 1;
            }
            updateGoalDisplay(currentIndex);
        });

        newNextBtn.addEventListener('click', () => {
            console.log('Next button clicked');
            // Circular navigation: go to first if at the end
            if (currentIndex < goals.length - 1) {
                currentIndex++;
            } else {
                currentIndex = 0;
            }
            updateGoalDisplay(currentIndex);
        });

        // Initial display
        updateGoalDisplay(currentIndex);
    } else {
        console.log('Single goal or no goals');
        // If only one goal, remove selector if it exists
        if (goalSelectorContainer) {
            goalSelectorContainer.remove();
        }
    }

    // Update progress circle
    const circle = document.querySelector('.progress-circle');
    if (circle) {
        updateGoalProgressCircle(circle, true);
    }
}

// Initialize CountUp animations
function initCountUp() {
    // Balance animation
    if (document.getElementById('balanceAmount')) {
        const balanceAmount = document.getElementById('balanceAmount');
        const balanceValue = window.accountData?.balance || 0;
        new CountUp('balanceAmount', balanceValue, {
            prefix: '$',
            duration: 2,
            decimalPlaces: 2
        }).start();
    }

    // Goal progress animation
    if (document.getElementById('goalProgress')) {
        const goalProgress = document.getElementById('goalProgress');
        const progressValue = window.goalData?.[0]?.progressPercentage || 0;
        new CountUp('goalProgress', progressValue, {
            suffix: '%',
            duration: 2,
            decimalPlaces: 1
        }).start();
    }

    // Budget suggestion animation
    if (window.budgetSuggestionData) {
        const { needs, wants, savings } = window.budgetSuggestionData;
        
        if (document.getElementById('needsAmount')) {
            new CountUp('needsAmount', needs, {
                prefix: '$',
                duration: 2,
                decimalPlaces: 2
            }).start();
        }
        
        if (document.getElementById('wantsAmount')) {
            new CountUp('wantsAmount', wants, {
                prefix: '$',
                duration: 2,
                decimalPlaces: 2
            }).start();
        }
        
        if (document.getElementById('savingsAmount')) {
            new CountUp('savingsAmount', savings, {
                prefix: '$',
                duration: 2,
                decimalPlaces: 2
            }).start();
        }
    }
}

// Update goal progress circle
function updateProgressCircle(percentage) {
    const circle = document.querySelector('.progress-circle');
    if (circle) {
        circle.style.setProperty('--progress', `${percentage}%`);
    }
}

// Card entrance animation
function animateCards() {
    const cards = document.querySelectorAll('.card');
    cards.forEach((card, index) => {
        setTimeout(() => {
            card.style.opacity = '1';
            card.style.transform = 'translateY(0)';
        }, index * 100);
    });
}

// Goal switch animation
function switchGoal(direction) {
    const goalContent = document.querySelector('.goal-progress');
    if (goalContent) {
        goalContent.style.opacity = '0';
        goalContent.style.transform = 'translateX(' + (direction === 'next' ? '-20px' : '20px') + ')';
        
        setTimeout(() => {
            // Update goal content
            updateGoalContent();
            
            goalContent.style.opacity = '1';
            goalContent.style.transform = 'translateX(0)';
        }, 300);
    }
}

// Update goal content
function updateGoalContent() {
    if (!window.goalData || !window.goalData.length) return;
    
    const currentGoal = window.goalData[currentGoalIndex];
    if (!currentGoal) return;
    
    // Update goal name
    const goalName = document.querySelector('.goal-progress h3');
    if (goalName) goalName.textContent = currentGoal.goalName;
    
    // Update progress
    const progressPercentage = document.querySelector('.progress-percentage');
    if (progressPercentage) {
        new CountUp('goalProgress', currentGoal.progressPercentage, {
            suffix: '%',
            duration: 1,
            decimalPlaces: 1
        }).start();
    }
    
    // Update goal details
    const goalTarget = document.getElementById('goalTarget');
    const goalSaved = document.getElementById('goalSaved');
    const goalRemaining = document.getElementById('goalRemaining');
    const goalMessage = document.getElementById('goalMessage');
    
    if (goalTarget) goalTarget.textContent = currentGoal.target;
    if (goalSaved) goalSaved.textContent = currentGoal.saved;
    if (goalRemaining) goalRemaining.textContent = currentGoal.remaining;
    if (goalMessage) goalMessage.textContent = currentGoal.message;
    
    // Update progress circle
    updateProgressCircle(currentGoal.progressPercentage);
}

// Initialize
document.addEventListener('DOMContentLoaded', function() {
    initCountUp();
    animateCards();
    initMonthlySpendingChart();
    
    // Initialize progress circle
    if (window.goalData && window.goalData.length > 0) {
        updateProgressCircle(window.goalData[0].progressPercentage);
    }
    
    // Setup goal navigation
    setupGoalNavigation();
});

// Setup goal navigation
function setupGoalNavigation() {
    if (!window.goalData || window.goalData.length <= 1) return;
    
    let currentGoalIndex = 0;
    const prevBtn = document.getElementById('prevGoalBtn');
    const nextBtn = document.getElementById('nextGoalBtn');
    
    if (prevBtn) {
        prevBtn.addEventListener('click', () => {
            currentGoalIndex = (currentGoalIndex - 1 + window.goalData.length) % window.goalData.length;
            switchGoal('prev');
        });
    }
    
    if (nextBtn) {
        nextBtn.addEventListener('click', () => {
            currentGoalIndex = (currentGoalIndex + 1) % window.goalData.length;
            switchGoal('next');
        });
    }
}

// Export functionality
document.getElementById('exportCSV')?.addEventListener('click', function() {
    // CSV export logic
});

document.getElementById('exportPDF')?.addEventListener('click', function() {
    // PDF export logic
});

// Responsive handling
function handleResponsive() {
    const cards = document.querySelectorAll('.card');
    if (window.innerWidth <= 768) {
        cards.forEach(card => {
            card.style.marginBottom = '1rem';
        });
    }
}

window.addEventListener('resize', handleResponsive);
handleResponsive();

/**
 * Set up active state for navigation items based on current URL
 */
function setupActiveNavigation() {
    // Get current path from window location
    const currentPath = window.location.pathname;
    
    // Remove active class from all navigation items
    document.querySelectorAll('.sidebar .nav-item').forEach(item => {
        item.classList.remove('active');
    });
    
    // Add active class based on current path
    if (currentPath.includes('/dashboard')) {
        // Dashboard is active
        document.querySelector('.sidebar .nav-item a[href="/dashboard"]')?.parentElement.classList.add('active');
    } else if (currentPath.includes('/expenses')) {
        // Expenses is active
        document.querySelector('.sidebar .nav-item a[href="/expenses"]')?.parentElement.classList.add('active');
    } else if (currentPath.includes('/settings')) {
        // Settings is active
        document.querySelector('.sidebar .nav-item a[href="/settings"]')?.parentElement.classList.add('active');
    }
    
    // Special handling for "Shared with me" button when its modal is open
    document.getElementById('sharedWithMeBtn')?.addEventListener('click', function() {
        // Remove active class from all items first
        document.querySelectorAll('.sidebar .nav-item').forEach(item => {
            item.classList.remove('active');
        });
        
        // Add active class to the Shared with me item
        this.closest('.nav-item').classList.add('active');
    });
    
    // When modal is closed, restore the active state based on URL
    document.getElementById('sharedReportsModal')?.addEventListener('hidden.bs.modal', function () {
        setupActiveNavigation();
    });
}

/**
 * Setup share summary button functionality
 */
function setupShareSummaryButton() {
    const shareBtn = document.getElementById('shareSummaryBtn');
    
    if (shareBtn) {
        // Remove any existing event listeners to prevent duplicates
        shareBtn.removeEventListener('click', handleShareButtonClick);
        // Add click event listener
        shareBtn.addEventListener('click', handleShareButtonClick);
    }
}

/**
 * Handle share button click event
 */
function handleShareButtonClick() {
    console.log('Share button clicked');
    
    // Get the export report modal
    const exportReportModal = document.getElementById('exportReportModal');
    
    if (exportReportModal) {
        // Initialize modal
        const modal = new bootstrap.Modal(exportReportModal);
        
        // Show modal
        modal.show();
    } else {
        // If modal doesn't exist, fallback to direct API call
        fetch('/share_summary')
            .then(response => response.json())
            .then(data => {
                if (data.status === "Success") {
                    // Create temporary textarea to copy to clipboard
                    const textarea = document.createElement('textarea');
                    textarea.value = data.summary;
                    document.body.appendChild(textarea);
                    textarea.select();
                    document.execCommand('copy');
                    document.body.removeChild(textarea);
                    
                    showAlert('Summary copied to clipboard!', 'success');
                } else {
                    throw new Error(data.message || 'Failed to generate summary');
                }
            })
            .catch(error => {
                console.error('Error sharing summary:', error);
                showAlert(error.message || 'Failed to share summary', 'danger');
            });
    }
}

/**
 * Initialize the Salary vs Expenses chart
 */
function initSalaryVsExpensesChart() {
    const chartCanvas = document.getElementById('barChart');
    if (!chartCanvas) {
        console.error('Salary vs Expenses chart canvas not found');
        return;
    }

    // Get the empty state and chart container elements
    const emptyState = document.getElementById('salaryVsExpensesEmpty');
    const chartContainer = chartCanvas.parentElement;

    // Always initialize the chart even if there's no data
    // This ensures the chart is ready when data is added for the first time
    const ctx = chartCanvas.getContext('2d');

    try {
        // Define color scheme
        const computedStyle = getComputedStyle(document.documentElement);
        const chartColors = [
            computedStyle.getPropertyValue('--chart-color-1').trim() || '#6c5ce7',
            computedStyle.getPropertyValue('--chart-color-2').trim() || '#00cec9',
        ];

        // Create chart instance (will be updated when data becomes available)
        new Chart(ctx, {
            type: 'bar',
            data: {
                labels: ['Salary', 'Expenses'],
                datasets: [{
                    label: 'Amount ($)',
                    data: [0, 0], // Initialize with zeros
                    backgroundColor: chartColors,
                    borderRadius: 10,
                    borderWidth: 0,
                    barThickness: 40,
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                animation: {
                    duration: 1000,
                    easing: 'easeOutQuart'
                },
                plugins: {
                    legend: {
                        display: false
                    },
                    tooltip: {
                        backgroundColor: 'rgba(255,255,255,0.9)',
                        titleColor: '#333',
                        bodyColor: '#333',
                        padding: 12,
                        cornerRadius: 8,
                        callbacks: {
                            label: function(context) {
                                return `$${context.raw}`;
                            }
                        }
                    }
                },
                scales: {
                    y: {
                        beginAtZero: true,
                        grid: {
                            color: 'rgba(0,0,0,0.05)',
                        },
                        ticks: {
                            callback: function(value) {
                                return '$' + value;
                            }
                        }
                    }
                }
            }
        });

        console.log('Salary vs Expenses chart initialized');
    } catch (error) {
        console.error('Error initializing Salary vs Expenses chart:', error);
        // Show error message
        chartContainer.innerHTML = `
            <div class="text-center py-4">
                <i class="fas fa-exclamation-circle fa-3x text-danger mb-3"></i>
                <p class="text-danger">Error loading chart</p>
            </div>
        `;
    }
}

/**
 * Update the Salary vs Expenses chart with new data
 * @param {number} salary - Salary amount
 * @param {number} expenses - Expenses amount
 */
function updateSalaryVsExpensesChart(salary, expenses) {
    const chartCanvas = document.getElementById('barChart');
    if (!chartCanvas) return;

    const chart = Chart.getChart(chartCanvas);
    if (!chart) return;

    // Update chart data
    chart.data.datasets[0].data = [salary, expenses];
    chart.update();

    // Show the chart container and hide the empty state
    const emptyState = document.getElementById('salaryVsExpensesEmpty');
    const chartContainer = chartCanvas.parentElement;
    
    if (emptyState) emptyState.style.display = 'none';
    if (chartContainer) chartContainer.style.display = 'flex';
}