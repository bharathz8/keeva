"use client";

import React, { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import {
  X,
  Mail,
  Lock,
  User,
  LogIn,
  UserPlus,
  ShieldCheck,
  Sparkles,
  AlertCircle,
  Loader2,
  LogOut,
  CheckCircle2,
  KeyRound
} from "lucide-react";
import { useAuth } from "@/context/AuthContext";

interface Props {
  isOpen: boolean;
  onClose: () => void;
  initialMode?: "signin" | "signup";
}

export const AuthModal: React.FC<Props> = ({
  isOpen,
  onClose,
  initialMode = "signin"
}) => {
  const { user, loginWithGoogle, loginWithEmail, signupWithEmail, logout } = useAuth();
  const [mounted, setMounted] = useState(false);
  const [mode, setMode] = useState<"signin" | "signup">(initialMode);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    setMode(initialMode);
    setError(null);
    setSuccessMsg(null);
  }, [initialMode, isOpen]);

  // Escape key & body overflow lock
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

  const handleGoogleSignIn = async () => {
    setLoading(true);
    setError(null);
    try {
      await loginWithGoogle();
      onClose();
    } catch (err: any) {
      const msg = err?.message || "";
      if (err?.code === "auth/api-key-not-valid" || msg.includes("api-key-not-valid")) {
        setError("Firebase API key is missing or invalid in frontend/.env.local.");
      } else {
        setError(msg || "Google sign-in failed. Please try again.");
      }
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccessMsg(null);

    if (!email.trim() || !password.trim()) {
      setError("Please fill in both email and password.");
      return;
    }

    if (mode === "signup") {
      if (password.length < 6) {
        setError("Password must be at least 6 characters.");
        return;
      }
      if (password !== confirmPassword) {
        setError("Passwords do not match.");
        return;
      }
    }

    setLoading(true);
    try {
      if (mode === "signin") {
        await loginWithEmail(email.trim(), password);
        setSuccessMsg("Signed in successfully!");
        setTimeout(() => onClose(), 600);
      } else {
        await signupWithEmail(email.trim(), password);
        setSuccessMsg("Account created successfully!");
        setTimeout(() => onClose(), 600);
      }
    } catch (err: any) {
      const msg = err?.message || "Authentication failed.";
      if (err?.code === "auth/api-key-not-valid" || msg.includes("api-key-not-valid")) {
        setError("Firebase API key is missing or invalid in frontend/.env.local.");
      } else if (msg.includes("user-not-found") || msg.includes("wrong-password") || msg.includes("invalid-credential")) {
        setError("Invalid email or password.");
      } else if (msg.includes("email-already-in-use")) {
        setError("An account already exists with this email. Please sign in instead.");
      } else {
        setError(msg);
      }
    } finally {
      setLoading(false);
    }
  };

  const modalContent = (
    <div
      className="fixed inset-0 z-[9999] flex items-center justify-center p-3 sm:p-5 bg-stone-950/65 backdrop-blur-xs animate-fade-in"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        className="bg-white rounded-3xl max-w-md w-full shadow-2xl border border-stone-200/90 flex flex-col max-h-[90vh] overflow-hidden animate-modal-pop"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="shrink-0 flex items-center justify-between px-6 py-4 border-b border-stone-100 bg-stone-50/60">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-2xl bg-stone-900 text-stone-100 flex items-center justify-center shadow-xs">
              <KeyRound className="w-4 h-4 text-amber-300" />
            </div>
            <div>
              <h3 className="font-bold text-stone-900 text-sm sm:text-base leading-tight">
                {user
                  ? "Account & User Profile"
                  : mode === "signin"
                    ? "Sign In to Keeva"
                    : "Create Your Account"}
              </h3>
              <p className="text-[11px] text-stone-500 mt-0.5">
                Isolated relationship intelligence & Mem0 memory
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="w-8 h-8 rounded-full flex items-center justify-center text-stone-400 hover:text-stone-800 hover:bg-stone-200/60 transition-all"
            aria-label="Close"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="flex-1 min-h-0 overflow-y-auto px-6 py-4 space-y-4 text-xs">
          {/* If user is ALREADY signed in */}
          {user ? (
            <div className="space-y-4 py-2">
              <div className="p-4 rounded-2xl bg-stone-50 border border-stone-200 space-y-3">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-2xl bg-stone-900 text-amber-300 font-bold flex items-center justify-center text-sm shadow-xs">
                    {user.displayName ? user.displayName[0].toUpperCase() : "U"}
                  </div>
                  <div>
                    <span className="font-bold text-stone-950 text-sm block">
                      {user.displayName || "Authenticated User"}
                    </span>
                    <span className="text-stone-500 text-xs block">
                      {user.email}
                    </span>
                  </div>
                </div>

                <div className="pt-2 border-t border-stone-200/70 space-y-1.5 text-[11px]">
                  <div className="flex items-center justify-between text-stone-600">
                    <span className="font-semibold">User ID (UID):</span>
                    <code className="bg-stone-100 px-2 py-0.5 rounded text-[10px] font-mono text-stone-800 select-all">
                      {user.uid.slice(0, 16)}...
                    </code>
                  </div>
                  <div className="flex items-center justify-between text-stone-600">
                    <span className="font-semibold">Memory Isolation:</span>
                    <span className="text-emerald-700 font-bold flex items-center gap-1">
                      <CheckCircle2 className="w-3 h-3" />
                      Isolated to your UID
                    </span>
                  </div>
                </div>
              </div>

              <div className="p-3.5 bg-emerald-50 border border-emerald-200 rounded-2xl text-[11px] text-emerald-900 space-y-1">
                <div className="font-bold flex items-center gap-1.5">
                  <ShieldCheck className="w-4 h-4 text-emerald-700" />
                  <span>Strict Per-User Mem0 Isolation</span>
                </div>
                <p className="text-emerald-800 leading-relaxed font-normal">
                  All your tracked people, conflict patterns, and Mem0 semantic vectors are scoped strictly to your account UID ({user.uid.slice(0, 8)}). No other user can query or see your data.
                </p>
              </div>

              <div className="flex items-center justify-end pt-2">
                <button
                  type="button"
                  onClick={() => {
                    logout();
                    onClose();
                  }}
                  className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white rounded-xl font-bold text-xs flex items-center gap-1.5 shadow-xs transition-all cursor-pointer"
                >
                  <LogOut className="w-3.5 h-3.5" />
                  <span>Sign Out</span>
                </button>
              </div>
            </div>
          ) : (
            <>
              {/* Tabs: Sign In vs Sign Up */}
              <div className="flex items-center p-1 bg-stone-100 rounded-2xl border border-stone-200">
                <button
                  type="button"
                  onClick={() => {
                    setMode("signin");
                    setError(null);
                  }}
                  className={`flex-1 py-1.5 rounded-xl font-bold text-xs transition-all ${mode === "signin"
                    ? "bg-white text-stone-900 shadow-2xs"
                    : "text-stone-500 hover:text-stone-900"
                    }`}
                >
                  Sign In
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setMode("signup");
                    setError(null);
                  }}
                  className={`flex-1 py-1.5 rounded-xl font-bold text-xs transition-all ${mode === "signup"
                    ? "bg-white text-stone-900 shadow-2xs"
                    : "text-stone-500 hover:text-stone-900"
                    }`}
                >
                  Create Account
                </button>
              </div>

              {/* 1-Click Google Sign In */}
              <div>
                <button
                  type="button"
                  onClick={handleGoogleSignIn}
                  disabled={loading}
                  className="w-full py-2.5 px-4 bg-white hover:bg-stone-50 text-stone-850 border border-stone-300 rounded-2xl font-bold text-xs flex items-center justify-center gap-2.5 shadow-2xs transition-all hover:scale-101"
                >
                  <svg className="w-4 h-4" viewBox="0 0 24 24">
                    <path
                      fill="#4285F4"
                      d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                    />
                    <path
                      fill="#34A853"
                      d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                    />
                    <path
                      fill="#FBBC05"
                      d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                    />
                    <path
                      fill="#EA4335"
                      d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                    />
                  </svg>
                  <span>Continue with Google</span>
                </button>
              </div>

              {/* Or Divider */}
              <div className="relative flex items-center justify-center">
                <div className="border-t border-stone-200 w-full" />
                <span className="bg-white px-3 text-[10px] text-stone-400 font-bold uppercase tracking-wider absolute">
                  or email
                </span>
              </div>

              {/* Error & Success Messages */}
              {error && (
                <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl flex items-start gap-2 text-rose-900 text-xs">
                  <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
                  <p className="leading-relaxed">{error}</p>
                </div>
              )}
              {successMsg && (
                <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl flex items-start gap-2 text-emerald-900 text-xs">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                  <span>{successMsg}</span>
                </div>
              )}

              {/* Form */}
              <form onSubmit={handleSubmit} className="space-y-3">
                <div className="space-y-1">
                  <label className="text-[11px] font-bold text-stone-700 block">Email Address</label>
                  <div className="relative">
                    <Mail className="w-4 h-4 text-stone-400 absolute left-3 top-3 pointer-events-none" />
                    <input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="you@example.com"
                      required
                      className="w-full pl-9 pr-3 py-2 bg-stone-50 border border-stone-200 rounded-xl text-xs font-medium focus:ring-2 focus:ring-stone-900 focus:outline-none"
                    />
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="text-[11px] font-bold text-stone-700 block">Password</label>
                  <div className="relative">
                    <Lock className="w-4 h-4 text-stone-400 absolute left-3 top-3 pointer-events-none" />
                    <input
                      type="password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="At least 6 characters"
                      required
                      className="w-full pl-9 pr-3 py-2 bg-stone-50 border border-stone-200 rounded-xl text-xs font-medium focus:ring-2 focus:ring-stone-900 focus:outline-none"
                    />
                  </div>
                </div>

                {mode === "signup" && (
                  <div className="space-y-1">
                    <label className="text-[11px] font-bold text-stone-700 block">Confirm Password</label>
                    <div className="relative">
                      <Lock className="w-4 h-4 text-stone-400 absolute left-3 top-3 pointer-events-none" />
                      <input
                        type="password"
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        placeholder="Re-enter password"
                        required
                        className="w-full pl-9 pr-3 py-2 bg-stone-50 border border-stone-200 rounded-xl text-xs font-medium focus:ring-2 focus:ring-stone-900 focus:outline-none"
                      />
                    </div>
                  </div>
                )}

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full py-2.5 px-4 bg-stone-900 hover:bg-stone-800 text-stone-50 rounded-xl font-bold text-xs flex items-center justify-center gap-2 shadow-xs transition-all hover:scale-101 mt-2"
                >
                  {loading ? (
                    <Loader2 className="w-4 h-4 animate-spin text-amber-300" />
                  ) : mode === "signin" ? (
                    <>
                      <LogIn className="w-4 h-4 text-amber-300" />
                      <span>Sign In</span>
                    </>
                  ) : (
                    <>
                      <UserPlus className="w-4 h-4 text-amber-300" />
                      <span>Create Account</span>
                    </>
                  )}
                </button>
              </form>

              {/* Memory Isolation Reassurance Card */}
              <div className="p-3 bg-stone-50 border border-stone-200/80 rounded-2xl text-[10px] text-stone-600 space-y-1">
                <span className="font-bold text-stone-900 flex items-center gap-1">
                  <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                  <span>Strict Mem0 Isolation Guarantee</span>
                </span>
                <p className="leading-snug">
                  Every relationship profile, event, and Mem0 semantic observation is linked exclusively to your authenticated <code className="font-mono text-stone-800">user_id</code>. Your data is never shared across users or exposed to others.
                </p>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );

  return typeof document !== "undefined" ? createPortal(modalContent, document.body) : null;
};
