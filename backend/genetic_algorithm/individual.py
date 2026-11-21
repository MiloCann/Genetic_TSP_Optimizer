
from dataclasses import dataclass


@dataclass(frozen=True)
class Individual:
    """
    Representa un cromosoma del algoritmo genético.

    La ruta contiene cada ciudad una sola vez.
    No incluye una repetición final del origen.
    """

    route: tuple[int, ...]

    def __post_init__(self):
        object.__setattr__(
            self,
            "route",
            tuple(self.route)
        )

    def validate(self, city_count: int, start_city: int) -> None:
        """Comprueba que el cromosoma sea una permutación válida."""

        if len(self.route) != city_count:
            raise ValueError(
                "El cromosoma debe contener todas las ciudades."
            )

        if any(
            isinstance(city, bool)
            or not isinstance(city, int)
            for city in self.route
        ):
            raise ValueError(
                "Los índices de ciudad deben ser enteros."
            )

        if len(set(self.route)) != city_count:
            raise ValueError(
                "El cromosoma contiene ciudades repetidas."
            )

        if set(self.route) != set(range(city_count)):
            raise ValueError(
                "El cromosoma contiene índices inválidos."
            )

        if self.route[0] != start_city:
            raise ValueError(
                "El cromosoma debe comenzar en la ciudad de origen."
            )

    def closed_route(self) -> tuple[int, ...]:
        """Retorna la ruta incluyendo el regreso al origen."""

        return self.route + (self.route[0],)
