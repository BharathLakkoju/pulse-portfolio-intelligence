import { mkdir, writeFile, readFile } from "node:fs/promises";
import path from "node:path";
import { randomToken } from "./crypto";

/**
 * Local-disk object storage stand-in for the S3/MinIO bucket in CLAUDE.md's
 * suggested stack — avoids requiring Docker/MinIO to run the app locally.
 * Swapping in real S3-compatible storage means implementing this same
 * two-function interface against the AWS SDK. See QUESTIONS.md #1.
 */
const STORAGE_ROOT = path.join(process.cwd(), ".uploads");

export async function saveObject(subdir: string, filename: string, data: Buffer): Promise<string> {
  const dir = path.join(STORAGE_ROOT, subdir);
  await mkdir(dir, { recursive: true });
  const safeName = `${randomToken(8)}_${filename.replace(/[^a-zA-Z0-9._-]/g, "_")}`;
  const fullPath = path.join(dir, safeName);
  await writeFile(fullPath, data);
  return path.join(subdir, safeName);
}

export async function readObject(storageRef: string): Promise<Buffer> {
  return readFile(path.join(STORAGE_ROOT, storageRef));
}
