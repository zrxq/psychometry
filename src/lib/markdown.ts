export function renderMarkdown(input: string): string {
  const escaped = escapeHtml(input);
  const withStrong = escaped.replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>");
  const withEmphasis = withStrong.replace(/\*(.+?)\*/g, "<em>$1</em>");

  return withEmphasis
    .split(/\n{2,}/)
    .map((paragraph) => {
      const lines = paragraph
        .split("\n")
        .map((line) => line.trim())
        .filter(Boolean);

      if (lines.every((line) => line.startsWith("- "))) {
        const items = lines
          .map((line) => `<li>${line.slice(2)}</li>`)
          .join("");
        return `<ul>${items}</ul>`;
      }

      const text = lines.join("<br />");
      return `<p>${text}</p>`;
    })
    .join("");
}

function escapeHtml(value: string): string {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}
