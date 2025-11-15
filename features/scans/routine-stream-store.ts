import { storage } from "@/features/storage/async-storage";

const STORAGE_KEY = "facefit:routine-streams";

async function readIds() {
  return (await storage.getJSON<string[]>(STORAGE_KEY)) ?? [];
}

async function writeIds(ids: string[]) {
  await storage.setJSON(STORAGE_KEY, Array.from(new Set(ids)));
}

export async function markRoutineStreaming(taskId: string) {
  const ids = await readIds();
  if (ids.includes(taskId)) return;
  await writeIds([...ids, taskId]);
}

export async function unmarkRoutineStreaming(taskId: string) {
  const ids = await readIds();
  if (!ids.length) return;
  await writeIds(ids.filter((id) => id !== taskId));
}

export async function isRoutineStreaming(taskId: string) {
  const ids = await readIds();
  return ids.includes(taskId);
}

export async function listStreamingTasks() {
  return readIds();
}
