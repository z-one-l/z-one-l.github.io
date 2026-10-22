/* IrisFlow story for z-one-l.github.io: why IrisFlow exists, told in five scripted chapters on one canvas.
   1 coatings and their spectra, 2 the inverse problem, 3 classical optimisers, 4 closed-world neural models,
   5 IrisFlow's answer: the design space is the input. Same picture language as irisflow.js (a colour is a
   material, a length is a thickness, curves are illustrative; only the small transfer-matrix spectra are
   computed). Every frame is a pure function of the story time, so chapters can be jumped to and frames
   captured for the video (#why=<t>[,en|,zh][,video] freezes the panel at time t). Text in English and Chinese.
   Opt in with data-if-story; data-if-story="sketch" (or ?story=sketch, or ",sketch" in the hook) draws the same
   scenes as ink on paper. Logical canvas 1000 x 560. */
(function () {
  "use strict";
  if (typeof document === "undefined") return;
  var TWO_PI = 2 * Math.PI, W = 1000, H = 560, FONT = 'system-ui, -apple-system, "PingFang SC", "Hiragino Sans GB", "Microsoft YaHei", sans-serif';
  var PAL = ["#3b82d6", "#1d9e75", "#d39a1e", "#7c8795", "#7f66d6", "#d4539e"], LET = ["A", "B", "C", "D", "E", "F"], SPEC = "#e04b3c";
  var NIDX = [1.46, 2.3, 1.7, 2.05, 1.38, 2.55], NSUB = 1.52, BANK = [0, 1, 2, 5];

  /* ============================ text ============================ */
  var TXT = {
    en: {
      play: "Play", pause: "Pause", replay: "Replay",
      short: ["Coatings", "The inverse problem", "Optimisers", "A closed world", "IrisFlow"],
      titles: ["Coatings are everywhere", "Forward is easy, inverse is hard", "Classical optimisers start from scratch", "Neural networks learn, but in a closed world", "IrisFlow: the design space is the input"],
      narr: [
        ["Multilayer optical coatings sit in camera lenses, displays, solar cells, lasers and windows.",
          "Each coating is a stack of thin layers. Here a colour is a material and a length is a thickness.",
          "Together they decide how much of each wavelength is reflected (R) or transmitted (T). Change one thickness and the whole spectrum moves."],
        ["The forward problem is solved: given a stack, the transfer-matrix method (TMM) computes its spectrum exactly, in an instant.",
          "Design is the inverse: start from the spectrum you need. Each layer mixes a discrete choice of material with a continuous thickness, and the layer count is open too.",
          "And the answer is not unique: very different stacks give almost the same spectrum, so good designs lie scattered across a rugged search space."],
        ["Classical optimisers, from the needle method to genetic algorithms and particle swarms, call the simulator directly, so their designs obey the physics.",
          "But nothing carries over: every new target is a fresh run that pays for many simulations again.",
          "Local searches stall in nearby minima, and the result depends on the seed, the budget and the operator."],
        ["Neural inverse design learns the map from spectra to stacks once, then answers each new target in a single pass.",
          "But current models fix their world at training time: materials are vocabulary tokens, the wavelength grid is frozen, and thicknesses come in bins. Anything new means retraining.",
          "That is the gap in a real lab: a film’s n,k depends on the chamber that grows it. A model that knows materials only by name cannot use your measured curve."],
        ["IrisFlow takes the design space as input: the target spectrum, the wavelengths you care about, each candidate material as its n,k curve, and the layer count.",
          "From noise, a discrete flow picks the materials while a continuous flow sets exact thicknesses, both steered by one network under one clock.",
          "Out comes a pool of diverse designs, each re-simulated exactly. Pick one and take it to the chamber; new materials and new bands need no retraining.",
          null]
      ],
      end: { web: "Try the real model just below, or read the paper.", video: "Paper: arxiv.org/abs/2607.08392 · Try it: z-one-l.github.io/irisflow" },
      apps: ["camera lenses", "displays", "solar cells", "lasers", "windows"],
      air: "air", substrate: "substrate", colour: "a colour is a material", length: "a length is a thickness", spectrum: "spectrum", wavelength: "wavelength →", peak: "peak",
      forward: "FORWARD", inverse: "INVERSE", tmmSub: "transfer matrix", exact: "exact", instant: "instant", oneAnswer: "one answer",
      need: "the spectrum you need", everyLayer: "every layer: one material + one thickness", mix: "discrete × continuous × open length", many: "different stacks, almost the same spectrum",
      optimiser: "optimiser", simulator: "TMM simulator", eachDot: "each dot is one simulation", simsRun: "simulations, this run", scratch: "from scratch", designSpace: "design space →", mismatch: "↑ mismatch", pop: "population search", local: "local search", stuck: "stuck", seed: "seed", target: "target",
      train: "training set", network: "network", trained: "trained once", oneP: "new target → design, in one pass",
      cardA: "Materials: a fixed vocabulary", vocab: "vocabulary", newMat: "new material", onlyName: "the model only knows the name “B”", handbook: "handbook n,k", measured: "your chamber’s n,k", chipA: "new material → retrain",
      cardB: "Wavelengths: a frozen grid", grid: "trained grid", beyond: "beyond", yourBand: "your band", chipB: "new band → retrain",
      cardC: "Thickness: cut into bins", bins: "bins", needed: "what the spectrum needs", miss: "miss", chipC: "lands beside the optimum",
      inT: "target R, T", inW: "your wavelengths", inM: "materials as n,k curves", inN: "layer count", trainedW: "trained", yours: "yours", nLayers: "N layers, your choice",
      oneNet: "one network · one clock", discrete: "discrete flow", continuous: "continuous flow", mats: "materials", thick: "thicknesses", clock: "shared clock", noise: "t = 1 · noise", design: "t = 0 · design",
      pool: "diverse designs", verified: "each one re-simulated", chamber: "deposition chamber",
      chips: ["materials as curves", "any wavelength band", "continuous thickness", "no retraining"]
    },
    zh: {
      play: "播放", pause: "暂停", replay: "重播",
      short: ["光学薄膜", "逆问题", "传统优化", "封闭世界", "IrisFlow"],
      titles: ["无处不在的光学薄膜", "正问题简单，逆问题困难", "传统优化：每次都从零开始", "神经网络学会了设计，却困在封闭世界", "IrisFlow：把设计空间当作输入"],
      narr: [
        ["多层光学薄膜无处不在：相机镜头、显示屏、太阳能电池、激光器、节能窗……",
          "每个膜系都是一叠薄层。这里用颜色表示材料，用长度表示厚度。",
          "材料和厚度一起决定每个波长有多少被反射（R）、多少被透射（T）。改动一层的厚度，整条光谱都会跟着变。"],
        ["正问题早已解决：给定膜系，传输矩阵法（TMM）可以瞬间精确地算出它的光谱。",
          "设计却是逆问题：从需要的光谱出发去找膜系。每一层既要在离散的材料中选一种，又要定一个连续的厚度，连层数也不固定。",
          "而且答案不唯一：截然不同的膜系能给出几乎相同的光谱，好的设计零散地分布在崎岖的搜索空间里。"],
        ["传统优化方法（针法、梯度优化、遗传算法、粒子群……）直接调用仿真器进行搜索，因此设计天然符合物理。",
          "但经验无法复用：每来一个新目标，都要从零开始，重新付出大量仿真。",
          "局部搜索容易困在附近的极小值，结果还取决于随机种子、计算预算和操作者的经验。"],
        ["神经网络逆设计把“光谱 → 膜系”的映射一次学会，之后每个新目标只需一次推理。",
          "但现有模型在训练时就把世界定死了：材料是固定词表里的 token，波长网格被冻结，厚度被切成格子。遇到新情况，只能重新训练。",
          "这正是实验室里的痛点：薄膜的 n,k 取决于沉积它的镀膜机，你实测的曲线和手册上的并不相同；只认材料名字的模型用不上它。"],
        ["IrisFlow 把设计空间当作输入：目标光谱、你关心的波段、每种候选材料的 n,k 曲线，以及层数。",
          "从噪声出发，离散流挑选材料，连续流给出精确的厚度，二者由同一个网络在同一个时钟下共同引导。",
          "它输出一批各不相同的设计，每个都经过精确的重新仿真。挑一个送进镀膜机；换材料、换波段都无需重新训练。",
          null]
      ],
      end: { web: "真实模型就在下方，可以直接试用；也可以阅读论文。", video: "论文：arxiv.org/abs/2607.08392 · 在线试用：z-one-l.github.io/irisflow" },
      apps: ["相机镜头", "显示屏", "太阳能电池", "激光器", "节能窗"],
      air: "空气", substrate: "基底", colour: "颜色 = 材料", length: "长度 = 厚度", spectrum: "光谱", wavelength: "波长 →", peak: "透射峰",
      forward: "正问题", inverse: "逆问题", tmmSub: "传输矩阵法", exact: "精确", instant: "瞬间", oneAnswer: "唯一答案",
      need: "你需要的光谱", everyLayer: "每层：一种材料 + 一个厚度", mix: "离散 × 连续 × 层数可变", many: "不同的膜系，几乎相同的光谱",
      optimiser: "优化器", simulator: "TMM 仿真", eachDot: "每个点是一次仿真", simsRun: "本次仿真量", scratch: "从零开始", designSpace: "设计空间 →", mismatch: "↑ 偏差", pop: "群体搜索", local: "局部搜索", stuck: "卡住", seed: "种子", target: "目标",
      train: "训练集", network: "神经网络", trained: "一次训练", oneP: "新目标 → 设计，一次推理",
      cardA: "材料：固定词表", vocab: "词表", newMat: "新材料", onlyName: "模型只认得名字 “B”", handbook: "手册 n,k", measured: "你的镀膜机实测 n,k", chipA: "新材料 → 重新训练",
      cardB: "波长：冻结的网格", grid: "训练网格", beyond: "范围外", yourBand: "你的波段", chipB: "新波段 → 重新训练",
      cardC: "厚度：切成格子", bins: "离散格子", needed: "光谱真正需要的厚度", miss: "偏差", chipC: "落不到最优值上",
      inT: "目标 R、T", inW: "你的波段", inM: "材料 = n,k 曲线", inN: "层数", trainedW: "训练范围", yours: "你的", nLayers: "N 层，由你决定",
      oneNet: "一个网络 · 一个时钟", discrete: "离散流", continuous: "连续流", mats: "材料", thick: "厚度", clock: "共享时钟", noise: "t = 1 · 噪声", design: "t = 0 · 设计",
      pool: "多样的设计", verified: "逐个精确仿真复核", chamber: "镀膜机",
      chips: ["材料即曲线", "任意波段", "连续厚度", "无需重训"]
    }
  };
  /* beat lengths in seconds, per chapter */
  var CH = [[5, 6, 7.5], [6.5, 8, 7], [7, 5.5, 6], [6, 8, 8.5], [8, 7, 8, 4]];
  var CS = [], TOTAL = 0;
  CH.forEach(function (b) { var s = 0, st = []; b.forEach(function (d) { st.push(s); s += d; }); CS.push({ t0: TOTAL, dur: s, beats: st }); TOTAL += s; });
  function locate(T) {
    for (var i = 0; i < CS.length; i++) if (T < CS[i].t0 + CS[i].dur || i === CS.length - 1) {
      var u = clamp(T - CS[i].t0, 0, CS[i].dur), b = 0;
      for (var k = 0; k < CS[i].beats.length; k++) if (u >= CS[i].beats[k]) b = k;
      return { i: i, u: u, b: b };
    }
  }

  /* ============================ utilities ============================ */
  function clamp(x, a, b) { return x < a ? a : x > b ? b : x; }
  function lerp(a, b, f) { return a + (b - a) * f; }
  function ease(p) { p = clamp(p, 0, 1); return p < 0.5 ? 2 * p * p : 1 - Math.pow(-2 * p + 2, 2) / 2; }
  function ap(u, t0, d) { return ease((u - t0) / (d || 0.6)); }
  function rn(a, b, c) {
    var h = Math.imul((a | 0) ^ 0x9e3779b9, 0x85ebca6b) ^ Math.imul((b | 0) + 0x632be5ab, 0xc2b2ae35) ^ Math.imul((c | 0) + 0x165667b1, 0x27d4eb2f);
    h ^= h >>> 15; h = Math.imul(h, 0x2c1b3c6d); h ^= h >>> 12; h = Math.imul(h, 0x297a2d39); h ^= h >>> 15; return (h >>> 0) / 4294967296;
  }
  function el(tag, cls, html) { var e = document.createElement(tag); if (cls) e.className = cls; if (html != null) e.innerHTML = html; return e; }
  function esc(s) { return String(s).replace(/[&<>"]/g, function (c) { return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]; }); }
  function widthOf(elm, fb) { return Math.max(120, Math.floor(elm.getBoundingClientRect().width) || fb); }
  function theme(elm) {
    var cs = getComputedStyle(elm);
    function v(name, fb) { var x = cs.getPropertyValue(name).trim(); return x || fb; }
    var dark = document.documentElement.getAttribute("data-theme") === "dark";
    return { text: v("--if-text", dark ? "#e4e4e4" : "#111"), muted: v("--if-muted", "#888"), bg: v("--if-bg", dark ? "#1c1c1d" : "#fff"), line: v("--if-line", dark ? "#3a3a3a" : "#e6e6e6"), accent: v("--if-accent", "#b509ac"), R: v("--if-r", "#d64545"), T: v("--if-t", "#2f6fd6"), dark: dark };
  }
  function setupCanvas(canvas, cssW, cssH) {
    var dpr = window.devicePixelRatio || 1;
    canvas.width = Math.round(cssW * dpr); canvas.height = Math.round(cssH * dpr);
    canvas.style.width = cssW + "px"; canvas.style.height = cssH + "px";
    var ctx = canvas.getContext("2d"); ctx.setTransform(dpr, 0, 0, dpr, 0, 0); return ctx;
  }
  /* Text that changes while the story plays must not resize the panel: reserve the largest box among all contents. */
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

  /* ============================ hand-drawn skin ============================ */
  /* sketchCtx wraps a 2D context. Paths are recorded as point lists and every point is moved by a smooth noise
     field of its position, so a shape keeps its wobble from frame to frame and layers that share an edge move
     together. Strokes are filled as brush outlines whose width varies and whose ends taper; a closed path is one
     pen stroke that starts at its upper left and overshoots. `exact` keeps a centreline in place (the computed
     spectra), `plain` passes paths through untouched (values and scales that are read: bars, sliders, ticks, bins),
     `rev` draws only the first part of each stroke (things are drawn on instead of faded in), and `boil` steps a
     small extra wobble six times a second, as hand-drawn animation does. */
  var PAL_SK = ["#3d71b3", "#2b8862", "#cc8c1c", "#7b8086", "#735db0", "#c44f7e"], SPEC_SK = "#c4462f";
  var SERIF = '"Source Serif 4", "Songti SC", "Noto Serif CJK SC", "Source Han Serif SC", "PingFang SC", "Microsoft YaHei", serif';
  /* smooth value noise in [-1, 1]; with P it repeats every P cells */
  function vnoise(x, y, s, P) {
    var xi = Math.floor(x), yi = Math.floor(y), u = x - xi, v = y - yi, x1 = xi + 1, y1 = yi + 1;
    if (P) { xi = ((xi % P) + P) % P; yi = ((yi % P) + P) % P; x1 = (xi + 1) % P; y1 = (yi + 1) % P; }
    u = u * u * (3 - 2 * u); v = v * v * (3 - 2 * v);
    var a = rn(xi, yi, s), b = rn(x1, yi, s), c = rn(xi, y1, s), d = rn(x1, y1, s);
    return 2 * (a + (b - a) * u + (c - a) * v + (a - b - c + d) * u * v) - 1;
  }
  function seg(p, q) { return Math.hypot(q[0] - p[0], q[1] - p[1]); }
  function sketchCtx(g) {
    var w = { raw: g, exact: false, plain: false, rev: 1, boil: 0, paper: null, paperPat: null, inkPat: null }, subs = [], cur = null, dash = [];
    ["globalAlpha", "fillStyle", "strokeStyle", "lineWidth", "lineCap", "lineJoin", "font", "textAlign", "textBaseline", "globalCompositeOperation"].forEach(function (k) {
      Object.defineProperty(w, k, { get: function () { return g[k]; }, set: function (v) { g[k] = v; } });
    });
    ["fillText", "measureText", "clearRect", "setTransform"].forEach(function (k) { w[k] = function () { return g[k].apply(g, arguments); }; });
    w.setLineDash = function (d) { dash = d || []; };
    w.beginPath = function () { subs = []; cur = null; };
    w.moveTo = function (x, y) { cur = { p: [[x, y]], closed: false }; subs.push(cur); };
    w.lineTo = function (x, y) { if (cur) cur.p.push([x, y]); else w.moveTo(x, y); };
    w.quadraticCurveTo = function (cx, cy, x, y) {
      if (!cur) w.moveTo(cx, cy);
      var p0 = cur.p[cur.p.length - 1], n = Math.max(2, Math.ceil((seg(p0, [cx, cy]) + seg([cx, cy], [x, y])) / 5));
      for (var i = 1; i <= n; i++) { var s = i / n, t = 1 - s; cur.p.push([t * t * p0[0] + 2 * t * s * cx + s * s * x, t * t * p0[1] + 2 * t * s * cy + s * s * y]); }
    };
    w.arc = function (cx, cy, r, a0, a1) {
      while (a1 < a0) a1 += TWO_PI;
      var full = a1 - a0 >= TWO_PI - 1e-6, n = Math.max(10, Math.ceil((a1 - a0) * r / 4)), pts = [];
      for (var i = 0; i < (full ? n : n + 1); i++) { var a = a0 + (a1 - a0) * i / n; pts.push([cx + r * Math.cos(a), cy + r * Math.sin(a)]); }
      if (full) { subs.push({ p: pts, closed: true }); cur = null; } else if (cur) cur.p = cur.p.concat(pts); else { cur = { p: pts, closed: false }; subs.push(cur); }
    };
    w.closePath = function () { if (cur) cur.closed = true; cur = null; };
    /* in plain mode the path is also built on the real context as it is drawn */
    ["beginPath", "moveTo", "lineTo", "quadraticCurveTo", "arc", "closePath"].forEach(function (k) { var rec = w[k]; w[k] = function () { if (w.plain) g[k].apply(g, arguments); rec.apply(w, arguments); }; });
    /* fills sit up to a pixel off their outlines, like colour laid in after the ink */
    function disp(q, fill) {
      if (w.exact) return q;
      var x = q[0], y = q[1], k = 40 + 2 * w.boil, dx = 1.5 * vnoise(x / 70, y / 70, 0) + 0.45 * vnoise(x / 15, y / 15, 1) + 0.4 * vnoise(x / 28, y / 28, k), dy = 1.5 * vnoise(x / 70, y / 70, 2) + 0.45 * vnoise(x / 15, y / 15, 3) + 0.4 * vnoise(x / 28, y / 28, k + 1);
      if (fill) { dx += 0.9 * vnoise(x / 40, y / 40, 20); dy += 0.9 * vnoise(x / 40, y / 40, 21); }
      return [x + dx, y + dy];
    }
    function resample(p, closed, step) {
      var out = [], n = p.length, m = closed ? n : n - 1;
      for (var i = 0; i < m; i++) {
        var a = p[i], b = p[(i + 1) % n], k = Math.max(1, Math.ceil(seg(a, b) / step));
        for (var j = 0; j < k; j++) out.push([a[0] + (b[0] - a[0]) * j / k, a[1] + (b[1] - a[1]) * j / k]);
      }
      if (!closed) out.push(p[n - 1]);
      out = out.filter(function (q, i) { return !i || seg(q, out[i - 1]) > 1e-3; });
      if (closed && out.length > 2 && seg(out[0], out[out.length - 1]) < 1e-3) out.pop();
      return out;
    }
    function trim(pts, f) {
      var tot = 0, i; for (i = 1; i < pts.length; i++) tot += seg(pts[i - 1], pts[i]);
      var goal = f * tot, acc = 0, out = [pts[0]];
      for (i = 1; i < pts.length; i++) {
        var d = seg(pts[i - 1], pts[i]);
        if (acc + d >= goal) { var t = d ? (goal - acc) / d : 0; out.push([lerp(pts[i - 1][0], pts[i][0], t), lerp(pts[i - 1][1], pts[i][1], t)]); return out; }
        acc += d; out.push(pts[i]);
      }
      return out;
    }
    function dashes(pts, d) {
      var out = [], on = true, di = 0, left = d[0], piece = [pts[0]];
      for (var i = 1; i < pts.length; i++) {
        var a = pts[i - 1], b = pts[i], L = seg(a, b), pos = 0;
        while (L - pos > left) {
          pos += left; var q = [lerp(a[0], b[0], pos / L), lerp(a[1], b[1], pos / L)];
          if (on) { piece.push(q); out.push(piece); }
          piece = [q]; on = !on; di = (di + 1) % d.length; left = d[di];
        }
        left -= L - pos; if (on) piece.push(b);
      }
      if (on && piece.length > 1) out.push(piece);
      return out;
    }
    /* one brush mark along a polyline: a filled outline, width varying along the stroke, both ends tapered */
    function brush(pts, flat) {
      var n = pts.length, lw = g.lineWidth, cum = [0], i;
      for (i = 1; i < n; i++) cum.push(cum[i - 1] + seg(pts[i - 1], pts[i]));
      var len = cum[n - 1]; if (n < 2 || len < 0.05) return;
      var tl = Math.min(7, 0.35 * len), Lf = [], Rt = [];
      for (i = 0; i < n; i++) {
        var a = pts[i ? i - 1 : 0], b = pts[i < n - 1 ? i + 1 : n - 1], tn = seg(a, b) || 1, nx = (a[1] - b[1]) / tn, ny = (b[0] - a[0]) / tn, m = 1;
        if (i && i < n - 1) { var sn = seg(a, pts[i]) || 1; m = Math.min(2, 1 / Math.max(0.5, Math.abs((nx * (a[1] - pts[i][1]) + ny * (pts[i][0] - a[0])) / sn))); }
        var taper = flat ? 1 : Math.min(1, 0.3 + 0.7 * cum[i] / tl, 0.3 + 0.7 * (len - cum[i]) / tl), hw = 0.5 * lw * (1 + 0.38 * vnoise(pts[i][0] / 24, pts[i][1] / 24, 7)) * taper * m;
        Lf.push([pts[i][0] + nx * hw, pts[i][1] + ny * hw]); Rt.push([pts[i][0] - nx * hw, pts[i][1] - ny * hw]);
      }
      g.beginPath(); g.moveTo(Lf[0][0], Lf[0][1]);
      for (i = 1; i < n; i++) g.lineTo(Lf[i][0], Lf[i][1]);
      for (i = n - 1; i >= 0; i--) g.lineTo(Rt[i][0], Rt[i][1]);
      g.closePath(); g.fill();
    }
    w.stroke = function () {
      if (w.plain) { g.setLineDash(dash); g.stroke(); g.setLineDash([]); return; }
      var keep = g.fillStyle; g.fillStyle = g.strokeStyle;
      subs.forEach(function (sp) {
        if (sp.p.length < 2 || w.rev <= 0) return;
        var pts = resample(sp.p, sp.closed, 5), flat = false, i;
        if (sp.closed && pts.length > 2) {
          var st = 0, cx = 0, cy = 0, per = 0;
          pts.forEach(function (q, j) { cx += q[0]; cy += q[1]; if (q[0] + q[1] < pts[st][0] + pts[st][1] - 1e-6) st = j; });
          cx /= pts.length; cy /= pts.length; pts = pts.slice(st).concat(pts.slice(0, st + 1));
          for (i = 1; i < pts.length; i++) per += seg(pts[i - 1], pts[i]);
          /* a small ring closes neatly (an overshoot would read as a curl); larger loops overshoot */
          if (per < 60) flat = true;
          else {
            var ov = Math.min(10, 0.1 * per), acc = 0;
            for (i = 1; i < pts.length && acc < ov; i++) { acc += seg(pts[i - 1], pts[i]); var q = pts[i], dn = seg(q, [cx, cy]) || 1, f = 1.6 * acc / ov; pts.push([q[0] + (q[0] - cx) / dn * f, q[1] + (q[1] - cy) / dn * f]); }
          }
        }
        pts = pts.map(function (q) { return disp(q, false); });
        if (w.rev < 1) pts = trim(pts, w.rev);
        (dash.length ? dashes(pts, dash) : [pts]).forEach(function (pc) { brush(pc, flat); });
      });
      g.fillStyle = keep;
    };
    w.fill = function () {
      if (!w.plain) {
        g.beginPath();
        subs.forEach(function (sp) {
          if (sp.p.length < 2) return;
          var pts = resample(sp.p, true, 6).map(function (q) { return disp(q, true); });
          g.moveTo(pts[0][0], pts[0][1]); for (var i = 1; i < pts.length; i++) g.lineTo(pts[i][0], pts[i][1]); g.closePath();
        });
      }
      g.fill();
      /* grain on top: paper-coloured boxes get the same tooth as the page behind them, colour gets a pigment mottle */
      var pat = g.fillStyle === w.paper ? w.paperPat : w.inkPat;
      if (pat) { var keep = g.fillStyle; g.fillStyle = pat; g.fill(); g.fillStyle = keep; }
    };
    function box(x, y, ww, hh, fn) {
      if (ww <= 0 || hh <= 0) return; var keep = subs; subs = [{ p: [[x, y], [x + ww, y], [x + ww, y + hh], [x, y + hh]], closed: true }];
      if (w.plain) { g.beginPath(); g.rect(x, y, ww, hh); }
      fn(); subs = keep;
    }
    w.fillRect = function (x, y, ww, hh) { box(x, y, ww, hh, w.fill); };
    w.strokeRect = function (x, y, ww, hh) { box(x, y, ww, hh, w.stroke); };
    return w;
  }
  /* paper tooth: a tile of faint specks, mottled at a coarser scale; it repeats seamlessly */
  var GRAIN = {}, GRAIN_URL = {};
  function grainURL(kind) { return GRAIN_URL[kind] || (GRAIN_URL[kind] = "url(" + grainTile(kind).toDataURL() + ")"); }
  function grainTile(kind) {
    if (GRAIN[kind]) return GRAIN[kind];
    var N = 160, c = document.createElement("canvas"); c.width = c.height = N;
    var g = c.getContext("2d"), im = g.createImageData(N, N), d = im.data, col = kind === "light" ? [255, 247, 232] : [64, 46, 26], amt = kind === "ink" ? 0.16 : 0.07;
    for (var y = 0; y < N; y++) for (var x = 0; x < N; x++) {
      var m = 0.5 + 0.5 * vnoise(x / 10, y / 10, 3, 16), f = rn(x, y, 5), o = 4 * (y * N + x);
      d[o] = col[0]; d[o + 1] = col[1]; d[o + 2] = col[2]; d[o + 3] = Math.round(255 * amt * (0.4 * m + 0.6 * f * f));
    }
    g.putImageData(im, 0, 0); GRAIN[kind] = c; return c;
  }

  /* ============================ optics ============================ */
  /* Normal-incidence transfer matrix for lossless layers (bottom-first, layer 0 on the substrate): R(lambda). */
  function tmmR(layers, lam) {
    var a = 1, b = 0, c = 0, d = 1;
    for (var i = layers.length - 1; i >= 0; i--) {
      var n = layers[i].n, dl = TWO_PI * n * layers[i].d / lam, cs = Math.cos(dl), sn = Math.sin(dl);
      var a2 = a * cs - b * n * sn, b2 = a * sn / n + b * cs, c2 = c * cs + d * n * sn, d2 = d * cs - c * sn / n;
      a = a2; b = b2; c = c2; d = d2;
    }
    var reN = a - d * NSUB, imN = b * NSUB - c, reD = a + d * NSUB, imD = b * NSUB + c;
    return (reN * reN + imN * imN) / (reD * reD + imD * imD);
  }
  var WL0 = 480, WL1 = 880, NW = 161;
  function spectrum(layers) { var r = []; for (var i = 0; i < NW; i++) r.push(tmmR(layers, WL0 + (WL1 - WL0) * i / (NW - 1))); return r; }
  function lay(c, d) { return { c: c, n: NIDX[c], d: d }; }
  /* a Fabry-Perot filter: three high/low pairs, a half-wave spacer (scaled by f), three pairs */
  function fpStack(f) {
    var hq = lay(1, 650 / (4 * 2.3)), lq = lay(0, 650 / (4 * 1.46)), a = [], i;
    for (i = 0; i < 3; i++) { a.push(hq); a.push(lq); }
    a.push(lay(2, f * 650 / (2 * 1.7)));
    for (i = 0; i < 3; i++) { a.push(lq); a.push(hq); }
    return a;
  }
  function randStack(seed, n, pool) {
    var a = [];
    for (var l = 0; l < n; l++) {
      var c = pool ? pool[Math.floor(rn(seed, l, 1) * pool.length)] : Math.floor(rn(seed, l, 1) * 6);
      if (l && c === a[l - 1].c) c = pool ? pool[(pool.indexOf(c) + 1) % pool.length] : (c + 1) % 6;
      a.push(lay(c, 45 + 150 * rn(seed, l, 2)));
    }
    return a;
  }
  function total(layers) { var s = 0; layers.forEach(function (q) { s += q.d; }); return s; }
  function arrF(arr) { return function (u) { var p = clamp(u, 0, 1) * (arr.length - 1), i = Math.floor(p), fr = p - i; return i >= arr.length - 1 ? arr[arr.length - 1] : arr[i] * (1 - fr) + arr[i + 1] * fr; }; }
  function mean(arr) { var s = 0; arr.forEach(function (v) { s += v; }); return s / arr.length; }
  var FP1 = spectrum(fpStack(1));
  function bump(c1, w1, h1, c2, w2, h2, base) { return function (u) { return base + h1 * Math.exp(-Math.pow((u - c1) / w1, 2)) + h2 * Math.exp(-Math.pow((u - c2) / w2, 2)); }; }
  var TGT2 = bump(0.36, 0.11, 0.66, 0.76, 0.08, 0.34, 0.12);
  var ONE2 = [randStack(31, 5), randStack(32, 8), randStack(33, 6)];
  var D5 = [lay(1, 120), lay(0, 88), lay(5, 156), lay(1, 64), lay(2, 138), lay(0, 102)], R5 = spectrum(D5);
  var POOL = [D5, randStack(81, 5, BANK), randStack(82, 7, BANK), randStack(83, 4, BANK), randStack(84, 6, BANK), randStack(85, 8, BANK)], PICK = 4;

  /* chapter 3: three search landscapes, one per target: [centre, width, depth] wells on a wavy floor */
  var LAND = [[[0.15, 0.09, 0.33], [0.38, 0.07, 0.24], [0.63, 0.06, 0.55], [0.86, 0.08, 0.3]],
    [[0.2, 0.07, 0.5], [0.45, 0.09, 0.3], [0.7, 0.06, 0.27], [0.9, 0.06, 0.36]],
    [[0.12, 0.07, 0.3], [0.34, 0.08, 0.44], [0.58, 0.06, 0.3], [0.81, 0.08, 0.52]]];
  var LANDS = LAND.map(function (w, k) {
    var f = function (x) { var v = 0.8 + 0.05 * Math.sin(TWO_PI * (1.3 * x + 0.2 * k)) + 0.03 * Math.sin(TWO_PI * (4.1 * x + 0.5 * k)); w.forEach(function (q) { v -= q[2] * Math.exp(-Math.pow((x - q[0]) / q[1], 2)); }); return v; };
    var N = 400, vals = [], mins = [], i;
    for (i = 0; i <= N; i++) vals.push(f(i / N));
    for (i = 1; i < N; i++) if (vals[i] < vals[i - 1] && vals[i] <= vals[i + 1]) mins.push(i / N);
    mins.sort(function (a, b) { return f(a) - f(b); });
    function descend(x) { var i = Math.round(clamp(x, 0, 1) * N); while (true) { if (i > 0 && vals[i - 1] < vals[i]) i--; else if (i < N && vals[i + 1] < vals[i]) i++; else break; } return i / N; }
    var shallow = mins[mins.length - 1];
    return { f: f, best: mins[0], second: mins[1], shallow: shallow, descend: descend };
  });
  var RUN = [[0.5, 6.6], [7.0, 12.2], [12.5, 18.2]];

  /* ============================ the panel ============================ */
  function initStory(container) {
    container.innerHTML = "";
    var scroller = el("div", "if-pipe-scroll"), canvas = document.createElement("canvas"); scroller.appendChild(canvas);
    var narr = el("div", "if-story-narr"), ctl = el("div", "if-story-ctl");
    var playBtn = el("button", "if-story-play"), chBar = el("div", "if-story-chs"), langBox = el("div", "if-story-lang");
    playBtn.type = "button";
    var chBtns = CS.map(function (c, i) { var b = el("button", "if-story-ch"); b.type = "button"; chBar.appendChild(b); b.addEventListener("click", function () { jump(i); }); return b; });
    var langBtns = { en: el("button", "", "EN"), zh: el("button", "", "中文") };
    Object.keys(langBtns).forEach(function (k) { langBtns[k].type = "button"; langBtns[k].lang = k === "zh" ? "zh-CN" : "en"; langBox.appendChild(langBtns[k]); langBtns[k].addEventListener("click", function () { setLang(k, true); }); });
    ctl.appendChild(playBtn); ctl.appendChild(chBar); ctl.appendChild(langBox);
    container.appendChild(scroller); container.appendChild(narr); container.appendChild(ctl);

    var lang = "en", tx = TXT.en, T = 0, playing = !reduceMotion, visible = false, looping = false, lastTs = null, frozen = false, video = false;
    var ctx, scale = 1, th, A = 1, lastNarr = null, lastCh = -1, paperDark = null;
    var SK = container.getAttribute("data-if-story") === "sketch", sm = /[?&]story=(sketch|clean)\b/.exec(location.search) || /^#why=[^#]*,(sketch|clean)\b/.exec(location.hash || "");
    if (sm) SK = sm[1] === "sketch";
    if (SK) { PAL = PAL_SK; SPEC = SPEC_SK; container.classList.add("if-sketch"); }
    try { var saved = localStorage.getItem("if-story-lang"); if (saved === "en" || saved === "zh") lang = saved; else if (/^zh/i.test(navigator.language || "")) lang = "zh"; } catch (e) { if (/^zh/i.test(navigator.language || "")) lang = "zh"; }

    /* ---- drawing helpers; every one multiplies its alpha by the group alpha A ---- */
    function alpha(a) { ctx.globalAlpha = clamp(A * (a == null ? 1 : a), 0, 1); }
    function group(a, fn) { var keep = A; A *= clamp(a, 0, 1); if (A > 0.003) fn(); A = keep; }
    /* things appear by being drawn: in the sketch skin strokes grow over a longer ramp while fills and text fade in */
    function reveal(u, t0, d, fn) {
      if (!SK) return group(ap(u, t0, d), fn);
      var a = ap(u, t0, Math.max(1, 1.8 * d)), keep = ctx.rev; if (a <= 0) return;
      ctx.rev = Math.min(keep, a); group(clamp(2 * a, 0, 1), fn); ctx.rev = keep;
    }
    /* values and scales (bars, sliders, ticks, bins) stay plain in the sketch skin, so they can still be read */
    function crisp(fn) { if (!SK) return fn(); var keep = ctx.plain; ctx.plain = true; fn(); ctx.plain = keep; }
    function font(sz, wt, fam) { return (wt || "400") + " " + sz + "px " + (fam || FONT); }
    function rr(x, y, w, h, r) { r = Math.max(0, Math.min(r, w / 2, h / 2)); ctx.beginPath(); ctx.moveTo(x + r, y); ctx.lineTo(x + w - r, y); ctx.quadraticCurveTo(x + w, y, x + w, y + r); ctx.lineTo(x + w, y + h - r); ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h); ctx.lineTo(x + r, y + h); ctx.quadraticCurveTo(x, y + h, x, y + h - r); ctx.lineTo(x, y + r); ctx.quadraticCurveTo(x, y, x + r, y); ctx.closePath(); }
    function label(x, y, s, o) { o = o || {}; alpha(o.a); ctx.fillStyle = o.color || th.muted; ctx.font = font(o.size || 11, o.weight, o.family); ctx.textAlign = o.align || "left"; ctx.textBaseline = o.base || "middle"; ctx.fillText(s, x, y); }
    function measure(s, sz, wt) { ctx.font = font(sz, wt); return ctx.measureText(s).width; }
    function wrapLines(s, maxW, sz, wt) {
      ctx.font = font(sz, wt); var cjk = /[　-鿿＀-￯]/.test(s), toks = cjk ? Array.from(s) : s.split(" "), lines = [], cur = "";
      toks.forEach(function (t) { var cand = cur ? (cjk ? cur + t : cur + " " + t) : t; if (ctx.measureText(cand).width > maxW && cur) { lines.push(cur); cur = t; } else cur = cand; });
      if (cur) lines.push(cur); return lines;
    }
    function para(x, y, s, maxW, o) { o = o || {}; var sz = o.size || 11, lh = o.lh || Math.round(sz * 1.4); wrapLines(s, maxW, sz, o.weight).forEach(function (ln, i) { label(x, y + i * lh, ln, o); }); }
    function dot(x, y, r, col, a) { alpha(a); ctx.fillStyle = col; ctx.beginPath(); ctx.arc(x, y, r, 0, TWO_PI); ctx.fill(); }
    function ring(x, y, r, col, lw, a) { alpha(a); ctx.strokeStyle = col; ctx.lineWidth = lw || 1.5; ctx.beginPath(); ctx.arc(x, y, r, 0, TWO_PI); ctx.stroke(); }
    function line(x0, y0, x1, y1, col, lw, a, dash) { alpha(a); ctx.strokeStyle = col; ctx.lineWidth = lw || 1; if (dash) ctx.setLineDash(dash); ctx.beginPath(); ctx.moveTo(x0, y0); ctx.lineTo(x1, y1); ctx.stroke(); if (dash) ctx.setLineDash([]); }
    function head(x1, y1, an, col, s, a) {
      if (SK) { alpha(a); ctx.strokeStyle = col; ctx.lineWidth = clamp(0.2 * s, 1.2, 2.4); ctx.beginPath(); ctx.moveTo(x1 - s * Math.cos(an - 0.5), y1 - s * Math.sin(an - 0.5)); ctx.lineTo(x1, y1); ctx.lineTo(x1 - s * Math.cos(an + 0.5), y1 - s * Math.sin(an + 0.5)); ctx.stroke(); return; }
      alpha(a); ctx.fillStyle = col; ctx.beginPath(); ctx.moveTo(x1, y1); ctx.lineTo(x1 - s * Math.cos(an - 0.45), y1 - s * Math.sin(an - 0.45)); ctx.lineTo(x1 - s * Math.cos(an + 0.45), y1 - s * Math.sin(an + 0.45)); ctx.closePath(); ctx.fill(); }
    function arrow(x0, y0, x1, y1, col, lw, a, dash) { line(x0, y0, x1, y1, col, lw, a, dash); head(x1, y1, Math.atan2(y1 - y0, x1 - x0), col, 4 + 2.2 * (lw || 1), a); }
    function check(x, y, s, col, a) { alpha(a); ctx.strokeStyle = col; ctx.lineWidth = Math.max(1.8, s * 0.2); ctx.lineCap = "round"; ctx.lineJoin = "round"; ctx.beginPath(); ctx.moveTo(x - s * 0.5, y); ctx.lineTo(x - s * 0.12, y + s * 0.38); ctx.lineTo(x + s * 0.55, y - s * 0.42); ctx.stroke(); ctx.lineCap = "butt"; }
    function cross(x, y, s, col, a) { alpha(a); ctx.strokeStyle = col; ctx.lineWidth = Math.max(1.8, s * 0.2); ctx.lineCap = "round"; ctx.beginPath(); ctx.moveTo(x - s / 2, y - s / 2); ctx.lineTo(x + s / 2, y + s / 2); ctx.moveTo(x + s / 2, y - s / 2); ctx.lineTo(x - s / 2, y + s / 2); ctx.stroke(); ctx.lineCap = "butt"; }
    function boxFill() { return SK ? th.bg : th.dark ? "#1f1f22" : "#ffffff"; }
    function card(x, y, w, h, o) { o = o || {}; alpha(o.a); ctx.fillStyle = boxFill(); rr(x, y, w, h, o.r == null ? 12 : o.r); ctx.fill(); ctx.strokeStyle = o.stroke || th.line; ctx.lineWidth = o.lw || 1.2; ctx.stroke(); }
    function axes(x0, y0, w, h, a) { line(x0, y0, x0, y0 + h, th.line, 1.2, a); line(x0, y0 + h, x0 + w, y0 + h, th.line, 1.2, a); }
    function curve(x0, y0, w, h, f, col, lw, a, o) {
      o = o || {}; var n = o.n || 90, u1 = o.prog == null ? 1 : o.prog; if (u1 <= 0) return;
      alpha(a); ctx.strokeStyle = col; ctx.lineWidth = lw || 2; ctx.lineJoin = "round"; if (o.dash) ctx.setLineDash(o.dash); ctx.beginPath();
      for (var q = 0; q <= n; q++) { var u = (o.u0 || 0) + (u1 - (o.u0 || 0)) * q / n, x = x0 + w * u, y = y0 + h - h * clamp(f(u), 0, 1); if (q) ctx.lineTo(x, y); else ctx.moveTo(x, y); }
      if (SK) ctx.exact = true; ctx.stroke(); if (SK) ctx.exact = false; if (o.dash) ctx.setLineDash([]);
    }
    function subCol() { return SK ? (th.dark ? "#4b463e" : "#ddd5c6") : th.dark ? "#4a4f57" : "#cfd4db"; }
    /* a cross-section, bottom-first; yb is the top of the substrate; returns the interface heights, bottom to top */
    function stack(x, yb, w, layers, px, o) {
      o = o || {}; var y = yb, ys = [yb], gap = o.gap == null ? 0.8 : o.gap;
      if (o.subH !== 0) { alpha(o.a); ctx.fillStyle = subCol(); ctx.fillRect(x, yb, w, o.subH || 8); }
      if (SK && o.subH >= 12) { /* a deep substrate is hatched, as in a drawn cross-section */
        var g = ctx.raw, sh = o.subH; g.save(); g.beginPath(); g.rect(x, yb, w, sh); g.clip();
        for (var hx = x - sh; hx < x + w; hx += 8) line(hx, yb + sh + 2, hx + sh + 4, yb - 2, th.muted, 0.9, (o.a == null ? 1 : o.a) * 0.4);
        g.restore();
      }
      for (var l = 0; l < layers.length; l++) { var hh = layers[l].d * px; alpha(o.a); ctx.fillStyle = PAL[layers[l].c]; ctx.fillRect(x, y - hh, w, Math.max(0, hh - gap)); y -= hh; ys.push(y); }
      return ys;
    }
    function lp(p, q, s) { return { x: lerp(p.x, q.x, s), y: lerp(p.y, q.y, s) }; }
    function qb(p0, c, p1, s) { var v = 1 - s; return { x: v * v * p0.x + 2 * v * s * c.x + s * s * p1.x, y: v * v * p0.y + 2 * v * s * c.y + s * s * p1.y }; }
    /* particles emitted every 1/rate s between t0 and t1, each living `life` s: fn(progress, index) */
    function stream(u, t0, t1, rate, life, fn) { var jA = Math.ceil(Math.max(t0, u - life) * rate), jB = Math.floor(Math.min(t1, u) * rate); for (var j = jA; j <= jB; j++) { var s = (u - j / rate) / life; if (s >= 0 && s < 1) fn(s, j); } }
    function chip(cx, cy, s, col, ok, a) {
      var tw = measure(s, 12, "600"), w = tw + 34, x = cx - w / 2;
      alpha(a); ctx.fillStyle = boxFill(); rr(x, cy - 13, w, 26, 13); ctx.fill(); ctx.strokeStyle = col; ctx.lineWidth = 1.3; ctx.stroke();
      if (ok) check(x + 15, cy, 10, col, a); else cross(x + 15, cy, 8, col, a);
      label(x + 26, cy + 0.5, s, { size: 12, weight: "600", color: col, a: a });
    }

    /* ---- small glyphs ---- */
    function glyph(i, cx, cy) {
      var c = th.text; ctx.lineJoin = "round"; alpha(0.85); ctx.strokeStyle = c; ctx.lineWidth = 1.6;
      if (i === 0) { /* camera lens, front view, with coloured coating glints */
        ctx.beginPath(); ctx.arc(cx, cy, 23, 0, TWO_PI); ctx.stroke(); ctx.beginPath(); ctx.arc(cx, cy, 15, 0, TWO_PI); ctx.stroke();
        alpha(0.95); ctx.lineWidth = 3; ctx.strokeStyle = PAL[4]; ctx.beginPath(); ctx.arc(cx, cy, 10, -2.5, -1.3); ctx.stroke(); ctx.strokeStyle = PAL[1]; ctx.beginPath(); ctx.arc(cx, cy, 10, 0.6, 1.4); ctx.stroke();
      } else if (i === 1) { /* display */
        rr(cx - 31, cy - 21, 62, 38, 4); ctx.stroke(); line(cx, cy + 17, cx, cy + 25, c, 1.6, 0.85); line(cx - 13, cy + 25, cx + 13, cy + 25, c, 1.6, 0.85);
        for (var k = 0; k < 3; k++) { alpha(0.45); ctx.fillStyle = PAL[k]; ctx.fillRect(cx - 26, cy - 16 + k * 10, 52, 7); }
      } else if (i === 2) { /* solar panel */
        var p = [[cx - 32, cy + 20], [cx + 22, cy + 20], [cx + 32, cy - 18], [cx - 22, cy - 18]];
        alpha(0.25); ctx.fillStyle = PAL[0]; ctx.beginPath(); p.forEach(function (q, j) { if (j) ctx.lineTo(q[0], q[1]); else ctx.moveTo(q[0], q[1]); }); ctx.closePath(); ctx.fill();
        alpha(0.85); ctx.strokeStyle = c; ctx.stroke();
        for (var g = 1; g < 4; g++) { var f = g / 4; line(lerp(p[0][0], p[1][0], f), p[0][1], lerp(p[3][0], p[2][0], f), p[3][1], c, 1, 0.6); }
        line(lerp(p[0][0], p[3][0], 0.5), cy + 1, lerp(p[1][0], p[2][0], 0.5), cy + 1, c, 1, 0.6);
      } else if (i === 3) { /* laser cavity: two coated mirrors around a gain tube */
        for (var m = 0; m < 2; m++) { var mx = m ? cx + 20 : cx - 30; for (var s = 0; s < 5; s++) { alpha(0.95); ctx.fillStyle = PAL[s % 2 ? 0 : 1]; ctx.fillRect(mx, cy - 18 + s * 7.2, 7, 6.4); } }
        alpha(0.85); ctx.strokeStyle = c; rr(cx - 20, cy - 8, 37, 16, 3); ctx.stroke();
        line(cx - 23, cy, cx + 20, cy, SPEC, 1.4, 0.6); arrow(cx + 27, cy, cx + 44, cy, SPEC, 2, 0.95);
      } else { /* window in the sun */
        alpha(0.2); ctx.fillStyle = PAL[2]; ctx.fillRect(cx - 24, cy - 18, 46, 40);
        alpha(0.85); ctx.strokeStyle = c; rr(cx - 24, cy - 18, 46, 40, 3); ctx.stroke(); line(cx - 1, cy - 18, cx - 1, cy + 22, c, 1.3, 0.85); line(cx - 24, cy + 2, cx + 22, cy + 2, c, 1.3, 0.85);
        dot(cx + 28, cy - 22, 6, PAL[2], 0.95); for (var r = 0; r < 8; r++) { var an = r * TWO_PI / 8; line(cx + 28 + 9 * Math.cos(an), cy - 22 + 9 * Math.sin(an), cx + 28 + 12.5 * Math.cos(an), cy - 22 + 12.5 * Math.sin(an), PAL[2], 1.4, 0.9); }
      }
    }
    function netGlyph(x, y, w, h, glow) {
      var C = 4, Rw = 4, i, j, k;
      for (i = 0; i < C - 1; i++) for (j = 0; j < Rw; j++) for (k = 0; k < Rw; k++) line(x + w * i / (C - 1), y + h * j / (Rw - 1), x + w * (i + 1) / (C - 1), y + h * k / (Rw - 1), th.muted, 0.8, 0.22 + 0.25 * glow);
      for (i = 0; i < C; i++) for (j = 0; j < Rw; j++) { var pul = 0.5 + 0.5 * Math.sin(TWO_PI * (i * 0.23 + j * 0.37) + glow * 9); dot(x + w * i / (C - 1), y + h * j / (Rw - 1), 4.5, glow > 0.05 ? th.accent : th.text, 0.55 + 0.45 * glow * pul); }
    }
    function chamber(cx, by, film, layers, act) {
      alpha(0.9); ctx.strokeStyle = th.text; ctx.lineWidth = 1.6;
      ctx.beginPath(); ctx.moveTo(cx - 44, by); ctx.lineTo(cx - 44, by - 106); ctx.arc(cx, by - 106, 44, Math.PI, 0); ctx.lineTo(cx + 44, by); ctx.stroke();
      line(cx - 56, by + 2, cx + 56, by + 2, th.text, 3.2, 0.9);
      line(cx, by - 150, cx, by - 136, th.text, 1.4, 0.9); alpha(1); ctx.fillStyle = subCol(); ctx.fillRect(cx - 24, by - 136, 48, 6);
      var n = layers.length, shown = film * n, y = by - 130;
      for (var l = 0; l < n; l++) { var f = clamp(shown - l, 0, 1); if (f <= 0) break; alpha(1); ctx.fillStyle = PAL[layers[l].c]; ctx.fillRect(cx - 24, y, 48, 2.6 * f); y += 2.6 * f; }
      alpha(0.85); ctx.fillStyle = th.muted; ctx.beginPath(); ctx.moveTo(cx - 13, by - 18); ctx.lineTo(cx + 13, by - 18); ctx.lineTo(cx + 8, by - 10); ctx.lineTo(cx - 8, by - 10); ctx.closePath(); ctx.fill();
      line(cx, by - 10, cx, by, th.muted, 1.4, 0.85);
      if (act > 0) dot(cx, by - 20, 6, PAL[layers[Math.min(n - 1, Math.floor(shown))].c], 0.5 * act);
    }

    /* ---- chapter 1: coatings are everywhere ---- */
    function scene1(u, B) {
      var GX = [130, 315, 500, 685, 870], dimG = 1 - 0.45 * ap(u, B[1], 0.8);
      for (var i = 0; i < 5; i++) reveal(u, 0.25 + 0.4 * i, 0.6, function () { group(dimG, function () { glyph(i, GX[i], 98); label(GX[i], 142, tx.apps[i], { align: "center", size: 12, color: th.text, a: 0.8 }); }); });
      var f = 1 + 0.22 * Math.sin(TWO_PI * Math.max(0, u - B[2]) / 5.5) * ap(u, B[2], 0.8);
      var layers = fpStack(f), R = spectrum(layers), Rf = arrF(R), Rm = mean(R);
      reveal(u, 1.0, 0.8, function () {
        var ys = stack(150, 465, 200, layers, 0.156, { subH: 30 }), top = ys[ys.length - 1];
        label(250, 481, tx.substrate, { align: "center", size: 11, color: th.dark ? "#d6dae0" : "#59616c" });
        label(152, top - 12, tx.air, { size: 11 });
        var P = { x: 250, y: top }, I0 = { x: 92, y: 192 }, R1 = { x: 408, y: 192 }, E0 = { x: 274, y: 495 }, T1 = { x: 290, y: 548 };
        line(I0.x, I0.y, P.x, P.y, th.text, 1.4, 0.3); line(P.x, P.y, R1.x, R1.y, th.R, 1.4, 0.35); line(P.x, P.y, E0.x, E0.y, th.T, 1.2, 0.35, [3, 3]); line(E0.x, E0.y, T1.x, T1.y, th.T, 1.4, 0.35);
        stream(u, 1.2, 99, 10, 0.9, function (s) { var p = lp(I0, P, s); dot(p.x, p.y, 2.5, th.text, 0.7); });
        stream(u, 2.1, 99, 10, 0.9, function (s, j) { if (rn(12, j, 0) > Rm) return; var p = lp(P, R1, s); dot(p.x, p.y, 2.7, th.R, 0.9); });
        stream(u, 2.1, 99, 10, 0.55, function (s, j) { if (rn(13, j, 0) > 1 - Rm) return; var p = lp(E0, T1, s); dot(p.x, p.y, 2.7, th.T, 0.9); });
        label(414, 186, "R", { size: 14, weight: "700", color: th.R }); label(300, 541, "T", { size: 14, weight: "700", color: th.T });
        reveal(u, B[1], 0.6, function () {
          for (var k = 0; k < ys.length; k++) { var x = lerp(P.x, E0.x, (ys[k] - top) / (E0.y - top)); line(x, ys[k], x + 13, ys[k] - 7, th.R, 1.6, 0.8); }
          var yc = (ys[12] + ys[13]) / 2, ysp = [ys[7], ys[6]];
          line(354, yc, 368, yc, th.muted, 1); label(374, yc, tx.colour, { size: 12, color: th.text });
          line(358, ysp[0], 366, ysp[0], th.text, 1.2); line(358, ysp[1], 366, ysp[1], th.text, 1.2); arrow(362, (ysp[0] + ysp[1]) / 2, 362, ysp[0] + 1, th.text, 1.2); arrow(362, (ysp[0] + ysp[1]) / 2, 362, ysp[1] - 1, th.text, 1.2);
          label(374, (ysp[0] + ysp[1]) / 2, tx.length, { size: 12, color: th.text });
        });
      });
      var X0 = 570, Y0 = 245, PW = 375, PH = 210;
      reveal(u, 1.6, 0.8, function () {
        label(X0, 226, tx.spectrum, { size: 13, weight: "700", color: th.text });
        axes(X0, Y0, PW, PH); label(X0 + PW, Y0 + PH + 16, tx.wavelength, { align: "right", size: 11 });
        var prog = ap(u, 1.8, 1.8);
        reveal(u, B[2], 0.6, function () { curve(X0, Y0, PW, PH, arrF(FP1), th.muted, 1.2, 0.55, { dash: [4, 4] }); });
        curve(X0, Y0, PW, PH, Rf, th.R, 2.2, 1, { prog: prog }); curve(X0, Y0, PW, PH, function (v) { return 1 - Rf(v); }, th.T, 2.2, 0.9, { prog: prog });
        if (prog > 0.98) { label(X0 + PW + 6, Y0 + PH - PH * R[NW - 1], "R", { size: 12, weight: "700", color: th.R }); label(X0 + PW + 6, Y0 + PH - PH * (1 - R[NW - 1]), "T", { size: 12, weight: "700", color: th.T }); }
        reveal(u, B[2], 0.6, function () {
          var lo = Math.round(0.2 * (NW - 1)), hi = Math.round(0.8 * (NW - 1)), bi = lo; for (var q = lo; q <= hi; q++) if (R[q] < R[bi]) bi = q;
          var px = X0 + PW * bi / (NW - 1); line(px, Y0, px, Y0 + PH, th.T, 1.2, 0.7, [3, 3]); label(px, Y0 - 11, tx.peak, { align: "center", size: 11, weight: "600", color: th.T });
        });
      });
    }

    /* ---- chapter 2: forward is easy, inverse is hard ---- */
    function scene2(u, B) {
      var fpL = fpStack(1);
      reveal(u, 0.15, 0.6, function () { group(1 - 0.4 * ap(u, B[1], 0.8), function () {
        label(40, 80, tx.forward, { size: 12, weight: "700", color: th.text });
        var ys = stack(75, 236, 100, fpL, 0.1, { subH: 10 });
        card(300, 150, 120, 60, { stroke: th.text, lw: 1.4 }); label(360, 174, "TMM", { align: "center", size: 17, weight: "700", color: th.text }); label(360, 195, tx.tmmSub, { align: "center", size: 10 });
        arrow(188, 180, 292, 180, th.muted, 1.4, 0.8); arrow(428, 180, 522, 180, th.muted, 1.4, 0.8);
        axes(540, 100, 240, 136); curve(540, 100, 240, 136, arrF(FP1), th.R, 2.2, 1, { prog: ap(u, 1.3, 1.6) });
        label(780, 248, tx.wavelength, { align: "right", size: 10 });
        stream(u, 0.6, 99, 6, 0.9, function (s, j) { var l = Math.floor(rn(21, j, 0) * fpL.length), y = (ys[l] + ys[l + 1]) / 2; var p = qb({ x: 178, y: y }, { x: 240, y: y }, { x: 300, y: 180 }, s); dot(p.x, p.y, 2.6, PAL[fpL[l].c], 0.9); });
        stream(u, 1.3, 99, 6, 0.9, function (s, j) { var v = rn(22, j, 0), p = qb({ x: 420, y: 180 }, { x: 480, y: 180 }, { x: 540 + 240 * v, y: 236 - 136 * FP1[Math.round(v * (NW - 1))] }, s); dot(p.x, p.y, 2.6, th.R, 0.9); });
        [tx.exact, tx.instant, tx.oneAnswer].forEach(function (s, k) { reveal(u, 2.4 + 0.5 * k, 0.4, function () { check(822, 142 + 30 * k, 12, th.accent, 1); label(838, 142 + 30 * k, s, { size: 13, color: th.text }); }); });
      }); });
      reveal(u, 0.15, 0.6, function () { line(30, 268, 970, 268, th.line, 1, 1, [4, 4]); });
      var TX = 715, TY = 316, TW = 240, TH = 104;
      reveal(u, B[1], 0.6, function () {
        label(40, 290, tx.inverse, { size: 12, weight: "700", color: th.text });
        label(TX, 300, tx.need, { size: 12, color: th.text });
        axes(TX, TY, TW, TH); curve(TX, TY, TW, TH, TGT2, SPEC, 2.4, 1, { dash: [6, 4] });
        arrow(700, 366, 548, 366, th.muted, 1.4, 0.9);
        var pr = 15 + 2 * Math.sin(TWO_PI * u / 1.6); dot(626, 366, pr, boxFill(), 1); ring(626, 366, pr, th.accent, 2); label(626, 367, "?", { align: "center", size: 17, weight: "700", color: th.accent });
        label(40, 316, tx.everyLayer, { size: 12, color: th.text });
        var uu = u - B[1];
        for (var r = 0; r < 6; r++) {
          var opt = r < 4 ? 1 : 0.25 + 0.75 * (0.5 + 0.5 * Math.sin(TWO_PI * uu / 4.5 + r * 1.7)), y = 346 + r * 27, P = 2.2, ph = uu + r * 0.37, k = Math.floor(ph / P);
          var mat = Math.floor(rn(23, r, k) * 6), p0 = 0.12 + 0.8 * rn(24, r, k - 1), p1 = 0.12 + 0.8 * rn(24, r, k), kn = lerp(p0, p1, ease((ph - k * P) / 0.9));
          group(opt, function () {
            label(52, y, String(r + 1), { align: "center", size: 10 });
            for (var c = 0; c < 6; c++) { alpha(c === mat ? 1 : 0.2); ctx.fillStyle = PAL[c]; rr(66 + c * 20, y - 7, 14, 14, 3); ctx.fill(); }
            alpha(1); ctx.strokeStyle = th.text; ctx.lineWidth = 1.4; rr(64 + mat * 20, y - 9, 18, 18, 4); ctx.stroke();
            crisp(function () {
              alpha(1); ctx.fillStyle = th.line; rr(200, y - 3, 260, 6, 3); ctx.fill(); ctx.fillStyle = PAL[mat]; rr(200, y - 3, 260 * kn, 6, 3); ctx.fill();
              dot(200 + 260 * kn, y, 5.5, PAL[mat], 1); ring(200 + 260 * kn, y, 5.5, boxFill(), 1.5);
            });
          });
        }
        line(480, 338, 480, 489, th.text, 1.2, 0.7); line(474, 338, 480, 338, th.text, 1.2, 0.7); line(474, 489, 480, 489, th.text, 1.2, 0.7);
        label(490, 414, "N = ?", { size: 13, weight: "700", color: th.text });
        label(40, 524, tx.mix, { size: 12, weight: "700", color: th.text });
      });
      reveal(u, B[2], 0.6, function () {
        para(552, 446, tx.many, 140, { size: 12, color: th.text });
        ONE2.forEach(function (L, i) {
          var tot = total(L);
          reveal(u, B[2] + 0.6 * i, 0.5, function () {
            stack(720 + 82 * i, 530, 42, L, 84 / tot, { subH: 6 });
            curve(TX, TY, TW, TH, function (v) { return TGT2(v) + 0.035 * Math.sin(TWO_PI * (2.6 * v + 0.37 * i)) - 0.015 * i; }, th.text, 1.3, 0.55, { prog: ap(u, B[2] + 0.6 * i + 0.2, 0.9) });
          });
        });
      });
    }

    /* ---- chapter 3: classical optimisers ---- */
    function scene3(u, B) {
      var r = 0; for (var q = 0; q < RUN.length; q++) if (u >= RUN[q][0]) r = q;
      var mix = r > 0 ? ap(u, RUN[r][0], 0.8) : 1, LA = r > 0 ? LANDS[r - 1].f : LANDS[0].f, LB = LANDS[r].f;
      function L(x) { return lerp(LA(x), LB(x), mix); }
      var running = u >= RUN[r][0] && u < RUN[r][1] - 0.3;
      reveal(u, 0.1, 0.6, function () {
        card(50, 104, 210, 52, { stroke: th.text, lw: 1.4 }); label(155, 130, tx.optimiser, { align: "center", size: 14, weight: "700", color: th.text });
        card(50, 300, 210, 52, { stroke: th.text, lw: 1.4 }); label(155, 326, tx.simulator, { align: "center", size: 14, weight: "700", color: th.text });
        var dn = [{ x: 112, y: 160 }, { x: 74, y: 228 }, { x: 112, y: 296 }], upP = [{ x: 198, y: 296 }, { x: 236, y: 228 }, { x: 198, y: 160 }];
        [dn, upP].forEach(function (pp, k) { alpha(0.5); ctx.strokeStyle = th.muted; ctx.lineWidth = 1.3; ctx.beginPath(); ctx.moveTo(pp[0].x, pp[0].y); ctx.quadraticCurveTo(pp[1].x, pp[1].y, pp[2].x, pp[2].y); ctx.stroke(); var e = qb(pp[0], pp[1], pp[2], 0.97); head(pp[2].x, pp[2].y, Math.atan2(pp[2].y - e.y, pp[2].x - e.x), th.muted, 7, 0.6); });
        RUN.forEach(function (w, k) {
          stream(u, w[0], w[1] - 0.3, 12, 0.9, function (s, j) { dot(qb(dn[0], dn[1], dn[2], s).x, qb(dn[0], dn[1], dn[2], s).y, 2.8, PAL[Math.floor(rn(31, j, k) * 6)], 0.9); });
          stream(u, w[0] + 0.9, w[1] + 0.6, 12, 0.9, function (s) { var p = qb(upP[0], upP[1], upP[2], s); dot(p.x, p.y, 2.8, th.R, 0.9); });
        });
        label(155, 372, tx.eachDot, { align: "center", size: 11 });
        label(50, 408, tx.simsRun, { size: 11, color: th.text });
        var fill = Math.pow(clamp((u - RUN[r][0]) / (RUN[r][1] - RUN[r][0] - 0.3), 0, 1), 0.85);
        crisp(function () { alpha(1); ctx.fillStyle = th.line; rr(50, 420, 210, 10, 5); ctx.fill(); ctx.fillStyle = th.R; rr(50, 420, Math.max(6, 210 * fill), 10, 5); ctx.fill(); });
        if (r > 0) reveal(u, RUN[r][0], 0.3, function () { chip(155, 458, tx.scratch, th.R, false, 1 - ap(u, RUN[r][0] + 2.4, 0.5)); });
      });
      var PX = 320, PY = 100, PW = 440, PH = 340;
      function X(x) { return PX + PW * x; }
      function Y(v) { return PY + PH - PH * (v - 0.1) / 0.85; }
      reveal(u, 0.2, 0.6, function () {
        alpha(th.dark ? 0.35 : 0.5); ctx.fillStyle = th.line; ctx.beginPath(); ctx.moveTo(X(0), PY + PH);
        for (var i = 0; i <= 120; i++) ctx.lineTo(X(i / 120), Y(L(i / 120))); ctx.lineTo(X(1), PY + PH); ctx.closePath(); ctx.fill();
        curve(PX, PY, PW, PH, function (x) { return (L(x) - 0.1) / 0.85; }, th.text, 1.8, 0.75, { n: 120 });
        axes(PX, PY, PW, PH);
        label(PX, PY - 12, tx.mismatch, { size: 11 }); label(PX + PW, PY + PH + 16, tx.designSpace, { align: "right", size: 11 });
        dot(PX + 6, 484, 4.5, th.accent, 1); label(PX + 16, 484, tx.pop, { size: 11, color: th.text });
        var lx = PX + 26 + measure(tx.pop, 11) + 20; ring(lx, 484, 5, th.text, 1.8); label(lx + 10, 484, tx.local, { size: 11, color: th.text });
      });
      var t0 = RUN[r][0], t1 = RUN[r][1], tau = clamp((u - t0) / (t1 - t0), 0, 1), aIn = ap(u, t0, 0.4), LS = LANDS[r];
      if (u >= t0 - 0.01) {
        var pops = r < 2 ? [[100 + r, th.accent, null]] : [[102, th.accent, null], [203, PAL[2], LS.second]];
        pops.forEach(function (pp, pi) {
          for (var j = 0; j < 12; j++) {
            var x0 = 0.04 + 0.92 * rn(pp[0], j, 0), d0 = 0.04 + 0.3 * rn(pp[0], j, 1), e = ease((tau - d0) / 0.5);
            var dest = pp[2] != null ? pp[2] : j < 9 ? LS.best : LS.descend(x0);
            var x = lerp(x0, dest, e) + 0.06 * (1 - e) * Math.sin(TWO_PI * (1.7 * tau + rn(pp[0], j, 2))) + (e > 0.98 ? 0.008 * (j % 5 - 2) : 0);
            dot(X(x), Y(L(x)) - 6, 4.2, pp[1], 0.9 * aIn);
          }
          if (r === 2 && tau > 0.72) { var mx = pp[2] != null ? pp[2] : LS.best; label(X(mx), Y(L(mx)) + 16, tx.seed + " " + (pi + 1), { align: "center", size: 11, weight: "600", color: pp[1], a: ap(tau, 0.72, 0.1) }); }
        });
        var xs = LS.shallow + 0.075, xl = lerp(xs, LS.shallow, 1 - Math.exp(-5 * tau));
        ring(X(xl), Y(L(xl)) - 7, 5, th.text, 1.8, aIn);
        if (tau > 0.5) { var aSt = ap(tau, 0.5, 0.1) * aIn, sw = measure(tx.stuck, 11, "600") + 14; alpha(aSt); ctx.fillStyle = boxFill(); rr(X(xl) - sw / 2, Y(L(xl)) - 44, sw, 20, 10); ctx.fill(); ctx.strokeStyle = th.text; ctx.lineWidth = 1; ctx.stroke(); label(X(xl), Y(L(xl)) - 33.5, tx.stuck, { align: "center", size: 11, weight: "600", color: th.text, a: aSt }); }
      }
      for (var k = 0; k < 3; k++) {
        var cy = 100 + k * 118, done = u >= RUN[k][1], act = u >= RUN[k][0] && !done;
        reveal(u, 0.3 + 0.15 * k, 0.5, function () { group(act || done ? 1 : 0.4, function () {
          card(800, cy, 160, 104, { stroke: act ? th.accent : th.line, lw: act ? 2 : 1.2 });
          label(814, cy + 17, tx.target + " " + (k + 1), { size: 11, weight: "700", color: th.text });
          curve(814, cy + 32, 86, 58, bump(0.25 + 0.25 * k, 0.12, 0.65, 0.8 - 0.1 * k, 0.07, 0.3, 0.1), SPEC, 1.8, 1, { dash: [4, 3] });
          if (done) reveal(u, RUN[k][1], 0.4, function () { check(942, cy + 17, 11, th.accent, 1); var L2 = randStack(140 + k, 5); stack(914, cy + 90, 32, L2, 52 / total(L2), { subH: 4 }); });
        }); });
      }
    }

    /* ---- chapter 4: neural networks in a closed world ---- */
    function scene4(u, B) {
      var dimTop = 1 - 0.5 * ap(u, B[2], 0.6), cloud = 1 - 0.55 * ap(u, 3.4, 0.8);
      reveal(u, 0.1, 0.6, function () { group(dimTop, function () {
        group(cloud, function () {
          for (var k = 0; k < 16; k++) {
            var x = 48 + (k % 4) * 60 + 8 * rn(41, k, 0), y = 100 + Math.floor(k / 4) * 34 + 5 * rn(41, k, 1);
            for (var s = 0; s < 3; s++) { alpha(0.9); ctx.fillStyle = PAL[Math.floor(rn(42, k, s) * 6)]; ctx.fillRect(x, y + s * 7.5, 10, 6.6); }
            curve(x + 14, y, 26, 22, bump(rn(43, k, 0), 0.15, 0.7, rn(43, k, 1), 0.1, 0.3, 0.05), th.R, 1.2, 0.8, { n: 16 });
          }
          label(48, 252, tx.train, { size: 11, color: th.text });
        });
        stream(u, 0.6, 3.0, 18, 1.0, function (s, j) { var k = Math.floor(rn(44, j, 0) * 16), x = 60 + (k % 4) * 60, y = 110 + Math.floor(k / 4) * 34, p = qb({ x: x, y: y }, { x: 320, y: y }, { x: 382, y: 120 + 92 * rn(44, j, 1) }, s); dot(p.x, p.y, 2.6, PAL[Math.floor(rn(44, j, 2) * 6)], 0.9); });
        card(380, 96, 220, 140, { stroke: th.text, lw: 1.4 }); label(490, 84, tx.network, { align: "center", size: 12, weight: "700", color: th.text });
        netGlyph(412, 118, 156, 96, Math.min(ap(u, 0.8, 0.5), 1 - ap(u, 3.3, 0.5)));
        reveal(u, 3.3, 0.5, function () { check(452, 252, 11, th.accent, 1); label(466, 252, tx.trained, { size: 12, weight: "600", color: th.text }); });
        label(650, 86, tx.oneP, { size: 12, color: th.text, a: ap(u, 3.4, 0.5) });
        for (var k2 = 0; k2 < 3; k2++) {
          var tk = 3.7 + 0.7 * k2, yk = 118 + 48 * k2;
          stream(u, tk - 0.45, tk, 16, 0.45, function (s) { var p = qb({ x: 600, y: 166 }, { x: 680, y: 166 }, { x: 760, y: yk }, s); dot(p.x, p.y, 2.4, th.accent, 0.85); });
          reveal(u, tk, 0.35, function () {
            curve(650, yk - 15, 100, 30, bump(0.2 + 0.3 * k2, 0.12, 0.7, 0.85 - 0.2 * k2, 0.07, 0.3, 0.08), SPEC, 1.8, 1, { dash: [4, 3] });
            arrow(760, yk, 798, yk, th.muted, 1.3, 0.9);
            var L3 = randStack(60 + k2, 5); stack(810, yk + 13, 28, L3, 28 / total(L3), { subH: 3 });
            check(860, yk, 11, th.accent, 1);
          });
        }
      }); });
      var CX = [30, 350, 670], CY = 288, CWd = 300, CHt = 256, tA = B[1] + 0.2, tB = B[1] + 2.6, tC = B[1] + 5.0, focus = ap(u, B[2], 0.6);
      [tx.cardA, tx.cardB, tx.cardC].forEach(function (s, k) { reveal(u, 0.4, 0.6, function () { group((1 - ap(u, [tA, tB, tC][k], 0.6)) * 0.4, function () { card(CX[k], CY, CWd, CHt); label(CX[k] + 16, CY + 22, s, { size: 13, weight: "700", color: th.text }); }); }); });
      /* card A: materials */
      reveal(u, tA, 0.6, function () {
        var x0 = CX[0], y0 = CY; card(x0, y0, CWd, CHt, { stroke: focus > 0.5 ? th.accent : th.line, lw: focus > 0.5 ? 1.8 : 1.2 });
        label(x0 + 16, y0 + 22, tx.cardA, { size: 13, weight: "700", color: th.text });
        for (var i = 0; i < 5; i++) { alpha(1); ctx.fillStyle = PAL[i]; rr(x0 + 18 + i * 38, y0 + 46, 28, 28, 5); ctx.fill(); label(x0 + 32 + i * 38, y0 + 60.5, LET[i], { align: "center", size: 13, weight: "700", color: "#fff" }); }
        alpha(0.8); ctx.strokeStyle = th.muted; ctx.lineWidth = 1.2; ctx.setLineDash([3, 3]); rr(x0 + 214.5, y0 + 46.5, 27, 27, 5); ctx.stroke(); ctx.setLineDash([]);
        line(x0 + 206, y0 + 40, x0 + 206, y0 + 80, SPEC, 2, 0.9, [4, 3]);
        line(x0 + 18, y0 + 82, x0 + 198, y0 + 82, th.muted, 1, 0.7);
        label(x0 + 18, y0 + 96, tx.vocab, { size: 11, a: 1 - focus });
        label(x0 + 18, y0 + 96, tx.onlyName, { size: 11, weight: "600", color: th.text, a: focus });
        if (focus > 0) ring(x0 + 70, y0 + 60, 19, th.accent, 2, focus);
        var aBo = 1 - ap(u, B[2], 0.5);
        if (aBo > 0 && u >= tA) {
          var cyc = ((u - tA) % 3.2) / 3.2, S0 = { x: x0 + 236, y: y0 + 160 }, Tg = { x: x0 + 236, y: y0 + 112 }, p;
          p = cyc < 0.38 ? lp(S0, Tg, ease(cyc / 0.38)) : lp(Tg, S0, ease((cyc - 0.38) / 0.25));
          group(aBo, function () {
            card(p.x - 26, p.y - 13, 52, 26, { stroke: PAL[5], lw: 1.5, r: 6 });
            curve(p.x - 20, p.y - 9, 40, 18, function (v) { return 0.5 + 0.4 * Math.sin(TWO_PI * (0.9 * v + 0.1)); }, PAL[5], 2, 1, { n: 20 });
            label(p.x, p.y + 24, tx.newMat, { align: "center", size: 11, weight: "600", color: PAL[5] });
            if (cyc > 0.34 && cyc < 0.92) cross(x0 + 206, y0 + 104, 10, SPEC, ap(cyc, 0.34, 0.05));
          });
        }
        reveal(u, B[2] + 0.3, 0.6, function () {
          var px0 = x0 + 18, py0 = y0 + 118, pw = 264, ph = 70;
          var fh = function (v) { return 0.88 - 0.25 * v + 0.08 * Math.sin(TWO_PI * (0.8 * v + 0.1)); }, fm = function (v) { return fh(v) - 0.25 - 0.05 * Math.sin(TWO_PI * 1.4 * v); };
          alpha(0.12); ctx.fillStyle = PAL[1]; ctx.beginPath(); for (var q = 0; q <= 40; q++) ctx.lineTo(px0 + pw * q / 40, py0 + ph - ph * fh(q / 40)); for (q = 40; q >= 0; q--) ctx.lineTo(px0 + pw * q / 40, py0 + ph - ph * fm(q / 40)); ctx.closePath(); ctx.fill();
          curve(px0, py0, pw, ph, fh, PAL[1], 2, 0.9, { dash: [5, 4] }); curve(px0, py0, pw, ph, fm, PAL[1], 2.6, 1);
          label(px0 + pw, py0 + ph - ph * fh(1) - 12, tx.handbook, { size: 11, align: "right" });
          label(px0 + pw, py0 + ph - ph * fm(1) + 13, tx.measured, { size: 11, weight: "600", color: PAL[1], align: "right" });
          line(x0 + 70, y0 + 106, x0 + 70, py0 + ph - ph * fh(52 / pw) - 3, th.text, 1, 0.5, [2, 3]);
        });
        reveal(u, tA + 1.4, 0.5, function () { chip(x0 + CWd / 2, y0 + CHt - 26, tx.chipA, SPEC, false, 1); });
      });
      /* card B: wavelengths */
      reveal(u, tB, 0.6, function () { group(1 - 0.6 * focus, function () {
        var x0 = CX[1], y0 = CY; card(x0, y0, CWd, CHt);
        label(x0 + 16, y0 + 22, tx.cardB, { size: 13, weight: "700", color: th.text });
        var ax0 = x0 + 18, ax1 = x0 + 282, gx = x0 + 190, ya = y0 + 176;
        crisp(function () { alpha(th.dark ? 0.35 : 0.5); ctx.fillStyle = th.line; ctx.fillRect(gx, y0 + 58, ax1 - gx, ya - y0 - 58); });
        var fB = bump(0.3, 0.12, 0.55, 0.7, 0.1, 0.4, 0.12); curve(ax0, y0 + 64, ax1 - ax0, 100, fB, th.muted, 1.4, 0.7);
        crisp(function () { line(ax0, ya, ax1, ya, th.text, 1.2, 0.7); for (var gx2 = ax0; gx2 <= gx; gx2 += 8) line(gx2, ya - 6, gx2, ya + 6, th.text, 1, 0.55); });
        label(ax0, ya + 18, tx.grid, { size: 11 }); label(ax1, ya + 18, tx.beyond, { align: "right", size: 11 });
        var cyc = u >= tB ? ((u - tB) % 4.2) / 4.2 : 0, bx = lerp(x0 + 64, x0 + 214, ease((cyc - 0.3) / 0.3)), bw = 56, out = bx + bw > gx + 6;
        crisp(function () { alpha(0.14); ctx.fillStyle = th.accent; ctx.fillRect(bx, y0 + 58, bw, ya - y0 - 58); alpha(1); ctx.strokeStyle = th.accent; ctx.lineWidth = 1.5; ctx.strokeRect(bx, y0 + 58, bw, ya - y0 - 58); });
        curve(ax0, y0 + 64, ax1 - ax0, 100, fB, th.accent, 2.6, 1, { u0: (bx - ax0) / (ax1 - ax0), prog: (bx + bw - ax0) / (ax1 - ax0), n: 24 });
        label(bx + bw / 2, y0 + 48, tx.yourBand, { align: "center", size: 11, weight: "600", color: th.accent });
        if (out) cross(bx + bw / 2, ya - 22, 11, SPEC, 1); else check(bx + bw / 2, ya - 22, 11, th.accent, 0.9);
        reveal(u, tB + 1.4, 0.5, function () { chip(x0 + CWd / 2, y0 + CHt - 26, tx.chipB, SPEC, false, 1); });
      }); });
      /* card C: thickness bins */
      reveal(u, tC, 0.6, function () { group(1 - 0.6 * focus, function () {
        var x0 = CX[2], y0 = CY; card(x0, y0, CWd, CHt);
        label(x0 + 16, y0 + 22, tx.cardC, { size: 13, weight: "700", color: th.text });
        var t0x = x0 + 18, tw = 264, bin = tw / 8, xo = t0x + tw * (0.5 + 0.22 * Math.sin(TWO_PI * (u - tC) / 6.5) + 0.05 * Math.sin(TWO_PI * (u - tC) / 2.3)), xs = t0x + bin * Math.round((xo - t0x) / bin);
        crisp(function () {
          label(t0x, y0 + 62, tx.bins, { size: 11, color: th.text });
          alpha(1); ctx.fillStyle = th.line; rr(t0x, y0 + 82, tw, 8, 4); ctx.fill(); ctx.fillStyle = PAL[1]; rr(t0x, y0 + 82, xs - t0x, 8, 4); ctx.fill();
          for (var b = 0; b <= 8; b++) line(t0x + b * bin, y0 + 76, t0x + b * bin, y0 + 96, th.text, 1, 0.55);
          label(t0x, y0 + 124, tx.needed, { size: 11, color: th.text });
          alpha(1); ctx.fillStyle = th.line; rr(t0x, y0 + 144, tw, 8, 4); ctx.fill(); ctx.fillStyle = PAL[1]; rr(t0x, y0 + 144, xo - t0x, 8, 4); ctx.fill();
          alpha(1); ctx.fillStyle = th.text; ctx.beginPath(); ctx.moveTo(xo, y0 + 139); ctx.lineTo(xo + 6, y0 + 148); ctx.lineTo(xo, y0 + 157); ctx.lineTo(xo - 6, y0 + 148); ctx.closePath(); ctx.fill();
          if (Math.abs(xo - xs) > 3) { line(xs, y0 + 74, xs, y0 + 176, SPEC, 1.3, 0.9, [3, 3]); line(xo, y0 + 74, xo, y0 + 176, SPEC, 1.3, 0.9, [3, 3]); line(Math.min(xs, xo), y0 + 176, Math.max(xs, xo), y0 + 176, SPEC, 2, 0.9); label((xs + xo) / 2, y0 + 192, tx.miss, { align: "center", size: 11, weight: "600", color: SPEC }); }
        });
        reveal(u, tC + 1.4, 0.5, function () { chip(x0 + CWd / 2, y0 + CHt - 26, tx.chipC, SPEC, false, 1); });
      }); });
    }

    /* ---- chapter 5: IrisFlow ---- */
    function scene5(u, B) {
      var IX = 30, IW = 230, IH = 98, Rf = arrF(R5);
      var inY = [74, 180, 286, 392], inT = [0.4, 1.3, 2.2, 3.1], late = 1 - 0.55 * ap(u, B[2], 0.6);
      var drawIn = [
        function (x, y) { axes(x + 12, y + 30, IW - 24, 56); curve(x + 12, y + 30, IW - 24, 56, Rf, th.R, 2, 1); curve(x + 12, y + 30, IW - 24, 56, function (v) { return 1 - Rf(v); }, th.T, 2, 0.9); },
        function (x, y) {
          var a0 = x + 12, a1 = x + IW - 12, g = x + 150, ya = y + 76;
          alpha(th.dark ? 0.35 : 0.5); ctx.fillStyle = th.line; ctx.fillRect(g, y + 30, a1 - g, ya - y - 30);
          line(a0, ya, a1, ya, th.text, 1.2, 0.7); label(a0, ya + 11, tx.trainedW, { size: 9 }); label(a1, ya + 11, tx.beyond, { size: 9, align: "right" });
          [[a0 + 22, 40], [g + 18, 42]].forEach(function (bb) { alpha(0.16); ctx.fillStyle = th.accent; ctx.fillRect(bb[0], y + 30, bb[1], ya - y - 30); alpha(1); ctx.strokeStyle = th.accent; ctx.lineWidth = 1.4; ctx.strokeRect(bb[0], y + 30, bb[1], ya - y - 30); });
        },
        function (x, y) {
          [0, 2, 5, 1].forEach(function (c, k) { curve(x + 12, y + 28, IW - 70, 54, function (v) { return 0.25 + 0.15 * k + 0.13 * Math.sin(TWO_PI * (0.7 * v + 0.2 * k)) - 0.1 * v; }, PAL[c], c === 1 ? 2.8 : 1.6, c === 1 ? 1 : 0.75); });
          label(x + IW - 12, y + 52, tx.yours, { align: "right", size: 11, weight: "700", color: PAL[1] });
        },
        function (x, y) {
          for (var l = 0; l < 6; l++) { alpha(0.9); ctx.fillStyle = PAL[[1, 0, 5, 1, 2, 0][l]]; ctx.fillRect(x + 14, y + 80 - l * 8, 30, 6.6); }
          line(x + 50, y + 34, x + 50, y + 86, th.text, 1.2, 0.7); label(x + 58, y + 60, "N", { size: 16, weight: "700", color: th.text });
          label(x + 80, y + 60, tx.nLayers, { size: 11, color: th.text });
        }
      ];
      var inKeys = ["inT", "inW", "inM", "inN"];
      for (var i = 0; i < 4; i++) {
        reveal(u, inT[i], 0.5, function () { card(IX, inY[i], IW, IH); label(IX + 12, inY[i] + 16, tx[inKeys[i]], { size: 12, weight: "700", color: th.text }); drawIn[i](IX, inY[i]); });
        var yy = inY[i] + IH / 2, cols = [[th.R], [th.accent], [PAL[0], PAL[2], PAL[5], PAL[1]], [th.text]][i];
        group(late, function () { stream(u, inT[i] + 0.4, 99, 5, 1.1, function (s, j) { var p = qb({ x: IX + IW, y: yy }, { x: 300, y: yy }, { x: 336, y: 200 + 52 * i + 40 * (rn(51, j, i) - 0.5) }, s); dot(p.x, p.y, 2.6, cols[j % cols.length], 0.9 * clamp((1 - s) * 4, 0, 1)); }); });
      }
      var p = clamp((u - (B[1] + 0.4)) / 5.6, 0, 1);
      reveal(u, 0.2, 0.6, function () {
        alpha(1); ctx.fillStyle = boxFill(); rr(320, 70, 320, 420, 16); ctx.fill(); ctx.strokeStyle = th.accent; ctx.lineWidth = 2.5; ctx.stroke();
        var pulse = u > B[3] ? 0.5 + 0.5 * Math.sin(TWO_PI * (u - B[3]) / 1.8) : 0;
        if (pulse > 0) { alpha(0.25 * pulse); ctx.strokeStyle = th.accent; ctx.lineWidth = 7; rr(316, 66, 328, 428, 19); ctx.stroke(); }
        label(480, 98, "IrisFlow", { align: "center", size: SK ? 25 : 22, weight: SK ? "600" : "700", color: th.text, family: SK ? SERIF : null });
        label(480, 121, tx.oneNet, { align: "center", size: 11 });
        label(340, 146, tx.discrete, { size: 11, weight: "700", color: th.accent }); label(340, 160, tx.mats, { size: 10 });
        label(620, 146, tx.continuous, { align: "right", size: 11, weight: "700", color: th.accent }); label(620, 160, tx.thick, { align: "right", size: 10 });
        for (var l = 0; l < 6; l++) {
          var y = 410 - l * 42, jt = [0.12 + 0.2 * rn(52, l, 0), 0.4 + 0.2 * rn(52, l, 1), 0.68 + 0.18 * rn(52, l, 2)], st = 0;
          for (var k = 0; k < 3; k++) if (p >= jt[k]) st = k + 1;
          var c = st === 3 ? D5[l].c : BANK[Math.floor(rn(53, l, st) * 4)], conf = 0.4 + 0.6 * p;
          alpha(conf); ctx.fillStyle = PAL[c]; rr(340, y - 12, 24, 24, 5); ctx.fill();
          for (k = 0; k < 3; k++) { var dt = p - jt[k]; if (dt >= 0 && dt < 0.08) ring(352, y, 14 + 70 * dt, PAL[c], 2, 1 - dt / 0.08); }
          var x0 = 0.1 + 0.85 * rn(54, l, 0), x1 = D5[l].d / 200, v = lerp(x0, x1, p);
          crisp(function () {
            alpha(1); ctx.fillStyle = th.line; rr(380, y - 5, 240, 10, 5); ctx.fill();
            alpha(p > 0 ? 0.6 + 0.4 * p : 0.5); ctx.fillStyle = p > 0 ? PAL[c] : th.muted; rr(380, y - 5, 240 * v, 10, 5); ctx.fill();
          });
        }
        label(340, 440, tx.clock, { size: 11, color: th.text });
        crisp(function () {
          alpha(1); ctx.fillStyle = th.line; rr(340, 454, 280, 8, 4); ctx.fill(); ctx.fillStyle = th.accent; rr(340, 454, Math.max(8, 280 * p), 8, 4); ctx.fill();
          dot(340 + 280 * p, 458, 6, th.accent, 1); ring(340 + 280 * p, 458, 6, boxFill(), 1.5);
        });
        label(340, 476, tx.noise, { size: 10 }); label(620, 476, tx.design, { size: 10, align: "right" });
      });
      group(ap(u, B[2], 0.5), function () { label(668, 80, tx.pool, { size: 12, weight: "700", color: th.text }); });
      var colX = [668, 726, 784], rowB = [205, 335];
      function pxOf(L) { return Math.min(0.1, 84 / total(L)); }
      reveal(u, 0.6, 0.6, function () { group((1 - ap(u, B[2] + 3, 1)) * 0.5, function () { for (var s2 = 0; s2 < 6; s2++) { alpha(1); ctx.strokeStyle = th.muted; ctx.lineWidth = 1; ctx.setLineDash([3, 3]); rr(colX[s2 % 3] + 0.5, rowB[Math.floor(s2 / 3)] - 84.5, 41, 89, 5); ctx.stroke(); ctx.setLineDash([]); } }); });
      POOL.forEach(function (L, i) {
        var ti = B[2] + 0.3 + 0.45 * i, x = colX[i % 3], yb = rowB[Math.floor(i / 3)];
        stream(u, ti - 0.5, ti, 14, 0.5, function (s) { var q = qb({ x: 640, y: 290 }, { x: 650, y: yb - 40 }, { x: x + 21, y: yb - 30 }, s); dot(q.x, q.y, 2.4, th.accent, 0.85); });
        group(ap(u, ti, 0.4), function () { stack(x, yb, 42, L, pxOf(L), { subH: 5 }); reveal(u, ti + 0.6, 0.3, function () { check(x + 21, yb + 18, 11, th.accent, 1); }); });
      });
      group(ap(u, B[2] + 1.2, 0.5), function () { para(668, 378, tx.verified, 168, { size: 11, color: th.text }); });
      var tSel = B[2] + 3.4, sx = colX[PICK % 3], sb = rowB[Math.floor(PICK / 3)], sh = total(POOL[PICK]) * pxOf(POOL[PICK]);
      reveal(u, tSel, 0.5, function () { alpha(1); ctx.strokeStyle = th.accent; ctx.lineWidth = 2.4; rr(sx - 6, sb - sh - 8, 54, sh + 34, 8); ctx.stroke(); });
      var tDep = tSel + 0.6, film = clamp((u - tDep - 0.8) / 3.2, 0, 1);
      reveal(u, B[2] + 0.2, 0.6, function () {
        chamber(915, 330, film, POOL[PICK], ap(u, tDep, 0.4));
        label(915, 350, tx.chamber, { align: "center", size: 11, color: th.text });
      });
      stream(u, tDep, 99, 8, 0.9, function (s, j) { var q = qb({ x: sx + 48, y: sb - sh / 2 }, { x: 852, y: sb - sh / 2 - 60 }, { x: 872, y: 200 }, s); dot(q.x, q.y, 2.6, PAL[POOL[PICK][j % POOL[PICK].length].c], 0.9 * clamp((1 - s) * 5, 0, 1)); });
      stream(u, tDep + 0.8, 99, 12, 0.9, function (s, j) { var q = lp({ x: 915 + 14 * (rn(55, j, 0) - 0.5), y: 310 }, { x: 915 + 40 * (rn(55, j, 1) - 0.5), y: 202 }, s); dot(q.x, q.y, 2, PAL[POOL[PICK][Math.min(POOL[PICK].length - 1, Math.floor(film * POOL[PICK].length))].c], 0.75 * (1 - s)); });
      var cw = tx.chips.map(function (s) { return measure(s, 12, "600") + 34; }), gapC = 14, sum = cw.reduce(function (a, b) { return a + b; }, 0) + gapC * 3, cx = 500 - sum / 2;
      tx.chips.forEach(function (s, k) { var mx = cx + cw[k] / 2; reveal(u, B[2] + 4.6 + 0.35 * k, 0.4, function () { chip(mx, 522, s, th.accent, true, 1); }); cx += cw[k] + gapC; });
    }

    var SCENES = [scene1, scene2, scene3, scene4, scene5];
    function narrFor(lg, i, b) { var t = TXT[lg], s = t.narr[i][b]; return s == null ? t.end[video ? "video" : "web"] : s; }
    /* the caption box is sized for the longest caption of the current language, so it never resizes while playing */
    function allNarr() { var out = []; TXT[lang].narr.forEach(function (ch, i) { ch.forEach(function (s, b) { out.push(esc(narrFor(lang, i, b))); }); }); return out; }

    function render() {
      if (!ctx) return; th = theme(container);
      var dpr = window.devicePixelRatio || 1; ctx.setTransform(scale * dpr, 0, 0, scale * dpr, 0, 0); ctx.clearRect(0, 0, W, H);
      var loc = locate(T), c = CS[loc.i], fade = (loc.i > 0 ? ap(loc.u, 0, 0.4) : 1) * (loc.i < CS.length - 1 ? 1 - ap(loc.u, c.dur - 0.4, 0.4) : 1);
      A = fade; ctx.lineCap = "butt"; ctx.setLineDash([]);
      if (SK) {
        ctx.boil = reduceMotion ? 0 : Math.floor(T * 6);
        if (!ctx.inkPat || paperDark !== th.dark) {
          var g = ctx.raw, kind = th.dark ? "light" : "dark"; paperDark = th.dark; container.style.backgroundImage = grainURL(kind);
          ctx.inkPat = g.createPattern(grainTile("ink"), "repeat"); ctx.paperPat = g.createPattern(grainTile(kind), "repeat");
          ctx.paperPat.setTransform(new DOMMatrix().scale(1 / scale)); /* one grain pixel per CSS pixel, as in the page background */
          g.fillStyle = th.bg; ctx.paper = g.fillStyle;
        }
      }
      dot(40, 34, 14, th.accent, 1); label(40, 34.5, String(loc.i + 1), { align: "center", size: 14, weight: "700", color: th.dark && SK ? th.bg : "#fff" });
      label(64, 35, tx.titles[loc.i], SK ? { size: 22, weight: "600", color: th.text, family: SERIF } : { size: 20, weight: "700", color: th.text });
      SCENES[loc.i](loc.u, c.beats);
      A = 1; ctx.globalAlpha = 1;
      var html = esc(narrFor(lang, loc.i, loc.b));
      if (html !== lastNarr) { narr.innerHTML = html; lastNarr = html; }
      chBtns.forEach(function (bt, i) { var pc = i < loc.i ? 100 : i > loc.i ? 0 : 100 * loc.u / CS[i].dur; bt.style.setProperty("--p", pc.toFixed(1) + "%"); });
      if (loc.i !== lastCh) { lastCh = loc.i; chBtns.forEach(function (bt, i) { if (i === loc.i) bt.setAttribute("aria-current", "step"); else bt.removeAttribute("aria-current"); }); }
    }
    function setPlayLabel() { playBtn.textContent = playing ? tx.pause : T >= TOTAL ? tx.replay : tx.play; }
    function setLang(lg, store) {
      lang = lg; tx = TXT[lg]; container.lang = lg === "zh" ? "zh-CN" : "en";
      chBtns.forEach(function (b, i) { b.innerHTML = "<b>" + (i + 1) + "</b>" + esc(tx.short[i]); });
      Object.keys(langBtns).forEach(function (k) { langBtns[k].setAttribute("aria-pressed", k === lg ? "true" : "false"); });
      setPlayLabel(); lastNarr = null;
      if (store) { try { localStorage.setItem("if-story-lang", lg); } catch (e) { /* private mode */ } }
      if (ctx) layout();
    }
    function frame(ts) {
      if (lastTs == null) lastTs = ts; var dt = Math.min(0.05, (ts - lastTs) / 1000); lastTs = ts;
      if (playing) { T += dt; if (T >= TOTAL) { T = TOTAL; playing = false; setPlayLabel(); } }
      render();
      if (visible && playing) requestAnimationFrame(frame); else { looping = false; lastTs = null; }
    }
    function kick() { if (!looping && visible && playing && !frozen) { looping = true; lastTs = null; requestAnimationFrame(frame); } }
    /* with reduced motion a chapter opens on its finished picture */
    function jump(i) { T = CS[i].t0 + (reduceMotion ? CS[i].dur - 0.5 : 0); if (!reduceMotion) playing = true; setPlayLabel(); render(); kick(); }
    playBtn.addEventListener("click", function () { if (!playing && T >= TOTAL) T = 0; playing = !playing; setPlayLabel(); render(); kick(); });

    function layout() {
      var w;
      if (video) {
        var pad = 16; w = window.innerWidth - 2 * pad;
        for (var it = 0; it < 3; it++) { narr.style.width = w + "px"; reserveHeight(narr, allNarr()); w = Math.floor(Math.min(window.innerWidth - 2 * pad, (window.innerHeight - narr.getBoundingClientRect().height - 3 * pad) * W / H)); }
        narr.style.width = w + "px";
      } else w = Math.max(760, widthOf(scroller, W));
      scale = w / W; ctx = setupCanvas(canvas, w, H * scale);
      if (SK) ctx = sketchCtx(ctx);
      reserveHeight(narr, allNarr());
      var labels = []; Object.keys(TXT).forEach(function (lg) { labels.push(TXT[lg].play, TXT[lg].pause, TXT[lg].replay); }); reserveWidth(playBtn, labels);
      render();
    }

    var hm = /^#why=(\d+(?:\.\d+)?)((?:,(?:en|zh|video|sketch|clean))*)$/.exec(location.hash || "");
    if (hm) {
      frozen = true; playing = false; video = /video/.test(hm[2]); if (/zh/.test(hm[2])) lang = "zh"; else if (/en/.test(hm[2])) lang = "en";
      if (video) container.classList.add("if-story-video"); else container.style.cssText = "position:fixed;top:0;left:0;right:0;z-index:99999;margin:0;border-radius:0";
      T = clamp(parseFloat(hm[1]), 0, TOTAL);
      window.__ifStorySeek = function (t, lg) { if (lg && lg !== lang) setLang(lg); T = clamp(t, 0, TOTAL); render(); return TOTAL; };
    }
    setLang(lang, false); layout();
    if ("ResizeObserver" in window && !video) new ResizeObserver(layout).observe(scroller);
    if (document.fonts) document.fonts.ready.then(layout);
    if ("MutationObserver" in window) new MutationObserver(render).observe(document.documentElement, { attributes: true, attributeFilter: ["data-theme"] });
    if (frozen) return;
    if (reduceMotion) T = CS[0].dur - 0.5;
    if ("IntersectionObserver" in window) new IntersectionObserver(function (es) { es.forEach(function (en) { visible = en.isIntersecting; if (visible) kick(); }); }, { threshold: 0.25 }).observe(container);
    else { visible = true; kick(); }
  }

  function boot() { document.querySelectorAll("[data-if-story]").forEach(initStory); }
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", boot); else boot();
})();
