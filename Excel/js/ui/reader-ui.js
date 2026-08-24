"use strict";

/*
 * ============================================================
 * LEITOR EXCEL UI
 * Interface para exploração de arquivos Excel
 * ============================================================
 */

const ReaderUI = (() => {

    const state = {
        document: null,
        currentSheetIndex: 0
    };


    function init() {

        const workspace = document.querySelector("[data-reader-source]");

        if (!workspace) {
            return;
        }

        // Bind SheetWorkspace para carregamento e seleção de aba
        SheetWorkspace.bind(workspace, {
            onSheetSelected: handleSheetSelected
        });

    }


    /*
     * Processado quando uma aba é selecionada
     */
    function handleSheetSelected(context) {

        state.document = context.document;
        state.currentSheetIndex = context.sheet ? 
            state.document.sheets.indexOf(context.sheet) : 0;

        if (!context.sheet) {
            return;
        }

        renderSheetPreview(context.sheet);
        renderSheetInfo(context.sheet, context.document.sheetNames[state.currentSheetIndex]);

    }


    /*
     * Renderiza informações da aba
     */
    function renderSheetInfo(sheet, sheetName) {

        const infoSection = document.querySelector("[data-role='reader-info']");

        if (!infoSection) {
            return;
        }

        const html = `
            <div class="reader-info-grid">
                <div>
                    <span>Aba</span>
                    <strong>${escapeHtml(sheetName)}</strong>
                </div>
                <div>
                    <span>Linhas</span>
                    <strong>${sheet.rowCount}</strong>
                </div>
                <div>
                    <span>Colunas</span>
                    <strong>${sheet.columnCount}</strong>
                </div>
            </div>
        `;

        infoSection.innerHTML = html;
        infoSection.hidden = false;

    }


    /*
     * Renderiza preview da planilha em tabela
     */
    function renderSheetPreview(sheet) {

        const previewSection = document.querySelector("[data-role='reader-preview']");

        if (!previewSection) {
            return;
        }

        // Limite de linhas a exibir (primeiras 50)
        const displayLimit = 50;
        const rowsToDisplay = sheet.rows.slice(0, displayLimit);

        // Construir cabeçalho
        let html = "<table class='reader-table'>";
        html += "<thead><tr>";

        sheet.headers.forEach(header => {
            html += `<th>${escapeHtml(header)}</th>`;
        });

        html += "</tr></thead>";

        // Construir corpo da tabela
        html += "<tbody>";

        rowsToDisplay.forEach((row, rowIndex) => {
            html += "<tr>";
            sheet.headers.forEach(header => {
                const value = row[header] || "";
                html += `<td>${escapeHtml(String(value))}</td>`;
            });
            html += "</tr>";
        });

        html += "</tbody></table>";

        // Adicionar aviso se houver mais linhas
        if (sheet.rows.length > displayLimit) {
            html += `
                <div class="reader-notice">
                    Mostrando 1-${displayLimit} de ${sheet.rows.length} linhas.
                    Exporte para análise completa.
                </div>
            `;
        }

        previewSection.innerHTML = html;
        previewSection.hidden = false;

    }


    /*
     * Escape de HTML para segurança
     */
    function escapeHtml(text) {

        const map = {
            "&": "&amp;",
            "<": "&lt;",
            ">": "&gt;",
            '"': "&quot;",
            "'": "&#039;"
        };

        return String(text).replace(/[&<>"']/g, m => map[m]);

    }


    return {
        init
    };

})();

// Inicializar quando app estiver pronto
document.addEventListener("DOMContentLoaded", () => {
    if (typeof ReaderUI !== "undefined") {
        ReaderUI.init();
    }
});
