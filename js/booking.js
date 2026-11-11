
/* =========================================================
   EVENTORA - CUSTOMER BOOKING SYSTEM
   Firebase Firestore Integration
   File: js/booking.js
========================================================= */

import {
    initializeApp,
    getApps,
    getApp
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js";

import {
    getFirestore,
    collection,
    addDoc,
    serverTimestamp
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


/* ---------- CUSTOMER AUTHENTICATION ---------- */

async function getCustomerUser() {

    if (auth.currentUser) {
        return auth.currentUser;
    }

    const result = await signInAnonymously(auth);

    return result.user;
}


/* ---------- FORM ELEMENTS ---------- */

const bookingForm = document.getElementById("bookingForm");
const submitButton = document.getElementById("submitBooking");
const formMessage = document.getElementById("formMessage");


/* ---------- CHECK FORM ---------- */

if (!bookingForm || !submitButton || !formMessage) {

    console.error(
        "EVENTORA: Booking form elements were not found."
    );

} else {


    /* ---------- DISPLAY MESSAGE ---------- */

    function showMessage(message, type = "success") {

        formMessage.textContent = message;

        formMessage.style.display = "block";
        formMessage.style.padding = "12px 15px";
        formMessage.style.marginTop = "15px";
        formMessage.style.borderRadius = "8px";
        formMessage.style.fontSize = "14px";

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


    /* ---------- GET FIELD VALUE ---------- */

    function getFieldValue(name) {

        const field = bookingForm.elements.namedItem(name);

        return field ? field.value.trim() : "";
    }


    /* ---------- VALIDATE EMAIL ---------- */

    function isValidEmail(email) {

        return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
    }


    /* ---------- VALIDATE PHONE ---------- */

    function isValidPhone(phone) {

        const cleanedPhone = phone.replace(/[\s()+-]/g, "");

        return /^\d{10,13}$/.test(cleanedPhone);
    }


    /* ---------- VALIDATE EVENT DATE ---------- */

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
        ).map(checkbox => checkbox.value);
    }


    /* ---------- BOOKING SUCCESS DISPLAY ---------- */

    function showBookingSuccess(referenceId) {

        formMessage.replaceChildren();

        const successText = document.createElement("p");

        successText.textContent =
            "Your event enquiry has been submitted successfully!";

        const referenceText = document.createElement("p");

        referenceText.textContent =
            "Your Booking Reference ID: " + referenceId;

        const infoText = document.createElement("p");

        infoText.textContent =
            "EVENTORA will contact you soon regarding your event.";

        const trackLink = document.createElement("a");

        trackLink.href =
            "track-booking.html?ref=" +
            encodeURIComponent(referenceId);

        trackLink.textContent = "Track My Order";

        trackLink.style.display = "inline-block";
        trackLink.style.marginTop = "12px";
        trackLink.style.padding = "12px 24px";
        trackLink.style.background = "#b58a45";
        trackLink.style.color = "#ffffff";
        trackLink.style.textDecoration = "none";
        trackLink.style.borderRadius = "6px";
        trackLink.style.fontWeight = "600";

        trackLink.style.cursor = "pointer";

        formMessage.append(
            successText,
            referenceText,
            infoText,
            trackLink
        );

        formMessage.style.display = "block";
        formMessage.style.padding = "15px";
        formMessage.style.marginTop = "15px";
        formMessage.style.borderRadius = "8px";
        formMessage.style.background = "#e8f5e9";
        formMessage.style.color = "#256438";
        formMessage.style.border = "1px solid #b8dfbd";
    }


    /* ---------- BOOKING FORM SUBMISSION ---------- */

    bookingForm.addEventListener("submit", async function(event) {

        event.preventDefault();

        if (submitButton.disabled) return;


        /* READ CUSTOMER DETAILS */

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


        /* VALIDATION */

        if (
            !name ||
            !phone ||
            !email ||
            !eventType ||
            !date ||
            !guests ||
            !location ||
            !budget
        ) {

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
                "Please enter a valid phone number (10–13 digits).",
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


        /* DISABLE BUTTON */

        submitButton.disabled = true;

        submitButton.textContent = "Submitting Booking...";

        showMessage(
            "Please wait. Your booking enquiry is being submitted...",
            "success"
        );


        try {

            /* CUSTOMER AUTHENTICATION */

            const customer = await getCustomerUser();


            /* PREPARE BOOKING DATA */

            const bookingData = {

                name,
                phone,
                email,
                eventType,
                date,
                guests: guestCount,
                location,
                budget,
                services,
                requirements,

                status: "pending",

                // Important for customer booking tracking
                ownerUid: customer.uid,

                // Firebase server timestamp
                createdAt: serverTimestamp()
            };


            /* SAVE BOOKING TO FIRESTORE */

            const bookingRef = await addDoc(
                collection(db, "bookings"),
                bookingData
            );


            console.log(
                "EVENTORA booking submitted successfully:",
                bookingRef.id
            );


            /* SAVE BOOKING REFERENCE */

            localStorage.setItem(
                "eventoraLastBookingRef",
                bookingRef.id
            );

            let savedReferences = [];

            try {

                savedReferences = JSON.parse(
                    localStorage.getItem("eventoraBookingRefs") || "[]"
                );

                if (!Array.isArray(savedReferences)) {
                    savedReferences = [];
                }

            } catch (storageError) {

                savedReferences = [];
            }

            savedReferences.unshift(bookingRef.id);

            savedReferences = [
                ...new Set(savedReferences)
            ].slice(0, 20);

            localStorage.setItem(
                "eventoraBookingRefs",
                JSON.stringify(savedReferences)
            );


            /* SHOW SUCCESS + TRACK MY ORDER */

            showBookingSuccess(bookingRef.id);

            bookingForm.reset();


        } catch (error) {

            console.error("EVENTORA booking error:", error);

            console.error("Error code:", error.code);

            console.error("Error message:", error.message);

            let errorMessage = "Booking could not be submitted. ";

            if (error.code === "permission-denied") {

                errorMessage +=
                    "Firebase permission denied. Check Firestore rules.";

            } else if (
                error.code === "auth/operation-not-allowed"
            ) {

                errorMessage +=
                    "Enable Anonymous Authentication in Firebase.";

            } else if (
                error.code === "unavailable" ||
                error.code === "failed-precondition"
            ) {

                errorMessage +=
                    "Firebase service is temporarily unavailable. Please try again.";

            } else if (
                error.code === "invalid-argument"
            ) {

                errorMessage +=
                    "Some booking details are invalid. Please check the form.";

            } else {

                errorMessage +=
                    "Please try again. Error: " +
                    (error.code || error.message || "Unknown error");
            }

            showMessage(errorMessage, "error");


        } finally {

            submitButton.disabled = false;

            submitButton.textContent =
                "Submit Booking Enquiry →";
        }

    });

}


/* ---------- EVENTORA BRANDING ---------- */

console.log(
    "EVENTORA Booking System initialized successfully."
);
