
/* =========================================================
   EVENTORA - CUSTOMER BOOKING SYSTEM
   Firebase Firestore Integration
   File: js/booking.js
========================================================= */

import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js";

import {
    getFirestore,
    collection,
    addDoc,
    serverTimestamp
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";


/* ---------- FIREBASE CONFIGURATION ---------- */

const firebaseConfig = {
    apiKey: "AIzaSyA184UnR0cJDEm9yj0UN44y0VM1SgTxa8",
    authDomain: "event-management-93edc.firebaseapp.com",
    projectId: "event-management-93edc",
    storageBucket: "event-management-93edc.firebasestorage.app",
    messagingSenderId: "327602461080",
    appId: "1:327602461080:web:eb96abf94de99d1bac73ed",
    measurementId: "G-NFFDH9C4ZF"
};


/* ---------- INITIALIZE FIREBASE ---------- */

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);


/* ---------- FORM ELEMENTS ---------- */

const bookingForm = document.getElementById("bookingForm");
const submitButton = document.getElementById("submitBooking");
const formMessage = document.getElementById("formMessage");


/* ---------- FORM MESSAGE ---------- */

function showMessage(message, type = "success") {

    if (!formMessage) return;

    formMessage.textContent = message;

    formMessage.style.padding = "12px 15px";
    formMessage.style.marginTop = "15px";
    formMessage.style.borderRadius = "8px";
    formMessage.style.fontSize = "14px";
    formMessage.style.display = "block";

    if (type === "success") {

        formMessage.style.background = "#e8f5e9";
        formMessage.style.color = "#256438";
        formMessage.style.border = "1px solid #b8dfbd";

    } else {

        formMessage.style.background = "#fff0ee";
        formMessage.style.color = "#a33b32";
        formMessage.style.border = "1px solid #efc4bf";

    }

}


/* ---------- READ FORM FIELD ---------- */

function getFieldValue(name) {

    const field = bookingForm.elements.namedItem(name);

    return field ? field.value.trim() : "";

}


/* ---------- EMAIL VALIDATION ---------- */

function isValidEmail(email) {

    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);

}


/* ---------- PHONE VALIDATION ---------- */

function isValidPhone(phone) {

    const cleanedPhone = phone.replace(/[\s()+-]/g, "");

    return /^\d{10,13}$/.test(cleanedPhone);

}


/* ---------- EVENT DATE VALIDATION ---------- */

function isValidEventDate(dateValue) {

    if (!dateValue) return false;

    const selectedDate = new Date(dateValue + "T00:00:00");

    const today = new Date();

    today.setHours(0, 0, 0, 0);

    return !Number.isNaN(selectedDate.getTime()) &&
        selectedDate >= today;

}


/* ---------- GET SELECTED SERVICES ---------- */

function getSelectedServices() {

    return Array.from(
        bookingForm.querySelectorAll(
            'input[name="services"]:checked'
        )
    ).map(function (checkbox) {

        return checkbox.value;

    });

}


/* ---------- FORM SUBMISSION ---------- */

if (bookingForm) {

    bookingForm.addEventListener("submit", async function (event) {

        event.preventDefault();

        if (submitButton.disabled) return;

        /* Read customer details */

        const name = getFieldValue("name");
        const phone = getFieldValue("phone");
        const email = getFieldValue("email");
        const eventType = getFieldValue("eventType");
        const date = getFieldValue("date");
        const guests = getFieldValue("guests");
        const location = getFieldValue("location");
        const budget = getFieldValue("budget");
        const requirements = getFieldValue("requirements");

        const services = getSelectedServices();

        const consent = bookingForm.elements.namedItem("consent");

        /* ---------- VALIDATION ---------- */

        if (!name || !phone || !email || !eventType ||
            !date || !guests || !location || !budget) {

            showMessage(
                "Please complete all required fields.",
                "error"
            );

            return;
        }

        if (name.length < 2) {

            showMessage(
                "Please enter your full name.",
                "error"
            );

            return;
        }

        if (!isValidPhone(phone)) {

            showMessage(
                "Please enter a valid phone number.",
                "error"
            );

            return;
        }

        if (!isValidEmail(email)) {

            showMessage(
                "Please enter a valid email address.",
                "error"
            );

            return;
        }

        if (!isValidEventDate(date)) {

            showMessage(
                "Please select today or a future event date.",
                "error"
            );

            return;
        }

        const guestCount = Number(guests);

        if (!Number.isInteger(guestCount) || guestCount < 1) {

            showMessage(
                "Please enter a valid number of guests.",
                "error"
            );

            return;
        }

        if (consent && !consent.checked) {

            showMessage(
                "Please accept the consent checkbox before submitting.",
                "error"
            );

            return;
        }

        /* ---------- PREPARE BOOKING ---------- */

        const bookingData = {

            name: name,
            phone: phone,
            email: email,

            eventType: eventType,
            date: date,
            guests: guestCount,

            location: location,
            budget: budget,

            services: services,
            requirements: requirements,

            status: "pending",

            createdAt: serverTimestamp()

        };

        /* ---------- SUBMIT TO FIREBASE ---------- */

        submitButton.disabled = true;
        submitButton.textContent = "Submitting Booking...";

        showMessage(
            "Please wait while we submit your booking...",
            "success"
        );

        try {

            const bookingRef = await addDoc(
                collection(db, "bookings"),
                bookingData
            );

            console.log(
                "EVENTORA booking created:",
                bookingRef.id
            );

            showMessage(
                "Your booking enquiry has been submitted successfully! EVENTORA will contact you soon.",
                "success"
            );

            bookingForm.reset();

        } catch (error) {

            console.error(
                "EVENTORA booking submission error:",
                error
            );

            showMessage(
                "Sorry, we could not submit your booking. Please check your internet connection and try again.",
                "error"
            );

        } finally {

            submitButton.disabled = false;
            submitButton.textContent = "Submit Booking";

        }

    });

}


/* ---------- EVENTORA BRANDING ---------- */

console.log("EVENTORA Booking System initialized.");
