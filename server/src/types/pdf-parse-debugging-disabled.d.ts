/**
 * Type shim for `pdf-parse-debugging-disabled` — a drop-in fork of `pdf-parse`
 * that ships no declaration file. Mirrors the subset we use (text extraction).
 * Without this, the default import trips `noImplicitAny` (TS7016).
 */
declare module "pdf-parse-debugging-disabled" {
  interface PdfParseResult {
    text: string;
    numpages: number;
    numrender: number;
    info: unknown;
    metadata: unknown;
    version: string;
  }

  function pdfParse(
    dataBuffer: Buffer | Uint8Array,
    options?: Record<string, unknown>,
  ): Promise<PdfParseResult>;

  export default pdfParse;
}
