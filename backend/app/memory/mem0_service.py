import logging
import uuid
from typing import Any, Dict, List, Optional
from app.core.config import settings

logger = logging.getLogger(__name__)

class Mem0Service:
    """
    Manages long-term semantic relationship memory.
    Enforces user isolation via user_id.
    Stores semantic summaries of interactions, recorded dynamics, and outcomes.
    """
    def __init__(self):
        self.client = None
        self._local_memories: Dict[str, List[Dict[str, Any]]] = {}  # user_id -> list of memory objects
        
        if settings.MEM0_API_KEY and not settings.MEM0_API_KEY.startswith("m0-your_") and len(settings.MEM0_API_KEY) > 15:
            try:
                from mem0 import MemoryClient
                self.client = MemoryClient(api_key=settings.MEM0_API_KEY)
                logger.info("Initialized hosted Mem0 client.")
            except Exception as e:
                logger.warning(f"Could not initialize Mem0 client: {e}. Using resilient local semantic memory store.")
                self.client = None
        else:
            logger.info("Using resilient local semantic relationship memory engine.")

    async def add_memory(
        self,
        text: str,
        user_id: str,
        person_id: Optional[str] = None,
        person_name: Optional[str] = None,
        context: Optional[str] = None,
        event_id: Optional[str] = None,
        metadata: Optional[Dict[str, Any]] = None
    ) -> Dict[str, Any]:
        """Adds a semantic memory entry scoped to user_id."""
        meta = metadata.copy() if metadata else {}
        if person_id:
            meta["person_id"] = person_id
        if person_name:
            meta["person_name"] = person_name
        if context:
            meta["context"] = context
        if event_id:
            meta["event_id"] = event_id
            
        memory_id = f"mem_{uuid.uuid4().hex[:12]}"
        
        # 1. Try cloud Mem0
        if self.client:
            try:
                result = self.client.add(
                    messages=[{"role": "user", "content": text}],
                    user_id=user_id,
                    metadata=meta
                )
                logger.info(f"Added memory to Mem0 for user {user_id}: {result}")
                return {
                    "id": memory_id,
                    "memory": text,
                    "userId": user_id,
                    "metadata": meta,
                    "provider": "mem0-cloud"
                }
            except Exception as e:
                logger.warning(f"Mem0 cloud add failed: {e}. Storing in local store.")
        
        # 2. Local semantic memory store
        if user_id not in self._local_memories:
            self._local_memories[user_id] = []
            
        entry = {
            "id": memory_id,
            "memory": text,
            "userId": user_id,
            "metadata": meta,
            "provider": "local-semantic"
        }
        self._local_memories[user_id].append(entry)
        return entry

    async def search_memories(
        self,
        query: str,
        user_id: str,
        person_id: Optional[str] = None,
        person_name: Optional[str] = None,
        context: Optional[str] = None,
        limit: int = 5
    ) -> List[Dict[str, Any]]:
        """Searches semantic memories scoped to user_id and optionally filtered by person."""
        # 1. Try cloud Mem0
        if self.client:
            try:
                search_filters = {"user_id": user_id}
                if person_id:
                    search_filters["person_id"] = person_id
                results = self.client.search(
                    query=query,
                    filters=search_filters,
                    top_k=limit
                )
                if results and isinstance(results, dict) and "results" in results:
                    return results["results"]
                elif isinstance(results, list):
                    return results
            except Exception as e:
                logger.warning(f"Mem0 search failed: {e}. Falling back to local search.")

        # 2. Local memory search
        user_entries = self._local_memories.get(user_id, [])
        query_words = set(query.lower().split())
        scored_entries = []

        for entry in user_entries:
            meta = entry.get("metadata", {})
            # Match person if specified
            if person_id and meta.get("person_id") and meta.get("person_id") != person_id:
                continue
            if person_name and meta.get("person_name") and meta.get("person_name").lower() != person_name.lower():
                continue
            
            entry_text = entry.get("memory", "").lower()
            entry_words = set(entry_text.split())
            overlap = len(query_words.intersection(entry_words))
            
            # Boost score if context matches
            score = float(overlap)
            if context and meta.get("context") and meta.get("context").lower() == context.lower():
                score += 3.0
            if person_name and person_name.lower() in entry_text:
                score += 2.0
                
            scored_entries.append((score, entry))

        # Sort by relevance score descending
        scored_entries.sort(key=lambda x: x[0], reverse=True)
        return [item[1] for item in scored_entries[:limit]]

    async def delete_memory(self, memory_id: str, user_id: str) -> bool:
        """Deletes a memory record, respecting user isolation."""
        if self.client:
            try:
                self.client.delete(memory_id=memory_id)
            except Exception as e:
                logger.warning(f"Mem0 cloud delete error: {e}")

        user_entries = self._local_memories.get(user_id, [])
        initial_len = len(user_entries)
        self._local_memories[user_id] = [m for m in user_entries if m.get("id") != memory_id]
        return len(self._local_memories[user_id]) < initial_len


mem0_service = Mem0Service()
