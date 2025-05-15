// static/js/expense.js

let pieChart, barChart, lineChart;
let barChartInstance = null;
let pieChartInstance = null;
let lineChartInstance = null;
let monthKeys = [];
let currentMonthIndex = 0;


/**
 * Draws the salary vs expenses bar chart
 * Compares monthly salary and expenses data in a bar chart format
 * Shows empty state if no data exists
 */
function drawExpenseAndSalaryGraph() {
  const hasExpenses = window.expenseData.hasExpenses;
  const hasSalary = window.expenseData.hasSalary;

  // Salary vs Expenses
  const salaryEmpty = document.getElementById('salaryVsExpensesEmpty');
  const barChartEl = document.getElementById('barChart');
  if (salaryEmpty && barChartEl) {
    salaryEmpty.style.display = (hasExpenses || hasSalary) ? 'none' : 'block';
    barChartEl.style.display = (hasExpenses || hasSalary) ? 'block' : 'none';
  }

  if ((hasExpenses || hasSalary) && barChartEl && barChartEl.style.display === 'block') {
    if (barChartInstance) {
      barChartInstance.destroy();
    }
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
        plugins: {
          legend: { position: 'top' },
          tooltip: {
            mode: 'index',
            intersect: false,
            callbacks: {
              label: function(context) {
                // Get the value from the context (data from the bar)
                const value = context.raw;
                return `$${value.toFixed(2)}`; 
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
}

/**
 * Draws the category breakdown pie chart for a specific month
 * @param {number} index - Index of the month in monthKeys array to display
 */
function drawCategoryPieChart(index) {

  const hasExpenses = window.expenseData.hasExpenses;

  if (hasExpenses == true){
  monthKeys = Object.keys(window.expenseData.monthlyCategoryExpenses);

  // Toggle category breakdown empty state and chart
  const categoryEmpty = document.getElementById('categoryBreakdownEmpty');
  const pieChartEl = document.getElementById('pieChart');
  const prevBtn = document.getElementById('prevMonth');
  const nextBtn = document.getElementById('nextMonth');

  // Show/hide buttons only if there are multiple months
  if (hasExpenses && monthKeys.length > 1) {
      prevBtn.style.display = 'inline-block';
      nextBtn.style.display = 'inline-block';
  } else {
      prevBtn.style.display = 'none';
      nextBtn.style.display = 'none';
  }

  // Toggle chart visibility based on expenses
  if (categoryEmpty && pieChartEl) {
      categoryEmpty.style.display = hasExpenses ? 'none' : 'block';
      pieChartEl.style.display = hasExpenses ? 'block' : 'none';
  }

  if (hasExpenses && pieChartEl && pieChartEl.style.display === 'block') {
      if (pieChartInstance) {
          pieChartInstance.destroy();
      }

      // Extract and order the months from the data
      const monthlyExpenses = window.expenseData.monthlyCategoryExpenses;
      monthKeys.sort((a, b) => new Date(`1 ${b} 2020`) - new Date(`1 ${a} 2020`)); // Sort by month

      const month = monthKeys[index];
      const data = monthlyExpenses[month];

      // Remove the 'total' key to only include category breakdown
      const categories = Object.keys(data).filter(k => k !== 'total');
      const values = categories.map(cat => data[cat]);

      console.log("categories "+categories);

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
                  backgroundColor: ['#6c5ce7', '#00cec9', '#fd79a8','#fab1a0', '#ffeaa7', '#55efc4', '#a29bfe']
              }]
          },
          options: {
              responsive: true,
              aspectRatio: 1.2,
              plugins: {
                  title: {
                      display: true,
                      text: `Category Breakdown - ${month}`
                  },
                  legend: {
                      position: 'bottom'
                  },
                  tooltip: {
                    callbacks: {
                        label: function (context) {
                            const label = context.label || '';
                            const value = context.parsed || 0;
                            return `${label}: $${value.toFixed(2)}`;
                        }
                    }
                }
              }
          }
      });
  }
}
}


/**
* Initializes all expense charts and handles empty states
* Creates line chart (weekly spending), bar chart (salary vs expenses), and pie chart (category breakdown)
*/
function initExpenseCharts() {
  // Show/hide empty states and charts based on data
  const hasExpenses = window.expenseData.hasExpenses;

  const weeklyEmpty = document.getElementById('weeklyExpensesEmpty');
  const lineChartEl = document.getElementById('lineChart');
  if (weeklyEmpty && lineChartEl) {
    weeklyEmpty.style.display = hasExpenses ? 'none' : 'block';
    lineChartEl.style.display = hasExpenses ? 'block' : 'none';
  }

  if (hasExpenses && lineChartEl && lineChartEl.style.display === 'block') {
    if (lineChartInstance) {
      lineChartInstance.destroy();
    }

    const weeklyExpense = window.expenseData.weeklyExpense;

    // Sort weekly expense data by start date
    const sortedEntries = Object.entries(weeklyExpense).sort(([a], [b]) => {
      const dateA = new Date(a.split(' - ')[0] + ' 2025');
      const dateB = new Date(b.split(' - ')[0] + ' 2025');
      return dateA - dateB;
    });

    const sortedLabels = sortedEntries.map(([label]) => label);
    const sortedData = sortedEntries.map(([, value]) => value);

    lineChartInstance = new Chart(lineChartEl, {
      type: "line",
      data: {
        labels: sortedLabels,
        datasets: [{
          label: "Weekly Spending",
          data: sortedData,
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
                const value = context.parsed.y;
                return `Weekly Spending: $${value.toFixed(2)}`;
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

  drawExpenseAndSalaryGraph();
  drawCategoryPieChart(currentMonthIndex);
}

/**
 * Handles navigation to the previous month in the category breakdown pie chart
 * Wraps around to the end if at the first month
 */
function handlePrevMonth() {
  if (currentMonthIndex < monthKeys.length - 1) {
    currentMonthIndex = currentMonthIndex+1 ;
}
else{
    currentMonthIndex = 0 ;
}
drawCategoryPieChart(currentMonthIndex);
}

/**
 * Handles navigation to the next month in the category breakdown pie chart
 * Wraps around to the beginning if at the last month
 */
function handleNextMonth() {
  if (currentMonthIndex > 0) {
    currentMonthIndex--;
}
else{
    currentMonthIndex = monthKeys.length - 1 ;
}
drawCategoryPieChart(currentMonthIndex);
}

/**
 * Handles adding a new expense via AJAX
 * @param {Event} event - Form submission event
 */
async function saveExpense(event) {
  event.preventDefault();
  const form = document.getElementById('expenseForm');
  const btn  = form.querySelector('button[type="submit"]');

  if (!form.checkValidity()) {
    form.reportValidity();
    return;
  }

  try {
    btn.disabled = true;
    btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Saving...';

    const payload = {
      amount:   parseFloat(form.amount.value),
      category: form.category.value,
      date:     form.date.value
    };

    const resp   = await fetch('/expense/addExpense', {
      method:  'POST',
      headers: { 'Content-Type': 'application/json' },
      body:    JSON.stringify(payload)
    });
    const result = await resp.json();
    if (!resp.ok) throw new Error(result.message || 'Failed to save expense');

    // unpack either { data: {...} } or raw {...}
    window.expenseData = result.data ?? result;
    initExpenseCharts();
    showAlert('Expense added successfully!', 'success');
    form.reset();

  } catch (err) {
    console.error(err);
    showAlert(err.message || 'Error saving expense.', 'danger');
  } finally {
    btn.disabled = false;
    btn.innerHTML = '<i class="fas fa-plus-circle me-1"></i> Add Expense';
  }
}

/**
 * Handles adding a new salary via AJAX
 * @param {Event} event - Form submission event
 */
async function saveSalary(event) {
  event.preventDefault();
  const form = document.getElementById('salaryForm');
  const btn  = form.querySelector('button[type="submit"]');

  if (!form.checkValidity()) {
    form.reportValidity();
    return;
  }

  try {
    btn.disabled = true;
    btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Saving...';

    const payload = {
      amount: parseFloat(form.amount.value),
      date:   form.date.value
    };

    const resp   = await fetch('/expense/addSalary', {
      method:  'POST',
      headers: { 'Content-Type': 'application/json' },
      body:    JSON.stringify(payload)
    });
    const result = await resp.json();
    if (!resp.ok) throw new Error(result.message || 'Failed to save salary');

    // unpack either { data: {...} } or raw {...}
    window.expenseData.expenseAndSalary.salaryData = result.data.newSalaryData ?? result;

    drawExpenseAndSalaryGraph();
    showAlert('Salary added successfully!', 'success');
    form.reset();

  } catch (err) {
    console.error(err);
    showAlert(err.message || 'Error saving salary.', 'danger');
  } finally {
    btn.disabled = false;
    btn.innerHTML = '<i class="fas fa-dollar-sign me-1"></i> Add Salary';
  }
}

/**
 * Utility function to show a Bootstrap alert message
 * @param {string} message - The message to display
 * @param {string} type - Alert type (success, danger, info, etc.)
 */
function showAlert(message, type = 'info') {
  const container = document.querySelector('.main-content');
  const alertDiv  = document.createElement('div');
  alertDiv.className = `alert alert-${type} alert-dismissible fade show`;
  alertDiv.role = 'alert';
  alertDiv.innerHTML = `
    ${message}
    <button type="button" class="btn-close" data-bs-dismiss="alert"></button>
  `;
  container.prepend(alertDiv);
  setTimeout(() => alertDiv.remove(), 5000);
}

// Initialize charts and set up event listeners when DOM is fully loaded
document.addEventListener('DOMContentLoaded', () => {
  initExpenseCharts();
  document.getElementById('prevMonth').addEventListener('click', handlePrevMonth);
  document.getElementById('nextMonth').addEventListener('click', handleNextMonth);
  document.getElementById('expenseForm').addEventListener('submit', saveExpense);
  document.getElementById('salaryForm').addEventListener('submit', saveSalary);
});
