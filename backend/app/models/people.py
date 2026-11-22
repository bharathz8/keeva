from typing import Optional, List
from pydantic import BaseModel, Field


class PersonBase(BaseModel):
    name: str = Field(..., min_length=1, max_length=100)
    relationshipType: str = Field(..., min_length=1, max_length=50)  # friend, partner, coworker, etc.
    duration: Optional[str] = Field("1 year", description="e.g. '8 years', '6 months'")
    status: Optional[str] = Field("active", description="'active', 'distant', 'paused', 'reconciled'")
    avatar: Optional[str] = None
    notes: Optional[str] = None
    alias: Optional[str] = Field(None, description="Pseudonymous proxy codename (e.g. 'China', 'Mango', 'Kakashi')")
    aliasCategory: Optional[str] = Field(None, description="'countries', 'fruits', 'animals', 'anime', or 'custom'")
    isEncrypted: Optional[bool] = Field(False, description="Whether real identity is locked under encryption")


class PersonCreate(PersonBase):
    pass


class PersonUpdate(BaseModel):
    name: Optional[str] = None
    relationshipType: Optional[str] = None
    duration: Optional[str] = None
    status: Optional[str] = None
    avatar: Optional[str] = None
    notes: Optional[str] = None
    alias: Optional[str] = None
    aliasCategory: Optional[str] = None
    isEncrypted: Optional[bool] = None


class PersonResponse(PersonBase):
    id: str
    userId: str
    lastInteraction: Optional[str] = None
    createdAt: str
    updatedAt: str
