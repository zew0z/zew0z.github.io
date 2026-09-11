# AGENTS.md — zew0z.github.io

Personal portfolio + security writeup site for zew0z, deployed to GitHub Pages.
Astro 5 static site, hand-rolled CSS design system, terminal/shell aesthetic.
Live at https://zew0z.github.io

## Commands

```sh
npm install
npm run dev       # http://localhost:4321
npm run build     # static build to dist/ — run this before declaring any round done
npm run preview   # serve the built dist/
```

There is no test suite. Verification = `npm run build` exits clean + you actually
looked at the changed pages in a browser (dev or preview), at desktop AND mobile width.

## Stack

- **Astro 5** (static output), integrations: `@astrojs/sitemap`, `astro-icon` (Tabler icon set).
- **No Tailwind, no JS framework.** All styling is vanilla CSS in `src/styles/global.css`
  with custom-property tokens. Scripts are small vanilla JS files in `src/scripts/`.
- **Fonts** self-hosted via Fontsource: Space Grotesk (display), Instrument Sans (body),
  JetBrains Mono (everything terminal-flavored).
- `build.format: 'file'` in astro.config.mjs keeps the old Jekyll URLs alive
  (`/2026/09/11/<slug>.html`). Do not change this; internal links use `/page.html` forms.
- Markdown code blocks render with Shiki theme `tokyo-night`.

## Layout of the repo

```
src/
  layouts/BaseLayout.astro     header/nav/footer shell, meta, font + css imports
  pages/                       index, portfolio, writeups, 404, feed.xml (RSS)
  components/                  AsciiArt, ShellPrompt, WorkListing, WriteupCatalog
  content/writeups/*.md        the writeups collection (content collections API)
  lib/                         ascii.ts (banners), portfolio.ts (work items, typed),
                               writeups.ts (collection helpers: getWriteups, postUrl…)
  scripts/site.js              reveals, TOC, code copy buttons, spoiler gates, matrix easter egg
  scripts/terminal.js          the guest shell on the homepage (fake shell, flag hunt, flagboard)
public/assets/img/<room>/      writeup screenshots (referenced from markdown)
public/leaderboard.json        flag board data, written by the flag-board GitHub Action
docs/superpowers/plans/        historical build plans
.agents/skills/                installed agent skills (see below)
```

## Content rules

- Writeup frontmatter schema (enforced in `src/content.config.ts`):
  `title`, `date`, `description` (required); `tags[]` (default `[]`);
  `platform`: `thm | htb | blog`; optional `difficulty`, `room`.
- **Spoiler discipline is a product feature.** Never put flags, answers, or
  credential values in plain text or in screenshot filenames/alt text. Screenshots
  are wrapped as blurred click-to-reveal (`img-spoiler`); rooms can sit behind the
  amber spoiler gate (`.spoiler-gate` / `.spoiler-zone`). Keep it that way.
- The flag board is driven by GitHub issues + the `flag-board.yml` workflow writing
  `public/leaderboard.json`. Don't hand-edit the JSON for new entries.

## Design system (global.css is the single source of truth)

- Surfaces: `--bg0..--bg3`, lines `--line/--line2`, ink `--ink/--ink2/--ink3`.
- Accents are role-mapped, don't repurpose them: teal = THM/primary, green = HTB,
  violet = blog, amber = warnings/medium difficulty, coral = hard, sky = info links.
- `--spectrum` is the signature gradient (used in `.hero-name .grad`, dividers,
  reading progress). Reuse it; don't invent new gradients.
- One radius scale (`--radius: 4px` / `--radius-sm: 2px`). Sharp-ish is intentional.
- Copy style: lowercase, shell-flavored (`./portfolio`, `cd writeups →`, `# motd`).
  Keep it consistent; no exclamation-mark marketing voice.
- Motion respects `prefers-reduced-motion` (there is a global reduce block — extend
  it if you add new animations).
- Every new component: keyboard focusable with visible `:focus-visible` outline,
  semantic HTML first, images with dimensions + alt.

## Agent skills installed (`.agents/skills/`, locked in skills-lock.json)

- `design-taste-frontend` — use for any visual/redesign work; anti-template rules,
  audit the existing page first, keep the established identity.
- `frontend-design` (anthropics/skills) — design quality guidance for new UI.
- `web-interface-guidelines` — run as an audit pass over changed UI before shipping
  (a11y, focus states, forms, animation, typography, performance).
- `webapp-testing` (anthropics/skills) — Playwright harness if you need to drive the
  running site and capture screenshots programmatically.

Install/update via `npx skills add <owner>/<repo>` from the repo root.

## Deploy

Push to `main` → `deploy.yml` builds with `withastro/action@v3` and publishes to
GitHub Pages. Preview links aren't automatic; check `npm run build` + local preview
before pushing.

## House rules

- Don't bump Astro major versions casually (`astro.config.mjs` comment documents the
  file-format URL constraint).
- Screenshot assets live under `src/assets/img/<room-slug>/` so Astro's image
  pipeline optimizes them (webp + intrinsic dimensions, no CLS). Reference them
  from markdown with paths relative to the md file:
  `../../assets/img/<room>/<shot>.png`. Never use `/assets/...` absolute paths —
  those bypass optimization (that's what `public/` is for).
- The guest shell (`terminal.js`) indexes writeups from the inline JSON in
  `index.astro` (`#site-data`); if you change writeup URLs or add pages, check the
  shell's `wiki`/search commands still resolve.
