/* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
   btn-images.js  v5 — Button Image Customizer
   Layout reading: window._calcGetLayout() → 
                   window._calcDEFLayout() → DOM fallback
   Grid: repeat(N, 1fr) — never overflows sheet
   ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */
(function (w) {
  'use strict';

  var STORAGE_KEY = 'calcpx4_btnimg';
  var ELIGIBLE    = ['d0','d1','d2','d3','d4','d5','d6','d7','d8','d9',
                     'add','sub','mul','div','decimal'];

  var saved    = {};
  var pending  = {};
  var editorEl = null;
  var fileInput= null;
  var curAct   = null;

  /* ── storage ── */
  function load() {
    try { saved = JSON.parse(localStorage.getItem(STORAGE_KEY) || '{}'); }
    catch (e) { saved = {}; }
  }
  function persist() {
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify(saved)); }
    catch (e) {}
  }

  /* ── resize to base64 (max 200 px, jpeg 0.8) ── */
  function resizeToB64(file, cb) {
    var r = new FileReader();
    r.onload = function (ev) {
      var img = new Image();
      img.onload = function () {
        var max = 200, s = Math.min(max / img.width, max / img.height, 1);
        var c = document.createElement('canvas');
        c.width  = Math.round(img.width  * s);
        c.height = Math.round(img.height * s);
        c.getContext('2d').drawImage(img, 0, 0, c.width, c.height);
        cb(c.toDataURL('image/jpeg', 0.8));
      };
      img.src = ev.target.result;
    };
    r.readAsDataURL(file);
  }

  /* ── apply saved images onto live calculator buttons ── */
  function applyToCalc() {
    ELIGIBLE.forEach(function (act) {
      var btn = document.querySelector('[data-act="' + act + '"]');
      if (!btn) return;
      var old = btn.querySelector('.bim-img');
      if (old) old.remove();
      if (saved[act]) {
        btn.classList.add('bim-active');
        var img = document.createElement('img');
        img.className = 'bim-img';
        img.src = saved[act];
        btn.appendChild(img);
      } else {
        btn.classList.remove('bim-active');
      }
    });
  }

  /* ─────────────────────────────────────────────────
     getLayoutData — triple fallback
     1. window._calcGetLayout() — exposed by main HTML
     2. window._calcDEFLayout() — exposed default
     3. Read from #btnGrid DOM buttons
  ───────────────────────────────────────────────── */
  function getLayoutData() {
    /* Attempt 1: explicit exposed function */
    try {
      if (typeof w._calcGetLayout === 'function') {
        var l = w._calcGetLayout();
        if (l && l.length) return { source: 'cfg', layout: l };
      }
    } catch (e) {}

    /* Attempt 2: exposed DEF_LAYOUT */
    try {
      if (typeof w._calcDEFLayout === 'function') {
        var d = w._calcDEFLayout();
        if (d && d.length) return { source: 'def', layout: d };
      }
    } catch (e) {}

    /* Attempt 3: read directly from rendered #btnGrid */
    var grid = document.getElementById('btnGrid');
    if (grid) {
      var btns = grid.querySelectorAll('.btn');
      if (btns.length > 0) return { source: 'dom', btns: btns };
    }

    return null;
  }

  /* ─────────────────────────────────────────────────
     buildEditorGrid
     Reads layout via getLayoutData() — uses fr units
  ───────────────────────────────────────────────── */
  function buildEditorGrid(container) {
    container.innerHTML = '';

    var data = getLayoutData();
    if (!data) {
      var msg = document.createElement('p');
      msg.style.cssText = 'padding:20px;color:var(--ink-dim);font-family:"DM Sans",sans-serif;font-size:14px;text-align:center';
      msg.textContent = 'Open the calculator first, then try again.';
      container.appendChild(msg);
      return;
    }

    var items = []; /* [{act, lbl, cls, col, row, cs, rs}] */

    if (data.source === 'dom') {
      /* Build from DOM buttons */
      data.btns.forEach(function (btn) {
        var gc = btn.style.gridColumn || '1';
        var gr = btn.style.gridRow    || '1';
        /* parse "4" or "1/span 2" */
        var colParts = gc.split(/[\/\s]+/);
        var rowParts = gr.split(/[\/\s]+/);
        var col = parseInt(colParts[0]) || 1;
        var cs  = gc.indexOf('span') >= 0 ? parseInt(gc.replace(/.*span\s*/,'')) : 1;
        var row = parseInt(rowParts[0]) || 1;
        var rs  = gr.indexOf('span') >= 0 ? parseInt(gr.replace(/.*span\s*/,'')) : 1;
        items.push({
          act: btn.dataset.act || '',
          lbl: (btn.textContent || '').trim(),
          cls: btn.className,
          col: col, row: row, cs: cs, rs: rs
        });
      });
    } else {
      /* Build from layout array */
      data.layout.forEach(function (b) {
        items.push({
          act: b.act || '',
          lbl: b.lbl || b.act || '',
          cls: b.cls || '',
          col: b.col || 1, row: b.row || 1,
          cs: b.cs || 1,   rs: b.rs || 1
        });
      });
    }

    if (!items.length) {
      container.textContent = 'No buttons found.';
      return;
    }

    /* Determine grid dimensions */
    var maxCol = 1;
    items.forEach(function (b) {
      maxCol = Math.max(maxCol, b.col + b.cs - 1);
    });

    /* Apply grid — fr units ONLY, no px */
    container.style.gridTemplateColumns = 'repeat(' + maxCol + ',1fr)';

    /* Row height from available container width */
    var scrollEl  = container.parentElement;
    var availW    = scrollEl ? (scrollEl.offsetWidth || w.innerWidth) - 20 : w.innerWidth - 20;
    var gapPx     = 6;
    var cellW     = Math.floor((availW - (maxCol - 1) * gapPx) / maxCol);
    var cellH     = Math.min(Math.max(Math.round(cellW * 0.74), 42), 66);
    container.style.gridAutoRows = cellH + 'px';

    items.forEach(function (b) {
      var act    = b.act;
      var isElig = ELIGIBLE.indexOf(act) !== -1;

      /* Visual type class */
      var tc = 'bim-act';
      if (b.cls.indexOf('b-op')  >= 0) tc = 'bim-op';
      else if (b.cls.indexOf('b-eq')  >= 0) tc = 'bim-eq';
      else if (b.cls.indexOf('b-dig') >= 0 || b.cls.indexOf('b-zero') >= 0) tc = 'bim-dig';

      var cell = document.createElement('div');
      cell.className = 'bim-cell ' + tc + (!isElig ? ' bim-locked' : '');
      cell.style.gridColumn   = b.col + (b.cs > 1 ? '/span ' + b.cs : '');
      cell.style.gridRow      = b.row + (b.rs > 1 ? '/span ' + b.rs : '');
      cell.style.borderRadius = '14px';

      if (isElig && pending[act]) {
        /* Thumbnail */
        var thumb = document.createElement('img');
        thumb.className = 'bim-thumb';
        thumb.src = pending[act];
        cell.appendChild(thumb);

        /* Remove × */
        var rm = document.createElement('button');
        rm.className   = 'bim-rm';
        rm.textContent = '×';
        rm.addEventListener('click', function (e) {
          e.stopPropagation();
          delete pending[act];
          buildEditorGrid(container);
        });
        cell.appendChild(rm);
      } else {
        /* Label */
        var lbl = document.createElement('span');
        lbl.className   = 'bim-cell-lbl';
        lbl.textContent = b.lbl;
        cell.appendChild(lbl);

        if (isElig) {
          var cam = document.createElement('span');
          cam.className   = 'bim-cam';
          cam.textContent = '📷';
          cell.appendChild(cam);
        }
      }

      if (isElig) {
        cell.addEventListener('click', function () {
          curAct = act;
          if (fileInput) fileInput.click();
        });
      }

      container.appendChild(cell);
    });
  }

  /* ── CSS injected once ── */
  function injectCSS() {
    if (document.getElementById('bim-css')) return;
    var s  = document.createElement('style');
    s.id   = 'bim-css';
    s.textContent = [
      '.bim-bg{position:fixed;inset:0;z-index:9998;background:rgba(0,0,0,.62);display:flex;align-items:flex-end;justify-content:center;backdrop-filter:blur(10px);-webkit-backdrop-filter:blur(10px)}',
      '.bim-sheet{width:100%;max-width:480px;background:var(--face);border-radius:28px 28px 0 0;padding-bottom:calc(env(safe-area-inset-bottom,0px) + 8px);max-height:90vh;display:flex;flex-direction:column;overflow:hidden;box-shadow:0 -12px 48px rgba(0,0,0,.45);box-sizing:border-box}',
      '.bim-hdr{display:flex;align-items:center;justify-content:space-between;padding:16px 18px 8px;flex-shrink:0}',
      '.bim-ttl{font-family:"DM Sans",sans-serif;font-size:clamp(15px,5vw,18px);font-weight:700;color:var(--ink)}',
      '.bim-hdr-x{background:var(--ssec);border:none;width:30px;height:30px;border-radius:50%;cursor:pointer;font-size:15px;color:var(--ink-dim);display:flex;align-items:center;justify-content:center;font-weight:700;flex-shrink:0}',
      '.bim-hint{padding:0 18px 8px;font-family:"DM Sans",sans-serif;font-size:clamp(11px,3.4vw,13px);color:var(--ink-dim);line-height:1.5;flex-shrink:0;margin:0}',
      /* scroll — clips all overflow */
      '.bim-scroll{flex:1;min-height:0;overflow-y:auto;overflow-x:hidden;width:100%;box-sizing:border-box;-webkit-overflow-scrolling:touch;scrollbar-width:none}',
      '.bim-scroll::-webkit-scrollbar{display:none}',
      /* grid — fr units only, padding inside grid not scroll */
      '.bim-grid{display:grid;gap:6px;padding:6px 10px 10px;width:100%;box-sizing:border-box;min-width:0}',
      /* cells */
      '.bim-cell{border-radius:14px;display:flex;align-items:center;justify-content:center;position:relative;overflow:hidden;cursor:pointer;transition:transform .13s;min-width:0;min-height:0;box-sizing:border-box}',
      '.bim-cell:active{transform:scale(.91)}',
      '.bim-cell.bim-locked{cursor:default;opacity:.28;pointer-events:none}',
      '.bim-cell.bim-dig{background:var(--ssec);box-shadow:0 3px 0 var(--sh-d),inset 0 1px 0 var(--sh-u)}',
      '.bim-cell.bim-op{background:linear-gradient(140deg,var(--pbg1),var(--pbg2));box-shadow:0 3px 0 var(--psh)}',
      '.bim-cell.bim-eq{background:linear-gradient(140deg,var(--ebg1),var(--ebg2));box-shadow:0 3px 0 var(--esh)}',
      '.bim-cell.bim-act{background:var(--face-lo);box-shadow:0 3px 0 var(--sh-d)}',
      '.bim-cell-lbl{font-family:"DM Sans",sans-serif;font-weight:700;font-size:clamp(13px,5vw,22px);color:var(--ink);pointer-events:none;line-height:1;user-select:none;min-width:0}',
      '.bim-cell.bim-op .bim-cell-lbl,.bim-cell.bim-eq .bim-cell-lbl{color:#fff}',
      '.bim-cam{position:absolute;bottom:3px;right:4px;font-size:9px;opacity:.5;pointer-events:none;line-height:1}',
      '.bim-thumb{width:100%;height:100%;object-fit:cover;display:block;position:absolute;inset:0;border-radius:inherit}',
      '.bim-rm{position:absolute;top:3px;right:3px;width:20px;height:20px;border-radius:50%;background:rgba(200,30,30,.92);border:none;color:#fff;font-size:13px;font-weight:900;cursor:pointer;z-index:8;display:flex;align-items:center;justify-content:center;line-height:1;box-shadow:0 1px 4px rgba(0,0,0,.4)}',
      '.bim-rm:active{transform:scale(.82)}',
      /* action bar */
      '.bim-bar{padding:10px 12px 6px;flex-shrink:0;border-top:1px solid var(--sbrd);display:flex;flex-direction:column;gap:7px}',
      '.bim-bar-row{display:grid;grid-template-columns:1fr 1fr;gap:8px}',
      '.bim-btn{height:46px;border:none;border-radius:14px;font-family:"DM Sans",sans-serif;font-size:clamp(13px,4.5vw,16px);font-weight:700;cursor:pointer;transition:opacity .15s,transform .12s;width:100%}',
      '.bim-btn:active{opacity:.72;transform:scale(.97)}',
      '.bim-ok{background:var(--acc);color:#fff}',
      '.bim-cancel{background:var(--ssec);color:var(--ink)}',
      '.bim-rmall{background:transparent;color:var(--red);border:1.5px solid var(--red)!important;height:40px}',
    ].join('');
    document.head.appendChild(s);
  }

  /* ── open editor ── */
  function openEditor() {
    injectCSS();

    if (!fileInput) {
      fileInput = document.createElement('input');
      fileInput.type   = 'file';
      fileInput.accept = 'image/*';
      fileInput.style.display = 'none';
      fileInput.addEventListener('change', function () {
        var file = fileInput.files[0];
        if (file && curAct) {
          resizeToB64(file, function (b64) {
            pending[curAct] = b64;
            var g = editorEl && editorEl.querySelector('.bim-grid');
            if (g) buildEditorGrid(g);
          });
        }
        fileInput.value = '';
      });
      document.body.appendChild(fileInput);
    }

    pending = JSON.parse(JSON.stringify(saved));

    if (!editorEl) {
      editorEl = document.createElement('div');
      editorEl.className = 'bim-bg';

      var sheet = document.createElement('div');
      sheet.className = 'bim-sheet';

      var hdr = document.createElement('div');
      hdr.className = 'bim-hdr';
      hdr.innerHTML =
        '<span class="bim-ttl">🖼️ Button Images</span>' +
        '<button class="bim-hdr-x">✕</button>';
      sheet.appendChild(hdr);

      var hint = document.createElement('p');
      hint.className = 'bim-hint';
      hint.innerHTML = 'Tap a <b>number or operator</b> to set its photo. Tap <b>×</b> to remove. Press <b>OK</b> to save.';
      sheet.appendChild(hint);

      var scroll = document.createElement('div');
      scroll.className = 'bim-scroll';
      var grid = document.createElement('div');
      grid.className = 'bim-grid';
      scroll.appendChild(grid);
      sheet.appendChild(scroll);

      var bar = document.createElement('div');
      bar.className = 'bim-bar';
      var barRow = document.createElement('div');
      barRow.className = 'bim-bar-row';

      var btnCancel = document.createElement('button');
      btnCancel.className = 'bim-btn bim-cancel';
      btnCancel.textContent = 'Cancel';

      var btnOK = document.createElement('button');
      btnOK.className = 'bim-btn bim-ok';
      btnOK.textContent = '✓  OK';

      var btnRmAll = document.createElement('button');
      btnRmAll.className = 'bim-btn bim-rmall';
      btnRmAll.textContent = '🗑  Remove All Images';

      barRow.appendChild(btnCancel);
      barRow.appendChild(btnOK);
      bar.appendChild(barRow);
      bar.appendChild(btnRmAll);
      sheet.appendChild(bar);
      editorEl.appendChild(sheet);
      document.body.appendChild(editorEl);

      hdr.querySelector('.bim-hdr-x').addEventListener('click', closeEditor);
      editorEl.addEventListener('click', function (e) {
        if (e.target === editorEl) closeEditor();
      });
      btnCancel.addEventListener('click', closeEditor);
      btnOK.addEventListener('click', function () {
        saved = JSON.parse(JSON.stringify(pending));
        persist();
        applyToCalc();
        closeEditor();
      });
      btnRmAll.addEventListener('click', function () {
        pending = {};
        buildEditorGrid(editorEl.querySelector('.bim-grid'));
      });
    }

    buildEditorGrid(editorEl.querySelector('.bim-grid'));
    editorEl.style.display = 'flex';
    document.body.style.overflow = 'hidden';
  }

  function closeEditor() {
    if (editorEl) editorEl.style.display = 'none';
    document.body.style.overflow = '';
    pending = {};
    curAct  = null;
  }

  /* ── init ── */
  function init() {
    load();

    /* afterRender hook */
    var prev = w.afterRender;
    w.afterRender = function () {
      if (typeof prev === 'function') prev();
      applyToCalc();
    };

    /* MutationObserver on #btnGrid — catches every layout rebuild */
    var grid = document.getElementById('btnGrid');
    if (grid && w.MutationObserver) {
      var ob = new w.MutationObserver(function () {
        clearTimeout(ob._t);
        ob._t = setTimeout(applyToCalc, 30);
      });
      ob.observe(grid, { childList: true });
    }

    applyToCalc();
  }

  w.BtnImageMgr = { init: init, openEditor: openEditor, applyToCalc: applyToCalc };

})(window);
