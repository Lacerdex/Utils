"use strict";

/*
 * ============================================================
 * UI — VALIDADOR DE FORMATO
 * ============================================================
 */

const FormatValidatorUI = (() => {

    let workspace = null;
    let root = null;
    let bound = false;


    function collectIssues(dataResult) {

        const issues = [];

        Object.values(dataResult.fields).forEach(field => {

            (field.invalidRows || []).forEach(item => {

                issues.push({
                    field: field.id,
                    column: field.column,
                    row: item.row + 2,
                    value: item.value,
                    reason: item.reason
                });

            });

        });

        return issues;

    }


    function renderSummary(issues, totalRows, container) {

        container.innerHTML = `

            <div class="validation-summary-item">
                <span>Registros</span>
                <strong>${totalRows}</strong>
            </div>

            <div class="validation-summary-item">
                <span>Valores inválidos</span>
                <strong class="${issues.length > 0 ? "danger" : "success"}">
                    ${issues.length}
                </strong>
            </div>

        `;

    }


    function renderIssues(issues, container) {

        if (!issues.length) {

            container.innerHTML = `
                <div class="validation-field">
                    <div class="validation-field-main">
                        <div class="validation-field-name">
                            Nenhum problema de formato
                        </div>
                        <div class="validation-field-detail">
                            CPF, e-mail e celular estão consistentes
                            nos campos reconhecidos.
                        </div>
                    </div>
                    <span class="validation-field-status valid">
                        OK
                    </span>
                </div>
            `;

            return;

        }

        container.innerHTML = issues.slice(0, 80).map(issue => `
            <div class="validation-field">
                <div class="validation-field-main">
                    <div class="validation-field-name">
                        ${DomUtils.escapeHtml(issue.field)}
                        · linha ${issue.row}
                    </div>
                    <div class="validation-field-detail">
                        ${DomUtils.escapeHtml(issue.reason || "Formato inválido")}
                        · valor:
                        <strong>${DomUtils.escapeHtml(String(issue.value ?? ""))}</strong>
                    </div>
                </div>
                <span class="validation-field-status invalid">
                    INVÁLIDO
                </span>
            </div>
        `).join("");

    }


    function onSheetSelected(context) {

        const resultSection = root.querySelector("[data-role='result-section']");
        const resultSummary = root.querySelector("[data-role='result-summary']");
        const resultFields = root.querySelector("[data-role='result-fields']");

        if (!context.schema) {
            context.log("Selecione um modelo.");
            resultSection.hidden = true;
            return;
        }

        const headerResult = HeaderValidator.validate(
            context.sheet,
            context.schema
        );

        const dataResult = DataValidator.validate(
            context.sheet,
            headerResult
        );

        const issues = collectIssues(dataResult);

        renderSummary(issues, dataResult.rows.total, resultSummary);
        renderIssues(issues, resultFields);

        resultSection.hidden = false;

        context.log(`${issues.length} valor(es) com formato inválido.`);

    }


    function init() {

        root = document.getElementById("page-validator-format");

        if (!root || bound) {
            return;
        }

        workspace = SheetWorkspace.bind(root, {

            onSheetSelected,

            onReset() {

                const resultSection = root.querySelector("[data-role='result-section']");
                const resultSummary = root.querySelector("[data-role='result-summary']");
                const resultFields = root.querySelector("[data-role='result-fields']");

                if (resultSection) resultSection.hidden = true;
                if (resultSummary) resultSummary.innerHTML = "";
                if (resultFields) resultFields.innerHTML = "";

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
        id: "format",
        pageId: "page-validator-format",
        title: "Validação de formato",
        ready: true,
        init,
        reset
    });


    return { init, reset };

})();
