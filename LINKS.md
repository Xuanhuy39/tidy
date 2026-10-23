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
| Menu with all levels unlocked | http://localhost:5173/?unlock |

If port 5173 is busy, Vite picks the next free one (5174, ...). The terminal prints the actual link.

## Live site (Vercel)

| What | Link |
| --- | --- |
| Game | https://huynx-tidy.vercel.app/ |
| Vercel project | https://vercel.com/huy-nx/huynx-tidy |

Redeploy after changes (from this folder): `vercel deploy --prod --scope huy-nx`
