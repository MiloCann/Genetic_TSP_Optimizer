
import random

from backend.genetic_algorithm.individual import Individual


def swap_mutation(
    individual: Individual,
    rng: random.Random | None = None
) -> Individual:
    """
    Aplica mutación por intercambio (Swap Mutation).

    Intercambia dos ciudades aleatorias, sin modificar
    la posición de la ciudad de origen.

    Args:
        individual: Cromosoma que será mutado.
        rng: Generador aleatorio opcional.

    Returns:
        Un nuevo individuo con la mutación aplicada.
    """

    if not isinstance(individual, Individual):
        raise ValueError(
            "El elemento que se desea mutar debe ser un Individual."
        )

    city_count = len(individual.route)

    if city_count < 3:
        raise ValueError(
            "El individuo debe contener al menos tres ciudades."
        )

    start_city = individual.route[0]

    individual.validate(
        city_count=city_count,
        start_city=start_city
    )

    if rng is None:
        rng = random.Random()

    # Copiar el cromosoma para preservar el original.
    mutated_route = list(individual.route)

    # Seleccionar dos posiciones sin incluir el origen.
    position_a, position_b = rng.sample(
        range(1, city_count),
        2
    )

    # Intercambiar las ciudades.
    mutated_route[position_a], mutated_route[position_b] = (
        mutated_route[position_b],
        mutated_route[position_a]
    )

    mutated_individual = Individual(tuple(mutated_route))

    mutated_individual.validate(
        city_count=city_count,
        start_city=start_city
    )

    return mutated_individual
