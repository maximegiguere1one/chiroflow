import { useEffect } from 'react';
import { useWaitlistStore } from '../presentation/stores/waitlistStore';

export function useWaitlist(autoLoad = true) {
  const {
    regularWaitlist,
    cancellationWaitlist,
    recallWaitlist,
    loading,
    error,
    filters,
    stats,
    isRealtimeActive,
    addToWaitlist,
    addToRecall,
    updateWaitlistEntry,
    updateRecallEntry,
    removeFromWaitlist,
    removeFromRecall,
    markAsContacted,
    markAsScheduled,
    notifyNextInLine,
    setFilters,
    refresh,
    enableRealtime,
    disableRealtime,
  } = useWaitlistStore();

  useEffect(() => {
    if (autoLoad) {
      useWaitlistStore.getState().loadAllWaitlists();
    }
  }, [autoLoad]);

  return {
    regularWaitlist,
    cancellationWaitlist,
    recallWaitlist,
    loading,
    error,
    filters,
    stats,
    isRealtimeActive,
    addToWaitlist,
    addToRecall,
    updateWaitlistEntry,
    updateRecallEntry,
    removeFromWaitlist,
    removeFromRecall,
    markAsContacted,
    markAsScheduled,
    notifyNextInLine,
    setFilters,
    refresh,
    enableRealtime,
    disableRealtime,
  };
}

export function useRecallWaitlist() {
  const recallWaitlist = useWaitlistStore((state) => state.recallWaitlist);
  const addToRecall = useWaitlistStore((state) => state.addToRecall);
  const updateRecallEntry = useWaitlistStore((state) => state.updateRecallEntry);
  const removeFromRecall = useWaitlistStore((state) => state.removeFromRecall);

  useEffect(() => {
    useWaitlistStore.getState().loadRecallWaitlist();
  }, []);

  return {
    recallWaitlist,
    addToRecall,
    updateRecallEntry,
    removeFromRecall,
  };
}
