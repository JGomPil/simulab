/* Modo clase · SimuLab UVa
 * Capa de presentación común a todos los simuladores: muestra un panel cada vez,
 * sin scroll de página, con texto más grande y navegación por teclado o mando.
 * No toca la lógica de las apps: solo reorganiza <main> (columna de paneles + <aside>).
 *
 * Enlace directo a un panel: simulador.html#aula=2
 * Teclas: C modo clase · ←/→ panel · AvPág/RePág desplazan y luego cambian de panel
 *         L columna lateral · +/- texto · P pantalla completa · Esc salir
 */
(function () {
  'use strict';

  if (!document.querySelector('link[rel~="icon"]')) {
    var icon = document.createElement('link');
    icon.rel = 'icon';
    icon.href = "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 32 32'%3E%3Crect width='32' height='32' rx='7' fill='%230b1220'/%3E%3Cpath d='M3 17h6l3-9 5 17 4-12 2 4h6' fill='none' stroke='%2322d3ee' stroke-width='2.6' stroke-linecap='round' stroke-linejoin='round'/%3E%3C/svg%3E";
    document.head.appendChild(icon);
  }

  var main = document.querySelector('main');
  var col = main && main.firstElementChild;
  var aside = main && main.querySelector('aside');
  if (!col || !col.querySelector('section')) return;

  var SCALES = [1, 1.125, 1.25, 1.4, 1.6];
  var state = { on: false, idx: 0, scale: 2, side: true, scrollY: 0 };
  var bar, pills, sideBtn, fsBtn, pillSignature;

  function load(key) { try { return localStorage.getItem('aula.' + key); } catch (e) { return null; } }
  function save(key, value) { try { localStorage.setItem('aula.' + key, value); } catch (e) { /* sin almacenamiento */ } }

  var savedScale = parseInt(load('scale'), 10);
  if (savedScale >= 0 && savedScale < SCALES.length) state.scale = savedScale;

  /* --- Estilos ---------------------------------------------------------- */
  var css = [
    '.aula-open{font:600 .78rem/1 system-ui,sans-serif;color:#0b1220;background:#22d3ee;border:0;border-radius:9999px;padding:.45rem .9rem;min-height:32px;cursor:pointer;white-space:nowrap}',
    '.aula-open:hover{background:#67e8f9}',
    '.aula-hd-actions{display:inline-flex;align-items:center;gap:.5rem}',
    '@media (max-width:699px){.aula-open{display:none}}',
    '#aula-bar{display:none}',
    'html.aula,html.aula body{height:100%;overflow:hidden}',
    'html.aula body{display:flex;flex-direction:column;max-width:none!important;margin:0!important;padding:0!important;height:100dvh}',
    'html.aula body>header,html.aula #nl-foot{display:none!important}',
    'html.aula #aula-bar{display:flex;align-items:center;gap:.5rem;flex:none;padding:.4rem .75rem;background:#0b1220;border-bottom:1px solid #1e293b;color:#e2e8f0}',
    '#aula-bar .aula-title{font-weight:700;color:#fff;margin-right:.5rem;white-space:nowrap}',
    '#aula-bar .aula-pills{display:flex;gap:.3rem;flex:1;min-width:0;overflow-x:auto}',
    '#aula-bar button{font:600 .85rem/1 system-ui,sans-serif;color:#e2e8f0;background:#111b30;border:1px solid #334155;border-radius:.5rem;min-width:40px;min-height:40px;padding:0 .6rem;cursor:pointer;flex:none}',
    '#aula-bar button:hover{border-color:#22d3ee}',
    '#aula-bar button[aria-current="true"],#aula-bar button[aria-pressed="true"]{background:#06323d;border-color:#22d3ee;color:#22d3ee}',
    '#aula-bar button:focus-visible{outline:2px solid #a78bfa;outline-offset:2px}',
    '#aula-bar .aula-sep{width:1px;align-self:stretch;margin:.25rem .15rem;background:#1e293b;flex:none}',
    'html.aula main{display:flex!important;gap:.75rem;flex:1;min-height:0;padding:.75rem;position:relative}',
    'html.aula main>:first-child{flex:1;min-width:0;overflow-y:auto;position:relative}',
    'html.aula main>aside{flex:none;width:clamp(300px,30vw,460px);overflow-y:auto;position:static!important}',
    'html.aula.aula-noside main>aside{display:none!important}',
    'html.aula main section{margin:0!important}',
    /* Textos de enlace entre paneles (p. ej. «▼ ICA descompone…»): sin el panel vecino no significan nada */
    'html.aula main>:first-child>:not(section):not(:has(section)),html.aula main>:first-child>:has(>section)>:not(section){display:none!important}',
    /* Fuera de pantalla y con su ancho real: los canvas siguen dibujando sin medir 0 */
    'html.aula main section.aula-off{position:absolute!important;left:-200vw;top:0;width:var(--aula-w,800px);height:0;padding:0;border:0;overflow:hidden;visibility:hidden;pointer-events:none}'
  ].join('\n');
  var styleEl = document.createElement('style');
  styleEl.textContent = css;
  document.head.appendChild(styleEl);

  /* --- Rótulos de canvas: las apps fijan tamaños en px; en modo clase se escalan ---- */
  var fontProp = Object.getOwnPropertyDescriptor(CanvasRenderingContext2D.prototype, 'font');
  if (fontProp && fontProp.set) {
    Object.defineProperty(CanvasRenderingContext2D.prototype, 'font', {
      configurable: true,
      get: fontProp.get,
      set: function (value) {
        var scaled = !state.on ? value : String(value).replace(/(\d+(?:\.\d+)?)px/, function (m, px) {
          return (parseFloat(px) * SCALES[state.scale]).toFixed(1) + 'px';
        });
        fontProp.set.call(this, scaled);
      }
    });
  }

  /* --- Paneles ---------------------------------------------------------- */
  // Las apps revelan paneles según el ejercicio, a veces ocultando su contenedor: esos no cuentan.
  function panels() {
    return [].slice.call(col.querySelectorAll('section')).filter(function (s) {
      return getComputedStyle(s).display !== 'none' && s.parentElement.getClientRects().length > 0;
    });
  }

  function panelLabel(section, i) {
    var badge = section.querySelector('.bd');
    return (badge && badge.textContent.trim()) || String(i + 1);
  }

  function panelTitle(section) {
    var head = section.querySelector('.hd');
    if (!head) return '';
    var copy = head.cloneNode(true);
    [].forEach.call(copy.querySelectorAll('.bd,button,select,input,label'), function (n) { n.remove(); });
    return copy.textContent.replace(/\s+/g, ' ').trim();
  }

  function redraw() {
    document.documentElement.style.setProperty('--aula-w', col.clientWidth + 'px');
    window.dispatchEvent(new Event('resize'));
  }

  function renderPills(list) {
    var signature = state.idx + '|' + list.length;
    if (signature === pillSignature) return;   // no recrear botones: se perdería el foco
    pillSignature = signature;
    pills.textContent = '';
    list.forEach(function (section, i) {
      var b = document.createElement('button');
      var title = panelTitle(section);
      b.type = 'button';
      b.textContent = panelLabel(section, i);
      b.title = title;
      b.setAttribute('aria-label', 'Panel ' + panelLabel(section, i) + (title ? ': ' + title : ''));
      if (i === state.idx) b.setAttribute('aria-current', 'true');
      b.addEventListener('click', function () { go(i); });
      pills.appendChild(b);
    });
  }

  function apply() {
    var list = panels();
    // Seguir en el mismo panel aunque aparezcan o desaparezcan otros antes que él.
    var kept = list.indexOf(state.current);
    if (kept >= 0) state.idx = kept;
    else if (state.idx >= list.length) state.idx = Math.max(0, list.length - 1);
    state.current = list[state.idx] || null;
    [].forEach.call(col.querySelectorAll('section'), function (s) {
      s.classList.toggle('aula-off', s !== state.current);
    });
    renderPills(list);
  }

  function go(i) {
    var n = panels().length;
    if (!n) return;
    state.idx = Math.max(0, Math.min(n - 1, i));
    state.current = null;
    apply();
    col.scrollTop = 0;
    if (state.on) {
      try { history.replaceState(null, '', '#aula=' + (state.idx + 1)); } catch (e) { /* file:// */ }
    }
    redraw();
  }

  /* --- Controles -------------------------------------------------------- */
  function setScale(i) {
    state.scale = Math.max(0, Math.min(SCALES.length - 1, i));
    save('scale', state.scale);
    if (state.on) {
      document.documentElement.style.fontSize = (16 * SCALES[state.scale]) + 'px';
      redraw();
    }
  }

  function setSide(show) {
    state.side = !!(show && aside);
    document.documentElement.classList.toggle('aula-noside', !state.side);
    if (sideBtn) sideBtn.setAttribute('aria-pressed', String(state.side));
    if (state.on) redraw();
  }

  function fsSupported() { return !!document.documentElement.requestFullscreen; }

  function toggleFullscreen() {
    if (!fsSupported()) return;
    if (document.fullscreenElement) document.exitFullscreen();
    else document.documentElement.requestFullscreen().catch(function () { /* denegado */ });
  }

  function makeButton(text, title, onClick) {
    var b = document.createElement('button');
    b.type = 'button';
    b.textContent = text;
    b.title = title;
    b.setAttribute('aria-label', title);
    b.addEventListener('click', onClick);
    return b;
  }

  function separator() {
    var s = document.createElement('span');
    s.className = 'aula-sep';
    return s;
  }

  function buildBar() {
    bar = document.createElement('div');
    bar.id = 'aula-bar';
    bar.setAttribute('role', 'toolbar');
    bar.setAttribute('aria-label', 'Modo clase');

    var name = document.createElement('span');
    name.className = 'aula-title';
    var h1 = document.querySelector('h1');
    name.textContent = h1 && h1.firstChild ? h1.firstChild.textContent.trim() : document.title;
    bar.appendChild(name);

    bar.appendChild(makeButton('←', 'Panel anterior (←)', function () { go(state.idx - 1); }));
    pills = document.createElement('div');
    pills.className = 'aula-pills';
    bar.appendChild(pills);
    bar.appendChild(makeButton('→', 'Panel siguiente (→)', function () { go(state.idx + 1); }));
    bar.appendChild(separator());
    bar.appendChild(makeButton('A−', 'Reducir texto (−)', function () { setScale(state.scale - 1); }));
    bar.appendChild(makeButton('A+', 'Aumentar texto (+)', function () { setScale(state.scale + 1); }));
    if (aside) {
      var hasControls = aside.querySelector('input,select,button');
      sideBtn = makeButton(hasControls ? 'Controles' : 'Consulta', 'Mostrar u ocultar la columna lateral (L)', function () { setSide(!state.side); });
      bar.appendChild(sideBtn);
    }
    if (fsSupported()) {
      fsBtn = makeButton('⛶', 'Pantalla completa (P)', toggleFullscreen);
      bar.appendChild(fsBtn);
    }
    bar.appendChild(separator());
    bar.appendChild(makeButton('✕', 'Salir del modo clase (Esc)', function () { toggle(false); }));
    document.body.insertBefore(bar, main);
  }

  /* --- Entrar y salir --------------------------------------------------- */
  function toggle(on) {
    if (on === state.on) return;
    state.on = on;
    var root = document.documentElement;
    if (on) {
      state.scrollY = window.scrollY;
      root.classList.add('aula');
      root.style.fontSize = (16 * SCALES[state.scale]) + 'px';
      // Si la columna lateral solo trae material de consulta, se cede el espacio al panel.
      setSide(aside && aside.querySelector('input,select,button'));
      go(state.idx);
    } else {
      root.classList.remove('aula', 'aula-noside');
      root.style.fontSize = '';
      root.style.removeProperty('--aula-w');
      [].forEach.call(col.querySelectorAll('section'), function (s) { s.classList.remove('aula-off'); });
      if (document.fullscreenElement) document.exitFullscreen();
      try { history.replaceState(null, '', location.pathname + location.search); } catch (e) { /* file:// */ }
      window.dispatchEvent(new Event('resize'));
      window.scrollTo(0, state.scrollY);
    }
  }

  /* --- Teclado: nunca se roban teclas a controles ni a canvas enfocables ---- */
  function belongsToControl(t) {
    return /^(INPUT|SELECT|TEXTAREA)$/.test(t.tagName) || t.isContentEditable || t.tagName === 'CANVAS';
  }

  function pageStep(dir) {
    var max = col.scrollHeight - col.clientHeight;
    var atEdge = dir > 0 ? col.scrollTop >= max - 2 : col.scrollTop <= 2;
    if (atEdge) go(state.idx + dir);
    else col.scrollBy({ top: dir * col.clientHeight * 0.85 });
  }

  document.addEventListener('keydown', function (e) {
    if (e.ctrlKey || e.metaKey || e.altKey || belongsToControl(e.target)) return;
    if (!state.on) {
      if (e.key === 'c' || e.key === 'C') toggle(true);
      return;
    }
    var handled = true;
    switch (e.key) {
      case 'ArrowRight': go(state.idx + 1); break;
      case 'ArrowLeft': go(state.idx - 1); break;
      case 'PageDown': pageStep(1); break;
      case 'PageUp': pageStep(-1); break;
      case '+': case '=': setScale(state.scale + 1); break;
      case '-': setScale(state.scale - 1); break;
      case 'l': case 'L': setSide(!state.side); break;
      case 'p': case 'P': toggleFullscreen(); break;
      case 'c': case 'C': case 'Escape': toggle(false); break;
      default: handled = false;
    }
    if (handled) e.preventDefault();
  });

  document.addEventListener('fullscreenchange', function () {
    if (fsBtn) fsBtn.setAttribute('aria-pressed', String(!!document.fullscreenElement));
    if (state.on) redraw();
  });

  /* --- Arranque --------------------------------------------------------- */
  buildBar();

  var open = document.createElement('button');
  open.type = 'button';
  open.className = 'aula-open';
  open.textContent = 'Modo clase';
  open.title = 'Un panel cada vez, sin scroll y con texto grande (tecla C)';
  open.addEventListener('click', function () { toggle(true); });
  var back = document.querySelector('.nl-back');
  if (back && back.parentNode) {
    var group = document.createElement('span');
    group.className = 'aula-hd-actions';
    back.parentNode.insertBefore(group, back);
    group.appendChild(open);
    group.appendChild(back);
  } else {
    (document.querySelector('header') || document.body).appendChild(open);
  }

  // Si la app revela o esconde un panel (p. ej. tras un ejercicio), se actualiza la barra.
  var watcher = new MutationObserver(function () { if (state.on) apply(); });
  watcher.observe(col, { attributes: true, attributeFilter: ['class', 'style'], subtree: true });

  var deep = /^#aula=(\d+)$/.exec(location.hash);
  if (deep && window.innerWidth >= 700) {
    state.idx = parseInt(deep[1], 10) - 1;
    toggle(true);
  }
})();
