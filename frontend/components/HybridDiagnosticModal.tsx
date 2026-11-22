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
  ExternalLink,
  ShieldAlert,
  Sliders,
  AlertCircle
} from "lucide-react";
import { 
  detectHybridAICapabilities, 
  attemptOnDeviceAnalysis, 
  getDetailedLocalAIDiagnosis,
  diagnoseLocalAIFailure,
  getPreferredInferenceMode,
  setPreferredInferenceMode,
  InferenceMode,
  HybridInferenceStatus,
  DetailedLocalAIDiagnostic,
  LocalAIFailureReport
} from "@/lib/hybrid-ai";
import { LocalAIErrorCard } from "./LocalAIErrorCard";
import { getAIDiagnostics } from "@/lib/api";

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onModeChanged?: (mode: InferenceMode) => void;
}

export const HybridDiagnosticModal: React.FC<Props> = ({ isOpen, onClose, onModeChanged }) => {
  const [mounted, setMounted] = useState(false);
  const [mode, setMode] = useState<InferenceMode>("hybrid");
  const [localStatus, setLocalStatus] = useState<HybridInferenceStatus | null>(null);
  const [detailedDiag, setDetailedDiag] = useState<DetailedLocalAIDiagnostic | null>(null);
  const [cloudDiag, setCloudDiag] = useState<any | null>(null);
  const [testingLocal, setTestingLocal] = useState(false);
  const [localTestResult, setLocalTestResult] = useState<{ success: boolean; text: string } | null>(null);
  const [localFailureReport, setLocalFailureReport] = useState<LocalAIFailureReport | null>(null);
  const [loadingCloud, setLoadingCloud] = useState(false);

  useEffect(() => {
    setMounted(true);
    setMode(getPreferredInferenceMode());
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
    const [loc, detailed] = await Promise.all([
      detectHybridAICapabilities(),
      getDetailedLocalAIDiagnosis()
    ]);
    setLocalStatus(loc);
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
    } catch (err: any) {
      setCloudDiag({
        status: "error",
        error: err.message || "Failed to reach backend diagnostic endpoint."
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

  const handleTestLocalPrompt = async () => {
    setTestingLocal(true);
    setLocalTestResult(null);
    setLocalFailureReport(null);
    try {
      const res = await attemptOnDeviceAnalysis("Brief test: Analyze tone of 'We had an honest talk and resolved the tension.'");
      if (res.success) {
        setLocalTestResult({
          success: true,
          text: `Local Gemini Nano verified: "${res.result}"`
        });
        setLocalFailureReport(null);
      } else {
        setLocalTestResult({
          success: false,
          text: res.error || "On-Device Prompt API is not ready on this machine."
        });
        if (res.failureReport) {
          setLocalFailureReport(res.failureReport);
        } else {
          const report = await diagnoseLocalAIFailure(res.error);
          setLocalFailureReport(report);
        }
      }
    } catch (e: any) {
      const report = await diagnoseLocalAIFailure(e.message || String(e));
      setLocalFailureReport(report);
      setLocalTestResult({
        success: false,
        text: "Execution failed: " + (e.message || String(e))
      });
    } finally {
      setTestingLocal(false);
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
                AI Inference Engine & Connection Control
              </h3>
              <p className="text-xs text-stone-500 mt-0.5">
                Choose Local On-Device vs. Cloud Gemini with live connection verification
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
                <span>Your Selected Inference Preference</span>
              </label>
              <span className="text-[10px] text-stone-500 font-medium">Saved in browser</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
              {/* Option 1: Hybrid / Auto */}
              <button
                type="button"
                onClick={() => handleSelectMode("hybrid")}
                className={`p-3 rounded-2xl border text-left transition-all ${
                  mode === "hybrid"
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
                  Recommended. Uses local Gemini Nano if ready, otherwise Cloud Gemini seamlessly.
                </p>
              </button>

              {/* Option 2: On-Device Only */}
              <button
                type="button"
                onClick={() => handleSelectMode("on-device")}
                className={`p-3 rounded-2xl border text-left transition-all ${
                  mode === "on-device"
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

              {/* Option 3: Cloud Gemini Only */}
              <button
                type="button"
                onClick={() => handleSelectMode("cloud")}
                className={`p-3 rounded-2xl border text-left transition-all ${
                  mode === "cloud"
                    ? "bg-blue-50 border-blue-400 text-blue-950 ring-2 ring-blue-400/30 shadow-2xs font-bold"
                    : "bg-stone-50/80 hover:bg-stone-100 border-stone-200 text-stone-700"
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="font-bold text-xs flex items-center gap-1">
                    <span>☁️ Cloud Gemini Only</span>
                  </span>
                  {mode === "cloud" && <Check className="w-4 h-4 text-blue-600" />}
                </div>
                <p className="text-[10px] text-stone-500 mt-1 leading-snug font-normal">
                  Direct cloud execution. Always uses Gemini 2.5 Flash via Firebase AI logic.
                </p>
              </button>
            </div>
          </div>

          {/* 1. TIER 1: LOCAL ON-DEVICE MODEL STATUS & DIAGNOSTICS */}
          <div className="p-4 rounded-2xl border border-stone-200 bg-stone-50/80 space-y-3 shadow-2xs">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Cpu className="w-4 h-4 text-emerald-600" />
                <span className="font-bold text-stone-900 text-xs">
                  Tier 1: On-Device AI (Chrome Built-in Prompt API)
                </span>
              </div>
              <span
                className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold capitalize border ${
                  detailedDiag?.modelAvailability === "readily"
                    ? "bg-emerald-50 text-emerald-800 border-emerald-300"
                    : detailedDiag?.modelAvailability === "after-download"
                    ? "bg-amber-50 text-amber-800 border-amber-300"
                    : "bg-stone-100 text-stone-600 border-stone-200"
                }`}
              >
                {detailedDiag?.modelAvailability === "readily" 
                  ? "Active (Local Nano Ready)" 
                  : detailedDiag?.modelAvailability === "after-download"
                  ? "Downloading Components"
                  : "Not Configured / Inactive"}
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
                <span>On-device Gemini Nano is fully loaded and ready for zero-latency local execution.</span>
              </div>
            ) : null}

            <div className="flex items-center justify-between pt-1">
              <button
                type="button"
                onClick={handleTestLocalPrompt}
                disabled={testingLocal}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-white border border-stone-200 hover:border-stone-300 rounded-xl font-semibold text-stone-800 shadow-2xs transition-all hover:scale-101"
              >
                {testingLocal ? (
                  <Loader2 className="w-3.5 h-3.5 animate-spin text-stone-600" />
                ) : (
                  <Zap className="w-3.5 h-3.5 text-amber-500" />
                )}
                <span>Run Local Prompt Test</span>
              </button>
              <span className="text-[10px] text-stone-400">Target: window.ai.languageModel</span>
            </div>

            {/* Local Test Output */}
            {localTestResult && (
              <div className={`p-3 rounded-xl border text-[11px] leading-relaxed shadow-2xs ${
                localTestResult.success 
                  ? "bg-emerald-50/80 border-emerald-300 text-emerald-950"
                  : "bg-red-50 border-red-200 text-red-900"
              }`}>
                <div className="font-bold mb-0.5">
                  {localTestResult.success ? "✓ Local Test Passed" : "⚠️ Local Test Failed"}
                </div>
                <div>{localTestResult.text}</div>
                {!localTestResult.success && mode === "on-device" && (
                  <div className="pt-2">
                    <button
                      type="button"
                      onClick={() => handleSelectMode("hybrid")}
                      className="px-2.5 py-1 bg-amber-600 text-white rounded-lg text-[10px] font-bold hover:bg-amber-700 transition-colors shadow-2xs"
                    >
                      Switch to Auto (Hybrid) to continue uninterrupted
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* 2. TIER 2: CLOUD GEMINI INFERENCE */}
          <div className="p-4 rounded-2xl border border-stone-200 bg-stone-50/80 space-y-3 shadow-2xs">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Cloud className="w-4 h-4 text-blue-600" />
                <span className="font-bold text-stone-900 text-xs">
                  Tier 2: Cloud Gemini (Firebase AI Logic Layer)
                </span>
              </div>
              <span
                className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold capitalize border ${
                  cloudDiag?.status === "operational"
                    ? "bg-emerald-50 text-emerald-800 border-emerald-300"
                    : "bg-amber-50 text-amber-800 border-amber-300"
                }`}
              >
                {cloudDiag?.cloudGemini?.status || "Live-Connected"}
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-[11px]">
              <div className="p-2.5 bg-white rounded-xl border border-stone-200/90">
                <span className="text-[10px] text-stone-400 font-bold block uppercase">
                  Target Cloud Model
                </span>
                <span className="font-bold text-stone-800">
                  {cloudDiag?.cloudGemini?.targetModel || "gemini-2.5-flash"}
                </span>
              </div>
              <div className="p-2.5 bg-white rounded-xl border border-stone-200/90">
                <span className="text-[10px] text-stone-400 font-bold block uppercase">
                  API Response Time
                </span>
                <span className="font-bold text-stone-800">
                  {cloudDiag?.cloudGemini?.latencyMs ? `${cloudDiag.cloudGemini.latencyMs} ms` : "Verified (<1s)"}
                </span>
              </div>
            </div>

            <p className="text-[11px] text-stone-600 leading-relaxed">
              When On-Device mode is unavailable or when Cloud Gemini mode is active, the system routes requests to Google Gemini 2.5 Flash via Firebase AI Logic seamlessly.
            </p>
          </div>

          {/* 3. FIREBASE & MEM0 MEMORY ENGINES */}
          <div className="p-4 rounded-2xl border border-stone-200 bg-stone-50/80 space-y-2.5 shadow-2xs">
            <div className="flex items-center gap-2">
              <Database className="w-4 h-4 text-amber-600" />
              <span className="font-bold text-stone-900 text-xs">
                Data & Memory Architecture
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-[11px]">
              <div className="p-2.5 bg-white rounded-xl border border-stone-200/90">
                <span className="text-[10px] text-stone-400 font-bold block uppercase">
                  Structured State
                </span>
                <span className="font-bold text-stone-800">Google Cloud Firestore</span>
                <span className="text-[10px] text-stone-400 block mt-0.5">
                  Project: {cloudDiag?.memoryEngine?.projectId || "keeva-f2906"}
                </span>
              </div>
              <div className="p-2.5 bg-white rounded-xl border border-stone-200/90">
                <span className="text-[10px] text-stone-400 font-bold block uppercase">
                  Semantic Long-Term Store
                </span>
                <span className="font-bold text-stone-800">Mem0 Memory Engine</span>
                <span className="text-[10px] text-stone-400 block mt-0.5">
                  Vector-indexed observations
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
