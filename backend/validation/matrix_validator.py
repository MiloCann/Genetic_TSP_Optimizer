
import math

from backend.models.problem_instance import ProblemInstance


def validate_problem_instance(
    problem: ProblemInstance,
    min_cities: int = 3
) -> None:
    """
    Valida la estructura y los valores de una instancia TSP.

    Lanza ValueError cuando encuentra información incorrecta.

    min_cities=3 permite realizar pruebas pequeñas.
    La aplicación final utilizará min_cities=20.
    """

    if not isinstance(problem, ProblemInstance):
        raise ValueError("Se requiere una instancia ProblemInstance.")

    # 1. Validar cantidad de ciudades.
    n = problem.city_count

    if n < min_cities:
        raise ValueError(
            f"Se requieren al menos {min_cities} ciudades."
        )

    # 2. Validar nombres.
    if any(
        not isinstance(city, str) or not city.strip()
        for city in problem.cities
    ):
        raise ValueError("Todos los nombres deben ser válidos.")

    normalized_names = [
        city.strip().casefold()
        for city in problem.cities
    ]

    if len(set(normalized_names)) != n:
        raise ValueError("No se permiten ciudades duplicadas.")

    # 3. Validar ciudad inicial.
    if (
        isinstance(problem.start_city, bool)
        or not isinstance(problem.start_city, int)
        or not 0 <= problem.start_city < n
    ):
        raise ValueError("El índice de ciudad inicial no es válido.")

    # 4. Validar modalidad de matriz.
    if not isinstance(problem.symmetric, bool):
        raise ValueError("El indicador symmetric debe ser booleano.")

    # 5. Validar dimensiones.
    if len(problem.cost_matrix) != n:
        raise ValueError("La matriz debe tener n filas.")

    for row in problem.cost_matrix:
        if len(row) != n:
            raise ValueError(
                "La matriz debe ser cuadrada de dimensión n x n."
            )

    # 6. Validar costos.
    for i in range(n):
        for j in range(n):

            cost = problem.cost_matrix[i][j]

            if cost is None:
                if i == j:
                    raise ValueError(
                        "La diagonal principal debe contener ceros."
                    )
                continue

            if isinstance(cost, bool) or not isinstance(
                cost, (int, float)
            ):
                raise ValueError(
                    f"Costo inválido en la posición [{i}][{j}]."
                )

            if not math.isfinite(cost):
                raise ValueError(
                    f"El costo [{i}][{j}] debe ser finito."
                )

            if cost < 0:
                raise ValueError(
                    f"El costo [{i}][{j}] no puede ser negativo."
                )

            if i == j and cost != 0:
                raise ValueError(
                    "La diagonal principal debe contener ceros."
                )

    # 7. Validar simetría cuando corresponda.
    if problem.symmetric:
        for i in range(n):
            for j in range(i + 1, n):

                forward = problem.cost_matrix[i][j]
                backward = problem.cost_matrix[j][i]

                if forward != backward:
                    raise ValueError(
                        f"La matriz no es simétrica en "
                        f"[{i}][{j}] y [{j}][{i}]."
                    )

    return None
