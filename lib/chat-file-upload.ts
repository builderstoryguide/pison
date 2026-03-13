import { writeFile, mkdir } from 'fs/promises';
import path from 'path';
import { uid } from './helpers';

const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB
const ALLOWED_MIME_TYPES = [
  'image/jpeg',
  'image/png',
  'image/gif',
  'image/webp',
  'image/svg+xml',
  'application/pdf',
  'application/msword', // .doc
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document', // .docx
  'application/vnd.ms-excel', // .xls
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', // .xlsx
  'text/plain',
];
const ALLOWED_EXTENSIONS = [
  '.jpg',
  '.jpeg',
  '.png',
  '.gif',
  '.webp',
  '.svg',
  '.pdf',
  '.doc',
  '.docx',
  '.xls',
  '.xlsx',
  '.txt',
];

function sanitizeFilename(original: string): string {
  return original.replace(/[^a-zA-Z0-9._-]/g, '_').slice(0, 100);
}

function getFileExtension(filename: string): string {
  const ext = path.extname(filename).toLowerCase();
  return ext || '';
}

export function validateChatFile(file: File): { valid: boolean; error?: string } {
  if (file.size > MAX_FILE_SIZE) {
    return { valid: false, error: 'File exceeds 10MB' };
  }

  const ext = getFileExtension(file.name);
  const mimeOk = ALLOWED_MIME_TYPES.includes(file.type);
  const extOk = ALLOWED_EXTENSIONS.includes(ext);

  if (!mimeOk && !extOk) {
    return { valid: false, error: 'File type not allowed' };
  }

  return { valid: true };
}

export async function saveChatFileToLocal(
  file: File,
  conversationId: string
): Promise<{ path: string; filename: string; mimeType: string }> {
  const validation = validateChatFile(file);
  if (!validation.valid) {
    throw new Error(validation.error);
  }

  const sanitized = sanitizeFilename(file.name);
  const storedFilename = `${uid()}_${sanitized}`;
  const baseDir = path.join(process.cwd(), 'uploads', 'chat-attachments', conversationId);
  const filePath = path.join(baseDir, storedFilename);

  await mkdir(baseDir, { recursive: true });

  const buffer = Buffer.from(await file.arrayBuffer());
  await writeFile(filePath, buffer);

  return {
    path: `${conversationId}/${storedFilename}`,
    filename: file.name,
    mimeType: file.type || 'application/octet-stream',
  };
}
