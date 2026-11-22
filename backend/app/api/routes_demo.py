import logging
from fastapi import APIRouter, Depends, status
from app.api.deps import get_current_user
from app.services.demo_seed_service import seed_demo_data_for_user
from app.memory.mem0_service import mem0_service

logger = logging.getLogger(__name__)
router = APIRouter(tags=["demo_and_memories"])


@router.post("/demo/seed", status_code=status.HTTP_200_OK)
async def seed_demo(user: dict = Depends(get_current_user)):
    """Seeds the 8-year Rahul relationship and history for 30-second judge demo."""
    user_id = user["uid"]
    result = await seed_demo_data_for_user(user_id)
    return result


@router.get("/memories")
async def list_memories(
    person_id: str = None,
    query: str = "",
    user: dict = Depends(get_current_user)
):
    """Retrieves long-term semantic memories for the authenticated user."""
    user_id = user["uid"]
    memories = await mem0_service.search_memories(
        query=query or "relationship",
        user_id=user_id,
        person_id=person_id,
        limit=20
    )
    return {"memories": memories}


@router.delete("/memories/{memory_id}")
async def delete_memory(memory_id: str, user: dict = Depends(get_current_user)):
    """Deletes a long-term memory entry (privacy requirement)."""
    user_id = user["uid"]
    success = await mem0_service.delete_memory(memory_id, user_id=user_id)
    return {"status": "success", "deleted": success}
