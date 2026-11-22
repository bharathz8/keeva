"use client";

import React, { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import { 
  X, 
  Sparkles, 
  Plus, 
  Loader2, 
  Check, 
  Calendar,
  MessageSquarePlus,
  ArrowRight
} from "lucide-react";
import { extractEventFromNote, createRelationshipEvent } from "@/lib/api";
import { RelationshipEvent, ExtractedEventDraft } from "@/types";

interface Props {
  isOpen: boolean;
  onClose: () => void;
  relationshipId: string;
  personId?: string;
  personName: string;
  onEventCreated: (event: RelationshipEvent) => void;
}

export const AddEventModal: React.FC<Props> = ({
  isOpen,
  onClose,
  relationshipId,
  personId,
  personName,
  onEventCreated,
}) => {
  const [mounted, setMounted] = useState(false);
  const [naturalNote, setNaturalNote] = useState("");
  const [extracting, setExtracting] = useState(false);
  const [saving, setSaving] = useState(false);
  const [draft, setDraft] = useState<ExtractedEventDraft | null>(null);

  useEffect(() => {
    setMounted(true);
  }, []);

  // Editable fields
  const [date, setDate] = useState(new Date().toISOString().slice(0, 10));
  const [context, setContext] = useState("general");
  const [eventType, setEventType] = useState("interaction");
  const [description, setDescription] = useState("");
  const [userEmotion, setUserEmotion] = useState("");
  const [observedBehavior, setObservedBehavior] = useState("");
  const [outcome, setOutcome] = useState("");

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

  if (!isOpen || !mounted) return null;

  const handleExtractWithAI = async () => {
    if (!naturalNote.trim()) return;
    try {
      setExtracting(true);
      const res = await extractEventFromNote(naturalNote.trim(), personId);
      setDraft(res);
      setContext(res.context || "general");
      setEventType(res.eventType || "interaction");
      setDescription(res.description || naturalNote.trim());
      setUserEmotion(res.userEmotion || "");
      setObservedBehavior(res.observedBehavior || "");
      setOutcome(res.outcome || "");
      if (res.suggestedTimelineDate) {
        setDate(res.suggestedTimelineDate);
      }
    } catch (err: any) {
      alert("Extraction error: " + err.message);
    } finally {
      setExtracting(false);
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!description.trim()) return;

    try {
      setSaving(true);
      const newEvent = await createRelationshipEvent(relationshipId, {
        relationshipId,
        personId,
        timestamp: date,
        context,
        eventType,
        description: description.trim(),
        userEmotion: userEmotion.trim() || undefined,
        observedBehavior: observedBehavior.trim() || undefined,
        outcome: outcome.trim() || undefined,
        source: draft ? "natural_extraction" : "user_note",
        confidence: draft ? draft.confidence : 0.9,
      });
      onEventCreated(newEvent);
      onClose();
      // Reset form
      setNaturalNote("");
      setDraft(null);
      setDescription("");
      setObservedBehavior("");
      setOutcome("");
    } catch (err: any) {
      alert("Error saving event: " + err.message);
    } finally {
      setSaving(false);
    }
  };

  const modalContent = (
    <div 
      className="fixed inset-0 z-[9999] flex items-center justify-center p-3 sm:p-6 bg-stone-950/65 backdrop-blur-xs animate-fade-in"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div 
        className="bg-white rounded-3xl max-w-lg w-full shadow-2xl border border-stone-200/90 flex flex-col max-h-[85vh] sm:max-h-[88vh] overflow-hidden animate-modal-pop"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header (Fixed) */}
        <div className="shrink-0 flex items-center justify-between px-6 py-4 border-b border-stone-100 bg-stone-50/50">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-stone-900 text-stone-100 flex items-center justify-center shadow-xs">
              <MessageSquarePlus className="w-5 h-5 text-amber-300" />
            </div>
            <div>
              <h3 className="font-bold text-stone-900 text-base leading-tight">Record Interaction / Note</h3>
              <p className="text-xs text-stone-500 mt-0.5">Log longitudinal event regarding <span className="font-semibold text-stone-700">{personName}</span></p>
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

        {/* Scrollable Body */}
        <div className="flex-1 min-h-0 overflow-y-auto px-6 py-4 space-y-3.5">
          {/* Natural Language Note Input */}
          <div className="p-4 bg-stone-50/90 rounded-2xl border border-stone-200/90 space-y-3 shadow-2xs">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold text-stone-900">
                Describe naturally what happened:
              </label>
              <span className="text-[10px] text-stone-500 font-medium">Non-diagnostic</span>
            </div>
            <textarea
              rows={3}
              value={naturalNote}
              onChange={(e) => setNaturalNote(e.target.value)}
              placeholder="e.g. Rahul ignored me today and when I asked him about it he got defensive during our discussion on politics. Later he apologized over text."
              className="w-full px-3.5 py-2.5 border border-stone-200 bg-white rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-stone-900/10 focus:border-stone-900 leading-relaxed font-medium shadow-2xs transition-all"
            />
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pt-1">
              <span className="text-[11px] text-stone-500 font-medium">
                AI extracts structured observations without personality labels.
              </span>
              <button
                type="button"
                onClick={handleExtractWithAI}
                disabled={extracting || !naturalNote.trim()}
                className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-stone-900 text-stone-50 rounded-xl text-xs font-bold hover:bg-stone-800 disabled:opacity-50 transition-all shadow-xs shrink-0 hover:scale-101"
              >
                {extracting ? (
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                ) : (
                  <Sparkles className="w-3.5 h-3.5 text-amber-300" />
                )}
                <span>Extract Structured Memory</span>
              </button>
            </div>
          </div>

          {/* Confirmation banner if AI extracted */}
          {draft && (
            <div className="p-3.5 bg-emerald-50 border border-emerald-200 rounded-2xl flex items-start gap-3 text-xs text-emerald-950 shadow-2xs">
              <Check className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
              <div>
                <span className="font-bold">
                  Observation extracted (Confidence: {Math.round(draft.confidence * 100)}%):
                </span>
                <p className="text-[11px] text-emerald-800 mt-0.5 leading-relaxed">
                  Review and edit the fields below before saving. You remain in control.
                </p>
              </div>
            </div>
          )}

          {/* Structured Form for User Review and Confirmation */}
          <form id="add-event-form" onSubmit={handleSave} className="space-y-3.5">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-bold text-stone-700 mb-1">Date</label>
                <input
                  type="text"
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                  placeholder="YYYY-MM-DD or Year"
                  className="w-full px-3 py-2 border border-stone-200 rounded-xl text-xs font-semibold text-stone-900 focus:outline-none focus:ring-2 focus:ring-stone-900/10 focus:border-stone-900 bg-stone-50/40"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-stone-700 mb-1">Context</label>
                <input
                  type="text"
                  value={context}
                  onChange={(e) => setContext(e.target.value)}
                  placeholder="e.g. politics, personal problems, work"
                  className="w-full px-3 py-2 border border-stone-200 rounded-xl text-xs font-semibold text-stone-900 focus:outline-none focus:ring-2 focus:ring-stone-900/10 focus:border-stone-900 bg-stone-50/40"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-bold text-stone-700 mb-1">Event Type</label>
                <select
                  value={eventType}
                  onChange={(e) => setEventType(e.target.value)}
                  className="w-full px-3 py-2 border border-stone-200 rounded-xl text-xs font-medium focus:outline-none focus:ring-2 focus:ring-stone-900/10 focus:border-stone-900 bg-white"
                >
                  <option value="conflict">Conflict</option>
                  <option value="support">Support</option>
                  <option value="reconciliation">Reconciliation</option>
                  <option value="communication_gap">Communication Gap</option>
                  <option value="milestone">Milestone</option>
                  <option value="casual">Casual Interaction</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-bold text-stone-700 mb-1">Your Feeling / Emotion</label>
                <input
                  type="text"
                  value={userEmotion}
                  onChange={(e) => setUserEmotion(e.target.value)}
                  placeholder="e.g. hurt, grateful, distant"
                  className="w-full px-3 py-2 border border-stone-200 rounded-xl text-xs font-medium focus:outline-none focus:ring-2 focus:ring-stone-900/10 focus:border-stone-900 bg-stone-50/40"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-stone-700 mb-1">Observable Behavior (What happened)</label>
              <input
                type="text"
                value={observedBehavior}
                onChange={(e) => setObservedBehavior(e.target.value)}
                placeholder="e.g. became defensive, stopped replying for 4 days"
                className="w-full px-3 py-2 border border-stone-200 rounded-xl text-xs font-medium focus:outline-none focus:ring-2 focus:ring-stone-900/10 focus:border-stone-900 bg-stone-50/40"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-stone-700 mb-1">Event Description</label>
              <textarea
                rows={2}
                required
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Objective summary of the interaction..."
                className="w-full px-3 py-2 border border-stone-200 rounded-xl text-xs font-medium focus:outline-none focus:ring-2 focus:ring-stone-900/10 focus:border-stone-900 bg-stone-50/40 leading-relaxed"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-stone-700 mb-1">Outcome / Immediate Resolution</label>
              <input
                type="text"
                value={outcome}
                onChange={(e) => setOutcome(e.target.value)}
                placeholder="e.g. stopped talking for 4 days, reconciled over phone call"
                className="w-full px-3 py-2 border border-stone-200 rounded-xl text-xs font-medium focus:outline-none focus:ring-2 focus:ring-stone-900/10 focus:border-stone-900 bg-stone-50/40"
              />
            </div>
          </form>
        </div>

        {/* Footer (Fixed - shrink-0) */}
        <div className="shrink-0 px-6 py-3.5 border-t border-stone-100 bg-stone-50/70 flex items-center justify-end gap-2.5">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 border border-stone-200 rounded-xl text-xs font-semibold text-stone-700 hover:bg-white hover:border-stone-300 transition-all"
          >
            Cancel
          </button>
          <button
            type="submit"
            form="add-event-form"
            disabled={saving || !description.trim()}
            className="px-5 py-2 bg-stone-900 text-stone-50 rounded-xl text-xs font-bold hover:bg-stone-800 disabled:opacity-50 flex items-center gap-2 shadow-xs transition-all hover:scale-101"
          >
            {saving && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
            <span>Confirm & Save to Timeline</span>
          </button>
        </div>
      </div>
    </div>
  );

  return typeof document !== "undefined" ? createPortal(modalContent, document.body) : null;
};
