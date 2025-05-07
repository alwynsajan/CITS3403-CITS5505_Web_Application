// static/js/expense.js

let pieChart, barChart, lineChart;
let barChartInstance = null;
let pieChartInstance = null;
let lineChartInstance = null;

/**
 * Initialize charts and table if we have expense data.
 */
function initExpenseCharts() {
  // Show/hide empty states and charts based on data
  const hasExpenses = window.expenseData.hasExpenses;
  const hasSalary = window.expenseData.hasSalary;
  
  // Weekly Expenses
  const weeklyEmpty = document.getElementById('weeklyExpensesEmpty');
  const lineChartEl = document.getElementById('lineChart');
  if (weeklyEmpty && lineChartEl) {
    weeklyEmpty.style.display = hasExpenses ? 'none' : 'block';
    lineChartEl.style.display = hasExpenses ? 'block' : 'none';
  }
  
  // Category Breakdown
  const categoryEmpty = document.getElementById('categoryBreakdownEmpty');
  const pieChartEl = document.getElementById('pieChart');
  if (categoryEmpty && pieChartEl) {
    categoryEmpty.style.display = hasExpenses ? 'none' : 'block';
    pieChartEl.style.display = hasExpenses ? 'block' : 'none';
  }
  
  // Salary vs Expenses
  const salaryEmpty = document.getElementById('salaryVsExpensesEmpty');
  const barChartEl = document.getElementById('barChart');
  if (salaryEmpty && barChartEl) {
    salaryEmpty.style.display = (hasExpenses || hasSalary) ? 'none' : 'block';
    barChartEl.style.display = (hasExpenses || hasSalary) ? 'block' : 'none';
  }

  // Now initialize the charts if they should be visible
  if (hasExpenses && lineChartEl && lineChartEl.style.display === 'block') {
    if (lineChartInstance) {
      lineChartInstance.destroy();
    }
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
        maintainAspectRatio: false,
        plugins: {
          legend: { display: false }
        },
        scales: {
          y: { display: false },
          x: { display: false }
        }
      }
    });
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
        maintainAspectRatio: false,
        plugins: {
          legend: { position: 'top' },
          tooltip: { mode: 'index', intersect: false }
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
 * Handle adding a new expense via AJAX
 */async function saveExpense(event) {
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
 * Handle adding a new salary via AJAX
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
    window.expenseData = result.data ?? result;

    console.log(window.expenseData)

    initExpenseCharts();
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
 * Utility: show a Bootstrap alert
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

// wire everything up on page load
document.addEventListener('DOMContentLoaded', () => {
  initExpenseCharts();
  document.getElementById('expenseForm').addEventListener('submit', saveExpense);
  document.getElementById('salaryForm').addEventListener('submit', saveSalary);
});
