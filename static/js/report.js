let pieChartInstance = null;
let currentMonthIndex = 0;
let monthKeys = [];


function drawExpenseAndSalaryGraph(){
  
    // Salary vs Expenses
    const barChartEl = document.getElementById('barChart');
    const salaryData = window.expenseData.expenseAndSalary?.salaryData ?? Array(12).fill(0);
    const expenseData = window.expenseData.expenseAndSalary?.expenseData ?? Array(12).fill(0);

    barChartInstance = new Chart(barChartEl, {
        type: 'bar',
        data: {
            labels: ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"],
            datasets: [
                {
                    label: 'Salary',
                    data: salaryData,
                    backgroundColor: '#6c5ce7',
                    borderRadius: { topLeft: 10, topRight: 10 },
                    barThickness: 20
                },
                {
                    label: 'Expenses',
                    data: expenseData,
                    backgroundColor: '#00cec9',
                    borderRadius: { topLeft: 10, topRight: 10 },
                    barThickness: 20
                }
            ]
        },
        options: {
            responsive: true,
            aspectRatio: 4, 
            maintainAspectRatio: false,
            plugins: {
                legend: { position: 'top' },
                tooltip: {
                    mode: 'index',
                    intersect: false,
                    callbacks: {
                        label: function(context) {
                            return `${context.dataset.label}: $${context.raw.toFixed(2)}`;
                        }
                    }
                }
            },
            interaction: { mode: 'index', intersect: false },
            scales: {
                x: {
                    stacked: false,
                    grid: { display: false }
                },
                y: {
                    beginAtZero: true,
                    stacked: false,
                    grid: { color: '#f1f1f1' }
                }
            }
        }
    });
}


  function drawMonthlySpendingChart() {
    const ctx = document.getElementById('monthlySpendingChart');
    if (!ctx) return;
    
    const monthlyData = window.dashboardData.monthlySpendData || Array(12).fill(0);
    
    window.monthlySpendingChart = new Chart(ctx, {
        type: 'bar',
        data: {
            labels: ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"],
            datasets: [{
                label: 'Monthly Spending',
                data: monthlyData,
                backgroundColor: '#6c5ce7',
                borderRadius: { topLeft: 10, topRight: 10 },
                barThickness: 20,
                categoryPercentage: 0.8, 
                barPercentage: 0.9   
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            layout: {
                padding: {
                    left: 20,
                    right: 20,
                    top: 20,
                    bottom: 20
                }
            },
            plugins: {
                legend: { display: false },
                tooltip: {
                    callbacks: {
                        label: function(context) {
                            return `${context.label}: $${context.raw.toFixed(2)}`;
                        }
                    }
                }
            },
            scales: {
                x: {
                    grid: { 
                        display: false,
                        drawBorder: false
                    },
                    ticks: {
                        padding: 10 // Space between axis and labels
                    },
                    offset: true // Adds padding on both ends
                },
                y: {
                    beginAtZero: true,
                    grid: { 
                        color: '#f1f1f1',
                        drawBorder: false
                    },
                    ticks: {
                        padding: 10
                    }
                }
            },
            interaction: {
                intersect: false,
                mode: 'index'
            }
        }
    });
}

function drawWeeklyExpenseGraph() {
    const lineChartEl = document.getElementById('lineChart');
    lineChartInstance = new Chart(lineChartEl, {
        type: "line",
        data: {
            labels: Object.keys(window.expenseData.weeklyExpense),
            datasets: [{
                label: "Weekly Spending",
                data: Object.values(window.expenseData.weeklyExpense),
                borderColor: "#6932dd",
                fill: true,
                tension: 0.4,
                pointBackgroundColor: "#fff",
                pointBorderColor: "#6932dd",
                pointRadius: 5
            }]
        },
        options: {
            responsive: true,
            aspectRatio: 3,
            plugins: {
                legend: { display: false },
                tooltip: {
                    callbacks: {
                        label: function(context) {
                            return `Spending: $${context.raw.toFixed(2)}`;
                        }
                    }
                }
            },
            scales: {
                y: { display: false },
                x: { display: false }
            }
        }
    });
}


function drawCategoryPieChart(index) {
    const prevBtn = document.getElementById('prevMonth');
    const nextBtn = document.getElementById('nextMonth');
    console.log("In drawCategoryPieChart");

    const monthlyExpenses = window.expenseData.monthlyCategoryExpenses;
    monthKeys = Object.keys(monthlyExpenses);
    monthKeys.sort((a, b) => new Date(`1 ${b} 2020`) - new Date(`1 ${a} 2020`));

    if (monthKeys.length > 1) {
        prevBtn.style.display = 'inline-block';
        nextBtn.style.display = 'inline-block';
        console.log("In drawCategoryPieChart");
    } else {
        prevBtn.style.display = 'none';
        nextBtn.style.display = 'none';
    }

    const month = monthKeys[index];
    const data = monthlyExpenses[month];

    const categories = Object.keys(data).filter(k => k !== 'total');
    const values = categories.map(cat => data[cat]);

    const ctx = document.getElementById('pieChart');

    if (pieChartInstance) {
        pieChartInstance.destroy();
    }

    pieChartInstance = new Chart(ctx, {
        type: 'pie',
        data: {
            labels: categories,
            datasets: [{
                data: values,
                backgroundColor: ['#6c5ce7', '#00cec9', '#fd79a8', '#fab1a0', '#ffeaa7']
            }]
        },
        options: {
            responsive: true,
            plugins: {
                title: {
                    display: true,
                    text: `Category Breakdown - ${month}`
                },
                legend: {
                    display: false 
                },
                tooltip: {
                    callbacks: {
                        label: function(context) {
                            const label = context.label || '';
                            const value = context.raw;
                            return `${label}: $${value.toFixed(2)}`;
                        }
                    }
                }
            }
        }
    });
}

function drawMonthlyBalanceTrend() {
    const salaryData = window.expenseData.expenseAndSalary.salaryData;
    const expenseData = window.expenseData.expenseAndSalary.expenseData;

    const allMonthLabels = [
        'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
        'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'
    ];

    // Get current month (0-based: Jan = 0)
    const currentMonth = new Date().getMonth() + 1;

    const monthLabels = allMonthLabels.slice(0, currentMonth);
    const slicedSalaryData = salaryData.slice(0, currentMonth);
    const slicedExpenseData = expenseData.slice(0, currentMonth);

    // Monthly balance: salary - expense (only if salary exists)
    const monthlyBalance = slicedSalaryData.map((salary, index) => {
        const expense = slicedExpenseData[index] || 0;
        return salary === 0 ? 0 : (salary - expense);
    });

    // Cumulative net savings: sum of (salary - expense) if salary > 0
    const cumulativeNet = [];
    let total = 0;
    for (let i = 0; i < slicedSalaryData.length; i++) {
        let net = 0;
        if (slicedSalaryData[i] > 0) {
            net = slicedSalaryData[i] - (slicedExpenseData[i] || 0);
        }
        total += net;
        cumulativeNet.push(total);
    }

    const balanceChartEl = document.getElementById('monthlyBalanceChart');
    new Chart(balanceChartEl, {
        type: 'line',
        data: {
            labels: monthLabels,
            datasets: [
                {
                    label: 'Monthly Balance',
                    data: monthlyBalance,
                    borderColor: '#28a745',
                    backgroundColor: 'rgba(40, 167, 69, 0.1)',
                    fill: true,
                    tension: 0.4,
                    pointBackgroundColor: '#fff',
                    pointBorderColor: '#28a745',
                    pointRadius: 5
                },
                {
                    label: 'Cumulative Net Balance',
                    data: cumulativeNet,
                    borderColor: '#007bff',
                    backgroundColor: 'rgba(0, 123, 255, 0.1)',
                    fill: false,
                    tension: 0.4,
                    pointBackgroundColor: '#fff',
                    pointBorderColor: '#007bff',
                    pointRadius: 5
                }
            ]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            aspectRatio: 3,
            plugins: {
                tooltip: {
                    callbacks: {
                        label: function(context) {
                            return `${context.dataset.label}: $${context.raw.toFixed(2)}`;
                        }
                    }
                }
            },
            scales: {
                y: { display: false },
                x: { display: true }
            }
        }
    });
}


function handlePrevMonth() {
    if (currentMonthIndex < monthKeys.length - 1) {
      currentMonthIndex = currentMonthIndex+1 ;
  }
  else{
      currentMonthIndex = 0 ;
  }
  drawCategoryPieChart(currentMonthIndex);
  }
  
  function handleNextMonth() {
    if (currentMonthIndex > 0) {
      currentMonthIndex--;
  }
  else{
      currentMonthIndex = monthKeys.length - 1 ;
  }
  drawCategoryPieChart(currentMonthIndex);
  }

document.addEventListener('DOMContentLoaded', () => {
    drawExpenseAndSalaryGraph();
    drawWeeklyExpenseGraph();
    drawCategoryPieChart(currentMonthIndex);
    document.getElementById('prevMonth').addEventListener('click', handlePrevMonth);
    document.getElementById('nextMonth').addEventListener('click', handleNextMonth);
    drawMonthlySpendingChart();
    drawMonthlyBalanceTrend();
  });