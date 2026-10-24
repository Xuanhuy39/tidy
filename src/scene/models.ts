import * as THREE from 'three';
import { at, box, canvasTex, cyl, group, lathe, mat, mesh, poly, roundedRect, scaled, slab, sph, texMat, torus, tube } from './kit';

/**
 * Every pickable item, built from primitives in its resting pose. Sizes are
 * exaggerated toy-scale (1 unit ≈ a hand's width) so items are easy to tap.
 * Builders don't need to be centred; grounded() fixes that afterwards.
 */
type Builder = (variant: number) => THREE.Object3D;

const WHITE = 0xfaf6ee;
const DARK = 0x2e2a2b;
const METAL = 0xc9ced6;
const WOOD = 0xc98d55;

const pick = <T,>(list: T[], v: number) => list[((v % list.length) + list.length) % list.length];

// ---------- Stationery ----------

function pencil(v: number) {
  const body = pick([0xf5c33b, 0x4f9be8, 0xe45b5b], v);
  const shaft = at(cyl(0.14, 0.14, 1.9, body, 6), 0, 0, 0, 0, 0, 90);
  const ferrule = at(cyl(0.145, 0.145, 0.16, METAL, 12), -1.03, 0, 0, 0, 0, 90);
  const eraser = at(cyl(0.14, 0.14, 0.2, 0xf08fa0, 12), -1.2, 0, 0, 0, 0, 90);
  const wood = at(cyl(0.02, 0.14, 0.38, 0xf2d1a0, 6), 1.14, 0, 0, 0, 0, -90);
  const tip = at(cyl(0.0, 0.05, 0.12, DARK, 6), 1.36, 0, 0, 0, 0, -90);
  return group(shaft, ferrule, eraser, wood, tip);
}

function ruler() {
  const tex = canvasTex(512, 64, (c) => {
    c.fillStyle = '#9fd3a8';
    c.fillRect(0, 0, 512, 64);
    c.fillStyle = '#2f5c3a';
    for (let i = 0; i <= 50; i++) c.fillRect(8 + i * 9.9, 0, 2, i % 5 === 0 ? 26 : 14);
  });
  const mats = [mat(0x86c493), mat(0x86c493), texMat(tex), mat(0x86c493), mat(0x86c493), mat(0x86c493)];
  return mesh(new THREE.BoxGeometry(2.8, 0.08, 0.55), mats);
}

function setSquare() {
  const outer = poly([
    [-1.1, -0.7],
    [1.1, -0.7],
    [-1.1, 0.9],
  ]);
  outer.holes.push(
    poly([
      [-0.8, -0.45],
      [0.35, -0.45],
      [-0.8, 0.38],
    ]),
  );
  return slab(outer, 0.06, mat(0x8fd1c4, { transparent: true, opacity: 0.85 }), 0.02);
}

function penCup(v: number) {
  const cup = cyl(0.48, 0.44, 1.05, pick([0x5e8c5a, 0xd7744f, 0x5b8def], v), 28);
  cup.position.y = 0.52;
  const rim = at(torus(0.46, 0.04, 0x47703f), 0, 1.04, 0, 90);
  const inside = at(cyl(0.44, 0.44, 0.02, 0x3a3030), 0, 1.0, 0);
  const sticks = [
    [0xf5c33b, -0.15, 0.08, 8],
    [0x4f9be8, 0.16, -0.05, -10],
    [0xe45b5b, 0.02, 0.18, 4],
  ].map(([c, x, z, t]) => {
    const s = group(cyl(0.07, 0.07, 1.4, c as number, 6), at(cyl(0.0, 0.07, 0.18, 0xf2d1a0, 6), 0, 0.79, 0));
    return at(s, x as number, 1.25, z as number, t as number, 0, t as number);
  });
  return group(cup, rim, inside, ...sticks);
}

function notebook(v: number) {
  const cover = pick([0xe9776a, 0x6f8fd8, 0xf0b84a], v);
  const g = group(at(box(1.6, 0.08, 2.0, cover, 0.04), 0, 0.04, 0), at(box(1.5, 0.14, 1.92, WHITE, 0.02), 0.03, 0.15, 0), at(box(1.6, 0.06, 2.0, cover, 0.03), 0, 0.25, 0));
  for (let i = 0; i < 7; i++) g.add(at(torus(0.09, 0.025, METAL), -0.8, 0.15, -0.8 + i * 0.27, 0, 90));
  g.add(at(box(0.9, 0.01, 0.35, WHITE), 0.15, 0.285, -0.4));
  return g;
}

function eraser() {
  return group(at(box(0.95, 0.36, 0.55, 0xf4a0b0, 0.08), 0, 0.18, 0), at(box(0.5, 0.38, 0.57, 0x5b8def, 0.06), 0.24, 0.18, 0));
}

// ---------- Snacks ----------

function chipsBag(v: number) {
  const color = pick(['#e8443a', '#3f8fd8', '#2fae6a'], v);
  const tex = canvasTex(256, 320, (c) => {
    c.fillStyle = color;
    c.fillRect(0, 0, 256, 320);
    // Burst behind the chips.
    c.fillStyle = '#ffd54a';
    c.beginPath();
    for (let i = 0; i < 24; i++) {
      const a = (i / 24) * Math.PI * 2;
      const r = i % 2 ? 70 : 100;
      c.lineTo(128 + Math.cos(a) * r, 180 + Math.sin(a) * r);
    }
    c.fill();
    // A pile of chips.
    for (const [x, y, r] of [
      [100, 190, 34],
      [150, 175, 36],
      [128, 215, 32],
    ]) {
      c.fillStyle = '#f3b33c';
      c.beginPath();
      c.ellipse(x, y, r, r * 0.7, 0.3, 0, Math.PI * 2);
      c.fill();
      c.strokeStyle = '#c9822a';
      c.lineWidth = 4;
      c.stroke();
    }
    c.fillStyle = '#ffffff';
    c.strokeStyle = '#5a1f14';
    c.lineWidth = 10;
    c.font = 'bold 66px sans-serif';
    c.textAlign = 'center';
    c.textBaseline = 'middle';
    c.strokeText('CHIPS', 128, 70);
    c.fillText('CHIPS', 128, 70);
  });
  // A box puffed up in the middle and pinched flat at both sealed ends.
  const geo = new THREE.BoxGeometry(1.4, 0.6, 1.9, 14, 4, 18);
  const p = geo.getAttribute('position');
  for (let i = 0; i < p.count; i++) {
    const nx = p.getX(i) / 0.7;
    const nz = p.getZ(i) / 0.95;
    const puff = Math.sqrt(Math.max(0, 1 - nz ** 6)) * (1 - 0.35 * nx ** 4);
    p.setY(i, p.getY(i) * Math.max(puff, 0.08));
    p.setX(i, p.getX(i) * (1 - 0.08 * nz ** 2));
  }
  geo.computeVertexNormals();
  geo.translate(0, 0.3, 0);
  const side = mat(color);
  const bag = mesh(geo, [side, side, texMat(tex), side, side, side]);
  const g = group(bag);
  for (const z of [-0.98, 0.98]) {
    for (let i = 0; i < 7; i++) g.add(at(box(0.2, 0.06, 0.14, color), -0.6 + i * 0.2, 0.3, z, 0, 45, 0));
  }
  return g;
}

function popcorn() {
  const tex = canvasTex(256, 64, (c) => {
    for (let i = 0; i < 8; i++) {
      c.fillStyle = i % 2 ? '#ffffff' : '#e74c3c';
      c.fillRect(i * 32, 0, 32, 64);
    }
  });
  const cup = mesh(new THREE.CylinderGeometry(0.58, 0.42, 1.2, 8, 1, true), new THREE.MeshToonMaterial({ map: tex, side: THREE.DoubleSide }));
  cup.position.y = 0.6;
  const bottom = at(cyl(0.42, 0.42, 0.04, 0xe74c3c, 8), 0, 0.02, 0);
  const g = group(cup, bottom);
  const kernels = [
    [0, 1.25, 0],
    [0.28, 1.18, 0.1],
    [-0.25, 1.2, -0.12],
    [0.05, 1.18, 0.32],
    [-0.08, 1.15, -0.33],
    [0.3, 1.12, -0.22],
    [-0.32, 1.12, 0.22],
    [0.12, 1.42, 0.05],
    [-0.12, 1.38, 0.1],
  ];
  for (const [x, y, z] of kernels) g.add(at(scaled(sph(0.2, 0xfff3c4, 10), 1, 0.85, 1), x, y, z));
  return g;
}

function cookie() {
  const g = group(at(cyl(0.62, 0.6, 0.2, 0xd9a05b, 28), 0, 0.1, 0));
  const chips = [
    [0.2, 0.15],
    [-0.25, 0.2],
    [0.05, -0.3],
    [-0.3, -0.2],
    [0.35, -0.15],
    [0.0, 0.38],
  ];
  for (const [x, z] of chips) g.add(at(scaled(sph(0.08, 0x5a3825, 8), 1, 0.6, 1), x, 0.2, z));
  return g;
}

function chocolate() {
  const g = group(at(box(1.5, 0.2, 0.75, 0x7b3f2a, 0.05), 0, 0.1, 0), at(box(1.0, 0.23, 0.78, 0x6c4ac2, 0.05), 0.27, 0.11, 0));
  const tex = canvasTex(128, 64, (c) => {
    c.fillStyle = '#6c4ac2';
    c.fillRect(0, 0, 128, 64);
    c.fillStyle = '#ffd56b';
    c.font = 'bold 30px sans-serif';
    c.textAlign = 'center';
    c.textBaseline = 'middle';
    c.fillText('CHOCO', 64, 34);
  });
  const label = mesh(new THREE.PlaneGeometry(0.9, 0.42), texMat(tex));
  label.rotation.x = -Math.PI / 2;
  label.position.set(0.27, 0.231, 0);
  g.add(label);
  return g;
}

function lollipop() {
  const candy = at(cyl(0.48, 0.48, 0.2, 0xff7ab0, 32), 0, 0.12, 0);
  const swirl = at(torus(0.3, 0.05, 0xffffff), 0, 0.22, 0, 90);
  const swirl2 = at(torus(0.14, 0.045, 0xffffff), 0, 0.22, 0, 90);
  const stick = at(cyl(0.05, 0.05, 1.1, WHITE, 8), 0.95, 0.07, 0, 0, 0, 90);
  return group(candy, swirl, swirl2, stick);
}

// ---------- Electronics ----------

function phone(v: number) {
  const shell = pick([0x2e2a2b, 0xe9e4f0, 0x8fc1e3], v);
  const tex = canvasTex(128, 256, (c) => {
    const grd = c.createLinearGradient(0, 0, 128, 256);
    grd.addColorStop(0, '#6a7cf0');
    grd.addColorStop(1, '#f08ad0');
    c.fillStyle = grd;
    c.fillRect(0, 0, 128, 256);
    c.fillStyle = 'rgba(255,255,255,0.8)';
    for (let r = 0; r < 4; r++) for (let k = 0; k < 3; k++) c.fillRect(18 + k * 36, 40 + r * 44, 22, 22);
  });
  const screen = mesh(new THREE.PlaneGeometry(0.82, 1.68), texMat(tex));
  screen.rotation.x = -Math.PI / 2;
  screen.position.y = 0.121;
  return group(at(box(0.95, 0.12, 1.85, shell, 0.06), 0, 0.06, 0), screen);
}

function gamepad(v: number) {
  const body = pick([0x3a3f4a, 0xe74c3c], v);
  const grip = pick([0x2c3038, 0xc23b2e], v);
  const g = group(
    at(box(1.5, 0.34, 0.8, body, 0.16), 0, 0.2, -0.1),
    at(scaled(sph(0.36, grip, 20), 1, 0.55, 1.35), -0.58, 0.2, 0.28, 0, -20, 0),
    at(scaled(sph(0.36, grip, 20), 1, 0.55, 1.35), 0.58, 0.2, 0.28, 0, 20, 0),
    // D-pad
    at(box(0.36, 0.08, 0.12, 0xe9e9ee, 0.03), -0.45, 0.4, -0.12),
    at(box(0.12, 0.08, 0.36, 0xe9e9ee, 0.03), -0.45, 0.4, -0.12),
    // Thumbsticks
    at(cyl(0.11, 0.13, 0.12, 0x9aa0aa, 16), -0.2, 0.43, 0.2),
    at(cyl(0.13, 0.13, 0.04, 0x5b6170, 16), -0.2, 0.5, 0.2),
    at(cyl(0.11, 0.13, 0.12, 0x9aa0aa, 16), 0.2, 0.43, 0.2),
    at(cyl(0.13, 0.13, 0.04, 0x5b6170, 16), 0.2, 0.5, 0.2),
    // Start / select
    at(box(0.12, 0.04, 0.06, 0xe9e9ee, 0.02), -0.1, 0.38, -0.22),
    at(box(0.12, 0.04, 0.06, 0xe9e9ee, 0.02), 0.1, 0.38, -0.22),
  );
  const btn = [
    [0x2ecc71, 0.45, 0.02],
    [0xe74c3c, 0.6, -0.12],
    [0x3498db, 0.3, -0.12],
    [0xf1c40f, 0.45, -0.26],
  ];
  for (const [c, x, z] of btn) g.add(at(cyl(0.075, 0.075, 0.08, c, 14), x, 0.4, z));
  return g;
}

function headphones(v: number) {
  const c = pick([DARK, 0xf27ea9, 0xf3efe6], v);
  const band = at(torus(0.75, 0.09, c, Math.PI, 32), 0, 0.17, 0, -90);
  const pad = 0x555055;
  const cupL = group(at(cyl(0.36, 0.36, 0.3, c, 24), 0, 0, 0), at(cyl(0.3, 0.3, 0.06, pad, 24), 0, 0.17, 0));
  const cupR = cupL.clone();
  return group(band, at(cupL, -0.75, 0.17, 0, 0, 0, 90), at(cupR, 0.75, 0.17, 0, 0, 0, -90));
}

function mouse() {
  const shellGeo = new THREE.SphereGeometry(0.5, 32, 20, 0, Math.PI * 2, 0, Math.PI / 2);
  shellGeo.scale(0.64, 0.5, 1.0);
  return group(
    mesh(shellGeo, 0x8e96a6),
    at(scaled(cyl(0.32, 0.32, 0.05, 0x3a3f4a, 28), 1, 1, 1.56), 0, 0.02, 0),
    // Button split and scroll wheel.
    at(box(0.025, 0.05, 0.42, 0x3a3f4a), 0, 0.2, -0.27, -22),
    at(cyl(0.07, 0.07, 0.09, 0x5b8def, 14), 0, 0.235, -0.22, 0, 0, 90),
    // Cable out of the front.
    tube(
      [
        [0, 0.08, -0.48],
        [0.03, 0.05, -0.75],
        [0.3, 0.04, -0.95],
        [0.65, 0.04, -1.02],
      ],
      0.04,
      0x3a3f4a,
    ),
  );
}

function handheld() {
  const tex = canvasTex(128, 64, (c) => {
    c.fillStyle = '#20262e';
    c.fillRect(0, 0, 128, 64);
    c.fillStyle = '#7ad3f0';
    c.fillRect(8, 8, 112, 48);
    c.fillStyle = '#f7d154';
    c.beginPath();
    c.arc(64, 32, 12, 0, Math.PI * 2);
    c.fill();
  });
  const screen = mesh(new THREE.PlaneGeometry(1.1, 0.6), texMat(tex));
  screen.rotation.x = -Math.PI / 2;
  screen.position.set(0, 0.165, 0);
  return group(
    at(box(1.3, 0.16, 0.82, 0x2a2e36, 0.05), 0, 0.08, 0),
    at(box(0.38, 0.18, 0.82, 0x3fb7e0, 0.14), -0.82, 0.09, 0),
    at(box(0.38, 0.18, 0.82, 0xf25c54, 0.14), 0.82, 0.09, 0),
    at(cyl(0.07, 0.07, 0.08, DARK, 12), -0.82, 0.2, -0.15),
    at(cyl(0.07, 0.07, 0.08, DARK, 12), 0.82, 0.2, 0.15),
    screen,
  );
}

function speaker() {
  // A boombox: easier to read as "electronics" than a cylinder.
  const cone = (x: number) =>
    group(
      at(cyl(0.36, 0.36, 0.06, 0x2c3038, 28), 0, 0, 0, 90),
      at(cyl(0.3, 0.3, 0.07, 0x5a6070, 28), 0, 0, 0.01, 90),
      at(cyl(0.12, 0.12, 0.09, 0x9aa0aa, 20), 0, 0, 0.02, 90),
      at(torus(0.33, 0.03, 0xc9ced6, Math.PI * 2, 32), 0, 0, 0.04),
    ).translateX(x);
  return group(
    at(box(2.0, 1.0, 0.62, 0xe9523f, 0.12), 0, 0.5, 0),
    at(box(1.86, 0.18, 0.64, 0x2c3038, 0.05), 0, 0.12, 0),
    at(cone(-0.58), 0, 0.55, 0.32),
    at(cone(0.58), 0, 0.55, 0.32),
    at(box(0.5, 0.32, 0.04, 0x9fd8f2, 0.04), 0, 0.62, 0.32),
    at(box(0.3, 0.08, 0.05, 0x2c3038, 0.02), 0, 0.62, 0.33),
    // Handle
    at(box(0.1, 0.35, 0.12, 0x2c3038, 0.04), -0.75, 1.1, 0),
    at(box(0.1, 0.35, 0.12, 0x2c3038, 0.04), 0.75, 1.1, 0),
    at(box(1.6, 0.1, 0.14, 0x2c3038, 0.05), 0, 1.28, 0),
    // Buttons on top
    at(box(0.14, 0.08, 0.12, 0xf2b632, 0.03), -0.2, 1.03, -0.1),
    at(box(0.14, 0.08, 0.12, 0x3fb5a5, 0.03), 0, 1.03, -0.1),
    at(box(0.14, 0.08, 0.12, 0xf5f5f5, 0.03), 0.2, 1.03, -0.1),
  );
}

function tablet() {
  const tex = canvasTex(256, 192, (c) => {
    const grd = c.createLinearGradient(0, 0, 0, 192);
    grd.addColorStop(0, '#7fd0f5');
    grd.addColorStop(1, '#d9f3ff');
    c.fillStyle = grd;
    c.fillRect(0, 0, 256, 192);
    c.fillStyle = '#ffd54a';
    c.beginPath();
    c.arc(190, 50, 26, 0, Math.PI * 2);
    c.fill();
    c.fillStyle = '#6cc070';
    c.beginPath();
    c.moveTo(0, 192);
    c.quadraticCurveTo(70, 90, 140, 150);
    c.quadraticCurveTo(200, 110, 256, 140);
    c.lineTo(256, 192);
    c.fill();
    c.fillStyle = 'rgba(255,255,255,0.9)';
    c.fillRect(0, 0, 256, 16);
  });
  const screen = mesh(new THREE.PlaneGeometry(1.9, 1.38), texMat(tex));
  screen.rotation.x = -Math.PI / 2;
  screen.position.y = 0.135;
  // Landscape, dark bezel and a coloured case so it never reads as a big phone.
  return group(
    at(box(2.3, 0.1, 1.72, 0x6c4ac2, 0.08), 0, 0.05, 0),
    at(box(2.12, 0.04, 1.58, 0x22252c, 0.04), 0, 0.11, 0),
    screen,
    at(cyl(0.03, 0.03, 0.02, 0x555a66, 10), -1.0, 0.13, 0),
  );
}

function camera() {
  return group(
    at(box(1.4, 0.85, 0.6, DARK, 0.1), 0, 0.43, 0),
    at(box(1.42, 0.3, 0.62, 0xb97a4b, 0.06), 0, 0.3, 0),
    at(cyl(0.3, 0.32, 0.4, 0x3c3c40, 28), 0.05, 0.45, 0.45, 90),
    at(cyl(0.22, 0.22, 0.05, 0x5a7fc0, 28), 0.05, 0.45, 0.66, 90),
    at(box(0.3, 0.16, 0.3, METAL, 0.04), -0.4, 0.92, 0),
    at(cyl(0.08, 0.08, 0.1, 0xe74c3c, 12), 0.45, 0.9, 0),
  );
}

// ---------- Fruit ----------

function leaf(x: number, y: number, z: number, rz = 30) {
  const geo = new THREE.SphereGeometry(0.15, 12, 8);
  geo.scale(1, 0.25, 0.5);
  return at(mesh(geo, 0x5bb04a), x, y, z, 0, 0, rz);
}

function apple() {
  const body = lathe(
    [
      [0, 0.05],
      [0.3, 0],
      [0.5, 0.2],
      [0.56, 0.48],
      [0.45, 0.82],
      [0.2, 0.9],
      [0, 0.82],
    ],
    0xe8443a,
  );
  return group(body, at(cyl(0.035, 0.04, 0.3, 0x6b4a2b, 8), 0.02, 0.95, 0, 0, 0, -10), leaf(0.16, 1.0, 0));
}

/** One banana lying flat: a curved, tapered, slightly ridged sweep from stem (origin) to tip. */
function bananaFinger(): THREE.Group {
  const len = 1.9;
  const bend = 1.15;
  const curve = new THREE.CatmullRomCurve3(
    Array.from({ length: 9 }, (_, i) => {
      const a = (i / 8) * (len / bend);
      return new THREE.Vector3(Math.sin(a) * bend, 0.06 * Math.sin((i / 8) * Math.PI), (1 - Math.cos(a)) * bend);
    }),
  );
  const tubular = 48;
  const radial = 6; // a few flat sides give the ridged banana look
  const geo = new THREE.TubeGeometry(curve, tubular, 0.2, radial, false);
  const pos = geo.getAttribute('position');
  for (let i = 0; i <= tubular; i++) {
    const t = i / tubular;
    const c = curve.getPointAt(t);
    const taper = Math.max(0.22, Math.sin(Math.PI * Math.min(1, 0.08 + t * 0.92)) ** 0.5);
    for (let j = 0; j <= radial; j++) {
      const k = i * (radial + 1) + j;
      const v = new THREE.Vector3().fromBufferAttribute(pos, k).sub(c).multiplyScalar(taper).add(c);
      pos.setXYZ(k, v.x, v.y, v.z);
    }
  }
  geo.computeVertexNormals();
  const tip = curve.getPointAt(1);
  const tipDir = curve.getTangentAt(1);
  const stemDir = curve.getTangentAt(0).negate();
  const stem = cyl(0.05, 0.07, 0.32, 0x8a9a3a, 8);
  stem.position.copy(stemDir.clone().multiplyScalar(0.14));
  stem.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), stemDir);
  const nub = sph(0.055, 0x4a3420, 8);
  nub.position.copy(tip).addScaledVector(tipDir, 0.02);
  return group(mesh(geo, 0xf7d046), stem, nub);
}

function banana() {
  // A small bunch of three, fanned out from a shared stem: the classic banana silhouette.
  const g = new THREE.Group();
  [
    [-24, 0],
    [0, 0.16],
    [24, 0],
  ].forEach(([deg, lift]) => {
    const f = bananaFinger();
    f.rotation.y = THREE.MathUtils.degToRad(deg);
    f.position.y = lift;
    g.add(f);
  });
  g.add(at(cyl(0.11, 0.13, 0.3, 0x6b7a2a, 10), -0.28, 0.12, 0, 0, 0, 90));
  g.add(at(cyl(0.12, 0.12, 0.05, 0x4a3420, 10), -0.44, 0.12, 0, 0, 0, 90));
  return g;
}

function orange() {
  const geo = new THREE.SphereGeometry(0.52, 28, 20);
  geo.scale(1, 0.92, 1);
  return group(at(mesh(geo, 0xf59a23), 0, 0.48, 0), at(sph(0.05, 0x6b8a2b, 8), 0, 0.96, 0), leaf(0.12, 0.98, 0.05, 15));
}

function pear() {
  const body = lathe(
    [
      [0, 0],
      [0.32, 0.03],
      [0.48, 0.28],
      [0.44, 0.55],
      [0.26, 0.85],
      [0.2, 1.05],
      [0.1, 1.2],
      [0, 1.22],
    ],
    0xb7d34a,
  );
  return group(body, at(cyl(0.03, 0.04, 0.25, 0x6b4a2b, 8), 0, 1.3, 0, 0, 0, 12), leaf(0.13, 1.3, 0, 25));
}

function strawberry() {
  const pts: [number, number][] = [];
  for (let i = 0; i <= 16; i++) {
    const t = i / 16;
    const r = 0.5 * Math.sin(Math.PI * Math.min(1, t * 1.15)) ** 0.75 * (0.35 + 0.65 * t);
    pts.push([Math.max(r, 0.001), t * 1.0]);
  }
  pts.push([0, 1.0]);
  const g = group(lathe(pts, 0xe8344a, 32));
  for (let row = 0; row < 5; row++) {
    const y = 0.18 + row * 0.16;
    const t = y;
    const r = 0.5 * Math.sin(Math.PI * Math.min(1, t * 1.15)) ** 0.75 * (0.35 + 0.65 * t);
    for (let k = 0; k < 9; k++) {
      const a = (k / 9) * Math.PI * 2 + row * 0.35;
      const seed = scaled(sph(0.035, 0xfff1a0, 6), 1, 1.6, 1);
      g.add(at(seed, Math.cos(a) * r, y, Math.sin(a) * r));
    }
  }
  for (let i = 0; i < 6; i++) {
    const a = (i / 6) * Math.PI * 2;
    const l = new THREE.SphereGeometry(0.2, 10, 6);
    l.scale(1, 0.18, 0.42);
    g.add(at(mesh(l, 0x3f9c40), Math.cos(a) * 0.17, 1.0, Math.sin(a) * 0.17, 0, (-a * 180) / Math.PI, -15));
  }
  g.add(at(cyl(0.035, 0.05, 0.2, 0x4f8a2f, 8), 0, 1.1, 0));
  return g;
}

function lemon() {
  const pts: [number, number][] = [];
  for (let i = 0; i <= 24; i++) {
    const t = i / 24;
    const y = -0.65 + t * 1.3;
    const r = 0.42 * Math.sin(Math.PI * t) ** 0.85;
    pts.push([Math.max(r, 0.001), y]);
  }
  const body = lathe(pts, 0xf7d93c, 40);
  const g = group(body, at(sph(0.06, 0xe9c22a, 10), 0, 0.66, 0), at(sph(0.05, 0xe9c22a, 10), 0, -0.66, 0));
  g.add(at(leaf(0.12, 0.7, 0, 60), 0, 0, 0));
  return group(at(g, 0, 0.42, 0, 0, 0, 90));
}

// ---------- Drinks ----------

function sodaCan(v: number) {
  const c = pick([0xe74c3c, 0x2f8ae0, 0x48b856], v);
  const tex = canvasTex(256, 128, (x) => {
    x.fillStyle = '#' + new THREE.Color(c).getHexString();
    x.fillRect(0, 0, 256, 128);
    x.fillStyle = '#ffffff';
    x.fillRect(0, 50, 256, 12);
    x.font = 'bold 40px sans-serif';
    x.fillText('FIZZ', 30, 42);
    x.fillText('FIZZ', 158, 42);
  });
  const body = mesh(new THREE.CylinderGeometry(0.36, 0.36, 1.0, 28, 1, true), texMat(tex));
  body.position.y = 0.58;
  return group(
    body,
    at(cyl(0.3, 0.36, 0.08, METAL, 28), 0, 0.04, 0),
    at(cyl(0.3, 0.36, 0.1, METAL, 28), 0, 1.13, 0, 180),
    at(box(0.14, 0.02, 0.08, 0x9aa0a8, 0.01), 0.06, 1.19, 0),
  );
}

function milkCarton() {
  const shape = poly([
    [-0.38, 0],
    [0.38, 0],
    [0.38, 1.0],
    [0, 1.35],
    [-0.38, 1.0],
  ]);
  const geo = new THREE.ExtrudeGeometry(shape, { depth: 0.76, bevelEnabled: false });
  geo.translate(0, 0, -0.38);
  const tex = canvasTex(128, 128, (c) => {
    c.fillStyle = '#ffffff';
    c.fillRect(0, 0, 128, 128);
    c.fillStyle = '#3d7fd9';
    c.fillRect(0, 70, 128, 58);
    c.fillStyle = '#3d7fd9';
    c.font = 'bold 34px sans-serif';
    c.textAlign = 'center';
    c.fillText('MILK', 64, 52);
  });
  const sides = mesh(geo, [texMat(tex), mat(0x3d7fd9)]);
  return group(sides, at(box(0.06, 0.18, 0.76, WHITE), 0, 1.4, 0));
}

function waterBottle() {
  const body = lathe(
    [
      [0, 0],
      [0.34, 0],
      [0.36, 0.1],
      [0.36, 1.0],
      [0.22, 1.25],
      [0.14, 1.35],
      [0, 1.35],
    ],
    mat(0x9fd8f2, { transparent: true, opacity: 0.75 }),
  );
  return group(body, at(cyl(0.38, 0.38, 0.32, 0x3fa0d6, 28), 0, 0.6, 0), at(cyl(0.15, 0.15, 0.18, 0x2d6fb0, 16), 0, 1.43, 0));
}

function juiceBox() {
  const tex = canvasTex(128, 192, (c) => {
    c.fillStyle = '#ffa53b';
    c.fillRect(0, 0, 128, 192);
    c.fillStyle = '#f7d046';
    c.beginPath();
    c.arc(64, 100, 38, 0, Math.PI * 2);
    c.fill();
    c.fillStyle = '#5bb04a';
    c.fillRect(56, 54, 16, 14);
  });
  const sides = mesh(new THREE.BoxGeometry(0.75, 1.15, 0.5), [mat(0xffa53b), mat(0xffa53b), mat(0xffa53b), mat(0xffa53b), texMat(tex), texMat(tex)]);
  sides.position.y = 0.575;
  const straw = group(at(cyl(0.035, 0.035, 0.5, 0xffffff, 8), 0, 0.25, 0), at(cyl(0.035, 0.035, 0.22, 0xffffff, 8), 0.07, 0.55, 0, 0, 0, -60));
  return group(sides, at(straw, 0.18, 1.15, 0.05));
}

function coffeeCup() {
  return group(
    lathe(
      [
        [0, 0],
        [0.3, 0],
        [0.42, 1.1],
        [0, 1.1],
      ],
      WHITE,
    ),
    at(cyl(0.4, 0.37, 0.35, 0xb98455, 28), 0, 0.6, 0),
    at(cyl(0.4, 0.46, 0.12, 0x4a3a33, 28), 0, 1.15, 0),
    at(cyl(0.3, 0.38, 0.08, 0x4a3a33, 28), 0, 1.24, 0),
  );
}

// ---------- Tableware ----------

function plate(v: number) {
  const rim = pick([0x5b8def, 0xe8524a, 0x3fa36b], v);
  const glaze = pick([0xd9e8fa, 0xfadfd9, 0xdcf2df], v);
  const dish = lathe(
    [
      [0, 0.04],
      [0.5, 0.04],
      [0.62, 0.08],
      [0.9, 0.18],
      [0.92, 0.2],
      [0.9, 0.12],
      [0.6, 0.02],
      [0.4, 0],
      [0, 0],
    ],
    mat(glaze, { side: THREE.DoubleSide }),
    48,
  );
  return group(
    dish,
    at(torus(0.84, 0.035, rim, Math.PI * 2, 48), 0, 0.18, 0, 90),
    at(torus(0.56, 0.02, rim, Math.PI * 2, 40), 0, 0.075, 0, 90),
  );
}

function mug(v: number) {
  const c = pick([0xf0b84a, 0x7fc3e8, 0xe98aa8], v);
  return group(
    at(cyl(0.42, 0.4, 0.85, c, 28), 0, 0.43, 0),
    at(cyl(0.36, 0.36, 0.02, 0x6b4028, 28), 0, 0.8, 0),
    at(torus(0.22, 0.07, c, Math.PI * 2, 20), 0.46, 0.43, 0),
  );
}

function spoon() {
  // Chunky "kids' cutlery": metal head, coloured handle, so it reads at icon size.
  const bowl = new THREE.SphereGeometry(0.3, 24, 12, 0, Math.PI * 2, Math.PI / 2, Math.PI / 2);
  bowl.scale(1.35, 0.45, 1);
  return group(
    at(mesh(bowl, METAL), -0.85, 0.14, 0, 180),
    at(box(0.5, 0.08, 0.12, METAL, 0.03), -0.35, 0.08, 0),
    at(box(1.0, 0.14, 0.22, 0x3fb5a5, 0.07), 0.4, 0.08, 0),
  );
}

function fork() {
  const g = group(
    at(box(1.0, 0.14, 0.22, 0xf08a3c, 0.07), 0.45, 0.08, 0),
    at(box(0.5, 0.08, 0.12, METAL, 0.03), -0.25, 0.06, 0),
    at(box(0.3, 0.08, 0.44, METAL, 0.04), -0.55, 0.06, 0),
  );
  for (let i = 0; i < 4; i++) g.add(at(box(0.46, 0.07, 0.07, METAL, 0.03), -0.9, 0.06, -0.165 + i * 0.11));
  return g;
}

function bowl(v: number) {
  const c = pick([0xf28b6a, 0x8fc1e3, 0xf3d36b], v);
  const outer = lathe(
    [
      [0, 0],
      [0.32, 0],
      [0.62, 0.3],
      [0.72, 0.55],
      [0.66, 0.56],
      [0.58, 0.34],
      [0.28, 0.08],
      [0, 0.08],
    ],
    mat(c, { side: THREE.DoubleSide }),
  );
  return group(outer);
}

function pan() {
  return group(
    lathe(
      [
        [0, 0],
        [0.66, 0],
        [0.74, 0.25],
        [0.7, 0.26],
        [0.62, 0.06],
        [0, 0.06],
      ],
      mat(0x3a3a40, { side: THREE.DoubleSide }),
      36,
    ),
    at(box(1.0, 0.1, 0.16, 0x6b4a2b, 0.05), 1.15, 0.18, 0, 0, 0, 8),
  );
}

// ---------- Bakery ----------

function bread() {
  const g = group(at(box(1.5, 0.6, 0.85, 0xd9954a, 0.28), 0, 0.3, 0));
  for (let i = 0; i < 3; i++) g.add(at(box(0.08, 0.04, 0.6, 0xf2d1a0, 0.02), -0.4 + i * 0.4, 0.6, 0, 0, 25));
  return g;
}

function croissant() {
  const g = new THREE.Group();
  const n = 5;
  for (let i = 0; i < n; i++) {
    const t = i / (n - 1);
    const a = Math.PI * (0.15 + t * 0.7);
    const r = 0.32 - Math.abs(t - 0.5) * 0.32;
    const s = sph(r + 0.06, i % 2 ? 0xe09a4a : 0xd38438, 16);
    s.scale.set(1, 0.75, 1.1);
    g.add(at(s, Math.cos(a) * 0.62, 0.22, Math.sin(a) * 0.62 - 0.3, 0, (-a * 180) / Math.PI, 0));
  }
  return g;
}

function donut(v: number) {
  const icing = pick([0xf58fb5, 0x8a5a3c, 0xa8d8f0], v);
  const g = group(at(torus(0.42, 0.22, 0xe0a55a, Math.PI * 2, 32), 0, 0.22, 0, 90));
  const top = new THREE.TorusGeometry(0.42, 0.205, 12, 32, Math.PI * 2);
  const icingMesh = mesh(top, icing);
  icingMesh.scale.set(1, 1, 0.75);
  g.add(at(icingMesh, 0, 0.29, 0, 90));
  const colors = [0xffffff, 0xf7d046, 0x5bc0de, 0x8bc34a];
  for (let i = 0; i < 14; i++) {
    const a = i * 2.1;
    const r = 0.42 + Math.sin(i * 1.7) * 0.12;
    g.add(at(box(0.09, 0.025, 0.025, colors[i % 4]), Math.cos(a) * r, 0.44, Math.sin(a) * r, 0, i * 47, 0));
  }
  return g;
}

function cupcake(v: number) {
  const frost = pick([0xf7b5cd, 0xb7e3f5, 0xf5e6b8], v);
  const wrapper = mesh(new THREE.CylinderGeometry(0.42, 0.32, 0.55, 16), 0x6fb7e8);
  wrapper.position.y = 0.28;
  const g = group(wrapper);
  [
    [0.44, 0.62],
    [0.36, 0.8],
    [0.24, 0.96],
  ].forEach(([r, y]) => g.add(at(torus(r, 0.13, frost, Math.PI * 2, 24), 0, y, 0, 90)));
  g.add(at(sph(0.12, 0xd6303f, 12), 0, 1.12, 0));
  return g;
}

function cakeSlice() {
  const tri = poly([
    [-0.55, -0.45],
    [0.55, -0.45],
    [0, 0.65],
  ]);
  const layer = (y: number, h: number, c: number) => at(slab(tri, h, c, 0.03), 0, y, 0);
  return group(
    layer(0, 0.22, 0xf3d9a4),
    layer(0.26, 0.08, 0xf5f0f0),
    layer(0.36, 0.22, 0xf3d9a4),
    layer(0.6, 0.08, 0xf7b5cd),
    at(sph(0.12, 0xd6303f, 12), 0, 0.8, 0.15),
  );
}

// ---------- Clothes ----------

function tshirt(v: number) {
  const c = pick([0xf2b632, 0x5b8def, 0xe45b8f], v);
  const s = poly([
    [-0.42, -0.75],
    [0.42, -0.75],
    [0.42, 0.25],
    [0.78, 0.05],
    [0.95, 0.38],
    [0.5, 0.72],
    [0.18, 0.72],
    [0, 0.58],
    [-0.18, 0.72],
    [-0.5, 0.72],
    [-0.95, 0.38],
    [-0.78, 0.05],
    [-0.42, 0.25],
  ]);
  const g = group(slab(s, 0.1, c, 0.05));
  g.add(at(cyl(0.24, 0.24, 0.03, 0xffffff, 24), 0, 0.16, 0.05));
  g.add(at(cyl(0.14, 0.14, 0.04, 0xf08a3c, 5), 0, 0.17, 0.05));
  g.add(at(scaled(torus(0.17, 0.035, 0xffffff, Math.PI, 16), 1, 1, 1), 0, 0.16, -0.58, 90, 0, 180));
  return g;
}

function sweater(v: number) {
  const c = pick([0xe9a23b, 0x9b6fd0, 0xd65a4a], v);
  const rib = new THREE.Color(c).multiplyScalar(0.78).getHex();
  // Laid flat with long sleeves, ribbed cuffs and a knitted stripe.
  const s = poly([
    [-0.48, -0.78],
    [0.48, -0.78],
    [0.48, 0.18],
    [1.05, -0.62],
    [1.3, -0.46],
    [0.62, 0.72],
    [0.22, 0.78],
    [0, 0.64],
    [-0.22, 0.78],
    [-0.62, 0.72],
    [-1.3, -0.46],
    [-1.05, -0.62],
    [-0.48, 0.18],
  ]);
  const g = group(slab(s, 0.14, c, 0.06));
  g.add(at(box(1.0, 0.04, 0.16, rib, 0.02), 0, 0.22, 0.7));
  g.add(at(box(0.34, 0.04, 0.16, rib, 0.02), 1.18, 0.22, 0.54, 0, -52, 0));
  g.add(at(box(0.34, 0.04, 0.16, rib, 0.02), -1.18, 0.22, 0.54, 0, 52, 0));
  for (const z of [-0.05, 0.12]) g.add(at(box(0.94, 0.03, 0.07, 0xffffff), 0, 0.22, z));
  for (let i = 0; i < 5; i++) g.add(at(box(0.07, 0.035, 0.07, 0xffffff), -0.36 + i * 0.18, 0.225, 0.035, 0, 45, 0));
  g.add(at(torus(0.2, 0.05, rib, Math.PI, 20), 0, 0.22, -0.66, 90, 0, 180));
  return g;
}

function sock(v: number) {
  const c = pick([0x5bc0de, 0xf28b6a, 0x8bc34a], v);
  const s = poly([
    [-0.22, 0.75],
    [0.22, 0.75],
    [0.22, -0.2],
    [0.62, -0.32],
    [0.62, -0.62],
    [-0.1, -0.62],
    [-0.22, -0.4],
  ]);
  const g = group(slab(s, 0.12, c, 0.06));
  g.add(at(box(0.5, 0.03, 0.2, 0xffffff, 0.01), 0, 0.2, -0.62));
  g.add(at(box(0.5, 0.03, 0.08, 0xffffff), 0, 0.2, -0.38));
  return g;
}

function cap(v: number) {
  const c = pick([0xe74c3c, 0x2f6fd0, 0x3a3f4a], v);
  const domeGeo = new THREE.SphereGeometry(0.5, 24, 12, 0, Math.PI * 2, 0, Math.PI / 2);
  const brim = mesh(new THREE.CylinderGeometry(0.42, 0.42, 0.05, 24, 1, false, -Math.PI / 2, Math.PI), c);
  brim.scale.set(1.0, 1, 1.4);
  return group(mesh(domeGeo, c), at(brim, 0, 0.03, 0.42), at(sph(0.06, 0xffffff, 8), 0, 0.5, 0));
}

function sneaker(v: number) {
  const c = pick([0xe74c3c, 0x4f9be8, 0x2fb37a], v);
  const extrudeSide = (shape: THREE.Shape, depth: number, color: number) => {
    const geo = new THREE.ExtrudeGeometry(shape, { depth, bevelEnabled: true, bevelThickness: 0.05, bevelSize: 0.05, bevelSegments: 3, curveSegments: 18 });
    geo.translate(0, 0, -depth / 2);
    return mesh(geo, color);
  };
  // Side profile (x along the shoe, y up), extruded across its width.
  const upper = new THREE.Shape();
  upper.moveTo(-0.82, 0.12);
  upper.lineTo(0.7, 0.12);
  upper.quadraticCurveTo(0.95, 0.14, 0.86, 0.32);
  upper.quadraticCurveTo(0.6, 0.48, 0.22, 0.52);
  upper.lineTo(-0.12, 0.78);
  upper.lineTo(-0.62, 0.82);
  upper.quadraticCurveTo(-0.86, 0.78, -0.84, 0.5);
  upper.closePath();
  const sole = new THREE.Shape();
  sole.moveTo(-0.86, 0);
  sole.lineTo(0.8, 0);
  sole.quadraticCurveTo(0.98, 0.04, 0.94, 0.18);
  sole.lineTo(-0.88, 0.18);
  sole.closePath();
  const g = group(extrudeSide(upper, 0.5, c), extrudeSide(sole, 0.58, 0xffffff));
  // Collar opening, laces, side stripe, toe cap.
  g.add(at(scaled(cyl(0.2, 0.2, 0.05, 0x2c3038, 20), 1.15, 1, 0.75), -0.42, 0.85, 0, 0, 0, 5));
  for (let i = 0; i < 4; i++) g.add(at(box(0.06, 0.04, 0.46, 0xffffff, 0.02), 0.28 - i * 0.12, 0.56 + i * 0.065, 0, 0, 0, 28));
  const stripe = new THREE.Shape();
  stripe.moveTo(-0.55, 0.3);
  stripe.quadraticCurveTo(0.0, 0.18, 0.45, 0.4);
  stripe.quadraticCurveTo(0.0, 0.3, -0.5, 0.42);
  stripe.closePath();
  for (const z of [0.3, -0.36]) {
    const st = mesh(new THREE.ExtrudeGeometry(stripe, { depth: 0.06, bevelEnabled: false }), 0xffffff);
    st.position.z = z;
    g.add(st);
  }
  g.add(at(scaled(sph(0.26, 0xf3f3f3, 16), 1.1, 0.55, 1.05), 0.68, 0.2, 0));
  return g;
}

function beanie(v: number) {
  const c = pick([0x3fa36b, 0xe45b8f, 0x5b8def], v);
  const dome = mesh(new THREE.SphereGeometry(0.5, 24, 12, 0, Math.PI * 2, 0, Math.PI / 2), c);
  dome.position.y = 0.22;
  return group(dome, at(cyl(0.52, 0.52, 0.26, 0xf3efe6, 28), 0, 0.13, 0), at(sph(0.17, 0xf3efe6, 12), 0, 0.76, 0));
}

// ---------- Toys ----------

function teddy() {
  const fur = 0xc48a55;
  const light = 0xf0d2a8;
  return group(
    at(scaled(sph(0.45, fur), 1, 1.05, 0.9), 0, 0.45, 0),
    at(scaled(sph(0.28, light), 1, 1, 0.5), 0, 0.42, 0.3),
    at(sph(0.38, fur), 0, 1.12, 0),
    at(scaled(sph(0.16, light), 1, 0.8, 0.8), 0, 1.04, 0.3),
    at(sph(0.05, DARK, 8), 0, 1.09, 0.43),
    at(sph(0.045, DARK, 8), -0.13, 1.2, 0.33),
    at(sph(0.045, DARK, 8), 0.13, 1.2, 0.33),
    at(sph(0.14, fur), -0.28, 1.42, 0),
    at(sph(0.14, fur), 0.28, 1.42, 0),
    at(scaled(sph(0.16, fur), 1, 1.4, 1), -0.45, 0.55, 0.1, 0, 0, -30),
    at(scaled(sph(0.16, fur), 1, 1.4, 1), 0.45, 0.55, 0.1, 0, 0, 30),
    at(scaled(sph(0.19, fur), 1, 0.8, 1.3), -0.25, 0.12, 0.3),
    at(scaled(sph(0.19, fur), 1, 0.8, 1.3), 0.25, 0.12, 0.3),
    at(scaled(cyl(0.15, 0.15, 0.04, 0xd6303f, 3), 1, 1, 0.6), 0, 0.82, 0.3, 90, 0, 90),
  );
}

function rubiks() {
  const faces = ['#e74c3c', '#f39c12', '#ffffff', '#f1c40f', '#2ecc71', '#3498db'];
  const mats = faces.map((f) =>
    texMat(
      canvasTex(96, 96, (c) => {
        c.fillStyle = '#1e1e22';
        c.fillRect(0, 0, 96, 96);
        c.fillStyle = f;
        for (let i = 0; i < 3; i++) for (let j = 0; j < 3; j++) c.fillRect(4 + i * 31, 4 + j * 31, 27, 27);
      }),
    ),
  );
  return group(at(mesh(new THREE.BoxGeometry(0.9, 0.9, 0.9), mats), 0, 0.45, 0, 0, 20, 0));
}

function toyCar(v: number) {
  const c = pick([0xe74c3c, 0x4f9be8, 0xf2b632], v);
  const g = group(at(box(1.5, 0.35, 0.75, c, 0.12), 0, 0.38, 0), at(box(0.8, 0.35, 0.65, c, 0.14), -0.1, 0.7, 0), at(box(0.82, 0.22, 0.67, 0xbfe6f5, 0.08), -0.1, 0.72, 0));
  for (const [x, z] of [
    [-0.48, 0.37],
    [0.48, 0.37],
    [-0.48, -0.37],
    [0.48, -0.37],
  ])
    g.add(at(cyl(0.2, 0.2, 0.14, DARK, 18), x, 0.2, z, 90), at(cyl(0.09, 0.09, 0.15, METAL, 12), x, 0.2, z, 90));
  g.add(at(box(0.06, 0.1, 0.18, 0xfff3a0), 0.75, 0.42, 0.22), at(box(0.06, 0.1, 0.18, 0xfff3a0), 0.75, 0.42, -0.22));
  return g;
}

function duck() {
  return group(
    at(scaled(sph(0.48, 0xf7d046), 1.15, 0.8, 0.9), 0, 0.38, 0),
    at(sph(0.3, 0xf7d046), 0.3, 0.9, 0),
    at(scaled(sph(0.14, 0xf08a3c), 1.4, 0.5, 1), 0.6, 0.86, 0),
    at(sph(0.05, DARK, 8), 0.47, 1.0, 0.17),
    at(sph(0.05, DARK, 8), 0.47, 1.0, -0.17),
    at(scaled(sph(0.2, 0xf2c23a), 1.2, 0.5, 1), -0.52, 0.6, 0, 0, 0, 30),
  );
}

function robot() {
  return group(
    at(box(0.8, 0.75, 0.55, 0x8fa6c4, 0.08), 0, 0.55, 0),
    at(box(0.62, 0.48, 0.5, 0xb9c8dc, 0.1), 0, 1.2, 0),
    at(cyl(0.08, 0.08, 0.06, 0x2fd0ff, 12), -0.14, 1.24, 0.25, 90),
    at(cyl(0.08, 0.08, 0.06, 0x2fd0ff, 12), 0.14, 1.24, 0.25, 90),
    at(cyl(0.025, 0.025, 0.28, METAL, 6), 0, 1.55, 0),
    at(sph(0.07, 0xe74c3c, 10), 0, 1.7, 0),
    at(box(0.36, 0.2, 0.04, 0xf2b632, 0.02), 0, 0.6, 0.28),
    at(box(0.2, 0.18, 0.3, 0x6f86a4, 0.05), -0.22, 0.09, 0),
    at(box(0.2, 0.18, 0.3, 0x6f86a4, 0.05), 0.22, 0.09, 0),
    at(box(0.16, 0.55, 0.18, 0x6f86a4, 0.06), -0.5, 0.58, 0),
    at(box(0.16, 0.55, 0.18, 0x6f86a4, 0.06), 0.5, 0.58, 0),
  );
}

// ---------- Books ----------

function book(v: number) {
  const covers = [0xd65a4a, 0x3f7fd0, 0x3fa36b, 0xf0b84a, 0x8a5ac8, 0x2fb3c9];
  const c = pick(covers, v);
  const w = 1.3 + (v % 3) * 0.15;
  const d = 1.75 + (v % 2) * 0.2;
  const t = 0.3 + (v % 3) * 0.06;
  return group(
    at(box(w, 0.06, d, c, 0.02), 0, 0.03, 0),
    at(box(w - 0.08, t - 0.1, d - 0.1, 0xf8f1df), 0.03, t / 2, 0),
    at(box(w, 0.06, d, c, 0.02), 0, t - 0.03, 0),
    at(box(0.08, t, d, c, 0.03), -w / 2, t / 2, 0),
    at(box(w * 0.5, 0.01, 0.28, 0xffffff), 0.1, t + 0.005, -d * 0.2),
  );
}

// ---------- Sports ----------

function basketball() {
  const ball = at(sph(0.55, 0xe8782f, 32), 0, 0.55, 0);
  const seam = (rx: number, ry: number) => at(torus(0.553, 0.018, DARK, Math.PI * 2, 48), 0, 0.55, 0, rx, ry);
  return group(ball, seam(90, 0), seam(0, 0), seam(0, 90));
}

function soccerBall() {
  const g = group(at(sph(0.55, 0xffffff, 32), 0, 0.55, 0));
  const ico = new THREE.IcosahedronGeometry(1, 0);
  const pos = ico.getAttribute('position');
  const seen: THREE.Vector3[] = [];
  for (let i = 0; i < pos.count; i++) {
    const p = new THREE.Vector3().fromBufferAttribute(pos, i).normalize();
    if (seen.some((s) => s.distanceTo(p) < 0.01)) continue;
    seen.push(p);
    const patch = mesh(new THREE.CircleGeometry(0.19, 5), DARK);
    patch.position.copy(p.clone().multiplyScalar(0.545)).add(new THREE.Vector3(0, 0.55, 0));
    patch.lookAt(p.clone().multiplyScalar(2).add(new THREE.Vector3(0, 0.55, 0)));
    g.add(patch);
  }
  return g;
}

function dumbbell(v: number) {
  const c = pick([0x5b8def, 0xe45b8f, 0x3a3f4a], v);
  const weight = () => cyl(0.3, 0.3, 0.32, c, 6);
  return group(at(cyl(0.08, 0.08, 1.6, METAL, 12), 0, 0.3, 0, 0, 0, 90), at(weight(), -0.6, 0.3, 0, 0, 0, 90), at(weight(), 0.6, 0.3, 0, 0, 0, 90));
}

function skateboard() {
  const deck = slab(roundedRect(2.4, 0.72, 0.34), 0.08, 0x2f8ae0, 0.03);
  deck.position.y = 0.3;
  const grip = at(slab(roundedRect(2.2, 0.6, 0.28), 0.01, DARK, 0), 0, 0.43, 0);
  const g = group(deck, grip);
  for (const x of [-0.75, 0.75]) {
    g.add(at(box(0.16, 0.12, 0.5, METAL, 0.03), x, 0.22, 0));
    for (const z of [-0.28, 0.28]) g.add(at(cyl(0.12, 0.12, 0.12, 0xf7d046, 16), x, 0.12, z, 90));
  }
  return g;
}

function racket() {
  const head = torus(0.5, 0.06, 0xe74c3c, Math.PI * 2, 40);
  head.scale.set(0.8, 1, 1);
  const g = group(at(head, -0.35, 0.07, 0, 90));
  for (let i = -3; i <= 3; i++) {
    g.add(at(box(0.012, 0.012, Math.sqrt(1 - (i / 3.6) ** 2) * 0.9, 0xf3efe6), -0.35 + i * 0.11, 0.07, 0));
    g.add(at(box(Math.sqrt(1 - (i / 3.6) ** 2) * 0.72, 0.012, 0.012, 0xf3efe6), -0.35, 0.07, i * 0.13));
  }
  g.add(at(cyl(0.05, 0.05, 0.4, 0xe74c3c, 8), 0.3, 0.07, 0, 0, 0, 90));
  g.add(at(cyl(0.075, 0.075, 0.55, DARK, 10), 0.75, 0.07, 0, 0, 0, 90));
  return g;
}

export const MODELS: Record<string, Builder> = {
  pencil,
  ruler,
  setSquare,
  penCup,
  notebook,
  eraser,
  chipsBag,
  popcorn,
  cookie,
  chocolate,
  lollipop,
  phone,
  gamepad,
  headphones,
  mouse,
  handheld,
  speaker,
  tablet,
  camera,
  apple,
  banana,
  orange,
  pear,
  strawberry,
  lemon,
  sodaCan,
  milkCarton,
  waterBottle,
  juiceBox,
  coffeeCup,
  plate,
  mug,
  spoon,
  fork,
  bowl,
  pan,
  bread,
  croissant,
  donut,
  cupcake,
  cakeSlice,
  tshirt,
  sweater,
  sock,
  cap,
  sneaker,
  beanie,
  teddy,
  rubiks,
  toyCar,
  duck,
  robot,
  book,
  basketball,
  soccerBall,
  dumbbell,
  skateboard,
  racket,
};

export const MODEL_NAMES: Record<string, string> = {
  speaker: 'Boombox',
  setSquare: 'Set square',
  penCup: 'Pen cup',
  chipsBag: 'Chips',
  sodaCan: 'Soda',
  milkCarton: 'Milk',
  waterBottle: 'Water',
  juiceBox: 'Juice',
  coffeeCup: 'Coffee',
  cakeSlice: 'Cake',
  tshirt: 'T-shirt',
  rubiks: 'Puzzle cube',
  toyCar: 'Toy car',
  soccerBall: 'Football',
};

export function modelName(kind: string): string {
  return MODEL_NAMES[kind] ?? kind.charAt(0).toUpperCase() + kind.slice(1);
}

export function hasModel(kind: string): boolean {
  return kind in MODELS;
}

/** Wood colour used by furniture too. */
export const WOOD_COLOR = WOOD;
