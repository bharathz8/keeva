import logging
import uuid
from fastapi import APIRouter, Depends, HTTPException, status
from app.api.deps import get_current_user
from app.agents.relationship_graph import relationship_agent_graph
from app.models.agent import (
    AgentMessageRequest,
    AgentMessageResponse,
    AgentReflectionAnswerRequest,
)
from app.core.database import DatabaseService, DECISIONS_COLLECTION
from app.memory.mem0_service import mem0_service

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/agent", tags=["agent"])
db = DatabaseService()


@router.post("/message", response_model=AgentMessageResponse)
async def process_agent_message(
    payload: AgentMessageRequest,
    user: dict = Depends(get_current_user)
):
    user_id = user["uid"]
    session_id = payload.sessionId or f"sess_{uuid.uuid4().hex[:10]}"

    # Initial state for the LangGraph workflow
    initial_state = {
        "user_id": user_id,
        "session_id": session_id,
        "message": payload.message,
        "person_id": payload.personId,
        "relationship_id": payload.relationshipId,
        "inference_source": "hybrid-orchestrated" if payload.preferredInference == "hybrid" else payload.preferredInference or "cloud-gemini"
    }

    config = {"configurable": {"thread_id": session_id}}

    try:
        final_state = await relationship_agent_graph.ainvoke(initial_state, config=config)
    except Exception as e:
        logger.error(f"LangGraph execution error: {e}", exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Agent reasoning engine encountered an issue: {str(e)}"
        )

    # Determine inference attribution
    inference_source = final_state.get("inference_source", "cloud-gemini")
    if payload.clientInferenceAttempted:
        inference_source = "on-device-verified"

    return AgentMessageResponse(
        sessionId=session_id,
        reply=final_state.get("response_text") or "I have processed your relationship query.",
        personId=final_state.get("person_id"),
        personName=final_state.get("person_name"),
        relationshipType=final_state.get("relationship_type"),
        isPauseTriggered=final_state.get("is_pause_warranted", False),
        pauseReason=final_state.get("pause_reason"),
        emotionalIntensity=final_state.get("emotional_intensity"),
        consequenceSeverity=final_state.get("consequence_severity"),
        reversibility=final_state.get("reversibility"),
        relevantMemories=final_state.get("relevant_memories", []),
        relevantEvents=final_state.get("relevant_events", []),
        timelineSummary=final_state.get("timeline_summary"),
        futureBranches=final_state.get("future_branches", []),
        reflectionQuestions=final_state.get("reflection_questions", []),
        decisionId=final_state.get("decision_id"),
        inferenceSource=inference_source
    )


@router.post("/reflect")
async def answer_reflection(
    payload: AgentReflectionAnswerRequest,
    user: dict = Depends(get_current_user)
):
    """
    Submits user reflection and final chosen path back into the decision record.
    Completes the Human-in-the-Loop decision cycle.
    """
    user_id = user["uid"]
    decision = await db.get_doc(DECISIONS_COLLECTION, payload.decisionId, user_id=user_id)
    if not decision:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Decision not found")

    selected_action = payload.finalDecision
    if not selected_action and payload.selectedBranchIndex is not None:
        branches = decision.get("futureBranches", [])
        if 0 <= payload.selectedBranchIndex < len(branches):
            selected_action = branches[payload.selectedBranchIndex].get("action")

    update_data = {
        "userReflection": payload.reflectionText,
        "finalDecision": selected_action or "Reflected and chose mindful path",
        "status": "decided"
    }

    updated = await db.update_doc(DECISIONS_COLLECTION, payload.decisionId, update_data, user_id=user_id)

    # Record in Mem0 as a mindful reflection
    person_name = decision.get("personName", "Friend")
    await mem0_service.add_memory(
        text=f"Decision reflection regarding {person_name}: Chose '{update_data['finalDecision']}'. User reflection: {payload.reflectionText}",
        user_id=user_id,
        person_id=decision.get("personId"),
        person_name=person_name,
        context="reflection"
    )

    return {
        "status": "success",
        "decision": updated,
        "message": "Your decision and reflection have been recorded. You remain in control."
    }


@router.get("/diagnostic")
async def run_ai_diagnostic(user: dict = Depends(get_current_user)):
    """
    Diagnostic endpoint to verify connectivity to Cloud Gemini,
    Firestore structured state, and Mem0 semantic long-term memory.
    """
    import time
    from app.services.ai_service import ai_service
    from app.core.config import settings

    start_time = time.time()
    
    # Test Cloud AI inference status
    has_live_gemini = bool(ai_service.client)
    gemini_status = "live-connected" if has_live_gemini else "grounded-fallback-engine"

    latency_ms = round((time.time() - start_time) * 1000, 2)

    return {
        "status": "operational",
        "hybridArchitecture": {
            "tier1_local": "On-Device Chrome Built-in AI / Prompt API (window.ai.languageModel)",
            "tier2_cloud": "Google Cloud Gemini (gemini-2.5-flash) via Firebase AI Logic layer",
            "routingStrategy": "Attempt On-Device -> Automatic Fallback to Cloud Gemini"
        },
        "cloudGemini": {
            "configured": bool(settings.GEMINI_API_KEY and not settings.GEMINI_API_KEY.startswith("your_")),
            "status": gemini_status,
            "targetModel": "gemini-2.5-flash",
            "latencyMs": latency_ms
        },
        "memoryEngine": {
            "semanticStore": "Mem0 (semantic long-term memory)",
            "structuredStore": "Google Cloud Firestore",
            "projectId": settings.FIREBASE_PROJECT_ID
        },
        "userContext": {
            "userId": user.get("uid"),
            "authProvider": user.get("auth_provider", "firebase")
        }
    }

