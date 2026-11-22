"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter, useParams } from "next/navigation";
import { 
  getPerson, 
  getRelationship, 
  getRelationshipEvents, 
  deletePerson, 
  deleteRelationshipEvent,
  sendAgentMessage
} from "@/lib/api";
import { Person, Relationship, RelationshipEvent } from "@/types";
import { AddEventModal } from "@/components/AddEventModal";
import { usePrivacy } from "@/context/PrivacyContext";
import { 
  Clock, 
  Calendar, 
  Bot, 
  Trash2, 
  Plus, 
  ArrowLeft, 
  Sparkles, 
  CheckCircle2, 
  AlertCircle, 
  Send, 
  History,
  Tag,
  Loader2,
  Activity,
  Heart,
  Shield,
  MessageSquare,
  Lock,
  Unlock,
  HeartHandshake,
  AlertTriangle,
  Flame,
  ArrowRight
} from "lucide-react";

export default function PersonProfilePage() {
  const params = useParams();
  const personId = params?.id as string;
  const router = useRouter();
  const { isLocked, resolveName, openModal } = usePrivacy();

  const [person, setPerson] = useState<Person | null>(null);
  const [relationship, setRelationship] = useState<Relationship | null>(null);
  const [events, setEvents] = useState<RelationshipEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<"overview" | "timeline" | "contexts" | "ask_ai">("overview");
  const [isAddEventOpen, setIsAddEventOpen] = useState(false);

  // Dedicated Relationship Q&A
  const [aiQuery, setAiQuery] = useState("");
  const [aiThinking, setAiThinking] = useState(false);
  const [aiAnswer, setAiAnswer] = useState<string | null>(null);

  const fetchProfileData = async () => {
    try {
      setLoading(true);
      const personData = await getPerson(personId);
      setPerson(personData);

      try {
        const relData = await getRelationship(personId);
        setRelationship(relData);
        if (relData.id) {
          const evData = await getRelationshipEvents(relData.id);
          setEvents(evData);
        }
      } catch {
        // Fallback or direct person match
      }
    } catch (err: any) {
      console.error("Profile load error:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (personId) {
      fetchProfileData();
    }
  }, [personId]);

  const handleDeletePerson = async () => {
    if (!confirm(`Are you sure you want to delete ${person?.name}? This will remove all associated memories.`)) {
      return;
    }
    try {
      await deletePerson(personId);
      router.push("/people");
    } catch (err: any) {
      alert("Error deleting person: " + err.message);
    }
  };

  const handleDeleteEvent = async (eventId: string) => {
    if (!confirm("Delete this timeline record?")) return;
    try {
      await deleteRelationshipEvent(eventId);
      setEvents(events.filter((e) => e.id !== eventId));
    } catch (err: any) {
      alert("Error deleting event: " + err.message);
    }
  };

  const handleAskAI = async (queryText?: string) => {
    const q = queryText || aiQuery;
    if (!q.trim()) return;
    try {
      setAiThinking(true);
      setAiAnswer(null);
      const res = await sendAgentMessage(q, personId, undefined, "hybrid");
      setAiAnswer(res.reply);
    } catch (err: any) {
      setAiAnswer("Error consulting relationship intelligence: " + err.message);
    } finally {
      setAiThinking(false);
    }
  };

  if (loading) {
    return (
      <div className="py-24 flex justify-center text-stone-400">
        <Loader2 className="w-8 h-8 animate-spin" />
      </div>
    );
  }

  if (!person) {
    return (
      <div className="text-center py-16 space-y-3">
        <h3 className="font-bold text-stone-900 text-lg">Person not found</h3>
        <Link href="/people" className="text-xs text-stone-600 underline">
          Back to people list
        </Link>
      </div>
    );
  }

  const displayName = resolveName(person);

  return (
    <div className="space-y-6 animate-fade-in pb-12">
      {/* Top Navigation */}
      <div className="flex items-center justify-between">
        <Link
          href="/people"
          className="inline-flex items-center gap-1.5 text-xs font-bold text-stone-600 hover:text-stone-950 transition-colors"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Back to People</span>
        </Link>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setIsAddEventOpen(true)}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-stone-900 text-stone-50 rounded-xl text-xs font-bold hover:bg-stone-800 shadow-xs transition-colors"
          >
            <Plus className="w-3.5 h-3.5 text-amber-300" />
            <span>Record Note / Event</span>
          </button>
          <button
            onClick={handleDeletePerson}
            className="p-2 text-stone-400 hover:text-rose-600 hover:bg-rose-50 rounded-xl transition-colors"
            title="Delete profile"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Hero Profile Card */}
      <div className="bg-white border border-stone-200/90 rounded-3xl p-6 sm:p-7 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="flex items-center gap-4">
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-amber-100 to-orange-100 border border-amber-200 text-amber-950 font-bold text-2xl flex items-center justify-center shadow-2xs shrink-0">
            {displayName[0]?.toUpperCase() || "P"}
          </div>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h1 className="text-2xl font-black text-stone-950">{displayName}</h1>
              {isLocked && person.alias ? (
                <button
                  onClick={openModal}
                  title="Identity cloaked behind proxy alias. Click to unlock."
                  className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-bold bg-amber-100 text-amber-950 border border-amber-300 hover:bg-amber-200 transition-colors"
                >
                  <Lock className="w-3 h-3 text-amber-700" />
                  <span>Proxy ({person.aliasCategory || "category"}) &middot; Unlock</span>
                </button>
              ) : !isLocked && person.alias ? (
                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-stone-100 text-stone-700 border border-stone-200">
                  <Unlock className="w-3 h-3 text-emerald-600" />
                  <span>Proxy: {person.alias}</span>
                </span>
              ) : null}
              <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-emerald-50 text-emerald-900 border border-emerald-200 capitalize">
                {person.status || "active"}
              </span>
            </div>
            <p className="text-xs sm:text-sm text-stone-500 font-medium mt-1">
              <span className="font-bold text-stone-700">{person.relationshipType}</span>
              <span className="text-stone-300 mx-1.5">&middot;</span>
              <span>Known for <strong className="text-stone-800">{person.duration || "unspecified"}</strong></span>
            </p>
          </div>
        </div>

        <div className="flex items-center gap-6 text-xs text-stone-500 md:border-l md:border-stone-200/80 md:pl-8 shrink-0">
          <div>
            <span className="block text-stone-400 text-[10px] uppercase font-bold tracking-wider">
              Timeline Records
            </span>
            <span className="font-black text-stone-900 text-lg">{events.length}</span>
          </div>
          <div>
            <span className="block text-stone-400 text-[10px] uppercase font-bold tracking-wider">
              Last Interaction
            </span>
            <span className="font-bold text-stone-800 text-sm">{person.lastInteraction || "Recent"}</span>
          </div>
        </div>
      </div>

      {/* Segmented Navigation Tabs */}
      <div className="flex bg-stone-100/80 p-1.5 rounded-2xl border border-stone-200/70 text-xs font-bold overflow-x-auto gap-1">
        <button
          onClick={() => setActiveTab("overview")}
          className={`px-4 py-2 rounded-xl transition-all shrink-0 ${
            activeTab === "overview"
              ? "bg-white text-stone-950 shadow-xs border border-stone-200 font-extrabold"
              : "text-stone-600 hover:text-stone-900"
          }`}
        >
          Overview & Dynamics
        </button>
        <button
          onClick={() => setActiveTab("timeline")}
          className={`px-4 py-2 rounded-xl transition-all shrink-0 ${
            activeTab === "timeline"
              ? "bg-white text-stone-950 shadow-xs border border-stone-200 font-extrabold"
              : "text-stone-600 hover:text-stone-900"
          }`}
        >
          Longitudinal Timeline ({events.length})
        </button>
        <button
          onClick={() => setActiveTab("contexts")}
          className={`px-4 py-2 rounded-xl transition-all shrink-0 ${
            activeTab === "contexts"
              ? "bg-white text-stone-950 shadow-xs border border-stone-200 font-extrabold"
              : "text-stone-600 hover:text-stone-900"
          }`}
        >
          Context Matrix
        </button>
        <button
          onClick={() => setActiveTab("ask_ai")}
          className={`px-4 py-2 rounded-xl transition-all flex items-center gap-1.5 shrink-0 ${
            activeTab === "ask_ai"
              ? "bg-white text-stone-950 shadow-xs border border-stone-200 font-extrabold"
              : "text-stone-600 hover:text-stone-900"
          }`}
        >
          <Bot className="w-3.5 h-3.5 text-amber-600" />
          <span>Ask Relationship AI</span>
        </button>
      </div>

      {/* TAB 1: OVERVIEW */}
      {activeTab === "overview" && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="md:col-span-2 space-y-6">
            {/* Descriptive Context Observations */}
            <div className="bg-white border border-stone-200/90 rounded-3xl p-6 sm:p-7 shadow-xs space-y-4">
              <div>
                <h3 className="text-base font-bold text-stone-950">
                  Descriptive Context & Behavioral Patterns
                </h3>
                <p className="text-xs text-stone-500 mt-0.5">
                  Non-clinical observations grounded in your accumulated history.
                </p>
              </div>

              <div className="space-y-3 text-xs">
                <div className="p-4 bg-emerald-50/60 rounded-2xl border border-emerald-200/70 flex items-start gap-3.5">
                  <div className="w-8 h-8 rounded-xl bg-emerald-100 text-emerald-800 flex items-center justify-center shrink-0">
                    <Heart className="w-4 h-4" />
                  </div>
                  <div>
                    <span className="font-bold text-emerald-950 text-sm">Supportive Foundation:</span>
                    <p className="text-emerald-900/80 mt-1 leading-relaxed">
                      You have documented consistent support from {displayName} during difficult personal circumstances (e.g. 2023 transition).
                    </p>
                  </div>
                </div>

                <div className="p-4 bg-amber-50/60 rounded-2xl border border-amber-200/70 flex items-start gap-3.5">
                  <div className="w-8 h-8 rounded-xl bg-amber-100 text-amber-900 flex items-center justify-center shrink-0">
                    <AlertTriangle className="w-4 h-4" />
                  </div>
                  <div>
                    <span className="font-bold text-amber-950 text-sm">Contextual Friction:</span>
                    <p className="text-amber-900/80 mt-1 leading-relaxed">
                      Defensive behavior and sharp arguments have clustered almost exclusively around political discussions.
                    </p>
                  </div>
                </div>

                <div className="p-4 bg-blue-50/60 rounded-2xl border border-blue-200/70 flex items-start gap-3.5">
                  <div className="w-8 h-8 rounded-xl bg-blue-100 text-blue-900 flex items-center justify-center shrink-0">
                    <HeartHandshake className="w-4 h-4" />
                  </div>
                  <div>
                    <span className="font-bold text-blue-950 text-sm">Demonstrated Recovery Capacity:</span>
                    <p className="text-blue-900/80 mt-1 leading-relaxed">
                      A previous disagreement led to a 4-day communication pause, after which both parties successfully reconciled over a conversation.
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Timeline preview */}
            <div className="bg-white border border-stone-200/90 rounded-3xl p-6 sm:p-7 shadow-xs">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-base font-bold text-stone-950">Recent Timeline Events</h3>
                <button
                  onClick={() => setActiveTab("timeline")}
                  className="text-xs font-bold text-stone-800 hover:text-stone-950 flex items-center gap-1"
                >
                  <span>View full timeline</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>

              {events.length === 0 ? (
                <p className="text-xs text-stone-400 italic">No events recorded yet.</p>
              ) : (
                <div className="space-y-3">
                  {events
                    .slice(-3)
                    .reverse()
                    .map((ev) => (
                      <div
                        key={ev.id}
                        className="p-4 rounded-2xl border border-stone-200/70 bg-stone-50/60 text-xs"
                      >
                        <div className="flex items-center justify-between text-[11px] text-stone-400 mb-1.5">
                          <span className="font-bold text-stone-900">{ev.timestamp || "Recent"}</span>
                          <span className="capitalize px-2.5 py-0.5 bg-white border border-stone-200 rounded-md text-stone-700 font-bold">
                            {ev.context} / {ev.eventType}
                          </span>
                        </div>
                        <p className="text-stone-900 font-medium leading-relaxed">{ev.description}</p>
                        {ev.observedBehavior && (
                          <p className="text-[11px] text-stone-500 mt-1.5">
                            <strong>Observed:</strong> {ev.observedBehavior}
                          </p>
                        )}
                      </div>
                    ))}
                </div>
              )}
            </div>
          </div>

          {/* Sidebar Action Column */}
          <div className="space-y-6">
            <div className="bg-stone-900 text-stone-50 rounded-3xl p-6 shadow-xs space-y-4">
              <div className="flex items-center gap-2 text-amber-400 text-xs font-bold uppercase tracking-wider">
                <Sparkles className="w-3.5 h-3.5" />
                <span>Relationship Intelligence</span>
              </div>
              <h4 className="font-bold text-lg leading-tight">
                Evaluate consequential moments with {displayName}
              </h4>
              <p className="text-xs text-stone-300 leading-relaxed font-normal">
                Before confronting or ending contact, let the AI review your accumulated history and explore plausible consequences with you.
              </p>
              <Link
                href={`/agent?personId=${person.id}&msg=${encodeURIComponent(`I'm considering cutting contact with ${displayName}`)}`}
                className="inline-flex items-center justify-center w-full py-2.5 px-4 bg-amber-400 hover:bg-amber-300 text-stone-950 rounded-xl text-xs font-bold transition-colors shadow-2xs gap-1.5"
              >
                <span>Test Decision in Reasoning Agent</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>

            {/* Quick Reflection Prompts */}
            <div className="bg-white border border-stone-200/90 rounded-3xl p-6 shadow-xs space-y-3">
              <h4 className="text-xs font-bold text-stone-950 uppercase tracking-wider">
                Sample Reflection Queries
              </h4>
              <div className="space-y-2">
                {[
                  "What patterns have I recorded regarding politics?",
                  "How did we resolve our previous conflict?",
                  "Has communication frequency changed recently?",
                  "What should I consider before bringing up a sensitive topic?"
                ].map((promptText, i) => (
                  <button
                    key={i}
                    onClick={() => {
                      setActiveTab("ask_ai");
                      setAiQuery(promptText);
                      handleAskAI(promptText);
                    }}
                    className="w-full text-left p-2.5 rounded-xl bg-stone-50 hover:bg-stone-100 text-stone-800 border border-stone-200/80 text-xs font-medium transition-all shadow-2xs hover:border-stone-300"
                  >
                    "{promptText}"
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: TIMELINE */}
      {activeTab === "timeline" && (
        <div className="bg-white border border-stone-200/90 rounded-3xl p-6 sm:p-7 shadow-xs space-y-6">
          <div className="flex items-center justify-between pb-4 border-b border-stone-100">
            <div>
              <h3 className="text-base font-bold text-stone-950">Longitudinal Timeline</h3>
              <p className="text-xs text-stone-500">
                Chronological history of interactions, milestones, pauses, and reconciliations
              </p>
            </div>
            <button
              onClick={() => setIsAddEventOpen(true)}
              className="px-4 py-2 bg-stone-900 text-stone-50 text-xs font-bold rounded-xl hover:bg-stone-800 transition-colors shadow-xs"
            >
              + Record Event
            </button>
          </div>

          {events.length === 0 ? (
            <div className="text-center py-16 text-stone-400 text-xs space-y-2">
              <p>No timeline events recorded yet.</p>
              <button
                onClick={() => setIsAddEventOpen(true)}
                className="text-amber-800 font-bold hover:underline"
              >
                Record the first interaction note &rarr;
              </button>
            </div>
          ) : (
            <div className="relative pl-6 sm:pl-8 border-l-2 border-stone-200 space-y-6 my-4">
              {events.map((ev) => {
                let badgeColor = "border-stone-400 bg-stone-100 text-stone-700";
                let Icon = Activity;
                if (ev.eventType === "conflict") {
                  badgeColor = "border-rose-400 bg-rose-50 text-rose-700";
                  Icon = AlertTriangle;
                } else if (ev.eventType === "support") {
                  badgeColor = "border-emerald-400 bg-emerald-50 text-emerald-700";
                  Icon = Heart;
                } else if (ev.eventType === "reconciliation") {
                  badgeColor = "border-blue-400 bg-blue-50 text-blue-700";
                  Icon = HeartHandshake;
                } else if (ev.eventType === "communication_gap") {
                  badgeColor = "border-amber-400 bg-amber-50 text-amber-700";
                  Icon = Clock;
                }

                return (
                  <div key={ev.id} className="relative group">
                    {/* Circle Node */}
                    <div
                      className={`absolute -left-[31px] sm:-left-[39px] top-1.5 w-5 h-5 rounded-full border-2 bg-white flex items-center justify-center shadow-2xs ${badgeColor}`}
                    >
                      <span className="w-2 h-2 rounded-full bg-current" />
                    </div>

                    <div className="bg-stone-50/80 border border-stone-200/80 rounded-2xl p-4 sm:p-5 shadow-2xs hover:border-stone-300 transition-colors">
                      <div className="flex items-center justify-between text-xs mb-2">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="font-bold text-stone-950 text-sm">{ev.timestamp || "Undated"}</span>
                          <span className="text-[11px] px-2.5 py-0.5 rounded-full capitalize bg-white text-stone-800 border border-stone-200 font-bold shadow-2xs">
                            {ev.context} &middot; {ev.eventType.replace("_", " ")}
                          </span>
                        </div>
                        <button
                          onClick={() => handleDeleteEvent(ev.id)}
                          className="opacity-0 group-hover:opacity-100 text-stone-400 hover:text-rose-600 transition-opacity p-1"
                          title="Delete record"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>

                      <p className="text-xs sm:text-sm text-stone-900 leading-relaxed font-medium">{ev.description}</p>

                      {(ev.observedBehavior || ev.userEmotion || ev.outcome) && (
                        <div className="mt-3.5 pt-3 border-t border-stone-200/60 grid grid-cols-1 sm:grid-cols-3 gap-2 text-xs text-stone-600">
                          {ev.observedBehavior && (
                            <div className="bg-white p-2 rounded-xl border border-stone-200/70">
                              <span className="font-bold text-stone-800 block text-[10px] uppercase">Observed:</span>
                              {ev.observedBehavior}
                            </div>
                          )}
                          {ev.userEmotion && (
                            <div className="bg-white p-2 rounded-xl border border-stone-200/70">
                              <span className="font-bold text-stone-800 block text-[10px] uppercase">User Emotion:</span>
                              {ev.userEmotion}
                            </div>
                          )}
                          {ev.outcome && (
                            <div className="bg-white p-2 rounded-xl border border-stone-200/70">
                              <span className="font-bold text-stone-800 block text-[10px] uppercase">Outcome:</span>
                              {ev.outcome}
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* TAB 3: CONTEXTS */}
      {activeTab === "contexts" && (
        <div className="bg-white border border-stone-200/90 rounded-3xl p-6 sm:p-7 shadow-xs space-y-4">
          <div>
            <h3 className="text-base font-bold text-stone-950">
              Context-Dependent Behavioral Patterns
            </h3>
            <p className="text-xs text-stone-500">
              Humans behave differently across environments. Here is how dynamics with {displayName} vary by context:
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
            <div className="p-5 rounded-2xl border border-rose-200/80 bg-rose-50/50 space-y-2">
              <div className="flex items-center justify-between">
                <span className="font-bold text-rose-950 text-xs uppercase tracking-wider">Politics</span>
                <span className="text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-rose-100 text-rose-800 border border-rose-200">
                  High Friction Pattern
                </span>
              </div>
              <p className="text-xs text-stone-800 leading-relaxed font-medium">
                Repeated defensive interactions recorded during political disagreements. Heated discussions frequently trigger communication gaps unless intentionally paused.
              </p>
            </div>

            <div className="p-5 rounded-2xl border border-emerald-200/80 bg-emerald-50/50 space-y-2">
              <div className="flex items-center justify-between">
                <span className="font-bold text-emerald-950 text-xs uppercase tracking-wider">Personal Problems</span>
                <span className="text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-800 border border-emerald-200">
                  Consistently Supportive
                </span>
              </div>
              <p className="text-xs text-stone-800 leading-relaxed font-medium">
                Supportive, attentive, and dependable during personal life challenges and stressful transitions.
              </p>
            </div>

            <div className="p-5 rounded-2xl border border-blue-200/80 bg-blue-50/50 space-y-2">
              <div className="flex items-center justify-between">
                <span className="font-bold text-blue-950 text-xs uppercase tracking-wider">Casual Conversations</span>
                <span className="text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-blue-100 text-blue-800 border border-blue-200">
                  Positive & Relaxed
                </span>
              </div>
              <p className="text-xs text-stone-800 leading-relaxed font-medium">
                Humorous, warm, and relaxed tone when catching up on shared memories and everyday topics.
              </p>
            </div>

            <div className="p-5 rounded-2xl border border-stone-200 bg-stone-50/60 space-y-2">
              <div className="flex items-center justify-between">
                <span className="font-bold text-stone-700 text-xs uppercase tracking-wider">Work / Professional</span>
                <span className="text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-stone-100 text-stone-600 border border-stone-200">
                  Low Interaction
                </span>
              </div>
              <p className="text-xs text-stone-700 leading-relaxed">
                Few interactions recorded around career or work projects.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* TAB 4: ASK AI AGENT */}
      {activeTab === "ask_ai" && (
        <div className="bg-white border border-stone-200/90 rounded-3xl p-6 sm:p-7 shadow-xs space-y-5">
          <div>
            <h3 className="text-base font-bold text-stone-950 flex items-center gap-2">
              <Bot className="w-5 h-5 text-amber-600" />
              <span>Ask Relationship AI about {displayName}</span>
            </h3>
            <p className="text-xs text-stone-500 mt-0.5">
              Reason over recorded timeline events, context observations, and Mem0 semantic history.
            </p>
          </div>

          {/* Input Form */}
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleAskAI();
            }}
            className="flex gap-2"
          >
            <input
              type="text"
              value={aiQuery}
              onChange={(e) => setAiQuery(e.target.value)}
              placeholder={`Ask a question about your history with ${displayName}...`}
              className="flex-1 px-4 py-2.5 bg-stone-50 border border-stone-200 rounded-xl text-xs font-medium focus:outline-none focus:ring-2 focus:ring-stone-900"
            />
            <button
              type="submit"
              disabled={aiThinking || !aiQuery.trim()}
              className="px-5 py-2.5 bg-stone-900 text-stone-50 rounded-xl text-xs font-bold hover:bg-stone-800 transition-colors disabled:opacity-50 flex items-center gap-1.5 shadow-xs shrink-0"
            >
              {aiThinking ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Send className="w-3.5 h-3.5" />}
              <span>Consult AI</span>
            </button>
          </form>

          {/* AI Response Box */}
          {aiThinking && (
            <div className="p-8 text-center text-xs text-stone-500 space-y-2">
              <Loader2 className="w-6 h-6 animate-spin mx-auto text-amber-600" />
              <p>Reviewing longitudinal relationship history and context patterns...</p>
            </div>
          )}

          {aiAnswer && !aiThinking && (
            <div className="p-5 bg-stone-50 border border-stone-200 rounded-2xl space-y-3 animate-fade-in">
              <div className="flex items-center gap-2 text-xs font-bold text-stone-900">
                <Sparkles className="w-4 h-4 text-amber-600" />
                <span>Relationship Intelligence Analysis:</span>
              </div>
              <div className="text-xs text-stone-800 leading-relaxed whitespace-pre-wrap font-medium">
                {aiAnswer}
              </div>
            </div>
          )}
        </div>
      )}

      {relationship?.id && (
        <AddEventModal
          isOpen={isAddEventOpen}
          onClose={() => setIsAddEventOpen(false)}
          relationshipId={relationship.id}
          personId={person.id}
          personName={displayName}
          onEventCreated={(ev) => setEvents([...events, ev])}
        />
      )}
    </div>
  );
}
