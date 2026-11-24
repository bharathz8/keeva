"use client";

import React, { useState } from "react";
import {
  AlertCircle,
  ChevronDown,
  ChevronUp,
  History,
  Compass,
  ShieldAlert,
  ArrowRight,
  Brain
} from "lucide-react";
import { RelationshipEvent } from "@/types";

interface Props {
  personName: string;
  relationshipType?: string;
  duration?: string;
  pauseReason?: string;
  relevantMemories?: Array<{ id?: string; memory: string }>;
  relevantEvents?: RelationshipEvent[];
  timelineSummary?: string;
  emotionalIntensity?: number;
  consequenceSeverity?: number;
  reversibility?: string;
  onExplorePaths?: () => void;
}

export const AIPauseCard: React.FC<Props> = ({
  personName,
  relationshipType = "Friend",
  duration = "several years",
  pauseReason,
  relevantMemories = [],
  relevantEvents = [],
  timelineSummary,
  emotionalIntensity = 0.8,
  consequenceSeverity = 0.75,
  reversibility = "low",
  onExplorePaths,
}) => {
  const [showHistory, setShowHistory] = useState(true);

  return (
    <div className="bg-amber-50/40 border border-amber-200/90 rounded-2xl p-5 sm:p-6 shadow-2xs my-4 text-stone-800 transition-all">
      {/* Header Banner */}
      <div className="flex items-start gap-3.5 sm:gap-4">
        <div className="p-2.5 rounded-xl bg-amber-500 text-stone-900 shadow-2xs shrink-0 mt-0.5">
          <ShieldAlert className="w-5 h-5 text-white" />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-[10px] font-bold tracking-wider uppercase text-amber-950 bg-amber-200/80 px-2 py-0.5 rounded-md">
              Consequential Pause
            </span>
            <span className="text-xs font-semibold text-stone-600">
              Consequential Decision Trigger
            </span>
          </div>

          <h3 className="text-base sm:text-lg font-bold text-stone-900 mt-1.5 leading-snug">
            Before you act, let's review your recorded history with {personName}
          </h3>
          <p className="text-xs text-stone-600 mt-1 leading-relaxed">
            {pauseReason || "This statement reflects high emotional activation and low reversibility. The AI does not tell you what to do, but helps you remember your history before deciding."}
          </p>
        </div>
      </div>

      {/* Internal Reasoning Signals Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 sm:gap-3 mt-4 pt-4 border-t border-amber-200/60 text-xs">
        <div className="bg-white/95 border border-amber-200/70 rounded-xl p-3 shadow-2xs">
          <span className="text-[10px] font-semibold uppercase tracking-wider text-stone-500 block">
            Emotional Intensity
          </span>
          <div className="flex items-center gap-2 mt-1.5">
            <div className="flex-1 bg-stone-100 rounded-full h-1.5 overflow-hidden">
              <div
                className="bg-amber-500 h-full rounded-full transition-all duration-300"
                style={{ width: `${Math.round(emotionalIntensity * 100)}%` }}
              />
            </div>
            <span className="font-bold text-stone-900 text-xs">{Math.round(emotionalIntensity * 100)}%</span>
          </div>
        </div>

        <div className="bg-white/95 border border-amber-200/70 rounded-xl p-3 shadow-2xs">
          <span className="text-[10px] font-semibold uppercase tracking-wider text-stone-500 block">
            Consequence Severity
          </span>
          <div className="flex items-center gap-2 mt-1.5">
            <div className="flex-1 bg-stone-100 rounded-full h-1.5 overflow-hidden">
              <div
                className="bg-rose-500 h-full rounded-full transition-all duration-300"
                style={{ width: `${Math.round(consequenceSeverity * 100)}%` }}
              />
            </div>
            <span className="font-bold text-stone-900 text-xs">{Math.round(consequenceSeverity * 100)}%</span>
          </div>
        </div>

        <div className="bg-white/95 border border-amber-200/70 rounded-xl p-3 shadow-2xs">
          <span className="text-[10px] font-semibold uppercase tracking-wider text-stone-500 block">
            Reversibility
          </span>
          <span
            className={`font-semibold capitalize text-xs mt-1 block ${reversibility === "low"
              ? "text-rose-700"
              : reversibility === "medium"
                ? "text-amber-700"
                : "text-emerald-700"
              }`}
          >
            {reversibility} (Hard to undo)
          </span>
        </div>
      </div>

      {/* Historical Context Retrieval Accordion */}
      <div className="mt-4 pt-3 border-t border-amber-200/60">
        <button
          onClick={() => setShowHistory(!showHistory)}
          aria-expanded={showHistory}
          className="flex items-center justify-between w-full text-xs font-semibold text-amber-950 hover:text-amber-900 py-1 cursor-pointer"
        >
          <span className="flex items-center gap-2">
            <History className="w-4 h-4 text-amber-700" />
            <span>Context retrieved from relationship history ({duration})</span>
          </span>
          {showHistory ? <ChevronUp className="w-4 h-4 text-amber-700" /> : <ChevronDown className="w-4 h-4 text-stone-500" />}
        </button>

        {showHistory && (
          <div className="mt-2.5 bg-white border border-amber-200/80 rounded-xl p-4 text-xs space-y-2.5 text-stone-700 leading-relaxed shadow-2xs animate-fade-in">
            <p className="font-semibold text-stone-900 text-xs">
              Facts from recorded records with {personName} ({relationshipType}):
            </p>
            <ul className="space-y-2 pl-1">
              <li className="flex items-start gap-2">
                <span className="text-amber-600 font-bold">&bull;</span>
                <span>You have known {personName} for <strong className="text-stone-900">{duration}</strong>.</span>
              </li>
              {relevantEvents.some((e) => e.eventType === "support") && (
                <li className="flex items-start gap-2">
                  <span className="text-emerald-600 font-bold">&bull;</span>
                  <span>Recorded as <strong className="text-stone-900">supportive</strong> during difficult personal situations.</span>
                </li>
              )}
              {relevantEvents.some((e) => e.eventType === "conflict") && (
                <li className="flex items-start gap-2">
                  <span className="text-rose-600 font-bold">&bull;</span>
                  <span>Recorded conflicts specifically around <strong className="text-stone-900">political discussions</strong> where defensiveness occurred.</span>
                </li>
              )}
              {relevantEvents.some((e) => e.eventType === "reconciliation") && (
                <li className="flex items-start gap-2">
                  <span className="text-blue-600 font-bold">&bull;</span>
                  <span>Previous similar conflict led to a <strong className="text-stone-900">4-day communication gap</strong>, and you later reconciled over a call.</span>
                </li>
              )}
              {relevantMemories.length > 0 &&
                relevantMemories.map((m, i) => (
                  <li key={i} className="flex items-start gap-2">
                    <span className="text-stone-400 font-bold">&bull;</span>
                    <span>{m.memory}</span>
                  </li>
                ))}
            </ul>
          </div>
        )}
      </div>

      {/* Action CTA */}
      {onExplorePaths && (
        <div className="mt-4 flex items-center justify-end gap-2 pt-3 border-t border-amber-200/60">
          <button
            onClick={onExplorePaths}
            className="inline-flex items-center gap-1.5 px-4 py-2 bg-stone-900 text-stone-50 hover:bg-stone-800 rounded-xl text-xs font-semibold shadow-xs transition-colors cursor-pointer"
          >
            <span>Explore Future Branches</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>
      )}
    </div>
  );
};
