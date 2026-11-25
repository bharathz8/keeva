"use client";

import React, { useState } from "react";
import { 
  DownloadCloud, 
  Loader2, 
  CheckCircle2, 
  Copy, 
  Check, 
  Sparkles,
  Info
} from "lucide-react";
import { formatBytes } from "@/lib/hybrid-ai";

export interface ModelDownloadProgressProps {
  progress?: number | null; // 0 - 100
  loadedBytes?: number;
  totalBytes?: number;
  isDownloading?: boolean;
  isComplete?: boolean;
  error?: string;
  onRetry?: () => void;
  className?: string;
}

export const ModelDownloadProgress: React.FC<ModelDownloadProgressProps> = ({
  progress,
  loadedBytes,
  totalBytes,
  isDownloading = true,
  isComplete = false,
  error,
  onRetry,
  className = ""
}) => {
  const [copiedLink, setCopiedLink] = useState(false);

  const handleCopyLink = () => {
    navigator.clipboard.writeText("chrome://components");
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2000);
  };

  const hasPercent = typeof progress === "number" && !isNaN(progress) && progress >= 0;
  const clampedPercent = hasPercent ? Math.min(100, Math.max(0, Math.round(progress))) : null;

  return (
    <div className={`p-4 rounded-2xl bg-white border border-amber-200/90 shadow-xs space-y-3 ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2.5 min-w-0">
          <div className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 shadow-2xs ${
            isComplete
              ? "bg-emerald-100 text-emerald-800"
              : error
              ? "bg-rose-100 text-rose-800"
              : "bg-amber-100 text-amber-800"
          }`}>
            {isComplete ? (
              <CheckCircle2 className="w-4 h-4 text-emerald-700" />
            ) : isDownloading ? (
              <Loader2 className="w-4 h-4 text-amber-700 animate-spin" />
            ) : (
              <DownloadCloud className="w-4 h-4 text-amber-700" />
            )}
          </div>
          <div className="min-w-0">
            <h4 className="font-extrabold text-stone-900 text-xs sm:text-sm leading-tight flex items-center gap-1.5 truncate">
              <span>{isComplete ? "Local AI Model Ready" : "Downloading Local AI Model"}</span>
              {isComplete && <Sparkles className="w-3.5 h-3.5 text-emerald-600 shrink-0" />}
            </h4>
            <p className="text-[11px] text-stone-500 mt-0.5 leading-snug truncate">
              {isComplete
                ? "Local AI is loaded and ready for private offline use."
                : error
                ? "Download paused or waiting for browser setup."
                : "Downloading (~1.5 GB) for private offline use."}
            </p>
          </div>
        </div>

        {/* Percentage or Status Badge */}
        <div className="shrink-0 text-right">
          <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-black tracking-wide border ${
            isComplete
              ? "bg-emerald-50 text-emerald-800 border-emerald-300"
              : error
              ? "bg-rose-50 text-rose-800 border-rose-300"
              : "bg-amber-50 text-amber-900 border-amber-300"
          }`}>
            {isComplete ? (
              "100% Ready"
            ) : clampedPercent !== null ? (
              `${clampedPercent}%`
            ) : (
              <span className="flex items-center gap-1">
                <Loader2 className="w-3 h-3 animate-spin" />
                <span>Downloading</span>
              </span>
            )}
          </span>
        </div>
      </div>

      {/* Progress Bar Track & Bar */}
      <div className="space-y-1.5">
        <div className="w-full bg-stone-100 rounded-full h-3 p-0.5 border border-stone-200/80 overflow-hidden relative shadow-inner">
          {isComplete ? (
            <div className="bg-emerald-500 h-full rounded-full transition-all duration-500 w-full" />
          ) : clampedPercent !== null ? (
            <div
              className="bg-gradient-to-r from-amber-500 via-amber-400 to-emerald-500 h-full rounded-full transition-all duration-300 ease-out relative overflow-hidden"
              style={{ width: `${Math.max(4, clampedPercent)}%` }}
            >
              {/* Shimmer animation */}
              <div className="absolute inset-0 bg-white/20 animate-pulse" />
            </div>
          ) : (
            /* Indeterminate animated bar */
            <div className="w-full h-full relative overflow-hidden rounded-full">
              <div className="absolute inset-0 bg-gradient-to-r from-amber-400 via-amber-500 to-amber-400 animate-pulse rounded-full opacity-70" />
            </div>
          )}
        </div>

        {/* Metrics Sub-row */}
        <div className="flex items-center justify-between text-[10.5px] font-medium text-stone-500 px-0.5">
          <span>
            {loadedBytes !== undefined && totalBytes !== undefined && totalBytes > 0
              ? `${formatBytes(loadedBytes)} of ${formatBytes(totalBytes)} downloaded`
              : clampedPercent !== null
              ? `${clampedPercent}% completed (~1.5 GB total)`
              : "Connecting to Chrome component updater..."}
          </span>
          <span className="font-semibold text-stone-600">
            {isComplete ? "Ready for inference" : "One-time download"}
          </span>
        </div>
      </div>

      {/* Actionable Note & Chrome Components Link */}
      <div className="pt-1 flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-t border-stone-100 text-[11px] text-stone-600">
        <div className="flex items-start gap-1.5">
          <Info className="w-3.5 h-3.5 text-stone-400 shrink-0 mt-0.5" />
          <span>
            Keep this tab open while downloading. You can also inspect status in{" "}
            <code className="px-1.5 py-0.5 bg-stone-100 rounded font-mono font-semibold text-stone-800">
              chrome://components
            </code>
          </span>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <button
            type="button"
            onClick={handleCopyLink}
            className="inline-flex items-center gap-1 px-2 py-1 bg-stone-100 hover:bg-stone-200/70 border border-stone-200 rounded-lg text-[10px] font-bold text-stone-700 transition-colors cursor-pointer"
          >
            {copiedLink ? (
              <>
                <Check className="w-3 h-3 text-emerald-600" />
                <span className="text-emerald-700">Copied!</span>
              </>
            ) : (
              <>
                <Copy className="w-3 h-3 text-stone-500" />
                <span>Copy URL</span>
              </>
            )}
          </button>
          {error && onRetry && (
            <button
              type="button"
              onClick={onRetry}
              className="px-2 py-1 bg-amber-600 hover:bg-amber-700 text-white rounded-lg text-[10px] font-bold transition-colors cursor-pointer shadow-2xs"
            >
              Retry Download
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
