import type { CategoryId, ItemDef, LevelDef } from './types';

export const BASE_TRAY = 5;
export const MAX_TRAY = 7;
export const BASE_BOXES = 2;
export const MAX_BOXES = 3;
export const RETURN_COUNT = 3;

export type ItemPlace = 'scene' | 'tray' | 'box';

export interface Box {
  cat: CategoryId;
  count: number;
  cap: number;
}

/** Things that happened during one action, in order, for the view to animate. */
export type GameEvent =
  | { type: 'toBox'; item: string; slot: number }
  | { type: 'toTray'; item: string; index: number }
  | { type: 'boxDone'; slot: number }
  | { type: 'boxOpen'; slot: number; cat: CategoryId; cap: number }
  | { type: 'boxGone'; slot: number }
  | { type: 'trayToBox'; item: string; from: number; slot: number }
  | { type: 'trayCompact'; tray: string[] }
  | { type: 'returned'; item: string; from: number; support: string | null }
  | { type: 'traySize'; size: number }
  | { type: 'won' }
  | { type: 'lost' };

export type TapRefusal = 'blocked' | 'trayFull' | 'gone' | 'over';

export type TapResult = { ok: true; events: GameEvent[] } | { ok: false; reason: TapRefusal };

/**
 * The rules, with no rendering. Tapping a free item sends it to an open box of its
 * category, or else to the tray. A full box closes and the next category opens in its
 * slot, pulling matching items out of the tray. Stuck = tray full and no free item fits a box.
 */
export class Game {
  readonly level: LevelDef;
  private readonly defs = new Map<string, ItemDef>();
  readonly place = new Map<string, ItemPlace>();
  /** What each scene item currently rests on (null = a room surface). */
  readonly support = new Map<string, string | null>();
  boxes: (Box | null)[] = [];
  boxSlots = BASE_BOXES;
  queue: CategoryId[];
  tray: string[] = [];
  traySize = BASE_TRAY;
  status: 'playing' | 'won' | 'lost' = 'playing';
  private readonly caps = new Map<CategoryId, number>();

  constructor(level: LevelDef) {
    this.level = level;
    for (const def of level.items) {
      this.defs.set(def.id, def);
      this.place.set(def.id, 'scene');
      this.support.set(def.id, def.on ?? null);
      this.caps.set(def.cat, (this.caps.get(def.cat) ?? 0) + 1);
    }
    this.queue = [...level.queue];
    for (let i = 0; i < MAX_BOXES; i++) this.boxes.push(null);
    for (let i = 0; i < this.boxSlots; i++) this.openNext(i, []);
  }

  def(id: string): ItemDef {
    const d = this.defs.get(id);
    if (!d) throw new Error(`Unknown item ${id}`);
    return d;
  }

  capOf(cat: CategoryId): number {
    return this.caps.get(cat) ?? 0;
  }

  isBlocked(id: string): boolean {
    for (const [other, sup] of this.support) if (sup === id && this.place.get(other) === 'scene') return true;
    return false;
  }

  /** Items resting directly on `id`. */
  coveredBy(id: string): string[] {
    const out: string[] = [];
    for (const [other, sup] of this.support) if (sup === id && this.place.get(other) === 'scene') out.push(other);
    return out;
  }

  freeItems(): string[] {
    const out: string[] = [];
    for (const [id, p] of this.place) if (p === 'scene' && !this.isBlocked(id)) out.push(id);
    return out;
  }

  sceneCount(): number {
    let n = 0;
    for (const p of this.place.values()) if (p === 'scene') n++;
    return n;
  }

  boxFor(cat: CategoryId): number {
    return this.boxes.findIndex((b) => b !== null && b.cat === cat && b.count < b.cap);
  }

  tap(id: string): TapResult {
    if (this.status !== 'playing') return { ok: false, reason: 'over' };
    if (this.place.get(id) !== 'scene') return { ok: false, reason: 'gone' };
    if (this.isBlocked(id)) return { ok: false, reason: 'blocked' };
    const def = this.def(id);
    const slot = this.boxFor(def.cat);
    if (slot < 0 && this.tray.length >= this.traySize) return { ok: false, reason: 'trayFull' };

    const events: GameEvent[] = [];
    this.support.delete(id);
    if (slot >= 0) {
      this.place.set(id, 'box');
      this.boxes[slot]!.count++;
      events.push({ type: 'toBox', item: id, slot });
      this.settle(slot, events);
    } else {
      this.place.set(id, 'tray');
      this.tray.push(id);
      events.push({ type: 'toTray', item: id, index: this.tray.length - 1 });
    }
    this.checkEnd(events);
    return { ok: true, events };
  }

  /** Booster: one more tray slot. */
  addTraySlot(): GameEvent[] | null {
    if (this.traySize >= MAX_TRAY || this.status === 'won') return null;
    this.traySize++;
    this.status = 'playing';
    const events: GameEvent[] = [{ type: 'traySize', size: this.traySize }];
    this.checkEnd(events);
    return events;
  }

  /** Booster: open a third box with the next category in line. */
  addBox(): GameEvent[] | null {
    if (this.boxSlots >= MAX_BOXES || this.queue.length === 0 || this.status === 'won') return null;
    const slot = this.boxSlots++;
    this.status = 'playing';
    const events: GameEvent[] = [];
    this.openNext(slot, events);
    this.checkEnd(events);
    return events;
  }

  /** Booster: put the last few tray items back where they came from. */
  returnItems(): GameEvent[] | null {
    if (this.tray.length === 0 || this.status === 'won') return null;
    this.status = 'playing';
    const events: GameEvent[] = [];
    for (let n = 0; n < RETURN_COUNT && this.tray.length > 0; n++) {
      const from = this.tray.length - 1;
      const id = this.tray.pop()!;
      this.place.set(id, 'scene');
      const support = this.restingPlace(id);
      this.support.set(id, support);
      events.push({ type: 'returned', item: id, from, support });
    }
    this.checkEnd(events);
    return events;
  }

  /** The nearest item still in the scene along the original stacking chain. */
  restingPlace(id: string): string | null {
    let sup = this.def(id).on ?? null;
    while (sup !== null && this.place.get(sup) !== 'scene') sup = this.def(sup).on ?? null;
    return sup;
  }

  /** A free item that fits an open box right now, if any. */
  hint(): string | null {
    for (const id of this.freeItems()) if (this.boxFor(this.def(id).cat) >= 0) return id;
    return null;
  }

  private settle(slot: number, events: GameEvent[]): void {
    const box = this.boxes[slot]!;
    if (box.count < box.cap) return;
    events.push({ type: 'boxDone', slot });
    this.boxes[slot] = null;
    this.openNext(slot, events);
  }

  private openNext(slot: number, events: GameEvent[]): void {
    const cat = this.queue.shift();
    if (!cat) {
      events.push({ type: 'boxGone', slot });
      return;
    }
    const cap = this.capOf(cat);
    this.boxes[slot] = { cat, count: 0, cap };
    events.push({ type: 'boxOpen', slot, cat, cap });
    const keep: string[] = [];
    let pulled = false;
    this.tray.forEach((id, from) => {
      if (this.def(id).cat === cat) {
        this.place.set(id, 'box');
        this.boxes[slot]!.count++;
        events.push({ type: 'trayToBox', item: id, from, slot });
        pulled = true;
      } else keep.push(id);
    });
    if (pulled) {
      this.tray = keep;
      events.push({ type: 'trayCompact', tray: [...keep] });
      this.settle(slot, events);
    }
  }

  private checkEnd(events: GameEvent[]): void {
    if (this.boxes.every((b) => b === null) && this.queue.length === 0) {
      this.status = 'won';
      events.push({ type: 'won' });
      return;
    }
    if (this.tray.length >= this.traySize && this.hint() === null) {
      this.status = 'lost';
      events.push({ type: 'lost' });
    }
  }

  /** Compact signature of the position, for the solver. */
  key(): string {
    const scene: string[] = [];
    for (const [id, p] of this.place) if (p === 'scene') scene.push(id);
    const tray = this.tray.map((id) => this.def(id).cat).sort();
    const boxes = this.boxes.map((b) => (b ? `${b.cat}:${b.count}` : '-'));
    return `${scene.join(',')}|${tray.join(',')}|${boxes.join(',')}|${this.queue.length}|${this.traySize}`;
  }

  clone(): Game {
    const g = Object.create(Game.prototype) as Game;
    Object.assign(g, {
      level: this.level,
      defs: this.defs,
      caps: this.caps,
      place: new Map(this.place),
      support: new Map(this.support),
      boxes: this.boxes.map((b) => (b ? { ...b } : null)),
      boxSlots: this.boxSlots,
      queue: [...this.queue],
      tray: [...this.tray],
      traySize: this.traySize,
      status: this.status,
    });
    return g;
  }
}

/** Depth-first search for a winning tap order without boosters. */
export function solve(level: LevelDef, limit = 200_000): string[] | null {
  const dead = new Set<string>();
  let visits = 0;
  const path: string[] = [];
  const dfs = (g: Game): boolean => {
    if (g.status === 'won') return true;
    if (g.status === 'lost') return false;
    const key = g.key();
    if (dead.has(key) || ++visits > limit) return false;
    // Try box moves first; they never hurt.
    const free = g.freeItems().sort((a, b) => Number(g.boxFor(g.def(b).cat) >= 0) - Number(g.boxFor(g.def(a).cat) >= 0));
    for (const id of free) {
      const next = g.clone();
      if (!next.tap(id).ok) continue;
      path.push(id);
      if (dfs(next)) return true;
      path.pop();
    }
    dead.add(key);
    return false;
  };
  return dfs(new Game(level)) ? path : null;
}

/**
 * Win rate of a casual player: always fills a box when it can, otherwise taps a random
 * free item. A rough difficulty gauge for level design.
 */
export function casualWinRate(level: LevelDef, runs = 400, seed = 1): number {
  let s = seed;
  const rand = () => ((s = (s * 1103515245 + 12345) & 0x7fffffff) / 0x7fffffff);
  let wins = 0;
  for (let r = 0; r < runs; r++) {
    const g = new Game(level);
    while (g.status === 'playing') {
      const fit = g.hint();
      const free = g.freeItems();
      const pick = fit ?? free[Math.floor(rand() * free.length)];
      if (!pick || !g.tap(pick).ok) break;
    }
    if (g.status === 'won') wins++;
  }
  return wins / runs;
}
