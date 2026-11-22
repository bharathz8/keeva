# Contributing to Keeva

> **Core Rule**: *"AI does not decide for me. AI helps me think before I decide."*  
> No clinical/medical diagnosing, no generic chat clones, and no telling the human what to do.

---

## 1. Quick Setup

### Prerequisites
- Node.js 18+ & Python 3.10+ (or Docker)

### Option A: Docker (Fastest)
```bash
cp .env.example .env
docker-compose up -d --build
cd frontend && npm install && npm run dev
```

### Option B: Local Setup
```bash
# Backend
cd backend
python -m venv venv && source venv/bin/activate  # (or .\venv\Scripts\activate on Windows)
pip install -r requirements.txt
uvicorn app.main:app --reload --port 8000

# Frontend (separate terminal)
cd frontend
npm install
npm run dev
```
- App: `http://localhost:3000`
- API Docs: `http://localhost:8000/docs`

---

## 2. Monorepo Structure

```text
├── backend/          # FastAPI, LangGraph, Mem0, Firestore
│   ├── app/api/      # REST endpoints (agent, people, privacy, demo)
│   ├── app/services/ # LangGraph agent, privacy vault, Firestore
│   └── tests/        # pytest suites
├── frontend/         # Next.js 16, React 19, Tailwind CSS
│   ├── app/          # App Router (/agent, /people, /decisions)
│   ├── components/   # PauseCard, LocalAIErrorCard, Modals
│   ├── context/      # Privacy & Auth providers
│   └── lib/          # hybrid-ai.ts (Chrome Prompt API + fallback)
├── docs/             # Subsystem references
└── docker-compose.yml
```

---

## 3. Contribution Rules & Guardrails

1. **Observations over Judgment**: Record observed behaviors (*"defensive during politics"*), never labels (*"he is toxic"*).
2. **Never Command**: The AI presents alternative paths and consequences; the human chooses.
3. **Portal Modals**: All Next.js dialogs/modals must use `createPortal(content, document.body)` with client mounting checks to prevent CSS coordinate clipping.

---

## 4. Git & PR Workflow

- **Branch naming**: `feat/<name>`, `fix/<name>`, `docs/<name>`
- **Commits**: Conventional Commits format (`feat: ...`, `fix: ...`)
- **Verification before PR**:
  ```bash
  # Backend
  cd backend && pytest tests/

  # Frontend
  cd frontend && npm run build
  ```

Open a PR against `main` with a concise description and screenshots for UI changes.
