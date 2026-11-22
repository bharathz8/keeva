from fastapi.testclient import TestClient
from app.main import app

client = TestClient(app)


def test_natural_note_extraction_and_event_creation():
    headers = {"Authorization": "Bearer demo-user-test-events"}
    
    # 1. Create person
    p_res = client.post("/api/people", json={"name": "Rahul", "relationshipType": "Friend"}, headers=headers)
    assert p_res.status_code == 201
    person_id = p_res.json()["id"]

    # 2. Test Natural Note Extraction endpoint
    extract_req = {
        "naturalText": "Rahul ignored me today and when I asked him about it he got defensive.",
        "personId": person_id
    }
    ext_res = client.post("/api/events/extract", json=extract_req, headers=headers)
    assert ext_res.status_code == 200
    draft = ext_res.json()
    assert "confidence" in draft
    assert draft["confidence"] > 0.5
    assert draft["eventType"] in ["conflict", "communication_gap", "interaction"]

    # 3. Seed demo data
    demo_res = client.post("/api/demo/seed", headers=headers)
    assert demo_res.status_code == 200
