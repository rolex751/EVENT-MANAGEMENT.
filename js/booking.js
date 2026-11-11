
/* =========================================================
   EVENTORA - CUSTOMER BOOKING SYSTEM
   Firebase Firestore Integration
   Service-Wise Budget Allocation
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

const budgetInput = document.getElementById("budget");

const allocationPanel = document.getElementById("allocationPanel");
const allocationEmpty = document.getElementById("allocationEmpty");
const allocationRows = document.getElementById("allocationRows");

const allocationBudget = document.getElementById("allocationBudget");
const allocationTotal = document.getElementById("allocationTotal");
const allocationRemaining = document.getElementById("allocationRemaining");
const allocationStatus = document.getElementById("allocationStatus");

const suggestSplitButton = document.getElementById("suggestSplitButton");

const advanceBookingInput = document.getElementById("advanceBooking");


/* ---------- CURRENCY FORMAT ---------- */

function formatRupees(amount) {

    return new Intl.NumberFormat("en-IN", {
        style: "currency",
        currency: "INR",
        maximumFractionDigits: 0
    }).format(amount);
}


/* ---------- GET TOTAL BUDGET ---------- */

function getTotalBudget() {

    const amount = Number(budgetInput?.value);

    if (!Number.isSafeInteger(amount) || amount < 1) {
        return 0;
    }

    return amount;
}


/* ---------- GET SELECTED SERVICES ---------- */

function getSelectedServices() {

    return Array.from(
        bookingForm.querySelectorAll(
            'input[name="services"]:checked'
        )
    ).map(checkbox => checkbox.value);
}


/* ---------- GET SERVICE ALLOCATION INPUTS ---------- */

function getAllocationInputs() {

    return Array.from(
        allocationRows.querySelectorAll(".allocation-input")
    );
}


/* ---------- UPDATE ALLOCATION SUMMARY ---------- */

function updateAllocationSummary() {

    const totalBudget = getTotalBudget();

    const inputs = getAllocationInputs();

    let allocatedTotal = 0;

    inputs.forEach(input => {

        const amount = Number(input.value);

        if (
            input.value.trim() !== "" &&
            Number.isSafeInteger(amount) &&
            amount >= 0
        ) {
            allocatedTotal += amount;
        }
    });

    const remaining = totalBudget - allocatedTotal;

    allocationBudget.textContent = formatRupees(totalBudget);
    allocationTotal.textContent = formatRupees(allocatedTotal);
    allocationRemaining.textContent = formatRupees(remaining);

    allocationStatus.className = "allocation-status";

    if (inputs.length === 0) {

        allocationStatus.textContent =
            "Select at least one service to allocate your budget.";

        return;
    }

    if (totalBudget < 1) {

        allocationStatus.textContent =
            "Enter your total event budget above.";

        return;
    }

    if (allocatedTotal > totalBudget) {

        allocationStatus.textContent =
            "Your allocated amount exceeds your total budget. Please reduce one or more service amounts.";

        allocationStatus.classList.add("error");

        return;
    }

    if (allocatedTotal === totalBudget) {

        allocationStatus.textContent =
            "Your full budget has been allocated successfully.";

        allocationStatus.classList.add("success");

        return;
    }

    allocationStatus.textContent =
        "You have " + formatRupees(remaining) +
        " remaining. You can allocate it later or leave it unallocated.";

    allocationStatus.classList.add("success");
}


/* ---------- SUGGEST AN EQUAL BUDGET SPLIT ---------- */

function suggestEqualSplit() {

    const services = getSelectedServices();

    const totalBudget = getTotalBudget();

    if (services.length === 0) {
        return;
    }

    let baseAmount = 0;
    let remainder = 0;

    if (totalBudget > 0) {

        baseAmount = Math.floor(totalBudget / services.length);

        remainder = totalBudget % services.length;
    }

    services.forEach((service, index) => {

        const input = allocationRows.querySelector(
            `.allocation-input[data-service="${CSS.escape(service)}"]`
        );

        if (!input) {
            return;
        }

        // Distribute remaining rupees one by one.
        const suggestedAmount =
            baseAmount + (index < remainder ? 1 : 0);

        input.value = suggestedAmount;
    });

    updateAllocationSummary();
}


/* ---------- CREATE SERVICE ALLOCATION ROW ---------- */

function createAllocationRow(service, amount) {

    const row = document.createElement("div");

    row.className = "allocation-row";

    const serviceName = document.createElement("label");

    serviceName.className = "allocation-service-name";
    serviceName.textContent = service;

    const inputWrap = document.createElement("div");

    inputWrap.className = "allocation-input-wrap";

    const currencySymbol = document.createElement("span");

    currencySymbol.textContent = "₹";

    const input = document.createElement("input");

    input.type = "number";
    input.min = "0";
    input.step = "1";
    input.required = true;
    input.inputMode = "numeric";
    input.className = "allocation-input";
    input.dataset.service = service;
    input.value = amount;

    input.setAttribute(
        "aria-label",
        "Budget allocated for " + service
    );

    input.addEventListener("input", updateAllocationSummary);

    serviceName.htmlFor = "allocation-" +
        service.toLowerCase().replace(/[^a-z0-9]+/g, "-");

    input.id = serviceName.htmlFor;

    inputWrap.append(currencySymbol, input);

    row.append(serviceName, inputWrap);

    return row;
}


/* ---------- RENDER SERVICE ALLOCATION FIELDS ---------- */

function renderAllocationFields() {

    const services = getSelectedServices();

    allocationRows.replaceChildren();

    if (services.length === 0) {

        allocationPanel.hidden = true;
        allocationEmpty.hidden = false;

        updateAllocationSummary();

        return;
    }

    allocationPanel.hidden = false;
    allocationEmpty.hidden = true;

    services.forEach(service => {

        allocationRows.appendChild(
            createAllocationRow(service, 0)
        );

    });

    // Automatically suggest an equal split for selected services.
    suggestEqualSplit();
}


/* ---------- VALIDATE SERVICE ALLOCATION ---------- */

function validateServiceAllocation() {

    const totalBudget = getTotalBudget();

    const services = getSelectedServices();

    if (!Number.isSafeInteger(totalBudget) || totalBudget < 1) {

        return {
            valid: false,
            message: "Please enter a valid total event budget in rupees."
        };
    }

    if (services.length === 0) {

        return {
            valid: false,
            message: "Please select at least one service for your event."
        };
    }

    const inputs = getAllocationInputs();

    if (inputs.length !== services.length) {

        return {
            valid: false,
            message: "Please select your services and check the budget allocation."
        };
    }

    const serviceBudgetAllocation = {};

    let allocatedTotal = 0;

    for (const input of inputs) {

        const service = input.dataset.service;
        const rawAmount = input.value.trim();

        if (rawAmount === "") {

            return {
                valid: false,
                message: "Please enter an amount for every selected service."
            };
        }

        const amount = Number(rawAmount);

        if (
            !Number.isSafeInteger(amount) ||
            amount < 0
        ) {

            return {
                valid: false,
                message: "Please enter valid whole-rupee amounts for every service."
            };
        }

        serviceBudgetAllocation[service] = amount;

        allocatedTotal += amount;
    }

    if (!Number.isSafeInteger(allocatedTotal)) {

        return {
            valid: false,
            message: "The total allocated amount is too large. Please check your amounts."
        };
    }

    if (allocatedTotal > totalBudget) {

        return {
            valid: false,
            message:
                "Your service allocations total " +
                formatRupees(allocatedTotal) +
                ", which exceeds your budget of " +
                formatRupees(totalBudget) +
                ". Please adjust the amounts."
        };
    }

    return {
        valid: true,
        totalBudget,
        allocatedTotal,
        remainingBudget: totalBudget - allocatedTotal,
        serviceBudgetAllocation
    };
}


/* ---------- CONNECT BUDGET ALLOCATION EVENTS ---------- */

if (
    bookingForm &&
    budgetInput &&
    allocationPanel &&
    allocationRows &&
    allocationEmpty &&
    allocationBudget &&
    allocationTotal &&
    allocationRemaining &&
    allocationStatus &&
    suggestSplitButton
) {

    // When customer selects or removes a service,
    // rebuild the allocation fields and suggest an equal split.
    bookingForm.querySelectorAll(
        'input[name="services"]'
    ).forEach(checkbox => {

        checkbox.addEventListener("change", renderAllocationFields);

    });

    // When customer changes the total budget,
    // recalculate the suggested equal split.
    budgetInput.addEventListener("change", function() {

        if (getSelectedServices().length > 0) {
            suggestEqualSplit();
        } else {
            updateAllocationSummary();
        }

    });

    // Allow customer to request a fresh equal split.
    suggestSplitButton.addEventListener("click", suggestEqualSplit);

}


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
        const requirements = getFieldValue("requirements");

        const services = getSelectedServices();

        const consent = bookingForm.elements.namedItem("consent");

        const advanceBooking =
            advanceBookingInput
                ? advanceBookingInput.checked
                : false;

        const advanceAmount = advanceBooking ? 10000 : 0;


        /* VALIDATE CUSTOMER AND EVENT DETAILS */

        if (
            !name ||
            !phone ||
            !email ||
            !eventType ||
            !date ||
            !guests ||
            !location ||
            !budgetInput.value.trim()
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

        if (!Number.isSafeInteger(guestCount) || guestCount < 1) {

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


        /* VALIDATE SERVICE-WISE BUDGET */

        const allocationResult = validateServiceAllocation();

        if (!allocationResult.valid) {

            showMessage(
                allocationResult.message,
                "error"
            );

            allocationStatus.className = "allocation-status error";
            allocationStatus.textContent = allocationResult.message;

            allocationPanel.scrollIntoView({
                behavior: "smooth",
                block: "center"
            });

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

                // Customer details
                name,
                phone,
                email,

                // Event details
                eventType,
                date,
                guests: guestCount,
                location,

                // Budget details
                // Keep budget as a readable string for compatibility
                // with existing dashboard displays.
                budget: formatRupees(allocationResult.totalBudget),

                // Exact numeric budget for calculations
                totalBudget: allocationResult.totalBudget,

                // Selected services
                services,

                // Customer's editable service-wise amounts
                serviceBudgetAllocation:
                    allocationResult.serviceBudgetAllocation,

                // Allocation summary
                allocatedBudget: allocationResult.allocatedTotal,

                remainingBudget: allocationResult.remainingBudget,

                // Advance payment selection
                advanceBooking,
                advanceAmount,

                // Additional requirements
                requirements,

                // Initial booking status
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


            console.log(
                "EVENTORA service budget allocation:",
                allocationResult.serviceBudgetAllocation
            );


            /* SAVE BOOKING REFERENCE */

            try {

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

            } catch (storageError) {

                console.warn(
                    "EVENTORA: Booking saved, but local tracking reference could not be stored.",
                    storageError
                );
            }


            /* SHOW SUCCESS + TRACK MY ORDER */

            showBookingSuccess(bookingRef.id);

            bookingForm.reset();

            // Clear old allocation rows after successful submission.
            if (allocationRows) {
                allocationRows.replaceChildren();
            }

            if (allocationPanel) {
                allocationPanel.hidden = true;
            }

            if (allocationEmpty) {
                allocationEmpty.hidden = false;
            }

            if (advanceBookingInput) {
                advanceBookingInput.checked = false;
            }

            const advancePaymentSection =
                document.getElementById("advancePaymentSection");

            if (advancePaymentSection) {
                advancePaymentSection.hidden = true;
            }

            updateAllocationSummary();


        } catch (error) {

            console.error("EVENTORA booking error:", error);

            console.error("Error code:", error.code);

            console.error("Error message:", error.message);

            let errorMessage = "Booking could not be submitted. ";

            if (
                error.code === "permission-denied" ||
                error.code === "firestore/permission-denied"
            ) {

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
    "EVENTORA Booking System with Service-Wise Budget Allocation initialized successfully."
);
