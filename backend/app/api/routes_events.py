import logging
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, status
from app.api.deps import get_current_user
from app.core.database import (
    DatabaseService,
    EVENTS_COLLECTION,
    RELATIONSHIPS_COLLECTION,
    PEOPLE_COLLECTION,
)
from app.models.event import (
    EventCreate,
    EventResponse,
    NaturalNoteExtractionRequest,
    ExtractedEventDraft,
)
from app.services.ai_service import ai_service
from app.memory.mem0_service import mem0_service

logger = logging.getLogger(__name__)
router = APIRouter(tags=["events"])
db = DatabaseService()


@router.post("/events/extract", response_model=ExtractedEventDraft)
async def extract_natural_note(payload: NaturalNoteExtractionRequest, user: dict = Depends(get_current_user)):
    """
    Extracts structured relationship observation from free-form natural notes.
    The user can review and edit this before confirming.
    """
    user_id = user["uid"]
    person_name = "the person"
    relationship_type = "Friend"
    
    if payload.personId:
        person = await db.get_doc(PEOPLE_COLLECTION, payload.personId, user_id=user_id)
        if person:
            person_name = person.get("name", person_name)
            relationship_type = person.get("relationshipType", relationship_type)

    draft = await ai_service.extract_event_from_note(
        note_text=payload.naturalText,
        person_name=person_name,
        relationship_type=relationship_type
    )
    return draft


@router.get("/relationships/{relationship_id}/events", response_model=List[EventResponse])
async def list_relationship_events(relationship_id: str, user: dict = Depends(get_current_user)):
    user_id = user["uid"]
    events = await db.query_docs(
        EVENTS_COLLECTION,
        user_id=user_id,
        filters={"relationshipId": relationship_id},
        order_by="timestamp",
        descending=False
    )
    if not events:
        events = await db.query_docs(
            EVENTS_COLLECTION,
            user_id=user_id,
            filters={"personId": relationship_id},
            order_by="timestamp",
            descending=False
        )
    return events


@router.post("/relationships/{relationship_id}/events", response_model=EventResponse, status_code=status.HTTP_201_CREATED)
async def create_event(
    relationship_id: str,
    payload: EventCreate,
    user: dict = Depends(get_current_user)
):
    """
    Stores structured event in Firestore, updates person's lastInteraction,
    and commits semantic summary to Mem0.
    """
    user_id = user["uid"]
    rel = await db.get_doc(RELATIONSHIPS_COLLECTION, relationship_id, user_id=user_id)
    if not rel:
        # Check if the parameter passed was a personId
        matches = await db.query_docs(RELATIONSHIPS_COLLECTION, user_id=user_id, filters={"personId": relationship_id})
        if matches:
            rel = matches[0]
            relationship_id = rel["id"]
        else:
            # Check if this is a person; auto-initialize relationship
            person = await db.get_doc(PEOPLE_COLLECTION, relationship_id, user_id=user_id)
            if person:
                auto_rel = {
                    "personId": person["id"],
                    "relationshipType": person.get("relationshipType", "Friend"),
                    "status": "active",
                    "notes": person.get("notes", "")
                }
                rel = await db.create_doc(RELATIONSHIPS_COLLECTION, auto_rel, user_id=user_id)
                relationship_id = rel["id"]
            else:
                raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Relationship not found")

    person_id = rel.get("personId")
    person = await db.get_doc(PEOPLE_COLLECTION, person_id, user_id=user_id) if person_id else None
    person_name = person.get("name") if person else "Friend"

    data = payload.model_dump()
    data["relationshipId"] = relationship_id
    data["personId"] = person_id
    data["personName"] = person_name

    created = await db.create_doc(EVENTS_COLLECTION, data, user_id=user_id)

    # Update person's lastInteraction
    if person_id:
        await db.update_doc(PEOPLE_COLLECTION, person_id, {"lastInteraction": "Just now"}, user_id=user_id)

    # Commit observation to Mem0 semantic long-term memory
    semantic_summary = (
        f"{person_name} ({payload.context}): {payload.description}"
    )
    if payload.observedBehavior:
        semantic_summary += f" Observed: {payload.observedBehavior}."
    if payload.outcome:
        semantic_summary += f" Result: {payload.outcome}."

    await mem0_service.add_memory(
        text=semantic_summary,
        user_id=user_id,
        person_id=person_id,
        person_name=person_name,
        context=payload.context,
        event_id=created["id"]
    )

    return created


@router.delete("/events/{event_id}")
async def delete_event(event_id: str, user: dict = Depends(get_current_user)):
    user_id = user["uid"]
    deleted = await db.delete_doc(EVENTS_COLLECTION, event_id, user_id=user_id)
    if not deleted:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Event not found")
    return {"status": "success", "message": "Event deleted"}
