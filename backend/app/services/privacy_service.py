import hashlib
import logging
import random
from typing import Dict, List, Optional
from app.core.database import DatabaseService, PRIVACY_VAULT_COLLECTION, PEOPLE_COLLECTION

logger = logging.getLogger(__name__)
db = DatabaseService()

PRESET_CATEGORIES: Dict[str, List[str]] = {
    "countries": [
        "Japan", "Norway", "Brazil", "Iceland", "Canada", "Switzerland", 
        "New Zealand", "Kenya", "Ireland", "Greece", "Spain", "Singapore", 
        "Australia", "Egypt", "Sweden", "Italy", "Argentina", "Portugal", 
        "Denmark", "South Korea", "China", "India", "France", "Germany", 
        "Mexico", "Peru", "Chile", "Finland", "Thailand", "Morocco"
    ],
    "fruits": [
        "Mango", "Peach", "Apricot", "Blueberry", "Tangerine", "Fig", 
        "Papaya", "Lychee", "Kiwi", "Plum", "Cherry", "Persimmon", 
        "Pomegranate", "Coconut", "Dragonfruit", "Raspberry", "Avocado", 
        "Guava", "Grapefruit", "Melon", "Mulberry", "Starfruit", 
        "Passionfruit", "Kumquat", "Cranberry"
    ],
    "animals": [
        "Falcon", "Snow Leopard", "Otter", "Red Panda", "Arctic Fox", 
        "Panther", "Dolphin", "Wolf", "Phoenix", "Griffin", "Lynx", 
        "Cheetah", "Koala", "Tiger", "Eagle", "Seal", "Owl", 
        "Jaguar", "Hawk", "Raven", "Orca", "Badger", "Bison", "Elk", "Puma"
    ],
    "anime": [
        "Kakashi", "Levi", "Tanjiro", "Gojo", "Itachi", "Mikasa", 
        "Roy Mustang", "Killua", "Zoro", "Loid Forger", "Naruto", 
        "Eren", "Spike Spiegel", "Edward Elric", "Hinata", "Saitama", 
        "Light", "L", "Nezuko", "Anya", "Tanjuro", "Alucard", 
        "Ken Kaneki", "Deku", "Megumi"
    ]
}


def _hash_secret(value: str, salt: str) -> str:
    """Computes SHA-256 hash with salt for secure PIN or security question comparison."""
    norm = value.strip().lower()
    return hashlib.sha256(f"{salt}::{norm}".encode("utf-8")).hexdigest()


class PrivacyService:
    def get_categories(self) -> Dict[str, List[str]]:
        return PRESET_CATEGORIES

    async def get_vault(self, user_id: str) -> Optional[Dict]:
        return await db.get_doc(PRIVACY_VAULT_COLLECTION, f"vault_{user_id}", user_id=user_id)

    async def setup_vault(
        self,
        user_id: str,
        pin_or_password: Optional[str] = None,
        security_question: Optional[str] = None,
        security_answer: Optional[str] = None,
        default_category: str = "countries"
    ) -> Dict:
        vault_id = f"vault_{user_id}"
        existing = await self.get_vault(user_id) or {}
        
        salt = user_id
        update_data = {
            "userId": user_id,
            "defaultCategory": default_category,
        }

        if pin_or_password:
            update_data["hashedPin"] = _hash_secret(pin_or_password, salt)
        elif "hashedPin" in existing:
            update_data["hashedPin"] = existing["hashedPin"]

        if security_question and security_answer:
            update_data["securityQuestion"] = security_question.strip()
            update_data["hashedAnswer"] = _hash_secret(security_answer, salt)
        elif "securityQuestion" in existing:
            update_data["securityQuestion"] = existing["securityQuestion"]
            update_data["hashedAnswer"] = existing.get("hashedAnswer")

        if existing:
            return await db.update_doc(PRIVACY_VAULT_COLLECTION, vault_id, update_data, user_id=user_id)
        else:
            return await db.create_doc(PRIVACY_VAULT_COLLECTION, update_data, user_id=user_id, doc_id=vault_id)

    async def verify_credentials(
        self,
        user_id: str,
        pin_or_password: Optional[str] = None,
        security_answer: Optional[str] = None
    ) -> bool:
        vault = await self.get_vault(user_id)
        if not vault:
            # If no vault configured yet, default dev passphrase or allow instant setup
            if pin_or_password and pin_or_password in ("1234", "password", "secret"):
                return True
            return False

        salt = user_id

        # Check PIN / Master Password
        if pin_or_password and vault.get("hashedPin"):
            candidate_hash = _hash_secret(pin_or_password, salt)
            if candidate_hash == vault["hashedPin"]:
                return True

        # Check Security Question Answer
        if security_answer and vault.get("hashedAnswer"):
            candidate_hash = _hash_secret(security_answer, salt)
            if candidate_hash == vault["hashedAnswer"]:
                return True

        return False

    async def suggest_alias(self, user_id: str, category: str = "countries") -> str:
        cat = category.lower()
        options = PRESET_CATEGORIES.get(cat, PRESET_CATEGORIES["countries"])

        # Fetch existing people to avoid duplicate aliases for the same user
        people = await db.query_docs(PEOPLE_COLLECTION, user_id=user_id)
        used_aliases = {p.get("alias", "").lower() for p in people if p.get("alias")}

        available = [opt for opt in options if opt.lower() not in used_aliases]
        if available:
            return random.choice(available)
        
        # If all used, append a random number
        return f"{random.choice(options)}-{random.randint(2, 99)}"


privacy_service = PrivacyService()
