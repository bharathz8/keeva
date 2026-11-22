import logging
import uuid
from app.core.database import (
    DatabaseService,
    PEOPLE_COLLECTION,
    RELATIONSHIPS_COLLECTION,
    EVENTS_COLLECTION,
    CONTEXTS_COLLECTION,
)
from app.memory.mem0_service import mem0_service

logger = logging.getLogger(__name__)
db = DatabaseService()


async def seed_demo_data_for_user(user_id: str) -> dict:
    """
    Seeds the realistic demo relationship with Rahul (8 years) and Arun (coworker, 2 years)
    along with historical timeline events, context observations, and Mem0 semantic memories.
    """
    logger.info(f"Seeding demo data for user: {user_id}")

    # Check if already seeded to prevent duplicate clutter
    existing_people = await db.query_docs(PEOPLE_COLLECTION, user_id=user_id, filters={"name": "Rahul"})
    if existing_people:
        return {"status": "already_seeded", "personId": existing_people[0]["id"], "message": "Demo data already initialized"}

    # 1. Create Rahul
    rahul_id = f"person_rahul_{uuid.uuid4().hex[:6]}"
    rahul_data = {
        "name": "Rahul",
        "alias": "Iceland",
        "aliasCategory": "countries",
        "isEncrypted": True,
        "relationshipType": "Friend",
        "duration": "8 years",
        "status": "active",
        "avatar": "R",
        "notes": "Close college friend known for 8 years.",
        "lastInteraction": "2 days ago",
    }
    await db.create_doc(PEOPLE_COLLECTION, rahul_data, user_id=user_id, doc_id=rahul_id)

    # 2. Create Relationship Doc
    rel_id = f"rel_rahul_{uuid.uuid4().hex[:6]}"
    rel_data = {
        "personId": rahul_id,
        "relationshipType": "Friend",
        "startedAt": "2018-06-01",
        "status": "active",
        "notes": "Long-term friendship with deep history but recurring friction on political debates."
    }
    await db.create_doc(RELATIONSHIPS_COLLECTION, rel_data, user_id=user_id, doc_id=rel_id)

    # 3. Create Context Dynamics (Context-dependent relationship modeling)
    contexts = [
        {
            "relationshipId": rel_id,
            "personId": rahul_id,
            "context": "politics",
            "patternObservation": "Repeated defensive interactions recorded during political debates.",
            "emotionalIntensity": "high",
            "eventCount": 3
        },
        {
            "relationshipId": rel_id,
            "personId": rahul_id,
            "context": "personal problems",
            "patternObservation": "Consistently supportive and attentive during difficult life circumstances.",
            "emotionalIntensity": "low",
            "eventCount": 2
        },
        {
            "relationshipId": rel_id,
            "personId": rahul_id,
            "context": "casual conversations",
            "patternObservation": "Positive, humorous, and relaxed tone when catching up casually.",
            "emotionalIntensity": "low",
            "eventCount": 5
        }
    ]
    for ctx in contexts:
        await db.create_doc(CONTEXTS_COLLECTION, ctx, user_id=user_id)

    # 4. Create Longitudinal Timeline Events
    timeline_events = [
        {
            "relationshipId": rel_id,
            "personId": rahul_id,
            "personName": "Rahul",
            "timestamp": "2023-04-15",
            "context": "personal problems",
            "eventType": "support",
            "description": "Rahul helped me through a deeply stressful personal transition and checked in regularly.",
            "userEmotion": "grateful",
            "observedBehavior": "offered consistent emotional support",
            "outcome": "strengthened trust and bond",
            "source": "user_note",
            "confidence": 0.95
        },
        {
            "relationshipId": rel_id,
            "personId": rahul_id,
            "personName": "Rahul",
            "timestamp": "2024-02-10",
            "context": "politics",
            "eventType": "conflict",
            "description": "We had an intense argument regarding the upcoming elections over dinner.",
            "userEmotion": "frustrated",
            "observedBehavior": "raised voice and defended partisan stance sharply",
            "outcome": "abruptly ended dinner",
            "source": "user_note",
            "confidence": 0.90
        },
        {
            "relationshipId": rel_id,
            "personId": rahul_id,
            "personName": "Rahul",
            "timestamp": "2025-01-18",
            "context": "politics",
            "eventType": "conflict",
            "description": "Another political disagreement occurred in a group chat. He became noticeably defensive.",
            "userEmotion": "irritated",
            "observedBehavior": "became defensive and stopped responding",
            "outcome": "communication paused",
            "source": "user_note",
            "confidence": 0.88
        },
        {
            "relationshipId": rel_id,
            "personId": rahul_id,
            "personName": "Rahul",
            "timestamp": "2025-01-22",
            "context": "communication",
            "eventType": "reconciliation",
            "description": "We stopped talking for 4 days after the group chat disagreement, then hopped on a phone call and reconciled.",
            "userEmotion": "relieved",
            "observedBehavior": "agreed that political arguments were harming the friendship",
            "outcome": "reconciled successfully after a 4-day gap",
            "source": "user_note",
            "confidence": 0.92
        },
        {
            "relationshipId": rel_id,
            "personId": rahul_id,
            "personName": "Rahul",
            "timestamp": "2026-01-05",
            "context": "communication",
            "eventType": "communication_gap",
            "description": "We have been communicating less frequently over the past few weeks.",
            "userEmotion": "distant",
            "observedBehavior": "delayed replies and fewer casual check-ins",
            "outcome": "lower communication frequency",
            "source": "user_note",
            "confidence": 0.85
        }
    ]
    for ev in timeline_events:
        await db.create_doc(EVENTS_COLLECTION, ev, user_id=user_id)

    # 5. Populate Mem0 Semantic Long-term Memory
    memories = [
        "Rahul was exceptionally supportive during my personal crisis in 2023.",
        "Political discussions with Rahul repeatedly lead to defensive reactions and heated friction.",
        "After an intense conflict in 2025, taking a 4-day pause allowed both of us to cool down and reconcile over a phone call.",
        "In 2026, communication frequency with Rahul has gradually declined."
    ]
    for m in memories:
        await mem0_service.add_memory(
            text=m,
            user_id=user_id,
            person_id=rahul_id,
            person_name="Rahul",
            context="friendship_history"
        )

    # Also add Arun (coworker, 2 years) for a realistic multi-person dashboard
    arun_id = f"person_arun_{uuid.uuid4().hex[:6]}"
    arun_data = {
        "name": "Arun",
        "alias": "Canada",
        "aliasCategory": "countries",
        "isEncrypted": True,
        "relationshipType": "Coworker",
        "duration": "2 years",
        "status": "active",
        "avatar": "A",
        "notes": "Collaborator on engineering projects.",
        "lastInteraction": "Yesterday",
    }
    await db.create_doc(PEOPLE_COLLECTION, arun_data, user_id=user_id, doc_id=arun_id)

    # Pre-configure Demo Privacy Vault (PIN: 1234 or Security Question: 'What is your favorite app?' -> 'keeva')
    from app.services.privacy_service import privacy_service
    await privacy_service.setup_vault(
        user_id=user_id,
        pin_or_password="1234",
        security_question="What is your favorite relationship intelligence app?",
        security_answer="keeva",
        default_category="countries"
    )

    return {
        "status": "success",
        "personId": rahul_id,
        "relationshipId": rel_id,
        "message": "Demo data successfully seeded for Rahul and Arun!"
    }
