from typing import Optional, List, Dict, Any
from pydantic import BaseModel, Field


class FutureBranch(BaseModel):
    action: str = Field(..., description="Action description")
    possibleConsequences: List[str] = Field(default_factory=list)
    assumptions: List[str] = Field(default_factory=list)
    reversibility: str = Field("medium", description="'high', 'medium', 'low'")
    uncertainty: str = Field("medium", description="'low', 'medium', 'high'")


class DecisionRecordCreate(BaseModel):
    personId: Optional[str] = None
    personName: Optional[str] = None
    relationshipId: Optional[str] = None
    situation: str
    proposedAction: Optional[str] = None
    emotionalState: Optional[str] = None
    emotionalIntensity: Optional[float] = 0.5
    consequenceSeverity: Optional[float] = 0.5
    reversibility: Optional[str] = "medium"
    relevantMemories: List[Dict[str, Any]] = Field(default_factory=list)
    futureBranches: List[FutureBranch] = Field(default_factory=list)
    reflectionQuestions: List[str] = Field(default_factory=list)
    userReflection: Optional[str] = None
    finalDecision: Optional[str] = None
    status: str = "paused"  # 'paused', 'reflected', 'decided', 'reconsidered'


class DecisionOutcomeUpdate(BaseModel):
    outcome: str = Field(..., min_length=2, description="What happened after this decision was carried out")
    reflectionOnOutcome: Optional[str] = None
    relationshipImpact: Optional[str] = None  # e.g. 'improved', 'strained', 'ended', 'neutral'


class DecisionResponse(BaseModel):
    id: str
    userId: str
    personId: Optional[str] = None
    personName: Optional[str] = None
    relationshipId: Optional[str] = None
    situation: str
    proposedAction: Optional[str] = None
    emotionalState: Optional[str] = None
    emotionalIntensity: Optional[float] = None
    consequenceSeverity: Optional[float] = None
    reversibility: Optional[str] = None
    relevantMemories: List[Dict[str, Any]] = Field(default_factory=list)
    futureBranches: List[FutureBranch] = Field(default_factory=list)
    reflectionQuestions: List[str] = Field(default_factory=list)
    userReflection: Optional[str] = None
    finalDecision: Optional[str] = None
    status: str
    outcome: Optional[str] = None
    relationshipImpact: Optional[str] = None
    createdAt: str
    updatedAt: str
