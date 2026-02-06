// pdf-parse v2 uses a class-based API; mammoth uses named exports
import { PDFParse } from 'pdf-parse';
import * as mammoth from 'mammoth';

export type SupportedMimeType =
  | 'application/pdf'
  | 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
  | 'text/plain';

const MIME_EXTENSIONS: Record<string, SupportedMimeType> = {
  '.pdf': 'application/pdf',
  '.docx': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  '.txt': 'text/plain',
};

const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB

export function getMimeType(fileName: string): SupportedMimeType | null {
  const ext = fileName.toLowerCase().slice(fileName.lastIndexOf('.'));
  return MIME_EXTENSIONS[ext] ?? null;
}

export function isSupportedFile(fileName: string): boolean {
  return getMimeType(fileName) !== null;
}

export function validateFile(fileName: string, fileSize: number): string | null {
  if (!isSupportedFile(fileName)) {
    return 'Unsupported file type. Please upload a PDF, DOCX, or TXT file.';
  }
  if (fileSize > MAX_FILE_SIZE) {
    return 'File size exceeds 10MB limit.';
  }
  return null;
}

/**
 * Extracts plain text from a file buffer based on its MIME type.
 * Returns cleaned, normalized text suitable for LLM consumption.
 */
export async function parseDocument(
  buffer: Buffer,
  mimeType: SupportedMimeType
): Promise<string> {
  switch (mimeType) {
    case 'application/pdf':
      return parsePdf(buffer);
    case 'application/vnd.openxmlformats-officedocument.wordprocessingml.document':
      return parseDocx(buffer);
    case 'text/plain':
      return parseText(buffer);
    default:
      throw new Error(`Unsupported MIME type: ${mimeType}`);
  }
}

async function parsePdf(buffer: Buffer): Promise<string> {
  const pdf = new PDFParse({ data: new Uint8Array(buffer) });
  const result = await pdf.getText();
  return cleanText(result.text);
}

async function parseDocx(buffer: Buffer): Promise<string> {
  const result = await mammoth.extractRawText({ buffer });
  return cleanText(result.value);
}

function parseText(buffer: Buffer): string {
  return cleanText(buffer.toString('utf-8'));
}

/**
 * Cleans and normalizes extracted text:
 * - Collapses excessive whitespace
 * - Removes null bytes and control characters
 * - Trims leading/trailing whitespace
 */
function cleanText(text: string): string {
  return text
    .replace(/\0/g, '')                    // Remove null bytes
    .replace(/[\x00-\x08\x0B\x0C\x0E-\x1F]/g, '') // Remove control chars (keep \n, \r, \t)
    .replace(/\r\n/g, '\n')               // Normalize line endings
    .replace(/[ \t]+/g, ' ')              // Collapse horizontal whitespace
    .replace(/\n{3,}/g, '\n\n')           // Collapse excessive newlines
    .trim();
}
