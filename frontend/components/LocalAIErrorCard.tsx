"use client";

import React, { useState } from "react";
import { 
  AlertTriangle, 
  Copy, 
  Check, 
  ExternalLink, 
  Cloud, 
  RefreshCw, 
  Terminal, 
  ChevronDown, 
  ChevronUp,
  Cpu,
  ArrowRight
} from "lucide-react";
import { LocalAIFailureReport } from "@/lib/hybrid-ai";

interface Props {
  report: LocalAIFailureReport;
  onFallbackToCloud?: () => void;
  onRetryLocal?: () => void;
  className?: string;
}

export const LocalAIErrorCard: React.FC<Props> = ({
  report,
  onFallbackToCloud,
  onRetryLocal,
  className = ""
}) => {
  const [copiedText, setCopiedText] = useState<string | null>(null);
  const [showTechnicalDetails, setShowTechnicalDetails] = useState(false);

  const handleCopy = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedText(text);
    setTimeout(() => setCopiedText(null), 2500);
  };

  const getCategoryBadge = () => {
    switch (report.category) {
      case "flag_disabled":
        return { label: "Prompt API Disabled", color: "bg-rose-100 text-rose-900 border-rose-300" };
      case "model_downloadable":
        return { label: "Model Needs Download (~1.5 GB)", color: "bg-amber-100 text-amber-900 border-amber-300" };
      case "model_downloading":
        return { label: "Model Downloading (~1.5 GB)", color: "bg-sky-100 text-sky-900 border-sky-300" };
      case "hardware_requirement":
        return { label: "Hardware Requirement Blocked", color: "bg-orange-100 text-orange-900 border-orange-300" };
      case "browser_unsupported":
        return { label: "Unsupported Browser", color: "bg-stone-200 text-stone-900 border-stone-300" };
      default:
        return { label: "Local Execution Error", color: "bg-red-100 text-red-900 border-red-300" };
    }
  };

  const badge = getCategoryBadge();

  return (
    <div className={`p-4 sm:p-5 rounded-3xl bg-amber-50/90 border border-amber-300/80 shadow-xs space-y-3.5 text-stone-900 text-xs ${className}`}>
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-2.5 border-b border-amber-200/70">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-xl bg-amber-200/80 text-amber-900 flex items-center justify-center shrink-0 shadow-2xs">
            <Cpu className="w-4 h-4 text-amber-800" />
          </div>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <span className="font-extrabold text-stone-950 text-sm">{report.title}</span>
              <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border uppercase tracking-wider ${badge.color}`}>
                {badge.label}
              </span>
            </div>
            <p className="text-[11px] text-stone-600 mt-0.5">
              {report.summary}
            </p>
          </div>
        </div>
      </div>

      {/* Actionable Steps Checklist */}
      {report.actionableSteps.length > 0 && (
        <div className="space-y-2 bg-white/80 p-3.5 rounded-2xl border border-amber-200/60 shadow-2xs">
          <span className="text-[10px] font-extrabold uppercase tracking-wider text-amber-950 block">
            Exact Steps to Resolve in Chrome:
          </span>
          <div className="space-y-2">
            {report.actionableSteps.map((step) => (
              <div key={step.step} className="flex items-start gap-2.5 text-xs text-stone-800">
                <span className="w-5 h-5 rounded-full bg-amber-200 text-amber-950 font-bold flex items-center justify-center text-[10px] shrink-0 mt-0.5">
                  {step.step}
                </span>
                <div className="flex-1 space-y-1">
                  <span className="font-bold text-stone-900">{step.title}: </span>
                  <span className="text-stone-700 leading-relaxed">{step.detail}</span>

                  {/* Copyable Flag / URL Box */}
                  {step.copyText && (
                    <div className="flex items-center gap-2 mt-1">
                      <code className="px-2.5 py-1 bg-stone-100 border border-stone-200 rounded-lg text-[11px] font-mono text-stone-900 select-all font-semibold">
                        {step.copyText}
                      </code>
                      <button
                        type="button"
                        onClick={() => handleCopy(step.copyText!)}
                        className="inline-flex items-center gap-1 px-2 py-1 bg-white hover:bg-stone-50 border border-stone-200 rounded-lg text-[10px] font-bold text-stone-700 shadow-2xs transition-colors"
                      >
                        {copiedText === step.copyText ? (
                          <>
                            <Check className="w-3 h-3 text-emerald-600" />
                            <span className="text-emerald-700">Copied!</span>
                          </>
                        ) : (
                          <>
                            <Copy className="w-3 h-3 text-stone-500" />
                            <span>Copy Link</span>
                          </>
                        )}
                      </button>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Collapsible Technical Diagnostics */}
      <div className="pt-0.5">
        <button
          type="button"
          onClick={() => setShowTechnicalDetails(!showTechnicalDetails)}
          className="text-[10px] font-bold text-stone-500 hover:text-stone-800 flex items-center gap-1 transition-colors"
        >
          <Terminal className="w-3 h-3 text-stone-400" />
          <span>{showTechnicalDetails ? "Hide technical diagnostic" : "Show technical diagnostic log"}</span>
          {showTechnicalDetails ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
        </button>
        {showTechnicalDetails && (
          <div className="mt-1.5 p-2.5 bg-stone-900 text-amber-200 font-mono text-[10px] rounded-xl overflow-x-auto leading-relaxed border border-stone-800">
            {report.technicalDetails}
          </div>
        )}
      </div>

      {/* Immediate Fallback Actions */}
      <div className="pt-2 flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-t border-amber-200/70">
        <div className="text-[11px] text-amber-950 font-medium">
          💡 You don't have to wait: <strong>Cloud Gemini 2.5 Flash</strong> is live and can answer immediately.
        </div>
        <div className="flex items-center gap-2 shrink-0">
          {onRetryLocal && (
            <button
              type="button"
              onClick={onRetryLocal}
              className="px-3 py-1.5 bg-white hover:bg-stone-50 text-stone-800 border border-stone-200 rounded-xl text-xs font-semibold flex items-center gap-1.5 shadow-2xs transition-all"
            >
              <RefreshCw className="w-3 h-3 text-stone-500" />
              <span>Retry Local</span>
            </button>
          )}
          {onFallbackToCloud && (
            <button
              type="button"
              onClick={onFallbackToCloud}
              className="px-3.5 py-1.5 bg-stone-900 hover:bg-stone-800 text-stone-50 rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-xs transition-all hover:scale-101"
            >
              <Cloud className="w-3.5 h-3.5 text-blue-300" />
              <span>Switch to Cloud Gemini & Proceed</span>
              <ArrowRight className="w-3 h-3 text-amber-300" />
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
