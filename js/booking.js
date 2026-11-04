
/* =========================================
   EVENTORA - BOOKING SYSTEM
   Firebase Booking Integration
   ========================================= */

import {
  initializeApp,
  getApps,
  getApp
} from "https://www.gstatic.com/firebasejs/13.2.0/firebase-app.js";

import {
  getFirestore,
  collection,
  addDoc,
  serverTimestamp
} from "https://www.gstatic.com/firebasejs/13.2.0/firebase-firestore.js";


/* FIREBASE CONFIGURATION */

const firebaseConfig = {
  apiKey: "AIzaSyA184UnR0cJDEm9yj0UN44y0VM1SgTxa8Q",
  authDomain: "event-management-93edc.firebaseapp.com",
  projectId: "event-management-93edc",
  storageBucket: "event-management-93edc.firebasestorage.app",
  messagingSenderId: "327602461080",
  appId: "1:327602461080:web:eb96abf94de99d1bac73ed"
};


/* INITIALIZE FIREBASE */

const app = getApps().length
  ? getApp()
  : initializeApp(firebaseConfig);

const db = getFirestore(app);


/* GET FORM ELEMENTS */

const form = document.getElementById("bookingForm");
const message = document.getElementById("formMessage");
const submitButton = document.getElementById("submitBooking");
const dateInput = document.getElementById("date");


/* DISPLAY MESSAGE */

function showMessage(text, type = "error") {
  if (!message) return;

  message.textContent = text;

  message.style.color =
    type === "success" ? "#76c69a" :
    type === "info" ? "#e2c486" :
    "#e58b83";

  message.setAttribute("role", "status");
  message.setAttribute("aria-live", "polite");
}


/* GET TODAY'S LOCAL DATE */

function getLocalDate() {
  const now = new Date();

  now.setMinutes(
    now.getMinutes() - now.getTimezoneOffset()
  );

  return now.toISOString().split("T")[0];
}


/* SET MINIMUM EVENT DATE */

if (dateInput) {
  dateInput.min = getLocalDate();
}


/* PREVENT DUPLICATE SUBMISSIONS */

let isSubmitting = false;


/* HANDLE BOOKING FORM */

if (form && submitButton && message && dateInput) {

  form.addEventListener("submit", async (event) => {

    event.preventDefault();

    // Prevent multiple submissions
    if (isSubmitting) return;

    // Browser's built-in validation
    if (!form.reportValidity()) return;


    /* GET CUSTOMER DETAILS */

    const name = document.getElementById("name").value.trim();

    const phone = document.getElementById("phone").value.trim();

    const email = document.getElementById("email").value.trim();

    const eventType = document.getElementById("eventType").value;

    const eventDate = dateInput.value;

    const guests = Number(
      document.getElementById("guests").value
    );

    const location = document.getElementById("location").value.trim();

    const budget = document.getElementById("budget").value;

    const requirements = document.getElementById("requirements").value.trim();


    /* GET SELECTED SERVICES */

    const services = Array.from(
      form.querySelectorAll('input[name="services"]:checked')
    ).map(item => item.value);


    /* GET CONSENT */

    const consent = document.getElementById("consent").checked;


    /* VALIDATION */

    if (
      !name ||
      !phone ||
      !email ||
      !eventType ||
      !eventDate ||
      !location ||
      !consent
    ) {
      showMessage("Please complete all required fields.");
      return;
    }


    // Validate customer name
    if (name.length < 2 || name.length > 100) {
      showMessage("Please enter a valid name.");
      return;
    }


    // Validate email
    const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    if (!emailPattern.test(email)) {
      showMessage("Please enter a valid email address.");
      return;
    }


    // Validate phone number
    if (!/^[0-9+\-\s()]{7,20}$/.test(phone)) {
      showMessage("Please enter a valid phone number.");
      return;
    }


    // Validate guest count
    if (
      !Number.isInteger(guests) ||
      guests < 1 ||
      guests > 100000
    ) {
      showMessage("Please enter a valid guest count.");
      return;
    }


    // Validate event date
    if (eventDate < getLocalDate()) {
      showMessage("Please select today or a future date.");
      return;
    }


    /* PREPARE BOOKING */

    const bookingData = {
      name,
      phone,
      email,
      eventType,
      eventDate,
      guests,
      budget,
      location,
      services,
      requirements,
      status: "Pending",
      createdAt: serverTimestamp()
    };


    /* SUBMIT TO FIREBASE */

    isSubmitting = true;

    submitButton.disabled = true;
    submitButton.textContent = "Submitting Your Enquiry...";

    showMessage(
      "Please wait while we submit your enquiry.",
      "info"
    );

    try {

      const result = await addDoc(
        collection(db, "bookings"),
        bookingData
      );


      /* SUCCESS MESSAGE */

      showMessage(
        "Thank you for choosing EVENTORA! Your event enquiry has been received successfully. Your reference ID is: " + result.id,
        "success"
      );


      // Reset form after successful submission
      form.reset();

      // Prevent past dates after reset
      dateInput.min = getLocalDate();

      // Return focus to the form heading if available
      const heading = form.querySelector("h2");

      if (heading) {
        heading.setAttribute("tabindex", "-1");
        heading.focus();
      }

    } catch (error) {

      console.error(
        "EVENTORA booking submission error:",
        error
      );

      showMessage(
        "We couldn't submit your enquiry. Please check your internet connection and try again."
      );

    } finally {

      isSubmitting = false;

      submitButton.disabled = false;

      submitButton.textContent = "Send Event Enquiry";

    }

  });

} else {

  console.error(
    "EVENTORA: Booking form or required elements were not found."
  );

}
