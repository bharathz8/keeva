from fastapi.testclient import TestClient
from app.main import app

client = TestClient(app)


def test_people_crud_lifecycle():
    headers = {"Authorization": "Bearer demo-user-test-people"}
    
    # 1. Create Person
    create_payload = {
        "name": "Sarah",
        "relationshipType": "Mentor",
        "duration": "3 years",
        "status": "active",
        "notes": "Met at design leadership conference."
    }
    res_create = client.post("/api/people", json=create_payload, headers=headers)
    assert res_create.status_code == 201
    person_data = res_create.json()
    assert person_data["name"] == "Sarah"
    person_id = person_data["id"]

    # 2. Get Person
    res_get = client.get(f"/api/people/{person_id}", headers=headers)
    assert res_get.status_code == 200
    assert res_get.json()["id"] == person_id

    # 3. Update Person
    res_patch = client.patch(f"/api/people/{person_id}", json={"duration": "4 years"}, headers=headers)
    assert res_patch.status_code == 200
    assert res_patch.json()["duration"] == "4 years"

    # 4. List People
    res_list = client.get("/api/people", headers=headers)
    assert res_list.status_code == 200
    assert any(p["id"] == person_id for p in res_list.json())

    # 5. Delete Person
    res_del = client.delete(f"/api/people/{person_id}", headers=headers)
    assert res_del.status_code == 200

    # Verify not found
    res_verify = client.get(f"/api/people/{person_id}", headers=headers)
    assert res_verify.status_code == 404
