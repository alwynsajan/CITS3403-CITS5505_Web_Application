/**
 * Smart Budget Dashboard JavaScript - Modernized Version
 * This file handles all interactive elements of the dashboard with enhanced animations
 */

// For sharing functionality, default to user ID 1 if not set in the HTML
window.currentUserID = window.currentUserID || 1;

// Store initial goal count for reload logic
let initialGoalCount = window.goalData?.length || 0;

// Check if Chart.js is available
function isChartJsAvailable() {
    return typeof Chart !== 'undefined';
}

// DOM ready handler
document.addEventListener('DOMContentLoaded', function() {
    console.log('Dashboard JS loaded');

    // Check if variables were passed from HTML
    console.log('Monthly data:', {
        monthlyLabels: window.monthlyLabels || [],
        monthlyExpenses: window.monthlyExpenses || []
    });

    console.log('Goal data:', window.goalData || []);

    // First, set up the critical UI components and animations
    // This ensures core UI elements work even if API calls fail
    animateCards();

    // Setup active navigation state
    setupActiveNavigation();

    // Setup Share Summary button
    setupShareSummaryButton();

    // Set up "Shared with me" button click event
    setupSharedWithMeButton();
    // Initialize components with loading animations
    setTimeout(function() {
        if (isChartJsAvailable()) {
            initMonthlySpendingChart();
        } else {
            console.error('Chart.js is not available. Charts will not be rendered.');
            const chartContainers = document.querySelectorAll('.chart-container');
            chartContainers.forEach(container => {
                container.innerHTML = `
                    <div class="alert alert-warning">
                        <i class="fas fa-exclamation-triangle me-2"></i>
                        Chart library not loaded. Please refresh the page.
                    </div>
                `;
            });
        }

        initGoalProgress();
        // Setup listener for the New Goal button
        const newGoalButton = document.getElementById('newGoalBtn');
        const goalModalElement = document.getElementById('goalModal');
        if (newGoalButton && goalModalElement) {
            const goalModal = new bootstrap.Modal(goalModalElement);
            newGoalButton.addEventListener('click', function() {
                // Update allocation info before showing the modal
                updateAllocationInfo();
                goalModal.show();
            });
        }

        // Ensure saveGoalBtn listener is attached if the button exists
        const saveGoalButton = document.getElementById('saveGoalBtn');
        if (saveGoalButton) {
            saveGoalButton.addEventListener('click', saveNewGoal);
        }

        // Add event listener to allocation input for real-time validation
        const allocationInput = document.getElementById('allocation');
        if (allocationInput) {
            allocationInput.addEventListener('input', function() {
                const currentValue = parseFloat(this.value) || 0;
                const totalAllocation = calculateTotalAllocation();
                const maxAllocation = 100 - totalAllocation;

                // Update the input validation state
                if (currentValue > maxAllocation) {
                    this.classList.add('is-invalid');
                    const errorMessage = `Maximum available allocation is ${maxAllocation.toFixed(1)}%`;

                    // Create or update error message
                    let errorFeedback = this.nextElementSibling;
                    if (!errorFeedback || !errorFeedback.classList.contains('invalid-feedback')) {
                        errorFeedback = document.createElement('div');
                        errorFeedback.className = 'invalid-feedback';
                        this.parentNode.insertBefore(errorFeedback, this.nextElementSibling);
                    }
                    errorFeedback.textContent = errorMessage;
                } else {
                    this.classList.remove('is-invalid');
                    // Remove error message if it exists
                    const errorFeedback = this.nextElementSibling;
                    if (errorFeedback && errorFeedback.classList.contains('invalid-feedback')) {
                        errorFeedback.remove();
                    }
                }
            });
        }

        // Initialize goals if data exists
        if (window.goalData && window.goalData.length > 0) {
            updateGoalsUI(window.goalData);
        }

        // Initialize Export Report functionality
        setupExportReportFeature();
    }, 300); // Small delay for smoother rendering

    // Hide unread report count by default when page loads
    const unreadReportCount = document.getElementById('unreadReportCount');
    if (unreadReportCount) {
        unreadReportCount.style.display = 'none';
    }

    // Finally, make non-critical API calls that shouldn't block UI rendering
    // This ensures better user experience even if these calls fail
    setTimeout(function() {
        // Initial load of unread count - moved to the end so it doesn't block other functionality
        fetchUnreadReportCount();
    }, 500);
});

/**
 * Fetch unread report count
 * Enhanced with better error handling to prevent blocking other functionality
 */
function fetchUnreadReportCount() {
    // Use try-catch to ensure any uncaught errors don't block other functionality
    try {
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
                // Log error but continue execution
            });
    } catch (error) {
        console.error('Critical error in fetchUnreadReportCount:', error);
        // Ensure errors don't propagate and block other functionality
    }
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
 * Enhanced with better error handling
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

    // Wrap in try-catch to prevent any uncaught errors from breaking functionality
    try {
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
                try {
                    fetchUnreadReportCount();
                } catch (e) {
                    console.error('Error updating unread count:', e);
                    // Continue execution despite error
                }
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
    } catch (error) {
        console.error('Critical error in fetchSharedReports:', error);
        // Show user-friendly error message
        if (reportsContainer) {
            reportsContainer.innerHTML = `
                <div class="text-center py-4">
                    <i class="fas fa-exclamation-triangle fa-3x text-warning mb-3"></i>
                    <p class="text-warning">Something went wrong. Please try again.</p>
                    <button class="btn btn-outline-primary btn-sm mt-2" onclick="fetchSharedReports()">
                        <i class="fas fa-sync-alt"></i> Retry
                    </button>
                </div>
            `;
        }
    }
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

        // Check if this report has a reportId
        const reportId = sender.reportId || `report_${sender.senderID}`;

        html += `
            <a href="#" class="list-group-item list-group-item-action d-flex justify-content-between align-items-center"
               data-sender-id="${sender.senderID}"
               data-report-id="${reportId}"
               onclick="viewSharedReport(${sender.senderID}, '${reportId}'); return false;">
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

 * View shared report details
 * @param {number} senderID - ID of the sender
 * @param {string} reportId - Unique ID of the report to view
 */
function viewSharedReport(senderID, reportId) {
    // Wrap in try-catch to prevent any errors from breaking the UI
    try {
        // Check if a modal view exists, otherwise create a new page
        const hasModalView = document.getElementById('sharedReportViewModal');

        // If we have reportId, mark it as read
        if (reportId) {
            // Mark report as read on server (non-blocking)
            fetch('/dashboard/markReportAsRead', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ reportId: reportId })
            })
            .then(response => response.json())
            .then(data => {
                if (data.status === 'Success') {
                    // Update unread count
                    fetchUnreadReportCount();
                    // Update UI if needed (remove unread indicator)
                    const reportItem = document.querySelector(`.shared-report-item[data-report-id="${reportId}"]`);
                    if (reportItem) {
                        reportItem.classList.remove('unread-report');
                        const unreadDot = reportItem.querySelector('.unread-dot');
                        if (unreadDot) unreadDot.remove();
                    }
                }
            })
            .catch(error => console.error('Error marking report as read:', error));
        }

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
                recipientID: currentUserID,
                reportId: reportId // Include report ID if available
            })
        })
        .then(response => {
            if (!response.ok) {
                throw new Error('Network response was not ok');

            }
            return response.json();
        })
        .then(data => {
            // If using modal display
            if (hasModalView) {
                const modalBody = document.getElementById('sharedReportViewBody');
                const modalTitle = document.getElementById('sharedReportViewTitle');

                if (!modalBody || !modalTitle) return;

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

                if (!modalBody) return;

                // Show error message
                modalBody.innerHTML = `
                    <div class="text-center py-4">
                        <i class="fas fa-exclamation-circle fa-3x text-danger mb-3"></i>
                        <p class="text-danger">Could not load report details. Please try again later.</p>

                        <button class="btn btn-outline-primary btn-sm mt-2" onclick="viewSharedReport(${senderID}, '${reportId}')">

                            <i class="fas fa-sync-alt"></i> Retry
                        </button>
                    </div>
                `;
            }
        });
    } catch (error) {
        console.error('Critical error in viewSharedReport:', error);
        // Handle critical errors gracefully
        // The function will continue execution and not break the UI
    }
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
        // Reverse goals array to show earliest first
        const reversedGoals = [...dashboardData.goalData].reverse();
        const goalData = reversedGoals[0]; // Display the first (earliest) goal
        const hasMultipleGoals = reversedGoals.length > 1;
        html += `
            <div class="card border-0 shadow-sm mb-4">
                <div class="card-body">
                    <h5 class="card-title">Goal Progress: ${hasMultipleGoals ? `1/${reversedGoals.length} ` : ''}${goalData.goalName}</h5>
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
 * Initialize the monthly spending chart with modern styling
 */
function initMonthlySpendingChart() {
    const chartCanvas = document.getElementById('monthlySpendingChart');
    if (!chartCanvas) {
        console.error('Monthly spending chart canvas not found');
        return;
    }

    // Check if Chart.js is available
    if (!isChartJsAvailable()) {
        console.error('Chart.js is not available. Monthly spending chart will not be rendered.');
        const chartContainer = chartCanvas.parentElement;
        if (chartContainer) {
            chartContainer.innerHTML = `
                <div class="alert alert-warning">
                    <i class="fas fa-exclamation-triangle me-2"></i>
                    Chart library not loaded. Please refresh the page.
                </div>
            `;
        }
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
        // Check if there's an existing chart instance and destroy it
        const existingChart = Chart.getChart(chartCanvas);
        if (existingChart) {
            console.log('Destroying existing chart instance');
            existingChart.destroy();
        }

        // Define modern color scheme
        const computedStyle = getComputedStyle(document.documentElement);
        const chartColors = [
            computedStyle.getPropertyValue('--chart-color-1').trim() || '#4e73df',
            computedStyle.getPropertyValue('--chart-color-2').trim() || '#1cc88a',
            computedStyle.getPropertyValue('--chart-color-3').trim() || '#36b9cc',
            computedStyle.getPropertyValue('--chart-color-4').trim() || '#f6c23e',
            computedStyle.getPropertyValue('--chart-color-5').trim() || '#e74a3b'
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
                <p class="text-danger">Error loading chart: ${error.message}</p>
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
 * Calculate the total allocation percentage of existing goals
 * @returns {number} The sum of all goal allocations
 */
function calculateTotalAllocation() {
    // If goalData is not available or empty, return 0
    if (!window.goalData || window.goalData.length === 0) {
        return 0;
    }

    // Sum up all allocations from existing goals
    let totalAllocation = 0;
    window.goalData.forEach(goal => {
        // Check if the goal has an allocation property
        if (goal.allocation) {
            totalAllocation += parseFloat(goal.allocation);
        }
    });

    return totalAllocation;
}

/**
 * Update the allocation information in the goal modal
 * Shows current total allocation and available allocation
 */
function updateAllocationInfo() {
    const currentAllocationElement = document.getElementById('currentAllocation');
    const availableAllocationElement = document.getElementById('availableAllocation');

    if (!currentAllocationElement || !availableAllocationElement) {
        console.error('Allocation info elements not found');
        return;
    }

    // Calculate current total allocation
    const totalAllocation = calculateTotalAllocation();
    const availableAllocation = Math.max(0, 100 - totalAllocation);

    // Update the UI
    currentAllocationElement.textContent = totalAllocation.toFixed(1);
    availableAllocationElement.textContent = availableAllocation.toFixed(1);

    // Update the max attribute of the allocation input
    const allocationInput = document.getElementById('allocation');
    if (allocationInput) {
        allocationInput.max = availableAllocation;

        // Add a warning class if allocation is close to 100%
        const allocationInfo = document.getElementById('allocationInfo');
        if (allocationInfo) {
            if (availableAllocation < 10) {
                allocationInfo.classList.add('text-warning');
            } else {
                allocationInfo.classList.remove('text-warning');
            }
        }
    }
}

/**
 * Save a new goal using AJAX with modern animation feedback and enhanced validation
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

    // Get form values
    const goalNameInput = form.querySelector('[name="goalName"]');
    const targetAmountInput = form.querySelector('[name="targetAmount"]');
    const timeDurationInput = form.querySelector('[name="timeDuration"]');
    const allocationInput = form.querySelector('[name="allocation"]');

    // Enhanced validation
    let isValid = true;
    let errorMessage = '';

    // Validate goal name
    const goalName = goalNameInput.value.trim();
    if (!goalName) {
        isValid = false;
        errorMessage = 'Goal name is required';
        goalNameInput.classList.add('is-invalid');
    } else if (goalName.length > 50) {
        isValid = false;
        errorMessage = 'Goal name must be less than 50 characters';
        goalNameInput.classList.add('is-invalid');
    } else {
        goalNameInput.classList.remove('is-invalid');
        goalNameInput.classList.add('is-valid');
    }

    // Validate target amount
    const targetAmount = parseFloat(targetAmountInput.value);
    if (isNaN(targetAmount) || targetAmount <= 0) {
        isValid = false;
        errorMessage = 'Target amount must be a positive number';
        targetAmountInput.classList.add('is-invalid');
    } else if (targetAmount > 1000000) {
        isValid = false;
        errorMessage = 'Target amount must be less than 1,000,000';
        targetAmountInput.classList.add('is-invalid');
    } else {
        targetAmountInput.classList.remove('is-invalid');
        targetAmountInput.classList.add('is-valid');
    }

    // Validate time duration
    const timeDuration = parseInt(timeDurationInput.value);
    if (isNaN(timeDuration) || timeDuration <= 0) {
        isValid = false;
        errorMessage = 'Time duration must be a positive number';
        timeDurationInput.classList.add('is-invalid');
    } else if (timeDuration > 120) {
        isValid = false;
        errorMessage = 'Time duration must be less than 120 months (10 years)';
        timeDurationInput.classList.add('is-invalid');
    } else {
        timeDurationInput.classList.remove('is-invalid');
        timeDurationInput.classList.add('is-valid');
    }

    // Validate allocation percentage
    const allocation = parseFloat(allocationInput.value);
    if (isNaN(allocation) || allocation <= 0) {
        isValid = false;
        errorMessage = 'Allocation percentage must be a positive number';
        allocationInput.classList.add('is-invalid');
    } else if (allocation > 100) {
        isValid = false;
        errorMessage = 'Allocation percentage cannot exceed 100%';
        allocationInput.classList.add('is-invalid');
    } else {
        // Check if the total allocation (including this new goal) exceeds 100%
        const currentTotalAllocation = calculateTotalAllocation();
        const newTotalAllocation = currentTotalAllocation + allocation;

        if (newTotalAllocation > 100) {
            isValid = false;
            errorMessage = `Allocation exceeds limit. Current total: ${currentTotalAllocation.toFixed(1)}%. Maximum available: ${(100 - currentTotalAllocation).toFixed(1)}%`;
            allocationInput.classList.add('is-invalid');
        } else {
            allocationInput.classList.remove('is-invalid');
            allocationInput.classList.add('is-valid');
        }
    }

    // Show error message if validation fails
    if (!isValid) {
        showAlert(errorMessage, 'danger');
        return;
    }

    // Basic form validation (HTML5)
    if (!form.checkValidity()) {
        form.reportValidity();
        return;
    }

    try {
        // Set loading state
        saveButton.disabled = true;
        saveButton.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Saving...';

        const goalData = {
            goalName: goalName,
            targetAmount: targetAmount,
            timeDuration: timeDuration,
            allocation: allocation
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

            // Reverse goals to show earliest first
            const reversedGoals = [...goals].reverse();

            // Add each goal with staggered animation
            reversedGoals.forEach(function(goal, index) {
                const goalCol = document.createElement('div');
                goalCol.className = 'col-md-6 mb-3';
                goalCol.style.opacity = '0';
                goalCol.style.transform = 'translateY(15px)';

                goalCol.innerHTML = `
                    <div class="card h-100">
                        <div class="card-body">
                            <h5 class="card-title">${reversedGoals.length > 1 ? `${index + 1}/${reversedGoals.length} ` : ''}${goal.goalName}</h5>
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

/**
 * Handle salary addition with enhanced validation and error handling
 */
document.addEventListener('DOMContentLoaded', function() {
    const addSalaryButtons = document.querySelectorAll('.add-salary-btn'); // Select all buttons
    const salaryModalInstance = document.getElementById('salaryModal') ? new bootstrap.Modal(document.getElementById('salaryModal')) : null;
    const saveSalaryBtn = document.getElementById('saveSalaryBtn');
    const salaryForm = document.getElementById('salaryForm');

    // Handle opening the modal from potentially multiple buttons
    addSalaryButtons.forEach(button => {
        button.addEventListener('click', function() {
            if (salaryModalInstance) {
                // Set default date to today when opening the modal
                const salaryDateInput = document.getElementById('salaryDate');
                if (salaryDateInput && !salaryDateInput.value) {
                    const today = new Date();
                    const year = today.getFullYear();
                    const month = String(today.getMonth() + 1).padStart(2, '0');
                    const day = String(today.getDate()).padStart(2, '0');
                    salaryDateInput.value = `${year}-${month}-${day}`;
                }
                salaryModalInstance.show();
            }
        });
    });

    // Add input validation for salary amount
    const salaryAmountInput = document.getElementById('salaryAmount');
    if (salaryAmountInput) {
        salaryAmountInput.addEventListener('input', function() {
            validateSalaryAmount(this);
        });
    }

    // Add input validation for salary date
    const salaryDateInput = document.getElementById('salaryDate');
    if (salaryDateInput) {
        salaryDateInput.addEventListener('input', function() {
            validateSalaryDate(this);
        });
    }

    if (saveSalaryBtn && salaryForm) {
        saveSalaryBtn.addEventListener('click', async function(event) {
            event.preventDefault();

            // Get form values
            const salaryAmountInput = document.getElementById('salaryAmount');
            const salaryDateInput = document.getElementById('salaryDate');

            // Enhanced validation
            let isValid = true;
            let errorMessage = '';

            // Validate salary amount
            const amount = parseFloat(salaryAmountInput.value);
            if (isNaN(amount) || amount <= 0) {
                isValid = false;
                errorMessage = 'Salary amount must be a positive number';
                salaryAmountInput.classList.add('is-invalid');
            } else if (amount < 10) {
                isValid = false;
                errorMessage = 'Salary amount must be at least $10';
                salaryAmountInput.classList.add('is-invalid');
            } else if (amount > 1000000) {
                isValid = false;
                errorMessage = 'Salary amount must be less than $1,000,000';
                salaryAmountInput.classList.add('is-invalid');
            } else {
                salaryAmountInput.classList.remove('is-invalid');
                salaryAmountInput.classList.add('is-valid');
            }

            // Validate salary date
            const date = salaryDateInput.value;
            if (!date) {
                isValid = false;
                errorMessage = 'Please select a date';
                salaryDateInput.classList.add('is-invalid');
            } else {
                const selectedDate = new Date(date);
                const today = new Date();
                if (selectedDate > today) {
                    isValid = false;
                    errorMessage = 'Date cannot be in the future';
                    salaryDateInput.classList.add('is-invalid');
                } else {
                    salaryDateInput.classList.remove('is-invalid');
                    salaryDateInput.classList.add('is-valid');
                }
            }

            // Show error message if validation fails
            if (!isValid) {
                showAlert(errorMessage, 'danger');
                return;
            }

            // Basic form validation (HTML5)
            if (!salaryForm.checkValidity()) {
                salaryForm.reportValidity();
                return;
            }

            // Add loading state to button
            saveSalaryBtn.disabled = true;
            saveSalaryBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Saving...';

            try {
                console.log('Sending salary data:', { amount, date });

                const response = await fetch('/dashboard/addSalary', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({
                        amount: amount,
                        date: date
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

/**
 * Validate salary amount input
 * @param {HTMLInputElement} input - The salary amount input element
 * @returns {boolean} - Whether the input is valid
 */
function validateSalaryAmount(input) {
    const amount = parseFloat(input.value);
    const errorContainer = input.nextElementSibling;
    let isValid = true;
    let errorMessage = '';

    // Remove any existing error message
    if (errorContainer && errorContainer.classList.contains('invalid-feedback')) {
        errorContainer.remove();
    }

    // Validate amount
    if (isNaN(amount) || amount <= 0) {
        isValid = false;
        errorMessage = 'Salary amount must be a positive number';
    } else if (amount < 10) {
        isValid = false;
        errorMessage = 'Salary amount must be at least $10';
    } else if (amount > 1000000) {
        isValid = false;
        errorMessage = 'Salary amount must be less than $1,000,000';
    }

    // Update UI based on validation
    if (!isValid) {
        input.classList.add('is-invalid');
        input.classList.remove('is-valid');

        // Create error message
        const errorDiv = document.createElement('div');
        errorDiv.className = 'invalid-feedback';
        errorDiv.textContent = errorMessage;
        input.parentNode.insertBefore(errorDiv, input.nextSibling);
    } else {
        input.classList.remove('is-invalid');
        input.classList.add('is-valid');
    }

    return isValid;
}

/**
 * Validate salary date input
 * @param {HTMLInputElement} input - The salary date input element
 * @returns {boolean} - Whether the input is valid
 */
function validateSalaryDate(input) {
    const date = input.value;
    const errorContainer = input.nextElementSibling;
    let isValid = true;
    let errorMessage = '';

    // Remove any existing error message
    if (errorContainer && errorContainer.classList.contains('invalid-feedback')) {
        errorContainer.remove();
    }

    // Validate date
    if (!date) {
        isValid = false;
        errorMessage = 'Please select a date';
    } else {
        const selectedDate = new Date(date);
        const today = new Date();
        if (selectedDate > today) {
            isValid = false;
            errorMessage = 'Date cannot be in the future';
        }
    }

    // Update UI based on validation
    if (!isValid) {
        input.classList.add('is-invalid');
        input.classList.remove('is-valid');

        // Create error message
        const errorDiv = document.createElement('div');
        errorDiv.className = 'invalid-feedback';
        errorDiv.textContent = errorMessage;
        input.parentNode.insertBefore(errorDiv, input.nextSibling);
    } else {
        input.classList.remove('is-invalid');
        input.classList.add('is-valid');
    }

    return isValid;
}

// Ensure global currentGoalIndex is consistent with updateGoalsUI's currentIndex
let currentGoalIndex = 0; // Defined as global variable

function updateGoalsUI(goals) {
    console.log('Updating goals UI with:', goals);
    if (!goals || !goals.length) {
        console.log('No goals to display');
        return;
    }

    // Create a reversed copy of the goals array to handle the order correctly
    // Since backend adds newest goals at the front, we need to reverse the array
    // to make the earliest added goal show as 1/n
    const reversedGoals = [...goals].reverse();

    // Update the first goal display (which should be the earliest added goal)
    const firstGoal = reversedGoals[0];
    const goalName = document.querySelector('.goal-progress h3');
    const progressPercentage = document.querySelector('.progress-percentage');
    const goalTarget = document.getElementById('goalTarget');
    const goalSaved = document.getElementById('goalSaved');
    const goalRemaining = document.getElementById('goalRemaining');
    const goalMessage = document.getElementById('goalMessage');

    // Don't show numbering if there's only one goal
    if (goalName) {
        goalName.textContent = reversedGoals.length > 1 ?
            `1/${reversedGoals.length} ${firstGoal.goalName}` :
            firstGoal.goalName;
    }
    if (progressPercentage) progressPercentage.textContent = `${firstGoal.progressPercentage}%`;
    if (goalTarget) goalTarget.textContent = firstGoal.target;
    if (goalSaved) goalSaved.textContent = firstGoal.saved;
    if (goalRemaining) goalRemaining.textContent = firstGoal.remaining;
    if (goalMessage) goalMessage.textContent = firstGoal.message || '';

    // Handle goal navigation
    const goalCard = document.querySelector('.goal-card');
    const goalSelectorContainer = document.querySelector('.goal-selector');

    if (reversedGoals.length > 1) {
        console.log('Multiple goals detected:', reversedGoals.length);
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
                    <span class="goal-counter">1/${reversedGoals.length}</span>
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
            if (index < 0 || index >= reversedGoals.length) {
                console.error('Invalid goal index:', index);
                return;
            }

            console.log('Updating goal display for index:', index);
            const goal = reversedGoals[index];
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
            // Don't show numbering if there's only one goal
            if (elements.goalName) {
                elements.goalName.textContent = reversedGoals.length > 1 ?
                    `${index + 1}/${reversedGoals.length} ${goal.goalName}` :
                    goal.goalName;
            }
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

            // Update counter but keep buttons enabled for circular navigation
            if (counter) counter.textContent = `${index + 1}/${reversedGoals.length}`;
        }

        // Remove existing event listeners
        const newPrevBtn = prevBtn.cloneNode(true);
        const newNextBtn = nextBtn.cloneNode(true);
        prevBtn.parentNode.replaceChild(newPrevBtn, prevBtn);
        nextBtn.parentNode.replaceChild(newNextBtn, nextBtn);

        // Add new event listeners
        newPrevBtn.addEventListener('click', () => {
            console.log('Previous button clicked');
            // Implement full circular navigation
            currentIndex = (currentIndex - 1 + reversedGoals.length) % reversedGoals.length;
            updateGoalDisplay(currentIndex);
        });

        newNextBtn.addEventListener('click', () => {
            console.log('Next button clicked');
            // Implement full circular navigation
            currentIndex = (currentIndex + 1) % reversedGoals.length;
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

/**
 * Check if CountUp.js is available
 * @returns {boolean} True if CountUp is defined, false otherwise
 */
function isCountUpAvailable() {
    if (typeof CountUp === 'undefined') {
        console.error('CountUp.js is not loaded. Please include the CountUp.js library.');
        return false;
    }
    return true;
}

/**
 * Initialize CountUp animations for dynamic number displays
 */
function initCountUp() {
    // Check if CountUp is available
    if (!isCountUpAvailable()) {
        return;
    }

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

    // Reverse goalData to match our display order (earliest first)
    const reversedGoalData = [...window.goalData].reverse();
    const currentGoal = reversedGoalData[currentGoalIndex];
    if (!currentGoal) return;

    // Update goal name
    const goalName = document.querySelector('.goal-progress h3');
    // Don't show numbering if there's only one goal
    if (goalName) {
        goalName.textContent = reversedGoalData.length > 1 ?
            `${currentGoalIndex + 1}/${reversedGoalData.length} ${currentGoal.goalName}` :
            currentGoal.goalName;
    }

    // Update progress
    const progressPercentage = document.querySelector('.progress-percentage');
    if (progressPercentage && isCountUpAvailable()) {
        new CountUp('goalProgress', currentGoal.progressPercentage, {
            suffix: '%',
            duration: 1,
            decimalPlaces: 1
        }).start();
    } else if (progressPercentage) {
        // Fallback if CountUp is not available
        progressPercentage.textContent = `${currentGoal.progressPercentage}%`;
    }

    // Update goal details
    const goalTarget = document.getElementById('goalTarget');
    const goalSaved = document.getElementById('goalSaved');
    const goalRemaining = document.getElementById('goalRemaining');
    const goalMessage = document.getElementById('goalMessage');

    if (goalTarget) goalTarget.textContent = currentGoal.target;
    if (goalSaved) goalSaved.textContent = currentGoal.saved;
    if (goalRemaining) goalRemaining.textContent = currentGoal.remaining;
    if (goalMessage) goalMessage.textContent = currentGoal.message || '';

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

    const prevBtn = document.getElementById('prevGoalBtn');
    const nextBtn = document.getElementById('nextGoalBtn');

    // Reset current index for better UX
    currentGoalIndex = 0;

    if (prevBtn) {
        prevBtn.addEventListener('click', () => {
            // Ensure circular navigation: when at first goal, previous button goes to last goal
            currentGoalIndex = (currentGoalIndex - 1 + window.goalData.length) % window.goalData.length;
            switchGoal('prev');
        });
    }

    if (nextBtn) {
        nextBtn.addEventListener('click', () => {
            // Ensure circular navigation: when at last goal, next button goes to first goal
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

/**
 * Setup export report feature
 * Handles user search, selection and report sharing
 */
function setupExportReportFeature() {
    // Initialize form elements
    const userSearchInput = document.getElementById('userSearch');
    const searchResults = document.getElementById('searchResults');
    const userSearchLoading = document.getElementById('userSearchLoading');
    const selectedUserDiv = document.getElementById('selectedUser');
    const selectedUserName = document.getElementById('selectedUserName');
    const clearSelectedUserBtn = document.getElementById('clearSelectedUser');
    const shareReportBtn = document.getElementById('shareReportBtn');

    // Shared state
    let selectedUserId = null;
    let searchTimeout = null;

    // Reset form when modal is shown (using Bootstrap event)
    $('#exportReportModal').on('show.bs.modal', function() {
        userSearchInput.value = '';
        searchResults.style.display = 'none';
        selectedUserDiv.classList.add('d-none');
        shareReportBtn.disabled = true;
        selectedUserId = null;
    });

    // Handle user search input
    userSearchInput.addEventListener('input', function() {
        const query = this.value.trim();

        // Clear previous timeout
        if (searchTimeout) {
            clearTimeout(searchTimeout);
        }

        // Hide selected user when input changes
        selectedUserDiv.classList.add('d-none');
        selectedUserId = null;
        shareReportBtn.disabled = true;

        // If empty query, show prompt
        if (query.length === 0) {
            searchResults.innerHTML = `
                <div class="list-group-item text-center text-muted" style="padding: 0.75rem 1.25rem; border: 1px solid rgba(0,0,0,.125);">
                    <i class="fas fa-keyboard me-2"></i>Please type to search users
                </div>
            `;
            searchResults.style.display = 'block';
            return;
        }

        // Show loading indicator
        userSearchLoading.classList.remove('d-none');

        // Set timeout to avoid too many requests
        searchTimeout = setTimeout(() => {
            // Fetch users that match the query
            fetch(`/dashboard/getUsernamesAndIDs?query=${encodeURIComponent(query)}`)
                .then(response => response.json())
                .then(data => {
                    // Hide loading indicator
                    userSearchLoading.classList.add('d-none');

                    if (data.status === "Success" && data.data && data.data.length > 0) {
                        // Clear previous results
                        searchResults.innerHTML = '';

                        // Add each user to results
                        data.data.forEach(user => {
                            const userItem = document.createElement('a');
                            userItem.href = '#';
                            userItem.className = 'list-group-item list-group-item-action';
                            userItem.dataset.userId = user.userID;
                            userItem.dataset.userName = `${user.firstName} ${user.lastName}`;
                            userItem.innerHTML = `
                                <div class="d-flex justify-content-between align-items-center">
                                    <div>
                                        <div class="fw-bold">${user.firstName} ${user.lastName}</div>
                                        <small class="text-muted">${user.username}</small>
                                    </div>
                                    <i class="fas fa-user-circle text-primary"></i>
                                </div>
                            `;

                            // Add click event to select user
                            userItem.addEventListener('click', function(e) {
                                e.preventDefault();

                                // Set selected user
                                selectedUserId = this.dataset.userId;
                                selectedUserName.textContent = this.dataset.userName;

                                // Show selected user, hide search results
                                selectedUserDiv.classList.remove('d-none');
                                searchResults.style.display = 'none';

                                // Clear search input
                                userSearchInput.value = '';

                                // Enable share button
                                shareReportBtn.disabled = false;
                            });

                            searchResults.appendChild(userItem);
                        });

                        // Show search results
                        searchResults.style.display = 'block';
                    } else {
                        // No results found
                        searchResults.innerHTML = `
                            <div class="list-group-item text-center text-muted">
                                <i class="fas fa-search me-2"></i>No users found
                            </div>
                        `;
                        searchResults.style.display = 'block';
                    }
                })
                .catch(error => {
                    console.error('Error searching users:', error);
                    userSearchLoading.classList.add('d-none');
                    searchResults.innerHTML = `
                        <div class="list-group-item text-center text-danger">
                            <i class="fas fa-exclamation-triangle me-2"></i>Error searching users
                        </div>
                    `;
                    searchResults.style.display = 'block';
                });
        }, 300);
    });

    // Handle clear selected user button
    clearSelectedUserBtn.addEventListener('click', function() {
        selectedUserDiv.classList.add('d-none');
        selectedUserId = null;
        shareReportBtn.disabled = true;
        userSearchInput.focus();
    });

    // Handle share report button
    shareReportBtn.addEventListener('click', function() {
        if (!selectedUserId) {
            showAlert('Please select a user to share with.', 'warning');
            return;
        }

        shareReportBtn.disabled = true;
        shareReportBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Sending...';

        const reportData = {
            recipientID: selectedUserId,
            senderID: window.currentUserID
        };

        // Use the correct endpoint for sending report
        fetch('/dashboard/sentReport', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(reportData)
        })
        .then(response => response.json())
        .then(data => {
            if (data.status === "Success") {
                // Check if the response contains a reportId
                const reportIdMsg = data.reportId ?
                    `Report ID: ${data.reportId}` : '';

                showAlert(`Report sent successfully! ${reportIdMsg}`, 'success');
                $('#exportReportModal').modal('hide');

                // Save reportId in localStorage for reference if needed
                if (data.reportId) {
                    // Store the last 5 sent report IDs
                    const sentReports = JSON.parse(localStorage.getItem('sentReports') || '[]');
                    sentReports.unshift({
                        reportId: data.reportId,
                        recipientName: document.getElementById('selectedUserName').textContent,
                        timestamp: new Date().toISOString()
                    });
                    // Keep only the 5 most recent reports
                    if (sentReports.length > 5) {
                        sentReports.pop();
                    }
                    localStorage.setItem('sentReports', JSON.stringify(sentReports));
                }
            } else {
                throw new Error(data.message || 'Failed to send report');
            }
        })
        .catch(error => {
            console.error('Error sending report:', error);
            showAlert('Send failed: ' + error.message, 'danger');
        })
        .finally(() => {
            shareReportBtn.disabled = false;
            shareReportBtn.innerHTML = '<i class="fas fa-share-square me-2"></i>Send Report';
        });
    });
}

/**
 * Show loading state on an element
 * @param {HTMLElement} element - The element to show loading on
 * @param {string} text - Loading text to display
 */
function showLoading(element, text = 'Loading...') {
    element.disabled = true;
    element.dataset.originalText = element.innerHTML;
    element.innerHTML = `<i class="fas fa-spinner fa-spin"></i> ${text}`;
}

/**
 * Hide loading state and restore original content
 * @param {HTMLElement} element - The element to hide loading on
 */
function hideLoading(element) {
    element.disabled = false;
    element.innerHTML = element.dataset.originalText;
}

/**
 * Validate goal data for required fields and valid values
 * @param {Object} data - Goal data to validate
 * @returns {Object} Validation result with isValid flag and message
 */
function validateGoalData(data) {
    if (!data.goalName?.trim()) {
        return { isValid: false, message: 'Goal name is required' };
    }
    if (!data.targetAmount || data.targetAmount <= 0) {
        return { isValid: false, message: 'Invalid target amount' };
    }
    if (!data.timeDuration || data.timeDuration < 1) {
        return { isValid: false, message: 'Invalid time duration' };
    }
    return { isValid: true };
}

/**
 * Update account balance with animation
 * @param {Object} accountData - Account data with balance and trend info
 */
function updateAccountBalance(accountData) {
    if (!accountData) return;

    const balanceElement = document.getElementById('balanceAmount');
    const trendElement = document.querySelector('.balance-trend');

    if (balanceElement) {
        new CountUp('balanceAmount', accountData.balance, {
            prefix: '$',
            duration: 2,
            decimalPlaces: 2
        }).start();
    }

    if (trendElement) {
        trendElement.innerHTML = `
            <span class="badge bg-${accountData.trendType === 'up' ? 'success' : 'danger'} me-2">
                <i class="fas fa-arrow-${accountData.trendType}"></i>
                ${accountData.percentageChange}%
            </span>
        `;
    }
}

/**
 * Utility: show a Bootstrap alert message
 * @param {string} message - Alert message text
 * @param {string} type - Bootstrap alert type (e.g., 'success','warning','danger','info')
 */
function showAlert(message, type = 'info') {
    const container = document.querySelector('.main-content') || document.body;
    const alertDiv = document.createElement('div');
    alertDiv.className = `alert alert-${type} alert-dismissible fade show`;
    alertDiv.role = 'alert';
    alertDiv.innerHTML = `
        ${message}
        <button type="button" class="btn-close" data-bs-dismiss="alert"></button>
    `;
    container.prepend(alertDiv);
    setTimeout(() => alertDiv.remove(), 5000);
}