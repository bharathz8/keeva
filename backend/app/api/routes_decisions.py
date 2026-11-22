import logging
from typing import List
from fastapi import APIRouter, Depends, HTTPException, status
from app.api.deps import get_current_user
from app.core.database import DatabaseService, DECISIONS_COLLECTION
from app.models.decision import (
    DecisionRecordCreate,
    DecisionResponse,
    DecisionOutcomeUpdate,
)
from app.memory.mem0_service import mem0_service

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/decisions", tags=["decisions"])
db = DatabaseService()


@router.get("", response_model=List[DecisionResponse])
async def list_decisions(user: dict = Depends(get_current_user)):
    user_id = user["uid"]
    docs = await db.query_docs(DECISIONS_COLLECTION, user_id=user_id, order_by="createdAt", descending=True)
    return docs


@router.get("/{decision_id}", response_model=DecisionResponse)
async def get_decision(decision_id: str, user: dict = Depends(get_current_user)):
    user_id = user["uid"]
    doc = await db.get_doc(DECISIONS_COLLECTION, decision_id, user_id=user_id)
    if not doc:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Decision record not found")
    return doc


@router.post("", response_model=DecisionResponse, status_code=status.HTTP_201_CREATED)
async def create_decision(payload: DecisionRecordCreate, user: dict = Depends(get_current_user)):
    user_id = user["uid"]
    created = await db.create_doc(DECISIONS_COLLECTION, payload.model_dump(), user_id=user_id)
    return created


@router.post("/{decision_id}/reflect", response_model=DecisionResponse)
async def submit_reflection(
    decision_id: str,
    reflection_text: str,
    final_decision: str,
    user: dict = Depends(get_current_user)
):
    user_id = user["uid"]
    update_data = {
        "userReflection": reflection_text,
        "finalDecision": final_decision,
        "status": "decided"
    }
    updated = await db.update_doc(DECISIONS_COLLECTION, decision_id, update_data, user_id=user_id)
    if not updated:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Decision record not found")
    return updated


@router.post("/{decision_id}/outcome", response_model=DecisionResponse)
async def record_decision_outcome(
    decision_id: str,
    payload: DecisionOutcomeUpdate,
    user: dict = Depends(get_current_user)
):
    """
    Stores the later outcome of the decision.
    Feeds this outcome back into Mem0 semantic relationship memory so that future
    reasoning improves with longitudinal real-world outcomes!
    """
    user_id = user["uid"]
    existing = await db.get_doc(DECISIONS_COLLECTION, decision_id, user_id=user_id)
    if not existing:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Decision record not found")

    update_data = {
        "outcome": payload.outcome,
        "relationshipImpact": payload.relationshipImpact or "recorded",
        "status": "outcome_recorded"
    }
    updated = await db.update_doc(DECISIONS_COLLECTION, decision_id, update_data, user_id=user_id)

    # Feed back into Mem0 long-term memory
    person_name = existing.get("personName", "Relationship")
    decision_taken = existing.get("finalDecision") or existing.get("proposedAction", "decision")
    memory_summary = (
        f"Decision outcome for {person_name}: Chose '{decision_taken}'. "
        f"Result: {payload.outcome}."
    )
    if payload.relationshipImpact:
        memory_summary += f" Impact on relationship: {payload.relationshipImpact}."

    await mem0_service.add_memory(
        text=memory_summary,
        user_id=user_id,
        person_id=existing.get("personId"),
        person_name=existing.get("personName"),
        context="decision_outcome",
        metadata={"decision_id": decision_id}
    )

    return updated
