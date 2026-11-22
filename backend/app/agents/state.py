from typing import Any, Dict, List, Optional
from typing_extensions import TypedDict


class RelationshipAgentState(TypedDict, total=False):
    user_id: str
    session_id: str
    message: str
    
    person_id: Optional[str]
    person_name: Optional[str]
    relationship_id: Optional[str]
    relationship_type: Optional[str]
    duration: Optional[str]
    status: Optional[str]

    context: Optional[str]
    emotion: Optional[str]
    emotional_intensity: Optional[float]

    decision_detected: bool
    proposed_action: Optional[str]
    consequence_severity: Optional[float]
    reversibility: Optional[str]  # "high", "medium", "low"
    is_pause_warranted: bool
    pause_reason: Optional[str]

    relevant_memories: List[Dict[str, Any]]
    relevant_events: List[Dict[str, Any]]
    context_observations: List[Dict[str, Any]]
    timeline_summary: Optional[str]
    history_context_text: Optional[str]

    future_branches: List[Dict[str, Any]]
    reflection_questions: List[str]
    user_answers: List[str]

    response_text: Optional[str]
    decision_id: Optional[str]
    final_decision: Optional[str]
    outcome: Optional[str]
    inference_source: str
