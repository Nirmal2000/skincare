import { useCallback, useEffect, useState } from "react";

import {
  deleteAllScans,
  deleteScan,
  listScans,
  pruneExpired,
  type ScanRecord,
} from "@/features/scans/scan-store";
import {
  listRecentTasks,
  type FaceAnalysisTaskResponse,
} from "@/features/scans/face-analysis-api";

export type HistoryEntry = {
  record: ScanRecord;
  task: FaceAnalysisTaskResponse | null;
};

type HistoryState = {
  records: HistoryEntry[];
  loading: boolean;
  refreshing: boolean;
};

const INITIAL_STATE: HistoryState = {
  records: [],
  loading: true,
  refreshing: false,
};

export function useScanHistory() {
  const [state, setState] = useState<HistoryState>(INITIAL_STATE);

  const load = useCallback(async () => {
    setState((prev) => ({ ...prev, refreshing: true }));
    await pruneExpired();
    const [localRecords, remoteTasks] = await Promise.all([
      listScans(),
      listRecentTasks(50).catch(() => [] as FaceAnalysisTaskResponse[]),
    ]);
    const taskMap = new Map(remoteTasks.map((task) => [task.task_id, task]));
    const merged: HistoryEntry[] = localRecords.map((record) => ({
      record,
      task: taskMap.get(record.id) ?? null,
    }));
    setState({ records: merged, loading: false, refreshing: false });
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const remove = useCallback(async (id: string) => {
    await deleteScan(id);
    setState((prev) => ({
      ...prev,
      records: prev.records.filter((entry) => entry.record.id !== id),
    }));
  }, []);

  const removeAll = useCallback(async () => {
    await deleteAllScans();
    setState((prev) => ({
      ...prev,
      records: [],
    }));
  }, []);

  return {
    records: state.records,
    loading: state.loading,
    refreshing: state.refreshing,
    refresh: load,
    remove,
    removeAll,
  };
}
