# Rooms Wiki + Guest Shell v2 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add the two new TryHackMe rooms completed 2026-09-10/11 (Agent Sudo, c4ptur3-th3-fl4g) as spoiler-free writeups, then turn the guest shell into a self-aware hacking playground: a `wiki` room roster, an animated `nmap` self-scan, an achievements system, and a pile of ASCII-art easter eggs. "Go wild" per the user, inside the established gruvbox terminal language.

**Architecture:** Same static Jekyll + vanilla ES5-compatible JS stack. Room metadata (`difficulty`, `room` slug) moves into post frontmatter and flows through the `#site-data` JSON to both the writeup listing (difficulty chips) and the guest shell (`wiki` command). Achievements live in a localStorage store exposed from `main.js` (global) so konami can unlock on any page; `terminal.js` (home-only) reads and displays them.

**Tech Stack:** Jekyll (kramdown), vanilla ES5-compatible JS, gruvbox CSS custom properties. No new dependencies.

**Spec:** User request "add the new rooms to the wiki. Second of all go wild... ascii art... hacker vibes... dopest portfolio/writeups page ever."

## Global Constraints (inherited from 2026-09-11 plan)

- No em-dashes in any new UI copy or post prose (use `-`, `::`, or restructure).
- All new motion honors `prefers-reduced-motion` (nmap/tail animations JS-gated).
- Lowercase terminal voice for all new shell output; no exclamation marks in system responses.
- NO-SPOILER RULE (absolute): never publish flag values, credential values, or strings that encode them.
- Keep existing URLs, nav labels, tmux windows, and section ids untouched.
- Working directly on `main` per this repo's established solo workflow. Commit; do NOT push.

## Secret Redaction List (grep targets after build)

- Agent Sudo: FTP password `crystal`, steg password `Area51` AND its base64 form `QXJlYTUx`, SSH password `hackerrules!`, user flag `b03d975e8c92a7c04146cfa7a5a313c7`, root flag `b53a02f55b57d4439e3341834d70c062`. Usernames (`chris`, `james`), CVE-2019-14287, and the Roswell incident name are fine.
- c4ptur3-th3-fl4g: every decoded plaintext answer (all Task 1 answers, `Super Secret Message`, `SpaghettiSteg`, `AHH_YOU_FOUND_ME`, `hackerchat.png` as an answer). Encoded room inputs may appear (same rule as Crack the Hash hashes), truncated where absurdly long. Ships text-only: every vault screenshot visibly shows decoded answers.
- Excluded image: `thm-agent-sudo-base64-decode.png` (shows the steg password). Included: webpage, user-agent-c, alien-autopsy, incident-search.

---

### Task 1: Images

**Files:** Create `assets/img/agent-sudo/` (4 pngs)

- [ ] Copy from `/home/zew0z/zero-os/Attachments/`: `thm-agent-sudo-webpage.png`, `thm-agent-sudo-user-agent-c.png`, `thm-agent-sudo-alien-autopsy.png`, `thm-agent-sudo-incident-search.png`
- [ ] Verify: `ls assets/img/agent-sudo` shows all 4.

### Task 2: Agent Sudo writeup

**Files:** Create `_posts/2026-09-11-agent-sudo-tryhackme.md`

- [ ] Frontmatter: title `Agent Sudo - TryHackMe CTF Writeup`, date `2026-09-11`, difficulty `easy`, room `agentsudo`, tags `[tryhackme, ctf, agent-sudo, stego, privesc]`, description mentioning user-agent trick, stego chain, CVE-2019-14287.
- [ ] Sections (h2): Recon (3 ports, anonymous FTP refused), The user-agent door (cryptic note, UA `C`, agent chris), Hydra vs FTP (password redacted), The stego trail (binwalk miss, 7z finds appended zip, dd carve, john, base64 note redacted, steghide on cute-alien.jpg), James and the incident (ssh, user flag redacted, Roswell alien autopsy), Root via CVE-2019-14287 (`(ALL, !root)` blacklist, `sudo -u#-1`, root flag redacted, DesKel credit), What I Learned.
- [ ] `<machine-ip>` placeholder convention. 4 images. Established bold sign-off line.
- [ ] Verify: grep `_site` for every redaction item = zero hits.

### Task 3: c4ptur3-th3-fl4g writeup

**Files:** Create `_posts/2026-09-11-c4ptur3-th3-fl4g-tryhackme.md`

- [ ] Frontmatter: title `c4ptur3-th3-fl4g - TryHackMe CTF Writeup`, date `2026-09-11`, difficulty `easy`, room `c4ptur3-th3-fl4g`, tags `[tryhackme, ctf, c4ptur3-th3-fl4g, encoding, stego]`, description mentioning encodings, spectrograms, steg.
- [ ] Text-only. Sections (h2): Encoding or encryption (identification habits: length, alphabet, `=` padding, leet-speak), Task 1 highlights (representative inputs shown, every answer `(redacted)`, the 5-layer onion story), Spectrograms (Audacity), Steganography (StegSeek empty passphrase), Security through obscurity (7z RAR polyglot, strings at IEND), What I Learned.
- [ ] Room link `https://tryhackme.com/room/c4ptur3theflag`. Established sign-off.
- [ ] Verify: grep answers = zero hits.

### Task 4: difficulty + room frontmatter on all posts

**Files:** Modify all `_posts/*.md`

- [ ] Add `difficulty:` (very easy | easy | medium) and `room:` (THM slug, blank for HTB/blog) to every post. From vault notes: picklerick easy, flag-command very easy, mrrobot medium, rootme easy, the three 09-11 rooms easy, agentsudo easy, c4ptur3 easy.
- [ ] Verify: frontmatter parses (jekyll build green).

### Task 5: index.html + post layout

**Files:** Modify `index.html`, `_layouts/post.html`

- [ ] site-data JSON gains `"difficulty"` and `"room"`.
- [ ] ls-meta gains difficulty chip (`.ls-diff.diff-*`), colored per level.
- [ ] Hero gains a one-line `uptime`-style stats strip (rooms pwned :: platforms :: room links) from Liquid.
- [ ] post.html meta row gains platform :: difficulty :: room link chips.

### Task 6: main.js

**Files:** Modify `assets/js/main.js`

- [ ] Achievements store: `zew0z.achieve(id)`, `zew0z.getAch()`, localStorage `zew0z-ach`, toast `[ ach ] unlocked: <label>`, completionist bonus.
- [ ] konami unlocks `konami` achievement (works on every page).
- [ ] Tab-blur title easter egg (`psst: the flag is still hidden.`), restored on focus.
- [ ] Boot lines extended (humor: paranoia.service, humility FAIL line), still skippable + reduced-motion-off.

### Task 7: terminal.js

**Files:** Modify `assets/js/terminal.js`

- [ ] `wiki [n|name]`: room roster from POSTS (platform, difficulty, date, room link); `wiki <name>` opens the writeup. `rooms` alias.
- [ ] `nmap`: animated self-scan of zew0z.github.io with fake ports (21 writeups, 22 guest shell, 80 gruvbox, 1337 filtered flag service). Reduced motion or pipes → instant. Unlocks `netrunner`.
- [ ] `ps`, `free`, `ls` unchanged; add `cowsay`, `fortune`, `man`, `ping`, `traceroute`, `hack`, `sl`, `ascii`, `achievements`, `tail -f flag.log`, `sandwich` (sudo variant), `sudo -u#-1` CVE easter egg, `chmod` joke.
- [ ] grantRoot prints ASCII trophy + unlocks `root`. Actions wire into achievements (ls -a → explorer, grep → researcher, open → archivist, wiki → cartographer).
- [ ] help updated with the new visible commands; hidden ones stay hidden.
- [ ] Verify: `node --check` passes.

### Task 8: CSS

**Files:** Modify `assets/css/style.scss`

- [ ] `.hero-stats`, `.ls-diff` + level colors, `.post-meta` room link chip, phosphor glow on `.ascii-banner`, achievements table styling inside term, `@media (max-width: 720px)` collapses.

### Task 9: Verification

- [ ] `bundle exec jekyll build` green.
- [ ] `node --check` on both JS files.
- [ ] Grep built `_site` for the full redaction list: zero hits.
- [ ] Render home + a post + 404 to PNG; judge agent visual gate; fix verdicts.

### Task 10: Commit

- [ ] Commit on `main`. Do NOT push (user pushes separately).
