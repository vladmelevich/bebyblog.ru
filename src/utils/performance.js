import { useCallback, useMemo, useEffect, useRef } from 'react';

/**
 * Хук для дебаунсинга функций
 */
export const useDebounce = (callback, delay) => {
  const timeoutRef = useRef(null);

  const debouncedCallback = useCallback((...args) => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }
    
    timeoutRef.current = setTimeout(() => {
      callback(...args);
    }, delay);
  }, [callback, delay]);

  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, []);

  return debouncedCallback;
};

/**
 * Хук для throttling функций
 */
export const useThrottle = (callback, delay) => {
  const lastCallRef = useRef(0);
  const lastCallTimerRef = useRef(null);

  const throttledCallback = useCallback((...args) => {
    const now = Date.now();
    
    if (now - lastCallRef.current >= delay) {
      callback(...args);
      lastCallRef.current = now;
    } else {
      if (lastCallTimerRef.current) {
        clearTimeout(lastCallTimerRef.current);
      }
      
      lastCallTimerRef.current = setTimeout(() => {
        callback(...args);
        lastCallRef.current = Date.now();
      }, delay - (now - lastCallRef.current));
    }
  }, [callback, delay]);

  useEffect(() => {
    return () => {
      if (lastCallTimerRef.current) {
        clearTimeout(lastCallTimerRef.current);
      }
    };
  }, []);

  return throttledCallback;
};

/**
 * Хук для оптимизации тяжелых вычислений
 */
export const useHeavyComputation = (computeFn, dependencies) => {
  return useMemo(computeFn, dependencies);
};

/**
 * Хук для очистки ресурсов при размонтировании
 */
export const useCleanup = (cleanupFn) => {
  useEffect(() => {
    return cleanupFn;
  }, [cleanupFn]);
};










