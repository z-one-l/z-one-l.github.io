/* IrisFlow live demo for z-one-l.github.io — the real model, served from a Hugging Face Space.
   The panel builds a design request (target spectrum, allowed materials, layer count), sends it to the
   Space's `design` endpoint and draws the designs that come back, each re-simulated with the transfer-matrix
   method on the Space. Unlike the schematic canvases in irisflow.js, everything here is real: material names,
   thicknesses in nm and spectra. Opt in with data-if-live="<owner>/<space>" and data-presets="<json url>". */
(function () {
  "use strict";
  if (typeof document === "undefined") return;

  /* the model was trained on 380-1400 nm; bands reach to 2500 nm, as in the paper's wavelength-extension tests */
  var WL_MIN = 380, WL_MAX = 2500, TRAIN_MAX = 1400, S = 128, KNOTS = 17, MIN_MATS = 3, MAX_MATS = 15, MAX_BANDS = 3, STEPS = 15;
  /* id, display name, class, seen in training; mirrors materials.json in the private bundle */
  var MATERIALS = [["Ag", "Ag", "metal", 1], ["Al2O3", "Al2O3", "dielectric", 1], ["Cr", "Cr", "metal", 1], ["gsst-a", "GSST-a", "phase-change", 1], ["gsst-b", "GSST-b", "phase-change", 1], ["gst-a", "GST-a", "phase-change", 1], ["gst-b", "GST-b", "phase-change", 1], ["h4", "h4", "dielectric", 1], ["Si", "Si", "semiconductor", 1], ["SiO2", "SiO2", "dielectric", 1], ["ss-a", "SS-a", "phase-change", 1], ["ss-b", "SS-b", "phase-change", 1], ["Ta2O5", "Ta2O5", "dielectric", 1], ["Ti", "Ti", "metal", 1], ["TiO2", "TiO2", "dielectric", 1],
    ["Au", "Au", "metal", 0], ["Al", "Al", "metal", 0], ["W", "W", "metal", 0], ["Pt", "Pt", "metal", 0], ["Nb", "Nb", "metal", 0], ["ZnO", "ZnO", "dielectric", 0], ["CeO2", "CeO2", "dielectric", 0], ["Y2O3", "Y2O3", "dielectric", 0], ["HfO2", "HfO2", "dielectric", 0], ["ZrO2", "ZrO2", "dielectric", 0], ["ITO", "ITO", "conductor", 0], ["AZO", "AZO", "conductor", 0], ["FTO", "FTO", "conductor", 0], ["PET", "PET", "polymer", 0], ["PMMA", "PMMA", "polymer", 0]];
  /* layer colours by family (metals grey or gold, phase-change purple, dielectrics in distinct hues), kept clear of
     the red R and blue T curves */
  var MAT_COL = { Ag: "#a7adb5", Al2O3: "#9b8fd6", Cr: "#5d6470", "gsst-a": "#8e5cc4", "gsst-b": "#6d3fa3", "gst-a": "#b46fc9", "gst-b": "#8a3f9e", h4: "#4cb79a", Si: "#8a5a3c", SiO2: "#7cc6e6", "ss-a": "#c58bd8", "ss-b": "#a35cb3", Ta2O5: "#d6b23a", Ti: "#7b8794", TiO2: "#e58a2e",
    Au: "#d4a72c", Al: "#c3c9d1", W: "#6f7a86", Pt: "#959da8", Nb: "#56606c", ZnO: "#9ccf63", CeO2: "#e0c46c", Y2O3: "#69b3a2", HfO2: "#5fa8b8", ZrO2: "#b7a26a", ITO: "#3fae8e", AZO: "#7fbf9a", FTO: "#4f9a7a", PET: "#e39bb5", PMMA: "#d88aa0" };
  /* materials whose measured n,k stop short of 2500 nm: [end of the data, usable up to] in nm. Usable means the data
     end plus a 50 nm edge hold, or 1400 nm, as in training, when the data end earlier; the rest reach 2500 nm.
     Mirrors nk_range_nm / nk_max_nm in materials.json. */
  var NK_LIMIT = { Al2O3: [980, 1400], Cr: [1240, 1400], h4: [800, 1400], Ti: [1100, 1400], CeO2: [1000, 1400], AZO: [900, 1400],
    "gsst-a": [1600, 1650], "gsst-b": [1600, 1650], "ss-a": [1600, 1650], "ss-b": [1600, 1650], ITO: [1689, 1739] };
  var MAT = {};
  MATERIALS.forEach(function (m) { MAT[m[0]] = { id: m[0], name: m[1], cls: m[2], trained: !!m[3], col: MAT_COL[m[0]], nkMax: NK_LIMIT[m[0]] ? NK_LIMIT[m[0]][1] : WL_MAX }; });
  /* rows of the material picker, by class */
  var FAMILIES = [["Dielectrics", ["dielectric"]], ["Metals", ["metal"]], ["Phase-change", ["phase-change"]], ["Other", ["semiconductor", "conductor", "polymer"]]];
  /* materials a visitor uploads as n,k data: how many, how many rows are sent, and their colours */
  var MAX_OWN = 5, MAX_NK_ROWS = 2000, OWN_COL = ["#1fa39a", "#b0643a", "#c2577a", "#8a8f2a", "#6a5acd"];

  /* ============================ helpers ============================ */
  function clamp(x, a, b) { return x < a ? a : x > b ? b : x; }
  function el(tag, cls, html) { var e = document.createElement(tag); if (cls) e.className = cls; if (html != null) e.innerHTML = html; return e; }
  function esc(s) { return String(s).replace(/[&<>"]/g, function (c) { return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]; }); }
  function theme(elm) {
    var cs = getComputedStyle(elm);
    function v(name, fb) { var x = cs.getPropertyValue(name).trim(); return x || fb; }
    var dark = document.documentElement.getAttribute("data-theme") === "dark";
    return { text: v("--if-text", dark ? "#e4e4e4" : "#111"), muted: v("--if-muted", "#888"), bg: v("--if-bg", dark ? "#1c1c1d" : "#fff"), line: v("--if-line", dark ? "#3a3a3a" : "#e6e6e6"), accent: v("--if-accent", "#b509ac"), R: v("--if-r", "#d64545"), T: v("--if-t", "#2f6fd6") };
  }
  function setupCanvas(canvas, w, h) {
    var dpr = window.devicePixelRatio || 1;
    canvas.width = Math.round(w * dpr); canvas.height = Math.round(h * dpr);
    canvas.style.width = w + "px"; canvas.style.height = h + "px";
    var ctx = canvas.getContext("2d"); ctx.setTransform(dpr, 0, 0, dpr, 0, 0); return ctx;
  }
  /* n points evenly spaced in 1/lambda with both ends pinned, like the training data */
  function kGrid(lo, hi, n) { var g = []; for (var i = 0; i < n; i++) g.push(1 / (1 / hi + (1 / lo - 1 / hi) * i / (n - 1))); g.reverse(); g[0] = lo; g[n - 1] = hi; return g; }
  /* the paper's grid over several bands: the 128 points are shared out by each band's width in 1/lambda (at least 2
     each, leftovers to the widest), k-uniform within each band; gaps marks the index where each later band starts */
  function bandGrid(bands) {
    var w = bands.map(function (b) { return 1 / b[0] - 1 / b[1]; }), sum = w.reduce(function (a, x) { return a + x; }, 0);
    var counts = w.map(function (x) { return Math.floor((S - 2 * bands.length) * x / sum) + 2; });
    var order = w.map(function (x, i) { return i; }).sort(function (a, b) { return w[b] - w[a]; });
    for (var i = 0, left = S - counts.reduce(function (a, x) { return a + x; }, 0); i < left; i++) counts[order[i % bands.length]]++;
    var wl = [], gaps = {};
    bands.forEach(function (b, j) { if (j) gaps[wl.length] = true; wl = wl.concat(kGrid(b[0], b[1], counts[j])); });
    return { wl: wl, gaps: gaps };
  }
  function interp(x, xs, ys) {
    if (x <= xs[0]) return ys[0];
    var n = xs.length; if (x >= xs[n - 1]) return ys[n - 1];
    var a = 0, b = n - 1; while (b - a > 1) { var m = (a + b) >> 1; if (xs[m] <= x) a = m; else b = m; }
    return ys[a] + (ys[b] - ys[a]) * (x - xs[a]) / (xs[b] - xs[a]);
  }
  /* indices where a target grid jumps over an excluded region (presets score separate bands) */
  function gapsOf(wl) {
    var d = [], g = {}; for (var i = 1; i < wl.length; i++) d.push(1 / wl[i - 1] - 1 / wl[i]);
    var med = d.slice().sort(function (a, b) { return a - b; })[d.length >> 1] || 1;
    d.forEach(function (x, i) { if (x > 3 * med) g[i + 1] = true; }); return g;
  }

  function initLive(container) {
    var SPACE = container.getAttribute("data-if-live"), PRESET_URL = container.getAttribute("data-presets");
    var SPACE_PAGE = "https://huggingface.co/spaces/" + SPACE;
    container.innerHTML = "";

    /* ---- state ---- */
    var presets = [], st = {
      mode: "preset", preset: 0, target: null,
      draw: { lo: 420, hi: 1000, R: [], T: [], edit: "R", linked: true },
      /* the bands each mode samples; null for a preset means its own grid, exactly as in the paper */
      bands: { preset: null, draw: [[420, 1000]], csv: null },
      csv: null, mats: {}, layers: 18, samples: 16, rank: "match",
      result: null, example: false, pick: 0, busy: false, hover: -1,
      own: [] /* ids of uploaded materials, in upload order */
    };
    var ownSeq = 0;
    MATERIALS.forEach(function (m) { if (m[3]) st.mats[m[0]] = true; });
    for (var k = 0; k < KNOTS; k++) { var u = k / (KNOTS - 1); st.draw.R.push(clamp(0.05 + 0.85 * Math.exp(-Math.pow((u - 0.5) / 0.16, 2)), 0, 1)); st.draw.T.push(1 - st.draw.R[k]); }

    /* ---- layout ---- */
    function grp(lbl, parent) { var g = el("span", "if-group"); if (lbl) g.appendChild(el("span", "if-glabel", lbl)); parent.appendChild(g); return g; }
    function pill(html, on) { var bt = el("button", "if-pill", html); bt.type = "button"; bt.addEventListener("click", on); return bt; }

    var row1 = el("div", "if-studio-ctl"); row1.appendChild(el("span", "if-gtitle", "1 · Target spectrum"));
    var gMode = grp("from", row1), modeBtns = {};
    [["preset", "A preset"], ["draw", "Draw it"], ["csv", "Upload CSV"]].forEach(function (m) { modeBtns[m[0]] = pill(m[1], function () { setMode(m[0]); }); gMode.appendChild(modeBtns[m[0]]); });
    /* the three mode panels share one grid cell, so the row is as tall as the tallest and never jumps */
    var modeCell = el("div", "if-live-stackcell"), pPreset = el("div", "if-live-mode"), pDraw = el("div", "if-live-mode"), pCsv = el("div", "if-live-mode");
    modeCell.appendChild(pPreset); modeCell.appendChild(pDraw); modeCell.appendChild(pCsv); row1.appendChild(modeCell);
    var presetSel = el("select", "if-live-select"); presetSel.setAttribute("aria-label", "Preset target"); pPreset.appendChild(presetSel);
    presetSel.addEventListener("change", function () { st.preset = +presetSel.value; st.layers = presets[st.preset].layers; st.bands.preset = null; syncLayers(); setTarget(); });
    var gEdit = grp("drag", pDraw), editR = pill("R", function () { st.draw.edit = "R"; syncDraw(); }), editT = pill("T", function () { st.draw.edit = "T"; syncDraw(); });
    var linkBtn = pill("T = 1 − R", function () { st.draw.linked = !st.draw.linked; if (st.draw.linked) st.draw.T = st.draw.R.map(function (r) { return 1 - r; }); syncDraw(); setTarget(); });
    linkBtn.title = "Lossless target: no absorption, so T follows R";
    gEdit.appendChild(editR); gEdit.appendChild(editT); gEdit.appendChild(linkBtn);
    var fileIn = el("input", "if-live-file"); fileIn.type = "file"; fileIn.accept = ".csv,.txt,.tsv,text/csv,text/plain"; fileIn.setAttribute("aria-label", "Target spectrum file");
    pCsv.appendChild(fileIn);
    fileIn.addEventListener("change", function () { var f = fileIn.files && fileIn.files[0]; if (!f) return; var rd = new FileReader(); rd.onload = function () { parseCsv(String(rd.result), f.name); }; rd.readAsText(f); });

    /* the bands, shared by all three sources: one or more ranges in nm, each a pair of number fields */
    var bandRow = el("div", "if-studio-ctl if-live-bands"), gBands = grp("bands (nm)", bandRow), bandList = el("span", "if-live-bandlist");
    var addBand = el("button", "if-linkbtn", "+ band"), resetBands = el("button", "if-linkbtn", "reset");
    addBand.type = resetBands.type = "button"; addBand.title = "Add another band; the model reads only the wavelengths inside the bands";
    gBands.appendChild(bandList); gBands.appendChild(addBand); gBands.appendChild(resetBands);
    addBand.addEventListener("click", function () {
      /* the new band goes in the middle of the widest stretch of the target that no band covers */
      var b = curBands().map(function (x) { return x.slice(); }), d = domain(), free = [], prev = d[0];
      b.forEach(function (x) { free.push([prev, x[0]]); prev = x[1]; }); free.push([prev, d[1]]);
      var f = free.sort(function (p, q) { return (q[1] - q[0]) - (p[1] - p[0]); })[0], w = f[1] - f[0];
      if (w < 40) { status.textContent = "No room for another band in this target's range (" + Math.round(d[0]) + "–" + Math.round(d[1]) + " nm); narrow a band first."; return; }
      b.push([f[0] + w / 4, f[1] - w / 4]); editBands(b);
    });
    resetBands.addEventListener("click", function () { st.bands[st.mode] = defaultBands(); setTarget(); });

    var chartBox = el("div", "if-live-chart"), chart = document.createElement("canvas"); chartBox.appendChild(chart);
    var desc = el("div", "if-small if-live-desc");

    var row2 = el("div", "if-studio-ctl"); row2.appendChild(el("span", "if-gtitle", "2 · Design space"));
    /* materials by family, one row each; a dashed chip was never seen in training */
    var matBox = el("div", "if-live-mats"), matBtns = {};
    function matChip(id) {
      var m = MAT[id], b = el("button", "if-mat" + (m.trained ? "" : " unseen"), '<span class="if-swatch" style="background:' + m.col + '"></span>' + esc(m.name));
      b.type = "button"; b.setAttribute("aria-pressed", "false");
      b.setAttribute("data-title", m.own ? m.name + " · your n,k data, " + Math.round(m.wl[0]) + "–" + Math.round(m.wl[m.wl.length - 1]) + " nm" : m.cls + (m.trained ? " · seen in training" : " · never seen in training: the model gets only its n,k curve") + (m.nkMax < WL_MAX ? " · n,k data to " + Math.max(TRAIN_MAX, NK_LIMIT[id][0]) + " nm" : ""));
      b.title = b.getAttribute("data-title");
      b.addEventListener("click", function () { toggleMat(id); }); matBtns[id] = b; return b;
    }
    FAMILIES.forEach(function (f) {
      var row = el("div", "if-live-matrow"), chips = el("div", "if-live-matchips");
      row.appendChild(el("span", "if-live-matlabel", f[0]));
      MATERIALS.forEach(function (m) { if (f[1].indexOf(m[2]) >= 0) chips.appendChild(matChip(m[0])); });
      row.appendChild(chips); matBox.appendChild(row);
    });
    /* your own materials: a CSV of wavelength, n, k */
    var ownRow = el("div", "if-live-matrow"), ownChips = el("div", "if-live-matchips"), ownNote = el("span", "if-small if-live-ownnote");
    var addBtn = el("button", "if-mat if-mat-add", "+ n,k"), nkIn = el("input"), exLink = el("a", "", "example file");
    addBtn.type = "button"; addBtn.title = "Add a material of your own from its n,k data";
    nkIn.type = "file"; nkIn.accept = ".csv,.txt,.tsv,.nk,text/csv,text/plain"; nkIn.hidden = true; nkIn.setAttribute("aria-label", "n,k data file");
    exLink.href = "#"; exLink.addEventListener("click", function (ev) { ev.preventDefault(); downloadText(exampleNk(), "example-nk.csv"); });
    addBtn.addEventListener("click", function () { nkIn.value = ""; nkIn.click(); });
    nkIn.addEventListener("change", function () { var f = nkIn.files && nkIn.files[0]; if (!f) return; var rd = new FileReader(); rd.onload = function () { addOwn(String(rd.result), f.name); }; rd.readAsText(f); });
    ownRow.appendChild(el("span", "if-live-matlabel", "Yours")); ownRow.appendChild(ownChips); matBox.appendChild(ownRow);
    function ownHelp() { ownNote.innerHTML = "A CSV of wavelength (nm or µm), n and k, covering the target band. "; ownNote.appendChild(exLink); }
    var matFoot = el("div", "if-live-matfoot"), matCount = el("span", "if-small if-live-matcount");
    var allTrained = el("button", "if-linkbtn", "Training set"), noneBtn = el("button", "if-linkbtn", "Clear");
    allTrained.type = noneBtn.type = "button";
    allTrained.addEventListener("click", function () { st.mats = {}; MATERIALS.forEach(function (m) { if (m[3]) st.mats[m[0]] = true; }); syncMats(); });
    noneBtn.addEventListener("click", function () { st.mats = {}; syncMats(); });
    matFoot.appendChild(matCount); matFoot.appendChild(allTrained); matFoot.appendChild(noneBtn);
    matFoot.appendChild(el("span", "if-small", "Dashed: never seen in training; the model gets only its n,k curve. Faded: no n,k data this far."));
    var row2b = el("div", "if-studio-ctl if-live-sizes");
    var gL = grp("layers", row2b), layerIn = el("input"), layerVal = el("span", "if-gval");
    layerIn.type = "range"; layerIn.min = 2; layerIn.max = 100; layerIn.step = 1; layerIn.setAttribute("aria-label", "Number of layers");
    layerIn.addEventListener("input", function () { st.layers = +layerIn.value; layerVal.textContent = st.layers; });
    gL.appendChild(layerIn); gL.appendChild(layerVal);
    var gN = grp("designs", row2b), nBtns = {};
    [8, 16, 32].forEach(function (n) { nBtns[n] = pill(String(n), function () { st.samples = n; syncN(); }); gN.appendChild(nBtns[n]); });

    var row3 = el("div", "if-studio-ctl if-studio-run"), goBtn = el("button", "if-btn", "Design with IrisFlow");
    goBtn.type = "button"; goBtn.addEventListener("click", run);
    var status = el("span", "if-small if-live-status"), hfLink = el("a", "if-small if-live-hf", "Open on Hugging Face ↗");
    hfLink.href = SPACE_PAGE; hfLink.target = "_blank"; hfLink.rel = "noopener";
    row3.appendChild(goBtn); row3.appendChild(status); row3.appendChild(hfLink);

    var out = el("div", "if-live-out");
    var outHead = el("div", "if-studio-ctl if-live-outhead"); outHead.appendChild(el("span", "if-gtitle", "3 · Designs"));
    var gRank = grp("rank by", outHead), rankBtns = {};
    [["match", "best match"], ["few", "fewest materials"], ["thin", "thinnest stack"]].forEach(function (r) { rankBtns[r[0]] = pill(r[1], function () { st.rank = r[0]; st.pick = 0; renderOut(); }); gRank.appendChild(rankBtns[r[0]]); });
    var picks = el("div", "if-live-picks"), stackC = document.createElement("canvas"), stackBox = el("div", "if-live-stack");
    stackBox.appendChild(stackC);
    var hoverLine = el("div", "if-small if-live-hover"), tableBox = el("div", "if-live-table"), actions = el("div", "if-live-actions");
    var copyBtn = el("button", "if-pill", "Copy recipe"), dlBtn = el("button", "if-pill", "Download CSV");
    copyBtn.type = dlBtn.type = "button"; actions.appendChild(copyBtn); actions.appendChild(dlBtn);
    copyBtn.addEventListener("click", function () { var d = current(); if (d && navigator.clipboard) navigator.clipboard.writeText(recipeCsv(d)).then(function () { flash(copyBtn, "Copied"); }); });
    dlBtn.addEventListener("click", function () {
      var d = current(); if (d) downloadText(recipeCsv(d), "irisflow-design.csv");
    });
    [outHead, picks, stackBox, hoverLine, tableBox, actions].forEach(function (x) { out.appendChild(x); });

    [row1, bandRow, chartBox, desc, row2, matBox, matFoot, row2b, row3, out].forEach(function (x) { container.appendChild(x); });

    /* ---- target ---- */
    function drawCurve(arr, lam) { var u = clamp((lam - st.draw.lo) / (st.draw.hi - st.draw.lo), 0, 1) * (KNOTS - 1), i = Math.min(KNOTS - 2, Math.floor(u)), g = u - i, w = (1 - Math.cos(Math.PI * g)) / 2; return arr[i] * (1 - w) + arr[i + 1] * w; }
    /* where the current source defines a target: a preset or a file on its own points, a drawing anywhere */
    function source() {
      if (st.mode === "preset") { var p = presets[st.preset]; return p ? { wl: p.wavelengths_nm, R: p.R, T: p.T } : null; }
      return st.mode === "csv" && st.csv ? st.csv.raw : null;
    }
    function domain() { var s = source(); return s ? [Math.max(WL_MIN, s.wl[0]), Math.min(WL_MAX, s.wl[s.wl.length - 1])] : [WL_MIN, WL_MAX]; }
    /* a preset's own bands: its grid split where it jumps over a region that is not scored */
    function nativeBands() {
      var p = presets[st.preset]; if (!p) return [];
      var wl = p.wavelengths_nm, gp = gapsOf(wl), out = [], a = 0;
      for (var i = 1; i <= wl.length; i++) if (i === wl.length || gp[i]) { out.push([wl[a], wl[i - 1]]); a = i; }
      return out;
    }
    function defaultBands() { return st.mode === "draw" ? [[420, 1000]] : st.mode === "csv" && st.csv ? [domain()] : null; }
    function curBands() { return st.bands[st.mode] || (st.mode === "preset" ? nativeBands() : []); }
    /* edits are kept inside the target's range, at least 10 nm wide, sorted, and merged where they overlap */
    function editBands(list) {
      var d = domain(), out = [];
      list.map(function (b) { var lo = clamp(Math.round(b[0]), d[0], d[1] - 10); return [lo, clamp(Math.round(b[1]), lo + 10, d[1])]; })
        .sort(function (a, b) { return a[0] - b[0]; })
        .forEach(function (b) { var l = out[out.length - 1]; if (l && b[0] <= l[1]) l[1] = Math.max(l[1], b[1]); else out.push(b); });
      st.bands[st.mode] = out; setTarget();
    }
    function syncBands() {
      var b = curBands(), d = domain();
      bandList.innerHTML = "";
      b.forEach(function (x, j) {
        var wrap = el("span", "if-live-band");
        [0, 1].forEach(function (e) {
          var inp = el("input", "if-live-num"); inp.type = "number"; inp.step = 10; inp.min = Math.floor(d[0]); inp.max = Math.ceil(d[1]); inp.value = Math.round(x[e]);
          inp.setAttribute("aria-label", "Band " + (j + 1) + (e ? " end" : " start") + " (nm)");
          inp.addEventListener("change", function () { var nb = curBands().map(function (y) { return y.slice(); }); nb[j][e] = +inp.value || x[e]; editBands(nb); });
          wrap.appendChild(inp); if (!e) wrap.appendChild(el("span", "if-small", "–"));
        });
        if (b.length > 1) {
          var del = el("button", "if-band-del", "×"); del.type = "button"; del.title = "Remove this band"; del.setAttribute("aria-label", "Remove band " + (j + 1));
          del.addEventListener("click", function () { editBands(curBands().filter(function (y, i) { return i !== j; })); });
          wrap.appendChild(del);
        }
        bandList.appendChild(wrap);
      });
      addBand.disabled = !b.length || b.length >= MAX_BANDS;
      resetBands.hidden = !st.bands[st.mode] || JSON.stringify(st.bands[st.mode]) === JSON.stringify(defaultBands());
    }
    function setTarget() {
      var t = null, b = curBands();
      if (st.mode === "preset" && presets.length && !st.bands.preset) { var p = presets[st.preset]; t = { wl: p.wavelengths_nm, R: p.R, T: p.T, gaps: gapsOf(p.wavelengths_nm) }; }
      else if (b.length) {
        var g = bandGrid(b), s = source();
        if (st.mode === "draw") { st.draw.lo = b[0][0]; st.draw.hi = b[b.length - 1][1]; s = { f: drawCurve }; }
        if (s) t = { wl: g.wl, gaps: g.gaps,
          R: g.wl.map(function (l) { return s.f ? s.f(st.draw.R, l) : interp(l, s.wl, s.R); }),
          T: g.wl.map(function (l) { return s.f ? s.f(st.draw.T, l) : interp(l, s.wl, s.T); }) };
      }
      st.target = t; st.result = null; st.pick = 0; st.example = false;
      if (!st.busy) status.textContent = ""; /* a new target: earlier messages and run times no longer apply */
      ownHelp();
      syncBands(); syncMats(); syncDesc(); render(); renderOut();
    }
    function syncDesc() {
      var h = "", t = st.target, gaps = t && Object.keys(t.gaps).length;
      if (st.mode === "preset") h = presets.length ? esc(presets[st.preset].desc) + " One of the application targets from the paper" + (gaps && !st.bands.preset ? "; the gaps are edge regions that are not scored." : ".") : "Loading presets…";
      else if (st.mode === "draw") h = "Drag on the chart to shape the " + (st.draw.edit === "R" ? "reflectance R" : "transmittance T") + " target. " + (st.draw.linked ? "T follows as 1 − R (no absorption)." : "R and T are separate, so the target may absorb light.");
      else h = st.csv ? esc(st.csv.msg) : "Columns: wavelength (nm or µm), R, and optionally T (otherwise T = 1 − R). Values in 0–1 or %. The model reads " + WL_MIN + "–" + WL_MAX + " nm; the rest is cut.";
      if (gaps && (st.mode !== "preset" || st.bands.preset)) h += " Grey stretches lie between the bands and are left out of the request.";
      if (t && t.wl[t.wl.length - 1] > TRAIN_MAX + 1) h += " The tinted part lies beyond the model's " + WL_MIN + "–" + TRAIN_MAX + " nm training band.";
      desc.innerHTML = h;
    }
    function parseCsv(text, name) {
      var rows = [];
      text.split(/\r?\n/).forEach(function (line) {
        var c = line.trim().split(/[\s,;]+/).map(Number);
        if (c.length >= 2 && c.slice(0, 3).every(function (x) { return isFinite(x); })) rows.push(c);
      });
      if (rows.length < 4) { st.csv = null; status.textContent = "Could not read at least 4 rows of numbers from " + name + "."; syncDesc(); return; }
      rows.sort(function (a, b) { return a[0] - b[0]; });
      var um = rows[rows.length - 1][0] < 20, pct = rows.some(function (r) { return r[1] > 1.5 || (r.length > 2 && r[2] > 1.5); });
      var wl = rows.map(function (r) { return um ? r[0] * 1000 : r[0]; }), sc = pct ? 0.01 : 1;
      var R = rows.map(function (r) { return clamp(r[1] * sc, 0, 1); }), T = rows.map(function (r) { return r.length > 2 ? clamp(r[2] * sc, 0, 1) : 1 - clamp(r[1] * sc, 0, 1); });
      var lo = Math.max(wl[0], WL_MIN), hi = Math.min(wl[wl.length - 1], WL_MAX);
      if (hi - lo < 20) { st.csv = null; setTarget(); status.textContent = name + " does not overlap " + WL_MIN + "–" + WL_MAX + " nm."; return; }
      st.csv = { raw: { wl: wl, R: R, T: T },
        msg: name + ": " + rows.length + " rows" + (um ? " (µm)" : "") + (pct ? " (%)" : "") + (rows[0].length > 2 ? "" : ", T taken as 1 − R") + ", resampled to " + S + " points inside the bands." };
      st.bands.csv = [[lo, hi]]; status.textContent = ""; setTarget();
    }

    /* ---- controls sync ---- */
    function setMode(m) {
      st.mode = m;
      Object.keys(modeBtns).forEach(function (k) { modeBtns[k].classList.toggle("active", k === m); });
      pPreset.classList.toggle("on", m === "preset"); pDraw.classList.toggle("on", m === "draw"); pCsv.classList.toggle("on", m === "csv");
      chart.style.touchAction = m === "draw" ? "none" : ""; chart.style.cursor = m === "draw" ? "crosshair" : "";
      setTarget();
    }
    function syncDraw() {
      if (st.draw.linked) st.draw.edit = "R";
      editR.classList.toggle("active", st.draw.edit === "R"); editT.classList.toggle("active", st.draw.edit === "T");
      linkBtn.classList.toggle("active", st.draw.linked); editT.disabled = st.draw.linked;
      syncDesc(); render();
    }
    /* a material can be used when its n,k data cover the target's wavelengths; the others stay greyed out (and keep
       their selection for when the band comes back within reach) */
    function covers(id) {
      var m = MAT[id], t = st.target; if (!t) return true;
      var lo = t.wl[0], hi = t.wl[t.wl.length - 1];
      return m.own ? m.wl[0] <= lo + 1 && m.wl[m.wl.length - 1] >= hi - 1 : m.nkMax >= hi - 1;
    }
    function gapNote(id) {
      var m = MAT[id], t = st.target;
      if (m.own) return m.name + "’s n,k data cover " + Math.round(m.wl[0]) + "–" + Math.round(m.wl[m.wl.length - 1]) + " nm, but the target spans " + Math.round(t.wl[0]) + "–" + Math.round(t.wl[t.wl.length - 1]) + " nm";
      return m.name + " has no n,k data beyond " + Math.max(TRAIN_MAX, NK_LIMIT[id][0]) + " nm, and the target reaches " + Math.round(t.wl[t.wl.length - 1]) + " nm";
    }
    function syncMats() {
      var left = 0;
      Object.keys(matBtns).forEach(function (id) {
        var on = !!st.mats[id], ok = covers(id), b = matBtns[id];
        b.classList.toggle("active", on && ok); b.classList.toggle("na", !ok);
        b.setAttribute("aria-pressed", on && ok ? "true" : "false"); b.setAttribute("aria-disabled", ok ? "false" : "true");
        b.title = ok ? b.getAttribute("data-title") : gapNote(id) + ".";
        if (on && !ok) left++;
      });
      var n = nMats();
      matCount.textContent = n + " selected" + (n < MIN_MATS ? ": choose at least " + MIN_MATS : n > MAX_MATS ? ": at most " + MAX_MATS + ", deselect " + (n - MAX_MATS) : "") +
        (left ? " · " + left + " more faded out at this band" : "");
      matCount.classList.toggle("if-warn", n < MIN_MATS || n > MAX_MATS);
    }
    function selected() { return MATERIALS.map(function (m) { return m[0]; }).concat(st.own).filter(function (k) { return st.mats[k] && covers(k); }); }
    function nMats() { return selected().length; }
    function toggleMat(id) {
      if (!covers(id)) { status.textContent = gapNote(id) + ". Narrow the bands, or add n,k data of your own that reach further."; return; }
      if (!st.mats[id] && nMats() >= MAX_MATS) { status.textContent = "At most " + MAX_MATS + " materials per request; deselect one first."; return; }
      st.mats[id] = !st.mats[id]; syncMats();
    }
    /* uploaded n,k: columns wavelength (nm, or µm when all values are below 30), n, and optionally k (either sign) */
    function addOwn(text, file) {
      if (st.own.length >= MAX_OWN) { ownNote.textContent = "At most " + MAX_OWN + " materials of your own; remove one first."; return; }
      var rows = [];
      text.split(/\r?\n/).forEach(function (line) {
        var c = line.trim().split(/[\s,;]+/).map(Number);
        if (c.length >= 2 && c.slice(0, Math.min(3, c.length)).every(function (x) { return isFinite(x); })) rows.push(c);
      });
      rows.sort(function (a, b) { return a[0] - b[0]; });
      rows = rows.filter(function (r, i) { return i === 0 || r[0] > rows[i - 1][0]; });
      if (rows.length < 2) { ownNote.textContent = "Could not read wavelength, n, k rows from " + file + "."; return; }
      var um = rows[rows.length - 1][0] < 30;
      if (rows.some(function (r) { return !(r[1] > 0 && r[1] <= 20) || Math.abs(r[2] || 0) > 50 || r[0] <= 0; })) { ownNote.textContent = file + ": expected n between 0 and 20 and |k| up to 50."; return; }
      if (rows.length > MAX_NK_ROWS) { var step = rows.length / MAX_NK_ROWS; rows = rows.filter(function (r, i) { return Math.floor(i / step) !== Math.floor((i - 1) / step) || i === rows.length - 1; }); }
      var name = file.replace(/\.[^.]*$/, "").replace(/[^\w .+()-]/g, "").trim().slice(0, 20) || "material", base = name, j = 2;
      while (Object.keys(MAT).some(function (k) { return !MAT[k].removed && MAT[k].name.toLowerCase() === name.toLowerCase(); })) name = base + "-" + j++;
      var id = "u" + (++ownSeq), m = { id: id, name: name, cls: "yours", trained: false, own: true, col: OWN_COL[(ownSeq - 1) % OWN_COL.length],
        wl: rows.map(function (r) { return um ? r[0] * 1000 : r[0]; }), n: rows.map(function (r) { return r[1]; }), k: rows.map(function (r) { return Math.abs(r[2] || 0); }) };
      MAT[id] = m; st.own.push(id);
      var wrap = el("span", "if-mat-own"), del = el("button", "if-mat-del", "×");
      del.type = "button"; del.setAttribute("aria-label", "Remove " + name); del.title = "Remove";
      del.addEventListener("click", function () { m.removed = true; delete st.mats[id]; st.own.splice(st.own.indexOf(id), 1); delete matBtns[id]; wrap.remove(); ownHelp(); syncMats(); });
      wrap.appendChild(matChip(id)); wrap.appendChild(del); ownChips.insertBefore(wrap, addBtn);
      st.mats[id] = true; /* always: it is the one the visitor wants to try, even if that goes over the limit for now */
      var lo = m.wl[0], hi = m.wl[m.wl.length - 1], t = st.target, ok = covers(id);
      ownNote.textContent = "Added " + name + ": " + Math.round(lo) + "–" + Math.round(hi) + " nm, " + rows.length + " points" + (um ? " (µm)" : "") + (rows[0].length > 2 ? "" : ", k = 0") + "." +
        (ok ? (nMats() > MAX_MATS ? " Deselect another material to stay within " + MAX_MATS + "." : "") : " It does not cover the current target (" + Math.round(t.wl[0]) + "–" + Math.round(t.wl[t.wl.length - 1]) + " nm), so it is left out for now.");
      syncMats();
    }
    function exampleNk() {
      var s = "wavelength_nm,n,k\n";
      for (var l = WL_MIN; l <= WL_MAX; l += 20) { var u = l / 1000; s += l + "," + (2.05 + 0.025 / (u * u)).toFixed(4) + ",0\n"; }
      return s;
    }
    function downloadText(text, name) {
      var a = document.createElement("a"); a.href = URL.createObjectURL(new Blob([text], { type: "text/csv" })); a.download = name;
      document.body.appendChild(a); a.click(); setTimeout(function () { URL.revokeObjectURL(a.href); a.remove(); }, 0);
    }
    function syncLayers() { layerIn.value = st.layers; layerVal.textContent = st.layers; }
    function syncN() { [8, 16, 32].forEach(function (n) { nBtns[n].classList.toggle("active", n === st.samples); }); }
    function flash(btn, txt) { var keep = btn.textContent; btn.textContent = txt; setTimeout(function () { btn.textContent = keep; }, 1200); }

    /* ---- spectrum chart ---- */
    var CH = 250, PAD = { l: 34, r: 12, t: 24, b: 26 }, geo = null;
    function xRange() { var t = st.target; if (st.mode === "draw") return [st.draw.lo, st.draw.hi]; return t ? [t.wl[0], t.wl[t.wl.length - 1]] : [WL_MIN, TRAIN_MAX]; }
    function render() {
      var W = Math.max(260, Math.floor(chartBox.getBoundingClientRect().width) || 600), ctx = setupCanvas(chart, W, CH), th = theme(container);
      var xr = xRange(), x0 = PAD.l, x1 = W - PAD.r, y0 = CH - PAD.b, y1 = PAD.t;
      function X(l) { return x0 + (l - xr[0]) / (xr[1] - xr[0] || 1) * (x1 - x0); }
      function Y(v) { return y0 - v * (y0 - y1); }
      geo = { X: X, Y: Y, x0: x0, x1: x1, y0: y0, y1: y1, xr: xr };
      ctx.clearRect(0, 0, W, CH);
      var t = st.target, d = current();
      /* grey: between bands, left out of the request; tinted: beyond the 1400 nm end of the training band */
      if (t) Object.keys(t.gaps).forEach(function (i) { var a = X(t.wl[i - 1]), b = X(t.wl[i]); ctx.fillStyle = th.line; ctx.fillRect(a, y1, b - a, y0 - y1); });
      if (xr[1] > TRAIN_MAX + 1) {
        var xa = Math.max(x0, X(TRAIN_MAX)); ctx.fillStyle = th.accent; ctx.globalAlpha = 0.07; ctx.fillRect(xa, y1, x1 - xa, y0 - y1); ctx.globalAlpha = 1;
        if (xa > x0) { ctx.strokeStyle = th.accent; ctx.globalAlpha = 0.45; ctx.setLineDash([3, 3]); ctx.beginPath(); ctx.moveTo(xa, y1); ctx.lineTo(xa, y0); ctx.stroke(); ctx.setLineDash([]); ctx.globalAlpha = 1; }
      }
      ctx.font = "11px system-ui, sans-serif"; ctx.textBaseline = "middle";
      ctx.strokeStyle = th.line; ctx.lineWidth = 1; ctx.fillStyle = th.muted; ctx.textAlign = "right";
      [0, 0.5, 1].forEach(function (v) { ctx.beginPath(); ctx.moveTo(x0, Y(v)); ctx.lineTo(x1, Y(v)); ctx.stroke(); ctx.fillText(String(v), x0 - 6, Y(v)); });
      var span = xr[1] - xr[0], step = [10, 20, 50, 100, 200, 250, 500].filter(function (s) { return span / s <= (W < 480 ? 5 : 9); })[0] || 500;
      ctx.textAlign = "center"; ctx.textBaseline = "top";
      /* a label that would cross the axis start is left out, so it never runs into the "nm" unit */
      /* a label at the right end is pulled in so it is not clipped */
      for (var l = Math.ceil(xr[0] / step) * step; l <= xr[1] + 1e-6; l += step) { var tw = ctx.measureText(String(l)).width; if (X(l) - tw / 2 >= x0 - 2) ctx.fillText(String(l), Math.min(X(l), W - 1 - tw / 2), y0 + 6); ctx.beginPath(); ctx.moveTo(X(l), y0); ctx.lineTo(X(l), y0 + 3); ctx.stroke(); }
      ctx.textAlign = "right"; ctx.fillText("nm", x0 - 6, y0 + 6);
      function line(wl, ys, col, dash, width, gaps) {
        ctx.strokeStyle = col; ctx.lineWidth = width; ctx.setLineDash(dash); ctx.beginPath();
        for (var i = 0; i < wl.length; i++) { if (i === 0 || (gaps && gaps[i])) ctx.moveTo(X(wl[i]), Y(ys[i])); else ctx.lineTo(X(wl[i]), Y(ys[i])); }
        ctx.stroke(); ctx.setLineDash([]);
      }
      if (t) { line(t.wl, t.R, th.R, [5, 4], 1.4, t.gaps); line(t.wl, t.T, th.T, [5, 4], 1.4, t.gaps); }
      if (d) { var rw = st.result.wavelengths_nm; line(rw, d.R, th.R, [], 2.2, t && t.gaps); line(rw, d.T, th.T, [], 2.2, t && t.gaps); }
      if (st.mode === "draw") {
        ["R", "T"].forEach(function (c) {
          if (st.draw.linked && c === "T") return;
          var on = st.draw.edit === c; ctx.fillStyle = on ? (c === "R" ? th.R : th.T) : th.bg; ctx.strokeStyle = c === "R" ? th.R : th.T; ctx.lineWidth = 1.2;
          var bs = curBands(); /* knots between bands shape nothing that is sent, so they are faint */
          st.draw[c].forEach(function (v, k) {
            var lam = st.draw.lo + (st.draw.hi - st.draw.lo) * k / (KNOTS - 1);
            ctx.globalAlpha = bs.some(function (b) { return lam >= b[0] - 1 && lam <= b[1] + 1; }) ? 1 : 0.3;
            ctx.beginPath(); ctx.arc(X(lam), Y(v), on ? 3.6 : 2.6, 0, 2 * Math.PI); ctx.fill(); ctx.stroke();
          });
          ctx.globalAlpha = 1;
        });
      }
      /* legend */
      ctx.textBaseline = "middle"; ctx.textAlign = "left"; ctx.font = "11px system-ui, sans-serif";
      var lx = x0 + 2, ly = 10;
      [["R", th.R], ["T", th.T]].forEach(function (s) { ctx.fillStyle = s[1]; ctx.fillRect(lx, ly - 4, 9, 9); ctx.fillStyle = th.text; ctx.fillText(s[0], lx + 13, ly); lx += 32; });
      ctx.strokeStyle = th.muted; ctx.lineWidth = 1.4; ctx.setLineDash([5, 4]); ctx.beginPath(); ctx.moveTo(lx, ly); ctx.lineTo(lx + 20, ly); ctx.stroke(); ctx.setLineDash([]);
      ctx.fillStyle = th.text; ctx.fillText("target", lx + 25, ly); lx += 72;
      ctx.lineWidth = 2.2; ctx.beginPath(); ctx.moveTo(lx, ly); ctx.lineTo(lx + 20, ly); ctx.stroke();
      ctx.fillStyle = d ? th.text : th.muted; ctx.fillText(d ? "design #" + (st.pick + 1) : "design", lx + 25, ly);
    }

    /* drawing a target: drag across the chart; the stroke sets every knot it passes */
    var lastK = null;
    function knotAt(ev) {
      var r = chart.getBoundingClientRect(), x = ev.clientX - r.left, y = ev.clientY - r.top;
      var u = clamp((x - geo.x0) / (geo.x1 - geo.x0), 0, 1); return { k: Math.round(u * (KNOTS - 1)), v: clamp((geo.y0 - y) / (geo.y0 - geo.y1), 0, 1) };
    }
    function paint(ev) {
      var p = knotAt(ev), c = st.draw.edit, o = c === "R" ? "T" : "R", a = lastK || p, n = Math.abs(p.k - a.k);
      for (var j = 0; j <= n; j++) {
        var k = n ? Math.round(a.k + (p.k - a.k) * j / n) : p.k, v = n ? a.v + (p.v - a.v) * j / n : p.v;
        st.draw[c][k] = v;
        if (st.draw.linked) st.draw[o][k] = 1 - v; else st.draw[o][k] = Math.min(st.draw[o][k], 1 - v);
      }
      lastK = p; setTarget();
    }
    chart.addEventListener("pointerdown", function (ev) { if (st.mode !== "draw" || !geo) return; chart.setPointerCapture(ev.pointerId); lastK = null; paint(ev); });
    chart.addEventListener("pointermove", function (ev) { if (st.mode === "draw" && lastK) paint(ev); });
    ["pointerup", "pointercancel"].forEach(function (e) { chart.addEventListener(e, function () { lastK = null; }); });

    /* ---- results ---- */
    function ranked() {
      if (!st.result) return [];
      var ds = st.result.designs.slice();
      var key = { match: function (d) { return [d.mae]; }, few: function (d) { return [d.n_materials, d.mae]; }, thin: function (d) { return [d.total_nm, d.mae]; } }[st.rank];
      return ds.sort(function (a, b) { var ka = key(a), kb = key(b); for (var i = 0; i < ka.length; i++) if (ka[i] !== kb[i]) return ka[i] - kb[i]; return 0; });
    }
    function current() { var r = ranked(); return r[st.pick] || null; }
    function recipeCsv(d) { return "layer,material,thickness_nm\n" + d.layers.map(function (l, i) { return (i + 1) + "," + MAT[l.material].name + "," + l.thickness_nm; }).join("\n") + "\n"; }
    var SH = 64;
    function renderOut() {
      Object.keys(rankBtns).forEach(function (k) { rankBtns[k].classList.toggle("active", k === st.rank); });
      var ds = ranked(), d = ds[st.pick] || null, th = theme(container);
      out.classList.toggle("empty", !d);
      picks.innerHTML = "";
      ds.forEach(function (x, i) {
        var b = el("button", "if-pill" + (i === st.pick ? " active" : ""), "#" + (i + 1) + " <span class=\"if-live-mae\">" + x.mae.toFixed(3) + "</span>");
        b.type = "button"; b.title = x.layers.length + " layers, " + x.n_materials + " materials, " + Math.round(x.total_nm) + " nm, mean |error| " + x.mae.toFixed(4);
        b.addEventListener("click", function () { st.pick = i; renderOut(); render(); }); picks.appendChild(b);
      });
      if (!d) picks.appendChild(el("span", "if-small", st.busy ? "Generating…" : "Nothing yet: press “Design with IrisFlow”."));
      /* stack: substrate on the left, air on the right, bar length = thickness */
      var W = Math.max(260, Math.floor(stackBox.getBoundingClientRect().width) || 600), ctx = setupCanvas(stackC, W, SH);
      ctx.clearRect(0, 0, W, SH); ctx.font = "11px system-ui, sans-serif"; ctx.textBaseline = "middle";
      var sw = 52, aw = 30, x = sw, top = 8, h = SH - 22;
      ctx.fillStyle = th.line; ctx.fillRect(0, top, sw - 2, h); ctx.fillStyle = th.muted; ctx.textAlign = "center"; ctx.fillText("substrate", sw / 2 - 1, top + h + 8); ctx.fillText("air", W - aw / 2, top + h + 8);
      stackC._hits = [];
      if (d) {
        var total = d.layers.reduce(function (s, l) { return s + l.thickness_nm; }, 0), scale = (W - sw - aw) / total;
        d.layers.forEach(function (l, i) {
          var w = Math.max(1, l.thickness_nm * scale); ctx.fillStyle = MAT[l.material].col; ctx.globalAlpha = st.hover === -1 || st.hover === i ? 1 : 0.45;
          ctx.fillRect(x, top, Math.max(1, w - (w > 3 ? 1 : 0)), h); stackC._hits.push([x, x + w, i]); x += w;
        });
        ctx.globalAlpha = 1;
      } else { ctx.strokeStyle = th.line; ctx.setLineDash([4, 4]); ctx.strokeRect(sw + 0.5, top + 0.5, W - sw - aw - 1, h - 1); ctx.setLineDash([]); }
      /* table */
      if (d) {
        var rows = d.layers.map(function (l, i) { return "<tr data-i=\"" + i + "\"" + (i === st.hover ? " class=\"on\"" : "") + "><td>" + (i + 1) + "</td><td><span class=\"if-swatch\" style=\"background:" + MAT[l.material].col + "\"></span> " + esc(MAT[l.material].name) + (MAT[l.material].own ? " <span class=\"if-small\">yours</span>" : MAT[l.material].trained ? "" : " <span class=\"if-small\">unseen</span>") + "</td><td>" + l.thickness_nm.toFixed(1) + "</td></tr>"; }).join("");
        tableBox.innerHTML = "<table><thead><tr><th title=\"Layer 1 sits on the fused-silica substrate\">layer</th><th>material</th><th>thickness (nm)</th></tr></thead><tbody>" + rows + "</tbody></table>";
        hoverLine.innerHTML = st.hover >= 0 && d.layers[st.hover] ? "Layer " + (st.hover + 1) + " · " + esc(MAT[d.layers[st.hover].material].name) + " · " + d.layers[st.hover].thickness_nm.toFixed(1) + " nm" :
          d.layers.length + " layers · " + d.n_materials + " materials · " + Math.round(d.total_nm) + " nm in total · mean |error| " + d.mae.toFixed(3);
      } else { tableBox.innerHTML = ""; hoverLine.innerHTML = "&nbsp;"; }
      copyBtn.disabled = dlBtn.disabled = !d;
    }
    function setHover(i) { if (i === st.hover) return; st.hover = i; renderOut(); }
    stackC.addEventListener("pointermove", function (ev) { var r = stackC.getBoundingClientRect(), x = ev.clientX - r.left, hit = (stackC._hits || []).filter(function (h) { return x >= h[0] && x < h[1]; })[0]; setHover(hit ? hit[2] : -1); });
    stackC.addEventListener("pointerleave", function () { setHover(-1); });
    tableBox.addEventListener("pointerover", function (ev) { var tr = ev.target.closest && ev.target.closest("tr[data-i]"); setHover(tr ? +tr.getAttribute("data-i") : -1); });
    tableBox.addEventListener("pointerleave", function () { setHover(-1); });

    /* ---- the Space ---- */
    /* local testing hook: on localhost, ?if-space=http://127.0.0.1:7860 talks to a Space app running on this machine */
    var devSpace = /^(localhost|127\.0\.0\.1)$/.test(location.hostname) && (/[?&]if-space=([^&#]+)/.exec(location.search) || [])[1];
    var host = devSpace ? decodeURIComponent(devSpace) : null, stage = null;
    function api(path) { return fetch("https://huggingface.co/api/spaces/" + SPACE + path).then(function (r) { if (!r.ok) throw new Error("HTTP " + r.status); return r.json(); }); }
    function getHost() {
      if (host) return Promise.resolve(host);
      return api("/host").then(function (j) { host = j.host; return host; }, function () { host = "https://" + SPACE.toLowerCase().replace(/[^a-z0-9]+/g, "-") + ".hf.space"; return host; });
    }
    function getStage() { if (devSpace) return Promise.resolve("RUNNING"); return api("").then(function (j) { stage = j.runtime && j.runtime.stage; return stage; }, function () { return null; }); }
    var WAKING = { SLEEPING: 1, STOPPED: 1, BUILDING: 1, RUNNING_BUILDING: 1, APP_STARTING: 1, RUNNING_APP_STARTING: 1 };
    /* resolves once the Space runs; a sleeping Space starts when its page is requested */
    function ensureAwake(onWait) {
      var t0 = Date.now();
      return getHost().then(function (h) {
        return (function poll() {
          return getStage().then(function (s) {
            if (s === "RUNNING" || s === null) return h;
            if (!WAKING[s]) throw new Error("The demo Space is offline (" + s.toLowerCase().replace(/_/g, " ") + "). It may be paused; try the Hugging Face page.");
            if (s === "SLEEPING" || s === "STOPPED") fetch(h + "/", { mode: "no-cors" }).catch(function () {});
            if (Date.now() - t0 > 240000) throw new Error("The Space is taking unusually long to start; try again in a minute.");
            if (onWait) onWait(Date.now() - t0);
            return new Promise(function (res) { setTimeout(res, 4000); }).then(poll);
          });
        })();
      });
    }
    function parseSse(text) {
      var ev = null, data = null;
      text.split(/\n\n+/).forEach(function (block) {
        var e = /^event:\s*(.*)$/m.exec(block), d = /^data:\s*(.*)$/m.exec(block);
        if (e && (e[1] === "complete" || e[1] === "error")) { ev = e[1]; data = d ? d[1] : null; }
      });
      if (ev === "complete") return JSON.parse(JSON.parse(data)[0]);
      var msg = null; try { msg = JSON.parse(data); } catch (x) { msg = data; }
      if (msg && typeof msg === "object") msg = msg.error;
      throw new Error(typeof msg === "string" && msg ? "The model could not run this request: " + msg + "." : "The model returned an error.");
    }
    function callDesign(req) {
      return getHost().then(function (h) {
        return fetch(h + "/gradio_api/call/design", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ data: [JSON.stringify(req)] }) })
          .then(function (r) { if (!r.ok) throw new Error("The Space answered HTTP " + r.status + "."); return r.json(); })
          .then(function (j) { return fetch(h + "/gradio_api/call/design/" + j.event_id); })
          .then(function (r) { return r.text(); }).then(parseSse);
      });
    }

    function run() {
      if (st.busy || !st.target) { if (!st.target) status.textContent = st.mode === "csv" ? "Choose a CSV file first." : "The target is not ready yet."; return; }
      var mats = selected(); /* only materials whose n,k data cover the target */
      if (mats.length < MIN_MATS || mats.length > MAX_MATS) { status.textContent = (mats.length < MIN_MATS ? "Choose at least " + MIN_MATS : "Choose at most " + MAX_MATS) + " materials whose n,k data cover the target: the model was trained with pools of 3 to 15. It does not have to use all of them."; return; }
      var req = { wavelengths_nm: st.target.wl, R: st.target.R, T: st.target.T, materials: mats,
        layers: st.layers, samples: st.samples, steps: STEPS, seed: Math.floor(Math.random() * 1e9) };
      var own = mats.filter(function (k) { return MAT[k].own; });
      if (own.length) req.custom_materials = own.map(function (k) { var m = MAT[k]; return { id: k, name: m.name, wavelengths_nm: m.wl, n: m.n, k: m.k }; });
      var t0 = Date.now(), timer = null, target = st.target;
      st.busy = true; goBtn.disabled = true; st.result = null; st.example = false; renderOut(); render();
      function tick(prefix) { clearInterval(timer); var f = function () { status.textContent = prefix + " " + Math.round((Date.now() - t0) / 1000) + " s"; }; f(); timer = setInterval(f, 1000); }
      tick("Contacting the model…");
      ensureAwake(function () { tick("The model was asleep and is starting up on Hugging Face (about a minute)…"); })
        .then(function () { t0 = Date.now(); tick("Generating " + st.samples + " designs and re-simulating each one…"); return callDesign(req); })
        .then(function (res) {
          if (st.target !== target) return;
          st.result = res; st.pick = 0; st.hover = -1;
          var n = res.designs.length, secs = ((Date.now() - t0) / 1000).toFixed(1) + " s";
          status.textContent = !n ? "No valid design came back; try again."
            : res.device === "gpu" ? n + " designs in " + secs + " on a GPU."
            : res.gpu_error === "quota" ? "Your free GPU time is used up for now, so " + n + " designs ran on a CPU (" + secs + ")."
            : res.gpu_error ? "No GPU was free, so " + n + " designs ran on a CPU (" + secs + ")."
            : n + " designs in " + secs + " on a CPU.";
        })
        .catch(function (e) { status.textContent = (e && e.message && !/Failed to fetch|NetworkError|Load failed/i.test(e.message)) ? e.message : "Could not reach the model on Hugging Face. Try again, or open the Space directly."; })
        .then(function () { clearInterval(timer); st.busy = false; goBtn.disabled = false; renderOut(); render(); });
    }

    /* ---- boot ---- */
    ownChips.appendChild(addBtn); ownChips.appendChild(nkIn); ownChips.appendChild(ownNote); ownHelp();
    syncMats(); syncLayers(); syncN(); syncDraw(); setMode("preset");
    fetch(PRESET_URL).then(function (r) { return r.json(); }).then(function (p) {
      presets = p;
      /* the paper's application targets, those inside the training band first, then those beyond it */
      presetSel.innerHTML = [["Within the training band (380–1400 nm)", false], ["Beyond the training band (to 2500 nm)", true]].map(function (g) {
        return "<optgroup label=\"" + g[0] + "\">" + p.map(function (x, i) { return !!x.beyond === g[1] ? "<option value=\"" + i + "\">" + esc(x.name) + "</option>" : ""; }).join("") + "</optgroup>";
      }).join("");
      st.layers = p[0].layers; syncLayers(); setTarget();
      /* the first preset carries one earlier run of the default request, shown until the visitor changes something */
      if (p[0].example) {
        st.result = p[0].example; st.example = true; renderOut(); render();
        status.textContent = "Example: designs the model generated earlier for this target. Press “Design with IrisFlow” to run it yourself.";
      }
    }).catch(function () { desc.textContent = "Could not load the preset targets; draw a target or upload one instead."; });
    /* wake the Space as soon as the panel comes into view, so it is ready by the time a request is set up */
    var woke = false;
    if ("IntersectionObserver" in window) new IntersectionObserver(function (es) { es.forEach(function (e) { if (e.isIntersecting && !woke) { woke = true; ensureAwake().catch(function () {}); } }); }, { threshold: 0.05 }).observe(container);
    var lastW = 0;
    function onResize() { var w = container.getBoundingClientRect().width; if (Math.abs(w - lastW) > 1) { lastW = w; render(); renderOut(); } }
    if ("ResizeObserver" in window) new ResizeObserver(onResize).observe(container); else window.addEventListener("resize", onResize);
    if ("MutationObserver" in window) new MutationObserver(function () { render(); renderOut(); }).observe(document.documentElement, { attributes: true, attributeFilter: ["data-theme"] });
  }

  function boot() { document.querySelectorAll("[data-if-live]").forEach(initLive); }
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", boot); else boot();
})();
