"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { getPeople, getDecisions } from "@/lib/api";
import { Person, DecisionRecord } from "@/types";
import { RelationshipCard } from "@/components/RelationshipCard";
import { AddPersonModal } from "@/components/AddPersonModal";
import { usePrivacy } from "@/context/PrivacyContext";
import { useAuth } from "@/context/AuthContext";
import { 
  Users, 
  Bot, 
  History, 
  UserPlus, 
  Sparkles, 
  ArrowRight, 
  ShieldCheck, 
  Compass, 
  Clock, 
  CheckCircle2, 
  Loader2,
  HeartHandshake,
  BrainCircuit,
  Lock,
  Unlock,
  AlertTriangle,
  Flame,
  Shield,
  LogIn
} from "lucide-react";

export default function DashboardPage() {
  const { user, loading: authLoading, openAuthModal } = useAuth();
  const [people, setPeople] = useState<Person[]>([]);
  const [decisions, setDecisions] = useState<DecisionRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const { isLocked, openModal, resolveName } = usePrivacy();

  const fetchData = async () => {
    try {
      setLoading(true);
      const [pData, dData] = await Promise.all([getPeople(), getDecisions()]);
      setPeople(pData);
      setDecisions(dData);
    } catch (err) {
      console.error("Dashboard fetch error:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (authLoading) return;
    if (!user) {
      setLoading(false);
      return;
    }
    fetchData();
  }, [authLoading, user]);

  return (
    <div className="space-y-8 animate-fade-in pb-16 md:pb-8">
      {/* Hero Welcome & Philosophy */}
      <div className="relative overflow-hidden bg-white border border-stone-200/90 rounded-2xl p-6 sm:p-8 lg:p-9 shadow-xs">
        <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div className="space-y-3 max-w-2xl">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-stone-100 border border-stone-200/80 text-stone-800 text-xs font-semibold shadow-2xs">
              <Sparkles className="w-3.5 h-3.5 text-amber-600" />
              <span>External Relationship Memory & Reasoning</span>
            </div>
            <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold tracking-tight text-stone-900 leading-tight">
              Remember the relationship, not just the conversation.
            </h1>
            <p className="text-xs sm:text-sm text-stone-600 leading-relaxed font-normal">
              Humans cannot perfectly retain years of interactions, friction patterns, and contexts.
              When emotionally activated or considering a consequential action, Keeva triggers a <strong>Pause</strong>, reviews accumulated history, and evaluates future consequences—<strong>never deciding for you</strong>.
            </p>

            {/* Quick Flagship Prompt Pill */}
            <div className="pt-1.5 flex items-center gap-2 flex-wrap">
              <span className="text-[11px] font-semibold text-stone-500 uppercase tracking-wider">
                Flagship Test Prompt:
              </span>
              <Link
                href="/agent?msg=Rahul%20ignored%20me%20again.%20I'm%20done%20with%20this%20friendship."
                className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-xl bg-amber-50/80 border border-amber-200 text-amber-950 text-xs font-semibold hover:bg-amber-100/70 transition-all shadow-2xs group"
              >
                <span>"Rahul ignored me again. I'm done with this friendship."</span>
                <ArrowRight className="w-3.5 h-3.5 text-amber-700 group-hover:translate-x-0.5 transition-transform" />
              </Link>
            </div>
          </div>

          <div className="flex flex-row lg:flex-col gap-2.5 shrink-0 pt-2 lg:pt-0">
            <Link
              href="/agent"
              className="inline-flex items-center justify-center gap-2 px-5 py-2.5 bg-stone-900 text-stone-50 rounded-xl text-xs font-semibold hover:bg-stone-800 shadow-xs transition-all duration-150 group"
            >
              <Bot className="w-4 h-4 text-amber-300 group-hover:scale-105 transition-transform" />
              <span>Start AI Reasoning</span>
            </Link>
            <button
              onClick={() => setIsAddModalOpen(true)}
              className="inline-flex items-center justify-center gap-2 px-4 py-2.5 bg-white text-stone-800 border border-stone-200/90 rounded-xl text-xs font-semibold hover:bg-stone-50 hover:border-stone-300 shadow-2xs transition-all duration-150 cursor-pointer"
            >
              <UserPlus className="w-4 h-4 text-stone-500" />
              <span>Add Person</span>
            </button>
          </div>
        </div>
      </div>

      {/* Guest Sign In Callout */}
      {!user && !authLoading && (
        <div className="bg-stone-900 text-stone-100 rounded-2xl p-5 sm:p-6 shadow-xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border border-stone-800">
          <div className="space-y-1 max-w-xl">
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-amber-400 animate-pulse" />
              <h3 className="text-sm font-bold tracking-tight text-white">Sign In for Personalized Memory Isolation</h3>
            </div>
            <p className="text-xs text-stone-300 leading-relaxed">
              Sign in to preserve your contacts, reasoning reflections, and decision histories across sessions in your own secure vault.
            </p>
          </div>
          <div className="flex items-center gap-2.5 shrink-0 w-full sm:w-auto">
            <button
              onClick={() => openAuthModal("signin")}
              className="flex-1 sm:flex-none px-4 py-2 bg-amber-400 hover:bg-amber-300 text-stone-950 font-bold text-xs rounded-xl transition-colors shadow-xs cursor-pointer flex items-center justify-center gap-1.5"
            >
              <LogIn className="w-3.5 h-3.5" />
              <span>Sign In</span>
            </button>
            <button
              onClick={() => openAuthModal("signup")}
              className="flex-1 sm:flex-none px-4 py-2 bg-stone-800 hover:bg-stone-700 text-stone-100 font-semibold text-xs rounded-xl transition-colors cursor-pointer border border-stone-700 text-center"
            >
              Create Account
            </button>
          </div>
        </div>
      )}

      {/* Privacy Steganography Status Bar */}
      <div className={`p-4 rounded-2xl border transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-3 ${
        isLocked
          ? "bg-amber-50/60 border-amber-200 text-amber-950"
          : "bg-emerald-50/60 border-emerald-200 text-emerald-950"
      }`}>
        <div className="flex items-center gap-3">
          <div className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 ${
            isLocked ? "bg-amber-100 text-amber-900" : "bg-emerald-100 text-emerald-900"
          }`}>
            {isLocked ? <Lock className="w-4 h-4 text-amber-800" /> : <Unlock className="w-4 h-4 text-emerald-800" />}
          </div>
          <div>
            <div className="text-xs font-bold flex items-center gap-2">
              <span>Privacy Shield: {isLocked ? "CLOAKED" : "UNLOCKED"}</span>
              <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${
                isLocked ? "bg-amber-200/80 text-amber-950" : "bg-emerald-200/80 text-emerald-950"
              }`}>
                {isLocked ? "Proxies Active" : "Real Identities Visible"}
              </span>
            </div>
            <p className="text-[11px] text-stone-600 mt-0.5">
              {isLocked 
                ? "Shoulder-surfer protection active: Real names are masked with privacy codenames." 
                : "Real identities are unlocked in this browser session. Click below to immediately re-cloak."}
            </p>
          </div>
        </div>

        <button
          onClick={openModal}
          className="px-3.5 py-1.5 rounded-xl text-xs font-semibold bg-white border border-stone-200 text-stone-800 hover:bg-stone-50 hover:border-stone-300 shadow-2xs transition-colors shrink-0 flex items-center gap-1.5 justify-center cursor-pointer"
        >
          {isLocked ? <Unlock className="w-3.5 h-3.5 text-amber-700" /> : <Lock className="w-3.5 h-3.5 text-emerald-700" />}
          <span>{isLocked ? "Unlock Real Names" : "Manage / Cloak"}</span>
        </button>
      </div>

      {/* Metric Summaries */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white border border-stone-200/90 rounded-2xl p-5 shadow-2xs hover:border-stone-300 transition-colors">
          <div className="flex items-center justify-between text-stone-500 mb-1">
            <span className="text-[11px] font-semibold uppercase tracking-wider text-stone-500">
              Tracked Relationships
            </span>
            <div className="w-8 h-8 rounded-xl bg-amber-50 text-amber-700 flex items-center justify-center">
              <Users className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl sm:text-3xl font-bold tracking-tight text-stone-900">{people.length}</div>
          <span className="text-xs text-stone-500 mt-1 block">
            Longitudinal memory profiles
          </span>
        </div>

        <div className="bg-white border border-stone-200/90 rounded-2xl p-5 shadow-2xs hover:border-stone-300 transition-colors">
          <div className="flex items-center justify-between text-stone-500 mb-1">
            <span className="text-[11px] font-semibold uppercase tracking-wider text-stone-500">
              Consequential Pauses
            </span>
            <div className="w-8 h-8 rounded-xl bg-rose-50 text-rose-700 flex items-center justify-center">
              <Flame className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl sm:text-3xl font-bold tracking-tight text-stone-900">{decisions.length}</div>
          <span className="text-xs text-stone-500 mt-1 block">
            Situations evaluated before acting
          </span>
        </div>

        <div className="bg-white border border-stone-200/90 rounded-2xl p-5 shadow-2xs hover:border-stone-300 transition-colors">
          <div className="flex items-center justify-between text-stone-500 mb-1">
            <span className="text-[11px] font-semibold uppercase tracking-wider text-stone-500">
              Recorded Outcomes
            </span>
            <div className="w-8 h-8 rounded-xl bg-emerald-50 text-emerald-700 flex items-center justify-center">
              <CheckCircle2 className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl sm:text-3xl font-bold tracking-tight text-stone-900">
            {decisions.filter((d) => d.status === "outcome_recorded").length}
          </div>
          <span className="text-xs text-stone-500 mt-1 block">
            Feedback recorded into memory
          </span>
        </div>
      </div>

      {/* Relationships Grid Section */}
      <div className="space-y-4">
        <div className="flex items-center justify-between pb-1">
          <div>
            <h2 className="text-xl font-bold text-stone-950">Tracked Relationships</h2>
            <p className="text-xs text-stone-500">
              Active memory profiles and context-dependent patterns
            </p>
          </div>
          <Link
            href="/people"
            className="text-xs font-bold text-stone-800 hover:text-stone-950 flex items-center gap-1 group"
          >
            <span>View all ({people.length})</span>
            <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
          </Link>
        </div>

        {authLoading || (loading && user) ? (
          <div className="py-20 flex justify-center text-stone-400">
            <Loader2 className="w-8 h-8 animate-spin" />
          </div>
        ) : people.length === 0 ? (
          <div className="bg-white border-2 border-stone-200 border-dashed rounded-3xl p-10 text-center space-y-4">
            <div className="w-12 h-12 rounded-2xl bg-amber-50 text-amber-700 flex items-center justify-center mx-auto">
              <Compass className="w-6 h-6" />
            </div>
            <div className="max-w-md mx-auto space-y-1">
              <h4 className="font-bold text-stone-900 text-base">No relationships tracked yet</h4>
              <p className="text-xs text-stone-500 leading-relaxed">
                Add a contact or person in your life to begin building their longitudinal relationship memory profile and interaction context.
              </p>
            </div>
            <button
              onClick={() => setIsAddModalOpen(true)}
              className="inline-flex items-center gap-2 px-5 py-2.5 bg-stone-900 text-stone-50 text-xs font-bold rounded-xl hover:bg-stone-800 shadow-xs transition-colors cursor-pointer"
            >
              <UserPlus className="w-3.5 h-3.5 text-amber-300" />
              <span>Add First Relationship</span>
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {people.slice(0, 6).map((person) => (
              <RelationshipCard key={person.id} person={person} />
            ))}
          </div>
        )}
      </div>

      {/* Recent Decisions & Reflections */}
      <div className="space-y-4 pt-4 border-t border-stone-200/80">
        <div className="flex items-center justify-between pb-1">
          <div>
            <h2 className="text-xl font-bold text-stone-950">Recent Pauses & Reflections</h2>
            <p className="text-xs text-stone-500">
              Consequential moments where you paused to review relationship history before deciding
            </p>
          </div>
          <Link
            href="/decisions"
            className="text-xs font-bold text-stone-800 hover:text-stone-950 flex items-center gap-1 group"
          >
            <span>Decision registry</span>
            <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
          </Link>
        </div>

        {decisions.length === 0 ? (
          <div className="bg-white border border-stone-200 rounded-2xl p-8 text-center text-xs text-stone-500 space-y-2">
            <p>No consequential decisions recorded yet.</p>
            <p className="text-stone-400 max-w-sm mx-auto">
              Test high-stakes thoughts in the AI Reasoning Agent (e.g. <em>"Rahul ignored me again. I'm done with this friendship."</em>) to experience the Pause trigger and branch evaluation.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {decisions.slice(0, 4).map((dec) => (
              <div
                key={dec.id}
                className="bg-white border border-stone-200/80 rounded-2xl p-5 shadow-2xs flex flex-col justify-between hover:border-stone-300 transition-colors"
              >
                <div className="space-y-2.5">
                  <div className="flex items-center justify-between gap-2">
                    <span className="font-bold text-stone-950 text-sm">
                      {dec.personName ? `Decision regarding ${dec.personName}` : "General Decision"}
                    </span>
                    <span className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full capitalize border ${
                      dec.status === "outcome_recorded"
                        ? "bg-emerald-50 text-emerald-800 border-emerald-200"
                        : "bg-amber-50 text-amber-800 border-amber-200"
                    }`}>
                      {dec.status.replace("_", " ")}
                    </span>
                  </div>

                  <p className="text-xs text-stone-600 line-clamp-2 italic leading-relaxed">
                    "{dec.situation}"
                  </p>

                  {dec.finalDecision && (
                    <div className="p-3 bg-stone-50 rounded-xl border border-stone-200/70 text-xs font-medium text-stone-800">
                      <span className="font-bold text-stone-900 block mb-0.5">Your Choice:</span>
                      {dec.finalDecision}
                    </div>
                  )}
                </div>

                <div className="mt-4 pt-3 border-t border-stone-100 flex items-center justify-between">
                  <span className="text-[11px] text-stone-400 font-medium" suppressHydrationWarning>
                    {dec.createdAt ? new Date(dec.createdAt).toLocaleDateString() : "Recent"}
                  </span>
                  <Link
                    href="/decisions"
                    className="inline-flex items-center gap-1 text-xs font-bold text-stone-800 hover:text-stone-950"
                  >
                    <span>View outcome</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </Link>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <AddPersonModal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        onPersonCreated={(p) => setPeople([p, ...people])}
      />
    </div>
  );
}
