
/* =========================================================
   EVENTORA - MAIN JAVASCRIPT
   Royal Cream & Champagne Gold Theme
   File: js/script.js
========================================================= */

"use strict";

/* ---------- PAGE READY ---------- */

document.addEventListener("DOMContentLoaded", function () {

    initializeFooterYear();
    initializeMobileNavigation();
    initializeGalleryFilters();
    initializeSmoothScrolling();
    initializeScrollReveal();
    initializeBackToTop();
    initializeActiveNavigation();

});


/* ---------- AUTOMATIC FOOTER YEAR ---------- */

function initializeFooterYear() {

    const yearElements = document.querySelectorAll(
        "#year, #currentYear, .current-year"
    );

    yearElements.forEach(function (element) {
        element.textContent = new Date().getFullYear();
    });

}


/* ---------- MOBILE NAVIGATION ---------- */

function initializeMobileNavigation() {

    const menuButtons = document.querySelectorAll(
        ".menu-toggle, #menuToggle"
    );

    menuButtons.forEach(function (button) {

        button.addEventListener("click", function () {

            const navbar = button.closest("header, nav, .navbar, .header");

            const menu = navbar
                ? navbar.querySelector(".nav-links")
                : document.querySelector(".nav-links");

            if (!menu) return;

            const isOpen = menu.classList.toggle("active");

            button.setAttribute("aria-expanded", String(isOpen));

        });

    });

    /* Close the existing mobile menu after selecting a link */

    document.querySelectorAll(".nav-links a").forEach(function (link) {

        link.addEventListener("click", function () {

            const menu = link.closest(".nav-links");

            if (menu) {
                menu.classList.remove("active");
            }

            const header = link.closest("header, nav, .navbar, .header");

            const button = header
                ? header.querySelector(".menu-toggle, #menuToggle")
                : null;

            if (button) {
                button.setAttribute("aria-expanded", "false");
            }

        });

    });

}


/* ---------- GALLERY FILTERS ---------- */

function initializeGalleryFilters() {

    const filterButtons = document.querySelectorAll(
        "[data-filter]"
    );

    const galleryItems = document.querySelectorAll(
        "[data-category]"
    );

    if (!filterButtons.length || !galleryItems.length) return;

    filterButtons.forEach(function (button) {

        button.addEventListener("click", function () {

            const selectedCategory = (
                button.getAttribute("data-filter") || "all"
            ).toLowerCase();

            filterButtons.forEach(function (item) {

                item.classList.remove("active");
                item.setAttribute("aria-pressed", "false");

            });

            button.classList.add("active");
            button.setAttribute("aria-pressed", "true");

            galleryItems.forEach(function (item) {

                const itemCategory = (
                    item.getAttribute("data-category") || ""
                ).toLowerCase();

                const shouldShow =
                    selectedCategory === "all" ||
                    selectedCategory === itemCategory;

                item.hidden = !shouldShow;

            });

        });

    });

}


/* ---------- SMOOTH SCROLLING ---------- */

function initializeSmoothScrolling() {

    const anchorLinks = document.querySelectorAll(
        'a[href^="#"]'
    );

    anchorLinks.forEach(function (link) {

        link.addEventListener("click", function (event) {

            const targetId = link.getAttribute("href");

            if (!targetId || targetId === "#") return;

            const target = document.querySelector(targetId);

            if (!target) return;

            event.preventDefault();

            target.scrollIntoView({
                behavior: "smooth",
                block: "start"
            });

        });

    });

}


/* ---------- SCROLL REVEAL ANIMATIONS ---------- */

function initializeScrollReveal() {

    const revealElements = document.querySelectorAll(
        ".reveal, .reveal-up, .service-card, .gallery-item, .contact-card"
    );

    if (!revealElements.length) return;

    if (!("IntersectionObserver" in window)) {
        revealElements.forEach(function (element) {
            element.classList.add("is-visible");
        });
        return;
    }

    const observer = new IntersectionObserver(
        function (entries, currentObserver) {

            entries.forEach(function (entry) {

                if (entry.isIntersecting) {

                    entry.target.classList.add("is-visible");

                    currentObserver.unobserve(entry.target);

                }

            });

        },
        {
            threshold: 0.12,
            rootMargin: "0px 0px -40px 0px"
        }
    );

    revealElements.forEach(function (element) {
        observer.observe(element);
    });

}


/* ---------- BACK TO TOP BUTTON ---------- */

function initializeBackToTop() {

    const button = document.querySelector(
        "#backToTop, .back-to-top"
    );

    if (!button) return;

    button.addEventListener("click", function () {

        window.scrollTo({
            top: 0,
            behavior: "smooth"
        });

    });

    window.addEventListener("scroll", function () {

        if (window.scrollY > 400) {
            button.classList.add("visible");
        } else {
            button.classList.remove("visible");
        }

    });

}


/* ---------- ACTIVE NAVIGATION LINK ---------- */

function initializeActiveNavigation() {

    const currentPage = window.location.pathname
        .split("/")
        .pop()
        .toLowerCase() || "index.html";

    const navigationLinks = document.querySelectorAll(
        ".nav-links a, .royal-nav-links a"
    );

    navigationLinks.forEach(function (link) {

        const linkPage = link.getAttribute("href");

        if (!linkPage || linkPage.startsWith("#")) return;

        const normalizedLink = linkPage
            .split("/")
            .pop()
            .toLowerCase();

        if (normalizedLink === currentPage) {

            link.classList.add("active");
            link.setAttribute("aria-current", "page");

        } else {

            link.classList.remove("active");
            link.removeAttribute("aria-current");

        }

    });

}


/* ---------- CONSOLE BRANDING ---------- */

console.log(
    "%c EVENTORA ",
    "background:#c7a66a;color:#352719;font-size:20px;font-weight:bold;padding:10px;"
);

console.log(
    "Creating Moments. Designing Memories."
);
