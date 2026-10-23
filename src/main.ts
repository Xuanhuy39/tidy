import '@fontsource/fredoka/400.css';
import '@fontsource/fredoka/500.css';
import '@fontsource/fredoka/600.css';
import '@fontsource/fredoka/700.css';
import './style.css';
import { sfx } from './audio';
import { CATEGORIES } from './game/categories';
import { LEVELS } from './game/levels';
import { Game, MAX_BOXES, MAX_TRAY, type GameEvent } from './game/logic';
import type { LevelDef } from './game/types';
import { loadProgress, saveProgress } from './progress';
import { Stage } from './scene/stage';
import { Thumbs } from './scene/thumbs';
import { Hud, overlay, starsHtml } from './ui/hud';

const RETURNS_PER_LEVEL = 2;
const HINTS_PER_LEVEL = 3;

const canvas = document.getElementById('scene') as HTMLCanvasElement;
const hudRoot = document.getElementById('hud')!;
const stage = new Stage(canvas);
const thumbs = new Thumbs();
const progress = loadProgress();
sfx.muted = progress.muted;
const params = new URLSearchParams(location.search);

let game: Game;
let levelIndex = 0;
let busy = false;
let flights: Promise<void>[] = [];
let returnsLeft = RETURNS_PER_LEVEL;
let hintsLeft = HINTS_PER_LEVEL;
let boostersUsed = 0;
let startTime = 0;
let elapsed = 0;
let running = false;
let closeOverlay: (() => void) | null = null;
let hintTimer = 0;
let blockedTips = 0;

const hud = new Hud(hudRoot, {
  onPause: () => !busy && showPause(),
  onReturn: () => useReturn(),
  onHint: () => useHint(),
  onAddSlot: () => useSlot(),
  onAddBox: () => useBox(),
});

const thumb = (id: string) => {
  const d = game.def(id);
  return thumbs.get(d.kind, d.variant ?? 0);
};

// ---------- Layout ----------

const wide = window.matchMedia('(min-width: 900px) and (min-aspect-ratio: 5/4)');
wide.addEventListener('change', () => layout());

function layout(): void {
  const w = window.innerWidth;
  const h = window.innerHeight;
  if (wide.matches) {
    const hidden = hud.top.classList.contains('hidden');
    const left = hidden ? 0 : hud.top.getBoundingClientRect().right + 24;
    stage.resize(w, h, { x: left, y: 24, w: w - left - 24, h: h - 48 });
    return;
  }
  const top = hud.top.classList.contains('hidden') ? 0 : hud.top.getBoundingClientRect().bottom + 6;
  const bottom = hud.bottom.classList.contains('hidden') ? h : hud.bottom.getBoundingClientRect().top - 4;
  stage.resize(w, h, { x: 8, y: top, w: w - 16, h: Math.max(100, bottom - top) });
}
window.addEventListener('resize', layout);

// ---------- Level flow ----------

function startLevel(index: number): void {
  closeOverlay?.();
  closeOverlay = null;
  levelIndex = index;
  const level: LevelDef = LEVELS[index];
  game = new Game(level);
  stage.load(level);
  returnsLeft = RETURNS_PER_LEVEL;
  hintsLeft = HINTS_PER_LEVEL;
  boostersUsed = 0;
  elapsed = 0;
  running = false;
  busy = false;
  flights = [];
  hud.setVisible(true);
  hud.setup(index + 1, level.name, game.boxes, game.traySize, game.boxSlots);
  refreshSide();
  layout();
  // Warm the thumbnail cache so the first flights don't stutter.
  for (const d of level.items) thumbs.get(d.kind, d.variant ?? 0);
  hud.toast(index === 0 ? 'Tap items to sort them into boxes!' : `Level ${index + 1}: ${level.name}`, 2200);
}

function refreshSide(): void {
  if (game.status === 'won') return;
  hud.setNext(game.queue[0] ?? null, game.queue.length);
  hud.setBoosters(returnsLeft, hintsLeft, game.tray.length > 0);
  hud.updateTrayWarn(game.tray.length);
}

function starsFor(used: number): number {
  return used === 0 ? 3 : used <= 2 ? 2 : 1;
}

// ---------- Input ----------

let downAt: { x: number; y: number; id: number } | null = null;

canvas.addEventListener('pointerdown', (e) => {
  sfx.unlock();
  downAt = { x: e.clientX, y: e.clientY, id: e.pointerId };
});

canvas.addEventListener('pointerup', (e) => {
  if (!downAt || downAt.id !== e.pointerId) return;
  const moved = Math.hypot(e.clientX - downAt.x, e.clientY - downAt.y);
  downAt = null;
  if (moved > 14 || closeOverlay) return;
  const id = stage.pick(e.clientX, e.clientY);
  if (id) void tapItem(id);
});

canvas.addEventListener('pointermove', (e) => {
  if (e.pointerType !== 'mouse' || closeOverlay) return;
  const id = busy ? null : stage.pick(e.clientX, e.clientY);
  stage.setHover(id);
  canvas.style.cursor = id ? 'pointer' : 'default';
});

hudRoot.addEventListener('pointerdown', () => sfx.unlock());

async function tapItem(id: string): Promise<void> {
  if (busy || !game || game.status !== 'playing') return;
  const res = game.tap(id);
  if (!res.ok) {
    if (res.reason === 'blocked') {
      sfx.blocked();
      if (blockedTips++ < 3) hud.toast('Clear what’s on top first!');
      void stage.shake(id, game.coveredBy(id));
    } else if (res.reason === 'trayFull') {
      sfx.blocked();
      hud.shakeTray();
      hud.toast('Tray is full!');
    }
    return;
  }
  if (!running) {
    running = true;
    startTime = performance.now() - elapsed * 1000;
  }
  clearHint();
  sfx.pick();
  const events = res.events;
  const first = events[0];
  const needsSequence = events.length > 1;
  if (needsSequence) busy = true;

  const url = thumb(id);
  if (first.type === 'toTray') hud.reserveSlot(first.index);
  const flight = (async () => {
    const rect = await stage.lift(id);
    if (first.type === 'toBox') {
      await hud.fly(url, rect, hud.boxTarget(first.slot));
      hud.bumpBox(first.slot);
      sfx.box();
    } else if (first.type === 'toTray') {
      await hud.fly(url, rect, hud.slotEl(first.index));
      hud.fillSlot(first.index, { url, cat: game.def(id).cat });
      sfx.tray();
      if (game.status === 'playing' && game.tray.length === game.traySize - 1) hud.toast('Careful — one tray slot left!');
    }
  })();
  flights.push(flight);
  void flight.then(() => (flights = flights.filter((f) => f !== flight)));
  refreshSide();

  if (needsSequence) {
    await Promise.all(flights);
    await playEvents(events.slice(1));
    busy = false;
    refreshSide();
  }
}

/** Animate the aftermath of an action in order. */
async function playEvents(events: GameEvent[]): Promise<void> {
  let pending: Promise<void>[] = [];
  const flush = async () => {
    await Promise.all(pending);
    pending = [];
  };
  for (const ev of events) {
    if (ev.type !== 'trayToBox' && ev.type !== 'returned') await flush();
    switch (ev.type) {
      case 'boxDone':
        sfx.complete();
        await hud.boxComplete(ev.slot);
        break;
      case 'boxOpen':
        sfx.open();
        await hud.boxOpen(ev.slot, { cat: ev.cat, count: 0, cap: ev.cap });
        break;
      case 'boxGone':
        hud.boxGone(ev.slot);
        break;
      case 'trayToBox': {
        const from = hud.slotEl(ev.from);
        const r = from.getBoundingClientRect();
        const url = thumb(ev.item);
        hud.clearSlot(ev.from);
        const delay = pending.length * 70;
        pending.push(
          (async () => {
            await new Promise((res) => setTimeout(res, delay));
            await hud.fly(url, { x: r.left, y: r.top, w: r.width, h: r.height }, hud.boxTarget(ev.slot), 380);
            hud.bumpBox(ev.slot);
            sfx.box();
          })(),
        );
        break;
      }
      case 'trayCompact':
        hud.setTray(ev.tray.map((id) => ({ url: thumb(id), cat: game.def(id).cat })));
        break;
      case 'returned': {
        const from = hud.slotEl(ev.from);
        const r = from.getBoundingClientRect();
        const url = thumb(ev.item);
        hud.clearSlot(ev.from);
        const target = stage.screenRect(ev.item);
        pending.push(
          (async () => {
            await hud.fly(url, { x: r.left, y: r.top, w: r.width, h: r.height }, target, 340);
            await stage.restore(ev.item, ev.support);
          })(),
        );
        break;
      }
      case 'traySize':
        hud.setTraySize(ev.size, game.tray.length);
        break;
      case 'won':
        await wait(250);
        showWin();
        break;
      case 'lost':
        await wait(300);
        showLose();
        break;
      case 'toBox':
      case 'toTray':
        break;
    }
  }
  await flush();
}

const wait = (ms: number) => new Promise<void>((r) => setTimeout(r, ms));

// ---------- Boosters ----------

async function runBooster(events: GameEvent[] | null, cost = true): Promise<boolean> {
  if (!events) return false;
  closeOverlay?.();
  closeOverlay = null;
  sfx.booster();
  if (cost) boostersUsed++;
  busy = true;
  await Promise.all(flights);
  await playEvents(events);
  busy = false;
  refreshSide();
  return true;
}

async function useReturn(): Promise<void> {
  if (busy && !closeOverlay) return;
  if (returnsLeft <= 0) return hud.toast('No returns left');
  if (game.tray.length === 0) return hud.toast('The tray is empty');
  returnsLeft--;
  await runBooster(game.returnItems());
}

async function useSlot(): Promise<void> {
  if (busy && !closeOverlay) return;
  if (game.traySize >= MAX_TRAY) return;
  await runBooster(game.addTraySlot());
  hud.toast('+1 tray slot');
}

async function useBox(): Promise<void> {
  if (busy && !closeOverlay) return;
  if (game.boxSlots >= MAX_BOXES) return;
  if (game.queue.length === 0) return hud.toast('No more boxes to open');
  hud.unlockBox(game.boxSlots + 1);
  await runBooster(game.addBox());
}

function useHint(): void {
  if (busy) return;
  if (hintsLeft <= 0) return hud.toast('No hints left');
  // Prefer an item that fits a box; otherwise something that uncovers one.
  let id = game.hint();
  if (!id) {
    const free = game.freeItems();
    id = free.find((f) => {
      const sup = game.support.get(f);
      return sup && game.boxFor(game.def(sup).cat) >= 0;
    }) ?? null;
  }
  if (!id) return hud.toast('No good move — try a booster');
  // Hints don't cost stars; they only point at a move.
  hintsLeft--;
  stage.setHint(id);
  clearTimeout(hintTimer);
  hintTimer = window.setTimeout(clearHint, 5000);
  refreshSide();
}

function clearHint(): void {
  clearTimeout(hintTimer);
  stage.setHint(null);
}

// ---------- Screens ----------

function showMenu(): void {
  closeOverlay?.();
  hud.setVisible(false);
  running = false;
  stage.load(LEVELS[Math.min(levelIndex, LEVELS.length - 1)]);
  layout();
  const cards = LEVELS.map((l, i) => {
    const unlocked = i === 0 || (progress.stars[LEVELS[i - 1].id] ?? 0) > 0 || params.has('unlock');
    const stars = progress.stars[l.id] ?? 0;
    const cats = l.queue.map((c) => CATEGORIES[c].icon).join(' ');
    return `<button class="level-card" data-i="${i}" ${unlocked ? '' : 'disabled'}>
      <span class="num">${unlocked ? i + 1 : '🔒'}</span>
      <span class="info"><div class="lname">${l.name}</div><div class="lsub">${l.items.length} items · ${cats}</div></span>
      <span class="lstars">${'★'.repeat(stars)}<span class="off">${'★'.repeat(3 - stars)}</span></span>
    </button>`;
  }).join('');
  closeOverlay = overlay(
    hudRoot,
    `<div class="logo">Tidy Up!</div>
     <p class="tagline">A cozy sorting puzzle</p>
     <div class="level-list">${cards}</div>
     <div class="how">Tap items to drop them into matching boxes. Items with nothing to go in wait in the tray — if the tray fills up, you lose! Things underneath can't be picked until what's on top is cleared.</div>
     <button class="sound-toggle">${sfx.muted ? '🔇 Sound off' : '🔊 Sound on'}</button>`,
    [],
    'menu',
  );
  const card = hudRoot.querySelector('.overlay.menu')!;
  card.querySelectorAll<HTMLButtonElement>('.level-card').forEach((b) => {
    b.onclick = () => {
      sfx.unlock();
      sfx.click();
      startLevel(Number(b.dataset.i));
    };
  });
  const toggle = card.querySelector<HTMLButtonElement>('.sound-toggle')!;
  toggle.onclick = () => {
    sfx.unlock();
    sfx.muted = !sfx.muted;
    progress.muted = sfx.muted;
    saveProgress(progress);
    toggle.textContent = sfx.muted ? '🔇 Sound off' : '🔊 Sound on';
  };
}

function showPause(): void {
  if (closeOverlay) return;
  const wasRunning = running;
  running = false;
  sfx.click();
  const resume = () => {
    closeOverlay?.();
    closeOverlay = null;
    if (wasRunning) {
      running = true;
      startTime = performance.now() - elapsed * 1000;
    }
  };
  closeOverlay = overlay(hudRoot, `<h2>Paused</h2><p>${LEVELS[levelIndex].name}</p>`, [
    { label: 'Resume', onClick: resume },
    { label: 'Restart level', kind: 'secondary', onClick: () => startLevel(levelIndex) },
    {
      label: sfx.muted ? 'Sound: off' : 'Sound: on',
      kind: 'ghost',
      onClick: () => {
        sfx.muted = !sfx.muted;
        progress.muted = sfx.muted;
        saveProgress(progress);
        const btn = hudRoot.querySelectorAll<HTMLButtonElement>('.overlay .btn.ghost')[0];
        if (btn) btn.textContent = sfx.muted ? 'Sound: off' : 'Sound: on';
      },
    },
    { label: 'Level select', kind: 'ghost', onClick: showMenu },
  ]);
}

function showWin(): void {
  running = false;
  sfx.win();
  hud.setNext(null, -1);
  const level = LEVELS[levelIndex];
  const stars = starsFor(boostersUsed);
  progress.stars[level.id] = Math.max(progress.stars[level.id] ?? 0, stars);
  saveProgress(progress);
  const last = levelIndex === LEVELS.length - 1;
  const t = Math.floor(elapsed);
  closeOverlay = overlay(
    hudRoot,
    `<h2>Room tidied!</h2>${starsHtml(stars)}
     <div class="stat-row"><span>⏱ ${Math.floor(t / 60)}:${String(t % 60).padStart(2, '0')}</span><span>🧺 ${level.items.length} items</span></div>
     <p>${stars === 3 ? 'Perfect — no boosters needed!' : 'Finish without boosters for 3 stars.'}</p>
     ${last ? '<p><b>You cleaned every room!</b> More rooms coming soon.</p>' : ''}`,
    [
      last ? { label: 'Level select', onClick: showMenu } : { label: 'Next level', onClick: () => startLevel(levelIndex + 1) },
      { label: 'Play again', kind: 'ghost', onClick: () => startLevel(levelIndex) },
    ],
  );
}

function showLose(): void {
  running = false;
  sfx.lose();
  const canSlot = game.traySize < MAX_TRAY;
  // An extra box only rescues you if the next category pulls something out of the tray.
  const canBox = game.boxSlots < MAX_BOXES && game.tray.some((id) => game.def(id).cat === game.queue[0]);
  const canReturn = returnsLeft > 0 && game.tray.length > 0;
  const resumeTimer = () => {
    running = true;
    startTime = performance.now() - elapsed * 1000;
  };
  closeOverlay = overlay(hudRoot, `<h2>Tray full!</h2><p>Every tray slot is taken. Use a booster to keep going, or try again.</p>`, [
    ...(canSlot ? [{ label: '+1 Tray slot', kind: 'secondary' as const, onClick: () => void useSlot().then(resumeTimer) }] : []),
    ...(canReturn ? [{ label: `↩ Return 3 items (${returnsLeft} left)`, kind: 'secondary' as const, onClick: () => void useReturn().then(resumeTimer) }] : []),
    ...(canBox ? [{ label: '+ Extra box', kind: 'secondary' as const, onClick: () => void useBox().then(resumeTimer) }] : []),
    { label: 'Try again', onClick: () => startLevel(levelIndex) },
    { label: 'Level select', kind: 'ghost', onClick: showMenu },
  ]);
}

// ---------- Loop ----------

function frame(now: number): void {
  if (running) {
    elapsed = (now - startTime) / 1000;
    hud.setTimer(elapsed);
  }
  stage.frame(now);
  requestAnimationFrame(frame);
}

if (import.meta.env.DEV) Object.assign(window, { __tidy: { stage, game: () => game, tapItem } });

const direct = Number(params.get('level'));
if (direct >= 1 && direct <= LEVELS.length) startLevel(direct - 1);
else showMenu();
requestAnimationFrame(frame);
