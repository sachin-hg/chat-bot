import { useState, useCallback } from 'react';

const STORAGE_KEY = 'course_completed';
const STORAGE_VERSION_KEY = 'course_completed_v';
const CURRENT_VERSION = 2; // bumped when module IDs were renumbered to 1–43

// old_id → new_id: maps pre-renumber IDs (0–42) to sequential IDs (1–43)
const ID_MIGRATION: Record<number, number> = {
  0: 3,  1: 4,  2: 8,  3: 6,  4: 7,  5: 11, 6: 12, 7: 15, 8: 16, 9: 14,
  10: 17, 11: 18, 12: 9,  13: 5,  14: 19, 15: 20, 16: 2,  17: 10, 18: 13, 19: 40,
  20: 1,  21: 42, 22: 43, 23: 22, 24: 23, 25: 25, 26: 26, 27: 27, 28: 28, 29: 31,
  30: 32, 31: 33, 32: 34, 33: 35, 34: 36, 35: 41, 36: 21, 37: 30, 38: 29, 39: 24,
  40: 37, 41: 38, 42: 39,
};

function loadCompleted(): Set<number> {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    const ids: number[] = saved ? JSON.parse(saved) : [];
    const version = Number(localStorage.getItem(STORAGE_VERSION_KEY) ?? 1);

    if (version < CURRENT_VERSION) {
      // Migrate old IDs to new sequential IDs
      const migrated = ids.map(id => ID_MIGRATION[id] ?? id);
      localStorage.setItem(STORAGE_KEY, JSON.stringify(migrated));
      localStorage.setItem(STORAGE_VERSION_KEY, String(CURRENT_VERSION));
      return new Set(migrated);
    }

    return new Set(ids);
  } catch {
    return new Set();
  }
}

export function useProgress() {
  const [completed, setCompleted] = useState<Set<number>>(loadCompleted);

  const markComplete = useCallback((id: number) => {
    setCompleted(prev => {
      const next = new Set(prev);
      next.add(id);
      localStorage.setItem(STORAGE_KEY, JSON.stringify([...next]));
      localStorage.setItem(STORAGE_VERSION_KEY, String(CURRENT_VERSION));
      return next;
    });
  }, []);

  return { completed, markComplete };
}
