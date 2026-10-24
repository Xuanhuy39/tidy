import * as THREE from 'three';
import type { RoomId } from '../game/types';
import { at, box, canvasTex, cyl, group, mat, mesh, scaled, sph, texMat, torus } from './kit';

export interface Room {
  group: THREE.Group;
  /** Heights of the flat tops items can rest on. */
  surfaces: Record<string, number>;
  /** The part of the room the camera frames. */
  focus: THREE.Box3;
  background: number;
}

const noOutline = { outlineParameters: { visible: false } };

function plain(color: THREE.ColorRepresentation): THREE.MeshToonMaterial {
  const m = mat(color).clone();
  m.userData = noOutline;
  return m;
}

function woodFloor(w: number, d: number, light: string, dark: string) {
  const tex = canvasTex(512, 512, (c) => {
    c.fillStyle = light;
    c.fillRect(0, 0, 512, 512);
    for (let i = 0; i < 8; i++) {
      c.fillStyle = i % 2 ? light : dark;
      c.fillRect(0, i * 64, 512, 62);
      c.fillStyle = 'rgba(0,0,0,0.12)';
      c.fillRect(0, i * 64 + 62, 512, 2);
      c.fillRect(((i * 197) % 400) + 40, i * 64, 2, 62);
    }
  });
  tex.wrapS = tex.wrapT = THREE.RepeatWrapping;
  tex.repeat.set(w / 6, d / 6);
  const m = texMat(tex);
  m.userData = noOutline;
  const floor = mesh(new THREE.BoxGeometry(w, 0.3, d), m);
  floor.position.set(w / 2, -0.15, d / 2);
  floor.receiveShadow = true;
  return floor;
}

function tileFloor(w: number, d: number) {
  const tex = canvasTex(256, 256, (c) => {
    for (let i = 0; i < 4; i++)
      for (let j = 0; j < 4; j++) {
        c.fillStyle = (i + j) % 2 ? '#f3ead8' : '#d9c7a5';
        c.fillRect(i * 64, j * 64, 64, 64);
      }
  });
  tex.wrapS = tex.wrapT = THREE.RepeatWrapping;
  tex.repeat.set(w / 5, d / 5);
  const m = texMat(tex);
  m.userData = noOutline;
  const floor = mesh(new THREE.BoxGeometry(w, 0.3, d), m);
  floor.position.set(w / 2, -0.15, d / 2);
  return floor;
}

function wallpaper(base: string, stripe: string) {
  return canvasTex(256, 256, (c) => {
    c.fillStyle = base;
    c.fillRect(0, 0, 256, 256);
    c.fillStyle = stripe;
    for (let i = 0; i < 8; i++) c.fillRect(i * 32 + 12, 0, 8, 256);
  });
}

/** Two walls meeting in the back corner (x = 0 and z = 0), with skirting boards. */
function walls(w: number, d: number, h: number, base: string, stripe: string, skirting: number) {
  const tex = wallpaper(base, stripe);
  tex.wrapS = tex.wrapT = THREE.RepeatWrapping;
  const texB = tex.clone();
  tex.repeat.set(w / 4, h / 4);
  texB.repeat.set(d / 4, h / 4);
  texB.needsUpdate = true;
  const mb = texMat(tex);
  const ml = texMat(texB);
  mb.userData = ml.userData = noOutline;
  const back = mesh(new THREE.BoxGeometry(w + 0.3, h, 0.3), mb);
  back.position.set(w / 2 - 0.15, h / 2, -0.15);
  const left = mesh(new THREE.BoxGeometry(0.3, h, d), ml);
  left.position.set(-0.15, h / 2, d / 2);
  const skirtB = at(box(w, 0.4, 0.1, plain(skirting)), w / 2, 0.2, 0.05);
  const skirtL = at(box(0.1, 0.4, d, plain(skirting)), 0.05, 0.2, d / 2);
  const g = group(back, left, skirtB, skirtL);
  g.traverse((o) => (o.receiveShadow = true));
  return g;
}

/** A window set into the left wall, centred at z, with its bottom at y. */
function windowLeft(z: number, y: number, w: number, h: number) {
  const sky = canvasTex(64, 128, (c) => {
    const grd = c.createLinearGradient(0, 0, 0, 128);
    grd.addColorStop(0, '#8fd0f5');
    grd.addColorStop(1, '#d9f1fb');
    c.fillStyle = grd;
    c.fillRect(0, 0, 64, 128);
    c.fillStyle = 'rgba(255,255,255,0.9)';
    c.beginPath();
    c.ellipse(22, 40, 14, 7, 0, 0, Math.PI * 2);
    c.ellipse(34, 37, 11, 8, 0, 0, Math.PI * 2);
    c.fill();
    c.fillStyle = '#7cc46a';
    c.fillRect(0, 104, 64, 24);
  });
  const glassMat = texMat(sky);
  glassMat.userData = noOutline;
  const glass = mesh(new THREE.PlaneGeometry(w, h), glassMat);
  glass.rotation.y = Math.PI / 2;
  glass.position.set(0.02, y + h / 2, z);
  const frame = 0xfaf3e6;
  return group(
    glass,
    at(box(0.2, 0.2, w + 0.3, frame), 0.08, y, z),
    at(box(0.2, 0.2, w + 0.3, frame), 0.08, y + h, z),
    at(box(0.2, h, 0.2, frame), 0.08, y + h / 2, z - w / 2),
    at(box(0.2, h, 0.2, frame), 0.08, y + h / 2, z + w / 2),
    at(box(0.12, h, 0.1, frame), 0.06, y + h / 2, z),
    at(box(0.5, 0.15, w + 0.6, frame), 0.25, y - 0.08, z),
  );
}

function plant(scale = 1) {
  const g = group(at(cyl(0.45, 0.35, 0.7, 0xd7744f), 0, 0.35, 0), at(cyl(0.4, 0.4, 0.04, 0x5a3e2b), 0, 0.68, 0));
  for (let i = 0; i < 7; i++) {
    const a = (i / 7) * Math.PI * 2;
    const leaf = sph(0.3, i % 2 ? 0x4f9a4a : 0x63b25a, 12);
    leaf.scale.set(0.45, 1.2, 0.2);
    g.add(at(leaf, Math.cos(a) * 0.22, 1.1, Math.sin(a) * 0.22, Math.sin(a) * 30, (-a * 180) / Math.PI, Math.cos(a) * 30));
  }
  return scaled(g, scale);
}

function frame(w: number, h: number, art: (c: CanvasRenderingContext2D) => void) {
  const pic = mesh(new THREE.PlaneGeometry(w - 0.2, h - 0.2), texMat(canvasTex(128, 128, art)));
  pic.position.z = 0.06;
  return group(box(w, h, 0.1, 0x8a5a3c), pic);
}

function rug(w: number, d: number, a: string, b: string) {
  const tex = canvasTex(256, 256, (c) => {
    c.fillStyle = a;
    c.fillRect(0, 0, 256, 256);
    c.strokeStyle = b;
    c.lineWidth = 14;
    c.strokeRect(20, 20, 216, 216);
    c.lineWidth = 6;
    c.strokeRect(44, 44, 168, 168);
  });
  const m = texMat(tex);
  m.userData = noOutline;
  return mesh(new THREE.BoxGeometry(w, 0.06, d), m);
}

// ---------- Study ----------

function study(): Room {
  const W = 12;
  const D = 10;
  const g = group(woodFloor(W, D, '#c98d55', '#bd8048'), walls(W, D, 9, '#f6ead3', '#efdcbc', 0xe4cfa8), windowLeft(4.2, 4.2, 3.6, 3.4));

  // Desk along the back wall.
  const wood = 0xb87843;
  const top = 3.6;
  g.add(at(box(9.2, 0.3, 4.4, wood, 0.06), 6.1, top - 0.15, 2.3));
  g.add(at(box(0.3, top - 0.3, 4.0, wood), 1.8, (top - 0.3) / 2, 2.3));
  g.add(at(box(2.8, top - 0.3, 4.0, 0xf3ede2, 0.04), 9.1, (top - 0.3) / 2, 2.3));
  for (let i = 0; i < 3; i++) {
    g.add(at(box(2.6, 0.95, 0.06, 0xfaf6ee, 0.03), 9.1, 0.6 + i * 1.05, 4.33));
    g.add(at(box(0.5, 0.08, 0.1, 0x9a8a78, 0.03), 9.1, 0.9 + i * 1.05, 4.38));
  }

  // Laptop (scenery, but items can rest on its keyboard).
  const laptop = group(
    at(box(2.8, 0.14, 1.9, 0xc9ced6, 0.05), 0, 0.07, 0),
    at(box(2.3, 0.02, 0.9, 0x3a3f4a), 0, 0.15, -0.2),
    at(box(2.8, 1.85, 0.1, 0xc9ced6, 0.05), 0, 1.0, -1.0, -12),
    at(box(2.55, 1.6, 0.02, 0x4a6fa5), 0, 1.0, -0.93, -12),
  );
  g.add(at(laptop, 5.2, top, 1.5));

  // Desk lamp and plant.
  g.add(
    at(
      group(
        at(cyl(0.5, 0.55, 0.12, 0x5e8c5a), 0, 0.06, 0),
        at(cyl(0.06, 0.06, 2.2, 0x5e8c5a, 8), 0, 1.15, 0, 0, 0, 12),
        at(cyl(0.25, 0.6, 0.7, 0x5e8c5a, 24), 0.5, 2.25, 0.2, 30, 0, -40),
      ),
      2.6,
      top,
      0.8,
    ),
  );
  g.add(at(plant(0.9), 10.2, top, 0.9));

  // Wall shelf and a picture.
  g.add(at(box(4.0, 0.22, 1.5, wood, 0.04), 8.6, 6.6, 0.75));
  g.add(at(box(0.15, 0.6, 1.2, wood), 7.0, 6.2, 0.6), at(box(0.15, 0.6, 1.2, wood), 10.2, 6.2, 0.6));
  g.add(
    at(
      frame(2.0, 1.6, (c) => {
        c.fillStyle = '#ffe3b3';
        c.fillRect(0, 0, 128, 128);
        c.fillStyle = '#f08a3c';
        c.beginPath();
        c.arc(80, 50, 22, 0, Math.PI * 2);
        c.fill();
        c.fillStyle = '#6fae5f';
        c.beginPath();
        c.moveTo(0, 128);
        c.lineTo(50, 60);
        c.lineTo(100, 128);
        c.fill();
      }),
      4.0,
      6.6,
      0.1,
    ),
  );

  // Chair in front of the desk, turned so its back doesn't hide the desk.
  const chairWood = 0xd39a5c;
  const chair = group(at(box(2.6, 0.25, 2.4, 0xf3ede2, 0.08), 0, 2.2, 0), at(box(2.7, 0.15, 2.5, chairWood, 0.05), 0, 2.03, 0));
  for (const [x, z] of [
    [-1.15, -1.05],
    [1.15, -1.05],
    [-1.15, 1.05],
    [1.15, 1.05],
  ])
    chair.add(at(box(0.2, 2.0, 0.2, chairWood), x, 1.0, z));
  chair.add(at(box(0.2, 2.4, 2.4, chairWood, 0.06), -1.3, 3.4, 0), at(box(0.18, 1.4, 2.0, 0xe9a23b, 0.08), -1.12, 3.5, 0));
  g.add(at(chair, 3.3, 0, 6.6));

  // Rug.
  g.add(at(rug(6.5, 4.0, '#9cc7b7', '#f3ede2'), 8.4, 0.03, 7.4));

  g.traverse((o) => {
    if ((o as THREE.Mesh).isMesh) {
      o.castShadow = true;
      o.receiveShadow = true;
    }
  });
  return {
    group: g,
    surfaces: { desk: top, laptop: top + 0.16, shelf: 6.71, chair: 2.33, floor: 0, rug: 0.06 },
    focus: new THREE.Box3(new THREE.Vector3(1.6, 0, 0.3), new THREE.Vector3(11.2, 7.2, 8.2)),
    background: 0xf7c66b,
  };
}

// ---------- Kitchen ----------

function kitchen(): Room {
  const W = 12;
  const D = 10;
  const g = group(tileFloor(W, D), walls(W, D, 9, '#e9f2e4', '#dcebd5', 0xc6d9bd));

  // Back-wall tiles above the counter.
  const tiles = canvasTex(128, 128, (c) => {
    c.fillStyle = '#ffffff';
    c.fillRect(0, 0, 128, 128);
    c.strokeStyle = '#cfe3ea';
    c.lineWidth = 4;
    for (let i = 0; i <= 4; i++) {
      c.beginPath();
      c.moveTo(i * 32, 0);
      c.lineTo(i * 32, 128);
      c.moveTo(0, i * 32);
      c.lineTo(128, i * 32);
      c.stroke();
    }
  });
  tiles.wrapS = tiles.wrapT = THREE.RepeatWrapping;
  tiles.repeat.set(4, 1);
  const tileMat = texMat(tiles);
  tileMat.userData = noOutline;
  g.add(at(mesh(new THREE.PlaneGeometry(9.2, 2.4), tileMat), 7.4, 4.6, 0.02));

  // Fridge in the corner.
  const fridge = group(
    at(box(2.6, 7.0, 2.8, 0xe8f1f4, 0.12), 0, 3.5, 0),
    at(box(2.62, 0.06, 2.82, 0xb8c8d0), 0, 4.8, 0),
    at(box(0.12, 1.4, 0.14, 0xb8c8d0, 0.05), 0.95, 5.8, 1.45),
    at(box(0.12, 1.6, 0.14, 0xb8c8d0, 0.05), 0.95, 3.6, 1.45),
    at(box(0.5, 0.5, 0.04, 0xf08a3c, 0.1), -0.3, 5.9, 1.42),
    at(box(0.4, 0.55, 0.04, 0x5b8def, 0.1), 0.25, 6.2, 1.42),
  );
  g.add(at(fridge, 1.45, 0, 1.5));

  // Counter with cabinets.
  const top = 3.4;
  g.add(at(box(9.0, 0.3, 3.0, 0xf5efe4, 0.05), 7.4, top - 0.15, 1.5));
  g.add(at(box(8.8, top - 0.3, 2.8, 0x7fb6a4, 0.04), 7.4, (top - 0.3) / 2, 1.4));
  for (let i = 0; i < 4; i++) {
    g.add(at(box(2.05, 2.6, 0.06, 0x8fc4b2, 0.05), 4.25 + i * 2.15, 1.5, 2.82));
    g.add(at(box(0.08, 0.6, 0.1, 0xf5efe4, 0.03), 5.0 + i * 2.15, 2.3, 2.88));
  }
  // Sink and tap.
  g.add(at(box(2.0, 0.05, 1.5, 0xb8c8d0, 0.04), 9.8, top + 0.01, 1.4));
  g.add(at(group(at(cyl(0.1, 0.1, 1.0, METAL_TAP, 10), 0, 0.5, 0), at(cyl(0.08, 0.08, 0.7, METAL_TAP, 10), 0, 1.0, 0.3, 90)), 9.8, top, 0.4));

  // Shelf with jars.
  g.add(at(box(4.6, 0.22, 1.3, 0xb87843, 0.04), 6.0, 6.5, 0.65));
  for (const [x, c] of [
    [4.4, 0xf2b632],
    [5.1, 0xe45b5b],
  ] as const)
    g.add(at(group(at(cyl(0.3, 0.3, 0.7, mat(0xd9f1fb, { transparent: true, opacity: 0.7 })), 0, 0.35, 0), at(cyl(0.27, 0.27, 0.4, c), 0, 0.22, 0), at(cyl(0.32, 0.32, 0.12, 0xb87843), 0, 0.75, 0)), x, 6.61, 0.6));

  // Table with two stools.
  const tableTop = 3.0;
  const table = group(at(box(5.2, 0.25, 3.4, 0xd39a5c, 0.06), 0, tableTop - 0.12, 0));
  for (const [x, z] of [
    [-2.2, -1.3],
    [2.2, -1.3],
    [-2.2, 1.3],
    [2.2, 1.3],
  ])
    table.add(at(box(0.25, tableTop - 0.25, 0.25, 0xb87843), x, (tableTop - 0.25) / 2, z));
  g.add(at(table, 7.2, 0, 6.6));
  const stool = () => group(at(cyl(0.75, 0.75, 0.2, 0xe9a23b, 24), 0, 1.9, 0), at(cyl(0.12, 0.2, 1.8, 0xb87843, 10), 0, 0.9, 0), at(torus(0.45, 0.05, 0xb87843), 0, 0.7, 0, 90));
  g.add(at(stool(), 3.3, 0, 6.6));

  g.add(
    at(
      frame(1.6, 1.6, (c) => {
        c.fillStyle = '#fff4dc';
        c.fillRect(0, 0, 128, 128);
        c.fillStyle = '#e8524a';
        c.beginPath();
        c.arc(64, 70, 34, 0, Math.PI * 2);
        c.fill();
        c.fillStyle = '#5bb04a';
        c.fillRect(60, 22, 10, 20);
      }),
      0.1,
      6.2,
      6.2,
    ),
  );
  g.children[g.children.length - 1].rotation.y = Math.PI / 2;

  g.traverse((o) => {
    if ((o as THREE.Mesh).isMesh) {
      o.castShadow = true;
      o.receiveShadow = true;
    }
  });
  return {
    group: g,
    surfaces: { counter: top, shelf: 6.61, table: tableTop, stool: 2.0, floor: 0 },
    focus: new THREE.Box3(new THREE.Vector3(2.4, 0, 0.3), new THREE.Vector3(12, 7.4, 8.4)),
    background: 0x9fd3b9,
  };
}

const METAL_TAP = 0xc9ced6;

// ---------- Bedroom ----------

function bedroom(): Room {
  const W = 12;
  const D = 10;
  const g = group(woodFloor(W, D, '#d8a874', '#cf9c66'), walls(W, D, 9, '#e8e3f6', '#ddd6f0', 0xc9c0e4), windowLeft(7.6, 3.8, 2.8, 3.2));

  // Bed against the back wall.
  const bedTop = 2.2;
  const bed = group(
    at(box(5.0, 1.0, 6.8, 0xb87843, 0.08), 0, 0.6, 0),
    at(box(4.8, 0.6, 6.6, 0xfaf6ee, 0.2), 0, 1.4, 0),
    at(box(5.0, 0.5, 4.6, 0x7fa8e0, 0.2), 0, 1.75, 1.1),
    at(box(5.2, 3.6, 0.35, 0xb87843, 0.1), 0, 1.8, -3.4),
    at(box(2.0, 0.55, 1.2, 0xffffff, 0.25), -1.1, 1.95, -2.4),
    at(box(2.0, 0.55, 1.2, 0xffffff, 0.25), 1.1, 1.95, -2.4),
  );
  g.add(at(bed, 2.7, 0, 3.6));

  // Nightstand with a lamp.
  const nsTop = 2.4;
  g.add(at(box(2.0, nsTop, 1.8, 0xd39a5c, 0.06), 6.4, nsTop / 2, 1.0));
  g.add(at(box(1.7, 0.8, 0.05, 0xe6b27a, 0.03), 6.4, 1.4, 1.92), at(sph(0.08, 0xfaf6ee, 8), 6.4, 1.4, 1.95));
  g.add(at(group(at(cyl(0.25, 0.3, 0.6, 0xf2b632), 0, 0.3, 0), at(cyl(0.45, 0.65, 0.7, 0xfaf3e6, 20), 0, 0.95, 0)), 6.9, nsTop, 0.6));

  // Low bookshelf.
  const shelfTop = 3.6;
  const shelf = group(at(box(3.6, shelfTop, 1.6, 0xf3ede2, 0.05), 0, shelfTop / 2, 0), at(box(3.3, 1.4, 0.05, 0xd9cfbf), 0, 1.0, 0.8), at(box(3.3, 0.12, 1.4, 0xf3ede2), 0, 1.8, 0.1));
  const spines = [0xd65a4a, 0x3f7fd0, 0xf0b84a, 0x3fa36b, 0x8a5ac8, 0xe45b8f];
  spines.forEach((c, i) => shelf.add(at(box(0.36, 1.15 - (i % 3) * 0.12, 1.1, c, 0.03), -1.3 + i * 0.42, 0.95 - (i % 3) * 0.06, 0.15)));
  g.add(at(shelf, 9.9, 0, 0.8));
  g.add(at(plant(1.0), 11.2, 0, 3.0));

  // Poster.
  g.add(
    at(
      frame(1.8, 2.3, (c) => {
        c.fillStyle = '#2f3b63';
        c.fillRect(0, 0, 128, 128);
        c.fillStyle = '#ffd56b';
        for (let i = 0; i < 14; i++) c.fillRect((i * 37) % 120, (i * 53) % 120, 3, 3);
        c.beginPath();
        c.arc(84, 40, 18, 0, Math.PI * 2);
        c.fill();
      }),
      8.6,
      6.4,
      0.1,
    ),
  );

  g.add(at(rug(6.0, 4.4, '#f2b6c6', '#fff1f4'), 8.0, 0.03, 6.8));

  g.traverse((o) => {
    if ((o as THREE.Mesh).isMesh) {
      o.castShadow = true;
      o.receiveShadow = true;
    }
  });
  return {
    group: g,
    surfaces: { bed: bedTop, nightstand: nsTop, shelf: shelfTop, floor: 0, rug: 0.06 },
    focus: new THREE.Box3(new THREE.Vector3(0.8, 0, 0.3), new THREE.Vector3(11.8, 6.2, 9.6)),
    background: 0xc7b8ec,
  };
}

// ---------- Bathroom ----------

function tileTex(a: string, grout: string, n = 4) {
  return canvasTex(128, 128, (c) => {
    c.fillStyle = a;
    c.fillRect(0, 0, 128, 128);
    c.strokeStyle = grout;
    c.lineWidth = 4;
    for (let i = 0; i <= n; i++) {
      const p = (i * 128) / n;
      c.beginPath();
      c.moveTo(p, 0);
      c.lineTo(p, 128);
      c.moveTo(0, p);
      c.lineTo(128, p);
      c.stroke();
    }
  });
}

/** Tiled lower half on both walls. */
function wainscot(w: number, d: number, h: number) {
  const make = (len: number) => {
    const t = tileTex('#dff1f7', '#b9dbe6');
    t.wrapS = t.wrapT = THREE.RepeatWrapping;
    t.repeat.set(len / 2, h / 2);
    const m = texMat(t);
    m.userData = noOutline;
    return m;
  };
  const back = mesh(new THREE.PlaneGeometry(w, h), make(w));
  back.position.set(w / 2, h / 2, 0.02);
  const left = mesh(new THREE.PlaneGeometry(d, h), make(d));
  left.rotation.y = Math.PI / 2;
  left.position.set(0.02, h / 2, d / 2);
  const trim = 0x8fc6d8;
  return group(back, left, at(box(w, 0.15, 0.12, plain(trim)), w / 2, h, 0.06), at(box(0.12, 0.15, d, plain(trim)), 0.06, h, d / 2));
}

function bathroom(): Room {
  const W = 12;
  const D = 10;
  const floorTex = tileTex('#f4f7f8', '#c9d8de', 2);
  floorTex.wrapS = floorTex.wrapT = THREE.RepeatWrapping;
  floorTex.repeat.set(W / 1.5, D / 1.5);
  const floorMat = texMat(floorTex);
  floorMat.userData = noOutline;
  const floor = mesh(new THREE.BoxGeometry(W, 0.3, D), floorMat);
  floor.position.set(W / 2, -0.15, D / 2);
  const g = group(floor, walls(W, D, 9, '#eaf6f9', '#dceff4', 0x8fc6d8), wainscot(W, D, 4), windowLeft(7.8, 5.0, 2.4, 2.4));

  // Bathtub along the left wall, with water you can float toys in.
  const tubC = 0xfdfdfd;
  const waterY = 1.5;
  const tub = group(
    at(box(3.4, 0.35, 6.3, tubC, 0.1), 0, 0.35, 0),
    at(box(0.35, 1.9, 6.3, tubC, 0.12), -1.52, 1.0, 0),
    at(box(0.35, 1.9, 6.3, tubC, 0.12), 1.52, 1.0, 0),
    at(box(3.4, 1.9, 0.35, tubC, 0.12), 0, 1.0, -2.98),
    at(box(3.4, 1.9, 0.35, tubC, 0.12), 0, 1.0, 2.98),
    at(box(2.7, waterY - 0.5, 5.6, mat(0x8fd8f0, { transparent: true, opacity: 0.9 })), 0, (waterY + 0.5) / 2, 0),
  );
  for (const [x, z] of [
    [-1.4, -2.8],
    [1.4, -2.8],
    [-1.4, 2.8],
    [1.4, 2.8],
  ])
    tub.add(at(sph(0.22, 0xe9b44a, 12), x, 0.1, z));
  g.add(at(tub, 1.95, 0, 3.45));
  // Tap and shower head on the left wall.
  g.add(at(group(at(cyl(0.08, 0.08, 0.7, METAL_TAP, 10), 0, 0, 0, 0, 0, 90), at(cyl(0.08, 0.1, 0.25, METAL_TAP, 10), 0.35, -0.12, 0)), 0.35, 2.6, 1.2));
  g.add(at(group(at(cyl(0.05, 0.05, 2.0, METAL_TAP, 8), 0, 0, 0), at(cyl(0.35, 0.2, 0.15, METAL_TAP, 18), 0.25, 1.0, 0, 0, 0, -60)), 0.12, 4.6, 1.2));

  // Toilet against the back wall.
  const toiletC = 0xffffff;
  const toilet = group(
    at(box(1.7, 1.6, 0.75, toiletC, 0.12), 0, 2.15, -0.75),
    at(box(1.85, 0.12, 0.85, toiletC, 0.05), 0, 3.0, -0.75),
    at(box(0.3, 0.08, 0.12, METAL_TAP, 0.03), 0.5, 2.7, -0.36),
    at(cyl(0.5, 0.35, 1.25, toiletC, 24), 0, 0.62, 0.35),
    at(scaled(cyl(0.82, 0.78, 0.25, toiletC, 28), 1, 1, 1.15), 0, 1.38, 0.35),
    at(scaled(cyl(0.84, 0.84, 0.1, 0xe9f4fb, 28), 1, 1, 1.15), 0, 1.56, 0.35),
  );
  g.add(at(toilet, 5.2, 0, 1.3));

  // Vanity with basin and mirror.
  const top = 3.0;
  g.add(at(box(3.9, top - 0.2, 2.3, 0x7fb6a4, 0.05), 9.55, (top - 0.2) / 2, 1.2));
  g.add(at(box(4.0, 0.2, 2.4, 0xf5efe4, 0.04), 9.55, top - 0.1, 1.2));
  for (const x of [8.6, 10.5]) {
    g.add(at(box(1.75, 2.2, 0.06, 0x8fc4b2, 0.05), x, 1.35, 2.36));
    g.add(at(box(0.08, 0.5, 0.1, 0xf5efe4, 0.03), x + (x < 9.5 ? 0.6 : -0.6), 1.6, 2.42));
  }
  g.add(at(scaled(cyl(0.72, 0.72, 0.04, 0xbfd5dc, 28), 1, 1, 0.75), 9.55, top + 0.01, 1.35));
  g.add(at(group(at(cyl(0.08, 0.08, 0.6, METAL_TAP, 10), 0, 0.3, 0), at(cyl(0.07, 0.07, 0.45, METAL_TAP, 10), 0, 0.6, 0.2, 90)), 9.55, top, 0.4));
  g.add(at(box(2.6, 2.2, 0.12, 0xe9b44a, 0.08), 9.55, 5.2, 0.08));
  g.add(at(box(2.3, 1.9, 0.04, plain(0xcfeaf3)), 9.55, 5.2, 0.16));
  g.add(at(box(0.1, 1.4, 0.02, plain(0xffffff)), 9.0, 5.3, 0.19, 0, 0, -30));

  // Wall shelf above the toilet.
  g.add(at(box(2.8, 0.18, 1.1, 0xf5efe4, 0.04), 5.2, 5.3, 0.55));
  g.add(at(box(0.12, 0.5, 0.9, 0xd9cfbf), 4.0, 5.0, 0.45), at(box(0.12, 0.5, 0.9, 0xd9cfbf), 6.4, 5.0, 0.45));

  // Towel rail on the back wall right of the mirror.
  g.add(at(cyl(0.05, 0.05, 1.4, METAL_TAP, 8), 11.4, 4.0, 0.25, 0, 90, 90));

  g.add(at(rug(4.4, 3.2, '#9fd3e6', '#ffffff'), 6.6, 0.03, 6.6));

  g.traverse((o) => {
    if ((o as THREE.Mesh).isMesh) {
      o.castShadow = true;
      o.receiveShadow = true;
    }
  });
  return {
    group: g,
    surfaces: { tub: waterY, tank: 3.06, lid: 1.61, vanity: top, shelf: 5.39, mat: 0.06, floor: 0 },
    focus: new THREE.Box3(new THREE.Vector3(0.6, 0, 0.3), new THREE.Vector3(11.8, 6.4, 9.2)),
    background: 0x9fd8e8,
  };
}

// ---------- Living room ----------

function living(): Room {
  const W = 12;
  const D = 10;
  const g = group(woodFloor(W, D, '#c99566', '#bd8a5c'), walls(W, D, 9, '#f6efd9', '#ecdfbf', 0xd8c49a));

  // Window on the back wall above the sofa.
  const sky = canvasTex(128, 96, (c) => {
    const grd = c.createLinearGradient(0, 0, 0, 96);
    grd.addColorStop(0, '#8fd0f5');
    grd.addColorStop(1, '#d9f1fb');
    c.fillStyle = grd;
    c.fillRect(0, 0, 128, 96);
    c.fillStyle = '#7cc46a';
    c.fillRect(0, 74, 128, 22);
    c.fillStyle = 'rgba(255,255,255,0.9)';
    c.beginPath();
    c.ellipse(40, 30, 18, 8, 0, 0, Math.PI * 2);
    c.fill();
  });
  const skyMat = texMat(sky);
  skyMat.userData = noOutline;
  g.add(at(mesh(new THREE.PlaneGeometry(3.6, 2.4), skyMat), 5.2, 5.6, 0.02));
  for (const [w, h, x, y] of [
    [3.9, 0.2, 5.2, 4.4],
    [3.9, 0.2, 5.2, 6.8],
    [0.2, 2.6, 3.3, 5.6],
    [0.2, 2.6, 7.1, 5.6],
    [0.12, 2.4, 5.2, 5.6],
  ])
    g.add(at(box(w, h, 0.18, 0xfaf3e6), x, y, 0.08));

  // Sofa along the back wall.
  const sofaC = 0x3fa39a;
  const seat = 1.75;
  const sofa = group(
    at(box(6.5, 1.1, 2.9, darker(sofaC), 0.15), 0, 0.75, 0),
    at(box(2.6, 0.45, 2.1, sofaC, 0.2), -1.35, seat - 0.22, 0.3),
    at(box(2.6, 0.45, 2.1, sofaC, 0.2), 1.35, seat - 0.22, 0.3),
    at(box(6.5, 1.8, 0.7, sofaC, 0.25), 0, 2.0, -1.1),
    at(box(0.6, 1.2, 2.9, sofaC, 0.22), -3.0, 1.55, 0),
    at(box(0.6, 1.2, 2.9, sofaC, 0.22), 3.0, 1.55, 0),
    at(box(1.1, 0.9, 0.35, 0xf2b632, 0.25), -2.1, 2.2, -0.6, -15, 0, 8),
  );
  for (const x of [-2.9, 2.9]) for (const z of [-1.2, 1.2]) sofa.add(at(cyl(0.12, 0.08, 0.3, 0x5a3e2b, 8), x, 0.15, z));
  g.add(at(sofa, 5.25, 0, 1.75));

  // Coffee table.
  const tableTop = 1.6;
  const table = group(at(box(4.4, 0.22, 2.4, 0xd39a5c, 0.06), 0, tableTop - 0.11, 0), at(box(4.0, 0.08, 2.0, 0xb87843), 0, 0.45, 0));
  for (const [x, z] of [
    [-1.95, -0.95],
    [1.95, -0.95],
    [-1.95, 0.95],
    [1.95, 0.95],
  ])
    table.add(at(box(0.18, tableTop - 0.2, 0.18, 0xb87843), x, (tableTop - 0.2) / 2, z));
  g.add(at(table, 5.8, 0, 6.2));

  // TV on a low console against the left wall.
  const consoleTop = 1.9;
  g.add(at(box(1.8, consoleTop, 5.6, 0x8a5a3c, 0.06), 1.2, consoleTop / 2, 5.0));
  for (const z of [3.4, 5.0, 6.6]) g.add(at(box(0.05, 1.2, 1.4, 0xa86f48, 0.04), 2.12, 0.95, z));
  const tv = group(
    at(box(0.5, 0.12, 1.2, DARK_TV, 0.04), 0, 0.06, 0),
    at(box(0.12, 0.5, 0.2, DARK_TV), 0, 0.3, 0),
    at(box(0.18, 2.0, 3.6, DARK_TV, 0.06), 0, 1.5, 0),
  );
  const screen = mesh(
    new THREE.PlaneGeometry(3.3, 1.75),
    texMat(
      canvasTex(160, 90, (c) => {
        const grd = c.createLinearGradient(0, 0, 160, 90);
        grd.addColorStop(0, '#3a5a9a');
        grd.addColorStop(1, '#6a4a9a');
        c.fillStyle = grd;
        c.fillRect(0, 0, 160, 90);
      }),
    ),
  );
  screen.rotation.y = Math.PI / 2;
  screen.position.set(0.1, 1.5, 0);
  tv.add(screen);
  g.add(at(tv, 0.65, consoleTop, 5.0));

  // Bookshelf in the back-right corner.
  const shelfTop = 4.3;
  const shelf = group(at(box(2.8, shelfTop, 1.4, 0xf3ede2, 0.05), 0, shelfTop / 2, 0));
  for (const y of [1.4, 2.8]) shelf.add(at(box(2.6, 0.1, 1.2, 0xe2d6c2), 0, y, 0.1));
  const spines = [0xd65a4a, 0x3f7fd0, 0xf0b84a, 0x3fa36b, 0x8a5ac8, 0xe45b8f, 0x2fb3c9];
  for (const [row, y] of [
    [0, 0.25],
    [1, 1.5],
    [2, 2.9],
  ])
    for (let i = 0; i < 6; i++) {
      const h = 1.0 - ((i + row) % 3) * 0.12;
      shelf.add(at(box(0.32, h, 1.0, spines[(i + row * 2) % spines.length], 0.03), -1.05 + i * 0.42, y + h / 2, 0.1));
    }
  g.add(at(shelf, 10.45, 0, 0.75));

  // Floor lamp.
  g.add(at(group(at(cyl(0.4, 0.45, 0.1, 0x3a3f4a), 0, 0.05, 0), at(cyl(0.05, 0.05, 4.2, 0x3a3f4a, 8), 0, 2.1, 0), at(cyl(0.45, 0.7, 0.9, 0xfaf3e6, 20), 0, 4.4, 0)), 11.3, 0, 2.6));

  g.add(at(rug(6.8, 5.2, '#e9a77a', '#fbe6d0'), 6.3, 0.03, 6.6));

  g.traverse((o) => {
    if ((o as THREE.Mesh).isMesh) {
      o.castShadow = true;
      o.receiveShadow = true;
    }
  });
  return {
    group: g,
    surfaces: { sofa: seat, table: tableTop, console: consoleTop, shelf: shelfTop, rug: 0.06, floor: 0 },
    focus: new THREE.Box3(new THREE.Vector3(0.6, 0, 0.3), new THREE.Vector3(11.8, 6.4, 9.6)),
    background: 0xf2c48a,
  };
}

const DARK_TV = 0x22252c;

function darker(c: number, k = 0.75) {
  return new THREE.Color(c).multiplyScalar(k).getHex();
}

export function buildRoom(id: RoomId): Room {
  switch (id) {
    case 'study':
      return study();
    case 'kitchen':
      return kitchen();
    case 'bedroom':
      return bedroom();
    case 'bathroom':
      return bathroom();
    case 'living':
      return living();
  }
}
