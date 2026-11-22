import logging
from typing import Dict, List, Optional
from fastapi import APIRouter, Depends, HTTPException, status
from app.api.deps import get_current_user
from app.services.privacy_service import privacy_service
from app.models.privacy import (
    PrivacyVaultSetupRequest,
    PrivacyVaultUnlockRequest,
    PrivacyVaultStatusResponse,
    PresetCategoryOptionsResponse,
    AliasSuggestionResponse
)

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/privacy", tags=["privacy_encryption"])


@router.get("/vault/status", response_model=PrivacyVaultStatusResponse)
async def get_vault_status(user: dict = Depends(get_current_user)):
    """Retrieves vault configuration status and security question prompt."""
    user_id = user["uid"]
    vault = await privacy_service.get_vault(user_id)
    if not vault:
        return PrivacyVaultStatusResponse(
            isConfigured=False,
            hasPin=False,
            hasSecurityQuestion=False,
            securityQuestionPrompt=None,
            defaultCategory="countries"
        )
    return PrivacyVaultStatusResponse(
        isConfigured=True,
        hasPin=bool(vault.get("hashedPin")),
        hasSecurityQuestion=bool(vault.get("securityQuestion")),
        securityQuestionPrompt=vault.get("securityQuestion"),
        defaultCategory=vault.get("defaultCategory", "countries")
    )


@router.post("/vault/setup", status_code=status.HTTP_200_OK)
async def setup_vault(
    payload: PrivacyVaultSetupRequest,
    user: dict = Depends(get_current_user)
):
    """Sets or updates the Master PIN, Password, or Security Question."""
    user_id = user["uid"]
    if not payload.pinOrPassword and not (payload.securityQuestion and payload.securityAnswer):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Must provide either a PIN/Password or both a Security Question and Answer."
        )

    await privacy_service.setup_vault(
        user_id=user_id,
        pin_or_password=payload.pinOrPassword,
        security_question=payload.securityQuestion,
        security_answer=payload.securityAnswer,
        default_category=payload.defaultCategory
    )
    return {"status": "success", "message": "Privacy Vault updated successfully"}


@router.post("/vault/unlock")
async def unlock_vault(
    payload: PrivacyVaultUnlockRequest,
    user: dict = Depends(get_current_user)
):
    """Verifies PIN/Password or Security Question answer to unlock real identities."""
    user_id = user["uid"]
    if not payload.pinOrPassword and not payload.securityAnswer:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Provide either PIN/password or security answer."
        )

    is_valid = await privacy_service.verify_credentials(
        user_id=user_id,
        pin_or_password=payload.pinOrPassword,
        security_answer=payload.securityAnswer
    )

    if not is_valid:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect PIN, password, or security answer."
        )

    return {
        "status": "unlocked",
        "message": "Vault successfully unlocked. Real identities revealed."
    }


@router.get("/presets", response_model=PresetCategoryOptionsResponse)
async def get_presets():
    """Returns preset categories (countries, fruits, animals, anime) and available codenames."""
    return PresetCategoryOptionsResponse(categories=privacy_service.get_categories())


@router.get("/suggest-alias", response_model=AliasSuggestionResponse)
async def suggest_alias(
    category: str = "countries",
    user: dict = Depends(get_current_user)
):
    """Suggests an unused codename from the chosen category."""
    user_id = user["uid"]
    cat = category.lower()
    all_cats = privacy_service.get_categories()
    if cat not in all_cats:
        cat = "countries"
    
    suggested = await privacy_service.suggest_alias(user_id=user_id, category=cat)
    return AliasSuggestionResponse(
        category=cat,
        suggestedAlias=suggested,
        allOptions=all_cats[cat]
    )
