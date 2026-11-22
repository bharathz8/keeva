"use client";

import React from "react";
import { FutureBranch } from "@/types";
import { CheckCircle2, Undo2, ArrowUpRight, Compass } from "lucide-react";

interface Props {
  branch: FutureBranch;
  index: number;
  isSelected?: boolean;
  onSelect?: () => void;
}

export const FutureBranchCard: React.FC<Props> = ({
  branch,
  index,
  isSelected = false,
  onSelect,
}) => {
  return (
    <div
      onClick={onSelect}
      className={`border rounded-2xl p-5 transition-all duration-200 cursor-pointer text-left flex flex-col justify-between group ${
        isSelected
          ? "bg-stone-900 text-stone-100 border-stone-900 shadow-md ring-2 ring-amber-400/40 -translate-y-0.5"
          : "bg-white hover:bg-stone-50/90 text-stone-900 border-stone-200/90 shadow-2xs hover:border-stone-300 hover:shadow-xs"
      }`}
    >
      <div>
        {/* Top Header */}
        <div className="flex items-start justify-between gap-2 mb-2.5">
          <span
            className={`text-[10px] font-bold uppercase tracking-wider px-2.5 py-0.5 rounded-md ${
              isSelected
                ? "bg-stone-800 text-amber-300 border border-stone-700"
                : "bg-stone-100 text-stone-700 border border-stone-200/60"
            }`}
          >
            Path {index + 1}
          </span>

          <span
            className={`inline-flex items-center gap-1 text-[11px] font-semibold px-2.5 py-0.5 rounded-full capitalize ${
              branch.reversibility === "low"
                ? isSelected
                  ? "bg-rose-950/80 text-rose-300 border border-rose-800/80"
                  : "bg-rose-50 text-rose-800 border border-rose-200"
                : isSelected
                ? "bg-emerald-950/80 text-emerald-300 border border-emerald-800/80"
                : "bg-emerald-50 text-emerald-800 border border-emerald-200"
            }`}
          >
            <Undo2 className="w-3 h-3" />
            {branch.reversibility} reversibility
          </span>
        </div>

        {/* Action Title */}
        <h4 className="font-bold text-sm leading-snug mb-3">
          {branch.action}
        </h4>

        {/* Possible Consequences */}
        <div className="space-y-2 mb-3.5">
          <p
            className={`text-[10px] font-bold uppercase tracking-wider ${
              isSelected ? "text-stone-400" : "text-stone-500"
            }`}
          >
            Possible Consequences:
          </p>
          <ul className="space-y-1.5 text-xs">
            {branch.possibleConsequences.map((c, i) => (
              <li
                key={i}
                className={`flex items-start gap-2 ${
                  isSelected ? "text-stone-300" : "text-stone-700"
                }`}
              >
                <span className={`text-xs mt-0.5 ${isSelected ? "text-amber-400" : "text-amber-600"}`}>
                  &bull;
                </span>
                <span className="leading-relaxed">{c}</span>
              </li>
            ))}
          </ul>
        </div>

        {/* Underlying Assumptions */}
        {branch.assumptions.length > 0 && (
          <div
            className={`pt-3 border-t text-[11px] leading-relaxed ${
              isSelected
                ? "border-stone-800 text-stone-400"
                : "border-stone-100 text-stone-500"
            }`}
          >
            <span className="font-semibold">Assumes: </span>
            <span>{branch.assumptions.join(", ")}</span>
          </div>
        )}
      </div>

      {/* Footer Selector */}
      <div
        className={`mt-4 pt-3 border-t flex items-center justify-between text-xs font-semibold ${
          isSelected ? "border-stone-800 text-amber-300" : "border-stone-100 text-stone-600"
        }`}
      >
        <span className="flex items-center gap-1.5">
          {isSelected ? (
            <>
              <CheckCircle2 className="w-3.5 h-3.5 text-amber-300" />
              <span>Selected Option</span>
            </>
          ) : (
            <span>Choose this path</span>
          )}
        </span>
        <ArrowUpRight
          className={`w-4 h-4 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5 ${
            isSelected ? "text-amber-300" : "text-stone-400"
          }`}
        />
      </div>
    </div>
  );
};
