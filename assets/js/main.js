/* zew0z.github.io - global behaviors
   tmux status bar, boot sequence, typewriter, scroll-spy,
   writeup filters, code copy buttons, TOC, reading progress,
   konami/matrix easter egg, panel-tab scramble */

(function () {
  'use strict';

  var reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* ---------- shared helpers ---------- */

  function make(tag, cls, text) {
    var node = document.createElement(tag);
    if (cls) node.className = cls;
    if (text !== undefined) node.textContent = text;
    return node;
  }

  /* ---------- toast ---------- */

  function toast(msg) {
    var t = make('div', 'toast', msg);
    t.setAttribute('role', 'status');
    document.body.appendChild(t);
    requestAnimationFrame(function () { t.classList.add('toast-on'); });
    setTimeout(function () {
      t.classList.remove('toast-on');
      setTimeout(function () { t.remove(); }, 350);
    }, 3000);
  }

  /* ---------- matrix rain (konami / terminal 'matrix' command) ---------- */

  var GLYPHS = 'アイウエオカキクケコサシスセソタチツテト0123456789ABCDEF#$%&*+=<>';

  function matrixRain() {
    if (reduceMotion || document.querySelector('.matrix-canvas')) return;
    var canvas = make('canvas', 'matrix-canvas');
    canvas.setAttribute('aria-hidden', 'true');
    document.body.appendChild(canvas);
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;

    var ctx = canvas.getContext('2d');
    var fontSize = 16;
    var cols = Math.ceil(canvas.width / fontSize);
    var rows = Math.ceil(canvas.height / fontSize);
    var drops = [];
    for (var i = 0; i < cols; i++) drops.push(Math.floor(Math.random() * -rows));

    ctx.fillStyle = '#1d2021';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.font = fontSize + 'px "JetBrains Mono", monospace';

    var raf = null;
    var last = 0;

    function frame(ts) {
      raf = requestAnimationFrame(frame);
      if (ts - last < 55) return;
      last = ts;
      ctx.fillStyle = 'rgba(29, 32, 33, 0.30)';
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      for (var c = 0; c < cols; c++) {
        var y = drops[c];
        if (y >= 0 && y < rows + 2) {
          var roll = Math.random();
          ctx.fillStyle = roll < 0.72 ? '#b8bb26' : (roll < 0.87 ? '#8ec07c' : '#fabd2f');
          ctx.fillText(GLYPHS[Math.floor(Math.random() * GLYPHS.length)], c * fontSize, y * fontSize);
        }
        drops[c] = y > rows && Math.random() > 0.972 ? 0 : y + 1;
      }
    }

    function stop() {
      document.removeEventListener('keydown', stop, true);
      document.removeEventListener('pointerdown', stop, true);
      if (raf) cancelAnimationFrame(raf);
      canvas.classList.remove('matrix-on');
      setTimeout(function () { canvas.remove(); }, 600);
    }

    raf = requestAnimationFrame(frame);
    requestAnimationFrame(function () { canvas.classList.add('matrix-on'); });
    setTimeout(stop, 5000);
    document.addEventListener('keydown', stop, true);
    document.addEventListener('pointerdown', stop, true);
  }

  window.zew0z = { reduceMotion: reduceMotion, toast: toast, matrixRain: matrixRain };

  /* ---------- tmux clock ---------- */

  var clock = document.getElementById('tmux-clock');
  function tick() {
    if (!clock) return;
    var d = new Date();
    var p = function (n) { return String(n).padStart(2, '0'); };
    clock.textContent = p(d.getHours()) + ':' + p(d.getMinutes()) + ' ' +
      d.toLocaleDateString('en-GB', { day: '2-digit', month: 'short' });
  }
  tick();
  setInterval(tick, 30000);

  /* ---------- tmux active window: path base + scroll-spy on home ---------- */

  var wins = Array.prototype.slice.call(document.querySelectorAll('.tmux-win[data-section]'));
  var onHome = location.pathname === '/' || location.pathname === '/index.html';

  function setActive(name) {
    wins.forEach(function (w) {
      w.classList.toggle('tmux-win-active', w.getAttribute('data-section') === name);
    });
  }

  var spySections = onHome
    ? ['home', 'terminal', 'writeups', 'about', 'contact']
        .map(function (id) { return document.getElementById(id); })
        .filter(Boolean)
    : [];

  function spy() {
    var line = window.scrollY + 160;
    var current = spySections.length ? spySections[0].id : null;
    spySections.forEach(function (s) {
      if (s.offsetTop <= line) current = s.id;
    });
    if (current) setActive(current);
  }

  if (!onHome) setActive('writeups');
  else spy();

  /* ---------- reading progress (post pages) ---------- */

  var progressBar = null;

  function buildProgress() {
    progressBar = make('div', 'progress');
    progressBar.setAttribute('aria-hidden', 'true');
    document.body.appendChild(progressBar);
  }

  function updateProgress() {
    if (!progressBar) return;
    var doc = document.documentElement;
    var max = doc.scrollHeight - window.innerHeight;
    var p = max > 0 ? Math.min(window.scrollY / max, 1) : 0;
    progressBar.style.transform = 'scaleX(' + p + ')';
  }

  /* one rAF-throttled scroll handler for progress + spy */

  var scrollTicking = false;
  function onScroll() {
    if (scrollTicking) return;
    scrollTicking = true;
    requestAnimationFrame(function () {
      scrollTicking = false;
      updateProgress();
      if (onHome) spy();
    });
  }
  window.addEventListener('scroll', onScroll, { passive: true });

  /* ---------- typewriter ---------- */

  document.querySelectorAll('[data-typewriter]').forEach(function (el) {
    var text = el.getAttribute('data-typewriter');
    el.setAttribute('aria-label', text);
    if (reduceMotion) { el.textContent = text; return; }
    el.textContent = '';
    var i = 0;
    (function type() {
      if (i <= text.length) {
        el.textContent = text.slice(0, i);
        i += 1;
        setTimeout(type, 22 + Math.random() * 40);
      }
    })();
  });

  /* ---------- boot sequence (once per session, skippable) ---------- */

  (function boot() {
    var overlay = document.getElementById('boot');
    if (!overlay) return;
    var seen = null;
    try { seen = sessionStorage.getItem('zew0z-boot'); } catch (e) {}
    if (reduceMotion || seen) { overlay.remove(); return; }
    try { sessionStorage.setItem('zew0z-boot', '1'); } catch (e) {}

    var target = document.getElementById('boot-text');
    var count = overlay.getAttribute('data-posts') || '0';
    var lines = [
      'zew0z.github.io boot v2.6-gru (tty1)',
      '[  OK  ] mounted /dev/blog on /',
      '[  OK  ] loaded writeups (' + count + ')',
      '[  OK  ] started gruvbox-theme.service',
      '[  OK  ] reached target guest.session'
    ];

    var li = 0, ci = 0, done = false;

    function finish() {
      if (done) return;
      done = true;
      document.removeEventListener('keydown', finish, true);
      document.removeEventListener('pointerdown', finish, true);
      overlay.classList.add('boot-done');
      setTimeout(function () { overlay.remove(); }, 450);
    }

    document.addEventListener('keydown', finish, true);
    document.addEventListener('pointerdown', finish, true);

    (function step() {
      if (done) return;
      if (li >= lines.length) { setTimeout(finish, 320); return; }
      var lineText = lines[li];
      if (ci <= lineText.length) {
        target.textContent = lines.slice(0, li).join('\n') + (li ? '\n' : '') + lineText.slice(0, ci);
        ci += 2;
        setTimeout(step, 12);
      } else {
        li += 1;
        ci = 0;
        setTimeout(step, 70);
      }
    })();
  })();

  /* ---------- panel-tab scramble on hover ---------- */

  var SCRAMBLE_GLYPHS = '!<>-_\\/[]{}=+*^?#$%&@';

  document.querySelectorAll('.panel-tab').forEach(function (tab) {
    var original = tab.textContent;
    var timer = null;
    function reset() {
      if (timer) { clearInterval(timer); timer = null; }
      tab.textContent = original;
    }
    tab.addEventListener('mouseenter', function () {
      if (reduceMotion || timer) return;
      var frame = 0;
      var total = 14;
      timer = setInterval(function () {
        frame += 1;
        var reveal = Math.floor((frame / total) * original.length);
        tab.textContent = original.split('').map(function (ch, i) {
          if (i < reveal || ch === ' ') return ch;
          return SCRAMBLE_GLYPHS[Math.floor(Math.random() * SCRAMBLE_GLYPHS.length)];
        }).join('');
        if (frame >= total) reset();
      }, 28);
    });
    tab.addEventListener('mouseleave', reset);
  });

  /* ---------- writeup tag filters (home) ---------- */

  var filters = document.getElementById('ls-filters');
  if (filters) {
    var rows = Array.prototype.slice.call(document.querySelectorAll('#writeups .ls-row'));
    var years = Array.prototype.slice.call(document.querySelectorAll('#writeups .ls-year'));
    var totalLine = document.getElementById('ls-total');
    var totalCount = rows.length;

    filters.addEventListener('click', function (e) {
      var btn = e.target.closest('.ls-filter');
      if (!btn) return;
      filters.querySelectorAll('.ls-filter').forEach(function (b) {
        var active = b === btn;
        b.classList.toggle('is-active', active);
        b.setAttribute('aria-pressed', active ? 'true' : 'false');
      });
      var tag = btn.getAttribute('data-tag');
      var shown = 0;
      rows.forEach(function (r) {
        var match = tag === 'all' || (r.getAttribute('data-tags') || '').split(' ').indexOf(tag) !== -1;
        r.hidden = !match;
        if (match) shown += 1;
      });
      years.forEach(function (y) {
        var node = y.nextElementSibling;
        var any = false;
        while (node && !node.classList.contains('ls-year')) {
          if (node.classList.contains('ls-row') && !node.hidden) { any = true; break; }
          node = node.nextElementSibling;
        }
        y.hidden = !any;
      });
      if (totalLine) {
        totalLine.textContent = tag === 'all'
          ? 'total ' + totalCount + ' writeups'
          : 'showing ' + shown + ' of ' + totalCount + ' writeups [' + tag + ']';
      }
    });
  }

  /* ---------- post page: code copy buttons, TOC, progress bar ---------- */

  var content = document.querySelector('.post-content');
  if (content) {
    buildProgress();
    updateProgress();

    /* copy buttons on code blocks
       rouge nests pre.highlight inside div.highlight; only wrap the outer one */
    content.querySelectorAll(".highlight").forEach(function (block) {
      /* rouge nests pre.highlight inside div.highlight; only wrap the outer div */
      if (block.parentElement && block.parentElement.closest(".highlight")) return;
      var lang = "text";
      var outer = block.closest('[class*="language-"]') || block.parentElement;
      if (outer) {
        var m = (outer.className || "").match(/language-([\w+-]+)/);
        if (m) lang = m[1];
      }
      var head = make('div', 'code-head');
      head.appendChild(make('span', 'code-lang', lang));
      var btn = make('button', 'copy-btn', 'copy');
      btn.type = 'button';
      btn.setAttribute('aria-label', 'copy code to clipboard');
      btn.addEventListener('click', function () {
        var pre = block.querySelector('pre');
        var text = pre ? pre.innerText : '';
        function done() {
          btn.textContent = 'copied!';
          btn.classList.add('copied');
          setTimeout(function () {
            btn.textContent = 'copy';
            btn.classList.remove('copied');
          }, 1200);
        }
        if (navigator.clipboard && navigator.clipboard.writeText) {
          navigator.clipboard.writeText(text).then(done, function () { fallbackCopy(text, done); });
        } else {
          fallbackCopy(text, done);
        }
      });
      head.appendChild(btn);
      block.insertBefore(head, block.firstChild);
    });

    function fallbackCopy(text, done) {
      var ta = make('textarea');
      ta.value = text;
      ta.style.position = 'fixed';
      ta.style.opacity = '0';
      document.body.appendChild(ta);
      ta.select();
      try { document.execCommand('copy'); done(); } catch (e) {}
      ta.remove();
    }

    /* TOC from kramdown heading ids */
    var heads = Array.prototype.slice.call(content.querySelectorAll('h2[id], h3[id]'));
    if (heads.length >= 3) {
      var details = document.createElement('details');
      details.className = 'toc';
      var summary = document.createElement('summary');
      summary.innerHTML = '<span class="prompt-char">guest@zew0z:~$</span> cat index.md';
      details.appendChild(summary);
      var list = make('ul', 'toc-list');
      heads.forEach(function (h) {
        var li = make('li', h.tagName === 'H3' ? 'toc-h3' : '');
        var a = document.createElement('a');
        a.href = '#' + h.id;
        a.textContent = h.textContent;
        a.addEventListener('click', function () { details.removeAttribute('open'); });
        li.appendChild(a);
        list.appendChild(li);
      });
      details.appendChild(list);
      content.insertBefore(details, content.firstChild);
    }
  }

  /* ---------- konami code ---------- */

  var KONAMI = ['ArrowUp', 'ArrowUp', 'ArrowDown', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'ArrowLeft', 'ArrowRight', 'b', 'a'];
  var konamiIdx = 0;

  document.addEventListener('keydown', function (e) {
    var key = e.key.length === 1 ? e.key.toLowerCase() : e.key;
    konamiIdx = key === KONAMI[konamiIdx] ? konamiIdx + 1 : (key === KONAMI[0] ? 1 : 0);
    if (konamiIdx === KONAMI.length) {
      konamiIdx = 0;
      matrixRain();
      toast('[ ok ] root access granted. welcome, friend.');
    }
  });
})();
