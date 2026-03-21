import type { SessionPhase, SessionState } from "../types";

interface LegacySessionState {
  version: 1;
  testId: string;
  currentIndex: number;
  answers: Array<number | null>;
}

type AnySessionState = SessionState | LegacySessionState;

export function createInitialSessionState(
  testId: string,
  questionCount: number,
): SessionState {
  return {
    version: 2,
    testId,
    phase: questionCount > 0 ? "intro" : "result",
    currentIndex: 0,
    answers: Array.from({ length: questionCount }, () => null),
  };
}

export function encodeSessionState(state: SessionState): string {
  const json = JSON.stringify(state);
  const bytes = new TextEncoder().encode(json);
  let binary = "";

  bytes.forEach((byte) => {
    binary += String.fromCharCode(byte);
  });

  return btoa(binary)
    .replaceAll("+", "-")
    .replaceAll("/", "_")
    .replaceAll("=", "");
}

export function decodeSessionState(token: string): AnySessionState | null {
  try {
    const normalized = token
      .replaceAll("-", "+")
      .replaceAll("_", "/")
      .padEnd(Math.ceil(token.length / 4) * 4, "=");
    const binary = atob(normalized);
    const bytes = Uint8Array.from(binary, (char) => char.charCodeAt(0));
    const parsed = JSON.parse(new TextDecoder().decode(bytes)) as AnySessionState;

    if (
      typeof parsed.testId !== "string" ||
      !Number.isInteger(parsed.currentIndex) ||
      !Array.isArray(parsed.answers)
    ) {
      return null;
    }

    if (parsed.version === 1) {
      return parsed;
    }

    if (
      parsed.version !== 2 ||
      !isSessionPhase(parsed.phase)
    ) {
      return null;
    }

    return parsed;
  } catch {
    return null;
  }
}

export function clampSessionState(
  state: AnySessionState,
  testId: string,
  questionCount: number,
): SessionState {
  const answers = Array.from({ length: questionCount }, (_, index) => {
    const value = state.answers[index];
    return typeof value === "number" ? value : null;
  });

  const answeredCount = answers.filter((value) => value !== null).length;
  const currentIndex = Math.min(
    Math.max(state.currentIndex, 0),
    Math.max(questionCount - 1, 0),
  );

  return {
    version: 2,
    testId,
    phase: resolvePhase(state, answeredCount, questionCount),
    answers,
    currentIndex,
  };
}

function resolvePhase(
  state: AnySessionState,
  answeredCount: number,
  questionCount: number,
): SessionPhase {
  if (questionCount === 0) {
    return "result";
  }

  if (state.version === 1) {
    if (answeredCount === questionCount) {
      return "result";
    }

    return answeredCount === 0 && state.currentIndex === 0
      ? "intro"
      : "questionnaire";
  }

  if (state.phase === "result") {
    return answeredCount === questionCount ? "result" : "questionnaire";
  }

  if (state.phase === "intro" && answeredCount > 0) {
    return "questionnaire";
  }

  return state.phase;
}

function isSessionPhase(value: unknown): value is SessionPhase {
  return (
    value === "intro" ||
    value === "questionnaire" ||
    value === "result"
  );
}
