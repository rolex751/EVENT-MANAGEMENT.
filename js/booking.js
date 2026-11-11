
/* =========================================================
   EVENTORA - CUSTOMER BOOKING SYSTEM
   Firebase Firestore + Weighted Budget Allocation
   Automatic Event-Based Guest Estimation
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


/* =========================================================
   1. FIREBASE CONFIGURATION
========================================================= */

const firebaseConfig = {
    apiKey: "AIzaSyA184UnR0cJDEm9yj0UN44y0VM1SgTxa8Q",
    authDomain: "event-management-93edc.firebaseapp.com",
    databaseURL: "https://event-management-93edc-default-rtdb.firebaseio.com",
    projectId: "event-management-93edc",
    storageBucket: "event-management-93edc.firebasestorage.app",
    messagingSenderId: "327602461080",
    appId: "1:327602461080:web:eb96abf94de99d1bac73ed",
    measurementId: "G-NFFDH9C4ZF"
};

const app = getApps().length ? getApp() : initializeApp(firebaseConfig);
const db = getFirestore(app);
const auth = getAuth(app);

console.log("EVENTORA Booking System initialized successfully.");


/* =========================================================
   2. HTML ELEMENTS
========================================================= */

const bookingForm = document.getElementById("bookingForm");
const submitButton = document.getElementById("submitBooking");
const formMessage = document.getElementById("formMessage");

const budgetInput = document.getElementById("budget");
const customBudgetGroup = document.getElementById("customBudgetGroup");
const customBudgetInput = document.getElementById("customBudget");

const eventTypeInput =
    document.getElementById("eventType") ||
    document.querySelector('[name="eventType"]');

const guestsInput =
    document.getElementById("guests") ||
    document.querySelector('[name="guests"]');

const allocationPanel = document.getElementById("allocationPanel");
const allocationEmpty = document.getElementById("allocationEmpty");
const allocationRows = document.getElementById("allocationRows");

const allocationBudget = document.getElementById("allocationBudget");
const allocationTotal = document.getElementById("allocationTotal");
const allocationRemaining = document.getElementById("allocationRemaining");
const allocationStatus = document.getElementById("allocationStatus");

const suggestSplitButton = document.getElementById("suggestSplitButton");

const advanceBookingCheckbox = document.getElementById("advanceBooking");
const advancePaymentSection = document.getElementById("advancePaymentSection");


/* =========================================================
   3. EVENT-WISE GUEST ESTIMATES
========================================================= */

const guestEstimates = {

    wedding: {
        600000: 150,
        700000: 175,
        800000: 200,
        900000: 225,
        1000000: 250
    },

    birthday: {
        600000: 250,
        700000: 300,
        800000: 350,
        900000: 400,
        1000000: 450
    },

    corporate: {
        600000: 200,
        700000: 250,
        800000: 300,
        900000: 350,
        1000000: 400
    },

    engagement: {
        600000: 200,
        700000: 250,
        800000: 275,
        900000: 300,
        1000000: 350
    },

    anniversary: {
        600000: 200,
        700000: 225,
        800000: 250,
        900000: 275,
        1000000: 300
    },

    college: {
        600000: 300,
        700000: 350,
        800000: 400,
        900000: 450,
        1000000: 500
    },

    private: {
        600000: 250,
        700000: 300,
        800000: 350,
        900000: 400,
        1000000: 450
    }
};


/* =========================================================
   4. IDENTIFY EVENT TYPE
========================================================= */

function getEventCategory(value) {

    const event = String(value || "").toLowerCase().trim();

    if (event.includes("wedding")) return "wedding";
    if (event.includes("birthday")) return "birthday";
    if (event.includes("corporate")) return "corporate";
    if (event.includes("engagement")) return "engagement";
    if (event.includes("anniversary")) return "anniversary";

    if (
        event.includes("college") ||
        event.includes("cultural")
    ) return "college";

    if (
        event.includes("private") ||
        event.includes("party")
    ) return "private";

    return null;
}


/* =========================================================
   5. HELPER FUNCTIONS
========================================================= */

function getElementValue(id, fallbackName = "") {

    const element =
        document.getElementById(id) ||
        (fallbackName
            ? document.querySelector(`[name="${fallbackName}"]`)
            : null);

    return element ? String(element.value).trim() : "";
}


function formatRupees(amount) {

    return new Intl.NumberFormat("en-IN", {
        style: "currency",
        currency: "INR",
        maximumFractionDigits: 0
    }).format(Number(amount) || 0);
}


function getSelectedServices() {

    if (!bookingForm) return [];

    return Array.from(
        bookingForm.querySelectorAll(
            'input[type="checkbox"][name="services"]:checked, input[type="checkbox"][name="services[]"]:checked'
        )
    ).map(input => input.value.trim());
}


function getSelectedBudget() {

    if (!budgetInput || !budgetInput.value) return 0;

    if (budgetInput.value === "more") {
        return Number(customBudgetInput?.value || 0);
    }

    return Number(budgetInput.value);
}


function getBudgetLabel() {

    if (!budgetInput) return "";

    if (budgetInput.value === "more") {
        return "More than ₹10,00,000";
    }

    return budgetInput.options[budgetInput.selectedIndex]?.text || "";
}


function showMessage(message, type = "error") {

    if (!formMessage) return;

    formMessage.textContent = message;
    formMessage.style.display = "block";
    formMessage.style.padding = "14px";
    formMessage.style.marginTop = "15px";
    formMessage.style.borderRadius = "8px";

    if (type === "success") {
        formMessage.style.background = "#e8f7ed";
        formMessage.style.color = "#176b36";
    } else {
        formMessage.style.background = "#fdecec";
        formMessage.style.color = "#a12626";
    }
}


function hideMessage() {

    if (!formMessage) return;

    formMessage.textContent = "";
    formMessage.style.display = "none";
}


/* =========================================================
   6. CALCULATE EXPECTED GUEST COUNT
========================================================= */

function calculateExpectedGuests(eventType, budget) {

    const category = getEventCategory(eventType);

    if (!category || !budget || budget <= 0) return 0;

    const estimates = guestEstimates[category];

    const budgetLevels = Object.keys(estimates)
        .map(Number)
        .sort((a, b) => a - b);

    if (estimates[budget] !== undefined) {
        return estimates[budget];
    }

    let lowerBudget;
    let upperBudget;

    if (budget < budgetLevels[0]) {

        lowerBudget = budgetLevels[0];
        upperBudget = budgetLevels[1];

    } else if (budget > budgetLevels[budgetLevels.length - 1]) {

        lowerBudget = budgetLevels[budgetLevels.length - 2];
        upperBudget = budgetLevels[budgetLevels.length - 1];

    } else {

        for (let i = 0; i < budgetLevels.length - 1; i++) {

            if (
                budget >= budgetLevels[i] &&
                budget <= budgetLevels[i + 1]
            ) {
                lowerBudget = budgetLevels[i];
                upperBudget = budgetLevels[i + 1];
                break;
            }
        }
    }

    const lowerGuests = estimates[lowerBudget];
    const upperGuests = estimates[upperBudget];

    const ratio =
        (budget - lowerBudget) /
        (upperBudget - lowerBudget);

    const calculatedGuests =
        lowerGuests + (upperGuests - lowerGuests) * ratio;

    return Math.max(
        1,
        Math.round(calculatedGuests / 5) * 5
    );
}


/* =========================================================
   7. AUTOMATIC GUEST COUNT
========================================================= */

let suggestedGuestCount = 0;

function updateExpectedGuests() {

    if (!eventTypeInput || !guestsInput) return;

    const eventType = eventTypeInput.value;
    const totalBudget = getSelectedBudget();

    if (!eventType || totalBudget <= 0) {
        suggestedGuestCount = 0;
        return;
    }

    const estimatedGuests = calculateExpectedGuests(
        eventType,
        totalBudget
    );

    if (estimatedGuests <= 0) {
        suggestedGuestCount = 0;
        return;
    }

    suggestedGuestCount = estimatedGuests;

    guestsInput.value = estimatedGuests;

    guestsInput.title =
        "EVENTORA suggested " +
        estimatedGuests +
        " guests based on your event type and budget. You can edit this number.";

    console.log(
        "EVENTORA Guest Estimate:",
        eventType,
        formatRupees(totalBudget),
        estimatedGuests
    );
}


/* =========================================================
   8. SERVICE WEIGHTS
========================================================= */

const serviceWeights = {

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


/* =========================================================
   9. CALCULATE WEIGHTED BUDGET ALLOCATION
========================================================= */

let currentAllocation = {};

function calculateSuggestedAllocation(totalBudget, services) {

    if (!totalBudget || services.length === 0) return {};

    const totalWeight = services.reduce((sum, service) => {
        return sum + (serviceWeights[service] || 1);
    }, 0);

    const allocations = {};
    const remainders = [];

    let allocated = 0;

    services.forEach(service => {

        const weight = serviceWeights[service] || 1;

        const exactAmount =
            (totalBudget * weight) / totalWeight;

        const roundedAmount = Math.floor(exactAmount);

        allocations[service] = roundedAmount;

        allocated += roundedAmount;

        remainders.push({
            service,
            remainder: exactAmount - roundedAmount
        });

    });

    let remaining = totalBudget - allocated;

    remainders.sort((a, b) => b.remainder - a.remainder);

    for (let i = 0; i < remaining; i++) {

        const service =
            remainders[i % remainders.length].service;

        allocations[service]++;
    }

    return allocations;
}


/* =========================================================
   10. DISPLAY BUDGET ALLOCATION - FIXED
========================================================= */

function renderAllocation(resetValues = false) {

    if (!allocationRows || !allocationPanel) return;

    const selectedServices = getSelectedServices();
    const totalBudget = getSelectedBudget();

    // Hide the panel when no budget or service is selected.
    if (selectedServices.length === 0 || totalBudget <= 0) {

        allocationPanel.hidden = true;

        if (allocationEmpty) {
            allocationEmpty.hidden = false;
        }

        currentAllocation = {};

        allocationRows.innerHTML = "";

        updateAllocationSummary();

        return;
    }

    // IMPORTANT: Remove the HTML hidden attribute.
    allocationPanel.hidden = false;

    if (allocationEmpty) {
        allocationEmpty.hidden = true;
    }

    const previousAllocation = { ...currentAllocation };

    const suggestedAllocation =
        calculateSuggestedAllocation(totalBudget, selectedServices);

    if (resetValues) {

        currentAllocation = suggestedAllocation;

    } else {

        const updatedAllocation = {};

        selectedServices.forEach(service => {

            if (previousAllocation[service] !== undefined) {

                updatedAllocation[service] =
                    previousAllocation[service];

            } else {

                updatedAllocation[service] =
                    suggestedAllocation[service] || 0;

            }

        });

        currentAllocation = updatedAllocation;
    }

    allocationRows.innerHTML = "";

    selectedServices.forEach(service => {

        const row = document.createElement("div");
        row.className = "allocation-row";

        const serviceLabel = document.createElement("label");
        serviceLabel.className = "allocation-service-name";
        serviceLabel.textContent = service;

        const inputWrap = document.createElement("div");
        inputWrap.className = "allocation-input-wrap";

        const rupeeSymbol = document.createElement("span");
        rupeeSymbol.textContent = "₹";

        const amountInput = document.createElement("input");

        amountInput.type = "number";
        amountInput.min = "0";
        amountInput.step = "1";
        amountInput.className = "allocation-input";
        amountInput.value = currentAllocation[service] || 0;
        amountInput.dataset.service = service;

        amountInput.addEventListener("input", function () {

            currentAllocation[service] =
                Math.max(0, Math.floor(Number(this.value) || 0));

            updateAllocationSummary();

        });

        inputWrap.appendChild(rupeeSymbol);
        inputWrap.appendChild(amountInput);

        row.appendChild(serviceLabel);
        row.appendChild(inputWrap);

        allocationRows.appendChild(row);

    });

    updateAllocationSummary();
}


/* =========================================================
   11. UPDATE ALLOCATION SUMMARY
========================================================= */

function updateAllocationSummary() {

    const totalBudget = getSelectedBudget();

    const allocatedTotal = Object.values(currentAllocation)
        .reduce((sum, amount) => sum + (Number(amount) || 0), 0);

    const remainingBudget = totalBudget - allocatedTotal;

    if (allocationBudget) {
        allocationBudget.textContent = formatRupees(totalBudget);
    }

    if (allocationTotal) {
        allocationTotal.textContent = formatRupees(allocatedTotal);
    }

    if (allocationRemaining) {
        allocationRemaining.textContent =
            formatRupees(Math.max(0, remainingBudget));
    }

    if (allocationStatus) {

        if (allocatedTotal > totalBudget) {

            allocationStatus.textContent =
                "Your allocated amount exceeds your selected budget.";

            allocationStatus.style.color = "#c62828";

        } else if (remainingBudget === 0 && totalBudget > 0) {

            allocationStatus.textContent =
                "Your entire budget has been allocated.";

            allocationStatus.style.color = "#188038";

        } else {

            allocationStatus.textContent =
                "You still have " +
                formatRupees(remainingBudget) +
                " remaining to allocate.";

            allocationStatus.style.color = "#555";
        }
    }
}


/* =========================================================
   12. BUDGET CHANGE EVENTS
========================================================= */

if (budgetInput) {

    budgetInput.addEventListener("change", function () {

        hideMessage();

        const isCustom = this.value === "more";

        if (customBudgetGroup) {
            customBudgetGroup.hidden = !isCustom;
        }

        if (customBudgetInput) {

            customBudgetInput.required = isCustom;

            if (!isCustom) {
                customBudgetInput.value = "";
            }
        }

        updateExpectedGuests();

        renderAllocation(true);
    });
}


/* =========================================================
   13. CUSTOM BUDGET CHANGE
========================================================= */

if (customBudgetInput) {

    customBudgetInput.addEventListener("input", function () {

        hideMessage();

        updateExpectedGuests();

        renderAllocation(true);
    });
}


/* =========================================================
   14. EVENT TYPE CHANGE
========================================================= */

if (eventTypeInput) {

    eventTypeInput.addEventListener("change", function () {

        hideMessage();

        updateExpectedGuests();

    });

    if (eventTypeInput.tagName === "INPUT") {

        eventTypeInput.addEventListener("input", function () {

            updateExpectedGuests();

        });
    }
}


/* =========================================================
   15. SERVICE SELECTION CHANGE
========================================================= */

if (bookingForm) {

    bookingForm.addEventListener("change", function (event) {

        if (
            event.target.matches(
                'input[type="checkbox"][name="services"], input[type="checkbox"][name="services[]"]'
            )
        ) {

            renderAllocation(false);

        }
    });
}


/* =========================================================
   16. SUGGEST BUDGET SPLIT BUTTON
========================================================= */

if (suggestSplitButton) {

    suggestSplitButton.addEventListener("click", function () {

        const totalBudget = getSelectedBudget();
        const selectedServices = getSelectedServices();

        if (!totalBudget || selectedServices.length === 0) {

            showMessage(
                "Please select your budget and at least one service first."
            );

            return;
        }

        renderAllocation(true);

        hideMessage();
    });
}


/* =========================================================
   17. ADVANCE BOOKING PAYMENT SECTION
========================================================= */

if (advanceBookingCheckbox && advancePaymentSection) {

    advanceBookingCheckbox.addEventListener("change", function () {

        advancePaymentSection.hidden = !this.checked;

    });
}


/* =========================================================
   18. VALIDATE BUDGET ALLOCATION
========================================================= */

function validateAllocation() {

    const totalBudget = getSelectedBudget();
    const selectedServices = getSelectedServices();

    if (!budgetInput || !budgetInput.value) {
        return "Please select your event budget.";
    }

    if (
        budgetInput.value === "more" &&
        (!customBudgetInput || Number(customBudgetInput.value) <= 1000000)
    ) {

        return "Please enter an amount greater than ₹10,00,000.";
    }

    if (totalBudget <= 0) {
        return "Please enter a valid event budget.";
    }

    if (selectedServices.length === 0) {
        return "Please select at least one service.";
    }

    const allocatedTotal = Object.values(currentAllocation)
        .reduce((sum, amount) => sum + (Number(amount) || 0), 0);

    if (allocatedTotal > totalBudget) {

        return "Your allocated service amounts exceed your selected budget. Please adjust them.";
    }

    return "";
}


/* =========================================================
   19. BOOKING FORM SUBMISSION
========================================================= */

if (bookingForm) {

    bookingForm.addEventListener("submit", async function (event) {

        event.preventDefault();

        hideMessage();

        const validationError = validateAllocation();

        if (validationError) {

            showMessage(validationError);

            return;
        }

        const name = getElementValue("name", "name");
        const phone = getElementValue("phone", "phone");
        const email = getElementValue("email", "email");

        const eventType = getElementValue("eventType", "eventType");

        const date =
            getElementValue("date", "date") ||
            getElementValue("eventDate", "eventDate");

        const guests = Number(getElementValue("guests", "guests"));

        const location = getElementValue("location", "location");

        const requirements =
            getElementValue("requirements", "requirements");

        const services = getSelectedServices();

        const totalBudget = getSelectedBudget();

        const expectedGuests = calculateExpectedGuests(
            eventType,
            totalBudget
        );

        const allocatedTotal = Object.values(currentAllocation)
            .reduce((sum, amount) => sum + (Number(amount) || 0), 0);

        const remainingBudget = totalBudget - allocatedTotal;

        const advanceBooking = advanceBookingCheckbox
            ? advanceBookingCheckbox.checked
            : false;

        const advanceAmount = advanceBooking ? 10000 : 0;

        if (
            !name ||
            !phone ||
            !email ||
            !eventType ||
            !date ||
            !guests ||
            guests <= 0 ||
            !location
        ) {

            showMessage(
                "Please complete all required booking details and enter a valid guest count."
            );

            return;
        }

        if (submitButton) {

            submitButton.disabled = true;
            submitButton.textContent = "Submitting Booking...";

        }

        try {

            let customer = auth.currentUser;

            if (!customer) {

                const userCredential =
                    await signInAnonymously(auth);

                customer = userCredential.user;
            }

            const serviceBudgetAllocation = {};

            services.forEach(service => {

                serviceBudgetAllocation[service] =
                    Number(currentAllocation[service] || 0);

            });

            const bookingData = {

                name,
                phone,
                email,

                eventType,
                date,

                guests,

                suggestedGuests: expectedGuests,

                guestEstimateMethod: "event-type-and-budget",

                location,

                budget: formatRupees(totalBudget),
                totalBudget,
                budgetSelection: getBudgetLabel(),

                services,

                serviceBudgetAllocation,

                allocatedBudget: allocatedTotal,
                remainingBudget,

                advanceBooking,
                advanceAmount,

                requirements,

                status: "pending",

                ownerUid: customer.uid,

                createdAt: serverTimestamp()

            };

            const bookingRef = await addDoc(
                collection(db, "bookings"),
                bookingData
            );

            try {

                localStorage.setItem(
                    "eventoraBookingId",
                    bookingRef.id
                );

                localStorage.setItem(
                    "eventoraBookingRef",
                    bookingRef.id
                );

            } catch (storageError) {

                console.warn(
                    "Could not save booking reference locally:",
                    storageError
                );

            }

            console.log(
                "EVENTORA booking successfully saved:",
                bookingRef.id
            );

            if (formMessage) {

                formMessage.innerHTML = `
                    <div style="padding:15px;background:#e8f7ed;color:#176b36;border-radius:8px;">
                        <strong>Your enquiry was submitted successfully!</strong>
                        <p>Reference ID: ${bookingRef.id}</p>
                        <p>Suggested guests: ${expectedGuests || "Not available"}</p>
                        <p>Final guests booked: ${guests}</p>
                        <p>Your booking status is currently Pending.</p>
                        <a href="track-booking.html?ref=${encodeURIComponent(bookingRef.id)}"
                           style="display:inline-block;margin-top:8px;padding:10px 18px;background:#176b36;color:white;text-decoration:none;border-radius:6px;">
                           Track My Order
                        </a>
                    </div>
                `;

                formMessage.style.display = "block";
            }

            // Reset form after successful submission.
            bookingForm.reset();

            currentAllocation = {};
            suggestedGuestCount = 0;

            if (customBudgetGroup) {
                customBudgetGroup.hidden = true;
            }

            if (customBudgetInput) {
                customBudgetInput.required = false;
            }

            if (advancePaymentSection) {
                advancePaymentSection.hidden = true;
            }

            if (allocationPanel) {
                allocationPanel.hidden = true;
            }

            if (allocationEmpty) {
                allocationEmpty.hidden = false;
            }

            if (allocationRows) {
                allocationRows.innerHTML = "";
            }

            updateAllocationSummary();

        } catch (error) {

            console.error(
                "EVENTORA booking submission error:",
                error
            );

            let errorMessage =
                "Booking could not be submitted. Please try again.";

            if (error.code === "auth/api-key-not-valid") {

                errorMessage =
                    "Firebase API key is invalid. Please check Firebase configuration.";

            } else if (
                error.code === "permission-denied" ||
                error.code === "firestore/permission-denied"
            ) {

                errorMessage =
                    "Firebase permission denied. Please check your Firestore security rules.";

            } else if (
                error.code === "auth/operation-not-allowed"
            ) {

                errorMessage =
                    "Anonymous Authentication is not enabled in Firebase.";

            } else if (!navigator.onLine) {

                errorMessage =
                    "No internet connection. Please reconnect and try again.";

            }

            showMessage(errorMessage);

        } finally {

            if (submitButton) {

                submitButton.disabled = false;
                submitButton.textContent = "Submit Booking";

            }
        }
    });
}


/* =========================================================
   20. INITIAL PAGE SETUP
========================================================= */

if (customBudgetGroup) {

    customBudgetGroup.hidden =
        budgetInput?.value !== "more";

}

if (customBudgetInput) {

    customBudgetInput.required =
        budgetInput?.value === "more";

}

if (advancePaymentSection) {

    advancePaymentSection.hidden =
        !advanceBookingCheckbox?.checked;

}

if (allocationPanel) {
    allocationPanel.hidden = true;
}

if (allocationEmpty) {
    allocationEmpty.hidden = false;
}

// Generate guest estimate if values already exist.
updateExpectedGuests();

// Initialize allocation if budget and services exist.
if (
    getSelectedBudget() > 0 &&
    getSelectedServices().length > 0
) {

    renderAllocation(true);

}

console.log("EVENTORA automatic guest estimation is ready.");
