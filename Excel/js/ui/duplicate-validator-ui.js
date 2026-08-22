"use strict";

/*
 * ============================================================
 * UI — VALIDADOR DE DUPLICADOS
 * ============================================================
 */

const DuplicateValidatorUI = (() => {

    let workspace = null;
    let root = null;
    let bound = false;


    function populateColumns(sheet) {

        const select = root.querySelector("[data-role='column-select']");

        if (!select) {
            return;
        }

        DomUtils.fillSelect(
            select,
            sheet.headers
                .filter(header => String(header).trim() !== "")
                .map(header => ({
                    value: header,
                    label: header
                })),
            "Selecione a coluna chave"
        );

    }


    function analyze(sheet, columnName, log) {

        const resultSection = root.querySelector("[data-role='result-section']");
        const resultSummary = root.querySelector("[data-role='result-summary']");
        const resultFields = root.querySelector("[data-role='result-fields']");

        if (!columnName) {
            resultSection.hidden = true;
            return;
        }

        const duplicates =
            ExcelUtils.findDuplicateValues(
                sheet.rows,
                columnName
            );

        const uniqueCount =
            ExcelUtils.countUniqueValues(
                sheet.rows,
                columnName
            );

        resultSummary.innerHTML = `

            <div class="validation-summary-item">
                <span>Registros</span>
                <strong>${sheet.rowCount}</strong>
            </div>

            <div class="validation-summary-item">
                <span>Valores únicos</span>
                <strong class="success">${uniqueCount}</strong>
            </div>

            <div class="validation-summary-item">
                <span>Duplicados</span>
                <strong class="${duplicates.length > 0 ? "danger" : "success"}">
                    ${duplicates.length}
                </strong>
            </div>

        `;

        if (!duplicates.length) {

            resultFields.innerHTML = `
                <div class="validation-field">
                    <div class="validation-field-main">
                        <div class="validation-field-name">
                            Sem duplicidade
                        </div>
                        <div class="validation-field-detail">
                            A coluna
                            <strong>${DomUtils.escapeHtml(columnName)}</strong>
                            não possui valores repetidos.
                        </div>
                    </div>
                    <span class="validation-field-status valid">OK</span>
                </div>
            `;

        } else {

            resultFields.innerHTML = duplicates.map(value => `
                <div class="validation-field">
                    <div class="validation-field-main">
                        <div class="validation-field-name">
                            ${DomUtils.escapeHtml(String(value))}
                        </div>
                        <div class="validation-field-detail">
                            Valor repetido na coluna
                            ${DomUtils.escapeHtml(columnName)}
                        </div>
                    </div>
                    <span class="validation-field-status invalid">
                        DUPLICADO
                    </span>
                </div>
            `).join("");

        }

        resultSection.hidden = false;
        log(`${duplicates.length} valor(es) duplicado(s) em ${columnName}.`);

    }


    function onSheetSelected(context) {

        populateColumns(context.sheet);

        const select = root.querySelector("[data-role='column-select']");
        const columnSection = root.querySelector("[data-role='column-section']");

        if (columnSection) {
            columnSection.hidden = false;
        }

        if (select) {
            select.onchange = () => {
                analyze(context.sheet, select.value, context.log);
            };
        }

        const resultSection = root.querySelector("[data-role='result-section']");

        if (resultSection) {
            resultSection.hidden = true;
        }

    }


    function init() {

        root = document.getElementById("page-validator-duplicate");

        if (!root || bound) {
            return;
        }

        workspace = SheetWorkspace.bind(root, {

            onSheetSelected,

            onReset() {

                const columnSection = root.querySelector("[data-role='column-section']");
                const resultSection = root.querySelector("[data-role='result-section']");
                const resultSummary = root.querySelector("[data-role='result-summary']");
                const resultFields = root.querySelector("[data-role='result-fields']");
                const columnSelect = root.querySelector("[data-role='column-select']");

                if (columnSection) columnSection.hidden = true;
                if (resultSection) resultSection.hidden = true;
                if (resultSummary) resultSummary.innerHTML = "";
                if (resultFields) resultFields.innerHTML = "";

                if (columnSelect) {

                    columnSelect.innerHTML = `
                        <option value="">
                            Selecione a coluna chave
                        </option>
                    `;

                }

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
        id: "duplicate",
        pageId: "page-validator-duplicate",
        title: "Detecção de duplicados",
        ready: true,
        init,
        reset
    });


    return { init, reset };

})();
