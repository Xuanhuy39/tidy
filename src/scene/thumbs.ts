import * as THREE from 'three';
import { OutlineEffect } from 'three/examples/jsm/effects/OutlineEffect.js';
import { buildItemModel } from './stage';

const SIZE = 160;

/** Renders each item model once into a small transparent PNG for the 2D UI. */
export class Thumbs {
  private readonly renderer: THREE.WebGLRenderer;
  private readonly effect: OutlineEffect;
  private readonly scene = new THREE.Scene();
  private readonly camera = new THREE.OrthographicCamera(-1, 1, 1, -1, 0.1, 50);
  private readonly cache = new Map<string, string>();

  constructor() {
    const canvas = document.createElement('canvas');
    this.renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true, preserveDrawingBuffer: true });
    this.renderer.setPixelRatio(1);
    this.renderer.setSize(SIZE, SIZE, false);
    this.renderer.outputColorSpace = THREE.SRGBColorSpace;
    this.renderer.setClearColor(0x000000, 0);
    this.effect = new OutlineEffect(this.renderer, { defaultThickness: 0.012, defaultColor: [0.24, 0.16, 0.12] });
    this.scene.add(new THREE.HemisphereLight(0xffffff, 0xd9b48a, 1.8));
    const sun = new THREE.DirectionalLight(0xffffff, 1.8);
    sun.position.set(3, 6, 4);
    this.scene.add(sun);
  }

  get(kind: string, variant = 0): string {
    const key = `${kind}:${variant}`;
    let url = this.cache.get(key);
    if (url) return url;
    const model = buildItemModel(kind, variant);
    this.scene.add(model);
    const bb = new THREE.Box3().setFromObject(model);
    const center = bb.getCenter(new THREE.Vector3());
    const dir = new THREE.Vector3(0.9, 1.25, 1.4).normalize();
    this.camera.position.copy(center).addScaledVector(dir, 20);
    this.camera.lookAt(center);
    this.camera.updateMatrixWorld();
    // Fit the projected bounds.
    const inv = this.camera.matrixWorldInverse;
    let r = 0;
    for (let i = 0; i < 8; i++) {
      const p = new THREE.Vector3(i & 1 ? bb.max.x : bb.min.x, i & 2 ? bb.max.y : bb.min.y, i & 4 ? bb.max.z : bb.min.z).applyMatrix4(inv);
      r = Math.max(r, Math.abs(p.x), Math.abs(p.y));
    }
    r *= 1.12;
    Object.assign(this.camera, { left: -r, right: r, top: r, bottom: -r });
    this.camera.updateProjectionMatrix();
    // The outline pass leaves autoClear off, so clear explicitly or icons pile up.
    this.renderer.setRenderTarget(null);
    this.renderer.clear(true, true, true);
    this.effect.render(this.scene, this.camera);
    url = this.renderer.domElement.toDataURL('image/png');
    this.scene.remove(model);
    this.cache.set(key, url);
    return url;
  }
}
