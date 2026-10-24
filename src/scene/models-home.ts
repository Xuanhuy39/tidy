import * as THREE from 'three';
import { at, box, canvasTex, cyl, group, lathe, mat, mesh, poly, roundedRect, scaled, slab, sph, texMat, torus, tube } from './kit';

/**
 * Item models for the Bathroom and Living Room levels. Same conventions as
 * models.ts: resting pose, toy-scale, recentred by grounded() afterwards.
 * Every model leans on one iconic silhouette or detail so it reads at icon size.
 */
type Builder = (variant: number) => THREE.Object3D;

const DARK = 0x2e2a2b;
const METAL = 0xc9ced6;
const GOLD = 0xf2c14e;
const WOOD = 0xc98d55;

const pick = <T,>(list: T[], v: number) => list[((v % list.length) + list.length) % list.length];
const lighter = (c: number, k = 0.45) => new THREE.Color(c).lerp(new THREE.Color(0xffffff), k).getHex();
const darker = (c: number, k = 0.75) => new THREE.Color(c).multiplyScalar(k).getHex();

/** A flat front label (canvas) facing +z. */
function label(w: number, h: number, draw: (c: CanvasRenderingContext2D) => void, px = 256): THREE.Mesh {
  const tex = canvasTex(px, Math.round((px * h) / w), draw);
  return mesh(new THREE.PlaneGeometry(w, h), texMat(tex));
}

function ellipse(rx: number, ry: number): THREE.Shape {
  const s = new THREE.Shape();
  s.absellipse(0, 0, rx, ry, 0, Math.PI * 2, false, 0);
  return s;
}

function textLabel(text: string, bg: string, fg: string, size = 48) {
  return (c: CanvasRenderingContext2D) => {
    c.fillStyle = bg;
    c.fillRect(0, 0, c.canvas.width, c.canvas.height);
    c.fillStyle = fg;
    c.font = `bold ${size}px sans-serif`;
    c.textAlign = 'center';
    c.textBaseline = 'middle';
    c.fillText(text, c.canvas.width / 2, c.canvas.height / 2 + 2);
  };
}

// ---------- Bath ----------

function soap(v: number) {
  const c = pick([0xf7a6c1, 0xa8dcf0, 0xc8e6a0], v);
  const g = group(at(box(1.1, 0.42, 0.72, c, 0.18), 0, 0.21, 0), at(scaled(cyl(0.3, 0.3, 0.03, lighter(c), 28), 1.3, 1, 0.8), 0, 0.425, 0));
  const bubble = mat(0xffffff, { transparent: true, opacity: 0.85 });
  for (const [x, y, z, r] of [
    [-0.25, 0.56, -0.12, 0.13],
    [0.06, 0.62, 0.08, 0.17],
    [0.32, 0.55, -0.08, 0.1],
    [0.18, 0.8, 0.2, 0.08],
    [-0.1, 0.82, -0.05, 0.07],
  ])
    g.add(at(sph(r, bubble, 16), x, y, z));
  return g;
}

function shampoo(v: number) {
  const c = pick([0x2fb3c9, 0xe45b8f, 0x8a5ac8], v);
  const front = label(0.62, 0.55, (x) => {
    textLabel('SHAMPOO', '#ffffff', '#' + new THREE.Color(c).getHexString(), 34)(x);
    x.fillStyle = '#' + new THREE.Color(lighter(c, 0.3)).getHexString();
    for (const [bx, by, br] of [
      [40, 30, 12],
      [215, 100, 15],
      [190, 28, 8],
    ]) {
      x.beginPath();
      x.arc(bx, by, br, 0, Math.PI * 2);
      x.fill();
    }
  });
  front.position.set(0, 0.62, 0.222);
  return group(
    at(box(0.8, 1.3, 0.42, c, 0.18), 0, 0.65, 0),
    front,
    at(cyl(0.2, 0.3, 0.16, c, 20), 0, 1.36, 0),
    at(box(0.46, 0.24, 0.32, 0xffffff, 0.09), 0, 1.54, 0),
    at(box(0.12, 0.06, 0.12, 0xdfe3ea, 0.03), 0.12, 1.68, 0),
  );
}

function lotion(v: number) {
  const c = pick([0xf6e7c8, 0xe9f4fb], v);
  const band = pick([0xe98aa8, 0x5bb0d8], v);
  return group(
    at(cyl(0.34, 0.37, 1.05, c, 28), 0, 0.53, 0),
    at(cyl(0.375, 0.375, 0.42, band, 28), 0, 0.5, 0),
    at(cyl(0.22, 0.34, 0.14, c, 24), 0, 1.12, 0),
    at(cyl(0.1, 0.1, 0.28, 0xffffff, 14), 0, 1.33, 0),
    at(cyl(0.18, 0.18, 0.14, 0xffffff, 18), 0, 1.5, 0),
    at(box(0.42, 0.09, 0.11, 0xffffff, 0.04), 0.22, 1.53, 0),
    at(cyl(0.035, 0.035, 0.08, 0xffffff, 8), 0.43, 1.5, 0),
  );
}

function sponge() {
  const g = group(at(box(1.2, 0.42, 0.78, 0xf7d046, 0.1), 0, 0.21, 0), at(box(1.2, 0.16, 0.78, 0x4caf50, 0.06), 0, 0.5, 0));
  for (let i = 0; i < 10; i++) {
    const x = -0.48 + (i % 5) * 0.24;
    const y = i < 5 ? 0.13 : 0.3;
    g.add(at(scaled(sph(0.045, 0xd4a52a, 8), 1, 1, 0.4), x + (i % 2) * 0.05, y, 0.39));
  }
  return g;
}

function towel(v: number) {
  const c = pick([0x5bb0d8, 0xf28bb0, 0x7fcfa8], v);
  const g = group(
    at(box(1.6, 0.26, 1.05, c, 0.12), 0, 0.13, 0),
    at(box(1.6, 0.26, 1.05, c, 0.12), 0, 0.38, 0),
    // Rolled fold edge on the front.
    at(cyl(0.16, 0.16, 1.6, c, 16), 0, 0.26, 0.48, 0, 0, 90),
  );
  for (const x of [-0.55, -0.42, 0.42, 0.55]) g.add(at(box(0.07, 0.54, 1.08, 0xffffff, 0.03), x, 0.26, 0));
  return g;
}

function toiletRoll() {
  const g = group(
    at(cyl(0.46, 0.46, 0.9, 0xffffff, 32), 0, 0.45, 0),
    at(cyl(0.17, 0.17, 0.02, 0x8a6a4a, 20), 0, 0.905, 0),
    at(torus(0.17, 0.035, 0xd8b48a, Math.PI * 2, 20), 0, 0.905, 0, 90),
    // Loose sheet hanging down the front onto the floor.
    at(box(0.55, 0.72, 0.03, 0xffffff), 0, 0.45, 0.47),
    at(box(0.55, 0.03, 0.55, 0xffffff), 0, 0.015, 0.75),
  );
  for (const y of [0.25, 0.65]) g.add(at(box(0.55, 0.012, 0.035, 0xdddddd), 0, y, 0.49));
  for (let i = 0; i < 6; i++) g.add(at(torus(0.465, 0.008, 0xeeeeee, Math.PI * 2, 32), 0, 0.12 + i * 0.13, 0, 90));
  return g;
}

// ---------- Grooming ----------

function toothbrush(v: number) {
  const c = pick([0x5b8def, 0xe45b8f, 0x3fb5a5], v);
  return group(
    at(box(1.4, 0.14, 0.2, c, 0.07), 0.35, 0.08, 0),
    at(box(0.5, 0.15, 0.18, 0xffffff, 0.06), 0.45, 0.085, 0),
    at(box(0.4, 0.09, 0.12, c, 0.04), -0.5, 0.06, 0),
    at(box(0.55, 0.1, 0.24, c, 0.05), -0.9, 0.06, 0),
    // Big bristle block, white with a blue tuft.
    at(box(0.5, 0.26, 0.22, 0xffffff, 0.04), -0.9, 0.24, 0),
    at(box(0.22, 0.06, 0.22, 0x5bc0de, 0.02), -0.8, 0.39, 0),
  );
}

function toothpaste() {
  const tex = canvasTex(320, 112, (c) => {
    c.fillStyle = '#ffffff';
    c.fillRect(0, 0, 320, 112);
    c.fillStyle = '#e74c3c';
    c.fillRect(0, 0, 320, 22);
    c.fillStyle = '#3f7fd0';
    c.fillRect(0, 90, 320, 22);
    c.fillStyle = '#3f7fd0';
    c.font = 'bold 44px sans-serif';
    c.textAlign = 'center';
    c.textBaseline = 'middle';
    c.fillText('PASTE', 160, 58);
  });
  tex.center.set(0.5, 0.5);
  tex.rotation = Math.PI;
  // A box that flattens from a round cap end to a crimped end.
  const geo = new THREE.BoxGeometry(1.8, 0.42, 0.62, 24, 3, 4);
  const p = geo.getAttribute('position');
  for (let i = 0; i < p.count; i++) {
    const t = (p.getX(i) + 0.9) / 1.8;
    p.setY(i, p.getY(i) * (1 - 0.88 * t ** 1.6));
    p.setZ(i, p.getZ(i) * (1 + 0.18 * t));
  }
  geo.computeVertexNormals();
  geo.translate(0, 0.21, 0);
  const side = mat(0xffffff);
  return group(
    mesh(geo, [side, side, texMat(tex), side, side, side]),
    at(box(0.12, 0.07, 0.8, 0xd5d5d5, 0.02), 0.92, 0.21, 0),
    at(cyl(0.18, 0.2, 0.28, 0x3f7fd0, 20), -1.03, 0.21, 0, 0, 0, 90),
  );
}

function comb(v: number) {
  const c = pick([0xe45b8f, 0x8a5ac8, 0x2fb3c9], v);
  const g = group(at(box(1.8, 0.1, 0.3, c, 0.05), 0, 0.05, -0.28));
  for (let i = 0; i < 19; i++) g.add(at(box(0.05, 0.08, 0.46, c, 0.02), -0.83 + i * 0.092, 0.04, 0.08));
  return g;
}

function hairbrush(v: number) {
  const c = pick([0x8a5ac8, 0xf28b6a], v);
  const g = group(
    at(slab(ellipse(0.48, 0.62), 0.12, c, 0.04), -0.45, 0, 0),
    at(slab(ellipse(0.38, 0.5), 0.04, 0x2e2a2b, 0.02), -0.45, 0.16, 0),
    at(box(1.1, 0.16, 0.3, c, 0.08), 0.55, 0.09, 0),
  );
  for (let i = -3; i <= 3; i++)
    for (let j = -3; j <= 3; j++) {
      if ((i / 3.4) ** 2 + (j / 3.4) ** 2 > 1) continue;
      g.add(at(sph(0.035, 0xffffff, 6), -0.45 + i * 0.1, 0.24, j * 0.13));
    }
  return g;
}

function hairdryer(v: number) {
  const c = pick([0xf28bb0, 0x8a5ac8], v);
  const g = group(
    at(cyl(0.34, 0.34, 1.0, c, 28), 0, 1.05, 0, 0, 0, 90),
    at(cyl(0.2, 0.32, 0.38, 0x3a3f4a, 24), 0.68, 1.05, 0, 0, 0, -90),
    at(cyl(0.33, 0.33, 0.06, 0x9aa0aa, 24), -0.52, 1.05, 0, 0, 0, 90),
    at(box(0.32, 0.95, 0.36, c, 0.14), -0.12, 0.5, 0, 0, 0, 12),
    at(box(0.08, 0.2, 0.1, 0xffffff, 0.03), -0.0, 0.62, 0.18, 0, 0, 12),
  );
  for (let i = -2; i <= 2; i++) g.add(at(box(0.02, 0.4, 0.04, 0x3a3f4a), -0.56, 1.05, i * 0.1, 0, 0, 0));
  g.add(
    tube(
      [
        [-0.2, 0.05, 0],
        [-0.35, 0.04, 0.3],
        [-0.1, 0.03, 0.55],
        [0.25, 0.03, 0.45],
        [0.4, 0.03, 0.75],
      ],
      0.035,
      0x3a3f4a,
    ),
  );
  return g;
}

function handMirror(v: number) {
  const c = pick([0xe9b44a, 0xf28bb0], v);
  const g = group(
    at(slab(ellipse(0.55, 0.66), 0.1, c, 0.04), -0.4, 0, 0),
    at(slab(ellipse(0.44, 0.54), 0.03, mat(0xbfe6f5), 0.01), -0.4, 0.15, 0),
    at(box(1.0, 0.14, 0.22, c, 0.07), 0.62, 0.08, 0),
  );
  g.add(at(box(0.08, 0.01, 0.55, 0xffffff), -0.55, 0.2, 0, 0, 35, 0), at(box(0.05, 0.01, 0.3, 0xffffff), -0.38, 0.2, -0.05, 0, 35, 0));
  return g;
}

// ---------- Cleaning ----------

function sprayBottle() {
  const liquid = mat(0x7fd3a8, { transparent: true, opacity: 0.85 });
  return group(
    lathe(
      [
        [0, 0],
        [0.38, 0],
        [0.4, 0.08],
        [0.4, 0.85],
        [0.24, 1.08],
        [0.15, 1.15],
        [0, 1.15],
      ],
      liquid,
    ),
    at(cyl(0.17, 0.17, 0.14, 0xffffff, 16), 0, 1.2, 0),
    at(box(0.34, 0.3, 0.72, 0x3f7fd0, 0.1), 0, 1.42, 0.12),
    at(cyl(0.07, 0.09, 0.14, 0xffffff, 12), 0, 1.45, 0.55, 90),
    at(box(0.12, 0.42, 0.1, 0x3f7fd0, 0.04), 0, 1.15, 0.4, -20),
    at(box(0.5, 0.36, 0.02, 0xffffff, 0.02), 0, 0.5, 0.405),
  );
}

function bucket(v: number) {
  const c = pick([0x3fa9d6, 0xf2b632], v);
  const shell = lathe(
    [
      [0, 0],
      [0.48, 0],
      [0.62, 0.95],
      [0.58, 0.95],
      [0.44, 0.06],
      [0, 0.06],
    ],
    mat(c, { side: THREE.DoubleSide }),
  );
  return group(
    shell,
    at(torus(0.61, 0.04, darker(c), Math.PI * 2, 36), 0, 0.95, 0, 90),
    at(cyl(0.54, 0.54, 0.02, mat(0x8fd3f0, { transparent: true, opacity: 0.85 }), 32), 0, 0.7, 0),
    at(torus(0.6, 0.03, METAL, Math.PI, 28), 0, 0.9, 0),
    at(cyl(0.06, 0.06, 0.32, DARK, 10), 0, 1.5, 0, 0, 0, 90),
    at(sph(0.06, METAL, 8), -0.6, 0.9, 0),
    at(sph(0.06, METAL, 8), 0.6, 0.9, 0),
  );
}

function glove(c: number) {
  const g = group(at(slab(roundedRect(0.82, 0.8, 0.24), 0.16, c, 0.05), 0, 0, 0));
  // Four spread fingers with clear gaps, plus a thumb sticking out to the side.
  const fingers: [number, number, number, number][] = [
    [-0.3, 0.66, 0.5, 12],
    [-0.1, 0.78, 0.62, 4],
    [0.1, 0.76, 0.6, -4],
    [0.3, 0.64, 0.48, -12],
  ];
  for (const [x, y, len, rot] of fingers) g.add(at(slab(roundedRect(0.15, len, 0.075), 0.15, c, 0.035), x, 0, -y, 0, rot, 0));
  g.add(at(slab(roundedRect(0.17, 0.5, 0.085), 0.15, c, 0.035), -0.55, 0, -0.05, 0, -55, 0));
  g.add(at(slab(roundedRect(0.9, 0.38, 0.1), 0.17, darker(c, 0.9), 0.04), 0, 0, 0.58));
  for (const z of [0.5, 0.64]) g.add(at(box(0.88, 0.02, 0.035, darker(c, 0.7)), 0, 0.27, z));
  return g;
}

function gloves(v: number) {
  return glove(pick([0xffc61a, 0xf26b8a], v));
}

function plunger() {
  return group(
    lathe(
      [
        [0.6, 0],
        [0.58, 0.12],
        [0.48, 0.32],
        [0.3, 0.46],
        [0.1, 0.52],
        [0, 0.52],
      ],
      mat(0xd6303f, { side: THREE.DoubleSide }),
      32,
    ),
    at(torus(0.59, 0.05, darker(0xd6303f), Math.PI * 2, 32), 0, 0.03, 0, 90),
    at(cyl(0.08, 0.08, 1.7, WOOD, 12), 0, 1.35, 0),
    at(sph(0.12, 0xb87843, 12), 0, 2.2, 0),
  );
}

function dustpan() {
  const c = 0x5aa83c;
  const pan = group(
    at(slab(poly([[-0.7, 0.5], [0.7, 0.5], [0.6, -0.5], [-0.6, -0.5]]), 0.04, c, 0.02), 0, 0, 0),
    at(box(1.25, 0.42, 0.08, c, 0.04), 0, 0.22, -0.5),
    at(box(0.08, 0.36, 1.0, c, 0.04), -0.66, 0.18, 0),
    at(box(0.08, 0.36, 1.0, c, 0.04), 0.66, 0.18, 0),
    at(box(0.2, 0.12, 0.7, darker(c), 0.05), 0, 0.33, -0.85),
  );
  // Little hand brush resting in the pan.
  const brush = group(
    at(box(0.9, 0.16, 0.32, 0xc98d55, 0.07), 0, 0.2, 0),
    at(box(0.88, 0.14, 0.3, 0xf2b632, 0.03), 0, 0.07, 0),
    at(box(0.55, 0.12, 0.16, 0xc98d55, 0.06), 0.68, 0.22, 0),
  );
  return group(pan, at(brush, 0.05, 0.06, 0.1, 0, 25, 0));
}

// ---------- Toys ----------

function toyBoat(v: number) {
  const c = pick([0xe74c3c, 0x3f7fd0], v);
  const hullShape = new THREE.Shape();
  hullShape.moveTo(-0.85, 0.42);
  hullShape.lineTo(0.95, 0.42);
  hullShape.quadraticCurveTo(0.75, 0.05, 0.45, 0);
  hullShape.lineTo(-0.6, 0);
  hullShape.quadraticCurveTo(-0.85, 0.1, -0.85, 0.42);
  const hullGeo = new THREE.ExtrudeGeometry(hullShape, { depth: 0.6, bevelEnabled: true, bevelThickness: 0.05, bevelSize: 0.05, bevelSegments: 2 });
  hullGeo.translate(0, 0, -0.3);
  const sailShape = poly([
    [0, 0],
    [0, 1.25],
    [0.75, 0.05],
  ]);
  const sailGeo = new THREE.ExtrudeGeometry(sailShape, { depth: 0.03, bevelEnabled: false });
  return group(
    mesh(hullGeo, c),
    at(box(1.75, 0.06, 0.62, 0xffffff, 0.02), 0.05, 0.3, 0),
    at(box(1.6, 0.06, 0.7, 0xffffff, 0.02), 0.05, 0.47, 0),
    at(cyl(0.035, 0.035, 1.45, WOOD, 8), -0.05, 1.18, 0),
    at(mesh(sailGeo, 0xffffff), -0.0, 0.55, -0.015),
    at(box(0.02, 0.2, 0.04, 0x5bc0de), 0.25, 0.9, 0.02),
    at(mesh(new THREE.ExtrudeGeometry(poly([[0, 0], [0, 0.18], [0.26, 0.09]]), { depth: 0.02, bevelEnabled: false }), 0xf2b632), -0.03, 1.78, 0),
  );
}

// ---------- Music ----------

function guitar() {
  // Figure-eight body: lower and upper bouts joined at the waist.
  const body = new THREE.Shape();
  const lowR = 0.6;
  const upR = 0.46;
  const upY = 0.8;
  const iy = (lowR ** 2 - upR ** 2 + upY ** 2) / (2 * upY);
  const ix = Math.sqrt(lowR ** 2 - iy ** 2);
  const aLow = Math.atan2(iy, ix);
  const aUp = Math.atan2(iy - upY, ix);
  body.moveTo(ix, iy);
  body.absarc(0, 0, lowR, aLow, Math.PI - aLow, true);
  body.absarc(0, upY, upR, Math.PI - aUp, aUp, true);
  const wood = 0xe0a05a;
  const neckC = 0x7a4a2a;
  // slab() lays the shape flat: shape y runs along -z.
  const g = group(
    slab(body, 0.22, wood, 0.05),
    at(slab(body, 0.01, darker(wood, 0.85), 0), 0, 0.27, 0),
    at(cyl(0.17, 0.17, 0.02, 0x3a2414, 28), 0, 0.29, -0.5),
    at(torus(0.2, 0.02, 0x3a2414, Math.PI * 2, 28), 0, 0.29, -0.5, 90),
    at(box(0.42, 0.06, 0.1, 0x3a2414, 0.02), 0, 0.3, 0.25),
    at(box(0.2, 0.12, 1.3, neckC, 0.04), 0, 0.27, -1.85),
    at(box(0.3, 0.1, 0.38, 0x3a2414, 0.05), 0, 0.27, -2.65),
  );
  for (let i = 0; i < 4; i++) g.add(at(box(0.012, 0.012, 2.6, 0xf3efe6), -0.06 + i * 0.04, 0.34, -1.1));
  for (const x of [-0.19, 0.19]) for (const z of [-2.55, -2.72]) g.add(at(cyl(0.035, 0.035, 0.12, METAL, 8), x, 0.27, z, 0, 0, 90));
  return g;
}

function drum(v: number) {
  const c = pick([0xd6303f, 0x3f7fd0], v);
  const g = group(
    at(cyl(0.62, 0.62, 0.58, c, 32), 0, 0.31, 0),
    at(cyl(0.63, 0.63, 0.04, 0xf8f4ea, 32), 0, 0.62, 0),
    at(torus(0.63, 0.04, METAL, Math.PI * 2, 36), 0, 0.63, 0, 90),
    at(torus(0.63, 0.04, METAL, Math.PI * 2, 36), 0, 0.03, 0, 90),
    at(box(1.3, 0.05, 0.05, 0xffffff), 0, 0.32, 0, 0, 0, 0),
  );
  for (let i = 0; i < 8; i++) {
    const a = (i / 8) * Math.PI * 2;
    g.add(at(box(0.07, 0.5, 0.07, METAL, 0.02), Math.cos(a) * 0.64, 0.32, Math.sin(a) * 0.64));
  }
  for (const r of [25, -25]) {
    const stick = group(at(cyl(0.035, 0.045, 1.4, 0xe8c48a, 10), 0, 0, 0, 0, 0, 90), at(sph(0.06, 0xe8c48a, 10), -0.72, 0, 0));
    g.add(at(stick, 0, 0.72 + (r > 0 ? 0 : 0.06), 0, 0, r, 0));
  }
  return g;
}

function trumpet() {
  const brass = mat(GOLD, { side: THREE.DoubleSide });
  const bell = lathe(
    [
      [0.07, 0],
      [0.08, 0.35],
      [0.13, 0.62],
      [0.26, 0.82],
      [0.44, 0.92],
    ],
    brass,
    32,
  );
  return group(
    at(bell, 0.25, 0.5, 0, 0, 0, -90),
    at(cyl(0.055, 0.055, 1.3, GOLD, 12), -0.4, 0.5, 0, 0, 0, 90),
    at(cyl(0.055, 0.055, 1.0, GOLD, 12), -0.25, 0.18, 0, 0, 0, 90),
    at(torus(0.16, 0.055, GOLD, Math.PI, 16), -0.75, 0.34, 0, 0, 0, 90),
    at(torus(0.16, 0.055, GOLD, Math.PI, 16), 0.25, 0.34, 0, 0, 0, -90),
    at(cyl(0.03, 0.08, 0.24, GOLD, 12), -1.15, 0.5, 0, 0, 0, 90),
    ...[-0.35, -0.15, 0.05].flatMap((x) => [at(cyl(0.085, 0.085, 0.55, GOLD, 14), x, 0.42, 0), at(cyl(0.07, 0.07, 0.1, 0xf8f4ea, 14), x, 0.75, 0)]),
  );
}

function maraca(c: number, stripe: number) {
  const head = scaled(sph(0.32, c, 24), 1, 1, 1.2);
  return group(
    at(head, 0, 0, 0.42),
    at(torus(0.3, 0.03, stripe, Math.PI * 2, 24), 0, 0, 0.32),
    at(torus(0.27, 0.03, 0xffffff, Math.PI * 2, 24), 0, 0, 0.58),
    at(cyl(0.06, 0.08, 0.75, 0xe8c48a, 12), 0, 0, -0.2, 90),
  );
}

function maracas() {
  return group(at(maraca(0xe74c3c, 0xf7d046), -0.25, 0.32, 0, 0, 25, 0), at(maraca(0x2fb3c9, 0xf28bb0), 0.3, 0.32, 0.1, 0, -20, 0));
}

function microphone() {
  const grille = texMat(
    canvasTex(128, 128, (c) => {
      c.fillStyle = '#c9ced6';
      c.fillRect(0, 0, 128, 128);
      c.strokeStyle = '#6b707a';
      c.lineWidth = 3;
      for (let i = 0; i <= 128; i += 12) {
        c.beginPath();
        c.moveTo(i, 0);
        c.lineTo(i, 128);
        c.moveTo(0, i);
        c.lineTo(128, i);
        c.stroke();
      }
    }),
  );
  return group(
    at(cyl(0.11, 0.17, 1.1, 0x2e2a2b, 18), -0.25, 0.18, 0, 0, 0, -90),
    at(cyl(0.2, 0.2, 0.1, METAL, 20), 0.33, 0.2, 0, 0, 0, 90),
    at(sph(0.3, grille, 24), 0.62, 0.3, 0),
    at(box(0.12, 0.05, 0.08, 0xe74c3c, 0.02), -0.05, 0.33, 0),
  );
}

function keyboard() {
  const keys = canvasTex(512, 160, (c) => {
    c.fillStyle = '#ffffff';
    c.fillRect(0, 0, 512, 160);
    const n = 14;
    const w = 512 / n;
    c.strokeStyle = '#3a3f4a';
    c.lineWidth = 3;
    for (let i = 0; i <= n; i++) {
      c.beginPath();
      c.moveTo(i * w, 0);
      c.lineTo(i * w, 160);
      c.stroke();
    }
    c.fillStyle = '#22252c';
    for (let i = 0; i < n - 1; i++) {
      if (i % 7 === 2 || i % 7 === 6) continue;
      c.fillRect((i + 1) * w - w * 0.3, 0, w * 0.6, 96);
    }
  });
  const keyPlane = mesh(new THREE.PlaneGeometry(2.2, 0.55), texMat(keys));
  keyPlane.rotation.x = -Math.PI / 2;
  keyPlane.position.set(0, 0.255, 0.16);
  return group(
    at(box(2.4, 0.25, 1.0, 0x2c3038, 0.08), 0, 0.125, 0),
    keyPlane,
    at(cyl(0.06, 0.06, 0.05, 0xe74c3c, 12), -0.85, 0.27, -0.3),
    at(cyl(0.06, 0.06, 0.05, 0xf2b632, 12), -0.65, 0.27, -0.3),
    at(box(0.5, 0.03, 0.14, 0x7ad3f0, 0.02), 0.2, 0.26, -0.3),
    at(box(0.3, 0.03, 0.08, 0x5a6070), 0.8, 0.26, -0.3),
  );
}

// ---------- Plants ----------

function pot(color: number, r = 0.42, h = 0.6) {
  return group(
    lathe(
      [
        [0, 0],
        [r * 0.78, 0],
        [r, h * 0.85],
        [r * 1.12, h * 0.86],
        [r * 1.12, h],
        [0, h],
      ],
      color,
      28,
    ),
    at(cyl(r * 0.98, r * 0.98, 0.02, 0x5a3e2b, 24), 0, h + 0.005, 0),
  );
}

function cactus() {
  const green = 0x4f9a4a;
  const g = group(pot(0xd7744f));
  g.add(at(new THREE.Mesh(new THREE.CapsuleGeometry(0.26, 0.8, 8, 16), mat(green)), 0, 1.25, 0));
  const arm = (side: number, y: number) =>
    group(
      at(new THREE.Mesh(new THREE.CapsuleGeometry(0.13, 0.25, 6, 12), mat(green)), side * 0.3, y, 0, 0, 0, 90),
      at(new THREE.Mesh(new THREE.CapsuleGeometry(0.13, 0.32, 6, 12), mat(green)), side * 0.45, y + 0.25, 0),
    );
  g.add(arm(1, 1.1), arm(-1, 1.35));
  for (let i = 0; i < 18; i++) {
    const a = i * 1.3;
    g.add(at(sph(0.025, 0xffffff, 6), Math.cos(a) * 0.26, 0.85 + (i % 6) * 0.14, Math.sin(a) * 0.26));
  }
  for (let i = 0; i < 5; i++) {
    const a = (i / 5) * Math.PI * 2;
    g.add(at(scaled(sph(0.09, 0xf28bb0, 10), 1, 0.5, 1), Math.cos(a) * 0.08, 1.8, Math.sin(a) * 0.08));
  }
  g.add(at(sph(0.06, 0xf7d046, 8), 0, 1.84, 0));
  return g;
}

function tulip(color: number) {
  const cup = lathe(
    [
      [0, 0],
      [0.13, 0.04],
      [0.18, 0.18],
      [0.17, 0.32],
      [0.12, 0.38],
    ],
    mat(color, { side: THREE.DoubleSide }),
    6,
  );
  return cup;
}

function flowerVase(v: number) {
  const vc = pick([0x5b8def, 0xf3efe6], v);
  const g = group(
    lathe(
      [
        [0, 0],
        [0.28, 0],
        [0.38, 0.3],
        [0.32, 0.62],
        [0.18, 0.78],
        [0.22, 0.88],
        [0, 0.88],
      ],
      vc,
      28,
    ),
  );
  const flowers: [number, number, number][] = [
    [0xe74c3c, -15, 0],
    [0xf7d046, 12, 60],
    [0xf28bb0, 8, -70],
  ];
  for (const [c, tilt, yaw] of flowers) {
    const stem = group(at(cyl(0.03, 0.03, 0.95, 0x4f9a4a, 8), 0, 0.47, 0), at(tulip(c), 0, 0.9, 0));
    const leafGeo = new THREE.SphereGeometry(0.2, 10, 6);
    leafGeo.scale(0.35, 1.3, 0.12);
    stem.add(at(mesh(leafGeo, 0x5bb04a), 0.1, 0.35, 0, 0, 0, -25));
    g.add(at(stem, 0, 0.8, 0, 0, yaw, tilt));
  }
  return g;
}

function sunflower() {
  const g = group(pot(0x5b8def, 0.38, 0.55), at(cyl(0.05, 0.05, 1.2, 0x4f9a4a, 8), 0, 1.1, 0));
  for (const s of [1, -1]) {
    const leafGeo = new THREE.SphereGeometry(0.25, 12, 8);
    leafGeo.scale(1, 0.12, 0.5);
    g.add(at(mesh(leafGeo, 0x5bb04a), s * 0.22, 1.0 + (s > 0 ? 0 : 0.2), 0, 0, 0, s * 20));
  }
  const head = group(at(cyl(0.26, 0.26, 0.1, 0x5a3a1c, 28), 0, 0, 0));
  for (let i = 0; i < 16; i++) {
    const a = (i / 16) * Math.PI * 2;
    const petal = scaled(sph(0.17, 0xffc21f, 10), 0.42, 0.14, 1);
    head.add(at(petal, Math.cos(a) * 0.4, 0, Math.sin(a) * 0.4, 0, (-a * 180) / Math.PI + 90, 0));
  }
  for (let i = 0; i < 8; i++) head.add(at(sph(0.035, 0x3a2414, 6), Math.cos(i * 2.3) * 0.15, 0.06, Math.sin(i * 2.3) * 0.15));
  // Face the flower towards the camera so the petals read.
  g.add(at(head, 0.12, 1.78, 0.12, 55, 45, 0));
  return g;
}

function succulent() {
  const g = group(pot(0xf3efe6, 0.36, 0.4));
  const rings: [number, number, number, number][] = [
    [9, 0.24, 62, 1],
    [7, 0.14, 38, 0.82],
    [4, 0.05, 15, 0.65],
  ];
  rings.forEach(([n, r, tilt, s], k) => {
    for (let i = 0; i < n; i++) {
      const a = (i / n) * Math.PI * 2 + k * 0.4;
      const l = scaled(sph(0.15, k === 0 ? 0x7fbf8f : 0x9fd8a8, 12), 0.6 * s, 0.38 * s, 1.35 * s);
      const holder = new THREE.Group();
      holder.add(at(l, 0, 0, 0.17 * s));
      holder.position.set(Math.cos(a) * r, 0.48 + k * 0.06, Math.sin(a) * r);
      holder.rotation.set(0, Math.PI / 2 - a, 0);
      holder.children[0].rotation.x = -THREE.MathUtils.degToRad(90 - tilt) * 0.6;
      g.add(holder);
    }
  });
  return g;
}

function monstera() {
  const g = group(pot(0xf3efe6, 0.42, 0.62));
  const leafShape = new THREE.Shape();
  leafShape.moveTo(0, 0);
  leafShape.bezierCurveTo(0.55, 0.05, 0.6, 0.65, 0, 0.95);
  leafShape.bezierCurveTo(-0.6, 0.65, -0.55, 0.05, 0, 0);
  for (const [x, y] of [
    [0.22, 0.35],
    [-0.22, 0.35],
    [0.2, 0.6],
    [-0.2, 0.6],
  ]) {
    const h = new THREE.Path();
    h.absellipse(x, y, 0.06, 0.1, 0, Math.PI * 2, false, 0);
    leafShape.holes.push(h);
  }
  const leaves: [number, number, number][] = [
    [0, 1.3, 0],
    [70, 1.1, 1],
    [150, 1.2, 0],
    [220, 1.05, 1],
    [290, 1.25, 0],
  ];
  for (const [yaw, len, k] of leaves) {
    const arm = new THREE.Group();
    arm.add(at(cyl(0.03, 0.03, len, 0x4f8a2f, 6), 0, len / 2, 0));
    const leafMesh = slab(leafShape, 0.03, k ? 0x3f9c4a : 0x2f8a40, 0.01);
    arm.add(at(leafMesh, 0, len, 0, -35, 0, 0));
    arm.rotation.set(0, THREE.MathUtils.degToRad(yaw), THREE.MathUtils.degToRad(25));
    arm.position.y = 0.6;
    g.add(arm);
  }
  return g;
}

// ---------- Electronics ----------

function remote() {
  const g = group(at(box(0.6, 0.16, 1.8, 0x3a3f4a, 0.14), 0, 0.08, 0));
  g.add(at(cyl(0.09, 0.09, 0.04, 0xe74c3c, 14), 0, 0.17, -0.68));
  g.add(at(torus(0.17, 0.035, 0x9aa0aa, Math.PI * 2, 20), 0, 0.17, -0.3, 90), at(cyl(0.08, 0.08, 0.04, 0xdfe3ea, 14), 0, 0.17, -0.3));
  for (let r = 0; r < 4; r++) for (let k = 0; k < 3; k++) g.add(at(box(0.1, 0.04, 0.08, 0xdfe3ea, 0.02), -0.15 + k * 0.15, 0.17, 0.05 + r * 0.17));
  g.add(at(box(0.36, 0.04, 0.08, 0x5bc0de, 0.02), 0, 0.17, 0.75));
  return g;
}

export const HOME_MODELS: Record<string, Builder> = {
  soap,
  shampoo,
  lotion,
  sponge,
  towel,
  toiletRoll,
  toothbrush,
  toothpaste,
  comb,
  hairbrush,
  hairdryer,
  handMirror,
  sprayBottle,
  bucket,
  gloves,
  plunger,
  dustpan,
  toyBoat,
  guitar,
  drum,
  trumpet,
  maracas,
  microphone,
  keyboard,
  cactus,
  flowerVase,
  sunflower,
  succulent,
  monstera,
  remote,
};

export const HOME_NAMES: Record<string, string> = {
  toiletRoll: 'Toilet paper',
  handMirror: 'Mirror',
  sprayBottle: 'Spray bottle',
  toyBoat: 'Toy boat',
  flowerVase: 'Flowers',
  keyboard: 'Keyboard',
  remote: 'TV remote',
};
