"use strict";

/*
 * ============================================================
 * UI — CRUZAMENTO DE PLANILHAS
 * ============================================================
 */

const CrossValidatorUI = (() => {

    let root = null;
    let bound = false;
    let leftWorkspace = null;
    let rightWorkspace = null;
    let lastResult = null;
    let lastConsolidated = null;


    function sourceState(side) {

        const workspace = side === "left" ? leftWorkspace : rightWorkspace;

        return workspace ? workspace.getState() : null;

    }


    function bothReady() {

        const left = sourceState("left");
        const right = sourceState("right");

        return Boolean(left?.sheet && right?.sheet);

    }


    function fillColumnSelect(select, headers, selected) {

        DomUtils.fillSelect(
            select,
            (headers || [])
                .filter(header => String(header).trim() !== "")
                .map(header => ({
                    value: header,
                    label: header
                })),
            "Selecione a coluna"
        );

        if (selected) {
            select.value = selected;
        }

    }


    function currentPairs() {

        return [...root.querySelectorAll("[data-role='key-row']")].map(row => ({
            left: row.querySelector("[data-role='key-left']")?.value || "",
            right: row.querySelector("[data-role='key-right']")?.value || ""
        }));

    }


    function addKeyRow(leftValue = "", rightValue = "") {

        const list = root.querySelector("[data-role='key-list']");
        const left = sourceState("left");
        const right = sourceState("right");

        const row = document.createElement("div");
        row.className = "key-row";
        row.dataset.role = "key-row";

        row.innerHTML = `
            <select class="select" data-role="key-left"></select>
            <span class="key-row-separator">↔</span>
            <select class="select" data-role="key-right"></select>
            <button type="button" class="button button-secondary" data-role="remove-key">
                Remover
            </button>
        `;

        fillColumnSelect(
            row.querySelector("[data-role='key-left']"),
            left?.sheet?.headers || [],
            leftValue
        );

        fillColumnSelect(
            row.querySelector("[data-role='key-right']"),
            right?.sheet?.headers || [],
            rightValue
        );

        row.querySelector("[data-role='remove-key']").addEventListener("click", () => {

            if (list.querySelectorAll("[data-role='key-row']").length <= 1) {
                return;
            }

            row.remove();

        });

        list.appendChild(row);

    }


    function suggestPairs() {

        const left = sourceState("left");
        const right = sourceState("right");

        if (!left?.sheet || !right?.sheet) {
            return [];
        }

        const matches = [];

        left.sheet.headers.forEach(header => {

            const found = ExcelUtils.findColumn(right.sheet.headers, header);

            if (found) {
                matches.push({
                    left: header,
                    right: found.original
                });
            }

        });

        return matches.slice(0, 3);

    }


    function refreshKeys() {

        const keysSection = root.querySelector("[data-role='keys-section']");
        const list = root.querySelector("[data-role='key-list']");

        lastResult = null;
        lastConsolidated = null;
        hideResults();

        if (!bothReady()) {

            keysSection.hidden = true;
            list.innerHTML = "";
            return;

        }

        keysSection.hidden = false;
        list.innerHTML = "";

        const suggested = suggestPairs();

        if (suggested.length) {

            suggested.forEach(pair => addKeyRow(pair.left, pair.right));

        } else {

            addKeyRow();

        }

    }


    function renderCheckboxes(container, headers, name, checkedValues) {

        const checkedSet = new Set(checkedValues || []);

        container.innerHTML = (headers || []).map(header => {
            const checked = checkedSet.has(header);
            return `
                <label class="column-check${checked ? " checked" : ""}">
                    <input
                        type="checkbox"
                        name="${name}"
                        value="${DomUtils.escapeHtml(header)}"
                        ${checked ? "checked" : ""}
                    >
                    <span>${DomUtils.escapeHtml(header)}</span>
                </label>
            `;
        }).join("");

    }


    function selectedValues(name) {

        return [...root.querySelectorAll(`input[name="${name}"]:checked`)]
            .map(input => input.value);

    }


    function hideResults() {

        const resultSection = root.querySelector("[data-role='result-section']");
        const exportSection = root.querySelector("[data-role='export-section']");

        if (resultSection) resultSection.hidden = true;
        if (exportSection) exportSection.hidden = true;

        hideConsolidated();

    }


    function renderResult(result) {

        const resultSection = root.querySelector("[data-role='result-section']");
        const exportSection = root.querySelector("[data-role='export-section']");
        const summary = root.querySelector("[data-role='result-summary']");
        const preview = root.querySelector("[data-role='result-preview']");

        summary.innerHTML = `

            <div class="validation-summary-item">
                <span>Planilha 1</span>
                <strong>${result.summary.rowsA}</strong>
            </div>

            <div class="validation-summary-item">
                <span>Planilha 2</span>
                <strong>${result.summary.rowsB}</strong>
            </div>

            <div class="validation-summary-item">
                <span>Nas duas</span>
                <strong class="success">${result.summary.matched}</strong>
            </div>

            <div class="validation-summary-item">
                <span>Só na planilha 1</span>
                <strong class="warning">${result.summary.onlyA}</strong>
            </div>

            <div class="validation-summary-item">
                <span>Só na planilha 2</span>
                <strong class="warning">${result.summary.onlyB}</strong>
            </div>

        `;

        const sample = result.matched.slice(0, 8).map(item => {

            const left = sourceState("left");
            const previewColumn = result.keyPairs[0]?.left;
            const value = previewColumn
                ? item.rowA[previewColumn]
                : item.key;

            return `
                <div class="validation-field">
                    <div class="validation-field-main">
                        <div class="validation-field-name">
                            ${DomUtils.escapeHtml(String(value ?? item.key))}
                        </div>
                        <div class="validation-field-detail">
                            Correspondência encontrada nas duas planilhas
                        </div>
                    </div>
                    <span class="validation-field-status valid">NAS DUAS</span>
                </div>
            `;

        }).join("");

        preview.innerHTML = sample || `
            <div class="validation-field">
                <div class="validation-field-main">
                    <div class="validation-field-name">
                        Nenhuma correspondência
                    </div>
                    <div class="validation-field-detail">
                        Não houve chaves em comum com os campos selecionados.
                    </div>
                </div>
            </div>
        `;

        const left = sourceState("left");
        const right = sourceState("right");

        const leftKeys = result.keyPairs.map(pair => pair.left);
        const rightKeys = result.keyPairs.map(pair => pair.right);

        renderCheckboxes(
            root.querySelector("[data-role='export-columns-a']"),
            leftKeys,
            "export-a",
            leftKeys
        );

        renderCheckboxes(
            root.querySelector("[data-role='export-columns-b']"),
            rightKeys,
            "export-b",
            rightKeys
        );

        resultSection.hidden = false;
        exportSection.hidden = false;

    }


    function runCross() {

        const left = sourceState("left");
        const right = sourceState("right");
        const log = leftWorkspace.log;

        try {

            lastResult = CrossValidator.compare(
                left.sheet,
                right.sheet,
                currentPairs()
            );

            renderResult(lastResult);

            log(
                `Cruzamento: ${lastResult.summary.matched} nas duas, ` +
                `${lastResult.summary.onlyA} só na 1, ` +
                `${lastResult.summary.onlyB} só na 2.`
            );

        } catch (error) {

            log(`ERRO: ${error.message}`);
            hideResults();

        }

    }


    function runConsolidate() {

        const left = sourceState("left");
        const right = sourceState("right");
        const log = leftWorkspace.log;

        try {

            lastConsolidated = CrossValidator.consolidate(
                left.sheet,
                right.sheet,
                currentPairs()
            );

            renderConsolidated(lastConsolidated);

            log(
                `Consolidação: ${lastConsolidated.summary.rows} registro(s) na planilha final ` +
                `(nas duas: ${lastConsolidated.summary.matched}, ` +
                `só na 1: ${lastConsolidated.summary.onlyA}, ` +
                `só na 2: ${lastConsolidated.summary.onlyB}).`
            );

        } catch (error) {

            log(`ERRO: ${error.message}`);
            hideConsolidated();

        }

    }


    function renderConsolidated(consolidated) {

        const section = root.querySelector("[data-role='consolidate-section']");
        const summary = root.querySelector("[data-role='consolidate-summary']");
        const preview = root.querySelector("[data-role='consolidate-preview']");

        if (!section || !summary || !preview) {
            return;
        }

        summary.innerHTML = `

            <div class="validation-summary-item">
                <span>Planilha final</span>
                <strong>${consolidated.summary.rows}</strong>
            </div>

            <div class="validation-summary-item">
                <span>Nas duas</span>
                <strong class="success">${consolidated.summary.matched}</strong>
            </div>

            <div class="validation-summary-item">
                <span>Só na planilha 1</span>
                <strong class="warning">${consolidated.summary.onlyA}</strong>
            </div>

            <div class="validation-summary-item">
                <span>Só na planilha 2</span>
                <strong class="warning">${consolidated.summary.onlyB}</strong>
            </div>

        `;

        const maxPreview = 20;
        const previewRows = consolidated.rows.slice(0, maxPreview);

        const head = `
            <thead>
                <tr>
                    ${consolidated.columns.map(column => `
                        <th>${DomUtils.escapeHtml(column)}</th>
                    `).join("")}
                </tr>
            </thead>
        `;

        const body = `
            <tbody>
                ${previewRows.map(row => `
                    <tr>
                        ${consolidated.columns.map(column => {
                            const value = row[column] ?? "";
                            const isDuplicate = column === "Duplicado" && value;
                            return `
                                <td${isDuplicate ? ' class="duplicate-cell"' : ""}>
                                    ${value === "" ? "—" : DomUtils.escapeHtml(String(value))}
                                </td>
                            `;
                        }).join("")}
                    </tr>
                `).join("")}
            </tbody>
        `;

        preview.innerHTML = `
            <table class="consolidate-table">
                ${head}
                ${body}
            </table>
            ${consolidated.rows.length > maxPreview ? `
                <p class="consolidate-note">
                    Exibindo ${maxPreview} de ${consolidated.rows.length} registro(s).
                    Todos serão incluídos na exportação.
                </p>
            ` : ""}
        `;

        section.hidden = false;

    }


    function hideConsolidated() {

        const section = root.querySelector("[data-role='consolidate-section']");

        if (section) {
            section.hidden = true;
        }

        lastConsolidated = null;

    }


    function exportConsolidated() {

        const log = leftWorkspace.log;

        if (!lastConsolidated) {

            log("Execute a consolidação antes de exportar.");
            return;

        }

        try {

            if (!lastConsolidated.rows.length) {

                throw new Error(
                    "Não há registros consolidados para exportar."
                );

            }

            ExcelWriter.exportJson(
                lastConsolidated.rows,
                "Consolidado",
                "cruzamento-consolidado.xlsx"
            );

            log(
                `Planilha final exportada com ` +
                `${lastConsolidated.rows.length} registro(s).`
            );

        } catch (error) {

            log(`ERRO: ${error.message}`);

        }

    }


    function exportSheet() {

        const log = leftWorkspace.log;

        if (!lastResult) {

            log("Execute o cruzamento antes de extrair a planilha.");
            return;

        }

        const set = root.querySelector("[data-role='export-set']")?.value || "matched";

        try {

            const rows = CrossValidator.buildExportRows(lastResult, {
                set,
                columnsA: selectedValues("export-a"),
                columnsB: selectedValues("export-b")
            });

            if (!rows.length) {

                throw new Error(
                    "Não há registros neste conjunto para extrair."
                );

            }

            ExcelWriter.exportJson(
                rows,
                "Cruzamento",
                "cruzamento.xlsx"
            );

            log(`Planilha extraída com ${rows.length} registro(s).`);

        } catch (error) {

            log(`ERRO: ${error.message}`);

        }

    }


    function init() {

        root = document.getElementById("page-validator-cross");

        if (!root || bound) {
            return;
        }

        const logElement = root.querySelector("[data-role='log']");

        leftWorkspace = SheetWorkspace.bind(
            root.querySelector("[data-cross-source='left']"),
            {
                logElement,
                onSheetSelected: refreshKeys,
                onReset: refreshKeys
            }
        );

        rightWorkspace = SheetWorkspace.bind(
            root.querySelector("[data-cross-source='right']"),
            {
                logElement,
                onSheetSelected: refreshKeys,
                onReset: refreshKeys
            }
        );

        root.querySelector("[data-role='add-key']")
            .addEventListener("click", () => addKeyRow());

        root.querySelector("[data-role='run-cross']")
            .addEventListener("click", runCross);

        root.querySelector("[data-role='run-consolidate']")
            .addEventListener("click", runConsolidate);

        root.querySelector("[data-role='export-consolidate']")
            .addEventListener("click", exportConsolidated);

        root.querySelector("[data-role='export-button']")
            .addEventListener("click", exportSheet);

        bound = true;

    }


    function reset() {

        lastResult = null;
        lastConsolidated = null;

        if (leftWorkspace) {
            leftWorkspace.reset();
        }

        if (rightWorkspace) {
            rightWorkspace.reset();
        }

        hideResults();

    }


    ValidatorRegistry.register({
        id: "cross",
        pageId: "page-validator-cross",
        title: "Cruzamento de planilhas",
        ready: true,
        init,
        reset
    });


    return { init, reset };

})();
