"use strict";

/*
 * ============================================================
 * CATEGORIZADOR EXCEL
 * Utilitários para criação e exportação de categorias.
 * ============================================================
 */

const CategoryUtils = {

    normalizeCategoryName(value) {
        return String(value ?? "")
            .trim()
            .replace(/\s+/g, " ");
    },

    validateCategoryName(value, existingNames = []) {
        const normalized = this.normalizeCategoryName(value);

        if (!normalized) {
            return {
                valid: false,
                reason: "O nome da categoria não pode ficar vazio."
            };
        }

        const exists = existingNames.some(name => {
            return this.normalizeCategoryName(name) === normalized;
        });

        if (exists) {
            return {
                valid: false,
                reason: `A categoria "${normalized}" já existe.`
            };
        }

        return {
            valid: true,
            name: normalized
        };
    },

    createSelectionMap(categories = []) {
        return categories.reduce((map, category) => {
            map[category] = new Set();
            return map;
        }, {});
    },

    ensureCategory(map, category) {
        const name = this.normalizeCategoryName(category);

        if (!name) {
            return false;
        }

        if (!map[name]) {
            map[name] = new Set();
        }

        return true;
    },

    setSelectionState(map, category, rowIndex, selected) {
        const name = this.normalizeCategoryName(category);

        if (!name || !map[name]) {
            return false;
        }

        if (selected) {
            map[name].add(rowIndex);
        } else {
            map[name].delete(rowIndex);
        }

        return true;
    },

    toggleSelectionState(map, category, rowIndex) {
        const name = this.normalizeCategoryName(category);

        if (!name || !map[name]) {
            return false;
        }

        if (map[name].has(rowIndex)) {
            map[name].delete(rowIndex);
        } else {
            map[name].add(rowIndex);
        }

        return true;
    },

    getCategoryCount(map, category) {
        const name = this.normalizeCategoryName(category);

        if (!name || !map[name]) {
            return 0;
        }

        return map[name].size;
    },

    buildExportRows(originalRows, categories, selectionMap) {
        const exportRows = originalRows.map((row, rowIndex) => {
            const out = { ...row };

            categories.forEach(category => {
                const normalizedName = this.normalizeCategoryName(category);
                const selected = (
                    selectionMap[normalizedName] &&
                    selectionMap[normalizedName].has(rowIndex)
                );

                out[normalizedName] = selected ? "X" : "";
            });

            return out;
        });

        return exportRows;
    }

};

if (typeof window !== "undefined") {
    window.CategoryUtils = CategoryUtils;
}

if (typeof module !== "undefined" && module.exports) {
    module.exports = { CategoryUtils };
}
