"use client";

import React, { useState, useEffect, useRef } from "react";
import { getPeople, sendAgentMessage, submitAgentReflection, seedDemoData } from "@/lib/api";
import { Person, AgentMessageResponse, FutureBranch } from "@/types";
import { AIPauseCard } from "@/components/AIPauseCard";
import { FutureBranchCard } from "@/components/FutureBranchCard";
import { usePrivacy } from "@/context/PrivacyContext";
import { useAuth } from "@/context/AuthContext";
import { 
  getPreferredInferenceMode, 
  setPreferredInferenceMode, 
  getDetailedLocalAIDiagnosis, 
  diagnoseLocalAIFailure,
  InferenceMode,
  LocalAIFailureReport
} from "@/lib/hybrid-ai";
import { LocalAIErrorCard } from "@/components/LocalAIErrorCard";
import { 
  Bot, 
  Send, 
  User, 
  Sparkles, 
  Loader2, 
  CheckCircle2, 
  Compass, 
  History,
  ShieldCheck,
  MessageSquare,
  Lock,
  Unlock,
  AlertTriangle,
  Lightbulb,
  Cpu,
  Cloud,
  Zap,
  Sliders,
  LogIn,
  Shield
} from "lucide-react";

interface ChatMessage {
  id: string;
  sender: "user" | "agent";
  text: string;
  timestamp: string;
  agentResponse?: AgentMessageResponse;
  failureReport?: LocalAIFailureReport;
  pendingTextToRetry?: string;
}

export default function AgentPage() {
  const { resolveName, isLocked, openModal } = usePrivacy();
  const { user, loading: authLoading, openAuthModal } = useAuth();
  const [people, setPeople] = useState<Person[]>([]);
  const [selectedPersonId, setSelectedPersonId] = useState<string>("");
  const [inferenceMode, setInferenceMode] = useState<InferenceMode>("hybrid");
  const [inputMessage, setInputMessage] = useState("");
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [loading, setLoading] = useState(false);
  const [activeDecision, setActiveDecision] = useState<{
    id: string;
    personName: string;
    branches: FutureBranch[];
    questions: string[];
    selectedIndex: number | null;
    reflectionText: string;
    isCommitted: boolean;
  } | null>(null);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const hasAutoFired = useRef(false);

  useEffect(() => {
    setInferenceMode(getPreferredInferenceMode());
    const handleModeChange = (e: any) => {
      setInferenceMode(e.detail || getPreferredInferenceMode());
    };
    window.addEventListener("keeva_inference_mode_changed", handleModeChange);
    return () => window.removeEventListener("keeva_inference_mode_changed", handleModeChange);
  }, []);

  useEffect(() => {
    if (authLoading) return;
    if (!user) {
      setPeople([]);
      return;
    }

    getPeople().then((data) => {
      setPeople(data);
      
      // Check URL query parameters
      if (typeof window !== "undefined") {
        const searchParams = new URLSearchParams(window.location.search);
        const personParam = searchParams.get("personId");
        const msgParam = searchParams.get("msg");

        if (personParam && data.some(p => p.id === personParam)) {
          setSelectedPersonId(personParam);
        } else if (data.length > 0) {
          setSelectedPersonId(data[0].id);
        }

        if (msgParam && !hasAutoFired.current) {
          hasAutoFired.current = true;
          handleSendMessage(msgParam);
        }
      } else if (data.length > 0) {
        setSelectedPersonId(data[0].id);
      }
    }).catch((err) => {
      console.warn("Failed to load people in agent:", err);
    });
  }, [authLoading, user]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, activeDecision]);

  const handleSendMessage = async (customText?: string) => {
    const textToSend = customText || inputMessage;
    if (!textToSend.trim() || loading) return;

    const userMsg: ChatMessage = {
      id: `usr_${Date.now()}`,
      sender: "user",
      text: textToSend.trim(),
      timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
    };

    setMessages((prev) => [...prev, userMsg]);
    setInputMessage("");
    setLoading(true);

    // If On-Device Only mode is selected, verify local model is ready first!
    if (inferenceMode === "on-device") {
      const detailed = await getDetailedLocalAIDiagnosis();
      if (detailed.modelAvailability !== "readily") {
        setLoading(false);
        const report = await diagnoseLocalAIFailure(detailed.errorMessage);
        const errorMsg: ChatMessage = {
          id: `err_local_${Date.now()}`,
          sender: "agent",
          text: `On-Device Gemini Nano is not ready on this machine.`,
          timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
          failureReport: report,
          pendingTextToRetry: textToSend.trim()
        };
        setMessages((prev) => [...prev, errorMsg]);
        return;
      }
    }

    try {
      const response = await sendAgentMessage(
        textToSend.trim(),
        selectedPersonId || undefined,
        undefined,
        inferenceMode
      );

      const agentMsg: ChatMessage = {
        id: `agent_${Date.now()}`,
        sender: "agent",
        text: response.reply,
        timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
        agentResponse: response
      };

      setMessages((prev) => [...prev, agentMsg]);

      // If Pause and branches generated, activate interactive decision state
      if (response.isPauseTriggered && response.futureBranches && response.futureBranches.length > 0) {
        setActiveDecision({
          id: response.decisionId || `dec_${Date.now()}`,
          personName: response.personName || "Friend",
          branches: response.futureBranches,
          questions: response.reflectionQuestions || [],
          selectedIndex: null,
          reflectionText: "",
          isCommitted: false
        });
      }
    } catch (err: any) {
      if (inferenceMode === "on-device") {
        const report = await diagnoseLocalAIFailure(err?.message || "Local Gemini Nano runtime error.");
        const errorMsg: ChatMessage = {
          id: `err_local_${Date.now()}`,
          sender: "agent",
          text: `Local Gemini Nano execution failed.`,
          timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
          failureReport: report,
          pendingTextToRetry: textToSend.trim()
        };
        setMessages((prev) => [...prev, errorMsg]);
      } else {
        const errorMsg: ChatMessage = {
          id: `err_${Date.now()}`,
          sender: "agent",
          text: "Reasoning error: " + (err.message || "Could not complete reasoning request."),
          timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
        };
        setMessages((prev) => [...prev, errorMsg]);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleFallbackAndRetry = (textToRetry?: string) => {
    setInferenceMode("cloud");
    setPreferredInferenceMode("cloud");
    if (textToRetry) {
      setTimeout(() => {
        handleSendMessage(textToRetry);
      }, 50);
    }
  };

  const handleCommitReflection = async () => {
    if (!activeDecision || activeDecision.selectedIndex === null) return;

    const chosenBranch = activeDecision.branches[activeDecision.selectedIndex];
    try {
      setLoading(true);
      await submitAgentReflection(
        activeDecision.id,
        activeDecision.reflectionText.trim() || "Chosen after reviewing longitudinal context.",
        activeDecision.selectedIndex,
        chosenBranch.action
      );

      setActiveDecision((prev) => prev ? { ...prev, isCommitted: true } : null);

      const confirmationMsg: ChatMessage = {
        id: `sys_${Date.now()}`,
        sender: "agent",
        text: `You have made your decision: "${chosenBranch.action}".\n\nYour choice and reflection notes have been stored in your relationship history. In the future, this outcome will help you understand patterns and consequences better.`,
        timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
      };
      setMessages((prev) => [...prev, confirmationMsg]);
    } catch (err: any) {
      alert("Error saving reflection: " + err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6 animate-fade-in pb-24 md:pb-12">
      {/* Reasoning Chamber Header */}
      <div className="bg-white border border-stone-200/90 rounded-2xl p-5 sm:p-6 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-[10px] font-bold uppercase tracking-wider text-amber-950 bg-amber-100/80 px-2 py-0.5 rounded-md border border-amber-200/70">
              LangGraph Reasoning Engine
            </span>
            <span className="text-xs text-stone-500 font-semibold">
              Hybrid Memory Active
            </span>
          </div>
          <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-stone-900 mt-1">
            Relationship Reasoning Chamber
          </h1>
          <p className="text-xs sm:text-sm text-stone-500 mt-0.5">
            AI does not decide for me. AI helps me think before I decide.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          {/* Inference Mode Selector */}
          <div className="flex items-center gap-1.5 bg-stone-50 px-2.5 py-1.5 rounded-xl border border-stone-200/80 shrink-0">
            <label htmlFor="inference-mode-select" className="text-[11px] font-semibold text-stone-600">Inference:</label>
            <select
              id="inference-mode-select"
              aria-label="Inference Mode"
              value={inferenceMode}
              onChange={(e) => {
                const newMode = e.target.value as InferenceMode;
                setInferenceMode(newMode);
                setPreferredInferenceMode(newMode);
              }}
              className="px-2 py-1 border border-stone-200 rounded-lg text-xs bg-white text-stone-900 font-semibold focus:ring-2 focus:ring-stone-900 focus:outline-none shadow-2xs cursor-pointer"
            >
              <option value="hybrid">⚡ Auto (Hybrid)</option>
              <option value="on-device">💻 On-Device Only</option>
              <option value="cloud">☁️ Cloud Gemini Only</option>
            </select>
          </div>

          {/* Target Person Selector */}
          <div className="flex items-center gap-1.5 bg-stone-50 px-2.5 py-1.5 rounded-xl border border-stone-200/80 shrink-0">
            <label htmlFor="target-person-select" className="text-[11px] font-semibold text-stone-600">Target:</label>
            <select
              id="target-person-select"
              aria-label="Target Person"
              value={selectedPersonId}
              onChange={(e) => setSelectedPersonId(e.target.value)}
              className="px-2 py-1 border border-stone-200 rounded-lg text-xs bg-white text-stone-900 font-semibold focus:ring-2 focus:ring-stone-900 focus:outline-none shadow-2xs cursor-pointer max-w-[170px] truncate"
            >
              <option value="">Auto-detect from message</option>
              {people.map((p) => (
                <option key={p.id} value={p.id}>
                  {resolveName(p)} ({p.relationshipType})
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Guest Mode Notice */}
      {!user && !authLoading && (
        <div className="bg-amber-50/80 border border-amber-200/90 rounded-2xl p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-amber-950">
          <div className="flex items-center gap-2.5">
            <Shield className="w-4 h-4 text-amber-700 shrink-0" />
            <p className="text-xs font-medium">
              <strong>Guest Mode:</strong> Sign in so your relationship reasoning, longitudinal memory, and decisions are preserved in your private vault.
            </p>
          </div>
          <button
            onClick={() => openAuthModal("signin")}
            className="px-3.5 py-1.5 bg-stone-900 text-stone-50 font-bold text-xs rounded-xl hover:bg-stone-800 transition-colors shrink-0 flex items-center gap-1.5 cursor-pointer shadow-2xs"
          >
            <LogIn className="w-3.5 h-3.5 text-amber-300" />
            <span>Sign In</span>
          </button>
        </div>
      )}

      {/* Test Scenarios Quick Bar */}
      <div className="space-y-1.5 min-w-0 max-w-full">
        <span className="text-stone-500 font-semibold uppercase tracking-wider text-[10px] flex items-center gap-1.5 pl-1">
          <Sparkles className="w-3.5 h-3.5 text-amber-600" />
          Click to test flagship reasoning scenarios:
        </span>
        <div className="flex items-center gap-2 overflow-x-auto pb-1 text-xs scrollbar-none max-w-full min-w-0">
          <button
            onClick={() => handleSendMessage("Rahul ignored me again. I'm done with this friendship.")}
            className="px-3.5 py-1.5 bg-amber-50 hover:bg-amber-100/80 text-amber-950 border border-amber-300 rounded-xl shrink-0 font-semibold transition-all shadow-2xs hover:scale-101 cursor-pointer"
          >
            "Rahul ignored me again. I'm done with this friendship." (Flagship Pause)
          </button>
          <button
            onClick={() => handleSendMessage("What patterns have we recorded regarding politics with Rahul?")}
            className="px-3.5 py-1.5 bg-white hover:bg-stone-50 text-stone-800 border border-stone-200/90 rounded-xl shrink-0 font-medium transition-colors shadow-2xs cursor-pointer"
          >
            "What patterns have we recorded regarding politics?"
          </button>
          <button
            onClick={() => handleSendMessage("How did we resolve our previous conflict?")}
            className="px-3.5 py-1.5 bg-white hover:bg-stone-50 text-stone-800 border border-stone-200/90 rounded-xl shrink-0 font-medium transition-colors shadow-2xs cursor-pointer"
          >
            "How did we resolve our previous conflict?"
          </button>
        </div>
      </div>

      {/* Main Conversation Canvas */}
      <div className="bg-white border border-stone-200/90 rounded-2xl p-5 sm:p-6 shadow-xs min-h-[500px] flex flex-col justify-between">
        <div className="space-y-6 flex-1 overflow-y-auto pr-1">
          {messages.length === 0 ? (
            <div className="py-24 text-center space-y-4">
              <div className="w-14 h-14 rounded-3xl bg-amber-50 text-amber-800 flex items-center justify-center mx-auto shadow-2xs border border-amber-200/70">
                <Bot className="w-7 h-7" />
              </div>
              <div className="space-y-1">
                <h3 className="font-bold text-stone-900 text-lg">
                  Ask about any interaction, pattern, or consequential impulse
                </h3>
                <p className="text-xs sm:text-sm text-stone-500 max-w-lg mx-auto leading-relaxed">
                  Try asking about past friction, or click the flagship prompt{" "}
                  <span className="font-bold text-stone-800">"Rahul ignored me again. I'm done with this friendship."</span> to see the AI activate a Pause, surface what you might be forgetting, and evaluate future branches.
                </p>
              </div>
            </div>
          ) : (
            messages.map((msg) => (
              <div key={msg.id} className="space-y-3">
                {/* User Message */}
                {msg.sender === "user" && (
                  <div className="flex items-start justify-end gap-3">
                    <div className="bg-stone-900 text-stone-50 rounded-2xl rounded-tr-xs px-4.5 py-3 max-w-lg shadow-xs text-xs sm:text-sm leading-relaxed font-medium">
                      <p>{msg.text}</p>
                      <span className="block text-[10px] text-stone-400 text-right mt-1.5 font-normal">
                        {msg.timestamp}
                      </span>
                    </div>
                    <div className="w-8 h-8 rounded-full bg-stone-200 text-stone-900 font-bold flex items-center justify-center text-xs shrink-0 shadow-2xs">
                      You
                    </div>
                  </div>
                )}

                {/* Agent Response */}
                {msg.sender === "agent" && (
                  <div className="flex items-start gap-3.5">
                    <div className="w-8 h-8 rounded-xl bg-stone-900 text-amber-300 flex items-center justify-center shrink-0 shadow-xs mt-1">
                      <Bot className="w-4 h-4" />
                    </div>
                    <div className="flex-1 max-w-2xl space-y-3">
                      {/* Signature AI Pause Card */}
                      {msg.agentResponse?.isPauseTriggered && (
                        <AIPauseCard
                          personName={msg.agentResponse.personName || "Friend"}
                          relationshipType={msg.agentResponse.relationshipType}
                          duration={msg.agentResponse.timelineSummary ? "8 years" : "multi-year"}
                          pauseReason={msg.agentResponse.pauseReason}
                          relevantMemories={msg.agentResponse.relevantMemories}
                          relevantEvents={msg.agentResponse.relevantEvents}
                          timelineSummary={msg.agentResponse.timelineSummary}
                          emotionalIntensity={msg.agentResponse.emotionalIntensity}
                          consequenceSeverity={msg.agentResponse.consequenceSeverity}
                          reversibility={msg.agentResponse.reversibility}
                        />
                      )}

                      {/* Detailed Local AI Failure Card if on-device model was requested but failed */}
                      {msg.failureReport ? (
                        <LocalAIErrorCard
                          report={msg.failureReport}
                          onFallbackToCloud={() => handleFallbackAndRetry(msg.pendingTextToRetry)}
                          onRetryLocal={() => handleSendMessage(msg.pendingTextToRetry)}
                        />
                      ) : (
                        /* Agent Response Text Box */
                        <div className="bg-stone-50/90 border border-stone-200/80 rounded-2xl rounded-tl-xs p-5 text-xs sm:text-sm text-stone-850 leading-relaxed whitespace-pre-wrap shadow-2xs font-normal">
                          <p>{msg.text}</p>
                          <div className="mt-3 pt-2.5 border-t border-stone-200/50 flex items-center justify-between text-[10px] text-stone-400 font-medium">
                            <span>
                              Inference: {msg.agentResponse?.inferenceSource || "cloud-gemini"}
                            </span>
                            <span>{msg.timestamp}</span>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            ))
          )}

          {/* Interactive Decision Cockpit (Generated Plausible Future Paths) */}
          {activeDecision && !activeDecision.isCommitted && (
            <div className="my-6 p-5 sm:p-6 bg-amber-50/30 border border-amber-200/90 rounded-2xl space-y-5 shadow-xs animate-fade-in">
              <div className="flex items-center justify-between">
                <div>
                  <span className="text-[10px] font-bold uppercase tracking-wider text-amber-950 bg-amber-200/80 px-2.5 py-0.5 rounded-md border border-amber-300/60">
                    Decision Workspace
                  </span>
                  <h3 className="text-base font-bold text-stone-900 mt-1">
                    Select a path or consequences you are actually willing to accept
                  </h3>
                </div>
                <span className="text-xs font-semibold text-stone-500 hidden sm:block">
                  You decide. Not the AI.
                </span>
              </div>

              {/* Reflection Questions */}
              {activeDecision.questions && activeDecision.questions.length > 0 && (
                <div className="p-4 bg-white border border-amber-200/80 rounded-xl space-y-2 shadow-2xs">
                  <div className="text-xs font-bold text-amber-950 flex items-center gap-1.5">
                    <Lightbulb className="w-3.5 h-3.5 text-amber-600" />
                    <span>Reflection questions to consider before you act:</span>
                  </div>
                  <ul className="space-y-1.5 text-xs text-stone-700 pl-4 list-disc">
                    {activeDecision.questions.map((q, i) => (
                      <li key={i} className="leading-relaxed italic">{q}</li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Branches Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                {activeDecision.branches.map((branch, idx) => (
                  <FutureBranchCard
                    key={idx}
                    branch={branch}
                    index={idx}
                    isSelected={activeDecision.selectedIndex === idx}
                    onSelect={() => setActiveDecision({ ...activeDecision, selectedIndex: idx })}
                  />
                ))}
              </div>

              {/* User Reflection Note */}
              <div className="space-y-1.5">
                <label htmlFor="user-decision-reflection" className="block text-xs font-bold text-stone-800">
                  Your Reflection & Rationale (Stored in your relationship memory):
                </label>
                <textarea
                  id="user-decision-reflection"
                  rows={2}
                  value={activeDecision.reflectionText}
                  onChange={(e) => setActiveDecision({ ...activeDecision, reflectionText: e.target.value })}
                  placeholder="Why did you choose this path? What are you willing to accept?"
                  className="w-full px-3.5 py-2.5 border border-stone-200 bg-white rounded-xl text-xs font-medium focus:ring-2 focus:ring-stone-900 focus:outline-none shadow-2xs leading-relaxed"
                />
              </div>

              {/* Commit Action */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-2 border-t border-amber-200/70">
                <span className="text-[11px] text-stone-500 font-medium">
                  The AI does not decide. You choose the path and own the outcome.
                </span>
                <button
                  onClick={handleCommitReflection}
                  disabled={loading || activeDecision.selectedIndex === null}
                  className="px-5 py-2.5 bg-stone-900 text-stone-50 rounded-xl text-xs font-bold hover:bg-stone-800 disabled:opacity-50 flex items-center justify-center gap-2 shadow-xs transition-colors shrink-0 cursor-pointer"
                >
                  <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                  <span>Confirm My Decision</span>
                </button>
              </div>
            </div>
          )}

          {loading && (
            <div className="flex items-center gap-2.5 text-stone-500 text-xs py-3 pl-3">
              <Loader2 className="w-4 h-4 animate-spin text-stone-800" />
              <span className="font-semibold text-stone-700">
                Retrieving relationship history, evaluating consequence signals, and generating scenarios...
              </span>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* Input Bar */}
        <div className="mt-4 pt-3 border-t border-stone-100 flex gap-2 sm:gap-2.5">
          <input
            type="text"
            aria-label="Ask about any interaction or consequential impulse"
            value={inputMessage}
            onChange={(e) => setInputMessage(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleSendMessage()}
            placeholder="Describe what happened or what you're thinking of doing..."
            className="flex-1 px-3.5 sm:px-4 py-2.5 sm:py-3 border border-stone-200 rounded-xl text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-stone-900 bg-stone-50/50 shadow-2xs font-medium"
          />
          <button
            onClick={() => handleSendMessage()}
            disabled={loading || !inputMessage.trim()}
            aria-label="Send message"
            className="px-3.5 sm:px-5 py-2.5 sm:py-3 bg-stone-900 text-stone-50 rounded-xl text-xs sm:text-sm font-bold hover:bg-stone-800 disabled:opacity-50 transition-colors flex items-center gap-1.5 sm:gap-2 shadow-xs shrink-0 cursor-pointer"
          >
            <Send className="w-3.5 h-3.5 text-amber-300" />
            <span className="hidden xs:inline">Send</span>
          </button>
        </div>
      </div>
    </div>
  );
}
