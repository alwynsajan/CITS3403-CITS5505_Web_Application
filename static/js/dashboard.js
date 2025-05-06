/**
 * Smart Budget Dashboard JavaScript - Modernized Version
 * This file handles all interactive elements of the dashboard with enhanced animations
 */

// Store any data passed from backend
// These variables should be declared in HTML with var keyword to avoid scope issues
// var monthlyLabels = [];
// var monthlyExpenses = [];
// var goalData = [];

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
        setupEventListeners();
        
        // Add entrance animations to cards
        animateCards();
        
        // Setup Add Salary button
        setupAddSalaryButton();
    }, 300); // Small delay for smoother rendering
});

/**
 * Add entrance animations to cards
 */
function animateCards() {
    const cards = document.querySelectorAll('.card');
    
    cards.forEach((card, index) => {
        // Create a staggered animation effect
        setTimeout(() => {
            card.style.opacity = '1';
            card.style.transform = 'translateY(0)';
        }, 100 * index);
    });
}

/**
 * Set up all event listeners for interactive elements
 */
function setupEventListeners() {
    // New goal button
    const newGoalBtn = document.getElementById('newGoalBtn');
    if (newGoalBtn) {
        newGoalBtn.addEventListener('click', function() {
            const goalModal = new bootstrap.Modal(document.getElementById('goalModal'));
            goalModal.show();
        });
    }
    
    // Save goal button
    const saveGoalBtn = document.getElementById('saveGoalBtn');
    if (saveGoalBtn) {
        saveGoalBtn.addEventListener('click', saveNewGoal);
    }
    
    // Export buttons
    const exportCSVBtn = document.getElementById('exportCSV');
    if (exportCSVBtn) {
        exportCSVBtn.addEventListener('click', function() {
            // Add button animation
            this.classList.add('btn-clicked');
            setTimeout(() => {
                this.classList.remove('btn-clicked');
            }, 300);
            
            window.location.href = '/dashboard/export/csv';
        });
    }
    
    const exportPDFBtn = document.getElementById('exportPDF');
    if (exportPDFBtn) {
        exportPDFBtn.addEventListener('click', function() {
            // Add button animation
            this.classList.add('btn-clicked');
            setTimeout(() => {
                this.classList.remove('btn-clicked');
            }, 300);
            
            window.location.href = '/dashboard/export/pdf';
        });
    }
    
    // Add hover effects to budget categories
    const budgetCategories = document.querySelectorAll('.budget-category');
    budgetCategories.forEach(category => {
        category.addEventListener('mouseenter', function() {
            this.querySelector('.category-amount').style.transform = 'scale(1.1)';
        });
        
        category.addEventListener('mouseleave', function() {
            this.querySelector('.category-amount').style.transform = 'scale(1)';
        });
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
 * Show alert message with animation
 */
function showAlert(message, type = 'info') {
    const container = document.querySelector('.container');
    if (!container) {
        console.error('Container element not found');
        return;
    }

    const alertDiv = document.createElement('div');
    alertDiv.className = `alert alert-${type} alert-dismissible fade show`;
    alertDiv.role = 'alert';
    alertDiv.innerHTML = `
        ${message}
        <button type="button" class="btn-close" data-bs-dismiss="alert" aria-label="Close"></button>
    `;
    
    try {
        container.insertBefore(alertDiv, container.firstChild);
        
        // Auto dismiss after 5 seconds
        setTimeout(() => {
            alertDiv.remove();
        }, 5000);
    } catch (error) {
        console.error('Error showing alert:', error);
    }
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

        if (!response.ok || result.status !== "Success") {
            // Use message from server if available, otherwise generic error
            throw new Error(result.message || `HTTP error! status: ${response.status}`);
        }

        // Close modal first
        const modal = bootstrap.Modal.getInstance(document.getElementById('goalModal'));
        if (modal) {
            modal.hide();
            // Ensure backdrop is removed if it lingers
            const backdrop = document.querySelector('.modal-backdrop');
            if (backdrop) backdrop.remove();
            document.body.classList.remove('modal-open');
            document.body.style.overflow = '';
            document.body.style.paddingRight = '';
        }

        // Then update UI with the returned goal data
        let goalProgress = document.querySelector('.goal-progress');
        if (!goalProgress) {
            // Insert goal progress HTML into .goal-card
            const goalCard = document.querySelector('.goal-card .card-body');
            if (goalCard && result.data && result.data.length > 0) {
                const firstGoal = result.data[0];
                goalCard.innerHTML = `
                    <div class="goal-progress text-center">
                        <h3 class="h5 mb-3" style="color:var(--primary-color);font-weight:700;">${firstGoal.goalName}</h3>
                        <div class="d-flex justify-content-center align-items-center mb-2" style="gap: 16px;">
                            <div class="progress-circle mx-auto mb-2" style="width: 150px; height: 150px;">
                                <svg class="goal-progress-svg" width="150" height="150">
                                    <circle class="progress-bg" cx="75" cy="75" r="65" stroke="#eee" stroke-width="14" fill="none"/>
                                    <circle class="progress-bar" cx="75" cy="75" r="65" stroke="var(--primary-color)" stroke-width="14" fill="none" stroke-linecap="round"/>
                                </svg>
                                <div class="progress-circle-inner" style="position:absolute;top:0;left:0;width:100%;height:100%;display:flex;flex-direction:column;align-items:center;justify-content:center;pointer-events:none;">
                                    <div class="progress-percentage" style="color:var(--primary-color);font-weight:700;">
                                        <span id="goalProgress">${firstGoal.progressPercentage}%</span>
                                    </div>
                                </div>
                            </div>
                        </div>
                        <div id="goalDetails" class="goal-details">
                            <p class="mb-1"><strong>Target:</strong> $<span id="goalTarget">${firstGoal.target}</span></p>
                            <p class="mb-1"><strong>Saved:</strong> $<span id="goalSaved">${firstGoal.saved}</span></p>
                            <p class="mb-1"><strong>Remaining:</strong> $<span id="goalRemaining">${firstGoal.remaining}</span></p>
                            ${firstGoal.message ? `<p class="mb-0"><small id="goalMessage">${firstGoal.message}</small></p>` : ''}
                        </div>
                    </div>
                `;
                // After inserting, update UI and progress circle
                updateGoalsUI(result.data);
                animateCards();
            }
            // Optionally, reset form here if modal listener is problematic
            form.reset();
            return; // Exit after handling insertion
        }
        // If goalProgress exists, just update
        updateGoalsUI(result.data);
        animateCards();
        form.reset(); // Reset form after successful update

        showAlert(result.message || 'Goal added successfully!', 'success'); // Show success message from server

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

/**
 * Setup Add Salary button functionality
 */
function setupAddSalaryButton() {
    const addSalaryButtons = document.querySelectorAll('.add-salary-btn');
    const salaryModal = new bootstrap.Modal(document.getElementById('salaryModal'));
    
    addSalaryButtons.forEach(button => {
        button.addEventListener('click', function() {
            // Add button animation
            this.classList.add('btn-clicked');
            setTimeout(() => {
                this.classList.remove('btn-clicked');
            }, 300);
            
            // Show modal
            salaryModal.show();
        });
    });
}

// Expose updateGoalProgressCircle to window for external use
window.updateGoalProgressCircle = updateGoalProgressCircle;

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

                // Check if balanceDisplay exists. If not, reload page for first salary.
                 const balanceDisplay = document.getElementById('balanceAmount');
                 if (!balanceDisplay) {
                     window.location.reload();
                     return;
                 }

                // Update the account balance display
                const newBalance = result.new_balance || 0;
                new CountUp('balanceAmount', newBalance, {
                    prefix: '$',
                    duration: 2,
                    decimalPlaces: 2
                }).start();

                // Update budget suggestions
                if (result.budgetSuggestions) {
                    const needsAmount = document.getElementById('needsAmount');
                    const wantsAmount = document.getElementById('wantsAmount');
                    const savingsAmount = document.getElementById('savingsAmount');
                    const salaryInfo = document.getElementById('salaryInfo');

                    // Check if budget section exists. If not, reload.
                     if (!needsAmount || !wantsAmount || !savingsAmount) {
                         window.location.reload();
                         return;
                     }

                    if (needsAmount) needsAmount.textContent = `$${result.budgetSuggestions.needs.toFixed(2)}`;
                    if (wantsAmount) wantsAmount.textContent = `$${result.budgetSuggestions.wants.toFixed(2)}`;
                    if (savingsAmount) savingsAmount.textContent = `$${result.budgetSuggestions.savings.toFixed(2)}`;
                    if (salaryInfo) salaryInfo.textContent = `Based on monthly salary: $${result.budgetSuggestions.salary.toFixed(2)}`; // Simplified date display
                }

                // Hide the modal
                if (salaryModalInstance) {
                    salaryModalInstance.hide();
                     // Ensure backdrop is removed if it lingers
                    const backdrop = document.querySelector('.modal-backdrop');
                    if (backdrop) backdrop.remove();
                    document.body.classList.remove('modal-open');
                    document.body.style.overflow = '';
                    document.body.style.paddingRight = '';
                }

                // Reset the form
                 salaryForm.reset();

                 showAlert(result.message || 'Salary added successfully!', 'success');

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

    // Add Share Summary Logic
    const shareButton = document.getElementById('shareSummaryBtn');
    const shareModal = document.getElementById('shareModal') ? new bootstrap.Modal(document.getElementById('shareModal')) : null;
    const shareTextArea = document.getElementById('shareSummaryText');
    const copyButton = document.getElementById('copySummaryBtn');
    const copyFeedback = document.getElementById('copyFeedback');

    if (shareButton && shareModal && shareTextArea && copyButton && copyFeedback) {
        shareButton.addEventListener('click', async () => {
            shareButton.disabled = true;
            shareButton.innerHTML = '<i class="fas fa-spinner fa-spin"></i>';

            try {
                const response = await fetch('/share_summary');
                const result = await response.json();

                if (!response.ok || result.status !== "Success") {
                    throw new Error(result.message || 'Could not generate summary');
                }

                shareTextArea.value = result.summary; // Display summary in textarea
                copyFeedback.style.display = 'none'; // Hide previous feedback
                shareModal.show(); // Show the modal

            } catch (error) {
                console.error('Error fetching summary:', error);
                showAlert(error.message, 'danger');
            } finally {
                shareButton.disabled = false;
                shareButton.innerHTML = '<i class="fas fa-share-alt"></i>';
            }
        });

        // Copy button inside the modal
        copyButton.addEventListener('click', () => {
            shareTextArea.select();
            try {
                navigator.clipboard.writeText(shareTextArea.value).then(() => {
                    const feedback = document.getElementById('copyFeedback');
                    feedback.style.display = 'block';
                    feedback.classList.add('show');
                    
                    // Hide feedback after animation
                    setTimeout(() => {
                        feedback.classList.remove('show');
                        setTimeout(() => {
                            feedback.style.display = 'none';
                        }, 300);
                    }, 1500);
                }).catch(err => {
                    console.error('Clipboard write failed: ', err);
                    showAlert('Failed to copy to clipboard.', 'warning');
                });
            } catch (err) {
                console.error('Clipboard API error: ', err);
                showAlert('Clipboard functionality not supported.', 'warning');
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

// Share functionality
const userSearchModal = new bootstrap.Modal(document.getElementById('shareUserSearchModal'));
const sharePreviewModal = new bootstrap.Modal(document.getElementById('sharePreviewModal'));
const userSearchInput = document.getElementById('userSearchInput');
const userSearchResults = document.getElementById('userSearchResults');
const selectedUserName = document.getElementById('selectedUserName');
const reportPreview = document.getElementById('reportPreview');
const confirmShareBtn = document.getElementById('confirmShareBtn');

let selectedUser = null;
let searchTimeout = null;

// Share button click handler
document.getElementById('shareSummaryBtn').addEventListener('click', () => {
    userSearchModal.show();
});

// User search input handler
userSearchInput.addEventListener('input', (e) => {
    const searchTerm = e.target.value.trim();
    
    // Clear previous timeout
    if (searchTimeout) {
        clearTimeout(searchTimeout);
    }
    
    // Set new timeout for search
    searchTimeout = setTimeout(() => {
        if (searchTerm.length > 0) {
            searchUsers(searchTerm);
        } else {
            userSearchResults.innerHTML = '';
        }
    }, 300);
});

// Search users function
async function searchUsers(searchTerm) {
    try {
        const response = await fetch(`/api/search_users?term=${encodeURIComponent(searchTerm)}`);
        const data = await response.json();
        
        if (response.ok) {
            displayUserResults(data);
        } else {
            throw new Error(data.message || 'Failed to search users');
        }
    } catch (error) {
        console.error('Error searching users:', error);
        showErrorModal('Failed to search users. Please try again.');
    }
}

// Display user search results
function displayUserResults(users) {
    userSearchResults.innerHTML = '';
    
    if (users.length === 0) {
        userSearchResults.innerHTML = `
            <div class="list-group-item text-center text-muted">
                <i class="fas fa-user-slash me-2"></i>No users found
            </div>
        `;
        return;
    }
    
    users.forEach(user => {
        const userElement = document.createElement('button');
        userElement.className = 'list-group-item list-group-item-action';
        userElement.innerHTML = `
            <div class="d-flex align-items-center">
                <div class="me-3">
                    <i class="fas fa-user-circle fa-2x text-muted"></i>
                </div>
                <div>
                    <h6 class="mb-0">${user.firstName} ${user.lastName}</h6>
                    <small class="text-muted">@${user.username}</small>
                </div>
            </div>
        `;
        
        userElement.addEventListener('click', () => selectUser(user));
        userSearchResults.appendChild(userElement);
    });
}

// Select user and show preview
async function selectUser(user) {
    selectedUser = user;
    userSearchModal.hide();
    
    try {
        const response = await fetch('/api/generate_report', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                recipientId: user.userID
            })
        });
        
        const data = await response.json();
        
        if (!response.ok || data.status === 'Failed') {
            throw new Error(data.message || 'Failed to generate report');
        }
        
        selectedUserName.textContent = `${user.firstName} ${user.lastName}`;
        displayReportPreview(data);
        sharePreviewModal.show();
        
    } catch (error) {
        console.error('Error generating report:', error);
        showErrorModal('Failed to generate report. Please try again.');
    }
}

// Display report preview
function displayReportPreview(reportData) {
    // Format and display the report data
    reportPreview.innerHTML = `
        <div class="report-section mb-4">
            <h5 class="mb-3">Account Overview</h5>
            <div class="row">
                <div class="col-md-4">
                    <div class="card">
                        <div class="card-body">
                            <h6 class="card-title">Current Balance</h6>
                            <p class="h4 mb-0">$${reportData.dashboardData.accountData.balance.toFixed(2)}</p>
                        </div>
                    </div>
                </div>
                <div class="col-md-4">
                    <div class="card">
                        <div class="card-body">
                            <h6 class="card-title">Monthly Savings</h6>
                            <p class="h4 mb-0">$${reportData.dashboardData.budgetSuggestionData.savings.toFixed(2)}</p>
                        </div>
                    </div>
                </div>
                <div class="col-md-4">
                    <div class="card">
                        <div class="card-body">
                            <h6 class="card-title">Active Goals</h6>
                            <p class="h4 mb-0">${reportData.dashboardData.goalData.length}</p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
        
        <div class="report-section mb-4">
            <h5 class="mb-3">Budget Allocation</h5>
            <div class="row">
                <div class="col-md-4">
                    <div class="budget-item">
                        <h6>Needs</h6>
                        <div class="progress mb-2">
                            <div class="progress-bar bg-primary" role="progressbar" style="width: 50%"></div>
                        </div>
                        <p class="mb-0">$${reportData.dashboardData.budgetSuggestionData.needs.toFixed(2)}</p>
                    </div>
                </div>
                <div class="col-md-4">
                    <div class="budget-item">
                        <h6>Wants</h6>
                        <div class="progress mb-2">
                            <div class="progress-bar bg-success" role="progressbar" style="width: 30%"></div>
                        </div>
                        <p class="mb-0">$${reportData.dashboardData.budgetSuggestionData.wants.toFixed(2)}</p>
                    </div>
                </div>
                <div class="col-md-4">
                    <div class="budget-item">
                        <h6>Savings</h6>
                        <div class="progress mb-2">
                            <div class="progress-bar bg-info" role="progressbar" style="width: 20%"></div>
                        </div>
                        <p class="mb-0">$${reportData.dashboardData.budgetSuggestionData.savings.toFixed(2)}</p>
                    </div>
                </div>
            </div>
        </div>
        
        <div class="report-section">
            <h5 class="mb-3">Recent Transactions</h5>
            <div class="table-responsive">
                <table class="table">
                    <thead>
                        <tr>
                            <th>Category</th>
                            <th>Amount</th>
                            <th>Date</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${reportData.dashboardData.transaction.slice(0, 5).map(tx => `
                            <tr>
                                <td>${tx.category}</td>
                                <td>$${tx.amount.toFixed(2)}</td>
                                <td>${tx.date}</td>
                            </tr>
                        `).join('')}
                    </tbody>
                </table>
            </div>
        </div>
    `;
}

// Confirm share button handler
confirmShareBtn.addEventListener('click', async () => {
    if (!selectedUser) return;
    
    try {
        const response = await fetch('/api/share_report', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                recipientId: selectedUser.userID
            })
        });
        
        const data = await response.json();
        
        if (!response.ok || data.status === 'Failed') {
            throw new Error(data.message || 'Failed to share report');
        }
        
        sharePreviewModal.hide();
        showSuccessToast('Report shared successfully!');
        
    } catch (error) {
        console.error('Error sharing report:', error);
        showErrorModal('Failed to share report. Please try again.');
    }
});

// Show success toast
function showSuccessToast(message) {
    const toast = document.createElement('div');
    toast.className = 'toast position-fixed bottom-0 end-0 m-3';
    toast.setAttribute('role', 'alert');
    toast.setAttribute('aria-live', 'assertive');
    toast.setAttribute('aria-atomic', 'true');
    
    toast.innerHTML = `
        <div class="toast-header bg-success text-white">
            <i class="fas fa-check-circle me-2"></i>
            <strong class="me-auto">Success</strong>
            <button type="button" class="btn-close btn-close-white" data-bs-dismiss="toast" aria-label="Close"></button>
        </div>
        <div class="toast-body">
            ${message}
        </div>
    `;
    
    document.body.appendChild(toast);
    const bsToast = new bootstrap.Toast(toast);
    bsToast.show();
    
    toast.addEventListener('hidden.bs.toast', () => {
        document.body.removeChild(toast);
    });
}

// Show error modal
function showErrorModal(message) {
    const errorModal = new bootstrap.Modal(document.getElementById('errorModal'));
    document.getElementById('errorMessage').textContent = message;
    errorModal.show();
}

// Shared Reports Modal Functionality
const sharedReportsModal = new bootstrap.Modal(document.getElementById('sharedReportsModal'));
const reportDetailModal = new bootstrap.Modal(document.getElementById('reportDetailModal'));
const sharedReportsList = document.getElementById('sharedReportsList');
const sharedReportsLoading = document.getElementById('sharedReportsLoading');
const sharedReportsEmpty = document.getElementById('sharedReportsEmpty');
const reportDetailContent = document.getElementById('reportDetailContent');
const reportDetailLoading = document.getElementById('reportDetailLoading');
const refreshSharedReportsBtn = document.getElementById('refreshSharedReportsBtn');
const backToReportsBtn = document.getElementById('backToReportsBtn');

// Sidebar shared reports link click handler
document.addEventListener('DOMContentLoaded', function() {
    const sharedReportsLink = document.querySelector('a[href="/shared"]');
    if (sharedReportsLink) {
        sharedReportsLink.addEventListener('click', function(e) {
            e.preventDefault();
            openSharedReportsModal();
        });
    }
    
    // Refresh button handler
    if (refreshSharedReportsBtn) {
        refreshSharedReportsBtn.addEventListener('click', function() {
            loadSharedReports();
        });
    }
    
    // Back button handler
    if (backToReportsBtn) {
        backToReportsBtn.addEventListener('click', function() {
            reportDetailModal.hide();
            sharedReportsModal.show();
        });
    }
});

// Open shared reports modal
function openSharedReportsModal() {
    loadSharedReports();
    sharedReportsModal.show();
}

// Load shared reports
function loadSharedReports() {
    // Show loading state
    sharedReportsLoading.style.display = 'block';
    sharedReportsList.style.display = 'none';
    sharedReportsEmpty.style.display = 'none';
    
    // Fetch shared reports data
    fetch('/api/shared_reports')
        .then(response => response.json())
        .then(data => {
            // Hide loading state
            sharedReportsLoading.style.display = 'none';
            
            if (data.sharedReports && data.sharedReports.length > 0) {
                renderSharedReportsList(data.sharedReports);
            } else {
                sharedReportsEmpty.style.display = 'block';
            }
        })
        .catch(error => {
            console.error('Error loading shared reports:', error);
            sharedReportsLoading.style.display = 'none';
            sharedReportsEmpty.style.display = 'block';
        });
}

// Render shared reports list
function renderSharedReportsList(reports) {
    sharedReportsList.innerHTML = `
        <div class="table-responsive">
            <table class="table table-hover">
                <thead>
                    <tr>
                        <th>Sender</th>
                        <th>Date Shared</th>
                        <th class="text-center">Actions</th>
                    </tr>
                </thead>
                <tbody id="reportsTableBody">
                </tbody>
            </table>
        </div>
    `;
    
    const reportsTableBody = document.getElementById('reportsTableBody');
    
    reports.forEach(report => {
        const row = document.createElement('tr');
        row.innerHTML = `
            <td>
                <div class="d-flex align-items-center">
                    <div class="avatar-circle me-3">
                        <span class="initials">${report.senderFirstName[0]}${report.senderLastName[0]}</span>
                    </div>
                    <div>
                        <h6 class="mb-0">${report.senderFirstName} ${report.senderLastName}</h6>
                        <small class="text-muted">ID: ${report.senderID}</small>
                    </div>
                </div>
            </td>
            <td>
                <div>
                    <span>${report.sharedDate}</span>
                </div>
            </td>
            <td class="text-center">
                <button class="btn btn-primary btn-sm view-report-btn" data-sender-id="${report.senderID}">
                    <i class="fas fa-eye me-1"></i>View Report
                </button>
            </td>
        `;
        
        reportsTableBody.appendChild(row);
    });
    
    // Add event listeners to view report buttons
    const viewReportButtons = document.querySelectorAll('.view-report-btn');
    viewReportButtons.forEach(button => {
        button.addEventListener('click', function() {
            const senderId = this.getAttribute('data-sender-id');
            openReportDetailModal(senderId);
        });
    });
    
    sharedReportsList.style.display = 'block';
}

// Open report detail modal
function openReportDetailModal(senderId) {
    // Hide shared reports modal and show report detail modal
    sharedReportsModal.hide();
    reportDetailModal.show();
    
    // Show loading state
    reportDetailLoading.style.display = 'block';
    reportDetailContent.style.display = 'none';
    
    // Fetch report detail data
    fetch(`/api/shared_report/${senderId}`)
        .then(response => response.json())
        .then(data => {
            // Hide loading state
            reportDetailLoading.style.display = 'none';
            
            // Render report detail content
            renderReportDetail(data);
        })
        .catch(error => {
            console.error('Error loading report detail:', error);
            reportDetailLoading.style.display = 'none';
            reportDetailContent.innerHTML = `
                <div class="text-center py-5">
                    <div class="text-danger mb-3">
                        <i class="fas fa-exclamation-circle fa-3x"></i>
                    </div>
                    <h5 class="mb-2">Error Loading Report</h5>
                    <p class="text-muted mb-0">Could not load the report details. Please try again later.</p>
                </div>
            `;
            reportDetailContent.style.display = 'block';
        });
}

// Render report detail
function renderReportDetail(reportData) {
    const senderName = `${reportData.senderFirstName} ${reportData.senderLastName}`;
    document.getElementById('reportDetailModalLabel').textContent = `Report from ${senderName}`;
    
    // Dashboard data
    const dashboardData = reportData.dashboardData;
    const expenseData = reportData.expenseData;
    
    reportDetailContent.innerHTML = `
        <!-- Account Overview -->
        <div class="container-fluid px-4 py-3">
            <div class="row mb-4">
                <div class="col-12">
                    <h5 class="card-title mb-3">Account Overview</h5>
                    <div class="row g-3">
                        <div class="col-md-3">
                            <div class="stat-card p-3 rounded bg-light">
                                <h6 class="mb-1 text-muted">Current Balance</h6>
                                <h3 class="mb-0">$${dashboardData.accountData.balance}</h3>
                                <div class="mt-2">
                                    <span class="badge bg-${dashboardData.accountData.trendType === 'up' ? 'success' : 'danger'} me-2">
                                        <i class="fas fa-arrow-${dashboardData.accountData.trendType}"></i>
                                        ${dashboardData.accountData.percentageChange}%
                                    </span>
                                </div>
                            </div>
                        </div>
                        <div class="col-md-3">
                            <div class="stat-card p-3 rounded bg-light">
                                <h6 class="mb-1 text-muted">Monthly Income</h6>
                                <h3 class="mb-0">$${dashboardData.budgetSuggestionData.salary}</h3>
                                <div class="mt-2">
                                    <small class="text-muted">Last updated: ${dashboardData.budgetSuggestionData.salaryDate}</small>
                                </div>
                            </div>
                        </div>
                        <div class="col-md-3">
                            <div class="stat-card p-3 rounded bg-light">
                                <h6 class="mb-1 text-muted">Monthly Spending</h6>
                                <h3 class="mb-0">$${dashboardData.budgetSuggestionData.needs + dashboardData.budgetSuggestionData.wants}</h3>
                                <div class="mt-2">
                                    <small class="text-muted">Needs & Wants combined</small>
                                </div>
                            </div>
                        </div>
                        <div class="col-md-3">
                            <div class="stat-card p-3 rounded bg-light">
                                <h6 class="mb-1 text-muted">Monthly Savings</h6>
                                <h3 class="mb-0">$${dashboardData.budgetSuggestionData.savings}</h3>
                                <div class="mt-2">
                                    <small class="text-muted">20% of monthly income</small>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
            
            <!-- Budget & Goals -->
            <div class="row mb-4">
                <div class="col-md-7">
                    <h5 class="card-title mb-3">Budget Allocation</h5>
                    <div class="card p-3">
                        <div class="row">
                            <div class="col-md-5">
                                <div class="chart-container" style="position: relative; height: 200px;">
                                    <canvas id="modalBudgetChart"></canvas>
                                </div>
                            </div>
                            <div class="col-md-7">
                                <div class="budget-category needs mb-3">
                                    <div class="d-flex justify-content-between align-items-center">
                                        <h6 class="mb-0">Needs (50%)</h6>
                                        <span class="category-amount">$${dashboardData.budgetSuggestionData.needs}</span>
                                    </div>
                                    <div class="progress mt-1" style="height: 8px;">
                                        <div class="progress-bar bg-primary" role="progressbar" style="width: 50%"></div>
                                    </div>
                                </div>
                                <div class="budget-category wants mb-3">
                                    <div class="d-flex justify-content-between align-items-center">
                                        <h6 class="mb-0">Wants (30%)</h6>
                                        <span class="category-amount">$${dashboardData.budgetSuggestionData.wants}</span>
                                    </div>
                                    <div class="progress mt-1" style="height: 8px;">
                                        <div class="progress-bar bg-success" role="progressbar" style="width: 30%"></div>
                                    </div>
                                </div>
                                <div class="budget-category savings">
                                    <div class="d-flex justify-content-between align-items-center">
                                        <h6 class="mb-0">Savings (20%)</h6>
                                        <span class="category-amount">$${dashboardData.budgetSuggestionData.savings}</span>
                                    </div>
                                    <div class="progress mt-1" style="height: 8px;">
                                        <div class="progress-bar bg-info" role="progressbar" style="width: 20%"></div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
                <div class="col-md-5">
                    <h5 class="card-title mb-3">Financial Goals</h5>
                    <div class="card p-3">
                        <div id="goalsContainer">
                            ${renderGoals(dashboardData.goalData)}
                        </div>
                    </div>
                </div>
            </div>
            
            <!-- Monthly Spending & Transactions -->
            <div class="row mb-4">
                <div class="col-md-8">
                    <h5 class="card-title mb-3">Monthly Spending</h5>
                    <div class="card p-3">
                        <div class="chart-container" style="position: relative; height: 250px;">
                            <canvas id="modalMonthlySpendingChart"></canvas>
                        </div>
                    </div>
                </div>
                <div class="col-md-4">
                    <h5 class="card-title mb-3">Recent Transactions</h5>
                    <div class="card p-3">
                        ${renderTransactions(dashboardData.transaction)}
                    </div>
                </div>
            </div>
            
            <!-- Expense Categories -->
            <div class="row">
                <div class="col-12">
                    <h5 class="card-title mb-3">Expense Categories</h5>
                    <div class="card p-3">
                        <div class="row">
                            <div class="col-md-6">
                                <div class="chart-container" style="position: relative; height: 250px;">
                                    <canvas id="modalCategoryExpensesChart"></canvas>
                                </div>
                            </div>
                            <div class="col-md-6">
                                ${renderCategoryExpensesTable(expenseData.monthlyCategoryExpenses)}
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    `;
    
    reportDetailContent.style.display = 'block';
    
    // Initialize charts
    initModalCharts(reportData);
}

// Helper function to render goals
function renderGoals(goals) {
    if (!goals || goals.length === 0) {
        return `
            <div class="text-center py-4">
                <div class="empty-state-icon mb-2">
                    <i class="fas fa-bullseye fa-2x text-muted"></i>
                </div>
                <p class="text-muted mb-0">No financial goals set</p>
            </div>
        `;
    }
    
    return goals.map((goal, index) => `
        <div class="goal-item mb-3 pb-3 ${index < goals.length - 1 ? 'border-bottom' : ''}">
            <div class="d-flex justify-content-between align-items-center mb-2">
                <h6 class="mb-0">${goal.goalName}</h6>
                <span class="badge bg-primary">${goal.progressPercentage}%</span>
            </div>
            <div class="progress mb-2" style="height: 8px;">
                <div class="progress-bar bg-primary" role="progressbar" style="width: ${goal.progressPercentage}%" aria-valuenow="${goal.progressPercentage}" aria-valuemin="0" aria-valuemax="100"></div>
            </div>
            <div class="d-flex justify-content-between">
                <small class="text-muted">Target: $${goal.target}</small>
                <small class="text-muted">Saved: $${goal.saved}</small>
                <small class="text-muted">Remaining: $${goal.remaining}</small>
            </div>
        </div>
    `).join('');
}

// Helper function to render transactions
function renderTransactions(transactions) {
    if (!transactions || transactions.length === 0) {
        return `
            <div class="text-center py-4">
                <div class="empty-state-icon mb-2">
                    <i class="fas fa-exchange-alt fa-2x text-muted"></i>
                </div>
                <p class="text-muted mb-0">No transactions recorded</p>
            </div>
        `;
    }
    
    let html = '<div class="transaction-list" style="max-height: 250px; overflow-y: auto;">';
    
    transactions.forEach(tx => {
        let icon = 'money-bill-wave';
        if (tx.category === 'Grocery') icon = 'shopping-cart';
        else if (tx.category === 'Fuel') icon = 'gas-pump';
        else if (tx.category === 'Food') icon = 'utensils';
        else if (tx.category === 'Bills') icon = 'file-invoice-dollar';
        
        html += `
            <div class="d-flex justify-content-between align-items-center mb-2 border-bottom pb-2">
                <div class="me-2">
                    <i class="fas fa-${icon} me-2 text-secondary"></i>
                    <span>${tx.category}</span>
                </div>
                <div class="text-end">
                    <span class="fw-bold text-danger">-$${tx.amount}</span>
                    <small class="d-block text-muted">${tx.date}</small>
                </div>
            </div>
        `;
    });
    
    html += '</div>';
    return html;
}

// Helper function to render category expenses table
function renderCategoryExpensesTable(categoryExpenses) {
    if (!categoryExpenses) {
        return `
            <div class="text-center py-4">
                <div class="empty-state-icon mb-2">
                    <i class="fas fa-chart-pie fa-2x text-muted"></i>
                </div>
                <p class="text-muted mb-0">No expense category data available</p>
            </div>
        `;
    }
    
    // Calculate total expenses
    let total = 0;
    Object.values(categoryExpenses).forEach(amount => {
        total += amount;
    });
    
    let html = `
        <div class="table-responsive">
            <table class="table table-bordered">
                <thead>
                    <tr>
                        <th>Category</th>
                        <th>Amount</th>
                        <th>Percentage</th>
                    </tr>
                </thead>
                <tbody>
    `;
    
    Object.entries(categoryExpenses).forEach(([category, amount]) => {
        const percentage = ((amount / total) * 100).toFixed(1);
        html += `
            <tr>
                <td>${category}</td>
                <td>$${amount}</td>
                <td>${percentage}%</td>
            </tr>
        `;
    });
    
    html += `
                </tbody>
            </table>
        </div>
    `;
    
    return html;
}

// Initialize modal charts
function initModalCharts(reportData) {
    // Budget chart
    const budgetCtx = document.getElementById('modalBudgetChart').getContext('2d');
    const budgetData = [
        reportData.dashboardData.budgetSuggestionData.needs,
        reportData.dashboardData.budgetSuggestionData.wants,
        reportData.dashboardData.budgetSuggestionData.savings
    ];
    
    new Chart(budgetCtx, {
        type: 'doughnut',
        data: {
            labels: ['Needs', 'Wants', 'Savings'],
            datasets: [{
                data: budgetData,
                backgroundColor: [
                    '#6c5ce7',  // Needs - Purple
                    '#00cec9',  // Wants - Teal
                    '#0984e3'   // Savings - Blue
                ],
                borderWidth: 0
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    position: 'bottom'
                },
                tooltip: {
                    callbacks: {
                        label: function(context) {
                            const label = context.label || '';
                            const value = context.raw;
                            const total = context.dataset.data.reduce((a, b) => a + b, 0);
                            const percentage = Math.round((value / total) * 100);
                            return `${label}: $${value} (${percentage}%)`;
                        }
                    }
                }
            },
            cutout: '70%'
        }
    });
    
    // Monthly spending chart
    const monthlyCtx = document.getElementById('modalMonthlySpendingChart').getContext('2d');
    const monthlyLabels = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
    const monthlyExpenses = reportData.dashboardData.monthlySpendData.Expenses;
    
    // Filter out months with zero expenses
    const filteredExpenses = [];
    const filteredLabels = [];
    monthlyExpenses.forEach((expense, index) => {
        if (expense > 0) {
            filteredExpenses.push(expense);
            filteredLabels.push(monthlyLabels[index]);
        }
    });
    
    // Create gradient for bars
    const gradient = monthlyCtx.createLinearGradient(0, 0, 0, 250);
    gradient.addColorStop(0, '#6c5ce7');
    gradient.addColorStop(1, '#8e7cf3');
    
    new Chart(monthlyCtx, {
        type: 'bar',
        data: {
            labels: filteredLabels,
            datasets: [{
                label: 'Monthly Spending',
                data: filteredExpenses,
                backgroundColor: gradient,
                borderRadius: 8,
                borderWidth: 0
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    display: false
                },
                tooltip: {
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
                    ticks: {
                        callback: function(value) {
                            return '$' + value;
                        }
                    }
                }
            }
        }
    });
    
    // Category expenses chart
    if (reportData.expenseData.monthlyCategoryExpenses) {
        const categoryCtx = document.getElementById('modalCategoryExpensesChart').getContext('2d');
        const categoryLabels = Object.keys(reportData.expenseData.monthlyCategoryExpenses);
        const categoryAmounts = Object.values(reportData.expenseData.monthlyCategoryExpenses);
        
        // Define chart colors
        const chartColors = [
            '#6c5ce7',  // Primary - Purple
            '#00cec9',  // Teal
            '#0984e3',  // Blue
            '#00b894',  // Green
            '#fdcb6e',  // Yellow
            '#e17055',  // Orange
            '#d63031'   // Red
        ];
        
        new Chart(categoryCtx, {
            type: 'pie',
            data: {
                labels: categoryLabels,
                datasets: [{
                    data: categoryAmounts,
                    backgroundColor: chartColors,
                    borderWidth: 0
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        position: 'right'
                    },
                    tooltip: {
                        callbacks: {
                            label: function(context) {
                                const label = context.label || '';
                                const value = context.raw;
                                const total = context.dataset.data.reduce((a, b) => a + b, 0);
                                const percentage = Math.round((value / total) * 100);
                                return `${label}: $${value} (${percentage}%)`;
                            }
                        }
                    }
                }
            }
        });
    }
}