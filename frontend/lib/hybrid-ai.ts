/**
 * Firebase AI Logic & Hybrid Inference Layer
 * Orchestrates On-Device inference (Chrome Prompt API / window.ai / Gemini Nano)
 * with graceful fallback or strict adherence to Cloud Gemini backend inference.
 */

export type InferenceMode = "hybrid" | "on-device" | "cloud";

export interface HybridInferenceStatus {
  hasOnDeviceAI: boolean;
  modelState: "available" | "unavailable" | "downloading" | "cloud-fallback";
  details: string;
}

export interface DetailedLocalAIDiagnostic {
  hasPromptAPI: boolean;
  hasOptimizationGuideFlag: boolean;
  modelAvailability: "readily" | "after-download" | "no" | "unsupported";
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
  category: "browser_unsupported" | "flag_disabled" | "model_downloading" | "hardware_requirement" | "runtime_error" | "unknown";
  title: string;
  summary: string;
  technicalDetails: string;
  actionableSteps: ActionableStep[];
  canFallbackToCloud: boolean;
}

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

export async function detectHybridAICapabilities(): Promise<HybridInferenceStatus> {
  if (typeof window === "undefined") {
    return {
      hasOnDeviceAI: false,
      modelState: "cloud-fallback",
      details: "Server-side environment. Defaulting to Cloud Gemini inference."
    };
  }

  try {
    const win = window as any;
    const aiObj = win.ai || (typeof (globalThis as any).ai !== "undefined" ? (globalThis as any).ai : null);

    if (aiObj && aiObj.languageModel) {
      let availability = "no";

      if (typeof aiObj.languageModel.capabilities === "function") {
        const caps = await aiObj.languageModel.capabilities();
        availability = caps?.available || "no";
      } else if (typeof aiObj.languageModel.availability === "function") {
        availability = await aiObj.languageModel.availability();
      } else {
        availability = "readily";
      }

      if (availability === "readily" || availability === "available") {
        return {
          hasOnDeviceAI: true,
          modelState: "available",
          details: "On-Device Gemini Nano is active and ready. Local zero-latency processing enabled."
        };
      } else if (availability === "after-download" || availability === "downloading") {
        return {
          hasOnDeviceAI: true,
          modelState: "downloading",
          details: "Prompt API is enabled. Chrome is downloading Gemini Nano components (check chrome://components)."
        };
      }
    }
  } catch (err) {
    console.debug("On-device AI inspection:", err);
  }

  return {
    hasOnDeviceAI: false,
    modelState: "cloud-fallback",
    details: "On-device Prompt API not active. Cloud Gemini 2.5 Flash is actively handling all reasoning."
  };
}

export async function getDetailedLocalAIDiagnosis(): Promise<DetailedLocalAIDiagnostic> {
  if (typeof window === "undefined") {
    return {
      hasPromptAPI: false,
      hasOptimizationGuideFlag: false,
      modelAvailability: "unsupported",
      statusTitle: "Server Environment",
      errorMessage: "Browser APIs are not available on the server.",
      actionableSteps: []
    };
  }

  const win = window as any;
  const aiObj = win.ai || (typeof (globalThis as any).ai !== "undefined" ? (globalThis as any).ai : null);

  if (!aiObj || !aiObj.languageModel) {
    return {
      hasPromptAPI: false,
      hasOptimizationGuideFlag: false,
      modelAvailability: "unsupported",
      statusTitle: "Prompt API Not Available in Chrome Session",
      errorMessage: "The window.ai Prompt API was not detected in this browser tab.",
      actionableSteps: [
        "1. Open chrome://flags/#prompt-api and ensure it is set to 'Enabled'.",
        "2. Open chrome://flags/#optimization-guide-on-device-model and select 'Enabled BypassPerfRequirement'.",
        "3. Click the blue 'Relaunch' button at the bottom of Chrome to apply changes."
      ]
    };
  }

  try {
    let availability = "no";
    if (typeof aiObj.languageModel.capabilities === "function") {
      const caps = await aiObj.languageModel.capabilities();
      availability = caps?.available || "no";
    } else if (typeof aiObj.languageModel.availability === "function") {
      availability = await aiObj.languageModel.availability();
    } else {
      availability = "readily";
    }

    if (availability === "readily" || availability === "available") {
      return {
        hasPromptAPI: true,
        hasOptimizationGuideFlag: true,
        modelAvailability: "readily",
        statusTitle: "On-Device Gemini Nano Ready",
        actionableSteps: [
          "Local Gemini Nano weights are fully loaded into Chrome memory.",
          "Queries execute 100% locally on your machine with 0 network latency."
        ]
      };
    } else if (availability === "after-download" || availability === "downloading") {
      return {
        hasPromptAPI: true,
        hasOptimizationGuideFlag: true,
        modelAvailability: "after-download",
        statusTitle: "Model Weights Downloading in Chrome",
        errorMessage: "Chrome has not finished downloading the Gemini Nano model weights (~1.5 GB).",
        actionableSteps: [
          "1. Open a new tab and navigate to chrome://components",
          "2. Locate 'Optimization Guide On Device Model'.",
          "3. Click 'Check for update'. Keep Chrome open while the model downloads.",
          "4. Once status says 'Up-to-date', refresh this page."
        ]
      };
    } else {
      return {
        hasPromptAPI: true,
        hasOptimizationGuideFlag: false,
        modelAvailability: "no",
        statusTitle: "Hardware or GPU Requirement Not Met",
        errorMessage: "Chrome's built-in AI safety check blocked execution on this machine configuration.",
        actionableSteps: [
          "1. Open chrome://flags/#optimization-guide-on-device-model",
          "2. Make sure it is explicitly set to 'Enabled BypassPerfRequirement' (not just 'Enabled' or 'Default').",
          "3. Relaunch Chrome and re-check chrome://components."
        ]
      };
    }
  } catch (err: any) {
    return {
      hasPromptAPI: true,
      hasOptimizationGuideFlag: false,
      modelAvailability: "no",
      statusTitle: "API Inspection Failed",
      errorMessage: err?.message || String(err),
      actionableSteps: [
        "Ensure Chrome version is 128 or higher.",
        "Relaunch Chrome completely from task manager if flags were recently altered."
      ]
    };
  }
}

/**
 * Deep diagnostic analyzer: Pinpoints the exact reason why local execution failed
 * and provides formatted human-readable instructions and copyable links.
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

  const userAgent = navigator.userAgent;
  const isChrome = userAgent.includes("Chrome") && !userAgent.includes("Edg");

  // Check 1: Non-Chrome or outdated browser
  if (!isChrome) {
    return {
      category: "browser_unsupported",
      title: "Browser Does Not Support Local Prompt API",
      summary: "Chrome Built-in AI (Gemini Nano) is exclusive to Google Chrome (version 128 or higher).",
      technicalDetails: `Detected Browser User-Agent: ${userAgent.slice(0, 80)}...`,
      actionableSteps: [
        {
          step: 1,
          title: "Switch to Google Chrome",
          detail: "Open this application in Google Chrome 128+ to use on-device Gemini Nano."
        },
        {
          step: 2,
          title: "Or Use Cloud Gemini",
          detail: "Cloud Gemini 2.5 Flash works in all modern browsers without any special setup."
        }
      ],
      canFallbackToCloud: true
    };
  }

  const win = window as any;
  const aiObj = win.ai || (typeof (globalThis as any).ai !== "undefined" ? (globalThis as any).ai : null);

  // Check 2: Prompt API flag not enabled in Chrome
  if (!aiObj || !aiObj.languageModel) {
    return {
      category: "flag_disabled",
      title: "Prompt API Flag is Disabled in Chrome",
      summary: "The window.ai.languageModel interface is not exposed in this browser session.",
      technicalDetails: "window.ai is undefined. Chrome requires the experimental Prompt API flag to be explicitly turned on.",
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

  // Check 3: Check capabilities status
  try {
    let availability = "no";
    if (typeof aiObj.languageModel.capabilities === "function") {
      const caps = await aiObj.languageModel.capabilities();
      availability = caps?.available || "no";
    } else if (typeof aiObj.languageModel.availability === "function") {
      availability = await aiObj.languageModel.availability();
    } else {
      availability = "readily";
    }

    if (availability === "after-download" || availability === "downloading") {
      return {
        category: "model_downloading",
        title: "Gemini Nano Model Weights Not Downloaded (~1.5 GB)",
        summary: "Chrome has recognized the Prompt API, but the local Gemini Nano model file is still downloading or pending download.",
        technicalDetails: `ai.languageModel.capabilities().available === '${availability}'`,
        actionableSteps: [
          {
            step: 1,
            title: "Open Chrome Components Manager",
            detail: "Open a new tab and paste this URL into your address bar:",
            copyText: "chrome://components"
          },
          {
            step: 2,
            title: "Check for Model Update",
            detail: "Scroll down to 'Optimization Guide On Device Model' and click 'Check for update'."
          },
          {
            step: 3,
            title: "Wait for Download Completion",
            detail: "Keep Chrome open while the ~1.5 GB file downloads until status reads 'Up-to-date'."
          }
        ],
        canFallbackToCloud: true
      };
    }

    if (availability === "no") {
      return {
        category: "hardware_requirement",
        title: "Chrome Blocked Execution (Hardware Benchmark Not Met)",
        summary: "Chrome evaluated your system's GPU/RAM and blocked Gemini Nano by default to prevent slowdowns.",
        technicalDetails: "ai.languageModel.capabilities().available === 'no'. Chrome's built-in performance filter blocked execution.",
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
            detail: "Click 'Relaunch' to restart Chrome with the bypass flag active."
          },
          {
            step: 3,
            title: "Verify in Components",
            detail: "Visit chrome://components and verify 'Optimization Guide On Device Model' is downloaded."
          }
        ],
        canFallbackToCloud: true
      };
    }
  } catch (err: any) {
    console.debug("Capabilities inspection error:", err);
  }

  // Check 4: Runtime session creation or execution error
  return {
    category: "runtime_error",
    title: "Local Gemini Nano Runtime Error",
    summary: runtimeError || "Failed to initialize language model session or generate response.",
    technicalDetails: runtimeError || "Unknown exception thrown during ai.languageModel.create() or session.prompt().",
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
        detail: "Cloud Gemini 2.5 Flash handles arbitrarily large contexts without local memory limits."
      }
    ],
    canFallbackToCloud: true
  };
}

export async function attemptOnDeviceAnalysis(text: string): Promise<{ success: boolean; result?: string; error?: string; failureReport?: LocalAIFailureReport; source: string }> {
  if (typeof window === "undefined") {
    return { success: false, error: "Window undefined in SSR", source: "cloud-gemini" };
  }

  try {
    const win = window as any;
    const aiObj = win.ai || (typeof (globalThis as any).ai !== "undefined" ? (globalThis as any).ai : null);

    if (!aiObj || !aiObj.languageModel) {
      const diag = await diagnoseLocalAIFailure("Prompt API (window.ai.languageModel) is undefined.");
      return {
        success: false,
        error: diag.summary,
        failureReport: diag,
        source: "on-device-failed"
      };
    }

    const session = await aiObj.languageModel.create({
      systemPrompt: "You are an objective relationship observer. Note actions without psychological labels."
    });
    const response = await session.prompt(text);
    if (typeof session.destroy === "function") {
      session.destroy();
    }
    return { success: true, result: response, source: "on-device" };
  } catch (err: any) {
    console.debug("On-device execution error:", err);
    const diag = await diagnoseLocalAIFailure(err?.message || String(err));
    return {
      success: false,
      error: err?.message || "Failed to execute prompt with local Gemini Nano.",
      failureReport: diag,
      source: "on-device-failed"
    };
  }
}
