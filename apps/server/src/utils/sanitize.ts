const HTML_ESCAPE_MAP: Record<string, string> = {
  '&': '&amp;',
  '<': '&lt;',
  '>': '&gt;',
  '"': '&quot;',
  "'": '&#x27;',
};

const HTML_ESCAPE_RE = /[&<>"']/g;

export function escapeHtml(str: string): string {
  return str.replace(HTML_ESCAPE_RE, (ch) => HTML_ESCAPE_MAP[ch]);
}

/**
 * Sanitize a NostrEvent-like object by escaping HTML in content.
 * Returns a new object (does not mutate the original).
 */
export function sanitizeEvent<T extends { content?: string }>(event: T): T {
  if (!event.content) return event;
  return { ...event, content: escapeHtml(event.content) };
}
