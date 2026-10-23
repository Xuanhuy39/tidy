const KEY = 'tidy-up-progress-v1';

export interface Progress {
  /** Best stars per level id (0 = not cleared). */
  stars: Record<string, number>;
  muted: boolean;
}

export function loadProgress(): Progress {
  try {
    const raw = localStorage.getItem(KEY);
    if (raw) return { stars: {}, muted: false, ...JSON.parse(raw) };
  } catch {
    // Storage can be blocked (private mode); play without saving.
  }
  return { stars: {}, muted: false };
}

export function saveProgress(p: Progress): void {
  try {
    localStorage.setItem(KEY, JSON.stringify(p));
  } catch {
    // ignore
  }
}
