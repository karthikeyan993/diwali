# Happy Diwali 🪔

A mobile-first Diwali greeting for Yashik, Dishanth and Pravya.

1. **Who are you?** Tap your name.
2. Your name lights up and launches like a rocket, then bursts into fireworks.
3. **Happy Diwali, _Name_!** flies in letter by letter.
4. Mini-game: tap the 5 diyas to light them for a grand finale. Tap the sky any time for more fireworks.

Built with [Vite](https://vite.dev), [PixiJS](https://pixijs.com) (WebGL fireworks) and [GSAP](https://gsap.com) (rocket and text animation). All sounds are synthesised with Web Audio; there are no audio files.

## Run locally

```bash
npm install
```

```bash
npm run dev
```

## Deploy to Netlify

`netlify.toml` already sets the build (`npm run build`, publish `dist`, Node 22).
In Netlify: **Add new site → Import an existing project → GitHub →** pick this repo, branch `main`, and deploy.

To change the names, edit the three `.name` buttons in `index.html`.
