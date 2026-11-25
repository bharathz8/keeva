import React, { Suspense } from "react";
import type { Metadata } from "next";
import { AuthProvider } from "@/context/AuthContext";
import { PrivacyProvider } from "@/context/PrivacyContext";
import { AuthGuard } from "@/components/AuthGuard";
import { Navbar } from "@/components/Navbar";
import "./globals.css";

export const metadata: Metadata = {
  title: "Relationship Intelligence AI | External Relationship Memory & Reasoning",
  description: "Remember the relationship, not just the conversation. An external relationship memory and reasoning companion.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning className="overflow-x-hidden max-w-full">
      <body
        suppressHydrationWarning
        className="min-h-screen max-w-full overflow-x-hidden bg-stone-50/50 text-stone-900 font-sans antialiased selection:bg-amber-100 selection:text-amber-900"
      >
        <AuthProvider>
          <AuthGuard>
            <PrivacyProvider>
              <div className="min-h-screen flex flex-col w-full max-w-full overflow-x-hidden">
                <Suspense fallback={<div className="h-16 border-b border-stone-200 bg-stone-50" />}>
                  <Navbar />
                </Suspense>
                <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8 pb-20 md:pb-8">
                  <Suspense fallback={<div className="py-20 text-center text-xs text-stone-400">Loading...</div>}>
                    {children}
                  </Suspense>
                </main>
                <footer className="border-t border-stone-200/80 py-6 mb-14 md:mb-0 bg-white/70 text-center text-xs text-stone-500">
                  <p className="font-medium text-stone-700">
                    Relationship Intelligence AI &middot; External Relationship Memory
                  </p>
                  <p className="mt-1 text-stone-400">
                    AI does not decide for me. AI helps me think before I decide.
                  </p>
                </footer>
              </div>
            </PrivacyProvider>
          </AuthGuard>
        </AuthProvider>
      </body>
    </html>
  );
}
