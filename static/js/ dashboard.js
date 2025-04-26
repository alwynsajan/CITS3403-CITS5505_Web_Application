/**
 * Smart Budget Dashboard JavaScript
 * This file handles all interactive elements of the dashboard
 */

// Store any data passed from backend
let monthlyLabels = [];
let monthlyExpenses = [];
let goalData = [];

// DOM ready handler
document.addEventListener('DOMContentLoaded', function() {
    console.log('Dashboard JS loaded');
    
    // Initialize components
    initMonthlySpendingChart();
    initGoalProgress();
    setupEventListeners();
});

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
            window.location.href = '/dashboard/export/csv';
        });
    }
    
    const exportPDFBtn = document.getElementById('exportPDF');
    if (exportPDFBtn) {
        exportPDFBtn.addEventListener('click', function() {
            window.location.href = '/dashboard/export/pdf';
        });
    }
}

/**
 * Initialize the monthly spending chart
 */
function initMonthlySpendingChart() {
    // Find the canvas element
    const chartCanvas = document.getElementById('monthlySpendingChart');
    if (!chartCanvas) {
        console.error('Monthly spending chart canvas not found');
        return;
    }
    
    console.log('Initializing monthly spending chart with data:', { 
        labels: monthlyLabels, 
        expenses: monthlyExpenses 
    });
    
    // Use sample data if no data is provided
    if (!monthlyLabels || !monthlyLabels.length || !monthlyExpenses || !monthlyExpenses.length) {
        console.warn('No monthly spending data available, using sample data');
        monthlyLabels = ["Jan", "Feb", "Mar", "Apr", "May", "Jun"];
        monthlyExpenses = [550, 610, 480, 700, 520, 590];
    }
    
    // Get the 2D context from the canvas
    const ctx = chartCanvas.getContext('2d');
    
    try {
        // Create a new chart with Chart.js
        new Chart(ctx, {
            type: 'bar',
            data: {
                labels: monthlyLabels,
                datasets: [{
                    label: 'Monthly Spending',
                    data: monthlyExpenses,
                    backgroundColor: [
                        '#5FBDBD', '#7367F0', '#5FBDBD', 
                        '#FF9F43', '#5FBDBD', '#28C76F'
                    ],
                    borderRadius: 5
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
                                return `Monthly Spending: $${context.raw}`;
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
        console.log('Chart initialized successfully');
    } catch (error) {
        console.error('Error initializing chart:', error);
    }
}

/**
 * Initialize goal progress visualization(s)
 */
function initGoalProgress() {
    // Visualization for multiple goals
    if (Array.isArray(goalData) && goalData.length > 0) {
        console.log('Multiple goals found:', goalData.length);
        renderMultipleGoals(goalData);
    }
    
    // For individual goal progress circles
    const progressCircles = document.querySelectorAll('.progress-circle');
    console.log('Found progress circles:', progressCircles.length);
    
    progressCircles.forEach(function(circle) {
        updateGoalProgressCircle(circle);
    });
}

/**
 * Update a specific goal progress circle
 * @param {HTMLElement} circleElement - The progress circle element
 */
function updateGoalProgressCircle(circleElement) {
    if (!circleElement) return;
    
    const inner = circleElement.querySelector('.progress-circle-inner');
    if (!inner) return;
    
    const percentageElem = inner.querySelector('.progress-percentage');
    if (!percentageElem) return;
    
    const percentage = parseFloat(percentageElem.textContent);
    if (isNaN(percentage)) return;
    
    console.log('Updating goal progress circle with percentage:', percentage);
    
    // Define color based on progress
    let color;
    if (percentage <= 25) {
        color = '#EA5455'; // Red for low progress
    } else if (percentage <= 75) {
        color = '#FF9F43'; // Orange for medium progress
    } else {
        color = '#28C76F'; // Green for high progress
    }
    
    // Apply styles to visualize progress
    inner.style.borderTop = `10px solid ${color}`;
    if (percentage > 25) inner.style.borderRight = `10px solid ${color}`;
    if (percentage > 50) inner.style.borderBottom = `10px solid ${color}`;
    if (percentage > 75) inner.style.borderLeft = `10px solid ${color}`;
}

/**
 * Save a new goal using AJAX
 */
function saveNewGoal() {
    const form = document.getElementById('goalForm');
    
    // Basic validation
    if (!form.checkValidity()) {
        form.reportValidity();
        return;
    }
    
    // Get form data
    const formData = new FormData(form);
    const goalData = {
        goalName: formData.get('goalName'),
        targetAmount: parseFloat(formData.get('targetAmount')),
        timeDuration: parseInt(formData.get('timeDuration')),
        allocation: parseInt(formData.get('allocation'))
    };
    
    console.log('Submitting goal data:', goalData);
    
    // Submit with fetch API
    fetch('/dashboard/addGoal', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify(goalData)
    })
    .then(response => response.json())
    .then(data => {
        console.log('Response:', data);
        if (data.status === 'success') {
            // If we got multiple goals back
            if (Array.isArray(data.data)) {
                renderMultipleGoals(data.data);
                
                // Also update the first goal card if it exists
                if (data.data.length > 0) {
                    updateSingleGoalUI(data.data[0]);
                }
            } 
            // If we got a single goal back
            else {
                updateSingleGoalUI(data.data);
            }
            
            // Close modal and reset form
            const goalModal = bootstrap.Modal.getInstance(document.getElementById('goalModal'));
            goalModal.hide();
            form.reset();
        } else {
            alert(data.message || 'Failed to save goal');
        }
    })
    .catch(error => {
        console.error('Error:', error);
        alert('An error occurred while saving the goal.');
    });
}

/**
 * Update the UI for a single goal
 * @param {Object} goalData - The goal data
 */
function updateSingleGoalUI(goalData) {
    const goalCard = document.querySelector('.goal-card');
    if (!goalCard) return;
    
    console.log('Updating single goal UI with data:', goalData);
    
    // Create new content
    const newContent = `
        <div class="card-body">
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
                    <p><strong>Target:</strong> $${goalData.target}</p>
                    <p><strong>Saved:</strong> $${goalData.saved}</p>
                    <p><strong>Remaining:</strong> $${goalData.remaining}</p>
                    ${goalData.message ? `<p><small>${goalData.message}</small></p>` : ''}
                </div>
            </div>
        </div>
    `;
    
    // Update card content
    goalCard.innerHTML = newContent;
    
    // Update progress visualization
    const circle = goalCard.querySelector('.progress-circle');
    updateGoalProgressCircle(circle);
}

/**
 * Render multiple goals in the UI
 * @param {Array} goals - Array of goal data objects
 */
function renderMultipleGoals(goals) {
    const goalsContainer = document.getElementById('goalsContainer');
    if (!goalsContainer) return;
    
    console.log('Rendering multiple goals:', goals.length);
    
    // Clear existing content
    goalsContainer.innerHTML = '';
    
    // Create header
    const header = document.createElement('h2');
    header.className = 'mb-4';
    header.textContent = 'Your Financial Goals';
    goalsContainer.appendChild(header);
    
    // Create goals list
    if (goals.length === 0) {
        const placeholder = document.createElement('p');
        placeholder.className = 'text-muted text-center py-4';
        placeholder.textContent = 'No goals set yet. Create your first financial goal!';
        goalsContainer.appendChild(placeholder);
    } else {
        const row = document.createElement('div');
        row.className = 'row goals-row';
        
        // Add each goal
        goals.forEach(function(goal) {
            const goalCol = document.createElement('div');
            goalCol.className = 'col-md-6 mb-3';
            
            goalCol.innerHTML = `
                <div class="card h-100">
                    <div class="card-body">
                        <h5 class="card-title">${goal.goalName}</h5>
                        <div class="d-flex align-items-center mb-2">
                            <div class="progress flex-grow-1 me-2" style="height: 10px;">
                                <div class="progress-bar" role="progressbar" 
                                     style="width: ${goal.progressPercentage}%;" 
                                     aria-valuenow="${goal.progressPercentage}" 
                                     aria-valuemin="0" aria-valuemax="100"></div>
                            </div>
                            <span class="text-muted small">${goal.progressPercentage}%</span>
                        </div>
                        <div class="goal-details small">
                            <div class="row">
                                <div class="col-6"><strong>Target:</strong> $${goal.target}</div>
                                <div class="col-6"><strong>Saved:</strong> $${goal.saved}</div>
                            </div>
                            <div class="row mt-1">
                                <div class="col-12"><strong>Remaining:</strong> $${goal.remaining}</div>
                            </div>
                            ${goal.message ? `<div class="alert alert-info mt-2 p-2 small">${goal.message}</div>` : ''}
                        </div>
                    </div>
                </div>
            `;
            
            row.appendChild(goalCol);
        });
        
        goalsContainer.appendChild(row);
    }
}

/**
 * Generate a random color for charts
 * @returns {string} A hex color code
 */
function getRandomColor() {
    const colors = [
        '#5FBDBD', // Primary
        '#45A29E', // Secondary
        '#7367F0', // Purple
        '#FF9F43', // Orange
        '#28C76F', // Green
        '#EA5455'  // Red
    ];
    
    return colors[Math.floor(Math.random() * colors.length)];
}