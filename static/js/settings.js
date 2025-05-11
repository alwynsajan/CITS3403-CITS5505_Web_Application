document.addEventListener("DOMContentLoaded", function () {
  const settingsForm = document.getElementById("settingsForm");
  const alertBox = document.getElementById("settingsAlert");

  settingsForm.addEventListener("submit", function (e) {
    e.preventDefault();

    const formData = {
      firstName: document.getElementById("firstName").value,
      lastName: document.getElementById("lastName").value,
      currentPassword: document.getElementById("currentPassword").value,
      newPassword: document.getElementById("newPassword").value,
      confirmPassword: document.getElementById("confirmPassword").value,
    };

    fetch("/settings", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(formData),
    })
      .then((res) => res.json())
      .then((data) => {
        alertBox.classList.remove("d-none", "alert-success", "alert-danger");
        alertBox.classList.add(
          data.status === "Success" ? "alert-success" : "alert-danger"
        );
        alertBox.textContent = data.message;
      })
      .catch(() => {
        alertBox.classList.remove("d-none", "alert-success");
        alertBox.classList.add("alert-danger");
        alertBox.textContent = "Unexpected error occurred.";
      });
  });
});
