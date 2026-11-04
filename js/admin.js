
import { initializeApp, getApps, getApp } from "https://www.gstatic.com/firebasejs/13.2.0/firebase-app.js";

import {
  getAuth,
  signInWithEmailAndPassword,
  onAuthStateChanged,
  signOut
} from "https://www.gstatic.com/firebasejs/13.2.0/firebase-auth.js";

import {
  getFirestore,
  collection,
  getDocs,
  doc,
  updateDoc
} from "https://www.gstatic.com/firebasejs/13.2.0/firebase-firestore.js";

// FIREBASE CONFIGURATION
const firebaseConfig = {
  apiKey: "AIzaSyA184UnR0cJDEm9yj0UN44y0VM1SgTxa8",
  authDomain: "event-management-93edc.firebaseapp.com",
  projectId: "event-management-93edc",
  storageBucket: "event-management-93edc.firebasestorage.app",
  messagingSenderId: "327602461080",
  appId: "1:327602461080:web:eb96abf94de99d1bac73ed"
};

// ONLY THESE TWO ACCOUNTS ARE ALLOWED
const ADMIN_UIDS = [
  "tYvI7X6zi4OpLhUkedWC9U4t8sG3",
  "5Fbm7H1qtzXIMrG7e580Cx2m36h2"
];

const app = getApps().length
  ? getApp()
  : initializeApp(firebaseConfig);

const auth = getAuth(app);
const db = getFirestore(app);

// HTML ELEMENTS
const loginSection = document.getElementById("loginSection");
const dashboardSection = document.getElementById("dashboardSection");
const loginForm = document.getElementById("loginForm");
const loginButton = document.getElementById("loginButton");
const loginMessage = document.getElementById("loginMessage");
const dashboardMessage = document.getElementById("dashboardMessage");
const bookingList = document.getElementById("bookingList");
const searchInput = document.getElementById("searchBookings");

// CHECK REQUIRED HTML ELEMENTS
if (!loginForm || !loginButton || !loginMessage ||
    !loginSection || !dashboardSection ||
    !dashboardMessage || !bookingList || !searchInput) {
  console.error("Admin HTML is missing one or more required element IDs.");
  throw new Error("Admin page HTML elements are missing.");
}

let allBookings = [];

// FOOTER YEAR
const yearElement = document.getElementById("year");

if (yearElement) {
  yearElement.textContent = new Date().getFullYear();
}

// MESSAGE FUNCTION
function showMessage(element, text, success = false) {
  element.textContent = text;
  element.style.color = success ? "#64c98a" : "#ff7777";
}

// ADMIN LOGIN
loginForm.addEventListener("submit", async (event) => {
  event.preventDefault();

  const email = document.getElementById("adminEmail").value.trim();
  const password = document.getElementById("adminPassword").value;

  loginButton.disabled = true;
  loginButton.textContent = "Signing in...";

  showMessage(loginMessage, "");

  try {
    await signInWithEmailAndPassword(auth, email, password);

    showMessage(
      loginMessage,
      "Login successful. Checking administrator access...",
      true
    );

  } catch (error) {
    console.error("Firebase Login Error:", error);

    showMessage(
      loginMessage,
      "Login failed: " + error.code +
      (error.message ? " - " + error.message : "")
    );

  } finally {
    loginButton.disabled = false;
    loginButton.textContent = "Sign In";
  }
});

// CHECK ADMIN ACCESS
onAuthStateChanged(auth, async (user) => {
  if (!user) {
    loginSection.hidden = false;
    dashboardSection.hidden = true;
    return;
  }

  if (!ADMIN_UIDS.includes(user.uid)) {
    await signOut(auth);

    showMessage(
      loginMessage,
      "Access denied. This account is not an authorized administrator."
    );

    return;
  }

  loginSection.hidden = true;
  dashboardSection.hidden = false;

  document.getElementById("signedInEmail").textContent =
    user.email || "Administrator";

  await loadBookings();
});

// LOGOUT
document.getElementById("logoutButton").addEventListener("click", async () => {
  try {
    await signOut(auth);
  } catch (error) {
    console.error("Logout error:", error);
    showMessage(dashboardMessage, "Unable to log out. Please try again.");
  }
});

// REFRESH BOOKINGS
document.getElementById("refreshButton").addEventListener("click", () => {
  loadBookings();
});

// LOAD BOOKINGS FROM FIRESTORE
async function loadBookings() {
  bookingList.textContent = "Loading enquiries...";
  showMessage(dashboardMessage, "");

  try {
    const snapshot = await getDocs(collection(db, "bookings"));

    allBookings = snapshot.docs.map((bookingDoc) => ({
      id: bookingDoc.id,
      ...bookingDoc.data()
    }));

    allBookings.sort((a, b) => {
      const dateA = a.createdAt?.toMillis?.() || 0;
      const dateB = b.createdAt?.toMillis?.() || 0;
      return dateB - dateA;
    });

    updateStatistics();
    renderBookings(allBookings);

    showMessage(
      dashboardMessage,
      "Enquiries loaded successfully.",
      true
    );

  } catch (error) {
    console.error("Loading bookings error:", error);

    bookingList.textContent = "Unable to load enquiries.";

    showMessage(
      dashboardMessage,
      "Could not load enquiries: " + error.code
    );
  }
}

// UPDATE DASHBOARD COUNTS
function updateStatistics() {
  document.getElementById("totalCount").textContent =
    allBookings.length;

  document.getElementById("pendingCount").textContent =
    allBookings.filter(item => item.status === "Pending").length;

  document.getElementById("acceptedCount").textContent =
    allBookings.filter(item => item.status === "Accepted").length;

  document.getElementById("completedCount").textContent =
    allBookings.filter(item => item.status === "Completed").length;
}

// CREATE SAFE TEXT ELEMENTS
function addDetail(parent, label, value) {
  const p = document.createElement("p");
  p.className = "detail";

  const strong = document.createElement("strong");
  strong.textContent = label + ": ";

  p.appendChild(strong);

  p.appendChild(document.createTextNode(
    value === undefined || value === null || value === ""
      ? "Not provided"
      : String(value)
  ));

  parent.appendChild(p);
}

// DISPLAY BOOKING CARDS
function renderBookings(bookings) {
  bookingList.replaceChildren();

  if (bookings.length === 0) {
    const empty = document.createElement("p");
    empty.className = "empty-state";
    empty.textContent = "No event enquiries found.";
    bookingList.appendChild(empty);
    return;
  }

  bookings.forEach((booking) => {
    const card = document.createElement("article");
    card.className = "booking-card";

    const heading = document.createElement("h3");
    heading.textContent = booking.name || "Customer enquiry";
    card.appendChild(heading);

    const details = document.createElement("div");
    details.className = "booking-details";

    addDetail(details, "Phone", booking.phone);
    addDetail(details, "Email", booking.email);
    addDetail(details, "Event", booking.eventType);
    addDetail(details, "Event Date", booking.eventDate);
    addDetail(details, "Guests", booking.guests);
    addDetail(details, "Location", booking.location);
    addDetail(details, "Budget", booking.budget);

    addDetail(
      details,
      "Services",
      Array.isArray(booking.services)
        ? booking.services.join(", ")
        : "Not provided"
    );

    const created = booking.createdAt?.toDate?.();

    addDetail(
      details,
      "Enquiry Received",
      created ? created.toLocaleString("en-IN") : "Date unavailable"
    );

    card.appendChild(details);

    const requirements = document.createElement("p");
    requirements.className = "booking-requirements";

    requirements.textContent =
      "Additional Requirements: " +
      (booking.requirements || "None provided");

    card.appendChild(requirements);

    const actions = document.createElement("div");
    actions.className = "booking-actions";

    const statusSelect = document.createElement("select");
    statusSelect.setAttribute("aria-label", "Booking status");

    const statuses = [
      "Pending",
      "Accepted",
      "Rejected",
      "Contacted",
      "Completed"
    ];

    statuses.forEach((status) => {
      const option = document.createElement("option");
      option.value = status;
      option.textContent = status;
      statusSelect.appendChild(option);
    });

    statusSelect.value = statuses.includes(booking.status)
      ? booking.status
      : "Pending";

    const updateButton = document.createElement("button");
    updateButton.className = "gold-button";
    updateButton.textContent = "Update Status";

    updateButton.addEventListener("click", async () => {
      updateButton.disabled = true;
      updateButton.textContent = "Updating...";

      try {
        await updateDoc(
          doc(db, "bookings", booking.id),
          { status: statusSelect.value }
        );

        booking.status = statusSelect.value;

        updateStatistics();

        showMessage(
          dashboardMessage,
          "Booking status updated successfully.",
          true
        );

      } catch (error) {
        console.error("Status update error:", error);

        showMessage(
          dashboardMessage,
          "Could not update status: " + error.code
        );

      } finally {
        updateButton.disabled = false;
        updateButton.textContent = "Update Status";
      }
    });

    actions.appendChild(statusSelect);
    actions.appendChild(updateButton);

    card.appendChild(actions);

    const id = document.createElement("small");
    id.className = "booking-id";
    id.textContent = "Booking ID: " + booking.id;

    card.appendChild(id);

    bookingList.appendChild(card);
  });
}

// SEARCH BOOKINGS
searchInput.addEventListener("input", () => {
  const search = searchInput.value.toLowerCase().trim();

  const filtered = allBookings.filter((booking) => {
    return [
      booking.name,
      booking.email,
      booking.phone,
      booking.eventType
    ].some(value =>
      String(value || "").toLowerCase().includes(search)
    );
  });

  renderBookings(filtered);
});
