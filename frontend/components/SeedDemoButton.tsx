"use client";

import React, { useState } from "react";
import { Sparkles, Check, Loader2 } from "lucide-react";
import { seedDemoData } from "@/lib/api";

interface Props {
  onSuccess?: () => void;
  className?: string;
}

export const SeedDemoButton: React.FC<Props> = ({ onSuccess, className = "" }) => {
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  const handleSeed = async () => {
    try {
      setLoading(true);
      await seedDemoData();
      setSuccess(true);
      if (onSuccess) onSuccess();
      setTimeout(() => setSuccess(false), 3500);
    } catch (err: any) {
      console.error("Demo seed failed:", err);
      alert("Demo seed error: " + (err.message || "Failed to seed demo data."));
    } finally {
      setLoading(false);
    }
  };

  return (
    <button
      onClick={handleSeed}
      disabled={loading || success}
      className={`relative group inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-xl transition-all duration-200 border shadow-2xs ${
        success
          ? "bg-emerald-50 text-emerald-800 border-emerald-300 ring-2 ring-emerald-400/20"
          : "bg-white hover:bg-amber-50/50 text-stone-800 border-stone-200/90 hover:border-amber-300"
      } ${className}`}
      title="Seeds 8-year Rahul friendship history with conflicts, reconciliations, and patterns"
    >
      {loading ? (
        <Loader2 className="w-3.5 h-3.5 animate-spin text-amber-600" />
      ) : success ? (
        <Check className="w-3.5 h-3.5 text-emerald-600" />
      ) : (
        <Sparkles className="w-3.5 h-3.5 text-amber-500 group-hover:scale-110 transition-transform" />
      )}
      <span className={success ? "font-bold text-emerald-800" : ""}>
        {success ? "Demo History Loaded" : "Demo Data (Rahul · 8 yrs)"}
      </span>
    </button>
  );
};
