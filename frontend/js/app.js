
"use strict";

/**
 * GENETIC TSP OPTIMIZER
 * Módulo: Coordinador principal de la aplicación.
 *
 * Responsabilidades:
 * - Comprobar la conexión con Flask.
 * - Coordinar la validación del problema.
 * - Obtener la configuración genética.
 * - Ejecutar la optimización.
 * - Presentar los resultados.
 * - Gestionar estados y mensajes.
 */

const TSPApp = (() => {

    // =====================================================
    // REFERENCIAS DOM
    // =====================================================

    const elements = {
        apiIndicator: document.getElementById("api-indicator"),
        apiStatus: document.getElementById("api-status"),

        cityCount: document.getElementById("city-count"),
        generationCount: document.getElementById("generation-count"),
        optimizationStatus: document.getElementById("optimization-status"),

        populationSize: document.getElementById("population-size"),
        generations: document.getElementById("generations"),
        crossoverRate: document.getElementById("crossover-rate"),
        mutationRate: document.getElementById("mutation-rate"),
        eliteRate: document.getElementById("elite-rate"),
        tournamentSize: document.getElementById("tournament-size"),
        randomSeed: document.getElementById("random-seed"),
        twoOpt: document.getElementById("two-opt"),

        validateButton: document.getElementById("validate-btn"),
        optimizeButton: document.getElementById("optimize-btn"),

        feedback: document.getElementById("feedback-message")
    };


    // =====================================================
    // ESTADO INTERNO
    // =====================================================

    let apiConnected = false;
    let isProcessing = false;


    // =====================================================
    // MENSAJES
    // =====================================================

    function showMessage(message, type = "error") {

        elements.feedback.textContent = message;

        elements.feedback.className =
            `feedback-message ${type}`;
    }


    function clearMessage() {

        elements.feedback.textContent = "";

        elements.feedback.className =
            "feedback-message";
    }


    // =====================================================
    // ESTADO DE LA API
    // =====================================================

    function updateApiStatus(connected, message) {

        apiConnected = connected;

        elements.apiIndicator.classList.toggle(
            "online",
            connected
        );

        elements.apiIndicator.classList.toggle(
            "offline",
            !connected
        );

        elements.apiStatus.textContent = message;
    }


    async function checkApiConnection() {

        updateApiStatus(false, "Verificando API...");

        try {

            const response = await TSPApi.checkHealth();

            if (response.status !== "ok") {
                throw new Error("El servidor no confirmó su disponibilidad.");
            }

            updateApiStatus(true, "API conectada");

            return true;

        } catch (error) {

            updateApiStatus(false, "API desconectada");

            console.error(
                "Error de conexión con Flask:",
                error
            );

            return false;
        }
    }


    // =====================================================
    // ESTADO DE PROCESAMIENTO
    // =====================================================

    function setProcessing(processing) {

        isProcessing = processing;

        elements.validateButton.disabled = processing;
        elements.optimizeButton.disabled = processing;

        elements.optimizeButton.textContent = processing
            ? "Procesando optimización..."
            : "▶ Ejecutar optimización";
    }


    function updateOptimizationStatus(status) {

        elements.optimizationStatus.textContent = status;
    }


    // =====================================================
    // OBTENER DATOS DEL PROBLEMA
    // =====================================================

    function getProblemData() {

        const validation = TSPMatrix.validateState();

        if (!validation.valid) {
            throw new Error(validation.error);
        }

        return TSPMatrix.getState();
    }


    // =====================================================
    // CONFIGURACIÓN GENÉTICA
    // =====================================================

    function readInteger(element, name) {

        const rawValue = element.value.trim();

        if (rawValue === "") {
            throw new Error(`${name} es obligatorio.`);
        }

        const value = Number(rawValue);

        if (!Number.isSafeInteger(value)) {
            throw new Error(`${name} debe ser un número entero válido.`);
        }

        return value;
    }


    function readProbability(element, name) {

        const rawValue = element.value.trim();

        if (rawValue === "") {
            throw new Error(`${name} es obligatorio.`);
        }

        const value = Number(rawValue);

        if (!Number.isFinite(value) || value < 0 || value > 1) {
            throw new Error(
                `${name} debe estar entre 0 y 1.`
            );
        }

        return value;
    }


    function getConfiguration() {

        const config = {

            population_size: readInteger(
                elements.populationSize,
                "El tamaño de población"
            ),

            generations: readInteger(
                elements.generations,
                "El número de generaciones"
            ),

            crossover_rate: readProbability(
                elements.crossoverRate,
                "La probabilidad de cruce"
            ),

            mutation_rate: readProbability(
                elements.mutationRate,
                "La probabilidad de mutación"
            ),

            elite_rate: readProbability(
                elements.eliteRate,
                "El porcentaje de elitismo"
            ),

            tournament_size: readInteger(
                elements.tournamentSize,
                "El tamaño del torneo"
            ),

            use_two_opt: elements.twoOpt.value === "true"

        };


        // Validaciones adicionales

        if (config.population_size < 1) {
            throw new Error(
                "La población debe ser de al menos 1 individuo."
            );
        }

        if (config.generations < 1) {
            throw new Error(
                "Debe ejecutarse al menos una generación."
            );
        }

        if (
            config.elite_rate <= 0 ||
            config.elite_rate >= 1
        ) {
            throw new Error(
                "El porcentaje de elitismo debe ser mayor que 0 y menor que 1."
            );
        }

        if (config.tournament_size < 1) {
            throw new Error(
                "El tamaño del torneo debe ser al menos 1."
            );
        }

        if (
            config.tournament_size > config.population_size
        ) {
            throw new Error(
                "El tamaño del torneo no puede superar la población."
            );
        }


        // Semilla aleatoria opcional

        const seedValue = elements.randomSeed.value.trim();

        if (seedValue !== "") {

            const seed = Number(seedValue);

            if (!Number.isSafeInteger(seed)) {
                throw new Error(
                    "La semilla aleatoria debe ser un número entero válido."
                );
            }

            config.seed = seed;
        } else {

            config.seed = null;
        }

        return config;
    }


    // =====================================================
    // VALIDACIÓN DEL PROBLEMA
    // =====================================================

    async function validateProblem() {

        if (isProcessing) {
            return;
        }

        clearMessage();

        try {

            const problem = getProblemData();

            if (!apiConnected) {

                const connected = await checkApiConnection();

                if (!connected) {
                    throw new Error(
                        "No existe conexión con el servidor Flask."
                    );
                }
            }

            const response =
                await TSPApi.validateProblem(problem);

            if (response.valid !== true) {
                throw new Error(
                    response.error || "El problema no es válido."
                );
            }

            showMessage(
                `Problema válido: ${response.city_count} ciudades. Matriz ${response.symmetric ? "simétrica" : "asimétrica"}.`,
                "success"
            );

            updateOptimizationStatus("VALIDADO");

            return true;

        } catch (error) {

            showMessage(error.message, "error");

            updateOptimizationStatus("ERROR");

            console.error(
                "Error al validar el problema:",
                error
            );

            return false;
        }
    }


    // =====================================================
    // EJECUTAR OPTIMIZACIÓN
    // =====================================================

    async function optimize() {

        if (isProcessing) {
            return;
        }

        clearMessage();

        setProcessing(true);

        updateOptimizationStatus("VALIDANDO...");

        try {

            // 1. Comprobar conexión

            if (!apiConnected) {

                const connected = await checkApiConnection();

                if (!connected) {
                    throw new Error(
                        "No fue posible conectar con Flask."
                    );
                }
            }


            // 2. Validar datos del problema

            const problem = getProblemData();


            // 3. Obtener configuración genética

            const config = getConfiguration();


            // 4. Validar problema en el backend

            updateOptimizationStatus("VALIDANDO...");

            const validation =
                await TSPApi.validateProblem(problem);

            if (validation.valid !== true) {
                throw new Error(
                    validation.error ||
                    "El backend rechazó la instancia TSP."
                );
            }


            // 5. Ejecutar algoritmo genético

            updateOptimizationStatus("OPTIMIZANDO...");

            showMessage(
                "El algoritmo genético está procesando la instancia...",
                "success"
            );

            const result = await TSPApi.optimizeProblem(
                problem,
                config
            );


            // 6. Validar y presentar resultados

            updateOptimizationStatus("PROCESANDO RESULTADOS...");

            TSPResults.renderResults(result);
            TSPRouteGraph.render(problem, result);


            // 7. Actualizar indicadores

            elements.cityCount.textContent =
                problem.cities.length;

            elements.generationCount.textContent =
                result.statistics.generations;

            updateOptimizationStatus("COMPLETADO");

            showMessage(
                "Optimización completada correctamente.",
                "success"
            );

            console.log(
                "Resultado de optimización:",
                result
            );

            return result;

        } catch (error) {

            updateOptimizationStatus("ERROR");

            showMessage(
                error.message ||
                "Ocurrió un error durante la optimización.",
                "error"
            );

            console.error(
                "Error durante la optimización:",
                error
            );

            return null;

        } finally {

            setProcessing(false);
        }
    }


    // =====================================================
    // EVENTOS
    // =====================================================

    function bindEvents() {

        elements.validateButton.addEventListener(
            "click",
            validateProblem
        );

        elements.optimizeButton.addEventListener(
            "click",
            optimize
        );


        // Actualizar indicador de generaciones al cambiar
        // la configuración del algoritmo.

        elements.generations.addEventListener(
            "change",
            () => {

                const value = Number(
                    elements.generations.value
                );

                if (
                    Number.isSafeInteger(value) &&
                    value > 0
                ) {
                    elements.generationCount.textContent = value;
                }
            }
        );
    }


    // =====================================================
    // INICIALIZACIÓN
    // =====================================================

    async function init() {

        bindEvents();

        elements.cityCount.textContent =
            TSPMatrix.getState().cities.length;

        await checkApiConnection();

        updateOptimizationStatus("IDLE");

        console.log(
            "GENETIC TSP OPTIMIZER inicializado correctamente."
        );
    }


    // =====================================================
    // INTERFAZ PÚBLICA
    // =====================================================

    return {
        init,
        checkApiConnection,
        validateProblem,
        optimize,
        getConfiguration
    };

})();


// Disponible globalmente.

window.TSPApp = TSPApp;


// Inicialización después de cargar el DOM.

document.addEventListener(
    "DOMContentLoaded",
    () => TSPApp.init()
);
