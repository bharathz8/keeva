import logging
from typing import List
from fastapi import APIRouter, Depends, HTTPException, status
from app.api.deps import get_current_user
from app.core.database import (
    DatabaseService,
    PEOPLE_COLLECTION,
    RELATIONSHIPS_COLLECTION,
    EVENTS_COLLECTION,
)
from app.models.people import PersonCreate, PersonUpdate, PersonResponse

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/people", tags=["people"])
db = DatabaseService()


@router.get("", response_model=List[PersonResponse])
async def list_people(user: dict = Depends(get_current_user)):
    user_id = user["uid"]
    docs = await db.query_docs(PEOPLE_COLLECTION, user_id=user_id, order_by="updatedAt", descending=True)
    return docs


@router.post("", response_model=PersonResponse, status_code=status.HTTP_201_CREATED)
async def create_person(payload: PersonCreate, user: dict = Depends(get_current_user)):
    user_id = user["uid"]
    data = payload.model_dump()
    if not data.get("avatar") and data.get("name"):
        data["avatar"] = data["name"][0].upper()
    data["lastInteraction"] = "Recently added"
    
    # Auto-assign proxy alias if user didn't pick one manually
    if not data.get("alias"):
        from app.services.privacy_service import privacy_service
        chosen_cat = data.get("aliasCategory") or "countries"
        data["alias"] = await privacy_service.suggest_alias(user_id=user_id, category=chosen_cat)
        data["aliasCategory"] = chosen_cat
        data["isEncrypted"] = True

    created = await db.create_doc(PEOPLE_COLLECTION, data, user_id=user_id)
    
    # Also auto-create a paired relationship document
    rel_data = {
        "personId": created["id"],
        "relationshipType": created["relationshipType"],
        "status": created.get("status", "active"),
        "notes": f"Relationship with {created['name']}"
    }
    await db.create_doc(RELATIONSHIPS_COLLECTION, rel_data, user_id=user_id)
    return created


@router.get("/{person_id}", response_model=PersonResponse)
async def get_person(person_id: str, user: dict = Depends(get_current_user)):
    user_id = user["uid"]
    doc = await db.get_doc(PEOPLE_COLLECTION, person_id, user_id=user_id)
    if not doc:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Person not found")
    return doc


@router.patch("/{person_id}", response_model=PersonResponse)
async def update_person(person_id: str, payload: PersonUpdate, user: dict = Depends(get_current_user)):
    user_id = user["uid"]
    update_data = {k: v for k, v in payload.model_dump().items() if v is not None}
    updated = await db.update_doc(PEOPLE_COLLECTION, person_id, update_data, user_id=user_id)
    if not updated:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Person not found")
    return updated


@router.delete("/{person_id}")
async def delete_person(person_id: str, user: dict = Depends(get_current_user)):
    user_id = user["uid"]
    deleted = await db.delete_doc(PEOPLE_COLLECTION, person_id, user_id=user_id)
    if not deleted:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Person not found")
    
    # Cascade delete related relationships and events
    rels = await db.query_docs(RELATIONSHIPS_COLLECTION, user_id=user_id, filters={"personId": person_id})
    for r in rels:
        await db.delete_doc(RELATIONSHIPS_COLLECTION, r["id"], user_id=user_id)
        
    events = await db.query_docs(EVENTS_COLLECTION, user_id=user_id, filters={"personId": person_id})
    for ev in events:
        await db.delete_doc(EVENTS_COLLECTION, ev["id"], user_id=user_id)

    return {"status": "success", "message": "Person and associated records deleted"}
