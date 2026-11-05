
/* =========================================================
   EVENTORA - ADMIN DASHBOARD JAVASCRIPT
   Firebase Authentication + Firestore
   File: js/admin.js
========================================================= */

import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js";

import {
    getAuth,
    signInWithEmailAndPassword,
    onAuthStateChanged,
    signOut
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js";

import {
    getFirestore,
    collection,
    getDocs,
    doc,
    updateDoc
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
const auth = getAuth(app);
const db = getFirestore(app);


/* ---------- AUTHORIZED ADMIN UID LIST ---------- */

const ADMIN_UIDS = [
    "tYvI7X6zi4OpLhUkedWC9U4t8sG3",
    "5Fbm7H1qtzXIMrG7e580Cx2m36h2"
];


/* ---------- ELEMENT REFERENCES ---------- */

const loginSection = document.getElementById("loginSection");
const dashboardSection = document.getElementById("dashboardSection");

const loginForm = document.getElementById("loginForm");
const adminEmail = document.getElementById("adminEmail");
const adminPassword = document.getElementById("adminPassword");
const loginButton = document.getElementById("loginButton");
const loginMessage = document.getElementById("loginMessage");

const signedInEmail = document.getElementById("signedInEmail");
const refreshButton = document.getElementById("refreshButton");
const logoutButton = document.getElementById("logoutButton");

const totalCount = document.getElementById("totalCount");
const pendingCount = document.getElementById("pendingCount");
const acceptedCount = document.getElementById("acceptedCount");
const completedCount = document.getElementById("completedCount");

const searchBookings = document.getElementById("searchBookings");
const dashboardMessage = document.getElementById("dashboardMessage");
const bookingList = document.getElementById("bookingList");


/* ---------- APPLICATION STATE ---------- */

let allBookings = [];
let currentAdmin = null;
let isLoading = false;


/* ---------- SAFE HTML DISPLAY ---------- */

function escapeHTML(value) {

    return String(value ?? "").replace(/[&<>"']/g, function (character) {

        const entities = {
            "&": "&amp;",
            "<": "&lt;",
            ">": "&gt;",
            '"': "&quot;",
            "'": "&#039;"
        };

        return entities[character];

    });

}


/* ---------- DATE FORMATTING ---------- */

function formatDate(value) {

    if (!value) return "Not provided";

    let date;

    if (typeof value.toDate === "function") {
        date = value.toDate();
    } else {
        date = new Date(value);
    }

    if (Number.isNaN(date.getTime())) {
        return escapeHTML(value);
    }

    return date.toLocaleDateString("en-IN", {
        day: "2-digit",
        month: "short",
        year: "numeric"
    });

}


/* ---------- MESSAGE DISPLAY ---------- */

function showLoginMessage(message, isError = true) {

    if (!loginMessage) return;

    loginMessage.textContent = message;
    loginMessage.style.color = isError ? "#a33b32" : "#28663a";

}


function showDashboardMessage(message, isError = false) {

    if (!dashboardMessage) return;

    dashboardMessage.textContent = message;

    dashboardMessage.style.color = isError
        ? "#a33b32"
        : "#28663a";

}


/* ---------- SECTION CONTROL ---------- */

function showLogin() {

    if (loginSection) {
        loginSection.style.display = "flex";
    }

    if (dashboardSection) {
        dashboardSection.style.display = "none";
    }

}


function showDashboard() {

    if (loginSection) {
        loginSection.style.display = "none";
    }

    if (dashboardSection) {
        dashboardSection.style.display = "block";
    }

}


/* ---------- LOGIN ---------- */

if (loginForm) {

    loginForm.addEventListener("submit", async function (event) {

        event.preventDefault();

        const email = adminEmail.value.trim();
        const password = adminPassword.value;

        if (!email || !password) {
            showLoginMessage("Please enter your email and password.");
            return;
        }

        loginButton.disabled = true;
        loginButton.textContent = "Signing in...";

        showLoginMessage("");

        try {

            const userCredential = await signInWithEmailAndPassword(
                auth,
                email,
                password
            );

            if (!ADMIN_UIDS.includes(userCredential.user.uid)) {

                await signOut(auth);

                showLoginMessage(
                    "Access denied. This account is not an authorized admin."
                );

                return;
            }

            showLoginMessage("Login successful.", false);

        } catch (error) {

            console.error("Admin login error:", error);

            showLoginMessage(getFriendlyError(error));

        } finally {

            loginButton.disabled = false;
            loginButton.textContent = "Login to Dashboard";

        }

    });

}


/* ---------- FRIENDLY FIREBASE ERRORS ---------- */

function getFriendlyError(error) {

    const code = error?.code || "";

    const messages = {
        "auth/invalid-email": "Please enter a valid email address.",
        "auth/user-not-found": "No account found with this email.",
        "auth/wrong-password": "Incorrect password. Please try again.",
        "auth/invalid-credential": "Incorrect email or password.",
        "auth/too-many-requests": "Too many attempts. Please try again later.",
        "auth/network-request-failed": "Network error. Check your internet connection.",
        "permission-denied": "Permission denied. Check your Firestore security rules."
    };

    return messages[code] || "Something went wrong. Please try again.";

}


/* ---------- AUTHENTICATION STATE ---------- */

onAuthStateChanged(auth, async function (user) {

    if (!user) {

        currentAdmin = null;
        allBookings = [];

        showLogin();

        return;
    }

    if (!ADMIN_UIDS.includes(user.uid)) {

        await signOut(auth);

        showLogin();

        showLoginMessage("Access denied. Unauthorized account.");

        return;
    }

    currentAdmin = user;

    if (signedInEmail) {
        signedInEmail.textContent = user.email || "Administrator";
    }

    showDashboard();

    await loadBookings();

});


/* ---------- LOAD BOOKINGS ---------- */

async function loadBookings() {

    if (!currentAdmin || isLoading) return;

    isLoading = true;

    if (refreshButton) {
        refreshButton.disabled = true;
        refreshButton.textContent = "Loading...";
    }

    showDashboardMessage("Loading booking information...");

    if (bookingList) {
        bookingList.innerHTML = "<p>Loading bookings...</p>";
    }

    try {

        const bookingsRef = collection(db, "bookings");

        const snapshot = await getDocs(bookingsRef);

        allBookings = snapshot.docs.map(function (document) {

            return {
                id: document.id,
                ...document.data()
            };

        });

        allBookings.sort(function (a, b) {

            return getTimestamp(b.createdAt) - getTimestamp(a.createdAt);

        });

        updateStatistics();
        displayBookings(allBookings);

        showDashboardMessage(
            allBookings.length
                ? "Booking information updated successfully."
                : "No bookings have been received yet."
        );

    } catch (error) {

        console.error("Booking loading error:", error);

        showDashboardMessage(
            "Unable to load bookings. Please check your Firebase permissions and connection.",
            true
        );

        if (bookingList) {
            bookingList.innerHTML =
                '<p class="empty-state">Unable to load bookings.</p>';
        }

    } finally {

        isLoading = false;

        if (refreshButton) {
            refreshButton.disabled = false;
            refreshButton.textContent = "Refresh";
        }

    }

}


/* ---------- TIMESTAMP HELPER ---------- */

function getTimestamp(value) {

    if (!value) return 0;

    if (typeof value.toMillis === "function") {
        return value.toMillis();
    }

    const date = new Date(value);

    return Number.isNaN(date.getTime()) ? 0 : date.getTime();

}


/* ---------- UPDATE STATISTICS ---------- */

function updateStatistics() {

    const total = allBookings.length;

    const pending = allBookings.filter(function (booking) {
        return String(booking.status || "pending").toLowerCase() === "pending";
    }).length;

    const accepted = allBookings.filter(function (booking) {
        return String(booking.status || "").toLowerCase() === "accepted";
    }).length;

    const completed = allBookings.filter(function (booking) {
        return String(booking.status || "").toLowerCase() === "completed";
    }).length;

    if (totalCount) totalCount.textContent = total;
    if (pendingCount) pendingCount.textContent = pending;
    if (acceptedCount) acceptedCount.textContent = accepted;
    if (completedCount) completedCount.textContent = completed;

}


/* ---------- DISPLAY BOOKINGS ---------- */

function displayBookings(bookings) {

    if (!bookingList) return;

    if (!bookings.length) {

        bookingList.innerHTML =
            '<div class="empty-state">No bookings found.</div>';

        return;
    }

    bookingList.innerHTML = bookings.map(function (booking) {

        const name = escapeHTML(booking.name || "Customer");
        const phone = escapeHTML(booking.phone || "Not provided");
        const email = escapeHTML(booking.email || "Not provided");
        const eventType = escapeHTML(booking.eventType || "Not specified");
        const eventDate = formatDate(booking.date);
        const guests = escapeHTML(booking.guests || "Not specified");
        const location = escapeHTML(booking.location || "Not provided");
        const budget = escapeHTML(booking.budget || "Not specified");
        const requirements = escapeHTML(
            booking.requirements || "No additional requirements"
        );

        const services = Array.isArray(booking.services)
            ? booking.services.map(escapeHTML).join(", ")
            : "Not specified";

        const status = String(booking.status || "pending").toLowerCase();

        const safeStatus = [
            "pending",
            "accepted",
            "completed",
            "cancelled"
        ].includes(status) ? status : "pending";

        const statusOptions = [
            "pending",
            "accepted",
            "completed",
            "cancelled"
        ].map(function (option) {

            return `
                <option value="${option}" ${safeStatus === option ? "selected" : ""}>
                    ${option.charAt(0).toUpperCase() + option.slice(1)}
                </option>
            `;

        }).join("");

        return `
            <article class="booking-card" data-booking-id="${escapeHTML(booking.id)}">

                <h3>${name}</h3>

                <p><strong>Phone:</strong> ${phone}</p>
                <p><strong>Email:</strong> ${email}</p>
                <p><strong>Event:</strong> ${eventType}</p>
                <p><strong>Date:</strong> ${eventDate}</p>
                <p><strong>Guests:</strong> ${guests}</p>
                <p><strong>Location:</strong> ${location}</p>
                <p><strong>Budget:</strong> ${budget}</p>
                <p><strong>Services:</strong> ${services}</p>
                <p><strong>Requirements:</strong> ${requirements}</p>

                <p>
                    <strong>Status:</strong>
                    <span class="status status-${safeStatus}">
                        ${safeStatus}
                    </span>
                </p>

                <label>
                    <strong>Update booking status:</strong>
                    <select class="booking-status-select"
                            data-id="${escapeHTML(booking.id)}"
                            aria-label="Update status for ${name}">
                        ${statusOptions}
                    </select>
                </label>

                <button type="button"
                        class="update-status-button"
                        data-id="${escapeHTML(booking.id)}">
                    Update Status
                </button>

            </article>
        `;

    }).join("");

}


/* ---------- UPDATE BOOKING STATUS ---------- */

if (bookingList) {

    bookingList.addEventListener("click", async function (event) {

        const button = event.target.closest(".update-status-button");

        if (!button) return;

        const bookingId = button.dataset.id;

        const card = button.closest(".booking-card");

        const select = card?.querySelector(".booking-status-select");

        if (!bookingId || !select) return;

        const newStatus = select.value;

        const allowedStatuses = [
            "pending",
            "accepted",
            "completed",
            "cancelled"
        ];

        if (!allowedStatuses.includes(newStatus)) {
            showDashboardMessage("Invalid booking status.", true);
            return;
        }

        if (!currentAdmin || !ADMIN_UIDS.includes(currentAdmin.uid)) {
            showDashboardMessage("You are not authorized to update bookings.", true);
            return;
        }

        button.disabled = true;
        button.textContent = "Updating...";

        try {

            const bookingRef = doc(db, "bookings", bookingId);

            await updateDoc(bookingRef, {
                status: newStatus
            });

            const booking = allBookings.find(function (item) {
                return item.id === bookingId;
            });

            if (booking) {
                booking.status = newStatus;
            }

            updateStatistics();
            displayBookings(getFilteredBookings());

            showDashboardMessage("Booking status updated successfully.");

        } catch (error) {

            console.error("Status update error:", error);

            showDashboardMessage(
                "Unable to update status. Check your Firestore security rules.",
                true
            );

            button.disabled = false;
            button.textContent = "Update Status";

        }

    });

}


/* ---------- SEARCH BOOKINGS ---------- */

function getFilteredBookings() {

    const searchTerm = searchBookings
        ? searchBookings.value.trim().toLowerCase()
        : "";

    if (!searchTerm) return allBookings;

    return allBookings.filter(function (booking) {

        const searchableText = [
            booking.name,
            booking.phone,
            booking.email,
            booking.eventType,
            booking.location,
            booking.status,
            booking.budget
        ].join(" ").toLowerCase();

        return searchableText.includes(searchTerm);

    });

}


if (searchBookings) {

    searchBookings.addEventListener("input", function () {

        displayBookings(getFilteredBookings());

    });

}


/* ---------- REFRESH DASHBOARD ---------- */

if (refreshButton) {

    refreshButton.addEventListener("click", function () {

        loadBookings();

    });

}


/* ---------- LOGOUT ---------- */

if (logoutButton) {

    logoutButton.addEventListener("click", async function () {

        logoutButton.disabled = true;
        logoutButton.textContent = "Logging out...";

        try {

            await signOut(auth);

            allBookings = [];
            currentAdmin = null;

            showLogin();

        } catch (error) {

            console.error("Logout error:", error);

            showDashboardMessage("Unable to log out. Please try again.", true);

        } finally {

            logoutButton.disabled = false;
            logoutButton.textContent = "Logout";

        }

    });

}


/* ---------- FOOTER YEAR ---------- */

const yearElement = document.getElementById("year");

if (yearElement) {
    yearElement.textContent = new Date().getFullYear();
}


/* ---------- EVENTORA CONSOLE ---------- */

console.log("EVENTORA Admin Dashboard initialized.");
