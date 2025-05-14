document.addEventListener("DOMContentLoaded", function () {
  // Handle Name Form
  const nameForm = document.getElementById("nameForm");
  if (nameForm) {
    nameForm.addEventListener("submit", function (e) {
      e.preventDefault();

      const formData = {
        firstName: document.getElementById("firstName").value,
        lastName: document.getElementById("lastName").value,
      };

      console.log("Submitting name form:", formData);

      fetch("/settings", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(formData),
      })
        .then((res) => res.json())
        .then((data) => {
          console.log("Name form response:", data);
          showAlert("nameAlert", data.status, data.message);
        })
        .catch((err) => {
          console.error("Name form error:", err);
          showAlert(
            "nameAlert",
            "Failed",
            "Unexpected error occurred while updating name."
          );
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

      console.log("Submitting password form:", formData);

      fetch("/settings", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(formData),
      })
        .then((res) => {
          console.log("Password form raw response:", res);
          return res.json();
        })
        .then((data) => {
          console.log("Password form response:", data);
          showAlert("passwordAlert", data.status, data.message);
        })
        .catch((err) => {
          console.error("Password form error:", err);
          showAlert(
            "passwordAlert",
            "Failed",
            "Unexpected error occurred while changing password."
          );
        });
    });
  }

  // Helper: show alert
  function showAlert(alertId, status, message) {
    console.log(
      `Showing alert: ${alertId}, Status: ${status}, Message: ${message}`
    );
    const alertBox = document.getElementById(alertId);
    if (!alertBox) {
      console.error(`Alert box with id "${alertId}" not found.`);
      return;
    }
    alertBox.classList.remove("d-none", "alert-success", "alert-danger");
    alertBox.classList.add(
      status === "Success" ? "alert-success" : "alert-danger"
    );
    alertBox.textContent = message;
  }
});
