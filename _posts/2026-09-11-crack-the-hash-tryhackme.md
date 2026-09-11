---
layout: post
title: "Crack the Hash - TryHackMe CTF Writeup"
date: 2026-09-11
description: "No box, just hashes - identifying hash types by length and format, fighting bcrypt, and cracking with CrackStation, hashcat, and John."
tags: [tryhackme, ctf, crack-the-hash, hashing, hashcat]
author: zew0z
---

# Crack the Hash - TryHackMe CTF

No machine to hack this time - just nine hashes staring at you, daring you to name what they hide. This room is pure fundamentals: identify the hash, pick the right tool, crack it. And it gave me my first real fight with **bcrypt**.
Note: like always, I'm leaving the actual answers out of this writeup so I don't spoil the room for anyone. The hashes themselves are the room's public puzzle inputs, so those stay - identifying them is the whole skill.
[Link for the CTF](https://tryhackme.com/room/crackthehash)

---

## How To Identify a Hash

Before cracking anything, you need to know what you're holding. Two habits solved most of this room:

**1. Count the characters (length = hash type).** A hex string's length tells you the digest size, and each character of hex carries 4 bits:

- 32 hex chars = 128 bits = **MD5** (or MD4, or NTLM - see below)
- 40 hex chars = 160 bits = **SHA-1**
- 64 hex chars = 256 bits = **SHA-256**

So `48bb6e862e54f2a795ffc4e541caed4d` is 32 chars, and I confirmed with `wc -c` (33 bytes = 32 chars + newline). Almost certainly MD5.

**2. Look at the format (modular crypt format).** Strings with `$` separators aren't plain digests at all - they're salted, algorithm-tagged hashes:

- `$2y$12$...` - **bcrypt** (the `12` is the cost factor)
- `$6$salt$...` - **sha512crypt**, the classic Linux `/etc/shadow` format
- a bare `hash:salt` pair with 40 hex chars - usually **HMAC-SHA1** with the salt as the key

For the bare hex ones, [CrackStation](https://crackstation.net/) does instant lookup against huge wordlists and conveniently tells you which algorithm it matched. For anything salted or format-tagged, it's hashcat or John the Ripper against a wordlist, with the right mode number from the [hashcat example hashes page](https://hashcat.net/wiki/doku.php?id=example_hashes).

## Level 1

Five hashes. The first three are the length-identification drill: a 32-char MD5, a 40-char SHA-1, and a 64-char SHA-256, all cracked instantly on CrackStation. Answers redacted, technique is the content.

The fourth one is where the room punches: `$2y$12$Dwt1BZj6pcyc3Dy1FWZ5ieeUznr71EeNkJkUlypTsgbX1H68wsRom`.

Bcrypt. My first attempt failed *before any cracking did*:

```text
zero ❯ john --format=bcrypt hash1.txt --wordlist /usr/share/dict/rockyou.txt
No password hashes loaded (see FAQ)
```

"No password hashes loaded" turned out to be a shell quoting problem - the `$` characters in the hash were being expanded as variables. Single quotes fixed that:

```text
zero ❯ echo '$2y$12$Dwt1BZj6pcyc3Dy1FWZ5ieeUznr71EeNkJkUlypTsgbX1H68wsRom' > hash1.txt
```

Then the real fight. I tried a hashcat mask attack for 4 lowercase letters:

```text
zero ❯ hashcat -m 3200 -a 3 hash1.txt ?l?l?l?l
Speed.#01........:       20 H/s
Time.Estimated...: (almost 6 hours)
```

**20 hashes per second.** That is not a typo. Bcrypt is deliberately *memory-hard* - it's designed so GPUs get almost nothing from their parallelism because every candidate needs cache-heavy Blowfish work my GTX 1050 Ti just grinds through. Six hours for a 4-letter password.

So I stopped attacking the math and attacked the *search space* instead. The hint says the answer is 4 characters, so filter rockyou down to 4-character words:

```text
zero ❯ awk 'length($0) == 4' /usr/share/dict/rockyou.txt > 4words.txt
# 18,152 candidates instead of 14 million
zero ❯ sed -i 's/\$2y\$/\$2a\$/' hash1.txt
# john's bcrypt parser wants $2a$
zero ❯ john --format=bcrypt --wordlist=4words.txt hash1.txt
Loaded 1 password hash (bcrypt [Blowfish 32/64 X3])
(redacted)       (?)
1g 0:00:00:08 DONE
```

Eight seconds on CPU once the wordlist was 18k words instead of a 6-hour mask attack. The lesson is bigger than bcrypt: **when cracking is slow, shrink the problem with what you know** (length, charset, context) before throwing hardware at it. John's CPU implementation with multiple cores beat my GPU on this one purely because the wordlist was small.

The fifth hash is a fun gotcha: 32 hex chars, so "obviously MD5" - but CrackStation identifies it as **MD4**. Same length family, different algorithm. Length narrows the field; tools confirm.

## Level 2

Level 2 leans on hashcat modes. All answers still in rockyou, but the formats get meaner.

**Hash 1:** 64 hex chars, SHA-256, CrackStation makes short work of it.

**Hash 2:** 32 hex chars, but this one's a Windows **NTLM** hash - same length as MD5, totally different context. Mode 1000 in hashcat terms, or CrackStation if you're lucky. Cracked.

**Hash 3:** `$6$aReallyHardSalt$...` with the salt given - **sha512crypt**, the Linux shadow format. Look up the mode on the hashcat wiki (1800), feed it the hash and rockyou:

```text
zero ❯ hashcat -m 1800 hash2.txt /usr/share/dict/rockyou.txt
Status...........: Cracked
Hash.Mode........: 1800 (sha512crypt $6$, SHA512 (Unix))
Speed.#01........:     4808 H/s (11.34ms)
Recovered........: 1/1 (100.00%) Digests
```

Around 4800 H/s and it cracked partway through rockyou in under ten minutes. sha512crypt is slow *on purpose*, but a common password doesn't survive a full wordlist anyway.

**Hash 4:** 40 hex chars with a salt, `tryhackme` - the hint says HMAC-SHA1, which in hashcat is **mode 160 (HMAC-SHA1, key = $salt)**. The file format is `hash:salt`:

```text
zero ❯ echo 'e5d8870e5bdd26602cab8dbe07a942c8669e56d6:tryhackme' > hash3.txt
zero ❯ hashcat -m 160 hash3.txt /usr/share/dict/rockyou.txt
Status...........: Cracked
Hash.Mode........: 160 (HMAC-SHA1 (key = $salt))
Speed.#01........: 12934.8 kH/s (8.92ms)
Recovered........: 1/1 (100.00%) Digests
```

Twelve *million* guesses per second, cracked in about a second. That contrast with bcrypt's 20 H/s is the whole room in two numbers: fast unsalted digests fall instantly, modern memory-hard hashes make even GPUs sweat.

## What I Learned

- **Length first, format second**: hex length identifies the digest size, `$`-prefixed modular formats identify the algorithm
- Same length can mean different algorithms (MD5 vs MD4 vs NTLM) - automated lookup or the hint context settles it
- "No password hashes loaded" is a *you* problem, not a john problem: shell-quote your `$`-containing hashes
- Bcrypt at 20 H/s is doing its job - **shrink the search space** (filter the wordlist by known length) instead of buying more GPU hours
- `$2y$` vs `$2a$`: same algorithm, different version tags, but john only loads one of them without a swap
- Hashcat modes are a lookup, not a memory test: `-m 1800` sha512crypt, `-m 160` HMAC-SHA1, and the example hashes wiki page has everything else

---

**If you're trying this room too and get stuck, feel free to DM me or just throw commands at the wall like I did - eventually something sticks.**
