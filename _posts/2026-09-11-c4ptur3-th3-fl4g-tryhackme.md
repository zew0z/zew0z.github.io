---
layout: post
title: "c4ptur3-th3-fl4g - TryHackMe CTF Writeup"
date: 2026-09-11
difficulty: easy
room: c4ptur3th3fl4g
description: "No box, just puzzles - leetspeak, binary, base32, ROT13/ROT47, morse, a five-layer encoding onion, spectrograms, and two stego files."
tags: [tryhackme, ctf, c4ptur3-th3-fl4g, encoding, stego]
author: zew0z
---

# c4ptur3-th3-fl4g - TryHackMe CTF

No machine to hack this time - a whole room of "translate this" puzzles instead: a gauntlet of encodings, an audio file hiding a message in its frequencies, and two images that are more than they claim to be. Sounds like a warm-up. Is a warm-up. Still taught me more practical pattern recognition than anything I've done recently.
Note: like always, I'm leaving the answers out of this writeup so I don't spoil the room - the encoded inputs are the room's public puzzle text, the decoded strings are the answers, so those stay redacted.
[Link for the CTF](https://tryhackme.com/room/c4ptur3th3fl4g)

---

## Encoding or encryption

First mental cleanup, because I needed it: **encryption needs a key, encoding doesn't.** Everything in this room's first task is encoding - reversible by anyone who recognizes the format. Which makes the whole skill **identification**: look at the ciphertext's alphabet and shape, name the encoding, then pick the decoder.

The recognition habits that solved almost every question:

- **Leetspeak substitution** (`c4n y0u c4p7u23...`): letters swapped for lookalike digits. Your brain is the decoder.
- **Binary**: only `0` and `1`, grouped in chunks of 8. Eight bits = one ASCII character, done.
- **Base32 vs base64**: both look like random uppercase/alphanumeric soup. The tell is the padding - base32 pads with a whole row of `=` (I count six or more on a short string), base64 tops out at two. I pasted a six-`=`-ended string into a base64 decoder first and got garbage; that's how I learned base32 exists as a separate thing.
- **Hex**: pairs of `0-9a-f`. Two hex digits = one byte. My first instinct was "that's ASCII" - wrong, ASCII is what it *decodes to*. Then I tried URL-encoding (adding `%` in front of everything) and it accidentally half-worked, which is how I discovered URL encoding *is* hex with percent signs. `68 65 78 61...` is hex, and the space byte `20` giving it away as gaps is a nice touch.
- **ROT13**: normal-looking text where every word is subtly *wrong* ("Ebgngr zr 13 cynprf!"). Letters rotated 13 places, self-inverse, no key needed. Caesar's diary cipher.
- **ROT47**: ROT13's unhinged sibling - it rotates across the full printable ASCII range, so you get punctuation-heavy glitch soup like `*@F DA:? >6 C:89E`. When a string has `:!` and `Wcf` in it and claims to be English, think 47.
- **Morse**: dots and dashes. If you see `- . - .` you already know.
- **Decimal ASCII**: space-separated numbers, all under 128, with `32` sprinkled between clusters - 32 is the space character, which splits the sentence for you before you decode anything.

## The five-layer onion

The last challenge of task 1 deserves its own paragraph. It's one enormous base64 blob - and each layer of decoding reveals a different encoding underneath:

1. base64 decode → you're staring at **morse code**
2. morse decode → a wall of **binary**
3. binary decode → ROT47 glitch soup
4. ROT47 decode → space-separated **decimal ASCII**
5. decimal decode → actual English. (Redacted, like all the answers. The room's final gag is that the plaintext literally taunts you for how many layers it took.)

The real lesson of the room is this loop: **decode once, look at what fell out, identify it, repeat.** No single tool does all five layers; the skill is the identifying step between each decode.

## Spectrograms

Task 2 hands over an audio file and a definition of spectrograms. When a sound hides a message visually, you don't listen to it - you *look* at it. Open the file in Audacity, switch the track view to spectrogram, and the hidden text is drawn right there in the frequency domain.

That's genuinely all it takes. My entire note for this task reads: "Dont ask me how i read it but i did." The message is redacted, but if you ever see an audio file in a CTF, spectrogram view is a 30-second check that pays for itself.

## Steganography

Task 3 is a JPEG with something inside. My enumeration checklist before touching any cracker, in order:

```text
zero ❯ file stegosteg_1559008553457.jpg   # confirm it's really a JPEG
zero ❯ exiftool stegosteg_1559008553457.jpg  # metadata clean
zero ❯ binwalk stegosteg_1559008553457.jpg   # no trailing archive
```

All quiet, which points at classic **steghide**-style embedding - and for that you bring stegseek, which is steghide's dictionary attack rebuilt to go stupidly fast:

```text
zero ❯ stegseek stegosteg_1559008553457.jpg
StegSeek 0.6 - https://github.com/RickdeJager/StegSeek

[i] Found passphrase: ""
[i] Original filename: "steganopayload2248.txt".
[i] Extracting to "stegosteg_1559008553457.jpg.out".
```

The passphrase is **empty** - `""`. First lesson of stego cracking: try no password at all before rockyou. Steghide happily embeds with a blank passphrase, and plenty of CTF authors (and, worryingly, real-world malware packers) leave it that way. The extracted payload holds the answer, redacted.

## Security through obscurity

The last task is a meme image that weighs more than its jokes. `7z l` says why:

```text
zero ❯ 7z l meme_1559010886025.jpg
Type = Rar5
Offset = 74407
Files: [redacted]
```

Another polyglot: a valid JPEG with a **RAR archive appended** after byte 74407 - same trick as Agent Sudo's PNG-with-a-zip, different archive format. (I did these rooms back to back and got to feel smart the second time, which is the entire point of doing many easy rooms.)

Extract, then run `strings` on the file inside:

```text
zero ❯ 7z x meme_1559010886025.jpg
zero ❯ strings <extracted-file> | tail -3
IEND
[redacted]
```

My notes for this task are, verbatim: "FINALLY STRINGS WORKED." The PNG chunk layout ends at `IEND` - anything `strings` prints *after* it is data glued onto the file after the image "ends." Viewers don't render it, `file` doesn't mention it, but strings reads the whole byte stream and snitches.

## What I Learned

- **Identify before you decode**: alphabet + shape + padding names the encoding 90% of the time; six `=` means base32, glitch punctuation means ROT47, lonely `32`s in decimal mean spaces
- **The decode-look-repeat loop** is the actual skill for layered encodings - no tool chain replaces the "what fell out?" step
- **Audio stego = spectrogram view.** Audacity does it, it takes 30 seconds, and the message is literally drawn
- **Stegseek first, empty passphrase before wordlists** - steghide with no password is embarrassingly common
- **Polyglots and trailing data are the same trick in different coats**: `7z l` lists the archive layer, `strings` after `IEND` exposes appended contraband. Easy rooms repeat; that's how the habits stick

---

**If you're trying this room too and get stuck, feel free to DM me or just throw commands at the wall like I did - eventually something sticks.**
