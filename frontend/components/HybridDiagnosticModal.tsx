"use client";

import React, { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import {
  X,
  Cpu,
  Cloud,
  Activity,
  RefreshCw,
  Loader2,
  Database,
  Zap,
  CheckCircle2,
  AlertTriangle,
  Check,
  Sliders,
  AlertCircle,
  DownloadCloud
} from "lucide-react";
import {
  attemptOnDeviceAnalysis,
  getDetailedLocalAIDiagnosis,
  diagnoseLocalAIFailure,
  getPreferredInferenceMode,
  setPreferredInferenceMode,
  InferenceMode,
  DetailedLocalAIDiagnostic,
  LocalAIFailureReport,
  DownloadProgressInfo,
  triggerModelDownload
} from "@/lib/hybrid-ai";
import { LocalAIErrorCard } from "./LocalAIErrorCard";
import { ModelDownloadProgress } from "./ModelDownloadProgress";
import { getAIDiagnostics } from "@/lib/api";

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onModeChanged?: (mode: InferenceMode) => void;
}

interface CloudDiagnostic {
  status?: string;
  cloudGemini?: {
    status?: string;
    targetModel?: string;
    latencyMs?: number;
  };
  memoryEngine?: {
    projectId?: string;
  };
  error?: string;
}

export const HybridDiagnosticModal: React.FC<Props> = ({ isOpen, onClose, onModeChanged }) => {
  const [mounted, setMounted] = useState(false);
  const [mode, setMode] = useState<InferenceMode>("hybrid");
  const [detailedDiag, setDetailedDiag] = useState<DetailedLocalAIDiagnostic | null>(null);
  const [cloudDiag, setCloudDiag] = useState<CloudDiagnostic | null>(null);
  const [testingLocal, setTestingLocal] = useState(false);
  const [localTestResult, setLocalTestResult] = useState<{
    success: boolean;
    status: "ready" | "downloadable" | "downloading" | "unavailable" | "unsupported";
    text: string;
  } | null>(null);
  const [downloadProgress, setDownloadProgress] = useState<number | null>(null);
  const [downloadBytes, setDownloadBytes] = useState<{ loaded?: number; total?: number } | null>(null);
  const [isDownloadingModel, setIsDownloadingModel] = useState(false);
  const [localFailureReport, setLocalFailureReport] = useState<LocalAIFailureReport | null>(null);
  const [loadingCloud, setLoadingCloud] = useState(false);

  useEffect(() => {
    setMounted(true);
    setMode(getPreferredInferenceMode());

    const progressHandler = (e: Event) => {
      const customEvent = e as CustomEvent<DownloadProgressInfo>;
      if (customEvent.detail) {
        setDownloadProgress(customEvent.detail.percent);
        setDownloadBytes({
          loaded: customEvent.detail.loadedBytes,
          total: customEvent.detail.totalBytes
        });
        if (customEvent.detail.isComplete) {
          setIsDownloadingModel(false);
          getDetailedLocalAIDiagnosis().then(setDetailedDiag);
        }
      }
    };
    window.addEventListener("keeva_model_download_progress", progressHandler);
    return () => window.removeEventListener("keeva_model_download_progress", progressHandler);
  }, []);

  const handleSelectMode = (newMode: InferenceMode) => {
    setMode(newMode);
    setPreferredInferenceMode(newMode);
    if (onModeChanged) onModeChanged(newMode);
  };

  const runAllChecks = async () => {
    setLoadingCloud(true);
    setLocalTestResult(null);

    // 1. Check Local On-Device AI
    const detailed = await getDetailedLocalAIDiagnosis();
    setDetailedDiag(detailed);
    if (detailed.modelAvailability !== "readily") {
      const report = await diagnoseLocalAIFailure(detailed.errorMessage);
      setLocalFailureReport(report);
    } else {
      setLocalFailureReport(null);
    }

    // 2. Check Cloud Gemini & Firebase
    try {
      const cloud = await getAIDiagnostics();
      setCloudDiag(cloud);
    } catch (err: unknown) {
      const errMsg = err instanceof Error ? err.message : String(err);
      setCloudDiag({
        status: "error",
        error: errMsg || "Failed to reach backend diagnostic endpoint."
      });
    } finally {
      setLoadingCloud(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      setMode(getPreferredInferenceMode());
      runAllChecks();
    }
  }, [isOpen]);

  // Escape key & body scroll lock
  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", handleKeyDown);
    const origOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    return () => {
      window.removeEventListener("keydown", handleKeyDown);
      document.body.style.overflow = origOverflow;
    };
  }, [isOpen, onClose]);

  const handleStartDownload = async () => {
    setIsDownloadingModel(true);
    try {
      await triggerModelDownload((info) => {
        setDownloadProgress(info.percent);
        setDownloadBytes({ loaded: info.loadedBytes, total: info.totalBytes });
      });
      runAllChecks();
    } catch (err) {
      console.warn("Download initiation error:", err);
    } finally {
      setIsDownloadingModel(false);
    }
  };

  const handleTestLocalPrompt = async () => {
    setTestingLocal(true);
    setLocalTestResult(null);
    setLocalFailureReport(null);
    setDownloadProgress(null);
    setDownloadBytes(null);
    try {
      const res = await attemptOnDeviceAnalysis(
        "Brief test: Analyze tone of 'We had an honest talk and resolved the tension.'",
        {
          onDownloadProgress: (pct, loaded, total) => {
            setDownloadProgress(pct);
            setDownloadBytes({ loaded, total });
          }
        }
      );

      if (res.success) {
        setLocalTestResult({
          success: true,
          status: "ready",
          text: `✓ On-device AI detected\n✓ Local model ready\n\nTest response: "${res.result}"`
        });
        setLocalFailureReport(null);
      } else if (res.status === "downloadable") {
        setLocalTestResult({
          success: false,
          status: "downloadable",
          text: "✓ Browser AI supported\n↓ Local AI model needs to be downloaded before it can run."
        });
        if (res.failureReport) {
          setLocalFailureReport(res.failureReport);
        } else {
          const report = await diagnoseLocalAIFailure("The local model needs to be downloaded before it can run.");
          setLocalFailureReport(report);
        }
      } else if (res.status === "downloading") {
        setLocalTestResult({
          success: false,
          status: "downloading",
          text: `✓ Browser AI supported\n⟳ Local AI model is currently downloading${downloadProgress !== null ? ` (${downloadProgress}%)` : ""}.`
        });
        if (res.failureReport) {
          setLocalFailureReport(res.failureReport);
        } else {
          const report = await diagnoseLocalAIFailure("The local model is currently downloading.");
          setLocalFailureReport(report);
        }
      } else if (res.status === "unavailable") {
        setLocalTestResult({
          success: false,
          status: "unavailable",
          text: "✓ Browser AI supported\n✗ On-device AI is not available on this device."
        });
        if (res.failureReport) {
          setLocalFailureReport(res.failureReport);
        } else {
          const report = await diagnoseLocalAIFailure(res.error || "The local model isn't available on this device.");
          setLocalFailureReport(report);
        }
      } else {
        setLocalTestResult({
          success: false,
          status: "unsupported",
          text: "✗ On-device AI is not supported in this browser."
        });
        if (res.failureReport) {
          setLocalFailureReport(res.failureReport);
        } else {
          const report = await diagnoseLocalAIFailure(res.error || "On-device AI unavailable.");
          setLocalFailureReport(report);
        }
      }
    } catch (e: unknown) {
      const errorMsg = e instanceof Error ? e.message : String(e);
      const report = await diagnoseLocalAIFailure(errorMsg);
      setLocalFailureReport(report);
      setLocalTestResult({
        success: false,
        status: "unavailable",
        text: "Execution failed: " + errorMsg
      });
    } finally {
      setTestingLocal(false);
      getDetailedLocalAIDiagnosis().then(setDetailedDiag);
    }
  };

  if (!isOpen || !mounted) return null;

  const modalContent = (
    <div
      className="fixed inset-0 z-[9999] flex items-center justify-center p-3 sm:p-5 bg-stone-950/65 backdrop-blur-xs animate-fade-in"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        className="bg-white rounded-3xl max-w-xl w-full shadow-2xl border border-stone-200/90 flex flex-col max-h-[88vh] overflow-hidden animate-modal-pop"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header (Fixed - shrink-0) */}
        <div className="shrink-0 flex items-center justify-between px-6 py-4 border-b border-stone-100 bg-stone-50/60">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-2xl bg-stone-900 text-stone-100 flex items-center justify-center shadow-xs">
              <Activity className="w-5 h-5 text-amber-300" />
            </div>
            <div>
              <h3 className="font-bold text-stone-900 text-base leading-tight">
                AI Mode &amp; Connection Settings
              </h3>
              <p className="text-xs text-stone-500 mt-0.5">
                Choose between On-Device AI or Cloud AI
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="w-8 h-8 rounded-full flex items-center justify-center text-stone-400 hover:text-stone-800 hover:bg-stone-200/60 transition-all"
            aria-label="Close modal"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Scrollable Diagnostics Body */}
        <div className="flex-1 min-h-0 overflow-y-auto px-6 py-4 space-y-4 text-xs">
          {/* USER INFERENCE MODE SELECTOR */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold text-stone-900 flex items-center gap-1.5">
                <Sliders className="w-4 h-4 text-stone-700" />
                <span>Your Preferred AI Mode</span>
              </label>
              <span className="text-[10px] text-stone-500 font-medium">Saved in browser</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
              {/* Option 1: Hybrid / Auto */}
              <button
                type="button"
                onClick={() => handleSelectMode("hybrid")}
                className={`p-3 rounded-2xl border text-left transition-all ${mode === "hybrid"
                  ? "bg-amber-500/10 border-amber-400 text-stone-950 ring-2 ring-amber-400/30 shadow-2xs font-bold"
                  : "bg-stone-50/80 hover:bg-stone-100 border-stone-200 text-stone-700"
                  }`}
              >
                <div className="flex items-center justify-between">
                  <span className="font-bold text-xs flex items-center gap-1">
                    <span>⚡ Auto (Hybrid)</span>
                  </span>
                  {mode === "hybrid" && <Check className="w-4 h-4 text-amber-600" />}
                </div>
                <p className="text-[10px] text-stone-500 mt-1 leading-snug font-normal">
                  Recommended. Uses private on-device AI when ready, or Cloud AI automatically.
                </p>
              </button>

              {/* Option 2: On-Device Only */}
              <button
                type="button"
                onClick={() => handleSelectMode("on-device")}
                className={`p-3 rounded-2xl border text-left transition-all ${mode === "on-device"
                  ? "bg-emerald-50 border-emerald-400 text-emerald-950 ring-2 ring-emerald-400/30 shadow-2xs font-bold"
                  : "bg-stone-50/80 hover:bg-stone-100 border-stone-200 text-stone-700"
                  }`}
              >
                <div className="flex items-center justify-between">
                  <span className="font-bold text-xs flex items-center gap-1">
                    <span>💻 On-Device Only</span>
                  </span>
                  {mode === "on-device" && <Check className="w-4 h-4 text-emerald-600" />}
                </div>
                <p className="text-[10px] text-stone-500 mt-1 leading-snug font-normal">
                  Strict local privacy. Prompts never leave this computer. Shows error if model is not ready.
                </p>
              </button>

              {/* Option 3: Cloud AI Only */}
              <button
                type="button"
                onClick={() => handleSelectMode("cloud")}
                className={`p-3 rounded-2xl border text-left transition-all ${mode === "cloud"
                  ? "bg-blue-50 border-blue-400 text-blue-950 ring-2 ring-blue-400/30 shadow-2xs font-bold"
                  : "bg-stone-50/80 hover:bg-stone-100 border-stone-200 text-stone-700"
                  }`}
              >
                <div className="flex items-center justify-between">
                  <span className="font-bold text-xs flex items-center gap-1">
                    <span>☁️ Cloud AI Only</span>
                  </span>
                  {mode === "cloud" && <Check className="w-4 h-4 text-blue-600" />}
                </div>
                <p className="text-[10px] text-stone-500 mt-1 leading-snug font-normal">
                  Fast cloud processing. Works smoothly on every device.
                </p>
              </button>
            </div>
          </div>

          {/* 1. ON-DEVICE AI STATUS */}
          <div className="p-4 rounded-2xl border border-stone-200 bg-stone-50/80 space-y-3 shadow-2xs">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Cpu className="w-4 h-4 text-emerald-600" />
                <span className="font-bold text-stone-900 text-xs">
                  On-Device AI (Private Browser Mode)
                </span>
              </div>
              <span
                className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold capitalize border ${detailedDiag?.modelAvailability === "readily"
                  ? "bg-emerald-50 text-emerald-800 border-emerald-300"
                  : detailedDiag?.modelAvailability === "after-download"
                    ? "bg-amber-50 text-amber-800 border-amber-300"
                    : detailedDiag?.modelAvailability === "downloading"
                      ? "bg-sky-50 text-sky-800 border-sky-300"
                      : detailedDiag?.modelAvailability === "no"
                        ? "bg-rose-50 text-rose-800 border-rose-300"
                        : "bg-stone-100 text-stone-600 border-stone-200"
                  }`}
              >
                {detailedDiag?.modelAvailability === "readily"
                  ? "Ready"
                  : detailedDiag?.modelAvailability === "after-download"
                    ? "Needs Download (~1.5 GB)"
                    : detailedDiag?.modelAvailability === "downloading"
                      ? "Downloading..."
                      : detailedDiag?.modelAvailability === "no"
                        ? "Not Available on Device"
                        : "Not Supported on Browser"}
              </span>
            </div>

            {/* Detailed Actionable Diagnostics Card if not readily available */}
            {localFailureReport ? (
              <LocalAIErrorCard
                report={localFailureReport}
                onFallbackToCloud={() => handleSelectMode("cloud")}
                onRetryLocal={handleTestLocalPrompt}
              />
            ) : detailedDiag?.modelAvailability === "readily" ? (
              <div className="p-3 bg-emerald-50 border border-emerald-300 rounded-xl flex items-center gap-2 text-emerald-900 text-xs">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>On-device AI is loaded and ready for private, offline use.</span>
              </div>
            ) : null}

            {/* Live Model Download Progress Bar */}
            {(isDownloadingModel ||
              (testingLocal && downloadProgress !== null) ||
              detailedDiag?.modelAvailability === "downloading" ||
              localTestResult?.status === "downloading") && (
                <ModelDownloadProgress
                  progress={downloadProgress}
                  loadedBytes={downloadBytes?.loaded}
                  totalBytes={downloadBytes?.total}
                  isDownloading={true}
                  isComplete={detailedDiag?.modelAvailability === "readily"}
                />
              )}

            <div className="flex items-center justify-between pt-1 flex-wrap gap-2">
              <div className="flex items-center gap-2 flex-wrap">
                <button
                  type="button"
                  onClick={handleTestLocalPrompt}
                  disabled={testingLocal || isDownloadingModel}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-white border border-stone-200 hover:border-stone-300 rounded-xl font-semibold text-stone-800 shadow-2xs transition-all hover:scale-101 cursor-pointer"
                >
                  {testingLocal ? (
                    <Loader2 className="w-3.5 h-3.5 animate-spin text-stone-600" />
                  ) : (
                    <Zap className="w-3.5 h-3.5 text-amber-500" />
                  )}
                  <span>Test On-Device AI</span>
                </button>

                {detailedDiag?.modelAvailability === "after-download" && (
                  <button
                    type="button"
                    onClick={handleStartDownload}
                    disabled={isDownloadingModel}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-amber-600 hover:bg-amber-700 rounded-xl font-bold text-white shadow-2xs transition-all hover:scale-101 cursor-pointer text-xs"
                  >
                    {isDownloadingModel ? (
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    ) : (
                      <DownloadCloud className="w-3.5 h-3.5" />
                    )}
                    <span>Download Model (~1.5 GB)</span>
                  </button>
                )}
              </div>
              <span className="text-[10px] text-stone-400">Browser Built-in AI</span>
            </div>

            {/* Local Test Output */}
            {localTestResult && (
              <div className={`p-3.5 rounded-xl border text-[11px] leading-relaxed shadow-2xs ${localTestResult.success
                ? "bg-emerald-50/90 border-emerald-300 text-emerald-950"
                : localTestResult.status === "downloadable" || localTestResult.status === "downloading"
                  ? "bg-amber-50/90 border-amber-300 text-amber-950"
                  : "bg-red-50 border-red-200 text-red-900"
                }`}>
                <div className="font-bold mb-1.5 flex items-center gap-1.5 text-xs">
                  {localTestResult.success ? (
                    <>
                      <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                      <span>✓ On-Device AI Test Passed</span>
                    </>
                  ) : localTestResult.status === "downloading" ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin text-amber-600 shrink-0" />
                      <span>Local AI Model is Downloading...</span>
                    </>
                  ) : localTestResult.status === "downloadable" ? (
                    <>
                      <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0" />
                      <span>Local AI Model Needs to be Downloaded</span>
                    </>
                  ) : (
                    <>
                      <AlertCircle className="w-4 h-4 text-red-600 shrink-0" />
                      <span>On-Device AI Unavailable</span>
                    </>
                  )}
                </div>
                <div className="whitespace-pre-line font-sans text-[11px] leading-relaxed">{localTestResult.text}</div>
                {!localTestResult.success && mode === "on-device" && (
                  <div className="pt-2.5">
                    <button
                      type="button"
                      onClick={() => handleSelectMode("hybrid")}
                      className="px-2.5 py-1 bg-amber-600 text-white rounded-lg text-[10px] font-bold hover:bg-amber-700 transition-colors shadow-2xs cursor-pointer"
                    >
                      Switch to Auto Mode to continue with Cloud AI
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* 2. TIER 2: CLOUD AI */}
          <div className="p-4 rounded-2xl border border-stone-200 bg-stone-50/80 space-y-3 shadow-2xs">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Cloud className="w-4 h-4 text-blue-600" />
                <span className="font-bold text-stone-900 text-xs">
                  Cloud AI
                </span>
              </div>
              <span
                className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold capitalize border ${cloudDiag?.status === "operational"
                  ? "bg-emerald-50 text-emerald-800 border-emerald-300"
                  : "bg-amber-50 text-amber-800 border-amber-300"
                  }`}
              >
                {cloudDiag?.cloudGemini?.status === "live-connected" ? "Connected" : "Ready"}
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-[11px]">
              <div className="p-2.5 bg-white rounded-xl border border-stone-200/90">
                <span className="text-[10px] text-stone-400 font-bold block uppercase">
                  Cloud Service
                </span>
                <span className="font-bold text-stone-800">
                  Keeva Cloud AI
                </span>
              </div>
              <div className="p-2.5 bg-white rounded-xl border border-stone-200/90">
                <span className="text-[10px] text-stone-400 font-bold block uppercase">
                  Response Speed
                </span>
                <span className="font-bold text-stone-800">
                  {cloudDiag?.cloudGemini?.latencyMs ? `${cloudDiag.cloudGemini.latencyMs} ms` : "Fast (<1s)"}
                </span>
              </div>
            </div>

            <p className="text-[11px] text-stone-600 leading-relaxed">
              When On-Device AI is unavailable or Cloud AI mode is active, your requests are handled securely by Cloud AI.
            </p>
          </div>

          {/* 3. DATA & MEMORY */}
          <div className="p-4 rounded-2xl border border-stone-200 bg-stone-50/80 space-y-2.5 shadow-2xs">
            <div className="flex items-center gap-2">
              <Database className="w-4 h-4 text-amber-600" />
              <span className="font-bold text-stone-900 text-xs">
                Data &amp; Memory Storage
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-[11px]">
              <div className="p-2.5 bg-white rounded-xl border border-stone-200/90">
                <span className="text-[10px] text-stone-400 font-bold block uppercase">
                  Profiles &amp; Timelines
                </span>
                <span className="font-bold text-stone-800">Encrypted Cloud Storage</span>
              </div>
              <div className="p-2.5 bg-white rounded-xl border border-stone-200/90">
                <span className="text-[10px] text-stone-400 font-bold block uppercase">
                  Long-Term Memory
                </span>
                <span className="font-bold text-stone-800">Relationship Memory</span>
                <span className="text-[10px] text-stone-400 block mt-0.5">
                  Contextual reflections &amp; patterns
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Footer (Fixed - shrink-0) */}
        <div className="shrink-0 px-6 py-3 border-t border-stone-100 bg-stone-50/70 flex items-center justify-between">
          <button
            type="button"
            onClick={runAllChecks}
            disabled={loadingCloud}
            className="inline-flex items-center gap-1.5 text-xs font-bold text-stone-700 hover:text-stone-950 px-2 py-1 rounded-lg hover:bg-white transition-colors"
          >
            {loadingCloud ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <RefreshCw className="w-3.5 h-3.5 text-amber-600" />}
            <span>Re-check Connections</span>
          </button>
          <button
            type="button"
            onClick={onClose}
            className="px-5 py-2 bg-stone-900 text-stone-50 rounded-xl text-xs font-bold hover:bg-stone-800 transition-all shadow-xs hover:scale-101"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );

  return typeof document !== "undefined" ? createPortal(modalContent, document.body) : null;
};
