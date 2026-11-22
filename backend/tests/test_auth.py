from fastapi.testclient import TestClient
from app.main import app

client = TestClient(app)


def test_missing_auth_header():
    response = client.get("/api/people")
    assert response.status_code == 401


def test_valid_dev_token():
    headers = {"Authorization": "Bearer demo-user-123"}
    response = client.get("/api/people", headers=headers)
    assert response.status_code == 200
    assert isinstance(response.json(), list)
