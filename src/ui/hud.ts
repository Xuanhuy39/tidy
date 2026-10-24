import { CATEGORIES } from '../game/categories';
import { BOX_COST, SLOT_COST } from '../game/economy';
import { BASE_BOXES, BASE_TRAY, MAX_BOXES, MAX_TRAY, type Box } from '../game/logic';
import type { CategoryId } from '../game/types';
import type { ScreenRect } from '../scene/stage';

export interface HudHandlers {
  onPause: () => void;
  onReturn: () => void;
  onHint: () => void;
  onAddSlot: () => void;
  onAddBox: () => void;
}

export interface TrayEntry {
  url: string;
  cat: CategoryId;
}

const wait = (ms: number) => new Promise<void>((r) => setTimeout(r, ms));

function el<K extends keyof HTMLElementTagNameMap>(tag: K, cls = '', html = ''): HTMLElementTagNameMap[K] {
  const e = document.createElement(tag);
  if (cls) e.className = cls;
  if (html) e.innerHTML = html;
  return e;
}

/** All the 2D interface laid over the 3D room. */
export class Hud {
  readonly root: HTMLElement;
  private readonly title = el('div', 'level-pill');
  private readonly coins = el('div', 'coin-pill', '<i class="coin"></i><span>0</span>');
  private readonly boxEls: HTMLElement[] = [];
  private readonly boxCounts: number[] = [0, 0, 0];
  private readonly boxCaps: number[] = [0, 0, 0];
  private readonly trayEl = el('div', 'tray');
  private readonly slotEls: HTMLElement[] = [];
  private readonly nextEl = el('div', 'next-up');
  readonly top = el('div', 'hud-top');
  readonly bottom = el('div', 'hud-bottom');
  private readonly returnBtn: HTMLButtonElement;
  private readonly hintBtn: HTMLButtonElement;
  private readonly toastEl = el('div', 'toast');
  private toastTimer = 0;
  private traySize = BASE_TRAY;
  private boxSlots = BASE_BOXES;

  constructor(root: HTMLElement, private readonly h: HudHandlers) {
    this.root = root;
    const bar = el('div', 'topbar');
    const pause = el('button', 'round-btn', '<svg viewBox="0 0 24 24"><rect x="6" y="5" width="4" height="14" rx="1.5"/><rect x="14" y="5" width="4" height="14" rx="1.5"/></svg>');
    pause.setAttribute('aria-label', 'Pause');
    pause.onclick = () => h.onPause();
    bar.append(pause, this.title, this.coins);

    const boxes = el('div', 'boxes');
    for (let i = 0; i < MAX_BOXES; i++) {
      const b = el('div', 'box');
      boxes.append(b);
      this.boxEls.push(b);
    }
    for (let i = 0; i < MAX_TRAY; i++) {
      const s = el('div', 'slot');
      this.trayEl.append(s);
      this.slotEls.push(s);
    }
    this.top.append(bar, boxes, this.nextEl, this.trayEl);

    this.returnBtn = this.booster('↩', 'Return', () => h.onReturn());
    this.hintBtn = this.booster('💡', 'Hint', () => h.onHint());
    this.bottom.append(this.returnBtn, this.hintBtn);
    root.append(this.top, this.bottom, this.toastEl);
  }

  private booster(icon: string, label: string, on: () => void): HTMLButtonElement {
    const b = el('button', 'booster', `<span class="b-icon">${icon}</span><span class="b-label">${label}</span><span class="badge">0</span>`);
    b.onclick = on;
    return b;
  }

  setup(levelNo: number, name: string, boxes: (Box | null)[], traySize: number, boxSlots: number): void {
    this.title.textContent = `Level ${levelNo} · ${name}`;
    this.traySize = traySize;
    this.boxSlots = boxSlots;
    for (let i = 0; i < MAX_BOXES; i++) this.drawBox(i, boxes[i]);
    this.setTray([]);
  }

  setVisible(on: boolean): void {
    this.top.classList.toggle('hidden', !on);
    this.bottom.classList.toggle('hidden', !on);
  }

  // ---------- Boxes ----------

  private drawBox(slot: number, box: Box | null): void {
    const e = this.boxEls[slot];
    e.className = 'box';
    e.onclick = null;
    if (slot >= this.boxSlots) {
      e.classList.add('locked');
      e.innerHTML = `<div class="lock-inner"><span class="plus">+</span><span>Extra box</span><span class="price"><i class="coin"></i>${BOX_COST}</span></div>`;
      e.onclick = () => this.h.onAddBox();
      return;
    }
    if (!box) {
      e.classList.add('empty');
      e.innerHTML = `<div class="done-mark">✓</div>`;
      return;
    }
    const info = CATEGORIES[box.cat];
    this.boxCounts[slot] = box.count;
    this.boxCaps[slot] = box.cap;
    e.style.setProperty('--cat', info.color);
    e.innerHTML = `
      <div class="box-lid"></div>
      <div class="box-body">
        <div class="box-label"><span class="box-icon">${info.icon}</span>${info.name}</div>
        <div class="box-count">${box.count}/${box.cap}</div>
      </div>
      <div class="box-flaps"></div>`;
  }

  boxTarget(slot: number): HTMLElement {
    return this.boxEls[slot].querySelector('.box-body') ?? this.boxEls[slot];
  }

  bumpBox(slot: number): void {
    this.boxCounts[slot]++;
    const e = this.boxEls[slot];
    const c = e.querySelector('.box-count');
    if (c) c.textContent = `${this.boxCounts[slot]}/${this.boxCaps[slot]}`;
    e.classList.remove('bump');
    void e.offsetWidth;
    e.classList.add('bump');
  }

  async boxComplete(slot: number): Promise<void> {
    const e = this.boxEls[slot];
    e.classList.add('closing');
    await wait(260);
    const nice = el('div', 'nice', pick(['Nice!', 'Great!', 'Tidy!', 'Super!']));
    const r = e.getBoundingClientRect();
    nice.style.left = `${r.left + r.width / 2}px`;
    nice.style.top = `${r.top + r.height / 2}px`;
    this.root.append(nice);
    for (let i = 0; i < 8; i++) {
      const s = el('div', 'spark', '★');
      s.style.left = `${r.left + r.width / 2}px`;
      s.style.top = `${r.top + r.height / 2}px`;
      const a = (i / 8) * Math.PI * 2;
      s.style.setProperty('--dx', `${Math.cos(a) * 60}px`);
      s.style.setProperty('--dy', `${Math.sin(a) * 45}px`);
      this.root.append(s);
      setTimeout(() => s.remove(), 700);
    }
    setTimeout(() => nice.remove(), 900);
    await wait(380);
    e.classList.add('leaving');
    await wait(260);
  }

  async boxOpen(slot: number, box: Box): Promise<void> {
    this.drawBox(slot, { ...box, count: 0 });
    const e = this.boxEls[slot];
    e.classList.add('arriving');
    await wait(320);
    e.classList.remove('arriving');
  }

  boxGone(slot: number): void {
    this.drawBox(slot, null);
  }

  unlockBox(slots: number): void {
    this.boxSlots = slots;
  }

  setNext(cat: CategoryId | null, remaining: number): void {
    if (!cat) {
      this.nextEl.innerHTML = remaining === 0 ? '<span>Last boxes!</span>' : '<span>All tidy! ✨</span>';
      return;
    }
    const info = CATEGORIES[cat];
    this.nextEl.innerHTML = `<span>Up next:</span> <b style="color:${info.color}">${info.icon} ${info.name}</b>${remaining > 1 ? ` <span class="more">+${remaining - 1} more</span>` : ''}`;
  }

  // ---------- Tray ----------

  setTray(items: TrayEntry[]): void {
    this.slotEls.forEach((s, i) => {
      s.className = 'slot';
      s.onclick = null;
      s.innerHTML = '';
      if (i >= this.traySize) {
        s.classList.add('locked');
        s.innerHTML = `<span class="plus">+</span><span class="price"><i class="coin"></i>${SLOT_COST}</span>`;
        s.onclick = () => this.h.onAddSlot();
      } else if (items[i]) this.fillSlot(i, items[i]);
    });
    this.updateTrayWarn(items.length);
  }

  setTraySize(size: number, count: number): void {
    this.traySize = size;
    const s = this.slotEls[size - 1];
    s.className = 'slot unlocking';
    s.innerHTML = '';
    s.onclick = null;
    this.updateTrayWarn(count);
  }

  slotEl(i: number): HTMLElement {
    return this.slotEls[i];
  }

  reserveSlot(i: number): void {
    this.slotEls[i].classList.add('reserved');
  }

  fillSlot(i: number, entry: TrayEntry): void {
    const s = this.slotEls[i];
    s.className = 'slot filled';
    s.style.setProperty('--cat', CATEGORIES[entry.cat].color);
    s.innerHTML = `<img src="${entry.url}" alt=""><i class="tag"></i>`;
  }

  clearSlot(i: number): void {
    const s = this.slotEls[i];
    s.className = 'slot';
    s.innerHTML = '';
  }

  updateTrayWarn(count: number): void {
    this.trayEl.classList.toggle('warn', count >= this.traySize - 1 && count > 0);
    this.trayEl.classList.toggle('full', count >= this.traySize);
  }

  shakeTray(): void {
    this.trayEl.classList.remove('shake');
    void this.trayEl.offsetWidth;
    this.trayEl.classList.add('shake');
  }

  // ---------- Boosters / misc ----------

  setBoosters(returns: number, hints: number, canReturn: boolean): void {
    this.returnBtn.querySelector('.badge')!.textContent = String(returns);
    this.hintBtn.querySelector('.badge')!.textContent = String(hints);
    this.returnBtn.classList.toggle('disabled', returns <= 0 || !canReturn);
    this.hintBtn.classList.toggle('disabled', hints <= 0);
  }

  /** Show the coin balance; a non-zero `change` floats a "+/-N" next to it. */
  setCoins(total: number, change = 0): void {
    this.coins.querySelector('span')!.textContent = total.toLocaleString('en-US');
    if (!change) return;
    this.coins.classList.remove('bump');
    void this.coins.offsetWidth;
    this.coins.classList.add('bump');
    const r = this.coins.getBoundingClientRect();
    const f = el('div', `coin-float ${change < 0 ? 'spend' : 'earn'}`, `${change > 0 ? '+' : '−'}${Math.abs(change)}`);
    f.style.left = `${r.left + r.width / 2}px`;
    f.style.top = `${r.bottom + 4}px`;
    this.root.append(f);
    setTimeout(() => f.remove(), 900);
  }

  shakeCoins(): void {
    this.coins.classList.remove('shake');
    void this.coins.offsetWidth;
    this.coins.classList.add('shake');
  }

  toast(msg: string, ms = 1600): void {
    this.toastEl.textContent = msg;
    this.toastEl.classList.add('show');
    clearTimeout(this.toastTimer);
    this.toastTimer = window.setTimeout(() => this.toastEl.classList.remove('show'), ms);
  }

  /** Fly an item picture from a screen rect to an element. */
  async fly(url: string, from: ScreenRect, to: HTMLElement | ScreenRect, dur = 430): Promise<void> {
    const img = el('img', 'flyer');
    img.src = url;
    const size0 = Math.max(36, Math.min(110, Math.max(from.w, from.h)));
    const t = to instanceof HTMLElement ? to.getBoundingClientRect() : { left: to.x, top: to.y, width: to.w, height: to.h };
    const size1 = Math.min(t.width, t.height) * 0.86;
    const x0 = from.x + from.w / 2 - size0 / 2;
    const y0 = from.y + from.h / 2 - size0 / 2;
    const x1 = t.left + t.width / 2 - size0 / 2;
    const y1 = t.top + t.height / 2 - size0 / 2;
    const s1 = size1 / size0;
    const lift = Math.min(120, Math.abs(y1 - y0) * 0.35 + 40);
    img.style.width = img.style.height = `${size0}px`;
    this.root.append(img);
    const anim = img.animate(
      [
        { transform: `translate(${x0}px, ${y0}px) scale(1)` },
        { transform: `translate(${(x0 + x1) / 2}px, ${Math.min(y0, y1) - lift}px) scale(${(1 + s1) / 2 + 0.1}) rotate(-8deg)`, offset: 0.5 },
        { transform: `translate(${x1}px, ${y1}px) scale(${s1})` },
      ],
      { duration: dur, easing: 'cubic-bezier(.45,.05,.4,1)', fill: 'forwards' },
    );
    await anim.finished.catch(() => undefined);
    img.remove();
  }
}

function pick<T>(list: T[]): T {
  return list[Math.floor(Math.random() * list.length)];
}

// ---------- Overlays ----------

export interface OverlayButton {
  label: string;
  kind?: 'primary' | 'secondary' | 'ghost';
  onClick: () => void;
  disabled?: boolean;
}

export function overlay(root: HTMLElement, html: string, buttons: OverlayButton[], cls = ''): () => void {
  const wrap = el('div', `overlay ${cls}`);
  const card = el('div', 'card', html);
  const row = el('div', 'card-buttons');
  for (const b of buttons) {
    const btn = el('button', `btn ${b.kind ?? 'primary'}`, b.label);
    if (b.disabled) btn.disabled = true;
    btn.onclick = () => b.onClick();
    row.append(btn);
  }
  if (buttons.length) card.append(row);
  wrap.append(card);
  root.append(wrap);
  requestAnimationFrame(() => wrap.classList.add('show'));
  return () => {
    wrap.classList.remove('show');
    setTimeout(() => wrap.remove(), 220);
  };
}
