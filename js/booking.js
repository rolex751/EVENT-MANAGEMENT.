
/* =========================================================
   EVENTORA - CUSTOMER BOOKING SYSTEM
   Firebase + Weighted Service-Wise Budget Allocation
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
    apiKey: "AIzaSyA184UnR0cJDEm9yj0UN44y0VM1SgTxa8",
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
    if (auth.currentUser) return auth.currentUser;

    const result = await signInAnonymously(auth);
    return result.user;
}


/* ---------- FORM ELEMENTS ---------- */

const bookingForm = document.getElementById("bookingForm");
const submitButton = document.getElementById("submitBooking");
const formMessage = document.getElementById("formMessage");

const budgetInput = document.getElementById("budget");
const customBudgetGroup = document.getElementById("customBudgetGroup");
const customBudgetInput = document.getElementById("customBudget");

const allocationPanel = document.getElementById("allocationPanel");
const allocationEmpty = document.getElementById("allocationEmpty");
const allocationRows = document.getElementById("allocationRows");

const allocationBudget = document.getElementById("allocationBudget");
const allocationTotal = document.getElementById("allocationTotal");
const allocationRemaining = document.getElementById("allocationRemaining");
const allocationStatus = document.getElementById("allocationStatus");

const suggestSplitButton = document.getElementById("suggestSplitButton");
const advanceBookingInput = document.getElementById("advanceBooking");


/* ---------- SERVICE WEIGHTS ---------- */

// These weights determine the recommended proportions.
// They are planning suggestions, not actual service prices.

const SERVICE_WEIGHTS = {
    "Venue": 28,
    "Decoration": 17,
    "Catering": 26,
    "Photography": 9,
    "Videography": 6,
    "Entertainment": 7,
    "Sound and Lighting": 7,
    "Transportation": 5,
    "Makeup": 4,
    "Complete Event Management": 15
};


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

    if (!budgetInput || !budgetInput.value) return 0;

    if (budgetInput.value === "more") {

        const customAmount = Number(customBudgetInput?.value);

        if (
            !Number.isSafeInteger(customAmount) ||
            customAmount <= 1000000
        ) {
            return 0;
        }

        return customAmount;
    }

    const amount = Number(budgetInput.value);

    return Number.isSafeInteger(amount) && amount >= 1
        ? amount
        : 0;
}


/* ---------- GET SELECTED SERVICES ---------- */

function getSelectedServices() {

    return Array.from(
        bookingForm.querySelectorAll(
            'input[name="services"]:checked'
        )
    ).map(input => input.value);
}


/* ---------- GET ALLOCATION INPUTS ---------- */

function getAllocationInputs() {

    return Array.from(
        allocationRows.querySelectorAll(".allocation-input")
    );
}


/* ---------- UPDATE SUMMARY ---------- */

function updateAllocationSummary() {

    const totalBudget = getTotalBudget();
    const inputs = getAllocationInputs();

    let allocatedTotal = 0;
    let invalidAmount = false;

    inputs.forEach(input => {

        const raw = input.value.trim();

        if (raw === "") {
            invalidAmount = true;
            return;
        }

        const amount = Number(raw);

        if (!Number.isSafeInteger(amount) || amount < 0) {
            invalidAmount = true;
            return;
        }

        allocatedTotal += amount;
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
            "Select your total budget above to see suggested amounts.";
        return;
    }

    if (invalidAmount) {
        allocationStatus.textContent =
            "Please enter a valid amount for every selected service.";
        allocationStatus.classList.add("error");
        return;
    }

    if (allocatedTotal > totalBudget) {
        allocationStatus.textContent =
            "Your allocated amount exceeds your total budget. Please reduce the amounts.";

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
        "Remaining balance: " + formatRupees(remaining) +
        ". You can allocate it later or leave it unallocated.";

    allocationStatus.classList.add("success");
}


/* ---------- CALCULATE WEIGHTED ALLOCATION ---------- */

function calculateWeightedSplit(services, totalBudget) {

    if (!services.length || totalBudget < 1) return {};

    const totalWeight = services.reduce(
        (sum, service) => sum + (SERVICE_WEIGHTS[service] || 1),
        0
    );

    const allocations = {};
    const fractions = [];

    let allocated = 0;

    services.forEach(service => {

        const weight = SERVICE_WEIGHTS[service] || 1;

        const exactAmount =
            (totalBudget * weight) / totalWeight;

        const amount = Math.floor(exactAmount);

        allocations[service] = amount;
        allocated += amount;

        fractions.push({
            service,
            fraction: exactAmount - amount
        });
    });

    // Distribute any remaining rupees so the suggested split
    // exactly matches the selected budget.

    let remainder = totalBudget - allocated;

    fractions.sort((a, b) => b.fraction - a.fraction);

    for (let i = 0; i < remainder; i++) {

        const service = fractions[i % fractions.length].service;

        allocations[service] += 1;
    }

    return allocations;
}


/* ---------- SUGGEST WEIGHTED SPLIT ---------- */

function suggestWeightedSplit() {

    const services = getSelectedServices();
    const totalBudget = getTotalBudget();

    if (!services.length) {
        updateAllocationSummary();
        return;
    }

    if (totalBudget < 1) {
        updateAllocationSummary();
        return;
    }

    const suggestions =
        calculateWeightedSplit(services, totalBudget);

    services.forEach(service => {

        const input = getAllocationInputs().find(
            field => field.dataset.service === service
        );

        if (input) {
            input.value = suggestions[service];
        }
    });

    updateAllocationSummary();
}


/* ---------- CREATE ALLOCATION ROW ---------- */

function createAllocationRow(service, amount = 0) {

    const row = document.createElement("div");
    row.className = "allocation-row";

    const label = document.createElement("label");
    label.className = "allocation-service-name";

    const inputId = "allocation-" +
        service.toLowerCase().replace(/[^a-z0-9]+/g, "-");

    label.textContent = service;
    label.htmlFor = inputId;

    const wrap = document.createElement("div");
    wrap.className = "allocation-input-wrap";

    const symbol = document.createElement("span");
    symbol.textContent = "₹";

    const input = document.createElement("input");

    input.type = "number";
    input.min = "0";
    input.step = "1";
    input.required = true;
    input.inputMode = "numeric";
    input.className = "allocation-input";
    input.dataset.service = service;
    input.id = inputId;
    input.value = amount;

    input.setAttribute(
        "aria-label",
        "Planned budget for " + service
    );

    input.addEventListener("input", updateAllocationSummary);

    wrap.append(symbol, input);
    row.append(label, wrap);

    return row;
}


/* ---------- RENDER ALLOCATION FIELDS ---------- */

function renderAllocationFields() {

    const services = getSelectedServices();

    allocationRows.replaceChildren();

    if (!services.length) {

        allocationPanel.hidden = true;
        allocationEmpty.hidden = false;

        updateAllocationSummary();
        return;
    }

    allocationPanel.hidden = false;
    allocationEmpty.hidden = true;

    services.forEach(service => {
        allocationRows.appendChild(
            createAllocationRow(service)
        );
    });

    suggestWeightedSplit();
}


/* ---------- BUDGET DROPDOWN EVENTS ---------- */

function updateBudgetSelection() {

    const isCustom = budgetInput.value === "more";

    customBudgetGroup.hidden = !isCustom;

    if (!isCustom && customBudgetInput) {
        customBudgetInput.value = "";
    }

    if (getSelectedServices().length) {
        suggestWeightedSplit();
    } else {
        updateAllocationSummary();
    }
}

if (budgetInput) {
    budgetInput.addEventListener("change", updateBudgetSelection);
}

if (customBudgetInput) {

    customBudgetInput.addEventListener("input", function() {

        if (getSelectedServices().length) {
            suggestWeightedSplit();
        } else {
            updateAllocationSummary();
        }
    });
}


/* ---------- SERVICE EVENTS ---------- */

if (bookingForm) {

    bookingForm.querySelectorAll(
        'input[name="services"]'
    ).forEach(checkbox => {

        checkbox.addEventListener("change", renderAllocationFields);
    });
}


/* ---------- SUGGEST BUTTON ---------- */

if (suggestSplitButton) {
    suggestSplitButton.addEventListener(
        "click",
        suggestWeightedSplit
    );
}


/* ---------- VALIDATE ALLOCATION ---------- */

function validateServiceAllocation() {

    const totalBudget = getTotalBudget();
    const services = getSelectedServices();

    if (!Number.isSafeInteger(totalBudget) || totalBudget < 1) {

        return {
            valid: false,
            message: budgetInput.value === "more"
                ? "Please enter an exact budget greater than ₹10,00,000."
                : "Please select your total event budget."
        };
    }

    if (!services.length) {

        return {
            valid: false,
            message: "Please select at least one service."
        };
    }

    const inputs = getAllocationInputs();

    if (inputs.length !== services.length) {

        return {
            valid: false,
            message: "Please check your service budget allocation."
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

        if (!Number.isSafeInteger(amount) || amount < 0) {

            return {
                valid: false,
                message: "Please enter valid whole-rupee amounts."
            };
        }

        serviceBudgetAllocation[service] = amount;
        allocatedTotal += amount;
    }

    if (!Number.isSafeInteger(allocatedTotal)) {

        return {
            valid: false,
            message: "The total allocated amount is too large."
        };
    }

    if (allocatedTotal > totalBudget) {

        return {
            valid: false,
            message:
                "Your allocations total " +
                formatRupees(allocatedTotal) +
                ", exceeding your budget of " +
                formatRupees(totalBudget) + "."
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


/* ---------- FORM MESSAGE ---------- */

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


/* ---------- FIELD VALUE ---------- */

function getFieldValue(name) {

    const field = bookingForm.elements.namedItem(name);

    return field ? field.value.trim() : "";
}


/* ---------- VALIDATION HELPERS ---------- */

function isValidEmail(email) {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

function isValidPhone(phone) {

    const cleanedPhone = phone.replace(/[\s()+-]/g, "");

    return /^\d{10,13}$/.test(cleanedPhone);
}

function isValidEventDate(dateValue) {

    if (!dateValue) return false;

    const selectedDate = new Date(dateValue + "T00:00:00");

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    return !Number.isNaN(selectedDate.getTime()) &&
        selectedDate >= today;
}


/* ---------- SUCCESS DISPLAY ---------- */

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

    Object.assign(trackLink.style, {
        display: "inline-block",
        marginTop: "12px",
        padding: "12px 24px",
        background: "#b58a45",
        color: "#ffffff",
        textDecoration: "none",
        borderRadius: "6px",
        fontWeight: "600"
    });

    formMessage.append(
        successText,
        referenceText,
        infoText,
        trackLink
    );

    Object.assign(formMessage.style, {
        display: "block",
        padding: "15px",
        marginTop: "15px",
        borderRadius: "8px",
        background: "#e8f5e9",
        color: "#256438",
        border: "1px solid #b8dfbd"
    });
}


/* ---------- CHECK REQUIRED ELEMENTS ---------- */

if (!bookingForm || !submitButton || !formMessage) {

    console.error("EVENTORA: Booking form elements were not found.");

} else {


    /* ---------- BOOKING SUBMISSION ---------- */

    bookingForm.addEventListener("submit", async function(event) {

        event.preventDefault();

        if (submitButton.disabled) return;

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

        const advanceBooking = advanceBookingInput
            ? advanceBookingInput.checked
            : false;

        const advanceAmount = advanceBooking ? 10000 : 0;


        /* CUSTOMER DETAILS VALIDATION */

        if (
            !name ||
            !phone ||
            !email ||
            !eventType ||
            !date ||
            !guests ||
            !location ||
            !budgetInput.value
        ) {

            showMessage("Please complete all required fields.", "error");
            return;
        }

        if (name.length < 2) {
            showMessage("Please enter your full name.", "error");
            return;
        }

        if (!isValidPhone(phone)) {
            showMessage("Please enter a valid phone number (10–13 digits).", "error");
            return;
        }

        if (!isValidEmail(email)) {
            showMessage("Please enter a valid email address.", "error");
            return;
        }

        if (!isValidEventDate(date)) {
            showMessage("Please select today or a future event date.", "error");
            return;
        }

        const guestCount = Number(guests);

        if (!Number.isSafeInteger(guestCount) || guestCount < 1) {
            showMessage("Please enter a valid number of guests.", "error");
            return;
        }

        if (consent && !consent.checked) {
            showMessage("Please accept the consent checkbox.", "error");
            return;
        }


        /* SERVICE BUDGET VALIDATION */

        const allocationResult = validateServiceAllocation();

        if (!allocationResult.valid) {

            showMessage(allocationResult.message, "error");

            allocationStatus.className = "allocation-status error";
            allocationStatus.textContent = allocationResult.message;

            allocationPanel.scrollIntoView({
                behavior: "smooth",
                block: "center"
            });

            return;
        }


        /* DISABLE SUBMIT BUTTON */

        submitButton.disabled = true;
        submitButton.textContent = "Submitting Booking...";

        showMessage(
            "Please wait. Your booking enquiry is being submitted..."
        );


        try {

            /* AUTHENTICATE CUSTOMER */

            const customer = await getCustomerUser();


            /* PREPARE FIRESTORE DATA */

            const bookingData = {

                name,
                phone,
                email,

                eventType,
                date,
                guests: guestCount,
                location,

                // Budget details
                budget: formatRupees(allocationResult.totalBudget),
                totalBudget: allocationResult.totalBudget,

                // Original selected budget option
                budgetSelection: budgetInput.value === "more"
                    ? "More than ₹10,00,000"
                    : budgetInput.options[budgetInput.selectedIndex].text,

                services,

                // Editable weighted service allocation
                serviceBudgetAllocation:
                    allocationResult.serviceBudgetAllocation,

                allocatedBudget: allocationResult.allocatedTotal,

                remainingBudget: allocationResult.remainingBudget,

                advanceBooking,
                advanceAmount,

                requirements,

                status: "pending",

                ownerUid: customer.uid,

                createdAt: serverTimestamp()
            };


            /* SAVE TO FIRESTORE */

            const bookingRef = await addDoc(
                collection(db, "bookings"),
                bookingData
            );

            console.log(
                "EVENTORA booking submitted:",
                bookingRef.id
            );

            console.log(
                "Weighted service allocation:",
                allocationResult.serviceBudgetAllocation
            );


            /* SAVE TRACKING REFERENCE */

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
                    "Booking saved, but tracking reference could not be stored.",
                    storageError
                );
            }


            /* SHOW SUCCESS */

            showBookingSuccess(bookingRef.id);

            bookingForm.reset();

            allocationRows.replaceChildren();
            allocationPanel.hidden = true;
            allocationEmpty.hidden = false;

            if (customBudgetGroup) {
                customBudgetGroup.hidden = true;
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
                    "Firebase permission denied. Please check Firestore rules.";

            } else if (error.code === "auth/operation-not-allowed") {

                errorMessage +=
                    "Enable Anonymous Authentication in Firebase.";

            } else if (
                error.code === "unavailable" ||
                error.code === "failed-precondition"
            ) {

                errorMessage +=
                    "Firebase is temporarily unavailable. Please try again.";

            } else {

                errorMessage +=
                    "Please try again. " +
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
    "EVENTORA Booking System with Weighted Service Budget Allocation initialized successfully."
);
