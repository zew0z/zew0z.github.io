# Astro Portfolio Rebuild Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the Jekyll gruvbox-terminal site with a from-scratch Astro portfolio: dark ink-navy base with vivid multicolor accents (dark-but-colorful, per user), professional portfolio synopsis at top, writeup catalog with live search below, guest terminal as a playground at the very bottom. Writeups keep their own pages at the exact same URLs.

**User decisions (2026-09-11):** Astro framework; dark but colorful (charcoal/ink-blue + vivid platform accents, dark mode only); terminal at bottom under the writeups; user will supply final synopsis copy later (placeholder copy until then); no black-and-white; professional portfolio-forward.

**Architecture:** Astro v5 static, `build.format: 'file'` so `/2026/09/11/<slug>.html` URLs survive exactly. Content collection `writeups` (glob loader over `src/content/writeups/*.md`, frontmatter gains explicit `platform`). Deploy via `.github/workflows/deploy.yml` (withastro/action) after switching Pages to Actions builds. Existing `flag-board.yml` bot repointed to `public/leaderboard.json`. Guest shell (`terminal.js`) and site behaviors port nearly verbatim - they are framework-agnostic and DOM-id-driven.

**Design system:** ink-navy surfaces (`#0b0f1e` family), cool-white ink text, multicolor accent roles: teal = TryHackMe, green = HTB, violet = blog, amber = medium, coral = hard, sky = info. Display font Space Grotesk, body Instrument Sans, mono JetBrains Mono (all self-hosted via fontsource). Signature motif: a 5-color "spectrum rule" gradient (teal-green-amber-coral-violet) used sparingly: under the hero, on catalog card spines, in the footer. No terminal cosplay outside the playground; boot overlay dropped for professionalism; konami/matrix stay as hidden easter eggs.

**Tech Stack:** Astro 5 + @astrojs/rss + @astrojs/sitemap + fontsource variables. Hand-rolled vanilla CSS (custom properties only, no Tailwind) per "our own stuff". No UI framework.

**Global constraints (inherited):**
- NO-SPOILER RULE: grep built output for the secret redaction list (same list as 2026-09-11 plan) - zero hits.
- No em-dashes in UI copy or prose. Lowercase shell voice, no exclamation marks in system responses.
- Writeup post markdown bodies port verbatim (they contain no Liquid).
- Old URLs preserved: `/`, `/2026/09/11/*.html`, `/feed.xml`, `/404.html`. Jekyll's `sitemap.xml` becomes Astro's `sitemap-index.xml` (acceptable).
- Working on `main`; user pushes (and asked for push on previous change - push after verification).

---

### Task 1: Scaffold Astro project

- [ ] `package.json` (astro ^5, @astrojs/rss, @astrojs/sitemap, 3 fontsource variable packages), `astro.config.mjs` (site, sitemap, format file), `tsconfig.json`, updated `.gitignore` (node_modules, dist, .astro).
- [ ] `npm install` green; `npx astro build` on a stub page green.

### Task 2: Port content + assets

- [ ] Script: convert `_posts/*.md` to `src/content/writeups/*.md` - strip `layout:`/`author:`, add `platform:` (thm|htb|blog from tags), keep difficulty/room/date/title/description/tags.
- [ ] `public/`: assets/img/** (all writeup images), favicon.ico, leaderboard.json (move from root), robots.txt unchanged-none.
- [ ] Patch `.github/workflows/flag-board.yml` to write `public/leaderboard.json`.
- [ ] `src/content.config.ts` schema: title, date (date), description, tags (string[]), platform (thm|htb|blog), difficulty (optional), room (optional).
- [ ] Verify: `getCollection('writeups')` returns 10 in dev/build.

### Task 3: Design system + base layout

- [ ] `src/styles/global.css`: tokens (surfaces, ink, 6 accents), reset, typography scale, buttons/links, spectrum rule, container, section headers, focus-visible states, selection, reduced-motion guards.
- [ ] `src/layouts/BaseLayout.astro`: head (seo title/desc/og, theme-color, favicon, fonts via fontsource imports, global.css), header nav (wordmark, writeups, playground, github), footer (spectrum rule, links, "built from scratch" line), slot.

### Task 4: Home page (synopsis → catalog → playground)

- [ ] Synopsis hero: name, one-line role, placeholder bio paragraph (from current about text, marked TODO-USER-COPY), stats strip (rooms pwned / platforms / all techniques documented), links row (github, discord @zew0z, ko-fi, rss), spectrum rule.
- [ ] Catalog section: header with count, search input (`/` shortcut, lazy-loads `/search-index.json`), platform filter chips (all/thm/htb/blog), case-file rows (platform color spine, title, description, tags, date, difficulty chip, read time, room link), empty state.
- [ ] `src/pages/search-index.json.js`: title/date/difficulty/platform/room/tags/description/text (body, code fences stripped).
- [ ] Playground section: guest shell (same DOM ids: guest-term/term-out/term-form/term-input/term-prompt/site-data/flagboard-rows) + hint line + flagboard strip.
- [ ] `#site-data` JSON inlined from collection (same shape terminal.js expects: posts[].title/url/date/tags/difficulty/room/platform).

### Task 5: Writeup pages

- [ ] `src/pages/[year]/[month]/[day]/[slug].astro` generating old URLs (format file).
- [ ] Writeup layout: breadcrumb, title, meta (date, platform badge, difficulty, room link, read time), TOC (details, tree glyphs), prose styles (colorful h2 accent, code blocks, tables, images), prev/next nav, kofi line, back-to-catalog.
- [ ] Port code copy buttons + reading progress into `src/scripts/site.js`.

### Task 6: Port scripts

- [ ] `src/scripts/terminal.js`: verbatim port of current terminal.js.
- [ ] `src/scripts/site.js`: achievements store (ACH/achieve/getAch on window.zew0z), konami, matrix rain, tab-blur title, progress bar, TOC, copy buttons, search (catalog filter).
- [ ] Drop: boot overlay, panel-tab scramble, tmux bar, scroll-spy, ls-filters (replaced by search + chips).

### Task 7: 404, RSS, sitemap, misc

- [ ] `src/pages/404.astro` (professional dark version of the cat-error joke).
- [ ] `src/pages/feed.xml.js` (@astrojs/rss) at `/feed.xml`.
- [ ] Sitemap via integration; `site` set.

### Task 8: Deploy pipeline

- [ ] `.github/workflows/deploy.yml`: checkout → withastro/action@v3 → actions/deploy-pages@v4, on push to main.
- [ ] Attempt `gh api -X PUT repos/zew0z/zew0z.github.io/pages -f build_type=workflow`; if unauthorized, tell user the one setting to flip (Settings → Pages → Source: GitHub Actions).

### Task 9: Remove Jekyll

- [ ] Delete `_config.yml`, `_layouts/`, `index.html`, `404.html`, `_posts/`, `assets/` (moved), `leaderboard.json` (moved to public/), `.jekyll-cache/`, `_site/` stays ignored-removed.

### Task 10: Verification

- [ ] `astro build` green; serve `dist/`; playwright drive: home renders, search filters (type "sudo" → agent-sudo row only), terminal commands (help/wiki/nmap/achievements) work, post page renders with copy buttons and progress, 404 works, zero console errors.
- [ ] Grep `dist/` for secret redaction list: zero hits.
- [ ] Judge visual gate: home (desktop + 390px), one writeup page, 404.
- [ ] Commit + push; confirm Actions deploy starts.
