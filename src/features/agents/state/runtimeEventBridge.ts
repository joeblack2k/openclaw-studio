import type { AgentState } from "./store";

type LifecyclePhase = "start" | "end" | "error";

type LifecyclePatchInput = {
  phase: LifecyclePhase;
  incomingRunId: string;
  currentRunId: string | null;
  lastActivityAt: number;
};

type LifecycleTransitionStart = {
  kind: "start";
  patch: Partial<AgentState>;
  clearRunTracking: false;
};

type LifecycleTransitionTerminal = {
  kind: "terminal";
  patch: Partial<AgentState>;
  clearRunTracking: true;
};

type LifecycleTransitionIgnore = {
  kind: "ignore";
};

export type LifecycleTransition =
  | LifecycleTransitionStart
  | LifecycleTransitionTerminal
  | LifecycleTransitionIgnore;

type ShouldPublishAssistantStreamInput = {
  mergedRaw: string;
  rawText: string;
  hasChatEvents: boolean;
  currentStreamText: string | null;
};

type DedupeRunLinesResult = {
  appended: string[];
  nextSeen: Set<string>;
};

export const mergeRuntimeStream = (current: string, incoming: string): string => {
  if (!incoming) return current;
  if (!current) return incoming;
  if (incoming.startsWith(current)) return incoming;
  if (current.startsWith(incoming)) return current;
  if (current.endsWith(incoming)) return current;
  if (incoming.endsWith(current)) return incoming;
  return `${current}${incoming}`;
};

export const dedupeRunLines = (seen: Set<string>, lines: string[]): DedupeRunLinesResult => {
  const nextSeen = new Set(seen);
  const appended: string[] = [];
  for (const line of lines) {
    if (!line || nextSeen.has(line)) continue;
    nextSeen.add(line);
    appended.push(line);
  }
  return { appended, nextSeen };
};

export const resolveLifecyclePatch = (input: LifecyclePatchInput): LifecycleTransition => {
  const { phase, incomingRunId, currentRunId, lastActivityAt } = input;
  if (phase === "start") {
    return {
      kind: "start",
      clearRunTracking: false,
      patch: {
        status: "running",
        runId: incomingRunId,
        sessionCreated: true,
        lastActivityAt,
      },
    };
  }
  if (currentRunId && currentRunId !== incomingRunId) {
    return { kind: "ignore" };
  }
  if (phase === "error") {
    return {
      kind: "terminal",
      clearRunTracking: true,
      patch: {
        status: "error",
        runId: null,
        streamText: null,
        thinkingTrace: null,
        lastActivityAt,
      },
    };
  }
  return {
    kind: "terminal",
    clearRunTracking: true,
    patch: {
      status: "idle",
      runId: null,
      streamText: null,
      thinkingTrace: null,
      lastActivityAt,
    },
  };
};

export const shouldPublishAssistantStream = ({
  mergedRaw,
  rawText,
  hasChatEvents,
  currentStreamText,
}: ShouldPublishAssistantStreamInput): boolean => {
  if (!mergedRaw.trim()) return false;
  if (!hasChatEvents) return true;
  if (rawText.trim()) return true;
  return !currentStreamText?.trim();
};
