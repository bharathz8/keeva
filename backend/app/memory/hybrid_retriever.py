import logging
from typing import Any, Dict, List, Optional
from app.core.database import (
    DatabaseService,
    PEOPLE_COLLECTION,
    RELATIONSHIPS_COLLECTION,
    EVENTS_COLLECTION,
    CONTEXTS_COLLECTION,
)
from app.memory.mem0_service import mem0_service

logger = logging.getLogger(__name__)


class HybridRetriever:
    """
    Combines Mem0 semantic long-term memory retrieval with
    Firestore structured temporal events and context observations.
    """
    def __init__(self):
        self.mem0 = mem0_service
        self.db = DatabaseService()

    async def resolve_person_and_relationship(
        self,
        user_id: str,
        message: str,
        person_id: Optional[str] = None,
        relationship_id: Optional[str] = None
    ) -> Dict[str, Any]:
        """
        Identifies person and relationship from explicit IDs or extracts them from message.
        """
        # If person_id provided, fetch directly
        if person_id:
            person = await self.db.get_doc(PEOPLE_COLLECTION, person_id, user_id)
            if person:
                # Find associated relationship
                rels = await self.db.query_docs(
                    RELATIONSHIPS_COLLECTION,
                    user_id=user_id,
                    filters={"personId": person_id},
                    limit=1
                )
                rel = rels[0] if rels else None
                return {
                    "person": person,
                    "relationship": rel,
                    "person_id": person_id,
                    "relationship_id": rel.get("id") if rel else None
                }

        # Otherwise scan user's people list to find mentioned names
        all_people = await self.db.query_docs(PEOPLE_COLLECTION, user_id=user_id)
        lower_msg = message.lower()
        matched_person = None
        for p in all_people:
            name = p.get("name", "").strip().lower()
            if name and name in lower_msg:
                matched_person = p
                break

        if matched_person:
            p_id = matched_person["id"]
            rels = await self.db.query_docs(
                RELATIONSHIPS_COLLECTION,
                user_id=user_id,
                filters={"personId": p_id},
                limit=1
            )
            rel = rels[0] if rels else None
            return {
                "person": matched_person,
                "relationship": rel,
                "person_id": p_id,
                "relationship_id": rel.get("id") if rel else None
            }

        # Default if none matched
        return {
            "person": None,
            "relationship": None,
            "person_id": None,
            "relationship_id": None
        }

    async def retrieve_relationship_history(
        self,
        user_id: str,
        message: str,
        person_id: Optional[str] = None,
        relationship_id: Optional[str] = None,
        detected_context: Optional[str] = None
    ) -> Dict[str, Any]:
        """
        Retrieves:
        1. Context observations (e.g., politics -> defensive, personal problems -> supportive)
        2. Structured timeline events from Firestore (ordered by timestamp)
        3. Semantic long-term memories from Mem0
        4. Consolidated summary context for the reasoning engine
        """
        resolved = await self.resolve_person_and_relationship(
            user_id, message, person_id, relationship_id
        )
        person = resolved.get("person")
        rel = resolved.get("relationship")
        p_id = resolved.get("person_id")
        r_id = resolved.get("relationship_id")
        
        person_name = person.get("name", "Unknown") if person else "the person"
        relationship_type = person.get("relationshipType", "Relationship") if person else "Relationship"
        duration = person.get("duration", "an unspecified duration") if person else "some time"

        # 1. Fetch structured timeline events from Firestore
        timeline_events = []
        if r_id:
            timeline_events = await self.db.query_docs(
                EVENTS_COLLECTION,
                user_id=user_id,
                filters={"relationshipId": r_id},
                order_by="timestamp",
                descending=False
            )
        elif p_id:
            timeline_events = await self.db.query_docs(
                EVENTS_COLLECTION,
                user_id=user_id,
                filters={"personId": p_id},
                order_by="timestamp",
                descending=False
            )

        # 2. Fetch context observations (e.g., politics, personal problems, etc.)
        context_docs = []
        if r_id:
            context_docs = await self.db.query_docs(
                CONTEXTS_COLLECTION,
                user_id=user_id,
                filters={"relationshipId": r_id}
            )
        elif p_id:
            context_docs = await self.db.query_docs(
                CONTEXTS_COLLECTION,
                user_id=user_id,
                filters={"personId": p_id}
            )

        # 3. Fetch semantic long-term memories from Mem0
        semantic_memories = await self.mem0.search_memories(
            query=message,
            user_id=user_id,
            person_id=p_id,
            person_name=person_name if person else None,
            context=detected_context,
            limit=5
        )

        # 4. Format structured strings
        timeline_lines = []
        for ev in timeline_events:
            date_str = ev.get("timestamp") or ev.get("createdAt", "")[:10]
            desc = ev.get("description", "")
            obs = ev.get("observedBehavior")
            out = ev.get("outcome")
            line = f"• [{date_str}] ({ev.get('context', 'general')} / {ev.get('eventType', 'event')}) {desc}"
            if obs:
                line += f" | Observed: {obs}"
            if out:
                line += f" | Outcome: {out}"
            timeline_lines.append(line)

        contexts_lines = []
        for ctx in context_docs:
            contexts_lines.append(
                f"• In context of '{ctx.get('context')}': {ctx.get('patternObservation')} "
                f"(intensity: {ctx.get('emotionalIntensity', 'medium')})"
            )

        memories_lines = []
        for mem in semantic_memories:
            memories_lines.append(f"• {mem.get('memory', '')}")

        history_summary = []
        history_summary.append(f"Person: {person_name} ({relationship_type}, known for {duration})")
        if contexts_lines:
            history_summary.append("Context-dependent patterns recorded:")
            history_summary.extend(contexts_lines)
        if timeline_lines:
            history_summary.append("Chronological timeline events:")
            history_summary.extend(timeline_lines)
        if memories_lines:
            history_summary.append("Relevant long-term semantic memories:")
            history_summary.extend(memories_lines)

        return {
            "person": person,
            "relationship": rel,
            "person_id": p_id,
            "relationship_id": r_id,
            "person_name": person_name,
            "relationship_type": relationship_type,
            "duration": duration,
            "status": person.get("status", "active") if person else "active",
            "timeline_events": timeline_events,
            "timeline_formatted": "\n".join(timeline_lines),
            "contexts": context_docs,
            "contexts_formatted": "\n".join(contexts_lines),
            "memories": semantic_memories,
            "memories_formatted": "\n".join(memories_lines),
            "history_summary_text": "\n".join(history_summary)
        }


hybrid_retriever = HybridRetriever()
