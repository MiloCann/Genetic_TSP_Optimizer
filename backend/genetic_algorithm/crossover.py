
import random

from backend.genetic_algorithm.individual import Individual


def _order_crossover_child(
    primary_parent: Individual,
    secondary_parent: Individual,
    cut_start: int,
    cut_end: int
) -> Individual:
    """
    Construye un hijo mediante Order Crossover (OX).

    Conserva la ciudad de origen en la primera posición.
    """

    primary = primary_parent.route[1:]
    secondary = secondary_parent.route[1:]

    size = len(primary)

    # La lista puede contener enteros o posiciones vacías.
    child: list[int | None] = [None] * size

    # Copiar el segmento seleccionado del padre principal.
    child[cut_start:cut_end + 1] = primary[cut_start:cut_end + 1]

    copied_cities = set(primary[cut_start:cut_end + 1])

    # Recorrer el segundo padre de forma circular.
    ordered_secondary = (
        secondary[cut_end + 1:]
        + secondary[:cut_end + 1]
    )

    remaining = [
        city for city in ordered_secondary
        if city not in copied_cities
    ]

    # Completar las posiciones disponibles en orden circular.
    positions = (
        list(range(cut_end + 1, size))
        + list(range(0, cut_start))
    )

    for position, city in zip(positions, remaining):
        child[position] = city

    # Comprobar que todas las posiciones fueron completadas.
    if any(city is None for city in child):
        raise RuntimeError(
            "El operador OX no pudo completar el cromosoma."
        )

    # Después de la comprobación, construir una tupla de enteros.
    complete_child = tuple(
        city for city in child if city is not None
    )

    offspring = Individual(
        (primary_parent.route[0], *complete_child)
    )

    offspring.validate(
        city_count=len(primary_parent.route),
        start_city=primary_parent.route[0]
    )

    return offspring


def order_crossover(
    parent_a: Individual,
    parent_b: Individual,
    rng: random.Random | None = None
) -> tuple[Individual, Individual]:
    """
    Aplica Order Crossover (OX) y genera dos hijos.
    """

    if not isinstance(parent_a, Individual):
        raise ValueError(
            "El primer padre debe ser un Individual."
        )

    if not isinstance(parent_b, Individual):
        raise ValueError(
            "El segundo padre debe ser un Individual."
        )

    if len(parent_a.route) < 3 or len(parent_b.route) < 3:
        raise ValueError(
            "Los padres deben contener al menos tres ciudades."
        )

    if len(parent_a.route) != len(parent_b.route):
        raise ValueError(
            "Los padres deben tener la misma cantidad de ciudades."
        )

    if parent_a.route[0] != parent_b.route[0]:
        raise ValueError(
            "Los padres deben tener la misma ciudad de origen."
        )

    start_city = parent_a.route[0]
    city_count = len(parent_a.route)

    parent_a.validate(city_count, start_city)
    parent_b.validate(city_count, start_city)

    if rng is None:
        rng = random.Random()

    remaining_size = city_count - 1

    cut_start, cut_end = sorted(
        rng.sample(range(remaining_size), 2)
    )

    child_a = _order_crossover_child(
        parent_a,
        parent_b,
        cut_start,
        cut_end
    )

    child_b = _order_crossover_child(
        parent_b,
        parent_a,
        cut_start,
        cut_end
    )

    return child_a, child_b
