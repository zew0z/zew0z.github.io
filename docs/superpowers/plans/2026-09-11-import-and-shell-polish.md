# Writeup Import + Guest Shell Polish Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Import the three TryHackMe rooms completed 2026-09-10 (Simple CTF, Bounty Hacker, Crack the Hash) as spoiler-free writeups, then polish the guest shell (tab completion, Ctrl+C, grep) and make the flag board visible on the page.

**Architecture:** Same static Jekyll + vanilla JS stack. New posts follow the established writeup voice (casual first-person, fails included, h2 sections, flags redacted). New JS extends `assets/js/terminal.js` (home-only) and `assets/js/main.js` (global). Flag board strip fetches the existing `leaderboard.json`, no backend.

**Tech Stack:** Jekyll (kramdown), vanilla ES5-compatible JS, gruvbox CSS custom properties. No new dependencies except the GitHub-Pages-whitelisted `jekyll-sitemap` plugin.

**Spec:** User request "Lets keep improving this" + memory constraints: keep gruvbox terminal visual language ([[blog-terminal-redesign]]), writeup import workflow + no-spoiler rules ([[zero-os-writeup-import]]).

## Global Constraints

- No em-dashes in any new UI copy or post prose (use `-`, `::`, or restructure).
- All new motion honors `prefers-reduced-motion` (no new motion is planned; if any is added, JS-gate it).
- Lowercase terminal voice for all new shell output; no exclamation marks in system responses.
- NO-SPOILER RULE (absolute): never publish flag values, credential values, or strings that encode them. Grep the built `_site` HTML for every secret before commit.
- Keep existing URLs, nav labels, tmux windows, and section ids untouched. The flag board strip lives INSIDE the existing `#terminal` panel; no new nav window, no scroll-spy change.
- Working directly on `main` per this repo's established solo workflow. Commit; do NOT push (user pushes separately).
- Deviation from writing-plans handoff: executing inline in this session (solo repo, voice-critical prose, all context loaded).

## Secret Redaction List (grep targets after build)

- Simple CTF: `G00d j0b, keep up!`, `W3ll d0n3. You made it!`, mitch's password (`secret` must not appear as the cracked answer), salt `1dac0d92e9fa6bb2`, md5 `0c01f4468bd75d7a84c7eb73846e8d96`
- Bounty Hacker: `THM{CR1M3_SyNd1C4T3}`, `THM{80UN7Y_h4cK3r}`, SSH password `RedDr4gonSynd1cat3`, no reproduction of the `locks.txt` wordlist lines
- Crack the Hash: all nine plaintext answers (`password123`, `letmein`, `bleh`, `Eternity22`, `paule`, `n63umy8lkf4i`, `waka99`, `481616481616`, and the level-1 md5 answer). NOTE: the hashes themselves are the room's public puzzle inputs and are fine to publish. NOTE: ALL seven vault CrackStation screenshots visibly show decoded answers, so this post ships text-only (same rule that excluded `thm-mr-robot-base64-decode.png`).
- `easy` and `bleh` will false-positive on prose; confirm hits are prose, not answers.

---

### Task 1: Copy room images from vault

**Files:**
- Create: `assets/img/simple-ctf/` (7 pngs), `assets/img/bounty-hacker/` (2 pngs)

- [ ] Copy from `/home/zew0z/zero-os/Attachments/`:
  - simple-ctf: `thm-simplectf-apache-default.png`, `thm-simplectf-robots-txt.png`, `thm-simplectf-openemr-404.png`, `thm-simplectf-openemr-exploitdb.png`, `thm-simplectf-cms-homepage.png`, `thm-simplectf-cms-exploitdb.png`, `thm-simplectf-admin.png`
  - bounty-hacker: `thm-bounty-hacker-webpage.png`, `thm-bounty-hacker-source.png`
- [ ] Verify: `ls assets/img/simple-ctf assets/img/bounty-hacker` shows all 9.

### Task 2: Simple CTF writeup

**Files:**
- Create: `_posts/2026-09-11-simple-ctf-tryhackme.md`

- [ ] Frontmatter: title `Simple CTF - TryHackMe CTF Writeup`, date `2026-09-11`, tags `[tryhackme, ctf, simple-ctf, sqli, privesc]`, description mentioning beginner box, OpenEMR rabbit hole, blind SQLi, sudo vim. H1 + "flags left out as always" note + room link (`https://tryhackme.com/room/room/simplectf` format: `https://tryhackme.com/room/simplectf`).
- [ ] Sections (h2): Recon (nmap, ssh on 2222, services-under-1000 misread as 1 -> actually 2), The OpenEMR Rabbit Hole (robots.txt -> 404 -> exploit-db research that went nowhere -> gobuster found `/simple/`), SQLi on CMS Made Simple (CVE-2019-9053, python2 SyntaxError fail, wrong base-URL empty-output fail, correct run dumps salt/user/hash/crack, REDACT password), Shell and Root (ssh -p 2222, user flag REDACTED, `sudo -l` -> vim -> `:!bash`, root flag REDACTED, sunbath user), What I Learned.
- [ ] Use `<machine-ip>` placeholder in code blocks (established convention). Include the two fail beats verbatim from the transcript (python2 print SyntaxError; exploit returning empty fields because URL lacked `/simple`).
- [ ] Images: apache-default, robots-txt, openemr-404, openemr-exploitdb, cms-homepage, cms-exploitdb, admin (path `/assets/img/simple-ctf/<file>`).
- [ ] End with the established bold sign-off line.
- [ ] Verify: grep `_site` for redaction list items; grep `G00d j0b` / `W3ll d0n3` / `1dac0d92` / `0c01f446` = zero hits.

### Task 3: Bounty Hacker writeup

**Files:**
- Create: `_posts/2026-09-11-bounty-hacker-tryhackme.md`

- [ ] Frontmatter: title `Bounty Hacker - TryHackMe CTF Writeup`, date `2026-09-11`, tags `[tryhackme, ctf, bounty-hacker, hydra, privesc]`, description mentioning Cowboy Bebop box, anonymous FTP, hydra, sudo tar.
- [ ] Sections (h2): Recon (nmap 3 ports, anonymous FTP allowed), TheFTP Leaks (task.txt signed by lin, locks.txt is a custom wordlist - describe it, DO NOT reproduce its lines), Hydra Against SSH (26-password wordlist, instant crack, REDACT password), Shell + Root (user flag REDACTED, `sudo -l` allows tar, tar checkpoint GTFOBins one-liner, root flag REDACTED), What I Learned.
- [ ] Room link `https://tryhackme.com/room/cowboyhacker`. Images: webpage, source.
- [ ] Verify: grep for `THM{`, `RedDr4gonSynd1cat3`, `rEddrAGON` = zero hits in `_site`.

### Task 4: Crack the Hash writeup

**Files:**
- Create: `_posts/2026-09-11-crack-the-hash-tryhackme.md`

- [ ] Frontmatter: title `Crack the Hash - TryHackMe CTF Writeup`, date `2026-09-11`, tags `[tryhackme, ctf, crack-the-hash, hashing, hashcat]`, description mentioning hash identification by length, bcrypt pain, hashcat and John.
- [ ] Text-only (all vault screenshots show decoded answers). Sections (h2): How To Identify a Hash (length math: 32 hex = md5, 40 = sha1, 64 = sha256; modular format prefixes `$2y$` `$6$`; salted HMAC), Level 1 (five hashes, keep the hash strings, REDACT every plaintext; tell the bcrypt story: john "No password hashes loaded" until `$2y$` -> `$2a$`, hashcat 20 H/s on GTX 1050 Ti, 6-hour estimate, pivot to rockyou filtered to 4-char words = 18152 candidates, john CPU cracks in 8s), Level 2 (sha512crypt mode 1800, HMAC-SHA1 mode 160 with `hash:salt` file format, REDACT plaintexts), What I Learned.
- [ ] Room link `https://tryhackme.com/room/crackthehash`. Adapted code blocks with `(redacted)` in place of answers.
- [ ] Verify: grep for `password123`, `letmein`, `Eternity22`, `n63umy8lkf4i`, `waka99`, `481616481616` = zero hits; manually confirm `easy`/`bleh`/`paule` hits are prose only.

### Task 5: Guest shell - tab completion, Ctrl+C, grep

**Files:**
- Modify: `assets/js/terminal.js`

- [ ] Tab completion in the existing keydown handler: `e.key === 'Tab'` -> preventDefault; complete first token against ALL command names (hidden ones included: completing something you half-know is fair in a fake shell); for `cat`/`decode`/`nano`/`rm` complete file names from a FILE list (`about_me.txt contact.txt flag.txt motd writeups/` plus `.flag.enc`/`.zsh_history` only when current token starts with `.`); for `open`/`grep` complete post slugs. One exact match -> fill; several -> print matches as a row; none -> do nothing.
- [ ] Ctrl+C: emit the prompt + current input + `^C` as a row, clear input.
- [ ] `grep <query>` command: case-insensitive match against post title + slug + tags; print `[n] slug :: title` rows for matches plus "open with: open <n>"; no match -> `grep: no matches for '<q>'`; no args -> usage line. Add `grep` line to `help` output.
- [ ] Verify in built site: `op<Tab>` completes to `open`, `cat .<Tab>` offers `.flag.enc`/`.zsh_history`, `grep sqli` finds Simple CTF, Ctrl+C shows `^C`.

### Task 6: Visible flag board strip

**Files:**
- Modify: `index.html` (strip markup inside `#terminal` panel after `.term-hint`)
- Modify: `assets/js/terminal.js` (fetch + render)
- Modify: `assets/css/style.scss` (`.flagboard` styles, gruvbox tokens)

- [ ] Markup: `<div class="flagboard" id="flagboard">` with a `panel-tab`-style header row `flagboard :: cat leaderboard.json` and a `<div id="flagboard-rows">` body. Static fallback text if JS off: keep the container empty and harmless (noscript safe).
- [ ] Render: fetch `/leaderboard.json` (cache-busted), rows as `1. name  date` in ls-row style, highlight local `zew0z-name` in green with `<- you`; if `zew0z-root` but name absent from board, append a muted `you: not published yet (run: publish in the shell)` row; fetch fail -> single muted row `board unavailable offline`. Footer row: `join: capture the flag in the shell above, then publish`. Cap display at 8 entries.
- [ ] CSS: reuse existing tokens/typography; no cards, no new accent color, hairline top border like other panel internals; mobile-safe (no overflow).
- [ ] Verify: strip renders seeded entry (`zew0z`), green highlight for registered local name, graceful offline text when fetch blocked.

### Task 7: tmux root chip + sitemap

**Files:**
- Modify: `assets/js/main.js` (root chip in tmuxbar-right)
- Modify: `assets/css/style.scss` (`.tmux-root` style, orange)
- Modify: `_config.yml` (add `jekyll-sitemap` to plugins)

- [ ] If `localStorage zew0z-root === '1'`, append `<span class="tmux-root">⬤ root</span>` before the clock; otherwise nothing. Re-check in terminal.js `grantRoot()` so it appears immediately on capture (expose `window.zew0z.setRootChip()` or re-query DOM there).
- [ ] `_config.yml` plugins: add `- jekyll-sitemap`.
- [ ] Verify: build produces `sitemap.xml`; chip appears with `zew0z-root=1` in localStorage and not otherwise.

### Task 8: Build + visual verification + secrets sweep + commit

- [ ] `jekyll build` succeeds, zero errors.
- [ ] Serve `_site`, screenshot with playwright (path `/home/zew0z/.hermes/hermes-agent/node_modules/playwright`): home at 1440px + 390px (terminal + flagboard strip + writeups), each new post at 1440px + 390px. Check theme consistency, contrast, no overflow, strip layout on mobile.
- [ ] Secrets sweep: grep `_site` for every entry in the Secret Redaction List; zero hits (false positives manually reviewed).
- [ ] Fix findings, re-verify, commit all to `main` (no push).
- [ ] Update memory `zero-os-writeup-import.md` (imported rooms + Agent Sudo now the only pending done-adjacent room) and `blog-terminal-redesign.md` (flagboard strip, tab completion) after commit.
