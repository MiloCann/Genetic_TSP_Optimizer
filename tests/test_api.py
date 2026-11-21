
import pytest

from backend.app import create_app


@pytest.fixture
def client():
    app = create_app()

    app.config["TESTING"] = True

    with app.test_client() as client:
        yield client


@pytest.fixture
def valid_problem():
    return {
        "cities": ["A", "B", "C", "D"],
        "matrix": [
            [0, 10, 15, 20],
            [10, 0, 35, 25],
            [15, 35, 0, 30],
            [20, 25, 30, 0]
        ],
        "symmetric": True,
        "start_city": 0
    }


def test_health_endpoint(client):
    response = client.get("/api/health")

    assert response.status_code == 200
    assert response.json["status"] == "ok"


def test_validate_endpoint_accepts_valid_problem(
    client, valid_problem
):
    response = client.post(
        "/api/validate",
        json=valid_problem
    )

    assert response.status_code == 200
    assert response.json["valid"] is True
    assert response.json["city_count"] == 4


def test_validate_endpoint_rejects_invalid_problem(client):
    invalid_problem = {
        "cities": ["A", "B", "C"],
        "matrix": [
            [0, -10, 20],
            [-10, 0, 15],
            [20, 15, 0]
        ]
    }

    response = client.post(
        "/api/validate",
        json=invalid_problem
    )

    assert response.status_code == 400
    assert response.json["valid"] is False


def test_validate_endpoint_rejects_missing_fields(client):
    response = client.post(
        "/api/validate",
        json={"cities": ["A", "B", "C"]}
    )

    assert response.status_code == 400


def test_optimize_endpoint_returns_solution(
    client, valid_problem
):
    valid_problem["config"] = {
        "population_size": 15,
        "generations": 10,
        "seed": 42
    }

    response = client.post(
        "/api/optimize",
        json=valid_problem
    )

    assert response.status_code == 200

    result = response.json

    assert result["feasible"] is True
    assert len(result["route"]) == 5
    assert result["route"][0] == 0
    assert result["route"][-1] == 0
    assert result["total_cost"] >= 0
    assert len(result["history"]) == 11


def test_optimize_endpoint_rejects_invalid_config(
    client, valid_problem
):
    valid_problem["config"] = {
        "population_size": 0
    }

    response = client.post(
        "/api/optimize",
        json=valid_problem
    )

    assert response.status_code == 400


def test_unknown_endpoint_returns_json_error(client):
    response = client.get("/api/unknown")

    assert response.status_code == 404
    assert "error" in response.json
