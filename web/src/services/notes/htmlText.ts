/**
 * Convert plain textarea text to the HTML string the backend stores.
 * Escapes HTML special chars and wraps each newline-separated line in a <p>.
 * Empty input maps to an empty string.
 */
export const textToHtml = (text: string): string => {
  if (text === '') return '';
  const escape = (s: string): string =>
    s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
  return text
    .split('\n')
    .map((line) => `<p>${escape(line)}</p>`)
    .join('');
};

/**
 * Convert the HTML produced by textToHtml back to plain text.
 * Designed for round-tripping our own output — lossy on foreign rich HTML.
 */
export const htmlToText = (html: string): string => {
  if (html === '') return '';
  const unescape = (s: string): string =>
    s
      .replace(/&lt;/g, '<')
      .replace(/&gt;/g, '>')
      .replace(/&amp;/g, '&');
  // Split paragraphs into lines, then strip any remaining tags.
  const lines = html
    .replace(/<\/p>\s*<p>/g, '\n')
    .replace(/<\/?p>/g, '')
    .split('\n')
    .map((line) => unescape(line.replace(/<[^>]*>/g, '')));
  return lines.join('\n');
};
