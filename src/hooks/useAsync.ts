import { useState, useCallback, useEffect, useRef } from 'react';
import { handleError } from '../lib/errorHandler';
import { withRetry } from '../lib/retryLogic';

interface AsyncState<T> {
  data: T | null;
  error: string | null;
  loading: boolean;
  errorId?: string;
}

interface UseAsyncOptions {
  immediate?: boolean;
  retry?: boolean;
  onSuccess?: (data: any) => void;
  onError?: (error: string, errorId: string) => void;
}

export function useAsync<T, Args extends any[] = []>(
  asyncFunction: (...args: Args) => Promise<T>,
  options: UseAsyncOptions = {}
) {
  const { immediate = false, retry = false, onSuccess, onError } = options;

  const [state, setState] = useState<AsyncState<T>>({
    data: null,
    error: null,
    loading: false,
  });

  const isMountedRef = useRef(true);
  const abortControllerRef = useRef<AbortController | null>(null);

  useEffect(() => {
    isMountedRef.current = true;
    return () => {
      isMountedRef.current = false;
      abortControllerRef.current?.abort();
    };
  }, []);

  const execute = useCallback(
    async (...args: Args) => {
      abortControllerRef.current?.abort();
      abortControllerRef.current = new AbortController();

      setState({ data: null, error: null, loading: true });

      try {
        const wrappedFunction = retry
          ? () => withRetry(() => asyncFunction(...args))
          : () => asyncFunction(...args);

        const result = await wrappedFunction();

        if (isMountedRef.current) {
          setState({ data: result, error: null, loading: false });
          onSuccess?.(result);
        }

        return result;
      } catch (error) {
        if (isMountedRef.current) {
          const { message, errorId } = handleError(error);
          setState({ data: null, error: message, loading: false, errorId });
          onError?.(message, errorId);
        }
        throw error;
      }
    },
    [asyncFunction, retry, onSuccess, onError]
  );

  const reset = useCallback(() => {
    setState({ data: null, error: null, loading: false });
  }, []);

  useEffect(() => {
    if (immediate) {
      execute(...([] as unknown as Args));
    }
  }, [immediate]);

  return {
    ...state,
    execute,
    reset,
  };
}

export function useAsyncCallback<T, Args extends any[] = []>(
  asyncFunction: (...args: Args) => Promise<T>,
  options: UseAsyncOptions = {}
) {
  const { retry = false, onSuccess, onError } = options;

  const [state, setState] = useState<AsyncState<T>>({
    data: null,
    error: null,
    loading: false,
  });

  const callback = useCallback(
    async (...args: Args) => {
      setState({ data: null, error: null, loading: true });

      try {
        const wrappedFunction = retry
          ? () => withRetry(() => asyncFunction(...args))
          : () => asyncFunction(...args);

        const result = await wrappedFunction();
        setState({ data: result, error: null, loading: false });
        onSuccess?.(result);
        return result;
      } catch (error) {
        const { message, errorId } = handleError(error);
        setState({ data: null, error: message, loading: false, errorId });
        onError?.(message, errorId);
        throw error;
      }
    },
    [asyncFunction, retry, onSuccess, onError]
  );

  const reset = useCallback(() => {
    setState({ data: null, error: null, loading: false });
  }, []);

  return [callback, state, reset] as const;
}

export function useDebounce<T>(value: T, delayMs: number): T {
  const [debouncedValue, setDebouncedValue] = useState<T>(value);

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delayMs);

    return () => {
      clearTimeout(handler);
    };
  }, [value, delayMs]);

  return debouncedValue;
}

export function usePrevious<T>(value: T): T | undefined {
  const ref = useRef<T>();

  useEffect(() => {
    ref.current = value;
  }, [value]);

  return ref.current;
}

export function useLocalStorage<T>(
  key: string,
  initialValue: T
): [T, (value: T | ((prev: T) => T)) => void, () => void] {
  const [storedValue, setStoredValue] = useState<T>(() => {
    try {
      const item = window.localStorage.getItem(key);
      return item ? JSON.parse(item) : initialValue;
    } catch (error) {
      console.warn(`Error loading localStorage key "${key}":`, error);
      return initialValue;
    }
  });

  const setValue = useCallback(
    (value: T | ((prev: T) => T)) => {
      try {
        const valueToStore = value instanceof Function ? value(storedValue) : value;
        setStoredValue(valueToStore);
        window.localStorage.setItem(key, JSON.stringify(valueToStore));
      } catch (error) {
        console.warn(`Error setting localStorage key "${key}":`, error);
      }
    },
    [key, storedValue]
  );

  const removeValue = useCallback(() => {
    try {
      window.localStorage.removeItem(key);
      setStoredValue(initialValue);
    } catch (error) {
      console.warn(`Error removing localStorage key "${key}":`, error);
    }
  }, [key, initialValue]);

  return [storedValue, setValue, removeValue];
}
