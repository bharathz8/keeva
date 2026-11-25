"use client";

import React, { useState } from "react";
import {
  Mail,
  Lock,
  LogIn,
  UserPlus,
  ShieldCheck,
  AlertCircle,
  Loader2,
  HeartHandshake,
  Sparkles,
} from "lucide-react";
import { useAuth } from "@/context/AuthContext";

export const AuthGuard: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user, token, loading, loginWithGoogle, loginWithEmail, signupWithEmail } = useAuth();
  const [mode, setMode] = useState<"signin" | "signup">("signin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Show loading state while verifying Firebase session & JWT token
  if (loading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-stone-50 px-4">
        <div className="flex flex-col items-center gap-3 text-center">
          <div className="w-12 h-12 rounded-2xl bg-stone-900 text-stone-50 flex items-center justify-center shadow-sm">
            <HeartHandshake className="w-6 h-6 text-amber-400" />
          </div>
          <div className="flex items-center gap-2 text-stone-700 text-sm font-semibold">
            <Loader2 className="w-4 h-4 animate-spin text-amber-600" />
            <span>Verifying session...</span>
          </div>
        </div>
      </div>
    );
  }

  // Strictly block access if no authenticated user or no JWT token
  if (!user || !token) {
    const handleGoogleSignIn = async () => {
      setSubmitting(true);
      setError(null);
      try {
        await loginWithGoogle();
      } catch (err: unknown) {
        const firebaseErr = err as { code?: string; message?: string };
        const msg = firebaseErr?.message || "";
        if (firebaseErr?.code === "auth/api-key-not-valid" || msg.includes("api-key-not-valid")) {
          setError("Sign-in service is temporarily unavailable. Please try again later.");
        } else {
          setError(msg || "Google sign-in failed. Please try again.");
        }
      } finally {
        setSubmitting(false);
      }
    };

    const handleSubmit = async (e: React.FormEvent) => {
      e.preventDefault();
      setError(null);

      if (!email.trim() || !password.trim()) {
        setError("Please enter both email and password.");
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

      setSubmitting(true);
      try {
        if (mode === "signin") {
          await loginWithEmail(email.trim(), password);
        } else {
          await signupWithEmail(email.trim(), password);
        }
      } catch (err: unknown) {
        const firebaseErr = err as { code?: string; message?: string };
        const code = firebaseErr?.code || "";
        if (code === "auth/user-not-found" || code === "auth/wrong-password" || code === "auth/invalid-credential") {
          setError("Invalid email or password.");
        } else if (code === "auth/email-already-in-use") {
          setError("An account with this email already exists. Please sign in instead.");
        } else if (code === "auth/invalid-email") {
          setError("Please enter a valid email address.");
        } else if (code === "auth/api-key-not-valid" || (firebaseErr?.message || "").includes("api-key-not-valid")) {
          setError("Firebase API key is missing or invalid in frontend/.env.local.");
        } else {
          setError(firebaseErr?.message || "Authentication failed. Please try again.");
        }
      } finally {
        setSubmitting(false);
      }
    };

    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-stone-50 px-4 py-10">
        <div className="w-full max-w-md space-y-6">
          {/* Brand Header */}
          <div className="text-center space-y-2">
            <div className="inline-flex items-center justify-center w-12 h-12 rounded-2xl bg-stone-900 text-stone-50 shadow-sm mx-auto">
              <HeartHandshake className="w-6 h-6 text-amber-400" />
            </div>
            <div className="flex items-center justify-center gap-2">
              <h1 className="text-xl font-bold tracking-tight text-stone-900">
                Relationship Intelligence
              </h1>
              <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-md bg-stone-200/80 text-stone-700 uppercase tracking-wider">
                AI
              </span>
            </div>
            <p className="text-xs text-stone-500">
              Remember the relationship, not just the conversation.
            </p>
          </div>

          {/* Auth Card */}
          <div className="bg-white rounded-3xl border border-stone-200/90 shadow-xl overflow-hidden">
            {/* Banner */}
            <div className="px-6 py-4 bg-stone-900 text-stone-50 flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-amber-500/20 border border-amber-400/30 flex items-center justify-center">
                  <ShieldCheck className="w-4 h-4 text-amber-300" />
                </div>
                <div>
                  <h2 className="text-sm font-bold leading-tight">
                    {mode === "signin" ? "Sign In Required" : "Create Your Account"}
                  </h2>
                  <p className="text-[11px] text-stone-300">
                    Private &amp; Personal Space
                  </p>
                </div>
              </div>
              <Sparkles className="w-4 h-4 text-amber-400/80" />
            </div>

            <div className="p-6 space-y-5">
              {/* Mode Toggle */}
              <div className="grid grid-cols-2 p-1 bg-stone-100 rounded-xl border border-stone-200/80">
                <button
                  type="button"
                  onClick={() => {
                    setMode("signin");
                    setError(null);
                  }}
                  className={`py-2 text-xs font-bold rounded-lg transition-all cursor-pointer ${
                    mode === "signin"
                      ? "bg-white text-stone-950 shadow-xs"
                      : "text-stone-500 hover:text-stone-800"
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
                  className={`py-2 text-xs font-bold rounded-lg transition-all cursor-pointer ${
                    mode === "signup"
                      ? "bg-white text-stone-950 shadow-xs"
                      : "text-stone-500 hover:text-stone-800"
                  }`}
                >
                  Sign Up
                </button>
              </div>

              {/* Error Alert */}
              {error && (
                <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl flex items-start gap-2 text-rose-900 text-xs">
                  <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
                  <span>{error}</span>
                </div>
              )}

              {/* Google Sign-In */}
              <button
                type="button"
                onClick={handleGoogleSignIn}
                disabled={submitting}
                className="w-full py-2.5 px-4 bg-white hover:bg-stone-50 border border-stone-200/90 hover:border-stone-300 rounded-xl font-bold text-stone-800 text-xs flex items-center justify-center gap-2.5 shadow-2xs transition-all cursor-pointer disabled:opacity-60"
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
                    d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                  />
                  <path
                    fill="#EA4335"
                    d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                  />
                </svg>
                <span>Continue with Google</span>
              </button>

              {/* Divider */}
              <div className="relative flex py-0.5 items-center">
                <div className="flex-grow border-t border-stone-200"></div>
                <span className="flex-shrink mx-3 text-[10px] uppercase font-bold text-stone-400 tracking-wider">
                  Or with email
                </span>
                <div className="flex-grow border-t border-stone-200"></div>
              </div>

              {/* Email / Password Form */}
              <form onSubmit={handleSubmit} className="space-y-3.5">
                <div className="space-y-1">
                  <label className="text-[11px] font-bold text-stone-700 block">
                    Email Address
                  </label>
                  <div className="relative">
                    <Mail className="w-4 h-4 text-stone-400 absolute left-3 top-1/2 -translate-y-1/2" />
                    <input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="you@example.com"
                      required
                      className="w-full pl-9 pr-3.5 py-2.5 bg-stone-50 border border-stone-200 rounded-xl text-xs text-stone-900 focus:outline-none focus:ring-2 focus:ring-amber-400 focus:border-amber-400 transition-all"
                    />
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="text-[11px] font-bold text-stone-700 block">
                    Password
                  </label>
                  <div className="relative">
                    <Lock className="w-4 h-4 text-stone-400 absolute left-3 top-1/2 -translate-y-1/2" />
                    <input
                      type="password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder={mode === "signup" ? "Create a password (min 6 chars)" : "Enter your password"}
                      required
                      className="w-full pl-9 pr-3.5 py-2.5 bg-stone-50 border border-stone-200 rounded-xl text-xs text-stone-900 focus:outline-none focus:ring-2 focus:ring-amber-400 focus:border-amber-400 transition-all"
                    />
                  </div>
                </div>

                {mode === "signup" && (
                  <div className="space-y-1">
                    <label className="text-[11px] font-bold text-stone-700 block">
                      Confirm Password
                    </label>
                    <div className="relative">
                      <Lock className="w-4 h-4 text-stone-400 absolute left-3 top-1/2 -translate-y-1/2" />
                      <input
                        type="password"
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        placeholder="Re-enter your password"
                        required
                        className="w-full pl-9 pr-3.5 py-2.5 bg-stone-50 border border-stone-200 rounded-xl text-xs text-stone-900 focus:outline-none focus:ring-2 focus:ring-amber-400 focus:border-amber-400 transition-all"
                      />
                    </div>
                  </div>
                )}

                <button
                  type="submit"
                  disabled={submitting}
                  className="w-full py-2.5 bg-stone-900 hover:bg-stone-800 text-stone-50 rounded-xl text-xs font-bold flex items-center justify-center gap-2 shadow-xs transition-all cursor-pointer disabled:opacity-60 mt-1"
                >
                  {submitting ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : mode === "signin" ? (
                    <>
                      <LogIn className="w-4 h-4 text-amber-400" />
                      <span>Sign In</span>
                    </>
                  ) : (
                    <>
                      <UserPlus className="w-4 h-4 text-amber-400" />
                      <span>Create Account</span>
                    </>
                  )}
                </button>
              </form>
            </div>
          </div>

          <p className="text-center text-[11px] text-stone-400">
            Your relationship history and AI reasoning remain isolated to your account.
          </p>
        </div>
      </div>
    );
  }

  // Authenticated with a valid JWT token -> allow access to the application
  return <>{children}</>;
};
