# Relationship Intelligence AI - Architecture

## Core Philosophy
> **"Remember the relationship, not just the conversation."**

Humans cannot perfectly retain years of interactions, conflicts, positive experiences, communication patterns, contexts, and long-term trajectory. Relationship Intelligence AI serves as an external relationship memory and reasoning system.

It is **NOT**:
- An AI therapist, psychologist, or relationship advisor.
- A generic chatbot or ChatGPT clone.
- An agent that makes decisions for the user or claims to objectively diagnose another person.

It **IS**:
- An observation-based relationship memory and reflection engine.
- A system that distinguishes between observations ("Rahul became defensive during several political disagreements") and unsupported claims ("Rahul is an aggressive person").
- A consequence-aware reasoning system that introduces a constructive **"Pause"** when high-consequence, low-reversibility actions are detected.

---

## High-Level System Architecture

```mermaid
flowchart TD
    subgraph Client ["Frontend (Next.js 16 + React 19 + Tailwind + Lucide)"]
        UI_Dash["Dashboard (/)"]
        UI_People["People Management (/people)"]
        UI_Rel["Relationship Profile & Timeline (/people/[id])"]
        UI_Agent["Relationship Agent Interface (/agent)"]
        UI_Dec["Decision Registry & Outcomes (/decisions)"]
        FB_Auth["Firebase Auth (Google & Email/Password)"]
        Privacy_Shield["Steganographic Privacy Vault (Context + Modals)"]
        Hybrid_Client["Firebase AI Logic / On-Device Diagnostic Controller"]
    end

    subgraph Backend ["Backend API (FastAPI + Pydantic v2)"]
        API_Routes["FastAPI Routes (/api/people, /api/agent, /api/privacy, etc.)"]
        Auth_Middleware["Firebase ID Token Verification"]
        Privacy_Service["Privacy & Encryption Vault Service"]
        
        subgraph Agent_Engine ["LangGraph Reasoning Engine"]
            LG_Start["Start / Input Analysis"]
            LG_Ident["Entity & Context Identification"]
            LG_Retrieve["Hybrid Memory Retrieval"]
            LG_Consequence["Consequence & Reversibility Evaluator"]
            LG_Branch["Plausible Future Scenario Generator"]
            LG_Reflect["Reflection Engine (1-2 Socratic Questions)"]
            LG_Decision["Human-in-the-Loop Decision Recording"]
        end
        
        subgraph Storage_Layer ["Data & Memory Layer"]
            Mem0_Engine["Mem0 Semantic Long-term Memory"]
            Firestore_DB[("Firestore Database\n(Structured application state + Vault)")]
        end
    end

    subgraph Inference_Layer ["Hybrid AI Inference Options"]
        OnDevice["On-Device AI (Chrome Built-in Prompt API / Gemini Nano)"]
        CloudGemini["Cloud Gemini (Google Gemini 2.5 Flash via Firebase AI Logic)"]
        Diagnostic["Diagnostics Engine (Flag & Weight Verification + Fallback)"]
    end

    Client -->|Bearer Token + HTTPS| API_Routes
    API_Routes --> Auth_Middleware
    Auth_Middleware --> Agent_Engine
    Auth_Middleware --> Privacy_Service
    Privacy_Service --> Firestore_DB
    Agent_Engine --> Mem0_Engine
    Agent_Engine --> Firestore_DB
    Agent_Engine --> Inference_Layer
```

---

## Data Model & Isolation
Every record in Firestore and Mem0 is strictly isolated by `userId`.

1. **Structured State (Firestore)**:
   - `users`: User settings, reflection preferences, and encrypted vault configuration.
   - `privacy_vaults`: Hashed PINs, security questions/answers, and default alias categories.
   - `people`: Tracked individuals (realName, assignedAlias, relationship type, duration, status, contexts).
   - `relationships`: Connection metadata and relationship status.
   - `relationship_events`: Chronological events (timestamp, context, eventType, userEmotion, observedBehavior, outcome).
   - `relationship_contexts`: Context-specific dynamics (e.g. politics -> defensive, personal problems -> supportive).
   - `decisions`: Deliberate pauses, situations, branches, reflections, decisions, and tracked outcomes.
   - `agent_sessions`: Multi-turn conversational sessions and checkpoint states.

2. **Semantic Long-term Memory (Mem0)**:
   - Vector-indexed observations, historical resolutions, and explicit user-recorded patterns.
   - User-scoped queries with person and context filters.

---

## Consequence Detection & "Pause" Flow
When a user expresses a consequential or emotionally charged impulse:
- **Signals**: `emotional_intensity > threshold` AND `consequence_severity > threshold` AND `reversibility == "low"`
- **Response**: The AI does not tell the user what to do. It surfaces relationship context, explores 2–4 plausible consequences across alternative paths, asks 1–2 grounding reflection questions, and leaves the final decision in the user's hands.
