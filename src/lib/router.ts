export type Route =
  | { kind: "catalog" }
  | { kind: "test"; slug: string; stateToken: string | null };

export function parseRoute(hash: string): Route {
  const normalized = hash.replace(/^#/, "") || "/";
  const [pathPart, queryPart] = normalized.split("?");
  const path = pathPart.startsWith("/") ? pathPart : `/${pathPart}`;

  if (path === "/") {
    return { kind: "catalog" };
  }

  const testMatch = path.match(/^\/tests\/([^/]+)$/);
  if (!testMatch) {
    return { kind: "catalog" };
  }

  const params = new URLSearchParams(queryPart ?? "");
  return {
    kind: "test",
    slug: decodeURIComponent(testMatch[1]),
    stateToken: params.get("s"),
  };
}

export function buildCatalogHref(): string {
  return "#/";
}

export function buildTestHref(slug: string, stateToken?: string | null): string {
  const params = new URLSearchParams();
  if (stateToken) {
    params.set("s", stateToken);
  }

  const suffix = params.size > 0 ? `?${params.toString()}` : "";
  return `#/tests/${encodeURIComponent(slug)}${suffix}`;
}
