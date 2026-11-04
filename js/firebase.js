

import { initializeApp } from "https://www.gstatic.com/firebasejs/13.2.0/firebase-app.js";

import {
  getFirestore
} from "https://www.gstatic.com/firebasejs/13.2.0/firebase-firestore.js";

const firebaseConfig = {
  apiKey: "AIzaSyA184UnR0cJDEm9yj0UN44y0VM1SgTxa8Q",
  authDomain: "event-management-93edc.firebaseapp.com",
  projectId: "event-management-93edc",
  storageBucket: "event-management-93edc.firebasestorage.app",
  messagingSenderId: "327602461080",
  appId: "1:327602461080:web:eb96abf94de99d1bac73ed"
};

const app = initializeApp(firebaseConfig);

export const db = getFirestore(app);
