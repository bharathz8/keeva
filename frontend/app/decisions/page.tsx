"use client";

import React, { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import Link from "next/link";
import { getDecisions, recordDecisionOutcome } from "@/lib/api";
import { DecisionRecord } from "@/types";
import { usePrivacy } from "@/context/PrivacyContext";
import { 
  History, 
  CheckCircle2, 
  AlertCircle, 
  Clock, 
  ArrowRight, 
  Plus, 
  Loader2, 
  Sparkles,
  Undo2,
  X,
  Compass,
  BrainCircuit,
  ShieldCheck,
  ShieldAlert
} from "lucide-react";

export default function DecisionsPage() {
  const { isLocked, maskText, openModal } = usePrivacy();
  const [decisions, setDecisions] = useState<DecisionRecord[]>([]);
  const [loading, setLoading] = useState(true);

  // Outcome recording modal
  const [outcomeModalDecision, setOutcomeModalDecision] = useState<DecisionRecord | null>(null);
  const [outcomeText, setOutcomeText] = useState("");
  const [impact, setImpact] = useState("improved");
  const [submittingOutcome, setSubmittingOutcome] = useState(false);

  const fetchDecisions = async () => {
    try {
      setLoading(true);
      const data = await getDecisions();
      setDecisions(data);
    } catch (err) {
      console.error("Error fetching decisions:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDecisions();
  }, []);

  // Escape key & body scroll lock for outcome modal
  useEffect(() => {
    if (!outcomeModalDecision) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOutcomeModalDecision(null);
    };
    window.addEventListener("keydown", handleKeyDown);
    const origOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    return () => {
      window.removeEventListener("keydown", handleKeyDown);
      document.body.style.overflow = origOverflow;
    };
  }, [outcomeModalDecision]);

  const handleRecordOutcome = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!outcomeModalDecision || !outcomeText.trim()) return;

    try {
      setSubmittingOutcome(true);
      const updated = await recordDecisionOutcome(
        outcomeModalDecision.id,
        outcomeText.trim(),
        impact
      );
      setDecisions(decisions.map((d) => (d.id === updated.id ? updated : d)));
      setOutcomeModalDecision(null);
      setOutcomeText("");
    } catch (err: any) {
      alert("Error recording outcome: " + err.message);
    } finally {
      setSubmittingOutcome(false);
    }
  };

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-stone-200">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-stone-900">
            Decision Registry & Outcomes
          </h1>
          <p className="text-xs text-stone-500 mt-1">
            Track consequential pauses, chosen paths, and real-world outcomes that feed back into future relationship intelligence.
          </p>
        </div>
        <Link
          href="/agent"
          className="inline-flex items-center gap-1.5 px-4 py-2 bg-stone-900 text-stone-50 rounded-xl text-xs font-semibold hover:bg-stone-800 shadow-xs transition-colors"
        >
          <span>Open AI Agent</span>
          <ArrowRight className="w-3.5 h-3.5" />
        </Link>
      </div>

      {loading ? (
        <div className="py-24 flex justify-center text-stone-400">
          <Loader2 className="w-8 h-8 animate-spin" />
        </div>
      ) : decisions.length === 0 ? (
        <div className="bg-white border border-stone-200 border-dashed rounded-3xl p-12 text-center space-y-3">
          <div className="w-12 h-12 rounded-2xl bg-stone-100 flex items-center justify-center mx-auto text-stone-400">
            <History className="w-6 h-6" />
          </div>
          <h3 className="font-bold text-stone-800 text-base">No decisions recorded yet</h3>
          <p className="text-xs text-stone-500 max-w-sm mx-auto leading-relaxed">
            When you're emotionally activated or considering a consequential move (e.g. cutting off contact or confronting someone), the AI activates a Pause to help you think through consequences.
          </p>
          <div className="pt-2">
            <Link
              href="/agent"
              className="inline-flex items-center gap-1.5 px-4 py-2 bg-stone-900 text-stone-50 rounded-xl text-xs font-semibold hover:bg-stone-800 shadow-xs"
            >
              <span>Test Consequential Decision in Agent</span>
            </Link>
          </div>
        </div>
      ) : (
        <div className="space-y-5">
          {decisions.map((dec) => {
            const displayName = dec.personName ? maskText(dec.personName) : "General Context";
            return (
              <div
                key={dec.id}
                className="bg-white border border-stone-200/90 rounded-3xl p-5 sm:p-6 shadow-xs space-y-4 hover:border-stone-300 card-hover-lift transition-all"
              >
                {/* Header */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-stone-100">
                  <div className="flex items-center gap-2.5">
                    <span className="font-bold text-stone-900 text-sm">
                      Decision regarding {displayName}
                    </span>
                    {isLocked && dec.personName && (
                      <span className="text-[10px] font-medium text-stone-500 bg-stone-100 px-2 py-0.5 rounded-full flex items-center gap-1">
                        🔒 Cloaked
                      </span>
                    )}
                    <span
                      className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full capitalize border ${
                        dec.status === "outcome_recorded"
                          ? "bg-emerald-50 text-emerald-800 border-emerald-200"
                          : dec.status === "decided"
                          ? "bg-blue-50 text-blue-800 border-blue-200"
                          : "bg-amber-50 text-amber-800 border-amber-200"
                      }`}
                    >
                      {dec.status.replace("_", " ")}
                    </span>
                  </div>
                  <span className="text-[11px] text-stone-400 font-medium" suppressHydrationWarning>
                    {dec.createdAt ? new Date(dec.createdAt).toLocaleDateString() : "Recent"}
                  </span>
                </div>

                {/* Original Situation / Impulse */}
                <div>
                  <span className="text-[10px] font-bold uppercase tracking-wider text-stone-400 block mb-1">
                    Original Situation / Impulse:
                  </span>
                  <p className="text-xs text-stone-800 italic bg-stone-50/80 p-3 rounded-xl border border-stone-100 leading-relaxed font-medium">
                    "{maskText(dec.situation)}"
                  </p>
                </div>

                {/* Metrics Row */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 text-xs">
                <div className="p-2.5 rounded-xl bg-stone-50 border border-stone-100">
                  <span className="text-[10px] text-stone-400 uppercase font-semibold block">
                    Proposed Action
                  </span>
                  <span className="font-bold text-stone-800 capitalize truncate block mt-0.5">
                    {dec.proposedAction || "None"}
                  </span>
                </div>
                <div className="p-2.5 rounded-xl bg-stone-50 border border-stone-100">
                  <span className="text-[10px] text-stone-400 uppercase font-semibold block">
                    Emotional State
                  </span>
                  <span className="font-bold text-stone-800 capitalize block mt-0.5">
                    {dec.emotionalState || "Activated"} ({Math.round((dec.emotionalIntensity || 0.8) * 100)}%)
                  </span>
                </div>
                <div className="p-2.5 rounded-xl bg-stone-50 border border-stone-100">
                  <span className="text-[10px] text-stone-400 uppercase font-semibold block">
                    Consequence Severity
                  </span>
                  <span className="font-bold text-stone-800 block mt-0.5">
                    {Math.round((dec.consequenceSeverity || 0.75) * 100)}%
                  </span>
                </div>
                <div className="p-2.5 rounded-xl bg-stone-50 border border-stone-100">
                  <span className="text-[10px] text-stone-400 uppercase font-semibold block">
                    Reversibility
                  </span>
                  <span
                    className={`font-bold capitalize block mt-0.5 ${
                      dec.reversibility === "low" ? "text-rose-700" : "text-amber-700"
                    }`}
                  >
                    {dec.reversibility || "low"}
                  </span>
                </div>
              </div>

              {/* Chosen Mindful Path */}
              {dec.finalDecision && (
                <div className="p-3.5 bg-stone-50/90 rounded-2xl border border-stone-200/80 text-xs space-y-1">
                  <div className="flex items-center gap-2 text-stone-900 font-bold">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                    <span>User's Mindful Decision:</span>
                  </div>
                  <p className="text-stone-900 font-bold pl-6 text-xs">{dec.finalDecision}</p>
                  {dec.userReflection && (
                    <p className="text-stone-600 pl-6 text-[11px] italic mt-0.5 leading-relaxed">
                      Reflection: "{dec.userReflection}"
                    </p>
                  )}
                </div>
              )}

              {/* Outcome Section */}
              {dec.outcome ? (
                <div className="p-4 bg-emerald-50/80 border border-emerald-200 rounded-2xl text-xs space-y-1.5 shadow-2xs">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-emerald-950">Later Recorded Outcome:</span>
                    <span className="text-[10px] font-bold px-2.5 py-0.5 rounded-md bg-emerald-100 text-emerald-800 capitalize">
                      Impact: {dec.relationshipImpact || "Neutral"}
                    </span>
                  </div>
                  <p className="text-emerald-900 leading-relaxed font-medium">{dec.outcome}</p>
                  <span className="text-[10px] text-emerald-700 block font-semibold pt-1">
                    ✓ Stored into Mem0 semantic long-term memory to inform future relationship reasoning.
                  </span>
                </div>
              ) : (
                <div className="flex justify-end pt-1">
                  <button
                    onClick={() => {
                      setOutcomeModalDecision(dec);
                      setOutcomeText("");
                    }}
                    className="inline-flex items-center gap-1.5 px-4 py-2 bg-stone-900 hover:bg-stone-800 text-stone-50 rounded-xl text-xs font-semibold transition-colors shadow-2xs"
                  >
                    <span>Record What Happened (Outcome)</span>
                  </button>
                </div>
              )}
            </div>
          );
        })}
        </div>
      )}

      {/* Record Outcome Modal */}
      {outcomeModalDecision && typeof document !== "undefined" && createPortal(
        <div 
          className="fixed inset-0 z-[9999] flex items-center justify-center p-3 sm:p-6 bg-stone-950/65 backdrop-blur-xs animate-fade-in"
          onClick={(e) => {
            if (e.target === e.currentTarget) setOutcomeModalDecision(null);
          }}
        >
          <div 
            className="bg-white rounded-3xl max-w-md w-full shadow-2xl border border-stone-200/90 flex flex-col max-h-[85vh] sm:max-h-[88vh] overflow-hidden animate-modal-pop"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header (Fixed - shrink-0) */}
            <div className="shrink-0 flex items-center justify-between px-6 py-4 border-b border-stone-100 bg-stone-50/50">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-stone-900 text-stone-100 flex items-center justify-center shadow-xs">
                  <CheckCircle2 className="w-5 h-5 text-emerald-400" />
                </div>
                <div>
                  <h3 className="font-bold text-stone-900 text-base leading-tight">Record Decision Outcome</h3>
                  <p className="text-xs text-stone-500 mt-0.5">
                    What actually happened after your decision regarding <span className="font-semibold text-stone-700">{outcomeModalDecision.personName ? maskText(outcomeModalDecision.personName) : "Context"}</span>?
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setOutcomeModalDecision(null)}
                className="w-8 h-8 rounded-full flex items-center justify-center text-stone-400 hover:text-stone-800 hover:bg-stone-200/60 transition-all"
                aria-label="Close modal"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Scrollable Form Body */}
            <form id="record-outcome-form" onSubmit={handleRecordOutcome} className="flex-1 min-h-0 overflow-y-auto px-6 py-4 space-y-3.5">
              <div>
                <label className="block text-xs font-bold text-stone-800 mb-1.5">
                  What happened / Real-world result:
                </label>
                <textarea
                  rows={3}
                  required
                  value={outcomeText}
                  onChange={(e) => setOutcomeText(e.target.value)}
                  placeholder="e.g. After taking 2 days of deliberate space, we had an honest phone call. He was dealing with a stressful family issue and we cleared the air."
                  className="w-full px-3.5 py-2.5 border border-stone-200 rounded-xl text-xs font-medium focus:outline-none focus:ring-2 focus:ring-stone-900/10 focus:border-stone-900 bg-stone-50/40 leading-relaxed transition-all"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-stone-800 mb-1.5">
                  Impact on Relationship:
                </label>
                <select
                  value={impact}
                  onChange={(e) => setImpact(e.target.value)}
                  className="w-full px-3 py-2.5 border border-stone-200 rounded-xl text-xs bg-white font-medium focus:outline-none focus:ring-2 focus:ring-stone-900/10 focus:border-stone-900 shadow-2xs"
                >
                  <option value="improved">Improved / Repaired</option>
                  <option value="preserved">Preserved / Neutral</option>
                  <option value="strained">Strained</option>
                  <option value="ended">Ended</option>
                </select>
              </div>

              <div className="text-[11px] text-stone-500 leading-relaxed bg-stone-50/80 p-3 rounded-2xl border border-stone-200/70">
                This outcome will be saved in your longitudinal relationship memory (Mem0) so that future relationship reasoning benefits from your actual experiences.
              </div>
            </form>

            {/* Footer (Fixed - shrink-0) */}
            <div className="shrink-0 px-6 py-3 border-t border-stone-100 bg-stone-50/70 flex items-center justify-end gap-2.5">
              <button
                type="button"
                onClick={() => setOutcomeModalDecision(null)}
                className="px-4 py-2 border border-stone-200 rounded-xl text-xs font-semibold text-stone-700 hover:bg-white hover:border-stone-300 transition-all"
              >
                Cancel
              </button>
              <button
                type="submit"
                form="record-outcome-form"
                disabled={submittingOutcome || !outcomeText.trim()}
                className="px-5 py-2 bg-stone-900 text-stone-50 rounded-xl text-xs font-bold hover:bg-stone-800 disabled:opacity-50 flex items-center gap-1.5 shadow-xs transition-all hover:scale-101"
              >
                {submittingOutcome && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                <span>Save Outcome</span>
              </button>
            </div>
          </div>
        </div>,
        document.body
      )}
    </div>
  );
}
