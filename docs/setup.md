# Local Setup & Development Guide

## Prerequisites
- Node.js 18+ (tested on Node 22)
- Python 3.10+ (tested on Python 3.11)
- Docker & Docker Compose (optional for containerized setup)
- Firebase Project (or local mock authentication)
- Gemini API Key (optional for Cloud Gemini / fallback)
- Mem0 API Key (optional for Cloud Mem0 / built-in semantic store)

For open-source contribution workflows and coding standards, see [CONTRIBUTE.md](file:///d:/projects/Keeva/CONTRIBUTE.md).

---

## Option A: Docker Compose (Quickest)

```bash
# 1. Prepare environment variables
cp .env.example .env

# 2. Build and run backend container
docker-compose up -d --build

# 3. Check backend health
curl http://localhost:8000/health
```

Then run the frontend:
```bash
cd frontend
npm install
npm run dev
```

---

## Option B: Local Manual Setup

### 1. Backend Setup (FastAPI)

```bash
cd backend
python -m venv venv
# On Windows:
.\venv\Scripts\activate
# On Linux/macOS:
source venv/bin/activate

pip install -r requirements.txt
cp ../.env.example .env
```

Start the FastAPI backend:
```bash
uvicorn app.main:app --reload --port 8000
```

The API docs are available at `http://localhost:8000/docs`.

---

## 2. Frontend Setup

```bash
cd frontend
npm install
npm run dev
```

The Next.js frontend will be running at `http://localhost:3000`.

---

## 3. Demo / Hackathon Mode
To test the complete user journey in 30 seconds without manual setup:
1. Open the application at `http://localhost:3000`.
2. Click **"Load Demo Seed Data (Rahul - 8 years)"** on the dashboard.
3. Open the AI Agent tab or click **"Test Consequential Decision"**.
4. Test with: *"Rahul ignored me again. I'm done with this friendship."*
5. Witness relationship recognition, historical context retrieval, pause trigger, 3 future branches with consequences, and socratic reflection questions.
