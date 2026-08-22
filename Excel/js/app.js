"use strict";

/*
 * ============================================================
 * UTILS EXCEL
 * Shell da aplicação: navegação + ciclo de vida dos validadores
 * ============================================================
 */

const ExcelApp = (() => {

    const state = {
        currentPage: "validators",
        currentValidator: null
    };


    function init() {
        initializeNavigation();
        initializeValidators();
        initializeBackButtons();
    }

    function initializeNavigation() {

        document.querySelectorAll(".nav-item").forEach(button => {
            button.addEventListener("click", () => {
                navigateTo(button.dataset.page);
            });
        });
    }


    function initializeValidators() {

        document.querySelectorAll("[data-validator]").forEach(button => {
            button.addEventListener("click", () => {
                openValidator(button.dataset.validator);
            });

        });

    }


    function initializeBackButtons() {

        document.querySelectorAll("[data-back-page]").forEach(button => {

            button.addEventListener("click", () => {
                navigateTo(button.dataset.backPage);
            });

        });

    }


    function hideAllPages() {

        document.querySelectorAll(".page").forEach(section => {
            section.hidden = true;
            section.classList.remove("active");
        });

    }


    function showPage(pageId) {

        const target = document.getElementById(pageId);

        if (!target) {
            return false;
        }

        target.hidden = false;
        target.classList.add("active");

        return true;

    }


    function setActiveNav(page) {

        document.querySelectorAll(".nav-item").forEach(item => {
            item.classList.remove("active");
        });

        const activeButton =
            document.querySelector(`.nav-item[data-page="${page}"]`);

        if (activeButton) {
            activeButton.classList.add("active");
        }

    }


    function navigateTo(page) {

        if (state.currentValidator) {

            const current =
                ValidatorRegistry.get(state.currentValidator);

            if (current && typeof current.reset === "function") {
                current.reset();
            }

            state.currentValidator = null;

        }

        state.currentPage = page;

        setActiveNav(page);
        hideAllPages();
        showPage(`page-${page}`);

    }


    function openValidator(type) {

        const validator = ValidatorRegistry.get(type);

        if (!validator) {

            console.warn(
                `[Utils Excel] Validador não registrado: ${type}`
            );

            return;

        }

        state.currentValidator = type;
        state.currentPage = "validators";

        setActiveNav("validators");
        hideAllPages();
        showPage(validator.pageId);

        if (typeof validator.init === "function") {
            validator.init();
        }

    }


    return {

        init,
        navigateTo,
        openValidator

    };

})();


document.addEventListener("DOMContentLoaded", () => {
    ExcelApp.init();
});
