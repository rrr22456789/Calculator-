/* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
   btn-images.js  v2 — Button Image Customizer
   Requires calc-plus_17+ (data-act on buttons +
   afterRender hook in buildCalc & render)
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
    catch (e) { console.warn('BtnImageMgr: storage full'); }
  }

  /* ── resize to base64 (200 px max, jpeg 0.80) ── */
  function resizeToB64(file, cb) {
    var r = new FileReader();
    r.onload = function (ev) {
      var img = new Image();
      img.onload = function () {
        var max = 200, scale = Math.min(max / img.width, max / img.height, 1);
        var c = document.createElement('canvas');
        c.width  = Math.round(img.width  * scale);
        c.height = Math.round(img.height * scale);
        c.getContext('2d').drawImage(img, 0, 0, c.width, c.height);
        cb(c.toDataURL('image/jpeg', 0.80));
      };
      img.src = ev.target.result;
    };
    r.readAsDataURL(file);
  }

  /* ── apply saved images to live calculator buttons ── */
  function applyToCalc() {
    ELIGIBLE.forEach(function (act) {
      var btn = document.querySelector('[data-act="' + act + '"]');
      if (!btn) return;

      /* remove existing overlay */
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

  /* ── inject CSS once ── */
  function injectCSS() {
    if (document.getElementById('bim-css')) return;
    var s = document.createElement('style');
    s.id = 'bim-css';
    s.textContent = [
      /* backdrop */
      '.bim-bg{position:fixed;inset:0;z-index:9998;background:rgba(0,0,0,.6);display:flex;align-items:flex-end;justify-content:center;backdrop-filter:blur(10px);-webkit-backdrop-filter:blur(10px)}',

      /* bottom sheet */
      '.bim-sheet{width:100%;max-width:500px;background:var(--face);border-radius:28px 28px 0 0;padding-bottom:calc(env(safe-area-inset-bottom,0px) + 12px);max-height:92vh;display:flex;flex-direction:column;overflow:hidden;box-shadow:0 -12px 48px rgba(0,0,0,.45)}',

      /* header */
      '.bim-hdr{display:flex;align-items:center;justify-content:space-between;padding:16px 18px 8px;flex-shrink:0}',
      '.bim-ttl{font-family:"DM Sans",sans-serif;font-size:clamp(16px,5vw,19px);font-weight:700;color:var(--ink)}',
      '.bim-hdr-x{background:var(--ssec);border:none;width:30px;height:30px;border-radius:50%;cursor:pointer;font-size:15px;color:var(--ink-dim);display:flex;align-items:center;justify-content:center;flex-shrink:0;font-weight:700}',

      /* hint */
      '.bim-hint{padding:0 18px 10px;font-family:"DM Sans",sans-serif;font-size:clamp(11px,3.6vw,13px);color:var(--ink-dim);line-height:1.5;flex-shrink:0}',

      /* scrollable area */
      '.bim-scroll{flex:1;overflow-y:auto;overflow-x:hidden;padding:4px 12px 10px;-webkit-overflow-scrolling:touch;scrollbar-width:none}',
      '.bim-scroll::-webkit-scrollbar{display:none}',

      /* mirrored grid */
      '.bim-grid{display:grid;gap:7px;width:100%}',

      /* cells */
      '.bim-cell{min-height:52px;border-radius:16px;display:flex;align-items:center;justify-content:center;position:relative;overflow:hidden;cursor:pointer;transition:transform .13s}',
      '.bim-cell:active{transform:scale(.91)}',
      '.bim-cell.bim-locked{cursor:default;opacity:.3;pointer-events:none}',

      /* cell types — match calculator look */
      '.bim-cell.bim-dig{background:var(--ssec);box-shadow:0 3px 0 var(--sh-d),inset 0 1px 0 var(--sh-u)}',
      '.bim-cell.bim-op{background:linear-gradient(140deg,var(--pbg1),var(--pbg2));box-shadow:0 3px 0 var(--psh)}',
      '.bim-cell.bim-eq{background:linear-gradient(140deg,var(--ebg1),var(--ebg2));box-shadow:0 3px 0 var(--esh)}',
      '.bim-cell.bim-act{background:var(--face-lo);box-shadow:0 3px 0 var(--sh-d)}',

      /* label */
      '.bim-cell-lbl{font-family:"DM Sans",sans-serif;font-weight:700;font-size:clamp(16px,6vw,26px);color:var(--ink);pointer-events:none;line-height:1;user-select:none}',
      '.bim-cell.bim-op .bim-cell-lbl,.bim-cell.bim-eq .bim-cell-lbl{color:#fff}',

      /* camera badge */
      '.bim-cam{position:absolute;bottom:4px;right:5px;font-size:10px;opacity:.55;pointer-events:none;line-height:1}',

      /* thumbnail */
      '.bim-thumb{width:100%;height:100%;object-fit:cover;display:block;position:absolute;inset:0;border-radius:inherit}',

      /* remove badge */
      '.bim-rm{position:absolute;top:4px;right:4px;width:22px;height:22px;border-radius:50%;background:rgba(200,30,30,.92);border:none;color:#fff;font-size:14px;font-weight:900;cursor:pointer;z-index:8;display:flex;align-items:center;justify-content:center;line-height:1;box-shadow:0 1px 4px rgba(0,0,0,.4)}',
      '.bim-rm:active{transform:scale(.84)}',

      /* action bar */
      '.bim-bar{display:grid;grid-template-columns:1fr 1fr;grid-template-rows:auto auto;gap:8px;padding:12px 14px 8px;flex-shrink:0;border-top:1px solid var(--sbrd)}',
      '.bim-btn{height:46px;border:none;border-radius:14px;font-family:"DM Sans",sans-serif;font-size:clamp(13px,4.5vw,16px);font-weight:700;cursor:pointer;transition:opacity .15s,transform .12s;width:100%}',
      '.bim-btn:active{opacity:.72;transform:scale(.97)}',
      '.bim-ok{background:var(--acc);color:#fff}',
      '.bim-cancel{background:var(--ssec);color:var(--ink)}',
      '.bim-rmall{grid-column:1/-1;background:transparent;color:var(--red);border:1.5px solid var(--red)!important;height:40px}',

    ].join('');
    document.head.appendChild(s);
  }

  /* ── mirror the live calculator grid in the editor ── */
  function buildEditorGrid(container) {
    container.innerHTML = '';

    var srcGrid = document.getElementById('btnGrid');
    if (!srcGrid) {
      container.style.padding = '20px';
      container.textContent = 'Calculator grid not found.';
      return;
    }

    /* copy column template from live grid */
    var computed = window.getComputedStyle(srcGrid);
    container.style.gridTemplateColumns = computed.gridTemplateColumns;
    container.style.gridAutoRows = 'clamp(48px,13vw,64px)';

    var srcBtns = srcGrid.querySelectorAll('.btn');
    srcBtns.forEach(function (srcBtn) {
      var act    = srcBtn.dataset.act || '';
      var isElig = ELIGIBLE.indexOf(act) !== -1;

      /* visual type */
      var typeClass = 'bim-act';
      if (srcBtn.classList.contains('b-dig') || srcBtn.classList.contains('b-zero'))
        typeClass = 'bim-dig';
      else if (srcBtn.classList.contains('b-op'))
        typeClass = 'bim-op';
      else if (srcBtn.classList.contains('b-eq'))
        typeClass = 'bim-eq';

      var cell = document.createElement('div');
      cell.className = 'bim-cell ' + typeClass + (!isElig ? ' bim-locked' : '');
      cell.style.gridColumn   = srcBtn.style.gridColumn;
      cell.style.gridRow      = srcBtn.style.gridRow;
      cell.style.borderRadius = srcBtn.style.borderRadius || '16px';

      if (isElig && pending[act]) {
        /* thumbnail + remove button */
        var thumb = document.createElement('img');
        thumb.className = 'bim-thumb';
        thumb.src = pending[act];
        cell.appendChild(thumb);

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

    /* file input — created once */
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

    /* fresh pending copy each open */
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
      hint.innerHTML = 'Tap a <b>number or operator</b> to set its image. Tap <b>×</b> on a thumbnail to remove it. Press <b>OK</b> to save all changes.';
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

      var btnCancel = document.createElement('button');
      btnCancel.className = 'bim-btn bim-cancel';
      btnCancel.textContent = 'Cancel';

      var btnOK = document.createElement('button');
      btnOK.className = 'bim-btn bim-ok';
      btnOK.textContent = '✓  OK';

      var btnRmAll = document.createElement('button');
      btnRmAll.className = 'bim-btn bim-rmall';
      btnRmAll.textContent = '🗑  Remove All Images';

      bar.appendChild(btnCancel);
      bar.appendChild(btnOK);
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
        var g = editorEl.querySelector('.bim-grid');
        if (g) buildEditorGrid(g);
      });
    }

    /* refresh grid every open */
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
    var prev = global.afterRender;
    global.afterRender = function () {
      if (typeof prev === 'function') prev();
      applyToCalc();
    };
    applyToCalc();
  }

  global.BtnImageMgr = { init: init, openEditor: openEditor, applyToCalc: applyToCalc };

})(window);
