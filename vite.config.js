import { defineConfig } from 'vite';

// One repo, several themed sites. SITE picks which page is built as the site's index.html:
//   SITE=chennai (default) -> index.html   (Dishanth & Pravya)
//   SITE=sydney            -> sydney.html  (Yashik)
// On Netlify each site sets SITE in its environment variables; the build command is the same.
const PAGES = { chennai: 'index.html', sydney: 'sydney.html' };
const site = process.env.SITE || 'chennai';
if (!PAGES[site]) throw new Error(`Unknown SITE "${site}". Use one of: ${Object.keys(PAGES).join(', ')}`);

export default defineConfig({
  base: './',
  build: {
    rollupOptions: { input: PAGES[site] },
  },
  plugins: [{
    name: 'page-as-index',
    enforce: 'post',
    // serve the chosen page at the site root
    generateBundle(_, bundle) {
      const page = bundle[PAGES[site]];
      if (page && PAGES[site] !== 'index.html') page.fileName = 'index.html';
    },
  }],
});
