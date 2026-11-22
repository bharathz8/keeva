"use client";

import React, { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import {
  X,
  UserPlus,
  Loader2,
  ShieldCheck,
  Dices,
  Globe,
  Apple,
  Cat,
  Swords,
  Lock,
  ChevronDown,
  ChevronUp
} from "lucide-react";
import { createPerson } from "@/lib/api";
import { Person } from "@/types";

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onPersonCreated: (person: Person) => void;
}

const CATEGORY_PRESETS: Record<string, { label: string; icon: any; items: string[] }> = {
  countries: {
    label: "Countries",
    icon: Globe,
    items: ["China", "Japan", "Norway", "Brazil", "Iceland", "Canada", "Switzerland", "New Zealand", "Kenya", "Ireland", "Greece", "Spain", "Singapore", "Australia", "Egypt", "Sweden", "Italy", "Argentina"]
  },
  fruits: {
    label: "Fruits",
    icon: Apple,
    items: ["Mango", "Peach", "Apricot", "Blueberry", "Tangerine", "Fig", "Papaya", "Lychee", "Kiwi", "Plum", "Cherry", "Pomegranate", "Coconut", "Avocado"]
  },
  animals: {
    label: "Animals",
    icon: Cat,
    items: ["Falcon", "Snow Leopard", "Otter", "Red Panda", "Arctic Fox", "Panther", "Dolphin", "Wolf", "Phoenix", "Lynx", "Koala", "Tiger", "Owl"]
  },
  anime: {
    label: "Anime",
    icon: Swords,
    items: ["Kakashi", "Levi", "Tanjiro", "Gojo", "Itachi", "Mikasa", "Killua", "Zoro", "Loid", "Naruto", "Saitama", "L", "Anya"]
  }
};

export const AddPersonModal: React.FC<Props> = ({ isOpen, onClose, onPersonCreated }) => {
  const [mounted, setMounted] = useState(false);
  const [name, setName] = useState("");
  const [relationshipType, setRelationshipType] = useState("Friend");
  const [duration, setDuration] = useState("1 year");
  const [notes, setNotes] = useState("");

  // Privacy Steganography / Proxy Codename State
  const [selectedCategory, setSelectedCategory] = useState<"countries" | "fruits" | "animals" | "anime" | "custom">("countries");
  const [alias, setAlias] = useState("Argentina");
  const [loading, setLoading] = useState(false);
  const [showCategoryPicker, setShowCategoryPicker] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  // Auto-pick random alias when category changes
  const pickRandomFromCategory = (cat: string) => {
    if (cat in CATEGORY_PRESETS) {
      const list = CATEGORY_PRESETS[cat].items;
      const randomItem = list[Math.floor(Math.random() * list.length)];
      setAlias(randomItem);
    }
  };

  useEffect(() => {
    if (selectedCategory !== "custom") {
      pickRandomFromCategory(selectedCategory);
    }
  }, [selectedCategory]);

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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    try {
      setLoading(true);
      const created = await createPerson({
        name: name.trim(),
        relationshipType,
        duration,
        notes: notes.trim() || undefined,
        status: "active",
        alias: alias.trim() || undefined,
        aliasCategory: selectedCategory,
        isEncrypted: true,
      });
      onPersonCreated(created);
      onClose();
      setName("");
      setNotes("");
      setAlias("Argentina");
    } catch (err: any) {
      alert("Error adding person: " + err.message);
    } finally {
      setLoading(false);
    }
  };

  const modalContent = (
    <div
      className="fixed inset-0 z-[9999] flex items-center justify-center p-3 sm:p-4 bg-stone-950/65 backdrop-blur-xs animate-fade-in"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        className="bg-white rounded-3xl max-w-md w-full shadow-2xl border border-stone-200/90 flex flex-col max-h-[88vh] overflow-hidden animate-modal-pop"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header (Fixed - shrink-0) */}
        <div className="shrink-0 flex items-center justify-between px-5 py-3.5 border-b border-stone-100 bg-stone-50/60">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-stone-900 text-stone-100 flex items-center justify-center shadow-xs">
              <UserPlus className="w-4 h-4 text-amber-300" />
            </div>
            <div>
              <h3 className="font-bold text-stone-900 text-sm sm:text-base leading-tight">Add New Person</h3>
              <p className="text-[10px] sm:text-[11px] text-stone-500">Track a relationship with privacy masking</p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="w-7 h-7 rounded-full flex items-center justify-center text-stone-400 hover:text-stone-800 hover:bg-stone-200/60 transition-all"
            aria-label="Close modal"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Scrollable Form Body (flex-1 min-h-0 overflow-y-auto) */}
        <form id="add-person-form" onSubmit={handleSubmit} className="flex-1 min-h-0 overflow-y-auto px-5 py-3.5 space-y-3">
          {/* Real Name */}
          <div>
            <label className="block text-xs font-bold text-stone-800 mb-1">
              Real Name <span className="text-stone-400 font-normal">(Confidential — unlockable by master PIN)</span>
            </label>
            <input
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. elon, mark, sundhar, larry"
              className="w-full px-3 py-2 border border-stone-200 rounded-xl text-xs font-semibold text-stone-900 focus:outline-none focus:ring-2 focus:ring-stone-900/10 focus:border-stone-900 bg-stone-50/40 transition-all"
            />
          </div>

          {/* Relationship & Known For (2 Columns) */}
          <div className="grid grid-cols-2 gap-2.5">
            <div>
              <label className="block text-xs font-bold text-stone-700 mb-1">Relationship</label>
              <select
                value={relationshipType}
                onChange={(e) => setRelationshipType(e.target.value)}
                className="w-full px-2.5 py-1.5 border border-stone-200 rounded-xl text-xs font-medium focus:outline-none focus:ring-2 focus:ring-stone-900/10 focus:border-stone-900 bg-white"
              >
                <option value="Friend">Friend</option>
                <option value="Partner">Partner</option>
                <option value="Spouse">Spouse</option>
                <option value="Coworker">Coworker</option>
                <option value="Parent">Parent</option>
                <option value="Sibling">Sibling</option>
                <option value="Mentor">Mentor</option>
                <option value="Other">Other</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-stone-700 mb-1">Known For</label>
              <input
                type="text"
                value={duration}
                onChange={(e) => setDuration(e.target.value)}
                placeholder="e.g. 8 years, 6 months"
                className="w-full px-3 py-1.5 border border-stone-200 rounded-xl text-xs font-medium focus:outline-none focus:ring-2 focus:ring-stone-900/10 focus:border-stone-900 bg-stone-50/40"
              />
            </div>
          </div>

          {/* Steganographic Privacy Codename Card (Compact & Modern) */}
          <div className="p-3 bg-stone-50/90 border border-stone-200/90 rounded-2xl space-y-2 shadow-2xs">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold text-stone-900 flex items-center gap-1.5">
                <ShieldCheck className="w-3.5 h-3.5 text-amber-600" />
                <span>Steganographic Privacy Alias</span>
              </label>
              <div className="flex items-center gap-1">
                <button
                  type="button"
                  onClick={() => pickRandomFromCategory(selectedCategory)}
                  className="text-[10px] font-semibold text-stone-700 hover:text-stone-950 flex items-center gap-1 bg-white px-2 py-0.5 rounded-lg border border-stone-200 shadow-2xs hover:bg-stone-50 transition-colors"
                >
                  <Dices className="w-3 h-3 text-stone-500" />
                  <span>Random</span>
                </button>
                <button
                  type="button"
                  onClick={() => setShowCategoryPicker(!showCategoryPicker)}
                  className="text-[10px] font-semibold text-stone-600 hover:text-stone-900 flex items-center gap-0.5 bg-white px-1.5 py-0.5 rounded-lg border border-stone-200 shadow-2xs hover:bg-stone-50 transition-colors"
                  title="Change Category / Preset"
                >
                  <span>Category</span>
                  {showCategoryPicker ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
                </button>
              </div>
            </div>

            {/* Codename Input + Live Cloaking Preview */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 items-center">
              <div>
                <input
                  type="text"
                  required
                  value={alias}
                  onChange={(e) => setAlias(e.target.value)}
                  placeholder="e.g. Argentina, Mango, Kakashi"
                  className="w-full px-2.5 py-1.5 border border-stone-200 rounded-xl text-xs font-bold text-stone-900 focus:outline-none focus:ring-2 focus:ring-stone-900/10 focus:border-stone-900 bg-white shadow-2xs"
                />
              </div>

              {/* Preview Badge */}
              <div className="p-1.5 bg-amber-500/10 border border-amber-300/80 rounded-xl text-xs text-amber-950 flex items-center justify-between">
                <div className="flex items-center gap-1 truncate text-[11px]">
                  <span className="line-through text-stone-400 font-medium truncate max-w-[65px]">{name || "Real Name"}</span>
                  <span className="text-stone-400 font-bold">➔</span>
                  <span className="font-extrabold text-amber-950 bg-amber-200/70 px-1.5 py-0.2 rounded border border-amber-300 truncate">
                    {alias || "Argentina"}
                  </span>
                </div>
                <span className="text-[9px] font-bold bg-amber-100 text-amber-900 px-1 py-0.2 rounded uppercase tracking-wider shrink-0">
                  Cloaked
                </span>
              </div>
            </div>

            {/* Expandable Category & Preset Picker */}
            {showCategoryPicker && (
              <div className="pt-1.5 border-t border-stone-200/60 space-y-2 animate-fade-in">
                {/* Category Pills */}
                <div className="grid grid-cols-5 gap-1 p-0.5 bg-stone-200/70 rounded-xl text-center text-[10px] font-semibold text-stone-600">
                  {(["countries", "fruits", "animals", "anime", "custom"] as const).map((cat) => (
                    <button
                      key={cat}
                      type="button"
                      onClick={() => setSelectedCategory(cat)}
                      className={`py-1 px-0.5 rounded-lg capitalize transition-all truncate ${selectedCategory === cat
                          ? "bg-white text-stone-950 shadow-2xs font-bold"
                          : "hover:text-stone-950"
                        }`}
                    >
                      {cat === "countries" && "🌍 Countries"}
                      {cat === "fruits" && "🍎 Fruits"}
                      {cat === "animals" && "🐾 Animals"}
                      {cat === "anime" && "⚔️ Anime"}
                      {cat === "custom" && "✏️ Custom"}
                    </button>
                  ))}
                </div>

                {/* Horizontal Scrolling Preset Chips */}
                {selectedCategory !== "custom" && CATEGORY_PRESETS[selectedCategory] && (
                  <div className="flex items-center gap-1 overflow-x-auto pb-1 pt-0.5">
                    {CATEGORY_PRESETS[selectedCategory].items.map((item) => {
                      const isSelected = alias.toLowerCase() === item.toLowerCase();
                      return (
                        <button
                          key={item}
                          type="button"
                          onClick={() => setAlias(item)}
                          className={`text-[10px] px-2 py-0.5 rounded-lg border shrink-0 transition-all ${isSelected
                              ? "bg-stone-900 text-stone-50 border-stone-900 font-bold shadow-2xs"
                              : "bg-white text-stone-700 hover:bg-stone-100/80 border-stone-200"
                            }`}
                        >
                          {item}
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Context Notes */}
          <div>
            <label className="block text-xs font-bold text-stone-700 mb-1">
              Initial Notes <span className="text-stone-400 font-normal">(Optional background)</span>
            </label>
            <textarea
              rows={2}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="e.g. Close friend since college, shared history, political debates can get tense..."
              className="w-full px-3 py-1.5 border border-stone-200 rounded-xl text-xs font-medium focus:outline-none focus:ring-2 focus:ring-stone-900/10 focus:border-stone-900 bg-stone-50/40 leading-relaxed"
            />
          </div>
        </form>

        {/* Footer (Fixed - shrink-0, ALWAYS visible) */}
        <div className="shrink-0 px-5 py-3 border-t border-stone-100 bg-stone-50/70 flex items-center justify-end gap-2">
          <button
            type="button"
            onClick={onClose}
            className="px-3.5 py-1.5 border border-stone-200 rounded-xl text-xs font-semibold text-stone-700 hover:bg-white hover:border-stone-300 transition-all"
          >
            Cancel
          </button>
          <button
            type="submit"
            form="add-person-form"
            disabled={loading || !name.trim()}
            className="px-4 py-1.5 bg-stone-900 text-stone-50 rounded-xl text-xs font-bold hover:bg-stone-800 disabled:opacity-50 flex items-center gap-1.5 shadow-xs transition-all hover:scale-101"
          >
            {loading ? (
              <Loader2 className="w-3.5 h-3.5 animate-spin" />
            ) : (
              <Lock className="w-3.5 h-3.5 text-amber-300" />
            )}
            <span>Save Encrypted Person</span>
          </button>
        </div>
      </div>
    </div>
  );

  return typeof document !== "undefined" ? createPortal(modalContent, document.body) : null;
};
