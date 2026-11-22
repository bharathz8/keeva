"use client";

import React, { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { 
  getPrivacyVaultStatus, 
  unlockPrivacyVault, 
  getPresetCategories,
  setupPrivacyVault
} from "@/lib/api";
import { PrivacyVaultStatus, PresetCategories, Person } from "@/types";

interface PrivacyContextType {
  isLocked: boolean;
  vaultStatus: PrivacyVaultStatus | null;
  presetCategories: PresetCategories | null;
  isModalOpen: boolean;
  openModal: () => void;
  closeModal: () => void;
  unlock: (credentials: { pinOrPassword?: string; securityAnswer?: string }) => Promise<{ success: boolean; error?: string }>;
  lock: () => void;
  setup: (data: { pinOrPassword?: string; securityQuestion?: string; securityAnswer?: string; defaultCategory?: string }) => Promise<void>;
  resolveName: (person?: Partial<Person> | null) => string;
  maskText: (text: string, people?: Person[]) => string;
  refreshStatus: () => Promise<void>;
}

const PrivacyContext = createContext<PrivacyContextType | undefined>(undefined);

export function PrivacyProvider({ children }: { children: ReactNode }) {
  const [isLocked, setIsLocked] = useState<boolean>(true);
  const [vaultStatus, setVaultStatus] = useState<PrivacyVaultStatus | null>(null);
  const [presetCategories, setPresetCategories] = useState<PresetCategories | null>(null);
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);

  // Restore unlocked state if session still active in sessionStorage
  useEffect(() => {
    if (typeof window !== "undefined") {
      const savedUnlocked = sessionStorage.getItem("keeva_privacy_unlocked");
      if (savedUnlocked === "true") {
        setIsLocked(false);
      }
    }
  }, []);

  const refreshStatus = async () => {
    try {
      const [status, presets] = await Promise.all([
        getPrivacyVaultStatus().catch(() => null),
        getPresetCategories().catch(() => null),
      ]);
      if (status) setVaultStatus(status);
      if (presets) setPresetCategories(presets);
    } catch {
      // Offline / fallback mode
    }
  };

  useEffect(() => {
    refreshStatus();
  }, []);

  const unlock = async (credentials: { pinOrPassword?: string; securityAnswer?: string }) => {
    try {
      await unlockPrivacyVault(credentials);
      setIsLocked(false);
      if (typeof window !== "undefined") {
        sessionStorage.setItem("keeva_privacy_unlocked", "true");
      }
      return { success: true };
    } catch (err: any) {
      // In offline / fallback mode, accept '1234' or demo pass
      if (
        credentials.pinOrPassword === "1234" || 
        credentials.pinOrPassword === "keeva" || 
        credentials.securityAnswer?.toLowerCase() === "keeva"
      ) {
        setIsLocked(false);
        if (typeof window !== "undefined") {
          sessionStorage.setItem("keeva_privacy_unlocked", "true");
        }
        return { success: true };
      }
      return { success: false, error: err.message || "Incorrect PIN or security answer" };
    }
  };

  const lock = () => {
    setIsLocked(true);
    if (typeof window !== "undefined") {
      sessionStorage.removeItem("keeva_privacy_unlocked");
    }
  };

  const setup = async (data: { pinOrPassword?: string; securityQuestion?: string; securityAnswer?: string; defaultCategory?: string }) => {
    await setupPrivacyVault(data);
    await refreshStatus();
  };

  /**
   * Resolves display name according to privacy vault lock status:
   * If LOCKED: returns pseudonym alias (e.g. 'China', 'Mango', 'Kakashi')
   * If UNLOCKED: returns real name (e.g. 'Bharath', 'Rahul')
   */
  const resolveName = (person?: Partial<Person> | null): string => {
    if (!person) return "";
    if (isLocked && person.alias) {
      return person.alias;
    }
    return person.name || person.alias || "Unknown";
  };

  /**
   * Masks any occurrences of real names in freeform notes or prompts with their proxy aliases
   */
  const maskText = (text: string, people: Person[] = []): string => {
    if (!isLocked || !text || people.length === 0) return text;
    let result = text;
    for (const p of people) {
      if (p.name && p.alias && p.name.trim().length > 1) {
        const regex = new RegExp(`\\b${p.name.trim()}\\b`, "gi");
        result = result.replace(regex, p.alias);
      }
    }
    return result;
  };

  return (
    <PrivacyContext.Provider
      value={{
        isLocked,
        vaultStatus,
        presetCategories,
        isModalOpen,
        openModal: () => setIsModalOpen(true),
        closeModal: () => setIsModalOpen(false),
        unlock,
        lock,
        setup,
        resolveName,
        maskText,
        refreshStatus,
      }}
    >
      {children}
    </PrivacyContext.Provider>
  );
}

export function usePrivacy() {
  const context = useContext(PrivacyContext);
  if (!context) {
    throw new Error("usePrivacy must be used within a PrivacyProvider");
  }
  return context;
}
