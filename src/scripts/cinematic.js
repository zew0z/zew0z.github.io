/* zew0z.github.io - cinematic homepage
   one pinned stage: boot log → terminal swarm → ascii climax
   IntersectionObserver only (no scroll listeners) */

(function () {
  'use strict';

  var cinema = document.getElementById('cinema');
  var stage = document.getElementById('cinema-stage');
  if (!cinema || !stage) return;

  var reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var bootLines = Array.prototype.slice.call(stage.querySelectorAll('[data-boot-line]'));
  var terms = Array.prototype.slice.call(stage.querySelectorAll('[data-cascade]'));
  var fill = document.getElementById('boot-fill');
  var pctEl = document.getElementById('boot-pct');
  var hudPct = document.getElementById('boot-hud-pct');
  var labelEl = document.getElementById('boot-label');
  var climax = document.getElementById('ascii-reveal');
  var typeBox = cinema.querySelector('.cinema-type');
  var typeOut = document.getElementById('type-out');
  var typeOut2 = document.getElementById('type-out-2');
  var typeRow2 = document.getElementById('type-row-2');
  var typeCur1 = document.getElementById('type-cursor-1');
  var hudTty = document.getElementById('boot-hud-tty');
  var fall = document.getElementById('cinema-fall');
  var asciiPre = climax ? climax.querySelector('.ascii-hero') : null;

  var bootAt = -1;
  var swarmAt = -1;
  var climaxOn = false;
  var typed = false;
  var scrambled = false;

  function pad2(n) {
    return (n < 10 ? '0' : '') + n;
  }

  function setBoot(idx) {
    if (idx <= bootAt) return;
    for (var i = bootAt + 1; i <= idx && i < bootLines.length; i++) {
      bootLines[i].classList.add('is-on');
    }
    bootAt = Math.max(bootAt, idx);
    var n = bootLines.length;
    var p = Math.round(((bootAt + 1) / n) * 100);
    if (fill) fill.style.transform = 'scaleX(' + ((bootAt + 1) / n) + ')';
    if (pctEl) pctEl.textContent = pad2(Math.min(100, p));
    if (hudPct) hudPct.textContent = pad2(Math.min(100, p)) + '%';
    bootLines.forEach(function (line, i) {
      line.classList.toggle('is-head', i === bootAt);
    });
    if (bootAt >= n - 1) {
      stage.classList.add('is-booted');
      if (labelEl) labelEl.textContent = 'online';
    }
    if (hudTty && !stage.classList.contains('is-swarm')) hudTty.textContent = 'tty1';
  }

  function setSwarm(idx) {
    if (idx < 0) return;
    setBoot(bootLines.length - 1);
    stage.classList.add('is-swarm');
    if (hudTty) hudTty.textContent = 'pts/0';
    if (idx <= swarmAt) return;
    for (var i = swarmAt + 1; i <= idx && i < terms.length; i++) {
      (function (el) {
        el.classList.add('is-in');
        window.setTimeout(function () { typeTerm(el); }, 180);
      })(terms[i]);
    }
    swarmAt = Math.max(swarmAt, idx);
  }

  function typeTerm(el) {
    if (!el || el.getAttribute('data-typed') === '1') return;
    el.setAttribute('data-typed', '1');
    var lines = Array.prototype.slice.call(el.querySelectorAll('.cinema-term-line'));
    var payloads = lines.map(function (line) {
      return { el: line, text: line.textContent.replace(/\n$/, '') };
    });
    lines.forEach(function (line) { line.textContent = ''; });
    el.classList.add('is-typed');
    if (reduce) {
      payloads.forEach(function (p) { p.el.textContent = p.text + '\n'; });
      return;
    }
    var li = 0;
    function nextLine() {
      if (li >= payloads.length) return;
      var p = payloads[li];
      li += 1;
      var i = 0;
      function tick() {
        p.el.textContent = p.text.slice(0, i) + (i < p.text.length ? '' : '\n');
        i += 1;
        if (i <= p.text.length) window.setTimeout(tick, 12 + Math.random() * 18);
        else window.setTimeout(nextLine, 90);
      }
      tick();
    }
    nextLine();
  }

  function scrambleAscii() {
    if (!asciiPre || scrambled) return;
    scrambled = true;
    var original = asciiPre.textContent;
    asciiPre.setAttribute('data-ascii', original);
    if (reduce) return;
    var glyphs = '01█▓▒░╔╗╚╝║═#*$<>/\\+=';
    var frames = 14;
    var f = 0;
    function tick() {
      var out = '';
      var progress = f / frames;
      for (var i = 0; i < original.length; i++) {
        var ch = original.charAt(i);
        if (ch === '\n' || ch === ' ') out += ch;
        else if (Math.random() < progress * progress) out += ch;
        else out += glyphs.charAt(Math.floor(Math.random() * glyphs.length));
      }
      asciiPre.textContent = out;
      f += 1;
      if (f <= frames) window.setTimeout(tick, 38);
      else asciiPre.textContent = original;
    }
    tick();
  }

  function typeInto(el, text, done) {
    if (!el) {
      if (done) done();
      return;
    }
    if (reduce) {
      el.textContent = text;
      if (done) done();
      return;
    }
    var i = 0;
    function tick() {
      el.textContent = text.slice(0, i);
      i += 1;
      if (i <= text.length) window.setTimeout(tick, 16 + Math.random() * 28);
      else if (done) done();
    }
    tick();
  }

  function typeLine() {
    if (typed || !typeBox || !typeOut) return;
    typed = true;
    var text = typeBox.getAttribute('data-type-line') || '';
    var text2 = typeBox.getAttribute('data-type-line-2') || '';
    typeBox.classList.add('is-in');
    if (reduce) {
      typeOut.textContent = text;
      if (typeOut2) typeOut2.textContent = text2;
      if (typeRow2) typeRow2.classList.add('is-on');
      var typeGoR = document.getElementById('type-go');
      if (typeGoR) typeGoR.classList.add('is-on');
      return;
    }
    window.setTimeout(function () {
      typeInto(typeOut, text, function () {
        if (typeCur1) typeCur1.classList.add('is-off');
        if (typeRow2) typeRow2.classList.add('is-on');
        window.setTimeout(function () {
          typeInto(typeOut2, text2, function () {
            var typeGo = document.getElementById('type-go');
            if (typeGo) typeGo.classList.add('is-on');
          });
        }, 220);
      });
    }, 420);
  }

  function setClimax() {
    if (climaxOn) return;
    climaxOn = true;
    setSwarm(terms.length - 1);
    if (hudTty) hudTty.textContent = 'console';
    scrambleAscii();
    stage.classList.add('is-climax');
    if (climax) climax.classList.add('is-in');
    typeLine();
  }

  function freezeAll() {
    setBoot(bootLines.length - 1);
    terms.forEach(function (t) {
      t.classList.add('is-in');
      typeTerm(t);
    });
    scrambled = true;
    stage.classList.add('is-booted', 'is-swarm', 'is-climax', 'is-static');
    if (climax) climax.classList.add('is-in');
    if (hudTty) hudTty.textContent = 'console';
    if (typeBox && typeOut) {
      typeOut.textContent = typeBox.getAttribute('data-type-line') || '';
      if (typeOut2) typeOut2.textContent = typeBox.getAttribute('data-type-line-2') || '';
      if (typeRow2) typeRow2.classList.add('is-on');
      if (typeCur1) typeCur1.classList.add('is-off');
      typeBox.classList.add('is-in');
    }
    var typeGo = document.getElementById('type-go');
    if (typeGo) typeGo.classList.add('is-on');
    cinema.querySelectorAll('.cinema-card').forEach(function (c) { c.classList.add('is-in'); });
  }

  var skipCinema = location.hash === '#playground' || location.hash === '#guest-term';

  if (reduce || skipCinema) {
    freezeAll();
  } else {
    setBoot(Math.min(1, bootLines.length - 1));

    var beats = Array.prototype.slice.call(stage.querySelectorAll('.cinema-beat'));
    var io = new IntersectionObserver(
      function (entries) {
        entries.forEach(function (entry) {
          if (!entry.isIntersecting) return;
          var kind = entry.target.getAttribute('data-kind');
          var i = parseInt(entry.target.getAttribute('data-i'), 10);
          if (kind === 'boot') setBoot(i);
          else if (kind === 'swarm') setSwarm(i);
          else if (kind === 'climax') setClimax();
        });
      },
      { threshold: 0.4, rootMargin: '0px 0px -15% 0px' }
    );
    beats.forEach(function (b) { io.observe(b); });
  }

  var cards = Array.prototype.slice.call(cinema.querySelectorAll('.cinema-card'));
  if (cards.length && !reduce) {
    var cardIo = new IntersectionObserver(
      function (entries) {
        entries.forEach(function (entry) {
          if (!entry.isIntersecting) return;
          var el = entry.target;
          var delay = Array.prototype.indexOf.call(el.parentNode.children, el) * 80;
          window.setTimeout(function () { el.classList.add('is-in'); }, delay);
          cardIo.unobserve(el);
        });
      },
      { threshold: 0.18 }
    );
    cards.forEach(function (c) { cardIo.observe(c); });
  }

  var fallRoot = fall;
  if (fallRoot) {
    if (reduce) {
      fallRoot.style.display = 'none';
    } else {
      var fallIo = new IntersectionObserver(
        function (entries) {
          entries.forEach(function (entry) {
            fallRoot.classList.toggle('is-paused', !entry.isIntersecting);
          });
        },
        { threshold: 0.05 }
      );
      fallIo.observe(stage);
      document.addEventListener('visibilitychange', function () {
        fallRoot.classList.toggle('is-paused', document.hidden);
      });
    }
  }
  var root = cinema.querySelector('.cinema-marquee');
  var track = cinema.querySelector('.cinema-marquee-track');
  if (root && track) {
    if (reduce) {
      track.style.animation = 'none';
    } else {
      var mIo = new IntersectionObserver(
        function (entries) {
          entries.forEach(function (entry) {
            root.classList.toggle('is-paused', !entry.isIntersecting);
          });
        },
        { threshold: 0.05 }
      );
      mIo.observe(root);
      document.addEventListener('visibilitychange', function () {
        root.classList.toggle('is-paused', document.hidden);
      });
    }
  }
})();
