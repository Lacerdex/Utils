"use strict";

/*
 * ============================================================
 * UI — CONVERSÃO EXCEL → CSV
 *
 * Fluxo:
 * arquivo → aba → cabeçalhos/aliases → coluna principal
 * → colunas relacionadas → formato → prévia → exportar CSV
 * ============================================================
 */

const CsvConverterUI = (() => {

    let root = null;
    let bound = false;
    let workspace = null;
    let lastPreview = null;


    function getSheet() {

        const state =
            workspace ? workspace.getState() : null;

        return state?.sheet || null;

    }


    function populateMainColumn(sheet) {

        const select =
            root.querySelector("[data-role='main-column-select']");

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
            "Selecione a coluna principal"
        );

    }


    function renderDetectedHeaders(sheet) {

        const container =
            root.querySelector("[data-role='detected-headers']");

        if (!container) {
            return;
        }

        container.innerHTML = sheet.headers
            .filter(header => String(header).trim() !== "")
            .map((header, index) => {

                const info =
                    ColumnAliases.findCategory(header);

                const categoryLabel = info
                    ? `<span class="detected-header-category">${DomUtils.escapeHtml(info.category)}</span>`
                    : "";

                return `
                    <span class="detected-header">
                        <span class="detected-header-index">${index + 1}</span>
                        <span class="detected-header-name">
                            ${DomUtils.escapeHtml(header)}
                        </span>
                        ${categoryLabel}
                    </span>
                `;

            })
            .join("");

    }


    function renderValidation(validation) {

        const container =
            root.querySelector("[data-role='column-validation']");

        if (!container) {
            return;
        }

        if (!validation) {
            container.innerHTML = "";
            return;
        }

        const statusClass =
            validation.valid ? "valid" : "invalid";

        const statusText =
            validation.valid ? "VÁLIDA" : "ATENÇÃO";

        const items = validation.messages
            .map(message => `
                <li>${DomUtils.escapeHtml(message)}</li>
            `)
            .join("");

        container.innerHTML = `
            <div class="column-validation ${statusClass}">
                <span class="validation-field-status ${statusClass}">
                    ${statusText}
                </span>
                <ul>${items}</ul>
            </div>
        `;

    }


    function renderRelatedColumns(sheet, mainColumn) {

        const container =
            root.querySelector("[data-role='related-columns']");

        if (!container) {
            return;
        }

        const headers =
            sheet.headers.filter(
                header =>
                    String(header).trim() !== "" &&
                    !ExcelUtils.areEqual(header, mainColumn)
            );

        const suggested =
            CsvTransformValidator.suggestRelatedColumns(
                headers,
                mainColumn
            );

        const suggestedSet =
            new Set(suggested);

        const allHeaders =
            [mainColumn, ...headers];

        /*
         * Sugestões por alias aparecem primeiro.
         */
        const ordered = [
            ...suggested,
            ...headers.filter(
                header => !suggestedSet.has(header)
            )
        ];

        const seen =
            new Set();

        const uniqueOrdered =
            ordered.filter(header => {

                const key =
                    ExcelUtils.normalizeForComparison(header);

                if (
                    seen.has(key) ||
                    ExcelUtils.areEqual(header, mainColumn)
                ) {
                    return false;
                }

                seen.add(key);
                return true;

            });

        container.innerHTML = uniqueOrdered.map(header => {

            const checked =
                suggestedSet.has(header);

            return `
                <label class="column-check${checked ? " checked" : ""}">
                    <input
                        type="checkbox"
                        name="csv-columns"
                        value="${DomUtils.escapeHtml(header)}"
                        ${checked ? "checked" : ""}
                    >
                    <span>${DomUtils.escapeHtml(header)}</span>
                </label>
            `;

        }).join("");

    }


    function onSheetSelected(context) {

        const sheet =
            context.sheet;

        const configSection =
            root.querySelector("[data-role='config-section']");

        renderDetectedHeaders(sheet);
        populateMainColumn(sheet);

        if (configSection) {
            configSection.hidden = false;
        }

        renderValidation(null);
        hidePreview();

        const mainSelect =
            root.querySelector("[data-role='main-column-select']");

        if (mainSelect) {

            mainSelect.onchange = () => {

                const validation =
                    mainSelect.value
                        ? CsvTransformValidator.validateMainColumn(
                            sheet,
                            mainSelect.value
                        )
                        : null;

                renderValidation(validation);
                renderRelatedColumns(sheet, mainSelect.value);
                hidePreview();

            };

        }

        context.log(
            `Aba carregada: ${sheet.rowCount} linha(s), ` +
            `${sheet.columnCount} coluna(s).`
        );

    }


    function selectedColumns() {

        return [...root.querySelectorAll("input[name='csv-columns']:checked")]
            .map(input => input.value);

    }


    function hidePreview() {

        const section =
            root.querySelector("[data-role='preview-section']");

        if (section) {
            section.hidden = true;
        }

        lastPreview = null;

    }


    function generatePreview() {

        const log =
            workspace.log;

        const sheet =
            getSheet();

        if (!sheet) {

            log("Selecione um arquivo e uma aba antes de gerar a prévia.");
            return;

        }

        const mainSelect =
            root.querySelector("[data-role='main-column-select']");

        const modeInput =
            root.querySelector("input[name='csv-mode']:checked");

        const separatorInput =
            root.querySelector("[data-role='concat-separator']");

        const removeDuplicatesInput =
            root.querySelector("input[name='csv-duplicates']:checked");

        try {

            const mainColumn =
                mainSelect?.value;

            const validation =
                CsvTransformValidator.validateMainColumn(
                    sheet,
                    mainColumn
                );

            renderValidation(validation);

            if (!validation.valid) {

                throw new Error(
                    "Corrija os problemas da coluna principal antes de continuar."
                );

            }

            lastPreview =
                CsvTransformValidator.transform(
                    sheet,
                    {
                        mainColumn,
                        columns: selectedColumns(),
                        mode: modeInput?.value || "concat",
                        separator: separatorInput?.value || ";",
                        removeDuplicates:
                            removeDuplicatesInput?.value === "remove"
                    }
                );

            renderPreview(lastPreview);

            log(
                `Prévia gerada: ${lastPreview.rows.length} registro(s), ` +
                `formato ${lastPreview.mode === "split" ? "quebra de colunas" : "concatenado"}.`
            );

        } catch (error) {

            log(`ERRO: ${error.message}`);
            hidePreview();

        }

    }


    function renderPreview(preview) {

        const section =
            root.querySelector("[data-role='preview-section']");

        const summary =
            root.querySelector("[data-role='preview-summary']");

        const container =
            root.querySelector("[data-role='preview-table']");

        if (!section || !summary || !container) {
            return;
        }

        summary.innerHTML = `

            <div class="validation-summary-item">
                <span>Registros</span>
                <strong>${preview.rows.length}</strong>
            </div>

            <div class="validation-summary-item">
                <span>Colunas</span>
                <strong>${preview.headers.length}</strong>
            </div>

            <div class="validation-summary-item">
                <span>Formato</span>
                <strong class="info">
                    ${preview.mode === "split" ? "Quebra" : "Concatenado"}
                </strong>
            </div>

        `;

        const maxPreview = 20;

        const head = `
            <thead>
                <tr>
                    ${preview.headers.map(header => `
                        <th>${DomUtils.escapeHtml(header)}</th>
                    `).join("")}
                </tr>
            </thead>
        `;

        const body = `
            <tbody>
                ${preview.rows.slice(0, maxPreview).map(row => `
                    <tr>
                        ${row.map(cell => `
                            <td>
                                ${cell === "" ? "—" : DomUtils.escapeHtml(String(cell))}
                            </td>
                        `).join("")}
                    </tr>
                `).join("")}
            </tbody>
        `;

        container.innerHTML = `
            <table class="consolidate-table">
                ${head}
                ${body}
            </table>
            ${preview.rows.length > maxPreview ? `
                <p class="consolidate-note">
                    Exibindo ${maxPreview} de ${preview.rows.length} registro(s).
                    Todos serão incluídos no CSV.
                </p>
            ` : ""}
        `;

        section.hidden = false;

    }


    function exportCsv() {

        const log =
            workspace.log;

        if (!lastPreview) {

            log("Gere a prévia antes de exportar o CSV.");
            return;

        }

        const csvSeparatorInput =
            root.querySelector("[data-role='csv-separator']");

        try {

            const csvText =
                CsvWriter.buildCsv(
                    lastPreview.headers,
                    lastPreview.rows,
                    csvSeparatorInput?.value || ","
                );

            CsvWriter.download(
                csvText,
                "conversao.csv"
            );

            log(
                `CSV exportado com ${lastPreview.rows.length} registro(s) ` +
                `(UTF-8 com BOM).`
            );

        } catch (error) {

            log(`ERRO: ${error.message}`);

        }

    }


    function init() {

        root = document.getElementById("page-validator-csv");

        if (!root || bound) {
            return;
        }

        const logElement =
            root.querySelector("[data-role='log']");

        workspace = SheetWorkspace.bind(root, {
            logElement,
            onSheetSelected,
            onReset() {

                const configSection =
                    root.querySelector("[data-role='config-section']");

                const detected =
                    root.querySelector("[data-role='detected-headers']");

                const validation =
                    root.querySelector("[data-role='column-validation']");

                const related =
                    root.querySelector("[data-role='related-columns']");

                const mainSelect =
                    root.querySelector("[data-role='main-column-select']");

                if (configSection) configSection.hidden = true;
                if (detected) detected.innerHTML = "";
                if (validation) validation.innerHTML = "";
                if (related) related.innerHTML = "";

                if (mainSelect) {

                    mainSelect.innerHTML = `
                        <option value="">
                            Selecione a coluna principal
                        </option>
                    `;

                }

                hidePreview();

            }
        });

        root.querySelector("[data-role='generate-preview']")
            .addEventListener("click", generatePreview);

        root.querySelector("[data-role='export-csv']")
            .addEventListener("click", exportCsv);

        bound = true;

    }


    function reset() {

        if (workspace) {
            workspace.reset();
        }

        hidePreview();

    }


    ValidatorRegistry.register({
        id: "csv",
        pageId: "page-validator-csv",
        title: "Excel → CSV",
        ready: true,
        init,
        reset
    });


    return { init, reset };

})();