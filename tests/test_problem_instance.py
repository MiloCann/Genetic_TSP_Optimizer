
from backend.genetic_algorithm.individual import Individual


def test_valid_individual():
    individual = Individual((0, 2, 1, 3))

    individual.validate(
        city_count=4,
        start_city=0
    )


def test_closed_route():
    individual = Individual((0, 2, 1, 3))

    assert individual.closed_route() == (0, 2, 1, 3, 0)


def test_duplicate_cities():
    individual = Individual((0, 1, 1, 3))

    try:
        individual.validate(4, 0)
        assert False, "Se esperaba ValueError."
    except ValueError:
        pass


def test_invalid_start_city():
    individual = Individual((1, 2, 0, 3))

    try:
        individual.validate(4, 0)
        assert False, "Se esperaba ValueError."
    except ValueError:
        pass
