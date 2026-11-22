from typing import Optional, List
from pydantic import BaseModel, Field


class EventBase(BaseModel):
    relationshipId: Optional[str] = None
    personId: Optional[str] = None
    personName: Optional[str] = None
    timestamp: Optional[str] = None
    context: str = Field("general", description="e.g. politics, personal problems, work, communication")
    eventType: str = Field("interaction", description="conflict, support, reconciliation, milestone, communication_gap, etc.")
    description: str = Field(..., min_length=1)
    userEmotion: Optional[str] = None
    observedBehavior: Optional[str] = None
    outcome: Optional[str] = None
    source: str = "user_note"
    confidence: float = 0.85


class EventCreate(EventBase):
    pass


class EventResponse(EventBase):
    id: str
    userId: str
    relationshipId: str
    createdAt: str
    updatedAt: str


class NaturalNoteExtractionRequest(BaseModel):
    naturalText: str = Field(..., min_length=3, description="Natural description of what happened")
    personId: Optional[str] = None
    relationshipId: Optional[str] = None


class ExtractedEventDraft(BaseModel):
    personName: Optional[str] = None
    relationshipType: Optional[str] = None
    context: str = "general"
    eventType: str = "interaction"
    description: str
    userEmotion: Optional[str] = None
    observedBehavior: Optional[str] = None
    outcome: Optional[str] = None
    confidence: float = 0.85
    suggestedTimelineDate: Optional[str] = None
    explanation: Optional[str] = None
