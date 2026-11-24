/**
 * Chrome Prompt API & Hybrid Inference Layer
 * Orchestrates On-Device inference using the standard Chrome Prompt API (LanguageModel)
 * with graceful fallback or strict adherence to Cloud Gemini backend inference.
 */

import {
  LanguageModelSession,
  LanguageModelStatic,
  LanguageModelCreateOptions
} from "@/types/prompt-api";

export type InferenceMode = "hybrid" | "on-device" | "cloud";

export interface HybridInferenceStatus {
  hasOnDeviceAI: boolean;
  modelState: "available" | "unavailable" | "downloading" | "downloadable" | "cloud-fallback";
  details: string;
}

export interface DetailedLocalAIDiagnostic {
  hasPromptAPI: boolean;
  modelAvailability: "readily" | "after-download" | "downloading" | "no" | "unsupported";
  statusTitle: string;
  errorMessage?: string;
  actionableSteps: string[];
}

export interface ActionableStep {
  step: number;
  title: string;
  detail: string;
  copyText?: string;
}

export interface LocalAIFailureReport {
  category:
    | "browser_unsupported"
    | "flag_disabled"
    | "model_downloading"
    | "model_downloadable"
    | "hardware_requirement"
    | "runtime_error"
    | "unknown";
  title: string;
  summary: string;
  technicalDetails: string;
  actionableSteps: ActionableStep[];
  canFallbackToCloud: boolean;
}

// ---------------- Preference Storage ----------------

export function getPreferredInferenceMode(): InferenceMode {
  if (typeof window === "undefined") return "hybrid";
  const stored = localStorage.getItem("keeva_inference_mode");
  if (stored === "on-device" || stored === "cloud" || stored === "hybrid") {
    return stored as InferenceMode;
  }
  return "hybrid";
}

export function setPreferredInferenceMode(mode: InferenceMode): void {
  if (typeof window !== "undefined") {
    localStorage.setItem("keeva_inference_mode", mode);
    window.dispatchEvent(new CustomEvent("keeva_inference_mode_changed", { detail: mode }));
  }
}

// ---------------- Prompt API Capability Detection ----------------

/**
 * Checks if the Chrome Prompt API (LanguageModel) is supported in the current environment.
 * Evaluates safely without server-side rendering crashes.
 */
export function isPromptAPISupported(): boolean {
  if (typeof window === "undefined" || typeof self === "undefined") {
    return false;
  }
  return (
    "LanguageModel" in self &&
    typeof (self as unknown as Record<string, unknown>).LanguageModel !== "undefined"
  );
}

/**
 * Retrieves the global LanguageModel object safely.
 */
export function getLanguageModelAPI(): LanguageModelStatic | null {
  if (!isPromptAPISupported()) {
    return null;
  }
  return (self as unknown as { LanguageModel: LanguageModelStatic }).LanguageModel;
}

// ---------------- Availability Detection ----------------

export type LocalModelAvailabilityState =
  | "ready"
  | "downloadable"
  | "downloading"
  | "unavailable"
  | "unsupported";

/**
 * Inspects the current availability of the local Gemini Nano model via LanguageModel.availability().
 * Correctly distinguishes between unsupported, unavailable, downloadable, downloading, and ready.
 */
export async function checkLocalModelAvailability(): Promise<LocalModelAvailabilityState> {
  const lm = getLanguageModelAPI();
  if (!lm) {
    return "unsupported";
  }

  try {
    let rawAvailability: string = "no";
    if (typeof lm.availability === "function") {
      rawAvailability = await lm.availability();
    } else if (typeof lm.capabilities === "function") {
      const caps = await lm.capabilities();
      rawAvailability = caps?.available || "no";
    }

    switch (rawAvailability) {
      case "readily":
      case "available":
        return "ready";
      case "after-download":
      case "downloadable":
        return "downloadable";
      case "downloading":
        return "downloading";
      case "no":
      case "unavailable":
      default:
        return "unavailable";
    }
  } catch (err) {
    console.warn("LanguageModel.availability() check error:", err);
    return "unavailable";
  }
}

/**
 * Detects overall hybrid AI capability for headers and navigation badges.
 */
export async function detectHybridAICapabilities(): Promise<HybridInferenceStatus> {
  if (typeof window === "undefined") {
    return {
      hasOnDeviceAI: false,
      modelState: "cloud-fallback",
      details: "Server-side environment. Defaulting to Cloud Gemini inference."
    };
  }

  const availability = await checkLocalModelAvailability();

  if (availability === "ready") {
    return {
      hasOnDeviceAI: true,
      modelState: "available",
      details: "On-Device Gemini Nano is active and ready. Local zero-latency processing enabled."
    };
  }

  if (availability === "downloadable") {
    return {
      hasOnDeviceAI: true,
      modelState: "downloadable",
      details: "Prompt API is active. Local AI model needs to be downloaded before running."
    };
  }

  if (availability === "downloading") {
    return {
      hasOnDeviceAI: true,
      modelState: "downloading",
      details: "Prompt API is active. Local AI model is currently downloading in Chrome."
    };
  }

  if (availability === "unavailable") {
    return {
      hasOnDeviceAI: false,
      modelState: "unavailable",
      details: "The Prompt API is available, but the local model isn't available on this device."
    };
  }

  return {
    hasOnDeviceAI: false,
    modelState: "cloud-fallback",
    details: "This browser does not expose the Chrome Prompt API. Cloud Gemini is handling all reasoning."
  };
}

/**
 * Retrieves detailed diagnosis for diagnostic dialogs and inspection views.
 */
export async function getDetailedLocalAIDiagnosis(): Promise<DetailedLocalAIDiagnostic> {
  if (typeof window === "undefined") {
    return {
      hasPromptAPI: false,
      modelAvailability: "unsupported",
      statusTitle: "Server Environment",
      errorMessage: "Browser APIs are not available on the server.",
      actionableSteps: []
    };
  }

  const lm = getLanguageModelAPI();
  if (!lm) {
    return {
      hasPromptAPI: false,
      modelAvailability: "unsupported",
      statusTitle: "Prompt API Unsupported",
      errorMessage: "This browser does not expose the Chrome Prompt API.",
      actionableSteps: [
        "1. Ensure you are using Google Chrome (version 128+ or Canary/Dev).",
        "2. Open chrome://flags/#prompt-api and ensure it is set to 'Enabled'.",
        "3. Open chrome://flags/#optimization-guide-on-device-model and select 'Enabled BypassPerfRequirement'.",
        "4. Relaunch Chrome to apply flag changes."
      ]
    };
  }

  const availability = await checkLocalModelAvailability();

  if (availability === "ready") {
    return {
      hasPromptAPI: true,
      modelAvailability: "readily",
      statusTitle: "Local AI is Ready",
      actionableSteps: [
        "Local Gemini Nano weights are loaded into Chrome memory.",
        "Queries execute 100% locally on your machine with 0 network latency."
      ]
    };
  }

  if (availability === "downloadable") {
    return {
      hasPromptAPI: true,
      modelAvailability: "after-download",
      statusTitle: "Local AI Model Needs to be Downloaded",
      errorMessage: "The local model needs to be downloaded before it can run.",
      actionableSteps: [
        "1. Click 'Run Local Prompt Test' to initiate the model download via Prompt API.",
        "2. Keep Chrome open while the model downloads (~1.5 GB).",
        "3. Alternatively, check chrome://components -> 'Optimization Guide On Device Model'."
      ]
    };
  }

  if (availability === "downloading") {
    return {
      hasPromptAPI: true,
      modelAvailability: "downloading",
      statusTitle: "Local AI Model is Downloading",
      errorMessage: "The local model is currently downloading.",
      actionableSteps: [
        "1. Chrome is downloading model components in the background.",
        "2. Monitor status in chrome://components under 'Optimization Guide On Device Model'.",
        "3. Once complete, local inference will become available automatically."
      ]
    };
  }

  return {
    hasPromptAPI: true,
    modelAvailability: "no",
    statusTitle: "Local Model Unavailable on this Device",
    errorMessage: "The Prompt API is available, but the local model isn't available on this device.",
    actionableSteps: [
      "1. Check chrome://flags/#optimization-guide-on-device-model and select 'Enabled BypassPerfRequirement'.",
      "2. Relaunch Chrome completely.",
      "3. If hardware requirements cannot be met, Cloud Gemini is available immediately."
    ]
  };
}

/**
 * Deep diagnostic analyzer: Pinpoints the exact reason why local execution failed
 * or is unavailable, differentiating clearly between all 6 states.
 */
export async function diagnoseLocalAIFailure(runtimeError?: string): Promise<LocalAIFailureReport> {
  if (typeof window === "undefined") {
    return {
      category: "unknown",
      title: "Server Environment",
      summary: "Cannot run client-side model in server rendering context.",
      technicalDetails: "Window object not found.",
      actionableSteps: [],
      canFallbackToCloud: true
    };
  }

  // Check 1: Prompt API capability detection
  if (!isPromptAPISupported()) {
    const userAgent = navigator.userAgent;
    const isChrome = userAgent.includes("Chrome") && !userAgent.includes("Edg");

    if (!isChrome) {
      return {
        category: "browser_unsupported",
        title: "Browser Does Not Support Chrome Prompt API",
        summary: "This browser does not expose the Chrome Prompt API.",
        technicalDetails: `Detected Browser User-Agent: ${userAgent.slice(0, 80)}... ("LanguageModel" in self === false)`,
        actionableSteps: [
          {
            step: 1,
            title: "Switch to Google Chrome",
            detail: "Open this application in Google Chrome 128+ to use on-device Gemini Nano."
          },
          {
            step: 2,
            title: "Use Cloud Gemini",
            detail: "Cloud Gemini 2.5 Flash works in all modern browsers without any setup."
          }
        ],
        canFallbackToCloud: true
      };
    }

    return {
      category: "flag_disabled",
      title: "Prompt API Interface Not Exposed",
      summary: "This browser session does not expose the Chrome Prompt API.",
      technicalDetails: `LanguageModel is undefined in self ("LanguageModel" in self === false).`,
      actionableSteps: [
        {
          step: 1,
          title: "Enable the Prompt API Flag",
          detail: "Open a new tab, paste the link below, and change it to 'Enabled':",
          copyText: "chrome://flags/#prompt-api"
        },
        {
          step: 2,
          title: "Enable On-Device Model Bypass",
          detail: "Open this companion flag and set it to 'Enabled BypassPerfRequirement':",
          copyText: "chrome://flags/#optimization-guide-on-device-model"
        },
        {
          step: 3,
          title: "Relaunch Chrome",
          detail: "Click the blue 'Relaunch' button at the bottom-right of the flags page to apply changes."
        }
      ],
      canFallbackToCloud: true
    };
  }

  // Check 2: Model availability state
  const availability = await checkLocalModelAvailability();

  if (availability === "downloadable") {
    return {
      category: "model_downloadable",
      title: "Local AI Model Needs to be Downloaded",
      summary: "The local model needs to be downloaded before it can run.",
      technicalDetails: "LanguageModel.availability() returned 'after-download'.",
      actionableSteps: [
        {
          step: 1,
          title: "Trigger Model Download",
          detail: "Click 'Run Local Prompt Test' to start the download via LanguageModel.create()."
        },
        {
          step: 2,
          title: "Check Components in Chrome",
          detail: "Navigate to chrome://components, locate 'Optimization Guide On Device Model', and verify status.",
          copyText: "chrome://components"
        },
        {
          step: 3,
          title: "Keep Chrome Open",
          detail: "Allow Chrome a few minutes to finish downloading the ~1.5 GB model file."
        }
      ],
      canFallbackToCloud: true
    };
  }

  if (availability === "downloading") {
    return {
      category: "model_downloading",
      title: "Local AI Model is Downloading...",
      summary: "The local model is currently downloading.",
      technicalDetails: "LanguageModel.availability() returned 'downloading'.",
      actionableSteps: [
        {
          step: 1,
          title: "Wait for Download Completion",
          detail: "Chrome is downloading the Gemini Nano components. Keep the browser open."
        },
        {
          step: 2,
          title: "Monitor in Chrome Components",
          detail: "Check chrome://components to watch download progress.",
          copyText: "chrome://components"
        }
      ],
      canFallbackToCloud: true
    };
  }

  if (availability === "unavailable") {
    return {
      category: "hardware_requirement",
      title: "Local Model Unavailable on this Device",
      summary: "The Prompt API is available, but the local model isn't available on this device.",
      technicalDetails: "LanguageModel.availability() returned 'no'. Chrome blocked execution based on hardware checks.",
      actionableSteps: [
        {
          step: 1,
          title: "Bypass the Performance Filter",
          detail: "Go to this flag and set it to 'Enabled BypassPerfRequirement':",
          copyText: "chrome://flags/#optimization-guide-on-device-model"
        },
        {
          step: 2,
          title: "Relaunch Chrome",
          detail: "Click 'Relaunch' to restart Chrome with the bypass active."
        },
        {
          step: 3,
          title: "Use Cloud Gemini Fallback",
          detail: "Cloud Gemini 2.5 Flash works without local GPU or memory limits."
        }
      ],
      canFallbackToCloud: true
    };
  }

  // Check 3: Runtime execution error
  return {
    category: "runtime_error",
    title: "Local Inference Runtime Error",
    summary: runtimeError || "Local inference failed. Cloud Gemini fallback is available.",
    technicalDetails: runtimeError || "Exception thrown during LanguageModel.create() or session.prompt().",
    actionableSteps: [
      {
        step: 1,
        title: "Test with a Shorter Prompt",
        detail: "Very long inputs can exceed Gemini Nano's local context window."
      },
      {
        step: 2,
        title: "Restart Chrome Browser",
        detail: "Close and re-open Chrome to free up allocated GPU memory."
      },
      {
        step: 3,
        title: "Switch to Cloud Gemini",
        detail: "Cloud Gemini 2.5 Flash handles large contexts without local memory limits."
      }
    ],
    canFallbackToCloud: true
  };
}

// ---------------- Local Prompt Execution & Cleanup ----------------

export interface LocalPromptExecutionResult {
  success: boolean;
  result?: string;
  error?: string;
  failureReport?: LocalAIFailureReport;
  source: string;
  status: LocalModelAvailabilityState;
  downloadProgress?: number;
}

/**
 * Executes a prompt on-device using the standard LanguageModel API.
 * Properly manages session creation, execution, and cleanup using try/finally.
 */
export async function attemptOnDeviceAnalysis(
  text: string,
  options?: {
    systemPrompt?: string;
    onDownloadProgress?: (percent: number) => void;
  }
): Promise<LocalPromptExecutionResult> {
  if (typeof window === "undefined") {
    return {
      success: false,
      error: "Window undefined in SSR",
      source: "cloud-gemini",
      status: "unsupported"
    };
  }

  const lm = getLanguageModelAPI();
  if (!lm) {
    const diag = await diagnoseLocalAIFailure("This browser does not expose the Chrome Prompt API.");
    return {
      success: false,
      error: diag.summary,
      failureReport: diag,
      source: "on-device-failed",
      status: "unsupported"
    };
  }

  const availability = await checkLocalModelAvailability();

  if (availability === "unsupported") {
    const diag = await diagnoseLocalAIFailure("This browser does not expose the Chrome Prompt API.");
    return {
      success: false,
      error: diag.summary,
      failureReport: diag,
      source: "on-device-failed",
      status: "unsupported"
    };
  }

  if (availability === "unavailable") {
    const diag = await diagnoseLocalAIFailure("The Prompt API is available, but the local model isn't available on this device.");
    return {
      success: false,
      error: diag.summary,
      failureReport: diag,
      source: "on-device-failed",
      status: "unavailable"
    };
  }

  if (availability === "downloading") {
    const diag = await diagnoseLocalAIFailure("The local model is currently downloading.");
    return {
      success: false,
      error: "The local model is currently downloading.",
      failureReport: diag,
      source: "on-device-downloading",
      status: "downloading"
    };
  }

  // Create session and execute with strict try/finally cleanup
  let session: LanguageModelSession | null = null;
  try {
    const createOptions: LanguageModelCreateOptions = {
      systemPrompt:
        options?.systemPrompt ||
        "You are an objective relationship observer. Note actions without psychological labels."
    };

    if (options?.onDownloadProgress) {
      createOptions.monitor = (monitor: EventTarget) => {
        if (monitor && typeof monitor.addEventListener === "function") {
          monitor.addEventListener("downloadprogress", (e: Event) => {
            const progressEvent = e as unknown as { loaded?: number; total?: number };
            if (
              typeof progressEvent.loaded === "number" &&
              typeof progressEvent.total === "number" &&
              progressEvent.total > 0
            ) {
              const pct = Math.round((progressEvent.loaded / progressEvent.total) * 100);
              options.onDownloadProgress?.(pct);
            }
          });
        }
      };
    }

    session = await lm.create(createOptions);
    const response = await session.prompt(text);

    return {
      success: true,
      result: response,
      source: "on-device",
      status: "ready"
    };
  } catch (err: unknown) {
    const errMsg = err instanceof Error ? err.message : String(err);
    console.debug("On-device LanguageModel execution error:", err);
    const diag = await diagnoseLocalAIFailure(errMsg);
    return {
      success: false,
      error: errMsg || "Local inference failed. Cloud Gemini fallback is available.",
      failureReport: diag,
      source: "on-device-failed",
      status: availability === "downloadable" ? "downloadable" : "unavailable"
    };
  } finally {
    if (session && typeof session.destroy === "function") {
      try {
        session.destroy();
      } catch (destroyErr) {
        console.warn("Error destroying LanguageModel session:", destroyErr);
      }
    }
  }
}
