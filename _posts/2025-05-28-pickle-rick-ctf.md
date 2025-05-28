---
title: "Pickle Rick - TryHackMe CTF Writeup 2025"
date: 2025-05-28
description: "My first completed TryHackMe CTF - exploring web login, command injection, and privilege escalation."
tags: [tryhackme, ctf, cybersecurity, pickle-rick]
---

# 🧠 My First TryHackMe CTF: Pickle Rick

Alright, this was my first actual CTF room on TryHackMe that I fully completed, and honestly? It was pretty fun. This post is more like a **casual recap** of what I did, what worked, and what I learned. 
Note: I obviously did not show the whole process. But i tried many things and failed. This is the normal CTF experience don't think that everything will go as smoothly as you see in a writeup.

---

## 🔌 Connecting to the VPN

Basic setup. Used OpenVPN to connect to the THM network — nothing exciting here, just making sure everything's ready before scanning the target.

---

## 🔎 [Nmap](https://nmap.org/docs.html) Scan: The Usual Start

I ran a full port scan, and an aggressive scan too. Saved it to `nmap.txt` so I wouldn’t forget what I found. SSH was running on port 22, and HTTP was open on port 80 — classic setup.  
![](/assets/img/pickle-rick/nmap.png)

---

## 🕸️ Exploring the Website

Opening the website, it was just a plain HTML page. Didn’t look like much, but I’ve learned to **always check the source code**, and  found a **hidden comment** that gave me a username:  
**`R1ckRul3s`**

No useful links or forms at this point, so I moved on to try some basic enumeration.

---

## 🤖 robots.txt Shenanigans

Before running anything fancy, I checked `robots.txt`. Surprisingly, there was a **weird phrase** in there:  
`Wubbalubbadubdub`

It looked important, maybe a password or a keyphrase. I saved it just in case.

---

## 🪓 Directory Brute-Forcing with [FFUF](https://github.com/ffuf/ffuf)

I used a small wordlist (from dirb) and looked for pages with `.php`, `.html`, and `.txt` extensions. Nothing too aggressive, but enough to catch anything obvious.

Eventually found a **login page**. Nice.
![](/assets/img/pickle-rick/ffuf-dir.png)
---

## 🔐 Login Time

Tried the username from earlier (`R1ckRul3s`) and the phrase from `robots.txt` as the password. And it worked!  

After logging in, I landed on an admin page with a **command execution box**.  
![](/assets/img/pickle-rick/command-page.png)
---

## 🖥️ [Command Injection](https://owasp.org/www-community/attacks/Command_Injection) Playground

I tried some basic Linux commands like `ls`, and yep — it worked. I saw the file for the first flag... but when I tried to read it with `cat`, it was blocked by some kind of filter.  
![](/assets/img/pickle-rick/filter.png)
I messed around a bit and finally got around it using a **quote-based injection** (like `''; cat file`), and that worked. First flag: done ✅  
![](/assets/img/pickle-rick/bypass.png)
---

## 🧪 Source Code Weirdness

Later, I spotted a weird string in the source code. It looked like Base64 (ended with `==`), but it didn’t decode cleanly. There was even a `1` in it, which kinda threw me off. Probably a red herring? Either way, I noted it down and moved on.  
![](/assets/img/pickle-rick/binary.png)
---

## 🧬 “Potions” Page and More Clues

There was a Potions tab in the interface, but it was kinda locked.  
![](/assets/img/not-allowed.png)

Eventually found out there were two users on the system, including Rick and Ubuntu.  
![](/assets/img/users.png)

Inside Ricks home folder, I spotted the **second ingredients file**. Couldn’t read it at first, so I ran `sudo -l` just in case…  
![](/assets/img/sudo.png)

---

## 🔓 Root Access?!?

Surprisingly, the user had **full sudo rights** with no password required. So I just ran `sudo cat` and read the second ingredient file. Easy win.  
![](/assets/img/pickle-rick/sudo-cat.png)
From there, I decided to check out some of the other user's files too — especially `.bash_history` — and guess what? That’s where the **third and final flag** was hiding.  
![](/assets/img/pickle-rick/history.png)
---

## 🎉 Conclusion

I gotta say, I had a lot of fun with this room. It’s not super hard once you get into the flow, but it teaches you a lot of **CTF basics**:

- Always check `robots.txt` and HTML source
- Don’t be afraid to try command injection tricks
- `sudo -l` is your best friend
- `.bash_history` is gold

It felt really satisfying to piece everything together and slowly escalate from a simple web login to full root access. Highly recommend this one if you’re starting out on TryHackMe.

---

💬 **If you're trying this room too and get stuck, feel free to DM me or just throw commands at the wall like I did — eventually something sticks.** 🧠🔥  
[![Buy Me a Coffee](https://ko-fi.com/img/githubbutton_sm.svg)](https://ko-fi.com/zew0z)
