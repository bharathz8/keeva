from typing import Optional, List, Dict, Any
from pydantic import BaseModel, Field
from app.models.decision import FutureBranch


class AgentMessageRequest(BaseModel):
    message: str = Field(..., min_length=1)
    personId: Optional[str] = None
    relationshipId: Optional[str] = None
    sessionId: Optional[str] = None
    clientInferenceAttempted: Optional[bool] = False
    preferredInference: Optional[str] = "hybrid"  # "on-device", "cloud", "hybrid"


class AgentReflectionAnswerRequest(BaseModel):
    decisionId: str
    reflectionText: str
    selectedBranchIndex: Optional[int] = None
    finalDecision: Optional[str] = None


class AgentMessageResponse(BaseModel):
    sessionId: str
    reply: str
    personId: Optional[str] = None
    personName: Optional[str] = None
    relationshipType: Optional[str] = None
    
    # Pause and reasoning signals
    isPauseTriggered: bool = False
    pauseReason: Optional[str] = None
    emotionalIntensity: Optional[float] = None
    consequenceSeverity: Optional[float] = None
    reversibility: Optional[str] = None
    
    # Grounding context
    relevantMemories: List[Dict[str, Any]] = Field(default_factory=list)
    relevantEvents: List[Dict[str, Any]] = Field(default_factory=list)
    timelineSummary: Optional[str] = None
    
    # Scenarios & Reflection
    futureBranches: List[FutureBranch] = Field(default_factory=list)
    reflectionQuestions: List[str] = Field(default_factory=list)
    
    # Link to registered decision
    decisionId: Optional[str] = None
    
    # Inference diagnostics
    inferenceSource: str = "cloud-gemini"  # "on-device", "cloud-gemini", "hybrid-orchestrated"
