export type PublishStatus = "draft" | "published";

export interface CatalogEntry {
  id: string;
  slug: string;
  title: string;
  shortTitle: string;
  summary: string;
  category: string;
  locale: string;
  estimatedMinutes: number;
  publishStatus: PublishStatus;
}

export interface Catalog {
  tests: CatalogEntry[];
}

export interface TestOption {
  value: number;
  label: string;
}

export interface TestQuestion {
  id: string;
  prompt: string;
  options: TestOption[];
}

export interface ScoreBand {
  min: number;
  max: number;
  label: string;
  descriptionMarkdown: string;
}

export interface TestReference {
  title: string;
  url: string;
  note?: string;
}

export interface TestDefinition {
  schemaVersion: "1";
  id: string;
  slug: string;
  title: string;
  shortTitle: string;
  locale: string;
  category: string;
  publishStatus: PublishStatus;
  summary: string;
  instructionsMarkdown: string;
  warningMarkdown?: string;
  draftNoticeMarkdown?: string;
  estimatedMinutes: number;
  source: {
    kind: "reference" | "approved-publication";
    name: string;
    permissionStatus: "pending" | "approved";
  };
  scoring: {
    type: "sum";
    min: number;
    max: number;
    bands: ScoreBand[];
  };
  questions: TestQuestion[];
  references: TestReference[];
}

export interface SessionState {
  version: 1;
  testId: string;
  currentIndex: number;
  answers: Array<number | null>;
}

export interface ComputedResult {
  total: number;
  answeredCount: number;
  band: ScoreBand | null;
  isComplete: boolean;
}
