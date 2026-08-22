"use strict";

/*
 * ============================================================
 * UI — ANÁLISE DE QUALIDADE
 * ============================================================
 */

const DataValidatorUI = (() => {

    let workspace = null;
    let root = null;
    let bound = false;


    function renderSummary(result, container) {

        const summary = result.summary;

        container.innerHTML = `

            <div class="validation-summary-item">
                <span>Registros</span>
                <strong>${result.rows.total}</strong>
            </div>

            <div class="validation-summary-item">
                <span>Colunas da planilha</span>
                <strong>${summary.fields}</strong>
            </div>

            <div class="validation-summary-item">
                <span>Campos do modelo</span>
                <strong>${summary.highlighted}</strong>
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

        const ordered = [
            ...columns.filter(column => column.highlighted),
            ...columns.filter(column => !column.highlighted)
        ];

        ordered.forEach(field => {

            const element = document.createElement("div");
            element.className = field.highlighted
                ? "validation-field data-field is-highlighted"
                : "validation-field data-field";

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
                        ${DomUtils.escapeHtml(field.label || field.column || field.id)}
                        ${field.highlighted ? '<span class="field-emphasis">modelo</span>' : ""}
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


    function onSheetSelected(context) {

        const resultSection = root.querySelector("[data-role='result-section']");
        const resultSummary = root.querySelector("[data-role='result-summary']");
        const resultFields = root.querySelector("[data-role='result-fields']");

        let headerResult = { fields: {} };

        if (context.schema) {

            headerResult = HeaderValidator.validate(
                context.sheet,
                context.schema
            );

        }

        const dataResult = DataValidator.validate(
            context.sheet,
            headerResult
        );

        renderSummary(dataResult, resultSummary);
        renderFields(dataResult, resultFields);

        resultSection.hidden = false;

        context.log(
            `Registros analisados: ${dataResult.rows.total}`
        );

    }


    function init() {

        root = document.getElementById("page-validator-data");

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
        id: "data",
        pageId: "page-validator-data",
        title: "Análise de qualidade",
        ready: true,
        init,
        reset
    });


    return { init, reset };

})();
