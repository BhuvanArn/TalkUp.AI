import { describe, expect, it } from 'vitest';

import { htmlToText, textToHtml } from './htmlText';

describe('textToHtml', () => {
  it('returns empty string for empty input', () => {
    expect(textToHtml('')).toBe('');
  });

  it('wraps a single line in a paragraph', () => {
    expect(textToHtml('hello')).toBe('<p>hello</p>');
  });

  it('wraps each newline-separated line in its own paragraph', () => {
    expect(textToHtml('a\nb')).toBe('<p>a</p><p>b</p>');
  });

  it('escapes HTML special characters', () => {
    expect(textToHtml('a<b>&c')).toBe('<p>a&lt;b&gt;&amp;c</p>');
  });

  it('represents a blank line as an empty paragraph', () => {
    expect(textToHtml('a\n\nb')).toBe('<p>a</p><p></p><p>b</p>');
  });
});

describe('htmlToText', () => {
  it('returns empty string for empty input', () => {
    expect(htmlToText('')).toBe('');
  });

  it('unwraps paragraphs back to newline-separated text', () => {
    expect(htmlToText('<p>a</p><p>b</p>')).toBe('a\nb');
  });

  it('unescapes HTML entities', () => {
    expect(htmlToText('<p>a&lt;b&gt;&amp;c</p>')).toBe('a<b>&c');
  });
});

describe('round-trip', () => {
  it.each(['', 'hello', 'a\nb', 'a<b>&c', 'a\n\nb', 'line one\nline two'])(
    'htmlToText(textToHtml(%j)) === input',
    (input) => {
      expect(htmlToText(textToHtml(input))).toBe(input);
    },
  );
});
