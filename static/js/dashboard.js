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

    // Check if there is expense data
    if (!window.monthlyExpenses || !window.monthlyExpenses.length) {
        // If there is no data, show placeholder
        const chartContainer = chartCanvas.parentElement;
        chartContainer.innerHTML = `
            <div class="text-center py-4">
                <i class="fas fa-chart-line fa-3x text-muted mb-3"></i>
                <p class="text-muted">No expense data available yet</p>
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
        
        // Prepare bar chart colors
        const backgroundColors = window.monthlyLabels.map((_, i) => createGradient(ctx, i));
        
        // Create chart
        new Chart(ctx, {
            type: 'bar',
            data: {
                labels: window.monthlyLabels,
                datasets: [{
                    label: 'Monthly Spending',
                    data: window.monthlyExpenses,
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
        
        console.log('Chart initialized successfully');
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
 * Update a specific goal progress circle with animation
 * @param {HTMLElement} circleElement - The progress circle element
 * @param {boolean} animate - Whether to animate the update
 */
function updateGoalProgressCircle(circleElement, animate = false) {
    if (!circleElement) return;
    
    const inner = circleElement.querySelector('.progress-circle-inner');
    if (!inner) return;
    
    const percentageElem = inner.querySelector('.progress-percentage');
    if (!percentageElem) return;
    
    const percentage = parseFloat(percentageElem.textContent);
    if (isNaN(percentage)) return;
    
    console.log('Updating goal progress circle with percentage:', percentage);
    
    // Reset all borders
    inner.style.borderTop = '14px solid #eee';
    inner.style.borderRight = '14px solid #eee';
    inner.style.borderBottom = '14px solid #eee';
    inner.style.borderLeft = '14px solid #eee';
    
    // If percentage is 0, keep all borders gray
    if (percentage === 0) {
        return;
    }
    
    // Define color based on progress
    let color;
    if (percentage <= 25) {
        color = getComputedStyle(document.documentElement).getPropertyValue('--chart-color-2').trim(); // Bright Teal
    } else if (percentage <= 75) {
        color = getComputedStyle(document.documentElement).getPropertyValue('--chart-color-3').trim(); // Bright Blue
    } else {
        color = getComputedStyle(document.documentElement).getPropertyValue('--chart-color-1').trim(); // Bright Purple
    }
    
    if (animate) {
        // Apply styles with animation delays
        setTimeout(() => {
            inner.style.borderTop = `14px solid ${color}`;
            if (percentage > 25) {
                setTimeout(() => {
                    inner.style.borderRight = `14px solid ${color}`;
                    if (percentage > 50) {
                        setTimeout(() => {
                            inner.style.borderBottom = `14px solid ${color}`;
                            if (percentage > 75) {
                                setTimeout(() => {
                                    inner.style.borderLeft = `14px solid ${color}`;
                                }, 150);
                            }
                        }, 150);
                    }
                }, 150);
            }
        }, 150);
    } else {
        // Apply styles without animation
        inner.style.borderTop = `14px solid ${color}`;
        if (percentage > 25) inner.style.borderRight = `14px solid ${color}`;
        if (percentage > 50) inner.style.borderBottom = `14px solid ${color}`;
        if (percentage > 75) inner.style.borderLeft = `14px solid ${color}`;
    }
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
 * Save a new goal using AJAX with modern animation feedback
 */
async function saveNewGoal(event) {
    event.preventDefault();
    
    const form = document.getElementById('goalForm');
    if (!form) {
        console.error('Form element not found');
        return;
    }
    
    const saveButton = document.getElementById('saveGoalBtn');
    if (!saveButton) {
        console.error('Save button not found');
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
        
        // Get and process form data
        const goalNameInput = form.querySelector('[name="goalName"]');
        if (!goalNameInput) {
            throw new Error('Goal name input not found');
        }
        
        const goalName = goalNameInput.value.trim();
        if (!goalName) {
            throw new Error('Goal name cannot be empty');
        }
        
        const goalData = {
            goalName: goalName,
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
        
        const data = await response.json();
        
        if (!response.ok) {
            throw new Error(data.message || 'Failed to save goal');
        }
        
        // Update UI
        updateGoalsUI(data.data);
        
        // Close modal
        const modal = bootstrap.Modal.getInstance(document.getElementById('goalModal'));
        if (modal) {
            modal.hide();
        }
        
        // Reset form
        form.reset();
        
        // Show success message
        showAlert('Goal added successfully!', 'success');
        
    } catch (error) {
        console.error('Error saving goal:', error);
        showAlert(error.message || 'An error occurred while saving the goal. Please try again.', 'danger');
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

// Handle salary addition
document.addEventListener('DOMContentLoaded', function() {
    const addSalaryBtn = document.querySelector('.add-salary-btn');
    const salaryModal = new bootstrap.Modal(document.getElementById('salaryModal'));
    const saveSalaryBtn = document.getElementById('saveSalaryBtn');
    const salaryForm = document.getElementById('salaryForm');

    if (addSalaryBtn) {
        addSalaryBtn.addEventListener('click', function() {
            salaryModal.show();
        });
    }

    if (saveSalaryBtn) {
        saveSalaryBtn.addEventListener('click', async function() {
            if (!salaryForm.checkValidity()) {
                salaryForm.reportValidity();
                return;
            }

            const salaryAmount = document.getElementById('salaryAmount').value;
            const salaryDate = document.getElementById('salaryDate').value;

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

                if (response.ok) {
                    // Update the account balance display
                    const balanceDisplay = document.getElementById('balanceAmount');
                    if (balanceDisplay) {
                        // Use CountUp animation to refresh balance
                        const newBalance = result.new_balance || 0;
                        new CountUp('balanceAmount', newBalance, {
                            prefix: '$',
                            duration: 2,
                            decimalPlaces: 2
                        }).start();
                    }
                    // Update budget suggestions (use backend data)
                    if (result.budgetSuggestions) {
                        const needsAmount = document.getElementById('needsAmount');
                        const wantsAmount = document.getElementById('wantsAmount');
                        const savingsAmount = document.getElementById('savingsAmount');
                        const salaryInfo = document.getElementById('salaryInfo');
                        if (needsAmount) needsAmount.textContent = `$${result.budgetSuggestions.needs.toFixed(2)}`;
                        if (wantsAmount) wantsAmount.textContent = `$${result.budgetSuggestions.wants.toFixed(2)}`;
                        if (savingsAmount) savingsAmount.textContent = `$${result.budgetSuggestions.savings.toFixed(2)}`;
                        if (salaryInfo) salaryInfo.textContent = `Based on monthly salary: $${result.budgetSuggestions.salary.toFixed(2)} (${result.budgetSuggestions.salaryDate})`;
                    }
                    // Hide the modal
                    salaryModal.hide();

                    // Reset the form only after modal is fully hidden
                    const salaryModalEl = document.getElementById('salaryModal');
                    salaryModalEl.addEventListener('hidden.bs.modal', function handler() {
                        salaryForm.reset();
                        // Remove this event listener after it runs once
                        salaryModalEl.removeEventListener('hidden.bs.modal', handler);
                    });
                } else {
                    throw new Error(result.error || 'Failed to add salary');
                }
            } catch (error) {
                console.error('Error:', error);
                showAlert(error.message || 'Failed to add salary. Please try again.', 'danger');
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

// Theme switch
const themeToggle = document.querySelector('.theme-toggle');
if (themeToggle) {
    themeToggle.addEventListener('click', function() {
        document.body.classList.toggle('dark-theme');
        localStorage.setItem('theme', document.body.classList.contains('dark-theme') ? 'dark' : 'light');
    });
}

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