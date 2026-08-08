(function () {
  var root = document.documentElement;
  var themeToggle = document.getElementById('themeToggle');
  if (themeToggle) {
    var setPressed = function () {
      themeToggle.setAttribute('aria-pressed', root.getAttribute('data-theme') === 'dark' ? 'true' : 'false');
    };
    setPressed();
    themeToggle.addEventListener('click', function () {
      var next = root.getAttribute('data-theme') === 'dark' ? 'light' : 'dark';
      root.setAttribute('data-theme', next);
      try { localStorage.setItem('bp-theme', next); } catch (e) {}
      setPressed();
    });
  }

  var body = document.body;
  var toggle = document.getElementById('navToggle');
  var menu = document.getElementById('menu');
  var reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  if (toggle && menu) {
    toggle.addEventListener('click', function () {
      var open = body.classList.toggle('menu-open');
      toggle.setAttribute('aria-expanded', open ? 'true' : 'false');
    });
    menu.addEventListener('click', function (event) {
      if (event.target.tagName === 'A') {
        body.classList.remove('menu-open');
        toggle.setAttribute('aria-expanded', 'false');
      }
    });
  }

  var nav = document.querySelector('.nav');
  function updateNav() {
    if (nav) nav.classList.toggle('nav--scrolled', window.scrollY > 8);
  }
  updateNav();
  window.addEventListener('scroll', updateNav, { passive: true });

  var revealEls = document.querySelectorAll('.reveal');
  if ('IntersectionObserver' in window && !reduce) {
    var observer = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) {
          entry.target.classList.add('is-in');
          observer.unobserve(entry.target);
        }
      });
    }, { threshold: 0.12 });
    revealEls.forEach(function (el) { observer.observe(el); });
  } else {
    revealEls.forEach(function (el) { el.classList.add('is-in'); });
  }

  var bomList = document.getElementById('bomList');
  var spotLayer = document.getElementById('explorerSpots');
  var readout = document.getElementById('explorerReadout');
  if (bomList && spotLayer && readout) {
    var groupNames = {
      basis: 'Grundgestell',
      press: 'Pressmechanik',
      antrieb: 'Antrieb & Lager',
      deckel: 'Deckel & Verriegelung',
      sensor: 'Sensorik'
    };
    var rows = Array.prototype.slice.call(bomList.querySelectorAll('.bom__row'));
    var spots = {};
    var selected = null;

    rows.forEach(function (row) {
      var x = row.getAttribute('data-x');
      if (!x) return;
      var pos = row.getAttribute('data-pos');
      var spot = document.createElement('button');
      spot.type = 'button';
      spot.className = 'spot';
      spot.style.setProperty('--x', x + '%');
      spot.style.setProperty('--y', row.getAttribute('data-y') + '%');
      spot.setAttribute('data-pos', pos);
      spot.setAttribute('aria-label', 'Position ' + pos + ': ' + row.querySelector('.bom__name').textContent);
      spotLayer.appendChild(spot);
      spots[pos] = spot;
    });

    function select(pos) {
      selected = pos;
      rows.forEach(function (r) { r.classList.toggle('is-selected', r.getAttribute('data-pos') === pos); });
      Object.keys(spots).forEach(function (p) { spots[p].classList.toggle('is-selected', p === pos); });

      var row = rows.filter(function (r) { return r.getAttribute('data-pos') === pos; })[0];
      if (!row) return;
      var name = row.querySelector('.bom__name').textContent;
      var pn = row.querySelector('.bom__pn').textContent;
      var qty = row.querySelector('.bom__qty').textContent.replace('×', '');
      var grp = groupNames[row.getAttribute('data-group')] || '';
      var marked = row.getAttribute('data-x') ? '' : ' · nicht einzeln beziffert';

      var el = function (tag, cls, text) {
        var n = document.createElement(tag);
        if (cls) n.className = cls;
        if (text != null) n.textContent = text;
        return n;
      };
      var pair = function (label, value) {
        var d = document.createElement('div');
        d.appendChild(el('dt', null, label));
        d.appendChild(el('dd', null, value));
        return d;
      };

      var top = el('div', 'readout__top');
      top.appendChild(el('span', 'readout__no', 'Pos. ' + pos));
      top.appendChild(el('span', 'readout__group', grp + marked));

      var meta = el('dl', 'readout__meta');
      meta.appendChild(pair('Teilenummer', pn));
      meta.appendChild(pair('Menge', qty));

      readout.replaceChildren(top, el('p', 'readout__name', name), meta);
    }

    rows.forEach(function (row) {
      row.addEventListener('click', function () { select(row.getAttribute('data-pos')); });
    });
    Object.keys(spots).forEach(function (p) {
      spots[p].addEventListener('click', function () {
        select(p);
        var row = rows.filter(function (r) { return r.getAttribute('data-pos') === p; })[0];
        if (row) row.scrollIntoView({ block: 'nearest', behavior: reduce ? 'auto' : 'smooth' });
      });
    });

    var chips = Array.prototype.slice.call(document.querySelectorAll('.explorer__filters .chip'));
    chips.forEach(function (chip) {
      chip.addEventListener('click', function () {
        var group = chip.getAttribute('data-group');
        chips.forEach(function (c) { c.classList.toggle('is-active', c === chip); });
        rows.forEach(function (r) {
          r.classList.toggle('is-hidden', group !== 'all' && r.getAttribute('data-group') !== group);
        });
        Object.keys(spots).forEach(function (p) {
          var row = rows.filter(function (r) { return r.getAttribute('data-pos') === p; })[0];
          var match = group === 'all' || (row && row.getAttribute('data-group') === group);
          spots[p].classList.toggle('is-dimmed', !match);
        });
        if (selected) {
          var selRow = rows.filter(function (r) { return r.getAttribute('data-pos') === selected; })[0];
          if (selRow && selRow.classList.contains('is-hidden')) {
            selected = null;
            rows.forEach(function (r) { r.classList.remove('is-selected'); });
            Object.keys(spots).forEach(function (p) { spots[p].classList.remove('is-selected'); });
            var hint = document.createElement('p');
            hint.className = 'explorer__hint';
            hint.textContent = 'Position wählen, um Teilenummer, Benennung und Menge zu sehen.';
            readout.replaceChildren(hint);
          }
        }
      });
    });
  }

  var pressDemo = document.getElementById('pressDemo');
  var demoToggle = document.getElementById('demoToggle');
  if (pressDemo && demoToggle) {
    demoToggle.addEventListener('click', function () {
      var pressed = pressDemo.classList.toggle('is-pressed');
      demoToggle.setAttribute('aria-pressed', pressed ? 'true' : 'false');
      demoToggle.textContent = pressed ? 'Zurücksetzen' : 'Pressvorgang simulieren';
    });

    if ('IntersectionObserver' in window && !reduce) {
      var demoObserver = new IntersectionObserver(function (entries) {
        entries.forEach(function (entry) {
          if (entry.isIntersecting) {
            window.setTimeout(function () { pressDemo.classList.add('is-pressed'); }, 350);
            demoObserver.unobserve(entry.target);
          }
        });
      }, { threshold: 0.55 });
      demoObserver.observe(pressDemo);
    }
  }
})();
