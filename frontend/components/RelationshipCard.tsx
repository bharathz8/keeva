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

  // Avatar gradient colors
  const avatarThemes = [
    "from-amber-100 to-orange-100 text-amber-950 border-amber-200",
    "from-emerald-100 to-teal-100 text-emerald-950 border-emerald-200",
    "from-sky-100 to-blue-100 text-sky-950 border-sky-200",
    "from-indigo-100 to-violet-100 text-indigo-950 border-indigo-200",
    "from-stone-200 to-stone-100 text-stone-900 border-stone-300",
  ];
  const themeIndex = (displayName.charCodeAt(0) || 0) % avatarThemes.length;
  const avatarStyle = avatarThemes[themeIndex];

  return (
    <div className="bg-white border border-stone-200/80 rounded-3xl p-5 sm:p-6 shadow-xs hover:shadow-md hover:border-stone-300 hover:-translate-y-0.5 transition-all duration-200 flex flex-col justify-between group">
      <div>
        {/* Top Header */}
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-3.5 min-w-0">
            <div
              className={`w-12 h-12 rounded-2xl font-bold flex items-center justify-center text-base border shadow-2xs bg-gradient-to-br ${avatarStyle} shrink-0`}
            >
              {displayName[0]?.toUpperCase() || "P"}
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-1.5 flex-wrap">
                <h3 className="font-bold text-stone-950 text-base group-hover:text-amber-900 transition-colors truncate">
                  {displayName}
                </h3>
                {isLocked && person.alias ? (
                  <button
                    onClick={(e) => {
                      e.preventDefault();
                      openModal();
                    }}
                    title="Identity cloaked behind proxy alias. Click to unlock."
                    className="p-1 text-amber-800 hover:text-amber-950 bg-amber-100/70 hover:bg-amber-200/70 rounded-md transition-colors"
                  >
                    <Lock className="w-3.5 h-3.5" />
                  </button>
                ) : !isLocked && person.alias ? (
                  <span className="text-[10px] text-stone-500 font-semibold bg-stone-100 px-1.5 py-0.5 rounded-md border border-stone-200 truncate">
                    proxy: {person.alias}
                  </span>
                ) : null}
              </div>
              <p className="text-xs text-stone-500 font-medium mt-0.5">
                <span className="font-semibold text-stone-700">{person.relationshipType}</span>
                <span className="text-stone-400 mx-1">&middot;</span>
                <span>{person.duration || "Known for some time"}</span>
              </p>
            </div>
          </div>

          <span
            className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-bold capitalize border shrink-0 ${person.status === "active"
              ? "bg-emerald-50 text-emerald-900 border-emerald-200/80"
              : "bg-stone-50 text-stone-600 border-stone-200"
              }`}
          >
            <span
              className={`w-1.5 h-1.5 rounded-full ${person.status === "active" ? "bg-emerald-500 animate-pulse" : "bg-stone-400"
                }`}
            />
            {person.status || "active"}
          </span>
        </div>

        {/* Note / Context Observation Quote */}
        {person.notes && (
          <p className="text-xs text-stone-600 mt-4 line-clamp-2 italic bg-stone-50/80 p-3 rounded-2xl border border-stone-200/60 leading-relaxed">
            "{person.notes}"
          </p>
        )}

        {/* Metadata Details */}
        <div className="mt-4 pt-3 border-t border-stone-100 space-y-2 text-xs">
          <div className="flex items-center justify-between text-stone-500">
            <span className="flex items-center gap-1.5 text-[11px] font-medium">
              <Clock className="w-3.5 h-3.5 text-stone-400" /> Last interaction
            </span>
            <span className="font-semibold text-stone-800">
              {person.lastInteraction || "Recently recorded"}
            </span>
          </div>

          <div className="flex items-center justify-between text-stone-500">
            <span className="flex items-center gap-1.5 text-[11px] font-medium">
              <Activity className="w-3.5 h-3.5 text-stone-400" /> Relationship Memory
            </span>
            <span className="font-bold text-amber-900 text-[11px] bg-amber-50 px-2.5 py-0.5 rounded-md border border-amber-200/70">
              Longitudinal History Active
            </span>
          </div>
        </div>
      </div>

      {/* Action Footer */}
      <div className="mt-5 pt-3 border-t border-stone-100 flex items-center justify-between gap-2">
        <Link
          href={`/people/${person.id}`}
          className="inline-flex items-center gap-1.5 text-xs font-bold text-stone-800 hover:text-stone-950 transition-colors"
        >
          <span>View Timeline & Patterns</span>
          <ArrowRight className="w-3.5 h-3.5 text-stone-400 group-hover:text-stone-900 group-hover:translate-x-1 transition-all" />
        </Link>

        <Link
          href={`/agent?personId=${person.id}`}
          className="p-1.5 text-stone-400 hover:text-amber-800 hover:bg-amber-50 rounded-xl transition-colors"
          title={`Ask AI reasoning about ${displayName}`}
        >
          <Bot className="w-4 h-4" />
        </Link>
      </div>
    </div>
  );
};
