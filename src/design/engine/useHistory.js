// src/design/engine/useHistory.js
// Undo/redo for the design document. Continuous gestures (drag, resize,
// rotate) call `set(next, { transient: true })` then `commit()` once.
import { useCallback, useRef, useState } from 'react';

const LIMIT = 100;

export default function useHistory(initial) {
  const [present, setPresent] = useState(initial);
  const past = useRef([]);
  const future = useRef([]);
  const base = useRef(null);
  const presentRef = useRef(initial);
  const [, force] = useState(0);

  const apply = (next) => { presentRef.current = next; setPresent(next); };

  const set = useCallback((updater, { transient = false } = {}) => {
    const cur = presentRef.current;
    const next = typeof updater === 'function' ? updater(cur) : updater;
    if (next === cur) return;
    if (transient) {
      if (!base.current) base.current = cur;
    } else {
      past.current = [...past.current, base.current || cur].slice(-LIMIT);
      future.current = [];
      base.current = null;
    }
    apply(next);
  }, []);

  const commit = useCallback(() => {
    if (!base.current) return;
    if (base.current !== presentRef.current) {
      past.current = [...past.current, base.current].slice(-LIMIT);
      future.current = [];
    }
    base.current = null;
    force((n) => n + 1);
  }, []);

  const undo = useCallback(() => {
    commit();
    if (!past.current.length) return;
    const prev = past.current[past.current.length - 1];
    past.current = past.current.slice(0, -1);
    future.current = [presentRef.current, ...future.current];
    apply(prev);
  }, [commit]);

  const redo = useCallback(() => {
    if (!future.current.length) return;
    const next = future.current[0];
    future.current = future.current.slice(1);
    past.current = [...past.current, presentRef.current];
    apply(next);
  }, []);

  const reset = useCallback((doc) => {
    past.current = [];
    future.current = [];
    base.current = null;
    apply(doc);
  }, []);

  return {
    doc: present,
    set,
    commit,
    undo,
    redo,
    reset,
    canUndo: past.current.length > 0 || Boolean(base.current),
    canRedo: future.current.length > 0
  };
}
