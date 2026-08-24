"use strict";

const PlanilhaCadastroUI = (() => {

    const state = {
        records: [],
        selectedId: null,
        pendingFile: null
    };

    function init() {

        const root = document.getElementById("page-cadastro-planilhas");

        if (!root || root.dataset.initialized === "true") {
            return;
        }

        root.dataset.initialized = "true";

        const elements = {
            dropzone: document.getElementById("planilha-dropzone"),
            input: document.getElementById("planilha-file-input"),
            trigger: document.getElementById("planilha-trigger"),
            status: document.getElementById("planilha-status"),
            refresh: document.getElementById("planilha-refresh"),
            clear: document.getElementById("planilha-clear-filters"),
            search: document.getElementById("planilha-search"),
            type: document.getElementById("planilha-filter-type"),
            counter: document.getElementById("planilha-counter"),
            body: document.getElementById("planilha-table-body"),
            nameInput: document.getElementById("planilha-nome"),
            folderSelect: document.getElementById("planilha-folder"),
            saveButton: document.getElementById("planilha-save")
        };

        if (!elements.input) {
            return;
        }

        elements.input.addEventListener("change", async event => {
            await preparePendingFile(event.target.files);
            event.target.value = "";
        });

        if (elements.trigger) {
            elements.trigger.addEventListener("click", () => {
                elements.input.click();
            });
        }

        if (elements.dropzone) {
            ["dragenter", "dragover"].forEach(type => {
                elements.dropzone.addEventListener(type, event => {
                    event.preventDefault();
                    elements.dropzone.classList.add("drag-active");
                });
            });

            ["dragleave", "drop"].forEach(type => {
                elements.dropzone.addEventListener(type, event => {
                    event.preventDefault();
                    elements.dropzone.classList.remove("drag-active");
                });
            });

            elements.dropzone.addEventListener("drop", async event => {
                await preparePendingFile(event.dataTransfer.files);
            });

            elements.dropzone.addEventListener("click", (event) => {
                const target = event.target;
                if (target && target.closest("button")) {
                    return;
                }
                elements.input.click();
            });
        }

        if (elements.refresh) {
            elements.refresh.addEventListener("click", refreshList);
        }

        if (elements.clear) {
            elements.clear.addEventListener("click", () => {
                elements.search.value = "";
                elements.type.value = "todos";
                renderList();
            });
        }

        if (elements.saveButton) {
            elements.saveButton.addEventListener("click", savePendingFile);
        }

        elements.search.addEventListener("input", renderList);
        elements.type.addEventListener("change", renderList);

        document.addEventListener("click", async event => {
            const actionTarget = event.target.closest("[data-planilha-action]");

            if (!actionTarget) {
                return;
            }

            const action = actionTarget.dataset.planilhaAction;
            const id = actionTarget.dataset.planilhaId;

            if (!id) {
                return;
            }

            if (action === "select") {
                setSelected(id);
                return;
            }

            if (action === "use") {
                await useRecord(id);
                return;
            }

            if (action === "download") {
                await downloadRecord(id);
                return;
            }

            if (action === "delete") {
                await deleteRecord(id);
            }
        });

        refreshList();

    }

    function sanitizeBaseNameFromFile(fileName) {

        if (!fileName) {
            return "planilha";
        }

        const extension = PlanilhaStorage.getExtension(fileName);
        const baseName = extension
            ? fileName.replace(new RegExp(`${extension.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}$`, "i"), "")
            : fileName;

        return baseName
            .replace(/[\\/]+/g, "-")
            .replace(/\s+/g, " ")
            .replace(/[^a-zA-Z0-9 _-]/g, "")
            .trim() || "planilha";

    }

    async function preparePendingFile(fileList) {

        if (!fileList || !fileList.length) {
            return;
        }

        const file = fileList[0];
        const elements = getElements();
        const extension = PlanilhaStorage.getExtension(file.name);

        state.pendingFile = file;
        if (elements.nameInput) {
            elements.nameInput.value = sanitizeBaseNameFromFile(file.name);
        }
        if (elements.folderSelect) {
            elements.folderSelect.value = extension === ".csv" ? "csv" : "excel";
        }

        if (elements && elements.status) {
            elements.status.textContent = "Arquivo selecionado. Defina o nome e clique em Cadastrar.";
            elements.status.className = "validator-status";
        }

    }

    async function savePendingFile() {

        const elements = getElements();

        if (!state.pendingFile) {
            if (elements && elements.status) {
                elements.status.textContent = "Selecione uma planilha antes de cadastrar.";
                elements.status.className = "validator-status error";
            }
            return;
        }

        try {
            const customName = elements.nameInput ? elements.nameInput.value.trim() : "";
            const targetFolder = elements.folderSelect ? elements.folderSelect.value : "excel";

            await PlanilhaStorage.saveFile(state.pendingFile, {
                customName,
                targetFolder
            });

            state.pendingFile = null;

            if (elements.nameInput) {
                elements.nameInput.value = "";
            }

            if (elements.input) {
                elements.input.value = "";
            }

            if (elements && elements.status) {
                elements.status.textContent = "Planilha cadastrada com sucesso.";
                elements.status.className = "validator-status success";
            }

            await refreshList();

        } catch (error) {
            if (elements && elements.status) {
                elements.status.textContent = error.message || "Não foi possível cadastrar a planilha.";
                elements.status.className = "validator-status error";
            }
        }

    }

    function getElements() {

        return {
            dropzone: document.getElementById("planilha-dropzone"),
            input: document.getElementById("planilha-file-input"),
            trigger: document.getElementById("planilha-trigger"),
            status: document.getElementById("planilha-status"),
            refresh: document.getElementById("planilha-refresh"),
            clear: document.getElementById("planilha-clear-filters"),
            search: document.getElementById("planilha-search"),
            type: document.getElementById("planilha-filter-type"),
            counter: document.getElementById("planilha-counter"),
            body: document.getElementById("planilha-table-body"),
            nameInput: document.getElementById("planilha-nome"),
            folderSelect: document.getElementById("planilha-folder"),
            saveButton: document.getElementById("planilha-save")
        };

    }

    async function refreshList() {

        state.records = await PlanilhaStorage.listFiles();

        if (!state.selectedId && state.records.length) {
            state.selectedId = state.records[0].id;
        }

        renderList();

    }

    function renderList() {

        const elements = getElements();

        if (!elements.search || !elements.type || !elements.body || !elements.counter) {
            return;
        }

        const searchValue = elements.search.value.trim().toLowerCase();
        const selectedType = elements.type.value;

        let visible = state.records.filter(record => {
            const matchesSearch = !searchValue || record.fileName.toLowerCase().includes(searchValue);
            const matchesType = selectedType === "todos" || record.extension === selectedType;
            return matchesSearch && matchesType;
        });

        visible.sort((a, b) => a.fileName.localeCompare(b.fileName, "pt-BR"));

        elements.counter.textContent = `${visible.length} planilhas encontradas`;

        if (!visible.length) {
            elements.body.innerHTML = `
                <tr>
                    <td colspan="5" class="registry-empty">
                        Nenhuma planilha encontrada para os filtros atuais.
                    </td>
                </tr>
            `;
            return;
        }

        elements.body.innerHTML = visible.map(record => {
            const isSelected = state.selectedId === record.id;
            const selectedClass = isSelected ? " selected" : "";
            const displayName = record.customName ? `${record.customName}${record.extension}` : record.fileName;

            return `
                <tr class="registry-row${selectedClass}" data-id="${record.id}">
                    <td>
                        <strong>${DomUtils.escapeHtml(displayName)}</strong>
                        <small>${DomUtils.escapeHtml(record.relativePath)}</small>
                    </td>
                    <td>${DomUtils.escapeHtml(record.extension.toUpperCase().replace(".", ""))}</td>
                    <td>${DomUtils.escapeHtml(DomUtils.formatFileSize(record.size))}</td>
                    <td>${DomUtils.escapeHtml(new Date(record.createdAt).toLocaleDateString("pt-BR"))}</td>
                    <td>
                        <div class="registry-actions-cell">
                            <button type="button" class="button button-secondary registry-inline-action" data-planilha-action="select" data-planilha-id="${record.id}">
                                Selecionar
                            </button>
                            <button type="button" class="button button-secondary registry-inline-action" data-planilha-action="use" data-planilha-id="${record.id}">
                                Usar
                            </button>
                            <button type="button" class="button button-secondary registry-inline-action" data-planilha-action="download" data-planilha-id="${record.id}">
                                Baixar
                            </button>
                            <button type="button" class="button button-secondary registry-inline-action registry-inline-action-danger" data-planilha-action="delete" data-planilha-id="${record.id}">
                                Excluir
                            </button>
                        </div>
                    </td>
                </tr>
            `;
        }).join("");

    }

    function setSelected(id) {
        state.selectedId = id;
        renderList();
    }

    async function useRecord(id) {

        const record = await PlanilhaStorage.getById(id);

        if (!record) {
            return;
        }

        const file = await PlanilhaStorage.getFile(record.id);

        if (!file) {
            const elements = getElements();
            if (elements && elements.status) {
                elements.status.textContent = "Não foi possível carregar a planilha selecionada.";
                elements.status.className = "validator-status error";
            }
            return;
        }

        const inputs = Array.from(document.querySelectorAll("input[type='file']"));
        const target = pickTargetInput(inputs);

        if (!target) {
            if (window.confirm("Nenhum campo de upload ativo foi encontrado na tela atual. Deseja abrir a planilha em uma nova seleção?")) {
                const input = document.createElement("input");
                input.type = "file";
                input.accept = ".xlsx,.xls,.csv";
                const dt = new DataTransfer();
                dt.items.add(file);
                input.files = dt.files;
                input.dispatchEvent(new Event("change", { bubbles: true }));
            }
            return;
        }

        const dt = new DataTransfer();
        dt.items.add(file);
        target.files = dt.files;
        target.dispatchEvent(new Event("change", { bubbles: true }));

        const elements = getElements();
        if (elements && elements.status) {
            elements.status.textContent = `Planilha pronta para uso: ${record.fileName}`;
            elements.status.className = "validator-status success";
        }

    }

    function pickTargetInput(inputs) {

        const visibleInputs = inputs.filter(input => {
            const isHidden = input.closest("[hidden]");
            const withinPage = input.closest(".page") && !input.closest(".page")["hidden"];
            return !isHidden && (!input.closest(".page") || withinPage);
        });

        const preferred = visibleInputs.find(input => {
            const id = input.id || "";
            return id.includes("excel-file") || id.includes("categorizer-file") || id.includes("planilha");
        });

        return preferred || visibleInputs[0] || inputs[0] || null;

    }

    async function downloadRecord(id) {

        const record = await PlanilhaStorage.getById(id);

        if (!record) {
            return;
        }

        const ok = await PlanilhaStorage.downloadFile(id);
        const elements = getElements();

        if (elements && elements.status) {
            elements.status.textContent = ok
                ? `Download iniciado: ${record.fileName}`
                : "Não foi possível baixar a planilha selecionada.";
            elements.status.className = ok ? "validator-status success" : "validator-status error";
        }

    }

    async function deleteRecord(id) {

        const record = await PlanilhaStorage.getById(id);

        if (!record) {
            return;
        }

        const confirmed = window.confirm(`Deseja realmente excluir "${record.fileName}"?`);

        if (!confirmed) {
            return;
        }

        await PlanilhaStorage.removeFile(id);

        if (state.selectedId === id) {
            state.selectedId = null;
        }

        const elements = getElements();
        if (elements && elements.status) {
            elements.status.textContent = `Planilha removida: ${record.fileName}`;
            elements.status.className = "validator-status success";
        }

        await refreshList();

    }

    return {
        init,
        refreshList
    };

})();

document.addEventListener("DOMContentLoaded", () => {
    PlanilhaCadastroUI.init();
});
