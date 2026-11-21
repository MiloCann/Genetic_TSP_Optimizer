
import math
from collections.abc import Sequence

from backend.genetic_algorithm.individual import Individual


def select_elites(
    population: Sequence[Individual],
    costs: Sequence[float],
    elite_count: int
) -> list[Individual]:
    """
    Selecciona los mejores individuos para conservarlos
    en la siguiente generación.

    El menor costo representa la mejor solución.

    Args:
        population: Individuos de la generación actual.
        costs: Costo correspondiente a cada individuo.
        elite_count: Cantidad de individuos que se conservarán.

    Returns:
        Lista de individuos ordenados del mejor al peor.
    """

    if not population:
        raise ValueError("La población no puede estar vacía.")

    if len(population) != len(costs):
        raise ValueError(
            "La cantidad de costos debe coincidir "
            "con la cantidad de individuos."
        )

    if any(not isinstance(ind, Individual) for ind in population):
        raise ValueError(
            "Todos los elementos deben ser individuos válidos."
        )

    if (
        isinstance(elite_count, bool)
        or not isinstance(elite_count, int)
        or elite_count < 1
    ):
        raise ValueError(
            "La cantidad de élites debe ser un entero positivo."
        )

    if elite_count > len(population):
        raise ValueError(
            "La cantidad de élites no puede superar "
            "el tamaño de la población."
        )

    for cost in costs:
        if (
            isinstance(cost, bool)
            or not isinstance(cost, (int, float))
            or not math.isfinite(cost)
            or cost < 0
        ):
            raise ValueError(
                "Los costos deben ser números finitos no negativos."
            )

    # Asociar cada individuo con su costo y ordenar
    # de menor a mayor costo.
    ranked_population = sorted(
        zip(population, costs),
        key=lambda item: item[1]
    )

    # Conservar los mejores individuos.
    elites = [
        individual
        for individual, _ in ranked_population[:elite_count]
    ]

    return elites
