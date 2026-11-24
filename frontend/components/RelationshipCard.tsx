"use client";

import React from "react";
import Link from "next/link";
import { Person } from "@/types";
import { usePrivacy } from "@/context/PrivacyContext";
import { ArrowRight, Clock, Activity, Lock, Unlock, Bot, Sparkles, MessageSquare } from "lucide-react";

interface Props {
  person: Person;
  contextCount?: number;
}

export const RelationshipCard: React.FC<Props> = ({ person, contextCount = 0 }) => {
  const { isLocked, resolveName, openModal } = usePrivacy();
  const displayName = resolveName(person);

  // Subtle initials theme for consistent, calm look
  const initial = displayName[0]?.toUpperCase() || "P";

  return (
    <div className="bg-white border border-stone-200/90 rounded-2xl p-5 sm:p-6 shadow-2xs hover:shadow-md hover:border-stone-300 hover:-translate-y-0.5 transition-all duration-200 flex flex-col justify-between group">
      <div>
        {/* Top Header */}
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-3 min-w-0">
            <div
              className="w-11 h-11 rounded-xl font-bold flex items-center justify-center text-sm border border-stone-200 bg-stone-100/90 text-stone-800 shadow-2xs shrink-0 group-hover:bg-amber-50 group-hover:text-amber-900 group-hover:border-amber-200 transition-colors"
            >
              {initial}
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-1.5 flex-wrap">
                <h3 className="font-bold text-stone-900 text-base group-hover:text-amber-950 transition-colors truncate">
                  {displayName}
                </h3>
                {isLocked && person.alias ? (
                  <button
                    onClick={(e) => {
                      e.preventDefault();
                      openModal();
                    }}
                    aria-label="Cloaked behind proxy alias, click to unlock"
                    title="Identity cloaked behind proxy alias. Click to unlock."
                    className="p-1 text-amber-800 hover:text-amber-950 bg-amber-100/70 hover:bg-amber-200/70 rounded-md transition-colors cursor-pointer"
                  >
                    <Lock className="w-3.5 h-3.5" />
                  </button>
                ) : !isLocked && person.alias ? (
                  <span className="text-[10px] text-stone-500 font-medium bg-stone-100 px-1.5 py-0.5 rounded-md border border-stone-200/80 truncate">
                    proxy: {person.alias}
                  </span>
                ) : null}
              </div>
              <p className="text-xs text-stone-500 font-medium mt-0.5">
                <span className="font-semibold text-stone-700">{person.relationshipType}</span>
                <span className="text-stone-300 mx-1.5">&middot;</span>
                <span>{person.duration || "Recorded profile"}</span>
              </p>
            </div>
          </div>

          <span
            className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-semibold capitalize border shrink-0 ${person.status === "active"
              ? "bg-emerald-50 text-emerald-900 border-emerald-200"
              : "bg-stone-50 text-stone-600 border-stone-200"
              }`}
          >
            <span
              className={`w-1.5 h-1.5 rounded-full ${person.status === "active" ? "bg-emerald-500" : "bg-stone-400"
                }`}
            />
            {person.status || "active"}
          </span>
        </div>

        {/* Note / Context Observation Quote */}
        {person.notes && (
          <p className="text-xs text-stone-600 mt-3.5 line-clamp-2 italic bg-stone-50/70 p-3 rounded-xl border-l-2 border-l-amber-400 border-y border-r border-stone-200/60 leading-relaxed font-normal">
            "{person.notes}"
          </p>
        )}

        {/* Metadata Details */}
        <div className="mt-4 pt-3 border-t border-stone-100 space-y-2 text-xs">
          <div className="flex items-center justify-between text-stone-500">
            <span className="flex items-center gap-1.5 text-[11px] font-medium">
              <Clock className="w-3.5 h-3.5 text-stone-400" /> Last interaction
            </span>
            <span className="font-medium text-stone-800">
              {person.lastInteraction || "Recently recorded"}
            </span>
          </div>

          <div className="flex items-center justify-between text-stone-500">
            <span className="flex items-center gap-1.5 text-[11px] font-medium">
              <Activity className="w-3.5 h-3.5 text-stone-400" /> Longitudinal Memory
            </span>
            <span className="font-semibold text-stone-700 text-[11px] bg-stone-100 px-2 py-0.5 rounded-md border border-stone-200/70">
              Active History
            </span>
          </div>
        </div>
      </div>

      {/* Action Footer */}
      <div className="mt-5 pt-3 border-t border-stone-100 flex items-center justify-between gap-2">
        <Link
          href={`/people/${person.id}`}
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-stone-800 hover:text-stone-950 transition-colors group-hover:translate-x-0.5 duration-150"
        >
          <span>View Timeline & Patterns</span>
          <ArrowRight className="w-3.5 h-3.5 text-stone-400 group-hover:text-stone-900 transition-colors" />
        </Link>

        <Link
          href={`/agent?personId=${person.id}`}
          className="p-1.5 text-stone-400 hover:text-amber-800 hover:bg-amber-50 rounded-xl transition-colors cursor-pointer"
          aria-label={`Ask AI reasoning about ${displayName}`}
          title={`Ask AI reasoning about ${displayName}`}
        >
          <Bot className="w-4 h-4" />
        </Link>
      </div>
    </div>
  );
};
