# LangGraph Relationship Agent Specification

## State Model (`RelationshipAgentState`)

```python
class RelationshipAgentState(TypedDict):
    user_id: str
    session_id: str
    message: str

    person_id: str | None
    person_name: str | None
    relationship_type: str | None

    context: str | None
    emotion: str | None
    emotional_intensity: float | None

    decision_detected: bool
    proposed_action: str | None
    consequence_severity: float | None
    reversibility: str | None  # "high", "medium", "low"

    relevant_memories: list[dict]
    relevant_events: list[dict]
    timeline_summary: str | None

    future_branches: list[dict]
    reflection_questions: list[str]
    user_answers: list[str]

    response_text: str | None
    final_decision: str | None
    outcome: str | None
```

---

## Agent Flow Graph

```text
               [START]
                  │
                  ▼
          [1. Analyze Input]
     (Extract person, context, emotion,
     consequence & reversibility signals)
                  │
                  ▼
         [2. Retrieve Memory]
   (Fetch Firestore events + Mem0 semantic memories)
                  │
                  ▼
    {Is Consequential Decision?}
          /               \
       YES                 NO
        │                   │
        ▼                   ▼
[3. Generate Branches   [Normal Relationship
  & Reflections]         Insight / Q&A]
        │                   │
        ▼                   ▼
     [PAUSE]              [END]
(Wait for user reflection)
        │
        ▼
[4. Finalize & Record]
        │
        ▼
      [END]
```

## Guardrails & Non-Negotiables
1. **Never diagnose**: Never say "X is a narcissist" or "X is toxic". Say: "You noted defensive interactions during political talks."
2. **Never command**: Never say "You should leave him" or "Call him right now". Say: "Here are possible paths and potential consequences to consider."
3. **Always attribute**: Distinguish between objective historical records supplied by the user vs. AI hypothetical scenario projections.
