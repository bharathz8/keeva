import {
  Person,
  Relationship,
  RelationshipEvent,
  ExtractedEventDraft,
  DecisionRecord,
  AgentMessageResponse,
  RelationshipContextObservation,
  PrivacyVaultStatus,
  PresetCategories
} from "@/types";

const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_API_URL || "http://localhost:8000";

let currentAuthToken: string | null = null;

export function setApiAuthToken(token: string | null) {
  currentAuthToken = token;
}

export function getApiAuthToken(): string | null {
  return currentAuthToken;
}

export async function getValidAuthToken(): Promise<string | null> {
  if (currentAuthToken) return currentAuthToken;
  if (typeof window !== "undefined") {
    try {
      const { auth } = await import("./firebase");
      if (auth) {
        if (typeof auth.authStateReady === "function") {
          await auth.authStateReady();
        }
        if (auth.currentUser) {
          const token = await auth.currentUser.getIdToken();
          currentAuthToken = token;
          return token;
        }
      }
    } catch (e) {
      console.warn("Could not retrieve auth token:", e);
    }
  }
  return null;
}

async function request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
  const headers = new Headers(options.headers || {});
  if (!headers.has("Content-Type") && !(options.body instanceof FormData)) {
    headers.set("Content-Type", "application/json");
  }
  if (!headers.has("Authorization")) {
    const token = await getValidAuthToken();
    if (token) {
      headers.set("Authorization", `Bearer ${token}`);
    } else {
      throw new Error("Missing Authorization: Please sign in to access relationship data.");
    }
  }

  const url = `${BACKEND_URL}${endpoint}`;
  const response = await fetch(url, { ...options, headers });

  if (!response.ok) {
    let errorDetail = "API Request failed";
    try {
      const errJson = await response.json();
      errorDetail = errJson.detail || JSON.stringify(errJson);
    } catch {
      errorDetail = `Status code ${response.status}: ${response.statusText}`;
    }
    throw new Error(errorDetail);
  }

  return response.json();
}

// ---------------- People API ----------------
export async function getPeople(): Promise<Person[]> {
  return request<Person[]>("/api/people");
}

export async function getPerson(id: string): Promise<Person> {
  return request<Person>(`/api/people/${id}`);
}

export async function createPerson(data: Partial<Person>): Promise<Person> {
  return request<Person>("/api/people", {
    method: "POST",
    body: JSON.stringify(data)
  });
}

export async function updatePerson(id: string, data: Partial<Person>): Promise<Person> {
  return request<Person>(`/api/people/${id}`, {
    method: "PATCH",
    body: JSON.stringify(data)
  });
}

export async function deletePerson(id: string): Promise<{ status: string }> {
  return request<{ status: string }>(`/api/people/${id}`, {
    method: "DELETE"
  });
}

// ---------------- Relationships API ----------------
export async function getRelationship(id: string): Promise<Relationship> {
  return request<Relationship>(`/api/relationships/${id}`);
}

export async function addRelationshipContext(
  relationshipId: string,
  data: RelationshipContextObservation
): Promise<RelationshipContextObservation> {
  return request<RelationshipContextObservation>(`/api/relationships/${relationshipId}/contexts`, {
    method: "POST",
    body: JSON.stringify(data)
  });
}

// ---------------- Events API ----------------
export async function getRelationshipEvents(relationshipId: string): Promise<RelationshipEvent[]> {
  return request<RelationshipEvent[]>(`/api/relationships/${relationshipId}/events`);
}

export async function createRelationshipEvent(
  relationshipId: string,
  data: Partial<RelationshipEvent>
): Promise<RelationshipEvent> {
  return request<RelationshipEvent>(`/api/relationships/${relationshipId}/events`, {
    method: "POST",
    body: JSON.stringify(data)
  });
}

export async function deleteRelationshipEvent(eventId: string): Promise<{ status: string }> {
  return request<{ status: string }>(`/api/events/${eventId}`, {
    method: "DELETE"
  });
}

export async function extractEventFromNote(
  naturalText: string,
  personId?: string
): Promise<ExtractedEventDraft> {
  return request<ExtractedEventDraft>("/api/events/extract", {
    method: "POST",
    body: JSON.stringify({ naturalText, personId })
  });
}

// ---------------- Agent API ----------------
export async function sendAgentMessage(
  message: string,
  personId?: string,
  sessionId?: string,
  preferredInference: string = "hybrid",
  clientInferenceAttempted: boolean = false
): Promise<AgentMessageResponse> {
  return request<AgentMessageResponse>("/api/agent/message", {
    method: "POST",
    body: JSON.stringify({
      message,
      personId,
      sessionId,
      preferredInference,
      clientInferenceAttempted
    })
  });
}

export async function submitAgentReflection(
  decisionId: string,
  reflectionText: string,
  selectedBranchIndex?: number,
  finalDecision?: string
): Promise<{ status: string; decision: DecisionRecord; message: string }> {
  return request<{ status: string; decision: DecisionRecord; message: string }>("/api/agent/reflect", {
    method: "POST",
    body: JSON.stringify({
      decisionId,
      reflectionText,
      selectedBranchIndex,
      finalDecision
    })
  });
}

// ---------------- Decisions API ----------------
export async function getDecisions(): Promise<DecisionRecord[]> {
  return request<DecisionRecord[]>("/api/decisions");
}

export async function getDecision(id: string): Promise<DecisionRecord> {
  return request<DecisionRecord>(`/api/decisions/${id}`);
}

export async function recordDecisionOutcome(
  id: string,
  outcome: string,
  relationshipImpact?: string
): Promise<DecisionRecord> {
  return request<DecisionRecord>(`/api/decisions/${id}/outcome`, {
    method: "POST",
    body: JSON.stringify({ outcome, relationshipImpact })
  });
}

// ---------------- Demo Seed API ----------------
export async function seedDemoData(): Promise<{ status: string; personId?: string; message: string }> {
  return request<{ status: string; personId?: string; message: string }>("/api/demo/seed", {
    method: "POST"
  });
}

// ---------------- Memories API ----------------
export async function getMemories(personId?: string): Promise<{ memories: any[] }> {
  const query = personId ? `?person_id=${personId}` : "";
  return request<{ memories: any[] }>(`/api/memories${query}`);
}

export async function deleteMemory(memoryId: string): Promise<{ status: string }> {
  return request<{ status: string }>(`/api/memories/${memoryId}`, {
    method: "DELETE"
  });
}

// ---------------- Diagnostic API ----------------
export async function getAIDiagnostics(): Promise<any> {
  return request<any>("/api/agent/diagnostic");
}

// ---------------- Privacy & Encryption Vault API ----------------
export async function getPrivacyVaultStatus(): Promise<PrivacyVaultStatus> {
  return request<PrivacyVaultStatus>("/api/privacy/vault/status");
}

export async function setupPrivacyVault(data: {
  pinOrPassword?: string;
  securityQuestion?: string;
  securityAnswer?: string;
  defaultCategory?: string;
}): Promise<{ status: string; message: string }> {
  return request<{ status: string; message: string }>("/api/privacy/vault/setup", {
    method: "POST",
    body: JSON.stringify(data)
  });
}

export async function unlockPrivacyVault(data: {
  pinOrPassword?: string;
  securityAnswer?: string;
}): Promise<{ status: string; message: string }> {
  return request<{ status: string; message: string }>("/api/privacy/vault/unlock", {
    method: "POST",
    body: JSON.stringify(data)
  });
}

export async function getPresetCategories(): Promise<PresetCategories> {
  return request<PresetCategories>("/api/privacy/presets");
}

export async function suggestAlias(category: string = "countries"): Promise<{
  category: string;
  suggestedAlias: string;
  allOptions: string[];
}> {
  return request<{ category: string; suggestedAlias: string; allOptions: string[] }>(
    `/api/privacy/suggest-alias?category=${category}`
  );
}
