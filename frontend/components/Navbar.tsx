"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { usePrivacy } from "@/context/PrivacyContext";
import { HybridInferenceBadge } from "./HybridInferenceBadge";
import { PrivacyShieldModal } from "./PrivacyShieldModal";
import { AuthModal } from "./AuthModal";
import {
  Users,
  Bot,
  History,
  LayoutDashboard,
  Compass,
  Sparkles,
  Shield,
  Lock,
  Unlock,
  KeyRound
} from "lucide-react";

export const Navbar: React.FC = () => {
  const pathname = usePathname();
  const { user, logout, openAuthModal, closeAuthModal, isAuthModalOpen, authModalMode } = useAuth();
  const { isLocked, openModal, vaultStatus } = usePrivacy();
  const [mounted, setMounted] = React.useState(false);

  React.useEffect(() => {
    setMounted(true);
  }, []);

  const navItems = [
    { label: "Dashboard", href: "/", icon: LayoutDashboard },
    { label: "People", href: "/people", icon: Users },
    { label: "AI Reasoning", href: "/agent", icon: Bot },
    { label: "Decisions", href: "/decisions", icon: History },
  ];

  return (
    <>
      <header className="sticky top-0 z-40 border-b border-stone-200/80 bg-white/95 backdrop-blur-md transition-all">
        <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16 gap-2 sm:gap-4 max-w-full">
            {/* Logo & Philosophy Branding */}
            <Link href="/" className="flex items-center gap-2.5 sm:gap-3 group shrink min-w-0" aria-label="Keeva Home">
              <div className="w-9 h-9 rounded-xl bg-stone-900 text-stone-100 flex items-center justify-center font-semibold shadow-xs group-hover:bg-stone-800 transition-all duration-200 shrink-0">
                <Compass className="w-5 h-5 text-amber-400 group-hover:rotate-12 transition-transform duration-300" />
              </div>
              <div className="min-w-0">
                <div className="flex items-center gap-1.5 sm:gap-2">
                  <span className="font-bold tracking-tight text-stone-900 text-sm sm:text-base leading-tight truncate">
                    Relationship Intelligence
                  </span>
                  <span className="text-[9px] sm:text-[10px] font-bold px-1.5 py-0.5 rounded-md bg-stone-100 text-stone-700 border border-stone-200/80 uppercase tracking-wider shrink-0">
                    AI
                  </span>
                </div>
                <span className="text-[11px] text-stone-500 font-medium hidden lg:block leading-none mt-0.5 truncate">
                  Remember the relationship, not just the conversation
                </span>
              </div>
            </Link>

            {/* Navigation Links (Desktop) */}
            <nav className="hidden md:flex items-center space-x-1 bg-stone-100/90 p-1 rounded-2xl border border-stone-200/70 shrink-0" aria-label="Main Navigation">
              {navItems.map((item) => {
                const Icon = item.icon;
                const isActive = pathname === item.href || (item.href !== "/" && pathname?.startsWith(item.href));
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold transition-all duration-150 ${isActive
                      ? "bg-white text-stone-950 shadow-xs border border-stone-200/80 font-bold"
                      : "text-stone-600 hover:text-stone-950 hover:bg-white/60"
                      }`}
                  >
                    <Icon className={`w-3.5 h-3.5 ${isActive ? "text-amber-600" : "text-stone-400"}`} />
                    <span>{item.label}</span>
                  </Link>
                );
              })}
            </nav>

            {/* Header Badges & Actions */}
            <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
              {/* Hybrid Badge (visible on large screens where there's plenty of room) */}
              <div className="hidden lg:block shrink-0">
                <HybridInferenceBadge />
              </div>

              {/* Privacy Shield & Cloak Button */}
              <button
                onClick={openModal}
                suppressHydrationWarning
                aria-label={isLocked ? "Privacy Shield active, click to unlock" : "Privacy Shield unlocked, click to cloak"}
                title={
                  isLocked
                    ? "Privacy Shield: CLOAKED (Aliases active). Click to unlock real names."
                    : "Privacy Shield: UNLOCKED (Real identities visible). Click to manage or cloak."
                }
                className={`flex items-center gap-1 sm:gap-1.5 px-2.5 py-1.5 rounded-xl text-xs font-bold transition-all shadow-2xs border cursor-pointer ${isLocked
                  ? "bg-amber-50 hover:bg-amber-100/80 text-amber-950 border-amber-300"
                  : "bg-emerald-50 hover:bg-emerald-100/80 text-emerald-950 border-emerald-300"
                  }`}
              >
                {isLocked ? (
                  <>
                    <Lock className="w-3.5 h-3.5 text-amber-700" />
                    <span className="hidden xs:inline text-[11px] font-bold">Cloaked</span>
                    <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse" />
                  </>
                ) : (
                  <>
                    <Unlock className="w-3.5 h-3.5 text-emerald-700" />
                    <span className="hidden xs:inline text-[11px] font-bold">Unlocked</span>
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                  </>
                )}
              </button>

              {/* User Account / Sign In / Sign Up */}
              {!mounted ? (
                <div className="w-16 h-7 rounded-xl bg-stone-100 animate-pulse" />
              ) : user ? (
                <div className="flex items-center gap-1.5 pl-1.5 sm:pl-2 border-l border-stone-200 text-xs">
                  <button
                    type="button"
                    onClick={() => openAuthModal("signin")}
                    className="flex items-center gap-1.5 px-2 py-1 rounded-xl hover:bg-stone-100 transition-colors cursor-pointer group"
                    aria-label="User Account Settings"
                    title={`Signed in as ${user.displayName || user.email}. Click to view your account.`}
                  >
                    <div className="w-7 h-7 rounded-xl bg-stone-900 text-amber-300 font-bold flex items-center justify-center text-xs shadow-2xs group-hover:scale-105 transition-transform">
                      {user.displayName ? user.displayName[0].toUpperCase() : "U"}
                    </div>
                    <span className="hidden md:inline font-semibold text-stone-800 text-[11px] max-w-[90px] truncate">
                      {user.displayName || user.email?.split("@")[0] || "User"}
                    </span>
                  </button>
                  <button
                    onClick={logout}
                    aria-label="Sign Out"
                    className="text-stone-500 hover:text-rose-700 hover:bg-stone-100 px-1.5 sm:px-2 py-1 rounded-md text-[11px] font-medium transition-colors hidden sm:block cursor-pointer"
                  >
                    Sign Out
                  </button>
                </div>
              ) : (
                <div className="flex items-center gap-1.5 pl-1.5 sm:pl-2 border-l border-stone-200 text-xs">
                  <button
                    onClick={() => openAuthModal("signin")}
                    className="px-2.5 sm:px-3 py-1.5 text-xs font-semibold text-stone-800 bg-stone-100 hover:bg-stone-200 rounded-xl transition-colors cursor-pointer"
                  >
                    Sign In
                  </button>
                  <button
                    onClick={() => openAuthModal("signup")}
                    className="px-2.5 sm:px-3 py-1.5 text-xs font-bold text-stone-50 bg-stone-900 hover:bg-stone-800 rounded-xl transition-colors hidden sm:block cursor-pointer shadow-xs"
                  >
                    Sign Up
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>

        <PrivacyShieldModal />
        <AuthModal
          isOpen={isAuthModalOpen}
          onClose={closeAuthModal}
          initialMode={authModalMode}
        />
      </header>

      {/* Fixed Mobile Bottom Navigation Bar (Docked to bottom with safe-area padding) */}
      <nav 
        aria-label="Mobile Navigation"
        className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-white/95 backdrop-blur-md border-t border-stone-200/90 py-2 px-3 shadow-[0_-4px_16px_rgba(0,0,0,0.04)] flex items-center justify-around"
      >
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = pathname === item.href || (item.href !== "/" && pathname?.startsWith(item.href));
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex flex-col items-center gap-1 text-[10px] font-semibold px-3 py-1 rounded-xl transition-all ${isActive
                ? "text-stone-950 font-bold bg-stone-100/90 shadow-2xs"
                : "text-stone-500 hover:text-stone-900"
                }`}
            >
              <Icon className={`w-4 h-4 ${isActive ? "text-amber-600" : "text-stone-400"}`} />
              <span>{item.label}</span>
            </Link>
          );
        })}
      </nav>
    </>
  );
};
