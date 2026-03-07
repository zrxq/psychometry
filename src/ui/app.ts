import { buildCatalogHref, buildTestHref, parseRoute } from "../lib/router";
import {
  clampSessionState,
  createInitialSessionState,
  decodeSessionState,
  encodeSessionState,
} from "../lib/session";
import { computeResult } from "../lib/scoring";
import { renderMarkdown } from "../lib/markdown";
import type {
  Catalog,
  CatalogEntry,
  SessionState,
  TestDefinition,
} from "../types";

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
          Статичний сайт з локальним підрахунком результатів, URL-перенесенням
          прогресу та відкритим процесом рев'ю через GitHub.
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

function renderTest(definition: TestDefinition, state: SessionState): string {
  const result = computeResult(definition, state.answers);
  const currentQuestion = definition.questions[state.currentIndex];
  const progressMax = Math.max(definition.questions.length, 1);
  const crisisFlag = state.answers[8] !== null && (state.answers[8] ?? 0) > 0;
  const sourceLabel =
    definition.source.permissionStatus === "approved"
      ? "Текст дозволено до публікації"
      : "Права на публікацію ще не підтверджені";

  return `
    <main class="shell shell-narrow">
      <a class="backlink" href="${buildCatalogHref()}">До каталогу</a>
      <section class="hero hero-compact">
        <p class="eyebrow">${definition.category}</p>
        <div class="hero-headline">
          <h1>${definition.title}</h1>
          <span class="status status-${definition.publishStatus}">
            ${definition.publishStatus === "published" ? "Опубліковано" : "Чернетка"}
          </span>
        </div>
        <p class="lead">${definition.summary}</p>
        <div class="meta-list">
          <span>${definition.estimatedMinutes} хв</span>
          <span>${sourceLabel}</span>
        </div>
      </section>

      <section class="card prose">
        ${renderMarkdown(definition.instructionsMarkdown)}
        ${definition.warningMarkdown ? renderMarkdown(definition.warningMarkdown) : ""}
        ${
          definition.draftNoticeMarkdown
            ? `<div class="notice">${renderMarkdown(definition.draftNoticeMarkdown)}</div>`
            : ""
        }
      </section>

      ${
        definition.questions.length === 0
          ? `
            <section class="card">
              <h2>Інтерактивна форма ще не опублікована</h2>
              <p>
                Цей тест використовується як раннє джерело структури та метаданих.
                Питання будуть додані після підтвердження прав на публікацію.
              </p>
            </section>
          `
          : `
            <section class="card">
              <div class="progress-header">
                <h2>Питання ${state.currentIndex + 1} з ${definition.questions.length}</h2>
                <p class="muted">Відповіді зберігаються в URL фрагменті.</p>
              </div>
              <progress value="${state.currentIndex + 1}" max="${progressMax}"></progress>
              <div class="question-block">
                <p class="question-title">${currentQuestion.prompt}</p>
                <div class="option-list">
                  ${currentQuestion.options
                    .map(
                      (option) => `
                        <label class="option">
                          <input
                            type="radio"
                            name="question-${currentQuestion.id}"
                            value="${option.value}"
                            ${state.answers[state.currentIndex] === option.value ? "checked" : ""}
                          />
                          <span>${option.label}</span>
                        </label>
                      `,
                    )
                    .join("")}
                </div>
              </div>
              <div class="actions">
                <button data-action="prev" ${state.currentIndex === 0 ? "disabled" : ""}>
                  Назад
                </button>
                <button data-action="next">
                  ${
                    state.currentIndex === definition.questions.length - 1
                      ? "До результату"
                      : "Далі"
                  }
                </button>
              </div>
            </section>
          `
      }

      <section class="card">
        <div class="result-headline">
          <h2>Поточний результат</h2>
          <button class="button button-secondary" data-action="copy-link">
            Скопіювати URL для продовження
          </button>
        </div>
        <p class="score">${result.total} / ${definition.scoring.max}</p>
        <p class="muted">
          Заповнено ${result.answeredCount} з ${definition.questions.length || 0}
        </p>
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
            : `<p class="muted">Діапазон інтерпретації буде показано після появи оцінки.</p>`
        }
      </section>

      <section class="card">
        <h2>Джерела</h2>
        <ul class="reference-list">
          ${definition.references
            .map(
              (reference) => `
                <li>
                  <a href="${reference.url}" target="_blank" rel="noreferrer">
                    ${reference.title}
                  </a>
                  ${reference.note ? `<span class="muted"> ${reference.note}</span>` : ""}
                </li>
              `,
            )
            .join("")}
        </ul>
      </section>
    </main>
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

  root.querySelectorAll<HTMLInputElement>('input[type="radio"]').forEach((input) => {
    input.addEventListener("change", () => {
      const value = Number(input.value);
      state.answers[state.currentIndex] = value;
      rerender();
    });
  });

  root.querySelector<HTMLElement>('[data-action="prev"]')?.addEventListener("click", () => {
    state.currentIndex = Math.max(state.currentIndex - 1, 0);
    rerender();
  });

  root.querySelector<HTMLElement>('[data-action="next"]')?.addEventListener("click", () => {
    state.currentIndex = Math.min(
      state.currentIndex + 1,
      Math.max(definition.questions.length - 1, 0),
    );
    rerender();
  });

  root
    .querySelector<HTMLElement>('[data-action="copy-link"]')
    ?.addEventListener("click", async () => {
      const token = encodeSessionState(state);
      const href = `${window.location.origin}${window.location.pathname}${buildTestHref(
        definition.slug,
        token,
      )}`;

      try {
        await navigator.clipboard.writeText(href);
      } catch {
        window.prompt("Скопіюйте URL для продовження", href);
      }
    });
}
