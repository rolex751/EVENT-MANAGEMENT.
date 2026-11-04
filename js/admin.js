
/* =========================================
   EVENTORA - ADMIN DASHBOARD
   Firebase Authentication & Firestore
   ========================================= */

import {
  initializeApp,
  getApps,
  getApp
} from "https://www.gstatic.com/firebasejs/13.2.0/firebase-app.js";

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


/* =========================================
   FIREBASE CONFIGURATION
   ========================================= */

const firebaseConfig = {
  apiKey: "AIzaSyA184UnR0cJDEm9yj0UN44y0VM1SgTxa8Q",
  authDomain: "event-management-93edc.firebaseapp.com",
  projectId: "event-management-93edc",
  storageBucket: "event-management-93edc.firebasestorage.app",
  messagingSenderId: "327602461080",
  appId: "1:327602461080:web:eb96abf94de99d1bac73ed",
  measurementId: "G-NFFDH9C4ZF"
};


/* =========================================
   AUTHORIZED ADMIN ACCOUNTS
   ========================================= */

const ADMIN_UIDS = [
  "tYvI7X6zi4OpLhUkedWC9U4t8sG3",
  "5Fbm7H1qtzXIMrG7e580Cx2m36h2"
];


/* =========================================
   INITIALIZE FIREBASE
   ========================================= */

const app = getApps().length
  ? getApp()
  : initializeApp(firebaseConfig);

const auth = getAuth(app);
const db = getFirestore(app);


/* =========================================
   HTML ELEMENTS
   ========================================= */

const loginSection = document.getElementById("loginSection");
const dashboardSection = document.getElementById("dashboardSection");

const loginForm = document.getElementById("loginForm");
const loginButton = document.getElementById("loginButton");
const loginMessage = document.getElementById("loginMessage");

const dashboardMessage = document.getElementById("dashboardMessage");
const bookingList = document.getElementById("bookingList");
const searchInput = document.getElementById("searchBookings");

const signedInEmail = document.getElementById("signedInEmail");

const totalCount = document.getElementById("totalCount");
const pendingCount = document.getElementById("pendingCount");
const acceptedCount = document.getElementById("acceptedCount");
const completedCount = document.getElementById("completedCount");

const logoutButton = document.getElementById("logoutButton");
const refreshButton = document.getElementById("refreshButton");

const requiredElements = [
  loginSection,
  dashboardSection,
  loginForm,
  loginButton,
  loginMessage,
  dashboardMessage,
  bookingList,
  searchInput,
  signedInEmail,
  totalCount,
  pendingCount,
  acceptedCount,
  completedCount,
  logoutButton,
  refreshButton
];

if (requiredElements.some(element => !element)) {
  console.error("EVENTORA: Required admin HTML elements are missing.");
  throw new Error("Please check the element IDs in admin.html.");
}


/* =========================================
   APPLICATION STATE
   ========================================= */

let allBookings = [];
let isLoadingBookings = false;


/* =========================================
   FOOTER YEAR
   ========================================= */

const yearElement = document.getElementById("year");

if (yearElement) {
  yearElement.textContent = new Date().getFullYear();
}


/* =========================================
   MESSAGE FUNCTION
   ========================================= */

function showMessage(element, message, type = "error") {

  element.textContent = message;

  element.style.color =
    type === "success" ? "#76c69a" :
    type === "info" ? "#e2c486" :
    "#e58b83";

  element.setAttribute("role", "status");
  element.setAttribute("aria-live", "polite");
}


/* =========================================
   FRIENDLY FIREBASE ERROR MESSAGES
   ========================================= */

function getFriendlyError(error) {

  const messages = {
    "auth/invalid-credential":
      "Incorrect email or password. Please try again.",

    "auth/user-not-found":
      "No account was found with this email address.",

    "auth/wrong-password":
      "Incorrect password. Please try again.",

    "auth/invalid-email":
      "Please enter a valid email address.",

    "auth/too-many-requests":
      "Too many attempts. Please try again later.",

    "auth/network-request-failed":
      "Network error. Please check your internet connection.",

    "permission-denied":
      "You do not have permission to access this information.",

    "unavailable":
      "The service is temporarily unavailable. Please try again."
  };

  return messages[error.code] ||
    "Something went wrong. Please try again.";
}


/* =========================================
   ADMIN LOGIN
   ========================================= */

loginForm.addEventListener("submit", async (event) => {

  event.preventDefault();

  const email = document.getElementById("adminEmail").value.trim();
  const password = document.getElementById("adminPassword").value;

  if (!email || !password) {
    showMessage(loginMessage, "Please enter your email and password.");
    return;
  }

  loginButton.disabled = true;
  loginButton.textContent = "Signing In...";

  showMessage(loginMessage, "Verifying your account...", "info");

  try {

    await signInWithEmailAndPassword(auth, email, password);

  } catch (error) {

    console.error("EVENTORA login error:", error);

    showMessage(loginMessage, getFriendlyError(error));

    loginButton.disabled = false;
    loginButton.textContent = "Sign In";

  }

});


/* =========================================
   CHECK ADMIN AUTHORIZATION
   ========================================= */

onAuthStateChanged(auth, async (user) => {

  if (!user) {

    loginSection.hidden = false;
    dashboardSection.hidden = true;

    signedInEmail.textContent = "";

    loginButton.disabled = false;
    loginButton.textContent = "Sign In";

    allBookings = [];

    return;
  }


  // Check whether the signed-in user is authorized

  if (!ADMIN_UIDS.includes(user.uid)) {

    showMessage(
      loginMessage,
      "Access denied. This account is not an authorized EVENTORA administrator."
    );

    try {
      await signOut(auth);
    } catch (error) {
      console.error("Unauthorized logout error:", error);
    }

    return;
  }


  // Display dashboard

  loginSection.hidden = true;
  dashboardSection.hidden = false;

  signedInEmail.textContent = user.email || "Administrator";

  await loadBookings();

});


/* =========================================
   ADMIN LOGOUT
   ========================================= */

logoutButton.addEventListener("click", async () => {

  logoutButton.disabled = true;
  logoutButton.textContent = "Signing Out...";

  try {

    await signOut(auth);

    allBookings = [];

  } catch (error) {

    console.error("EVENTORA logout error:", error);

    showMessage(
      dashboardMessage,
      getFriendlyError(error)
    );

  } finally {

    logoutButton.disabled = false;
    logoutButton.textContent = "Logout";

  }

});


/* =========================================
   REFRESH BOOKINGS
   ========================================= */

refreshButton.addEventListener("click", async () => {

  await loadBookings();

});


/* =========================================
   LOAD BOOKINGS FROM FIRESTORE
   ========================================= */

async function loadBookings() {

  if (isLoadingBookings) return;

  isLoadingBookings = true;

  refreshButton.disabled = true;
  refreshButton.textContent = "Refreshing...";

  bookingList.textContent = "Loading event enquiries...";

  showMessage(
    dashboardMessage,
    "Fetching the latest bookings...",
    "info"
  );

  try {

    const snapshot = await getDocs(
      collection(db, "bookings")
    );

    allBookings = snapshot.docs.map((bookingDoc) => ({
      id: bookingDoc.id,
      ...bookingDoc.data()
    }));


    // Sort newest enquiries first

    allBookings.sort((a, b) => {

      const dateA = a.createdAt?.toMillis?.() || 0;
      const dateB = b.createdAt?.toMillis?.() || 0;

      return dateB - dateA;

    });


    updateStatistics();

    renderBookings(getFilteredBookings());

    showMessage(
      dashboardMessage,
      `${allBookings.length} event enquiries loaded successfully.`,
      "success"
    );

  } catch (error) {

    console.error("EVENTORA Firestore loading error:", error);

    bookingList.textContent = "Unable to load event enquiries.";

    showMessage(
      dashboardMessage,
      getFriendlyError(error)
    );

  } finally {

    isLoadingBookings = false;

    refreshButton.disabled = false;
    refreshButton.textContent = "Refresh";

  }

}


/* =========================================
   UPDATE DASHBOARD STATISTICS
   ========================================= */

function updateStatistics() {

  totalCount.textContent = allBookings.length;

  pendingCount.textContent =
    allBookings.filter(
      booking => booking.status === "Pending"
    ).length;

  acceptedCount.textContent =
    allBookings.filter(
      booking => booking.status === "Accepted"
    ).length;

  completedCount.textContent =
    allBookings.filter(
      booking => booking.status === "Completed"
    ).length;

}


/* =========================================
   CREATE SAFE DETAIL ELEMENTS
   ========================================= */

function addDetail(parent, label, value) {

  const paragraph = document.createElement("p");

  paragraph.className = "detail";

  const strong = document.createElement("strong");

  strong.textContent = label + ": ";

  paragraph.appendChild(strong);

  paragraph.appendChild(
    document.createTextNode(
      value === undefined || value === null || value === ""
        ? "Not provided"
        : String(value)
    )
  );

  parent.appendChild(paragraph);

}


/* =========================================
   DISPLAY BOOKING CARDS
   ========================================= */

function renderBookings(bookings) {

  bookingList.replaceChildren();

  if (bookings.length === 0) {

    const empty = document.createElement("p");

    empty.className = "empty-state";

    empty.textContent = searchInput.value.trim()
      ? "No enquiries match your search."
      : "No event enquiries found yet.";

    bookingList.appendChild(empty);

    return;
  }


  bookings.forEach((booking) => {

    const card = document.createElement("article");

    card.className = "booking-card";


    // Customer name

    const heading = document.createElement("h3");

    heading.textContent = booking.name || "Customer Enquiry";

    card.appendChild(heading);


    // Booking details

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
      created
        ? created.toLocaleString("en-IN")
        : "Date unavailable"
    );

    addDetail(
      details,
      "Current Status",
      booking.status || "Pending"
    );

    card.appendChild(details);


    // Additional requirements

    const requirements = document.createElement("p");

    requirements.className = "booking-requirements";

    requirements.textContent =
      "Additional Requirements: " +
      (booking.requirements || "None provided");

    card.appendChild(requirements);


    // Status update section

    const actions = document.createElement("div");

    actions.className = "booking-actions";

    const statusSelect = document.createElement("select");

    statusSelect.setAttribute(
      "aria-label",
      `Booking status for ${booking.name || "customer"}`
    );

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


    // Update status button

    const updateButton = document.createElement("button");

    updateButton.className = "gold-button";

    updateButton.textContent = "Update Status";


    updateButton.addEventListener("click", async () => {

      const newStatus = statusSelect.value;

      if (newStatus === booking.status) {

        showMessage(
          dashboardMessage,
          "The booking already has this status.",
          "info"
        );

        return;
      }

      updateButton.disabled = true;
      statusSelect.disabled = true;

      updateButton.textContent = "Updating...";

      try {

        await updateDoc(
          doc(db, "bookings", booking.id),
          {
            status: newStatus
          }
        );


        // Update local booking data

        booking.status = newStatus;

        updateStatistics();


        showMessage(
          dashboardMessage,
          `Booking status successfully changed to ${newStatus}.`,
          "success"
        );


        // Refresh visible cards with the updated information

        renderBookings(getFilteredBookings());

      } catch (error) {

        console.error("EVENTORA status update error:", error);

        showMessage(
          dashboardMessage,
          getFriendlyError(error)
        );

        updateButton.disabled = false;
        statusSelect.disabled = false;

        updateButton.textContent = "Update Status";

      }

    });


    actions.appendChild(statusSelect);
    actions.appendChild(updateButton);

    card.appendChild(actions);


    // Booking reference ID

    const id = document.createElement("small");

    id.className = "booking-id";

    id.textContent = "Booking ID: " + booking.id;

    card.appendChild(id);


    bookingList.appendChild(card);

  });

}


/* =========================================
   SEARCH FILTER
   ========================================= */

function getFilteredBookings() {

  const search = searchInput.value.toLowerCase().trim();

  if (!search) {
    return allBookings;
  }

  return allBookings.filter((booking) => {

    const searchableValues = [
      booking.name,
      booking.email,
      booking.phone,
      booking.eventType,
      booking.eventDate,
      booking.location,
      booking.budget,
      booking.status,
      booking.requirements,
      ...(Array.isArray(booking.services) ? booking.services : [])
    ];

    return searchableValues.some(value =>
      String(value || "").toLowerCase().includes(search)
    );

  });

}


/* =========================================
   SEARCH BOOKINGS
   ========================================= */

searchInput.addEventListener("input", () => {

  renderBookings(getFilteredBookings());

});


console.log("EVENTORA admin dashboard initialized successfully.");
