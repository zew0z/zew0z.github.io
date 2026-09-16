/* zew0z.github.io - guest shell v2
   a fake but honest terminal: real writeups, fake power */

(function () {
  'use strict';

  var term = document.getElementById('guest-term');
  if (!term) return;

  var out = document.getElementById('term-out');
  var form = document.getElementById('term-form');
  var input = document.getElementById('term-input');
  if (!out || !form || !input) return;

  /* post data injected by Liquid on the home page */
  var POSTS = [];
  var dataEl = document.getElementById('site-data');
  if (dataEl) {
    try { POSTS = JSON.parse(dataEl.textContent).posts || []; } catch (e) { POSTS = []; }
  }

  var BANNER =
    '███████╗███████╗██╗    ██╗ ██████╗ ███████╗\n' +
    '╚══███╔╝██╔════╝██║    ██║██╔═████╗╚══███╔╝\n' +
    '  ███╔╝ █████╗  ██║ █╗ ██║██║██╔██║  ███╔╝\n' +
    ' ███╔╝  ██╔══╝  ██║███╗██║████╔╝██║ ███╔╝\n' +
    '███████╗███████╗╚███╔███╔╝╚██████╔╝███████╗\n' +
    '╚══════╝╚══════╝ ╚══╝╚══╝  ╚═════╝ ╚══════╝';

  var TROPHY =
    '      ___________\n' +
    "     '._==_==_=_.'\n" +
    '     .-\\:      /-.\n' +
    '    | (|:.     |) |\n' +
    "     '-|:.     |-'\n" +
    '       \\::.    /\n' +
    "        '::. .'\n" +
    '          ) (\n' +
    "        _.' '._\n" +
    "       '-------'";

  var PROMPT = 'guest@zew0z.github.io:~$';

  /* the flag ladder. view-source counts as a solve.
     flag 1: .flag.enc -> base64 -> submit        (root of the blog)
     flag 2: cat shell.js -> hex blob -> decode   (achievement: sourcer)
     flag 3: nmap -p- -> nc localhost 31337 -> rot13 (achievement: knocker) */
  var FLAG_B64 = 'ZmxhZ3thbHdheXNfY2hlY2tfdGhlX3NvdXJjZV9jb2RlfQ==';
  var FLAG_ROOT = 'flag{always_check_the_source_code}';
  var FLAG2_HEX = '66 6c 61 67 7b 74 68 65 5f 73 6f 75 72 63 65 5f 69 73 5f 77 6f 72 74 68 5f 72 65 61 64 69 6e 67 7d';
  var FLAG2 = 'flag{the_source_is_worth_reading}';
  var FLAG3_ROT13 = 'synt{xabpx_xabpx_31337}';
  var FLAG3 = 'flag{knock_knock_31337}';

  function rot13(s) {
    return s.replace(/[a-z]/gi, function (c) {
      var base = c <= 'Z' ? 65 : 97;
      return String.fromCharCode((c.charCodeAt(0) - base + 13) % 26 + base);
    });
  }

  function hexToString(hex) {
    var clean = hex.replace(/\s+/g, '');
    if (!/^[0-9a-fA-F]+$/.test(clean) || clean.length % 2 !== 0) return null;
    var out = '';
    for (var i = 0; i < clean.length; i += 2) out += String.fromCharCode(parseInt(clean.substr(i, 2), 16));
    return out;
  }

  var isRoot = false;
  try { isRoot = localStorage.getItem('zew0z-root') === '1'; } catch (e) {}

  var myName = '';
  try { myName = localStorage.getItem('zew0z-name') || ''; } catch (e) {}

  function achieve(id) {
    if (window.zew0z && window.zew0z.achieve) window.zew0z.achieve(id);
  }

  var promptLabel = document.querySelector('.term-prompt');
  var promptText = PROMPT;

  function applyPrompt() {
    if (isRoot) {
      promptText = 'root@zew0z.github.io:~#';
      if (promptLabel) {
        promptLabel.textContent = promptText;
        promptLabel.classList.add('root-prompt');
      }
    }
  }
  applyPrompt();

  var history = [];
  var histIdx = 0;

  /* ---------- output helpers ---------- */

  function row(segments, cls) {
    var div = document.createElement('div');
    div.className = 'term-row' + (cls ? ' ' + cls : '');
    if (typeof segments === 'string') {
      div.textContent = segments;
    } else {
      segments.forEach(function (s) {
        var node;
        if (s.href) {
          node = document.createElement('a');
          node.href = s.href;
          if (s.external) { node.target = '_blank'; node.rel = 'noopener'; }
        } else {
          node = document.createElement('span');
        }
        node.textContent = s.t;
        if (s.c) node.className = s.c;
        div.appendChild(node);
      });
    }
    out.appendChild(div);
    out.scrollTop = out.scrollHeight;
  }

  function lines(text, cls) {
    text.split('\n').forEach(function (l) { row(l, cls); });
  }

  /* a row that can be rewritten in place (progress bars, spinners) */
  function dynamicRow(cls) {
    var div = document.createElement('div');
    div.className = 'term-row' + (cls ? ' ' + cls : '');
    out.appendChild(div);
    out.scrollTop = out.scrollHeight;
    return {
      set: function (text, c) {
        div.textContent = text;
        if (c) div.className = 'term-row ' + c;
        out.scrollTop = out.scrollHeight;
      }
    };
  }

  /* print a list of rows with a delay between them (animated command output).
     rows: string | [string, class] | function returning either.
     collapses to instant under prefers-reduced-motion */
  function sequence(rows, delay) {
    var instant = !window.zew0z || window.zew0z.reduceMotion;
    var i = 0;
    function emit(r) {
      if (typeof r === 'function') r = r();
      if (Array.isArray(r)) row(r[0], r[1]);
      else row(r);
    }
    if (instant) { rows.forEach(emit); return; }
    (function step() {
      if (i >= rows.length) return;
      emit(rows[i]);
      i += 1;
      setTimeout(step, delay);
    })();
  }

  function pad(str, n) {
    str = String(str);
    return str.length >= n ? str : str + new Array(n - str.length + 1).join(' ');
  }

  function diffClass(d) {
    if (d === 'easy') return 't-green';
    if (d === 'medium') return 't-yellow';
    if (d === 'hard') return 't-red';
    if (d === 'very easy') return 't-aqua';
    return 't-gray';
  }

  function platformName(p) {
    if (p === 'thm') return 'tryhackme';
    if (p === 'htb') return 'hackthebox';
    return 'blog';
  }

  /* ---------- data ---------- */

  var FILES = {
    'about_me.txt': [
      'student. curious. breaking boxes so i understand how they are built.',
      'documenting every step in ~/writeups: the wins, the fails, the flags.',
      'currently into web exploitation and privesc.'
    ].join('\n'),
    'contact.txt': [
      'discord : @zew0z',
      'ko-fi   : https://ko-fi.com/zew0z',
      'rss     : /feed.xml'
    ].join('\n'),
    'motd': [
      'tip of the session: always check the source code.',
      '(a writeup exists because someone forgot that once.)'
    ].join('\n'),
    '.zsh_history': [
      'neofetch',
      'sudo !!',
      'rm -rf /tmp/regret',
      'curl blog | zsh  # never again',
      'exit  # for real this time'
    ].join('\n')
  };

  var FORTUNES = [
    'the flag was in the source code all along. it usually is.',
    'sudo -l first. heroics later.',
    'enumeration is 90 percent of the job. the other 90 percent is enumeration.',
    'rockyou is not a wordlist, it is a lifestyle.',
    'rm -rf is not a backup strategy.',
    'if it is base64 the decoder is free. if it is bcrypt, bring snacks.',
    '7z l sees what binwalk shrugs at. polyglots fear archive listings.',
    'every easy room teaches one reflex. play enough rooms, become a reflex machine.',
    'a filtered port is the internet saying "not yet".',
    'back up your notes. then back up the backup of your notes.',
    'the machine is always easier than the writeup makes it look. after the writeup.',
    'ctrl+c is a lifestyle choice.'
  ];

  var ASCII_ART = {
    skull:
      '   .-"""-.\n' +
      '  / _   _ \\\n' +
      ' |  o . o  |\n' +
      ' |    ^    |\n' +
      "  \\  '-'  /\n" +
      "   '-----'",
    alien:
      '      ___\n' +
      '     /   \\\n' +
      '    | o o |\n' +
      '    |  -  |\n' +
      '     \\___/\n' +
      '    /|   |\\\n' +
      '   / |   | \\\n' +
      '  *  -----  *',
    trophy: TROPHY,
    flag:
      '   _____\n' +
      '  |  ~  |\n' +
      '  |~~~~|\n' +
      '  |  ~  |\n' +
      '  |____|\n' +
      '     |\n' +
      '     |',
    ghost:
      '   .-.\n' +
      '  (o o)\n' +
      '  | O |\n' +
      '  |   |\n' +
      "  '~~~'",
    laptop:
      '   _________\n' +
      '  | _______ |\n' +
      '  ||  z@   ||\n' +
      '  ||_______||\n' +
      '  |_________|\n' +
      '  /_________\\'
  };

  var MANPAGES = {
    nmap: ['nmap - scan this blog for open ports',
      'the scanner is fake. the curiosity behind it is not.\nports found: some. secrets found: check the filtered one. or do not.'],
    wiki: ['wiki - the room roster',
      'every room pwned so far, with difficulty and platform.\nwiki <name> opens the writeup. knowing your rooms is half the game.'],
    grep: ['grep - search the writeups',
      'searches titles, slugs and tags. does not search the flags.\nthe flags are never in the writeups. that is the whole point.'],
    cat: ['cat - read a file',
      'prints a file to the terminal. some files print more than\nthey should. those are the fun ones.'],
    flag: ['flag - status of the one real flag',
      'one real flag hides in this very shell. hidden files stay\nhidden from plain sight. this is a hint wearing a manpage.'],
    cowsay: ['cowsay - a cow says your text',
      'the cow knows things. ask the cow. the cow does not\nknow the flag. probably.'],
    sudo: ['sudo - execute as root (not really)',
      'guests are not in the sudoers file. this incident will\nbe reported. try it anyway. everyone does.'],
    man: ['man - an interface to the reference manuals',
      'you just used the tool to read about the tool.\nrecursion achieved.']
  };

  function postSlug(post) {
    var parts = post.url.split('/').filter(Boolean);
    return parts.pop().replace(/\.html$/, '');
  }

  function findPost(q) {
    var n = parseInt(q, 10);
    if (!isNaN(n) && String(n) === q) return POSTS[n - 1] || null;
    q = q.toLowerCase();
    return POSTS.find(function (p) {
      return postSlug(p).indexOf(q) !== -1 || p.title.toLowerCase().indexOf(q) !== -1;
    }) || null;
  }

  function listWriteups() {
    if (!POSTS.length) { row('no writeups yet. check back soon.', 't-gray'); return; }
    POSTS.forEach(function (p, i) {
      row([
        { t: '[' + (i + 1) + '] ', c: 't-gray' },
        { t: p.date + '  ', c: 't-fg4' },
        { t: postSlug(p), c: 't-fg0' },
        { t: '  (' + p.platform + ')', c: 't-aqua' }
      ]);
    });
    row("open one with: open <number> or open <name>", 't-gray');
  }

  function listWiki() {
    row('== wiki :: room roster (' + POSTS.length + ') ==', 't-green');
    POSTS.forEach(function (p, i) {
      var diff = p.difficulty || '-';
      row([
        { t: '[' + pad(String(i + 1), 2) + '] ', c: 't-gray' },
        { t: p.date + '  ', c: 't-fg4' },
        { t: pad(postSlug(p), 27), c: 't-fg0' },
        { t: pad(diff, 10), c: diffClass(diff) },
        { t: platformName(p.platform), c: 't-aqua' }
      ]);
    });
    row('difficulty in the second column. platforms on the right.', 't-gray');
    row('open one: wiki <number> or wiki <name>', 't-gray');
  }

  var RANDOM_POOL = '01TFx#$%&@!~^*akPZ';

  /* ---------- command registry ---------- */

  var hintLevel = 0;

  function grantRoot() {
    isRoot = true;
    try { localStorage.setItem('zew0z-root', '1'); } catch (e) {}
    applyPrompt();
    achieve('root');
    row('[ ok ] flag accepted. permissions elevated: you are root of this blog now.', 't-green');
    lines(TROPHY, 't-yellow');
    row('(this shell will remember you.)', 't-gray');
    if (!myName) row('claim your spot on the flag board: register <name>', 't-yellow');
    if (window.zew0z) {
      if (window.zew0z.setRootChip) window.zew0z.setRootChip();
      window.zew0z.matrixRain();
      window.zew0z.toast('[ ok ] flag captured. root shell unlocked.');
    }
  }

  var COMMANDS = {

    help: function () {
      lines(
        'available commands:\n' +
        '  help              this list\n' +
        '  ls [writeups]     list files or writeups\n' +
        '  cat <file>        read a file (try about_me.txt)\n' +
        '  open <n|name>     open writeup n from ls writeups\n' +
        '  wiki [n|name]     the room roster: difficulty + platform\n' +
        '  grep <pattern>    search the writeups\n' +
        '  nmap [target]     port scan this blog (it has opinions)\n' +
        '  achievements      what you have unlocked so far\n' +
        '  whoami id pwd     the identity crisis trio\n' +
        '  neofetch          guest system info\n' +
        '  history           your command history\n' +
        '  echo <text>       repeat after you\n' +
        '  rot13 <text>      the oldest cipher in the drawer\n' +
        '  nc <host> <port>  knock on a port, see who answers\n' +
        '  leaderboard       flag hunters, hall of fame\n' +
        '  date uname        the usual suspects\n' +
        '  banner            redraw the banner\n' +
        '  clear             wipe the screen\n' +
        '  exit              you can check out any time you like\n' +
        'hint: some commands are not on this list. cows know things. the source knows more.'
      );
    },

    ls: function (args) {
      var joined = args.join(' ');
      if (joined.indexOf('writeup') !== -1) { listWriteups(); return; }
      if (/(^|\s)-[a-z]*a/i.test(joined)) {
        row([
          { t: '.  ..  ', c: 't-fg4' },
          { t: '.flag.enc  .zsh_history  ', c: 't-yellow' },
          { t: 'about_me.txt   contact.txt   flag.txt   motd   shell.js   ', c: 't-fg1' },
          { t: 'writeups/', c: 't-aqua' }
        ]);
        row('that .flag.enc looks suspicious. (cat it)', 't-gray');
        achieve('explorer');
        return;
      }
      row([
        { t: 'about_me.txt   contact.txt   flag.txt   motd   shell.js   ', c: 't-fg1' },
        { t: 'writeups/', c: 't-aqua' }
      ]);
      row("the shell ships with its own source. (cat shell.js)", 't-gray');
    },

    cat: function (args) {
      if (!args.length) { row('cat: missing file operand', 't-red'); return; }
      var name = args[0];
      if (name === 'flag.txt') {
        row('cat: flag.txt: permission denied (root only. plain ls will not save you either.)', 't-red');
      } else if (name === '.flag.enc') {
        row(FLAG_B64, 't-yellow');
        row('this string smells like base64. (decode it)', 't-gray');
      } else if (name === 'shell.js' || name === './shell.js') {
        lines(
          '/* guest shell v2.0 -- the source, as promised */\n' +
          ' 1  var POSTS = [];            // real writeups, live from the blog\n' +
          ' 2  var BANNER = ascii();      // hand-_padding included\n' +
          ' 3  var FLAG_B64  = atob ? "nope" : "try ls -a";\n' +
          ' 4\n' +
          ' 5  // there is more than one flag on this blog.\n' +
          ' 6  // the second one ships inside this very file.\n' +
          ' 7  var LOOT_HEX =\n' +
          ' 8    "' + FLAG2_HEX + '";\n' +
          ' 9  // TODO: rotate before the blog gets famous\n' +
          '10\n' +
          '11  function listen(port) {\n' +
          '12    // only speaks to visitors who scan every port\n' +
          '13    return port === 31337 ? "something" : "refused";\n' +
          '14  }'
        );
        row('line 8 is not base64. decode speaks hex too.', 't-gray');
      } else if (name.indexOf('urandom') !== -1) {
        var junk = '';
        for (var i = 0; i < 96; i++) junk += RANDOM_POOL[Math.floor(Math.random() * RANDOM_POOL.length)];
        row(junk, 't-yellow');
        row('^C', 't-gray');
      } else if (name === 'writeups' || name === 'writeups/') {
        row('cat: writeups: Is a directory (try ls writeups)', 't-red');
      } else if (FILES[name]) {
        lines(FILES[name]);
      } else {
        row('cat: ' + name + ': No such file or directory', 't-red');
      }
    },

    open: function (args) {
      if (!args.length) { row('open: missing operand (try ls writeups)', 't-red'); return; }
      var post = findPost(args.join(' '));
      if (!post) { row("open: no writeup matches '" + args.join(' ') + "' (try ls writeups)", 't-red'); return; }
      achieve('archivist');
      row([{ t: 'opening ', c: 't-gray' }, { t: post.title, c: 't-fg0' }, { t: ' ...', c: 't-gray' }]);
      setTimeout(function () { window.location.href = post.url; }, 300);
    },

    wiki: function (args) {
      achieve('cartographer');
      if (args.length) { COMMANDS.open(args); return; }
      listWiki();
    },

    grep: function (args) {
      if (!args.length) { row('usage: grep <pattern>   (searches the writeups)', 't-gray'); return; }
      var q = args.join(' ').toLowerCase();
      var hits = POSTS.filter(function (p) {
        return p.title.toLowerCase().indexOf(q) !== -1 ||
               postSlug(p).indexOf(q) !== -1 ||
               (p.tags || []).join(' ').toLowerCase().indexOf(q) !== -1;
      });
      if (!hits.length) { row("grep: no matches for '" + q + "'", 't-red'); return; }
      achieve('researcher');
      hits.forEach(function (p) {
        row([
          { t: '[' + (POSTS.indexOf(p) + 1) + '] ', c: 't-gray' },
          { t: postSlug(p), c: 't-fg0' },
          { t: ' :: ' + p.title, c: 't-gray' }
        ]);
      });
      row('open a match with: open <number>', 't-gray');
    },

    writeups: function () { listWriteups(); },

    nmap: function (args) {
      var joined = args.join(' ');
      if (args.length && (args[0] === '--help' || args[0] === '-h')) {
        row('usage: nmap [target] [-p-]. the interesting target is the one you are on.', 't-gray');
        return;
      }
      achieve('netrunner');
      var allPorts = /(^|\s)-p-/.test(joined) || /(^|\s)-p\s*1-65535/.test(joined);
      var target = joined.replace(/(^|\s)-\S+/g, '').replace(/(^|\s)-p\s*\S+/g, '').trim() || 'zew0z.github.io';
      var stamp = new Date().toTimeString().slice(0, 8);
      var rowsOut = [
        'Starting nmap 7.99i ( https://zew0z.github.io ) at ' + stamp,
        'Scanning ' + target + ' (1 host)' + (allPorts ? ' -- all 65535 ports' : ''),
        'PORT       STATE     SERVICE   NOTES',
        ['21/tcp    open      ftp       writeups (anonymous read allowed)', 't-fg1'],
        ['22/tcp    open      ssh       guest shell (root not included)', 't-fg1'],
        ['80/tcp    open      http      gruvbox theme, hardcoded', 't-fg1'],
        ['443/tcp   open      https     same, but with a padlock', 't-fg1'],
        ['1337/tcp  filtered  flag      nice try', 't-yellow']
      ];
      if (allPorts) {
        rowsOut.push(['31337/tcp  open      zecat     ...it is answering.', 't-green']);
        rowsOut.push(['something is listening where the default scan sees nothing. (nc it)', 't-gray']);
        rowsOut.push(['Nmap done: 1 host up. 1 hidden thing found.', 't-gray']);
      } else {
        rowsOut.push(['Nmap done: 1 host up. the filtered port stays filtered.', 't-gray']);
        rowsOut.push(['psst: default scans only show the polite ports. (nmap -p-)', 't-gray']);
      }
      sequence(rowsOut, 260);
    },

    nc: function (args) {
      var joined = args.join(' ');
      var port = (joined.match(/(\d{1,5})\s*$/) || [])[1];
      if (!port) { row('usage: nc <host> <port>   (localhost has opinions)', 't-gray'); return; }
      if (port === '31337') {
        sequence([
          ['connect to zew0z.github.io 31337 ...', 't-gray'],
          ['connection established. this port speaks an old dialect.', 't-fg1'],
          [FLAG3_ROT13, 't-yellow'],
          ['(if it reads like nonsense, you already know the trick: rot13)', 't-gray']
        ], 320);
      } else if (port === '1337') {
        row('nc: connection to 1337 refused. the flag port does not talk to strangers.', 't-red');
      } else {
        row('nc: connection to ' + port + ' refused. nothing home.', 't-red');
      }
    },

    rot13: function (args) {
      if (!args.length) { row('rot13: missing operand (rot13 <text>)', 't-gray'); return; }
      var transformed = rot13(args.join(' '));
      row([{ t: 'rot13: ', c: 't-gray' }, { t: transformed, c: transformed.indexOf('flag{') !== -1 ? 't-green' : 't-fg1' }]);
      if (transformed.indexOf('flag{') !== -1) row('that looks like a flag. you know the drill: submit it.', 't-gray');
    },

    ping: function (args) {
      var target = (args[0] || 'zew0z.github.io').replace(/;.*$/, '');
      var rowsOut = ['PING ' + target + ' 56(84) bytes of data.'];
      for (var i = 1; i <= 4; i++) {
        rowsOut.push((function (n) {
          return function () {
            var t = (0.02 + Math.random() * 0.07).toFixed(3);
            return '64 bytes from ' + target + ': icmp_seq=' + n + ' ttl=64 time=' + t + ' ms';
          };
        })(i));
      }
      rowsOut.push('--- ' + target + ' ping statistics ---');
      rowsOut.push(['4 packets transmitted, 4 received, 0% packet loss', 't-fg1']);
      rowsOut.push(['(loopback. of course. you are already here.)', 't-gray']);
      sequence(rowsOut, 300);
    },

    traceroute: function () {
      sequence([
        'traceroute to zew0z.github.io, 64 byte packets',
        [' 1  your-router.home        1.204 ms', 't-fg1'],
        [' 2  isp.edge.net            8.771 ms', 't-fg1'],
        [' 3  the-cloud               14.882 ms  (it is just someones computer)', 't-fg4'],
        [' 4  github-edge             21.056 ms', 't-fg1'],
        [' 5  zew0z.github.io         23.410 ms', 't-green'],
        ['5 hops, 0 mysteries left. destination reached, guest.', 't-gray']
      ], 280);
    },

    ps: function () {
      lines(
        '  PID TTY      TIME     CMD\n' +
        ' 1337 pts/0    13:37    flag_hunter\n' +
        '  424 pts/0    42:00    coffee_daemon --refill\n' +
        '  909 pts/0    3d14h    imposter_syndrome --loop\n' +
        '  502 pts/0    00:07    vim (trapped)\n' +
        '    1 ?        00:01    systemd (the basics)'
      );
      row('one of these processes is you.', 't-gray');
    },

    free: function () {
      var captured = (isRoot ? 1 : 0) + (window.zew0z && window.zew0z.getAch ?
        (window.zew0z.getAch().sourcer ? 1 : 0) + (window.zew0z.getAch().knocker ? 1 : 0) : 0);
      lines(
        '               total     used     free\n' +
        'flags:         3         ' + captured + '        ' + (3 - captured) + '\n' +
        'coffee:        infinity  infinity     0\n' +
        'excuses:          0        0        0'
      );
      row(captured < 3 ? 'some flags are still free. go take them.' : 'nothing left free. you took everything.', 't-gray');
    },

    cowsay: function (args) {
      achieve('cattle');
      var msg = args.join(' ') || 'moo';
      if (msg.length > 48) msg = msg.slice(0, 45) + '...';
      var edge = new Array(msg.length + 3).join('-');
      lines(
        ' ' + edge + '\n' +
        '< ' + msg + ' >\n' +
        ' ' + edge + '\n' +
        '        \\   ^__^\n' +
        '         \\  (oo)\\_______\n' +
        '            (__)\\       )\\/\\\n' +
        '                ||----w |\n' +
        '                ||     ||'
      );
    },

    fortune: function () {
      row(FORTUNES[Math.floor(Math.random() * FORTUNES.length)], 't-aqua');
    },

    man: function (args) {
      var page = (args[0] || '').toLowerCase();
      if (!page) { row('what manual page do you want? (try: man nmap)', 't-gray'); return; }
      if (page === 'man') {
        lines(
          'MAN(1)                     zew0z manual                     MAN(1)\n\n' +
          'NAME\n     man - an interface to the reference manuals\n\n' +
          'DESCRIPTION\n     you just used the tool to read about the tool.\n     recursion achieved.'
        );
        return;
      }
      if (MANPAGES[page]) {
        var m = MANPAGES[page];
        lines(
          page.toUpperCase() + '(1)                     zew0z manual\n\n' +
          'NAME\n     ' + m[0] + '\n\n' +
          'DESCRIPTION\n     ' + m[1].split('\n').join('\n     ')
        );
        return;
      }
      row('no manual entry for ' + page + '. some things must be learned the hard way.', 't-gray');
    },

    ascii: function (args) {
      var name = (args[0] || '').toLowerCase();
      var names = Object.keys(ASCII_ART);
      if (!name) {
        row('available art: ' + names.join('  '), 't-gray');
        row('usage: ascii <name>', 't-gray');
        return;
      }
      if (ASCII_ART[name]) { lines(ASCII_ART[name], name === 'trophy' && !isRoot ? 't-yellow' : 't-green'); return; }
      row("ascii: no art named '" + name + "'. try: " + names.join(' '), 't-red');
    },

    achievements: function () {
      if (!window.zew0z || !window.zew0z.getAch) { row('achievements: unavailable in this browser.', 't-gray'); return; }
      var store = window.zew0z.getAch();
      var ACHL = window.zew0z.ACH || {};
      var HIDDEN = ['konami', 'sudoer', 'completionist'];
      var ids = Object.keys(ACHL);
      var got = ids.filter(function (k) { return store[k]; }).length;
      row('== achievements :: ' + got + '/' + ids.length + ' ==', 't-green');
      ids.forEach(function (id) {
        var parts = ACHL[id].split(' :: ');
        var unlocked = !!store[id];
        var hidden = HIDDEN.indexOf(id) !== -1 && !unlocked;
        row([
          { t: unlocked ? '[x] ' : '[ ] ', c: unlocked ? 't-green' : 't-gray' },
          { t: pad(hidden ? '???' : parts[0], 24), c: unlocked ? 't-fg0' : 't-gray' },
          { t: hidden ? 'hidden achievement' : parts[1], c: 't-fg4' },
          { t: unlocked ? '  ' + store[id] : '', c: 't-fg4' }
        ]);
      });
      row(got < ids.length ? 'the flag unlocks one of these. start with: cat flag.txt' : 'a full board. the shell salutes you.', 't-gray');
    },

    whoami: function () {
      if (myName) row(myName + (isRoot ? ' (root of this blog)' : ''));
      else row('guest');
    },
    id: function () { row('uid=1337(guest) gid=100(users) groups=100(users),1337(ctf),42(coffee-enjoyers)'); },
    pwd: function () { row('/home/guest'); },

    date: function () { row(new Date().toString()); },
    uname: function () { row('zew0z.github.io 6.9-gru #1 SMP PREEMPT_DYNAMIC x86_64 GNU/Linux'); },

    neofetch: function () {
      var logo = [
        '         /\\        ',
        '        /  \\       ',
        '       /\\   \\      ',
        '      /      \\     ',
        '     /   ,,   \\    ',
        '    /   |  |  -\\   ',
        "   /_-''    ''-_\\  "
      ];
      var info = [
        { t: 'guest', c: 't-green' },
        { t: '@zew0z.github.io', c: 't-fg1' },
        { t: '', c: '' },
        { t: 'OS: zew0z.github.io (gruvbox dark)', c: 't-fg1' },
        { t: 'Host: github pages', c: 't-fg1' },
        { t: 'Kernel: 6.9-ctf', c: 't-fg1' },
        { t: 'Shell: fake zsh (browser edition)', c: 't-fg1' },
        { t: 'Resolution: your viewport', c: 't-fg1' },
        { t: 'Uptime: since you loaded the page', c: 't-fg1' },
        { t: 'Memory: ' + (navigator.deviceMemory || 'enough'), c: 't-fg1' },
        { t: 'Coffee: funded by ko-fi', c: 't-fg1' }
      ];
      if (isRoot) info.push({ t: 'Honor: flag captured' + (myName ? ' as ' + myName : ''), c: 't-orange' });
      var max = Math.max(logo.length, info.length);
      for (var i = 0; i < max; i++) {
        var seg = [];
        if (logo[i]) seg.push({ t: logo[i] + '  ', c: 't-blue' });
        if (info[i] && info[i].t) seg.push(info[i]);
        if (seg.length) row(seg);
      }
    },

    history: function () {
      if (!history.length) { row('history: empty. be the first command.', 't-gray'); return; }
      history.forEach(function (h, i) {
        row([{ t: '  ' + (i + 1) + '  ', c: 't-gray' }, { t: h, c: 't-fg1' }]);
      });
    },

    echo: function (args) { row(args.join(' ') || ''); },

    clear: function () { out.textContent = ''; },

    banner: function () { lines(BANNER, 't-green'); },

    motd: function () { lines(FILES.motd); },

    hack: function () {
      var bar = dynamicRow('t-yellow');
      var stages = [
        'initializing exploit framework v0.4.3 ...',
        'bypassing mainframe ......... ok',
        'deploying hollywood visuals . ok',
        'access granted'
      ];
      function finish() {
        stages.forEach(function (s, idx) { row(s, idx === 3 ? 't-green' : 't-fg1'); });
        row('(just kidding. nothing here was harmed. but it did look cool.)', 't-gray');
      }
      if (!window.zew0z || window.zew0z.reduceMotion) { finish(); return; }
      var pct = 0;
      (function tick() {
        pct = Math.min(100, pct + 10 + Math.floor(Math.random() * 20));
        var blocks = Math.round(pct / 10);
        bar.set('[' + new Array(blocks + 1).join('#') + new Array(11 - blocks).join('-') + '] ' + pct + '%');
        if (pct < 100) setTimeout(tick, 90);
        else setTimeout(finish, 250);
      })();
    },

    sl: function () {
      lines(
        '                 (@@) (  ) (@)  ( )  @@    ()    @     O\n' +
        '            (   )\n' +
        '        (@@@@)\n' +
        '     (    )\n' +
        '   (@@@)\n' +
        ' ====        ________                ___________\n' +
        ' _D _|  |_______/        \\__I_I_____===__|_________|\n' +
        '  |(_)---  |   H\\________/ |   |        =|___ ___|\n' +
        '  /     |  |   H  |  |     |   |         ||_| |_|\n' +
        ' |      |  |   H  |__--------------------| [___] |\n' +
        ' | ________|___H__/__|_____/[][]~\\_______|       |\n' +
        ' |/ |   |-----------I_____I [][] []  D   |=======|__'
      );
      row('you typed sl. you meant ls. everyone does.', 't-gray');
    },

    tail: function (args) {
      var joined = args.join(' ');
      var isFlagLog = /flag/.test(joined);
      var logName = isFlagLog ? '/var/log/flag.log' : '/var/log/guest.log';
      function ts() {
        var d = new Date();
        var p = function (n) { return String(n).padStart(2, '0'); };
        return p(d.getHours()) + ':' + p(d.getMinutes()) + ':' + p(d.getSeconds());
      }
      var entries = isFlagLog ? [
        'guest attached to the flag log. bold move',
        'plain ls executed. nothing found. as designed',
        'base64 attempted on cat.jpg. the cat is not encoded',
        'the flag is still hiding. the source code is still readable'
      ] : [
        'guest session active',
        'nothing suspicious to report. slightly disappointing, honestly',
        'hint: the interesting log is flag.log'
      ];
      var rowsOut = ['== tail -f ' + logName + ' =='];
      entries.forEach(function (e) {
        rowsOut.push(function () { return '[' + ts() + '] ' + e; });
      });
      rowsOut.push(['^C', 't-gray']);
      sequence(rowsOut, 420);
    },

    sudo: function (args) {
      var joined = args.join(' ');
      if (joined.indexOf('-u#-1') !== -1 || joined.indexOf('-u#4294967295') !== -1) {
        achieve('sudoer');
        row('integer underflow detected. cute trick.', 't-aqua');
        row('this blog ships sudo >= 1.8.28 though. patched. (agent sudo fan confirmed)', 't-gray');
        return;
      }
      if (joined.indexOf('make me a sandwich') !== -1) {
        row(isRoot ? 'okay.' : 'what? make it yourself.', isRoot ? 't-green' : 't-red');
        return;
      }
      if (isRoot) {
        row('sudo: granted. you are already root though. stay humble.', 't-aqua');
        return;
      }
      if (joined.indexOf('rm') !== -1 && joined.indexOf('-rf') !== -1) {
        COMMANDS.rm(args.slice(1));
      } else {
        row('guest is not in the sudoers file. this incident will be reported.', 't-red');
      }
    },

    decode: function (args) {
      if (!args.length) { row('decode: missing operand (try decode .flag.enc)', 't-red'); return; }
      var target = args.join('');
      var decoded = null;
      if (target === '.flag.enc') {
        try { decoded = atob(FLAG_B64); } catch (e) {}
      } else if (/^[0-9a-fA-F][0-9a-fA-F\s]+$/.test(target) && target.replace(/\s+/g, '').length % 2 === 0) {
        decoded = hexToString(target);
      } else {
        try { decoded = atob(target.replace(/\s+/g, '')); } catch (e) {}
      }
      if (!decoded || decoded.indexOf('flag{') === -1) {
        row('decode: input does not decode to a flag (try decode .flag.enc)', 't-red');
        return;
      }
      row([{ t: 'decoded: ', c: 't-gray' }, { t: decoded, c: 't-green' }]);
      row('now make it official: submit <flag>', 't-gray');
    },

    base64: function (args) {
      if (args.length && args[0].indexOf('d') === 0 && args[0].indexOf('-') === 0) args = args.slice(1);
      COMMANDS.decode(args);
    },

    submit: function (args) {
      if (isRoot) { row('submit: already captured. stay humble.', 't-aqua'); return; }
      if (!args.length) { row('usage: submit flag{...}', 't-gray'); return; }
      var guess = args.join(' ').trim().toLowerCase();
      if (guess === FLAG_ROOT) {
        grantRoot();
      } else if (guess === FLAG2) {
        achieve('sourcer');
        row('[ ok ] flag #2 accepted. you actually read the source. respect.', 't-green');
        row('one flag still hides. it answers on a port that polite scans never see.', 't-gray');
      } else if (guess === FLAG3) {
        achieve('knocker');
        row('[ ok ] flag #3 accepted. port 31337 has no more secrets from you.', 't-green');
      } else if (guess === rot13(FLAG3_ROT13)) {
        row('close, but that is still rot13. run it through: rot13 <text>', 't-yellow');
      } else {
        row('submit: not the flag. keep hunting. (stuck? type hint)', 't-red');
      }
    },

    hint: function () {
      if (isRoot) {
        var rootHints = [
          'hint: two more flags hide on this blog. one ships inside cat shell.js.',
          'hint: flag #2 is hex, not base64. decode speaks both. then: submit flag{...}',
          'hint: flag #3 lives on a port that polite scans never show. nmap -p-, then nc it.'
        ];
        row(rootHints[Math.min(hintLevel, rootHints.length - 1)], 't-yellow');
        hintLevel += 1;
        return;
      }
      var hints = [
        "hint 1: flag.txt is bait. secrets hide from plain ls. hidden files need: ls -a",
        'hint 2: .flag.enc is encoded. your old friend base64 can read it: decode .flag.enc',
        'hint 3: take the decoded string and make it official: submit flag{...}'
      ];
      row(hints[Math.min(hintLevel, hints.length - 1)], 't-yellow');
      hintLevel += 1;
    },

    register: function (args) {
      if (!isRoot) { row('register: capture the flag first. (submit flag{...})', 't-red'); return; }
      var name = args.join('').trim().toLowerCase();
      if (!/^[a-z0-9_.\-]{2,20}$/.test(name)) {
        row('register: names are 2-20 chars from a-z 0-9 _ . -', 't-red');
        return;
      }
      myName = name;
      try { localStorage.setItem('zew0z-name', name); } catch (e) {}
      row([{ t: 'registered as ', c: 't-gray' }, { t: name, c: 't-green' }, { t: '. this shell will call you nothing else.', c: 't-gray' }]);
      row('to appear on the global board: publish', 't-gray');
    },

    top: function () {
      row('== flag board :: hunters who checked the source ==', 't-green');
      fetch('/leaderboard.json?cb=' + Date.now())
        .then(function (r) { return r.ok ? r.json() : null; })
        .catch(function () { return null; })
        .then(function (data) {
          var entries = (data && data.entries) || [];
          var iAmGlobal = entries.some(function (e) { return (e.name || '').toLowerCase() === myName; });
          if (myName && !iAmGlobal) {
            entries = entries.concat([{ name: myName, date: '', local: true }]);
          }
          if (!entries.length) {
            row('the board is empty. be the first: submit flag{...}', 't-gray');
            return;
          }
          entries.forEach(function (e, i) {
            var mine = myName && (e.name || '').toLowerCase() === myName;
            var tags = [];
            if (mine) tags.push('<- you');
            if (e.local) tags.push('not published yet (run: publish)');
            row([
              { t: ' ' + (i + 1) + '. ', c: 't-gray' },
              { t: e.name, c: mine ? 't-green' : 't-fg1' },
              { t: tags.length ? '  ' + tags.join(' -- ') + ' ' : '  ', c: 't-gray' },
              { t: e.date || '', c: 't-fg4' }
            ]);
          });
        });
    },
    leaderboard: function () { COMMANDS.top(); },

    publish: function () {
      if (!isRoot) { row('publish: capture the flag first.', 't-red'); return; }
      if (!myName) { row('publish: pick a callsign first: register <name>', 't-red'); return; }
      var url = 'https://github.com/zew0z/zew0z.github.io/issues/new?title=' +
        encodeURIComponent('[flag-capture] ' + myName) +
        '&body=' + encodeURIComponent(
          'flag board claim from the guest shell on zew0z.github.io\n' +
          'name: ' + myName + '\n' +
          'date: ' + new Date().toISOString().slice(0, 10) + '\n' +
          '(a github action will add this to leaderboard.json and close the issue)'
        );
      row([{ t: 'claim filed. open the issue and a bot will stamp the board: ', c: 't-gray' },
           { t: 'github.com/zew0z/issues', c: 't-green', href: url, external: true }]);
      try { window.open(url, '_blank', 'noopener'); } catch (e) {}
    },

    rm: function (args) {
      var joined = args.join(' ');
      if ((joined.indexOf('-rf') !== -1 || joined.indexOf('-fr') !== -1) && joined.indexOf('/') !== -1) {
        row('deleting /bin... deleting /etc... deleting /home/guest...', 't-red');
        row('just kidding. this blog is immutable. not a single byte was harmed.', 't-green');
      } else {
        row('rm: permission denied. nice reflexes though.', 't-red');
      }
    },

    chmod: function (args) {
      row('chmod: ' + (args.join(' ') || 'nothing') + ': operation not permitted. this blog keeps its bits to itself.', 't-red');
    },

    make: function (args) {
      var joined = args.join(' ');
      if (joined.indexOf('me a sandwich') !== -1) {
        row("make: *** no rule to make target 'me a sandwich'. what? make it yourself.", 't-red');
        return;
      }
      row("make: *** no rule to make target '" + (args[0] || 'all') + "'. stop.", 't-red');
    },

    vim: function () { row('vim: detected. you are now stuck here. hint: esc :q! enter', 't-yellow'); },
    vi: function () { COMMANDS.vim(); },
    nano: function () { row('nano: a respectable choice.', 't-aqua'); },
    emacs: function () { row('emacs: nice operating system, where is the editor?', 't-yellow'); },

    cd: function () { row("cd: guests stay in ~. the writeups come to you: 'ls writeups'", 't-gray'); },

    matrix: function () {
      row('wake up, guest.', 't-green');
      if (window.zew0z) window.zew0z.matrixRain();
    },

    coffee: function () {
      row([
        { t: 'brewing... ', c: 't-gray' },
        { t: 'https://ko-fi.com/zew0z', c: 't-green', href: 'https://ko-fi.com/zew0z', external: true },
        { t: ' (opens in a new tab)', c: 't-gray' }
      ]);
    },

    flag: function () {
      row('one real flag hides in this very shell. start with: cat flag.txt', 't-yellow');
      row('(the writeup flags stay in their rooms. no spoilers here.)', 't-gray');
    },
    flags: function () { COMMANDS.flag(); },

    exit: function () { row('exit: nice try. this shell stays with you.', 't-gray'); },
    logout: function () { COMMANDS.exit(); }
  };

  COMMANDS.rooms = COMMANDS.wiki;
  COMMANDS.htop = COMMANDS.ps;

  var UNKNOWN = function (cmd) {
    row("zsh: command not found: " + cmd + " (try 'help')", 't-red');
    if (/flag|secret|hint|root|sudo/.test(cmd)) {
      row('...that smells related to something. (type hint)', 't-yellow');
    }
  };

  /* ---------- input handling ---------- */

  var FILE_POOL = ['about_me.txt', 'contact.txt', 'flag.txt', 'motd', 'writeups/'];
  var HIDDEN_FILE_POOL = ['.flag.enc', '.zsh_history'];

  function commonPrefix(arr) {
    if (!arr.length) return '';
    var p = arr[0];
    arr.forEach(function (s) {
      while (s.indexOf(p) !== 0) p = p.slice(0, -1);
    });
    return p;
  }

  function completionsFor(cmd, token) {
    if (['cat', 'decode', 'nano', 'rm', 'vim'].indexOf(cmd) !== -1) {
      var pool = token.indexOf('.') === 0 ? FILE_POOL.concat(HIDDEN_FILE_POOL) : FILE_POOL;
      return pool.filter(function (f) { return f.indexOf(token) === 0; });
    }
    if (['open', 'grep', 'wiki'].indexOf(cmd) !== -1) {
      return POSTS.map(postSlug).filter(function (s) { return s.indexOf(token) !== -1; });
    }
    if (cmd === 'ascii') {
      return Object.keys(ASCII_ART).filter(function (a) { return a.indexOf(token) === 0; });
    }
    if (cmd === 'man') {
      return Object.keys(MANPAGES).concat('man').filter(function (a) { return a.indexOf(token) === 0; });
    }
    return [];
  }

  function complete() {
    var parts = input.value.split(/\s+/);
    if (!parts[0]) return;
    var token = parts[parts.length - 1];
    var matches;
    if (parts.length === 1) {
      matches = Object.keys(COMMANDS).filter(function (c) { return c.indexOf(token) === 0; }).sort();
    } else {
      matches = completionsFor(parts[0].toLowerCase(), token);
    }
    if (!matches.length) return;

    if (matches.length === 1) {
      parts[parts.length - 1] = matches[0];
      input.value = parts.join(' ') + (matches[0].slice(-1) === '/' ? '' : ' ');
      return;
    }
    var prefix = commonPrefix(matches);
    parts[parts.length - 1] = prefix;
    input.value = parts.join(' ');
    if (prefix === token) {
      /* no progress: show the options like a real shell */
      row([{ t: matches.join('   '), c: 't-gray' }]);
    }
  }

  /* distinct-command tracking for the 'first' and 'operator' achievements */
  var seenCmds = {};
  try { seenCmds = JSON.parse(localStorage.getItem('zew0z-cmds') || '{}') || {}; } catch (e) { seenCmds = {}; }

  function trackCommand(cmd) {
    if (seenCmds[cmd]) return;
    var known = Object.keys(seenCmds).length;
    seenCmds[cmd] = 1;
    try { localStorage.setItem('zew0z-cmds', JSON.stringify(seenCmds)); } catch (e) {}
    if (known === 0) achieve('first');
    else if (known + 1 >= 10) achieve('operator');
  }

  function run(raw) {
    var trimmed = raw.trim();
    row([
      { t: promptText + ' ', c: isRoot ? 't-orange' : 't-green' },
      { t: trimmed, c: 't-fg0' }
    ], 'cmd');
    if (!trimmed) return;

    history.push(trimmed);
    histIdx = history.length;

    var parts = trimmed.split(/\s+/);
    var cmd = parts[0].toLowerCase();
    var args = parts.slice(1);

    trackCommand(cmd);
    if (COMMANDS[cmd]) COMMANDS[cmd](args);
    else UNKNOWN(cmd);
  }

  function submitInput() {
    run(input.value);
    input.value = '';
  }

  form.addEventListener('submit', function (e) {
    e.preventDefault();
    submitInput();
  });

  input.addEventListener('keydown', function (e) {
    if (e.key === 'Enter') {
      e.preventDefault();
      submitInput();
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      if (histIdx > 0) {
        histIdx -= 1;
        input.value = history[histIdx] || '';
      }
    } else if (e.key === 'ArrowDown') {
      e.preventDefault();
      if (histIdx < history.length) {
        histIdx += 1;
        input.value = history[histIdx] || '';
      }
    } else if (e.key === 'Tab') {
      e.preventDefault();
      complete();
    } else if (e.key === 'c' && e.ctrlKey) {
      e.preventDefault();
      row([
        { t: promptText + ' ', c: isRoot ? 't-orange' : 't-green' },
        { t: input.value, c: 't-fg0' },
        { t: '^C', c: 't-gray' }
      ], 'cmd');
      input.value = '';
    } else if (e.key === 'l' && e.ctrlKey) {
      e.preventDefault();
      COMMANDS.clear();
    }
  });

  term.addEventListener('click', function () {
    if (!window.getSelection().toString()) input.focus();
  });

  /* ---------- greeting ---------- */

  if (isRoot) {
    lines(BANNER, 't-green');
    row('welcome back, root. the shell kept your seat warm.', 't-orange');
    if (!myName) row('claim your spot on the flag board: register <name>', 't-yellow');
    row([{ t: "type ", c: 't-gray' }, { t: 'help', c: 't-green' }, { t: " for commands. show off with ", c: 't-gray' }, { t: 'leaderboard', c: 't-green' }, { t: ' or ', c: 't-gray' }, { t: 'achievements', c: 't-green' }, { t: '.', c: 't-gray' }]);
  } else {
    lines(BANNER, 't-aqua');
    row('zew0z guest shell v2.0 -- unauthorized access actively encouraged.', 't-gray');
    row([{ t: "type ", c: 't-gray' }, { t: 'help', c: 't-green' }, { t: " to see what this thing can do. rumor: three flags hide in here.", c: 't-gray' }]);
  }

  /* ---------- visible flag board strip ---------- */

  (function flagboard() {
    var box = document.getElementById('flagboard-rows');
    if (!box) return;

    function addRow(segments) {
      var div = document.createElement('div');
      div.className = 'flagboard-row';
      segments.forEach(function (s) {
        var n = document.createElement('span');
        n.textContent = s.t;
        if (s.c) n.className = s.c;
        div.appendChild(n);
      });
      box.appendChild(div);
    }

    fetch('/leaderboard.json?cb=' + Date.now())
      .then(function (r) { if (!r.ok) throw new Error('http ' + r.status); return r.json(); })
      .then(function (data) {
        var entries = (data && data.entries) || [];
        if (!entries.length) {
          addRow([{ t: 'empty. the flag is out there, and so is slot #1.', c: 't-gray' }]);
          return;
        }
        entries.slice(0, 8).forEach(function (e, i) {
          var mine = myName && (e.name || '').toLowerCase() === myName;
          var segs = [
            { t: (i + 1) + '. ', c: 't-gray' },
            { t: e.name || '???', c: mine ? 't-green' : 't-fg1' }
          ];
          if (mine) segs.push({ t: '  <- you', c: 't-green' });
          segs.push({ t: '    ' + (e.date || ''), c: 't-gray' });
          addRow(segs);
        });
        if (isRoot && !myName) {
          addRow([{ t: 'you: captured but unnamed (register <name>, then publish)', c: 't-gray' }]);
        } else if (isRoot && !entries.some(function (e) { return (e.name || '').toLowerCase() === myName; })) {
          addRow([{ t: 'you: not published yet (run: publish)', c: 't-gray' }]);
        }
      })
      .catch(function () {
        addRow([{ t: 'board unavailable offline.', c: 't-gray' }]);
      });
  })();

  function focusIfHash() {
    if (location.hash === '#playground' || location.hash === '#guest-term') {
      input.focus();
    }
  }
  focusIfHash();
  window.addEventListener('hashchange', focusIfHash);

})();
