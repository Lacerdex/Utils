"use strict";

/*
 * ============================================================
 * UI — VALIDADOR DE DADOS (DUAS PLANILHAS)
 *
 * Compara duas planilhas, encontra as colunas em comum,
 * permite escolher a planilha espelho e extrai o resultado final.
 * ============================================================
 */

const DataValidatorUI = (() => {

    let root = null;
    let bound = false;
    let leftWorkspace = null;
    let rightWorkspace = null;
    let currentMirror = "left";


    function sourceState(side) {

        const workspace = side === "left" ? leftWorkspace : rightWorkspace;

        return workspace ? workspace.getState() : null;

    }


    function bothReady() {

        const left = sourceState("left");
        const right = sourceState("right");

        return Boolean(left?.sheet && right?.sheet);

    }


    function mirrorState() {

        return currentMirror === "right"
            ? { side: "right", workspace: rightWorkspace }
            : { side: "left", workspace: leftWorkspace };

    }


    function findCommonColumns() {

        const left = sourceState("left");
        const right = sourceState("right");

        if (!left?.sheet || !right?.sheet) {
            return { left: [], right: [], pairs: [] };
        }

        const pairs = [];

        left.sheet.headers.forEach(header => {

            if (String(header).trim() === "") {
                return;
            }

            const found = ExcelUtils.findColumn(right.sheet.headers, header);

            if (found) {

                pairs.push({
                    left: header,
                    right: found.original
                });

            }

        });

        return {
            left: pairs.map(pair => pair.left),
            right: pairs.map(pair => pair.right),
            pairs
        };

    }


    function renderCommonColumns() {

        const commonSection = root?.querySelector("[data-role='common-section']");

        if (!commonSection) {
            return;
        }

        const common = findCommonColumns();
        const container = commonSection.querySelector("[data-role='common-columns']");

        if (!common.pairs.length) {

            commonSection.hidden = true;
            container.innerHTML = "";
            hideResults();
            return;

        }

        commonSection.hidden = false;

        container.innerHTML = `

            <div class="common-columns-list">

                <div class="common-columns-block">

                    <span class="field-label">
                        Planilha 1
                    </span>

                    <div class="detected-headers">

                        ${common.left.map(header => `
                            <span class="detected-header">
                                <span class="detected-header-name">
                                    ${DomUtils.escapeHtml(header)}
                                </span>
                            </span>
                        `).join("")}

                    </div>

                </div>

                <div class="common-columns-block">

                    <span class="field-label">
                        Planilha 2
                    </span>

                    <div class="detected-headers">

                        ${common.right.map(header => `
                            <span class="detected-header">
                                <span class="detected-header-name">
                                    ${DomUtils.escapeHtml(header)}
                                </span>
                            </span>
                        `).join("")}

                    </div>

                </div>

            </div>

        `;

        renderExportColumns();
        runValidation();

    }


    function renderExportColumns() {

        const left = sourceState("left");
        const right = sourceState("right");
        const common = findCommonColumns();

        if (!left?.sheet || !right?.sheet) {
            return;
        }

        const containerA = root.querySelector("[data-role='export-columns-a']");
        const containerB = root.querySelector("[data-role='export-columns-b']");

        containerA.innerHTML = common.left.map(header => `
            <label class="column-check checked">
                <input
                    type="checkbox"
                    name="data-export-a"
                    value="${DomUtils.escapeHtml(header)}"
                    checked
                >
                <span>${DomUtils.escapeHtml(header)}</span>
            </label>
        `).join("");

        containerB.innerHTML = common.right.map(header => `
            <label class="column-check checked">
                <input
                    type="checkbox"
                    name="data-export-b"
                    value="${DomUtils.escapeHtml(header)}"
                    checked
                >
                <span>${DomUtils.escapeHtml(header)}</span>
            </label>
        `).join("");

    }


    function renderSummary(result, container) {

        const summary = result.summary;

        container.innerHTML = `

            <div class="validation-summary-item">
                <span>Registros (espelho)</span>
                <strong>${result.rows.total}</strong>
            </div>

            <div class="validation-summary-item">
                <span>Colunas em comum</span>
                <strong>${summary.fields}</strong>
            </div>

            <div class="validation-summary-item">
                <span>Colunas com dados</span>
                <strong class="success">${summary.fieldsWithData}</strong>
            </div>

            <div class="validation-summary-item">
                <span>Colunas com erros</span>
                <strong class="${summary.fieldsWithInvalidData > 0 ? "danger" : "success"}">
                    ${summary.fieldsWithInvalidData}
                </strong>
            </div>

        `;

    }


    function renderFields(result, container) {

        container.innerHTML = "";

        const columns = Array.isArray(result.columns)
            ? result.columns
            : Object.values(result.fields);

        columns.forEach(field => {

            const element = document.createElement("div");
            element.className = "validation-field data-field";

            const statusClass = field.status === "column_missing"
                ? "invalid"
                : field.invalid > 0
                    ? "invalid"
                    : field.empty > 0
                        ? "optional"
                        : "valid";

            const statusText = field.status === "column_missing"
                ? "AUSENTE"
                : field.invalid > 0
                    ? "INVÁLIDOS"
                    : field.empty > 0
                        ? "INCOMPLETO"
                        : "OK";

            const samples = (field.invalidRows || [])
                .slice(0, 3)
                .map(item => DomUtils.escapeHtml(String(item.value)))
                .join(", ");

            element.innerHTML = `
                <div class="validation-field-main">
                    <div class="validation-field-name">
                        ${DomUtils.escapeHtml(field.column || field.id)}
                    </div>
                    <div class="validation-field-detail">
                        Coluna:
                        <strong>${DomUtils.escapeHtml(field.column || "-")}</strong>
                        · Preenchidos ${field.filled}/${field.total}
                        · Vazios ${field.empty}
                        · Inválidos ${field.invalid}
                        ${samples ? `<br>Exemplos: ${samples}` : ""}
                    </div>
                    <div class="progress">
                        <div
                            class="progress-bar"
                            style="width: ${field.fillRate}%"
                        ></div>
                    </div>
                </div>
                <span class="validation-field-status ${statusClass}">
                    ${statusText} · ${field.fillRate}%
                </span>
            `;

            container.appendChild(element);

        });

    }


    function runValidation() {

        const resultSection = root?.querySelector("[data-role='result-section']");
        const exportSection = root?.querySelector("[data-role='export-section']");
        const resultSummary = root?.querySelector("[data-role='result-summary']");
        const resultFields = root?.querySelector("[data-role='result-fields']");
        const workspace = mirrorState().workspace;

        if (!workspace) {
            return;
        }

        const context = workspace.getState();

        if (!context.sheet) {
            return;
        }

        const common = findCommonColumns();
        const mirror = mirrorState();

        const mirrorColumns = mirror.side === "left"
            ? common.left
            : common.right;

        const headerResult = {
            fields: {}
        };

        mirrorColumns.forEach(column => {
            headerResult.fields[column] = {
                id: column,
                name: column,
                label: column,
                column,
                originalHeader: column,
                required: false,
                status: 'found'
            };
        });

        const dataResult = DataValidator.validate(
            context.sheet,
            headerResult
        );

        renderSummary(dataResult, resultSummary);
        renderFields(dataResult, resultFields);

        resultSection.hidden = false;
        exportSection.hidden = false;

        const log = workspace.log;

        log(
            `Validação na planilha ${mirror.side === "left" ? "1" : "2"} ` +
            `com ${mirrorColumns.length} coluna(s) em comum.`
        );

    }


    function hideResults() {

        const resultSection = root?.querySelector("[data-role='result-section']");
        const exportSection = root?.querySelector("[data-role='export-section']");

        if (resultSection) resultSection.hidden = true;
        if (exportSection) exportSection.hidden = true;

    }


    function refresh() {

        hideResults();

        if (!bothReady()) {

            const commonSection = root?.querySelector("[data-role='common-section']");

            if (commonSection) {
                commonSection.hidden = true;
            }

            return;

        }

        renderCommonColumns();

    }


    function selectedValues(name) {

        return [...root.querySelectorAll(`input[name="${name}"]:checked`)]
            .map(input => input.value);

    }


    function exportFinal() {

        const log = leftWorkspace.log;

        if (!bothReady()) {
            log("Selecione as duas planilhas antes de extrair.");
            return;
        }

        const left = sourceState("left");
        const right = sourceState("right");
        const mirror = mirrorState();

        try {

            const columnsA = selectedValues("data-export-a");
            const columnsB = selectedValues("data-export-b");

            if (!columnsA.length && !columnsB.length) {

                throw new Error(
                    "Selecione ao menos uma coluna para extrair."
                );

            }

            const rows = [];

            const mirroredRows = mirror.side === "left"
                ? left.sheet.rows
                : right.sheet.rows;

            mirroredRows.forEach(row => {

                const output = {};

                columnsA.forEach(column => {
                    output[column] = row?.[column] ?? "";
                });

                columnsB.forEach(column => {
                    output[column] = row?.[column] ?? "";
                });

                rows.push(output);

            });

            if (!rows.length) {

                throw new Error(
                    "Não há registros na planilha espelho para extrair."
                );

            }

            ExcelWriter.exportJson(
                rows,
                "Resultado Final",
                "resultado-final.xlsx"
            );

            log(`Planilha final extraída com ${rows.length} registro(s).`);

        } catch (error) {

            log(`ERRO: ${error.message}`);

        }

    }


    function init() {

        root = document.getElementById("page-validator-data");

        if (!root || bound) {
            return;
        }

        const logElement = root.querySelector("[data-role='log']");

        leftWorkspace = SheetWorkspace.bind(
            root.querySelector("[data-data-source='left']"),
            {
                logElement,
                onSheetSelected: refresh,
                onReset: refresh
            }
        );

        rightWorkspace = SheetWorkspace.bind(
            root.querySelector("[data-data-source='right']"),
            {
                logElement,
                onSheetSelected: refresh,
                onReset: refresh
            }
        );

        root.querySelectorAll("[name='data-mirror']").forEach(radio => {

            radio.addEventListener("change", event => {

                currentMirror = event.target.value;
                renderCommonColumns();

            });

        });

        root.querySelector("[data-role='export-button']")
            .addEventListener("click", exportFinal);

        bound = true;

    }


    function reset() {

        currentMirror = "left";

        if (leftWorkspace) {
            leftWorkspace.reset();
        }

        if (rightWorkspace) {
            rightWorkspace.reset();
        }

        hideResults();

        const commonSection = root?.querySelector("[data-role='common-section']");

        if (commonSection) {
            commonSection.hidden = true;
        }

    }


    ValidatorRegistry.register({
        id: "data",
        pageId: "page-validator-data",
        title: "Análise de qualidade",
        ready: true,
        init,
        reset
    });


    return { init, reset };

})();
