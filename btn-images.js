/* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
   btn-images.js  v3 — Button Image Customizer
   Fixes: grid cut-off, images lost after layout change
   ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */
(function (global) {
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
    catch (e) { console.warn('BtnImageMgr: localStorage full'); }
  }

  /* ── resize to base64 max 200 px, jpeg 0.80 ── */
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
        cb(c.toDataURL('image/jpeg', 0.80));
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

  /* ── CSS injected once ── */
  function injectCSS() {
    if (document.getElementById('bim-css')) return;
    var s = document.createElement('style');
    s.id = 'bim-css';
    s.textContent = [
      /* backdrop */
      '.bim-bg{position:fixed;inset:0;z-index:9998;background:rgba(0,0,0,.62);display:flex;align-items:flex-end;justify-content:center;backdrop-filter:blur(10px);-webkit-backdrop-filter:blur(10px)}',

      /* bottom sheet */
      '.bim-sheet{width:100%;max-width:500px;background:var(--face);border-radius:28px 28px 0 0;padding-bottom:calc(env(safe-area-inset-bottom,0px) + 8px);max-height:90vh;display:flex;flex-direction:column;overflow:hidden;box-shadow:0 -12px 48px rgba(0,0,0,.45)}',

      /* header */
      '.bim-hdr{display:flex;align-items:center;justify-content:space-between;padding:16px 18px 8px;flex-shrink:0}',
      '.bim-ttl{font-family:"DM Sans",sans-serif;font-size:clamp(15px,5vw,18px);font-weight:700;color:var(--ink)}',
      '.bim-hdr-x{background:var(--ssec);border:none;width:30px;height:30px;border-radius:50%;cursor:pointer;font-size:15px;color:var(--ink-dim);display:flex;align-items:center;justify-content:center;font-weight:700;flex-shrink:0}',

      /* hint */
      '.bim-hint{padding:0 18px 8px;font-family:"DM Sans",sans-serif;font-size:clamp(11px,3.4vw,13px);color:var(--ink-dim);line-height:1.5;flex-shrink:0}',

      /* scrollable area — clips to sheet width */
      '.bim-scroll{flex:1;overflow-y:auto;overflow-x:hidden;padding:4px 10px 6px;-webkit-overflow-scrolling:touch;scrollbar-width:none;box-sizing:border-box}',
      '.bim-scroll::-webkit-scrollbar{display:none}',

      /* ── GRID: always 4 equal columns, full sheet width ── */
      /* FIX: never copy px values from srcGrid — use fr units */
      '.bim-grid{display:grid;grid-template-columns:repeat(4,1fr);gap:6px;width:100%;box-sizing:border-box}',

      /* cells */
      '.bim-cell{border-radius:14px;display:flex;align-items:center;justify-content:center;position:relative;overflow:hidden;cursor:pointer;transition:transform .13s;box-sizing:border-box}',
      '.bim-cell:active{transform:scale(.91)}',
      '.bim-cell.bim-locked{cursor:default;opacity:.28;pointer-events:none}',

      /* match calculator button look */
      '.bim-cell.bim-dig{background:var(--ssec);box-shadow:0 3px 0 var(--sh-d),inset 0 1px 0 var(--sh-u)}',
      '.bim-cell.bim-op{background:linear-gradient(140deg,var(--pbg1),var(--pbg2));box-shadow:0 3px 0 var(--psh)}',
      '.bim-cell.bim-eq{background:linear-gradient(140deg,var(--ebg1),var(--ebg2));box-shadow:0 3px 0 var(--esh)}',
      '.bim-cell.bim-act{background:var(--face-lo);box-shadow:0 3px 0 var(--sh-d)}',

      /* label */
      '.bim-cell-lbl{font-family:"DM Sans",sans-serif;font-weight:700;font-size:clamp(14px,5.5vw,24px);color:var(--ink);pointer-events:none;line-height:1;user-select:none}',
      '.bim-cell.bim-op .bim-cell-lbl,.bim-cell.bim-eq .bim-cell-lbl{color:#fff}',

      /* camera icon */
      '.bim-cam{position:absolute;bottom:3px;right:4px;font-size:9px;opacity:.5;pointer-events:none;line-height:1}',

      /* thumbnail */
      '.bim-thumb{width:100%;height:100%;object-fit:cover;display:block;position:absolute;inset:0;border-radius:inherit}',

      /* remove × */
      '.bim-rm{position:absolute;top:3px;right:3px;width:20px;height:20px;border-radius:50%;background:rgba(200,30,30,.92);border:none;color:#fff;font-size:13px;font-weight:900;cursor:pointer;z-index:8;display:flex;align-items:center;justify-content:center;line-height:1;box-shadow:0 1px 4px rgba(0,0,0,.4)}',
      '.bim-rm:active{transform:scale(.82)}',

      /* action bar */
      '.bim-bar{padding:10px 12px 6px;flex-shrink:0;border-top:1px solid var(--sbrd);display:flex;flex-direction:column;gap:8px}',
      '.bim-bar-row{display:grid;grid-template-columns:1fr 1fr;gap:8px}',
      '.bim-btn{height:46px;border:none;border-radius:14px;font-family:"DM Sans",sans-serif;font-size:clamp(13px,4.5vw,16px);font-weight:700;cursor:pointer;transition:opacity .15s,transform .12s;width:100%}',
      '.bim-btn:active{opacity:.72;transform:scale(.97)}',
      '.bim-ok{background:var(--acc);color:#fff}',
      '.bim-cancel{background:var(--ssec);color:var(--ink)}',
      '.bim-rmall{background:transparent;color:var(--red);border:1.5px solid var(--red);height:40px}',
    ].join('');
    document.head.appendChild(s);
  }

  /* ─────────────────────────────────────────────────
     buildEditorGrid
     Mirrors the LIVE calculator grid exactly.
     FIX P1: uses repeat(4,1fr) — NOT copied px values.
     FIX: grid-auto-rows calculated from sheet width.
  ───────────────────────────────────────────────── */
  function buildEditorGrid(container) {
    container.innerHTML = '';

    var srcGrid = document.getElementById('btnGrid');
    if (!srcGrid) {
      container.textContent = 'Calculator not found.';
      return;
    }

    /* Row height: compute from available sheet width */
    var sheetWidth = container.parentElement
      ? container.parentElement.offsetWidth || window.innerWidth
      : window.innerWidth;
    var cellW = Math.floor((sheetWidth - 20 - 6 * 3) / 4); /* 4 cols, gap 6, pad 10 each side */
    var cellH = Math.min(Math.max(cellW * 0.78, 46), 68);   /* aspect ~0.78, clamp 46-68 */

    container.style.gridAutoRows = cellH + 'px';

    var srcBtns = srcGrid.querySelectorAll('.btn');
    srcBtns.forEach(function (srcBtn) {
      var act    = srcBtn.dataset.act || '';
      var isElig = ELIGIBLE.indexOf(act) !== -1;

      /* visual type — mirror the real button class */
      var typeClass = 'bim-act';
      if (srcBtn.classList.contains('b-dig') || srcBtn.classList.contains('b-zero'))
        typeClass = 'bim-dig';
      else if (srcBtn.classList.contains('b-op'))
        typeClass = 'bim-op';
      else if (srcBtn.classList.contains('b-eq'))
        typeClass = 'bim-eq';

      var cell = document.createElement('div');
      cell.className = 'bim-cell ' + typeClass + (!isElig ? ' bim-locked' : '');

      /* copy exact grid placement from the real button */
      cell.style.gridColumn   = srcBtn.style.gridColumn;
      cell.style.gridRow      = srcBtn.style.gridRow;
      cell.style.borderRadius = srcBtn.style.borderRadius || '14px';

      if (isElig && pending[act]) {
        /* thumbnail */
        var thumb = document.createElement('img');
        thumb.className = 'bim-thumb';
        thumb.src = pending[act];
        cell.appendChild(thumb);

        /* remove badge */
        var rm = document.createElement('button');
        rm.className = 'bim-rm';
        rm.textContent = '×';
        rm.addEventListener('click', function (e) {
          e.stopPropagation();
          delete pending[act];
          buildEditorGrid(container);
        });
        cell.appendChild(rm);

      } else {
        /* label */
        var lbl = document.createElement('span');
        lbl.className = 'bim-cell-lbl';
        lbl.textContent = (srcBtn.textContent || '').trim();
        cell.appendChild(lbl);

        if (isElig) {
          var cam = document.createElement('span');
          cam.className = 'bim-cam';
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

  /* ── open editor ── */
  function openEditor() {
    injectCSS();

    /* file input — once */
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

    /* fresh pending copy */
    pending = JSON.parse(JSON.stringify(saved));

    /* build overlay once */
    if (!editorEl) {
      editorEl = document.createElement('div');
      editorEl.className = 'bim-bg';

      var sheet = document.createElement('div');
      sheet.className = 'bim-sheet';

      /* header */
      var hdr = document.createElement('div');
      hdr.className = 'bim-hdr';
      hdr.innerHTML =
        '<span class="bim-ttl">🖼️ Button Images</span>' +
        '<button class="bim-hdr-x">✕</button>';
      sheet.appendChild(hdr);

      /* hint */
      var hint = document.createElement('p');
      hint.className = 'bim-hint';
      hint.innerHTML = 'Tap a <b>digit or operator</b> to set its image. Tap <b>×</b> to remove. Press <b>OK</b> to save.';
      sheet.appendChild(hint);

      /* scrollable grid */
      var scroll = document.createElement('div');
      scroll.className = 'bim-scroll';
      var grid = document.createElement('div');
      grid.className = 'bim-grid';
      scroll.appendChild(grid);
      sheet.appendChild(scroll);

      /* action bar */
      var bar = document.createElement('div');
      bar.className = 'bim-bar';

      var row = document.createElement('div');
      row.className = 'bim-bar-row';

      var btnCancel = document.createElement('button');
      btnCancel.className = 'bim-btn bim-cancel';
      btnCancel.textContent = 'Cancel';

      var btnOK = document.createElement('button');
      btnOK.className = 'bim-btn bim-ok';
      btnOK.textContent = '✓  OK';

      var btnRmAll = document.createElement('button');
      btnRmAll.className = 'bim-btn bim-rmall';
      btnRmAll.textContent = '🗑  Remove All Images';

      row.appendChild(btnCancel);
      row.appendChild(btnOK);
      bar.appendChild(row);
      bar.appendChild(btnRmAll);
      sheet.appendChild(bar);
      editorEl.appendChild(sheet);
      document.body.appendChild(editorEl);

      /* events */
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

    /* rebuild grid fresh each open */
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

  /* ─────────────────────────────────────────────────
     init
     FIX P3: MutationObserver watches #btnGrid so
     images reapply whenever layout is rebuilt —
     independent of afterRender timing.
  ───────────────────────────────────────────────── */
  function init() {
    load();

    /* afterRender hook */
    var prev = global.afterRender;
    global.afterRender = function () {
      if (typeof prev === 'function') prev();
      applyToCalc();
    };

    /* MutationObserver — catches buildCalc() rebuilds */
    var grid = document.getElementById('btnGrid');
    if (grid && window.MutationObserver) {
      var observer = new MutationObserver(function () {
        /* small delay so all buttons are in DOM before we query them */
        clearTimeout(observer._t);
        observer._t = setTimeout(applyToCalc, 30);
      });
      observer.observe(grid, { childList: true });
    }

    /* first apply */
    applyToCalc();
  }

  global.BtnImageMgr = { init: init, openEditor: openEditor, applyToCalc: applyToCalc };

})(window);
