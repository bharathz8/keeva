import asyncio
import json
import logging
import os
import re
from typing import Any, Dict, List, Optional
from app.core.config import settings
from app.models.decision import FutureBranch
from app.models.event import ExtractedEventDraft
from app.prompts.event_extraction import (
    EVENT_EXTRACTION_SYSTEM_PROMPT,
    EVENT_EXTRACTION_USER_PROMPT,
)
from app.prompts.consequence_detection import (
    CONSEQUENCE_DETECTION_SYSTEM_PROMPT,
    CONSEQUENCE_DETECTION_USER_PROMPT,
)
from app.prompts.future_scenarios import (
    FUTURE_SCENARIO_SYSTEM_PROMPT,
    FUTURE_SCENARIO_USER_PROMPT,
)
from app.prompts.reflection import (
    REFLECTION_SYSTEM_PROMPT,
    REFLECTION_USER_PROMPT,
)
from app.prompts.relationship_qa import (
    RELATIONSHIP_QA_SYSTEM_PROMPT,
    RELATIONSHIP_QA_USER_PROMPT,
)

logger = logging.getLogger(__name__)


def clean_json_text(text: str) -> str:
    """Extracts raw JSON from markdown or noisy LLM output."""
    text = text.strip()
    match = re.search(r"```(?:json)?\s*([\s\S]*?)\s*```", text)
    if match:
        return match.group(1).strip()
    return text


class AIService:
    def __init__(self):
        self.api_key = settings.GEMINI_API_KEY or os.getenv("GEMINI_API_KEY", "")
        self.client = None
        # Only instantiate if key is valid and not a placeholder
        if self.api_key and not self.api_key.startswith("your_") and len(self.api_key) > 10:
            try:
                from google import genai
                self.client = genai.Client(api_key=self.api_key, http_options={"api_version": "v1beta"})
                logger.info("Initialized Google Gemini AI client (v1beta).")
            except Exception as e:
                logger.warning(f"Failed to initialize Google Gemini client: {e}")

    async def _generate_text(self, system_instruction: str, prompt: str) -> str:
        """Invokes Gemini LLM if key available, else returns grounded fallback reasoning."""
        if self.client:
            try:
                def _call():
                    return self.client.models.generate_content(
                        model="gemini-2.5-flash",
                        contents=prompt,
                        config={"system_instruction": system_instruction, "temperature": 0.2}
                    )
                response = await asyncio.wait_for(asyncio.to_thread(_call), timeout=8.0)
                if response and response.text:
                    return response.text
            except Exception as e:
                # If config-level system_instruction has issues, retry by prepending instruction to contents
                try:
                    def _call_alt():
                        combined = f"SYSTEM INSTRUCTION:\n{system_instruction}\n\nUSER INPUT:\n{prompt}"
                        return self.client.models.generate_content(
                            model="gemini-2.5-flash",
                            contents=combined
                        )
                    response = await asyncio.wait_for(asyncio.to_thread(_call_alt), timeout=8.0)
                    if response and response.text:
                        return response.text
                except Exception as e2:
                    logger.warning(f"Gemini API call failed or timed out ({e} | alt: {e2}). Utilizing fallback engine.")
        
        return ""

    async def extract_event_from_note(
        self,
        note_text: str,
        person_name: str = "Unknown",
        relationship_type: str = "Friend"
    ) -> ExtractedEventDraft:
        """Extracts structured relationship observation from free-form user notes."""
        prompt = EVENT_EXTRACTION_USER_PROMPT.format(
            note_text=note_text,
            person_name=person_name,
            relationship_type=relationship_type
        )
        
        raw_response = await self._generate_text(EVENT_EXTRACTION_SYSTEM_PROMPT, prompt)
        if raw_response:
            try:
                data = json.loads(clean_json_text(raw_response))
                return ExtractedEventDraft(
                    personName=data.get("personName") or person_name,
                    relationshipType=data.get("relationshipType") or relationship_type,
                    context=data.get("context", "general"),
                    eventType=data.get("eventType", "interaction"),
                    description=data.get("description", note_text),
                    userEmotion=data.get("userEmotion"),
                    observedBehavior=data.get("observedBehavior"),
                    outcome=data.get("outcome"),
                    confidence=float(data.get("confidence", 0.85)),
                    suggestedTimelineDate=data.get("suggestedTimelineDate"),
                    explanation="AI extraction grounded strictly in provided note"
                )
            except Exception as e:
                logger.error(f"Error parsing event extraction JSON: {e}")

        # Grounded heuristic fallback if Gemini key is unset or offline
        lower = note_text.lower()
        context = "general"
        event_type = "interaction"
        observed = None
        user_emotion = None
        
        if any(w in lower for w in ["politic", "election", "government", "vote"]):
            context = "politics"
            event_type = "conflict"
            observed = "became defensive during political discussion"
        elif any(w in lower for w in ["help", "support", "difficult", "tough", "hospital", "sick"]):
            context = "personal problems"
            event_type = "support"
            observed = "offered support during a difficult period"
            user_emotion = "grateful"
        elif any(w in lower for w in ["argue", "disagree", "fight", "defensive", "yell", "confront"]):
            context = "communication"
            event_type = "conflict"
            observed = "defensive response during disagreement"
            user_emotion = "frustrated"
        elif any(w in lower for w in ["ignore", "ghost", "stopped talking", "gap", "silent", "didn't reply"]):
            context = "communication"
            event_type = "communication_gap"
            observed = "stopped communicating"
            user_emotion = "hurt"
        elif any(w in lower for w in ["reconcil", "made up", "apolog", "forgave", "talked it out"]):
            context = "communication"
            event_type = "reconciliation"
            observed = "reconciled after conversation"

        return ExtractedEventDraft(
            personName=person_name,
            relationshipType=relationship_type,
            context=context,
            eventType=event_type,
            description=note_text.strip(),
            userEmotion=user_emotion,
            observedBehavior=observed,
            outcome=None,
            confidence=0.82,
            suggestedTimelineDate=None,
            explanation="Extracted from user note"
        )

    async def detect_consequence(
        self,
        message: str,
        person_name: str,
        relationship_type: str,
        duration: str
    ) -> Dict[str, Any]:
        """Detects if message indicates an emotionally charged, low-reversibility decision."""
        prompt = CONSEQUENCE_DETECTION_USER_PROMPT.format(
            message=message,
            person_name=person_name,
            relationship_type=relationship_type,
            duration=duration
        )
        
        raw_response = await self._generate_text(CONSEQUENCE_DETECTION_SYSTEM_PROMPT, prompt)
        if raw_response:
            try:
                return json.loads(clean_json_text(raw_response))
            except Exception as e:
                logger.error(f"Error parsing consequence JSON: {e}")

        # Deterministic semantic evaluator
        lower = message.lower()
        triggers = [
            "done with", "cutting him off", "cutting her off", "block him", "block her",
            "blocking", "never speaking", "ending this", "end our friendship", "end our relationship",
            "confront", "quitting", "quit my job", "screw him", "screw her", "i'm out",
            "cancel everything", "selling everything", "i hate this"
        ]
        
        is_triggered = any(t in lower for t in triggers)
        emotional_intensity = 0.85 if is_triggered else 0.35
        consequence_severity = 0.80 if is_triggered else 0.30
        reversibility = "low" if any(t in lower for t in ["done with", "cutting", "ending", "block", "quit"]) else "high"
        
        proposed_action = None
        if "done with" in lower or "end" in lower:
            proposed_action = "terminate relationship / friendship"
        elif "block" in lower:
            proposed_action = "block and cut communication"
        elif "confront" in lower:
            proposed_action = "escalate confrontation immediately"
        elif "quit" in lower:
            proposed_action = "resign / walk away"

        is_pause_warranted = (
            emotional_intensity >= settings.EMOTIONAL_INTENSITY_THRESHOLD and
            consequence_severity >= settings.CONSEQUENCE_THRESHOLD and
            reversibility in ["low", "medium"]
        )

        return {
            "decisionDetected": is_triggered,
            "proposedAction": proposed_action or "make immediate consequential move",
            "emotionalIntensity": emotional_intensity,
            "consequenceSeverity": consequence_severity,
            "reversibility": reversibility,
            "isPauseWarranted": is_pause_warranted,
            "rationale": "High emotional intensity combined with low reversibility action detected." if is_pause_warranted else "Standard inquiry."
        }

    async def generate_future_branches(
        self,
        person_name: str,
        relationship_type: str,
        duration: str,
        current_situation: str,
        history_context: str
    ) -> List[FutureBranch]:
        """Generates 2-4 plausible scenario paths with consequences, assumptions, and reversibility."""
        prompt = FUTURE_SCENARIO_USER_PROMPT.format(
            person_name=person_name,
            relationship_type=relationship_type,
            duration=duration,
            current_situation=current_situation,
            history_context=history_context
        )
        
        raw_response = await self._generate_text(FUTURE_SCENARIO_SYSTEM_PROMPT, prompt)
        if raw_response:
            try:
                data = json.loads(clean_json_text(raw_response))
                branches = [FutureBranch(**b) for b in data.get("branches", [])]
                if branches:
                    return branches[:4]
            except Exception as e:
                logger.error(f"Error parsing branches JSON: {e}")

        # Grounded fallback scenarios tailored directly to relationship context
        return [
            FutureBranch(
                action="Cut contact / Terminate relationship immediately",
                possibleConsequences=[
                    "Immediate emotional relief and removal of acute irritation",
                    f"Permanent loss of a {duration} {relationship_type.lower()} without mutual closure",
                    "Difficulty repairing later if new context emerges"
                ],
                assumptions=[
                    "The current behavior is intentional and represents an unfixable pattern rather than a temporary lapse"
                ],
                reversibility="low",
                uncertainty="medium"
            ),
            FutureBranch(
                action="Address the silence directly after taking 24-48 hours",
                possibleConsequences=[
                    "Provides space for emotional cooling before discussing what happened",
                    "Opportunity to discover if external factors or stress contributed",
                    "Risk of continued defensive reaction if discussed in a tense setting"
                ],
                assumptions=[
                    "Both of you value the multi-year history enough to talk honestly once calm"
                ],
                reversibility="high",
                uncertainty="medium"
            ),
            FutureBranch(
                action="Take deliberate space without announcing an ending",
                possibleConsequences=[
                    "Protects your emotional bandwidth right now without burning bridges",
                    "Tests whether communication frequency naturally re-balances",
                    "Relationship pace may slow down temporarily"
                ],
                assumptions=[
                    "Taking personal space does not require immediate dramatic declaration"
                ],
                reversibility="high",
                uncertainty="low"
            )
        ]

    async def generate_reflection_questions(
        self,
        person_name: str,
        relationship_type: str,
        user_message: str,
        proposed_action: str,
        history_context: str
    ) -> List[str]:
        """Generates 1 to 2 high-value socratic reflection questions."""
        prompt = REFLECTION_USER_PROMPT.format(
            person_name=person_name,
            relationship_type=relationship_type,
            user_message=user_message,
            proposed_action=proposed_action,
            history_context=history_context
        )
        
        raw_response = await self._generate_text(REFLECTION_SYSTEM_PROMPT, prompt)
        if raw_response:
            try:
                data = json.loads(clean_json_text(raw_response))
                qs = data.get("questions", [])
                if qs:
                    return qs[:2]
            except Exception as e:
                logger.error(f"Error parsing reflection JSON: {e}")

        return [
            f"Looking at the recorded history with {person_name}, are you responding primarily to today's event or to the broader pattern?",
            "Which consequences of your proposed action are you genuinely willing to accept?"
        ]

    async def generate_relationship_qa(
        self,
        query: str,
        person_name: str,
        relationship_type: str,
        duration: str,
        status: str,
        contexts_str: str,
        timeline_str: str,
        memories_str: str
    ) -> str:
        """Grounded Q&A about relationship history, patterns, and contexts."""
        prompt = RELATIONSHIP_QA_USER_PROMPT.format(
            query=query,
            person_name=person_name,
            relationship_type=relationship_type,
            duration=duration,
            status=status,
            contexts=contexts_str or "None recorded yet.",
            timeline_events=timeline_str or "No historical timeline events recorded yet.",
            memories=memories_str or "No prior semantic memories recorded."
        )
        
        raw_response = await self._generate_text(RELATIONSHIP_QA_SYSTEM_PROMPT, prompt)
        if raw_response:
            return raw_response.strip()

        # Deterministic grounded fallback response strictly following principles
        lines = [
            f"Based on what you've recorded about your relationship with {person_name} ({relationship_type}, known for {duration}):\n"
        ]
        if contexts_str:
            lines.append("Context patterns you've observed:")
            lines.append(contexts_str + "\n")
        if timeline_str:
            lines.append("Recorded timeline:")
            lines.append(timeline_str + "\n")
        
        lines.append(
            "Remember that this history reflects your recorded experiences over time. "
            "How does this context feel when looking at your current situation?"
        )
        return "\n".join(lines)


ai_service = AIService()
