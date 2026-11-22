import logging
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.core.config import settings
from app.api.routes_people import router as people_router
from app.api.routes_relationships import router as relationships_router
from app.api.routes_events import router as events_router
from app.api.routes_decisions import router as decisions_router
from app.api.routes_agent import router as agent_router
from app.api.routes_demo import router as demo_router
from app.api.routes_privacy import router as privacy_router

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(name)s: %(message)s"
)
logger = logging.getLogger(__name__)

app = FastAPI(
    title=settings.PROJECT_NAME,
    description="Relationship Intelligence AI - External relationship memory, reasoning, and reflection engine.",
    version="1.0.0"
)

# CORS Middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Allows local Next.js on localhost:3000
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include API Routers under /api
api_prefix = "/api"
app.include_router(people_router, prefix=api_prefix)
app.include_router(relationships_router, prefix=api_prefix)
app.include_router(events_router, prefix=api_prefix)
app.include_router(decisions_router, prefix=api_prefix)
app.include_router(agent_router, prefix=api_prefix)
app.include_router(demo_router, prefix=api_prefix)
app.include_router(privacy_router, prefix=api_prefix)


@app.get("/health")
async def health_check():
    return {
        "status": "healthy",
        "service": settings.PROJECT_NAME,
        "environment": settings.ENVIRONMENT
    }


@app.get("/")
async def root():
    return {
        "name": settings.PROJECT_NAME,
        "docs": "/docs",
        "philosophy": "Remember the relationship, not just the conversation."
    }


if __name__ == "__main__":
    import uvicorn
    uvicorn.run("app.main:app", host=settings.HOST, port=settings.PORT, reload=True)
