
import { initializeApp, getApps, getApp } from "https://www.gstatic.com/firebasejs/13.2.0/firebase-app.js";

import {
  getFirestore,
  collection,
  addDoc,
  serverTimestamp
} from "https://www.gstatic.com/firebasejs/13.2.0/firebase-firestore.js";

const firebaseConfig = {
  apiKey: "AIzaSyA184UnR0cJDEm9yj0UN44y0VM1SgTxa8Q",
  authDomain: "event-management-93edc.firebaseapp.com",
  projectId: "event-management-93edc",
  storageBucket: "event-management-93edc.firebasestorage.app",
  messagingSenderId: "327602461080",
  appId: "1:327602461080:web:eb96abf94de99d1bac73ed"
};

const app = getApps().length
  ? getApp()
  : initializeApp(firebaseConfig);

const db = getFirestore(app);

const form = document.getElementById("bookingForm");
const message = document.getElementById("formMessage");
const submitButton = document.getElementById("submitBooking");
const dateInput = document.getElementById("date");

function showMessage(text, success = false) {
  message.textContent = text;
  message.style.color = success ? "green" : "red";
}

function getLocalDate() {
  const now = new Date();
  now.setMinutes(now.getMinutes() - now.getTimezoneOffset());
  return now.toISOString().split("T")[0];
}

if (dateInput) {
  dateInput.min = getLocalDate();
}

if (form) {
  form.addEventListener("submit", async (event) => {
    event.preventDefault();

    if (!form.reportValidity()) return;

    const name = document.getElementById("name").value.trim();
    const phone = document.getElementById("phone").value.trim();
    const email = document.getElementById("email").value.trim();
    const eventType = document.getElementById("eventType").value;
    const eventDate = dateInput.value;
    const guests = Number(document.getElementById("guests").value);
    const location = document.getElementById("location").value.trim();
    const budget = document.getElementById("budget").value;
    const requirements = document.getElementById("requirements").value.trim();

    const services = Array.from(
      form.querySelectorAll('input[name="services"]:checked')
    ).map(item => item.value);

    const consent = document.getElementById("consent").checked;

    if (!name || !phone || !email || !eventType ||
        !eventDate || !location || !consent) {
      showMessage("Please complete all required fields.");
      return;
    }

    if (!Number.isInteger(guests) || guests < 1 || guests > 100000) {
      showMessage("Please enter a valid guest count.");
      return;
    }

    if (!/^[0-9+\-\s()]{7,20}$/.test(phone)) {
      showMessage("Please enter a valid phone number.");
      return;
    }

    if (eventDate < getLocalDate()) {
      showMessage("Please select today or a future date.");
      return;
    }

    submitButton.disabled = true;
    submitButton.textContent = "Submitting...";

    try {
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

      const result = await addDoc(
        collection(db, "bookings"),
        bookingData
      );

      showMessage(
        "Your enquiry was submitted successfully! Reference ID: " + result.id,
        true
      );

      form.reset();
      dateInput.min = getLocalDate();

    } catch (error) {
      console.error("Firebase submission error:", error);

      showMessage(
        "Submission failed: " + error.message
      );
    } finally {
      submitButton.disabled = false;
      submitButton.textContent = "Send Event Enquiry";
    }
  });
} else {
  console.error("Booking form not found on this page.");
}
