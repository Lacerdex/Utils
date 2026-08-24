"use strict";

/*
 * ============================================================
 * CATEGORIZADOR EXCEL UI
 * Workflow local de categorização com manutenção de dados originais.
 * ============================================================
 */

const CategorizerUI = (() => {

    const state = {
        workbook: null,
        sheet: null,
        rows: [],
        headers: [],
        categories: [],
        activeCategory: "",
        selectionMap: {},
        targetColumn: "",
        searchText: "",
        status: "Nenhum arquivo selecionado."
    };

    function init() {
        const fileInput = document.getElementById("categorizer-file");
        const sheetSelect = document.getElementById("categorizer-sheet");
        const targetSelect = document.getElementById("categorizer-target-column");
        const categoryInput = document.getElementById("categorizer-category-name");
        const categoryButton = document.getElementById("categorizer-add-category");
        const searchInput = document.getElementById("categorizer-search");
        const selectVisibleButton = document.getElementById("categorizer-select-visible");
        const clearVisibleButton = document.getElementById("categorizer-clear-visible");
        const exportButton = document.getElementById("categorizer-export");
        const table = document.getElementById("categorizer-table");
        const status = document.getElementById("categorizer-status");

        if (status) {
            status.textContent = state.status;
        }

        if (fileInput) {
            fileInput.addEventListener("change", async event => {
                const [file] = event.target.files || [];

                if (!file) {
                    reset();
                    return;
                }

                await loadWorkbook(file);
            });
        }

        if (sheetSelect) {
            sheetSelect.addEventListener("change", event => {
                const sheetName = event.target.value;
                loadSheet(sheetName);
            });
        }

        if (targetSelect) {
            targetSelect.addEventListener("change", event => {
                state.targetColumn = event.target.value;
                renderTable();
            });
        }

        if (categoryButton) {
            categoryButton.addEventListener("click", () => {
                const result = createCategory(categoryInput && categoryInput.value || "");

                if (result.success) {
                    if (categoryInput) {
                        categoryInput.value = "";
                    }
                    renderCategories();
                    renderTable();
                    renderStats();
                }

                setStatus(result.message, result.success ? "success" : "error");
            });
        }

        if (categoryInput) {
            categoryInput.addEventListener("keydown", event => {
                if (event.key === "Enter") {
                    event.preventDefault();
                    categoryButton.click();
                }
            });
        }

        if (searchInput) {
            searchInput.addEventListener("input", event => {
                state.searchText = event.target.value || "";
                renderTable();
            });
        }

        if (selectVisibleButton) {
            selectVisibleButton.addEventListener("click", () => {
                applyVisibleSelection(true);
            });
        }

        if (clearVisibleButton) {
            clearVisibleButton.addEventListener("click", () => {
                applyVisibleSelection(false);
            });
        }

        if (exportButton) {
            exportButton.addEventListener("click", exportWorkbook);
        }

        if (table) {
            table.addEventListener("change", event => {
                const target = event.target;

                if (!target || target.tagName !== "INPUT" || target.type !== "checkbox") {
                    return;
                }

                const rowIndex = Number(target.dataset.rowIndex);
                const categoryName = target.dataset.categoryName;

                if (Number.isNaN(rowIndex) || !categoryName) {
                    return;
                }

                CategoryUtils.toggleSelectionState(
                    state.selectionMap,
                    categoryName,
                    rowIndex
                );

                renderCategories();
                renderTable();
                renderStats();
            });
        }

        renderCategories();
        renderTable();
        renderStats();
    }

    function setStatus(message, tone = "") {
        const statusNode = document.getElementById("categorizer-status");

        if (!statusNode) {
            return;
        }

        statusNode.textContent = message;
        statusNode.className = "validator-status";

        if (tone === "success") {
            statusNode.classList.add("success");
        }

        if (tone === "error") {
            statusNode.classList.add("error");
        }
    }

    function reset() {
        state.workbook = null;
        state.sheet = null;
        state.rows = [];
        state.headers = [];
        state.categories = [];
        state.activeCategory = "";
        state.selectionMap = {};
        state.targetColumn = "";
        state.searchText = "";

        const sheetSelect = document.getElementById("categorizer-sheet");
        const targetSelect = document.getElementById("categorizer-target-column");
        const searchInput = document.getElementById("categorizer-search");
        const categoryInput = document.getElementById("categorizer-category-name");

        if (sheetSelect) {
            sheetSelect.innerHTML = '<option value="">Selecione uma aba</option>';
            sheetSelect.disabled = true;
        }

        if (targetSelect) {
            targetSelect.innerHTML = '<option value="">Selecione uma coluna</option>';
            targetSelect.disabled = true;
        }

        if (searchInput) {
            searchInput.value = "";
        }

        if (categoryInput) {
            categoryInput.value = "";
        }

        setStatus("Nenhum arquivo selecionado.");
        renderCategories();
        renderTable();
        renderStats();
    }

    async function loadWorkbook(file) {
        if (!file) {
            reset();
            return;
        }

        try {
            if (typeof ExcelReader === "undefined") {
                throw new Error("O leitor de Excel não está disponível.");
            }

            setStatus("Lendo arquivo...", "");
            state.workbook = await ExcelReader.read(file);

            const sheetSelect = document.getElementById("categorizer-sheet");
            if (sheetSelect) {
                sheetSelect.disabled = false;
                sheetSelect.innerHTML = '<option value="">Selecione uma aba</option>';

                state.workbook.sheetNames.forEach(name => {
                    const option = document.createElement("option");
                    option.value = name;
                    option.textContent = name;
                    sheetSelect.appendChild(option);
                });
            }

            setStatus("Arquivo carregado. Selecione uma aba.", "success");
        } catch (error) {
            console.error(error);
            setStatus(error.message || "Não foi possível carregar o arquivo.", "error");
        }
    }

    function loadSheet(sheetName) {
        if (!sheetName || !state.workbook) {
            return;
        }

        try {
            const sheet = ExcelReader.getSheet(state.workbook, sheetName);
            state.sheet = sheet;
            state.rows = Array.isArray(sheet.rows) ? sheet.rows : [];
            state.headers = Array.isArray(sheet.headers) ? sheet.headers : [];
            state.selectionMap = CategoryUtils.createSelectionMap(state.categories);
            state.targetColumn = state.headers[0] || "";
            populateTargetColumnSelect();
            renderCategories();
            renderTable();
            renderStats();
            setStatus(`Aba "${sheetName}" carregada com sucesso.`, "success");
        } catch (error) {
            console.error(error);
            setStatus(error.message || "Não foi possível carregar a aba.", "error");
        }
    }

    function populateTargetColumnSelect() {
        const targetSelect = document.getElementById("categorizer-target-column");

        if (!targetSelect) {
            return;
        }

        targetSelect.innerHTML = '<option value="">Selecione uma coluna</option>';

        state.headers.forEach(header => {
            const option = document.createElement("option");
            option.value = header;
            option.textContent = header;

            if (header === state.targetColumn) {
                option.selected = true;
            }

            targetSelect.appendChild(option);
        });

        targetSelect.disabled = state.headers.length === 0;
    }

    function createCategory(rawName) {
        const result = CategoryUtils.validateCategoryName(
            rawName,
            state.categories
        );

        if (!result.valid) {
            return {
                success: false,
                message: result.reason
            };
        }

        state.categories.push(result.name);
        state.selectionMap[result.name] = new Set();
        state.activeCategory = result.name;

        return {
            success: true,
            message: `Categoria "${result.name}" criada.`
        };
    }

    function setActiveCategory(categoryName) {
        if (!state.categories.includes(categoryName)) {
            return;
        }

        state.activeCategory = categoryName;
        renderCategories();
        renderTable();
        renderStats();
    }

    function renderCategories() {
        const categoriesNode = document.getElementById("categorizer-categories");

        if (!categoriesNode) {
            return;
        }

        if (!state.categories.length) {
            categoriesNode.innerHTML = '<div class="categorizer-empty">Ainda não há categorias. Crie a primeira.</div>';
            return;
        }

        categoriesNode.innerHTML = state.categories.map(category => {
            const isActive = category === state.activeCategory;
            const count = CategoryUtils.getCategoryCount(state.selectionMap, category);
            return `
                <button type="button" class="category-pill ${isActive ? "active" : ""}" data-category-name="${escapeHtml(category)}">
                    <span>${escapeHtml(category)}</span>
                    <strong>(${count})</strong>
                </button>
            `;
        }).join("");

        categoriesNode.querySelectorAll("[data-category-name]").forEach(button => {
            button.addEventListener("click", () => {
                setActiveCategory(button.dataset.categoryName);
            });
        });
    }

    function getVisibleRowIndexes() {
        const query = state.searchText.trim().toLowerCase();

        if (!query) {
            return state.rows.map((_, index) => index);
        }

        return state.rows.reduce((indexes, row, index) => {
            const haystack = Object.values(row)
                .map(value => String(value ?? ""))
                .join(" ")
                .toLowerCase();

            if (haystack.includes(query)) {
                indexes.push(index);
            }

            return indexes;
        }, []);
    }

    function applyVisibleSelection(selected) {
        if (!state.activeCategory) {
            setStatus("Crie ou selecione uma categoria antes de marcar registros.", "error");
            return;
        }

        const visibleIndexes = getVisibleRowIndexes();

        visibleIndexes.forEach(index => {
            CategoryUtils.setSelectionState(state.selectionMap, state.activeCategory, index, selected);
        });

        renderCategories();
        renderTable();
        renderStats();
        setStatus(
            selected
                ? `Categoria "${state.activeCategory}" atualizada para ${visibleIndexes.length} registros visíveis.`
                : `Categoria "${state.activeCategory}" limpa para ${visibleIndexes.length} registros visíveis.`,
            "success"
        );
    }

    function renderTable() {
        const table = document.getElementById("categorizer-table");

        if (!table) {
            return;
        }

        if (!state.sheet || !state.headers.length) {
            table.innerHTML = "";
            return;
        }

        const visibleIndexes = getVisibleRowIndexes();
        const categoryColumns = state.categories.length ? state.categories : [];

        let html = "<thead><tr><th>#</th>";

        state.headers.forEach(header => {
            html += `<th>${escapeHtml(header)}</th>`;
        });

        categoryColumns.forEach(category => {
            const count = CategoryUtils.getCategoryCount(state.selectionMap, category);
            html += `<th>${escapeHtml(category)} (${count})</th>`;
        });

        html += "</tr></thead><tbody>";

        if (!visibleIndexes.length) {
            html += `<tr><td colspan="${state.headers.length + categoryColumns.length + 1}" class="categorizer-empty">Nenhum registro corresponde à busca atual.</td></tr>`;
            html += "</tbody>";
            table.innerHTML = html;
            return;
        }

        visibleIndexes.forEach(index => {
            const row = state.rows[index] || {};

            html += "<tr>";
            html += `<td>${index + 1}</td>`;

            state.headers.forEach(header => {
                const value = row[header] ?? "";
                html += `<td>${escapeHtml(String(value))}</td>`;
            });

            categoryColumns.forEach(category => {
                const checked = (
                    state.selectionMap[category] &&
                    state.selectionMap[category].has(index)
                );

                const labelClass = checked ? "categorizer-checkbox checked" : "categorizer-checkbox";

                html += `
                    <td>
                        <label class="${labelClass}">
                            <input
                                type="checkbox"
                                data-row-index="${index}"
                                data-category-name="${escapeHtml(category)}"
                                ${checked ? "checked" : ""}
                            >
                            <span>${checked ? "X" : ""}</span>
                        </label>
                    </td>
                `;
            });

            html += "</tr>";
        });

        html += "</tbody>";
        table.innerHTML = html;
    }

    function renderStats() {
        const statsNode = document.getElementById("categorizer-stats");

        if (!statsNode) {
            return;
        }

        const totalRows = state.rows.length;
        const totalCategories = state.categories.length;
        const totalMarks = Object.values(state.selectionMap).reduce((sum, set) => sum + set.size, 0);

        statsNode.innerHTML = `
            <div class="category-stat"><span>Registros</span><strong>${totalRows}</strong></div>
            <div class="category-stat"><span>Categorias</span><strong>${totalCategories}</strong></div>
            <div class="category-stat"><span>Marcações</span><strong>${totalMarks}</strong></div>
        `;
    }

    function exportWorkbook() {
        if (!state.sheet || !state.rows.length) {
            setStatus("Carregue uma planilha antes de exportar.", "error");
            return;
        }

        if (typeof XLSX === "undefined") {
            setStatus("A biblioteca XLSX não está disponível no navegador.", "error");
            return;
        }

        const exportRows = CategoryUtils.buildExportRows(
            state.rows,
            state.categories,
            state.selectionMap
        );

        const sheetName = state.sheet.name || "Resultado";
        const workbook = XLSX.utils.book_new();
        const worksheet = XLSX.utils.json_to_sheet(exportRows);
        XLSX.utils.book_append_sheet(workbook, worksheet, sheetName);
        XLSX.writeFile(workbook, `categorizacao-${sanitizeFileName(sheetName)}.xlsx`);

        setStatus(`Arquivo "categorizacao-${sanitizeFileName(sheetName)}.xlsx" exportado com sucesso.`, "success");
    }

    function sanitizeFileName(value) {
        return String(value || "resultado")
            .toLowerCase()
            .replace(/[^a-z0-9]+/g, "-")
            .replace(/-+/g, "-")
            .replace(/^-|-$/g, "") || "resultado";
    }

    function escapeHtml(value) {
        const map = {
            "&": "&amp;",
            "<": "&lt;",
            ">": "&gt;",
            '"': "&quot;",
            "'": "&#039;"
        };

        return String(value ?? "").replace(/[&<>\"']/g, char => map[char]);
    }

    return {
        init
    };

})();

if (typeof document !== "undefined") {
    document.addEventListener("DOMContentLoaded", () => {
        if (typeof CategorizerUI !== "undefined") {
            CategorizerUI.init();
        }
    });
}
