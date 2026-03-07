import type { SessionState } from "../types";

export function createInitialSessionState(
  testId: string,
  questionCount: number,
): SessionState {
  return {
    version: 1,
    testId,
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

export function decodeSessionState(token: string): SessionState | null {
  try {
    const normalized = token
      .replaceAll("-", "+")
      .replaceAll("_", "/")
      .padEnd(Math.ceil(token.length / 4) * 4, "=");
    const binary = atob(normalized);
    const bytes = Uint8Array.from(binary, (char) => char.charCodeAt(0));
    const parsed = JSON.parse(new TextDecoder().decode(bytes)) as SessionState;

    if (
      parsed.version !== 1 ||
      typeof parsed.testId !== "string" ||
      !Number.isInteger(parsed.currentIndex) ||
      !Array.isArray(parsed.answers)
    ) {
      return null;
    }

    return parsed;
  } catch {
    return null;
  }
}

export function clampSessionState(
  state: SessionState,
  testId: string,
  questionCount: number,
): SessionState {
  const answers = Array.from({ length: questionCount }, (_, index) => {
    const value = state.answers[index];
    return typeof value === "number" ? value : null;
  });

  return {
    version: 1,
    testId,
    answers,
    currentIndex: Math.min(
      Math.max(state.currentIndex, 0),
      Math.max(questionCount - 1, 0),
    ),
  };
}
