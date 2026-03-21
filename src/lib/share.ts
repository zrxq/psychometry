export type ShareOutcome = "shared" | "copied" | "manual" | "failed";

export interface ShareResult {
  outcome: ShareOutcome;
  message: string;
  text: string;
}

export async function shareTestLink(
  testName: string,
  url: string,
): Promise<ShareResult> {
  const shareText = `Результат тесту ${testName}: ${url}`;
  const shareData = {
    text: shareText,
  };

  if (
    window.isSecureContext &&
    typeof navigator.share === "function" &&
    canShare(shareData)
  ) {
    try {
      await navigator.share(shareData);
      return {
        outcome: "shared",
        message: "Текст для надсилання готовий.",
        text: shareText,
      };
    } catch (error) {
      if (isAbortError(error)) {
        return {
          outcome: "failed",
          message: "",
          text: shareText,
        };
      }
    }
  }

  if (window.isSecureContext && navigator.clipboard?.writeText) {
    try {
      await navigator.clipboard.writeText(shareText);
      return {
        outcome: "copied",
        message: "Текст для надсилання скопійовано.",
        text: shareText,
      };
    } catch {
      // Fall through to manual copy.
    }
  }

  return {
    outcome: "manual",
    message: "Скопіюйте текст вручну.",
    text: shareText,
  };
}

function canShare(data: ShareData): boolean {
  if (typeof navigator.canShare !== "function") {
    return true;
  }

  try {
    return navigator.canShare(data);
  } catch {
    return false;
  }
}

function isAbortError(error: unknown): boolean {
  return error instanceof DOMException && error.name === "AbortError";
}
