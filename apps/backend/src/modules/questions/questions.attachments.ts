import { mkdir, rm, stat, writeFile } from "node:fs/promises";
import path from "node:path";

import { env } from "../../config/env";
import { AppError } from "../../errors/AppError";

const ALLOWED_ATTACHMENT_MIME_TYPES = new Set([
  "application/pdf",
  "image/jpeg",
  "image/png",
]);

const MAX_ATTACHMENT_SIZE_BYTES = 5 * 1024 * 1024;

const normalizeFileName = (fileName: string): string =>
  fileName
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-zA-Z0-9.-]+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "")
    .toLowerCase();

const getQuestionAttachmentDir = (): string =>
  env.QUESTION_ATTACHMENT_DIR ??
  path.resolve(process.cwd(), "runtime-storage", "question-attachments");

export interface QuestionAttachmentInput {
  questionId: number;
  fileName: string;
  mimeType: string;
  fileData: Uint8Array;
}

export interface SavedQuestionAttachment {
  storageKey: string;
  sizeBytes: number;
  filePath: string;
}

export const validateQuestionAttachment = ({
  fileName,
  mimeType,
  fileData,
}: Omit<QuestionAttachmentInput, "questionId">): void => {
  if (!fileName.trim()) {
    throw new AppError("O anexo precisa ter um nome de arquivo valido.", 400);
  }

  if (!ALLOWED_ATTACHMENT_MIME_TYPES.has(mimeType)) {
    throw new AppError(
      "Formato de anexo invalido. Envie apenas PDF, PNG ou JPG.",
      400,
    );
  }

  if (fileData.byteLength > MAX_ATTACHMENT_SIZE_BYTES) {
    throw new AppError("O anexo deve ter no maximo 5MB.", 400);
  }
};

export const saveQuestionAttachment = async ({
  questionId,
  fileName,
  mimeType,
  fileData,
}: QuestionAttachmentInput): Promise<SavedQuestionAttachment> => {
  validateQuestionAttachment({ fileName, mimeType, fileData });

  const extension = path.extname(fileName).toLowerCase() || ".bin";
  const safeBaseName = normalizeFileName(path.basename(fileName, extension));
  const storageKey = `question-${questionId}-${safeBaseName || "anexo"}${extension}`;
  const attachmentDir = getQuestionAttachmentDir();
  const filePath = path.join(attachmentDir, storageKey);

  await mkdir(attachmentDir, { recursive: true });
  await writeFile(filePath, Buffer.from(fileData));

  return {
    storageKey,
    sizeBytes: fileData.byteLength,
    filePath,
  };
};

export const resolveQuestionAttachmentPath = async (
  storageKey: string,
): Promise<string | null> => {
  const filePath = path.join(getQuestionAttachmentDir(), storageKey);

  try {
    const fileStats = await stat(filePath);
    return fileStats.isFile() ? filePath : null;
  } catch {
    return null;
  }
};

export const removeQuestionAttachment = async (
  storageKey?: string | null,
): Promise<void> => {
  if (!storageKey) {
    return;
  }

  const filePath = path.join(getQuestionAttachmentDir(), storageKey);
  await rm(filePath, { force: true });
};
