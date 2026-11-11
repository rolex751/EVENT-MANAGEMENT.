
/* =========================================================
   EVENTORA - ADVANCED CUSTOMER BOOKING TRACKING
   Firebase Firestore + LIVE Booking Status
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
    onSnapshot
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";

import {
    getAuth,
    signInAnonymously,
    onAuthStateChanged
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js";


/* =========================================================
   1. FIREBASE CONFIGURATION
========================================================= */

const firebaseConfig = {
    apiKey: "AIzaSyA184UnR0cJ0DEm9yj0UN44y0VM1SgTxa8Q",
    authDomain: "event-management-93edc.firebaseapp.com",
    projectId: "event-management-93edc",
    storageBucket: "event-management-93edc.firebasestorage.app",
    messagingSenderId: "327602461080",
    appId: "1:327602461080:web:eb96abf94de99d1bac73ed",
    measurementId: "G-NFFDH9C4ZF"
};


/* =========================================================
   2. INITIALIZE FIREBASE
========================================================= */

const app = getApps().length
    ? getApp()
    : initializeApp(firebaseConfig);

const db = getFirestore(app);
const auth = getAuth(app);

console.log("EVENTORA Live Tracking Initialized");


/* =========================================================
   3. HTML ELEMENTS
========================================================= */

const trackingForm = document.getElementById("trackingForm");
const referenceInput = document.getElementById("bookingReference");
const trackButton = document.getElementById("trackButton");

const trackingMessage = document.getElementById("trackingMessage");
const bookingDetails = document.getElementById("bookingDetails");


/* =========================================================
   4. ADDITIONAL TRACKING STYLES
========================================================= */

const trackingStyles = document.createElement("style");

trackingStyles.textContent = `
    .booking-status-section {
        padding: 20px;
        background: #faf7f1;
        border-radius: 12px;
        margin: 20px 0;
    }

    .booking-status-section h3 {
        margin-bottom: 12px;
        color: #3c2b20;
    }

    .status {
        display: inline-block;
        padding: 8px 16px;
        border-radius: 30px;
        background: #fff2d8;
        color: #94651c;
        font-weight: 700;
        font-size: 13px;
        text-transform: capitalize;
    }

    .status.accepted,
    .status.confirmed {
        background: #e5f5e9;
        color: #23834b;
    }

    .status.in-progress {
        background: #e7f0ff;
        color: #2464a0;
    }

    .status.completed {
        background: #e5efff;
        color: #2464a0;
    }

    .status.rejected,
    .status.cancelled {
        background: #ffe9e7;
        color: #b83232;
    }

    .booking-timeline {
        padding: 20px;
        margin: 22px 0;
        border: 1px solid #eee7dc;
        border-radius: 12px;
    }

    .booking-timeline h3 {
        margin-bottom: 20px;
        color: #3c2b20;
    }

    .timeline-step {
        display: flex;
        align-items: flex-start;
        gap: 15px;
        position: relative;
        padding-bottom: 22px;
    }

    .timeline-step:last-child {
        padding-bottom: 0;
    }

    .timeline-marker {
        min-width: 32px;
        height: 32px;
        border-radius: 50%;
        display: flex;
        align-items: center;
        justify-content: center;
        background: #e8e3db;
        color: #777;
        font-weight: 700;
        z-index: 1;
    }

    .timeline-step.completed .timeline-marker,
    .timeline-step.active .timeline-marker {
        background: #b58a45;
        color: white;
    }

    .timeline-content strong {
        color: #3c2b20;
        display: block;
        margin: 5px 0;
    }

    .timeline-content p,
    .timeline-message {
        color: #777;
        line-height: 1.6;
        font-size: 14px;
        margin-top: 5px;
    }

    .tracking-services {
        display: flex;
        flex-wrap: wrap;
        gap: 9px;
        margin: 12px 0 22px;
    }

    .tracking-service {
        display: inline-block;
        padding: 8px 13px;
        background: #f8f3e9;
        color: #71542c;
        border-radius: 20px;
        font-size: 13px;
        font-weight: 600;
    }

    .tracking-budget-row {
        padding: 12px 0;
        border-bottom: 1px solid #eee;
    }

    .tracking-budget-row:last-child {
        border-bottom: none;
    }

    .payment-note,
    .tracking-update-note {
        color: #777;
        font-size: 13px;
        line-height: 1.7;
        margin-top: 15px;
    }

    .tracking-update-note {
        padding: 13px;
        background: #faf7f1;
        border-radius: 8px;
        text-align: center;
    }

    .booking-details h3 {
        color: #3c2b20;
        margin: 24px 0 12px;
    }

    @media(max-width: 600px) {
        .booking-timeline {
            padding: 15px;
        }

        .timeline-step {
            gap: 10px;
        }
    }
`;

document.head.appendChild(trackingStyles);


/* =========================================================
   5. BOOKING STATUS INFORMATION
========================================================= */

const statusInformation = {

    pending: {
        label: "Pending",
        description:
            "Your enquiry has been received. EVENTORA will review your booking.",
        step: 1
    },

    accepted: {
        label: "Accepted",
        description:
            "Your booking has been accepted by EVENTORA.",
        step: 2
    },

    confirmed: {
        label: "Confirmed",
        description:
            "Your booking has been confirmed by EVENTORA.",
        step: 2
    },

    "in progress": {
        label: "In Progress",
        description:
            "Our team is preparing and organizing your event.",
        step: 3
    },

    completed: {
        label: "Completed",
        description:
            "Your event booking has been completed successfully.",
        step: 4
    },

    rejected: {
        label: "Rejected",
        description:
            "Your booking request was not accepted. Please contact EVENTORA.",
        step: 0
    },

    cancelled: {
        label: "Cancelled",
        description:
            "This booking has been cancelled.",
        step: 0
    }

};


/* =========================================================
   6. AUTHENTICATION
========================================================= */

function waitForAuth() {

    return new Promise((resolve, reject) => {

        let unsubscribe = () => {};

        unsubscribe = onAuthStateChanged(
            auth,
            user => {
                unsubscribe();
                resolve(user);
            },
            error => {
                unsubscribe();
                reject(error);
            }
        );

    });

}


async function getCustomerUser() {

    let customer = auth.currentUser;

    if (!customer) {
        customer = await waitForAuth();
    }

    if (!customer) {

        const result = await signInAnonymously(auth);

        customer = result.user;

    }

    return customer;

}


/* =========================================================
   7. MESSAGE DISPLAY
   FIX: DO NOT CLEAR BOOKING DETAILS AFTER SUCCESS
========================================================= */

function showMessage(
    message,
    success = false,
    clearDetails = true
) {

    if (!trackingMessage) return;

    trackingMessage.textContent = message;

    trackingMessage.style.display = "block";
    trackingMessage.style.padding = "14px";
    trackingMessage.style.margin = "15px 0";
    trackingMessage.style.borderRadius = "8px";

    trackingMessage.style.background = success
        ? "#e8f5e9"
        : "#fff0ee";

    trackingMessage.style.color = success
        ? "#256438"
        : "#a33b32";

    // Clear details only when displaying a new search/error.
    if (clearDetails && bookingDetails) {
        bookingDetails.replaceChildren();
    }

}


/* =========================================================
   8. HELPER FUNCTIONS
========================================================= */

function formatRupees(amount) {

    if (
        amount === null ||
        amount === undefined ||
        amount === ""
    ) {
        return "Not provided";
    }

    const number = Number(amount);

    if (!Number.isFinite(number)) {
        return "Not provided";
    }

    return new Intl.NumberFormat("en-IN", {
        style: "currency",
        currency: "INR",
        maximumFractionDigits: 0
    }).format(number);

}


function formatValue(value) {

    if (
        value === undefined ||
        value === null ||
        value === ""
    ) {
        return "Not provided";
    }

    if (Array.isArray(value)) {
        return value.length
            ? value.join(", ")
            : "Not provided";
    }

    if (typeof value === "object") {
        return Object.entries(value)
            .map(([key, item]) => `${key}: ${item}`)
            .join(", ");
    }

    return String(value);

}


function addDetail(container, label, value) {

    const row = document.createElement("div");

    row.className = "detail-row";

    const left = document.createElement("span");

    left.className = "detail-label";
    left.textContent = label;

    const right = document.createElement("span");

    right.className = "detail-value";
    right.textContent = formatValue(value);

    row.append(left, right);

    container.appendChild(row);

}


function createHeading(text) {

    const heading = document.createElement("h3");

    heading.textContent = text;

    return heading;

}


function normalizeStatus(value) {

    return String(value || "pending")
        .trim()
        .toLowerCase()
        .replace(/_/g, " ")
        .replace(/-/g, " ");

}


/* =========================================================
   9. BOOKING PROGRESS TIMELINE
========================================================= */

function createTimeline(status, container) {

    const timeline = document.createElement("div");

    timeline.className = "booking-timeline";

    timeline.appendChild(
        createHeading("Booking Progress")
    );

    const currentStatus =
        statusInformation[status] ||
        statusInformation.pending;

    const steps = [
        "Booking Received",
        "Booking Accepted",
        "Event Preparation",
        "Booking Completed"
    ];

    if (
        status === "rejected" ||
        status === "cancelled"
    ) {

        const message = document.createElement("p");

        message.className = "timeline-message";
        message.textContent = currentStatus.description;

        timeline.appendChild(message);

        container.appendChild(timeline);

        return;

    }

    steps.forEach((step, index) => {

        const stepNumber = index + 1;

        const item = document.createElement("div");

        item.className = "timeline-step";

        if (stepNumber < currentStatus.step) {
            item.classList.add("completed");
        }

        if (stepNumber === currentStatus.step) {
            item.classList.add("active");
        }

        const marker = document.createElement("span");

        marker.className = "timeline-marker";

        marker.textContent =
            stepNumber < currentStatus.step
                ? "✓"
                : stepNumber;

        const content = document.createElement("div");

        content.className = "timeline-content";

        const title = document.createElement("strong");

        title.textContent = step;

        content.appendChild(title);

        if (stepNumber === currentStatus.step) {

            const description = document.createElement("p");

            description.textContent =
                currentStatus.description;

            content.appendChild(description);

        }

        item.append(marker, content);

        timeline.appendChild(item);

    });

    container.appendChild(timeline);

}


/* =========================================================
   10. DISPLAY BOOKING STATUS
========================================================= */

function displayStatus(data, section) {

    const normalizedStatus = normalizeStatus(data.status);

    const statusData =
        statusInformation[normalizedStatus] ||
        statusInformation.pending;

    const statusSection = document.createElement("div");

    statusSection.className = "booking-status-section";

    const heading = createHeading("Current Booking Status");

    const statusBadge = document.createElement("span");

    statusBadge.className =
        "status " + normalizedStatus.replace(/\s+/g, "-");

    statusBadge.textContent = statusData.label;

    const description = document.createElement("p");

    description.textContent = statusData.description;

    description.style.marginTop = "12px";
    description.style.lineHeight = "1.6";

    statusSection.append(
        heading,
        statusBadge,
        description
    );

    section.appendChild(statusSection);

    createTimeline(normalizedStatus, section);

}


/* =========================================================
   11. DISPLAY SERVICE BUDGET BREAKDOWN
========================================================= */

function displayServiceAllocation(data, section) {

    const allocation = data.serviceBudgetAllocation || {};

    const services = Array.isArray(data.services)
        ? data.services
        : [];

    section.appendChild(
        createHeading("Service-Wise Budget Breakdown")
    );

    if (services.length === 0) {

        const message = document.createElement("p");

        message.textContent = "No services were selected.";

        section.appendChild(message);

        return;

    }

    services.forEach(service => {

        const row = document.createElement("div");

        row.className = "detail-row";

        const serviceName = document.createElement("span");

        serviceName.textContent = service;

        const serviceAmount = document.createElement("strong");

        let amount = 0;

        if (Array.isArray(allocation)) {

            const matchingService = allocation.find(item =>
                item &&
                (item.service === service || item.name === service)
            );

            if (matchingService) {
                amount = Number(
                    matchingService.amount ??
                    matchingService.budget ??
                    matchingService.allocated ??
                    0
                );
            }

        } else if (typeof allocation === "object") {

            const entry = allocation[service];

            amount = Number(
                typeof entry === "object" && entry !== null
                    ? entry.amount ?? entry.budget ?? entry.allocated ?? 0
                    : entry ?? 0
            );

        }

        serviceAmount.textContent = formatRupees(amount);

        row.append(serviceName, serviceAmount);

        section.appendChild(row);

    });

    addDetail(
        section,
        "Total Event Budget",
        formatRupees(data.totalBudget ?? data.budget)
    );

    addDetail(
        section,
        "Total Allocated",
        formatRupees(data.allocatedBudget)
    );

    addDetail(
        section,
        "Remaining Budget",
        formatRupees(data.remainingBudget)
    );

}


/* =========================================================
   12. DISPLAY ADVANCE BOOKING INFORMATION
========================================================= */

function displayAdvancePayment(data, section) {

    section.appendChild(
        createHeading("Advance Booking & Payment")
    );

    const advanceSelected =
        data.advanceBooking === true ||
        String(data.advanceBooking).toLowerCase() === "true" ||
        String(data.advanceBooking).toLowerCase() === "yes";

    addDetail(
        section,
        "Advance Booking",
        advanceSelected ? "Selected" : "Not Selected"
    );

    addDetail(
        section,
        "Advance Amount",
        formatRupees(data.advanceAmount)
    );

    const note = document.createElement("p");

    note.className = "payment-note";

    note.textContent =
        "Payment confirmation must be verified by EVENTORA. " +
        "Selecting advance booking does not itself confirm payment.";

    section.appendChild(note);

}


/* =========================================================
   13. DISPLAY COMPLETE BOOKING DETAILS
========================================================= */

function displayBooking(data, reference) {

    if (!bookingDetails) return;

    bookingDetails.replaceChildren();

    const wrapper = document.createElement("div");

    wrapper.className = "booking-details";

    const title = document.createElement("h2");

    title.textContent = "Your EVENTORA Booking";

    wrapper.appendChild(title);


    /* BOOKING STATUS */

    displayStatus(data, wrapper);


    /* CUSTOMER INFORMATION */

    wrapper.appendChild(
        createHeading("Customer Information")
    );

    addDetail(wrapper, "Reference ID", reference);
    addDetail(wrapper, "Customer Name", data.name);
    addDetail(wrapper, "Phone Number", data.phone);
    addDetail(wrapper, "Email Address", data.email);


    /* EVENT INFORMATION */

    wrapper.appendChild(
        createHeading("Event Information")
    );

    addDetail(wrapper, "Event Type", data.eventType);
    addDetail(wrapper, "Event Date", data.date);
    addDetail(wrapper, "Expected Guests", data.guests);

    addDetail(
        wrapper,
        "Automatically Suggested Guests",
        data.suggestedGuests
    );

    addDetail(wrapper, "Location", data.location);


    /* BUDGET INFORMATION */

    wrapper.appendChild(
        createHeading("Budget Information")
    );

    addDetail(
        wrapper,
        "Selected Budget",
        formatRupees(data.totalBudget ?? data.budget)
    );

    addDetail(
        wrapper,
        "Budget Selection",
        data.budgetSelection
    );

    addDetail(
        wrapper,
        "Guest Estimate Method",
        data.guestEstimateMethod
    );


    /* SELECTED SERVICES */

    wrapper.appendChild(
        createHeading("Selected Services")
    );

    const serviceList = document.createElement("div");

    serviceList.className = "tracking-services";

    if (Array.isArray(data.services)) {

        data.services.forEach(service => {

            const item = document.createElement("span");

            item.className = "tracking-service";
            item.textContent = service;

            serviceList.appendChild(item);

        });

    } else {

        const message = document.createElement("p");

        message.textContent = "No services were provided.";

        serviceList.appendChild(message);

    }

    wrapper.appendChild(serviceList);


    /* SERVICE BUDGET ALLOCATION */

    displayServiceAllocation(data, wrapper);


    /* ADVANCE BOOKING */

    displayAdvancePayment(data, wrapper);


    /* ADDITIONAL REQUIREMENTS */

    wrapper.appendChild(
        createHeading("Additional Requirements")
    );

    addDetail(
        wrapper,
        "Customer Requirements",
        data.requirements
    );


    /* AUTOMATIC UPDATE MESSAGE */

    const updateNote = document.createElement("p");

    updateNote.className = "tracking-update-note";

    updateNote.textContent =
        "Live tracking is active. Your booking information " +
        "will update automatically when EVENTORA changes it.";

    wrapper.appendChild(updateNote);

    bookingDetails.appendChild(wrapper);


    // IMPORTANT FIX:
    // Keep the displayed booking details visible.
    showMessage(
        "Booking found! Your latest booking information is displayed below.",
        true,
        false
    );

}


/* =========================================================
   14. LIVE BOOKING TRACKING
========================================================= */

let unsubscribeBooking = null;

let trackingRequest = 0;


async function trackBooking(reference) {

    const cleanReference = String(reference || "").trim();

    if (!cleanReference) {

        showMessage("Please enter your booking reference ID.");

        return;

    }


    // Stop any previous live listener.

    if (unsubscribeBooking) {

        unsubscribeBooking();

        unsubscribeBooking = null;

    }


    const requestNumber = ++trackingRequest;

    trackButton.disabled = true;

    trackButton.textContent = "Checking Booking...";

    showMessage("Please wait. Checking your booking...");


    try {

        /* CUSTOMER AUTHENTICATION */

        const customer = await getCustomerUser();

        if (requestNumber !== trackingRequest) return;


        /* FIRESTORE DOCUMENT */

        const bookingReference = doc(
            db,
            "bookings",
            cleanReference
        );


        /* LIVE FIRESTORE LISTENER */

        unsubscribeBooking = onSnapshot(

            bookingReference,

            snapshot => {

                if (requestNumber !== trackingRequest) return;


                /* BOOKING NOT FOUND */

                if (!snapshot.exists()) {

                    if (unsubscribeBooking) {
                        unsubscribeBooking();
                        unsubscribeBooking = null;
                    }

                    showMessage(
                        "Booking not found. Please check your reference ID."
                    );

                    return;

                }


                const bookingData = snapshot.data();


                /* CUSTOMER OWNERSHIP CHECK */

                if (
                    !bookingData.ownerUid ||
                    bookingData.ownerUid !== customer.uid
                ) {

                    if (unsubscribeBooking) {
                        unsubscribeBooking();
                        unsubscribeBooking = null;
                    }

                    showMessage(
                        "This booking cannot be accessed from this browser. " +
                        "Please use the same browser and device used to submit it."
                    );

                    return;

                }


                /* SAVE REFERENCE */

                try {

                    localStorage.setItem(
                        "eventoraLastBookingRef",
                        cleanReference
                    );

                } catch (error) {

                    console.warn(
                        "Could not save booking reference."
                    );

                }


                /* DISPLAY LATEST INFORMATION */

                displayBooking(
                    bookingData,
                    cleanReference
                );

            },

            error => {

                console.error(
                    "EVENTORA Live Tracking Error:",
                    error
                );

                if (error.code === "permission-denied") {

                    showMessage(
                        "Access denied. Please check your Firebase security rules " +
                        "and use the browser used to submit this booking."
                    );

                } else {

                    showMessage(
                        "Unable to retrieve booking details. Please try again. " +
                        (error.code || "")
                    );

                }

                if (unsubscribeBooking) {

                    unsubscribeBooking();

                    unsubscribeBooking = null;

                }

            }

        );

    } catch (error) {

        console.error(
            "EVENTORA Authentication Error:",
            error
        );

        if (error.code === "auth/operation-not-allowed") {

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

        if (requestNumber === trackingRequest) {

            trackButton.disabled = false;

            trackButton.textContent = "Track My Booking";

        }

    }

}


/* =========================================================
   15. TRACKING FORM SUBMISSION
========================================================= */

if (
    trackingForm &&
    referenceInput &&
    trackButton &&
    trackingMessage &&
    bookingDetails
) {

    trackingForm.addEventListener("submit", function(event) {

        event.preventDefault();

        trackBooking(referenceInput.value);

    });

} else {

    console.error(
        "EVENTORA: Tracking HTML elements are missing. " +
        "Please check track-booking.html."
    );

}


/* =========================================================
   16. LOAD SAVED BOOKING REFERENCE
========================================================= */

const urlReference = new URLSearchParams(
    window.location.search
).get("ref");

let savedReference = "";

try {

    savedReference =
        localStorage.getItem("eventoraBookingRef") ||
        localStorage.getItem("eventoraBookingId") ||
        localStorage.getItem("eventoraLastBookingRef") ||
        "";

} catch (error) {

    console.warn(
        "EVENTORA could not read saved booking reference."
    );

}


if (referenceInput) {

    if (urlReference) {

        referenceInput.value = urlReference;

    } else if (savedReference) {

        referenceInput.value = savedReference;

    }

}


/* =========================================================
   17. AUTOMATICALLY TRACK URL REFERENCE
========================================================= */

if (
    urlReference &&
    referenceInput &&
    trackingForm &&
    trackButton
) {

    trackBooking(urlReference);

}


/* =========================================================
   18. INITIALIZATION
========================================================= */

console.log(
    "EVENTORA Advanced Live Booking Tracking Ready."
);
