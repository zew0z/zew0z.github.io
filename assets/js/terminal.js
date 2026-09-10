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

  var COMMANDS = {

    help: function () {
      lines(
        'available commands:\n' +
        '  help              this list\n' +
        '  ls [writeups]     list files or writeups\n' +
        '  cat <file>        read a file (try about_me.txt)\n' +
        '  open <n|name>     open writeup n from ls writeups\n' +
        '  whoami id pwd     the identity crisis trio\n' +
        '  neofetch          guest system info\n' +
        '  history           your command history\n' +
        '  echo <text>       repeat after you\n' +
        '  date uname        the usual suspects\n' +
        '  banner            redraw the banner\n' +
        '  clear             wipe the screen\n' +
        '  exit              you can check out any time you like\n' +
        'hint: some commands are not on this list.'
      );
    },

    ls: function (args) {
      var target = args[0];
      if (target && target.indexOf('writeup') !== -1) { listWriteups(); return; }
      row([
        { t: 'about_me.txt   contact.txt   flag.txt   motd   ', c: 't-fg1' },
        { t: 'writeups/', c: 't-aqua' }
      ]);
      row("try: ls writeups", 't-gray');
    },

    cat: function (args) {
      if (!args.length) { row('cat: missing file operand', 't-red'); return; }
      var name = args[0];
      if (name === 'flag.txt') {
        row('cat: flag.txt: permission denied (flags are earned, see ls writeups)', 't-red');
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

    writeups: function () { listWriteups(); },

    whoami: function () { row('guest'); },
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
      if (args.join(' ').indexOf('rm') !== -1 && args.join(' ').indexOf('-rf') !== -1) {
        COMMANDS.rm(args.slice(1));
      } else {
        row('guest is not in the sudoers file. this incident will be reported.', 't-red');
      }
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

    flag: function () { row("flags live inside the writeups. go get them: 'ls writeups'", 't-yellow'); },
    flags: function () { COMMANDS.flag(); },

    exit: function () { row('exit: nice try. this shell stays with you.', 't-gray'); },
    logout: function () { COMMANDS.exit(); }
  };

  var UNKNOWN = function (cmd) {
    row("zsh: command not found: " + cmd + " (try 'help')", 't-red');
  };

  /* ---------- input handling ---------- */

  function run(raw) {
    var trimmed = raw.trim();
    row([
      { t: PROMPT + ' ', c: 't-green' },
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
    } else if (e.key === 'l' && e.ctrlKey) {
      e.preventDefault();
      COMMANDS.clear();
    }
  });

  term.addEventListener('click', function () {
    if (!window.getSelection().toString()) input.focus();
  });

  /* ---------- greeting ---------- */

  row('zew0z guest shell v1.0 -- unauthorized access actively encouraged.', 't-gray');
  row([{ t: "type ", c: 't-gray' }, { t: 'help', c: 't-green' }, { t: " to see what this thing can do. try ", c: 't-gray' }, { t: 'ls writeups', c: 't-green' }, { t: '.', c: 't-gray' }]);
})();
