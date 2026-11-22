"use client";

import React, { useEffect, useState } from "react";
import { Cpu, Cloud, Zap, Laptop } from "lucide-react";
import { 
  detectHybridAICapabilities, 
  getPreferredInferenceMode, 
  InferenceMode, 
  HybridInferenceStatus 
} from "@/lib/hybrid-ai";
import { HybridDiagnosticModal } from "./HybridDiagnosticModal";

interface Props {
  currentSource?: string;
}

export const HybridInferenceBadge: React.FC<Props> = ({ currentSource }) => {
  const [status, setStatus] = useState<HybridInferenceStatus | null>(null);
  const [mode, setMode] = useState<InferenceMode>("hybrid");
  const [isModalOpen, setIsModalOpen] = useState(false);

  useEffect(() => {
    setMode(getPreferredInferenceMode());
    detectHybridAICapabilities().then(setStatus);

    const handleModeChange = (e: any) => {
      setMode(e.detail || getPreferredInferenceMode());
    };
    window.addEventListener("keeva_inference_mode_changed", handleModeChange);
    return () => window.removeEventListener("keeva_inference_mode_changed", handleModeChange);
  }, []);

  const isOnDeviceActive = 
    mode === "on-device" ||
    (mode === "hybrid" && status?.hasOnDeviceAI) ||
    currentSource === "on-device" ||
    currentSource === "on-device-verified";

  return (
    <>
      <button
        onClick={() => setIsModalOpen(true)}
        className={`hidden sm:inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-semibold border transition-all duration-150 cursor-pointer shadow-2xs hover:scale-102 ${
          mode === "on-device"
            ? "bg-emerald-50 text-emerald-900 border-emerald-300 hover:bg-emerald-100/70"
            : mode === "cloud"
            ? "bg-blue-50 text-blue-900 border-blue-300 hover:bg-blue-100/70"
            : isOnDeviceActive
            ? "bg-emerald-50 text-emerald-900 border-emerald-300 hover:bg-emerald-100/70"
            : "bg-stone-50 text-stone-800 border-stone-200/90 hover:bg-stone-100"
        }`}
        title="Click to choose between Local On-Device and Cloud Gemini, or inspect connection latency"
      >
        <span className="relative flex h-2 w-2">
          {isOnDeviceActive && (
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
          )}
          <span
            className={`relative inline-flex rounded-full h-2 w-2 ${
              mode === "on-device"
                ? "bg-emerald-500"
                : mode === "cloud"
                ? "bg-blue-500"
                : isOnDeviceActive
                ? "bg-emerald-500"
                : "bg-amber-500"
            }`}
          ></span>
        </span>

        {mode === "on-device" ? (
          <span className="font-bold flex items-center gap-1">
            <Laptop className="w-3 h-3 text-emerald-700" />
            <span>Mode: On-Device (Local)</span>
          </span>
        ) : mode === "cloud" ? (
          <span className="font-bold flex items-center gap-1">
            <Cloud className="w-3 h-3 text-blue-700" />
            <span>Mode: Cloud Gemini</span>
          </span>
        ) : (
          <span className="font-bold flex items-center gap-1">
            <Zap className="w-3 h-3 text-amber-600" />
            <span>Mode: Auto (Hybrid)</span>
          </span>
        )}
      </button>

      <HybridDiagnosticModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onModeChanged={(newMode) => setMode(newMode)}
      />
    </>
  );
};
