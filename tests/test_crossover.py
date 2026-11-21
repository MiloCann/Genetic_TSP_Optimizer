
import random
import pytest
from typing import cast

from backend.genetic_algorithm.individual import Individual
from backend.genetic_algorithm.crossover import order_crossover


@pytest.fixture
def parents():
    parent_a = Individual((0, 1, 2, 3, 4, 5))
    parent_b = Individual((0, 4, 5, 1, 3, 2))

    return parent_a, parent_b


def test_crossover_returns_two_children(parents):
    parent_a, parent_b = parents

    child_a, child_b = order_crossover(
        parent_a,
        parent_b,
        rng=random.Random(42)
    )

    assert isinstance(child_a, Individual)
    assert isinstance(child_b, Individual)


def test_children_contain_every_city_once(parents):
    parent_a, parent_b = parents

    children = order_crossover(
        parent_a,
        parent_b,
        rng=random.Random(42)
    )

    expected_cities = set(range(6))

    for child in children:
        assert len(child.route) == 6
        assert set(child.route) == expected_cities
        assert len(set(child.route)) == 6


def test_children_preserve_fixed_start(parents):
    parent_a, parent_b = parents

    children = order_crossover(
        parent_a,
        parent_b,
        rng=random.Random(42)
    )

    for child in children:
        assert child.route[0] == 0


def test_children_are_valid_individuals(parents):
    parent_a, parent_b = parents

    children = order_crossover(
        parent_a,
        parent_b,
        rng=random.Random(42)
    )

    for child in children:
        child.validate(city_count=6, start_city=0)


def test_crossover_is_reproducible(parents):
    parent_a, parent_b = parents

    children_a = order_crossover(
        parent_a,
        parent_b,
        rng=random.Random(123)
    )

    children_b = order_crossover(
        parent_a,
        parent_b,
        rng=random.Random(123)
    )

    assert children_a == children_b


def test_crossover_does_not_modify_parents(parents):
    parent_a, parent_b = parents

    original_a = parent_a.route
    original_b = parent_b.route

    order_crossover(
        parent_a,
        parent_b,
        rng=random.Random(42)
    )

    assert parent_a.route == original_a
    assert parent_b.route == original_b


def test_crossover_rejects_different_route_lengths():
    parent_a = Individual((0, 1, 2, 3))
    parent_b = Individual((0, 1, 2, 3, 4))

    with pytest.raises(ValueError):
        order_crossover(parent_a, parent_b)


def test_crossover_rejects_different_start_cities():
    parent_a = Individual((0, 1, 2, 3))
    parent_b = Individual((1, 0, 2, 3))

    with pytest.raises(ValueError):
        order_crossover(parent_a, parent_b)


def test_crossover_rejects_invalid_parent():
    parent_a = Individual((0, 1, 1, 3))
    parent_b = Individual((0, 1, 2, 3))

    with pytest.raises(ValueError):
        order_crossover(parent_a, parent_b)


def test_crossover_rejects_non_individual_parent():
    parent_b = Individual((0, 1, 2, 3))

    invalid_parent = cast(
        Individual,
        (0, 1, 2, 3)
    )

    with pytest.raises(ValueError):
        order_crossover(invalid_parent, parent_b)


def test_crossover_rejects_too_few_cities():
    parent_a = Individual((0, 1))
    parent_b = Individual((0, 1))

    with pytest.raises(ValueError):
        order_crossover(parent_a, parent_b)
