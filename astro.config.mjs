// @ts-check
import { defineConfig } from 'astro/config';
import sitemap from '@astrojs/sitemap';
import icon from 'astro-icon';

/** Drop a leading <h1> so writeup pages do not repeat the session title. */
function rehypeDropLeadingH1() {
  return (tree) => {
    const children = tree.children;
    if (!Array.isArray(children)) return;
    const idx = children.findIndex((node) => node.type === 'element');
    if (idx !== -1 && children[idx].tagName === 'h1') {
      children.splice(idx, 1);
    }
  };
}

export default defineConfig({
  site: 'https://zew0z.github.io',
  /* 'file' keeps the old Jekyll URLs alive: /2026/09/11/<slug>.html */
  build: { format: 'file' },
  integrations: [sitemap(), icon()],
  markdown: {
    shikiConfig: {
      theme: 'tokyo-night',
    },
    /* page title is the only display title; drop the duplicate markdown H1 */
    rehypePlugins: [rehypeDropLeadingH1],
  },
});
