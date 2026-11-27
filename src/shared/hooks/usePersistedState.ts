import { useCallback, useEffect, useRef, useState, type Dispatch, type SetStateAction } from 'react';

export interface UsePersistedStateOptions<T> {
  validate?: (raw: unknown) => T;
  serialize?: (value: T) => string;
  deserialize?: (raw: string) => unknown;
}

function resolveDefault<T>(defaultValue: T | (() => T)): T {
  return typeof defaultValue === 'function' ? (defaultValue as () => T)() : defaultValue;
}

function readStoredValue<T>(
  key: string,
  defaultValue: T | (() => T),
  options?: UsePersistedStateOptions<T>
): T {
  const fallback = resolveDefault(defaultValue);
  if (typeof window === 'undefined') {
    return fallback;
  }

  try {
    const raw = window.localStorage.getItem(key);
    if (raw === null) {
      return fallback;
    }
    const parsed: unknown = options?.deserialize ? options.deserialize(raw) : JSON.parse(raw);
    return options?.validate ? options.validate(parsed) : (parsed as T);
  } catch {
    return fallback;
  }
}

/**
 * Single-read localStorage state hook with `try/catch` error isolation and
 * optional runtime schema validation/sanitization.
 */
export function usePersistedState<T>(
  key: string,
  defaultValue: T | (() => T),
  options?: UsePersistedStateOptions<T>
): [T, Dispatch<SetStateAction<T>>] {
  const [state, setState] = useState<T>(() => readStoredValue(key, defaultValue, options));
  const shouldPersistRef = useRef(false);
  const serializeRef = useRef(options?.serialize);

  useEffect(() => {
    serializeRef.current = options?.serialize;
  }, [options?.serialize]);

  useEffect(() => {
    if (!shouldPersistRef.current || typeof window === 'undefined') {
      return;
    }
    try {
      const serialized = serializeRef.current
        ? serializeRef.current(state)
        : JSON.stringify(state);
      window.localStorage.setItem(key, serialized);
    } catch {
      // Ignore quota exceeded / private mode storage exceptions
    }
  }, [key, state]);

  const setPersistedState = useCallback<Dispatch<SetStateAction<T>>>((value) => {
    shouldPersistRef.current = true;
    setState(value);
  }, []);

  return [state, setPersistedState];
}
