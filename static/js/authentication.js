// Common function to toggle password visibility
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

// const CSRF_TOKEN = document.querySelector('meta[name="csrf-token"]').getAttribute('content');

// Login Form Handling
const loginForm = document.getElementById('loginForm');
if (loginForm) {

    // Set up password toggle for login form
    setupPasswordToggle('password', 'togglePassword');

    loginForm.addEventListener('submit', function(e) {
        e.preventDefault();

        const formData = {
            username: document.getElementById('username').value,
            password: document.getElementById('password').value,
        };
        console.log("formData :", formData);
        // console.log("CSRF_TOKEN :", CSRF_TOKEN);

        fetch('/login', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                // 'X-CSRFToken': CSRF_TOKEN 
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
                window.location.href = data.redirect;
            }
            else {
                alert(data.status + ": " + data.message);
            }
        })
        .catch(error => {
            console.error('Error:', error);
            const message = error.message || 'An error occurred while processing your request';
            alert("Error: " + message);
        });
    });
}

// Signup Form Handling
const signupForm = document.getElementById('signupForm');
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

        fetch('/addUser', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                // 'X-CSRFToken': CSRF_TOKEN 
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
            alert(data.status + ": " + data.message);
            if (data.status === "Success" && data.redirect) {
                window.location.href = data.redirect;
            }
        })
        .catch(error => {
            console.error('Error:', error);
            const message = error.message || 'An error occurred while processing your request';
            alert("Error: " + message);
        });
    });
}