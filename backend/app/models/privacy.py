from typing import Optional, List, Dict
from pydantic import BaseModel, Field


class PrivacyVaultSetupRequest(BaseModel):
    pinOrPassword: Optional[str] = Field(None, description="Secret PIN or master password to unlock the privacy vault")
    securityQuestion: Optional[str] = Field(None, description="Security question (e.g. 'What was your childhood nickname?')")
    securityAnswer: Optional[str] = Field(None, description="Answer to security question")
    defaultCategory: str = Field("countries", description="Default category: 'countries', 'fruits', 'animals', 'anime'")


class PrivacyVaultUnlockRequest(BaseModel):
    pinOrPassword: Optional[str] = None
    securityAnswer: Optional[str] = None


class PrivacyVaultStatusResponse(BaseModel):
    isConfigured: bool
    hasPin: bool
    hasSecurityQuestion: bool
    securityQuestionPrompt: Optional[str] = None
    defaultCategory: str = "countries"


class PresetCategoryOptionsResponse(BaseModel):
    categories: Dict[str, List[str]]


class AliasSuggestionResponse(BaseModel):
    category: str
    suggestedAlias: str
    allOptions: List[str]
