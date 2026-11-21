
import math
import random
from collections.abc import Sequence

from backend.genetic_algorithm.individual import Individual


def tournament_selection(
    population: Sequence[Individual],
    costs: Sequence[float],
    tournament_size: int = 3,
    rng: random.Random | None = None
) -> Individual:
    """
    Selecciona un individuo mediante selección por torneo.

    El individuo con menor costo gana el torneo.

    Args:
        population: Individuos disponibles.
        costs: Costo correspondiente a cada individuo.
        tournament_size: Cantidad de participantes por torneo.
        rng: Generador aleatorio opcional para reproducibilidad.

    Returns:
        El individuo ganador del torneo.
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
        isinstance(tournament_size, bool)
        or not isinstance(tournament_size, int)
        or tournament_size < 1
    ):
        raise ValueError(
            "El tamaño del torneo debe ser un entero positivo."
        )

    if tournament_size > len(population):
        raise ValueError(
            "El tamaño del torneo no puede superar "
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

    if rng is None:
        rng = random.Random()

    selected_indices = rng.sample(
        range(len(population)),
        tournament_size
    )

    winner_index = min(
        selected_indices,
        key=lambda index: costs[index]
    )

    return population[winner_index]
