
/* =========================================================
   EVENTORA - CUSTOMER BOOKING TRACKING
   File: js/track-booking.js
========================================================= */

import {
    initializeApp,
    getApps,
    getApp
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js";

import {
    getFirestore,
    doc,
    getDoc
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";

import {
    getAuth,
    signInAnonymously
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js";


/* ---------- FIREBASE CONFIGURATION ---------- */

const firebaseConfig = {
    apiKey: "AIzaSyA184UnR0cJDEm9yj0UN44y0VM1SgTxa8Q",
    authDomain: "event-management-93edc.firebaseapp.com",
    projectId: "event-management-93edc",
    storageBucket: "event-management-93edc.firebasestorage.app",
    messagingSenderId: "327602461080",
    appId: "1:327602461080:web:eb96abf94de99d1bac73ed",
    measurementId: "G-NFFDH9C4ZF"
};


/* ---------- INITIALIZE FIREBASE ---------- */

const app = getApps().length
    ? getApp()
    : initializeApp(firebaseConfig);

const db = getFirestore(app);
const auth = getAuth(app);


/* ---------- PAGE ELEMENTS ---------- */

const trackingForm = document.getElementById("trackingForm");
const referenceInput = document.getElementById("bookingReference");
const trackButton = document.getElementById("trackButton");
const trackingMessage = document.getElementById("trackingMessage");
const bookingDetails = document.getElementById("bookingDetails");


/* ---------- CUSTOMER AUTHENTICATION ---------- */

async function getCustomerUser() {
    if (auth.currentUser) {
        return auth.currentUser;
    }

    const result = await signInAnonymously(auth);
    return result.user;
}


/* ---------- MESSAGE ---------- */

function showMessage(message, success = false) {
    trackingMessage.textContent = message;
    trackingMessage.style.display = "block";

    trackingMessage.style.background = success
        ? "#e8f5e9"
        : "#fff0ee";

    trackingMessage.style.color = success
        ? "#256438"
        : "#a33b32";

    bookingDetails.replaceChildren();
}


/* ---------- DISPLAY BOOKING DETAILS ---------- */

function addDetail(container, label, value) {
    const row = document.createElement("div");
    row.className = "detail-row";

    const left = document.createElement("span");
    left.textContent = label;

    const right = document.createElement("span");
    right.textContent = value || "Not provided";

    row.append(left, right);
    container.appendChild(row);
}


function displayBooking(data, reference) {
    bookingDetails.replaceChildren();

    const section = document.createElement("section");
    section.className = "booking-details";

    const heading = document.createElement("h2");
    heading.textContent = "Booking Details";

    section.appendChild(heading);

    addDetail(section, "Reference ID", reference);
    addDetail(section, "Customer Name", data.name);
    addDetail(section, "Event Type", data.eventType);
    addDetail(section, "Event Date", data.date);
    addDetail(section, "Guests", String(data.guests));
    addDetail(section, "Location", data.location);

    addDetail(
        section,
        "Selected Services",
        Array.isArray(data.services)
            ? data.services.join(", ")
            : "Not provided"
    );

    const statusRow = document.createElement("div");
    statusRow.className = "detail-row";

    const statusLabel = document.createElement("span");
    statusLabel.textContent = "Booking Status";

    const statusValue = document.createElement("span");

    const allowedStatuses = [
        "pending",
        "accepted",
        "completed",
        "rejected"
    ];

    const status = String(data.status || "pending").toLowerCase();

    statusValue.className = "status " +
        (allowedStatuses.includes(status) ? status : "pending");

    statusValue.textContent = status;

    statusRow.append(statusLabel, statusValue);
    section.appendChild(statusRow);

    bookingDetails.appendChild(section);

    trackingMessage.textContent =
        "Booking found! Here is your latest booking information.";

    trackingMessage.style.display = "block";
    trackingMessage.style.background = "#e8f5e9";
    trackingMessage.style.color = "#256438";
}


/* ---------- TRACK BOOKING ---------- */

async function trackBooking(reference) {
    const cleanReference = reference.trim();

    if (!cleanReference) {
        showMessage("Please enter your booking reference ID.");
        return;
    }

    trackButton.disabled = true;
    trackButton.textContent = "Checking Booking...";

    showMessage("Please wait. Checking your booking...");

    try {
        const customer = await getCustomerUser();

        const bookingRef = doc(
            db,
            "bookings",
            cleanReference
        );

        const bookingSnapshot = await getDoc(bookingRef);

        if (!bookingSnapshot.exists()) {
            showMessage(
                "Booking not found. Please check your reference ID."
            );
            return;
        }

        const bookingData = bookingSnapshot.data();

        if (bookingData.ownerUid !== customer.uid) {
            showMessage(
                "This booking cannot be accessed from this browser. " +
                "Please use the browser and device used to submit it."
            );
            return;
        }

        displayBooking(bookingData, cleanReference);

    } catch (error) {
        console.error("EVENTORA tracking error:", error);
        console.error("Error code:", error.code);
        console.error("Error message:", error.message);

        if (error.code === "permission-denied") {
            showMessage(
                "Access denied. Use the same browser and device " +
                "that submitted this booking."
            );
        } else if (error.code === "auth/operation-not-allowed") {
            showMessage(
                "Anonymous Authentication is not enabled in Firebase."
            );
        } else {
            showMessage(
                "Unable to check your booking. Please try again. " +
                (error.code || error.message || "")
            );
        }

    } finally {
        trackButton.disabled = false;
        trackButton.textContent = "Track My Booking";
    }
}


/* ---------- FORM SUBMISSION ---------- */

if (trackingForm && referenceInput && trackButton &&
    trackingMessage && bookingDetails) {

    trackingForm.addEventListener("submit", function(event) {
        event.preventDefault();
        trackBooking(referenceInput.value);
    });

} else {
    console.error(
        "EVENTORA: Tracking HTML elements are missing. Check track-booking.html."
    );
}


/* ---------- LOAD LAST BOOKING REFERENCE ---------- */

const urlReference = new URLSearchParams(
    window.location.search
).get("ref");

const savedReference = localStorage.getItem(
    "eventoraLastBookingRef"
);

if (referenceInput) {
    if (urlReference) {
        referenceInput.value = urlReference;
    } else if (savedReference) {
        referenceInput.value = savedReference;
    }
}

console.log("EVENTORA Booking Tracking initialized.");
