import { storage } from "@/features/storage/async-storage";

const STORAGE_KEY = "facefit:pending-tasks";

async function readTaskIds() {
  return (await storage.getJSON<string[]>(STORAGE_KEY)) ?? [];
}

async function writeTaskIds(ids: string[]) {
  if (!ids.length) {
    await storage.remove(STORAGE_KEY);
    return;
  }
  await storage.setJSON(STORAGE_KEY, Array.from(new Set(ids)));
}

export async function markTaskPending(taskId: string) {
  const ids = await readTaskIds();
  if (ids.includes(taskId)) return;
  await writeTaskIds([...ids, taskId]);
}

export async function unmarkTaskPending(taskId: string) {
  const ids = await readTaskIds();
  if (!ids.length) return;
  const next = ids.filter((id) => id !== taskId);
  await writeTaskIds(next);
}

export async function isTaskPending(taskId: string) {
  const ids = await readTaskIds();
  return ids.includes(taskId);
}

export async function listPendingTasks() {
  return readTaskIds();
}
