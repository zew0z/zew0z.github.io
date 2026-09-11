/* zew0z.github.io - vim-ish command palette
   open with ':' or Ctrl/Cmd+K anywhere; ':wq' has opinions */

(function () {
  'use strict';

  var TARGETS = [
    { name: 'cd ~', hint: 'home', url: '/' },
    { name: 'cd portfolio', hint: 'tools, clients, disciplines', url: '/portfolio.html' },
    { name: 'cd writeups', hint: 'the catalog', url: '/writeups.html' },
    { name: 'cat feed.xml', hint: 'rss feed', url: '/feed.xml' },
    { name: 'open github', hint: 'github.com/zew0z', ext: true, url: 'https://github.com/zew0z' },
    { name: 'open ko-fi', hint: 'ko-fi.com/zew0z', ext: true, url: 'https://ko-fi.com/zew0z' },
    { name: 'matrix', hint: 'you know what this does', cmd: 'matrix' }
  ];

  var root, input, list, lastFocus;
  var items = [];
  var sel = 0;

  function make(tag, cls, text) {
    var node = document.createElement(tag);
    if (cls) node.className = cls;
    if (text !== undefined) node.textContent = text;
    return node;
  }

  function build() {
    root = make('div', 'palette');
    root.id = 'palette';
    root.hidden = true;
    root.setAttribute('role', 'dialog');
    root.setAttribute('aria-modal', 'true');
    root.setAttribute('aria-label', 'command palette');

    var box = make('div', 'palette-box');
    var row = make('div', 'palette-input-row');
    row.appendChild(make('span', 'palette-prefix', ':'));
    input = make('input', 'palette-input');
    input.type = 'text';
    input.spellcheck = false;
    input.autocomplete = 'off';
    input.setAttribute('aria-label', 'type a command. try cd writeups, grep <query>, or :wq');
    row.appendChild(input);
    box.appendChild(row);

    list = make('div', 'palette-list');
    list.setAttribute('role', 'listbox');
    list.setAttribute('aria-label', 'commands');
    box.appendChild(list);

    root.appendChild(box);
    document.body.appendChild(root);

    root.addEventListener('mousedown', function (e) {
      if (e.target === root) { e.preventDefault(); close(); }
    });
    input.addEventListener('input', function () { render(input.value); });
    list.addEventListener('click', function (e) {
      var item = e.target.closest('.palette-item');
      if (item && item.dataset.idx !== undefined) { sel = Number(item.dataset.idx); runCurrent(); }
    });
  }

  function open() {
    lastFocus = document.activeElement;
    root.hidden = false;
    requestAnimationFrame(function () { root.classList.add('open'); });
    input.value = '';
    sel = 0;
    render('');
    document.documentElement.style.overflow = 'hidden';
    input.focus();
  }

  function close() {
    root.classList.remove('open');
    document.documentElement.style.overflow = '';
    setTimeout(function () { root.hidden = true; }, 160);
    if (lastFocus && lastFocus.focus) lastFocus.focus();
  }

  function isOpen() { return !root.hidden; }

  function matches(q) {
    q = q.trim().toLowerCase();
    if (!q) return TARGETS.slice();
    var filtered = TARGETS.filter(function (t) { return t.name.toLowerCase().indexOf(q) !== -1; });
    if (q === ':wq' || q === 'wq') {
      return [{ name: ':wq', hint: 'write, quit, pretend', cmd: 'wq' }];
    }
    if (q === ':q' || q === ':q!' || q === 'q') {
      return [{ name: ':q', hint: 'quit', cmd: 'quit' }];
    }
    filtered.push({
      name: 'grep -i "' + q.slice(0, 48) + '" writeups/*',
      hint: 'search the catalog',
      url: '/writeups.html?q=' + encodeURIComponent(q.slice(0, 80))
    });
    return filtered;
  }

  function render(q) {
    items = matches(q);
    sel = 0;
    list.innerHTML = '';
    if (!items.length) {
      list.appendChild(make('div', 'palette-empty', 'no such command. try cd, grep, or :wq'));
      return;
    }
    items.forEach(function (item, i) {
      var row = make('div', 'palette-item' + (i === sel ? ' is-active' : ''));
      row.setAttribute('role', 'option');
      row.setAttribute('aria-selected', i === sel ? 'true' : 'false');
      row.dataset.idx = String(i);
      row.appendChild(make('span', null, item.name));
      row.appendChild(make('span', 'hint', item.hint + (item.ext ? ' ↗' : '')));
      list.appendChild(row);
    });
  }

  function move(delta) {
    if (!items.length) return;
    sel = (sel + delta + items.length) % items.length;
    Array.prototype.forEach.call(list.children, function (child, i) {
      child.classList.toggle('is-active', i === sel);
      child.setAttribute('aria-selected', i === sel ? 'true' : 'false');
    });
    list.children[sel].scrollIntoView({ block: 'nearest' });
  }

  function runCurrent() {
    var item = items[sel];
    if (!item) return;
    if (item.cmd === 'wq') {
      close();
      if (window.zew0z) window.zew0z.achieve('vim');
      if (window.zew0z) window.zew0z.toast('[ ok ] changes written. to what? unclear.');
      return;
    }
    if (item.cmd === 'quit') { close(); return; }
    if (item.cmd === 'matrix') { close(); if (window.zew0z) window.zew0z.matrixRain(); return; }
    if (item.ext) window.open(item.url, '_blank', 'noopener');
    else window.location.href = item.url;
  }

  document.addEventListener('keydown', function (e) {
    if ((e.metaKey || e.ctrlKey) && !e.shiftKey && !e.altKey && (e.key === 'k' || e.key === 'K')) {
      e.preventDefault();
      if (!root) build();
      isOpen() ? close() : open();
      return;
    }
    if (!root) {
      if (e.key === ':' && !e.metaKey && !e.ctrlKey && !e.altKey &&
          !/^(INPUT|TEXTAREA|SELECT)$/.test(document.activeElement.tagName) &&
          !document.activeElement.isContentEditable) {
        e.preventDefault();
        build();
        open();
      }
      return;
    }
    if (root.hidden) {
      if (e.key === ':' && !e.metaKey && !e.ctrlKey && !e.altKey &&
          !/^(INPUT|TEXTAREA|SELECT)$/.test(document.activeElement.tagName) &&
          !document.activeElement.isContentEditable) {
        e.preventDefault();
        open();
      }
      return;
    }
    if (e.key === 'Escape') { e.preventDefault(); close(); }
    else if (e.key === 'ArrowDown') { e.preventDefault(); move(1); }
    else if (e.key === 'ArrowUp') { e.preventDefault(); move(-1); }
    else if (e.key === 'Enter') { e.preventDefault(); runCurrent(); }
  });
})();
