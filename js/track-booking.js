
/* =========================================================
   EVENTORA - ADVANCED CUSTOMER BOOKING TRACKING
   Firebase Firestore + Live Booking Status
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

console.log("EVENTORA Advanced Tracking initialized.");


/* =========================================================
   3. HTML ELEMENTS
========================================================= */

const trackingForm = document.getElementById("trackingForm");
const referenceInput = document.getElementById("bookingReference");
const trackButton = document.getElementById("trackButton");

const trackingMessage = document.getElementById("trackingMessage");
const bookingDetails = document.getElementById("bookingDetails");


/* =========================================================
   4. BOOKING STATUS INFORMATION
========================================================= */

const statusInformation = {

    pending: {
        label: "Pending",
        description: "Your enquiry has been received. EVENTORA will review your booking.",
        step: 1
    },

    accepted: {
        label: "Accepted",
        description: "Your booking has been accepted by EVENTORA.",
        step: 2
    },

    "in progress": {
        label: "In Progress",
        description: "Our team is preparing and organizing your event.",
        step: 3
    },

    completed: {
        label: "Completed",
        description: "Your event booking has been completed successfully.",
        step: 4
    },

    rejected: {
        label: "Rejected",
        description: "Your booking request was not accepted. Please contact EVENTORA.",
        step: 0
    },

    cancelled: {
        label: "Cancelled",
        description: "This booking has been cancelled.",
        step: 0
    }

};


/* =========================================================
   5. AUTHENTICATION
========================================================= */

function waitForAuth() {

    return new Promise((resolve, reject) => {

        const unsubscribe = onAuthStateChanged(
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

    let customer = await waitForAuth();

    if (!customer) {

        const result = await signInAnonymously(auth);

        customer = result.user;

    }

    return customer;
}


/* =========================================================
   6. MESSAGE DISPLAY
========================================================= */

function showMessage(message, success = false) {

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

    if (bookingDetails) {
        bookingDetails.replaceChildren();
    }
}


/* =========================================================
   7. HELPER FUNCTIONS
========================================================= */

function formatRupees(amount) {

    return new Intl.NumberFormat("en-IN", {
        style: "currency",
        currency: "INR",
        maximumFractionDigits: 0
    }).format(Number(amount) || 0);

}


function addDetail(container, label, value) {

    const row = document.createElement("div");

    row.className = "detail-row";

    const left = document.createElement("span");

    left.className = "detail-label";
    left.textContent = label;

    const right = document.createElement("span");

    right.className = "detail-value";

    if (
        value === undefined ||
        value === null ||
        value === ""
    ) {
        right.textContent = "Not provided";
    } else {
        right.textContent = String(value);
    }

    row.append(left, right);

    container.appendChild(row);

}


function createHeading(text) {

    const heading = document.createElement("h3");

    heading.textContent = text;

    return heading;

}


/* =========================================================
   8. BOOKING PROGRESS TIMELINE
========================================================= */

function createTimeline(status, container) {

    const timeline = document.createElement("div");

    timeline.className = "booking-timeline";

    const heading = createHeading("Booking Progress");

    timeline.appendChild(heading);

    const currentStatus =
        statusInformation[status] ||
        statusInformation.pending;

    const steps = [
        "Booking Received",
        "Booking Accepted",
        "Event Preparation",
        "Booking Completed"
    ];

    if (status === "rejected" || status === "cancelled") {

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
            stepNumber < currentStatus.step ? "✓" : stepNumber;

        const content = document.createElement("div");

        content.className = "timeline-content";

        const title = document.createElement("strong");

        title.textContent = step;

        content.appendChild(title);

        if (stepNumber === currentStatus.step) {

            const description = document.createElement("p");

            description.textContent = currentStatus.description;

            content.appendChild(description);
        }

        item.append(marker, content);

        timeline.appendChild(item);

    });

    container.appendChild(timeline);

}


/* =========================================================
   9. DISPLAY BOOKING STATUS
========================================================= */

function displayStatus(data, section) {

    const rawStatus = String(
        data.status || "pending"
    ).toLowerCase().trim();

    const normalizedStatus = rawStatus.replace(/_/g, " ");

    const statusData =
        statusInformation[normalizedStatus] ||
        statusInformation.pending;

    const statusSection = document.createElement("div");

    statusSection.className = "booking-status-section";

    const heading = createHeading("Current Booking Status");

    const statusBadge = document.createElement("span");

    statusBadge.className =
        "status " +
        (
            ["pending", "accepted", "completed", "rejected", "cancelled"]
                .includes(normalizedStatus)
                ? normalizedStatus
                : "pending"
        ).replace(/\s+/g, "-");

    statusBadge.textContent = statusData.label;

    const description = document.createElement("p");

    description.textContent = statusData.description;

    statusSection.append(
        heading,
        statusBadge,
        description
    );

    section.appendChild(statusSection);

    createTimeline(normalizedStatus, section);

}


/* =========================================================
   10. DISPLAY SERVICE BUDGET BREAKDOWN
========================================================= */

function displayServiceAllocation(data, section) {

    const allocation =
        data.serviceBudgetAllocation || {};

    const heading = createHeading("Service-wise Budget Breakdown");

    section.appendChild(heading);

    const services = Array.isArray(data.services)
        ? data.services
        : [];

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

        serviceAmount.textContent = formatRupees(
            allocation[service] || 0
        );

        row.append(serviceName, serviceAmount);

        section.appendChild(row);

    });

    addDetail(
        section,
        "Total Event Budget",
        formatRupees(data.totalBudget)
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
   11. DISPLAY ADVANCE BOOKING INFORMATION
========================================================= */

function displayAdvancePayment(data, section) {

    section.appendChild(
        createHeading("Advance Booking")
    );

    addDetail(
        section,
        "Advance Booking",
        data.advanceBooking ? "Selected" : "Not Selected"
    );

    addDetail(
        section,
        "Advance Amount",
        formatRupees(data.advanceAmount || 0)
    );

    const note = document.createElement("p");

    note.className = "payment-note";

    note.textContent =
        "Payment confirmation should be verified by EVENTORA. " +
        "Selecting advance booking does not itself confirm payment.";

    section.appendChild(note);

}


/* =========================================================
   12. DISPLAY COMPLETE BOOKING DETAILS
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


    /* CUSTOMER DETAILS */

    wrapper.appendChild(
        createHeading("Customer Information")
    );

    addDetail(wrapper, "Reference ID", reference);
    addDetail(wrapper, "Customer Name", data.name);
    addDetail(wrapper, "Phone Number", data.phone);
    addDetail(wrapper, "Email Address", data.email);


    /* EVENT DETAILS */

    wrapper.appendChild(
        createHeading("Event Information")
    );

    addDetail(wrapper, "Event Type", data.eventType);
    addDetail(wrapper, "Event Date", data.date);
    addDetail(wrapper, "Expected Guests", data.guests);
    addDetail(wrapper, "Location", data.location);


    /* BUDGET DETAILS */

    wrapper.appendChild(
        createHeading("Budget Information")
    );

    addDetail(
        wrapper,
        "Selected Budget",
        formatRupees(data.totalBudget)
    );

    addDetail(
        wrapper,
        "Budget Selection",
        data.budgetSelection
    );

    addDetail(
        wrapper,
        "Automatically Suggested Guests",
        data.suggestedGuests || "Not available"
    );


    /* SERVICE DETAILS */

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

    }

    wrapper.appendChild(serviceList);


    /* SERVICE ALLOCATION */

    displayServiceAllocation(data, wrapper);


    /* ADVANCE PAYMENT */

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


    /* FINAL UPDATE */

    const updateNote = document.createElement("p");

    updateNote.className = "tracking-update-note";

    updateNote.textContent =
        "This page updates automatically when EVENTORA changes your booking status.";

    wrapper.appendChild(updateNote);

    bookingDetails.appendChild(wrapper);

    showMessage(
        "Booking found! Your latest booking information is displayed below.",
        true
    );

}


/* =========================================================
   13. LIVE BOOKING TRACKING
========================================================= */

let unsubscribeBooking = null;

let trackingRequest = 0;

async function trackBooking(reference) {

    const cleanReference = String(reference || "").trim();

    if (!cleanReference) {

        showMessage("Please enter your booking reference ID.");

        return;
    }

    // Stop previous live listener.
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

                if (!snapshot.exists()) {

                    unsubscribeBooking?.();

                    unsubscribeBooking = null;

                    showMessage(
                        "Booking not found. Please check your reference ID."
                    );

                    return;
                }

                const bookingData = snapshot.data();


                /* CUSTOMER OWNERSHIP CHECK */

                if (bookingData.ownerUid !== customer.uid) {

                    unsubscribeBooking?.();

                    unsubscribeBooking = null;

                    showMessage(
                        "This booking cannot be accessed from this browser. " +
                        "Please use the same browser and device used to submit it."
                    );

                    return;
                }


                /* DISPLAY LATEST BOOKING */

                displayBooking(
                    bookingData,
                    cleanReference
                );

            },

            error => {

                console.error(
                    "EVENTORA live tracking error:",
                    error
                );

                if (error.code === "permission-denied") {

                    showMessage(
                        "Access denied. Please check your Firebase security rules " +
                        "and use the browser used to submit this booking."
                    );

                } else {

                    showMessage(
                        "Unable to retrieve booking details. Please try again."
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
            "EVENTORA tracking error:",
            error
        );

        if (error.code === "auth/operation-not-allowed") {

            showMessage(
                "Anonymous Authentication is not enabled in Firebase."
            );

        } else {

            showMessage(
                "Unable to check your booking. Please try again. " +
                (error.code || "")
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
   14. TRACKING FORM SUBMISSION
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
        "EVENTORA: Tracking HTML elements are missing. Check track-booking.html."
    );

}


/* =========================================================
   15. LOAD SAVED BOOKING REFERENCE
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

    console.warn("Could not read saved booking reference.");

}


if (referenceInput) {

    if (urlReference) {

        referenceInput.value = urlReference;

    } else if (savedReference) {

        referenceInput.value = savedReference;

    }

}


/* =========================================================
   16. AUTOMATICALLY TRACK URL REFERENCE
========================================================= */

if (urlReference && referenceInput && trackingForm) {

    trackBooking(urlReference);

}


/* =========================================================
   17. INITIALIZATION
========================================================= */

console.log(
    "EVENTORA live booking tracking is ready."
);
