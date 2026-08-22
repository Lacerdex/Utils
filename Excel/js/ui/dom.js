"use strict";

/*
 * ============================================================
 * HELPERS DE DOM
 * ============================================================
 */

const DomUtils = (() => {

    function escapeHtml(value) {

        if (value === null || value === undefined) {
            return "";
        }

        return String(value)
            .replace(/&/g, "&amp;")
            .replace(/</g, "&lt;")
            .replace(/>/g, "&gt;")
            .replace(/"/g, "&quot;")
            .replace(/'/g, "&#039;");

    }


    function formatFileSize(bytes) {

        if (bytes < 1024) {
            return `${bytes} B`;
        }

        if (bytes < 1024 * 1024) {
            return `${(bytes / 1024).toFixed(2)} KB`;
        }

        return `${(bytes / 1024 / 1024).toFixed(2)} MB`;

    }


    function fillSelect(select, items, placeholder) {

        select.innerHTML = `
            <option value="">
                ${placeholder}
            </option>
        `;

        items.forEach(item => {

            const option = document.createElement("option");
            option.value = item.value;
            option.textContent = item.label;
            select.appendChild(option);

        });

    }


    function timestamp() {

        return new Date().toLocaleTimeString();

    }


    return {

        escapeHtml,
        formatFileSize,
        fillSelect,
        timestamp

    };

})();
