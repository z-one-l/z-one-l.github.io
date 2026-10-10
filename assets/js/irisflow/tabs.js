/* Tabs for the "How it works" panels on /irisflow/: one panel shows at a time. A URL hash naming a panel
   (#if-map, #if-joint, #if-inside, #if-studio) or one of the panels' frozen-frame hooks (#map=…, #joint=…,
   #pipe=…, #studio-demo=…) opens that tab, and so do in-page links to a panel. The panels lay themselves out
   again when they become visible (they watch their own size), so hidden ones need no extra handling. */
(function () {
  "use strict";
  var bar = document.querySelector("[data-site-tabs]");
  if (!bar) return;
  var tabs = Array.prototype.slice.call(bar.querySelectorAll('[role="tab"]'));
  var ids = tabs.map(function (t) { return t.getAttribute("aria-controls"); });
  var HOOKS = { "map=": "if-map", "joint=": "if-joint", "pipe=": "if-inside", "studio-demo=": "if-studio" };

  function show(id) {
    tabs.forEach(function (t) {
      var on = t.getAttribute("aria-controls") === id;
      t.setAttribute("aria-selected", on ? "true" : "false");
      t.tabIndex = on ? 0 : -1;
      document.getElementById(t.getAttribute("aria-controls")).hidden = !on;
    });
  }

  function panelFor(hash) {
    var h = (hash || "").replace(/^#/, "");
    if (ids.indexOf(h) >= 0) return h;
    for (var k in HOOKS) if (h.indexOf(k) === 0) return HOOKS[k];
    return null;
  }

  function open(id, scroll) {
    show(id);
    if (scroll) document.getElementById(id).scrollIntoView({ block: "start" });
  }

  tabs.forEach(function (t, i) {
    t.addEventListener("click", function () {
      var id = t.getAttribute("aria-controls");
      show(id);
      history.replaceState(null, "", "#" + id);
    });
    t.addEventListener("keydown", function (e) {
      var j = { ArrowRight: i + 1, ArrowLeft: i - 1, Home: 0, End: tabs.length - 1 }[e.key];
      if (j === undefined) return;
      e.preventDefault();
      var next = tabs[(j + tabs.length) % tabs.length];
      next.focus();
      next.click();
    });
  });

  // links between panels, e.g. "Watch a new material join the data pipeline"
  document.addEventListener("click", function (e) {
    var a = e.target.closest && e.target.closest('a[href^="#"]');
    var id = a && panelFor(a.getAttribute("href"));
    if (!id) return;
    e.preventDefault();
    open(id, true);
    history.replaceState(null, "", "#" + id);
  });

  window.addEventListener("hashchange", function () {
    var id = panelFor(location.hash);
    if (id) open(id, true);
  });
  var first = panelFor(location.hash);
  if (first) open(first, location.hash.indexOf("=") < 0);
})();
