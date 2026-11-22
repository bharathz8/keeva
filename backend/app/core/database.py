import os
import json
import logging
import uuid
from datetime import datetime, timezone
from typing import Any, Dict, List, Optional
from app.core.config import settings

logger = logging.getLogger(__name__)

# Structured database collections
USERS_COLLECTION = "users"
PEOPLE_COLLECTION = "people"
RELATIONSHIPS_COLLECTION = "relationships"
EVENTS_COLLECTION = "relationship_events"
CONTEXTS_COLLECTION = "relationship_contexts"
DECISIONS_COLLECTION = "decisions"
REFLECTIONS_COLLECTION = "decision_reflections"
OUTCOMES_COLLECTION = "decision_outcomes"
SESSIONS_COLLECTION = "agent_sessions"
PRIVACY_VAULT_COLLECTION = "privacy_vault"

_firestore_client = None
_use_memory_fallback = os.getenv("USE_LOCAL_DB", "false").lower() in ("true", "1")

if not _use_memory_fallback:
    try:
        from google.cloud import firestore
        
        sa_path = settings.FIREBASE_SERVICE_ACCOUNT_PATH
        if not sa_path or not os.path.exists(sa_path):
            if os.path.exists("/app/serviceAccountKey.json"):
                sa_path = "/app/serviceAccountKey.json"
            elif os.path.exists("serviceAccountKey.json"):
                sa_path = "serviceAccountKey.json"

        if sa_path and os.path.exists(sa_path):
            _firestore_client = firestore.Client.from_service_account_json(sa_path, project=settings.FIREBASE_PROJECT_ID)
            logger.info(f"Initialized Google Cloud Firestore Client using service account: {sa_path}")
        else:
            _firestore_client = firestore.Client(project=settings.FIREBASE_PROJECT_ID)
            logger.info(f"Initialized Google Cloud Firestore Client for project: {settings.FIREBASE_PROJECT_ID}")
    except Exception as e:
        logger.warning(f"Could not initialize Cloud Firestore client ({e}). Using robust local fallback store for development.")
        _use_memory_fallback = True
else:
    logger.info("USE_LOCAL_DB is enabled. Running with persistent local database engine.")


class InMemoryFirestoreStore:
    """
    Persistent, Firestore-compatible local store that enforces Firestore collection semantics,
    document IDs, filtering, sorting, and user-level isolation.
    Saves to disk so records survive container restarts during local development.
    """
    def __init__(self, storage_path: str = "data/local_storage.json"):
        self.storage_path = storage_path
        self._store: Dict[str, Dict[str, Dict[str, Any]]] = {
            USERS_COLLECTION: {},
            PEOPLE_COLLECTION: {},
            RELATIONSHIPS_COLLECTION: {},
            EVENTS_COLLECTION: {},
            CONTEXTS_COLLECTION: {},
            DECISIONS_COLLECTION: {},
            REFLECTIONS_COLLECTION: {},
            OUTCOMES_COLLECTION: {},
            SESSIONS_COLLECTION: {},
            PRIVACY_VAULT_COLLECTION: {},
        }
        self._load_from_disk()

    def _load_from_disk(self):
        try:
            if os.path.exists(self.storage_path):
                with open(self.storage_path, "r", encoding="utf-8") as f:
                    saved = json.load(f)
                    for col, docs in saved.items():
                        self._store[col] = docs
                logger.info(f"Loaded persistent local database from {self.storage_path}")
        except Exception as e:
            logger.warning(f"Could not read local database file ({e}). Starting clean.")

    def _save_to_disk(self):
        try:
            os.makedirs(os.path.dirname(self.storage_path), exist_ok=True)
            with open(self.storage_path, "w", encoding="utf-8") as f:
                json.dump(self._store, f, indent=2)
        except Exception as e:
            logger.debug(f"Could not persist local database to disk: {e}")

    def _ensure_col(self, col: str):
        if col not in self._store:
            self._store[col] = {}

    async def get_document(self, col: str, doc_id: str, user_id: str) -> Optional[Dict[str, Any]]:
        self._ensure_col(col)
        doc = self._store[col].get(doc_id)
        if not doc:
            return None
        # Strict user isolation check
        if doc.get("userId") != user_id:
            return None
        return doc.copy()

    async def set_document(self, col: str, doc_id: str, data: Dict[str, Any], user_id: str) -> Dict[str, Any]:
        self._ensure_col(col)
        now = datetime.now(timezone.utc).isoformat()
        record = {
            "id": doc_id,
            **data,
            "userId": user_id,
            "updatedAt": now
        }
        if "createdAt" not in record or not record["createdAt"]:
            record["createdAt"] = now
        self._store[col][doc_id] = record
        self._save_to_disk()
        return record.copy()

    async def add_document(self, col: str, data: Dict[str, Any], user_id: str) -> Dict[str, Any]:
        doc_id = str(uuid.uuid4())
        return await self.set_document(col, doc_id, data, user_id)

    async def update_document(self, col: str, doc_id: str, data: Dict[str, Any], user_id: str) -> Optional[Dict[str, Any]]:
        self._ensure_col(col)
        existing = await self.get_document(col, doc_id, user_id)
        if not existing:
            return None
        updated = {
            **existing,
            **data,
            "userId": user_id,
            "updatedAt": datetime.now(timezone.utc).isoformat()
        }
        self._store[col][doc_id] = updated
        self._save_to_disk()
        return updated.copy()

    async def delete_document(self, col: str, doc_id: str, user_id: str) -> bool:
        self._ensure_col(col)
        existing = await self.get_document(col, doc_id, user_id)
        if not existing:
            return False
        del self._store[col][doc_id]
        self._save_to_disk()
        return True

    async def query_documents(
        self,
        col: str,
        user_id: str,
        filters: Optional[Dict[str, Any]] = None,
        order_by: Optional[str] = None,
        descending: bool = False,
        limit: Optional[int] = None
    ) -> List[Dict[str, Any]]:
        self._ensure_col(col)
        docs = [d for d in self._store[col].values() if d.get("userId") == user_id]
        
        # Apply filters
        if filters:
            for key, val in filters.items():
                docs = [d for d in docs if d.get(key) == val]
        
        # Apply sorting
        if order_by:
            def sort_key(item):
                val = item.get(order_by)
                if val is None:
                    return ""
                return str(val)
            docs.sort(key=sort_key, reverse=descending)
        
        if limit and limit > 0:
            docs = docs[:limit]
            
        return [d.copy() for d in docs]


# Singleton persistent local store fallback
_in_memory_store = InMemoryFirestoreStore()


def _handle_firestore_error(e: Exception, operation: str):
    global _use_memory_fallback
    err_str = str(e)
    if any(k in err_str for k in ("does not exist", "SERVICE_DISABLED", "has not been used", "404")):
        if not _use_memory_fallback:
            _use_memory_fallback = True
            logger.warning(
                "Cloud Firestore database is not yet provisioned in project keeva-f2906. "
                "Switched seamlessly to persistent local storage (data/local_storage.json)."
            )
    else:
        logger.error(f"Firestore {operation} error: {e}, using local store")


class DatabaseService:
    @staticmethod
    async def get_doc(col: str, doc_id: str, user_id: str) -> Optional[Dict[str, Any]]:
        if _use_memory_fallback or _firestore_client is None:
            return await _in_memory_store.get_document(col, doc_id, user_id)
        try:
            doc_ref = _firestore_client.collection(col).document(doc_id)
            snapshot = doc_ref.get()
            if not snapshot.exists:
                return None
            data = snapshot.to_dict()
            if data.get("userId") != user_id:
                return None
            data["id"] = snapshot.id
            return data
        except Exception as e:
            _handle_firestore_error(e, "get_doc")
            return await _in_memory_store.get_document(col, doc_id, user_id)

    @staticmethod
    async def create_doc(col: str, data: Dict[str, Any], user_id: str, doc_id: Optional[str] = None) -> Dict[str, Any]:
        if doc_id is None:
            doc_id = str(uuid.uuid4())
        
        now = datetime.now(timezone.utc).isoformat()
        clean_data = {
            **data,
            "id": doc_id,
            "userId": user_id,
            "createdAt": data.get("createdAt") or now,
            "updatedAt": now
        }

        if _use_memory_fallback or _firestore_client is None:
            return await _in_memory_store.set_document(col, doc_id, clean_data, user_id)
        try:
            doc_ref = _firestore_client.collection(col).document(doc_id)
            doc_ref.set(clean_data)
            return clean_data
        except Exception as e:
            _handle_firestore_error(e, "create_doc")
            return await _in_memory_store.set_document(col, doc_id, clean_data, user_id)

    @staticmethod
    async def update_doc(col: str, doc_id: str, data: Dict[str, Any], user_id: str) -> Optional[Dict[str, Any]]:
        if _use_memory_fallback or _firestore_client is None:
            return await _in_memory_store.update_document(col, doc_id, data, user_id)
        try:
            doc_ref = _firestore_client.collection(col).document(doc_id)
            existing = doc_ref.get()
            if not existing.exists or existing.to_dict().get("userId") != user_id:
                return None
            update_data = {
                **data,
                "updatedAt": datetime.now(timezone.utc).isoformat()
            }
            doc_ref.update(update_data)
            updated = doc_ref.get().to_dict()
            updated["id"] = doc_id
            return updated
        except Exception as e:
            _handle_firestore_error(e, "update_doc")
            return await _in_memory_store.update_document(col, doc_id, data, user_id)

    @staticmethod
    async def delete_doc(col: str, doc_id: str, user_id: str) -> bool:
        if _use_memory_fallback or _firestore_client is None:
            return await _in_memory_store.delete_document(col, doc_id, user_id)
        try:
            doc_ref = _firestore_client.collection(col).document(doc_id)
            existing = doc_ref.get()
            if not existing.exists or existing.to_dict().get("userId") != user_id:
                return False
            doc_ref.delete()
            return True
        except Exception as e:
            _handle_firestore_error(e, "delete_doc")
            return await _in_memory_store.delete_document(col, doc_id, user_id)

    @staticmethod
    async def query_docs(
        col: str,
        user_id: str,
        filters: Optional[Dict[str, Any]] = None,
        order_by: Optional[str] = None,
        descending: bool = False,
        limit: Optional[int] = None
    ) -> List[Dict[str, Any]]:
        if _use_memory_fallback or _firestore_client is None:
            return await _in_memory_store.query_documents(col, user_id, filters, order_by, descending, limit)
        try:
            query = _firestore_client.collection(col).where("userId", "==", user_id)
            if filters:
                for k, v in filters.items():
                    query = query.where(k, "==", v)
            if order_by:
                query = query.order_by(
                    order_by,
                    direction=firestore.Query.DESCENDING if descending else firestore.Query.ASCENDING
                )
            if limit:
                query = query.limit(limit)
            
            docs = query.stream()
            results = []
            for d in docs:
                item = d.to_dict()
                item["id"] = d.id
                results.append(item)
            return results
        except Exception as e:
            _handle_firestore_error(e, "query_docs")
            return await _in_memory_store.query_documents(col, user_id, filters, order_by, descending, limit)
