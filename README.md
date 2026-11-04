# Happy Diwali 🪔

Mobile-first Diwali greetings, one repo, two sites:

| Site | Page | For | Theme |
|---|---|---|---|
| `SITE=chennai` (default) | `index.html` | Dishanth & Pravya | Chennai: gopuram, mango-leaf toran, diya game, crackers to burst |
| `SITE=sydney` | `sydney.html` | Yashik | Sydney Nights: Opera House (Vivid colours), Harbour Bridge waterfall, ferry, promenade crackers, fireworks reflected in the harbour |

Built with [Vite](https://vite.dev), [PixiJS](https://pixijs.com) (WebGL fireworks) and [GSAP](https://gsap.com). Sounds are synthesised with Web Audio.

## Layout

```
src/shared/   fireworks engine, sounds, sky canvas, name rocket, greeting letters, base styles
src/chennai/  Chennai page (skyline, toran, games)
src/sydney/   Sydney page (harbour)
```

## Run locally

```bash
npm install
```

```bash
npm run dev
```

Then open `/` for Chennai or `/sydney.html` for Sydney.

## Deploy (Netlify)

Both sites build from this repo with the same `netlify.toml` (`npm run build`, publish `dist`). The `SITE` environment variable decides which page becomes the site's home page.

- **Chennai site** (existing): nothing to set. It builds the Chennai page by default.
- **Sydney site**: in Netlify choose **Add new project → Import an existing project → GitHub →** this repo, branch `main`. Then go to **Project configuration → Environment variables**, add `SITE` = `sydney`, and redeploy.

Every push to `main` rebuilds both sites.
