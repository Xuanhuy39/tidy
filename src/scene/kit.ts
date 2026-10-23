import * as THREE from 'three';
import { RoundedBoxGeometry } from 'three/examples/jsm/geometries/RoundedBoxGeometry.js';

/** Three soft tones give the flat, illustrated look. */
const gradientMap = (() => {
  const data = new Uint8Array([120, 120, 120, 255, 200, 200, 200, 255, 255, 255, 255, 255]);
  const tex = new THREE.DataTexture(data, 3, 1, THREE.RGBAFormat);
  tex.minFilter = THREE.NearestFilter;
  tex.magFilter = THREE.NearestFilter;
  tex.needsUpdate = true;
  return tex;
})();

const cache = new Map<string, THREE.MeshToonMaterial>();

export function mat(color: THREE.ColorRepresentation, extra: Partial<THREE.MeshToonMaterialParameters> = {}): THREE.MeshToonMaterial {
  const key = `${new THREE.Color(color).getHexString()}|${JSON.stringify(extra)}`;
  let m = cache.get(key);
  if (!m) {
    m = new THREE.MeshToonMaterial({ color, gradientMap, ...extra });
    cache.set(key, m);
  }
  return m;
}

export function texMat(map: THREE.Texture, color: THREE.ColorRepresentation = 0xffffff): THREE.MeshToonMaterial {
  return new THREE.MeshToonMaterial({ color, map, gradientMap });
}

type Mat = THREE.ColorRepresentation | THREE.Material | THREE.Material[];
const toMat = (c: Mat) => (c instanceof THREE.Material || Array.isArray(c) ? c : mat(c));

export function mesh(geo: THREE.BufferGeometry, color: Mat): THREE.Mesh {
  return new THREE.Mesh(geo, toMat(color));
}

export function box(w: number, h: number, d: number, color: Mat, r = 0): THREE.Mesh {
  const geo = r > 0 ? new RoundedBoxGeometry(w, h, d, 3, Math.min(r, w / 2, h / 2, d / 2)) : new THREE.BoxGeometry(w, h, d);
  return mesh(geo, color);
}

export function cyl(rTop: number, rBot: number, h: number, color: Mat, seg = 28): THREE.Mesh {
  return mesh(new THREE.CylinderGeometry(rTop, rBot, h, seg), color);
}

export function sph(r: number, color: Mat, seg = 24): THREE.Mesh {
  return mesh(new THREE.SphereGeometry(r, seg, Math.round(seg * 0.75)), color);
}

export function torus(r: number, tube: number, color: Mat, arc = Math.PI * 2, seg = 32): THREE.Mesh {
  return mesh(new THREE.TorusGeometry(r, tube, 12, seg, arc), color);
}

/** Lathe from [radius, height] pairs. */
export function lathe(pts: [number, number][], color: Mat, seg = 32): THREE.Mesh {
  return mesh(new THREE.LatheGeometry(pts.map(([x, y]) => new THREE.Vector2(x, y)), seg), color);
}

/** Extrude a 2D outline (drawn in x/y) upward, so it lies flat in x/z. */
export function slab(shape: THREE.Shape, depth: number, color: Mat, bevel = 0.04): THREE.Mesh {
  const geo = new THREE.ExtrudeGeometry(shape, {
    depth,
    bevelEnabled: bevel > 0,
    bevelThickness: bevel,
    bevelSize: bevel,
    bevelSegments: 2,
    curveSegments: 16,
  });
  geo.rotateX(-Math.PI / 2);
  return mesh(geo, color);
}

export function tube(points: [number, number, number][], radius: number, color: Mat, closed = false): THREE.Mesh {
  const curve = new THREE.CatmullRomCurve3(points.map(([x, y, z]) => new THREE.Vector3(x, y, z)), closed);
  return mesh(new THREE.TubeGeometry(curve, 48, radius, 12, closed), color);
}

/** Position (and optionally rotate, in degrees) an object; returns it for chaining. */
export function at<T extends THREE.Object3D>(o: T, x: number, y: number, z: number, rx = 0, ry = 0, rz = 0): T {
  o.position.set(x, y, z);
  o.rotation.set(THREE.MathUtils.degToRad(rx), THREE.MathUtils.degToRad(ry), THREE.MathUtils.degToRad(rz));
  return o;
}

export function scaled<T extends THREE.Object3D>(o: T, x: number, y = x, z = x): T {
  o.scale.set(x, y, z);
  return o;
}

export function group(...children: THREE.Object3D[]): THREE.Group {
  const g = new THREE.Group();
  g.add(...children);
  return g;
}

export function roundedRect(w: number, h: number, r: number): THREE.Shape {
  const s = new THREE.Shape();
  const x = -w / 2;
  const y = -h / 2;
  s.moveTo(x + r, y);
  s.lineTo(x + w - r, y);
  s.quadraticCurveTo(x + w, y, x + w, y + r);
  s.lineTo(x + w, y + h - r);
  s.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
  s.lineTo(x + r, y + h);
  s.quadraticCurveTo(x, y + h, x, y + h - r);
  s.lineTo(x, y + r);
  s.quadraticCurveTo(x, y, x + r, y);
  return s;
}

export function poly(points: [number, number][]): THREE.Shape {
  const s = new THREE.Shape();
  points.forEach(([x, y], i) => (i === 0 ? s.moveTo(x, y) : s.lineTo(x, y)));
  s.closePath();
  return s;
}

/** Small canvas texture helper. */
export function canvasTex(w: number, h: number, draw: (ctx: CanvasRenderingContext2D) => void): THREE.CanvasTexture {
  const c = document.createElement('canvas');
  c.width = w;
  c.height = h;
  draw(c.getContext('2d')!);
  const tex = new THREE.CanvasTexture(c);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.anisotropy = 4;
  return tex;
}

/** Shift a model so it sits on y=0, centred on x/z, and turn on shadows. */
export function grounded(g: THREE.Object3D): THREE.Object3D {
  g.traverse((o) => {
    if ((o as THREE.Mesh).isMesh) {
      o.castShadow = true;
      o.receiveShadow = true;
    }
  });
  const bb = new THREE.Box3().setFromObject(g);
  const c = bb.getCenter(new THREE.Vector3());
  const wrap = new THREE.Group();
  g.position.sub(new THREE.Vector3(c.x, bb.min.y, c.z));
  wrap.add(g);
  return wrap;
}
