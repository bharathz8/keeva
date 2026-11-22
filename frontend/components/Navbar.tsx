"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { usePrivacy } from "@/context/PrivacyContext";
import { SeedDemoButton } from "./SeedDemoButton";
import { HybridInferenceBadge } from "./HybridInferenceBadge";
import { PrivacyShieldModal } from "./PrivacyShieldModal";
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
  const { user, logout, loginAsDemoUser } = useAuth();
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
      <header className="sticky top-0 z-40 border-b border-stone-200/80 bg-white/90 backdrop-blur-md transition-all">
        <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16 gap-2">
            {/* Logo & Philosophy Branding */}
            <Link href="/" className="flex items-center gap-2.5 sm:gap-3 group shrink-0">
              <div className="w-9 h-9 rounded-xl bg-stone-900 text-stone-100 flex items-center justify-center font-semibold shadow-xs group-hover:bg-stone-800 transition-all duration-200">
                <Compass className="w-5 h-5 text-amber-400 group-hover:rotate-12 transition-transform duration-300" />
              </div>
              <div>
                <div className="flex items-center gap-1.5 sm:gap-2">
                  <span className="font-bold tracking-tight text-stone-900 text-sm sm:text-base leading-tight">
                    Relationship Intelligence
                  </span>
                  <span className="text-[9px] sm:text-[10px] font-extrabold px-1.5 py-0.5 rounded-md bg-stone-100 text-stone-700 border border-stone-200 uppercase tracking-wider">
                    AI
                  </span>
                </div>
                <span className="text-[11px] text-stone-500 font-medium hidden lg:block leading-none mt-0.5">
                  Remember the relationship, not just the conversation
                </span>
              </div>
            </Link>

            {/* Navigation Links (Desktop) */}
            <nav className="hidden md:flex items-center space-x-1 bg-stone-100/80 p-1 rounded-2xl border border-stone-200/70">
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
              {/* Hybrid Badge (hidden on extra small screens to prevent overflow) */}
              <div className="hidden sm:block">
                <HybridInferenceBadge />
              </div>

              {/* Privacy Shield & Cloak Button */}
              <button
                onClick={openModal}
                suppressHydrationWarning
                title={
                  isLocked
                    ? "Privacy Shield: CLOAKED (Aliases active). Click to unlock real names."
                    : "Privacy Shield: UNLOCKED (Real identities visible). Click to manage or cloak."
                }
                className={`flex items-center gap-1 sm:gap-1.5 px-2 sm:px-2.5 py-1.5 rounded-xl text-xs font-bold transition-all shadow-2xs border ${isLocked
                  ? "bg-amber-50 hover:bg-amber-100 text-amber-950 border-amber-300"
                  : "bg-emerald-50 hover:bg-emerald-100 text-emerald-950 border-emerald-300"
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

              {/* Seed Demo Button */}
              <SeedDemoButton />

              {/* User Account / Sign In */}
              {!mounted ? (
                <div className="w-16 h-7 rounded-xl bg-stone-100" />
              ) : user ? (
                <div className="flex items-center gap-1.5 pl-1.5 sm:pl-2 border-l border-stone-200 text-xs">
                  <div
                    className="w-7 h-7 rounded-xl bg-stone-900 text-amber-300 font-bold flex items-center justify-center text-xs shadow-2xs"
                    title={`Signed in as ${user.displayName || user.email}`}
                  >
                    {user.displayName ? user.displayName[0].toUpperCase() : "U"}
                  </div>
                  <button
                    onClick={logout}
                    className="text-stone-500 hover:text-stone-900 hover:bg-stone-100 px-1.5 sm:px-2 py-1 rounded-md text-[11px] font-medium transition-colors hidden sm:block"
                  >
                    Sign Out
                  </button>
                </div>
              ) : (
                <button
                  onClick={loginAsDemoUser}
                  className="px-2.5 sm:px-3 py-1.5 text-xs font-semibold text-stone-800 bg-stone-100 hover:bg-stone-200 rounded-xl transition-colors"
                >
                  Sign In
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Mobile Bottom Navigation Bar (Fixed for smooth mobile experience) */}
        <div className="md:hidden flex items-center justify-around border-t border-stone-200/70 py-2 bg-white/95 backdrop-blur-md px-2 shadow-xs">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = pathname === item.href || (item.href !== "/" && pathname?.startsWith(item.href));
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex flex-col items-center gap-0.5 text-[10px] font-semibold px-2 py-1 rounded-lg transition-colors ${isActive
                  ? "text-stone-950 font-bold bg-stone-100"
                  : "text-stone-500 hover:text-stone-900"
                  }`}
              >
                <Icon className={`w-4 h-4 ${isActive ? "text-amber-600" : "text-stone-400"}`} />
                <span>{item.label}</span>
              </Link>
            );
          })}
        </div>

        <PrivacyShieldModal />
      </header>
    </>
  );
};
