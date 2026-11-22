from fastapi.testclient import TestClient
from app.main import app

client = TestClient(app)


def test_full_consequence_and_pause_agent_flow():
    headers = {"Authorization": "Bearer demo-user-agent-flow"}

    # 1. Seed demo data (Rahul, 8 years, timeline)
    seed_res = client.post("/api/demo/seed", headers=headers)
    assert seed_res.status_code == 200

    # 2. Test standard low-consequence relationship question
    standard_msg = {
        "message": "What patterns have we recorded regarding Rahul?",
        "preferredInference": "cloud"
    }
    std_res = client.post("/api/agent/message", json=standard_msg, headers=headers)
    assert std_res.status_code == 200
    std_data = std_res.json()
    assert std_data["isPauseTriggered"] is False
    assert "Rahul" in std_data["reply"] or "recorded" in std_data["reply"]

    # 3. Test consequential high-intensity decision trigger
    consequential_msg = {
        "message": "Rahul ignored me again. I'm done with this friendship.",
        "preferredInference": "hybrid"
    }
    cq_res = client.post("/api/agent/message", json=consequential_msg, headers=headers)
    assert cq_res.status_code == 200
    cq_data = cq_res.json()
    assert cq_data["isPauseTriggered"] is True
    assert cq_data["reversibility"] in ["low", "medium"]
    assert len(cq_data["futureBranches"]) >= 2
    assert len(cq_data["reflectionQuestions"]) >= 1
    assert cq_data["decisionId"] is not None

    decision_id = cq_data["decisionId"]

    # 4. User reflects and makes final decision (Human-in-the-loop)
    reflection_payload = {
        "decisionId": decision_id,
        "reflectionText": "I realize cutting off an 8-year friendship right now is impulsive. I will take 2 days of space before discussing it.",
        "finalDecision": "Take 2 days of deliberate space without sending angry messages"
    }
    ref_res = client.post("/api/agent/reflect", json=reflection_payload, headers=headers)
    assert ref_res.status_code == 200
    assert ref_res.json()["decision"]["status"] == "decided"

    # 5. Later outcome recording
    outcome_payload = {
        "outcome": "After 2 days, we had an honest phone call. He had been dealing with family emergencies. We cleared the air.",
        "relationshipImpact": "improved"
    }
    out_res = client.post(f"/api/decisions/{decision_id}/outcome", json=outcome_payload, headers=headers)
    assert out_res.status_code == 200
    assert out_res.json()["status"] == "outcome_recorded"
    assert out_res.json()["relationshipImpact"] == "improved"


if __name__ == "__main__":
    test_full_consequence_and_pause_agent_flow()
    print("ALL TEST CHECKS PASSED PERFECTLY!")

