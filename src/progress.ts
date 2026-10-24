import { START_COINS } from './game/economy';

const KEY = 'tidy-up-progress-v1';

export interface Progress {
  /** Levels cleared (by id); a value above 0 means cleared. */
  stars: Record<string, number>;
  muted: boolean;
  coins: number;
}

export function loadProgress(): Progress {
  const fresh: Progress = { stars: {}, muted: false, coins: START_COINS };
  try {
    const raw = localStorage.getItem(KEY);
    if (raw) return { ...fresh, ...JSON.parse(raw) };
  } catch {
    // Storage can be blocked (private mode); play without saving.
  }
  return fresh;
}

export function saveProgress(p: Progress): void {
  try {
    localStorage.setItem(KEY, JSON.stringify(p));
  } catch {
    // ignore
  }
}
