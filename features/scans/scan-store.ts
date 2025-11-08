import * as FileSystem from "expo-file-system/legacy";

import { storage } from "@/features/storage/async-storage";
import type { FaceAnalysisResult } from "@/features/scans/face-analysis-api";

const STORAGE_KEY = "facefit:scans";
const SCAN_DIRECTORY = `${FileSystem.documentDirectory ?? ""}facefit/scans`;

export type ScanSource = "camera" | "gallery";

export type StoredFaceAnalysis = FaceAnalysisResult | string;

export type ScanRecord = {
  id: string;
  imageUri: string;
  capturedAt: string;
  faceAnalysis: StoredFaceAnalysis;
  expiresAt: string;
  source: ScanSource;
};

export type ScanInput = {
  tempImageUri: string;
  faceAnalysis: StoredFaceAnalysis;
  retentionDays: number;
  source: ScanSource;
};

export type ExpiryBadge = {
  label: string;
  daysRemaining: number;
  expired: boolean;
};

export async function saveScan(input: ScanInput) {
  await ensureDirectory();

  const id = generateId();
  const extension = input.tempImageUri.split(".").pop() ?? "jpg";
  const destination = `${SCAN_DIRECTORY}/${id}.${extension}`;

  await FileSystem.copyAsync({
    from: input.tempImageUri,
    to: destination,
  });

  const record: ScanRecord = {
    id,
    imageUri: destination,
    capturedAt: new Date().toISOString(),
    faceAnalysis: input.faceAnalysis,
    expiresAt: computeExpiry(input.retentionDays),
    source: input.source,
  };

  const all = await listScans();
  const next = [record, ...all];
  await storage.setJSON(STORAGE_KEY, next);
  return record;
}

export async function listScans() {
  const records = (await storage.getJSON<ScanRecord[]>(STORAGE_KEY)) ?? [];
  return records.sort(
    (a, b) =>
      new Date(b.capturedAt).getTime() - new Date(a.capturedAt).getTime(),
  );
}

export async function deleteScan(id: string) {
  const records = await listScans();
  const next = records.filter((record) => record.id !== id);
  await storage.setJSON(STORAGE_KEY, next);

  const target = records.find((record) => record.id === id);
  if (target) {
    await removeFile(target.imageUri);
  }
}

export async function deleteAllScans() {
  const records = await listScans();
  for (const record of records) {
    await removeFile(record.imageUri);
  }
  await storage.remove(STORAGE_KEY);
}

export async function pruneExpired(now = new Date()) {
  const records = await listScans();
  const keep: ScanRecord[] = [];
  for (const record of records) {
    if (new Date(record.expiresAt) <= now) {
      await removeFile(record.imageUri);
    } else {
      keep.push(record);
    }
  }

  await storage.setJSON(STORAGE_KEY, keep);
  return keep;
}

export function getExpiryBadge(
  record: Pick<ScanRecord, "expiresAt">,
  now = new Date(),
): ExpiryBadge {
  const expires = new Date(record.expiresAt);
  const diffMs = expires.getTime() - now.getTime();
  const daysRemaining = diffMs <= 0 ? 0 : Math.ceil(diffMs / 86400000);
  const expired = diffMs <= 0;
  const label = expired
    ? "Expired"
    : `Expires in ${daysRemaining} day${daysRemaining === 1 ? "" : "s"}`;

  return { label, daysRemaining, expired };
}

function computeExpiry(retentionDays: number) {
  const expires = new Date();
  expires.setDate(expires.getDate() + retentionDays);
  return expires.toISOString();
}

async function ensureDirectory() {
  const exists = await FileSystem.getInfoAsync(SCAN_DIRECTORY);
  if (!exists.exists) {
    await FileSystem.makeDirectoryAsync(SCAN_DIRECTORY, {
      intermediates: true,
    });
  }
}

async function removeFile(uri: string) {
  const info = await FileSystem.getInfoAsync(uri);
  if (info.exists) {
    await FileSystem.deleteAsync(uri, { idempotent: true });
  }
}

function generateId() {
  return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
}
