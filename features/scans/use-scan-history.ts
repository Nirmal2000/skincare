import { useCallback, useEffect, useState } from "react";

import {
  deleteAllScans,
  deleteScan,
  listScans,
  pruneExpired,
  type ScanRecord,
} from "@/features/scans/scan-store";

type HistoryState = {
  records: ScanRecord[];
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
    const next = await listScans();
    setState({ records: next, loading: false, refreshing: false });
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const remove = useCallback(async (id: string) => {
    await deleteScan(id);
    setState((prev) => ({
      ...prev,
      records: prev.records.filter((record) => record.id !== id),
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
