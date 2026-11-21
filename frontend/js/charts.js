
"use strict";

/**
 * GENETIC TSP OPTIMIZER
 * Módulo: Visualización de convergencia genética.
 *
 * Utiliza Canvas 2D nativo.
 * No requiere bibliotecas externas.
 */

const TSPCharts = (() => {

    let canvas = null;
    let context = null;
    let historyData = [];

    const colors = {
        background: "#111827",
        grid: "#293548",
        line: "#38bdf8",
        point: "#7dd3fc",
        text: "#94a3b8"
    };


    // =====================================================
    // INICIALIZACIÓN
    // =====================================================

    function init() {

        canvas = document.getElementById("convergence-chart");

        if (!canvas) {
            console.error("No se encontró convergence-chart.");
            return;
        }

        context = canvas.getContext("2d");

        if (!context) {
            console.error("No fue posible inicializar Canvas 2D.");
            return;
        }

        if ("ResizeObserver" in window) {

            const observer = new ResizeObserver(() => {
                if (historyData.length > 0) {
                    draw();
                }
            });

            observer.observe(canvas.parentElement);

        } else {

            window.addEventListener("resize", () => {
                if (historyData.length > 0) {
                    draw();
                }
            });
        }
    }


    // =====================================================
    // VALIDACIÓN DE DATOS
    // =====================================================

    function validateHistory(history) {

        if (!Array.isArray(history) || history.length === 0) {
            throw new Error("El historial de convergencia está vacío.");
        }

        const valid = history.every(
            value =>
                typeof value === "number" &&
                Number.isFinite(value) &&
                value >= 0
        );

        if (!valid) {
            throw new Error(
                "El historial contiene valores inválidos."
            );
        }

        return true;
    }


    // =====================================================
    // CONFIGURACIÓN DEL CANVAS
    // =====================================================

    
    function resizeCanvas() {

        // Medimos el contenedor, no el Canvas.
        const rect = canvas.parentElement.getBoundingClientRect();

        const width = Math.max(rect.width, 300);
        const height = Math.max(rect.height, 220);

        const pixelRatio = Math.min(
            window.devicePixelRatio || 1,
            2
        );

        // Dimensiones internas del Canvas.
        canvas.width = Math.round(width * pixelRatio);
        canvas.height = Math.round(height * pixelRatio);

        // Escalado para pantallas de alta densidad.
        context.setTransform(
            pixelRatio,
            0,
            0,
            pixelRatio,
            0,
            0
        );

        return { width, height };
    }



    // =====================================================
    // DIBUJO DE LA GRÁFICA
    // =====================================================

    function draw() {

        if (!canvas || !context || historyData.length === 0) {
            return;
        }

        const { width, height } = resizeCanvas();

        const padding = {
            top: 24,
            right: 24,
            bottom: 42,
            left: 65
        };

        const plotWidth =
            width - padding.left - padding.right;

        const plotHeight =
            height - padding.top - padding.bottom;

        const minValue = Math.min(...historyData);
        const maxValue = Math.max(...historyData);

        const range = maxValue - minValue;

        const margin = range === 0
            ? Math.max(Math.abs(maxValue) * 0.05, 1)
            : range * 0.1;

        const minY = Math.max(0, minValue - margin);
        const maxY = maxValue + margin;

        const adjustedRange = maxY - minY || 1;

        context.clearRect(0, 0, width, height);

        context.fillStyle = colors.background;

        context.fillRect(0, 0, width, height);


        // -------------------------------------------------
        // GRID Y ETIQUETAS
        // -------------------------------------------------

        context.font = "11px Arial";
        context.fillStyle = colors.text;
        context.strokeStyle = colors.grid;
        context.lineWidth = 1;

        const divisions = 5;

        for (let i = 0; i <= divisions; i++) {

            const y = padding.top +
                (plotHeight / divisions) * i;

            const value = maxY -
                (adjustedRange / divisions) * i;

            context.beginPath();

            context.moveTo(padding.left, y);
            context.lineTo(width - padding.right, y);

            context.stroke();

            context.textAlign = "right";
            context.textBaseline = "middle";

            context.fillText(
                value.toFixed(2),
                padding.left - 10,
                y
            );
        }


        // -------------------------------------------------
        // COORDENADAS DE LOS DATOS
        // -------------------------------------------------

        const points = historyData.map((value, index) => {

            const x = historyData.length === 1
                ? padding.left + plotWidth / 2
                : padding.left +
                    (index / (historyData.length - 1)) *
                    plotWidth;

            const y = padding.top +
                ((maxY - value) / adjustedRange) *
                plotHeight;

            return { x, y };
        });


        // -------------------------------------------------
        // LÍNEA DE CONVERGENCIA
        // -------------------------------------------------

        context.beginPath();

        context.strokeStyle = colors.line;
        context.lineWidth = 2.5;
        context.lineJoin = "round";
        context.lineCap = "round";

        points.forEach((point, index) => {

            if (index === 0) {
                context.moveTo(point.x, point.y);
            } else {
                context.lineTo(point.x, point.y);
            }

        });

        context.stroke();


        // -------------------------------------------------
        // PUNTOS INICIAL Y FINAL
        // -------------------------------------------------

        [points[0], points[points.length - 1]].forEach(point => {

            context.beginPath();

            context.arc(
                point.x,
                point.y,
                4,
                0,
                Math.PI * 2
            );

            context.fillStyle = colors.point;

            context.fill();
        });


        // -------------------------------------------------
        // ETIQUETAS DE EJES
        // -------------------------------------------------

        context.fillStyle = colors.text;
        context.font = "11px Arial";

        context.textAlign = "center";
        context.textBaseline = "top";

        context.fillText(
            "Generaciones",
            padding.left + plotWidth / 2,
            height - 18
        );

        context.save();

        context.translate(15, padding.top + plotHeight / 2);
        context.rotate(-Math.PI / 2);

        context.textAlign = "center";
        context.textBaseline = "middle";

        context.fillText("Mejor costo", 0, 0);

        context.restore();


        // -------------------------------------------------
        // INFORMACIÓN DE CONVERGENCIA
        // -------------------------------------------------

        context.textAlign = "left";
        context.textBaseline = "top";
        context.font = "bold 11px Arial";

        context.fillStyle = colors.point;

        context.fillText(
            `Mejor: ${minValue.toFixed(2)}`,
            padding.left,
            5
        );
    }


    // =====================================================
    // ACTUALIZAR GRÁFICA
    // =====================================================

    function renderConvergence(history) {

        validateHistory(history);

        if (!canvas || !context) {
            init();
        }

        historyData = [...history];

        draw();
    }


    function clear() {

        historyData = [];

        if (canvas && context) {

            const { width, height } = resizeCanvas();

            context.clearRect(0, 0, width, height);

        }
    }


    // =====================================================
    // INTERFAZ PÚBLICA
    // =====================================================

    return {
        init,
        renderConvergence,
        clear
    };

})();


window.TSPCharts = TSPCharts;


document.addEventListener(
    "DOMContentLoaded",
    () => TSPCharts.init()
);
