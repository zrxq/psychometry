import { describe, expect, it } from "vitest";
import {
  clampSessionState,
  createInitialSessionState,
  decodeSessionState,
  encodeSessionState,
} from "./session";

describe("session state encoding", () => {
  it("round-trips a valid state token", () => {
    const state = {
      version: 1 as const,
      testId: "beck-bdi-i-uk",
      currentIndex: 4,
      answers: [0, 1, 2, null, 3],
    };

    expect(decodeSessionState(encodeSessionState(state))).toEqual(state);
  });

  it("returns null for invalid tokens", () => {
    expect(decodeSessionState("not-a-token")).toBeNull();
  });

  it("clamps state to question count", () => {
    const initial = createInitialSessionState("t", 2);
    const clamped = clampSessionState(
      { ...initial, currentIndex: 99, answers: [1, 2, 3] },
      "t",
      2,
    );

    expect(clamped.currentIndex).toBe(1);
    expect(clamped.answers).toEqual([1, 2]);
  });
});
