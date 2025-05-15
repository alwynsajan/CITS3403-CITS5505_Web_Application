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

/**
 * Add global CSS styles for animations and visual effects
 */
function addGlobalStyles() {
    if (!document.getElementById('dashboard-global-styles')) {
        const style = document.createElement('style');
        style.id = 'dashboard-global-styles';
        style.textContent = `
            @keyframes pulse {
                0% { box-shadow: 0 0 0 0 rgba(108, 92, 231, 0.7); }
                50% { box-shadow: 0 0 0 10px rgba(108, 92, 231, 0); }
                100% { box-shadow: 0 0 0 0 rgba(108, 92, 231, 0); }
            }

            @keyframes highlight-balance {
                0% { background-color: rgba(108, 92, 231, 0.1); }
                100% { background-color: transparent; }
            }

            .balance-updated {
                animation: highlight-balance 2s ease;
            }

            .salary-added {
                animation: pulse 1.5s;
            }

            .goal-new {
                animation: pulse 1.5s;
                box-shadow: 0 0 15px rgba(108, 92, 231, 0.5);
            }

            .goal-completed {
                animation: pulse 1.5s;
                box-shadow: 0 0 15px rgba(40, 167, 69, 0.5);
            }
        `;
        document.head.appendChild(style);
        console.log('Added global styles for animations');
    }
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

    // Add global CSS styles for animations
    addGlobalStyles();

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
        fetch('/dashboard/getReport', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                userID: senderID,
                date: new Date().toISOString().split('T')[0],
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
    // Check if any goals have reached 100% completion
    if (window.goalData && window.goalData.length > 0) {
        console.log('Goals found:', window.goalData.length);

        // Check for completed goals
        const completedGoals = window.goalData.filter(goal => goal.progressPercentage >= 100);
        if (completedGoals.length > 0) {
            console.log('Found completed goals:', completedGoals.length);

            // Show notifications for completed goals
            completedGoals.forEach(goal => {
                // Delay the notification slightly to ensure the UI is ready
                setTimeout(() => {
                    showAlert(`Congratulations! Your goal "${goal.goalName}" is now 100% complete and ready to redeem!`, 'success', 5000);
                }, 1000);
            });
        }

        // Visualization for multiple goals
        renderMultipleGoals(window.goalData);
    }

    // For individual goal progress circles
    const progressCircles = document.querySelectorAll('.progress-circle');
    console.log('Found progress circles:', progressCircles.length);

    // Add a slight delay to ensure DOM is fully rendered
    setTimeout(() => {
        progressCircles.forEach(function(circle) {
            updateGoalProgressCircle(circle, true);
        });

        // Add visual highlight to completed goal cards
        if (window.goalData) {
            const completedGoals = window.goalData.filter(goal => goal.progressPercentage >= 100);
            if (completedGoals.length > 0) {
                // Highlight in single goal view
                const goalCard = document.querySelector('.goal-card');
                if (goalCard) {
                    goalCard.classList.add('goal-completed');
                    setTimeout(() => {
                        goalCard.classList.remove('goal-completed');
                    }, 3000);
                }

                // Highlight in multiple goals view
                const goalsContainer = document.getElementById('goalsContainer');
                if (goalsContainer) {
                    completedGoals.forEach(goal => {
                        const goalCards = goalsContainer.querySelectorAll('.card');
                        goalCards.forEach(card => {
                            const label = card.querySelector('.progress-label, .card-title');
                            if (label && label.textContent.includes(goal.goalName)) {
                                card.classList.add('goal-completed');
                                setTimeout(() => {
                                    card.classList.remove('goal-completed');
                                }, 3000);
                            }
                        });
                    });
                }
            }
        }
    }, 500);
}

/**
 * Update a specific goal progress circle with animation (SVG version)
 * @param {HTMLElement} circleElement - The progress circle element
 * @param {boolean} animate - Whether to animate the update
 */
function updateGoalProgressCircle(circleElement, animate = false) {
    if (!circleElement) {
        console.error('updateGoalProgressCircle called with no circleElement');
        return;
    }

    // Check if this is an SVG version or needs to be converted
    let svg = circleElement.querySelector('svg.goal-progress-svg');
    let bar = svg ? svg.querySelector('.progress-bar') : null;
    const percentageElem = circleElement.querySelector('.progress-percentage');

    // If SVG elements don't exist, create them
    if (!svg || !bar) {
        console.log('SVG elements not found, creating them');

        // Create SVG structure
        svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
        svg.setAttribute("class", "goal-progress-svg");
        svg.setAttribute("width", "150");
        svg.setAttribute("height", "150");

        // Create background circle
        const bgCircle = document.createElementNS("http://www.w3.org/2000/svg", "circle");
        bgCircle.setAttribute("class", "progress-bg");
        bgCircle.setAttribute("cx", "75");
        bgCircle.setAttribute("cy", "75");
        bgCircle.setAttribute("r", "65");
        bgCircle.setAttribute("stroke", "#eee");
        bgCircle.setAttribute("stroke-width", "14");
        bgCircle.setAttribute("fill", "none");

        // Create progress bar circle
        bar = document.createElementNS("http://www.w3.org/2000/svg", "circle");
        bar.setAttribute("class", "progress-bar");
        bar.setAttribute("cx", "75");
        bar.setAttribute("cy", "75");
        bar.setAttribute("r", "65");
        bar.setAttribute("stroke", "var(--primary-color)");
        bar.setAttribute("stroke-width", "14");
        bar.setAttribute("fill", "none");
        bar.setAttribute("stroke-linecap", "round");

        // Add circles to SVG
        svg.appendChild(bgCircle);
        svg.appendChild(bar);

        // Clear the progress circle element and add the SVG
        // Keep the inner content for percentage display
        const innerContent = circleElement.innerHTML;
        circleElement.innerHTML = '';
        circleElement.appendChild(svg);

        // Create or restore the inner content container
        const innerContainer = document.createElement('div');
        innerContainer.className = 'progress-circle-inner';
        innerContainer.style.position = 'absolute';
        innerContainer.style.top = '0';
        innerContainer.style.left = '0';
        innerContainer.style.width = '100%';
        innerContainer.style.height = '100%';
        innerContainer.style.display = 'flex';
        innerContainer.style.flexDirection = 'column';
        innerContainer.style.alignItems = 'center';
        innerContainer.style.justifyContent = 'center';
        innerContainer.style.pointerEvents = 'none';

        // If we had inner content, restore it, otherwise create new percentage element
        if (innerContent && innerContent.trim()) {
            innerContainer.innerHTML = innerContent;
        } else if (!percentageElem) {
            const percentSpan = document.createElement('span');
            percentSpan.className = 'progress-percentage';
            percentSpan.textContent = '0%';
            innerContainer.appendChild(percentSpan);
        }

        circleElement.appendChild(innerContainer);
    }

    // Get the percentage element again in case it was just created
    const updatedPercentageElem = percentageElem || circleElement.querySelector('.progress-percentage');

    if (!updatedPercentageElem) {
        console.error('Could not find or create percentage element');
        return;
    }

    // Get percentage from the element text
    let percentage = parseFloat(updatedPercentageElem.textContent);

    // If percentage is NaN, try to get it from the goal data
    if (isNaN(percentage) && window.goalData && window.goalData.length > 0) {
        // For single goal view, use the first goal's progress
        const firstGoal = window.goalData[0];
        if (firstGoal && typeof firstGoal.progressPercentage !== 'undefined') {
            percentage = firstGoal.progressPercentage;
            percentageElem.textContent = `${percentage}%`;
            console.log('Setting progress percentage from goalData:', percentage);
        } else {
            percentage = 0;
        }
    } else if (isNaN(percentage)) {
        percentage = 0;
    }

    console.log('Updating progress circle with percentage:', percentage);

    // Circle parameters
    const r = 65;
    const c = 2 * Math.PI * r;
    // Progress
    const progress = Math.max(0, Math.min(percentage, 100));
    const offset = c * (1 - progress / 100);

    // Apply the stroke properties with animation
    bar.setAttribute('stroke-dasharray', c);
    bar.setAttribute('stroke-dashoffset', offset);
    bar.setAttribute('stroke', getComputedStyle(document.documentElement).getPropertyValue('--primary-color').trim());
    bar.setAttribute('style', 'transition: stroke-dashoffset 1s cubic-bezier(0.4,0,0.2,1); transform: rotate(-90deg); transform-origin: 75px 75px;');

    // Update the percentage text
    if (updatedPercentageElem) {
        updatedPercentageElem.textContent = `${Math.round(progress)}%`;
    }

    // Check if goal is 100% complete and add redeem button if needed
    if (percentage >= 100) {
        console.log('Goal is 100% complete, checking if redeem button exists');

        // Find the goal card that contains this circle
        const goalCard = circleElement.closest('.goal-card');
        if (!goalCard) {
            console.error('Could not find goal card for this progress circle');
            return;
        }

        console.log('Found goal card:', goalCard);

        // Find the goal details container - try different approaches
        let goalDetails = goalCard.querySelector('#goalDetails');

        // If not found by ID, try to find it by class
        if (!goalDetails) {
            goalDetails = goalCard.querySelector('.goal-details');
            console.log('Found goal details by class:', goalDetails);
        }

        // If still not found, try to find any container that might hold the details
        if (!goalDetails) {
            goalDetails = goalCard.querySelector('.card-body > div');
            console.log('Found potential goal details container:', goalDetails);
        }

        if (goalDetails) {
            // Remove existing redeem button if any
            const existingRedeemBtn = goalDetails.querySelector('.redeem-goal-btn');
            if (existingRedeemBtn) {
                console.log('Redeem button already exists');
                return;
            }

            // Get goal name from the card
            let goalName = null;

            // Try different approaches to find the goal name
            const nameElement = goalCard.querySelector('.goal-progress h3, .progress-label, h3');
            if (nameElement) {
                goalName = nameElement.textContent.trim();

                // Remove numbering pattern like "1/2 " if present
                const numberingMatch = goalName.match(/^\d+\/\d+\s+(.+)$/);
                if (numberingMatch) {
                    goalName = numberingMatch[1];
                }

                console.log('Found goal name:', goalName);
            }

            // Get target amount
            let targetAmount = null;

            // Try to find target amount from the goal details
            const paragraphs = goalDetails.querySelectorAll('p');
            paragraphs.forEach(p => {
                if (p.textContent.includes('Target:')) {
                    const targetText = p.textContent;
                    const match = targetText.match(/\$?([\d,]+(\.\d+)?)/);
                    if (match) {
                        targetAmount = match[1].replace(/,/g, '');
                        console.log('Found target amount from paragraphs:', targetAmount);
                    }
                }
            });

            // If still not found, try to get it from window.goalData
            if (!targetAmount && goalName && window.goalData) {
                const goal = window.goalData.find(g => g.goalName === goalName);
                if (goal && goal.target) {
                    // Extract numeric value from target (e.g., "$1,000.00" -> "1000.00")
                    const match = goal.target.match(/\$?([\d,]+(\.\d+)?)/);
                    if (match) {
                        targetAmount = match[1].replace(/,/g, '');
                        console.log('Found target amount from goalData:', targetAmount);
                    } else {
                        // If no match, use the target as is (might be a number already)
                        if (typeof goal.target === 'number') {
                            targetAmount = goal.target.toString();
                            console.log('Using numeric target from goalData:', targetAmount);
                        } else {
                            targetAmount = goal.target;
                            console.log('Using target as-is from goalData:', targetAmount);
                        }
                    }
                }
            }

            // If we have both goal name and target amount, add the redeem button
            if (goalName && targetAmount) {
                console.log('Adding redeem button for goal:', goalName, 'with target:', targetAmount);

                const redeemBtn = document.createElement('button');
                redeemBtn.className = 'btn btn-success btn-sm mt-2 redeem-goal-btn';
                redeemBtn.innerHTML = '<i class="fas fa-shopping-cart me-1"></i>Redeem as Shopping';
                redeemBtn.setAttribute('data-goal-name', goalName);
                redeemBtn.setAttribute('data-goal-amount', targetAmount);

                // Add event listener with proper error handling
                redeemBtn.addEventListener('click', function() {
                    try {
                        console.log('Redeem button clicked for goal:', goalName, 'with amount:', targetAmount);
                        redeemGoal(goalName, targetAmount);
                    } catch (error) {
                        console.error('Error in redeem button click handler:', error);
                        showAlert('An error occurred while redeeming the goal. Please try again.', 'danger');
                    }
                });

                // Add the button to the goal details
                goalDetails.appendChild(redeemBtn);
                console.log('Redeem button added successfully');

                // Add visual highlight to the goal card
                goalCard.classList.add('goal-completed');
                setTimeout(() => {
                    goalCard.classList.remove('goal-completed');
                }, 3000);

                // Show a notification
                showAlert(`Congratulations! Your goal "${goalName}" is now 100% complete and ready to redeem!`, 'success', 5000);
            } else {
                console.error('Could not add redeem button: missing goal name or target amount', { goalName, targetAmount });
            }
        } else {
            console.error('Could not find goal details container');
        }
    }
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

    // Clear previous validation states
    const formInputs = form.querySelectorAll('.form-control');
    formInputs.forEach(input => {
        input.classList.remove('is-invalid', 'is-valid');
        const feedback = input.parentElement.querySelector('.invalid-feedback');
        if (feedback) {
            feedback.remove();
        }
    });

    // Enhanced validation
    let isValid = true;
    let errorMessage = '';

    // Validate goal name
    const goalName = goalNameInput.value.trim();
    if (!goalName) {
        isValid = false;
        errorMessage = 'Goal name is required';
        goalNameInput.classList.add('is-invalid');
        addInvalidFeedback(goalNameInput, errorMessage);
    } else if (goalName.length > 50) {
        isValid = false;
        errorMessage = 'Goal name must be less than 50 characters';
        goalNameInput.classList.add('is-invalid');
        addInvalidFeedback(goalNameInput, errorMessage);
    } else {
        // Check for duplicate goal names
        const isDuplicate = checkDuplicateGoalName(goalName);
        if (isDuplicate) {
            isValid = false;
            errorMessage = 'A goal with this name already exists';
            goalNameInput.classList.add('is-invalid');
            addInvalidFeedback(goalNameInput, errorMessage);

            // Show alert for duplicate goal name
            showAlert('A goal with this name already exists. Please use a different name.', 'warning');
        } else {
            goalNameInput.classList.remove('is-invalid');
            goalNameInput.classList.add('is-valid');
        }
    }

    // Helper function to add invalid feedback
    function addInvalidFeedback(input, message) {
        const invalidFeedback = input.parentElement.querySelector('.invalid-feedback');
        if (!invalidFeedback) {
            const feedbackDiv = document.createElement('div');
            feedbackDiv.className = 'invalid-feedback';
            feedbackDiv.textContent = message;
            input.parentElement.appendChild(feedbackDiv);
        } else {
            invalidFeedback.textContent = message;
        }
    }

    // Validate target amount
    const targetAmount = parseFloat(targetAmountInput.value);
    if (isNaN(targetAmount) || targetAmount <= 0) {
        isValid = false;
        errorMessage = 'Target amount must be a positive number';
        targetAmountInput.classList.add('is-invalid');
        addInvalidFeedback(targetAmountInput, errorMessage);
    } else if (targetAmount > 1000000) {
        isValid = false;
        errorMessage = 'Target amount must be less than 1,000,000';
        targetAmountInput.classList.add('is-invalid');
        addInvalidFeedback(targetAmountInput, errorMessage);
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
        addInvalidFeedback(timeDurationInput, errorMessage);
    } else if (timeDuration > 120) {
        isValid = false;
        errorMessage = 'Time duration must be less than 120 months (10 years)';
        timeDurationInput.classList.add('is-invalid');
        addInvalidFeedback(timeDurationInput, errorMessage);
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
        addInvalidFeedback(allocationInput, errorMessage);
    } else if (allocation > 100) {
        isValid = false;
        errorMessage = 'Allocation percentage cannot exceed 100%';
        allocationInput.classList.add('is-invalid');
        addInvalidFeedback(allocationInput, errorMessage);
    } else {
        // Check if the total allocation (including this new goal) exceeds 100%
        const currentTotalAllocation = calculateTotalAllocation();
        const newTotalAllocation = currentTotalAllocation + allocation;

        if (newTotalAllocation > 100) {
            isValid = false;
            errorMessage = `Allocation exceeds limit. Current total: ${currentTotalAllocation.toFixed(1)}%. Maximum available: ${(100 - currentTotalAllocation).toFixed(1)}%`;
            allocationInput.classList.add('is-invalid');
            addInvalidFeedback(allocationInput, errorMessage);

            // Show alert for allocation exceeding 100%
            showAlert(`Total allocation would exceed 100%. Current total: ${currentTotalAllocation.toFixed(1)}%, Maximum available: ${(100 - currentTotalAllocation).toFixed(1)}%`, 'warning');
        } else {
            allocationInput.classList.remove('is-invalid');
            allocationInput.classList.add('is-valid');
        }
    }

    // Show error message if validation fails
    if (!isValid) {
        // Only show general alert for errors that don't already have specific alerts
        // (duplicate goal name and allocation exceeding 100% already show specific alerts)
        if (errorMessage && !errorMessage.includes('already exists') && !errorMessage.includes('Allocation exceeds limit')) {
            showAlert(errorMessage, 'danger');
        }
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

        // Update initialGoalCount for future reference
        initialGoalCount = result.data?.length || 0;

        if (!response.ok || result.status !== "Success") {
            // Use message from server if available, otherwise generic error
            throw new Error(result.message || `HTTP error! status: ${response.status}`);
        }

        // Close modal and update UI without reloading the page
        const modal = bootstrap.Modal.getInstance(document.getElementById('goalModal'));
        if (modal) {
            modal.hide();
            const backdrop = document.querySelector('.modal-backdrop');
            if (backdrop) backdrop.remove();
            document.body.classList.remove('modal-open');
            document.body.style.overflow = '';
            document.body.style.paddingRight = '';
        }

        // Update goal data
        window.goalData = result.data;
        window.hasGoal = true; // Important: set hasGoal to true

        // Show success message
        showAlert(`Goal "${goalName}" added successfully!`, 'success');

        // Log the current state
        console.log('Current window.goalData:', window.goalData);
        console.log('Current window.hasGoal:', window.hasGoal);

        // Force a page refresh after a short delay to ensure correct goal card display
        console.log('Forcing page refresh after adding goal');
        setTimeout(() => {
            window.location.reload();
        }, 1000); // 1 second delay to allow the success message to be seen

        // First, check if we're in single goal view or multiple goals view
        const singleGoalCard = document.querySelector('.goal-card');
        const multipleGoalsContainer = document.getElementById('goalsContainer');

        if (singleGoalCard) {
            console.log('In single goal view, updating UI');

            // Check if the card has an empty state
            const emptyState = singleGoalCard.querySelector('.empty-state');
            if (emptyState) {
                console.log('Found empty state in goal card, replacing with goal data');

                // Get the card body
                const cardBody = singleGoalCard.querySelector('.card-body');
                if (cardBody) {
                    // Replace empty state with goal data
                    const firstGoal = window.goalData[0];

                    // Update the card body with the goal data
                    cardBody.innerHTML = `
                        <h2 class="card-title">Goal Progress</h2>
                        <hr>
                        <div class="goal-progress text-center">
                            <h3>${firstGoal.goalName}</h3>
                            <div class="progress-circle mx-auto mb-3">
                                <svg class="goal-progress-svg" width="150" height="150">
                                    <circle class="progress-bg" cx="75" cy="75" r="65" stroke="#eee" stroke-width="14" fill="none"/>
                                    <circle class="progress-bar" cx="75" cy="75" r="65" stroke="var(--primary-color)" stroke-width="14" fill="none" stroke-linecap="round"/>
                                </svg>
                                <div class="progress-circle-inner" style="position:absolute;top:0;left:0;width:100%;height:100%;display:flex;flex-direction:column;align-items:center;justify-content:center;pointer-events:none;">
                                    <span class="progress-percentage">${firstGoal.progressPercentage || 0}%</span>
                                    <span class="progress-label">${firstGoal.goalName}</span>
                                </div>
                            </div>
                            <div id="goalDetails" class="goal-details">
                                <p><strong>Target:</strong> <span id="goalTarget">${firstGoal.target}</span></p>
                                <p><strong>Saved:</strong> <span id="goalSaved">${firstGoal.saved}</span></p>
                                <p><strong>Remaining:</strong> <span id="goalRemaining">${firstGoal.remaining}</span></p>
                                ${firstGoal.message ? `<p><small id="goalMessage">${firstGoal.message}</small></p>` : ''}
                                ${firstGoal.progressPercentage >= 100 ?
                                  `<button class="btn btn-success btn-sm mt-2 redeem-goal-btn"
                                   data-goal-name="${firstGoal.goalName}"
                                   data-goal-amount="${firstGoal.target}">
                                   <i class="fas fa-shopping-cart me-1"></i>Redeem as Shopping
                                   </button>` : ''}
                            </div>
                        </div>
                    `;

                    // Initialize the progress circle
                    setTimeout(() => {
                        const circle = cardBody.querySelector('.progress-circle');
                        if (circle) {
                            updateGoalProgressCircle(circle, true);
                        }

                        // Add event listener to redeem button if it exists
                        const redeemBtn = cardBody.querySelector('.redeem-goal-btn');
                        if (redeemBtn) {
                            redeemBtn.addEventListener('click', function() {
                                const goalName = this.getAttribute('data-goal-name');
                                const amount = this.getAttribute('data-goal-amount');
                                if (goalName && amount) {
                                    redeemGoal(goalName, amount);
                                }
                            });
                        }

                        // Add highlight effect
                        singleGoalCard.classList.add('goal-new');
                        setTimeout(() => {
                            singleGoalCard.classList.remove('goal-new');
                        }, 3000);
                    }, 100);
                }
            } else {
                // If no empty state, update the UI normally
                console.log('No empty state found, updating UI normally');
                updateGoalsUI(window.goalData);
            }
        }

        if (multipleGoalsContainer) {
            console.log('In multiple goals view, re-rendering all goals');
            renderMultipleGoals(window.goalData);
        }

        // Add highlight effect to the new goal after a short delay
        setTimeout(() => {
            const goalCards = document.querySelectorAll('.goal-card');
            console.log('Found goal cards for highlighting:', goalCards.length);

            goalCards.forEach(card => {
                const nameElement = card.querySelector('.goal-name, .progress-label, h3');
                if (nameElement) {
                    // Extract the goal name, removing any numbering like "1/2 "
                    let cardGoalName = nameElement.textContent.trim();
                    // Remove numbering pattern like "1/2 " if present
                    const numberingMatch = cardGoalName.match(/^\d+\/\d+\s+(.+)$/);
                    if (numberingMatch) {
                        cardGoalName = numberingMatch[1];
                    }

                    console.log('Checking goal card:', cardGoalName, 'against new goal:', goalName);

                    if (cardGoalName === goalName) {
                        console.log('Found matching goal card, adding highlight effect');
                        // Add a highlight effect
                        card.classList.add('goal-new');
                        setTimeout(() => {
                            card.classList.remove('goal-new');
                        }, 3000);
                    }
                }
            });
        }, 500);

        // Check if this is the first goal being added
        console.log('Initial goal count:', initialGoalCount);
        console.log('Current goal data:', window.goalData);
        const isFirstGoal = (initialGoalCount === 0 || !initialGoalCount) && window.goalData && window.goalData.length > 0;
        console.log('Is first goal:', isFirstGoal);

        // If this is the first goal, create the goal card container if it doesn't exist
        if (isFirstGoal) {
            console.log('This is the first goal, checking if we need to create a goal card');

            const mainContent = document.querySelector('.main-content');
            if (mainContent) {
                const row = mainContent.querySelector('.row');
                if (row) {
                    // Check if goal card already exists
                    let goalCardExists = false;
                    const cards = row.querySelectorAll('.card');
                    cards.forEach(card => {
                        if (card.classList.contains('goal-card')) {
                            goalCardExists = true;
                            console.log('Found existing goal card');
                        }
                    });

                    // If goal card doesn't exist, create it
                    if (!goalCardExists) {
                        console.log('No goal card exists, creating a new one');

                        const goalCol = document.createElement('div');
                        goalCol.className = 'col-md-6 mb-4';
                        goalCol.style.opacity = '0';
                        goalCol.style.transform = 'translateY(20px)';
                        goalCol.style.transition = 'opacity 0.5s ease, transform 0.5s ease';

                        const firstGoal = window.goalData[0];

                        goalCol.innerHTML = `
                            <div class="card border-0 shadow-sm goal-card">
                                <div class="card-body">
                                    <h2 class="card-title">Goal Progress</h2>
                                    <hr>
                                    <div class="goal-progress text-center">
                                        <h3>${firstGoal.goalName}</h3>
                                        <div class="progress-circle mx-auto mb-3">
                                            <svg class="goal-progress-svg" width="150" height="150">
                                                <circle class="progress-bg" cx="75" cy="75" r="65" stroke="#eee" stroke-width="14" fill="none"/>
                                                <circle class="progress-bar" cx="75" cy="75" r="65" stroke="var(--primary-color)" stroke-width="14" fill="none" stroke-linecap="round"/>
                                            </svg>
                                            <div class="progress-circle-inner" style="position:absolute;top:0;left:0;width:100%;height:100%;display:flex;flex-direction:column;align-items:center;justify-content:center;pointer-events:none;">
                                                <span class="progress-percentage">${firstGoal.progressPercentage || 0}%</span>
                                                <span class="progress-label">${firstGoal.goalName}</span>
                                            </div>
                                        </div>
                                        <div id="goalDetails" class="goal-details">
                                            <p><strong>Target:</strong> <span id="goalTarget">${firstGoal.target}</span></p>
                                            <p><strong>Saved:</strong> <span id="goalSaved">${firstGoal.saved}</span></p>
                                            <p><strong>Remaining:</strong> <span id="goalRemaining">${firstGoal.remaining}</span></p>
                                            ${firstGoal.message ? `<p><small id="goalMessage">${firstGoal.message}</small></p>` : ''}
                                            ${firstGoal.progressPercentage >= 100 ?
                                              `<button class="btn btn-success btn-sm mt-2 redeem-goal-btn"
                                               data-goal-name="${firstGoal.goalName}"
                                               data-goal-amount="${firstGoal.target}">
                                               <i class="fas fa-shopping-cart me-1"></i>Redeem as Shopping
                                               </button>` : ''}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        `;

                        // Insert the goal card
                        row.appendChild(goalCol);

                        // Animate the card
                        setTimeout(() => {
                            goalCol.style.opacity = '1';
                            goalCol.style.transform = 'translateY(0)';

                            // Initialize the progress circle
                            const circle = goalCol.querySelector('.progress-circle');
                            if (circle) {
                                updateGoalProgressCircle(circle, true);
                            }

                            // Add event listener to redeem button if it exists
                            const redeemBtn = goalCol.querySelector('.redeem-goal-btn');
                            if (redeemBtn) {
                                redeemBtn.addEventListener('click', function() {
                                    const goalName = this.getAttribute('data-goal-name');
                                    const amount = this.getAttribute('data-goal-amount');
                                    if (goalName && amount) {
                                        redeemGoal(goalName, amount);
                                    }
                                });
                            }
                        }, 100);
                    } else {
                        // If goal card exists but is showing empty state, update it
                        const goalCard = row.querySelector('.goal-card');
                        if (goalCard) {
                            const emptyState = goalCard.querySelector('.empty-state');
                            if (emptyState) {
                                console.log('Found goal card with empty state, updating it');

                                const cardBody = goalCard.querySelector('.card-body');
                                if (cardBody) {
                                    const firstGoal = window.goalData[0];

                                    // Update the card body with the goal data
                                    cardBody.innerHTML = `
                                        <h2 class="card-title">Goal Progress</h2>
                                        <hr>
                                        <div class="goal-progress text-center">
                                            <h3>${firstGoal.goalName}</h3>
                                            <div class="progress-circle mx-auto mb-3">
                                                <div class="progress-circle-inner">
                                                    <span class="progress-percentage">${firstGoal.progressPercentage || 0}%</span>
                                                </div>
                                            </div>
                                            <div id="goalDetails" class="goal-details">
                                                <p><strong>Target:</strong> <span id="goalTarget">${firstGoal.target}</span></p>
                                                <p><strong>Saved:</strong> <span id="goalSaved">${firstGoal.saved}</span></p>
                                                <p><strong>Remaining:</strong> <span id="goalRemaining">${firstGoal.remaining}</span></p>
                                                ${firstGoal.message ? `<p><small id="goalMessage">${firstGoal.message}</small></p>` : ''}
                                                ${firstGoal.progressPercentage >= 100 ?
                                                  `<button class="btn btn-success btn-sm mt-2 redeem-goal-btn"
                                                   data-goal-name="${firstGoal.goalName}"
                                                   data-goal-amount="${firstGoal.target}">
                                                   <i class="fas fa-shopping-cart me-1"></i>Redeem as Shopping
                                                   </button>` : ''}
                                            </div>
                                        </div>
                                    `;

                                    // Initialize the progress circle
                                    setTimeout(() => {
                                        const circle = cardBody.querySelector('.progress-circle');
                                        if (circle) {
                                            updateGoalProgressCircle(circle, true);
                                        }

                                        // Add event listener to redeem button if it exists
                                        const redeemBtn = cardBody.querySelector('.redeem-goal-btn');
                                        if (redeemBtn) {
                                            redeemBtn.addEventListener('click', function() {
                                                const goalName = this.getAttribute('data-goal-name');
                                                const amount = this.getAttribute('data-goal-amount');
                                                if (goalName && amount) {
                                                    redeemGoal(goalName, amount);
                                                }
                                            });
                                        }

                                        // Add highlight effect
                                        goalCard.classList.add('goal-new');
                                        setTimeout(() => {
                                            goalCard.classList.remove('goal-new');
                                        }, 3000);
                                    }, 100);
                                }
                            } else {
                                // If goal card exists but is not showing empty state, update it normally
                                console.log('Found goal card without empty state, updating normally');
                                updateGoalsUI(window.goalData);
                            }
                        }
                    }
                }
            }
        } else {
            // If not the first goal, we need to update existing goal cards
            console.log('Updating existing goal cards with new goal data');

            // Check if we're in single goal view or multiple goals view
            const singleGoalCard = document.querySelector('.goal-card');
            const multipleGoalsContainer = document.getElementById('goalsContainer');

            if (singleGoalCard) {
                // We're in single goal view, update the UI
                updateGoalsUI(window.goalData);
            }

            if (multipleGoalsContainer) {
                // We're in multiple goals view, re-render all goals
                renderMultipleGoals(window.goalData);
            }
        }

        // Check if any goals have reached 100% and highlight them
        const completedGoals = window.goalData.filter(goal => goal.progressPercentage >= 100);
        if (completedGoals.length > 0) {
            // Show a special notification for completed goals
            completedGoals.forEach(goal => {
                showAlert(`Congratulations! Your goal "${goal.goalName}" is now 100% complete and ready to redeem!`, 'success', 5000);
            });
        }

        // Update all goal cards to ensure everything is in sync
        // Force a complete UI refresh to handle the transition from 1 to 2 goals correctly
        if (window.goalData && window.goalData.length === 2) {
            console.log('Detected transition from 1 to 2 goals, forcing complete UI refresh');

            // First, check if we're in single goal view
            const singleGoalCard = document.querySelector('.goal-card');
            if (singleGoalCard) {
                // We need to force a complete refresh of the goal card to add navigation arrows
                const cardBody = singleGoalCard.querySelector('.card-body');
                if (cardBody) {
                    // Fade out the card
                    cardBody.style.opacity = '0';
                    cardBody.style.transform = 'translateY(10px)';

                    // After fade out, completely rebuild the UI
                    setTimeout(() => {
                        // Force a complete rebuild of the goal UI
                        updateGoalsUI(window.goalData);

                        // Fade the card back in
                        setTimeout(() => {
                            const newCardBody = singleGoalCard.querySelector('.card-body');
                            if (newCardBody) {
                                newCardBody.style.opacity = '1';
                                newCardBody.style.transform = 'translateY(0)';
                            }
                        }, 50);
                    }, 300);
                }
            }
        } else {
            // Normal update for other cases
            updateAllGoalCards(window.goalData);
        }

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
 * Update all goal cards with the latest goal data
 * @param {Array} goalsData - Array of goal data objects
 */
function updateAllGoalCards(goalsData) {
    if (!goalsData || !Array.isArray(goalsData) || goalsData.length === 0) {
        console.warn('No goal data provided to updateAllGoalCards');
        return;
    }

    console.log('Updating all goal cards with data:', goalsData);

    // Check if we're in single goal view or multiple goals view
    const singleGoalCard = document.querySelector('.goal-card');
    const multipleGoalsContainer = document.getElementById('goalsContainer');

    if (singleGoalCard) {
        // We're in single goal view, update the current goal
        // Find the current goal being displayed
        const goalLabel = singleGoalCard.querySelector('.progress-label');
        if (goalLabel) {
            const currentGoalName = goalLabel.textContent;
            // Find matching goal in the new data
            const updatedGoal = goalsData.find(goal => goal.goalName === currentGoalName);
            if (updatedGoal) {
                updateSingleGoalUI(updatedGoal);
            } else if (goalsData.length > 0) {
                // If current goal not found, show the first goal
                updateSingleGoalUI(goalsData[0]);
            }
        } else if (goalsData.length > 0) {
            // If no label found, just update with the first goal
            updateSingleGoalUI(goalsData[0]);
        }
    }

    if (multipleGoalsContainer) {
        // We're in multiple goals view, update all goals
        renderMultipleGoals(goalsData);
    }

    // Update global goal data
    window.goalData = goalsData;
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
                <div style="position: absolute; top: 18px; right: 24px; z-index: 2;">
                    <button id="newGoalBtn" class="btn btn-primary btn-circle" title="Set a New Goal" style="width:40px;height:40px;border-radius:50%;padding:0;display:flex;align-items:center;justify-content:center;">
                        <i class="fas fa-plus"></i>
                    </button>
                </div>
                <div class="d-flex align-items-center mb-2">
                    <i class="fas fa-bullseye fa-2x me-2" style="color: var(--primary-color); filter: drop-shadow(0 2px 6px rgba(108,92,231,0.08));"></i>
                    <h5 class="fw-bold mb-0" style="font-size:1.35rem;color:var(--primary-color);font-weight:700;">Goal</h5>
                </div>
                <div style="margin-bottom: 1.2rem;"></div>
                <div class="goal-progress text-center">
                    <h3 class="h5 mb-3" style="color:var(--primary-color);font-weight:700;">${goalData.goalName}</h3>
                    <div class="d-flex justify-content-center align-items-center mb-2">
                        <div class="progress-circle mx-auto mb-3">
                            <svg class="goal-progress-svg" width="150" height="150">
                                <circle class="progress-bg" cx="75" cy="75" r="65" stroke="#eee" stroke-width="14" fill="none"/>
                                <circle class="progress-bar" cx="75" cy="75" r="65" stroke="var(--primary-color)" stroke-width="14" fill="none" stroke-linecap="round"/>
                            </svg>
                            <div class="progress-circle-inner" style="position:absolute;top:0;left:0;width:100%;height:100%;display:flex;flex-direction:column;align-items:center;justify-content:center;pointer-events:none;">
                                <span class="progress-percentage">${goalData.progressPercentage || 0}%</span>
                            </div>
                        </div>
                    </div>
                    <div class="goal-details" id="goalDetails">
                        <p class="mb-1"><strong>Target:</strong> $<span id="goalTarget">${goalData.target}</span></p>
                        <p class="mb-1"><strong>Saved:</strong> $<span id="goalSaved">${goalData.saved}</span></p>
                        <p class="mb-1"><strong>Remaining:</strong> $<span id="goalRemaining">${goalData.remaining}</span></p>
                        ${goalData.message ? `<p class="mb-0"><small id="goalMessage">${goalData.message}</small></p>` : ''}
                        ${goalData.progressPercentage >= 100 ?
                          `<button class="btn btn-success btn-sm mt-2 redeem-goal-btn"
                           data-goal-name="${goalData.goalName}"
                           data-goal-amount="${goalData.target}">
                           <i class="fas fa-shopping-cart me-1"></i>Redeem as Shopping
                           </button>` : ''}
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

            // Add event listener to redeem button if it exists
            const redeemBtn = goalCard.querySelector('.redeem-goal-btn');
            if (redeemBtn) {
                redeemBtn.addEventListener('click', function() {
                    const goalName = this.getAttribute('data-goal-name');
                    const amount = this.getAttribute('data-goal-amount');
                    if (goalName && amount) {
                        redeemGoal(goalName, amount);
                    }
                });
            }

            // Add event listener to the new goal button
            const newGoalBtn = goalCard.querySelector('#newGoalBtn');
            if (newGoalBtn) {
                newGoalBtn.addEventListener('click', function(event) {
                    console.log('New goal button clicked in updateSingleGoalUI');
                    event.preventDefault();
                    event.stopPropagation();

                    const goalModal = document.getElementById('goalModal');
                    if (goalModal) {
                        console.log('Opening goal modal from updateSingleGoalUI');
                        const goalModalInstance = new bootstrap.Modal(goalModal);
                        goalModalInstance.show();
                    } else {
                        console.error('Goal modal not found from updateSingleGoalUI');
                    }
                });
            }
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
            // Show empty state with button
            const emptyState = document.createElement('div');
            emptyState.className = 'text-center py-3 empty-state';
            emptyState.innerHTML = `
                <div class="empty-state-icon mb-2">
                    <i class="fas fa-bullseye fa-2x text-muted"></i>
                </div>
                <p class="text-muted mb-2">Set financial goals to track your savings progress and stay motivated</p>
                <button type="button" class="btn btn-primary btn-sm add-goal-btn" style="cursor:pointer;z-index:1000;position:relative;">
                    <i class="fas fa-plus-circle me-2"></i>Add Goal
                </button>
            `;
            goalsContainer.appendChild(emptyState);

            // Add event listener to the button with a slight delay
            setTimeout(() => {
                const addGoalBtn = emptyState.querySelector('.add-goal-btn');
                if (addGoalBtn) {
                    console.log('Adding click event listener to add-goal-btn in renderMultipleGoals');
                    addGoalBtn.addEventListener('click', function(event) {
                        console.log('Add goal button clicked in renderMultipleGoals');
                        event.preventDefault();
                        event.stopPropagation();

                        const goalModal = document.getElementById('goalModal');
                        if (goalModal) {
                            console.log('Opening goal modal from renderMultipleGoals');
                            const goalModalInstance = new bootstrap.Modal(goalModal);
                            goalModalInstance.show();
                        } else {
                            console.error('Goal modal not found from renderMultipleGoals');
                        }
                    });
                } else {
                    console.error('Add goal button not found in renderMultipleGoals');
                }
            }, 100);
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
                            <h5 class="card-title">${goal.goalName}</h5>
                            <div class="d-flex align-items-center mb-2">
                                <div class="progress flex-grow-1 me-2" style="height: 10px;">
                                    <div class="progress-bar" role="progressbar"
                                         style="width: 0%;"
                                         aria-valuenow="${goal.progressPercentage || 0}"
                                         aria-valuemin="0" aria-valuemax="100"></div>
                                </div>
                                <span class="text-muted small">${goal.progressPercentage || 0}%</span>
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
                                ${goal.progressPercentage >= 100 ?
                                  `<div class="mt-2">
                                    <button class="btn btn-success btn-sm redeem-goal-btn"
                                     data-goal-name="${goal.goalName}"
                                     data-goal-amount="${goal.target}">
                                     <i class="fas fa-shopping-cart me-1"></i>Redeem as Shopping
                                    </button>
                                   </div>` : ''}
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

                        // Add event listener to redeem button if it exists
                        const redeemBtn = goalCol.querySelector('.redeem-goal-btn');
                        if (redeemBtn) {
                            redeemBtn.addEventListener('click', function() {
                                const goalName = this.getAttribute('data-goal-name');
                                const amount = this.getAttribute('data-goal-amount');
                                if (goalName && amount) {
                                    redeemGoal(goalName, amount);
                                }
                            });
                        }
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

    // Initialize date inputs if they exist
    if (document.getElementById('salaryDate')) {
        setDate('salaryDate');
    }

    // Handle opening the modal from potentially multiple buttons
    addSalaryButtons.forEach(button => {
        button.addEventListener('click', function() {
            if (salaryModalInstance) {
                // Set default date to today when opening the modal
                setDate('salaryDate');
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
                        salaryDate: date  // Using correct parameter name as in app.py
                    })
                });

                const result = await response.json();

                if (!response.ok || result.status !== "Success") {
                    throw new Error(result.message || `HTTP error! status: ${response.status}`);
                }

                // On success, show a message and reload the page
                if (salaryModalInstance) {
                    salaryModalInstance.hide();
                    const backdrop = document.querySelector('.modal-backdrop');
                    if (backdrop) backdrop.remove();
                    document.body.classList.remove('modal-open');
                    document.body.style.overflow = '';
                    document.body.style.paddingRight = '';
                }

                // Reset the form
                if (salaryForm) {
                    salaryForm.reset();
                    // Reset date input after form reset
                    setDate('salaryDate');
                }

                // Show success message
                showAlert('Salary added successfully! Updating goals...', 'success');

                // Always update account balance if available
                if (result.new_balance) {
                    console.log('New balance received:', result.new_balance);

                    // Calculate percentage change if we have previous balance
                    let percentageChange = 100; // Default for first salary
                    let trendType = 'up';

                    if (window.accountData && window.accountData.balance) {
                        const oldBalance = window.accountData.balance;
                        const newBalance = result.new_balance;
                        const difference = newBalance - oldBalance;

                        // Calculate percentage change
                        if (oldBalance > 0) {
                            percentageChange = Math.round((difference / oldBalance) * 100);
                        }

                        // Determine trend direction
                        trendType = difference >= 0 ? 'up' : 'down';

                        console.log(`Balance change: ${oldBalance} -> ${newBalance} (${percentageChange}% ${trendType})`);
                    }

                    // Update account balance
                    if (window.accountData) {
                        console.log('Updating existing accountData:', window.accountData);
                        window.accountData.balance = result.new_balance;
                        window.accountData.trendType = trendType;
                        window.accountData.percentageChange = Math.abs(percentageChange);

                        // Immediately update the UI
                        console.log('Immediately updating account balance UI');
                        updateAccountBalance(window.accountData);
                    } else {
                        console.log('Creating new accountData object');
                        // If accountData doesn't exist yet, create it
                        window.accountData = {
                            balance: result.new_balance,
                            trendType: 'up',
                            percentageChange: 100 // First salary, so 100% increase
                        };

                        // Immediately update the UI
                        console.log('Immediately creating and updating account balance UI');
                        updateAccountBalance(window.accountData);
                    }

                    // Add visual feedback that salary was added
                    const balanceCard = document.querySelector('.card:has(#balanceAmount)');
                    if (balanceCard) {
                        console.log('Adding visual feedback to balance card');

                        // Remove any existing animation classes
                        balanceCard.classList.remove('salary-added');

                        // Force a reflow to restart the animation
                        void balanceCard.offsetWidth;

                        // Add the animation class
                        balanceCard.classList.add('salary-added');

                        // Also highlight the balance amount specifically
                        const balanceElement = document.getElementById('balanceAmount');
                        if (balanceElement) {
                            balanceElement.classList.remove('balance-updated');
                            void balanceElement.offsetWidth;
                            balanceElement.classList.add('balance-updated');
                        }
                    }
                }

                // Update budget suggestions if available
                if (result.budgetSuggestions) {
                    window.budgetSuggestionData = result.budgetSuggestions;
                    updateBudgetSuggestions(result.budgetSuggestions);
                }

                // Update transactions if available
                if (result.transaction && result.transaction.length > 0) {
                    updateLatestTransactions(result.transaction);
                }

                // Check if we have updated goal data in the response
                if (result.goalData && Array.isArray(result.goalData)) {
                    console.log('Received updated goal data from server:', result.goalData);

                    // Store the updated goal data globally
                    window.goalData = result.goalData;

                    // Immediately refresh the entire goal section
                    console.log('Immediately refreshing goal section after adding salary');
                    updateAllGoalCards(result.goalData);

                    // Force update of progress circles and redeem buttons
                    setTimeout(() => {
                        console.log('Forcing update of progress circles and redeem buttons');
                        const progressCircles = document.querySelectorAll('.progress-circle');
                        progressCircles.forEach(circle => {
                            updateGoalProgressCircle(circle, true);
                        });

                        // Check for completed goals and ensure redeem buttons are added
                        if (result.goalData) {
                            const completedGoals = result.goalData.filter(g => g.progressPercentage >= 100);
                            if (completedGoals.length > 0) {
                                console.log('Found completed goals, ensuring redeem buttons are added:', completedGoals);
                                completedGoals.forEach(goal => {
                                    showAlert(`Congratulations! Your goal "${goal.goalName}" is now 100% complete and ready to redeem!`, 'success', 5000);
                                });
                            }
                        }
                    }, 500);
                } else if (result.data && Array.isArray(result.data)) {
                    console.log('Received updated goal data from server (legacy format):', result.data);

                    // Store the updated goal data globally
                    window.goalData = result.data;

                    // Immediately refresh the entire goal section
                    console.log('Immediately refreshing goal section after adding salary (legacy format)');
                    updateAllGoalCards(result.data);

                    // Force update of progress circles and redeem buttons
                    setTimeout(() => {
                        console.log('Forcing update of progress circles and redeem buttons (legacy format)');
                        const progressCircles = document.querySelectorAll('.progress-circle');
                        progressCircles.forEach(circle => {
                            updateGoalProgressCircle(circle, true);
                        });

                        // Check for completed goals and ensure redeem buttons are added
                        if (result.data) {
                            const completedGoals = result.data.filter(g => g.progressPercentage >= 100);
                            if (completedGoals.length > 0) {
                                console.log('Found completed goals, ensuring redeem buttons are added (legacy format):', completedGoals);
                                completedGoals.forEach(goal => {
                                    showAlert(`Congratulations! Your goal "${goal.goalName}" is now 100% complete and ready to redeem!`, 'success', 5000);
                                });
                            }
                        }
                    }, 500);
                }
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

/**
 * Set date input to today's date and prevent future dates
 * @param {string} dateID - The ID of the date input element
 */
function setDate(dateID) {
    const dateInput = document.getElementById(dateID);
    if (!dateInput) {
        console.warn(`Date input with ID '${dateID}' not found`);
        return;
    }

    const today = new Date().toISOString().split('T')[0];
    dateInput.value = today;
    dateInput.max = today; // Prevent future dates
    console.log(`Date input '${dateID}' set to today (${today}) with max date restriction`);
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

    // Don't add numbering to the goal name, let the template handle it
    if (goalName) {
        // Just set the goal name without any numbering
        goalName.textContent = firstGoal.goalName;
    }

    // Always show navigation buttons, even for a single goal
    // We're keeping this code commented out to ensure navigation arrows are always visible
    /*
    if (reversedGoals.length <= 1) {
        const existingPrevBtn = document.getElementById('prevGoalBtn');
        const existingNextBtn = document.getElementById('nextGoalBtn');

        if (existingPrevBtn) existingPrevBtn.style.display = 'none';
        if (existingNextBtn) existingNextBtn.style.display = 'none';
    }
    */
    if (progressPercentage) progressPercentage.textContent = `${firstGoal.progressPercentage || 0}%`;
    if (goalTarget) goalTarget.textContent = firstGoal.target;
    if (goalSaved) goalSaved.textContent = firstGoal.saved;
    if (goalRemaining) goalRemaining.textContent = firstGoal.remaining;
    if (goalMessage) goalMessage.textContent = firstGoal.message || '';

    // Handle goal navigation
    const goalCard = document.querySelector('.goal-card');
    const goalSelectorContainer = document.querySelector('.goal-selector');

    if (reversedGoals.length > 1) {
        console.log('Multiple goals detected:', reversedGoals.length);

        // Don't create a new selector container, use the one from the template
        // Just update the counter if it exists
        const selectorCounter = goalSelectorContainer ? goalSelectorContainer.querySelector('.goal-counter') : null;
        if (selectorCounter) {
            console.log('Updating goal counter to:', `1/${reversedGoals.length}`);
            selectorCounter.textContent = `1/${reversedGoals.length}`;
        } else {
            console.log('Goal counter not found in existing selector container');
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
            // Use the original goal name without adding numbering
            // The template already has the numbering in the counter element
            if (elements.goalName) {
                elements.goalName.textContent = goal.goalName;
            }
            if (elements.progressPercentage) elements.progressPercentage.textContent = `${goal.progressPercentage || 0}%`;
            if (elements.goalTarget) elements.goalTarget.textContent = goal.target;
            if (elements.goalSaved) elements.goalSaved.textContent = goal.saved;
            if (elements.goalRemaining) elements.goalRemaining.textContent = goal.remaining;
            if (elements.goalMessage) elements.goalMessage.textContent = goal.message || '';

            // Check if goal is 100% complete and add redeem button if needed
            const goalDetails = document.getElementById('goalDetails');
            if (goalDetails) {
                // Remove existing redeem button if any
                const existingRedeemBtn = goalDetails.querySelector('.redeem-goal-btn');
                if (existingRedeemBtn) {
                    existingRedeemBtn.remove();
                }

                // Add redeem button if goal is 100% complete
                if (goal.progressPercentage >= 100) {
                    console.log('Goal is 100% complete in updateGoalDisplay, adding redeem button:', goal.goalName);

                    const redeemBtn = document.createElement('button');
                    redeemBtn.className = 'btn btn-success btn-sm mt-2 redeem-goal-btn';
                    redeemBtn.innerHTML = '<i class="fas fa-shopping-cart me-1"></i>Redeem as Shopping';
                    redeemBtn.setAttribute('data-goal-name', goal.goalName);
                    redeemBtn.setAttribute('data-goal-amount', goal.target);

                    // Add event listener with proper error handling
                    redeemBtn.addEventListener('click', function() {
                        try {
                            console.log('Redeem button clicked for goal:', goal.goalName, 'with amount:', goal.target);
                            redeemGoal(goal.goalName, goal.target);
                        } catch (error) {
                            console.error('Error in redeem button click handler:', error);
                            showAlert('An error occurred while redeeming the goal. Please try again.', 'danger');
                        }
                    });

                    goalDetails.appendChild(redeemBtn);
                    console.log('Redeem button added successfully in updateGoalDisplay');

                    // Add visual highlight to the goal card
                    const goalCard = document.querySelector('.goal-card');
                    if (goalCard) {
                        goalCard.classList.add('goal-completed');
                        setTimeout(() => {
                            goalCard.classList.remove('goal-completed');
                        }, 3000);
                    }
                }
            }

            // Update progress circle
            const circle = document.querySelector('.progress-circle');
            if (circle) {
                updateGoalProgressCircle(circle, true);
            }

            // Update counter but keep buttons enabled for circular navigation
            if (counter) counter.textContent = `${index + 1}/${reversedGoals.length}`;
        }

        // Remove existing event listeners and add new ones
        // Check if buttons exist before trying to clone them
        if (prevBtn && nextBtn) {
            try {
                const newPrevBtn = prevBtn.cloneNode(true);
                const newNextBtn = nextBtn.cloneNode(true);

                if (prevBtn.parentNode) prevBtn.parentNode.replaceChild(newPrevBtn, prevBtn);
                if (nextBtn.parentNode) nextBtn.parentNode.replaceChild(newNextBtn, nextBtn);

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
            } catch (error) {
                console.error('Error setting up navigation buttons:', error);

                // Fallback: add event listeners directly to existing buttons
                prevBtn.addEventListener('click', () => {
                    console.log('Previous button clicked (fallback)');
                    currentIndex = (currentIndex - 1 + reversedGoals.length) % reversedGoals.length;
                    updateGoalDisplay(currentIndex);
                });

                nextBtn.addEventListener('click', () => {
                    console.log('Next button clicked (fallback)');
                    currentIndex = (currentIndex + 1) % reversedGoals.length;
                    updateGoalDisplay(currentIndex);
                });
            }
        } else {
            console.warn('Navigation buttons not found, creating new ones');

            // If buttons don't exist, find the container and create new ones
            const container = document.querySelector('.goal-selector');
            if (container) {
                // Clear container and recreate buttons
                container.innerHTML = `
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

                // Add event listeners to new buttons
                const newPrevBtn = document.getElementById('prevGoalBtn');
                const newNextBtn = document.getElementById('nextGoalBtn');

                if (newPrevBtn) {
                    newPrevBtn.addEventListener('click', () => {
                        console.log('Previous button clicked (new)');
                        currentIndex = (currentIndex - 1 + reversedGoals.length) % reversedGoals.length;
                        updateGoalDisplay(currentIndex);
                    });
                }

                if (newNextBtn) {
                    newNextBtn.addEventListener('click', () => {
                        console.log('Next button clicked (new)');
                        currentIndex = (currentIndex + 1) % reversedGoals.length;
                        updateGoalDisplay(currentIndex);
                    });
                }
            }
        }

        // Initial display
        updateGoalDisplay(currentIndex);
    } else {
        console.log('Single goal or no goals');
        // For single goal, we should follow the template's behavior
        // The template only shows navigation arrows when there are multiple goals

        // If there's a selector container, remove it
        if (goalSelectorContainer) {
            console.log('Removing goal selector container for single goal');
            goalSelectorContainer.remove();
        }

        // Find the existing navigation buttons in the DOM and hide them
        // This matches the template's behavior which only shows buttons when data.goalData|length > 1
        const prevBtn = document.getElementById('prevGoalBtn');
        const nextBtn = document.getElementById('nextGoalBtn');

        if (prevBtn) {
            prevBtn.style.display = 'none';
            console.log('Hiding previous button for single goal');
        }

        if (nextBtn) {
            nextBtn.style.display = 'none';
            console.log('Hiding next button for single goal');
        }

        // Don't modify the goal name, the template already has the correct format
        const goalNameElement = document.querySelector('.goal-progress h3');
        if (goalNameElement && reversedGoals.length === 1) {
            goalNameElement.textContent = reversedGoals[0].goalName;
        }
    }

    // Update progress circle
    const circle = document.querySelector('.progress-circle');
    if (circle) {
        // Ensure the progress percentage is correctly set before updating the circle
        const percentageElem = circle.querySelector('.progress-percentage');
        if (percentageElem && goals.length > 0) {
            // For single goal view, use the first goal's progress
            const firstGoal = goals[0];
            if (firstGoal && typeof firstGoal.progressPercentage !== 'undefined') {
                percentageElem.textContent = `${firstGoal.progressPercentage}%`;
                console.log('Setting progress percentage to:', firstGoal.progressPercentage);
            }
        }

        // Now update the progress circle
        updateGoalProgressCircle(circle, true);
    }
}

/**
 * Update all goal cards with the latest goal data
 * @param {Array} goals - Array of goal objects with updated data
 */
function updateAllGoalCards(goals) {
    console.log('Updating all goal cards with:', goals);

    // Update global state
    window.hasGoal = goals && goals.length > 0;
    window.goalData = goals || [];

    // Simple approach: Force refresh the entire goal section
    // This ensures UI is always consistent with data

    // 1. First, handle the case when there are no goals
    if (!goals || !goals.length) {
        console.log('No goals to update, showing empty state');

        // Check if we're in single goal view (dashboard)
        const goalCard = document.querySelector('.goal-card');
        if (goalCard) {
            // Check if we need to replace the entire card or just update the content
            const cardBody = goalCard.querySelector('.card-body');
            if (cardBody) {
                console.log('Updating existing goal card to show empty state');

                // Show empty state in the goal card
                cardBody.innerHTML = `
                    <div style="position: absolute; top: 18px; right: 24px; z-index: 2;">
                        <button id="newGoalBtn" class="btn btn-primary btn-circle" title="Set a New Goal" style="width:40px;height:40px;border-radius:50%;padding:0;display:flex;align-items:center;justify-content:center;">
                            <i class="fas fa-plus"></i>
                        </button>
                    </div>
                    <div class="d-flex align-items-center mb-2">
                        <i class="fas fa-bullseye fa-2x me-2" style="color: var(--primary-color); filter: drop-shadow(0 2px 6px rgba(108,92,231,0.08));"></i>
                        <h5 class="fw-bold mb-0" style="font-size:1.35rem;color:var(--primary-color);font-weight:700;">Goal</h5>
                    </div>
                    <div style="margin-bottom: 1.2rem;"></div>
                    <div class="text-center py-3 empty-state">
                        <div class="empty-state-icon mb-2">
                            <i class="fas fa-bullseye fa-2x text-muted"></i>
                        </div>
                        <p class="text-muted mb-2">Set financial goals to track your savings progress and stay motivated</p>
                    </div>
                `;

                // Add event listener to the new goal button with a slight delay
                setTimeout(() => {
                    const newGoalBtn = cardBody.querySelector('#newGoalBtn');
                    if (newGoalBtn) {
                        console.log('Adding click event listener to newGoalBtn in updateAllGoalCards');
                        newGoalBtn.addEventListener('click', function(event) {
                            console.log('New goal button clicked in updateAllGoalCards');
                            event.preventDefault();
                            event.stopPropagation();

                            const goalModal = document.getElementById('goalModal');
                            if (goalModal) {
                                console.log('Opening goal modal from updateAllGoalCards');
                                const goalModalInstance = new bootstrap.Modal(goalModal);
                                goalModalInstance.show();
                            } else {
                                console.error('Goal modal not found from updateAllGoalCards');
                            }
                        });
                    } else {
                        console.error('New goal button not found in updateAllGoalCards');
                    }
                }, 100);
            } else {
                console.error('Could not find card body in goal card');
            }
        } else {
            console.log('No goal card found, checking if we need to create one');

            // If there's no goal card but we're in dashboard view, we might need to create one
            const mainContent = document.querySelector('.main-content');
            if (mainContent) {
                const row = mainContent.querySelector('.row');
                if (row) {
                    console.log('Creating new empty goal card');

                    // Create a new column for the goal card
                    const goalCol = document.createElement('div');
                    goalCol.className = 'col-md-6 mb-4';
                    goalCol.style.opacity = '0';
                    goalCol.style.transform = 'translateY(20px)';
                    goalCol.style.transition = 'opacity 0.5s ease, transform 0.5s ease';

                    // Create the empty goal card with circular button in top right
                    goalCol.innerHTML = `
                        <div class="card border-0 shadow-sm goal-card">
                            <div class="card-body">
                                <div style="position: absolute; top: 18px; right: 24px; z-index: 2;">
                                    <button id="newGoalBtn" class="btn btn-primary btn-circle" title="Set a New Goal" style="width:40px;height:40px;border-radius:50%;padding:0;display:flex;align-items:center;justify-content:center;">
                                        <i class="fas fa-plus"></i>
                                    </button>
                                </div>
                                <div class="d-flex align-items-center mb-2">
                                    <i class="fas fa-bullseye fa-2x me-2" style="color: var(--primary-color); filter: drop-shadow(0 2px 6px rgba(108,92,231,0.08));"></i>
                                    <h5 class="fw-bold mb-0" style="font-size:1.35rem;color:var(--primary-color);font-weight:700;">Goal</h5>
                                </div>
                                <div style="margin-bottom: 1.2rem;"></div>
                                <div class="text-center py-3 empty-state">
                                    <div class="empty-state-icon mb-2">
                                        <i class="fas fa-bullseye fa-2x text-muted"></i>
                                    </div>
                                    <p class="text-muted mb-2">Set financial goals to track your savings progress and stay motivated</p>
                                </div>
                            </div>
                        </div>
                    `;

                    // Insert the goal card
                    row.appendChild(goalCol);

                    // Animate the card
                    setTimeout(() => {
                        goalCol.style.opacity = '1';
                        goalCol.style.transform = 'translateY(0)';

                        // Add event listener to the new goal button
                        const newGoalBtn = goalCol.querySelector('#newGoalBtn');
                        if (newGoalBtn) {
                            newGoalBtn.addEventListener('click', function() {
                                const goalModal = document.getElementById('goalModal');
                                if (goalModal) {
                                    const goalModalInstance = new bootstrap.Modal(goalModal);
                                    goalModalInstance.show();
                                }
                            });
                        }
                    }, 100);
                }
            }
        }

        // Check if we're in multiple goals view
        const goalsContainer = document.getElementById('goalsContainer');
        if (goalsContainer) {
            console.log('Updating goals container to show empty state');

            // Show empty state in the goals container
            goalsContainer.innerHTML = `
                <h2 class="mb-4">Your Financial Goals</h2>
                <div class="text-center py-3 empty-state">
                    <div class="empty-state-icon mb-2">
                        <i class="fas fa-bullseye fa-2x text-muted"></i>
                    </div>
                    <p class="text-muted mb-2">Set financial goals to track your savings progress and stay motivated</p>
                    <button class="btn btn-primary btn-sm add-goal-btn">
                        <i class="fas fa-plus-circle me-2"></i>Add Goal
                    </button>
                </div>
            `;

            // Add event listener to the new add goal button
            const addGoalBtn = goalsContainer.querySelector('.add-goal-btn');
            if (addGoalBtn) {
                addGoalBtn.addEventListener('click', function() {
                    const goalModal = document.getElementById('goalModal');
                    if (goalModal) {
                        const goalModalInstance = new bootstrap.Modal(goalModal);
                        goalModalInstance.show();
                    }
                });
            }
        }

        return;
    }

    // 2. If we have goals, update the UI

    // Add CSS for animations if it doesn't exist
    if (!document.getElementById('pulse-animation-style')) {
        const style = document.createElement('style');
        style.id = 'pulse-animation-style';
        style.textContent = `
            @keyframes pulse {
                0% { transform: scale(1); }
                50% { transform: scale(1.05); }
                100% { transform: scale(1); }
            }

            .goal-completed {
                animation: goal-completed-animation 3s ease-in-out;
            }

            @keyframes goal-completed-animation {
                0% { box-shadow: 0 0 0 rgba(40, 167, 69, 0); }
                20% { box-shadow: 0 0 20px rgba(40, 167, 69, 0.7); }
                80% { box-shadow: 0 0 20px rgba(40, 167, 69, 0.7); }
                100% { box-shadow: 0 0 0 rgba(40, 167, 69, 0); }
            }

            .goal-new {
                animation: goal-new-animation 3s ease-in-out;
            }

            @keyframes goal-new-animation {
                0% { box-shadow: 0 0 0 rgba(108, 92, 231, 0); }
                20% { box-shadow: 0 0 20px rgba(108, 92, 231, 0.7); }
                80% { box-shadow: 0 0 20px rgba(108, 92, 231, 0.7); }
                100% { box-shadow: 0 0 0 rgba(108, 92, 231, 0); }
            }
        `;
        document.head.appendChild(style);
    }

    // Update the main goal card in the dashboard
    updateGoalsUI(goals);

    // Update the multiple goals view if it exists
    const goalsContainer = document.getElementById('goalsContainer');
    if (goalsContainer) {
        renderMultipleGoals(goals);
    }

    // Check if any goals have reached 100%
    const completedGoals = goals.filter(goal => goal.progressPercentage >= 100);
    if (completedGoals.length > 0) {
        console.log('Found completed goals in updateAllGoalCards:', completedGoals);

        // Show notifications for completed goals
        completedGoals.forEach(goal => {
            showAlert(`Congratulations! Your goal "${goal.goalName}" is now 100% complete and ready to redeem!`, 'success', 5000);
        });

        // Add visual highlight to completed goal cards and ensure redeem buttons exist
        setTimeout(() => {
            const goalCards = document.querySelectorAll('.goal-card');
            console.log('Found goal cards:', goalCards.length);

            goalCards.forEach(card => {
                const goalNameElement = card.querySelector('.goal-name, .progress-label, h3');
                if (goalNameElement) {
                    let goalName = goalNameElement.textContent.trim();
                    // Remove numbering pattern if present
                    const numberingMatch = goalName.match(/^\d+\/\d+\s+(.+)$/);
                    if (numberingMatch) {
                        goalName = numberingMatch[1];
                    }

                    console.log('Checking goal card for:', goalName);

                    // Check if this card corresponds to a completed goal
                    const completedGoal = completedGoals.find(g => g.goalName === goalName);
                    if (completedGoal) {
                        console.log('Found completed goal card for:', goalName);

                        // Add visual highlight
                        card.classList.add('goal-completed');
                        setTimeout(() => {
                            card.classList.remove('goal-completed');
                        }, 3000);

                        // Ensure redeem button exists
                        const goalDetails = card.querySelector('.goal-details');
                        if (goalDetails) {
                            const existingRedeemBtn = goalDetails.querySelector('.redeem-goal-btn');
                            if (!existingRedeemBtn) {
                                console.log('Adding missing redeem button for completed goal:', goalName);

                                // Create and add redeem button
                                const redeemBtn = document.createElement('button');
                                redeemBtn.className = 'btn btn-success btn-sm mt-2 redeem-goal-btn';
                                redeemBtn.innerHTML = '<i class="fas fa-shopping-cart me-1"></i>Redeem as Shopping';
                                redeemBtn.setAttribute('data-goal-name', goalName);
                                redeemBtn.setAttribute('data-goal-amount', completedGoal.target);

                                // Add event listener
                                redeemBtn.addEventListener('click', function() {
                                    try {
                                        console.log('Redeem button clicked for goal:', goalName, 'with amount:', completedGoal.target);
                                        redeemGoal(goalName, completedGoal.target);
                                    } catch (error) {
                                        console.error('Error in redeem button click handler:', error);
                                        showAlert('An error occurred while redeeming the goal. Please try again.', 'danger');
                                    }
                                });

                                // Add the button to the goal details
                                goalDetails.appendChild(redeemBtn);
                                console.log('Redeem button added successfully for completed goal');
                            } else {
                                console.log('Redeem button already exists for completed goal:', goalName);
                            }
                        } else {
                            console.error('Could not find goal details container for completed goal:', goalName);
                        }
                    }
                }
            });

            // Also update all progress circles to ensure they're correctly displayed
            const progressCircles = document.querySelectorAll('.progress-circle');
            progressCircles.forEach(circle => {
                updateGoalProgressCircle(circle, true);
            });
        }, 500); // Small delay to ensure DOM is updated
    }
}

/**
 * Update the latest transactions section with new data
 * @param {Array} transactions - Array of transaction objects
 */
function updateLatestTransactions(transactions) {
    if (!transactions || !transactions.length) {
        console.log('No transactions to update');
        return;
    }

    console.log('Updating latest transactions with:', transactions);

    // Try different selectors to find the transactions list
    // First try the class name from the template (transaction-list)
    let transactionsList = document.querySelector('.transaction-list');
    console.log('Found transaction-list?', !!transactionsList);

    // If not found, try other common class names
    if (!transactionsList) {
        transactionsList = document.querySelector('.transactions-list, .latest-transactions, .transactions');
        console.log('Found alternative transaction list?', !!transactionsList);
    }

    // If not found, try to find it by ID
    if (!transactionsList) {
        transactionsList = document.getElementById('transactionsList');
        console.log('Found by ID?', !!transactionsList);
    }

    // If still not found, try to find the transactions card and create the list
    if (!transactionsList) {
        console.log('Transactions list not found, looking for transactions card');

        // Find the card with the "Transactions" title
        const transactionsCard = document.querySelector('.card:has(h5:contains("Transactions"))');
        if (!transactionsCard) {
            // Try a more general approach
            const allCards = document.querySelectorAll('.card');
            for (const card of allCards) {
                const title = card.querySelector('h5');
                if (title && title.textContent.includes('Transaction')) {
                    console.log('Found transactions card by title content');

                    // Check if the card already has a transaction list
                    const existingList = card.querySelector('.transaction-list');
                    if (existingList) {
                        transactionsList = existingList;
                        console.log('Found existing transaction list in card');
                    } else {
                        // Create a new transaction list
                        const cardBody = card.querySelector('.card-body');
                        if (cardBody) {
                            // Clear any empty state
                            const emptyState = cardBody.querySelector('.empty-state');
                            if (emptyState) {
                                emptyState.remove();
                            }

                            // Create the transaction list
                            transactionsList = document.createElement('div');
                            transactionsList.className = 'transaction-list';
                            transactionsList.style.maxHeight = '250px';
                            transactionsList.style.overflowY = 'auto';
                            cardBody.appendChild(transactionsList);
                            console.log('Created new transaction list in card body');
                        }
                    }
                    break;
                }
            }
        } else {
            console.log('Found transactions card');

            // Check if the card already has a transaction list
            const existingList = transactionsCard.querySelector('.transaction-list');
            if (existingList) {
                transactionsList = existingList;
                console.log('Found existing transaction list in card');
            } else {
                // Create a new transaction list
                const cardBody = transactionsCard.querySelector('.card-body');
                if (cardBody) {
                    // Clear any empty state
                    const emptyState = cardBody.querySelector('.empty-state');
                    if (emptyState) {
                        emptyState.remove();
                    }

                    // Create the transaction list
                    transactionsList = document.createElement('div');
                    transactionsList.className = 'transaction-list';
                    transactionsList.style.maxHeight = '250px';
                    transactionsList.style.overflowY = 'auto';
                    cardBody.appendChild(transactionsList);
                    console.log('Created new transaction list in card body');
                }
            }
        }
    }

    // If we still couldn't find or create a transaction list, give up
    if (!transactionsList) {
        console.error('Could not find or create transaction list');
        return;
    }

    console.log('Found transactions list:', transactionsList);

    // Add scrolling styles to the transaction list
    transactionsList.style.maxHeight = '250px';
    transactionsList.style.overflowY = 'auto';
    transactionsList.style.overflowX = 'hidden';
    transactionsList.style.scrollbarWidth = 'thin';
    transactionsList.style.scrollbarColor = 'rgba(0,0,0,0.2) transparent';
    transactionsList.style.paddingRight = '5px';

    // Add custom scrollbar styles if not already added
    if (!document.getElementById('custom-scrollbar-style')) {
        const scrollbarStyle = document.createElement('style');
        scrollbarStyle.id = 'custom-scrollbar-style';
        scrollbarStyle.textContent = `
            .transaction-list::-webkit-scrollbar {
                width: 6px;
            }
            .transaction-list::-webkit-scrollbar-track {
                background: transparent;
            }
            .transaction-list::-webkit-scrollbar-thumb {
                background-color: rgba(0,0,0,0.2);
                border-radius: 3px;
            }
            .transaction-list::-webkit-scrollbar-thumb:hover {
                background-color: rgba(0,0,0,0.3);
            }

            /* Add touch scrolling for mobile devices */
            .transaction-list {
                -webkit-overflow-scrolling: touch;
                scroll-behavior: smooth;
            }

            /* Make transaction items more touch-friendly */
            .transaction-item, .d-flex.justify-content-between.align-items-center {
                padding: 10px 5px;
                margin-bottom: 8px;
                border-radius: 6px;
                transition: background-color 0.2s ease;
            }

            .transaction-item:hover, .d-flex.justify-content-between.align-items-center:hover {
                background-color: rgba(0,0,0,0.03);
            }
        `;
        document.head.appendChild(scrollbarStyle);
    }

    // Clear existing transactions
    transactionsList.innerHTML = '';

    // Add new transactions
    transactions.forEach(transaction => {
        const transactionItem = document.createElement('div');
        transactionItem.className = 'transaction-item';

        // Determine icon based on category
        let iconClass = 'fa-shopping-cart';
        if (transaction.category.toLowerCase().includes('grocery')) {
            iconClass = 'fa-shopping-basket';
        } else if (transaction.category.toLowerCase().includes('bill')) {
            iconClass = 'fa-file-invoice-dollar';
        } else if (transaction.category.toLowerCase().includes('fuel') || transaction.category.toLowerCase().includes('transport')) {
            iconClass = 'fa-gas-pump';
        } else if (transaction.category.toLowerCase().includes('food')) {
            iconClass = 'fa-utensils';
        } else if (transaction.category.toLowerCase().includes('goal')) {
            iconClass = 'fa-bullseye';
        }

        transactionItem.innerHTML = `
            <div class="d-flex justify-content-between align-items-center">
                <div class="d-flex align-items-center">
                    <div class="transaction-icon me-2">
                        <i class="fas ${iconClass}"></i>
                    </div>
                    <div class="transaction-details">
                        <div class="transaction-title fw-medium">${transaction.category}</div>
                        <div class="transaction-date small text-muted">${transaction.date || 'Today'}</div>
                    </div>
                </div>
                <div class="transaction-amount fw-bold text-danger">-$${transaction.amount}</div>
            </div>
        `;

        transactionsList.appendChild(transactionItem);
    });

    // Add animation to make the new transactions noticeable
    const items = transactionsList.querySelectorAll('.transaction-item');
    items.forEach((item, index) => {
        item.style.animation = `fadeInRight 0.3s ease-out ${index * 0.1}s forwards`;
        item.style.opacity = '0';
    });

    // Add CSS for fadeInRight animation if it doesn't exist
    if (!document.getElementById('transaction-animation-style')) {
        const style = document.createElement('style');
        style.id = 'transaction-animation-style';
        style.textContent = `
            @keyframes fadeInRight {
                from {
                    opacity: 0;
                    transform: translateX(20px);
                }
                to {
                    opacity: 1;
                    transform: translateX(0);
                }
            }

            @keyframes highlight-transaction {
                0% { background-color: rgba(40, 167, 69, 0.2); }
                100% { background-color: transparent; }
            }

            /* Add a subtle divider between transactions */
            .transaction-item:not(:last-child) {
                border-bottom: 1px solid rgba(0,0,0,0.05);
            }

            /* Add a subtle hover effect */
            .transaction-item {
                cursor: default;
                transition: all 0.2s ease;
            }

            .transaction-item:hover {
                background-color: rgba(0,0,0,0.02);
            }

            /* Style for the highlight animation */
            .highlight-new-transaction {
                animation: highlight-transaction 2s ease-in-out;
            }
        `;
        document.head.appendChild(style);
    }

    // Add a subtle indicator that the list is scrollable if there are many items
    if (transactions.length > 3) {
        const scrollIndicator = document.createElement('div');
        scrollIndicator.className = 'text-center mt-2 mb-1 scroll-indicator';
        scrollIndicator.innerHTML = `
            <small class="text-muted">
                <i class="fas fa-chevron-down fa-xs me-1"></i>Scroll for more
            </small>
        `;

        // Add the indicator only if it doesn't already exist
        if (!transactionsList.querySelector('.scroll-indicator')) {
            transactionsList.appendChild(scrollIndicator);

            // Hide the indicator when the user scrolls
            transactionsList.addEventListener('scroll', function() {
                const indicator = this.querySelector('.scroll-indicator');
                if (indicator) {
                    indicator.style.opacity = '0';
                    setTimeout(() => {
                        indicator.remove();
                    }, 300);
                }
            }, { once: true });
        }
    }

    console.log('Transactions list updated successfully');
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
        // Fallback: manually update the elements without animation
        updateElementsWithoutAnimation();
        return;
    }

    try {
        // Balance animation
        if (document.getElementById('balanceAmount')) {
            const balanceAmount = document.getElementById('balanceAmount');
            const balanceValue = window.accountData?.balance || 0;
            try {
                new CountUp('balanceAmount', balanceValue, {
                    prefix: '$',
                    duration: 2,
                    decimalPlaces: 2
                }).start();
            } catch (error) {
                console.error('Error initializing CountUp for balanceAmount:', error);
                // Fallback: manually update the element
                balanceAmount.textContent = '$' + balanceValue.toFixed(2);
            }
        }

        // Goal progress animation
        if (document.getElementById('goalProgress')) {
            const goalProgress = document.getElementById('goalProgress');
            const progressValue = window.goalData?.[0]?.progressPercentage || 0;
            try {
                new CountUp('goalProgress', progressValue, {
                    suffix: '%',
                    duration: 2,
                    decimalPlaces: 1
                }).start();
            } catch (error) {
                console.error('Error initializing CountUp for goalProgress:', error);
                // Fallback: manually update the element
                if (goalProgress) {
                    goalProgress.textContent = progressValue.toFixed(1) + '%';
                }
            }
        }

        // Budget suggestion animation
        if (window.budgetSuggestionData) {
            const { needs, wants, savings } = window.budgetSuggestionData;

            try {
                if (document.getElementById('needsAmount')) {
                    new CountUp('needsAmount', needs, {
                        prefix: '$',
                        duration: 2,
                        decimalPlaces: 2
                    }).start();
                }
            } catch (error) {
                console.error('Error initializing CountUp for needsAmount:', error);
                const needsAmount = document.getElementById('needsAmount');
                if (needsAmount) {
                    needsAmount.textContent = '$' + needs.toFixed(2);
                }
            }

            try {
                if (document.getElementById('wantsAmount')) {
                    new CountUp('wantsAmount', wants, {
                        prefix: '$',
                        duration: 2,
                        decimalPlaces: 2
                    }).start();
                }
            } catch (error) {
                console.error('Error initializing CountUp for wantsAmount:', error);
                const wantsAmount = document.getElementById('wantsAmount');
                if (wantsAmount) {
                    wantsAmount.textContent = '$' + wants.toFixed(2);
                }
            }

            try {
                if (document.getElementById('savingsAmount')) {
                    new CountUp('savingsAmount', savings, {
                        prefix: '$',
                        duration: 2,
                        decimalPlaces: 2
                    }).start();
                }
            } catch (error) {
                console.error('Error initializing CountUp for savingsAmount:', error);
                const savingsAmount = document.getElementById('savingsAmount');
                if (savingsAmount) {
                    savingsAmount.textContent = '$' + savings.toFixed(2);
                }
            }
        }
    } catch (error) {
        console.error('Error in initCountUp:', error);
        // Fallback: manually update the elements without animation
        updateElementsWithoutAnimation();
    }
}

/**
 * Fallback function to update elements without animation when CountUp is not available
 */
function updateElementsWithoutAnimation() {
    console.log('Using fallback method to update elements without animation');

    // Update balance amount
    const balanceAmount = document.getElementById('balanceAmount');
    if (balanceAmount) {
        const balanceValue = window.accountData?.balance || 0;
        balanceAmount.textContent = '$' + balanceValue.toFixed(2);
    }

    // Update goal progress
    const goalProgress = document.getElementById('goalProgress');
    if (goalProgress) {
        const progressValue = window.goalData?.[0]?.progressPercentage || 0;
        goalProgress.textContent = progressValue.toFixed(1) + '%';
    }

    // Update budget suggestion amounts
    if (window.budgetSuggestionData) {
        const { needs, wants, savings } = window.budgetSuggestionData;

        const needsAmount = document.getElementById('needsAmount');
        if (needsAmount) {
            needsAmount.textContent = '$' + needs.toFixed(2);
        }

        const wantsAmount = document.getElementById('wantsAmount');
        if (wantsAmount) {
            wantsAmount.textContent = '$' + wants.toFixed(2);
        }

        const savingsAmount = document.getElementById('savingsAmount');
        if (savingsAmount) {
            savingsAmount.textContent = '$' + savings.toFixed(2);
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
    // Don't add numbering to the goal name, let the template handle it
    if (goalName) {
        goalName.textContent = currentGoal.goalName;
    }

    // Update progress
    const progressPercentage = document.querySelector('.progress-percentage');
    if (progressPercentage) {
        if (isCountUpAvailable()) {
            try {
                new CountUp('goalProgress', currentGoal.progressPercentage, {
                    suffix: '%',
                    duration: 1,
                    decimalPlaces: 1
                }).start();
            } catch (error) {
                console.error('Error updating goal progress with CountUp:', error);
                // Fallback if CountUp fails
                progressPercentage.textContent = `${currentGoal.progressPercentage.toFixed(1)}%`;
            }
        } else {
            // Fallback if CountUp is not available
            progressPercentage.textContent = `${currentGoal.progressPercentage.toFixed(1)}%`;
        }
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

    // Check if goal is 100% complete and add redeem button if needed
    const goalDetails = document.getElementById('goalDetails');
    if (goalDetails) {
        // Remove existing redeem button if any
        const existingRedeemBtn = goalDetails.querySelector('.redeem-goal-btn');
        if (existingRedeemBtn) {
            existingRedeemBtn.remove();
        }

        // Add redeem button if goal is 100% complete
        if (currentGoal.progressPercentage >= 100) {
            const redeemBtn = document.createElement('button');
            redeemBtn.className = 'btn btn-success btn-sm mt-2 redeem-goal-btn';
            redeemBtn.innerHTML = '<i class="fas fa-shopping-cart me-1"></i>Redeem as Shopping';
            redeemBtn.setAttribute('data-goal-name', currentGoal.goalName);
            redeemBtn.setAttribute('data-goal-amount', currentGoal.target);
            redeemBtn.addEventListener('click', function() {
                redeemGoal(currentGoal.goalName, currentGoal.target);
            });
            goalDetails.appendChild(redeemBtn);

            // Add a subtle animation to draw attention to the new button
            redeemBtn.style.animation = 'pulse 1.5s infinite';

            // Add CSS for the pulse animation if it doesn't exist
            if (!document.getElementById('pulse-animation')) {
                const style = document.createElement('style');
                style.id = 'pulse-animation';
                style.textContent = `
                    @keyframes pulse {
                        0% { transform: scale(1); }
                        50% { transform: scale(1.05); }
                        100% { transform: scale(1); }
                    }
                `;
                document.head.appendChild(style);
            }
        }
    }

    // Update progress circle
    updateProgressCircle(currentGoal.progressPercentage);
}

// Initialize
// Add CSS for goal card animations
function addGoalCardStyles() {
    if (!document.getElementById('goal-card-styles')) {
        const style = document.createElement('style');
        style.id = 'goal-card-styles';
        style.textContent = `
            .goal-card {
                transition: opacity 0.3s ease, transform 0.3s ease;
            }
            .redeeming {
                opacity: 0.5;
                transform: translateY(-10px);
                pointer-events: none;
            }
            .goal-completed {
                animation: goalCompleted 2s ease;
            }
            @keyframes goalCompleted {
                0% { box-shadow: 0 0 0 0 rgba(40, 167, 69, 0.7); }
                50% { box-shadow: 0 0 0 10px rgba(40, 167, 69, 0); }
                100% { box-shadow: 0 0 0 0 rgba(40, 167, 69, 0); }
            }
        `;
        document.head.appendChild(style);
    }
}

document.addEventListener('DOMContentLoaded', function() {
    // Add goal card styles
    addGoalCardStyles();

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

/**
 * Redeem a completed goal by sending a request to add an expense
 * @param {string} goalName - The name of the goal to redeem
 * @param {number} amount - The amount to redeem (target amount of the goal)
 */
async function redeemGoal(goalName, amount) {
    try {
        // Show confirmation dialog
        if (!confirm(`Are you sure you want to redeem your "${goalName}" goal for $${amount}? This will be recorded as a Shopping expense.`)) {
            return;
        }

        // Set a flag to always force page refresh after redemption
        const forcePageRefresh = true;

        // Check if this is a "Redeem as Saving" action (for future use)
        // We'll use this flag to determine if we should refresh the page
        const isSavingRedemption = true; // Always refresh the page after redemption
        console.log('Will refresh page after redemption');

        // Find the goal card that's being redeemed
        let redeemedCard = null;
        let parentCol = null;

        console.log(`Looking for goal card with name: "${goalName}"`);

        // Check if it's in the single goal view
        const singleGoalCard = document.querySelector('.goal-card');
        if (singleGoalCard) {
            const goalLabel = singleGoalCard.querySelector('.progress-label, h3');
            if (goalLabel) {
                console.log(`Found goal label with text: "${goalLabel.textContent}"`);
                // Extract the goal name, removing any numbering like "1/2 "
                let labelText = goalLabel.textContent.trim();
                // Remove numbering pattern like "1/2 " if present
                const numberingMatch = labelText.match(/^\d+\/\d+\s+(.+)$/);
                if (numberingMatch) {
                    labelText = numberingMatch[1];
                }

                if (labelText === goalName) {
                    console.log('Found matching goal card in single goal view');
                    redeemedCard = singleGoalCard;
                }
            }
        }

        // Check if it's in the multiple goals view
        if (!redeemedCard) {
            console.log('Searching in all cards');
            const allCards = document.querySelectorAll('.card');
            allCards.forEach(card => {
                const label = card.querySelector('.card-title, .progress-label, h3');
                if (label) {
                    console.log(`Checking card with label: "${label.textContent}"`);

                    // Extract the goal name, removing any numbering like "1/2 "
                    let labelText = label.textContent.trim();
                    // Remove numbering pattern like "1/2 " if present
                    const numberingMatch = labelText.match(/^\d+\/\d+\s+(.+)$/);
                    if (numberingMatch) {
                        labelText = numberingMatch[1];
                    }

                    if (labelText === goalName) {
                        console.log('Found matching goal card in multiple goals view');
                        redeemedCard = card;
                        parentCol = card.closest('.col-md-6');
                    }
                }
            });
        }

        if (redeemedCard) {
            console.log('Found goal card to redeem:', redeemedCard);
        } else {
            console.warn('Could not find goal card with name:', goalName);
        }

        // Show loading state on the redeem button
        if (redeemedCard) {
            console.log('Adding loading state to redeem button');
            const redeemBtn = redeemedCard.querySelector('.redeem-goal-btn');
            if (redeemBtn) {
                redeemBtn.disabled = true;
                redeemBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Redeeming...';
            }

            // Find the goal in the global data
            const goalIndex = window.goalData ? window.goalData.findIndex(g => g.goalName === goalName) : -1;

            if (goalIndex !== -1) {
                // Remove the goal from the global data immediately
                console.log(`Removing goal "${goalName}" from global data at index ${goalIndex}`);
                window.goalData.splice(goalIndex, 1);

                // Immediately refresh the entire goal section
                console.log('Immediately refreshing goal section after redeeming goal');
                updateAllGoalCards(window.goalData);
            }

            // Determine if we're in single goal view or multiple goals view
            const isMultipleGoalsView = document.getElementById('goalsContainer') !== null;
            const isSingleGoalView = !isMultipleGoalsView && document.querySelector('.goal-card') !== null;

            if (isSingleGoalView) {
                // Fade out the goal card content
                const cardBody = redeemedCard.querySelector('.card-body');
                if (cardBody) {
                    cardBody.style.transition = 'opacity 0.3s ease, transform 0.3s ease';
                    cardBody.style.opacity = '0.5';
                    cardBody.style.transform = 'translateY(-10px)';
                }

                // If we have other goals, show the next one immediately
                if (window.goalData && window.goalData.length > 0) {
                    setTimeout(() => {
                        updateGoalsUI(window.goalData);
                    }, 300);
                } else {
                    // Show empty state immediately
                    setTimeout(() => {
                        if (cardBody) {
                            cardBody.innerHTML = `
                                <div class="d-flex align-items-center mb-2">
                                    <i class="fas fa-bullseye fa-2x me-2" style="color: var(--primary-color); filter: drop-shadow(0 2px 6px rgba(108,92,231,0.08));"></i>
                                    <h5 class="fw-bold mb-0" style="font-size:1.35rem;color:var(--primary-color);font-weight:700;">Goal</h5>
                                </div>
                                <div style="margin-bottom: 1.2rem;"></div>
                                <div class="text-center py-3 empty-state">
                                    <div class="empty-state-icon mb-2">
                                        <i class="fas fa-bullseye fa-2x text-muted"></i>
                                    </div>
                                    <p class="text-muted mb-2">Set financial goals to track your savings progress and stay motivated</p>
                                    <button id="newGoalBtn" class="btn btn-primary btn-sm">
                                        <i class="fas fa-plus-circle me-2"></i>Set a Goal
                                    </button>
                                </div>
                            `;
                            cardBody.style.opacity = '1';
                            cardBody.style.transform = 'translateY(0)';

                            // Add event listener to the new goal button
                            const newGoalBtn = cardBody.querySelector('#newGoalBtn');
                            if (newGoalBtn) {
                                newGoalBtn.addEventListener('click', function() {
                                    const goalModal = document.getElementById('goalModal');
                                    if (goalModal) {
                                        const goalModalInstance = new bootstrap.Modal(goalModal);
                                        goalModalInstance.show();
                                    }
                                });
                            }
                        }
                    }, 300);
                }
            } else if (isMultipleGoalsView && parentCol) {
                // In multiple goals view, immediately start removing this specific goal card
                console.log('Immediately removing goal card from multiple goals view');

                // Animate removal with more visible effect
                parentCol.style.transition = 'all 0.5s ease';
                parentCol.style.opacity = '0';
                parentCol.style.transform = 'translateY(-30px) scale(0.95)';
                parentCol.style.boxShadow = '0 0 15px rgba(40, 167, 69, 0.5)';

                // Remove after animation
                setTimeout(() => {
                    parentCol.remove();

                    // If this was the last goal, show empty state
                    if (!window.goalData || window.goalData.length === 0) {
                        const goalsContainer = document.getElementById('goalsContainer');
                        if (goalsContainer) {
                            // Use the original empty state from the template
                            goalsContainer.innerHTML = `
                                <h2 class="mb-4">Your Financial Goals</h2>
                                <div class="text-center py-3 empty-state">
                                    <div class="empty-state-icon mb-2">
                                        <i class="fas fa-bullseye fa-2x text-muted"></i>
                                    </div>
                                    <p class="text-muted mb-2">Set financial goals to track your savings progress and stay motivated</p>
                                    <button class="btn btn-primary btn-sm add-goal-btn">
                                        <i class="fas fa-plus-circle me-2"></i>Add Goal
                                    </button>
                                </div>
                            `;

                            // Add event listener to the new add goal button
                            const addGoalBtn = goalsContainer.querySelector('.add-goal-btn');
                            if (addGoalBtn) {
                                addGoalBtn.addEventListener('click', function() {
                                    const goalModal = document.getElementById('goalModal');
                                    if (goalModal) {
                                        const goalModalInstance = new bootstrap.Modal(goalModal);
                                        goalModalInstance.show();
                                    }
                                });
                            }
                        }
                    } else {
                        // Re-render the remaining goals to ensure proper layout
                        renderMultipleGoals(window.goalData);
                    }
                }, 300);
            } else {
                // Fallback: just fade out the card content
                const cardBody = redeemedCard.querySelector('.card-body');
                if (cardBody) {
                    cardBody.style.transition = 'opacity 0.3s ease, transform 0.3s ease';
                    cardBody.style.opacity = '0.5';
                }
            }

            // We've already handled the UI update above, so we don't need to do anything here
        }

        // Prepare data for the request
        const data = {
            amount: parseFloat(amount),
            category: "Shopping", // Changed from "Goal Redemption" to "Shopping"
            date: new Date().toISOString().split('T')[0], // Current date in YYYY-MM-DD format
            goalName: goalName
        };

        console.log('Redeeming goal with data:', data);

        // Show loading indicator in the UI
        showAlert(`Redeeming goal "${goalName}"...`, 'info', 2000);

        // Send request to add expense
        const response = await fetch('/dashboard/addExpense', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(data)
        });

        const result = await response.json();

        if (response.ok && result.status === "Success") {
            // Show success message
            showAlert(`Goal "${goalName}" redeemed successfully! Page will refresh...`, 'success');

            // Always force page refresh after successful redemption
            console.log('Goal redeemed successfully, forcing page refresh');
            setTimeout(() => {
                window.location.reload();
            }, 1000);
            return;

            // The code below will not execute due to the return statement above
            // Keeping it for reference in case we need to revert to manual UI updates
            try {
                // Use goal data from the response if available
                if (result.goalData !== undefined) {
                    console.log('Using goal data from response:', result.goalData);
                    window.goalData = result.goalData;
                    window.hasGoal = result.hasGoal;
                } else {
                    // Fallback to fetching goal data
                    console.log('Fetching goal data from server');
                    const goalsResponse = await fetch('/dashboard/getGoals');
                    const goalsResult = await goalsResponse.json();

                    if (goalsResponse.ok && goalsResult.status === "Success") {
                        // Update global goal data
                        window.goalData = goalsResult.data;
                    }
                }

                // Fetch updated account data
                const accountResponse = await fetch('/dashboard/getAccountData');
                const accountResult = await accountResponse.json();

                if (accountResponse.ok && accountResult.status === "Success") {
                    // Update account data
                    window.accountData = accountResult.data;

                    // Update account balance display
                    updateAccountBalance(window.accountData);

                    // Fetch latest transactions
                    const transactionsResponse = await fetch('/dashboard/getLatestTransactions');
                    const transactionsResult = await transactionsResponse.json();

                    if (transactionsResponse.ok && transactionsResult.status === "Success") {
                        console.log('Updating latest transactions after goal redemption:', transactionsResult.data);
                        // Update latest transactions
                        updateLatestTransactions(transactionsResult.data);

                        // Force refresh the transactions list to ensure it's visible
                        setTimeout(() => {
                            // Try different selectors to find the transactions list
                            // First try the class name from the template (transaction-list)
                            let transactionsList = document.querySelector('.transaction-list');
                            console.log('Found transaction-list for refresh?', !!transactionsList);

                            // If not found, try other common class names
                            if (!transactionsList) {
                                transactionsList = document.querySelector('.transactions-list, .latest-transactions, .transactions');
                                console.log('Found alternative transaction list for refresh?', !!transactionsList);
                            }

                            // If not found, try to find it by ID
                            if (!transactionsList) {
                                transactionsList = document.getElementById('transactionsList');
                                console.log('Found transaction list by ID?', !!transactionsList);
                            }

                            if (transactionsList) {
                                console.log('Forcing refresh of transactions list');
                                // Add a highlight effect to make the new transaction noticeable
                                const items = transactionsList.querySelectorAll('.transaction-item, div[class*="transaction"], .d-flex.justify-content-between');
                                console.log('Found transaction items:', items.length);

                                if (items.length > 0) {
                                    const latestItem = items[0]; // First item is the most recent
                                    console.log('Highlighting latest transaction item');

                                    // Add a temporary highlight class
                                    latestItem.classList.add('highlight-new-transaction');

                                    // Add CSS for highlight class if it doesn't exist
                                    if (!document.getElementById('transaction-highlight-style')) {
                                        const style = document.createElement('style');
                                        style.id = 'transaction-highlight-style';
                                        style.textContent = `
                                            @keyframes highlight-transaction {
                                                0% { background-color: rgba(40, 167, 69, 0.2); }
                                                100% { background-color: transparent; }
                                            }

                                            .highlight-new-transaction {
                                                animation: highlight-transaction 2s ease-in-out;
                                            }
                                        `;
                                        document.head.appendChild(style);
                                    }

                                    // Remove the class after animation completes
                                    setTimeout(() => {
                                        latestItem.classList.remove('highlight-new-transaction');
                                    }, 2000);
                                }
                            } else {
                                console.log('Transactions list not found for refresh, trying to find transactions card');

                                // Try to find all cards
                                const allCards = document.querySelectorAll('.card');
                                console.log('Found cards:', allCards.length);

                                // Try to find the transactions card by title content
                                let transactionsCard = null;

                                allCards.forEach(card => {
                                    const title = card.querySelector('h5, .card-title');
                                    if (title && (
                                        title.textContent.includes('Transaction') ||
                                        title.textContent.includes('transaction') ||
                                        title.textContent.includes('Latest')
                                    )) {
                                        transactionsCard = card;
                                        console.log('Found transactions card by title:', title.textContent);
                                    }
                                });

                                if (transactionsCard) {
                                    console.log('Found transactions card, refreshing its content');

                                    // Check if there's an empty state
                                    const emptyState = transactionsCard.querySelector('.empty-state');
                                    if (emptyState) {
                                        console.log('Found empty state, removing it');
                                        emptyState.remove();
                                    }

                                    // Force a refresh of the entire card
                                    fetch('/dashboard/getLatestTransactions')
                                        .then(response => response.json())
                                        .then(data => {
                                            if (data.status === "Success") {
                                                console.log('Got fresh transaction data, updating UI');

                                                // Get the card body
                                                const cardBody = transactionsCard.querySelector('.card-body');
                                                if (cardBody) {
                                                    // Create a transaction list if it doesn't exist
                                                    let transactionList = cardBody.querySelector('.transaction-list');
                                                    if (!transactionList) {
                                                        console.log('Creating new transaction list');
                                                        transactionList = document.createElement('div');
                                                        transactionList.className = 'transaction-list';

                                                        // Add styles for scrolling
                                                        transactionList.style.maxHeight = '250px';
                                                        transactionList.style.overflowY = 'auto';
                                                        transactionList.style.overflowX = 'hidden';
                                                        transactionList.style.scrollbarWidth = 'thin';
                                                        transactionList.style.scrollbarColor = 'rgba(0,0,0,0.2) transparent';
                                                        transactionList.style.paddingRight = '5px';

                                                        // Add custom scrollbar styles if not already added
                                                        if (!document.getElementById('custom-scrollbar-style')) {
                                                            const scrollbarStyle = document.createElement('style');
                                                            scrollbarStyle.id = 'custom-scrollbar-style';
                                                            scrollbarStyle.textContent = `
                                                                .transaction-list::-webkit-scrollbar {
                                                                    width: 6px;
                                                                }
                                                                .transaction-list::-webkit-scrollbar-track {
                                                                    background: transparent;
                                                                }
                                                                .transaction-list::-webkit-scrollbar-thumb {
                                                                    background-color: rgba(0,0,0,0.2);
                                                                    border-radius: 3px;
                                                                }
                                                                .transaction-list::-webkit-scrollbar-thumb:hover {
                                                                    background-color: rgba(0,0,0,0.3);
                                                                }
                                                            `;
                                                            document.head.appendChild(scrollbarStyle);
                                                        }

                                                        cardBody.appendChild(transactionList);
                                                    }

                                                    // Clear existing transactions
                                                    transactionList.innerHTML = '';

                                                    // Add new transactions
                                                    data.data.forEach((tx, index) => {
                                                        const transactionItem = document.createElement('div');
                                                        transactionItem.className = index === 0 ?
                                                            'd-flex justify-content-between align-items-center mb-2 border-bottom pb-2 highlight-new-transaction' :
                                                            'd-flex justify-content-between align-items-center mb-2 border-bottom pb-2';

                                                        // Determine icon based on category
                                                        let iconClass = 'shopping-cart';
                                                        if (tx.category.toLowerCase().includes('grocery')) {
                                                            iconClass = 'shopping-basket';
                                                        } else if (tx.category.toLowerCase().includes('bill')) {
                                                            iconClass = 'file-invoice-dollar';
                                                        } else if (tx.category.toLowerCase().includes('fuel') || tx.category.toLowerCase().includes('transport')) {
                                                            iconClass = 'gas-pump';
                                                        } else if (tx.category.toLowerCase().includes('food')) {
                                                            iconClass = 'utensils';
                                                        } else if (tx.category.toLowerCase().includes('goal')) {
                                                            iconClass = 'bullseye';
                                                        }

                                                        transactionItem.innerHTML = `
                                                            <div class="me-2">
                                                                <i class="fas fa-${iconClass} me-2 text-secondary"></i>
                                                                <span style="font-weight: 500;">${tx.category}</span>
                                                            </div>
                                                            <div class="text-end">
                                                                <span class="fw-bold text-danger">-$${tx.amount}</span>
                                                            </div>
                                                        `;

                                                        transactionList.appendChild(transactionItem);
                                                    });

                                                    console.log('Transaction list updated successfully');
                                                }
                                            }
                                        })
                                        .catch(error => {
                                            console.error('Error refreshing transactions:', error);
                                        });
                                } else {
                                    console.error('Could not find transactions card for refresh');
                                }
                            }
                        }, 500);
                    }
                }

                // Server responded successfully, update the UI
                console.log('Server responded successfully, goal data updated');

                // Update global goal data
                if (result.goalData !== undefined) {
                    window.goalData = result.goalData;
                    window.hasGoal = result.hasGoal;
                }

                // Immediately remove the redeemed goal from the UI
                if (redeemedCard) {
                    console.log('Removing redeemed goal from UI');

                    // Add a visual indicator that the goal is being redeemed
                    redeemedCard.classList.add('redeeming');

                    // Determine if we're in single goal view or multiple goals view
                    const isMultipleGoalsView = document.getElementById('goalsContainer') !== null;
                    const isSingleGoalView = !isMultipleGoalsView && document.querySelector('.goal-card') !== null;

                    if (isSingleGoalView) {
                        console.log('In single goal view - removing goal and showing next goal if available');

                        // If we have other goals, show the next one
                        if (window.goalData && window.goalData.length > 0) {
                            console.log(`${window.goalData.length} goals remaining, showing next goal`);
                            // Update the single goal view with the first remaining goal
                            updateGoalsUI(window.goalData);
                        } else {
                            console.log('No goals left, showing empty state');
                            // Show empty state in the goal card
                            const cardBody = redeemedCard.querySelector('.card-body');
                            if (cardBody) {
                                cardBody.style.transition = 'opacity 0.3s ease';
                                cardBody.style.opacity = '0';

                                setTimeout(() => {
                                    // Use the original empty state from the template with the circular button in the top right
                                    cardBody.innerHTML = `
                                        <div style="position: absolute; top: 18px; right: 24px; z-index: 2;">
                                            <button id="newGoalBtn" class="btn btn-primary btn-circle" title="Set a New Goal" style="width:40px;height:40px;border-radius:50%;padding:0;display:flex;align-items:center;justify-content:center;">
                                                <i class="fas fa-plus"></i>
                                            </button>
                                        </div>
                                        <div class="d-flex align-items-center mb-2">
                                            <i class="fas fa-bullseye fa-2x me-2" style="color: var(--primary-color); filter: drop-shadow(0 2px 6px rgba(108,92,231,0.08));"></i>
                                            <h5 class="fw-bold mb-0" style="font-size:1.35rem;color:var(--primary-color);font-weight:700;">Goal</h5>
                                        </div>
                                        <div style="margin-bottom: 1.2rem;"></div>
                                        <div class="text-center py-3 empty-state">
                                            <div class="empty-state-icon mb-2">
                                                <i class="fas fa-bullseye fa-2x text-muted"></i>
                                            </div>
                                            <p class="text-muted mb-2">Set financial goals to track your savings progress and stay motivated</p>
                                        </div>
                                    `;

                                    cardBody.style.opacity = '1';

                                    // Add event listener to the new goal button with a slight delay to ensure DOM is ready
                                    setTimeout(() => {
                                        const newGoalBtn = cardBody.querySelector('#newGoalBtn');
                                        if (newGoalBtn) {
                                            console.log('Adding click event listener to newGoalBtn');
                                            newGoalBtn.addEventListener('click', function(event) {
                                                console.log('New goal button clicked');
                                                event.preventDefault();
                                                event.stopPropagation();

                                                const goalModal = document.getElementById('goalModal');
                                                if (goalModal) {
                                                    console.log('Opening goal modal');
                                                    const goalModalInstance = new bootstrap.Modal(goalModal);
                                                    goalModalInstance.show();
                                                } else {
                                                    console.error('Goal modal not found');
                                                }
                                            });
                                        } else {
                                            console.error('New goal button not found after adding to DOM');
                                        }
                                    }, 100);
                                }, 300);
                            }
                        }
                    } else if (isMultipleGoalsView) {
                        console.log('In multiple goals view - removing this goal card');

                        // Find the specific goal card for this goal
                        const allCards = document.querySelectorAll('.card');
                        let goalCard = null;

                        allCards.forEach(card => {
                            const label = card.querySelector('.card-title, .progress-label, h3');
                            if (label) {
                                // Extract the goal name, removing any numbering like "1/2 "
                                let labelText = label.textContent.trim();
                                // Remove numbering pattern like "1/2 " if present
                                const numberingMatch = labelText.match(/^\d+\/\d+\s+(.+)$/);
                                if (numberingMatch) {
                                    labelText = numberingMatch[1];
                                }

                                if (labelText === goalName) {
                                    goalCard = card;
                                }
                            }
                        });

                        if (goalCard) {
                            console.log('Found specific goal card to remove');
                            const parentCol = goalCard.closest('.col-md-6');

                            if (parentCol) {
                                // Animate removal with more visible effect
                                parentCol.style.transition = 'all 0.5s ease';
                                parentCol.style.opacity = '0';
                                parentCol.style.transform = 'translateY(-30px) scale(0.95)';
                                parentCol.style.boxShadow = '0 0 15px rgba(40, 167, 69, 0.5)';

                                // Remove after animation
                                setTimeout(() => {
                                    parentCol.remove();

                                    // If this was the last goal, show empty state
                                    if (!window.goalData || window.goalData.length === 0) {
                                        const goalsContainer = document.getElementById('goalsContainer');
                                        if (goalsContainer) {
                                            // Use the original empty state from the template
                                            goalsContainer.innerHTML = `
                                                <h2 class="mb-4">Your Financial Goals</h2>
                                                <div class="text-center py-3 empty-state">
                                                    <div class="empty-state-icon mb-2">
                                                        <i class="fas fa-bullseye fa-2x text-muted"></i>
                                                    </div>
                                                    <p class="text-muted mb-2">Set financial goals to track your savings progress and stay motivated</p>
                                                    <button type="button" class="btn btn-primary btn-sm add-goal-btn" style="cursor:pointer;z-index:1000;">
                                                        <i class="fas fa-plus-circle me-2"></i>Add Goal
                                                    </button>
                                                </div>
                                            `;

                                            // Update global state
                                            window.hasGoal = false;

                                            // Add event listener to the new add goal button with a slight delay
                                            setTimeout(() => {
                                                const addGoalBtn = goalsContainer.querySelector('.add-goal-btn');
                                                if (addGoalBtn) {
                                                    console.log('Adding click event listener to add-goal-btn in multiple goals view');
                                                    addGoalBtn.addEventListener('click', function(event) {
                                                        console.log('Add goal button clicked in multiple goals view');
                                                        event.preventDefault();
                                                        event.stopPropagation();

                                                        const goalModal = document.getElementById('goalModal');
                                                        if (goalModal) {
                                                            console.log('Opening goal modal from multiple goals view');
                                                            const goalModalInstance = new bootstrap.Modal(goalModal);
                                                            goalModalInstance.show();
                                                        } else {
                                                            console.error('Goal modal not found from multiple goals view');
                                                        }
                                                    });
                                                } else {
                                                    console.error('Add goal button not found in multiple goals view');
                                                }
                                            }, 100);
                                        }
                                    } else {
                                        // Re-render the remaining goals to ensure proper layout
                                        renderMultipleGoals(window.goalData);
                                    }
                                }, 300);
                            }
                        } else {
                            console.log('Could not find specific goal card, refreshing all goals');
                            // If we couldn't find the specific card, update all goals
                            renderMultipleGoals(window.goalData);
                        }
                    } else {
                        console.log('Could not determine view type, refreshing all goals');
                        // If we couldn't determine the view type, update all goals
                        if (window.goalData && window.goalData.length > 0) {
                            updateAllGoalCards(window.goalData);
                        }
                    }
                }

                // We've already updated the UI in the previous step, so we don't need to do it again
                console.log('UI has been updated, no further action needed');
            } catch (updateError) {
                console.error('Error updating UI after goal redemption:', updateError);
                // If updating the UI fails, fall back to page reload
                setTimeout(() => {
                    window.location.reload();
                }, 1500);
            }
        } else {
            // Show error message
            showAlert(`Error: ${result.message || 'Failed to redeem goal'}. Page will refresh...`, 'danger');

            // Refresh the page after a short delay
            console.log('Error occurred during goal redemption, refreshing page in 2 seconds...');
            setTimeout(() => {
                window.location.reload();
            }, 2000);
        }
    } catch (error) {
        console.error('Error redeeming goal:', error);
        showAlert(`Error: ${error.message || 'Failed to redeem goal'}. Page will refresh...`, 'danger');

        // Refresh the page after a short delay
        console.log('Error caught during goal redemption, refreshing page in 2 seconds...');
        setTimeout(() => {
            window.location.reload();
        }, 2000);
    }
}

/**
 * Update the transactions list with the latest data
 * @returns {Promise<void>}
 */
async function updateTransactionsList() {
    try {
        // Fetch latest transactions
        const response = await fetch('/dashboard/getLatestTransactions');
        const result = await response.json();

        if (response.ok && result.status === "Success") {
            console.log('Updating latest transactions:', result.data);

            // Try different selectors to find the transactions list
            let transactionsList = document.querySelector('.transaction-list');

            // If not found, try other common class names
            if (!transactionsList) {
                transactionsList = document.querySelector('.transactions-list, .latest-transactions, .transactions');
            }

            // If not found, try to find it by ID
            if (!transactionsList) {
                transactionsList = document.getElementById('transactionsList');
            }

            if (transactionsList) {
                // Clear existing transactions
                transactionsList.innerHTML = '';

                // Add new transactions
                result.data.forEach((tx, index) => {
                    const transactionItem = document.createElement('div');
                    transactionItem.className = index === 0 ?
                        'd-flex justify-content-between align-items-center mb-2 border-bottom pb-2 highlight-new-transaction' :
                        'd-flex justify-content-between align-items-center mb-2 border-bottom pb-2';

                    // Determine icon based on category
                    let iconClass = 'shopping-cart';
                    if (tx.category.toLowerCase().includes('grocery')) {
                        iconClass = 'shopping-basket';
                    } else if (tx.category.toLowerCase().includes('bill')) {
                        iconClass = 'file-invoice-dollar';
                    } else if (tx.category.toLowerCase().includes('fuel') || tx.category.toLowerCase().includes('transport')) {
                        iconClass = 'gas-pump';
                    } else if (tx.category.toLowerCase().includes('food')) {
                        iconClass = 'utensils';
                    } else if (tx.category.toLowerCase().includes('goal')) {
                        iconClass = 'bullseye';
                    }

                    transactionItem.innerHTML = `
                        <div class="me-2">
                            <i class="fas fa-${iconClass} me-2 text-secondary"></i>
                            <span style="font-weight: 500;">${tx.category}</span>
                        </div>
                        <div class="text-end">
                            <span class="fw-bold text-danger">-$${tx.amount}</span>
                        </div>
                    `;

                    transactionsList.appendChild(transactionItem);
                });

                // Add highlight effect to the first item
                const firstItem = transactionsList.querySelector('.highlight-new-transaction');
                if (firstItem) {
                    // Add CSS for highlight class if it doesn't exist
                    if (!document.getElementById('transaction-highlight-style')) {
                        const style = document.createElement('style');
                        style.id = 'transaction-highlight-style';
                        style.textContent = `
                            @keyframes highlight-transaction {
                                0% { background-color: rgba(40, 167, 69, 0.2); }
                                100% { background-color: transparent; }
                            }

                            .highlight-new-transaction {
                                animation: highlight-transaction 2s ease-in-out;
                            }
                        `;
                        document.head.appendChild(style);
                    }

                    // Remove the class after animation completes
                    setTimeout(() => {
                        firstItem.classList.remove('highlight-new-transaction');
                    }, 2000);
                }

                console.log('Transaction list updated successfully');
                return;
            }

            // If we couldn't find the transaction list, try to find the transactions card
            const allCards = document.querySelectorAll('.card');
            let transactionsCard = null;

            allCards.forEach(card => {
                const title = card.querySelector('h5, .card-title');
                if (title && (
                    title.textContent.includes('Transaction') ||
                    title.textContent.includes('transaction') ||
                    title.textContent.includes('Latest')
                )) {
                    transactionsCard = card;
                }
            });

            if (transactionsCard) {
                console.log('Found transactions card, refreshing its content');

                // Check if there's an empty state
                const emptyState = transactionsCard.querySelector('.empty-state');
                if (emptyState) {
                    emptyState.remove();
                }

                // Get the card body
                const cardBody = transactionsCard.querySelector('.card-body');
                if (cardBody) {
                    // Create a transaction list if it doesn't exist
                    let transactionList = cardBody.querySelector('.transaction-list');
                    if (!transactionList) {
                        transactionList = document.createElement('div');
                        transactionList.className = 'transaction-list';

                        // Add styles for scrolling
                        transactionList.style.maxHeight = '250px';
                        transactionList.style.overflowY = 'auto';
                        transactionList.style.overflowX = 'hidden';
                        transactionList.style.scrollbarWidth = 'thin';
                        transactionList.style.scrollbarColor = 'rgba(0,0,0,0.2) transparent';
                        transactionList.style.paddingRight = '5px';

                        // Add custom scrollbar styles if not already added
                        if (!document.getElementById('custom-scrollbar-style')) {
                            const scrollbarStyle = document.createElement('style');
                            scrollbarStyle.id = 'custom-scrollbar-style';
                            scrollbarStyle.textContent = `
                                .transaction-list::-webkit-scrollbar {
                                    width: 6px;
                                }
                                .transaction-list::-webkit-scrollbar-track {
                                    background: transparent;
                                }
                                .transaction-list::-webkit-scrollbar-thumb {
                                    background-color: rgba(0,0,0,0.2);
                                    border-radius: 3px;
                                }
                                .transaction-list::-webkit-scrollbar-thumb:hover {
                                    background-color: rgba(0,0,0,0.3);
                                }
                            `;
                            document.head.appendChild(scrollbarStyle);
                        }

                        cardBody.appendChild(transactionList);
                    }

                    // Clear existing transactions
                    transactionList.innerHTML = '';

                    // Add new transactions
                    result.data.forEach((tx, index) => {
                        const transactionItem = document.createElement('div');
                        transactionItem.className = index === 0 ?
                            'd-flex justify-content-between align-items-center mb-2 border-bottom pb-2 highlight-new-transaction' :
                            'd-flex justify-content-between align-items-center mb-2 border-bottom pb-2';

                        // Determine icon based on category
                        let iconClass = 'shopping-cart';
                        if (tx.category.toLowerCase().includes('grocery')) {
                            iconClass = 'shopping-basket';
                        } else if (tx.category.toLowerCase().includes('bill')) {
                            iconClass = 'file-invoice-dollar';
                        } else if (tx.category.toLowerCase().includes('fuel') || tx.category.toLowerCase().includes('transport')) {
                            iconClass = 'gas-pump';
                        } else if (tx.category.toLowerCase().includes('food')) {
                            iconClass = 'utensils';
                        } else if (tx.category.toLowerCase().includes('goal')) {
                            iconClass = 'bullseye';
                        }

                        transactionItem.innerHTML = `
                            <div class="me-2">
                                <i class="fas fa-${iconClass} me-2 text-secondary"></i>
                                <span style="font-weight: 500;">${tx.category}</span>
                            </div>
                            <div class="text-end">
                                <span class="fw-bold text-danger">-$${tx.amount}</span>
                            </div>
                        `;

                        transactionList.appendChild(transactionItem);
                    });

                    // Add highlight effect to the first item
                    const firstItem = transactionList.querySelector('.highlight-new-transaction');
                    if (firstItem) {
                        // Add CSS for highlight class if it doesn't exist
                        if (!document.getElementById('transaction-highlight-style')) {
                            const style = document.createElement('style');
                            style.id = 'transaction-highlight-style';
                            style.textContent = `
                                @keyframes highlight-transaction {
                                    0% { background-color: rgba(40, 167, 69, 0.2); }
                                    100% { background-color: transparent; }
                                }

                                .highlight-new-transaction {
                                    animation: highlight-transaction 2s ease-in-out;
                                }
                            `;
                            document.head.appendChild(style);
                        }

                        // Remove the class after animation completes
                        setTimeout(() => {
                            firstItem.classList.remove('highlight-new-transaction');
                        }, 2000);
                    }

                    console.log('Transaction list updated successfully');
                }
            } else {
                console.error('Could not find transactions list or card');
                throw new Error('Could not find transactions list or card');
            }

            // Update the monthly expenses data if it's included in the response
            if (result.monthlyExpenses && Array.isArray(result.monthlyExpenses)) {
                window.monthlyExpenses = result.monthlyExpenses;
                console.log('Updated monthly expenses data:', window.monthlyExpenses);
            }

            // Update the share button state based on the new expense data
            setupShareSummaryButton();
        } else {
            throw new Error(result.message || 'Failed to fetch latest transactions');
        }
    } catch (error) {
        console.error('Error updating transactions list:', error);
        throw error;
    }
}

/**
 * Update the account data and balance display
 * @returns {Promise<void>}
 */
async function updateAccountData() {
    try {
        // Fetch updated account data
        const response = await fetch('/dashboard/getAccountData');
        const result = await response.json();

        if (response.ok && result.status === "Success") {
            // Update account data
            window.accountData = result.data;

            // Update account balance display
            const balanceElement = document.getElementById('accountBalance');
            if (balanceElement && window.accountData) {
                balanceElement.textContent = window.accountData.balance;

                // Add a subtle animation to highlight the updated balance
                balanceElement.style.transition = 'color 0.5s ease';
                balanceElement.style.color = '#28a745'; // Green color

                // Reset color after animation
                setTimeout(() => {
                    balanceElement.style.color = '';
                }, 1500);
            }

            console.log('Account data updated successfully');
        } else {
            throw new Error(result.message || 'Failed to fetch account data');
        }
    } catch (error) {
        console.error('Error updating account data:', error);
        throw error;
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
 * Disables the button if there are no expenses to share
 */
function setupShareSummaryButton() {
    const shareBtn = document.getElementById('shareSummaryBtn');

    if (shareBtn) {
        console.log('Setting up share summary button');

        // Remove any existing event listeners to prevent duplicates
        shareBtn.removeEventListener('click', handleShareButtonClick);
        shareBtn.removeEventListener('click', handleDisabledShareButtonClick);

        // Create a wrapper div if it doesn't exist
        let wrapper = shareBtn.parentElement;
        if (!wrapper.classList.contains('share-btn-wrapper')) {
            // Create a wrapper to handle clicks even when button is disabled
            wrapper = document.createElement('div');
            wrapper.className = 'share-btn-wrapper';
            wrapper.style.position = 'relative';
            wrapper.style.display = 'inline-block';

            // Replace the button with the wrapper containing the button
            shareBtn.parentNode.insertBefore(wrapper, shareBtn);
            wrapper.appendChild(shareBtn);

            console.log('Created wrapper for share button');
        }

        // Check if there are expenses to share
        const hasExpense = window.hasOwnProperty('monthlyExpenses') &&
                          Array.isArray(window.monthlyExpenses) &&
                          window.monthlyExpenses.some(expense => expense > 0);

        console.log('Has expense data:', hasExpense);
        console.log('Monthly expenses:', window.monthlyExpenses);

        if (!hasExpense) {
            // Disable the button if there are no expenses
            shareBtn.disabled = true;
            shareBtn.title = "No expense data to share";
            console.log('Share button disabled: No expense data to share');

            // Apply light gray style to disabled button
            shareBtn.style.backgroundColor = '#f0f0f0';
            shareBtn.style.borderColor = '#e0e0e0';
            shareBtn.style.color = '#a0a0a0';
            shareBtn.style.cursor = 'not-allowed';

            // Remove click handler from button and add it to wrapper
            shareBtn.removeEventListener('click', handleDisabledShareButtonClick);
            wrapper.removeEventListener('click', handleDisabledShareButtonClick);
            wrapper.addEventListener('click', handleDisabledShareButtonClick);
        } else {
            // Enable the button if there are expenses
            shareBtn.disabled = false;
            shareBtn.title = "Share Dashboard Summary";

            // Reset button style
            shareBtn.style.backgroundColor = '';
            shareBtn.style.borderColor = '';
            shareBtn.style.color = '';
            shareBtn.style.cursor = '';

            // Remove click handler from wrapper and add it to button
            wrapper.removeEventListener('click', handleDisabledShareButtonClick);
            shareBtn.addEventListener('click', handleShareButtonClick);
        }
    }
}

/**
 * Handle disabled share button click event
 * Shows a tooltip when the disabled share button is clicked
 */
function handleDisabledShareButtonClick(event) {
    event.preventDefault();
    console.log('Disabled share button clicked, showing tooltip');

    // Remove any existing tooltips
    const existingTooltips = document.querySelectorAll('.custom-tooltip');
    existingTooltips.forEach(tooltip => tooltip.remove());

    // Create and show tooltip
    const tooltip = document.createElement('div');
    tooltip.className = 'custom-tooltip';
    tooltip.style.position = 'fixed'; // Use fixed positioning to ensure it's visible
    tooltip.style.backgroundColor = 'rgba(0, 0, 0, 0.8)';
    tooltip.style.color = 'white';
    tooltip.style.padding = '8px 12px';
    tooltip.style.borderRadius = '4px';
    tooltip.style.fontSize = '14px';
    tooltip.style.zIndex = '9999'; // Ensure it's above other elements
    tooltip.style.pointerEvents = 'none';
    tooltip.style.opacity = '0';
    tooltip.style.transition = 'opacity 0.3s ease';
    tooltip.style.boxShadow = '0 2px 5px rgba(0,0,0,0.2)';

    // Get the button's position
    let rect;
    if (event.target.tagName === 'I') {
        // If the icon was clicked, use the parent button's position
        rect = event.target.parentElement.getBoundingClientRect();
    } else {
        rect = event.target.getBoundingClientRect();
    }

    // Position the tooltip below the button
    tooltip.style.top = `${rect.bottom + 10}px`;
    tooltip.style.left = `${rect.left + (rect.width / 2) - 100}px`;
    tooltip.style.width = '200px';
    tooltip.style.textAlign = 'center';

    // Add content with arrow
    tooltip.innerHTML = `
        <div style="
            position: absolute;
            top: -6px;
            left: 50%;
            transform: translateX(-50%);
            width: 0;
            height: 0;
            border-left: 6px solid transparent;
            border-right: 6px solid transparent;
            border-bottom: 6px solid rgba(0, 0, 0, 0.8);
        "></div>
        <span>No expense data to share</span>
    `;

    // Add to document
    document.body.appendChild(tooltip);

    // Show tooltip with animation
    setTimeout(() => {
        tooltip.style.opacity = '1';
        console.log('Tooltip should be visible now');
    }, 10);

    // Remove tooltip after delay
    setTimeout(() => {
        tooltip.style.opacity = '0';
        setTimeout(() => {
            if (document.body.contains(tooltip)) {
                document.body.removeChild(tooltip);
            }
        }, 300);
    }, 3000);

    // Also show a fallback alert for mobile devices or if tooltip doesn't work
    showAlert('No expense data to share', 'warning');
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
        // If modal doesn't exist, show an alert that the feature is not available
        showAlert('Share feature is not available. Please try again later.', 'warning');
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
            receiversID: selectedUserId  // Using receiversID as in app.py
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
 * Check if a goal name already exists in the current goals
 * @param {string} goalName - The goal name to check
 * @returns {boolean} True if the goal name already exists, false otherwise
 */
function checkDuplicateGoalName(goalName) {
    console.log('Checking if goal name already exists:', goalName);

    // Normalize the goal name for case-insensitive comparison
    const normalizedName = goalName.trim().toLowerCase();

    // Check if window.goalData exists and is an array
    if (!window.goalData || !Array.isArray(window.goalData)) {
        console.log('No existing goals found');
        return false;
    }

    // Check if any existing goal has the same name (case-insensitive)
    const isDuplicate = window.goalData.some(goal => {
        const existingName = goal.goalName.trim().toLowerCase();
        const isMatch = existingName === normalizedName;
        if (isMatch) {
            console.log('Found duplicate goal name:', goal.goalName);
        }
        return isMatch;
    });

    console.log('Is duplicate goal name:', isDuplicate);
    return isDuplicate;
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
    if (checkDuplicateGoalName(data.goalName)) {
        return { isValid: false, message: 'A goal with this name already exists' };
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
    if (!accountData) {
        console.error('updateAccountBalance called with no accountData');
        return;
    }

    console.log('Updating account balance with:', accountData);

    // Check if accountData has the correct structure
    if (typeof accountData.balance === 'undefined') {
        console.error('accountData is missing balance property:', accountData);
        // Try to extract balance from nested structure if available
        if (accountData.accountData && typeof accountData.accountData.balance !== 'undefined') {
            console.log('Found balance in nested accountData structure, using that instead');
            accountData = accountData.accountData;
        } else {
            console.error('Could not find balance property in accountData');
            return;
        }
    }

    const balanceElement = document.getElementById('balanceAmount');
    console.log('Balance element found:', balanceElement ? 'Yes' : 'No');

    // Try different selectors for trend element
    let trendElement = document.querySelector('.balance-trend');
    if (!trendElement) {
        // Try alternative selectors
        trendElement = document.querySelector('.card .balance-trend');
        console.log('Tried alternative selector for trend element, found:', trendElement ? 'Yes' : 'No');
    }
    console.log('Trend element found:', trendElement ? 'Yes' : 'No');

    // If balance element doesn't exist, create the account balance card
    if (!balanceElement) {
        console.log('Balance element not found, creating account balance card');
        const mainContent = document.querySelector('.main-content');
        if (mainContent) {
            const row = mainContent.querySelector('.row');
            if (row) {
                // Create a new column for the account balance card
                const col = document.createElement('div');
                col.className = 'col-md-6 mb-4';
                col.style.opacity = '0';
                col.style.transform = 'translateY(20px)';
                col.style.transition = 'opacity 0.5s ease, transform 0.5s ease';

                col.innerHTML = `
                    <div class="card border-0 shadow-sm">
                        <div class="card-body">
                            <h2 class="card-title">Account Balance</h2>
                            <hr>
                            <div class="text-center py-3">
                                <div class="display-5 mb-2" style="color:var(--primary-color);font-weight:700;" id="balanceAmount">
                                    $${accountData.balance.toFixed(2)}
                                </div>
                                <div class="balance-trend">
                                    <span class="badge bg-${accountData.trendType === 'up' ? 'success' : 'danger'} me-2">
                                        <i class="fas fa-arrow-${accountData.trendType}"></i>
                                        ${accountData.percentageChange || 0}%
                                    </span>
                                </div>
                            </div>
                        </div>
                    </div>
                `;

                // Insert the column at the beginning of the row
                row.insertBefore(col, row.firstChild);

                // Animate the card
                setTimeout(() => {
                    col.style.opacity = '1';
                    col.style.transform = 'translateY(0)';
                }, 100);

                console.log('Created new account balance card');
                return; // Exit function since we've created the card with the current balance
            }
        }
    }

    // Update existing balance element
    if (balanceElement) {
        console.log('Updating existing balance element with value:', accountData.balance);

        // Force immediate update first for better UX
        balanceElement.textContent = '$' + accountData.balance.toFixed(2);

        // Then try animation if available
        if (typeof CountUp !== 'undefined') {
            try {
                new CountUp('balanceAmount', accountData.balance, {
                    prefix: '$',
                    duration: 2,
                    decimalPlaces: 2
                }).start();
                console.log('CountUp animation started for balance');
            } catch (error) {
                console.error('Error updating balance with CountUp:', error);
            }
        }

        // If trend element doesn't exist, try to create it
        if (!trendElement) {
            console.log('Trend element not found, trying to create it');
            const balanceContainer = balanceElement.parentElement;
            if (balanceContainer) {
                // Check if there's already a trend element as a sibling
                const existingTrend = balanceContainer.querySelector('.balance-trend');
                if (!existingTrend) {
                    // Create new trend element
                    const newTrendElement = document.createElement('div');
                    newTrendElement.className = 'balance-trend';
                    newTrendElement.innerHTML = `
                        <span class="badge bg-${accountData.trendType === 'up' ? 'success' : 'danger'} me-2">
                            <i class="fas fa-arrow-${accountData.trendType}"></i>
                            ${accountData.percentageChange || 0}%
                        </span>
                    `;
                    balanceContainer.appendChild(newTrendElement);
                    console.log('Created new trend element');
                    trendElement = newTrendElement;
                }
            }
        }
    }

    // Update trend element if it exists
    if (trendElement) {
        console.log('Updating trend element');
        trendElement.innerHTML = `
            <span class="badge bg-${accountData.trendType === 'up' ? 'success' : 'danger'} me-2">
                <i class="fas fa-arrow-${accountData.trendType}"></i>
                ${accountData.percentageChange || 0}%
            </span>
        `;
    }

    // Highlight the account balance card to draw attention to the update
    const balanceCard = balanceElement?.closest('.card');
    if (balanceCard) {
        console.log('Highlighting balance card');

        // Remove any existing animation classes
        balanceCard.classList.remove('salary-added', 'balance-updated');

        // Force a reflow to restart the animation
        void balanceCard.offsetWidth;

        // Add the animation class
        balanceCard.classList.add('salary-added');

        // Also highlight the balance amount specifically
        if (balanceElement) {
            balanceElement.classList.remove('balance-updated');
            void balanceElement.offsetWidth;
            balanceElement.classList.add('balance-updated');
        }
    }
}

/**
 * Update budget suggestions with new data
 * @param {Object} budgetData - Budget suggestion data
 */
function updateBudgetSuggestions(budgetData) {
    if (!budgetData) return;

    const needsAmount = document.getElementById('needsAmount');
    const wantsAmount = document.getElementById('wantsAmount');
    const savingsAmount = document.getElementById('savingsAmount');

    // If any of the elements don't exist, create the budget card
    if (!needsAmount || !wantsAmount || !savingsAmount) {
        // Find the appropriate row to insert the budget card
        const mainContent = document.querySelector('.main-content');
        if (mainContent) {
            const row = mainContent.querySelector('.row');
            if (row) {
                // Create a new column for the budget card
                const col = document.createElement('div');
                col.className = 'col-md-6 mb-4';
                col.innerHTML = `
                    <div class="card border-0 shadow-sm">
                        <div class="card-body">
                            <h2 class="card-title">Budget Suggestions</h2>
                            <hr>
                            <div class="budget-suggestions">
                                <div class="row mb-3">
                                    <div class="col-4 text-center">
                                        <div class="budget-category">
                                            <div class="budget-icon bg-primary-light text-primary mb-2">
                                                <i class="fas fa-home"></i>
                                            </div>
                                            <h6>Needs</h6>
                                            <div class="budget-amount" id="needsAmount">$${budgetData.needs.toFixed(2)}</div>
                                        </div>
                                    </div>
                                    <div class="col-4 text-center">
                                        <div class="budget-category">
                                            <div class="budget-icon bg-success-light text-success mb-2">
                                                <i class="fas fa-shopping-bag"></i>
                                            </div>
                                            <h6>Wants</h6>
                                            <div class="budget-amount" id="wantsAmount">$${budgetData.wants.toFixed(2)}</div>
                                        </div>
                                    </div>
                                    <div class="col-4 text-center">
                                        <div class="budget-category">
                                            <div class="budget-icon bg-info-light text-info mb-2">
                                                <i class="fas fa-piggy-bank"></i>
                                            </div>
                                            <h6>Savings</h6>
                                            <div class="budget-amount" id="savingsAmount">$${budgetData.savings.toFixed(2)}</div>
                                        </div>
                                    </div>
                                </div>
                                <div class="text-center text-muted small">
                                    <p>Based on the 50/30/20 rule for your salary of $${budgetData.salary.toFixed(2)}</p>
                                </div>
                            </div>
                        </div>
                    </div>
                `;

                // Insert the column after the account balance card
                const accountBalanceCard = row.querySelector('.col-md-6');
                if (accountBalanceCard) {
                    row.insertBefore(col, accountBalanceCard.nextSibling);
                } else {
                    row.appendChild(col);
                }

                // Animate the card
                setTimeout(() => {
                    col.style.opacity = '1';
                    col.style.transform = 'translateY(0)';
                }, 100);
            }
        }
        return;
    }

    // Update existing elements with animation
    if (needsAmount && isCountUpAvailable()) {
        try {
            new CountUp('needsAmount', budgetData.needs, {
                prefix: '$',
                duration: 2,
                decimalPlaces: 2
            }).start();
        } catch (error) {
            console.error('Error updating needs amount:', error);
            needsAmount.textContent = '$' + budgetData.needs.toFixed(2);
        }
    } else if (needsAmount) {
        needsAmount.textContent = '$' + budgetData.needs.toFixed(2);
    }

    if (wantsAmount && isCountUpAvailable()) {
        try {
            new CountUp('wantsAmount', budgetData.wants, {
                prefix: '$',
                duration: 2,
                decimalPlaces: 2
            }).start();
        } catch (error) {
            console.error('Error updating wants amount:', error);
            wantsAmount.textContent = '$' + budgetData.wants.toFixed(2);
        }
    } else if (wantsAmount) {
        wantsAmount.textContent = '$' + budgetData.wants.toFixed(2);
    }

    if (savingsAmount && isCountUpAvailable()) {
        try {
            new CountUp('savingsAmount', budgetData.savings, {
                prefix: '$',
                duration: 2,
                decimalPlaces: 2
            }).start();
        } catch (error) {
            console.error('Error updating savings amount:', error);
            savingsAmount.textContent = '$' + budgetData.savings.toFixed(2);
        }
    } else if (savingsAmount) {
        savingsAmount.textContent = '$' + budgetData.savings.toFixed(2);
    }
}

/**
 * Update latest transactions list
 * @param {Array} transactions - Array of transaction objects
 */
function updateLatestTransactions(transactions) {
    const transactionsContainer = document.getElementById('latestTransactions');
    if (!transactionsContainer) return;

    // Add loading state
    transactionsContainer.classList.add('loading');

    // Clear existing transactions
    transactionsContainer.innerHTML = '';

    if (!transactions || transactions.length === 0) {
        // Show empty state
        transactionsContainer.innerHTML = `
            <div class="text-center py-4">
                <p class="text-muted">No transactions yet</p>
            </div>
        `;
        transactionsContainer.classList.remove('loading');
        return;
    }

    // Create transaction list
    const transactionsList = document.createElement('div');
    transactionsList.className = 'list-group list-group-flush';

    // Add each transaction
    transactions.forEach(transaction => {
        const transactionItem = document.createElement('div');
        transactionItem.className = 'list-group-item px-0';

        // Format date
        const date = new Date(transaction.date);
        const formattedDate = date.toLocaleDateString('en-US', {
            month: 'short',
            day: 'numeric',
            year: 'numeric'
        });

        // Determine icon based on category
        let icon = 'fa-shopping-bag';
        let iconColor = 'primary';

        switch (transaction.category?.toLowerCase()) {
            case 'food':
                icon = 'fa-utensils';
                iconColor = 'success';
                break;
            case 'transportation':
                icon = 'fa-car';
                iconColor = 'info';
                break;
            case 'housing':
                icon = 'fa-home';
                iconColor = 'warning';
                break;
            case 'utilities':
                icon = 'fa-bolt';
                iconColor = 'danger';
                break;
            case 'entertainment':
                icon = 'fa-film';
                iconColor = 'purple';
                break;
            case 'shopping':
                icon = 'fa-shopping-cart';
                iconColor = 'primary';
                break;
            case 'salary':
                icon = 'fa-money-bill-wave';
                iconColor = 'success';
                break;
            default:
                icon = 'fa-receipt';
                iconColor = 'secondary';
        }

        // Create transaction item HTML
        transactionItem.innerHTML = `
            <div class="d-flex justify-content-between align-items-center">
                <div class="d-flex align-items-center">
                    <div class="transaction-icon bg-${iconColor}-light text-${iconColor} me-3">
                        <i class="fas ${icon}"></i>
                    </div>
                    <div>
                        <h6 class="mb-0">${transaction.category || 'Uncategorized'}</h6>
                        <small class="text-muted">${formattedDate}</small>
                    </div>
                </div>
                <div class="text-${transaction.category?.toLowerCase() === 'salary' ? 'success' : 'danger'} fw-bold">
                    ${transaction.category?.toLowerCase() === 'salary' ? '+' : '-'}$${parseFloat(transaction.amount).toFixed(2)}
                </div>
            </div>
        `;

        // Add animation delay for staggered entrance
        transactionItem.style.opacity = '0';
        transactionItem.style.transform = 'translateY(10px)';

        transactionsList.appendChild(transactionItem);
    });

    // Add the list to the container
    transactionsContainer.appendChild(transactionsList);

    // Remove loading state
    transactionsContainer.classList.remove('loading');

    // Animate transactions entrance
    const items = transactionsList.querySelectorAll('.list-group-item');
    items.forEach((item, index) => {
        setTimeout(() => {
            item.style.transition = 'all 0.3s ease-out';
            item.style.opacity = '1';
            item.style.transform = 'translateY(0)';
        }, 50 * index);
    });
}

/**
 * Utility: show a Bootstrap alert message
 * @param {string} message - Alert message text
 * @param {string} type - Bootstrap alert type (e.g., 'success','warning','danger','info')
 * @param {number} duration - Duration in milliseconds to show the alert (default: 5000ms)
 */
function showAlert(message, type = 'info', duration = 5000) {
    const container = document.querySelector('.main-content') || document.body;
    const alertDiv = document.createElement('div');
    alertDiv.className = `alert alert-${type} alert-dismissible fade show`;
    alertDiv.role = 'alert';
    alertDiv.innerHTML = `
        ${message}
        <button type="button" class="btn-close" data-bs-dismiss="alert"></button>
    `;

    // Add special styling for goal completion alerts
    if (message.includes('goal') && message.includes('100%') && type === 'success') {
        alertDiv.classList.add('goal-completion-alert');
        alertDiv.style.borderLeft = '5px solid #28a745';
        alertDiv.style.backgroundColor = 'rgba(40, 167, 69, 0.1)';
    }

    container.prepend(alertDiv);

    // Animate the alert entrance
    alertDiv.style.opacity = '0';
    alertDiv.style.transform = 'translateY(-20px)';

    setTimeout(() => {
        alertDiv.style.transition = 'all 0.3s ease-out';
        alertDiv.style.opacity = '1';
        alertDiv.style.transform = 'translateY(0)';
    }, 10);

    // Set timeout to remove the alert
    setTimeout(() => {
        alertDiv.style.opacity = '0';
        alertDiv.style.transform = 'translateY(-20px)';
        setTimeout(() => alertDiv.remove(), 300);
    }, duration);
}