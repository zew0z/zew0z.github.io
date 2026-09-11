/* zew0z.github.io - guest shell
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

  var PROMPT = 'guest@zew0z.github.io:~$';

  /* the one real flag on this blog. view-source counts as a solve.
     base64 of: flag{always_check_the_source_code} */
  var FLAG_B64 = 'ZmxhZ3thbHdheXNfY2hlY2tfdGhlX3NvdXJjZV9jb2RlfQ==';

  var isRoot = false;
  try { isRoot = localStorage.getItem('zew0z-root') === '1'; } catch (e) {}

  var myName = '';
  try { myName = localStorage.getItem('zew0z-name') || ''; } catch (e) {}

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

  var RANDOM_POOL = '01TFx#$%&@!~^*akPZ';

  /* ---------- command registry ---------- */

  var hintLevel = 0;

  function grantRoot() {
    isRoot = true;
    try { localStorage.setItem('zew0z-root', '1'); } catch (e) {}
    applyPrompt();
    row('[ ok ] flag accepted. permissions elevated: you are root of this blog now.', 't-green');
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
        '  grep <pattern>    search the writeups\n' +
        '  whoami id pwd     the identity crisis trio\n' +
        '  neofetch          guest system info\n' +
        '  history           your command history\n' +
        '  echo <text>       repeat after you\n' +
        '  leaderboard       flag hunters, hall of fame\n' +
        '  date uname        the usual suspects\n' +
        '  banner            redraw the banner\n' +
        '  clear             wipe the screen\n' +
        '  exit              you can check out any time you like\n' +
        'hint: some commands are not on this list.'
      );
    },

    ls: function (args) {
      var joined = args.join(' ');
      if (joined.indexOf('writeup') !== -1) { listWriteups(); return; }
      if (/(^|\s)-[a-z]*a/i.test(joined)) {
        row([
          { t: '.  ..  ', c: 't-fg4' },
          { t: '.flag.enc  .zsh_history  ', c: 't-yellow' },
          { t: 'about_me.txt   contact.txt   flag.txt   motd   ', c: 't-fg1' },
          { t: 'writeups/', c: 't-aqua' }
        ]);
        row('that .flag.enc looks suspicious. (cat it)', 't-gray');
        return;
      }
      row([
        { t: 'about_me.txt   contact.txt   flag.txt   motd   ', c: 't-fg1' },
        { t: 'writeups/', c: 't-aqua' }
      ]);
      row("hidden things exist here. (try: ls -a)", 't-gray');
    },

    cat: function (args) {
      if (!args.length) { row('cat: missing file operand', 't-red'); return; }
      var name = args[0];
      if (name === 'flag.txt') {
        row('cat: flag.txt: permission denied (root only. plain ls will not save you either.)', 't-red');
      } else if (name === '.flag.enc') {
        row(FLAG_B64, 't-yellow');
        row('this string smells like base64. (decode it)', 't-gray');
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
      row([{ t: 'opening ', c: 't-gray' }, { t: post.title, c: 't-fg0' }, { t: ' ...', c: 't-gray' }]);
      setTimeout(function () { window.location.href = post.url; }, 300);
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
        '   /_-\'\'    \'\'-_\\  '
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

    sudo: function (args) {
      if (isRoot) {
        row('sudo: granted. you are already root though. stay humble.', 't-aqua');
        return;
      }
      if (args.join(' ').indexOf('rm') !== -1 && args.join(' ').indexOf('-rf') !== -1) {
        COMMANDS.rm(args.slice(1));
      } else {
        row('guest is not in the sudoers file. this incident will be reported.', 't-red');
      }
    },

    decode: function (args) {
      if (!args.length) { row('decode: missing operand (try decode .flag.enc)', 't-red'); return; }
      var target = args.join('');
      var raw = target === '.flag.enc' ? FLAG_B64 : target.replace(/\s+/g, '');
      var decoded = null;
      try { decoded = atob(raw); } catch (e) {}
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
      if (guess === atob(FLAG_B64)) {
        grantRoot();
      } else {
        row('submit: not the flag. keep hunting. (stuck? type hint)', 't-red');
      }
    },

    hint: function () {
      if (isRoot) { row('hint: you already won. now help someone else find it.', 't-aqua'); return; }
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
    if (['open', 'grep'].indexOf(cmd) !== -1) {
      return POSTS.map(postSlug).filter(function (s) { return s.indexOf(token) !== -1; });
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
    row('welcome back, root. the shell kept your seat warm.', 't-orange');
    if (!myName) row('claim your spot on the flag board: register <name>', 't-yellow');
    row([{ t: "type ", c: 't-gray' }, { t: 'help', c: 't-green' }, { t: " for commands, or just show off with ", c: 't-gray' }, { t: 'leaderboard', c: 't-green' }, { t: '.', c: 't-gray' }]);
  } else {
    row('zew0z guest shell v1.0 -- unauthorized access actively encouraged.', 't-gray');
    row([{ t: "type ", c: 't-gray' }, { t: 'help', c: 't-green' }, { t: " to see what this thing can do. rumor: one real flag hides in here.", c: 't-gray' }]);
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

})();
