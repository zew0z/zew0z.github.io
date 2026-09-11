// @ts-check
import { defineConfig } from 'astro/config';
import sitemap from '@astrojs/sitemap';
import icon from 'astro-icon';

export default defineConfig({
  site: 'https://zew0z.github.io',
  /* 'file' keeps the old Jekyll URLs alive: /2026/09/11/<slug>.html */
  build: { format: 'file' },
  integrations: [sitemap(), icon()],
  markdown: {
    shikiConfig: {
      theme: 'tokyo-night',
    },
  },
});
