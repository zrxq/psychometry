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
      version: 2 as const,
      testId: "beck-bdi-i-uk",
      phase: "questionnaire" as const,
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

  it("migrates a legacy incomplete session into questionnaire phase", () => {
    const legacyToken = btoa(
      JSON.stringify({
        version: 1,
        testId: "beck-bdi-i-uk",
        currentIndex: 2,
        answers: [0, 1, null],
      }),
    );

    const decoded = decodeSessionState(legacyToken);
    const clamped = clampSessionState(decoded!, "beck-bdi-i-uk", 3);

    expect(clamped.version).toBe(2);
    expect(clamped.phase).toBe("questionnaire");
  });

  it("migrates a complete legacy session into result phase", () => {
    const legacyToken = btoa(
      JSON.stringify({
        version: 1,
        testId: "beck-bdi-i-uk",
        currentIndex: 2,
        answers: [0, 1, 2],
      }),
    );

    const decoded = decodeSessionState(legacyToken);
    const clamped = clampSessionState(decoded!, "beck-bdi-i-uk", 3);

    expect(clamped.phase).toBe("result");
  });

  it("keeps a complete live questionnaire in questionnaire phase until explicitly finished", () => {
    const clamped = clampSessionState(
      {
        version: 2,
        testId: "beck-bdi-i-uk",
        phase: "questionnaire",
        currentIndex: 2,
        answers: [0, 1, 2],
      },
      "beck-bdi-i-uk",
      3,
    );

    expect(clamped.phase).toBe("questionnaire");
  });
});
