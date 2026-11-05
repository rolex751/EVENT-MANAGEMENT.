
document.addEventListener("DOMContentLoaded", function () {

    // Automatically update footer year
    const currentYear = new Date().getFullYear();

    const yearElements = document.querySelectorAll(
        "#year, #eventoraYear"
    );

    yearElements.forEach(function (element) {
        element.textContent = currentYear;
    });

    // Mobile navigation menu
    const menuButton = document.querySelector(".menu-toggle");
    const navigation = document.querySelector(".nav-links");

    if (menuButton && navigation) {
        menuButton.addEventListener("click", function () {
            navigation.classList.toggle("active");

            const isOpen = navigation.classList.contains("active");
            menuButton.setAttribute("aria-expanded", isOpen);
        });

        navigation.querySelectorAll("a").forEach(function (link) {
            link.addEventListener("click", function () {
                navigation.classList.remove("active");
                menuButton.setAttribute("aria-expanded", "false");
            });
        });
    }

});
