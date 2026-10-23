import * as THREE from 'three';
import { OutlineEffect } from 'three/examples/jsm/effects/OutlineEffect.js';
import type { LevelDef } from '../game/types';
import { grounded } from './kit';
import { MODELS } from './models';
import { buildRoom, type Room } from './rooms';

export interface ScreenRect {
  x: number;
  y: number;
  w: number;
  h: number;
}

interface Tween {
  start: number;
  dur: number;
  update: (k: number) => void;
  resolve: () => void;
}

interface ItemView {
  root: THREE.Group;
  model: THREE.Object3D;
  proxy: THREE.Mesh;
  height: number;
  mats: THREE.MeshToonMaterial[];
}

const OUTLINE = { defaultThickness: 0.0032, defaultColor: [0.24, 0.16, 0.12], defaultAlpha: 1 };
const ITEM_SCALE = 1.15;
const easeOut = (k: number) => 1 - (1 - k) ** 3;
const easeInOut = (k: number) => (k < 0.5 ? 4 * k ** 3 : 1 - (-2 * k + 2) ** 3 / 2);

export function buildItemModel(kind: string, variant = 0): THREE.Object3D {
  const build = MODELS[kind];
  if (!build) throw new Error(`No model for ${kind}`);
  return grounded(build(variant));
}

/** The 3D room: renders, frames the camera, picks items and animates them. */
export class Stage {
  readonly renderer: THREE.WebGLRenderer;
  private readonly effect: OutlineEffect;
  private readonly scene = new THREE.Scene();
  private readonly camera = new THREE.OrthographicCamera(-10, 10, 10, -10, 0.1, 300);
  private readonly raycaster = new THREE.Raycaster();
  private readonly world = new THREE.Group();
  private readonly sun: THREE.DirectionalLight;
  private room: Room | null = null;
  private level: LevelDef | null = null;
  private readonly items = new Map<string, ItemView>();
  private tweens: Tween[] = [];
  private hovered: string | null = null;
  private hinted: string | null = null;
  private time = 0;
  private fitRect: ScreenRect = { x: 0, y: 0, w: 1, h: 1 };

  constructor(canvas: HTMLCanvasElement) {
    this.renderer = new THREE.WebGLRenderer({ canvas, antialias: true });
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    this.renderer.outputColorSpace = THREE.SRGBColorSpace;
    this.renderer.shadowMap.enabled = true;
    this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    this.effect = new OutlineEffect(this.renderer, OUTLINE);

    this.scene.add(this.world);
    this.scene.add(new THREE.HemisphereLight(0xfff6e8, 0xd9b48a, 1.6));
    this.sun = new THREE.DirectionalLight(0xfff1d6, 2.2);
    this.sun.castShadow = true;
    this.sun.shadow.mapSize.set(2048, 2048);
    Object.assign(this.sun.shadow.camera, { left: -13, right: 13, top: 13, bottom: -13, near: 1, far: 80 });
    this.sun.shadow.bias = -0.0006;
    this.sun.shadow.normalBias = 0.03;
    this.scene.add(this.sun, this.sun.target);

    const dir = new THREE.Vector3(1, 1.25, 1.1).normalize();
    this.camera.userData.dir = dir;
  }

  load(level: LevelDef): void {
    this.clear();
    this.level = level;
    const room = buildRoom(level.room);
    this.room = room;
    this.scene.background = new THREE.Color(room.background);
    room.group.traverse((o) => {
      // Big flat pieces shouldn't throw shadows over the whole room.
      const m = o as THREE.Mesh;
      if (m.isMesh && (m.material as THREE.Material).userData?.outlineParameters) m.castShadow = false;
    });
    this.world.add(room.group);

    const center = room.focus.getCenter(new THREE.Vector3());
    this.sun.position.set(center.x + 10, 22, center.z + 14);
    this.sun.target.position.copy(center);
    const dir = this.camera.userData.dir as THREE.Vector3;
    this.camera.position.copy(center).addScaledVector(dir, 60);
    this.camera.lookAt(center);
    this.camera.updateMatrixWorld();

    // Place items in dependency order so supports exist first.
    const placed = new Set<string>();
    const defs = new Map(level.items.map((d) => [d.id, d]));
    const place = (id: string) => {
      if (placed.has(id)) return;
      const def = defs.get(id)!;
      if (def.on) place(def.on);
      const model = buildItemModel(def.kind, def.variant ?? 0);
      const root = new THREE.Group();
      model.scale.setScalar(ITEM_SCALE);
      model.userData.baseScale = ITEM_SCALE;
      root.add(model);
      root.rotation.y = THREE.MathUtils.degToRad(def.rot ?? 0);
      const bb = new THREE.Box3().setFromObject(model);
      const size = bb.getSize(new THREE.Vector3());
      const proxy = new THREE.Mesh(
        new THREE.BoxGeometry(Math.max(size.x, 0.7) + 0.2, Math.max(size.y, 0.45) + 0.15, Math.max(size.z, 0.7) + 0.2),
        new THREE.MeshBasicMaterial({ visible: false }),
      );
      proxy.position.y = size.y / 2;
      proxy.userData.item = id;
      root.add(proxy);
      const mats: THREE.MeshToonMaterial[] = [];
      model.traverse((o) => {
        const m = o as THREE.Mesh;
        if (!m.isMesh) return;
        const clone = (mm: THREE.Material) => {
          const c = mm.clone() as THREE.MeshToonMaterial;
          mats.push(c);
          return c;
        };
        m.material = Array.isArray(m.material) ? m.material.map(clone) : clone(m.material);
      });
      const view: ItemView = { root, model, proxy, height: size.y, mats };
      this.items.set(id, view);
      root.position.set(def.x, this.restHeight(id, def.on ?? null), def.z);
      this.world.add(root);
      placed.add(id);
    };
    for (const d of level.items) place(d.id);
  }

  private clear(): void {
    this.world.clear();
    this.items.clear();
    this.tweens = [];
    this.hovered = null;
    this.hinted = null;
  }

  /** Height an item rests at: the top of what it's on, or its room surface. */
  private restHeight(id: string, support: string | null): number {
    if (support) {
      const sv = this.items.get(support)!;
      return sv.root.position.y + sv.height - 0.02;
    }
    let def = this.level!.items.find((d) => d.id === id)!;
    while (def.on) def = this.level!.items.find((d) => d.id === def.on)!;
    return this.room!.surfaces[def.surface!] ?? 0;
  }

  /** Frame the room inside `rect` (CSS px) of a `w`×`h` viewport. */
  resize(w: number, h: number, rect: ScreenRect): void {
    this.renderer.setSize(w, h, false);
    this.fitRect = rect;
    if (!this.room) return;
    const inv = this.camera.matrixWorldInverse;
    const b = this.room.focus;
    let x0 = Infinity,
      x1 = -Infinity,
      y0 = Infinity,
      y1 = -Infinity;
    for (let i = 0; i < 8; i++) {
      const p = new THREE.Vector3(i & 1 ? b.max.x : b.min.x, i & 2 ? b.max.y : b.min.y, i & 4 ? b.max.z : b.min.z).applyMatrix4(inv);
      x0 = Math.min(x0, p.x);
      x1 = Math.max(x1, p.x);
      y0 = Math.min(y0, p.y);
      y1 = Math.max(y1, p.y);
    }
    const scale = Math.min(rect.w / (x1 - x0), rect.h / (y1 - y0));
    const cx = (x0 + x1) / 2;
    const cy = (y0 + y1) / 2;
    this.camera.left = cx - (rect.x + rect.w / 2) / scale;
    this.camera.right = this.camera.left + w / scale;
    this.camera.top = cy + (rect.y + rect.h / 2) / scale;
    this.camera.bottom = this.camera.top - h / scale;
    this.camera.updateProjectionMatrix();
  }

  get viewRect(): ScreenRect {
    return this.fitRect;
  }

  pick(clientX: number, clientY: number): string | null {
    const el = this.renderer.domElement.getBoundingClientRect();
    const ndc = new THREE.Vector2(((clientX - el.left) / el.width) * 2 - 1, -((clientY - el.top) / el.height) * 2 + 1);
    this.world.updateMatrixWorld();
    this.raycaster.setFromCamera(ndc, this.camera);
    const proxies = [...this.items.values()].filter((v) => v.root.visible).map((v) => v.proxy);
    const hit = this.raycaster.intersectObjects(proxies, false)[0];
    return hit ? (hit.object.userData.item as string) : null;
  }

  setHover(id: string | null): void {
    if (this.hovered === id) return;
    this.hovered = id;
    this.refreshGlow();
  }

  setHint(id: string | null): void {
    this.hinted = id;
    for (const v of this.items.values()) v.model.position.y = 0;
    this.refreshGlow();
  }

  private refreshGlow(): void {
    for (const [id, v] of this.items) {
      const on = id === this.hovered ? 0.18 : 0;
      for (const m of v.mats) m.emissive.setScalar(on);
    }
  }

  /** Screen rectangle (CSS px) around an item. */
  screenRect(id: string): ScreenRect {
    const v = this.items.get(id)!;
    const bb = new THREE.Box3().setFromObject(v.model);
    const el = this.renderer.domElement.getBoundingClientRect();
    let x0 = Infinity,
      x1 = -Infinity,
      y0 = Infinity,
      y1 = -Infinity;
    for (let i = 0; i < 8; i++) {
      const p = new THREE.Vector3(i & 1 ? bb.max.x : bb.min.x, i & 2 ? bb.max.y : bb.min.y, i & 4 ? bb.max.z : bb.min.z).project(this.camera);
      const sx = el.left + ((p.x + 1) / 2) * el.width;
      const sy = el.top + ((1 - p.y) / 2) * el.height;
      x0 = Math.min(x0, sx);
      x1 = Math.max(x1, sx);
      y0 = Math.min(y0, sy);
      y1 = Math.max(y1, sy);
    }
    return { x: x0, y: y0, w: x1 - x0, h: y1 - y0 };
  }

  /** Lift the item, then hide it; resolves when it's ready to fly away as a 2D image. */
  async lift(id: string): Promise<ScreenRect> {
    const v = this.items.get(id)!;
    if (this.hovered === id) this.setHover(null);
    if (this.hinted === id) this.setHint(null);
    const y0 = v.root.position.y;
    await this.tween(110, (k) => {
      const e = easeOut(k);
      v.root.position.y = y0 + e * 0.5;
      v.model.scale.setScalar(ITEM_SCALE * (1 + e * 0.12));
    });
    const rect = this.screenRect(id);
    v.root.visible = false;
    v.model.scale.setScalar(ITEM_SCALE);
    v.root.position.y = y0;
    return rect;
  }

  /** Bring an item back (Return booster), dropping it onto `support`. */
  async restore(id: string, support: string | null): Promise<void> {
    const v = this.items.get(id)!;
    const target = this.restHeight(id, support);
    v.root.visible = true;
    v.model.scale.setScalar(ITEM_SCALE * 0.01);
    await this.tween(320, (k) => {
      const e = easeOut(k);
      v.model.scale.setScalar(ITEM_SCALE * (0.01 + e * 0.99));
      v.root.position.y = target + (1 - e) * 1.5;
    });
  }

  /** "Can't take that" wiggle; also nudges whatever is on top. */
  async shake(id: string, covers: string[]): Promise<void> {
    const v = this.items.get(id)!;
    const base = v.root.rotation.z;
    const tops = covers.map((c) => this.items.get(c)!);
    for (const t of tops) for (const m of t.mats) m.emissive.setRGB(0.35, 0.12, 0.05);
    await this.tween(380, (k) => {
      v.root.rotation.z = base + Math.sin(k * Math.PI * 6) * 0.08 * (1 - k);
      for (const t of tops) t.model.position.y = Math.sin(k * Math.PI * 2) * 0.12 * (1 - k);
    });
    v.root.rotation.z = base;
    for (const t of tops) {
      t.model.position.y = 0;
      for (const m of t.mats) m.emissive.setScalar(0);
    }
    this.refreshGlow();
  }

  tween(dur: number, update: (k: number) => void): Promise<void> {
    return new Promise((resolve) => this.tweens.push({ start: performance.now(), dur, update, resolve }));
  }

  frame(now: number): void {
    this.time = now / 1000;
    const alive: Tween[] = [];
    for (const t of this.tweens) {
      const k = Math.min(1, (now - t.start) / t.dur);
      t.update(k);
      if (k < 1) alive.push(t);
      else t.resolve();
    }
    this.tweens = alive;
    if (this.hinted) {
      const v = this.items.get(this.hinted);
      if (v) {
        const pulse = 0.12 + 0.18 * (0.5 + 0.5 * Math.sin(this.time * 8));
        for (const m of v.mats) m.emissive.setRGB(pulse, pulse * 0.9, pulse * 0.4);
        v.model.position.y = 0.12 * Math.abs(Math.sin(this.time * 4));
      }
    }
    this.effect.render(this.scene, this.camera);
  }
}

export { easeInOut };
