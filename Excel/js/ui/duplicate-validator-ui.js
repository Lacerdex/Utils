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

    function readConfig() {

        const resultType =
            root.querySelector("input[name='duplicate-result-type']:checked")?.value || "unique";

        const method =
            root.querySelector("input[name='duplicate-method']:checked")?.value || "rows";

        const outputFormat =
            root.querySelector("input[name='duplicate-output-format']:checked")?.value || "xlsx";

        return {
            resultType,
            method,
            outputFormat
        };

    }

    function createControls() {

        if (!root) {
            return;
        }

        if (root.querySelector("[data-role='duplicate-config']")) {
            return;
        }

        const configSection = document.createElement("section");
        configSection.className = "validator-card";
        configSection.setAttribute("data-role", "duplicate-config");

        configSection.innerHTML = `
            <div class="validator-card-header">
                <div>
                    <span class="validator-number">02</span>
                    <div>
                        <h2>Configuração</h2>
                        <p>Selecione o tipo de resultado, o método de extração e o formato de saída.</p>
                    </div>
                </div>
            </div>

            <div class="validation-summary" style="grid-template-columns: repeat(auto-fit, minmax(160px, 1fr)); gap: 12px;">
                <div class="validation-summary-item">
                    <span>Mostrar</span>
                    <div style="display: flex; flex-direction: column; gap: 8px; margin-top: 8px;">
                        <label style="display:flex; align-items:center; gap:8px;"><input type="radio" name="duplicate-result-type" value="unique" checked>Únicos</label>
                        <label style="display:flex; align-items:center; gap:8px;"><input type="radio" name="duplicate-result-type" value="duplicate">Duplicados</label>
                    </div>
                </div>

                <div class="validation-summary-item">
                    <span>Método</span>
                    <div style="display: flex; flex-direction: column; gap: 8px; margin-top: 8px;">
                        <label style="display:flex; align-items:center; gap:8px;"><input type="radio" name="duplicate-method" value="rows" checked>Quebra de linhas</label>
                        <label style="display:flex; align-items:center; gap:8px;"><input type="radio" name="duplicate-method" value="columns">Quebra de colunas</label>
                        <label style="display:flex; align-items:center; gap:8px;"><input type="radio" name="duplicate-method" value="concat">Concatenado</label>
                    </div>
                </div>

                <div class="validation-summary-item">
                    <span>Formato</span>
                    <div style="display: flex; flex-direction: column; gap: 8px; margin-top: 8px;">
                        <label style="display:flex; align-items:center; gap:8px;"><input type="radio" name="duplicate-output-format" value="xlsx" checked>Excel (.xlsx)</label>
                        <label style="display:flex; align-items:center; gap:8px;"><input type="radio" name="duplicate-output-format" value="csv">CSV (.csv)</label>
                    </div>
                </div>
            </div>

            <div style="display:flex; gap:12px; flex-wrap:wrap; margin-top:16px;">
                <button type="button" class="button" data-role="preview-button">Visualizar resultado</button>
                <button type="button" class="button button-secondary" data-role="export-button">Exportar</button>
            </div>
        `;

        const columnSection = root.querySelector("[data-role='column-section']");
        if (columnSection) {
            columnSection.insertAdjacentElement("afterend", configSection);
        } else {
            root.appendChild(configSection);
        }

        root.querySelector("[data-role='preview-button']").addEventListener("click", () => {
            const select = root.querySelector("[data-role='column-select']");
            const sheet = workspace.getState().sheet;
            if (sheet && select && select.value) {
                analyze(sheet, select.value);
            }
        });

        root.querySelector("[data-role='export-button']").addEventListener("click", () => {
            const select = root.querySelector("[data-role='column-select']");
            const sheet = workspace.getState().sheet;
            if (sheet && select && select.value) {
                exportCurrentResult(sheet, select.value);
            }
        });

    }

    function escapeHtml(value) {

        return DomUtils.escapeHtml(String(value ?? ""));

    }

    function renderSummary(result, columnName) {

        const summary = result.summary;
        const resultSection = root.querySelector("[data-role='result-section']");
        const summaryBox = root.querySelector("[data-role='result-summary']");

        summaryBox.innerHTML = `
            <div class="validation-summary-item">
                <span>Registros originais</span>
                <strong>${summary.originalCount}</strong>
            </div>
            <div class="validation-summary-item">
                <span>Após filtro</span>
                <strong class="success">${summary.resultCount}</strong>
            </div>
            <div class="validation-summary-item">
                <span>Grupos</span>
                <strong class="info">${summary.groupsFound}</strong>
            </div>
            <div class="validation-summary-item">
                <span>Duplicadas</span>
                <strong class="${summary.duplicatesFound > 0 ? "danger" : "success"}">
                    ${summary.duplicatesFound}
                </strong>
            </div>
            <div class="validation-summary-item">
                <span>Chave</span>
                <strong class="info">${escapeHtml(columnName)}</strong>
            </div>
        `;

        resultSection.hidden = false;

    }

    function renderPreview(result, columnName) {

        const fieldBox = root.querySelector("[data-role='result-fields']");
        const rows = result.rows || [];
        const previewRows = rows.slice(0, 20);

        const tableHtml = previewRows.length
            ? `
                <table style="width:100%; border-collapse:collapse; font-size:13px;">
                    <thead>
                        <tr>
                            ${result.headers.map(header => `
                                <th style="padding:8px 10px; border:1px solid #cbd5e1; background:#f8fafc; text-align:left;">${escapeHtml(header)}</th>
                            `).join("")}
                        </tr>
                    </thead>
                    <tbody>
                        ${previewRows.map(row => `
                            <tr>
                                ${row.map(cell => `
                                    <td style="padding:8px 10px; border:1px solid #e2e8f0; vertical-align:top;">${escapeHtml(cell)}</td>
                                `).join("")}
                            </tr>
                        `).join("")}
                    </tbody>
                </table>
            `
            : `
                <div class="validation-field">
                    <div class="validation-field-main">
                        <div class="validation-field-name">Nenhum registro</div>
                        <div class="validation-field-detail">Não há linhas no resultado atual para a combinação selecionada.</div>
                    </div>
                    <span class="validation-field-status valid">OK</span>
                </div>
            `;

        const methodLabel = {
            rows: "Quebra de linhas",
            columns: "Quebra de colunas",
            concat: "Concatenado"
        }[result.method] || result.method;

        const resultTypeLabel = {
            unique: "Únicos",
            duplicate: "Duplicados"
        }[readConfig().resultType] || readConfig().resultType;

        fieldBox.innerHTML = `
            <div class="validation-field">
                <div class="validation-field-main">
                    <div class="validation-field-name">
                        ${resultTypeLabel} · ${methodLabel}
                    </div>
                    <div class="validation-field-detail">
                        Coluna-chave: <strong>${escapeHtml(columnName)}</strong> ·
                        ${rows.length} registro(s) no resultado ·
                        ${result.rows.length > previewRows.length ? `mostrando ${previewRows.length} de ${result.rows.length}` : `mostrando ${result.rows.length}`}
                    </div>
                </div>
                <span class="validation-field-status valid">OK</span>
            </div>
            <div style="margin-top: 16px; overflow:auto;">${tableHtml}</div>
        `;

    }

    function analyze(sheet, columnName, log) {

        if (!columnName) {
            root.querySelector("[data-role='result-section']").hidden = true;
            return;
        }

        const config = readConfig();
        const result = DuplicateValidator.transform(sheet, {
            keyColumn: columnName,
            resultType: config.resultType,
            method: config.method,
            separator: ";"
        });

        renderSummary(result, columnName);
        renderPreview(result, columnName);

        if (log) {
            log(`${config.resultType === "duplicate" ? "Duplicados" : "Únicos"} em ${columnName} com método ${config.method}.`);
        }

    }

    function exportCurrentResult(sheet, columnName) {

        if (!sheet || !columnName) {
            return;
        }

        const config = readConfig();
        const result = DuplicateValidator.transform(sheet, {
            keyColumn: columnName,
            resultType: config.resultType,
            method: config.method,
            separator: ";"
        });

        DuplicateValidator.exportResult(result, {
            fileName: `${sheet.name || "duplicatas"}-${config.resultType}-${config.method}`,
            format: config.outputFormat,
            separator: ";",
            sheetName: sheet.name || "Duplicatas"
        });

    }

    function onSheetSelected(context) {

        createControls();
        populateColumns(context.sheet);

        const select = root.querySelector("[data-role='column-select']");
        const columnSection = root.querySelector("[data-role='column-section']");

        if (columnSection) {
            columnSection.hidden = false;
        }

        if (select) {
            select.onchange = () => {
                const sheet = workspace.getState().sheet;
                if (sheet && select.value) {
                    analyze(sheet, select.value, context.log);
                }
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
                const configSection = root.querySelector("[data-role='duplicate-config']");

                if (columnSection) columnSection.hidden = true;
                if (resultSection) resultSection.hidden = true;
                if (resultSummary) resultSummary.innerHTML = "";
                if (resultFields) resultFields.innerHTML = "";
                if (configSection) configSection.remove();

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
