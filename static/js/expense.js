// static/js/expense.js

let pieChart, barChart, lineChart;

/**
 * Initialize charts and table if we have expense data.
 */
function initExpenseCharts() {
  // guard if expenseData is ever undefined or no data
  if (!window.expenseData || !window.expenseData.hasExpenses) return;

  // 1) Pie chart: category breakdown
  const pieCtx = document.getElementById('pieChart').getContext('2d');
  pieChart = new Chart(pieCtx, {
    type: 'pie',
    data: {
      labels: window.expenseData.monthlyCategorywiseExpenses.categories,
      datasets: [{
        data: window.expenseData.monthlyCategorywiseExpenses.expensePercentage,
        backgroundColor: [
          '#6c5ce7', '#00cec9', '#0984e3', '#00b894', '#ff7675', '#fdcb6e'
        ]
      }]
    }
  });

  // 2) Bar chart: salary vs expenses
  const barCtx = document.getElementById('barChart').getContext('2d');
  barChart = new Chart(barCtx, {
    type: 'bar',
    data: {
      labels: window.expenseData.expenseAndSalary.labels,
      datasets: [
        {
          label: 'Salary',
          data: window.expenseData.expenseAndSalary.salaryData,
          backgroundColor: '#6c5ce7'
        },
        {
          label: 'Expenses',
          data: window.expenseData.expenseAndSalary.expenseData,
          backgroundColor: '#00cec9'
        }
      ]
    }
  });

  // 3) Line chart: weekly spending
  const lineCtx = document.getElementById('lineChart').getContext('2d');
  lineChart = new Chart(lineCtx, {
    type: 'line',
    data: {
      labels: Object.keys(window.expenseData.weeklyExpense),
      datasets: [{
        label: 'Weekly Spending',
        data: Object.values(window.expenseData.weeklyExpense),
        fill: false,
        borderColor: '#0984e3',
        tension: 0.3
      }]
    }
  });

  // 4) Populate the expense log table
  updateExpenseTable(window.expenseData.expenses);
}

/**
 * Render the expense table rows
 */
function updateExpenseTable(expenses) {
  const tbody = document.querySelector('#expenseLog tbody');
  if (!tbody) return;
  tbody.innerHTML = '';
  expenses.forEach(exp => {
    const row = document.createElement('tr');
    row.innerHTML = `
      <td>${exp.date}</td>
      <td>$${exp.amount.toFixed(2)}</td>
      <td>${exp.category}</td>
    `;
    tbody.appendChild(row);
  });
}

/**
 * Handle adding a new expense via AJAX
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
