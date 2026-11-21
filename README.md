
# Genetic TSP Optimizer

Aplicación web para resolver el Problema del Vendedor Viajero
(Traveling Salesperson Problem, TSP) mediante un algoritmo genético.

## Características

- Importación de matrices de costos mediante archivos CSV.
- Validación de instancias TSP.
- Configuración de parámetros del algoritmo genético.
- Selección, cruce, mutación y elitismo.
- Búsqueda local 2-opt opcional.
- Visualización del recorrido optimizado.
- Gráfica de convergencia.
- API REST desarrollada con Flask.

## Tecnologías

- Python
- Flask
- NumPy
- JavaScript
- HTML5
- CSS3
- Pytest

## Estructura

```text
Genetic_TSP_Optimizer/
├── backend/
│   ├── genetic_algorithm/
│   ├── models/
│   ├── routes/
│   ├── validation/
│   ├── app.py
│   └── config.py
├── frontend/
│   ├── css/
│   ├── js/
│   └── index.html
├── tests/
├── docs/
├── requirements.txt
├── README.md
└── .gitignore
```

## Instalación local

Clonar el repositorio:

```bash
git clone URL_DEL_REPOSITORIO
cd Genetic_TSP_Optimizer
```

Crear un entorno virtual:

```bash
python -m venv .venv
```

Activarlo en Windows:

```powershell
.\.venv\Scripts\Activate.ps1
```

Instalar dependencias:

```bash
pip install -r requirements.txt
```

## Ejecución local

```bash
python -m backend.app
```

Abrir en el navegador:

http://127.0.0.1:5000

## API REST

| Método | Endpoint | Descripción |
|--------|----------|-------------|
| GET | /api/health | Estado de la API |
| POST | /api/validate | Validación de instancia |
| POST | /api/optimize | Optimización TSP |

## Pruebas

```bash
pytest -v
```

## Despliegue

La aplicación utiliza Flask como backend y puede ejecutarse
en un servicio de alojamiento compatible con Python y WSGI.

Comando de producción:

```bash
gunicorn --bind 0.0.0.0:$PORT backend.app:app
```
