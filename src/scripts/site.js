/* zew0z.github.io - site behaviors
   achievements, konami/matrix easter eggs, tab-blur title,
   reading progress, code copy buttons, catalog search */

(function () {
  'use strict';

  var reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

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

    ctx.fillStyle = '#0a0e1c';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.font = fontSize + 'px "JetBrains Mono Variable", monospace';

    var raf = null;
    var last = 0;

    function frame(ts) {
      raf = requestAnimationFrame(frame);
      if (ts - last < 55) return;
      last = ts;
      ctx.fillStyle = 'rgba(10, 14, 28, 0.30)';
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      for (var c = 0; c < cols; c++) {
        var y = drops[c];
        if (y >= 0 && y < rows + 2) {
          var roll = Math.random();
          ctx.fillStyle = roll < 0.72 ? '#2dd4bf' : (roll < 0.87 ? '#4ade80' : '#fbbf24');
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

  /* ---------- achievements (localStorage-backed, every page) ---------- */

  var ACH = {
    first: 'hello, world :: ran a first command',
    explorer: 'hidden files hold secrets :: ran ls -a',
    researcher: 'grep is a lifestyle :: searched the writeups',
    archivist: 'reading is privesc :: opened a writeup from the shell',
    cartographer: 'know your rooms :: browsed the wiki',
    netrunner: 'port scanner in training :: ran nmap',
    cattle: 'moo :: asked the cow to speak',
    operator: 'comfortable in the shell :: ran 10 distinct commands',
    root: 'flag captured :: root of this blog',
    konami: 'old habits :: the code that never dies',
    sudoer: 'integer underflow enjoyer :: sudo -u#-1',
    completionist: 'everything above :: nothing left to find'
  };

  var ACH_KEY = 'zew0z-ach';

  function getAch() {
    var store = {};
    try { store = JSON.parse(localStorage.getItem(ACH_KEY) || '{}') || {}; } catch (e) { store = {}; }
    return store;
  }

  function achieve(id) {
    if (!ACH[id]) return false;
    var store = getAch();
    if (store[id]) return false;
    store[id] = new Date().toISOString().slice(0, 10);
    try { localStorage.setItem(ACH_KEY, JSON.stringify(store)); } catch (e) {}
    toast('[ ach ] unlocked: ' + ACH[id].split(' :: ')[0]);

    var ids = Object.keys(ACH);
    var allDone = ids.every(function (k) { return k === 'completionist' || store[k]; });
    if (allDone) {
      store.completionist = store.completionist || new Date().toISOString().slice(0, 10);
      try { localStorage.setItem(ACH_KEY, JSON.stringify(store)); } catch (e) {}
      setTimeout(function () { toast('[ ach ] unlocked: completionist'); }, 1400);
    }
    return true;
  }

  window.zew0z = {
    reduceMotion: reduceMotion,
    toast: toast,
    matrixRain: matrixRain,
    achieve: achieve,
    getAch: getAch,
    ACH: ACH
  };

  /* ---------- tab-blur easter egg ---------- */

  var baseTitle = document.title;
  document.addEventListener('visibilitychange', function () {
    document.title = document.hidden ? '[+] psst: the flag is still in here.' : baseTitle;
  });

  /* ---------- konami code ---------- */

  var KONAMI = ['ArrowUp', 'ArrowUp', 'ArrowDown', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'ArrowLeft', 'ArrowRight', 'b', 'a'];
  var konamiIdx = 0;

  document.addEventListener('keydown', function (e) {
    var key = e.key.length === 1 ? e.key.toLowerCase() : e.key;
    konamiIdx = key === KONAMI[konamiIdx] ? konamiIdx + 1 : (key === KONAMI[0] ? 1 : 0);
    if (konamiIdx === KONAMI.length) {
      konamiIdx = 0;
      achieve('konami');
      matrixRain();
      toast('[ ok ] root access granted. welcome, friend.');
    }
  });

  /* ---------- reading progress (post pages) ---------- */

  var prose = document.querySelector('.prose');

  if (prose) {
    /* per-screenshot spoilers: images start blurred, click to toggle.
       answers live in the images, so this applies even after the gate is revealed */
    prose.querySelectorAll('img').forEach(function (img) {
      if (img.closest('.img-spoiler')) return;
      var wrap = document.createElement('div');
      wrap.className = 'img-spoiler is-blurred';
      var btn = document.createElement('button');
      btn.type = 'button';
      btn.className = 'img-btn';
      btn.setAttribute('aria-label', 'screenshot blurred to avoid spoilers. activate to reveal');
      var veil = document.createElement('span');
      veil.className = 'img-veil';
      veil.setAttribute('aria-hidden', 'true');
      veil.appendChild(make('span', 'veil-chip', 'screenshot :: click to reveal'));
      img.parentNode.insertBefore(wrap, img);
      btn.appendChild(img);
      btn.appendChild(veil);
      wrap.appendChild(btn);
      btn.addEventListener('click', function () {
        var blurred = wrap.classList.toggle('is-blurred');
        veil.querySelector('.veil-chip').textContent = blurred
          ? 'screenshot :: click to reveal'
          : 'screenshot :: click to hide';
        btn.setAttribute('aria-label', blurred
          ? 'screenshot blurred to avoid spoilers. activate to reveal'
          : 'spoiler screenshot revealed. activate to hide again');
      });
    });

    /* room spoiler gate: blur everything until revealed (rooms only, not blog posts) */
    var zone = document.getElementById('spoiler-zone');
    var gate = document.querySelector('.spoiler-gate');
    if (zone && gate) {
      var accepted = false;
      try { accepted = localStorage.getItem('zew0z-spoilers') === '1'; } catch (e) {}
      if (accepted) {
        gate.remove();
      } else {
        gate.querySelector('.spoiler-reveal').addEventListener('click', function () {
          zone.classList.remove('is-spoilered');
          gate.remove();
          try { localStorage.setItem('zew0z-spoilers', '1'); } catch (e) {}
        });
      }
    }

    var progressBar = make('div', 'progress');
    progressBar.setAttribute('aria-hidden', 'true');
    document.body.appendChild(progressBar);

    var scrollTicking = false;
    function onScroll() {
      if (scrollTicking) return;
      scrollTicking = true;
      requestAnimationFrame(function () {
        scrollTicking = false;
        var doc = document.documentElement;
        var max = doc.scrollHeight - window.innerHeight;
        var p = max > 0 ? Math.min(window.scrollY / max, 1) : 0;
        progressBar.style.transform = 'scaleX(' + p + ')';
      });
    }
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });

    /* code blocks: language head + copy button.
       shiki emits pre.astro-code; wrap it like a terminal window */
    prose.querySelectorAll('pre.astro-code, pre').forEach(function (pre) {
      if (pre.closest('.code-wrap')) return;
      var wrap = make('div', 'code-wrap');
      var head = make('div', 'code-head');
      head.appendChild(make('span', 'code-lang', 'text'));
      var btn = make('button', 'copy-btn', 'copy');
      btn.type = 'button';
      btn.setAttribute('aria-label', 'copy code to clipboard');
      btn.addEventListener('click', function () {
        var text = pre.innerText;
        function done() {
          btn.textContent = 'copied';
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
      pre.parentNode.insertBefore(wrap, pre);
      wrap.appendChild(head);
      wrap.appendChild(pre);
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
  }

  /* ---------- catalog search (home) ---------- */

  var input = document.getElementById('search-input');
  if (input) {
    var rows = Array.prototype.slice.call(document.querySelectorAll('#case-list .case'));
    var line = document.getElementById('result-line');
    var emptyBox = document.getElementById('case-empty');
    var resetBtn = document.getElementById('search-reset');
    var platform = 'all';

    function apply() {
      var q = input.value.trim().toLowerCase();
      var shown = 0;
      rows.forEach(function (r) {
        var okPlatform = platform === 'all' || r.getAttribute('data-platform') === platform;
        var okQuery = !q || (r.getAttribute('data-haystack') || '').indexOf(q) !== -1;
        var show = okPlatform && okQuery;
        r.hidden = !show;
        if (show) shown += 1;
      });
      if (line) {
        line.textContent = !q && platform === 'all'
          ? 'showing all ' + rows.length
          : 'showing ' + shown + ' of ' + rows.length + (q ? ' :: "' + q + '"' : ' :: ' + platform);
      }
      if (emptyBox) emptyBox.hidden = shown !== 0;
    }

    document.querySelectorAll('.chip[data-platform]').forEach(function (chip) {
      chip.addEventListener('click', function () {
        document.querySelectorAll('.chip[data-platform]').forEach(function (c) {
          c.classList.toggle('is-active', c === chip);
        });
        platform = chip.getAttribute('data-platform');
        apply();
      });
    });

    /* tag pills on case cards double as quick filters */
    document.querySelectorAll('#case-list .tag[data-q]').forEach(function (tag) {
      tag.addEventListener('click', function () {
        input.value = tag.getAttribute('data-q');
        apply();
        input.focus();
      });
    });

    if (resetBtn) {
      resetBtn.addEventListener('click', function () {
        input.value = '';
        apply();
        input.focus();
      });
    }

    document.addEventListener('keydown', function (e) {
      if (e.key === '/' && document.activeElement !== input &&
          !/^(INPUT|TEXTAREA)$/.test(document.activeElement.tagName)) {
        e.preventDefault();
        input.focus();
      } else if (e.key === 'Escape' && document.activeElement === input) {
        input.value = '';
        apply();
      }
    });

    input.addEventListener('input', apply);
  }

  /* ---------- scroll reveal ---------- */

  if (!reduceMotion && 'IntersectionObserver' in window) {
    var revealTargets = document.querySelectorAll('.preview-section, .playground, .ach-grid > .ach, .page-hero');
    revealTargets.forEach(function (el) { el.classList.add('reveal'); });
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) {
          entry.target.classList.add('is-in');
          io.unobserve(entry.target);
        }
      });
    }, { rootMargin: '0px 0px -8% 0px', threshold: 0.12 });
    revealTargets.forEach(function (el) { io.observe(el); });
  }
})();
