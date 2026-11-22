# Hybrid AI Inference & On-Device Prompt API

## Overview
Relationship Intelligence AI implements a **Dual-Tier Hybrid AI Architecture** combining client-side on-device intelligence with Google Cloud Gemini models:

1. **Tier 1 (Client-Side)**: Chrome Built-in Prompt API powered by Gemini Nano (`window.ai`). Provides offline, zero-network-latency processing where sensitive relationship reflections never leave the user's browser.
2. **Tier 2 (Cloud)**: Google Gemini 2.5 Flash running via Firebase AI Logic / FastAPI backend. Handles deep reasoning, multi-branch consequence simulation, and full multi-turn conversational synthesis.

---

## 3 Inference Preferences

Users have explicit control over their inference routing:

| Mode | Identifier | Description | Privacy Guarantee |
| :--- | :--- | :--- | :--- |
| **⚡ Auto (Hybrid)** | `"hybrid"` | *Default & Recommended*. Attempts on-device Gemini Nano first; seamlessly falls back to Cloud Gemini if local model is downloading, disabled, or unavailable. | Client-side when ready, encrypted TLS to Cloud Gemini otherwise. |
| **💻 On-Device Only** | `"on-device"` | Strict local execution. Prompts never leave the local machine. If the local model is not ready, halts with an actionable diagnostic report. | 100% On-Device. 0 network calls with prompt text. |
| **☁️ Cloud Gemini Only** | `"cloud"` | Direct cloud execution via Gemini 2.5 Flash. Bypasses client-side checks for maximum speed and comprehensive reasoning. | Encrypted TLS to Cloud Gemini backend. |

---

## Chrome Built-in AI (Gemini Nano) Setup

To enable local on-device execution in Google Chrome (version 128 or higher):

### Step 1: Enable Prompt API Flag
1. Open a new tab and paste:
   ```text
   chrome://flags/#prompt-api
   ```
2. Set the dropdown to **`Enabled`**.

### Step 2: Bypass Hardware / GPU Filter (Crucial for Most Laptops)
Chrome blocks on-device Gemini Nano by default on many machines if RAM or GPU benchmarks do not meet aggressive thresholds:
1. Open a new tab and paste:
   ```text
   chrome://flags/#optimization-guide-on-device-model
   ```
2. Change the dropdown from `Default` or `Enabled` to:
   ```text
   Enabled BypassPerfRequirement
   ```

### Step 3: Relaunch Chrome
Click the blue **"Relaunch"** button at the bottom right of the flags page to restart the browser.

### Step 4: Verify Component Download (~1.5 GB)
1. Open a new tab and navigate to:
   ```text
   chrome://components
   ```
2. Locate **Optimization Guide On Device Model**.
3. Click **"Check for update"**.
4. Leave Chrome open until the status reads **"Up-to-date"** (this downloads ~1.5 GB of model weights).

---

## Failure Diagnostics & Automatic Recovery

When on-device execution is requested but cannot proceed, `diagnoseLocalAIFailure` in `frontend/lib/hybrid-ai.ts` analyzes `window.ai` and returns a structured `LocalAIFailureReport`:

```typescript
export interface LocalAIFailureReport {
  category: "browser_unsupported" | "flag_disabled" | "model_downloading" | "hardware_requirement" | "runtime_error" | "unknown";
  title: string;
  summary: string;
  technicalDetails: string;
  actionableSteps: ActionableStep[];
  canFallbackToCloud: boolean;
}
```

### Categorized Failure States:

| Category | Cause | Actionable Resolution |
| :--- | :--- | :--- |
| `flag_disabled` | `window.ai` is undefined. | Open `chrome://flags/#prompt-api` and set to `Enabled`. |
| `model_downloading` | `capabilities().available === 'after-download'`. | Open `chrome://components` and click *Check for update* on *Optimization Guide*. |
| `hardware_requirement` | `capabilities().available === 'no'`. | Open `chrome://flags/#optimization-guide-on-device-model` and set to `Enabled BypassPerfRequirement`. |
| `browser_unsupported` | Browser is Firefox, Safari, Edge, or Chrome < 128. | Switch to Google Chrome 128+, or click *Switch to Cloud Gemini*. |

---

## 1-Click Fallback (`LocalAIErrorCard`)

Whenever a local AI failure occurs in the `/agent` chat or diagnostic modal, Keeva renders the **`LocalAIErrorCard`**:
- Shows the exact failure badge.
- Provides 1-click **Copy Link** buttons for internal `chrome://` URLs.
- Provides a **"Switch to Cloud Gemini & Proceed"** button that:
  1. Instantly changes the user's inference preference to Cloud Gemini.
  2. Automatically resubmits the pending message so the user never has to retype their prompt.
