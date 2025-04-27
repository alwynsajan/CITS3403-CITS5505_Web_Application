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
    // Goal selector dropdown
    const goalSelector = document.getElementById('goalSelector');
    if (goalSelector) {
        goalSelector.addEventListener('change', function() {
            const selectedIndex = parseInt(this.value);
            updateGoalDisplay(selectedIndex);
        });
    }
    
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
 * Updates the goal display based on the selected goal index
 * @param {number} index - The index of the selected goal in the goalData array
 */
function updateGoalDisplay(index) {
    // Ensure we have valid data
    if (!Array.isArray(goalData) || !goalData[index]) {
        console.error('Invalid goal data or index');
        return;
    }
    
    const selectedGoal = goalData[index];
    console.log('Updating goal display with selected goal:', selectedGoal);
    
    // Update percentage and label in progress circle
    const percentageElement = document.querySelector('.progress-percentage');
    const labelElement = document.querySelector('.progress-label');
    
    if (percentageElement) percentageElement.textContent = `${selectedGoal.progressPercentage}%`;
    if (labelElement) labelElement.textContent = selectedGoal.goalName;
    
    // Update goal details
    document.getElementById('goalTarget').textContent = selectedGoal.target;
    document.getElementById('goalSaved').textContent = selectedGoal.saved;
    document.getElementById('goalRemaining').textContent = selectedGoal.remaining;
    
    // Update message if exists
    const messageElement = document.getElementById('goalMessage');
    if (messageElement && selectedGoal.message) {
        messageElement.textContent = selectedGoal.message;
    }
    
    // Update progress circle visualization
    const circleElement = document.querySelector('.progress-circle');
    updateGoalProgressCircle(circleElement, selectedGoal.progressPercentage);
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
    // If we have multiple goals, ensure the first one is displayed
    if (Array.isArray(goalData) && goalData.length > 0) {
        console.log('Multiple goals found:', goalData.length);
        
        // Initialize with the first goal
        if (document.getElementById('goalSelector')) {
            updateGoalDisplay(0);
        }
    }
    
    // For individual goal progress circles
    const progressCircles = document.querySelectorAll('.progress-circle');
    console.log('Found progress circles:', progressCircles.length);
    
    progressCircles.forEach(function(circle) {
        // Get percentage from the DOM if not passed
        const percentageElem = circle.querySelector('.progress-percentage');
        if (percentageElem) {
            const percentage = parseFloat(percentageElem.textContent);
            updateGoalProgressCircle(circle, percentage);
        }
    });
}

/**
 * Update a specific goal progress circle
 * @param {HTMLElement} circleElement - The progress circle element
 * @param {number} percentage - The goal progress percentage
 */
function updateGoalProgressCircle(circleElement, percentage) {
    if (!circleElement) return;
    
    const inner = circleElement.querySelector('.progress-circle-inner');
    if (!inner) return;
    
    if (isNaN(percentage)) {
        // Try to get percentage from the DOM
        const percentageElem = inner.querySelector('.progress-percentage');
        if (!percentageElem) return;
        
        percentage = parseFloat(percentageElem.textContent);
        if (isNaN(percentage)) return;
    }
    
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
    
    // Reset borders first
    inner.style.border = '10px solid #eee';
    
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
            // Update global goalData
            if (Array.isArray(data.data)) {
                window.goalData = data.data;
                
                // Update the goal selector dropdown
                const selector = document.getElementById('goalSelector');
                if (selector) {
                    // Add new option
                    const newIndex = window.goalData.length - 1;
                    const option = document.createElement('option');
                    option.value = newIndex;
                    option.textContent = window.goalData[newIndex].goalName;
                    selector.appendChild(option);
                    
                    // Select the new goal
                    selector.value = newIndex;
                    updateGoalDisplay(newIndex);
                } else {
                    // If no selector exists yet, we may need to reload to show it
                    location.reload();
                }
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