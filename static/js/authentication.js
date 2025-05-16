/**
 * Common function to toggle password visibility in input fields
 * @param {string} passwordId - The ID of the password input element
 * @param {string} toggleId - The ID of the toggle button/icon element
 */
function setupPasswordToggle(passwordId, toggleId) {
    const toggle = document.getElementById(toggleId);
    if (toggle) {
        toggle.addEventListener('click', function() {
            const password = document.getElementById(passwordId);
            const type = password.getAttribute('type') === 'password' ? 'text' : 'password';
            password.setAttribute('type', type);
            this.classList.toggle('fa-eye-slash');
            this.classList.toggle('fa-eye');
        });
    }
}

// Login Form Handling
const loginForm = document.getElementById('loginForm');
if (loginForm) {

    const csrfToken = document.querySelector('meta[name="csrf-token"]').getAttribute('content');

    // Set up password toggle for login form
    setupPasswordToggle('password', 'togglePassword');

    loginForm.addEventListener('submit', function(e) {
        e.preventDefault();

        const formData = {
            username: document.getElementById('username').value,
            password: document.getElementById('password').value,
        };
        console.log("formData :", formData);

        fetch('/login', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'X-CSRFToken': csrfToken
            },
            body: JSON.stringify(formData)
        })
        .then(response => {
            if (!response.ok) {
                return response.json().then(err => { throw err; });
            }
            return response.json();
        })
        .then(data => {
            console.log('Response:', data);

            if (data.status === "Success" && data.redirect) {
                setTimeout(() => {
                    window.location.href = data.redirect;
                }, 100); // Immediate or minimal delay
            } else {
                showAlert(`${data.status}: ${data.message}`, "danger");
            }
        })
        .catch(error => {
            console.error('Error:', error);
            const message = error.message || 'An error occurred while processing your request';
            showAlert("Error: " + message, "danger");
        });
    });
}


// Signup Form Handling
const signupForm = document.getElementById('signupForm');
const csrfToken = document.querySelector('meta[name="csrf-token"]').getAttribute('content');
if (signupForm) {
    // Set up password toggles for signup form
    setupPasswordToggle('password', 'togglePassword');
    setupPasswordToggle('confirmPassword', 'toggleConfirmPassword');

    signupForm.addEventListener('submit', function(e) {
        e.preventDefault();

        const formData = {
            firstName: document.getElementById('firstName').value,
            lastName: document.getElementById('lastName').value,
            username: document.getElementById('username').value,
            password: document.getElementById('password').value,
            confirmPassword: document.getElementById('confirmPassword').value,
        };

        // Send signup request to server
        fetch('/addUser', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'X-CSRFToken': csrfToken
            },
            body: JSON.stringify(formData)
        })
        .then(response => {
            if (!response.ok) {
                return response.json().then(err => { throw err; });
            }
            return response.json();
        })
        .then(data => {
            console.log('Response:', data);
            // Show success/error message to user
            showAlert(`${data.status}: ${data.message}`, data.status === "Success" ? "success" : "danger");
            if (data.status === "Success" && data.redirect) {
                setTimeout(() => {
                    window.location.href = data.redirect;
                }, 1000); 
            }
        })
        .catch(error => {
            console.error('Error:', error);
            const message = error.message || 'An error occurred while processing your request';
            showAlert("Error: " + message, "danger");
        });
    });
}

/**
 * Utility function to show Bootstrap-style alert messages
 * @param {string} message - The message text to display
 * @param {string} type - The alert type (e.g., 'success', 'danger', 'info')
 */
function showAlert(message, type = 'info') {
    const container = document.querySelector('.main-content') || document.body;
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
  