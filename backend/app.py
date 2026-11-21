
from pathlib import Path

from flask import Flask, jsonify, send_from_directory

from backend.config import Config
from backend.routes.optimization_routes import optimization_bp


# Ruta absoluta de la carpeta frontend
FRONTEND_DIR = Path(__file__).resolve().parent.parent / "frontend"


def create_app(config_class=Config):
    """Crea y configura la aplicación Flask."""

    app = Flask(
        __name__,
        static_folder=str(FRONTEND_DIR),
        static_url_path="/static"
    )

    app.config.from_object(config_class)

    # Registrar endpoints de la API
    app.register_blueprint(optimization_bp)

    # Página principal
    @app.get("/")
    def index():
        return send_from_directory(
            str(FRONTEND_DIR),
            "index.html"
        )

    # Manejo de errores
    @app.errorhandler(404)
    def not_found(error):
        return jsonify({
            "error": "El recurso solicitado no existe."
        }), 404

    @app.errorhandler(405)
    def method_not_allowed(error):
        return jsonify({
            "error": "Método HTTP no permitido."
        }), 405

    return app


app = create_app()


if __name__ == "__main__":
    app.run(
        host="127.0.0.1",
        port=5000,
        debug=app.config["DEBUG"]
    )
