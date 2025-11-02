import { useState, useCallback } from 'react';

export interface OptimisticItem<T = any> {
  id: string;
  tempId?: string;
  synced?: boolean;
  error?: string;
  data?: T;
}

export interface OptimisticActions<T> {
  confirm: (realId: string, data?: T) => void;
  rollback: () => void;
  updateStatus: (status: 'syncing' | 'synced' | 'error', error?: string) => void;
}

export function useOptimisticUI<T extends OptimisticItem<T>>(
  initialItems: T[] = []
) {
  const [items, setItems] = useState<T[]>(initialItems);

  const addOptimistic = useCallback((item: Omit<T, 'id' | 'synced'>): OptimisticActions<T> => {
    const tempId = `temp_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const optimisticItem = {
      ...item,
      id: tempId,
      tempId,
      synced: false
    } as T;

    setItems(prev => [optimisticItem, ...prev]);

    return {
      confirm: (realId: string, data?: T) => {
        setItems(prev =>
          prev.map(i =>
            i.id === tempId
              ? { ...i, ...(data || {}), id: realId, tempId: undefined, synced: true, error: undefined }
              : i
          )
        );
      },
      rollback: () => {
        setItems(prev => prev.filter(i => i.id !== tempId));
      },
      updateStatus: (status: 'syncing' | 'synced' | 'error', error?: string) => {
        setItems(prev =>
          prev.map(i =>
            i.id === tempId
              ? { ...i, synced: status === 'synced', error }
              : i
          )
        );
      }
    };
  }, []);

  const updateOptimistic = useCallback((id: string, updates: Partial<T>): OptimisticActions<T> => {
    const previousItem = items.find(i => i.id === id);
    if (!previousItem) {
      return {
        confirm: () => {},
        rollback: () => {},
        updateStatus: () => {}
      };
    }

    setItems(prev =>
      prev.map(i =>
        i.id === id
          ? { ...i, ...updates, synced: false }
          : i
      )
    );

    return {
      confirm: (realId: string, data?: T) => {
        setItems(prev =>
          prev.map(i =>
            i.id === id
              ? { ...i, ...(data || {}), synced: true, error: undefined }
              : i
          )
        );
      },
      rollback: () => {
        setItems(prev =>
          prev.map(i =>
            i.id === id ? previousItem : i
          )
        );
      },
      updateStatus: (status: 'syncing' | 'synced' | 'error', error?: string) => {
        setItems(prev =>
          prev.map(i =>
            i.id === id
              ? { ...i, synced: status === 'synced', error }
              : i
          )
        );
      }
    };
  }, [items]);

  const deleteOptimistic = useCallback((id: string): OptimisticActions<T> => {
    const deletedItem = items.find(i => i.id === id);
    if (!deletedItem) {
      return {
        confirm: () => {},
        rollback: () => {},
        updateStatus: () => {}
      };
    }

    setItems(prev => prev.filter(i => i.id !== id));

    return {
      confirm: () => {
      },
      rollback: () => {
        setItems(prev => [deletedItem, ...prev]);
      },
      updateStatus: () => {}
    };
  }, [items]);

  const reset = useCallback((newItems: T[]) => {
    setItems(newItems);
  }, []);

  return {
    items,
    setItems,
    addOptimistic,
    updateOptimistic,
    deleteOptimistic,
    reset
  };
}

export function useOptimisticMutation<TInput, TOutput>(
  mutationFn: (input: TInput) => Promise<TOutput>
) {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const mutate = useCallback(async (
    input: TInput,
    {
      onOptimistic,
      onSuccess,
      onError
    }: {
      onOptimistic?: () => void;
      onSuccess?: (data: TOutput) => void;
      onError?: (error: Error) => void;
    } = {}
  ) => {
    setIsLoading(true);
    setError(null);

    if (onOptimistic) {
      onOptimistic();
    }

    try {
      const result = await mutationFn(input);
      if (onSuccess) {
        onSuccess(result);
      }
      return result;
    } catch (err) {
      const error = err instanceof Error ? err : new Error(String(err));
      setError(error);
      if (onError) {
        onError(error);
      }
      throw error;
    } finally {
      setIsLoading(false);
    }
  }, [mutationFn]);

  return {
    mutate,
    isLoading,
    error
  };
}
