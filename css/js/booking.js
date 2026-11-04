
/* =========================================
   DEV ORGANIZERS - BOOKING FORM
   Frontend validation only.
   Firebase connection will be added later.
   ========================================= */

const bookingForm = document.getElementById("bookingForm");
const formMessage = document.getElementById("formMessage");
const eventDate = document.getElementById("date");

if (eventDate) {
  // Prevent customers from selecting a past event date
  const today = new Date();
  const localDate = new Date(
    today.getTime() - today.getTimezoneOffset() * 60000
  ).toISOString().split("T")[0];

  eventDate.min = localDate;
}

if (bookingForm && formMessage) {
  bookingForm.addEventListener("submit", (event) => {
    event.preventDefault();

    formMessage.textContent = "";
    formMessage.className = "form-message";

    if (!bookingForm.checkValidity()) {
      bookingForm.reportValidity();
      return;
    }

    const formData = new FormData(bookingForm);
    const customerName = String(formData.get("name") || "").trim();
    const customerPhone = String(formData.get("phone") || "").trim();
    const customerEmail = String(formData.get("email") || "").trim();

    if (!customerName || !customerPhone || !customerEmail) {
      formMessage.textContent = "Please complete all required fields.";
      formMessage.classList.add("error");
      return;
    }

    if (eventDate && eventDate.value < localDate) {
      formMessage.textContent = "Please select a future event date.";
      formMessage.classList.add("error");
      return;
    }

    /*
      The frontend form is ready.
      Next stage: connect Firebase Firestore here.
      Do not show a booking confirmation until the
      database confirms that the inquiry was saved.
    */

    formMessage.textContent =
      "Your details are valid. Online booking submission will be activated after Firebase is connected.";

    formMessage.classList.add("success");
  });
}
