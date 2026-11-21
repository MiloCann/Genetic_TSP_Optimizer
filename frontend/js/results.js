
"use strict";

/**
 * GENETIC TSP OPTIMIZER
 * Módulo: Presentación de resultados.
 */

const TSPResults = (() => {

    const elements = {
        resultCost: document.getElementById("result-cost"),
        resultGeneration: document.getElementById("result-generation"),
        resultCities: document.getElementById("result-cities"),
        routeSequence: document.getElementById("route-sequence"),
        bestCost: document.getElementById("best-cost"),
        generationCount: document.getElementById("generation-count"),
        optimizationStatus: document.getElementById("optimization-status")
    };


    // =====================================================
    // VALIDACIÓN DE RESPUESTA
    // =====================================================

    function validateResult(result) {

        if (!result || typeof result !== "object") {
            throw new Error("La respuesta de optimización no es válida.");
        }

        if (result.feasible !== true) {
            throw new Error("El servidor no devolvió una ruta factible.");
        }

        if (
            typeof result.total_cost !== "number" ||
            !Number.isFinite(result.total_cost) ||
            result.total_cost < 0
        ) {
            throw new Error("El costo total recibido no es válido.");
        }

        if (
            !Number.isInteger(result.best_generation) ||
            result.best_generation < 0
        ) {
            throw new Error("La generación recibida no es válida.");
        }

        if (
            !Array.isArray(result.route) ||
            !Array.isArray(result.route_names) ||
            result.route.length < 4 ||
            result.route.length !== result.route_names.length
        ) {
            throw new Error("La secuencia de ciudades recibida es inválida.");
        }

        if (
            result.route[0] !== result.route[result.route.length - 1] ||
            result.route_names[0] !==
                result.route_names[result.route_names.length - 1]
        ) {
            throw new Error("La ruta no regresa a la ciudad de origen.");
        }

        if (!Array.isArray(result.history) || result.history.length === 0) {
            throw new Error("No se recibió el historial de convergencia.");
        }

        if (!result.history.every(
            value =>
                typeof value === "number" &&
                Number.isFinite(value) &&
                value >= 0
        )) {
            throw new Error("El historial contiene valores inválidos.");
        }

        if (
            !result.statistics ||
            typeof result.statistics !== "object"
        ) {
            throw new Error("No se recibieron las estadísticas.");
        }

        return true;
    }


    // =====================================================
    // FORMATO NUMÉRICO
    // =====================================================

    function formatCost(value) {

        return new Intl.NumberFormat("es-CO", {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2
        }).format(value);
    }


    // =====================================================
    // MOSTRAR INFORMACIÓN GENERAL
    // =====================================================

    function renderSummary(result) {

        elements.resultCost.textContent =
            formatCost(result.total_cost);

        elements.resultGeneration.textContent =
            result.best_generation;

        elements.resultCities.textContent =
            result.route_names.length - 1;

        if (elements.bestCost) {
            elements.bestCost.textContent =
                formatCost(result.total_cost);
        }

        if (elements.generationCount) {
            elements.generationCount.textContent =
                result.statistics.generations;
        }

        if (elements.optimizationStatus) {
            elements.optimizationStatus.textContent =
                "Optimización completada";
        }
    }


    // =====================================================
    // MOSTRAR SECUENCIA DE CIUDADES
    // =====================================================

    function renderRoute(result) {

        const container = elements.routeSequence;

        container.replaceChildren();

        result.route_names.forEach((city, index) => {

            const item = document.createElement("div");

            item.className = "route-item";

            const number = document.createElement("span");

            number.className = "route-number";
            number.textContent = index + 1;

            const name = document.createElement("span");

            name.className = "route-city";
            name.textContent = city;

            item.append(number, name);

            if (index === result.route_names.length - 1) {
                item.classList.add("route-return");
            }

            container.appendChild(item);

            if (index < result.route_names.length - 1) {

                const connector = document.createElement("div");

                connector.className = "route-connector";
                connector.textContent = "↓";

                container.appendChild(connector);
            }
        });
    }


    // =====================================================
    // ACTUALIZAR GRÁFICA
    // =====================================================

    function renderChart(result) {

        if (
            !window.TSPCharts ||
            typeof window.TSPCharts.renderConvergence !== "function"
        ) {
            console.warn("El módulo de gráficas no está disponible.");
            return;
        }

        window.TSPCharts.renderConvergence(result.history);
    }


    // =====================================================
    // RENDERIZAR RESULTADOS COMPLETOS
    // =====================================================

    function renderResults(result) {

        validateResult(result);

        renderSummary(result);

        renderRoute(result);

        renderChart(result);

        return true;
    }


    // =====================================================
    // LIMPIAR RESULTADOS
    // =====================================================

    function clear() {

        [
            elements.resultCost,
            elements.resultGeneration,
            elements.resultCities,
            elements.bestCost
        ].forEach(element => {

            if (element) {
                element.textContent = "--";
            }
        });

        if (elements.routeSequence) {
            elements.routeSequence.replaceChildren();
        }

        if (elements.optimizationStatus) {
            elements.optimizationStatus.textContent =
                "Esperando optimización";
        }

        if (window.TSPCharts) {
            window.TSPCharts.clear();
        }
    }


    // =====================================================
    // INTERFAZ PÚBLICA
    // =====================================================

    return {
        validateResult,
        renderResults,
        clear,
        formatCost
    };

})();


window.TSPResults = TSPResults;
