/* IrisFlow demos for z-one-l.github.io — vanilla JS, no dependencies.
   Four schematic canvases, all in the same picture language (a colour is a material, a bar length is a
   thickness, every curve is illustrative): the advantages map, the joint-flow coupling panel, the data
   pipeline and the four-step studio. Pages opt in with data-if-map, data-if-idea="joint", data-if-pipeline
   and data-if-studio. */
(function () {
  "use strict";
  if (typeof document === "undefined") return;
  var TWO_PI = 2 * Math.PI;

  /* utilities */
  function mulberry32(seed) { return function () { seed |= 0; seed = seed + 0x6D2B79F5 | 0; var t = Math.imul(seed ^ seed >>> 15, 1 | seed); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; }; }
  function gauss(rnd) { var u = 1 - rnd(), v = rnd(); return Math.sqrt(-2 * Math.log(u)) * Math.cos(TWO_PI * v); }
  function clamp(x, a, b) { return x < a ? a : x > b ? b : x; }
  function lerp(a, b, f) { return a + (b - a) * f; }
  function entropyNorm(p) { var h = 0, n = p.length; if (n < 2) return 0; for (var i = 0; i < n; i++) if (p[i] > 0) h -= p[i] * Math.log(p[i]); return h / Math.log(n); }

  /* ============================ UI HELPERS ============================ */
  function theme(elm) {
    var cs = getComputedStyle(elm);
    function v(name, fb) { var x = cs.getPropertyValue(name).trim(); return x || fb; }
    var dark = document.documentElement.getAttribute("data-theme") === "dark";
    return { text: v("--if-text", dark ? "#e4e4e4" : "#111"), muted: v("--if-muted", "#888"), bg: v("--if-bg", dark ? "#1c1c1d" : "#fff"), line: v("--if-line", dark ? "#3a3a3a" : "#e6e6e6"), accent: v("--if-accent", "#b509ac"), R: v("--if-r", "#d64545"), T: v("--if-t", "#2f6fd6"), dark: dark };
  }
  function setupCanvas(canvas, cssW, cssH) {
    var dpr = window.devicePixelRatio || 1;
    canvas.width = Math.round(cssW * dpr); canvas.height = Math.round(cssH * dpr);
    canvas.style.width = "100%"; canvas.style.maxWidth = cssW + "px"; canvas.style.height = cssH + "px";
    var ctx = canvas.getContext("2d"); ctx.setTransform(dpr, 0, 0, dpr, 0, 0); return ctx;
  }
  function el(tag, cls, html) { var e = document.createElement(tag); if (cls) e.className = cls; if (html != null) e.innerHTML = html; return e; }
  function widthOf(elm, fb) { return Math.max(120, Math.floor(elm.getBoundingClientRect().width) || fb); }
  function esc(s) { return String(s).replace(/[&<>"]/g, function (c) { return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]; }); }
  /* Text that changes while a demo plays must not resize its panel, or everything below it jumps.
     These reserve the largest box among all the contents an element can show, at the current width. */
  function reserveHeight(elm, htmls) {
    var keep = elm.innerHTML, h = 0; elm.style.boxSizing = "border-box"; elm.style.minHeight = "0";
    htmls.forEach(function (s) { elm.innerHTML = s; h = Math.max(h, Math.ceil(elm.getBoundingClientRect().height)); });
    elm.innerHTML = keep; elm.style.minHeight = h + "px";
  }
  function reserveWidth(btn, labels) {
    var keep = btn.textContent, w = 0; btn.style.boxSizing = "border-box"; btn.style.minWidth = "0";
    labels.forEach(function (s) { btn.textContent = s; w = Math.max(w, Math.ceil(btn.getBoundingClientRect().width)); });
    btn.textContent = keep; btn.style.minWidth = w + "px";
  }
  var reduceMotion = window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  var live = []; /* components with a render() to refresh on theme change */

  /* ============================ STUDIO (how the framework is used) ============================ */
  /* The user's workflow as one always-visible picture: 1 Request → 2 Generate → 3 Verify → 4 Select.
     Same picture language as the pipeline: colours are materials, bar lengths thicknesses, spectra are
     illustrative. A scripted run follows the real mechanics: several designs from different noise under one
     shared clock, straight-path lengths, Markov-resampled colours, pinned coordinates that never move,
     exact verification and selection by a rule. Logical canvas 1000 x 600. */
  function initStudio(container) {
    container.innerHTML = "";
    var SW = 1000, SH = 600, HN = 25, GN = 48, KS = 8, PAL = PIPE_COLORS, LET = PIPE_LETTERS;
    var reqCtl = el("div", "if-studio-ctl"), scroller = el("div", "if-pipe-scroll"), canvas = document.createElement("canvas"); scroller.appendChild(canvas);
    var runCtl = el("div", "if-studio-ctl if-studio-run"), narr = el("div", "if-hood if-pipe-narr");
    container.appendChild(reqCtl); container.appendChild(scroller); container.appendChild(runCtl); container.appendChild(narr);

    /* ---- request ---- */
    var TPR = {
      peaks: { label: "Two peaks", fn: function (u) { return 0.08 + 0.72 * Math.exp(-Math.pow((u - 0.3) / 0.08, 2)) + 0.46 * Math.exp(-Math.pow((u - 0.7) / 0.07, 2)); } },
      band: { label: "Flat band", fn: function (u) { return 0.08 + 0.8 / (1 + Math.exp(-30 * (u - 0.35))) / (1 + Math.exp(30 * (u - 0.65))); } },
      edge: { label: "Edge", fn: function (u) { return 0.08 + 0.8 / (1 + Math.exp(-25 * (u - 0.5))); } },
      notch: { label: "Notch", fn: function (u) { return 0.86 - 0.74 * Math.exp(-Math.pow((u - 0.5) / 0.075, 2)); } }
    };
    var req = { preset: "peaks", h: [], band: false, pal: [0, 1, 2, 3], L: 6, pin: false, N: 8 };
    function setPreset(key) { req.preset = key; req.h = []; for (var i = 0; i < HN; i++) req.h.push(clamp(TPR[key].fn(i / (HN - 1)), 0, 1)); }
    setPreset("peaks");
    function tAt(h, u) { var f = clamp(u, 0, 1) * (HN - 1), i = Math.min(HN - 2, Math.floor(f)), g = f - i, w = (1 - Math.cos(Math.PI * g)) / 2; return h[i] * (1 - w) + h[i + 1] * w; }
    function nk2(j, u) { var ph = j * 1.7 + 0.4, f = 0.7 + 0.12 * j; return { n: 0.52 + 0.3 * Math.sin(TWO_PI * f * u * 0.7 + ph), k: 0.24 + 0.16 * Math.cos(TWO_PI * f * u + ph * 1.3) }; }
    function len2(x) { return clamp(0.5 + 0.4 * x, 0.06, 1); }

    /* ---- controls ---- */
    var RULES = { match: "Best match", few: "Fewest materials", thin: "Thinnest stack" }, rule = "match";
    function grp(lbl, parent) { var g = el("span", "if-group"); g.appendChild(el("span", "if-glabel", lbl)); (parent || reqCtl).appendChild(g); return g; }
    function pill(html, on) { var bt = el("button", "if-pill", html); bt.type = "button"; bt.addEventListener("click", on); return bt; }
    reqCtl.appendChild(el("span", "if-gtitle", "1 · Your request"));
    var gT = grp("target"), tP = {};
    Object.keys(TPR).forEach(function (k) { tP[k] = pill(TPR[k].label, function () { setPreset(k); edited(); }); gT.appendChild(tP[k]); });
    tP.draw = pill("Draw on the plot", function () { req.preset = "draw"; edited(); }); gT.appendChild(tP.draw);
    var gB = grp("band"), bandP = pill("extend past the training range", function () { req.band = !req.band; edited(); }); gB.appendChild(bandP);
    var gM = grp("materials"), mP = [];
    [0, 1, 2, 3, 4, 5].forEach(function (j) { mP[j] = pill('<span class="if-swatch" style="background:' + PAL[j] + '"></span>' + LET[j] + (j === 5 ? " · new" : ""), function () { var i = req.pal.indexOf(j); if (i >= 0) { if (req.pal.length > 2) req.pal.splice(i, 1); } else { req.pal.push(j); req.pal.sort(); } edited(); }); gM.appendChild(mP[j]); });
    var gL = grp("layers"), lVal = el("b", "if-gval", "");
    gL.appendChild(pill("−", function () { req.L = Math.max(3, req.L - 1); edited(); })); gL.appendChild(lVal); gL.appendChild(pill("+", function () { req.L = Math.min(10, req.L + 1); edited(); }));
    var gP = grp("constraint"), pinP = pill("pin the bottom layer", function () { req.pin = !req.pin; edited(); }); gP.appendChild(pinP);
    var gN = grp("designs"), nP = {};
    [4, 8, 12].forEach(function (n) { nP[n] = pill(String(n), function () { req.N = n; edited(); }); gN.appendChild(nP[n]); });
    var genBtn = el("button", "if-btn", "Generate designs"); genBtn.type = "button"; runCtl.appendChild(genBtn);
    var gR = grp("pick by", runCtl), rP = {};
    Object.keys(RULES).forEach(function (r) { rP[r] = pill(RULES[r], function () { setRule(r); }); gR.appendChild(rP[r]); });
    runCtl.appendChild(el("span", "if-small", "Click any design in column 3 to inspect it."));

    /* ---- run ---- */
    var T_SEND = 1.4, T_GEN = 7.5, T_V0 = T_SEND + T_GEN, T_VST = 2.4, T_VD = 1.3, T_RANK = T_V0 + T_VST + T_VD + 0.3, T_SEL = T_RANK + 1.0, T_END = T_SEL + 2.4;
    var run = null, dirty = false, started = false, frozen = false, tau = 0, seedBase = 1 + Math.floor(Math.random() * 1e9), runCount = 0;
    function shuffled(arr, rnd) { var q = arr.slice(); for (var i = q.length - 1; i > 0; i--) { var j = Math.floor(rnd() * (i + 1)), t = q[i]; q[i] = q[j]; q[j] = t; } return q; }
    function buildRun() {
      var rnd = mulberry32(seedBase + 7919 * (runCount++)), P = req.pal.slice(), C = P.length, L = req.L, N = req.N, pin = req.pin, pc = P[0];
      var tgt = [], i, n, l, j, k; for (i = 0; i < GN; i++) tgt.push(tAt(req.h, i / (GN - 1)));
      var cs = [];
      for (n = 0; n < N; n++) {
        var kSub = Math.min(C, 2 + Math.floor(rnd() * (C - 1))), sub = shuffled(P, rnd).slice(0, kSub);
        if (P.indexOf(5) >= 0 && n % 2 === 0 && sub.indexOf(5) < 0) sub[0] = 5;
        if (pin && sub.indexOf(pc) < 0) sub[sub.length - 1] = pc;
        var thick = rnd(), c = { xs: [], ms: [], eps: [], wa: [], wb: [], ws: [], noise: [], comp: [], resid: 0.004 + 0.075 * Math.pow(rnd(), 1.4), rf: 2 + 3 * rnd(), rp: rnd(), x: [], m: [] };
        for (l = 0; l < L; l++) {
          c.xs.push(clamp(-0.55 + 1.1 * rnd() + (thick - 0.5) * 1.1, -1.15, 1.15));
          c.ms.push(pin && l === 0 ? pc : sub[Math.floor(rnd() * kSub)]);
          c.eps.push(clamp(gauss(rnd), -1.9, 1.9)); c.x.push(c.eps[l]);
          c.m.push(pin && l === 0 ? pc : P[Math.floor(rnd() * C)]);
          c.wa.push(1.1 + 2.8 * rnd()); c.wb.push(rnd()); c.ws.push(rnd() < 0.5 ? -1 : 1);
          var nz = []; for (j = 0; j < C; j++) nz.push(rnd() * 0.9); c.noise.push(nz);
          var cc = Math.floor(rnd() * C); c.comp.push(P[cc] === c.ms[l] ? P[(cc + 1) % C] : P[cc]);
        }
        c.states = [{ x: c.x.slice(), m: c.m.slice(), ch: [] }];
        cs.push(c);
      }
      var drawFrom = function (pp) { var r = rnd(), acc = 0; for (var jj = 0; jj < C; jj++) { acc += pp[jj]; if (r <= acc) return P[jj]; } return P[C - 1]; };
      var t = 1, nodes = [1], freeL = L - (pin ? 1 : 0);
      for (k = 0; k < KS; k++) {
        var uSum = 0, posts = [];
        for (n = 0; n < N; n++) {
          var c2 = cs[n], frac = 0; for (l = 0; l < L; l++) if (c2.m[l] === c2.ms[l]) frac++; frac /= L;
          var sh = 0.3 + 2.6 * (k / (KS - 1)) + 1.4 * frac, pp = [];
          for (l = 0; l < L; l++) { var lg = []; for (j = 0; j < C; j++) lg.push((c2.noise[l][j] + (P[j] === c2.ms[l] ? 2.2 : 0) + (P[j] === c2.comp[l] ? 1.1 * Math.sin(Math.PI * k / (KS - 1)) : 0)) * sh); var q = softmaxArr(lg); pp.push(q); if (!(pin && l === 0)) uSum += entropyNorm(q) / freeL; }
          posts.push(pp);
        }
        var u = uSum / N, mk = KS - k, s = mk > 1 ? t * Math.pow((mk - 1) / mk, 1 + u) : 0, lam = 1 / (KS - k);
        for (n = 0; n < N; n++) {
          var c3 = cs[n], ch = [], res = [];
          for (l = 0; l < L; l++) c3.x[l] = s > 0 ? c3.x[l] + (s - t) * (c3.eps[l] - c3.xs[l]) : c3.xs[l];
          for (l = 0; l < L; l++) res.push(!(pin && l === 0) && rnd() < lam);
          if (k < KS - 1 && res.indexOf(true) < 0) { var fl = []; for (l = 0; l < L; l++) if (!(pin && l === 0)) fl.push(l); if (fl.length) res[fl[Math.floor(rnd() * fl.length)]] = true; }
          for (l = 0; l < L; l++) if (res[l]) { var nm = k === KS - 1 ? c3.ms[l] : drawFrom(posts[n][l]); if (nm !== c3.m[l]) ch.push(l); c3.m[l] = nm; }
          c3.states.push({ x: c3.x.slice(), m: c3.m.slice(), ch: ch });
        }
        nodes.push(s); t = s;
      }
      cs.forEach(function (c4) {
        c4.final = []; var mis = 0;
        for (var i2 = 0; i2 < GN; i2++) { var uu = i2 / (GN - 1), v = tgt[i2] + c4.resid * Math.sin(TWO_PI * (c4.rf * uu + c4.rp)); c4.final.push(clamp(v, 0, 1)); mis += Math.abs(c4.final[i2] - tgt[i2]); }
        c4.mis = mis / GN;
        var used = {}; c4.ms.forEach(function (m) { used[m] = 1; }); c4.used = Object.keys(used).map(Number).sort();
        c4.total = c4.xs.reduce(function (acc, x) { return acc + len2(x); }, 0);
      });
      run = { cs: cs, nodes: nodes, tgt: tgt, L: L, N: N, P: P, pin: pin, band: req.band, maxTotal: Math.max.apply(null, cs.map(function (c5) { return c5.total; })), posFrom: null, posTo: null, rankStart: T_RANK, selected: -1, selStart: T_SEL };
      applyRule(false);
      tau = 0; dirty = false;
    }
    function orderFor(r) {
      var cs = run.cs, idx = cs.map(function (_, i) { return i; }), best = Math.min.apply(null, cs.map(function (c) { return c.mis; })), tol = best * 2 + 0.006;
      idx.sort(function (a, b) { var A = cs[a], B = cs[b]; if (r === "match") return A.mis - B.mis; var ga = A.mis <= tol ? 0 : 1, gb = B.mis <= tol ? 0 : 1; if (ga !== gb) return ga - gb; if (ga === 1) return A.mis - B.mis; var ma = r === "few" ? A.used.length : A.total, mb = r === "few" ? B.used.length : B.total; return (ma - mb) || (A.mis - B.mis); });
      return idx;
    }
    function displayedPos(i) { if (!run.posTo) return i; var f = ease(clamp((tau - run.rankStart) / 0.8, 0, 1)); return lerp(run.posFrom[i], run.posTo[i], f); }
    function applyRule(animate) {
      var order = orderFor(rule), to = []; order.forEach(function (ci, p) { to[ci] = p; });
      var ident = run.cs.map(function (_, i) { return i; });
      if (!animate || tau < T_RANK) { run.posFrom = ident; run.posTo = to; run.rankStart = T_RANK; run.selected = order[0]; run.selStart = T_SEL; }
      else { run.posFrom = run.cs.map(function (_, i) { return displayedPos(i); }); run.posTo = to; run.rankStart = tau; run.selected = order[0]; run.selStart = tau + 0.7; }
    }
    function setRule(r) { rule = r; if (run) applyRule(true); refreshCtl(); }
    function edited() { if (started && run && !dirty) dirty = true; if (!started) buildRun(); refreshCtl(); }
    function refreshCtl() {
      Object.keys(tP).forEach(function (k) { tP[k].classList.toggle("active", req.preset === k); });
      bandP.classList.toggle("active", req.band);
      mP.forEach(function (bt, j) { bt.classList.toggle("active", req.pal.indexOf(j) >= 0); });
      lVal.textContent = String(req.L); pinP.classList.toggle("active", req.pin);
      Object.keys(nP).forEach(function (n) { nP[n].classList.toggle("active", req.N === +n); });
      Object.keys(rP).forEach(function (r) { rP[r].classList.toggle("active", rule === r); });
      genBtn.classList.toggle("if-pulse", dirty); genBtn.textContent = started ? "Generate again" : "Generate designs";
    }
    function start() { buildRun(); started = true; if (reduceMotion) tau = T_END + 1; refreshCtl(); }
    genBtn.addEventListener("click", start);

    /* ---- geometry ---- */
    var C1 = { x: 12, y: 12, w: 224, h: 576 }, C2 = { x: 262, y: 12, w: 236, h: 576 }, C3 = { x: 524, y: 12, w: 258, h: 576 }, C4 = { x: 808, y: 12, w: 180, h: 576 };
    var TPB = { x: 26, y: 78, w: 196, h: 118 };
    function gridCell(i) { var N = run.N, cols = N <= 8 ? 2 : 3, rows = Math.ceil(N / cols), gx = C2.x + 10, gy = C2.y + 60, gw = C2.w - 20, gh = 468, cw = (gw - (cols - 1) * 8) / cols, ch = Math.min(118, (gh - (rows - 1) * 8) / rows); return { x: gx + (i % cols) * (cw + 8), y: gy + Math.floor(i / cols) * (ch + 8), w: cw, h: ch }; }
    function rowBox(p) { var rh = Math.min(58, (C3.h - 74) / run.N); return { x: C3.x + 8, y: C3.y + 62 + p * rh, w: C3.w - 16, h: rh }; }
    function rowAt(q) { if (!run || tau < T_RANK) return -1; for (var i = 0; i < run.N; i++) { var rb = rowBox(displayedPos(i)); if (q.x >= rb.x && q.x <= rb.x + rb.w && q.y >= rb.y && q.y <= rb.y + rb.h) return i; } return -1; }

    /* ---- pointer ---- */
    var drawing = false;
    function toLogical(ev) { var r = canvas.getBoundingClientRect(); return { x: (ev.clientX - r.left) * SW / r.width, y: (ev.clientY - r.top) * SH / r.height }; }
    function inTP(q) { return q.x >= TPB.x - 6 && q.x <= TPB.x + TPB.w + 6 && q.y >= TPB.y - 8 && q.y <= TPB.y + TPB.h + 8; }
    function setHandle(q) { var i = Math.round(clamp((q.x - TPB.x) / TPB.w, 0, 1) * (HN - 1)), v = clamp((TPB.y + TPB.h - 4 - q.y) / (TPB.h - 8), 0, 1); req.h[i] = v; if (i > 0) req.h[i - 1] = lerp(req.h[i - 1], v, 0.3); if (i < HN - 1) req.h[i + 1] = lerp(req.h[i + 1], v, 0.3); req.preset = "draw"; }
    canvas.addEventListener("pointerdown", function (ev) { var q = toLogical(ev); if (inTP(q)) { drawing = true; try { canvas.setPointerCapture(ev.pointerId); } catch (e) { } setHandle(q); edited(); ev.preventDefault(); return; } var hit = rowAt(q); if (hit >= 0) { run.selected = hit; run.selStart = Math.max(tau, T_SEL); } });
    canvas.addEventListener("pointermove", function (ev) { var q = toLogical(ev); if (drawing) { setHandle(q); edited(); } canvas.style.cursor = inTP(q) ? "crosshair" : rowAt(q) >= 0 ? "pointer" : "default"; });
    canvas.addEventListener("pointerup", function () { drawing = false; }); canvas.addEventListener("pointercancel", function () { drawing = false; });

    /* ---- drawing helpers ---- */
    var ctx, scale = 1, th;
    function rr(x, y, w, h, r) { r = Math.max(0, Math.min(r, w / 2, h / 2)); ctx.beginPath(); ctx.moveTo(x + r, y); ctx.lineTo(x + w - r, y); ctx.quadraticCurveTo(x + w, y, x + w, y + r); ctx.lineTo(x + w, y + h - r); ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h); ctx.lineTo(x + r, y + h); ctx.quadraticCurveTo(x, y + h, x, y + h - r); ctx.lineTo(x, y + r); ctx.quadraticCurveTo(x, y, x + r, y); ctx.closePath(); }
    function label(x, y, text, o) { o = o || {}; ctx.fillStyle = o.color || th.muted; ctx.font = (o.weight || "") + " " + (o.size || 10) + "px system-ui, sans-serif"; ctx.textAlign = o.align || "left"; ctx.textBaseline = o.base || "top"; ctx.fillText(text, x, y); }
    function dot(x, y, r, color, alpha) { ctx.globalAlpha = alpha == null ? 1 : alpha; ctx.fillStyle = color; ctx.beginPath(); ctx.arc(x, y, r, 0, TWO_PI); ctx.fill(); ctx.globalAlpha = 1; }
    function stagePanel(b, num, title, tag, active) {
      ctx.fillStyle = th.dark ? (active ? "#25252a" : "#1f1f22") : (active ? "#ffffff" : "#f8f8fa"); ctx.strokeStyle = active ? th.accent : th.line; ctx.lineWidth = active ? 1.8 : 1; rr(b.x, b.y, b.w, b.h, 10); ctx.fill(); ctx.stroke();
      ctx.fillStyle = active ? th.accent : (th.dark ? "#3a3a40" : "#dfe2e8"); ctx.beginPath(); ctx.arc(b.x + 20, b.y + 21, 11, 0, TWO_PI); ctx.fill();
      label(b.x + 20, b.y + 21, String(num), { align: "center", base: "middle", size: 11, weight: "700", color: active ? "#fff" : th.muted });
      label(b.x + 38, b.y + 11, title, { size: 13, weight: "700", color: th.text }); if (tag) label(b.x + 38, b.y + 28, tag, { size: 9 });
    }
    function lockIcon(cx, cy, s, color) { ctx.strokeStyle = color; ctx.fillStyle = color; ctx.lineWidth = Math.max(1, s * 0.16); ctx.beginPath(); ctx.arc(cx, cy - s * 0.12, s * 0.28, Math.PI, 0); ctx.stroke(); rr(cx - s * 0.4, cy - s * 0.12, s * 0.8, s * 0.55, 1.2); ctx.fill(); }
    function miniStack(b, st, alpha) {
      var L = run.L, pad = 6, rowH = Math.min(14, (b.h - 2 * pad) / L), x0 = b.x + pad, sw = Math.max(7, Math.min(11, rowH - 2)), bx = x0 + sw + 5, bw = b.w - pad * 2 - sw - 5;
      for (var l = 0; l < L; l++) {
        var yy = b.y + b.h - pad - (l + 1) * rowH, hh = Math.max(4, rowH - Math.max(2, rowH * 0.22)), col = PAL[st.m[l]];
        ctx.globalAlpha = alpha; ctx.fillStyle = col; rr(x0, yy + (rowH - hh) / 2, sw, hh, 2); ctx.fill();
        ctx.fillStyle = th.line; rr(bx, yy + rowH * 0.25, bw, rowH * 0.5, 2); ctx.fill(); ctx.fillStyle = col; rr(bx, yy + rowH * 0.25, Math.max(3, len2(st.x[l]) * bw), rowH * 0.5, 2); ctx.fill();
        if (st.fl && st.fl[l] > 0) { ctx.globalAlpha = alpha * st.fl[l]; ctx.strokeStyle = th.text; ctx.lineWidth = 1.4; rr(x0 - 2, yy + (rowH - hh) / 2 - 2, sw + 4, hh + 4, 3); ctx.stroke(); }
        if (run.pin && l === 0) { ctx.globalAlpha = alpha; lockIcon(x0 + sw / 2, yy + rowH / 2 + 1, Math.min(9, hh), "#fff"); }
      }
      ctx.globalAlpha = 1;
    }
    function tower(x, yb, w, hMax, c, prog, alpha) {
      var tot = c.total / run.maxTotal * hMax, y = yb, n = run.L, shown = prog * n;
      for (var l = 0; l < n; l++) { var h = len2(c.xs[l]) / c.total * tot, vis = clamp(shown - l, 0, 1); if (vis <= 0) break; ctx.globalAlpha = alpha * vis; ctx.fillStyle = PAL[c.ms[l]]; ctx.fillRect(x, y - h * vis, w, Math.max(0.6, h * vis - 0.6)); y -= h; }
      ctx.globalAlpha = 1; return tot;
    }
    function spectrumBox(bx, c, prog, big) {
      ctx.strokeStyle = th.line; ctx.lineWidth = 1; rr(bx.x, bx.y, bx.w, bx.h, 4); ctx.stroke();
      var line = function (arr, color, width, dash, upto) { ctx.strokeStyle = color; ctx.lineWidth = width; ctx.setLineDash(dash || []); ctx.beginPath(); var last = Math.floor((arr.length - 1) * upto); for (var i = 0; i <= last; i++) { var xx = bx.x + 3 + (bx.w - 6) * i / (arr.length - 1), yy = bx.y + bx.h - 3 - (bx.h - 6) * arr[i]; if (i === 0) ctx.moveTo(xx, yy); else ctx.lineTo(xx, yy); } ctx.stroke(); ctx.setLineDash([]); };
      if (run.band) { ctx.fillStyle = th.dark ? "rgba(255,255,255,0.05)" : "rgba(0,0,0,0.04)"; ctx.fillRect(bx.x + bx.w * 0.72, bx.y + 1, bx.w * 0.28 - 1, bx.h - 2); }
      line(run.tgt, SPEC_COL, big ? 2.2 : 1.5, [], 1);
      if (c && prog > 0) line(c.final, th.text, big ? 1.6 : 1.1, big ? [5, 4] : [3, 2], prog);
    }

    /* ---- render ---- */
    var lastNarr = "";
    var NARR = {
      idle: "<b>Ready.</b> Press Generate designs to run the request.",
      send: "<b>1 · Request.</b> Everything the model is given: the target spectrum on your band, the candidate materials as nothing more than their curves, the number of layers, and any layer you want fixed.",
      gen: "<b>2 · Generate.</b> IrisFlow starts every design from its own noise and denoises all of them under one shared clock. Lengths glide toward their final values while colours settle; a pinned layer never changes.",
      verify: "<b>3 · Verify.</b> Each design is simulated exactly and compared with the target. The inverse problem has many answers, so the designs differ: in how well they match, how many materials they use, and how thick they are (the height of each little tower).",
      select: "<b>4 · Select.</b> You pick the rule. The designs are ranked, and the winner becomes a recipe: the order of materials from the substrate up and their relative thicknesses.",
      done: "<b>Your turn.</b> Change the rule to re-rank, click any design in column 3 to inspect it, or edit the request above and generate again.",
      edited: "<b>Request changed.</b> Press Generate again to run it; the previous results are dimmed."
    };
    function render() {
      if (!ctx || !run) return; th = theme(container);
      var stg = !started ? "idle" : tau < T_SEND ? "send" : tau < T_V0 ? "gen" : tau < T_RANK ? "verify" : tau < T_END ? "select" : "done";
      ctx.save(); ctx.setTransform(scale * (window.devicePixelRatio || 1), 0, 0, scale * (window.devicePixelRatio || 1), 0, 0); ctx.clearRect(0, 0, SW, SH);
      var gp = clamp((tau - T_SEND) / T_GEN, 0, 1), fpos = gp * KS, kk = Math.min(KS - 1, Math.floor(fpos)), fr = gp >= 1 ? 1 : fpos - kk, eF = ease(fr);
      var stateOf = function (c) { var A = c.states[kk], B = c.states[kk + 1], x = [], m = [], fl = []; for (var l = 0; l < run.L; l++) { x.push(lerp(A.x[l], B.x[l], eF)); m.push(fr < 0.5 ? A.m[l] : B.m[l]); fl.push(gp < 1 && B.ch.indexOf(l) >= 0 ? Math.max(0, 1 - Math.abs(fr - 0.5) / 0.3) : 0); } return { x: x, m: m, fl: fl }; };
      var tNow = lerp(run.nodes[kk], run.nodes[kk + 1], eF), dimRes = dirty ? 0.35 : 1;

      /* arrows between stages */
      [[C1, C2, stg === "send"], [C2, C3, stg === "verify"], [C3, C4, stg === "select"]].forEach(function (a) { var x0 = a[0].x + a[0].w + 3, x1 = a[1].x - 3, y = C1.y + 21, on = a[2]; ctx.strokeStyle = on ? th.accent : th.line; ctx.fillStyle = ctx.strokeStyle; ctx.lineWidth = on ? 2.2 : 1.5; ctx.beginPath(); ctx.moveTo(x0, y); ctx.lineTo(x1 - 5, y); ctx.stroke(); ctx.beginPath(); ctx.moveTo(x1, y); ctx.lineTo(x1 - 7, y - 5); ctx.lineTo(x1 - 7, y + 5); ctx.closePath(); ctx.fill(); });

      /* ===== 1 · Request ===== */
      stagePanel(C1, 1, "Request", "everything the model is given", stg === "send" || stg === "idle" || dirty);
      label(C1.x + 14, C1.y + 50, "target spectrum", { size: 10, weight: "600", color: th.text }); label(C1.x + C1.w - 12, C1.y + 51, "drag to draw", { size: 9, align: "right", color: th.accent });
      ctx.strokeStyle = th.line; ctx.lineWidth = 1; rr(TPB.x, TPB.y, TPB.w, TPB.h, 5); ctx.stroke();
      if (req.band) { ctx.fillStyle = th.dark ? "rgba(255,255,255,0.06)" : "rgba(0,0,0,0.05)"; ctx.fillRect(TPB.x + TPB.w * 0.72, TPB.y + 1, TPB.w * 0.28 - 1, TPB.h - 2); label(TPB.x + TPB.w * 0.86, TPB.y + 4, "beyond", { size: 8, align: "center" }); label(TPB.x + TPB.w * 0.86, TPB.y + 14, "training", { size: 8, align: "center" }); }
      ctx.strokeStyle = SPEC_COL; ctx.lineWidth = 2.2; ctx.beginPath(); for (var q = 0; q <= 80; q++) { var uq = q / 80, xq = TPB.x + 4 + (TPB.w - 8) * uq, yq = TPB.y + TPB.h - 4 - (TPB.h - 8) * tAt(req.h, uq); if (q === 0) ctx.moveTo(xq, yq); else ctx.lineTo(xq, yq); } ctx.stroke();
      for (q = 0; q < HN; q += 2) dot(TPB.x + 4 + (TPB.w - 8) * q / (HN - 1), TPB.y + TPB.h - 4 - (TPB.h - 8) * req.h[q], 2, SPEC_COL, req.preset === "draw" ? 0.9 : 0.35);
      label(TPB.x, TPB.y + TPB.h + 4, "short", { size: 8 }); label(TPB.x + TPB.w / 2, TPB.y + TPB.h + 4, "wavelength", { size: 8, align: "center" }); label(TPB.x + TPB.w, TPB.y + TPB.h + 4, "long", { size: 8, align: "right" });
      var my = C1.y + 222; label(C1.x + 14, my, "materials", { size: 10, weight: "600", color: th.text }); label(C1.x + C1.w - 12, my + 1, "just their curves", { size: 9, align: "right" });
      req.pal.forEach(function (j, idx) { var tx = C1.x + 14 + idx * 34, ty = my + 18; ctx.fillStyle = PAL[j]; rr(tx, ty, 30, 12, 3); ctx.fill(); ctx.strokeStyle = th.line; ctx.lineWidth = 1; rr(tx, ty + 15, 30, 24, 3); ctx.stroke();
        [["n", PAL[j], 1.4, []], ["k", th.text, 0.8, [2, 2]]].forEach(function (sr) { ctx.strokeStyle = sr[1]; ctx.lineWidth = sr[2]; ctx.setLineDash(sr[3]); ctx.beginPath(); for (var z = 0; z <= 12; z++) { var uz = z / 12, px = tx + 2 + 26 * uz, py = ty + 37 - 20 * nk2(j, uz)[sr[0]]; if (z === 0) ctx.moveTo(px, py); else ctx.lineTo(px, py); } ctx.stroke(); ctx.setLineDash([]); });
        label(tx + 15, ty + 42, LET[j], { size: 9, align: "center", weight: "600", color: j === 5 ? th.accent : th.text }); if (j === 5) label(tx + 15, ty + 53, "new", { size: 8, align: "center", color: th.accent }); });
      var ly = C1.y + 316; label(C1.x + 14, ly, "layers", { size: 10, weight: "600", color: th.text });
      var lrH = Math.min(12, 96 / req.L), lx = C1.x + 14, lw = 96;
      for (var l = 0; l < req.L; l++) { var yl = ly + 18 + (req.L - 1 - l) * lrH; if (req.pin && l === 0) { ctx.fillStyle = PAL[req.pal[0]]; rr(lx, yl + 1, lw, lrH - 2, 2); ctx.fill(); lockIcon(lx + lw / 2, yl + lrH / 2 + 1, Math.min(9, lrH - 2), "#fff"); } else { ctx.strokeStyle = th.muted; ctx.globalAlpha = 0.6; ctx.lineWidth = 1; ctx.setLineDash([3, 2]); rr(lx + 0.5, yl + 1.5, lw - 1, lrH - 3, 2); ctx.stroke(); ctx.setLineDash([]); ctx.globalAlpha = 1; } }
      label(lx + lw + 12, ly + 20, req.L + " layers", { size: 10, color: th.text, weight: "600" }); label(lx + lw + 12, ly + 36, "dashed: free", { size: 9 }); if (req.pin) label(lx + lw + 12, ly + 50, "locked: fixed by you", { size: 9, color: th.accent });
      var dy = C1.y + 440; label(C1.x + 14, dy, "designs to draw", { size: 10, weight: "600", color: th.text });
      for (var nn = 0; nn < req.N; nn++) { ctx.strokeStyle = th.muted; ctx.globalAlpha = 0.7; ctx.lineWidth = 1; rr(C1.x + 14 + (nn % 6) * 16, dy + 18 + Math.floor(nn / 6) * 16, 12, 12, 3); ctx.stroke(); ctx.globalAlpha = 1; }
      label(C1.x + 120, dy + 22, req.N + " designs,", { size: 9 }); label(C1.x + 120, dy + 34, "each from its own noise", { size: 9 });
      label(C1.x + 14, C1.y + C1.h - 42, "A material is only its curve, so a new", { size: 9 }); label(C1.x + 14, C1.y + C1.h - 29, "one needs no retraining.", { size: 9 });

      /* ===== 2 · Generate ===== */
      ctx.globalAlpha = 1; stagePanel(C2, 2, "Generate", run.N + " designs · one shared clock", stg === "gen" || stg === "send");
      var ckx = C2.x + C2.w - 26, cky = C2.y + 24; ctx.strokeStyle = th.line; ctx.lineWidth = 2.5; ctx.beginPath(); ctx.arc(ckx, cky, 14, 0, TWO_PI); ctx.stroke(); ctx.strokeStyle = th.accent; ctx.lineWidth = 3; ctx.beginPath(); ctx.arc(ckx, cky, 14, -Math.PI / 2, -Math.PI / 2 + TWO_PI * (1 - tNow)); ctx.stroke(); label(ckx, cky, tNow.toFixed(1), { align: "center", base: "middle", size: 8, weight: "600", color: th.text }); label(ckx, cky + 17, "t", { align: "center", size: 8 });
      for (var i = 0; i < run.N; i++) { var cb = gridCell(i), c = run.cs[i]; ctx.globalAlpha = dimRes; ctx.fillStyle = th.dark ? "#1b1b1e" : "#fff"; ctx.strokeStyle = th.line; ctx.lineWidth = 1; rr(cb.x, cb.y, cb.w, cb.h, 6); ctx.fill(); ctx.stroke(); ctx.globalAlpha = 1; miniStack(cb, stateOf(c), dimRes * (started ? 1 : 0.4)); }
      label(C2.x + C2.w / 2, C2.y + C2.h - 22, "same request, different noise, different designs", { align: "center", size: 9 });

      /* ===== 3 · Verify ===== */
      stagePanel(C3, 3, "Verify", "simulate each design exactly", stg === "verify");
      var hy = C3.y + 46; label(C3.x + 12, hy, "design", { size: 8 }); label(C3.x + 48, hy, "spectrum vs target", { size: 8 }); label(C3.x + 156, hy, "mismatch", { size: 8 }); label(C3.x + 208, hy, "materials", { size: 8 });
      var parts2 = [];
      for (i = 0; i < run.N; i++) {
        var c6 = run.cs[i], vs = T_V0 + i / run.N * T_VST, vp = started ? clamp((tau - vs) / T_VD, 0, 1) : 0, rb = rowBox(displayedPos(i)), sel = run.selected === i && tau >= run.selStart;
        if (vp <= 0.3) { ctx.globalAlpha = 0.5 * dimRes; ctx.strokeStyle = th.line; ctx.setLineDash([3, 3]); rr(rb.x, rb.y + 2, rb.w, rb.h - 4, 5); ctx.stroke(); ctx.setLineDash([]); ctx.globalAlpha = 1; if (vp > 0) parts2.push({ from: gridCell(i), to: rb, p: vp / 0.3, col: PAL[c6.ms[run.L - 1]] }); continue; }
        var a6 = clamp((vp - 0.3) / 0.15, 0, 1) * dimRes;
        ctx.globalAlpha = a6; ctx.fillStyle = th.dark ? "#1b1b1e" : "#fff"; ctx.strokeStyle = sel ? th.accent : th.line; ctx.lineWidth = sel ? 2 : 1; rr(rb.x, rb.y + 2, rb.w, rb.h - 4, 5); ctx.fill(); ctx.stroke();
        var rankA = clamp((tau - run.rankStart - 0.6) / 0.4, 0, 1); if (rankA > 0 && tau >= T_RANK) { ctx.globalAlpha = a6 * rankA; ctx.fillStyle = run.posTo[i] === 0 ? th.accent : (th.dark ? "#3a3a40" : "#dfe2e8"); ctx.beginPath(); ctx.arc(rb.x + 9, rb.y + rb.h / 2, 7, 0, TWO_PI); ctx.fill(); label(rb.x + 9, rb.y + rb.h / 2, String(run.posTo[i] + 1), { align: "center", base: "middle", size: 8, weight: "700", color: run.posTo[i] === 0 ? "#fff" : th.muted }); }
        ctx.globalAlpha = a6; tower(rb.x + 22, rb.y + rb.h - 5, 12, rb.h - 10, c6, 1, a6);
        ctx.globalAlpha = a6; spectrumBox({ x: rb.x + 40, y: rb.y + 5, w: 104, h: rb.h - 10 }, c6, clamp((vp - 0.35) / 0.5, 0, 1), false);
        var mp = clamp((vp - 0.82) / 0.18, 0, 1); ctx.globalAlpha = a6; ctx.fillStyle = th.line; rr(rb.x + 150, rb.y + rb.h / 2 - 4, 44, 8, 4); ctx.fill(); ctx.fillStyle = c6.mis < 0.02 ? th.accent : SPEC_COL; rr(rb.x + 150, rb.y + rb.h / 2 - 4, Math.max(3, 44 * clamp(c6.mis / 0.05, 0.05, 1) * mp), 8, 4); ctx.fill();
        c6.used.forEach(function (m, di) { dot(rb.x + 204 + (di % 5) * 8, rb.y + rb.h / 2 + (di >= 5 ? 5 : 0) - (c6.used.length > 5 ? 3 : 0), 3, PAL[m], a6 * mp); });
        ctx.globalAlpha = 1;
      }
      parts2.forEach(function (pt) { var x0 = pt.from.x + pt.from.w / 2, y0 = pt.from.y + pt.from.h / 2, x1 = pt.to.x, y1 = pt.to.y + pt.to.h / 2, e = ease(pt.p), b2 = [x0, y0, x0 + 80, y0, x1 - 80, y1, x1, y1], pb = bez(b2, e); dot(pb[0], pb[1], 5, th.accent, 0.9); dot(pb[0], pb[1], 2.2, "#fff", 0.95); });

      /* ===== 4 · Select ===== */
      stagePanel(C4, 4, "Select", "by " + RULES[rule].toLowerCase(), stg === "select");
      if (!started || run.selected < 0 || tau < run.selStart) { label(C4.x + C4.w / 2, C4.y + 280, tau < T_RANK ? "waiting for verification" : "ranking…", { align: "center", size: 10 }); }
      else {
        var cS = run.cs[run.selected], sp = clamp((tau - run.selStart) / 2.0, 0, 1), rank = run.posTo[run.selected];
        if (sp < 0.3) { var rbS = rowBox(displayedPos(run.selected)), pS = ease(sp / 0.3), bS = [rbS.x + rbS.w, rbS.y + rbS.h / 2, rbS.x + rbS.w + 40, rbS.y + rbS.h / 2, C4.x - 30, C4.y + 200, C4.x + 20, C4.y + 200], pp2 = bez(bS, pS); dot(pp2[0], pp2[1], 6, th.accent, 0.9); }
        ctx.globalAlpha = dimRes;
        label(C4.x + 14, C4.y + 48, rank === 0 ? "best by this rule" : "rank " + (rank + 1) + " · picked by you", { size: 10, weight: "600", color: rank === 0 ? th.accent : th.text });
        var tx0 = C4.x + 18, tyb = C4.y + 296, prog = clamp((sp - 0.2) / 0.45, 0, 1);
        ctx.fillStyle = th.dark ? "#3a3a40" : "#dfe2e8"; ctx.fillRect(tx0 - 6, tyb, 72, 10); label(tx0 + 30, tyb + 13, "substrate", { size: 8, align: "center" });
        var tot = tower(tx0, tyb, 60, 220, cS, prog, dimRes); label(tx0 + 30, tyb - tot - 14, "air ↑", { size: 8, align: "center" });
        if (prog > 0.9 && tot / run.L >= 10) { var yLab = [], yb2 = tyb; for (var l2 = 0; l2 < run.L; l2++) { var h2 = len2(cS.xs[l2]) / cS.total * tot; yLab.push({ y: yb2 - h2 / 2, m: cS.ms[l2] }); yb2 -= h2; } for (var a = 1; a < yLab.length; a++) if (yLab[a].y > yLab[a - 1].y - 11) yLab[a].y = yLab[a - 1].y - 11; yLab.forEach(function (o) { label(tx0 + 70, o.y, LET[o.m], { base: "middle", size: 9, weight: "600", color: o.m === 5 ? th.accent : th.text }); }); }
        var sbx = { x: C4.x + 10, y: C4.y + 328, w: C4.w - 20, h: 80 }; label(sbx.x, sbx.y - 13, "its spectrum", { size: 9, weight: "600", color: th.text });
        ctx.globalAlpha = dimRes; spectrumBox(sbx, cS, clamp((sp - 0.45) / 0.35, 0, 1), true);
        var ra = clamp((sp - 0.7) / 0.3, 0, 1); if (ra > 0) { ctx.globalAlpha = ra * dimRes; var ry0 = C4.y + 424; label(C4.x + 10, ry0, "recipe · substrate → air", { size: 9, weight: "600", color: th.text }); var rh = Math.min(13, 136 / run.L); for (var l3 = 0; l3 < run.L; l3++) { var yy3 = ry0 + 16 + l3 * rh; ctx.globalAlpha = ra * dimRes; ctx.fillStyle = PAL[cS.ms[l3]]; rr(C4.x + 10, yy3 + 1, 9, rh - 3, 2); ctx.fill(); label(C4.x + 24, yy3 + rh / 2 - 1, "material " + LET[cS.ms[l3]], { base: "middle", size: 8.5, color: th.text }); ctx.fillStyle = th.line; rr(C4.x + 100, yy3 + rh / 2 - 3, 66, 5, 2); ctx.fill(); ctx.fillStyle = PAL[cS.ms[l3]]; rr(C4.x + 100, yy3 + rh / 2 - 3, 66 * len2(cS.xs[l3]), 5, 2); ctx.fill(); } }
        ctx.globalAlpha = 1;
      }
      /* send particles */
      if (stg === "send") { var sp2 = tau / T_SEND; for (var z = 0; z < 14; z++) { var f2 = clamp(sp2 * 1.4 - z * 0.03, 0, 1); if (f2 <= 0 || f2 >= 1) continue; var fromY = z % 2 ? C1.y + 250 : C1.y + 140, col2 = z % 2 ? PAL[req.pal[z % req.pal.length]] : SPEC_COL, bb = [C1.x + C1.w - 10, fromY, C1.x + C1.w + 30, fromY, C2.x - 30, C2.y + 120 + z * 8, C2.x + 12, C2.y + 120 + z * 8], pz = bez(bb, ease(f2)); dot(pz[0], pz[1], 3, col2, 0.9); } }
      /* dirty overlay */
      if (dirty) { ctx.fillStyle = th.dark ? "#25252a" : "#ffffff"; ctx.strokeStyle = th.accent; ctx.lineWidth = 1.5; rr(C2.x + 28, C2.y + 232, C2.w - 56, 52, 8); ctx.fill(); ctx.stroke(); label(C2.x + C2.w / 2, C2.y + 244, "request changed", { align: "center", size: 12, weight: "700", color: th.text }); label(C2.x + C2.w / 2, C2.y + 262, "press Generate again", { align: "center", size: 10, color: th.accent }); }
      ctx.restore();
      var nk3 = dirty ? "edited" : stg, html = NARR[nk3];
      if (html !== lastNarr) { narr.innerHTML = html; lastNarr = html; }
    }
    var lastTs = null, visible = false;
    function frame(ts) { if (lastTs == null) lastTs = ts; var dt = Math.min(0.05, (ts - lastTs) / 1000); lastTs = ts; if (started && !frozen) tau += dt; render(); if (visible) requestAnimationFrame(frame); else lastTs = null; }
    function layout() { var w = Math.max(760, widthOf(scroller, SW)); scale = w / SW; ctx = setupCanvas(canvas, w, SH * scale); canvas.style.maxWidth = "none"; canvas.style.width = w + "px"; reserveHeight(narr, Object.keys(NARR).map(function (id) { return NARR[id]; })); render(); }
    buildRun(); refreshCtl(); layout();
    if ("ResizeObserver" in window) new ResizeObserver(layout).observe(scroller); if (document.fonts) document.fonts.ready.then(layout);
    live.push({ render: render });
    var hm = /^#studio-demo=(\d+(?:\.\d+)?)((?:,[a-z0-9]+)*)$/.exec(location.hash || "");
    if (hm) { var flags = hm[2].split(",").filter(Boolean); flags.forEach(function (f) { if (RULES[f]) rule = f; if (f === "pin") req.pin = true; if (f === "new") req.pal = [0, 1, 2, 5]; if (f === "band") req.band = true; if (f === "few6") { req.pal = [0, 1, 2, 3, 4]; } if (f === "n12") req.N = 12; if (f === "l9") req.L = 9; if (f === "dirty") dirty = true; }); buildRun(); started = true; frozen = true; tau = parseFloat(hm[1]); if (flags.indexOf("dirty") >= 0) dirty = true; refreshCtl(); container.style.cssText = "position:fixed;top:0;left:0;right:0;z-index:99999;margin:0;border-radius:0"; layout(); visible = true; render(); return; }
    if ("IntersectionObserver" in window) new IntersectionObserver(function (es) { es.forEach(function (e) { var was = visible; visible = e.isIntersecting; if (visible && !was) { if (!started) start(); lastTs = null; requestAnimationFrame(frame); } }); }, { threshold: 0.25 }).observe(container);
    else { visible = true; start(); requestAnimationFrame(frame); }
  }

  /* ============================ DATA PIPELINE (mechanism demo) ============================ */
  /* A schematic of IrisFlow's mechanism, organised around the layer tokens in the centre. Nothing here is
     physical: colours stand for materials, bar lengths for thicknesses, and every curve is illustrative.
     A scripted joint trajectory drives it with the real update rules (straight flow path and Euler steps
     for lengths, Markov resampling for colours, an entropy-adaptive clock), so the design's spectrum ends
     very close to the target. Logical canvas 1000 x 640. */
  var PW = 1000, PHH = 640;
  var PIPE_COLORS = ["#3b82d6", "#1d9e75", "#d39a1e", "#7c8795", "#7f66d6", "#d4539e"], PIPE_LETTERS = ["A", "B", "C", "D", "E", "F"], SPEC_COL = "#e04b3c";
  function ease(p) { return p < 0.5 ? 2 * p * p : 1 - Math.pow(-2 * p + 2, 2) / 2; }
  function bez(b, t) { var u = 1 - t; return [u * u * u * b[0] + 3 * u * u * t * b[2] + 3 * u * t * t * b[4] + t * t * t * b[6], u * u * u * b[1] + 3 * u * u * t * b[3] + 3 * u * t * t * b[5] + t * t * t * b[7]]; }
  function softmaxArr(a) { var mx = Math.max.apply(null, a), z = 0, e = a.map(function (v) { var q = Math.exp(v - mx); z += q; return q; }); return e.map(function (v) { return v / z; }); }
  function initPipeline(container) {
    container.innerHTML = "";
    var scroller = el("div", "if-pipe-scroll"), canvas = document.createElement("canvas"); scroller.appendChild(canvas); container.appendChild(scroller);
    var chips = el("div", "if-pipe-steps"); container.appendChild(chips);
    var narr = el("div", "if-hood if-pipe-narr"); container.appendChild(narr);
    var ctl = el("div", "if-controls");
    var playBtn = el("button", "if-primary", "Pause"), prevBtn = el("button", "", "‹ phase"), nextBtn = el("button", "", "phase ›"), addBtn = el("button", "", "+ add a new material"), restartBtn = el("button", "", "New request"), skipBtn = el("button", "", "Skip to the end");
    var speed = document.createElement("select"); speed.innerHTML = '<option value="1">normal</option><option value="0.5">slow</option><option value="2">fast</option>';
    [playBtn, prevBtn, nextBtn, addBtn, restartBtn, skipBtn, speed].forEach(function (b) { ctl.appendChild(b); }); container.appendChild(ctl);
    var hint = el("div", "if-small", "Each colour is one material and each bar length is one thickness; all curves are illustrative. Click a layer to follow only its links, or add a material the model has never seen and watch the links reroute."); hint.style.marginTop = "0.4rem"; container.appendChild(hint);

    /* ---- scripted engine ---- */
    var SLOW_T = 9.0, L = 6, K = 8, C = 5, P_POW = 2, GU = 64, SPTS = 24, seed = 1 + Math.floor(Math.random() * 1e9), extra = false, eng = null;
    function colOf(j) { return PIPE_COLORS[j]; }
    function nameOf(j) { return "material " + PIPE_LETTERS[j]; }
    function nkDemo(j, u) { var ph = j * 1.7 + 0.4, f = 0.7 + 0.12 * j; return { n: 0.52 + 0.3 * Math.sin(TWO_PI * f * u * 0.7 + ph), k: 0.24 + 0.16 * Math.cos(TWO_PI * f * u + ph * 1.3) }; }
    function buildEngine() {
      var rnd = mulberry32(seed); C = extra ? 6 : 5;
      var tg = { base: 0.07 + 0.06 * rnd(), a1: 0.6 + 0.25 * rnd(), c1: 0.24 + 0.16 * rnd(), w1: 0.07 + 0.04 * rnd(), a2: 0.3 + 0.3 * rnd(), c2: 0.64 + 0.2 * rnd(), w2: 0.06 + 0.04 * rnd() };
      var target = function (u) { return clamp(tg.base + tg.a1 * Math.exp(-Math.pow((u - tg.c1) / tg.w1, 2)) + tg.a2 * Math.exp(-Math.pow((u - tg.c2) / tg.w2, 2)), 0, 1); };
      var xs = [], ms = [], comp = [], eps = [], wa = [], wb = [], ws = [], noiseA = [], m0 = [], l, j;
      for (l = 0; l < L; l++) { xs.push(-0.7 + 1.4 * rnd()); ms.push(Math.floor(rnd() * 5)); eps.push(clamp(gauss(rnd), -1.9, 1.9)); wa.push(1.1 + 2.8 * rnd()); wb.push(rnd()); ws.push(rnd() < 0.5 ? -1 : 1); var na = []; for (j = 0; j < 6; j++) na.push(rnd() * 0.9); noiseA.push(na); }
      if (extra) { var hit = false; for (l = 0; l < L; l++) if (ms[l] === 1) { ms[l] = 5; hit = true; } if (!hit) { ms[2] = 5; ms[4] = 5; } }
      for (l = 0; l < L; l++) { var cc = Math.floor(rnd() * (C - 1)); comp.push(cc >= ms[l] ? cc + 1 : cc); m0.push(Math.floor(rnd() * C)); }
      var specOf = function (x, m) { var arr = new Array(GU); for (var i = 0; i < GU; i++) { var u = i / (GU - 1), v = target(u) + 0.012 * Math.sin(TWO_PI * (3.3 * u + 0.2)); for (var q = 0; q < L; q++) { var dev = 0.3 * Math.abs(x[q] - xs[q]) + (m[q] !== ms[q] ? 0.85 : 0); v += dev * 0.14 * ws[q] * Math.sin(TWO_PI * (wa[q] * u + wb[q])); } arr[i] = clamp(v, 0, 1); } return arr; };
      var steps = [], t = 1, x = eps.slice(), m = m0.slice(), nodes = [1];
      for (var n = 0; n < K; n++) {
        var frac = 0; for (l = 0; l < L; l++) if (m[l] === ms[l]) frac++; frac /= L;
        var sh = 0.3 + 2.6 * (n / (K - 1)) + 1.4 * frac, post = [], attn = [], uSum = 0;
        for (l = 0; l < L; l++) { var lg = [], la = []; for (j = 0; j < C; j++) { var a = noiseA[l][j] + (j === ms[l] ? 2.2 : 0) + (j === comp[l] ? 1.1 * Math.sin(Math.PI * n / (K - 1)) : 0); lg.push(a * sh); la.push(a * (0.8 * sh + 0.3)); } post.push(softmaxArr(lg)); attn.push(softmaxArr(la)); uSum += entropyNorm(post[l]); }
        var u = uSum / L, mk = K - n, e = 1 + (P_POW - 1) * u, s2 = mk > 1 ? t * Math.pow((mk - 1) / mk, e) : 0;
        var xn = [], mn = [], res = [], lam = 1 / (K - n);
        for (l = 0; l < L; l++) xn.push(s2 > 0 ? x[l] + (s2 - t) * (eps[l] - xs[l]) : xs[l]);
        var drawFrom = function (pp) { var r = rnd(), acc2 = 0; for (var jj = 0; jj < C; jj++) { acc2 += pp[jj]; if (r <= acc2) return jj; } return C - 1; };
        for (l = 0; l < L; l++) { if (rnd() < lam) { res.push(true); mn.push(n === K - 1 ? ms[l] : drawFrom(post[l])); } else { res.push(false); mn.push(m[l]); } }
        if (n < K - 1) { var cnt = res.filter(Boolean).length, guard = 0; while (cnt < 2 && guard++ < 50) { var lr = Math.floor(rnd() * L); if (!res[lr]) { res[lr] = true; mn[lr] = drawFrom(post[lr]); cnt++; } } }
        steps.push({ t: t, s: s2, xb: x.slice(), mb: m.slice(), xa: xn, ma: mn, post: post, attn: attn, u: u, e: e, res: res, specB: specOf(x, m), specA: specOf(xn, mn) });
        nodes.push(s2); x = xn; m = mn; t = s2;
      }
      var tgtArr = []; for (var i2 = 0; i2 < GU; i2++) tgtArr.push(target(i2 / (GU - 1)));
      eng = { target: target, tgtArr: tgtArr, steps: steps, nodes: nodes, xs: xs, ms: ms };
      rebuildTimeline();
    }

    /* ---- timeline ---- */
    var PHS = {
      encode: { label: "Encode", text: "<b>Everything in the request is encoded once.</b> On the left, the target spectrum goes through a small tokenizer network and becomes one token, b. On the right, every candidate material goes through a shared tokenizer of the same kind: its n,k curve becomes one material token, the coloured square. Those squares are the model's whole vocabulary for this request, so a new material is simply one more curve to encode." },
      block: { label: "Backbone", text: "<b>The backbone reads the whole design.</b> The layer tokens pass through N identical blocks; block 1 is shown one operation at a time. Each block applies: normalization with a scale and shift from the clock t; self-attention, so every layer sees every other (arcs); the cached token b, multiplied by that block's gate g and broadcast to all layers at once (red wavefront); cross-attention, where each layer weighs the candidate material tokens (links thicken where the weight is high); and a feed-forward layer." },
      blockCont: { label: "Backbone", text: "<b>The remaining blocks repeat the same five operations.</b> Rather than replaying each one, the view keeps the flows running while the pass moves through the blocks: the gated token b keeps feeding every layer, and every layer keeps drawing on the material tokens along its cross-attention links. By the last block, the layer tokens carry everything the heads need." },
      heads: { label: "Heads", text: "<b>Two heads read the result.</b> The thickness head gives every layer a velocity: the arrow points to where its bar is heading. The material head scores every layer against every material token and returns a probability over the candidates, shown as particle streams from the cards and as the strip under each bar." },
      update: { label: "Update", text: "<b>One tick of a shared clock.</b> Every bar moves one step along its arrow. Some layers are resampled: each receives one large particle from the material it draws and takes that colour on arrival. While the probabilities are still flat the clock takes large steps; as they sharpen, the steps shrink. The new design goes back into the backbone, and b and the material tokens are reused." },
      verify: { label: "Decode", text: "<b>At t = 0 the design is decoded.</b> Colours become materials, bar lengths become thicknesses, and the stack is simulated and compared with the target: the dashed curve now lies on top of the solid one. Many designs are drawn from different noise, and the one that best fits your needs is kept." }
    };
    var segs = [], total = 0;
    function rebuildTimeline() {
      segs = []; total = 0;
      segs.push({ ph: "encode", step: 0, dur: 3.8 });
      for (var k = 0; k < K; k++) { segs.push({ ph: "block", step: k, dur: k === 0 ? SLOW_T + 3.0 : 2.2 }); segs.push({ ph: "heads", step: k, dur: k === 0 ? 2.2 : 1.0 }); segs.push({ ph: "update", step: k, dur: k === 0 ? 2.6 : 1.5 }); }
      segs.push({ ph: "verify", step: K - 1, dur: 4.5 });
      segs.forEach(function (sg) { sg.t0 = total; total += sg.dur; sg.t1 = total; });
    }
    var VB = ["1", "2", "3", "N"], GV = [0.9, 0.7, 0.52, 0.34], SUBF = [0.14, 0.36, 0.58, 0.86, 1.0];
    var tau = 0, playing = !reduceMotion, lastTs = null, segIdx = 0, ctx, scale = 1, th, focus = -1;
    function subOf(q) { var sub = 0; while (sub < 4 && q > SUBF[sub]) sub++; var lo = sub ? SUBF[sub - 1] : 0; return { sub: sub, subP: clamp((q - lo) / (SUBF[sub] - lo), 0, 1) }; }
    function decode() {
      if (tau >= total) tau = total - 0.001; if (tau < 0) tau = 0;
      segIdx = 0; for (var i = 0; i < segs.length; i++) if (tau >= segs[i].t0 && tau < segs[i].t1) { segIdx = i; break; }
      var sg = segs[segIdx], p = clamp((tau - sg.t0) / (sg.t1 - sg.t0), 0, 1);
      var d = { sg: sg, ph: sg.ph, p: p, k: sg.step, st: eng.steps[sg.step], vb: -1, sub: -1, subP: 0, slow: false, cont: false, prog: 0, blend: 1 };
      if (d.ph === "block") {
        var el0 = tau - sg.t0;
        if (d.k === 0 && el0 < SLOW_T) { d.slow = true; d.vb = 0; var r = subOf(el0 / SLOW_T); d.sub = r.sub; d.subP = r.subP; }
        else { d.cont = true; var el1 = d.k === 0 ? el0 - SLOW_T : el0, dur1 = d.k === 0 ? sg.dur - SLOW_T : sg.dur; d.prog = clamp(el1 / dur1, 0, 1); d.blend = d.k === 0 ? 1 : clamp(d.prog / 0.4, 0, 1); }
      }
      return d;
    }

    /* ---- geometry ---- */
    var ENC = { x: 14, y: 14, w: 336, h: 146 }, SP = { x: 24, y: 42, w: 150, h: 92 }, MLP = [{ x: 206, n: 5 }, { x: 236, n: 6 }, { x: 266, n: 5 }], MLPY = 88, BX = 304, BY = 88;
    var BB = { x: 430, y: 14, w: 550, h: 60 }, RW = { x: 430, w: 240, h: 40, gap: 12, y0: 180 }, CD = { x: 800, w: 180, gap: 10, y0: 180 };
    var CLK = { x: 14, y: 172, w: 336, h: 96 }, VP = { x: 14, y: 280, w: 336, h: 346 }, KEY = { x: 430, y: 500, w: 240, h: 126 };
    function rowY(i) { return RW.y0 + (L - 1 - i) * (RW.h + RW.gap); }
    function rowMid(i) { return rowY(i) + RW.h / 2; }
    function cardH() { return Math.min(58, (632 - CD.y0 - (C - 1) * CD.gap) / C); }
    function cardY(j) { return CD.y0 + j * (cardH() + CD.gap); }
    function cardMid(j) { return cardY(j) + cardH() / 2; }
    function link(i, j) { var x1 = RW.x + RW.w + 2, y1 = rowMid(i), x2 = CD.x - 2, y2 = cardMid(j); return [x1, y1, x1 + 50, y1, x2 - 50, y2, x2, y2]; }
    function bPath(i) { var x1 = BX + 14, y1 = BY, x2 = RW.x - 2, y2 = rowMid(i); return [x1, y1, x1 + 36, y1, x2 - 30, y2, x2, y2]; }
    function ny(c, m) { return MLPY - (MLP[c].n - 1) / 2 * 14 + m * 14; }
    function sx(u) { return SP.x + 6 + u * (SP.w - 12); }
    function sy(u) { return SP.y + SP.h - 6 - eng.target(u) * (SP.h - 14); }
    function inPath(k) { var u = k / (SPTS - 1), m = Math.min(MLP[0].n - 1, Math.floor(k * MLP[0].n / SPTS)), x = sx(u), y = sy(u); return [x, y, x + 40, y, MLP[0].x - 24, ny(0, m), MLP[0].x, ny(0, m)]; }
    var CT = [{ dx: 104, n: 3 }, { dx: 92, n: 4 }, { dx: 80, n: 3 }];
    function tokNode(j, c, m) { return { x: CD.x + CT[c].dx, y: cardMid(j) - (CT[c].n - 1) / 2 * 8 + m * 8 }; }
    function curveBox(j) { var h = cardH(); return { x: CD.x + CD.w - 66, y: cardY(j) + 7, w: 58, h: h - 14 }; }
    function curvePt(j, u) { var cb = curveBox(j), v = nkDemo(j, u).n; return { x: cb.x + 3 + (cb.w - 6) * u, y: cb.y + cb.h - 3 - (cb.h - 6) * v }; }
    function cePath(j, k) { var u = k / 9, m = Math.min(CT[0].n - 1, Math.floor(k * CT[0].n / 10)), a = curvePt(j, u), b = tokNode(j, 0, m); return [a.x, a.y, a.x - 16, a.y, b.x + 10, b.y, b.x, b.y]; }
    function encQ(j, d) { if (d.ph !== "encode") return 1; return clamp((d.p - (0.22 + j * 0.08)) / 0.26, 0, 1); }
    function lenOf(x) { return clamp(0.5 + 0.4 * x, 0.06, 1); }
    var saCache = {};
    function saW(k) { if (saCache[k]) return saCache[k]; var rnd = mulberry32(10 + 100 * k), W = []; for (var a = 0; a < L; a++) W.push([]); for (a = 0; a < L; a++) for (var b = a + 1; b < L; b++) { W[a][b] = rnd(); W[b][a] = W[a][b]; } saCache[k] = W; return W; }
    function saArc(a, b) { var spx = RW.x - 8, lo = Math.min(a, b), hi = Math.max(a, b); return { x0: spx, y0: rowMid(a), cx: spx - 16 - 9 * (hi - lo), cy: (rowMid(a) + rowMid(b)) / 2, x1: spx, y1: rowMid(b) }; }
    function saPoint(a, b, t) { var q = saArc(a, b), u = 1 - t; return [u * u * q.x0 + 2 * u * t * q.cx + t * t * q.x1, u * u * q.y0 + 2 * u * t * q.cy + t * t * q.y1]; }

    /* ---- particles ---- */
    var parts = [], rowM = [], flash = [], levelRow = [], bFlash = 0, gate = 0, acc = [], accB = [], accSA = [], keys = {};
    function resetParticles() { parts = []; rowM = []; flash = []; levelRow = []; acc = []; accB = []; accSA = []; keys = {}; bFlash = 0; for (var i = 0; i < L; i++) { flash.push(0); levelRow.push(0); acc.push([0, 0, 0, 0, 0, 0]); accB.push(Math.random()); accSA.push([0, 0, 0, 0, 0, 0].map(function () { return Math.random(); })); } }
    function contGate(d) { var pos = d.k === 0 ? 1 + d.prog * 2.999 : d.prog * 3.999, a = Math.floor(pos), f = pos - a; return lerp(GV[a], GV[Math.min(3, a + 1)], f); }
    function contWeight(d, i, j) { var cur = d.st.attn[i][j]; if (d.k === 0) return cur; var prev = eng.steps[d.k - 1].post[i][j]; return lerp(prev, cur, ease(d.blend)); }
    function syncRows() { var d = decode(), after = d.ph === "verify" || (d.ph === "update" && d.p > 0.75); for (var i = 0; i < L; i++) rowM[i] = after ? d.st.ma[i] : d.st.mb[i]; keys["s" + d.k] = true; if (d.ph !== "encode") { keys.inp = true; for (var j = 0; j < C; j++) keys["e" + j] = true; } }
    function update(dt) {
      var d = decode(), st = d.st, k = d.k, i, j;
      if (!keys["s" + k]) { keys["s" + k] = true; for (i = 0; i < L; i++) rowM[i] = st.mb[i]; }
      if (d.ph === "encode") {
        if (!keys.inp) { keys.inp = true; for (var kk = 0; kk < SPTS; kk++) parts.push({ t: "in", k: kk, s: -kk * 0.012, life: 0.8 }); }
        for (j = 0; j < C; j++) if (encQ(j, d) > 0 && !keys["e" + j]) { keys["e" + j] = true; for (var kq = 0; kq < 10; kq++) parts.push({ t: "ce", j: j, k: kq, s: -kq * 0.03, life: 0.55 }); }
      }
      if (d.ph === "block" && d.slow && d.sub === 2) { var key = "b" + k + "_slow"; if (!keys[key]) { keys[key] = true; gate = GV[0]; bFlash = 1; for (i = 0; i < L; i++) parts.push({ t: "br", i: i, s: 0, life: 1.1, amp: gate }); } }
      var saRate = d.ph === "block" ? (d.slow && d.sub === 1 ? 2.4 * clamp(d.subP / 0.25, 0, 1) : d.cont ? 0.9 * clamp(d.prog / 0.15, 0, 1) : 0) : 0;
      if (saRate > 0) { var WSA = saW(k); for (i = 0; i < L; i++) for (j = 0; j < L; j++) { if (i === j) continue; accSA[i][j] += dt * saRate * WSA[i][j] * WSA[i][j]; while (accSA[i][j] >= 1) { accSA[i][j] -= 1; parts.push({ t: "sa", a: i, b: j, s: 0, life: d.slow ? 1.3 : 1.6, col: rowM[i] === undefined ? st.mb[i] : rowM[i] }); } } }
      if (d.ph === "block" && d.cont) { var gNow = contGate(d); for (i = 0; i < L; i++) { accB[i] += dt * 3.2; while (accB[i] >= 1) { accB[i] -= 1; parts.push({ t: "br", i: i, s: Math.random() * 0.08, life: 1.3, amp: gNow, soft: true }); } } }
      if (d.ph === "heads" || d.ph === "update") { var rate = d.ph === "heads" ? 10 : 5; for (i = 0; i < L; i++) for (j = 0; j < C; j++) { acc[i][j] += dt * rate * st.post[i][j]; while (acc[i][j] >= 1) { acc[i][j] -= 1; parts.push({ t: "fl", i: i, j: j, s: Math.random() * 0.05, life: 0.9 + Math.random() * 0.35 }); } } }
      if (d.ph === "update" && !keys["d" + k]) { keys["d" + k] = true; for (i = 0; i < L; i++) if (st.res[i]) parts.push({ t: "dec", i: i, j: st.ma[i], s: 0, life: d.sg.dur * 0.55 }); }
      parts.forEach(function (q) { q.s += dt / q.life; if (q.s >= 1) { if (q.t === "br") levelRow[q.i] = q.soft ? Math.max(levelRow[q.i], 0.3 + 0.2 * q.amp) : Math.min(1, levelRow[q.i] + q.amp * 0.7); if (q.t === "dec") { rowM[q.i] = q.j; flash[q.i] = 1; } } });
      parts = parts.filter(function (q) { return q.s < 1; });
      for (i = 0; i < L; i++) { levelRow[i] *= Math.exp(-dt * 1.4); flash[i] = Math.max(0, flash[i] - dt * 1.6); }
      bFlash = Math.max(0, bFlash - dt * 3);
    }

    /* ---- controls ---- */
    chips.innerHTML = ["encode", "block", "heads", "update", "verify"].map(function (id) { return '<button class="if-pill" data-ph="' + id + '">' + PHS[id].label + "</button>"; }).join("");
    chips.addEventListener("click", function (e) { var b = e.target.closest("[data-ph]"); if (!b) return; var sg = segs.filter(function (q) { return q.ph === b.getAttribute("data-ph"); })[0]; if (sg) seekTo(sg.t0 + 0.01); });
    function seekTo(t2) { tau = clamp(t2, 0, total - 0.001); resetParticles(); syncRows(); render(); }
    function seek(delta) { var i = segIdx + delta; if (i >= 0 && i < segs.length) seekTo(segs[i].t0 + 0.01); }
    prevBtn.addEventListener("click", function () { seek(-1); }); nextBtn.addEventListener("click", function () { seek(1); });
    playBtn.addEventListener("click", function () { playing = !playing; playBtn.textContent = playing ? "Pause" : "Play"; lastTs = null; if (playing) requestAnimationFrame(frame); });
    restartBtn.addEventListener("click", function () { seed = 1 + Math.floor(Math.random() * 1e9); buildEngine(); seekTo(0); });
    addBtn.addEventListener("click", function () { extra = !extra; addBtn.textContent = extra ? "− remove the new material" : "+ add a new material"; buildEngine(); seekTo(0); });
    skipBtn.addEventListener("click", function () { seekTo(segs[segs.length - 1].t0 + 0.01); });
    canvas.addEventListener("click", function (ev) { var r = canvas.getBoundingClientRect(), x = (ev.clientX - r.left) * PW / r.width, y = (ev.clientY - r.top) * PHH / r.height; if (x < RW.x || x > RW.x + RW.w) { focus = -1; render(); return; } for (var i = 0; i < L; i++) { var yy = rowY(i); if (y >= yy && y <= yy + RW.h) { focus = focus === i ? -1 : i; render(); return; } } focus = -1; render(); });
    function narrHTML(status, text) { return '<span class="if-small">' + status + "</span><br>" + text; }
    function reserveSpace() {
      reserveHeight(narr, Object.keys(PHS).map(function (id) { return narrHTML("denoising step " + K + " · block 1, one operation at a time", PHS[id].text); }));
      reserveWidth(playBtn, ["Pause", "Play", "Replay"]); reserveWidth(addBtn, ["+ add a new material", "− remove the new material"]);
    }
    function layout() { var w = Math.max(760, widthOf(scroller, PW)); scale = w / PW; ctx = setupCanvas(canvas, w, PHH * scale); canvas.style.maxWidth = "none"; canvas.style.width = w + "px"; reserveSpace(); render(); }

    /* ---- drawing helpers ---- */
    function rr(x, y, w, h, r) { ctx.beginPath(); ctx.moveTo(x + r, y); ctx.lineTo(x + w - r, y); ctx.quadraticCurveTo(x + w, y, x + w, y + r); ctx.lineTo(x + w, y + h - r); ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h); ctx.lineTo(x + r, y + h); ctx.quadraticCurveTo(x, y + h, x, y + h - r); ctx.lineTo(x, y + r); ctx.quadraticCurveTo(x, y, x + r, y); ctx.closePath(); }
    function label(x, y, text, o) { o = o || {}; ctx.fillStyle = o.color || th.muted; ctx.font = (o.weight || "") + " " + (o.size || 10) + "px system-ui, sans-serif"; ctx.textAlign = o.align || "left"; ctx.textBaseline = o.base || "top"; ctx.fillText(text, x, y); }
    function panel(b, title, active, tag) { ctx.fillStyle = th.dark ? (active ? "#25252a" : "#1f1f22") : (active ? "#ffffff" : "#f8f8fa"); ctx.strokeStyle = active ? th.accent : th.line; ctx.lineWidth = active ? 1.6 : 1; rr(b.x, b.y, b.w, b.h, 8); ctx.fill(); ctx.stroke(); if (title) label(b.x + 10, b.y + 7, title, { color: active ? th.text : th.muted, weight: "600" }); if (tag) label(b.x + b.w - 10, b.y + 7, tag, { align: "right", size: 9, color: active ? th.accent : th.muted }); }
    function curvePath(b, color, width, alpha, dash) { ctx.strokeStyle = color; ctx.lineWidth = width; ctx.globalAlpha = alpha; ctx.setLineDash(dash || []); ctx.beginPath(); ctx.moveTo(b[0], b[1]); ctx.bezierCurveTo(b[2], b[3], b[4], b[5], b[6], b[7]); ctx.stroke(); ctx.setLineDash([]); ctx.globalAlpha = 1; }
    function dot(x, y, r, color, alpha) { ctx.globalAlpha = alpha == null ? 1 : alpha; ctx.fillStyle = color; ctx.beginPath(); ctx.arc(x, y, r, 0, TWO_PI); ctx.fill(); ctx.globalAlpha = 1; }
    function plot(box, arr, color, width, dash, alpha) { ctx.strokeStyle = color; ctx.lineWidth = width; ctx.setLineDash(dash || []); ctx.globalAlpha = alpha == null ? 1 : alpha; ctx.beginPath(); for (var i = 0; i < arr.length; i++) { var xx = box.x + 4 + (box.w - 8) * i / (arr.length - 1), yy = box.y + box.h - 4 - (box.h - 8) * arr[i]; if (i === 0) ctx.moveTo(xx, yy); else ctx.lineTo(xx, yy); } ctx.stroke(); ctx.setLineDash([]); ctx.globalAlpha = 1; }

    /* ---- render ---- */
    var dashOff = 0;
    function render() {
      if (!ctx) return; th = theme(container);
      var d = decode(), ph = d.ph, p = d.p, k = d.k, st = d.st, e = ease(p), i, j;
      var isEnc = ph === "encode", isBlk = ph === "block", isHeads = ph === "heads", isUpd = ph === "update", isVer = ph === "verify";
      var tNow = isUpd ? lerp(st.t, st.s, e) : isVer ? 0 : st.t, stepsDone = k + (isVer || (isUpd && p > 0.5) ? 1 : 0);
      var contOn = isBlk && d.cont, crossOn = isBlk && d.slow && d.sub === 3, flowOn = isHeads || isUpd, biasOn = isBlk && d.slow && d.sub === 2, normOn = isBlk && d.slow && (d.sub === 0 || d.sub === 4);
      ctx.save(); ctx.setTransform(scale * (window.devicePixelRatio || 1), 0, 0, scale * (window.devicePixelRatio || 1), 0, 0); ctx.clearRect(0, 0, PW, PHH);

      /* backbone strip */
      panel(BB, "Transformer backbone", isBlk, null);
      label(BB.x + BB.w - 176, BB.y + 7, "block", { size: 9 });
      var chipX = function (b) { return BB.x + BB.w - 140 + b * 30 + (b === 3 ? 14 : 0); }, cpos = contOn ? (d.k === 0 ? 1 + d.prog * 3 : d.prog * 4) : (isBlk && d.slow ? 0.5 : 0);
      VB.forEach(function (name, b) { var bx = chipX(b), on = (isBlk && d.slow && b === 0) || (contOn && cpos >= b && cpos < b + 1), passed = contOn && cpos >= b + 1; ctx.fillStyle = on ? th.accent : passed ? th.accent : (th.dark ? "#2c2c32" : "#eceef3"); ctx.globalAlpha = passed ? 0.35 : 1; rr(bx, BB.y + 5, 22, 16, 4); ctx.fill(); ctx.globalAlpha = 1; label(bx + 11, BB.y + 13, name, { align: "center", base: "middle", size: 9, color: on || passed ? "#fff" : th.muted, weight: "600" }); });
      if (contOn) { var ux0 = chipX(0), ux1 = chipX(3) + 22; ctx.fillStyle = th.line; rr(ux0, BB.y + 23, ux1 - ux0, 3, 1.5); ctx.fill(); ctx.fillStyle = th.accent; rr(ux0, BB.y + 23, Math.max(3, (ux1 - ux0) * cpos / 4), 3, 1.5); ctx.fill(); }
      label(BB.x + BB.w - 47, BB.y + 13, "…", { align: "center", base: "middle", size: 11 });
      var subs = ["norm + shift from t", "self-attention", "+ gated spectrum b", "cross-attention", "feed-forward"], cw0 = (BB.w - 20) / subs.length;
      subs.forEach(function (name, q) { var on = isBlk && d.slow && d.sub === q; ctx.fillStyle = on || contOn ? th.accent : (th.dark ? "#2c2c32" : "#eceef3"); ctx.globalAlpha = contOn ? 0.18 : 1; rr(BB.x + 10 + q * cw0 + 2, BB.y + 30, cw0 - 4, 20, 5); ctx.fill(); ctx.globalAlpha = 1; label(BB.x + 10 + q * cw0 + cw0 / 2, BB.y + 40, name, { align: "center", base: "middle", size: 9, color: on ? "#fff" : contOn ? th.text : th.muted, weight: on ? "600" : "" }); });

      /* target encoder */
      panel(ENC, "target spectrum → tokenizer → token b", isEnc, "once per request");
      ctx.strokeStyle = th.line; ctx.lineWidth = 1; rr(SP.x, SP.y, SP.w, SP.h, 4); ctx.stroke();
      ctx.strokeStyle = SPEC_COL; ctx.lineWidth = 1.5; ctx.globalAlpha = 0.7; ctx.beginPath(); for (var q = 0; q <= 60; q++) { var u = q / 60; if (q) ctx.lineTo(sx(u), sy(u)); else ctx.moveTo(sx(u), sy(u)); } ctx.stroke(); ctx.globalAlpha = 1;
      for (q = 0; q < SPTS; q++) dot(sx(q / (SPTS - 1)), sy(q / (SPTS - 1)), 1.9, SPEC_COL, 0.9);
      label(SP.x + 4, SP.y + SP.h + 3, "illustrative target", { size: 8 });
      var lit = function (c) { if (!isEnc) return 0.22; return Math.max(0, 1 - Math.abs(p * 3.2 - (0.35 + c * 0.3)) / 0.25); };
      for (var c = 0; c < 2; c++) { var a2 = Math.min(lit(c), lit(c + 1)); for (var m1 = 0; m1 < MLP[c].n; m1++) for (var m2 = 0; m2 < MLP[c + 1].n; m2++) { ctx.globalAlpha = 0.08 + 0.5 * a2; ctx.strokeStyle = a2 > 0.3 ? SPEC_COL : th.line; ctx.lineWidth = 0.5; ctx.beginPath(); ctx.moveTo(MLP[c].x, ny(c, m1)); ctx.lineTo(MLP[c + 1].x, ny(c + 1, m2)); ctx.stroke(); } }
      for (c = 0; c < 3; c++) for (m1 = 0; m1 < MLP[c].n; m1++) { ctx.globalAlpha = 1; ctx.fillStyle = th.dark ? "#2c2c32" : "#eceef3"; ctx.strokeStyle = th.line; ctx.lineWidth = 0.8; ctx.beginPath(); ctx.arc(MLP[c].x, ny(c, m1), 4, 0, TWO_PI); ctx.fill(); ctx.stroke(); dot(MLP[c].x, ny(c, m1), 4, SPEC_COL, lit(c)); }
      label(MLP[1].x, SP.y + SP.h + 3, "tokenizer", { align: "center", size: 8 });
      var bf = isEnc ? clamp((p - 0.8) / 0.15, 0, 1) : 1;
      ctx.globalAlpha = 0.15 + 0.5 * lit(2); ctx.strokeStyle = SPEC_COL; ctx.lineWidth = 1; for (m1 = 0; m1 < MLP[2].n; m1++) { ctx.beginPath(); ctx.moveTo(MLP[2].x, ny(2, m1)); ctx.lineTo(BX - 13, BY); ctx.stroke(); } ctx.globalAlpha = 1;
      ctx.fillStyle = th.dark ? "#1f1f22" : "#fff"; ctx.strokeStyle = th.line; rr(BX - 13, BY - 13, 26, 26, 4); ctx.fill(); ctx.stroke(); ctx.globalAlpha = 0.9 * bf; ctx.fillStyle = SPEC_COL; rr(BX - 10, BY - 10, 20, 20, 3); ctx.fill(); ctx.globalAlpha = 1;
      if (bFlash > 0) { ctx.globalAlpha = bFlash; ctx.strokeStyle = SPEC_COL; ctx.lineWidth = 1.5; rr(BX - 17, BY - 17, 34, 34, 6); ctx.stroke(); ctx.globalAlpha = 1; }
      label(BX, BY + 17, "b", { align: "center", size: 11, weight: "600", color: th.text });
      ctx.fillStyle = th.dark ? "#1f1f22" : "#fff"; ctx.strokeStyle = th.line; rr(BX + 22, BY - 14, 10, 28, 2); ctx.fill(); ctx.stroke(); var gh = 26 * (biasOn ? GV[0] : contOn ? contGate(d) : 0); ctx.fillStyle = SPEC_COL; ctx.globalAlpha = 0.75; ctx.fillRect(BX + 23, BY + 13 - gh, 8, gh); ctx.globalAlpha = 1; label(BX + 27, BY + 17, "× g", { align: "center", size: 9 });
      for (i = 0; i < L; i++) curvePath(bPath(i), SPEC_COL, biasOn ? 1.2 : 1, biasOn ? 0.45 : contOn ? 0.28 : 0.1, biasOn || contOn ? [] : [3, 4]);

      /* clock */
      panel(CLK, "flow time t", isUpd || normOn, "scales and shifts every block");
      var ccx = CLK.x + 40, ccy = CLK.y + 56; ctx.strokeStyle = th.line; ctx.lineWidth = 2; ctx.beginPath(); ctx.arc(ccx, ccy, 24, 0, TWO_PI); ctx.stroke(); ctx.strokeStyle = th.accent; ctx.lineWidth = isUpd ? 4 : 3; ctx.beginPath(); ctx.arc(ccx, ccy, 24, -Math.PI / 2, -Math.PI / 2 + TWO_PI * (1 - tNow)); ctx.stroke(); label(ccx, ccy, "t = " + tNow.toFixed(2), { align: "center", base: "middle", size: 9, weight: "600", color: th.text });
      var rx0 = CLK.x + 84, rx1 = CLK.x + CLK.w - 14, ry = CLK.y + 52; ctx.strokeStyle = th.line; ctx.lineWidth = 1; ctx.beginPath(); ctx.moveTo(rx0, ry); ctx.lineTo(rx1, ry); ctx.stroke();
      eng.nodes.forEach(function (tt, n) { var xx = rx0 + (1 - tt) * (rx1 - rx0), done = n <= stepsDone; ctx.strokeStyle = done ? th.accent : th.line; ctx.lineWidth = done ? 2 : 1; ctx.beginPath(); ctx.moveTo(xx, ry - 6); ctx.lineTo(xx, ry + 6); ctx.stroke(); });
      dot(rx0 + (1 - tNow) * (rx1 - rx0), ry, 4, th.accent);
      label(rx0, ry - 10, "1 = noise", { size: 8, base: "bottom" }); label(rx1, ry - 10, "0 = design", { size: 8, base: "bottom", align: "right" });
      label(rx0, ry + 12, "big steps while materials are uncertain,", { size: 8 }); label(rx0, ry + 23, "small steps once they settle", { size: 8 });
      if (normOn) { ctx.strokeStyle = th.accent; ctx.lineWidth = 1.2; ctx.globalAlpha = 0.8; ctx.setLineDash([3, 3]); ctx.beginPath(); ctx.moveTo(CLK.x + CLK.w, CLK.y + 30); ctx.lineTo(RW.x - 24, CLK.y + 30); ctx.lineTo(RW.x - 24, rowMid(L - 1) - 10); ctx.stroke(); ctx.setLineDash([]); ctx.globalAlpha = 1; }

      /* spectrum of the current design */
      panel(VP, isVer ? "decoded design vs target" : "spectrum of the current design", isVer, "illustrative");
      var pb = { x: VP.x + 12, y: VP.y + 28, w: VP.w - 24, h: 210 };
      ctx.strokeStyle = th.line; ctx.lineWidth = 1; rr(pb.x, pb.y, pb.w, pb.h, 4); ctx.stroke();
      var cur = isVer ? st.specA : isUpd ? st.specB.map(function (v, n) { return lerp(v, st.specA[n], e); }) : st.specB;
      plot(pb, eng.tgtArr, SPEC_COL, 2.4); plot(pb, cur, th.text, 1.8, [6, 4], 0.9);
      ctx.strokeStyle = SPEC_COL; ctx.lineWidth = 2.4; ctx.beginPath(); ctx.moveTo(pb.x, pb.y + pb.h + 14); ctx.lineTo(pb.x + 18, pb.y + pb.h + 14); ctx.stroke(); label(pb.x + 24, pb.y + pb.h + 14, "target", { base: "middle", size: 9, color: th.text });
      ctx.strokeStyle = th.text; ctx.lineWidth = 1.8; ctx.setLineDash([6, 4]); ctx.beginPath(); ctx.moveTo(pb.x + 80, pb.y + pb.h + 14); ctx.lineTo(pb.x + 98, pb.y + pb.h + 14); ctx.stroke(); ctx.setLineDash([]); label(pb.x + 104, pb.y + pb.h + 14, isVer ? "decoded design" : "current design", { base: "middle", size: 9, color: th.text });
      var mis = 0; for (var n2 = 0; n2 < GU; n2++) mis += Math.abs(cur[n2] - eng.tgtArr[n2]); mis = clamp(mis / GU / 0.25, 0, 1);
      var my = pb.y + pb.h + 34; label(pb.x, my, "mismatch", { size: 9 }); ctx.fillStyle = th.line; rr(pb.x + 58, my + 1, pb.w - 58, 9, 4); ctx.fill(); ctx.fillStyle = mis > 0.35 ? SPEC_COL : th.accent; rr(pb.x + 58, my + 1, Math.max(4, (pb.w - 58) * mis), 9, 4); ctx.fill();
      label(pb.x, my + 22, isVer ? "The design reproduces the target. Draw many designs" : "Shrinks as the clock runs down: materials settle", { size: 9, color: isVer ? th.text : th.muted });
      label(pb.x, my + 35, isVer ? "from different noise and keep the one you prefer." : "and thicknesses move toward their final values.", { size: 9, color: isVer ? th.text : th.muted });

      /* links rows ↔ material tokens */
      dashOff -= 0.9;
      for (i = 0; i < L; i++) for (j = 0; j < C; j++) {
        var on = focus < 0 || focus === i, b9 = link(i, j), colr = colOf(j);
        var ffnHold = isBlk && d.slow && d.sub === 4, headBlend = isHeads ? ease(clamp(p / 0.45, 0, 1)) : 1;
        var w = crossOn ? st.attn[i][j] * clamp(d.subP / 0.3, 0, 1) : ffnHold ? st.attn[i][j] : contOn ? contWeight(d, i, j) : isHeads ? lerp(st.attn[i][j], st.post[i][j], headBlend) : flowOn ? st.post[i][j] : 0;
        curvePath(b9, colr, 0.6 + (focus === i ? 10 : 7) * w, on ? (crossOn || ffnHold || contOn || flowOn ? 0.06 + 0.75 * w : 0.06) : 0.02);
        var dashA = crossOn ? 1 : contOn ? (d.k === 0 ? clamp(d.prog / 0.25, 0, 1) : 1) : 0;
        if (dashA > 0 && on && w > 0.12) { ctx.lineDashOffset = dashOff; curvePath(b9, colr, 3, dashA * Math.min(1, (contOn ? 0.15 : 0.3) + (contOn ? 0.7 : 1) * w), [1, 9]); ctx.lineDashOffset = 0; }
      }

      /* layer rows */
      label(RW.x, RW.y0 - 16, "layer tokens · substrate side at the bottom", { size: 9, color: th.text, weight: "600" });
      for (i = 0; i < L; i++) {
        var y = rowY(i), act = focus === i, mIdx = rowM[i] === undefined ? st.mb[i] : rowM[i], colr2 = colOf(mIdx);
        ctx.fillStyle = th.dark ? "#1f1f22" : "#fff"; ctx.strokeStyle = act ? th.accent : th.line; ctx.lineWidth = act ? 1.6 : 1; rr(RW.x, y, RW.w, RW.h, 6); ctx.fill(); ctx.stroke();
        if (levelRow[i] > 0.02) { ctx.globalAlpha = 0.9 * levelRow[i]; ctx.strokeStyle = SPEC_COL; ctx.lineWidth = 1.6; rr(RW.x - 2, y - 2, RW.w + 4, RW.h + 4, 7); ctx.stroke(); ctx.globalAlpha = 1; }
        if (normOn) { ctx.globalAlpha = 0.5 * Math.sin(Math.PI * d.subP); ctx.strokeStyle = th.accent; ctx.lineWidth = 2; rr(RW.x - 2, y - 2, RW.w + 4, RW.h + 4, 7); ctx.stroke(); ctx.globalAlpha = 1; }
        label(RW.x + 9, y + RW.h / 2, "ℓ" + (i + 1), { base: "middle", size: 9 });
        ctx.fillStyle = colr2; rr(RW.x + 28, y + RW.h / 2 - 9, 18, 18, 4); ctx.fill();
        if (flash[i] > 0) { ctx.globalAlpha = flash[i]; ctx.strokeStyle = th.text; ctx.lineWidth = 1.8; rr(RW.x + 24, y + RW.h / 2 - 13, 26, 26, 5); ctx.stroke(); ctx.globalAlpha = 1; }
        var bx0 = RW.x + 58, bx1 = RW.x + RW.w - 12, bw = bx1 - bx0, xNow = isUpd ? lerp(st.xb[i], st.xa[i], e) : isVer ? st.xa[i] : st.xb[i], len = lenOf(xNow) * bw;
        ctx.fillStyle = th.line; rr(bx0, y + 9, bw, 10, 3); ctx.fill(); ctx.fillStyle = colr2; rr(bx0, y + 9, len, 10, 3); ctx.fill();
        if (isHeads || (isUpd && p < 0.6)) { var dxA = (lenOf(st.xa[i]) - lenOf(st.xb[i])) * bw * (isHeads ? clamp(p / 0.5, 0, 1) : 1); if (Math.abs(dxA) > 0.5) { if (Math.abs(dxA) < 7) dxA = dxA > 0 ? 7 : -7; var ax = bx0 + lenOf(st.xb[i]) * bw; ctx.strokeStyle = th.accent; ctx.fillStyle = th.accent; ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(ax, y + 14); ctx.lineTo(ax + dxA, y + 14); ctx.stroke(); var sg2 = dxA > 0 ? 1 : -1; ctx.beginPath(); ctx.moveTo(ax + dxA, y + 14); ctx.lineTo(ax + dxA - sg2 * 6, y + 10); ctx.lineTo(ax + dxA - sg2 * 6, y + 18); ctx.closePath(); ctx.fill(); } }
        if (flowOn) { var spr = isHeads ? clamp((p - 0.3) / 0.5, 0, 1) : 1, xx = bx0; for (j = 0; j < C; j++) { var wj = bw * st.post[i][j] * spr; ctx.fillStyle = colOf(j); ctx.globalAlpha = isUpd && p > 0.75 ? (j === st.ma[i] ? 1 : 0.2) : 0.9; ctx.fillRect(xx, y + 25, wj, 7); xx += wj; } ctx.globalAlpha = 1; }
      }
      if ((isBlk && d.slow && d.sub === 1) || contOn) { var WSA2 = saW(k), arcA = contOn ? 0.35 * clamp(d.prog / 0.15, 0, 1) : clamp(d.subP / 0.3, 0, 1); for (var a = 0; a < L; a++) for (var b = a + 1; b < L; b++) { var ww = WSA2[a][b], q7 = saArc(a, b); ctx.strokeStyle = th.text; ctx.globalAlpha = (0.06 + 0.38 * ww) * arcA; ctx.lineWidth = 0.7 + 1.3 * ww; ctx.beginPath(); ctx.moveTo(q7.x0, q7.y0); ctx.quadraticCurveTo(q7.cx, q7.cy, q7.x1, q7.y1); ctx.stroke(); } ctx.globalAlpha = 1; }

      /* key */
      panel(KEY, "how to read it", false, null);
      var ky = KEY.y + 30;
      ctx.fillStyle = colOf(0); rr(KEY.x + 12, ky, 12, 12, 3); ctx.fill(); ctx.fillStyle = colOf(1); rr(KEY.x + 26, ky, 12, 12, 3); ctx.fill(); ctx.fillStyle = colOf(2); rr(KEY.x + 40, ky, 12, 12, 3); ctx.fill(); label(KEY.x + 62, ky + 6, "each colour is one material", { base: "middle", size: 9, color: th.text });
      ky += 20; ctx.fillStyle = colOf(3); rr(KEY.x + 12, ky + 2, 40, 8, 3); ctx.fill(); label(KEY.x + 62, ky + 6, "bar length is thickness", { base: "middle", size: 9, color: th.text });
      ky += 20; for (q = 0; q < 4; q++) dot(KEY.x + 16 + q * 11, ky + 6, 2.2, colOf(q), 0.9); label(KEY.x + 62, ky + 6, "probability flow (material head)", { base: "middle", size: 9, color: th.text });
      ky += 20; dot(KEY.x + 32, ky + 6, 6, colOf(4)); label(KEY.x + 62, ky + 6, "decision: layer resampled", { base: "middle", size: 9, color: th.text });
      ky += 20; dot(KEY.x + 22, ky + 6, 3.5, SPEC_COL); dot(KEY.x + 36, ky + 6, 2.5, SPEC_COL, 0.6); label(KEY.x + 62, ky + 6, "spectrum token b, gated", { base: "middle", size: 9, color: th.text });

      /* candidate material cards: curve → shared tokenizer → material token */
      label(CD.x, CD.y0 - 30, "candidate materials of this request", { size: 9, color: th.text, weight: "600" });
      label(CD.x, CD.y0 - 16, "token ← shared tokenizer ← n,k curve", { size: 9, color: isEnc ? th.accent : th.muted });
      var hh = cardH();
      for (j = 0; j < C; j++) {
        var yc = cardY(j), ym = cardMid(j), q11 = encQ(j, d), mc = colOf(j), isNew = j === 5;
        var hot = focus >= 0 && (crossOn || flowOn) ? (crossOn ? st.attn[focus][j] : st.post[focus][j]) : 0, encNow = isEnc && q11 > 0 && q11 < 1;
        ctx.fillStyle = th.dark ? "#1f1f22" : "#fff"; ctx.strokeStyle = hot > 0.3 ? mc : encNow ? th.accent : th.line; ctx.lineWidth = hot > 0.3 || encNow ? 1.6 : 1; rr(CD.x, yc, CD.w, hh, 6); ctx.fill(); ctx.stroke();
        var cb = curveBox(j); ctx.strokeStyle = th.line; ctx.lineWidth = 0.8; rr(cb.x, cb.y, cb.w, cb.h, 3); ctx.stroke();
        [["n", mc, 1.6, []], ["k", th.text, 0.9, [2, 2]]].forEach(function (sr) { ctx.strokeStyle = sr[1]; ctx.lineWidth = sr[2]; ctx.setLineDash(sr[3]); ctx.beginPath(); for (var z = 0; z <= 24; z++) { var uu = z / 24, vv = nkDemo(j, uu)[sr[0]], px = cb.x + 3 + (cb.w - 6) * uu, py = cb.y + cb.h - 3 - (cb.h - 6) * vv; if (z === 0) ctx.moveTo(px, py); else ctx.lineTo(px, py); } ctx.stroke(); ctx.setLineDash([]); });
        var litC = function (c3) { if (q11 >= 1) return 0.2; if (q11 <= 0) return 0; return Math.max(0, 1 - Math.abs(q11 * 1.5 - (0.35 + c3 * 0.25)) / 0.18); };
        for (c = 0; c < 2; c++) { var a7 = Math.min(litC(c), litC(c + 1)); for (m1 = 0; m1 < CT[c].n; m1++) for (m2 = 0; m2 < CT[c + 1].n; m2++) { var pa = tokNode(j, c, m1), pbb = tokNode(j, c + 1, m2); ctx.globalAlpha = 0.1 + 0.5 * a7; ctx.strokeStyle = a7 > 0.3 ? mc : th.line; ctx.lineWidth = 0.5; ctx.beginPath(); ctx.moveTo(pa.x, pa.y); ctx.lineTo(pbb.x, pbb.y); ctx.stroke(); } }
        for (c = 0; c < 3; c++) for (m1 = 0; m1 < CT[c].n; m1++) { var pn = tokNode(j, c, m1); ctx.globalAlpha = 1; ctx.fillStyle = th.dark ? "#2c2c32" : "#eceef3"; ctx.strokeStyle = th.line; ctx.lineWidth = 0.7; ctx.beginPath(); ctx.arc(pn.x, pn.y, 2.4, 0, TWO_PI); ctx.fill(); ctx.stroke(); dot(pn.x, pn.y, 2.4, mc, litC(c)); }
        var tokX = CD.x + 10, fillT = q11 >= 1 ? 1 : clamp((q11 - 0.66) / 0.22, 0, 1);
        for (m1 = 0; m1 < CT[2].n; m1++) { var pl = tokNode(j, 2, m1); ctx.globalAlpha = q11 > 0.55 && q11 < 1 ? 0.6 : 0.14; ctx.strokeStyle = mc; ctx.lineWidth = 0.8; ctx.beginPath(); ctx.moveTo(pl.x, pl.y); ctx.lineTo(tokX + 20, ym); ctx.stroke(); } ctx.globalAlpha = 1;
        ctx.strokeStyle = th.line; ctx.lineWidth = 1; rr(tokX, ym - 10, 20, 20, 4); ctx.stroke(); ctx.globalAlpha = fillT; ctx.fillStyle = mc; rr(tokX, ym - 10, 20, 20, 4); ctx.fill(); ctx.globalAlpha = 1;
        if (q11 > 0.8 && q11 < 1) { ctx.globalAlpha = (1 - q11) / 0.2; ctx.strokeStyle = mc; ctx.lineWidth = 1.5; rr(tokX - 4, ym - 14, 28, 28, 6); ctx.stroke(); ctx.globalAlpha = 1; }
        label(CD.x + 34, yc + 4, nameOf(j), { size: 9, color: fillT > 0.5 ? th.text : th.muted, weight: "600" });
        if (isNew) label(CD.x + 34, yc + hh - 3, "new, never seen", { size: 8, base: "bottom", color: th.accent });
      }

      /* particles */
      parts.forEach(function (q5) {
        if (q5.s < 0) return;
        if (q5.t === "in") { var pi = bez(inPath(q5.k), q5.s); dot(pi[0], pi[1], 1.9, SPEC_COL, 0.9); }
        else if (q5.t === "ce") { if (q5.j >= C) return; var pc = bez(cePath(q5.j, q5.k), q5.s); dot(pc[0], pc[1], 2, colOf(q5.j), 0.95); }
        else if (q5.t === "sa") { var psa = saPoint(q5.a, q5.b, ease(q5.s)), fade = Math.sin(Math.PI * q5.s); dot(psa[0], psa[1], 2.8, colOf(q5.col), 0.3 + 0.7 * fade); }
        else if (q5.t === "br") { var pbx = bez(bPath(q5.i), q5.s); dot(pbx[0], pbx[1], 1.5 + 3 * q5.amp, SPEC_COL, 0.35 + 0.65 * q5.amp); }
        else if (q5.t === "fl") { if (q5.j >= C) return; var on5 = focus < 0 || focus === q5.i, pf = bez(link(q5.i, q5.j), 1 - q5.s); dot(pf[0], pf[1], 2.3, colOf(q5.j), (0.35 + 0.65 * st.post[q5.i][q5.j]) * (on5 ? 1 : 0.1)); }
        else if (q5.t === "dec") { var on6 = focus < 0 || focus === q5.i, pd = bez(link(q5.i, q5.j), 1 - ease(q5.s)); dot(pd[0], pd[1], 6.5, colOf(q5.j), on6 ? 1 : 0.3); ctx.strokeStyle = th.bg; ctx.lineWidth = 1.5; ctx.beginPath(); ctx.arc(pd[0], pd[1], 6.5, 0, TWO_PI); ctx.stroke(); }
      });
      ctx.restore();
      chips.querySelectorAll("[data-ph]").forEach(function (b3) { b3.classList.toggle("active", b3.getAttribute("data-ph") === ph); });
      narr.innerHTML = narrHTML(isEnc ? "before sampling" : isVer ? "after the last step" : "denoising step " + (k + 1) + (isBlk ? (d.slow ? " · block 1, one operation at a time" : k === 0 ? " · blocks 2 … N" : " · blocks 1 … N") : ""), contOn ? PHS.blockCont.text : PHS[ph].text);
    }
    function frame(ts) { if (!playing) return; if (lastTs == null) lastTs = ts; var dt = Math.min(0.05, (ts - lastTs) / 1000) * parseFloat(speed.value); lastTs = ts; tau += dt; if (tau >= total) { tau = total - 0.001; render(); playing = false; playBtn.textContent = "Replay"; setTimeout(function () { if (!playing) { seed = 1 + Math.floor(Math.random() * 1e9); buildEngine(); seekTo(0); playing = true; playBtn.textContent = "Pause"; lastTs = null; requestAnimationFrame(frame); } }, 6000); return; } update(dt); render(); requestAnimationFrame(frame); }
    buildEngine(); resetParticles(); syncRows();
    layout(); if ("ResizeObserver" in window) new ResizeObserver(layout).observe(container); if (document.fonts) document.fonts.ready.then(layout); live.push({ render: render });
    if (reduceMotion) { playing = false; playBtn.textContent = "Play"; seekTo(total - 0.001); } else requestAnimationFrame(frame);
    var hm = /^#pipe=(\d+(?:\.\d+)?)(?:,(\d+(?:\.\d+)?))?(,new)?$/.exec(location.hash || "");
    if (hm) { playing = false; playBtn.textContent = "Play"; container.style.cssText = "position:fixed;top:0;left:0;right:0;z-index:99999;margin:0;border-radius:0"; if (hm[3]) { extra = true; addBtn.textContent = "− remove the new material"; buildEngine(); } layout(); seekTo(parseFloat(hm[1])); if (hm[2]) { var T = parseFloat(hm[2]); for (var z = 0; z < T * 60; z++) { tau += 1 / 60; update(1 / 60); } render(); } }
  }

  /* ============================ JOINT FLOW COUPLING ============================ */
  /* How the continuous (thickness) and discrete (material) flows steer each other during sampling.
     Left: thickness bars and predicted final thickness (◆). Middle: one network reads each layer as a fused
     thickness + material token, with self-attention across layers. Right: probability over materials and the
     current material. Each step: read (both enter together), predict (information leaves crossed over), step
     (Euler move on thickness, Markov jump on material, one shared clock). Rings carry thickness, coloured dots
     carry material. Scripted coupling: wrong materials shift predicted thicknesses of a layer and its
     neighbours; thickness deviations and pinned choices reshape neighbours' material probabilities. */
  function initJoint(container) {
    container.innerHTML = "";
    var JW = 1000, JH = 584, L = 6, C = 5, K = 8, PAL = PIPE_COLORS;
    var scroller = el("div", "if-pipe-scroll"), canvas = document.createElement("canvas"); scroller.appendChild(canvas); container.appendChild(scroller);
    var narr = el("div", "if-hood if-pipe-narr"); container.appendChild(narr);
    var ctl = el("div", "if-controls");
    var playBtn = el("button", "if-primary", "Pause"), newBtn = el("button", "", "New run"), clearBtn = el("button", "", "Clear pins");
    var speed = document.createElement("select"); speed.innerHTML = '<option value="1">normal</option><option value="0.5">slow</option><option value="2">fast</option>';
    [playBtn, newBtn, clearBtn, speed].forEach(function (b) { ctl.appendChild(b); });
    ctl.appendChild(el("span", "if-small", "Click a material square to swap and pin it · click a thickness track to pin a thickness"));
    container.appendChild(ctl);

    var BX0 = 70, BX1 = 300, CT = { x: 392, w: 56 }, CM = { x: 552, w: 56 }, NX = 500, STX0 = 680, STX1 = 900, SWX = 918, Y0 = 124, RH = 62;
    function mid(l) { return Y0 + (L - 1 - l) * RH + RH / 2; }
    function lenF(v) { return clamp(0.5 + 0.4 * v, 0.06, 1); }
    function xOfLen(f) { return clamp((f - 0.5) / 0.4, -1.1, 1.25); }

    /* ---- engine ---- */
    var seedJ = 1 + Math.floor(Math.random() * 1e9), rnd, xs, ms, comp, eps, noiseA, noiseX, S, saw;
    var x, m, t, k, phase, pt, xhat, xhatPrev, post, postPrev, stepI, parts = [], acc = {}, histT = [], histX = [], histM = [], histP = [], histXh = [];
    var pinX = [], pinM = [], shiftGlow = [], stripGlow = [], flash = [];
    for (var i0 = 0; i0 < L; i0++) { pinX.push(null); pinM.push(null); shiftGlow.push(0); stripGlow.push(0); flash.push(0); }
    function uniform() { var a = []; for (var c = 0; c < C; c++) a.push(1 / C); return a; }
    function onehot(j) { var a = []; for (var c = 0; c < C; c++) a.push(c === j ? 1 : 0); return a; }
    function nbrs(l) { var a = []; for (var j = Math.max(0, l - 1); j <= Math.min(L - 1, l + 1); j++) a.push(j); return a; }
    function newRun() {
      rnd = mulberry32(seedJ++); xs = []; ms = []; comp = []; eps = []; noiseA = []; noiseX = []; S = []; saw = []; x = []; m = [];
      var l, j, c;
      for (l = 0; l < L; l++) {
        xs.push(-0.7 + 1.4 * rnd()); ms.push(Math.floor(rnd() * C)); var cc = Math.floor(rnd() * (C - 1)); comp.push(cc >= ms[l] ? cc + 1 : cc);
        eps.push(clamp(0.9 * gauss(rnd), -1.1, 1.2)); var na = []; for (c = 0; c < C; c++) na.push(rnd() * 0.8); noiseA.push(na); noiseX.push(0.5 * gauss(rnd));
        var row = []; for (j = 0; j < L; j++) row.push(Math.abs(j - l) <= 1 ? (rnd() < 0.5 ? -1 : 1) * (0.35 + 0.35 * rnd()) : 0); S.push(row);
        x.push(eps[l]); m.push(Math.floor(rnd() * C)); saw.push([]);
      }
      for (l = 0; l < L; l++) for (j = 0; j < L; j++) { if (j < l) saw[l][j] = saw[j][l]; else if (j === l) saw[l][j] = 0; else saw[l][j] = Math.abs(j - l) === 1 ? 0.6 + 0.4 * rnd() : 0.12 + 0.35 * rnd(); }
      applyPins(); t = 1; k = 0; phase = "read"; pt = 0; xhat = null; xhatPrev = null; stepI = null; parts = []; acc = {};
      post = []; postPrev = []; for (l = 0; l < L; l++) { post.push(pinM[l] != null ? onehot(pinM[l]) : uniform()); postPrev.push(post[l].slice()); shiftGlow[l] = 0; stripGlow[l] = 0; flash[l] = 0; }
      histT = [1]; histX = []; histM = []; histP = []; histXh = []; for (l = 0; l < L; l++) { histX.push([x[l]]); histM.push([m[l]]); histP.push([]); histXh.push([]); }
    }
    function applyPins() { for (var l = 0; l < L; l++) { if (pinX[l] != null) x[l] = pinX[l]; if (pinM[l] != null) m[l] = pinM[l]; } }
    function predictNow() {
      xhatPrev = xhat ? xhat.slice() : x.slice(); postPrev = post.map(function (q) { return q.slice(); }); xhat = [];
      var l, j, c;
      for (l = 0; l < L; l++) {
        var gam = 0; nbrs(l).forEach(function (jj) { if (m[jj] !== ms[jj]) gam += 1.7 * S[l][jj] * (jj === l ? 1 : 0.6); if (jj !== l && pinX[jj] != null) gam += 0.6 * (xs[jj] - pinX[jj]); });
        xhat.push(pinX[l] != null ? pinX[l] : clamp(xs[l] + gam + 0.55 * t * noiseX[l], -1.15, 1.25));
      }
      var beta = 0.35 + 3.2 * (1 - t); post = [];
      for (l = 0; l < L; l++) {
        if (pinM[l] != null) { post.push(onehot(pinM[l])); continue; }
        var dev = 0, pull = 0; nbrs(l).forEach(function (jj) { if (jj === l) return; dev += Math.abs(x[jj] - xs[jj]) / 2; if (pinM[jj] != null && pinM[jj] !== ms[jj]) pull++; if (pinX[jj] != null && Math.abs(pinX[jj] - xs[jj]) > 0.25) pull++; });
        var lg = []; for (c = 0; c < C; c++) lg.push((noiseA[l][c] + (c === ms[l] ? 2.2 : 0) + (c === comp[l] ? 0.8 * dev + 1.7 * pull : 0)) * beta);
        post.push(softmaxArr(lg));
      }
      for (l = 0; l < L; l++) { histP[l][k] = post[l].slice(); histXh[l][k] = xhat[l]; }
      for (l = 0; l < L; l++) { if (k > 0 && Math.abs(xhat[l] - xhatPrev[l]) > 0.15) shiftGlow[l] = 1; var d1 = 0; for (c = 0; c < C; c++) d1 += Math.abs(post[l][c] - postPrev[l][c]); if (k > 0 && d1 > 0.35) stripGlow[l] = 1; }
    }
    function dur(ph) { var slow = k < 3; return ph === "read" ? (slow ? 2.0 : 1.2) : ph === "predict" ? (slow ? 2.0 : 1.2) : ph === "step" ? (slow ? 1.8 : 1.1) : 5.5; }
    function stepNow() {
      var l, c, uSum = 0, nFree = 0; for (l = 0; l < L; l++) if (pinM[l] == null) { uSum += entropyNorm(post[l]); nFree++; }
      var u = nFree ? uSum / nFree : 0, mk = K - k, s2 = mk > 1 ? t * Math.pow((mk - 1) / mk, 1 + u) : 0, lam = 1 / (K - k);
      var xTo = [], mNew = [], res = [];
      for (l = 0; l < L; l++) xTo.push(pinX[l] != null ? pinX[l] : (s2 > 0 ? xhat[l] + (s2 / t) * (x[l] - xhat[l]) : xhat[l]));
      for (l = 0; l < L; l++) res.push(pinM[l] == null && rnd() < lam);
      if (k < K - 1 && res.indexOf(true) < 0) { var free = []; for (l = 0; l < L; l++) if (pinM[l] == null) free.push(l); if (free.length) res[free[Math.floor(rnd() * free.length)]] = true; }
      for (l = 0; l < L; l++) {
        if (!res[l]) { mNew.push(m[l]); continue; }
        var pick = 0;
        if (k === K - 1) { for (c = 1; c < C; c++) if (post[l][c] > post[l][pick]) pick = c; }
        else { var r = rnd(), a = 0; pick = C - 1; for (c = 0; c < C; c++) { a += post[l][c]; if (r <= a) { pick = c; break; } } }
        mNew.push(pick);
      }
      stepI = { t: t, s: s2, xFrom: x.slice(), xTo: xTo, mNew: mNew, res: res };
      for (l = 0; l < L; l++) if (res[l]) parts.push({ t: "dec", l: l, c: mNew[l], s: 0, life: dur("step") * 0.6 });
    }
    function commitStep() { x = stepI.xTo.slice(); for (var l = 0; l < L; l++) if (pinM[l] == null) m[l] = stepI.mNew[l]; applyPins(); t = stepI.s; k++; stepI = null; histT.push(t); for (l = 0; l < L; l++) { histX[l].push(x[l]); histM[l].push(m[l]); } }
    function conf(l) { var mx = 0; for (var c = 0; c < C; c++) mx = Math.max(mx, post[l][c]); return clamp((mx - 1 / C) / (1 - 1 / C), 0, 1); }
    function info() { return clamp(1 - t, 0, 1); }
    function sampleMat(l) { var r = Math.random(), a2 = 0; for (var c = 0; c < C; c++) { a2 += post[l][c]; if (r <= a2) return c; } return C - 1; }
    function spawn(key, rate, dt, fn) { if (acc[key] == null) acc[key] = Math.random(); acc[key] += dt * rate; while (acc[key] >= 1) { acc[key] -= 1; fn(); } }
    function update(dt) {
      pt += dt; var l, a, b;
      if (phase === "read") {
        for (l = 0; l < L; l++) (function (l) {
          var I = info(), cf = conf(l);
          spawn("ti" + l, 0.5 + 6.5 * I, dt, function () { parts.push({ t: "tin", l: l, s: 0, life: 0.9 }); });
          spawn("mi" + l, 0.5 + 6.5 * Math.max(I * 0.6, cf), dt, function () { parts.push({ t: "min", l: l, s: 0, life: 0.9, c: m[l] }); });
          if (pt > 0.45) spawn("jn" + l, 0.6 + 7 * I, dt, function () { parts.push({ t: "join", l: l, s: 0, life: 0.55, side: Math.random() < 0.5 ? "T" : "M", c: m[l] }); });
        })(l);
        if (pt > 0.65) for (a = 0; a < L; a++) for (b = 0; b < L; b++) if (a !== b) (function (a, b) { spawn("sa" + a + "_" + b, saw[a][b] * saw[a][b] * (0.25 + 3.2 * info()), dt, function () { parts.push({ t: "arc", a: a, b: b, s: 0, life: 1.0, ring: Math.random() < 0.5, c: m[a] }); }); })(a, b);
        if (pt >= dur("read")) { predictNow(); phase = "predict"; pt = 0; }
      } else if (phase === "predict") {
        for (l = 0; l < L; l++) (function (l) {
          var nb = nbrs(l);
          var I2 = info(), cf2 = conf(l), sprd = t;
          spawn("to" + l, 0.8 + 8 * I2, dt, function () { var j = nb[Math.floor(Math.random() * nb.length)]; parts.push({ t: "tout", l: l, s: 0, life: 1.0, ring: Math.random() < 0.3, c: m[j], jx: gauss(Math.random) * 55 * sprd, jy: gauss(Math.random) * 7 * sprd }); });
          spawn("mo" + l, 0.8 + 3 * I2 + 6 * cf2, dt, function () { var j = nb[Math.floor(Math.random() * nb.length)]; parts.push({ t: "mout", l: l, s: 0, life: 1.0, ring: Math.random() < 0.35, c: m[j], pc: sampleMat(l), r: Math.random() }); });
        })(l);
        if (pt >= dur("predict")) { stepNow(); phase = "step"; pt = 0; }
      } else if (phase === "step") {
        if (pt >= dur("step")) { commitStep(); phase = k >= K ? "end" : "read"; pt = 0; }
      } else if (phase === "end") { if (pt >= dur("end")) newRun(); }
      parts.forEach(function (q) { q.s += dt / q.life; if (q.s >= 1 && q.t === "dec") { m[q.l] = pinM[q.l] != null ? pinM[q.l] : q.c; flash[q.l] = 1; } });
      parts = parts.filter(function (q) { return q.s < 1; });
      for (l = 0; l < L; l++) { shiftGlow[l] = Math.max(0, shiftGlow[l] - dt * 0.6); stripGlow[l] = Math.max(0, stripGlow[l] - dt * 0.6); flash[l] = Math.max(0, flash[l] - dt * 1.6); }
    }

    /* ---- interaction ---- */
    var playing = !reduceMotion, visible = false, lastTs = null, frozen = false, ctx, scale = 1, th, lastNarr = "";
    function toLogical(ev) { var r = canvas.getBoundingClientRect(); return { x: (ev.clientX - r.left) * JW / r.width, y: (ev.clientY - r.top) * JH / r.height }; }
    function hit(q) { for (var l = 0; l < L; l++) { if (Math.abs(q.y - mid(l)) > RH / 2 - 6) continue; if (q.x >= BX0 - 8 && q.x <= BX1 + 8) return { l: l, kind: "x" }; if (q.x >= STX0 - 6 && q.x <= SWX + 30) return { l: l, kind: "m" }; } return null; }
    canvas.addEventListener("click", function (ev) {
      var h = hit(toLogical(ev)); if (!h) return; var l = h.l;
      if (h.kind === "x") { var q = toLogical(ev), v = xOfLen(clamp((q.x - BX0) / (BX1 - BX0), 0.06, 1)); pinX[l] = v; x[l] = v; if (xhat) xhat[l] = v; if (stepI) { stepI.xFrom[l] = v; stepI.xTo[l] = v; } }
      else { var nm = ((pinM[l] != null ? pinM[l] : m[l]) + 1) % C; pinM[l] = nm; m[l] = nm; post[l] = onehot(nm); if (stepI) stepI.mNew[l] = nm; if (histP[l][k]) histP[l][k] = onehot(nm); histM[l][histM[l].length - 1] = nm; }
      flash[l] = 1; if (!playing) render();
    });
    canvas.addEventListener("mousemove", function (ev) { canvas.style.cursor = hit(toLogical(ev)) ? "pointer" : "default"; });
    playBtn.addEventListener("click", function () { playing = !playing; playBtn.textContent = playing ? "Pause" : "Play"; lastTs = null; });
    newBtn.addEventListener("click", function () { newRun(); render(); });
    clearBtn.addEventListener("click", function () { for (var l = 0; l < L; l++) { pinX[l] = null; pinM[l] = null; } render(); });

    /* ---- drawing ---- */
    function rr(x0, y0, w, h, r) { r = Math.max(0, Math.min(r, w / 2, h / 2)); ctx.beginPath(); ctx.moveTo(x0 + r, y0); ctx.lineTo(x0 + w - r, y0); ctx.quadraticCurveTo(x0 + w, y0, x0 + w, y0 + r); ctx.lineTo(x0 + w, y0 + h - r); ctx.quadraticCurveTo(x0 + w, y0 + h, x0 + w - r, y0 + h); ctx.lineTo(x0 + r, y0 + h); ctx.quadraticCurveTo(x0, y0 + h, x0, y0 + h - r); ctx.lineTo(x0, y0 + r); ctx.quadraticCurveTo(x0, y0, x0 + r, y0); ctx.closePath(); }
    function label(x0, y0, text, o) { o = o || {}; ctx.fillStyle = o.color || th.muted; ctx.font = (o.weight || "") + " " + (o.size || 10) + "px system-ui, sans-serif"; ctx.textAlign = o.align || "left"; ctx.textBaseline = o.base || "top"; ctx.fillText(text, x0, y0); }
    function ring(x0, y0, alpha) { ctx.globalAlpha = alpha == null ? 1 : alpha; ctx.strokeStyle = th.text; ctx.lineWidth = 1.4; ctx.beginPath(); ctx.arc(x0, y0, 3, 0, TWO_PI); ctx.stroke(); ctx.globalAlpha = 1; }
    function dotc(x0, y0, col, alpha, r) { ctx.globalAlpha = alpha == null ? 1 : alpha; ctx.fillStyle = col; ctx.beginPath(); ctx.arc(x0, y0, r || 3, 0, TWO_PI); ctx.fill(); ctx.globalAlpha = 1; }
    function lockIcon(cx, cy, sz, col) { ctx.strokeStyle = col; ctx.fillStyle = col; ctx.lineWidth = Math.max(1, sz * 0.16); ctx.beginPath(); ctx.arc(cx, cy - sz * 0.12, sz * 0.28, Math.PI, 0); ctx.stroke(); rr(cx - sz * 0.4, cy - sz * 0.12, sz * 0.8, sz * 0.55, 1.2); ctx.fill(); }
    function diamond(cx, cy, r, col, fill) { ctx.beginPath(); ctx.moveTo(cx, cy - r); ctx.lineTo(cx + r, cy); ctx.lineTo(cx, cy + r); ctx.lineTo(cx - r, cy); ctx.closePath(); if (fill) { ctx.fillStyle = col; ctx.fill(); } else { ctx.strokeStyle = col; ctx.lineWidth = 1.4; ctx.stroke(); } }
    function lerpPt(a, b, f) { return { x: lerp(a.x, b.x, f), y: lerp(a.y, b.y, f) }; }
    var NARR = {
      read: "<b>Read.</b> Each layer enters the network as one token: its thickness (rings) and its material (coloured dots) arrive together, and self-attention mixes them across all layers. Density is information: near t = 1 the design is mostly noise and only a trickle flows; as the clock runs down the streams thicken.",
      predict: "<b>Predict.</b> What leaves the network is crossed over: thickness information reshapes the material probabilities (right), and material information moves each predicted final thickness ◆ (left). Watch the density: early on, material particles scatter over every candidate and thickness particles land far around ◆; step by step they pile onto one material and converge on ◆.",
      step: "<b>Step.</b> One tick of the shared clock: every bar moves straight toward its ◆, and some layers draw a new material from their strip. The next read sees both changes at once, with a little more information than before.",
      end: "<b>Settled.</b> Thicknesses and materials arrived together, each shaped by the other. The particle streams are at their densest and land exactly on ◆ and on one material each. Swap and pin a material, or pin a thickness, and watch the other flow adapt in the next run."
    };
    function render() {
      if (!ctx) return; th = theme(container);
      ctx.save(); ctx.setTransform(scale * (window.devicePixelRatio || 1), 0, 0, scale * (window.devicePixelRatio || 1), 0, 0); ctx.clearRect(0, 0, JW, JH);
      var l, c, fr = clamp(pt / dur(phase), 0, 1), e = ease(fr);
      var predF = phase === "predict" ? ease(clamp((fr - 0.35) / 0.5, 0, 1)) : 1;
      var xD = function (i) { return phase === "step" && stepI ? lerp(stepI.xFrom[i], stepI.xTo[i], e) : x[i]; };
      var xhD = function (i) { if (!xhat) return null; return phase === "predict" ? lerp(xhatPrev[i], xhat[i], predF) : xhat[i]; };
      var pD = function (i, cc) { return phase === "predict" ? lerp(postPrev[i][cc], post[i][cc], predF) : post[i][cc]; };
      var tD = phase === "step" && stepI ? lerp(stepI.t, stepI.s, e) : t;
      var readOn = phase === "read", predOn = phase === "predict", stepOn = phase === "step";

      /* headers */
      label(24, 14, "Continuous flow · thickness", { size: 13, weight: "700", color: th.text });
      label(24, 33, "bar = thickness now   ◆ = predicted final thickness", { size: 9 });
      label(976, 14, "Discrete flow · material", { size: 13, weight: "700", color: th.text, align: "right" });
      label(976, 33, "strip = probability over materials   ■ = material now", { size: 9, align: "right" });
      ctx.strokeStyle = th.line; ctx.lineWidth = 2.5; ctx.beginPath(); ctx.arc(NX, 42, 22, 0, TWO_PI); ctx.stroke();
      ctx.strokeStyle = th.accent; ctx.lineWidth = stepOn ? 4.5 : 3.5; ctx.beginPath(); ctx.arc(NX, 42, 22, -Math.PI / 2, -Math.PI / 2 + TWO_PI * (1 - tD)); ctx.stroke();
      label(NX, 42, "t = " + tD.toFixed(2), { align: "center", base: "middle", size: 9, weight: "700", color: th.text });
      label(NX, 68, "one shared clock", { align: "center", size: 9, color: stepOn ? th.accent : th.muted });
      for (var q = 0; q < K; q++) dotc(NX - (K - 1) * 5 + q * 10, 84, q < k || (q === k && stepOn && e > 0.5) ? th.accent : th.line, 1, 2.6);

      /* network box */
      ctx.fillStyle = th.dark ? "rgba(255,255,255,0.025)" : "rgba(0,0,0,0.018)"; ctx.strokeStyle = readOn || predOn ? th.accent : th.line; ctx.lineWidth = readOn || predOn ? 1.8 : 1; rr(376, 96, 248, 416, 12); ctx.fill(); ctx.stroke();
      label(NX, 102, readOn ? "reading the joint state" : predOn ? "predicting both at once" : "one network, both flows", { align: "center", size: 9, weight: "600", color: readOn || predOn ? th.accent : th.muted });
      label(CT.x + CT.w / 2, 114, "thickness", { align: "center", size: 8 }); label(CM.x + CM.w / 2, 114, "material", { align: "center", size: 8 });

      /* self-attention arcs */
      for (var a = 0; a < L; a++) for (var b = a + 1; b < L; b++) { var sg = (a + b) % 2 ? 1 : -1, cx = NX + sg * (12 + 7 * (b - a)); ctx.strokeStyle = th.text; ctx.globalAlpha = (readOn && fr > 0.3 ? 0.1 + 0.45 * saw[a][b] : 0.05 + 0.08 * saw[a][b]); ctx.lineWidth = 0.6 + 1.2 * saw[a][b]; ctx.beginPath(); ctx.moveTo(NX, mid(a)); ctx.quadraticCurveTo(cx, (mid(a) + mid(b)) / 2, NX, mid(b)); ctx.stroke(); }
      ctx.globalAlpha = 1;

      for (l = 0; l < L; l++) {
        var y = mid(l), col = PAL[m[l]], xv = xD(l), bw = BX1 - BX0, barEnd = BX0 + lenF(xv) * bw, xh = xhD(l), tickX = xh == null ? null : BX0 + lenF(xh) * bw;
        /* separators */
        if (l < L - 1) { ctx.strokeStyle = th.line; ctx.globalAlpha = 0.5; ctx.lineWidth = 1; ctx.setLineDash([2, 4]); ctx.beginPath(); ctx.moveTo(20, y - RH / 2); ctx.lineTo(370, y - RH / 2); ctx.moveTo(630, y - RH / 2); ctx.lineTo(980, y - RH / 2); ctx.stroke(); ctx.setLineDash([]); ctx.globalAlpha = 1; }
        label(26, y, "ℓ" + (l + 1), { base: "middle", size: 10 });
        /* channels */
        ctx.strokeStyle = th.line; ctx.lineWidth = 1; ctx.globalAlpha = readOn ? 0.9 : 0.5; ctx.beginPath(); ctx.moveTo(barEnd + 2, y + 9); ctx.lineTo(CT.x, y + 9); ctx.stroke();
        ctx.beginPath(); ctx.moveTo(SWX, y + 9); ctx.lineTo(CM.x + CM.w, y + 9); ctx.stroke();
        ctx.globalAlpha = predOn ? 0.9 : 0.5; if (tickX != null) { ctx.beginPath(); ctx.moveTo(CT.x, y - 9); ctx.lineTo(tickX + 4, y - 9); ctx.stroke(); }
        ctx.beginPath(); ctx.moveTo(CM.x + CM.w, y - 9); ctx.lineTo(STX0, y - 9); ctx.stroke(); ctx.globalAlpha = 1;
        /* left lane: bar, noise ghost, predicted tick */
        ctx.fillStyle = th.line; rr(BX0, y - 5, bw, 10, 4); ctx.fill();
        ctx.fillStyle = col; ctx.globalAlpha = 0.95; rr(BX0, y - 5, Math.max(4, lenF(xv) * bw), 10, 4); ctx.fill(); ctx.globalAlpha = 1;
        if (flash[l] > 0) { ctx.globalAlpha = flash[l]; ctx.strokeStyle = th.text; ctx.lineWidth = 1.5; rr(BX0 - 3, y - 8, lenF(xv) * bw + 6, 16, 6); ctx.stroke(); ctx.globalAlpha = 1; }
        var gx = BX0 + lenF(eps[l]) * bw; ctx.strokeStyle = th.muted; ctx.globalAlpha = 0.45; ctx.setLineDash([2, 2]); ctx.beginPath(); ctx.moveTo(gx, y - 8); ctx.lineTo(gx, y + 8); ctx.stroke(); ctx.setLineDash([]); ctx.globalAlpha = 1;
        if (tickX != null) {
          if (shiftGlow[l] > 0) { ctx.globalAlpha = shiftGlow[l]; ctx.strokeStyle = th.accent; ctx.lineWidth = 2; ctx.beginPath(); ctx.arc(tickX, y - 13, 9, 0, TWO_PI); ctx.stroke(); ctx.globalAlpha = 1; }
          ctx.strokeStyle = th.text; ctx.lineWidth = 1.6; ctx.beginPath(); ctx.moveTo(tickX, y - 9); ctx.lineTo(tickX, y + 9); ctx.stroke(); diamond(tickX, y - 13, 5, th.text, true);
          if ((predOn && predF > 0.6) || stepOn) { var from = barEnd, to = tickX; if (Math.abs(to - from) > 8) { ctx.strokeStyle = th.accent; ctx.lineWidth = 1.6; ctx.setLineDash([4, 3]); ctx.beginPath(); ctx.moveTo(from, y + 15); ctx.lineTo(to, y + 15); ctx.stroke(); ctx.setLineDash([]); var sgn = to > from ? 1 : -1; ctx.fillStyle = th.accent; ctx.beginPath(); ctx.moveTo(to, y + 15); ctx.lineTo(to - sgn * 6, y + 12); ctx.lineTo(to - sgn * 6, y + 18); ctx.closePath(); ctx.fill(); } }
        }
        if (pinX[l] != null) { lockIcon(52, y + 1, 11, th.accent); }
        /* middle chips */
        ctx.fillStyle = th.dark ? "#1f1f22" : "#fff"; ctx.strokeStyle = readOn ? th.text : th.line; ctx.lineWidth = 1; rr(CT.x, y - 12, CT.w, 24, 6); ctx.fill(); ctx.stroke();
        ctx.fillStyle = th.text; ctx.globalAlpha = 0.55; rr(CT.x + 6, y - 3, Math.max(3, lenF(xv) * (CT.w - 12)), 6, 3); ctx.fill(); ctx.globalAlpha = 1;
        ctx.fillStyle = col; rr(CM.x, y - 12, CM.w, 24, 6); ctx.fill();
        ctx.strokeStyle = th.text; ctx.globalAlpha = 0.5; ctx.lineWidth = 1; ctx.beginPath(); ctx.moveTo(CT.x + CT.w, y); ctx.lineTo(CM.x, y); ctx.stroke(); ctx.globalAlpha = 1;
        dotc(NX, y, th.text, 0.85, 3.5);
        /* right lane: probability strip and material square */
        if (stripGlow[l] > 0) { ctx.globalAlpha = stripGlow[l]; ctx.strokeStyle = th.accent; ctx.lineWidth = 2; rr(STX0 - 4, y - 10, STX1 - STX0 + 8, 20, 6); ctx.stroke(); ctx.globalAlpha = 1; }
        var sx0 = STX0; for (c = 0; c < C; c++) { var w = (STX1 - STX0) * pD(l, c); ctx.fillStyle = PAL[c]; ctx.globalAlpha = stepOn && stepI && stepI.res[l] ? (c === stepI.mNew[l] ? 1 : 0.3) : 0.9; ctx.fillRect(sx0, y - 6, Math.max(0, w - 0.8), 12); sx0 += w; }
        ctx.globalAlpha = 1;
        ctx.fillStyle = col; rr(SWX, y - 12, 24, 24, 5); ctx.fill();
        if (flash[l] > 0) { ctx.globalAlpha = flash[l]; ctx.strokeStyle = th.text; ctx.lineWidth = 2; rr(SWX - 4, y - 16, 32, 32, 7); ctx.stroke(); ctx.globalAlpha = 1; }
        if (pinM[l] != null) lockIcon(SWX + 12, y + 1, 12, "#fff");
      }

      /* particles */
      parts.forEach(function (p) {
        var y, pos;
        if (p.t === "tin") { y = mid(p.l); var be = BX0 + lenF(xD(p.l)) * (BX1 - BX0); pos = lerpPt({ x: be, y: y + 9 }, { x: CT.x, y: y + 9 }, p.s); ring(pos.x, pos.y, 0.9); }
        else if (p.t === "min") { y = mid(p.l); pos = lerpPt({ x: SWX, y: y + 9 }, { x: CM.x + CM.w, y: y + 9 }, p.s); dotc(pos.x, pos.y, PAL[p.c], 0.95); }
        else if (p.t === "join") { y = mid(p.l); pos = p.side === "T" ? lerpPt({ x: CT.x + CT.w, y: y }, { x: NX, y: y }, p.s) : lerpPt({ x: CM.x, y: y }, { x: NX, y: y }, p.s); if (p.side === "T") ring(pos.x, pos.y, 0.9); else dotc(pos.x, pos.y, PAL[p.c], 0.95); }
        else if (p.t === "arc") { var sg2 = (Math.min(p.a, p.b) + Math.max(p.a, p.b)) % 2 ? 1 : -1, y0 = mid(p.a), y1 = mid(p.b), cx2 = NX + sg2 * (12 + 7 * Math.abs(p.b - p.a)), u = ease(p.s), iu = 1 - u, px = iu * iu * NX + 2 * iu * u * cx2 + u * u * NX, py = iu * iu * y0 + 2 * iu * u * (y0 + y1) / 2 + u * u * y1; if (p.ring) ring(px, py, 0.85); else dotc(px, py, PAL[p.c], 0.9, 2.6); }
        else if (p.t === "tout") { y = mid(p.l); var xh2 = xhD(p.l); if (xh2 == null) return; var tk = BX0 + lenF(xh2) * (BX1 - BX0); if (p.s < 0.25) pos = lerpPt({ x: NX, y: y }, { x: CT.x + CT.w, y: y }, p.s / 0.25); else if (p.s < 0.35) pos = lerpPt({ x: CT.x + CT.w, y: y - 9 }, { x: CT.x, y: y - 9 }, (p.s - 0.25) / 0.1); else { var ff = (p.s - 0.35) / 0.65, landX = clamp(tk + (p.jx || 0), BX0 - 6, BX1 + 6), landY = y - 9 + (p.jy || 0); pos = lerpPt({ x: CT.x, y: y - 9 }, { x: lerp(CT.x, landX, 1), y: landY }, ff); pos.y = lerp(y - 9, landY, ff * ff); } if (p.ring) ring(pos.x, pos.y, 0.9); else dotc(pos.x, pos.y, PAL[p.c], 0.95); }
        else if (p.t === "mout") { y = mid(p.l); var segS = STX0; for (var cq = 0; cq < p.pc; cq++) segS += (STX1 - STX0) * pD(p.l, cq); var segW = (STX1 - STX0) * pD(p.l, p.pc), endX = segS + segW * (0.15 + 0.7 * p.r); if (p.s < 0.25) pos = lerpPt({ x: NX, y: y }, { x: CM.x, y: y }, p.s / 0.25); else if (p.s < 0.35) pos = lerpPt({ x: CM.x, y: y - 9 }, { x: CM.x + CM.w, y: y - 9 }, (p.s - 0.25) / 0.1); else { var fm = (p.s - 0.35) / 0.65; pos = { x: lerp(CM.x + CM.w, endX, fm), y: lerp(y - 9, y - 11 - 3 * p.r, fm * fm) }; } if (p.ring) ring(pos.x, pos.y, 0.9); else { var colM = PAL[p.s < 0.35 ? p.c : p.pc]; dotc(pos.x, pos.y, colM, 0.95); if (p.s >= 0.35) { ctx.strokeStyle = th.bg; ctx.lineWidth = 1; ctx.beginPath(); ctx.arc(pos.x, pos.y, 3, 0, TWO_PI); ctx.stroke(); } } }
        else if (p.t === "dec") { y = mid(p.l); var sx = STX0; for (var cc = 0; cc < p.c; cc++) sx += (STX1 - STX0) * pD(p.l, cc); var segC = sx + (STX1 - STX0) * pD(p.l, p.c) / 2; pos = lerpPt({ x: segC, y: y }, { x: SWX + 12, y: y }, ease(p.s)); dotc(pos.x, pos.y, PAL[p.c], 1, 6.5); ctx.strokeStyle = th.bg; ctx.lineWidth = 1.5; ctx.beginPath(); ctx.arc(pos.x, pos.y, 6.5, 0, TWO_PI); ctx.stroke(); }
      });

      /* legend */
      var ly = 534; ring(30, ly, 1); label(40, ly, "carries thickness", { base: "middle", size: 9, color: th.text });
      dotc(150, ly, PAL[0]); dotc(160, ly, PAL[2]); label(170, ly, "carries material", { base: "middle", size: 9, color: th.text });
      diamond(282, ly, 5, th.text, true); label(292, ly, "predicted final thickness", { base: "middle", size: 9, color: th.text });
      ctx.strokeStyle = th.muted; ctx.setLineDash([2, 2]); ctx.beginPath(); ctx.moveTo(430, ly - 7); ctx.lineTo(430, ly + 7); ctx.stroke(); ctx.setLineDash([]); label(438, ly, "where the thickness started (noise)", { base: "middle", size: 9, color: th.text });
      lockIcon(630, ly + 1, 11, th.accent); label(642, ly, "pinned by you", { base: "middle", size: 9, color: th.text });
      dotc(740, ly, PAL[4], 1, 6); label(752, ly, "a layer draws its material", { base: "middle", size: 9, color: th.text });
      var dy2 = 560, rndD = mulberry32(5); label(30, dy2, "density = information:", { base: "middle", size: 9, weight: "600", color: th.text });
      for (var bin = 0; bin < 10; bin++) { var fx = bin / 9, cnt = 1 + Math.round(fx * fx * 9); for (var dd = 0; dd < cnt; dd++) dotc(156 + fx * 190 + (rndD() - 0.5) * 16, dy2 + (rndD() - 0.5) * 16 * (1 - 0.85 * fx), PAL[0], 0.85, 1.7); }
      label(152, dy2 + 12, "t = 1 · sparse, scattered", { size: 8 }); label(352, dy2 + 12, "t = 0 · dense, focused", { size: 8, align: "right" });
      var infoNow = 1 - tD; ctx.fillStyle = th.line; rr(390, dy2 - 3, 160, 6, 3); ctx.fill(); ctx.fillStyle = th.accent; rr(390, dy2 - 3, Math.max(4, 160 * infoNow), 6, 3); ctx.fill(); label(556, dy2, "information now", { base: "middle", size: 9, color: th.text });
      ctx.restore();
      var html = '<span class="if-small">' + (phase === "end" ? "all steps done" : "step " + (k + 1) + " of " + K) + "</span><br>" + NARR[phase];
      if (html !== lastNarr) { narr.innerHTML = html; lastNarr = html; }
    }
    function frame(ts) { if (lastTs == null) lastTs = ts; var dt = Math.min(0.05, (ts - lastTs) / 1000) * parseFloat(speed.value); lastTs = ts; if (playing && !frozen) update(dt); render(); if (visible && !frozen) requestAnimationFrame(frame); else lastTs = null; }
    function layout() {
      var w = Math.max(760, widthOf(scroller, JW)); scale = w / JW; ctx = setupCanvas(canvas, w, JH * scale); canvas.style.maxWidth = "none"; canvas.style.width = w + "px";
      reserveHeight(narr, Object.keys(NARR).map(function (ph) { return '<span class="if-small">step ' + K + " of " + K + "</span><br>" + NARR[ph]; })); reserveWidth(playBtn, ["Pause", "Play"]);
      if (x) render();
    }
    newRun(); layout();
    if ("ResizeObserver" in window) new ResizeObserver(layout).observe(scroller); if (document.fonts) document.fonts.ready.then(layout);
    live.push({ render: render });
    var hm = /^#joint=(\d+(?:\.\d+)?)(,pin)?$/.exec(location.hash || "");
    if (hm) { frozen = true; if (hm[2]) { pinM[2] = (ms[2] + 2) % C; pinM[3] = null; applyPins(); post[2] = onehot(pinM[2]); } var T = parseFloat(hm[1]); for (var z = 0; z < T * 60; z++) update(1 / 60); container.style.cssText = "position:fixed;top:0;left:0;right:0;z-index:99999;margin:0;border-radius:0"; layout(); render(); return; }
    if (reduceMotion) { playing = false; playBtn.textContent = "Play"; }
    if ("IntersectionObserver" in window) new IntersectionObserver(function (es) { es.forEach(function (en) { var was = visible; visible = en.isIntersecting; if (visible && !was) { lastTs = null; requestAnimationFrame(frame); } }); }, { threshold: 0.2 }).observe(container);
    else { visible = true; requestAnimationFrame(frame); }
  }

  /* ============================ ADVANTAGES MAP ============================ */
  /* Hub-and-spoke map of what IrisFlow gives a designer. Each circle holds a small live vignette in the
     colours-and-lengths language; particles stream from the hub along each spoke. Hover or click a circle
     for a short explanation with a link to the part of the page that shows it. Logical canvas 1000 x 620. */
  function initMap(container) {
    container.innerHTML = "";
    var MW = 1000, MH = 648, PAL = PIPE_COLORS, NR = 72, HUB = { x: 500, y: 300, r: 70 };
    var scroller = el("div", "if-pipe-scroll"), canvas = document.createElement("canvas"); scroller.appendChild(canvas); container.appendChild(scroller);
    var card = el("div", "if-map-card"); container.appendChild(card);
    var NODES = [
      { key: "open", top: true, x: 190, y: 150, col: PAL[5], why: "materials enter as curves", title: "Open-world materials", cap: "a new material is just its curve", text: "Materials are inputs, not a fixed vocabulary. Each candidate enters as its optical curve, so a film measured in your own chamber, or a material the model has never seen, can be used straight away without retraining.", href: "#if-inside", link: "Watch a new material join the data pipeline" },
      { key: "band", top: true, lu: 0.57, x: 810, y: 150, col: PAL[0], why: "wavelength grid is an input", title: "Any wavelength band", cap: "even beyond the training range", text: "The wavelength grid is part of the request. Design for a narrow sub-band, several separate bands, or bands that reach past the range the model was trained on, with the same model.", href: "#if-studio", link: "Extend the band in the studio" },
      { key: "ctrl", x: 865, y: 334, col: PAL[4], why: "an explicit per-layer state", title: "Controllable", cap: "pin what you know, generate the rest", text: "Fix any layer's material or thickness and IrisFlow completes the rest of the stack around it. The same model accepts any layer count, so the structure you already have becomes part of the request.", href: "#if-joint", link: "Pin a layer and watch the rest adapt" },
      { key: "variety", lu: 0.55, x: 300, y: 520, col: PAL[2], why: "fresh noise for every draw", title: "Variety", cap: "many valid designs for one target", text: "Inverse design has many answers. Every draw starts from different noise and lands on a different valid design, so you choose by what matters to you: best match, fewest materials, or the thinnest stack.", href: "#if-studio", link: "Generate and rank designs in the studio" },
      { key: "cont", x: 135, y: 400, col: PAL[1], why: "continuous flow for thickness", title: "Continuous thickness", cap: "no bins, lands exactly", text: "Thicknesses come from a continuous flow instead of a menu of bins, so a layer can land exactly where the spectrum needs it. Materials and thicknesses are generated together, each shaping the other.", href: "#if-joint", link: "See the two flows steer each other" },
      { key: "angle", lu: 0.55, x: 700, y: 520, col: "#e76f51", why: "angle enters via the curves", title: "Oblique incidence", cap: "any angle or polarization, no retraining", text: "Trained at normal incidence, designing at an angle. Incidence angle and polarization act on a coating only through its materials' effective optical constants, so IrisFlow re-expresses the candidate curves for the requested angle and designs as usual. Nothing is retrained.", href: "https://arxiv.org/abs/2607.08392", link: "Read how in the paper" }
    ];
    var ctx, scale = 1, th, T = 0, hover = -1, pinned = -1, autoI = 0, autoT = 0, frozen = false, visible = false, lastTs = null, shownCard = -2, curF = -1, fT = 0, prevF = -1;
    function spoke(i) { var n = NODES[i], dx = n.x - HUB.x, dy = n.y - HUB.y, d = Math.hypot(dx, dy), ux = dx / d, uy = dy / d, sg = i % 2 ? 1 : -1; var p0 = { x: HUB.x + ux * (HUB.r + 4), y: HUB.y + uy * (HUB.r + 4) }, p2 = { x: n.x - ux * (NR + 6), y: n.y - uy * (NR + 6) }; return { p0: p0, c: { x: (p0.x + p2.x) / 2 - uy * 26 * sg, y: (p0.y + p2.y) / 2 + ux * 26 * sg }, p2: p2 }; }
    function qpt(sp, u) { var v = 1 - u; return { x: v * v * sp.p0.x + 2 * v * u * sp.c.x + u * u * sp.p2.x, y: v * v * sp.p0.y + 2 * v * u * sp.c.y + u * u * sp.p2.y }; }
    function focusIdx() { return hover >= 0 ? hover : pinned >= 0 ? pinned : autoI; }
    function rr(x, y, w, h, r) { r = Math.max(0, Math.min(r, w / 2, h / 2)); ctx.beginPath(); ctx.moveTo(x + r, y); ctx.lineTo(x + w - r, y); ctx.quadraticCurveTo(x + w, y, x + w, y + r); ctx.lineTo(x + w, y + h - r); ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h); ctx.lineTo(x + r, y + h); ctx.quadraticCurveTo(x, y + h, x, y + h - r); ctx.lineTo(x, y + r); ctx.quadraticCurveTo(x, y, x + r, y); ctx.closePath(); }
    function label(x, y, text, o) { o = o || {}; ctx.fillStyle = o.color || th.muted; ctx.font = (o.weight || "") + " " + (o.size || 10) + "px system-ui, sans-serif"; ctx.textAlign = o.align || "left"; ctx.textBaseline = o.base || "top"; ctx.fillText(text, x, y); }
    function dot(x, y, r, col, a) { ctx.globalAlpha = a == null ? 1 : a; ctx.fillStyle = col; ctx.beginPath(); ctx.arc(x, y, r, 0, TWO_PI); ctx.fill(); ctx.globalAlpha = 1; }
    function lockIcon(cx, cy, sz, col) { ctx.strokeStyle = col; ctx.fillStyle = col; ctx.lineWidth = Math.max(1, sz * 0.16); ctx.beginPath(); ctx.arc(cx, cy - sz * 0.12, sz * 0.28, Math.PI, 0); ctx.stroke(); rr(cx - sz * 0.4, cy - sz * 0.12, sz * 0.8, sz * 0.55, 1.2); ctx.fill(); }
    function track(x, y, w, h) { ctx.fillStyle = th.line; rr(x, y - h / 2, w, h, h / 2); ctx.fill(); }

    /* ---- vignettes (local centre cx, cy) ---- */
    var V = {
      open: function (cx, cy, col) {
        var c = (T % 4.6) / 4.6, slide = ease(clamp(c / 0.28, 0, 1)), off = (1 - slide) * 110;
        for (var j = 0; j < 4; j++) { var tx = cx - 44 + j * 24, ty = cy + 14; if (j < 3) { ctx.fillStyle = PAL[j]; rr(tx, ty, 18, 18, 4); ctx.fill(); } else { var fillA = clamp((c - 0.62) / 0.12, 0, 1); ctx.strokeStyle = th.muted; ctx.setLineDash([3, 2]); ctx.lineWidth = 1; rr(tx + 0.5, ty + 0.5, 17, 17, 4); ctx.stroke(); ctx.setLineDash([]); ctx.globalAlpha = fillA; ctx.fillStyle = col; rr(tx, ty, 18, 18, 4); ctx.fill(); ctx.globalAlpha = 1; } }
        label(cx - 44, cy + 36, "material tokens", { size: 10 });
        var curveY = function (u) { return cy - 18 - 12 * Math.sin(TWO_PI * (0.9 * u + 0.1)); };
        ctx.globalAlpha = c < 0.66 ? 1 : clamp(1 - (c - 0.66) / 0.1, 0.25, 1); ctx.strokeStyle = col; ctx.lineWidth = 2.2; ctx.beginPath(); for (var q = 0; q <= 20; q++) { var u = q / 20, x = cx - 36 + 72 * u + off; if (q === 0) ctx.moveTo(x, curveY(u)); else ctx.lineTo(x, curveY(u)); } ctx.stroke(); ctx.globalAlpha = 1;
        if (c > 0.2) label(cx + 38 + off, cy - 44, "new", { size: 11, weight: "700", color: col, align: "right" });
        if (c > 0.3 && c < 0.66) { var pr = (c - 0.3) / 0.36; for (var d = 0; d < 9; d++) { var f = clamp(pr * 1.4 - d * 0.05, 0, 1), u2 = d / 8, sx = cx - 36 + 72 * u2, sy = curveY(u2), ex = cx - 44 + 3 * 24 + 9, ey = cy + 23; if (f > 0 && f < 1) dot(lerp(sx, ex, ease(f)), lerp(sy, ey, ease(f)), 2.2, col, 0.95); } }
      },
      band: function (cx, cy, col) {
        var x0 = cx - 54, x1 = cx + 54, bx = cx + 14, f = function (u) { return 0.5 + 0.28 * Math.sin(TWO_PI * (1.7 * u + 0.15)) + 0.1 * Math.sin(TWO_PI * 4.3 * u); }, Y = function (v) { return cy + 22 - v * 50; }, X = function (u) { return x0 + (x1 - x0) * u; };
        ctx.fillStyle = th.dark ? "rgba(255,255,255,0.06)" : "rgba(0,0,0,0.05)"; ctx.fillRect(bx, cy - 40, x1 + 10 - bx, 72);
        ctx.strokeStyle = th.muted; ctx.setLineDash([3, 3]); ctx.lineWidth = 1; ctx.beginPath(); ctx.moveTo(bx, cy - 40); ctx.lineTo(bx, cy + 30); ctx.stroke(); ctx.setLineDash([]);
        label(bx - 3, cy - 42, "trained", { size: 10, align: "right" }); label(bx + 3, cy - 42, "beyond", { size: 10 });
        var uc = 0.5 + 0.34 * Math.sin(T * 0.75), w = 0.3, ua = clamp(uc - w / 2, 0, 1), ub = clamp(uc + w / 2, 0, 1);
        ctx.fillStyle = col; ctx.globalAlpha = 0.16; ctx.fillRect(X(ua), cy - 34, X(ub) - X(ua), 58); ctx.globalAlpha = 1;
        ctx.strokeStyle = th.muted; ctx.globalAlpha = 0.5; ctx.lineWidth = 1.2; ctx.beginPath(); for (var q = 0; q <= 40; q++) { var u = q / 40; if (q === 0) ctx.moveTo(X(u), Y(f(u))); else ctx.lineTo(X(u), Y(f(u))); } ctx.stroke(); ctx.globalAlpha = 1;
        ctx.strokeStyle = col; ctx.lineWidth = 2.6; ctx.beginPath(); for (q = 0; q <= 20; q++) { var u3 = ua + (ub - ua) * q / 20; if (q === 0) ctx.moveTo(X(u3), Y(f(u3))); else ctx.lineTo(X(u3), Y(f(u3))); } ctx.stroke();
        ctx.strokeStyle = th.line; ctx.lineWidth = 1; ctx.beginPath(); ctx.moveTo(x0, cy + 30); ctx.lineTo(x1, cy + 30); ctx.stroke(); label(cx, cy + 34, "wavelength", { size: 10, align: "center" });
      },
      cont: function (cx, cy, col) {
        var x0 = cx - 44, w = 88, v = 0.52 + 0.3 * Math.sin(T * 1.25) + 0.08 * Math.sin(T * 3.1), nb = 5, bin = Math.round(v * nb) / nb;
        label(x0, cy - 36, "bins", { size: 10 }); track(x0, cy - 20, w, 6); for (var i = 0; i <= nb; i++) { ctx.strokeStyle = th.muted; ctx.lineWidth = 1; ctx.beginPath(); ctx.moveTo(x0 + w * i / nb, cy - 26); ctx.lineTo(x0 + w * i / nb, cy - 14); ctx.stroke(); }
        ctx.fillStyle = th.muted; rr(x0, cy - 23, w * bin, 6, 3); ctx.fill(); dot(x0 + w * bin, cy - 20, 4, th.muted);
        label(x0, cy + 2, "continuous", { size: 10, color: col, weight: "700" }); track(x0, cy + 20, w, 8); ctx.fillStyle = col; rr(x0, cy + 16, w * v, 8, 4); ctx.fill(); dot(x0 + w * v, cy + 20, 5, col); ctx.strokeStyle = th.bg; ctx.lineWidth = 1.5; ctx.beginPath(); ctx.arc(x0 + w * v, cy + 20, 5, 0, TWO_PI); ctx.stroke();
        var tx = x0 + w * v; ctx.fillStyle = th.text; ctx.beginPath(); ctx.moveTo(tx, cy - 6); ctx.lineTo(tx + 4, cy - 2); ctx.lineTo(tx, cy + 2); ctx.lineTo(tx - 4, cy - 2); ctx.closePath(); ctx.fill();
        ctx.strokeStyle = th.text; ctx.globalAlpha = 0.35; ctx.setLineDash([2, 2]); ctx.beginPath(); ctx.moveTo(tx, cy - 26); ctx.lineTo(tx, cy + 26); ctx.stroke(); ctx.setLineDash([]); ctx.globalAlpha = 1;
        label(cx, cy + 32, "◆ exact target", { size: 10, align: "center" });
      },
      variety: function (cx, cy, col) {
        var cyc = Math.floor(T / 4), c = (T % 4) / 4, tf = function (u) { return 0.2 + 0.6 * Math.exp(-Math.pow((u - 0.35) / 0.12, 2)) + 0.35 * Math.exp(-Math.pow((u - 0.72) / 0.1, 2)); };
        ctx.strokeStyle = SPEC_COL; ctx.lineWidth = 1.8; ctx.beginPath(); for (var q = 0; q <= 24; q++) { var u = q / 24, x = cx - 30 + 60 * u, y = cy - 30 - 16 * tf(u); if (q === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y); } ctx.stroke();
        label(cx, cy - 58, "one target", { size: 10, align: "center" });
        for (var j = 0; j < 3; j++) {
          var rnd = mulberry32(1000 + cyc * 7 + j * 131), gx = cx - 34 + j * 34, base = cy + 36, grow = ease(clamp((c - 0.08 - j * 0.14) / 0.25, 0, 1)), y2 = base, tot = 0, hs = [];
          for (var l = 0; l < 5; l++) { var h = 4 + 7 * rnd(); hs.push(h); tot += h; }
          ctx.strokeStyle = th.line; ctx.lineWidth = 1; ctx.beginPath(); ctx.moveTo(cx, cy - 12); ctx.lineTo(gx, base - tot * grow - 4); ctx.globalAlpha = 0.6 * grow; ctx.stroke(); ctx.globalAlpha = 1;
          for (l = 0; l < 5; l++) { var hh = hs[l] * grow; ctx.fillStyle = PAL[Math.floor(rnd() * 5)]; ctx.fillRect(gx - 9, y2 - hh, 18, Math.max(0, hh - 0.8)); y2 -= hh; }
          if (grow >= 1) { ctx.strokeStyle = col; ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(gx - 4, base + 6); ctx.lineTo(gx - 1, base + 9); ctx.lineTo(gx + 5, base + 3); ctx.stroke(); }
        }
      },
      angle: function (cx, cy, col) {
        var th0 = (30 + 27 * Math.sin(T * 0.7)) * Math.PI / 180, hy = cy + 16, L0 = 44;
        var layers = [PAL[0], PAL[2], PAL[1], PAL[4]]; for (var l = 0; l < 4; l++) { ctx.fillStyle = layers[l]; ctx.fillRect(cx - 46, hy + l * 5, 92, 4.2); }
        ctx.strokeStyle = th.muted; ctx.globalAlpha = 0.7; ctx.lineWidth = 1; ctx.setLineDash([3, 3]); ctx.beginPath(); ctx.moveTo(cx, hy); ctx.lineTo(cx, hy - 40); ctx.stroke(); ctx.setLineDash([]); ctx.globalAlpha = 1;
        var inX = cx - L0 * Math.sin(th0), inY = hy - L0 * Math.cos(th0), outX = cx + L0 * Math.sin(th0), outY = inY;
        var ray = function (x0, y0, x1, y1) { ctx.strokeStyle = col; ctx.fillStyle = col; ctx.lineWidth = 2.2; ctx.beginPath(); ctx.moveTo(x0, y0); ctx.lineTo(x1, y1); ctx.stroke(); var an = Math.atan2(y1 - y0, x1 - x0), mx = (x0 + x1) / 2, my = (y0 + y1) / 2; ctx.beginPath(); ctx.moveTo(mx + 5 * Math.cos(an), my + 5 * Math.sin(an)); ctx.lineTo(mx - 3 * Math.cos(an) - 4 * Math.sin(an), my - 3 * Math.sin(an) + 4 * Math.cos(an)); ctx.lineTo(mx - 3 * Math.cos(an) + 4 * Math.sin(an), my - 3 * Math.sin(an) - 4 * Math.cos(an)); ctx.closePath(); ctx.fill(); };
        ray(inX, inY, cx, hy); ray(cx, hy, outX, outY);
        ctx.strokeStyle = th.text; ctx.lineWidth = 1.2; ctx.beginPath(); ctx.arc(cx, hy, 15, -Math.PI / 2 - th0, -Math.PI / 2); ctx.stroke();
        label(cx - 15 * Math.sin(th0 / 2) - 7, hy - 15 * Math.cos(th0 / 2) - 12, "θ", { size: 11, weight: "700", color: th.text });
        var px0 = cx - 36, pw = 72, py0 = cy - 52, ph = 22, shift = 0.28 * (1 - Math.cos(th0)) / (1 - Math.cos(57 * Math.PI / 180));
        var spec = function (u, sft) { return Math.exp(-Math.pow((u - 0.62 + sft) / 0.12, 2)); };
        ctx.strokeStyle = th.muted; ctx.globalAlpha = 0.55; ctx.lineWidth = 1; ctx.setLineDash([2, 2]); ctx.beginPath(); for (var q = 0; q <= 30; q++) { var u = q / 30; if (q === 0) ctx.moveTo(px0 + pw * u, py0 + ph - ph * spec(u, 0)); else ctx.lineTo(px0 + pw * u, py0 + ph - ph * spec(u, 0)); } ctx.stroke(); ctx.setLineDash([]); ctx.globalAlpha = 1;
        ctx.strokeStyle = col; ctx.lineWidth = 2; ctx.beginPath(); for (q = 0; q <= 30; q++) { var u2 = q / 30; if (q === 0) ctx.moveTo(px0 + pw * u2, py0 + ph - ph * spec(u2, shift)); else ctx.lineTo(px0 + pw * u2, py0 + ph - ph * spec(u2, shift)); } ctx.stroke();
        label(cx + 40, hy + 25, "s · p", { size: 10, align: "right", color: th.muted });
      },
      ctrl: function (cx, cy, col) {
        var locked = [false, true, false, true, false], x0 = cx - 34, w = 76;
        for (var l = 0; l < 5; l++) {
          var y = cy + 28 - l * 14, lk = locked[l], ci = lk ? (l === 1 ? 0 : 2) : Math.floor(T * 0.9 + l * 1.7) % 5, v = lk ? (l === 1 ? 0.7 : 0.45) : 0.5 + 0.35 * Math.sin(T * 1.4 + l * 2.1);
          track(x0, y, w, 8); ctx.fillStyle = PAL[ci]; rr(x0, y - 4, w * v, 8, 3); ctx.fill();
          if (lk) { lockIcon(x0 - 12, y + 1, 10, col); ctx.strokeStyle = col; ctx.lineWidth = 1.4; rr(x0 - 2, y - 6, w * v + 4, 12, 4); ctx.stroke(); }
        }
        label(cx, cy - 46, "locked stay", { size: 10, align: "center" });
      }
    };

    /* ---- render ---- */
    function render() {
      if (!ctx) return; th = theme(container);
      ctx.save(); ctx.setTransform(scale * (window.devicePixelRatio || 1), 0, 0, scale * (window.devicePixelRatio || 1), 0, 0); ctx.clearRect(0, 0, MW, MH);
      trackFocus(); var fi = focusIdx();
      var drawP = ease(clamp((T - fT) / 0.8, 0, 1)), fadeOld = 1 - clamp((T - fT) / 0.5, 0, 1), bloom = clamp((T - fT - 0.8) / 1.0, 0, 1);
      NODES.forEach(function (n, i) {
        var sp = spoke(i);
        ctx.strokeStyle = th.line; ctx.lineWidth = 1.6; ctx.globalAlpha = 0.9; ctx.beginPath(); ctx.moveTo(sp.p0.x, sp.p0.y); ctx.quadraticCurveTo(sp.c.x, sp.c.y, sp.p2.x, sp.p2.y); ctx.stroke(); ctx.globalAlpha = 1;
        var prog = i === fi ? drawP : i === prevF ? fadeOld : 0;
        if (prog > 0) {
          var alphaS = i === fi ? 1 : fadeOld, pts = 40;
          ctx.strokeStyle = n.col; ctx.lineCap = "round";
          ctx.beginPath(); for (var k2 = 0; k2 <= pts; k2++) { var q2 = qpt(sp, (i === fi ? prog : 1) * k2 / pts); if (k2 === 0) ctx.moveTo(q2.x, q2.y); else ctx.lineTo(q2.x, q2.y); }
          ctx.globalAlpha = 0.22 * alphaS; ctx.lineWidth = 10; ctx.stroke();
          ctx.globalAlpha = alphaS; ctx.lineWidth = 3.2; ctx.stroke(); ctx.globalAlpha = 1; ctx.lineCap = "butt";
          if (i === fi && prog < 1) { var tip = qpt(sp, prog); dot(tip.x, tip.y, 5, n.col, 1); }
        }
      });
      NODES.forEach(function (n, i) {
        var sp = spoke(i), mpt = qpt(sp, n.lu || 0.5), on = i === fi, litL = on ? clamp((drawP - 0.45) / 0.3, 0, 1) : 0;
        ctx.font = "600 12px system-ui, sans-serif"; var tw = ctx.measureText(n.why).width + 20, bh = 24, bx = mpt.x - tw / 2, by = mpt.y - bh / 2;
        ctx.globalAlpha = 1; ctx.fillStyle = th.dark ? "#1f1f22" : "#ffffff"; rr(bx, by, tw, bh, 12); ctx.fill();
        ctx.strokeStyle = th.line; ctx.lineWidth = 1; rr(bx, by, tw, bh, 12); ctx.stroke();
        if (litL > 0) { ctx.globalAlpha = litL; ctx.fillStyle = n.col; rr(bx, by, tw, bh, 12); ctx.fill(); ctx.globalAlpha = 1; }
        label(mpt.x, mpt.y + 0.5, n.why, { align: "center", base: "middle", size: 12, weight: "600", color: litL > 0.5 ? "#fff" : th.muted });
      });
      /* hub */
      var pulse = 0.5 + 0.5 * Math.sin(T * 1.1);
      ctx.strokeStyle = th.accent; ctx.globalAlpha = 0.18 + 0.2 * pulse; ctx.lineWidth = 2; ctx.beginPath(); ctx.arc(HUB.x, HUB.y, HUB.r + 8 + 5 * pulse, 0, TWO_PI); ctx.stroke(); ctx.globalAlpha = 1;
      ctx.fillStyle = th.dark ? "#25252a" : "#ffffff"; ctx.strokeStyle = th.accent; ctx.lineWidth = 2.5; ctx.beginPath(); ctx.arc(HUB.x, HUB.y, HUB.r, 0, TWO_PI); ctx.fill(); ctx.stroke();
      for (var l = 0; l < 4; l++) { ctx.fillStyle = PAL[(l * 2) % 5]; ctx.globalAlpha = 0.9; rr(HUB.x - 26, HUB.y + 14 + l * 6 - 0, 20 + 32 * (0.5 + 0.4 * Math.sin(T * 0.8 + l * 1.9)), 4, 2); ctx.fill(); }
      ctx.globalAlpha = 1;
      label(HUB.x, HUB.y - 8, "IrisFlow", { align: "center", base: "middle", size: 25, weight: "700", color: th.text });
      /* nodes */
      NODES.forEach(function (n, i) {
        var on = i === fi, dimA = on || fi < 0 ? 1 : 0.62;
        ctx.globalAlpha = dimA; ctx.fillStyle = th.dark ? "#1f1f22" : "#ffffff"; var ringOn = on && drawP > 0.95; ctx.strokeStyle = ringOn ? n.col : th.line; ctx.lineWidth = ringOn ? 3 : 1.5; ctx.beginPath(); ctx.arc(n.x, n.y, NR, 0, TWO_PI); ctx.fill(); ctx.stroke();
        if (on && bloom > 0 && bloom < 1) { ctx.globalAlpha = 0.45 * (1 - bloom); ctx.strokeStyle = n.col; ctx.lineWidth = 4; ctx.beginPath(); ctx.arc(n.x, n.y, NR + 4 + 22 * ease(bloom), 0, TWO_PI); ctx.stroke(); }
        if (on) { ctx.globalAlpha = 0.18 * clamp(drawP * 2 - 1, 0, 1); ctx.strokeStyle = n.col; ctx.lineWidth = 6; ctx.beginPath(); ctx.arc(n.x, n.y, NR + 5, 0, TWO_PI); ctx.stroke(); }
        ctx.globalAlpha = dimA; ctx.save(); ctx.beginPath(); ctx.arc(n.x, n.y, NR - 3, 0, TWO_PI); ctx.clip(); V[n.key](n.x, n.y, n.col); ctx.restore();
        ctx.globalAlpha = dimA; var tY = n.top ? n.y - NR - 50 : n.y + NR + 10; label(n.x, tY, n.title, { align: "center", size: 18, weight: "700", color: th.text });
        label(n.x, tY + 23, n.cap, { align: "center", size: 13, color: on ? n.col : th.muted });
        ctx.globalAlpha = 1;
      });
      ctx.restore();
      if (shownCard !== fi) { shownCard = fi; card.innerHTML = cardHTML(NODES[fi]); }
    }
    function trackFocus() { var fi = focusIdx(); if (fi !== curF) { prevF = curF; curF = fi; fT = T; } }
    function update(dt) {
      T += dt;
      if (hover < 0 && pinned < 0) { autoT += dt; if (autoT > 5.5) { autoT = 0; autoI = (autoI + 1) % NODES.length; } }
      trackFocus();
    }
    function toLogical(ev) { var r = canvas.getBoundingClientRect(); return { x: (ev.clientX - r.left) * MW / r.width, y: (ev.clientY - r.top) * MH / r.height }; }
    function hitNode(q) { for (var i = 0; i < NODES.length; i++) if (Math.hypot(q.x - NODES[i].x, q.y - NODES[i].y) <= NR + 8 || (Math.abs(q.x - NODES[i].x) < 110 && (NODES[i].top ? (q.y < NODES[i].y - NR && q.y > NODES[i].y - NR - 54) : (q.y > NODES[i].y + NR && q.y < NODES[i].y + NR + 48)))) return i; return -1; }
    canvas.addEventListener("pointermove", function (ev) { var h = hitNode(toLogical(ev)); hover = h; canvas.style.cursor = h >= 0 ? "pointer" : "default"; if (!visible || frozen) render(); });
    canvas.addEventListener("pointerleave", function () { hover = -1; autoT = 0; });
    canvas.addEventListener("click", function (ev) { var h = hitNode(toLogical(ev)); pinned = h >= 0 && pinned !== h ? h : -1; if (h >= 0) autoI = h; autoT = 0; render(); });
    function frame(ts) { if (lastTs == null) lastTs = ts; var dt = Math.min(0.05, (ts - lastTs) / 1000); lastTs = ts; if (!frozen && !reduceMotion) update(dt); render(); if (visible && !frozen) requestAnimationFrame(frame); else lastTs = null; }
    function cardHTML(n) { return '<span class="if-map-sw" style="background:' + n.col + '"></span><div><b>' + esc(n.title) + '.</b> ' + esc(n.text) + ' <a href="' + n.href + '">' + esc(n.link) + ' →</a></div>'; }
    function layout() { var w = Math.max(760, widthOf(scroller, MW)); scale = w / MW; ctx = setupCanvas(canvas, w, MH * scale); canvas.style.maxWidth = "none"; canvas.style.width = w + "px"; reserveHeight(card, NODES.map(cardHTML)); render(); }
    layout(); if ("ResizeObserver" in window) new ResizeObserver(layout).observe(scroller); if (document.fonts) document.fonts.ready.then(layout);
    live.push({ render: render });
    var hm = /^#map=(\d+(?:\.\d+)?)(?:,(\d))?$/.exec(location.hash || "");
    if (hm) { frozen = true; var TT = parseFloat(hm[1]); if (hm[2]) pinned = autoI = parseInt(hm[2], 10); T = 0; trackFocus(); T = TT; container.style.cssText = "position:fixed;top:0;left:0;right:0;z-index:99999;margin:0;border-radius:0"; layout(); render(); return; }
    if ("IntersectionObserver" in window) new IntersectionObserver(function (es) { es.forEach(function (en) { var was = visible; visible = en.isIntersecting; if (visible && !was) { lastTs = null; requestAnimationFrame(frame); } }); }, { threshold: 0.15 }).observe(container);
    else { visible = true; requestAnimationFrame(frame); }
  }

  /* ============================ BOOT ============================ */
  function boot() {
    document.querySelectorAll("[data-if-map]").forEach(initMap);
    document.querySelectorAll('[data-if-idea="joint"]').forEach(initJoint);
    document.querySelectorAll("[data-if-pipeline]").forEach(initPipeline);
    document.querySelectorAll("[data-if-studio]").forEach(initStudio);
    if ("MutationObserver" in window) new MutationObserver(function () { live.forEach(function (c) { if (c.render) c.render(); }); }).observe(document.documentElement, { attributes: true, attributeFilter: ["data-theme"] });
  }
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", boot); else boot();
})();
