export interface Person {
  id: string;
  userId: string;
  name: string;
  alias?: string;
  aliasCategory?: "countries" | "fruits" | "animals" | "anime" | "custom" | string;
  isEncrypted?: boolean;
  relationshipType: string;
  duration?: string;
  status: string;
  avatar?: string;
  notes?: string;
  lastInteraction?: string;
  createdAt: string;
  updatedAt: string;
}

export interface PrivacyVaultStatus {
  isConfigured: boolean;
  hasPin: boolean;
  hasSecurityQuestion: boolean;
  securityQuestionPrompt?: string | null;
  defaultCategory: string;
}

export interface PresetCategories {
  categories: {
    countries: string[];
    fruits: string[];
    animals: string[];
    anime: string[];
    [key: string]: string[];
  };
}

export interface RelationshipContextObservation {
  id?: string;
  context: string;
  patternObservation: string;
  emotionalIntensity?: string;
  eventCount?: number;
  updatedAt?: string;
}

export interface Relationship {
  id: string;
  userId: string;
  personId: string;
  personName?: string;
  relationshipType: string;
  startedAt?: string;
  status: string;
  notes?: string;
  contexts: RelationshipContextObservation[];
  recentTrend?: string;
  createdAt: string;
  updatedAt: string;
}

export interface RelationshipEvent {
  id: string;
  userId: string;
  relationshipId: string;
  personId?: string;
  personName?: string;
  timestamp?: string;
  context: string;
  eventType: string; // 'conflict' | 'support' | 'reconciliation' | 'communication_gap' | 'milestone' | 'casual'
  description: string;
  userEmotion?: string;
  observedBehavior?: string;
  outcome?: string;
  source: string;
  confidence: number;
  createdAt: string;
  updatedAt: string;
}

export interface ExtractedEventDraft {
  personName?: string;
  relationshipType?: string;
  context: string;
  eventType: string;
  description: string;
  userEmotion?: string;
  observedBehavior?: string;
  outcome?: string;
  confidence: number;
  suggestedTimelineDate?: string;
  explanation?: string;
}

export interface FutureBranch {
  action: string;
  possibleConsequences: string[];
  assumptions: string[];
  reversibility: "high" | "medium" | "low";
  uncertainty: "high" | "medium" | "low";
}

export interface DecisionRecord {
  id: string;
  userId: string;
  personId?: string;
  personName?: string;
  relationshipId?: string;
  situation: string;
  proposedAction?: string;
  emotionalState?: string;
  emotionalIntensity?: number;
  consequenceSeverity?: number;
  reversibility?: string;
  relevantMemories?: Array<{ id?: string; memory: string }>;
  futureBranches: FutureBranch[];
  reflectionQuestions: string[];
  userReflection?: string;
  finalDecision?: string;
  status: "paused" | "reflected" | "decided" | "reconsidered" | "outcome_recorded";
  outcome?: string;
  relationshipImpact?: string;
  createdAt: string;
  updatedAt: string;
}

export interface AgentMessageResponse {
  sessionId: string;
  reply: string;
  personId?: string;
  personName?: string;
  relationshipType?: string;
  isPauseTriggered: boolean;
  pauseReason?: string;
  emotionalIntensity?: number;
  consequenceSeverity?: number;
  reversibility?: string;
  relevantMemories: Array<{ id?: string; memory: string }>;
  relevantEvents: RelationshipEvent[];
  timelineSummary?: string;
  futureBranches: FutureBranch[];
  reflectionQuestions: string[];
  decisionId?: string;
  inferenceSource: "on-device" | "cloud-gemini" | "hybrid-orchestrated" | "on-device-verified";
}
