import { mkdir, readdir, rm, writeFile } from "node:fs/promises";
import path from "node:path";

import { env } from "../../config/env";
import { AppError } from "../../errors/AppError";

const MAX_PDF_SIZE_BYTES = 5 * 1024 * 1024;
const NODE_EVIDENCE_DIR = env.NODE_EVIDENCE_DIR
  ? path.resolve(env.NODE_EVIDENCE_DIR)
  : path.resolve(process.cwd(), "runtime-storage/node-evidence");

const sanitizeFileName = (value: string): string =>
  value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-zA-Z0-9._-]+/g, "-")
    .replace(/-{2,}/g, "-")
    .replace(/^-+|-+$/g, "")
    .toLowerCase();

const buildStoredFileName = (nodeId: number, originalName: string): string => {
  const safeName = sanitizeFileName(originalName);
  const fileName = safeName.endsWith(".pdf") ? safeName : `${safeName}.pdf`;
  return `node-${nodeId}-${fileName}`;
};

const ensurePdfPayloadIsValid = ({
  fileName,
  mimeType,
  fileData,
}: {
  fileName: string | null | undefined;
  mimeType: string | null | undefined;
  fileData: Uint8Array | null | undefined;
}): void => {
  if (!fileName || !mimeType || !fileData) {
    throw new AppError(
      "Envie o PDF completo da evidencia para salvar este no.",
      422,
    );
  }

  const normalizedName = fileName.trim().toLowerCase();
  const normalizedMime = mimeType.trim().toLowerCase();

  if (!normalizedName.endsWith(".pdf") || normalizedMime !== "application/pdf") {
    throw new AppError("A evidencia deve ser enviada em formato PDF.", 422);
  }

  if (fileData.byteLength === 0) {
    throw new AppError("O PDF enviado esta vazio ou corrompido.", 422);
  }

  if (fileData.byteLength > MAX_PDF_SIZE_BYTES) {
    throw new AppError("O PDF da evidencia deve ter no maximo 5MB.", 422);
  }
};

export async function saveNodeEvidencePdf({
  nodeId,
  fileName,
  mimeType,
  fileData,
}: {
  nodeId: number;
  fileName: string;
  mimeType: string;
  fileData: Uint8Array;
}): Promise<string> {
  ensurePdfPayloadIsValid({ fileName, mimeType, fileData });

  await mkdir(NODE_EVIDENCE_DIR, { recursive: true });
  await removeNodeEvidencePdf(nodeId);

  const storedFileName = buildStoredFileName(nodeId, fileName);
  const filePath = path.join(NODE_EVIDENCE_DIR, storedFileName);

  await writeFile(filePath, Buffer.from(fileData));

  return fileName;
}

export async function removeNodeEvidencePdf(nodeId: number): Promise<void> {
  await mkdir(NODE_EVIDENCE_DIR, { recursive: true });

  const files = await readdir(NODE_EVIDENCE_DIR);
  const matchedFiles = files.filter(fileName =>
    fileName.startsWith(`node-${nodeId}-`),
  );

  await Promise.all(
    matchedFiles.map(fileName =>
      rm(path.join(NODE_EVIDENCE_DIR, fileName), { force: true }),
    ),
  );
}

export async function findNodeEvidencePdf(nodeId: number): Promise<{
  storedFileName: string;
  originalFileName: string;
  filePath: string;
} | null> {
  await mkdir(NODE_EVIDENCE_DIR, { recursive: true });

  const files = await readdir(NODE_EVIDENCE_DIR);
  const matchedFile = files.find(fileName =>
    fileName.startsWith(`node-${nodeId}-`),
  );

  if (!matchedFile) {
    return null;
  }

  return {
    storedFileName: matchedFile,
    originalFileName: matchedFile.replace(`node-${nodeId}-`, ""),
    filePath: path.join(NODE_EVIDENCE_DIR, matchedFile),
  };
}
