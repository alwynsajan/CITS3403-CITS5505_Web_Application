document.addEventListener("DOMContentLoaded", function () {
  const alertBox = document.getElementById("settingsAlert");

  // Handle Name Form
  const nameForm = document.getElementById("nameForm");
  if (nameForm) {
    nameForm.addEventListener("submit", function (e) {
      e.preventDefault();

      const formData = {
        firstName: document.getElementById("firstName").value,
        lastName: document.getElementById("lastName").value,
      };

      fetch("/settings/name", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(formData),
      })
        .then((res) => res.json())
        .then((data) => {
          showAlert(data.status, data.message);
        })
        .catch(() => {
          showAlert("Failed", "Unexpected error occurred while updating name.");
        });
    });
  }

  // Handle Password Form
  const passwordForm = document.getElementById("passwordForm");
  if (passwordForm) {
    passwordForm.addEventListener("submit", function (e) {
      e.preventDefault();

      const formData = {
        currentPassword: document.getElementById("currentPassword").value,
        newPassword: document.getElementById("newPassword").value,
        confirmPassword: document.getElementById("confirmPassword").value,
      };

      fetch("/settings/password", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(formData),
      })
        .then((res) => res.json())
        .then((data) => {
          showAlert(data.status, data.message);
        })
        .catch(() => {
          showAlert(
            "Failed",
            "Unexpected error occurred while changing password."
          );
        });
    });
  }

  // Helper: show alert
  function showAlert(status, message) {
    alertBox.classList.remove("d-none", "alert-success", "alert-danger");
    alertBox.classList.add(
      status === "Success" ? "alert-success" : "alert-danger"
    );
    alertBox.textContent = message;
  }
});
