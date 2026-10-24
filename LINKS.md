# Tidy Up! — links

Start the dev server first (from this folder):

```bash
npm.cmd run dev
```

(Keep that terminal open; closing it stops the server.)

| What | Link |
| --- | --- |
| Game (menu) | http://localhost:5173/ |
| Level 1 — Study Nook | http://localhost:5173/?level=1 |
| Level 2 — Cozy Kitchen | http://localhost:5173/?level=2 |
| Level 3 — Messy Bedroom | http://localhost:5173/?level=3 |
| Level 4 — Splashy Bathroom | http://localhost:5173/?level=4 |
| Level 5 — Living Room | http://localhost:5173/?level=5 |
| Menu with all levels unlocked | http://localhost:5173/?unlock |
| Model gallery (every item, large and at icon size) | http://localhost:5173/gallery.html |

If port 5173 is busy, Vite picks the next free one (5174, ...). The terminal prints the actual link.

## Live site (Vercel)

| What | Link |
| --- | --- |
| Game | https://huynx-tidy.vercel.app/ |
| Vercel project | https://vercel.com/huy-nx/huynx-tidy |
| GitHub repo | https://github.com/Xuanhuy39/tidy |

Pushing to `main` deploys automatically. Manual deploy (from this folder): `vercel deploy --prod --scope huy-nx`
