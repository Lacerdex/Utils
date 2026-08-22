"use strict";

/*
 * ============================================================
 * REGISTRO DE VALIDADORES
 *
 * Cada validador declara:
 * - id          : data-validator no card
 * - pageId      : id da seção em index.html
 * - title
 * - ready       : se a UI já está implementada
 * - init / reset: ciclo de vida opcional
 *
 * Para criar um novo:
 * 1. Adicione a seção #page-validator-{id} no index.html
 * 2. Crie js/ui/{id}-validator-ui.js
 * 3. Chame ValidatorRegistry.register({ ... })
 * ============================================================
 */

const ValidatorRegistry = (() => {

    const validators = {};


    function register(validator) {

        if (!validator || !validator.id) {

            throw new Error(
                "Validador precisa ter um id."
            );

        }

        validators[validator.id] = validator;

    }


    function get(id) {

        return validators[id] || null;

    }


    function list() {

        return Object.values(validators);

    }


    return {

        register,
        get,
        list

    };

})();
