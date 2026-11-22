from typing import Optional, List, Dict
from pydantic import BaseModel, Field


class RelationshipContextObservation(BaseModel):
    id: Optional[str] = None
    context: str = Field(..., description="e.g. 'politics', 'personal problems', 'work', 'casual conversations'")
    patternObservation: str = Field(..., description="e.g. 'Defensive during political disagreements', 'Supportive during difficult personal periods'")
    emotionalIntensity: Optional[str] = Field("medium", description="'low', 'medium', 'high'")
    eventCount: int = 1
    updatedAt: Optional[str] = None


class RelationshipBase(BaseModel):
    personId: str
    relationshipType: str
    startedAt: Optional[str] = None
    status: str = "active"
    notes: Optional[str] = None


class RelationshipCreate(RelationshipBase):
    pass


class RelationshipUpdate(BaseModel):
    relationshipType: Optional[str] = None
    status: Optional[str] = None
    notes: Optional[str] = None


class RelationshipResponse(RelationshipBase):
    id: str
    userId: str
    personName: Optional[str] = None
    contexts: List[RelationshipContextObservation] = []
    recentTrend: Optional[str] = None
    createdAt: str
    updatedAt: str
