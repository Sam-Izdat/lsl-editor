import { writable } from 'svelte/store';

// Define types for stack trace lines and the main store structure
interface DebugLine {
  source: string;
  lineno: number;
  colno: number;
}

type DebugMap = Map<string, DebugLine[]>;

const createDebugStore = () => {
  const { subscribe, update, set } = writable<DebugMap>(new Map());

  return {
    subscribe,
    addTrace(errorId: string, line: DebugLine) {
      update((traces) => {
        const traceLines = traces.get(errorId) || [];
        traceLines.push(line);
        traces.set(errorId, traceLines);
        return traces;
      });
    },
    setTrace(errorId: string, traceLines: DebugLine[]) {
      update((traces) => {
        traces.set(errorId, traceLines);
        return traces;
      });
    },
    clear() {
      set(new Map());
    }
  };
}

export const debugStore = createDebugStore();