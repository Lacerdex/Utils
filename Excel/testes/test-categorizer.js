/*
 * Teste do módulo de categorização.
 * Executar com: node Excel/test-categorizer.js
 */

const path = require("path");
const fs = require("fs");

const utilsPath = path.join(__dirname, "js/core/category-utils.js");
const source = fs.readFileSync(utilsPath, "utf8");

const { CategoryUtils } = (() => {
    const moduleObject = { exports: {} };
    const loader = new Function(
        "module",
        `${source}\nmodule.exports = { CategoryUtils };`
    );
    loader(moduleObject);
    return moduleObject.exports;
})();

const rows = [
    { Nome: "João Pedro", Email: "teste1@gmail.com", Cidade: "São Paulo" },
    { Nome: "Maria Clara", Email: "maria@gmail.com", Cidade: "Campinas" },
    { Nome: "Pedro", Email: "teste2@gmail.com", Cidade: "São Paulo" }
];

const categories = ["Clientes VIP", "Clientes Regulares", "São Paulo"];
const selectionMap = CategoryUtils.createSelectionMap(categories);

CategoryUtils.setSelectionState(selectionMap, "Clientes VIP", 0, true);
CategoryUtils.setSelectionState(selectionMap, "Clientes VIP", 1, true);
CategoryUtils.setSelectionState(selectionMap, "Clientes Regulares", 2, true);
CategoryUtils.setSelectionState(selectionMap, "São Paulo", 0, true);
CategoryUtils.setSelectionState(selectionMap, "São Paulo", 2, true);

const exportRows = CategoryUtils.buildExportRows(rows, categories, selectionMap);

console.log("=== Teste de categorização ===");
console.table(exportRows);

let failures = 0;

function check(name, condition) {
    if (condition) {
        console.log(`[OK] ${name}`);
    } else {
        console.error(`[FALHOU] ${name}`);
        failures++;
    }
}

check("Categoria vazia rejeitada", !CategoryUtils.validateCategoryName("", ["Clientes VIP"]).valid);
check("Categoria duplicada rejeitada", !CategoryUtils.validateCategoryName("Clientes VIP", ["Clientes VIP"]).valid);
check("Categoria válida aceita", CategoryUtils.validateCategoryName("Newsletter", ["Clientes VIP"]).valid);
check("Contagem da categoria VIP", CategoryUtils.getCategoryCount(selectionMap, "Clientes VIP") === 2);
check("Dados originais preservados", exportRows[0].Nome === "João Pedro" && exportRows[0].Email === "teste1@gmail.com");
check("Categoria extra adicionada como coluna", exportRows[0]["Clientes VIP"] === "X" && exportRows[2]["Clientes Regulares"] === "X");
check("Linha sem marcação permanece vazia", exportRows[1]["São Paulo"] === "");
check("Validação de nomes normaliza espaços", CategoryUtils.normalizeCategoryName("   Clientes    VIP   ") === "Clientes VIP");

if (failures > 0) {
    console.error(`${failures} verificação(ões) falharam.`);
    process.exit(1);
}

console.log("Todas as verificações passaram.");
