# Steganographic Privacy & Shoulder-Surfer Cloaking Vault

## Overview
Relationship Intelligence AI operates on sensitive interpersonal memories, conflict histories, and longitudinal dynamics. When using the application in public environments (e.g., coffee shops, open offices, commuter transit, co-working spaces), passersby or "shoulder-surfers" glancing at the screen might see real names (e.g., *"elon"*, *"mark"*, *"bill"*, *"sundhar"*), compromising user confidentiality.

The **Steganographic Privacy & Shoulder-Surfer Cloaking Vault** solves this problem by masking real identities behind plausible, innocuous codenames across predefined or custom categories.

---

## Threat Model & Core Assumptions

| Threat | Description | Mitigation |
| :--- | :--- | :--- |
| **Shoulder-Surfing** | An onlooker glances at the screen and reads names of friends, family, or colleagues. | Real names are replaced everywhere on screen with innocent codenames (e.g., *China*, *Mango*, *Penguin*, *Goku*). |
| **Unattended Screen** | User steps away from their laptop while the app is open. | Cloaked by default. An onlooker cannot infer real identities without entering the Master PIN or Security Question answer. |
| **Data Scraping / Leaks** | Unauthorized UI export or screenshot. | Screen captures show only the codenames. |

---

## How It Works

```mermaid
flowchart TD
    subgraph UI ["User Interface Layer"]
        Input["User adds Person: 'Bharath'"]
        CatSelect["Selects Category (e.g. Countries)"]
        GenCodename["Assigned Codename: 'China'"]
        Render["UI Renders: 'China (Friend)'"]
    end

    subgraph Vault ["Privacy & Encryption Vault"]
        MasterPIN["Master PIN / Password / Security Question"]
        HashedVault[("Encrypted Vault Storage (Firestore)")]
        UnlockReq["User enters PIN / Security Answer"]
        Verify["Verify Credentials (SHA-256 / PBKDF2)"]
    end

    Input --> CatSelect
    CatSelect --> GenCodename
    GenCodename --> Render

    Render -.->|Locked State (Default)| Render
    UnlockReq --> Verify
    Verify -->|Valid| UnlockedState["Temporarily Reveals Real Names in UI"]
    Verify -->|Invalid| Error["401 Unauthorized: Incorrect Credentials"]
```

---

## Preset Categories & Codenames

The system provides 4 built-in categorized presets, plus a custom alias option:

1. **🌍 Countries**:
   `China`, `Japan`, `Norway`, `Brazil`, `Iceland`, `Canada`, `Switzerland`, `New Zealand`, `Kenya`, `Ireland`, `Greece`, `Spain`, `Singapore`, `Australia`, `Egypt`, `Sweden`, `Italy`, `Argentina`
2. **🍎 Fruits**:
   `Mango`, `Kiwi`, `Papaya`, `Avocado`, `Peach`, `Cherry`, `Fig`, `Plum`, `Apricot`, `Blueberry`, `Guava`, `Pomegranate`
3. **🐾 Animals**:
   `Falcon`, `Otter`, `Fox`, `Panda`, `Koala`, `Dolphin`, `Lynx`, `Cheetah`, `Penguin`, `Owl`, `Hedgehog`, `Seal`
4. **⚔️ Anime Characters**:
   `Goku`, `Luffy`, `Naruto`, `Levi`, `Zoro`, `Tanjiro`, `Gojo`, `Killua`, `Itachi`, `Eren`, `Spike`, `Edward`
5. **✏️ Custom**:
   Any custom pseudonym or codename specified by the user.

---

## Backend REST Endpoints

All privacy endpoints are located under `/api/privacy` and require Firebase ID token authentication:

### 1. `GET /api/privacy/vault/status`
Returns whether the vault is configured, whether a PIN or security question is active, and the prompt text.
```json
{
  "isConfigured": true,
  "hasPin": true,
  "hasSecurityQuestion": true,
  "securityQuestionPrompt": "What was the name of your first elementary school?",
  "defaultCategory": "countries"
}
```

### 2. `POST /api/privacy/vault/setup`
Configures or updates Master PIN/password and security question/answer:
```json
{
  "pinOrPassword": "1234",
  "securityQuestion": "What was your childhood pet's name?",
  "securityAnswer": "Shadow",
  "defaultCategory": "countries"
}
```

### 3. `POST /api/privacy/vault/unlock`
Verifies user credentials to unlock real names for the current session:
```json
{
  "pinOrPassword": "1234"
}
```

### 4. `GET /api/privacy/presets`
Returns all available preset categories and their complete lists of codenames.

### 5. `GET /api/privacy/suggest-alias?category={category}`
Generates a random suggested codename and provides the complete options list for rapid chip selection.

---

## Frontend Integration (`PrivacyContext`)

The `PrivacyContext` (`frontend/context/PrivacyContext.tsx`) provides seamless client-side name resolution:

```tsx
const { resolveName, isLocked, openModal, setLocked } = usePrivacy();

// Resolves to 'China' if locked, or 'Bharath' if unlocked
<h1>{resolveName(person)}</h1>
```

- **Two-Pass Client Mounting**: Avoids SSR hydration mismatches by ensuring consistent placeholders before client `localStorage`/`sessionStorage` reconciliation.
- **Privacy Shield Modal**: Rendered via `createPortal(..., document.body)` with auto-focusing PIN input, category switcher, and 1-click codename randomizer.
