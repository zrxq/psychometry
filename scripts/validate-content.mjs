import { readdir, readFile } from "node:fs/promises";
import path from "node:path";

const testsDir = path.resolve("public/tests");
const catalogPath = path.join(testsDir, "catalog.json");

const catalog = JSON.parse(await readFile(catalogPath, "utf8"));

if (!catalog || !Array.isArray(catalog.tests)) {
  throw new Error("catalog.json must contain a tests array.");
}

for (const entry of catalog.tests) {
  for (const key of [
    "id",
    "slug",
    "title",
    "shortTitle",
    "summary",
    "category",
    "locale",
    "estimatedMinutes",
    "publishStatus",
  ]) {
    if (entry[key] === undefined || entry[key] === "") {
      throw new Error(`Catalog entry is missing ${key}.`);
    }
  }
}

const files = (await readdir(testsDir)).filter(
  (file) => file.endsWith(".json") && file !== "catalog.json",
);

for (const file of files) {
  const testDefinition = JSON.parse(
    await readFile(path.join(testsDir, file), "utf8"),
  );

  for (const key of [
    "schemaVersion",
    "id",
    "slug",
    "title",
    "shortTitle",
    "locale",
    "category",
    "publishStatus",
    "summary",
    "instructionsMarkdown",
    "estimatedMinutes",
    "source",
    "scoring",
    "questions",
    "references",
  ]) {
    if (testDefinition[key] === undefined) {
      throw new Error(`${file} is missing ${key}.`);
    }
  }

  if (!Array.isArray(testDefinition.questions)) {
    throw new Error(`${file} questions must be an array.`);
  }

  if (!Array.isArray(testDefinition.references)) {
    throw new Error(`${file} references must be an array.`);
  }

  if (testDefinition.publishStatus === "published" && testDefinition.questions.length === 0) {
    throw new Error(`${file} is published but has no questions.`);
  }
}

const slugsFromCatalog = new Set(catalog.tests.map((entry) => entry.slug));
for (const file of files) {
  const slug = file.replace(/\.json$/, "");
  if (!slugsFromCatalog.has(slug)) {
    throw new Error(`${file} exists but is not listed in catalog.json.`);
  }
}

console.log(`Validated ${catalog.tests.length} catalog entries and ${files.length} test definitions.`);
