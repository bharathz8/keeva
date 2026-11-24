"use client";

import React, { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import { usePrivacy } from "@/context/PrivacyContext";
import { 
  ShieldCheck, 
  ShieldAlert, 
  Lock, 
  Unlock, 
  KeyRound, 
  HelpCircle, 
  Settings2, 
  X, 
  Check, 
  AlertCircle,
  Eye,
  EyeOff
} from "lucide-react";

export function PrivacyShieldModal() {
  const { 
    isModalOpen, 
    closeModal, 
    isLocked, 
    vaultStatus, 
    unlock, 
    lock, 
    setup 
  } = usePrivacy();

  const [mounted, setMounted] = useState(false);
  const [activeTab, setActiveTab] = useState<"unlock" | "settings">(isLocked ? "unlock" : "settings");

  useEffect(() => {
    setMounted(true);
  }, []);

  // Unlock state
  const [pinInput, setPinInput] = useState("");
  const [answerInput, setAnswerInput] = useState("");
  const [showPin, setShowPin] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  const [loading, setLoading] = useState(false);

  // Settings state
  const [newPin, setNewPin] = useState("");
  const [newQuestion, setNewQuestion] = useState(vaultStatus?.securityQuestionPrompt || "What was your childhood street name?");
  const [newAnswer, setNewAnswer] = useState("");
  const [categoryPref, setCategoryPref] = useState(vaultStatus?.defaultCategory || "countries");
  const [savedSuccess, setSavedSuccess] = useState(false);

  // Escape key & body scroll lock
  useEffect(() => {
    if (!isModalOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") closeModal();
    };
    window.addEventListener("keydown", handleKeyDown);
    const origOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    return () => {
      window.removeEventListener("keydown", handleKeyDown);
      document.body.style.overflow = origOverflow;
    };
  }, [isModalOpen, closeModal]);

  if (!isModalOpen || !mounted) return null;

  const handleUnlock = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg("");
    setLoading(true);

    const res = await unlock({
      pinOrPassword: pinInput.trim() || undefined,
      securityAnswer: answerInput.trim() || undefined,
    });

    setLoading(false);
    if (res.success) {
      setPinInput("");
      setAnswerInput("");
      closeModal();
    } else {
      setErrorMsg(res.error || "Incorrect credentials");
    }
  };

  const handleSaveSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setErrorMsg("");

    try {
      await setup({
        pinOrPassword: newPin.trim() || undefined,
        securityQuestion: newQuestion.trim() || undefined,
        securityAnswer: newAnswer.trim() || undefined,
        defaultCategory: categoryPref,
      });
      setSavedSuccess(true);
      setTimeout(() => setSavedSuccess(false), 3000);
    } catch (err: any) {
      setErrorMsg(err.message || "Failed to update vault settings");
    } finally {
      setLoading(false);
    }
  };

  const modalContent = (
    <div 
      className="fixed inset-0 z-[9999] flex items-center justify-center p-3 sm:p-6 bg-stone-950/65 backdrop-blur-xs animate-fade-in"
      onClick={(e) => {
        if (e.target === e.currentTarget) closeModal();
      }}
    >
      <div 
        className="bg-white rounded-3xl max-w-lg w-full shadow-2xl border border-stone-200/90 flex flex-col max-h-[85vh] sm:max-h-[88vh] overflow-hidden animate-modal-pop"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header (Fixed - shrink-0) */}
        <div className="shrink-0 flex items-center justify-between px-6 py-4 border-b border-stone-100 bg-stone-50/50">
          <div className="flex items-center gap-3">
            <div className={`w-10 h-10 rounded-2xl flex items-center justify-center shadow-xs ${
              isLocked 
                ? "bg-amber-100 text-amber-900 border border-amber-200" 
                : "bg-emerald-100 text-emerald-900 border border-emerald-200"
            }`}>
              {isLocked ? <Lock className="w-5 h-5" /> : <Unlock className="w-5 h-5" />}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-bold text-stone-900 text-base leading-tight">Privacy Shield & Vault</h3>
                <span className={`text-[9px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider ${
                  isLocked ? "bg-amber-100 text-amber-900 border border-amber-200" : "bg-emerald-100 text-emerald-900 border border-emerald-200"
                }`}>
                  {isLocked ? "Cloaked" : "Unlocked"}
                </span>
              </div>
              <p className="text-xs text-stone-500 mt-0.5">
                Steganographic Proxy: Masks real names with countries, fruits, animals, or anime
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={closeModal}
            className="w-8 h-8 rounded-full flex items-center justify-center text-stone-400 hover:text-stone-800 hover:bg-stone-200/60 transition-all"
            aria-label="Close modal"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Tab Switcher (Fixed - shrink-0) */}
        <div className="shrink-0 px-6 pt-3 pb-1 border-b border-stone-100">
          <div className="flex gap-1.5 p-1 bg-stone-100 rounded-xl text-xs font-semibold text-stone-600">
            <button
              type="button"
              onClick={() => setActiveTab("unlock")}
              className={`flex-1 py-1.5 px-3 rounded-lg transition-all flex items-center justify-center gap-1.5 ${
                activeTab === "unlock"
                  ? "bg-white text-stone-900 shadow-2xs font-bold"
                  : "hover:text-stone-900"
              }`}
            >
              <KeyRound className="w-3.5 h-3.5" />
              <span>{isLocked ? "Unlock Vault" : "Active Session"}</span>
            </button>
            <button
              type="button"
              onClick={() => setActiveTab("settings")}
              className={`flex-1 py-1.5 px-3 rounded-lg transition-all flex items-center justify-center gap-1.5 ${
                activeTab === "settings"
                  ? "bg-white text-stone-900 shadow-2xs font-bold"
                  : "hover:text-stone-900"
              }`}
            >
              <Settings2 className="w-3.5 h-3.5" />
              <span>Security Setup</span>
            </button>
          </div>
        </div>

        {/* Scrollable Body */}
        <div className="flex-1 min-h-0 overflow-y-auto px-6 py-4 space-y-4">
          {/* Tab 1: Unlock / Status */}
          {activeTab === "unlock" && (
            <div className="space-y-4">
              {!isLocked ? (
                <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-2xl space-y-3">
                  <div className="flex items-center gap-2 text-emerald-950 font-bold text-xs">
                    <ShieldCheck className="w-4 h-4 text-emerald-600" />
                    <span>Real identities are currently revealed in your active session.</span>
                  </div>
                  <p className="text-[11px] text-emerald-800 leading-relaxed">
                    Real names are visible. If someone walks up to your screen or you're presenting, click below to immediately re-cloak all identities into their assigned proxies.
                  </p>
                  <button
                    type="button"
                    onClick={() => {
                      lock();
                      closeModal();
                    }}
                    className="w-full py-2.5 px-4 bg-stone-900 text-stone-50 rounded-xl text-xs font-bold hover:bg-stone-800 transition-all flex items-center justify-center gap-2 shadow-xs hover:scale-101"
                  >
                    <Lock className="w-3.5 h-3.5" />
                    <span>Cloak Vault Now (Hide Real Names)</span>
                  </button>
                </div>
              ) : (
                <form id="vault-unlock-form" onSubmit={handleUnlock} className="space-y-4">
                  <div className="p-3 bg-amber-500/10 border border-amber-300/80 rounded-2xl text-[11px] text-amber-950 leading-relaxed flex items-start gap-2">
                    <ShieldAlert className="w-4 h-4 text-amber-700 shrink-0 mt-0.5" />
                    <div>
                      <span className="font-bold">Vault is Cloaked:</span> Public proxies (e.g. <em>China</em>, <em>Iceland</em>, <em>Mango</em>) are currently shown in place of actual names. Enter your Master PIN or answer your security question to reveal real names.
                    </div>
                  </div>

                  {errorMsg && (
                    <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-xs text-red-700 flex items-center gap-2">
                      <AlertCircle className="w-4 h-4 text-red-600 shrink-0" />
                      <span>{errorMsg}</span>
                    </div>
                  )}

                  {/* PIN Input */}
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-stone-800 flex items-center justify-between">
                      <span>Option 1: Master PIN or Password</span>
                    </label>
                    <div className="relative">
                      <input
                        type={showPin ? "text" : "password"}
                        value={pinInput}
                        onChange={(e) => setPinInput(e.target.value)}
                        placeholder="Enter 4-6 digit PIN or secret password"
                        className="w-full text-xs px-3.5 py-2.5 bg-stone-50/60 border border-stone-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-stone-900/10 focus:border-stone-900 pr-10 transition-all"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPin(!showPin)}
                        className="absolute right-3 top-2.5 text-stone-400 hover:text-stone-600"
                      >
                        {showPin ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>

                  <div className="relative flex items-center justify-center my-2">
                    <div className="border-t border-stone-200 w-full" />
                    <span className="bg-white px-2.5 text-[10px] font-bold text-stone-400 uppercase tracking-widest absolute">
                      or
                    </span>
                  </div>

                  {/* Security Question */}
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-stone-800 flex items-center gap-1.5">
                      <HelpCircle className="w-3.5 h-3.5 text-stone-500" />
                      <span>Option 2: Security Question</span>
                    </label>
                    <div className="p-2.5 bg-stone-100/70 border border-stone-200 rounded-xl text-xs font-medium text-stone-800">
                      {vaultStatus?.securityQuestionPrompt || "What is your secret passphrase / favorite project?"}
                    </div>
                    <input
                      type="text"
                      value={answerInput}
                      onChange={(e) => setAnswerInput(e.target.value)}
                      placeholder="Type your security answer (e.g. keeva)"
                      className="w-full text-xs px-3.5 py-2.5 bg-stone-50/60 border border-stone-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-stone-900/10 focus:border-stone-900 transition-all"
                    />
                  </div>
                </form>
              )}
            </div>
          )}

          {/* Tab 2: Settings */}
          {activeTab === "settings" && (
            <form id="vault-settings-form" onSubmit={handleSaveSettings} className="space-y-4">
              {savedSuccess && (
                <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-xs text-emerald-800 flex items-center gap-2">
                  <Check className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span>Vault configuration updated securely!</span>
                </div>
              )}

              {errorMsg && (
                <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-xs text-red-700 flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 text-red-600 shrink-0" />
                  <span>{errorMsg}</span>
                </div>
              )}

              {/* Set New PIN */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-stone-800">Set / Change Master PIN or Password</label>
                <input
                  type="password"
                  value={newPin}
                  onChange={(e) => setNewPin(e.target.value)}
                  placeholder="Leave blank to keep existing, or type new PIN (e.g. 1234)"
                  className="w-full text-xs px-3.5 py-2.5 bg-stone-50/60 border border-stone-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-stone-900/10 focus:border-stone-900 transition-all"
                />
              </div>

              {/* Security Question Prompt */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-stone-800">Security Question Prompt</label>
                <input
                  type="text"
                  value={newQuestion}
                  onChange={(e) => setNewQuestion(e.target.value)}
                  placeholder="e.g. What was your childhood school?"
                  className="w-full text-xs px-3.5 py-2.5 bg-stone-50/60 border border-stone-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-stone-900/10 focus:border-stone-900 transition-all"
                />
              </div>

              {/* Security Answer */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-stone-800">Security Answer</label>
                <input
                  type="text"
                  value={newAnswer}
                  onChange={(e) => setNewAnswer(e.target.value)}
                  placeholder="Answer (stored as salted one-way hash)"
                  className="w-full text-xs px-3.5 py-2.5 bg-stone-50/60 border border-stone-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-stone-900/10 focus:border-stone-900 transition-all"
                />
              </div>

              {/* Default Proxy Category */}
              <div className="space-y-2">
                <label className="text-xs font-bold text-stone-800">Default Proxy Codename Category</label>
                <div className="grid grid-cols-2 gap-2 text-xs">
                  {[
                    { id: "countries", label: "🌍 Countries", eg: "Japan, Norway, China" },
                    { id: "fruits", label: "🍎 Fruits", eg: "Mango, Peach, Apricot" },
                    { id: "animals", label: "🐾 Animals", eg: "Falcon, Otter, Panther" },
                    { id: "anime", label: "⚔️ Anime", eg: "Kakashi, Levi, Tanjiro" },
                  ].map((cat) => (
                    <button
                      key={cat.id}
                      type="button"
                      onClick={() => setCategoryPref(cat.id)}
                      className={`p-2.5 rounded-xl border text-left transition-all ${
                        categoryPref === cat.id
                          ? "bg-stone-900 text-stone-50 border-stone-900 shadow-2xs font-bold"
                          : "bg-stone-50 hover:bg-stone-100 text-stone-800 border-stone-200"
                      }`}
                    >
                      <div className="text-xs">{cat.label}</div>
                      <div className={`text-[10px] mt-0.5 truncate ${categoryPref === cat.id ? "text-stone-300" : "text-stone-400"}`}>
                        {cat.eg}
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            </form>
          )}
        </div>

        {/* Footer (Fixed - shrink-0) */}
        <div className="shrink-0 px-6 py-3 border-t border-stone-100 bg-stone-50/70 flex items-center justify-end gap-2.5">
          {activeTab === "unlock" && isLocked ? (
            <>
              <button
                type="button"
                onClick={closeModal}
                className="px-4 py-2 border border-stone-200 rounded-xl text-xs font-semibold text-stone-700 hover:bg-white hover:border-stone-300 transition-all"
              >
                Keep Cloaked
              </button>
              <button
                type="submit"
                form="vault-unlock-form"
                disabled={loading || (!pinInput.trim() && !answerInput.trim())}
                className="px-5 py-2 bg-stone-900 text-stone-50 rounded-xl text-xs font-bold hover:bg-stone-800 disabled:opacity-50 flex items-center gap-1.5 shadow-xs transition-all hover:scale-101"
              >
                <Unlock className="w-3.5 h-3.5" />
                <span>{loading ? "Verifying..." : "Unlock Real Names"}</span>
              </button>
            </>
          ) : activeTab === "settings" ? (
            <>
              <button
                type="button"
                onClick={closeModal}
                className="px-4 py-2 border border-stone-200 rounded-xl text-xs font-semibold text-stone-700 hover:bg-white hover:border-stone-300 transition-all"
              >
                Close
              </button>
              <button
                type="submit"
                form="vault-settings-form"
                disabled={loading}
                className="px-5 py-2 bg-stone-900 text-stone-50 rounded-xl text-xs font-bold hover:bg-stone-800 disabled:opacity-50 flex items-center gap-1.5 shadow-xs transition-all hover:scale-101"
              >
                <Check className="w-3.5 h-3.5" />
                <span>{loading ? "Saving..." : "Save Settings"}</span>
              </button>
            </>
          ) : (
            <button
              type="button"
              onClick={closeModal}
              className="px-4 py-2 bg-stone-900 text-stone-50 rounded-xl text-xs font-semibold hover:bg-stone-800 transition-all"
            >
              Close
            </button>
          )}
        </div>
      </div>
    </div>
  );

  return typeof document !== "undefined" ? createPortal(modalContent, document.body) : null;
}
