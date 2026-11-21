
"use strict";

/**
 * GENETIC TSP OPTIMIZER
 * Módulo: Comunicación con la API REST.
 */

const TSPApi = (() => {

    const BASE_URL = "/api";


    /**
     * Procesa las respuestas HTTP y centraliza los errores.
     */
    async function request(endpoint, options = {}) {

        let response;

        try {

            response = await fetch(`${BASE_URL}${endpoint}`, {
                ...options,
                headers: {
                    "Content-Type": "application/json",
                    ...options.headers
                }
            });

        } catch (error) {

            throw new Error(
                "No fue posible conectar con el servidor Flask. " +
                "Comprueba que la aplicación esté ejecutándose."
            );
        }

        let data;

        try {

            data = await response.json();

        } catch (error) {

            throw new Error(
                "El servidor devolvió una respuesta que no es JSON válido."
            );
        }

        if (!response.ok) {

            throw new Error(
                data.error ||
                data.message ||
                `Error HTTP ${response.status}.`
            );
        }

        return data;
    }


    /**
     * Comprueba la disponibilidad de la API.
     */
    async function checkHealth() {

        return request("/health", {
            method: "GET",
            headers: {}
        });
    }


    /**
     * Envía una instancia TSP para validación.
     */
    async function validateProblem(problemData) {

        return request("/validate", {
            method: "POST",
            body: JSON.stringify(problemData)
        });
    }


    /**
     * Envía una instancia TSP y su configuración
     * para ejecutar el algoritmo genético.
     */
    async function optimizeProblem(problemData, config) {

        const payload = {
            ...problemData,
            config: { ...config }
        };

        return request("/optimize", {
            method: "POST",
            body: JSON.stringify(payload)
        });
    }


    return {
        checkHealth,
        validateProblem,
        optimizeProblem
    };

})();


window.TSPApi = TSPApi;
