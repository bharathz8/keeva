/**
 * Chrome Prompt API (Built-in AI / Gemini Nano) Type Declarations
 * W3C Web Incubator Community Group (WICG) Prompt API specification
 */

export type LanguageModelAvailability =
  | "readily"
  | "after-download"
  | "downloading"
  | "no"
  | "available"
  | "downloadable"
  | "unavailable";

export interface LanguageModelDownloadProgressEvent extends Event {
  loaded: number;
  total: number;
}

export interface LanguageModelCreateOptions {
  systemPrompt?: string;
  initialPrompts?: Array<{ role: "system" | "user" | "assistant"; content: string }>;
  temperature?: number;
  topK?: number;
  signal?: AbortSignal;
  monitor?: (monitor: EventTarget) => void;
}

export interface LanguageModelSession {
  prompt(input: string, options?: { signal?: AbortSignal }): Promise<string>;
  promptStreaming?(input: string, options?: { signal?: AbortSignal }): ReadableStream<string>;
  countPromptTokens?(input: string): Promise<number>;
  destroy(): void;
  clone?(): Promise<LanguageModelSession>;
  maxTokens?: number;
  tokensSoFar?: number;
  tokensLeft?: number;
  topK?: number;
  temperature?: number;
}

export interface LanguageModelStatic {
  availability(options?: LanguageModelCreateOptions): Promise<LanguageModelAvailability>;
  create(options?: LanguageModelCreateOptions): Promise<LanguageModelSession>;
  capabilities?(): Promise<{ available: LanguageModelAvailability }>;
}

declare global {
  interface Window {
    LanguageModel?: LanguageModelStatic;
  }
  var LanguageModel: LanguageModelStatic | undefined;
}
