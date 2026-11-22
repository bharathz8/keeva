import logging
import uuid
from typing import Any, Dict
from app.agents.state import RelationshipAgentState
from app.core.database import DatabaseService, DECISIONS_COLLECTION
from app.memory.hybrid_retriever import hybrid_retriever
from app.services.ai_service import ai_service

logger = logging.getLogger(__name__)
db = DatabaseService()


async def analyze_and_retrieve_node(state: RelationshipAgentState) -> Dict[str, Any]:
    """Node 1: Resolves person, fetches structured & semantic history, detects consequence."""
    user_id = state.get("user_id", "")
    message = state.get("message", "")
    person_id = state.get("person_id")
    relationship_id = state.get("relationship_id")

    # 1. Retrieve hybrid history
    history = await hybrid_retriever.retrieve_relationship_history(
        user_id=user_id,
        message=message,
        person_id=person_id,
        relationship_id=relationship_id
    )

    resolved_person_id = history.get("person_id")
    resolved_rel_id = history.get("relationship_id")
    person_name = history.get("person_name", "Friend")
    relationship_type = history.get("relationship_type", "Friend")
    duration = history.get("duration", "several years")

    # 2. Consequence & Reversibility Assessment
    eval_res = await ai_service.detect_consequence(
        message=message,
        person_name=person_name,
        relationship_type=relationship_type,
        duration=duration
    )

    is_pause = eval_res.get("isPauseWarranted", False)

    return {
        "person_id": resolved_person_id,
        "relationship_id": resolved_rel_id,
        "person_name": person_name,
        "relationship_type": relationship_type,
        "duration": duration,
        "status": history.get("status", "active"),
        "decision_detected": eval_res.get("decisionDetected", False),
        "proposed_action": eval_res.get("proposedAction"),
        "emotional_intensity": eval_res.get("emotionalIntensity"),
        "consequence_severity": eval_res.get("consequenceSeverity"),
        "reversibility": eval_res.get("reversibility"),
        "is_pause_warranted": is_pause,
        "pause_reason": eval_res.get("rationale"),
        "relevant_memories": history.get("memories", []),
        "relevant_events": history.get("timeline_events", []),
        "context_observations": history.get("contexts", []),
        "timeline_summary": history.get("timeline_formatted", ""),
        "history_context_text": history.get("history_summary_text", "")
    }


def should_trigger_pause(state: RelationshipAgentState) -> str:
    """Conditional Edge: Determines whether to trigger Pause & Scenarios or Standard Q&A."""
    if state.get("is_pause_warranted", False):
        return "pause_scenarios"
    return "standard_qa"


async def generate_pause_scenarios_node(state: RelationshipAgentState) -> Dict[str, Any]:
    """Node 2A: Constructs Pause, Generates Scenarios, Asks Reflection, and Registers Decision."""
    user_id = state.get("user_id", "")
    message = state.get("message", "")
    person_name = state.get("person_name", "Friend")
    relationship_type = state.get("relationship_type", "Friend")
    duration = state.get("duration", "several years")
    history_context = state.get("history_context_text", "")
    proposed_action = state.get("proposed_action", "take significant action")

    # 1. Generate plausible branches
    branches = await ai_service.generate_future_branches(
        person_name=person_name,
        relationship_type=relationship_type,
        duration=duration,
        current_situation=message,
        history_context=history_context
    )

    # 2. Formulate 1-2 reflection questions
    questions = await ai_service.generate_reflection_questions(
        person_name=person_name,
        relationship_type=relationship_type,
        user_message=message,
        proposed_action=proposed_action,
        history_context=history_context
    )

    # 3. Register Decision in Firestore
    decision_id = f"dec_{uuid.uuid4().hex[:12]}"
    decision_data = {
        "personId": state.get("person_id"),
        "personName": person_name,
        "relationshipId": state.get("relationship_id"),
        "situation": message,
        "proposedAction": proposed_action,
        "emotionalState": "activated",
        "emotionalIntensity": state.get("emotional_intensity", 0.8),
        "consequenceSeverity": state.get("consequence_severity", 0.75),
        "reversibility": state.get("reversibility", "low"),
        "relevantMemories": [
            {"id": m.get("id"), "memory": m.get("memory")} for m in state.get("relevant_memories", [])
        ],
        "futureBranches": [b.model_dump() for b in branches],
        "reflectionQuestions": questions,
        "userReflection": None,
        "finalDecision": None,
        "status": "paused",
        "outcome": None
    }
    
    await db.create_doc(DECISIONS_COLLECTION, decision_data, user_id=user_id, doc_id=decision_id)

    # 4. Compose grounded pause response
    bullet_history = []
    bullet_history.append(f"• You've known {person_name} for {duration}.")
    
    # Add key recorded facts from history
    events = state.get("relevant_events", [])
    support_events = [e for e in events if e.get("eventType") == "support"]
    if support_events:
        bullet_history.append(f"• You've recorded them as supportive during difficult personal situations.")
    
    conflict_events = [e for e in events if e.get("eventType") == "conflict"]
    if conflict_events:
        contexts_list = set(e.get("context") for e in conflict_events if e.get("context"))
        if contexts_list:
            bullet_history.append(f"• You've recorded conflicts around {', '.join(contexts_list)} discussions.")
    
    gap_events = [e for e in events if e.get("eventType") == "communication_gap"]
    if gap_events:
        bullet_history.append(f"• A previous conflict resulted in a temporary communication gap.")
    
    reconciled_events = [e for e in events if e.get("eventType") == "reconciliation"]
    if reconciled_events:
        bullet_history.append("• You later reconciled.")

    history_bullets_str = "\n".join(bullet_history)

    # Format branches for readable text
    branch_text_parts = []
    for idx, b in enumerate(branches, 1):
        conseq_lines = "\n   ".join(f"- {c}" for c in b.possibleConsequences)
        branch_text_parts.append(
            f"**Path {idx}: {b.action}**\n   Possible consequences:\n   {conseq_lines}\n   (Reversibility: {b.reversibility})"
        )

    branch_display_str = "\n\n".join(branch_text_parts)
    questions_display_str = "\n".join(f"> *{q}*" for q in questions)

    response_text = (
        f"I noticed this is a consequential decision regarding {person_name}.\n\n"
        f"**Here is some context from your recorded relationship history:**\n"
        f"{history_bullets_str}\n\n"
        f"**Plausible future paths to consider:**\n\n"
        f"{branch_display_str}\n\n"
        f"**Reflection before deciding:**\n"
        f"{questions_display_str}\n\n"
        f"Which consequences are you actually willing to accept? Take a moment to reflect—the decision is completely yours."
    )

    return {
        "future_branches": [b.model_dump() for b in branches],
        "reflection_questions": questions,
        "decision_id": decision_id,
        "response_text": response_text
    }


async def generate_standard_qa_node(state: RelationshipAgentState) -> Dict[str, Any]:
    """Node 2B: Handles regular relationship history questions, patterns, and insights."""
    message = state.get("message", "")
    person_name = state.get("person_name", "your relationship")
    relationship_type = state.get("relationship_type", "relationship")
    duration = state.get("duration", "some time")
    status = state.get("status", "active")
    timeline_str = state.get("timeline_summary", "")
    
    context_lines = [
        f"• {c.get('context')}: {c.get('patternObservation')}" 
        for c in state.get("context_observations", [])
    ]
    contexts_str = "\n".join(context_lines)
    
    memories_lines = [f"• {m.get('memory')}" for m in state.get("relevant_memories", [])]
    memories_str = "\n".join(memories_lines)

    answer = await ai_service.generate_relationship_qa(
        query=message,
        person_name=person_name,
        relationship_type=relationship_type,
        duration=duration,
        status=status,
        contexts_str=contexts_str,
        timeline_str=timeline_str,
        memories_str=memories_str
    )

    return {
        "response_text": answer,
        "future_branches": [],
        "reflection_questions": [],
        "decision_id": None
    }
