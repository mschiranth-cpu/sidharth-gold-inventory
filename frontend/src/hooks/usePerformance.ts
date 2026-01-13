/**
 * ============================================
 * PERFORMANCE OPTIMIZATION HOOKS
 * ============================================
 * 
 * Custom hooks for performance optimization including
 * debouncing, throttling, lazy loading, and memoization.
 * 
 * @author Gold Factory Dev Team
 * @version 1.0.0
 */

import { 
  useState, 
  useEffect, 
  useRef, 
  useCallback, 
  useMemo,
  DependencyList 
} from 'react';

// ============================================
// DEBOUNCE HOOK
// ============================================

/**
 * Debounce a value - useful for search inputs
 */
export function useDebounce<T>(value: T, delay: number): T {
  const [debouncedValue, setDebouncedValue] = useState<T>(value);

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    return () => {
      clearTimeout(timer);
    };
  }, [value, delay]);

  return debouncedValue;
}

/**
 * Debounced callback - useful for event handlers
 */
export function useDebouncedCallback<T extends (...args: any[]) => any>(
  callback: T,
  delay: number,
  deps: DependencyList = []
): (...args: Parameters<T>) => void {
  const timeoutRef = useRef<ReturnType<typeof setTimeout>>();
  const callbackRef = useRef(callback);

  // Update callback ref on each render
  useEffect(() => {
    callbackRef.current = callback;
  }, [callback]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, []);

  return useCallback(
    (...args: Parameters<T>) => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }

      timeoutRef.current = setTimeout(() => {
        callbackRef.current(...args);
      }, delay);
    },
    [delay, ...deps]
  );
}

// ============================================
// THROTTLE HOOK
// ============================================

/**
 * Throttle a callback - limits how often it can fire
 */
export function useThrottle<T extends (...args: any[]) => any>(
  callback: T,
  delay: number
): (...args: Parameters<T>) => void {
  const lastCall = useRef<number>(0);
  const lastCallTimer = useRef<ReturnType<typeof setTimeout>>();
  const callbackRef = useRef(callback);

  useEffect(() => {
    callbackRef.current = callback;
  }, [callback]);

  return useCallback(
    (...args: Parameters<T>) => {
      const now = Date.now();
      const timeSinceLastCall = now - lastCall.current;

      if (timeSinceLastCall >= delay) {
        lastCall.current = now;
        callbackRef.current(...args);
      } else {
        // Schedule trailing call
        if (lastCallTimer.current) {
          clearTimeout(lastCallTimer.current);
        }
        lastCallTimer.current = setTimeout(() => {
          lastCall.current = Date.now();
          callbackRef.current(...args);
        }, delay - timeSinceLastCall);
      }
    },
    [delay]
  );
}

// ============================================
// INTERSECTION OBSERVER HOOK
// ============================================

interface UseIntersectionObserverOptions extends IntersectionObserverInit {
  freezeOnceVisible?: boolean;
}

export function useIntersectionObserver(
  options: UseIntersectionObserverOptions = {}
): [React.RefObject<HTMLDivElement>, boolean, IntersectionObserverEntry | null] {
  const { threshold = 0, root = null, rootMargin = '0px', freezeOnceVisible = false } = options;

  const ref = useRef<HTMLDivElement>(null);
  const [isIntersecting, setIsIntersecting] = useState(false);
  const [entry, setEntry] = useState<IntersectionObserverEntry | null>(null);
  
  const frozen = useRef(false);

  useEffect(() => {
    const element = ref.current;
    if (!element || (frozen.current && freezeOnceVisible)) return;

    if (!('IntersectionObserver' in window)) {
      setIsIntersecting(true);
      return;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        const entry = entries[0];
        if (entry) {
          setEntry(entry);
          setIsIntersecting(entry.isIntersecting);

          if (entry.isIntersecting && freezeOnceVisible) {
            frozen.current = true;
            observer.disconnect();
          }
        }
      },
      { threshold, root, rootMargin }
    );

    observer.observe(element);

    return () => {
      observer.disconnect();
    };
  }, [threshold, root, rootMargin, freezeOnceVisible]);

  return [ref, isIntersecting, entry];
}

// ============================================
// LAZY INITIALIZATION HOOK
// ============================================

/**
 * Lazy initialize expensive values
 */
export function useLazyInit<T>(initializer: () => T): T {
  const [value] = useState(initializer);
  return value;
}

// ============================================
// PREVIOUS VALUE HOOK
// ============================================

/**
 * Track previous value of a variable
 */
export function usePrevious<T>(value: T): T | undefined {
  const ref = useRef<T>();

  useEffect(() => {
    ref.current = value;
  }, [value]);

  return ref.current;
}

// ============================================
// STABLE CALLBACK HOOK
// ============================================

/**
 * Create a stable callback that always calls the latest version
 */
export function useStableCallback<T extends (...args: any[]) => any>(
  callback: T
): T {
  const callbackRef = useRef(callback);

  useEffect(() => {
    callbackRef.current = callback;
  }, [callback]);

  return useCallback(
    ((...args) => callbackRef.current(...args)) as T,
    []
  );
}

// ============================================
// MEMOIZED SELECTOR HOOK
// ============================================

/**
 * Memoized selector - only recalculates when dependencies change
 */
export function useMemoizedSelector<T, R>(
  selector: (value: T) => R,
  value: T,
  isEqual?: (a: R, b: R) => boolean
): R {
  const previousValue = useRef<R>();
  const previousInput = useRef<T>();

  return useMemo(() => {
    if (previousInput.current === value) {
      return previousValue.current!;
    }

    const newValue = selector(value);

    if (isEqual && previousValue.current !== undefined && isEqual(previousValue.current, newValue)) {
      return previousValue.current;
    }

    previousInput.current = value;
    previousValue.current = newValue;
    return newValue;
  }, [value, selector, isEqual]);
}

// ============================================
// WINDOW SIZE HOOK (Throttled)
// ============================================

interface WindowSize {
  width: number;
  height: number;
}

export function useWindowSize(throttleMs: number = 100): WindowSize {
  const [windowSize, setWindowSize] = useState<WindowSize>({
    width: typeof window !== 'undefined' ? window.innerWidth : 0,
    height: typeof window !== 'undefined' ? window.innerHeight : 0,
  });

  const handleResize = useThrottle(() => {
    setWindowSize({
      width: window.innerWidth,
      height: window.innerHeight,
    });
  }, throttleMs);

  useEffect(() => {
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [handleResize]);

  return windowSize;
}

// ============================================
// MEDIA QUERY HOOK
// ============================================

export function useMediaQuery(query: string): boolean {
  const [matches, setMatches] = useState(() => {
    if (typeof window !== 'undefined') {
      return window.matchMedia(query).matches;
    }
    return false;
  });

  useEffect(() => {
    const mediaQuery = window.matchMedia(query);
    setMatches(mediaQuery.matches);

    const handler = (event: MediaQueryListEvent) => {
      setMatches(event.matches);
    };

    mediaQuery.addEventListener('change', handler);
    return () => mediaQuery.removeEventListener('change', handler);
  }, [query]);

  return matches;
}

// Breakpoint hooks
export function useIsMobile(): boolean {
  return useMediaQuery('(max-width: 639px)');
}

export function useIsTablet(): boolean {
  return useMediaQuery('(min-width: 640px) and (max-width: 1023px)');
}

export function useIsDesktop(): boolean {
  return useMediaQuery('(min-width: 1024px)');
}

// ============================================
// IDLE CALLBACK HOOK
// ============================================

/**
 * Schedule work during browser idle time
 */
export function useIdleCallback(
  callback: () => void,
  options?: { timeout?: number }
): void {
  const callbackRef = useRef(callback);

  useEffect(() => {
    callbackRef.current = callback;
  }, [callback]);

  useEffect(() => {
    if ('requestIdleCallback' in window) {
      const id = window.requestIdleCallback(() => callbackRef.current(), options);
      return () => window.cancelIdleCallback(id);
    } else {
      // Fallback for Safari
      const id = setTimeout(() => callbackRef.current(), 1);
      return () => clearTimeout(id);
    }
  }, [options]);
}

// ============================================
// RAF CALLBACK HOOK
// ============================================

/**
 * Schedule work on next animation frame
 */
export function useAnimationFrame(
  callback: (deltaTime: number) => void,
  deps: DependencyList = []
): void {
  const requestRef = useRef<number>();
  const previousTimeRef = useRef<number>();
  const callbackRef = useRef(callback);

  useEffect(() => {
    callbackRef.current = callback;
  }, [callback]);

  useEffect(() => {
    const animate = (time: number) => {
      if (previousTimeRef.current !== undefined) {
        const deltaTime = time - previousTimeRef.current;
        callbackRef.current(deltaTime);
      }
      previousTimeRef.current = time;
      requestRef.current = requestAnimationFrame(animate);
    };

    requestRef.current = requestAnimationFrame(animate);
    return () => {
      if (requestRef.current) {
        cancelAnimationFrame(requestRef.current);
      }
    };
  }, deps);
}

// ============================================
// RENDER COUNT HOOK (Dev only)
// ============================================

export function useRenderCount(componentName: string): void {
  const renderCount = useRef(0);

  useEffect(() => {
    renderCount.current += 1;
    if (import.meta.env.DEV) {
      console.log(`[${componentName}] render count:`, renderCount.current);
    }
  });
}

// ============================================
// DEFERRED VALUE (React 18+)
// ============================================

/**
 * Defer expensive updates - similar to useDeferredValue but with custom delay
 */
export function useDeferredUpdate<T>(value: T, delay: number = 0): T {
  const [deferredValue, setDeferredValue] = useState(value);

  useEffect(() => {
    if (delay === 0) {
      // Use transition API if available
      if ('startTransition' in React) {
        (React as unknown as { startTransition: (cb: () => void) => void }).startTransition(() => {
          setDeferredValue(value);
        });
      } else {
        setDeferredValue(value);
      }
      return;
    } else {
      const timer = setTimeout(() => {
        setDeferredValue(value);
      }, delay);
      return () => clearTimeout(timer);
    }
  }, [value, delay]);

  return deferredValue;
}

// Type augmentation for requestIdleCallback
declare global {
  interface Window {
    requestIdleCallback(
      callback: (deadline: IdleDeadline) => void,
      opts?: { timeout?: number }
    ): number;
    cancelIdleCallback(id: number): void;
  }

  interface IdleDeadline {
    readonly didTimeout: boolean;
    timeRemaining(): number;
  }
}

import React from 'react';
