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
  const color = pick([0xf2b632, 0x8bc34a, 0xe8524a], v);
  const tex = canvasTex(256, 256, (c) => {
    c.fillStyle = '#' + new THREE.Color(color).getHexString();
    c.fillRect(0, 0, 256, 256);
    c.fillStyle = '#ffffff';
    c.beginPath();
    c.ellipse(128, 128, 90, 55, 0, 0, Math.PI * 2);
    c.fill();
    c.fillStyle = '#c0392b';
    c.font = 'bold 54px sans-serif';
    c.textAlign = 'center';
    c.textBaseline = 'middle';
    c.fillText('CHIPS', 128, 132);
  });
  const geo = new THREE.SphereGeometry(0.5, 32, 20);
  geo.scale(1.45, 0.45, 1.9);
  const bag = mesh(geo, texMat(tex));
  bag.rotation.y = Math.PI / 2;
  bag.position.y = 0.23;
  const crimpA = at(box(1.3, 0.08, 0.16, color, 0.03), 0, 0.22, -0.92);
  const crimpB = at(box(1.3, 0.08, 0.16, color, 0.03), 0, 0.22, 0.92);
  return group(bag, crimpA, crimpB);
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
  const body = pick([0xf1f1f4, 0x3a3f4a], v);
  const g = group(
    at(box(1.4, 0.32, 0.72, body, 0.15), 0, 0.2, -0.08),
    at(scaled(sph(0.38, body, 18), 1, 0.45, 1.1), -0.56, 0.18, 0.2),
    at(scaled(sph(0.38, body, 18), 1, 0.45, 1.1), 0.56, 0.18, 0.2),
    at(cyl(0.12, 0.13, 0.12, DARK, 16), -0.4, 0.4, -0.08),
    at(cyl(0.12, 0.13, 0.12, DARK, 16), 0.22, 0.4, 0.15),
    at(box(0.26, 0.06, 0.08, DARK), -0.12, 0.38, 0.16),
    at(box(0.08, 0.06, 0.26, DARK), -0.12, 0.38, 0.16),
  );
  const btn = [
    [0xe74c3c, 0.48, -0.08],
    [0x2ecc71, 0.6, -0.2],
    [0x3498db, 0.36, -0.2],
    [0xf1c40f, 0.48, -0.32],
  ];
  for (const [c, x, z] of btn) g.add(at(cyl(0.06, 0.06, 0.06, c, 12), x, 0.38, z));
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
  const geo = new THREE.SphereGeometry(0.5, 28, 18, 0, Math.PI * 2, 0, Math.PI / 2);
  geo.scale(0.7, 0.55, 1.0);
  const shell = mesh(geo, 0xf3f3f6);
  const base = at(cyl(0.35, 0.35, 0.04, 0xc4c4cc, 24), 0, 0.02, 0);
  base.scale.z = 1.42;
  const wheel = at(cyl(0.06, 0.06, 0.06, DARK, 12), 0, 0.27, -0.2, 0, 0, 90);
  const split = at(box(0.015, 0.02, 0.4, 0xb0b0b8), 0, 0.27, -0.26);
  return group(shell, base, wheel, split);
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
  return group(
    at(cyl(0.45, 0.45, 0.9, 0x4b6b8a, 32), 0, 0.45, 0),
    at(cyl(0.38, 0.38, 0.04, 0x2e3e52, 32), 0, 0.91, 0),
    at(torus(0.45, 0.04, 0x9db4cc), 0, 0.9, 0, 90),
    at(cyl(0.08, 0.08, 0.03, 0x9db4cc, 16), 0, 0.93, 0),
    at(box(0.3, 0.1, 0.05, 0x9db4cc, 0.02), 0, 0.5, 0.45),
  );
}

function tablet() {
  const tex = canvasTex(192, 256, (c) => {
    const grd = c.createLinearGradient(0, 0, 0, 256);
    grd.addColorStop(0, '#8fe0c6');
    grd.addColorStop(1, '#5aa6e8');
    c.fillStyle = grd;
    c.fillRect(0, 0, 192, 256);
    c.fillStyle = 'rgba(255,255,255,0.85)';
    for (let r = 0; r < 4; r++) for (let k = 0; k < 4; k++) c.fillRect(18 + k * 42, 30 + r * 50, 26, 26);
  });
  const screen = mesh(new THREE.PlaneGeometry(1.36, 1.86), texMat(tex));
  screen.rotation.x = -Math.PI / 2;
  screen.position.y = 0.111;
  return group(at(box(1.55, 0.11, 2.05, 0xb9bcc6, 0.06), 0, 0.055, 0), screen);
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

function banana() {
  const pts: [number, number, number][] = [
    [-0.8, 0.45, 0],
    [-0.45, 0.22, 0],
    [0, 0.17, 0],
    [0.45, 0.22, 0],
    [0.8, 0.45, 0],
  ];
  const g = group(scaled(tube(pts, 0.22, 0xf7d046), 1, 1, 1.1));
  g.add(at(cyl(0.05, 0.07, 0.2, 0x7a5a2a, 8), -0.88, 0.52, 0, 0, 0, 40));
  g.add(at(sph(0.06, 0x5a4020, 8), 0.86, 0.5, 0));
  return group(at(g, 0, 0, 0, 90, 0, 0));
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
  const body = lathe(
    [
      [0, 0],
      [0.15, 0.06],
      [0.38, 0.4],
      [0.46, 0.7],
      [0.36, 0.86],
      [0, 0.9],
    ],
    0xe8344a,
  );
  const g = group(body);
  for (let i = 0; i < 18; i++) {
    const a = i * 2.4;
    const y = 0.2 + (i % 6) * 0.1;
    const r = 0.22 + (y > 0.6 ? 0.17 : y * 0.3);
    g.add(at(sph(0.025, 0xffe28a, 6), Math.cos(a) * r, y, Math.sin(a) * r));
  }
  for (let i = 0; i < 5; i++) {
    const a = (i / 5) * Math.PI * 2;
    const l = new THREE.SphereGeometry(0.16, 10, 6);
    l.scale(1, 0.2, 0.45);
    g.add(at(mesh(l, 0x3f9c40), Math.cos(a) * 0.17, 0.9, Math.sin(a) * 0.17, 0, (-a * 180) / Math.PI, 0));
  }
  return group(at(g, 0, 0.45, 0, 0, 0, 90));
}

function lemon() {
  const body = lathe(
    [
      [0, -0.62],
      [0.08, -0.56],
      [0.34, -0.36],
      [0.42, 0],
      [0.34, 0.36],
      [0.08, 0.56],
      [0, 0.62],
    ],
    0xf5dc3c,
  );
  return group(at(body, 0, 0.42, 0, 0, 0, 90));
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
  return group(
    lathe(
      [
        [0, 0],
        [0.5, 0],
        [0.6, 0.06],
        [0.88, 0.14],
        [0.9, 0.16],
        [0.6, 0.1],
        [0, 0.08],
      ],
      WHITE,
      40,
    ),
    at(torus(0.78, 0.025, rim, Math.PI * 2, 48), 0, 0.14, 0, 90),
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
  const bowl = new THREE.SphereGeometry(0.24, 20, 12, 0, Math.PI * 2, Math.PI / 2, Math.PI / 2);
  bowl.scale(1.35, 0.5, 1);
  return group(at(mesh(bowl, METAL), -0.75, 0.13, 0, 180), at(box(1.2, 0.06, 0.13, METAL, 0.03), 0.2, 0.1, 0, 0, 0, 4));
}

function fork() {
  const g = group(at(box(1.1, 0.06, 0.14, METAL, 0.03), 0.3, 0.05, 0), at(box(0.28, 0.06, 0.34, METAL, 0.03), -0.35, 0.05, 0));
  for (let i = 0; i < 4; i++) g.add(at(box(0.42, 0.05, 0.05, METAL, 0.02), -0.68, 0.05, -0.13 + i * 0.087));
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
  const g = group(at(box(1.5, 0.5, 1.15, c, 0.16), 0, 0.25, 0));
  for (let i = 0; i < 3; i++) g.add(at(box(1.52, 0.05, 1.17, 0xffffff, 0.02), 0, 0.12 + i * 0.13, 0));
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
  const g = group(
    at(box(1.55, 0.18, 0.62, 0xffffff, 0.08), 0, 0.09, 0),
    at(box(1.0, 0.42, 0.58, c, 0.2), -0.2, 0.38, 0),
    at(box(0.75, 0.24, 0.56, c, 0.12), 0.4, 0.27, 0),
    at(box(0.25, 0.5, 0.5, c, 0.1), -0.62, 0.43, 0),
  );
  for (let i = 0; i < 3; i++) g.add(at(box(0.05, 0.02, 0.4, 0xffffff), 0.05 + i * 0.16, 0.42 - i * 0.04, 0, 0, 0, -18));
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
