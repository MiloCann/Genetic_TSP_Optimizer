
from dataclasses import dataclass


@dataclass(frozen=True)
class ProblemInstance:
    """
    Representa una instancia del problema del vendedor viajero (TSP).

    Attributes:
        cities: Nombres de las ciudades.
        cost_matrix: Matriz de costos. None representa
                      una conexión inexistente.
        symmetric: Indica si la matriz debe ser simétrica.
        start_city: Índice de la ciudad de origen.
    """

    cities: tuple[str, ...]
    cost_matrix: tuple[tuple[float | None, ...], ...]
    symmetric: bool = True
    start_city: int = 0

    def __post_init__(self):
        # Normalizar las estructuras para evitar modificaciones externas.
        object.__setattr__(
            self,
            "cities",
            tuple(self.cities)
        )

        object.__setattr__(
            self,
            "cost_matrix",
            tuple(tuple(row) for row in self.cost_matrix)
        )

    @property
    def city_count(self) -> int:
        """Retorna el número total de ciudades."""
        return len(self.cities)

    def get_cost(self, origin: int, destination: int) -> float | None:
        """Obtiene el costo entre dos ciudades."""
        return self.cost_matrix[origin][destination]
