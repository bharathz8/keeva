import logging
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, status
from app.api.deps import get_current_user
from app.core.database import (
    DatabaseService,
    RELATIONSHIPS_COLLECTION,
    PEOPLE_COLLECTION,
    CONTEXTS_COLLECTION,
)
from app.models.relationship import (
    RelationshipCreate,
    RelationshipUpdate,
    RelationshipResponse,
    RelationshipContextObservation,
)

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/relationships", tags=["relationships"])
db = DatabaseService()


@router.post("", response_model=RelationshipResponse, status_code=status.HTTP_201_CREATED)
async def create_relationship(payload: RelationshipCreate, user: dict = Depends(get_current_user)):
    user_id = user["uid"]
    person = await db.get_doc(PEOPLE_COLLECTION, payload.personId, user_id=user_id)
    if not person:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Associated person not found")
        
    created = await db.create_doc(RELATIONSHIPS_COLLECTION, payload.model_dump(), user_id=user_id)
    created["personName"] = person.get("name")
    created["contexts"] = []
    return created


@router.get("/person/{person_id}", response_model=RelationshipResponse)
async def get_relationship_by_person(person_id: str, user: dict = Depends(get_current_user)):
    """Retrieves relationship associated with a person, creating one if not yet initialized."""
    return await get_relationship(person_id, user)


@router.get("/{relationship_id}", response_model=RelationshipResponse)
async def get_relationship(relationship_id: str, user: dict = Depends(get_current_user)):
    user_id = user["uid"]
    doc = await db.get_doc(RELATIONSHIPS_COLLECTION, relationship_id, user_id=user_id)
    if not doc:
        # Fallback 1: Query by personId
        matching = await db.query_docs(
            RELATIONSHIPS_COLLECTION,
            user_id=user_id,
            filters={"personId": relationship_id}
        )
        if matching:
            doc = matching[0]
        else:
            # Fallback 2: Check if this is a registered person; auto-initialize relationship record
            person = await db.get_doc(PEOPLE_COLLECTION, relationship_id, user_id=user_id)
            if person:
                auto_rel = {
                    "personId": person["id"],
                    "relationshipType": person.get("relationshipType", "Friend"),
                    "status": "active",
                    "notes": person.get("notes", "")
                }
                doc = await db.create_doc(RELATIONSHIPS_COLLECTION, auto_rel, user_id=user_id)
            else:
                raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Relationship not found")
        
    actual_rel_id = doc["id"]
    person = await db.get_doc(PEOPLE_COLLECTION, doc["personId"], user_id=user_id)
    doc["personName"] = person.get("name") if person else "Unknown"
    
    contexts = await db.query_docs(
        CONTEXTS_COLLECTION,
        user_id=user_id,
        filters={"relationshipId": actual_rel_id}
    )
    if not contexts:
        contexts = await db.query_docs(
            CONTEXTS_COLLECTION,
            user_id=user_id,
            filters={"personId": doc["personId"]}
        )
    doc["contexts"] = contexts
    return doc


@router.patch("/{relationship_id}", response_model=RelationshipResponse)
async def update_relationship(relationship_id: str, payload: RelationshipUpdate, user: dict = Depends(get_current_user)):
    user_id = user["uid"]
    update_data = {k: v for k, v in payload.model_dump().items() if v is not None}
    updated = await db.update_doc(RELATIONSHIPS_COLLECTION, relationship_id, update_data, user_id=user_id)
    if not updated:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Relationship not found")
    return updated


@router.get("/{relationship_id}/contexts", response_model=List[RelationshipContextObservation])
async def list_contexts(relationship_id: str, user: dict = Depends(get_current_user)):
    user_id = user["uid"]
    contexts = await db.query_docs(
        CONTEXTS_COLLECTION,
        user_id=user_id,
        filters={"relationshipId": relationship_id}
    )
    if not contexts:
        contexts = await db.query_docs(
            CONTEXTS_COLLECTION,
            user_id=user_id,
            filters={"personId": relationship_id}
        )
    return contexts


@router.post("/{relationship_id}/contexts", response_model=RelationshipContextObservation)
async def add_context(
    relationship_id: str,
    payload: RelationshipContextObservation,
    user: dict = Depends(get_current_user)
):
    user_id = user["uid"]
    data = payload.model_dump()
    data["relationshipId"] = relationship_id
    created = await db.create_doc(CONTEXTS_COLLECTION, data, user_id=user_id)
    return created
