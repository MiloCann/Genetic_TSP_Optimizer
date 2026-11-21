
from backend.models.problem_instance import ProblemInstance
from backend.genetic_algorithm.individual import Individual


class InfeasibleRouteError(ValueError):
    """Indica que una ruta utiliza conexiones inexistentes."""


def calculate_route_cost(
    individual: Individual,
    problem: ProblemInstance
) -> float:
    """
    Calcula el costo total de una ruta TSP.

    La ruta debe:
    - Visitar todas las ciudades exactamente una vez.
    - Comenzar en la ciudad de origen.
    - Regresar al origen.
    - Utilizar únicamente conexiones disponibles.
    """

    individual.validate(
        city_count=problem.city_count,
        start_city=problem.start_city
    )

    route = individual.closed_route()
    total_cost = 0.0

    for i in range(len(route) - 1):

        origin = route[i]
        destination = route[i + 1]

        cost = problem.get_cost(origin, destination)

        if cost is None:
            raise InfeasibleRouteError(
                f"No existe conexión entre "
                f"{problem.cities[origin]} y "
                f"{problem.cities[destination]}."
            )

        total_cost += cost

    return total_cost
