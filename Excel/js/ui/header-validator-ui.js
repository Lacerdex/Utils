"use strict";

/*
 * ============================================================
 * UI — VALIDADOR DE CABEÇALHO
 * ============================================================
 */

const HeaderValidatorUI = (() => {

    let workspace = null;
    let root = null;
    let bound = false;


    function renderHeaders(sheet, container) {

        container.innerHTML = "";

        sheet.headers.forEach((header, index) => {

            const element = document.createElement("div");
            element.className = "detected-header";

            element.innerHTML = `
                <span class="detected-header-index">
                    ${index + 1}
                </span>
                <span class="detected-header-name">
                    ${DomUtils.escapeHtml(header || "(vazio)")}
                </span>
            `;

            container.appendChild(element);

        });

    }


    function renderSummary(result, container) {

        const summary = result.summary;

        container.innerHTML = `

            <div class="validation-summary-item">
                <span>Campos esperados</span>
                <strong>${summary.expected}</strong>
            </div>

            <div class="validation-summary-item">
                <span>Encontrados</span>
                <strong class="success">${summary.found}</strong>
            </div>

            <div class="validation-summary-item">
                <span>Ausentes</span>
                <strong class="${summary.missing > 0 ? "warning" : "success"}">
                    ${summary.missing}
                </strong>
            </div>

            <div class="validation-summary-item">
                <span>Obrigatórios ausentes</span>
                <strong class="${summary.requiredMissing > 0 ? "danger" : "success"}">
                    ${summary.requiredMissing}
                </strong>
            </div>

            <div class="validation-summary-item">
                <span>Colunas extras</span>
                <strong>${summary.extra}</strong>
            </div>

            <div class="validation-summary-item">
                <span>Duplicados</span>
                <strong>${summary.duplicates}</strong>
            </div>

        `;

    }


    function renderFields(result, container) {

        container.innerHTML = "";

        Object.values(result.fields).forEach(field => {

            const element = document.createElement("div");
            element.className = "validation-field";

            let statusClass;
            let statusText;

            if (field.status === "found") {
                statusClass = "valid";
                statusText = "ENCONTRADO";
            } else if (field.required) {
                statusClass = "invalid";
                statusText = "OBRIGATÓRIO";
            } else {
                statusClass = "optional";
                statusText = "OPCIONAL";
            }

            const detail = field.status === "found"
                ? `Coluna encontrada: <strong>${DomUtils.escapeHtml(field.originalHeader)}</strong>`
                : "Coluna não encontrada.";

            element.innerHTML = `
                <div class="validation-field-main">
                    <div class="validation-field-name">
                        ${DomUtils.escapeHtml(field.label)}
                    </div>
                    <div class="validation-field-detail">
                        ${detail}
                    </div>
                </div>
                <span class="validation-field-status ${statusClass}">
                    ${statusText}
                </span>
            `;

            container.appendChild(element);

        });

    }


    function renderExtraColumns(result, container) {

        const columns = result.extraColumns || [];

        if (!columns.length) {
            container.innerHTML = "";
            return;
        }

        container.innerHTML = `
            <h3>Colunas não reconhecidas</h3>
            <div class="extra-column-list">
                ${columns.map(column => `
                    <span class="extra-column">
                        ${DomUtils.escapeHtml(column.header)}
                    </span>
                `).join("")}
            </div>
        `;

    }


    function onSheetSelected(context) {

        const detectedSection = root.querySelector("[data-role='detected-section']");
        const detected = root.querySelector("[data-role='detected-headers']");
        const resultSection = root.querySelector("[data-role='result-section']");
        const resultSummary = root.querySelector("[data-role='result-summary']");
        const resultFields = root.querySelector("[data-role='result-fields']");
        const extraColumns = root.querySelector("[data-role='extra-columns']");

        renderHeaders(context.sheet, detected);
        detectedSection.hidden = false;

        if (!context.schema) {
            context.log("Selecione um modelo para validar o cabeçalho.");
            resultSection.hidden = true;
            return;
        }

        const result = HeaderValidator.validate(
            context.sheet,
            context.schema
        );

        renderSummary(result, resultSummary);
        renderFields(result, resultFields);
        renderExtraColumns(result, extraColumns);

        resultSection.hidden = false;

        context.log(
            result.valid
                ? "Cabeçalho válido."
                : "Cabeçalho possui inconsistências."
        );

    }


    function init() {

        root = document.getElementById("page-validator-header");

        if (!root || bound) {
            return;
        }

        workspace = SheetWorkspace.bind(root, {

            onSheetSelected,

            onReset() {

                const detectedSection = root.querySelector("[data-role='detected-section']");
                const resultSection = root.querySelector("[data-role='result-section']");
                const detected = root.querySelector("[data-role='detected-headers']");
                const resultSummary = root.querySelector("[data-role='result-summary']");
                const resultFields = root.querySelector("[data-role='result-fields']");
                const extraColumns = root.querySelector("[data-role='extra-columns']");

                if (detectedSection) detectedSection.hidden = true;
                if (resultSection) resultSection.hidden = true;
                if (detected) detected.innerHTML = "";
                if (resultSummary) resultSummary.innerHTML = "";
                if (resultFields) resultFields.innerHTML = "";
                if (extraColumns) extraColumns.innerHTML = "";

            }

        });

        bound = true;

    }


    function reset() {

        if (workspace) {
            workspace.reset();
        }

    }


    ValidatorRegistry.register({
        id: "header",
        pageId: "page-validator-header",
        title: "Validação de cabeçalho",
        ready: true,
        init,
        reset
    });


    return { init, reset };

})();
