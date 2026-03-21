import { renderMarkdown } from "../lib/markdown";
import { buildCatalogHref, buildTestHref, parseRoute } from "../lib/router";
import {
  clampSessionState,
  createInitialSessionState,
  decodeSessionState,
  encodeSessionState,
} from "../lib/session";
import { shareTestLink } from "../lib/share";
import { computeResult } from "../lib/scoring";
import type {
  Catalog,
  CatalogEntry,
  SessionState,
  TestDefinition,
} from "../types";

interface ShareUiState {
  message: string;
  manualText: string | null;
}

export function createApp(root: HTMLElement): void {
  window.addEventListener("hashchange", renderCurrentRoute);
  void renderCurrentRoute();

  async function renderCurrentRoute(): Promise<void> {
    const route = parseRoute(window.location.hash);

    if (route.kind === "catalog") {
      const catalog = await fetchJson<Catalog>("./tests/catalog.json");
      root.innerHTML = renderCatalog(catalog.tests);
      return;
    }

    const definition = await fetchJson<TestDefinition>(
      `./tests/${route.slug}.json`,
    ).catch(() => null);

    if (!definition) {
      root.innerHTML = renderMissingTest(route.slug);
      return;
    }

    const initialState = resolveSessionState(definition, route.stateToken);
    root.innerHTML = renderTest(definition, initialState);
    wireTestInteractions(root, definition, initialState);
  }
}

async function fetchJson<T>(path: string): Promise<T> {
  const response = await fetch(path);
  if (!response.ok) {
    throw new Error(`Failed to fetch ${path}`);
  }

  return (await response.json()) as T;
}

function resolveSessionState(
  definition: TestDefinition,
  stateToken: string | null,
): SessionState {
  const decoded = stateToken ? decodeSessionState(stateToken) : null;

  if (!decoded || decoded.testId !== definition.id) {
    return createInitialSessionState(definition.id, definition.questions.length);
  }

  return clampSessionState(decoded, definition.id, definition.questions.length);
}

function renderCatalog(tests: CatalogEntry[]): string {
  const cards = tests
    .map(
      (test) => `
        <article class="card">
          <div class="card-meta">
            <span class="badge">${test.category}</span>
            <span class="muted">${test.estimatedMinutes} хв</span>
          </div>
          <h2>${test.title}</h2>
          <p>${test.summary}</p>
          <div class="card-footer">
            <span class="status status-${test.publishStatus}">
              ${test.publishStatus === "published" ? "Опубліковано" : "Чернетка"}
            </span>
            <a class="button" href="${buildTestHref(test.slug)}">Відкрити</a>
          </div>
        </article>
      `,
    )
    .join("");

  return `
    <main class="shell">
      <section class="hero">
        <p class="eyebrow">Psychometry UA</p>
        <h1>Відкритий каталог психометричних тестів українською</h1>
        <p class="lead">
          Прості онлайн-опитувальники українською мовою з локальним підрахунком
          результату і можливістю поділитися ним із фахівцем.
        </p>
      </section>
      <section class="grid">
        ${cards}
      </section>
    </main>
  `;
}

function renderMissingTest(slug: string): string {
  return `
    <main class="shell">
      <a class="backlink" href="${buildCatalogHref()}">До каталогу</a>
      <section class="card">
        <h1>Тест не знайдено</h1>
        <p>Не вдалося завантажити визначення для <code>${slug}</code>.</p>
      </section>
    </main>
  `;
}

function renderTest(
  definition: TestDefinition,
  state: SessionState,
  shareUi: ShareUiState = { message: "", manualText: null },
): string {
  const isIntro = state.phase === "intro";

  return `
    <main class="shell shell-narrow">
      <div class="test-toolbar">
        <a class="backlink" href="${buildCatalogHref()}">До каталогу</a>
      </div>
      <section class="hero hero-compact ${isIntro ? "" : "hero-minimal"}">
        <p class="eyebrow">${definition.category}</p>
        <h1 class="test-title ${isIntro ? "" : "test-title-compact"}">${definition.title}</h1>
        ${isIntro ? `<p class="lead">${definition.summary}</p>` : ""}
        <div class="meta-list">
          <span>${definition.estimatedMinutes} хв</span>
        </div>
      </section>
      ${renderPhase(definition, state, shareUi)}
    </main>
  `;
}

function renderPhase(
  definition: TestDefinition,
  state: SessionState,
  shareUi: ShareUiState,
): string {
  if (definition.questions.length === 0) {
    return `
      <section class="card prose">
        ${renderMarkdown(definition.instructionsMarkdown)}
        ${definition.warningMarkdown ? renderMarkdown(definition.warningMarkdown) : ""}
        ${
          definition.draftNoticeMarkdown
            ? `<div class="notice">${renderMarkdown(definition.draftNoticeMarkdown)}</div>`
            : ""
        }
      </section>
      <section class="card">
        <h2>Інтерактивна форма ще не опублікована</h2>
        <p>
          Цей тест використовується як раннє джерело структури та метаданих.
          Питання будуть додані після підтвердження прав на публікацію.
        </p>
      </section>
      ${renderReferencesCard(definition)}
    `;
  }

  if (state.phase === "intro") {
    return renderIntroPhase(definition);
  }

  if (state.phase === "result") {
    return renderResultPhase(definition, state, shareUi);
  }

  return renderQuestionPhase(definition, state);
}

function renderIntroPhase(definition: TestDefinition): string {
  return `
    <section class="card intro-card prose">
      <h2>Перед початком</h2>
      <p>Оберіть одне твердження в кожному блоці, яке найточніше описує ваш стан.</p>
      <p>Відповідайте, орієнтуючись на те, як ви почувалися останнім часом.</p>
      ${
        definition.warningMarkdown
          ? `<div class="notice">${renderMarkdown(definition.warningMarkdown)}</div>`
          : ""
      }
      ${
        definition.draftNoticeMarkdown
          ? `<div class="notice">${renderMarkdown(definition.draftNoticeMarkdown)}</div>`
          : ""
      }
      <div class="actions actions-single">
        <button data-action="start">Почати тест</button>
      </div>
    </section>
    ${renderReferencesCard(definition, true)}
  `;
}

function renderQuestionPhase(
  definition: TestDefinition,
  state: SessionState,
): string {
  const currentQuestion = definition.questions[state.currentIndex];
  const selectedValue = state.answers[state.currentIndex];
  const progressMax = Math.max(definition.questions.length, 1);

  return `
    <section class="card question-card">
      <div class="progress-header">
        <h2>Питання ${state.currentIndex + 1} з ${definition.questions.length}</h2>
        <p class="muted">
          ${state.currentIndex === 0 ? "Оберіть один варіант відповіді." : "Можна повернутися до попередніх відповідей."}
        </p>
      </div>
      <progress value="${state.currentIndex + 1}" max="${progressMax}"></progress>
      <div class="subtle-nav">
        <button class="text-button" data-action="prev">
          ${state.currentIndex === 0 ? "Назад" : "Попереднє питання"}
        </button>
      </div>
      <div class="question-block">
        <form>
          <fieldset class="question-fieldset">
            <legend class="question-title">${currentQuestion.prompt}</legend>
            <div class="option-list">
              ${currentQuestion.options
                .map(
                  (option) => `
                    <label class="option">
                      <input
                        type="radio"
                        name="question-${currentQuestion.id}"
                        value="${option.value}"
                        ${selectedValue === option.value ? "checked" : ""}
                      />
                      <span>${option.label}</span>
                    </label>
                  `,
                )
                .join("")}
            </div>
          </fieldset>
        </form>
      </div>
      <div class="actions actions-single">
        <button
          data-action="next"
          ${selectedValue === null ? "disabled" : ""}
        >
          ${
            state.currentIndex === definition.questions.length - 1
              ? "Завершити"
              : "Далі"
          }
        </button>
      </div>
    </section>
  `;
}

function renderResultPhase(
  definition: TestDefinition,
  state: SessionState,
  shareUi: ShareUiState,
): string {
  const result = computeResult(definition, state.answers);
  const crisisFlag = state.answers[8] !== null && (state.answers[8] ?? 0) > 0;

  return `
    <section class="card">
      <div class="result-headline">
        <div>
          <h2>Результат тесту</h2>
          <p class="muted result-subtitle">
            Заповнено ${result.answeredCount} з ${definition.questions.length}
          </p>
        </div>
      </div>
      <div class="share-feedback" aria-live="polite" data-share-feedback>
        ${shareUi.message}
      </div>
      ${
        shareUi.manualText
          ? `
            <div class="manual-share card-inset" data-share-manual>
              <label for="share-text">Скопіюйте цей текст</label>
              <input
                id="share-text"
                class="manual-share-input"
                type="text"
                readonly
                value="${escapeAttribute(shareUi.manualText)}"
              />
            </div>
          `
          : ""
      }
      <p class="score">${result.total} / ${definition.scoring.max}</p>
      ${
        crisisFlag
          ? `
            <div class="notice notice-urgent">
              <p><strong>Важливо:</strong> ви відзначили наявність думок про самогубство.</p>
              <p>
                Не лишайтеся з цим наодинці. Зверніться до близької людини, лікаря,
                психолога або до локальної служби невідкладної допомоги негайно.
              </p>
            </div>
          `
          : ""
      }
      ${
        result.band
          ? `<div class="prose">${renderMarkdown(result.band.descriptionMarkdown)}</div>`
          : `<p class="muted">Інтерпретація з'явиться після повного завершення тесту.</p>`
      }
      <div class="actions result-actions">
        <button class="button share-button" data-action="share">
          ${renderShareIcon()}
          <span>Надіслати фахівцю</span>
        </button>
      </div>
    </section>
    ${renderReferencesCard(definition, true)}
  `;
}

function renderReferencesCard(
  definition: TestDefinition,
  collapsed = false,
): string {
  return `
    <section class="card">
      <details class="details-panel" ${collapsed ? "" : "open"}>
        <summary>Джерела та деталі</summary>
        <ul class="reference-list">
          ${definition.references
            .map(
              (reference) => `
                <li>
                  <a href="${reference.url}" target="_blank" rel="noreferrer">
                    ${reference.title}
                  </a>
                  ${reference.note ? `<span class="muted">${reference.note}</span>` : ""}
                </li>
              `,
            )
            .join("")}
        </ul>
      </details>
    </section>
  `;
}

function wireTestInteractions(
  root: HTMLElement,
  definition: TestDefinition,
  initialState: SessionState,
): void {
  let state = { ...initialState, answers: [...initialState.answers] };

  const rerender = (): void => {
    const token = encodeSessionState(state);
    window.location.hash = buildTestHref(definition.slug, token).slice(1);
  };

  root.querySelector<HTMLElement>('[data-action="start"]')?.addEventListener("click", () => {
    state.phase = "questionnaire";
    rerender();
  });

  root.querySelectorAll<HTMLInputElement>('input[type="radio"]').forEach((input) => {
    input.addEventListener("change", () => {
      const value = Number(input.value);
      state.answers[state.currentIndex] = value;
      state.phase = "questionnaire";
      rerender();
    });
  });

  root.querySelector<HTMLElement>('[data-action="prev"]')?.addEventListener("click", () => {
    if (state.currentIndex === 0) {
      state.phase = "intro";
    } else {
      state.currentIndex = Math.max(state.currentIndex - 1, 0);
      state.phase = "questionnaire";
    }
    rerender();
  });

  root.querySelector<HTMLElement>('[data-action="next"]')?.addEventListener("click", () => {
    if (state.answers[state.currentIndex] === null) {
      return;
    }

    if (state.currentIndex === definition.questions.length - 1) {
      state.phase = "result";
      rerender();
      return;
    }

    state.currentIndex = Math.min(
      state.currentIndex + 1,
      Math.max(definition.questions.length - 1, 0),
    );
    state.phase = "questionnaire";
    rerender();
  });

  root.querySelector<HTMLElement>('[data-action="share"]')?.addEventListener("click", async () => {
    const href = buildAbsoluteTestHref(definition.slug, state);
    const shareResult = await shareTestLink(definition.title, href);

    if (shareResult.outcome === "failed") {
      return;
    }

    root.innerHTML = renderTest(definition, state, {
      message: shareResult.message,
      manualText: shareResult.outcome === "manual" ? shareResult.text : null,
    });
    wireTestInteractions(root, definition, state);

    const manualInput = root.querySelector<HTMLInputElement>("#share-text");
    manualInput?.focus();
    manualInput?.select();
  });
}

function buildAbsoluteTestHref(slug: string, state: SessionState): string {
  const token = encodeSessionState(state);
  return `${window.location.origin}${window.location.pathname}${buildTestHref(slug, token)}`;
}

function renderShareIcon(): string {
  return `
    <svg
      class="share-icon"
      viewBox="0 0 24 24"
      width="20"
      height="20"
      aria-hidden="true"
      focusable="false"
    >
      <path
        d="M15 5l4 4m0 0-4 4m4-4H9a4 4 0 0 0-4 4v4"
        fill="none"
        stroke="currentColor"
        stroke-linecap="round"
        stroke-linejoin="round"
        stroke-width="2"
      />
    </svg>
  `;
}

function escapeAttribute(value: string): string {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll('"', "&quot;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;");
}
