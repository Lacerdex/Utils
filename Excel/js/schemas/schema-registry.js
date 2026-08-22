"use strict";

/*
 * ============================================================
 * REGISTRO DE SCHEMAS
 *
 * Para adicionar um modelo:
 * 1. Crie o arquivo em js/schemas/
 * 2. Chame SchemaRegistry.register(MeuSchema)
 * ============================================================
 */

const SchemaRegistry = (() => {

    const schemas = {};


    function register(schema) {

        if (!schema || !schema.name) {

            throw new Error(
                "Schema precisa ter um nome."
            );

        }

        schemas[schema.name] = schema;

    }


    function get(name) {

        return schemas[name] || null;

    }


    function list() {

        return Object.values(schemas);

    }


    function getDefault() {

        return schemas.cadastro || list()[0] || null;

    }


    return {

        register,
        get,
        list,
        getDefault

    };

})();
