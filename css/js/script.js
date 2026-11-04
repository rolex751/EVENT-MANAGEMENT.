
/* =========================================
   EVENTORA - MAIN JAVASCRIPT
   Creating Moments. Designing Memories.
   ========================================= */

document.addEventListener("DOMContentLoaded", () => {

  // 1. AUTOMATIC FOOTER COPYRIGHT YEAR
  const yearElement = document.getElementById("year");

  if (yearElement) {
    yearElement.textContent = new Date().getFullYear();
  }

  // 2. MOBILE NAVIGATION MENU
  const menuToggle = document.getElementById("menuToggle");
  const navLinks = document.getElementById("navLinks");

  if (menuToggle && navLinks) {

    function closeMenu() {
      navLinks.classList.remove("open");
      menuToggle.setAttribute("aria-expanded", "false");
      menuToggle.setAttribute("aria-label", "Open navigation");
    }

    function toggleMenu() {
      const isOpen = navLinks.classList.toggle("open");

      menuToggle.setAttribute("aria-expanded", String(isOpen));
      menuToggle.setAttribute(
        "aria-label",
        isOpen ? "Close navigation" : "Open navigation"
      );
    }

    menuToggle.addEventListener("click", toggleMenu);

    // Close menu after selecting a navigation link
    navLinks.querySelectorAll("a").forEach((link) => {
      link.addEventListener("click", closeMenu);
    });

    // Close menu when Escape key is pressed
    document.addEventListener("keydown", (event) => {
      if (event.key === "Escape") {
        closeMenu();
      }
    });

    // Close menu when switching to desktop screen
    window.addEventListener("resize", () => {
      if (window.innerWidth > 760) {
        closeMenu();
      }
    });

  }

  // 3. GALLERY CATEGORY FILTERING
  const filterButtons = document.querySelectorAll(".filter-btn");
  const galleryItems = document.querySelectorAll(".gallery-item");

  if (filterButtons.length > 0 && galleryItems.length > 0) {

    filterButtons.forEach((button) => {

      button.addEventListener("click", () => {

        const selectedCategory = button.dataset.filter;

        // Update active filter button
        filterButtons.forEach((item) => {
          item.classList.remove("active");
        });

        button.classList.add("active");

        // Show matching gallery images
        galleryItems.forEach((item) => {

          const itemCategory = item.dataset.category;

          const shouldShow =
            selectedCategory === "all" ||
            itemCategory === selectedCategory;

          item.classList.toggle("hidden", !shouldShow);

        });

      });

    });

  }

  console.log("EVENTORA website loaded successfully.");

});
