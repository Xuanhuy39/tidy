// Dev-only page (gallery.html): every item model as a large render and at tray-icon size.
import { CATEGORIES } from './game/categories';
import { LEVELS } from './game/levels';
import { modelName } from './scene/models';
import { Thumbs } from './scene/thumbs';

const thumbs = new Thumbs(256);
const out = document.getElementById('out')!;
const seen = new Set<string>();
for (const level of LEVELS) {
  for (const cat of level.queue) {
    const items = level.items.filter((i) => i.cat === cat);
    const h = document.createElement('h2');
    h.textContent = `${level.name} · ${CATEGORIES[cat].icon} ${CATEGORIES[cat].name}`;
    const row = document.createElement('div');
    row.className = 'row';
    for (const item of items) {
      const key = `${item.kind}:${item.variant ?? 0}`;
      const url = thumbs.get(item.kind, item.variant ?? 0);
      const fig = document.createElement('figure');
      fig.innerHTML = `<img class="big" src="${url}"><br><img class="small" src="${url}"><figcaption>${modelName(item.kind)}${seen.has(key) ? ' (repeat)' : ''}</figcaption>`;
      seen.add(key);
      row.append(fig);
    }
    out.append(h, row);
  }
}
