/* zew0z.github.io - cinematic homepage
   scroll-driven boot, terminal cascade, ascii reveal, typewriter, marquee
   uses IntersectionObserver (no scroll listeners) */

(function () {
  'use strict';

  var cinema = document.getElementById('cinema');
  if (!cinema) return;

  var reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* ---------- scroll-driven boot via sentinel IO ---------- */

  (function boot() {
    var section = cinema.querySelector('.cinema-boot');
    if (!section) return;

    var lines = Array.prototype.slice.call(section.querySelectorAll('[data-boot-line]'));
    var fill = document.getElementById('boot-fill');
    var pctEl = document.getElementById('boot-pct');
    var revealed = -1;

    function setProgress(idx) {
      var n = lines.length;
      var p = Math.round(((idx + 1) / n) * 100);
      if (fill) fill.style.transform = 'scaleX(' + ((idx + 1) / n) + ')';
      if (pctEl) pctEl.textContent = p + '%';
    }

    function revealUpTo(idx) {
      if (idx <= revealed) return;
      for (var i = revealed + 1; i <= idx; i++) {
        if (lines[i]) lines[i].classList.add('is-on');
      }
      revealed = idx;
      setProgress(idx);
      if (idx >= lines.length - 1) section.classList.add('is-booted');
    }

    if (reduce) {
      revealUpTo(lines.length - 1);
      return;
    }

    // first two lines appear immediately (loading feel)
    revealUpTo(Math.min(1, lines.length - 1));

    var sentinels = Array.prototype.slice.call(section.querySelectorAll('.cinema-boot-sentinel'));
    if (!sentinels.length) {
      revealUpTo(lines.length - 1);
      return;
    }

    var io = new IntersectionObserver(
      function (entries) {
        entries.forEach(function (entry) {
          if (!entry.isIntersecting) return;
          var idx = parseInt(entry.target.getAttribute('data-boot-idx'), 10);
          if (!isNaN(idx)) revealUpTo(idx);
        });
      },
      { root: null, threshold: 0.55, rootMargin: '0px 0px -20% 0px' }
    );

    sentinels.forEach(function (s) { io.observe(s); });
  })();

  /* ---------- terminal cascade: stagger in from the left ---------- */

  (function cascade() {
    var rail = document.getElementById('cascade-rail');
    if (!rail) return;
    var terms = Array.prototype.slice.call(rail.querySelectorAll('[data-cascade]'));

    if (reduce) {
      terms.forEach(function (t) { t.classList.add('is-in', 'is-typed'); });
      return;
    }

    var io = new IntersectionObserver(
      function (entries) {
        entries.forEach(function (entry) {
          if (!entry.isIntersecting) return;
          var el = entry.target;
          var i = parseInt(el.getAttribute('data-cascade'), 10) || 0;
          setTimeout(function () {
            el.classList.add('is-in');
            setTimeout(function () { el.classList.add('is-typed'); }, 420);
          }, i * 220);
          io.unobserve(el);
        });
      },
      { threshold: 0.25, rootMargin: '0px 0px -8% 0px' }
    );

    terms.forEach(function (t) { io.observe(t); });
  })();

  /* ---------- ascii logo line reveal ---------- */

  (function asciiReveal() {
    var wrap = document.getElementById('ascii-reveal');
    if (!wrap) return;
    var pre = wrap.querySelector('pre');
    if (!pre) return;

    if (reduce) {
      wrap.classList.add('is-in');
      return;
    }

    var raw = pre.textContent || '';
    var rows = raw.replace(/\n$/, '').split('\n');
    pre.textContent = '';
    rows.forEach(function (row, i) {
      var span = document.createElement('span');
      span.className = 'cinema-ascii-row';
      span.style.setProperty('--r', String(i));
      span.textContent = row + (i < rows.length - 1 ? '\n' : '');
      pre.appendChild(span);
    });

    var io = new IntersectionObserver(
      function (entries) {
        entries.forEach(function (entry) {
          if (!entry.isIntersecting) return;
          wrap.classList.add('is-in');
          io.unobserve(wrap);
        });
      },
      { threshold: 0.35 }
    );
    io.observe(wrap);
  })();

  /* ---------- typewriter rising from bottom ---------- */

  (function typewriter() {
    var box = cinema.querySelector('.cinema-type');
    var out = document.getElementById('type-out');
    if (!box || !out) return;

    var lines = [];
    try {
      lines = JSON.parse(box.getAttribute('data-type-lines') || '[]');
    } catch (e) {
      lines = [];
    }
    if (!lines.length) return;

    if (reduce) {
      out.textContent = lines.join(' ');
      box.classList.add('is-in');
      return;
    }

    var started = false;

    function typeLine(text, prefix, done) {
      var i = 0;
      function tick() {
        out.textContent = prefix + text.slice(0, i);
        i += 1;
        if (i <= text.length) {
          setTimeout(tick, 18 + Math.random() * 22);
        } else if (done) {
          done();
        }
      }
      tick();
    }

    function run() {
      if (started) return;
      started = true;
      box.classList.add('is-in');
      var idx = 0;
      var built = '';
      function next() {
        if (idx >= lines.length) return;
        var line = lines[idx];
        var prefix = built;
        idx += 1;
        typeLine(line, prefix, function () {
          built = prefix + line;
          if (idx < lines.length) {
            built += ' ';
            setTimeout(next, 420);
          }
        });
      }
      next();
    }

    var io = new IntersectionObserver(
      function (entries) {
        entries.forEach(function (entry) {
          if (!entry.isIntersecting) return;
          run();
          io.unobserve(box);
        });
      },
      { threshold: 0.4 }
    );
    io.observe(box);
  })();

  /* ---------- deck cards reveal ---------- */

  (function deck() {
    var cards = Array.prototype.slice.call(cinema.querySelectorAll('.cinema-card'));
    if (!cards.length) return;

    if (reduce) {
      cards.forEach(function (c) { c.classList.add('is-in'); });
      return;
    }

    var io = new IntersectionObserver(
      function (entries) {
        entries.forEach(function (entry) {
          if (!entry.isIntersecting) return;
          var el = entry.target;
          var delay = Array.prototype.indexOf.call(el.parentNode.children, el) * 90;
          setTimeout(function () { el.classList.add('is-in'); }, delay);
          io.unobserve(el);
        });
      },
      { threshold: 0.2 }
    );
    cards.forEach(function (c) { io.observe(c); });
  })();

  /* ---------- marquee: pause when offscreen / tab hidden ---------- */

  (function marquee() {
    var track = cinema.querySelector('.cinema-marquee-track');
    if (!track) return;
    if (reduce) {
      track.style.animation = 'none';
      return;
    }

    var root = cinema.querySelector('.cinema-marquee');
    if (!root) return;

    var io = new IntersectionObserver(
      function (entries) {
        entries.forEach(function (entry) {
          root.classList.toggle('is-paused', !entry.isIntersecting);
        });
      },
      { threshold: 0.05 }
    );
    io.observe(root);

    document.addEventListener('visibilitychange', function () {
      root.classList.toggle('is-paused', document.hidden);
    });
  })();
})();
