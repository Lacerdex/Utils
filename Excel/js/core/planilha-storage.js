"use strict";

const PlanilhaStorage = (() => {

    const STORAGE_KEY = "utils-excel-planilhas";
    const DB_NAME = "utils-excel-planilhas-db";
    const DB_VERSION = 1;
    const STORE_NAME = "planilhas";
    const VALID_TYPES = [".xlsx", ".xls", ".csv"];

    let dbPromise = null;

    function normalizeExtension(value) {

        if (!value) {
            return "";
        }

        return value.trim().toLowerCase();

    }

    function getExtension(fileName) {

        if (!fileName) {
            return "";
        }

        const match = /(?:\.[^./\\]+)$/i.exec(fileName);

        return match ? match[0].toLowerCase() : "";

    }

    function getFolderForExtension(fileName) {

        const ext = getExtension(fileName);

        if (ext === ".csv") {
            return "csv";
        }

        return "excel";

    }

    function getTargetExtensionForFolder(targetFolder) {

        const normalized = (targetFolder || "excel").toLowerCase();

        if (normalized === "csv") {
            return ".csv";
        }

        return ".xlsx";

    }

    function getBaseNameWithoutExtension(fileName) {

        const extension = getExtension(fileName || "");

        if (!extension) {
            return sanitizeBaseName(fileName || "planilha");
        }

        return sanitizeBaseName((fileName || "planilha").replace(new RegExp(`${extension.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}$`, "i"), ""));

    }

    function generateId() {

        return `planilha-${Date.now()}-${Math.random().toString(16).slice(2, 10)}`;

    }

    function sanitizeBaseName(value) {

        return String(value || "planilha")
            .replace(/[\\/]+/g, "-")
            .replace(/\s+/g, " ")
            .replace(/[^a-zA-Z0-9 _-]/g, "")
            .trim()
            .replace(/\s+/g, " ") || "planilha";

    }

    function buildSafeName(fileName, existingNames, customName = "", targetFolder = "") {

        const targetExtension = getTargetExtensionForFolder(targetFolder || getFolderForExtension(fileName));
        const extension = getExtension(fileName || "");
        const baseName = sanitizeBaseName(customName || (fileName || "").replace(new RegExp(`${extension.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}$`, "i"), ""));

        let candidate = `${baseName}${targetExtension}`;
        let suffix = 1;

        while (existingNames.includes(candidate)) {
            candidate = `${baseName} (${suffix})${targetExtension}`;
            suffix += 1;
        }

        return candidate;

    }

    function mimeForExtension(extension) {

        switch (extension) {
            case ".csv":
                return "text/csv";
            case ".xls":
                return "application/vnd.ms-excel";
            case ".xlsx":
                return "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet";
            default:
                return "application/octet-stream";
        }

    }

    function openDatabase() {

        if (dbPromise) {
            return dbPromise;
        }

        dbPromise = new Promise((resolve, reject) => {

            if (!window.indexedDB) {
                reject(new Error("IndexedDB não está disponível no navegador."));
                return;
            }

            const request = window.indexedDB.open(DB_NAME, DB_VERSION);

            request.onupgradeneeded = () => {

                const db = request.result;

                if (!db.objectStoreNames.contains(STORE_NAME)) {
                    const store = db.createObjectStore(STORE_NAME, { keyPath: "id" });
                    store.createIndex("folder", "folder", { unique: false });
                    store.createIndex("extension", "extension", { unique: false });
                }

            };

            request.onsuccess = () => resolve(request.result);
            request.onerror = () => reject(request.error || new Error("Falha ao abrir IndexedDB."));

        });

        return dbPromise;

    }

    function asArrayBuffer(file) {

        return file.arrayBuffer ? file.arrayBuffer() : Promise.resolve(file);

    }

    async function convertFileToTargetFolder(file, targetFolder) {

        if (!file || !file.name) {
            return file;
        }

        const normalizedFolder = (targetFolder || "excel").toLowerCase();
        const selectedFolder = normalizedFolder === "csv" ? "csv" : "excel";
        const targetExtension = getTargetExtensionForFolder(selectedFolder);
        const currentExtension = getExtension(file.name);

        if (!currentExtension || currentExtension === targetExtension) {
            return file;
        }

        if (typeof XLSX === "undefined") {
            throw new Error("A biblioteca XLSX não está disponível para converter a pasta de destino.");
        }

        const arrayBuffer = await asArrayBuffer(file);
        const sourceName = getBaseNameWithoutExtension(file.name);

        if (selectedFolder === "csv") {
            const workbook = XLSX.read(arrayBuffer, { type: "array" });
            const firstSheet = workbook.Sheets[workbook.SheetNames[0]];
            const csvText = XLSX.utils.sheet_to_csv(firstSheet || {});
            return new File([csvText], `${sourceName}.csv`, {
                type: "text/csv;charset=utf-8;",
                lastModified: Date.now()
            });
        }

        if (currentExtension === ".csv") {
            const csvText = typeof file.text === "function" ? await file.text() : new TextDecoder().decode(arrayBuffer);
            const workbook = XLSX.read(csvText, { type: "string" });
            const workbookBuffer = XLSX.write(workbook, { bookType: "xlsx", type: "array" });
            return new File([workbookBuffer], `${sourceName}.xlsx`, {
                type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
                lastModified: Date.now()
            });
        }

        const workbook = XLSX.read(arrayBuffer, { type: "array" });
        const workbookBuffer = XLSX.write(workbook, { bookType: "xlsx", type: "array" });
        return new File([workbookBuffer], `${sourceName}.xlsx`, {
            type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
            lastModified: Date.now()
        });

    }

    async function listFiles() {

        try {
            const db = await openDatabase();
            return await new Promise((resolve, reject) => {
                const tx = db.transaction(STORE_NAME, "readonly");
                const request = tx.objectStore(STORE_NAME).getAll();

                request.onsuccess = () => {
                    const items = Array.isArray(request.result) ? request.result : [];
                    items.sort((a, b) => a.fileName.localeCompare(b.fileName, "pt-BR"));
                    resolve(items);
                };

                request.onerror = () => reject(request.error || new Error("Falha ao listar planilhas."));
            });

        } catch (error) {
            console.warn("PlanilhaStorage: IndexedDB indisponível; usando fallback em memória.", error);
            const fallback = JSON.parse(localStorage.getItem(STORAGE_KEY) || "[]");
            return Array.isArray(fallback) ? fallback : [];
        }

    }

    async function saveFile(file, options = {}) {

        if (!file || !file.name) {
            throw new Error("Arquivo inválido.");
        }

        const requestedFolder = (options.targetFolder || getFolderForExtension(file.name)).toLowerCase();
        const folder = requestedFolder === "csv" ? "csv" : "excel";
        const normalizedFile = await convertFileToTargetFolder(file, folder);
        const extension = normalizeExtension(getExtension(normalizedFile.name));

        if (!VALID_TYPES.includes(extension)) {
            throw new Error("Formato de arquivo não permitido. Use .xlsx, .xls ou .csv.");
        }

        const records = await listFiles();
        const desiredName = (options.customName || "").trim();
        const finalName = buildSafeName(normalizedFile.name, records.map(item => item.fileName), desiredName, folder);
        const now = new Date().toISOString();
        const item = {
            id: generateId(),
            originalName: normalizedFile.name,
            fileName: finalName,
            extension,
            folder,
            relativePath: `data/planilhas/${folder}/${finalName}`,
            size: Number(normalizedFile.size || 0),
            mimeType: mimeForExtension(extension),
            createdAt: now,
            updatedAt: now,
            customName: desiredName,
            content: await asArrayBuffer(normalizedFile)
        };

        try {
            const db = await openDatabase();
            await new Promise((resolve, reject) => {
                const tx = db.transaction(STORE_NAME, "readwrite");
                const request = tx.objectStore(STORE_NAME).put(item);
                request.onsuccess = () => resolve();
                request.onerror = () => reject(request.error || new Error("Falha ao salvar planilha."));
            });

        } catch (error) {
            const fallback = JSON.parse(localStorage.getItem(STORAGE_KEY) || "[]");
            fallback.push(item);
            localStorage.setItem(STORAGE_KEY, JSON.stringify(fallback));
        }

        return item;

    }

    async function getById(id) {

        const records = await listFiles();
        return records.find(item => item.id === id) || null;

    }

    async function getFile(id) {

        const record = await getById(id);

        if (!record) {
            return null;
        }

        if (record.content instanceof Blob) {
            return new File([record.content], record.fileName, {
                type: record.mimeType,
                lastModified: new Date(record.updatedAt).getTime()
            });
        }

        if (record.content instanceof ArrayBuffer) {
            return new File([record.content], record.fileName, {
                type: record.mimeType,
                lastModified: new Date(record.updatedAt).getTime()
            });
        }

        if (record.content && typeof record.content === "object" && record.content.byteLength !== undefined) {
            return new File([record.content], record.fileName, {
                type: record.mimeType,
                lastModified: new Date(record.updatedAt).getTime()
            });
        }

        return null;

    }

    async function removeFile(id) {

        const record = await getById(id);

        if (!record) {
            return false;
        }

        try {
            const db = await openDatabase();
            await new Promise((resolve, reject) => {
                const tx = db.transaction(STORE_NAME, "readwrite");
                const request = tx.objectStore(STORE_NAME).delete(id);
                request.onsuccess = () => resolve();
                request.onerror = () => reject(request.error || new Error("Falha ao excluir planilha."));
            });
            return true;

        } catch (error) {
            const fallback = JSON.parse(localStorage.getItem(STORAGE_KEY) || "[]");
            const filtered = fallback.filter(item => item.id !== id);
            localStorage.setItem(STORAGE_KEY, JSON.stringify(filtered));
            return true;
        }

    }

    async function downloadFile(id) {

        const record = await getById(id);

        if (!record) {
            return false;
        }

        const file = await getFile(id);

        if (!file) {
            return false;
        }

        const blobUrl = URL.createObjectURL(file);
        const trigger = document.createElement("a");

        trigger.href = blobUrl;
        trigger.download = record.fileName;
        trigger.style.display = "none";
        document.body.appendChild(trigger);
        trigger.click();
        document.body.removeChild(trigger);

        setTimeout(() => URL.revokeObjectURL(blobUrl), 2000);

        return true;

    }

    return {
        VALID_TYPES,
        listFiles,
        saveFile,
        getById,
        getFile,
        removeFile,
        downloadFile,
        getExtension,
        relativePathFor: (fileName) => `data/planilhas/${getFolderForExtension(fileName)}/${fileName}`
    };

})();
