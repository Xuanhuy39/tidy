import { describe, expect, it } from 'vitest';
import { casualWinRate, Game, solve } from '../src/game/logic';
import { LEVELS } from '../src/game/levels';
import type { LevelDef } from '../src/game/types';

const tiny: LevelDef = {
  id: 't',
  name: 'Tiny',
  room: 'study',
  queue: ['snacks', 'stationery', 'electronics'],
  items: [
    { id: 'n', kind: 'notebook', cat: 'stationery', surface: 'desk', x: 0, z: 0 },
    { id: 'p', kind: 'phone', cat: 'electronics', on: 'n', x: 0, z: 0 },
    { id: 'c', kind: 'cookie', cat: 'snacks', surface: 'desk', x: 0, z: 0 },
    { id: 'r', kind: 'ruler', cat: 'stationery', surface: 'desk', x: 0, z: 0 },
  ],
};

describe('rules', () => {
  it('opens the first two categories with caps from the item counts', () => {
    const g = new Game(tiny);
    expect(g.boxes.slice(0, 2)).toEqual([
      { cat: 'snacks', count: 0, cap: 1 },
      { cat: 'stationery', count: 0, cap: 2 },
    ]);
    expect(g.boxes[2]).toBeNull();
  });

  it('refuses items with something on top', () => {
    const g = new Game(tiny);
    expect(g.tap('n')).toEqual({ ok: false, reason: 'blocked' });
    expect(g.coveredBy('n')).toEqual(['p']);
  });

  it('sends unmatched items to the tray and pulls them into a new box', () => {
    const g = new Game(tiny);
    const r1 = g.tap('p');
    expect(r1.ok && r1.events).toEqual([{ type: 'toTray', item: 'p', index: 0 }]);
    const r2 = g.tap('c');
    expect(r2.ok && r2.events.map((e) => e.type)).toEqual(['toBox', 'boxDone', 'boxOpen', 'trayToBox', 'trayCompact', 'boxDone', 'boxGone']);
    expect(g.tray).toEqual([]);
    g.tap('n');
    const r3 = g.tap('r');
    expect(r3.ok && r3.events.at(-1)).toEqual({ type: 'won' });
    expect(g.status).toBe('won');
  });

  it('loses as soon as the tray is full', () => {
    const level: LevelDef = {
      ...tiny,
      queue: ['snacks', 'stationery', 'electronics'],
      items: [
        { id: 's', kind: 'cookie', cat: 'snacks', surface: 'desk', x: 0, z: 0 },
        ...[1, 2, 3, 4, 5].map((i) => ({ id: `e${i}`, kind: 'phone', cat: 'electronics' as const, surface: 'desk', x: 0, z: 0 })),
        { id: 't', kind: 'ruler', cat: 'stationery', surface: 'desk', x: 0, z: 0 },
        { id: 'u', kind: 'cookie', cat: 'snacks', on: 't', x: 0, z: 0 },
      ],
    };
    const g = new Game(level);
    for (let i = 1; i <= 4; i++) g.tap(`e${i}`);
    expect(g.status).toBe('playing');
    const last = g.tap('e5');
    expect(last.ok && last.events.at(-1)).toEqual({ type: 'lost' });
    expect(g.status).toBe('lost'); // even though the snack would still fit
    expect(g.tap('s')).toEqual({ ok: false, reason: 'over' });
    // A booster slot gets you going again.
    expect(g.addTraySlot()).toEqual([{ type: 'traySize', size: 6 }]);
    expect(g.status).toBe('playing');
  });

  it('boosters: extra slot, extra box and return', () => {
    const g = new Game(tiny);
    g.tap('p');
    expect(g.returnItems()).toEqual([{ type: 'returned', item: 'p', from: 0, support: 'n' }]);
    expect(g.isBlocked('n')).toBe(true);
    expect(g.addTraySlot()).toEqual([{ type: 'traySize', size: 6 }]);
    const ev = g.addBox();
    expect(ev?.[0]).toEqual({ type: 'boxOpen', slot: 2, cat: 'electronics', cap: 1 });
    expect(g.addBox()).toBeNull();
  });

  it('returned items drop onto whatever is still below them', () => {
    const level: LevelDef = {
      ...tiny,
      items: [
        { id: 'a', kind: 'notebook', cat: 'stationery', surface: 'desk', x: 0, z: 0 },
        { id: 'b', kind: 'cookie', cat: 'snacks', on: 'a', x: 0, z: 0 },
        { id: 'c', kind: 'phone', cat: 'electronics', on: 'b', x: 0, z: 0 },
        { id: 'd', kind: 'ruler', cat: 'stationery', surface: 'desk', x: 0, z: 0 },
        { id: 'e', kind: 'cookie', cat: 'snacks', surface: 'desk', x: 0, z: 0 },
      ],
    };
    const g = new Game(level);
    g.tap('c');
    g.tap('b');
    g.returnItems();
    expect(g.support.get('c')).toBe('a');
  });
});

describe('levels', () => {
  for (const level of LEVELS) {
    describe(level.name, () => {
      it('has unique ids, known supports and every queued category present', () => {
        const ids = new Set(level.items.map((i) => i.id));
        expect(ids.size).toBe(level.items.length);
        for (const i of level.items) {
          if (i.on) expect(ids.has(i.on), `${i.id} on ${i.on}`).toBe(true);
          expect(Boolean(i.on) !== Boolean(i.surface), `${i.id} needs exactly one of on/surface`).toBe(true);
          expect(level.queue).toContain(i.cat);
        }
        for (const c of level.queue) expect(level.items.some((i) => i.cat === c)).toBe(true);
      });

      it('can be won without boosters', () => {
        expect(solve(level)).not.toBeNull();
      });

      it('reports casual win rate', () => {
        const rate = casualWinRate(level);
        console.log(`${level.name}: ${level.items.length} items, casual win rate ${(rate * 100).toFixed(0)}%`);
        expect(rate).toBeGreaterThan(0);
      });
    });
  }
});
