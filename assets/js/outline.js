/* Page outline in the style of Notion's line table of contents. Collapsed, it is a column of short lines
   fixed at the right edge, one per heading (shorter for sub-headings), with the current section's line
   darkened; hovering it, or tabbing into it, opens the full list. Entries are the page title plus the
   article's h2/h3 headings. A heading's data-toc attribute overrides its label, and each entry links to
   the heading's id or, failing that, to its nearest ancestor with an id. Vanilla JS, no dependencies. */
(function () {
  "use strict";
  function slug(s) { return s.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "") || "section"; }
  function labelOf(h) {
    if (h.hasAttribute("data-toc")) return h.getAttribute("data-toc");
    return h.textContent.trim().replace(/\s+/g, " ");
  }

  function init() {
    var article = document.querySelector(".post article");
    if (!article) return;
    var items = [], title = document.querySelector(".post .post-title");
    if (title) items.push({ label: labelOf(title), level: 1, el: title, id: "" });
    article.querySelectorAll("h2, h3").forEach(function (h) {
      if (h.closest(".publications, .if-idea, .if-pipeline, .if-studio")) return;
      var holder = h.id ? h : h.closest("[id]");
      if (!holder || !article.contains(holder)) { h.id = slug(labelOf(h)); holder = h; }
      items.push({ label: labelOf(h), level: h.tagName === "H3" ? 2 : 1, el: holder, id: holder.id });
    });
    if (items.length < 3) return;

    var nav = document.createElement("nav"), rail = document.createElement("div"), panel = document.createElement("div");
    nav.className = "toc-lines"; nav.setAttribute("aria-label", "Outline");
    rail.className = "toc-rail"; rail.setAttribute("aria-hidden", "true");
    panel.className = "toc-panel";
    items.forEach(function (it, i) {
      var line = document.createElement("span"), a = document.createElement("a");
      var lvl = it.level === 2 ? "toc-l2" : "toc-l1"; /* written out in full so PurgeCSS keeps the rules */
      line.className = "toc-line " + lvl;
      a.className = "toc-item " + lvl; a.textContent = it.label; a.title = it.label;
      a.href = it.id ? "#" + it.id : location.pathname; a.setAttribute("data-i", i);
      rail.appendChild(line); panel.appendChild(a);
      it.line = line; it.link = a;
    });
    nav.appendChild(rail); nav.appendChild(panel); document.body.appendChild(nav);

    var reduce = window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    panel.addEventListener("click", function (e) {
      var a = e.target.closest("a.toc-item"); if (!a) return;
      e.preventDefault();
      var it = items[+a.getAttribute("data-i")], behavior = reduce ? "auto" : "smooth";
      if (it.id) { it.el.scrollIntoView({ behavior: behavior, block: "start" }); history.replaceState(null, "", "#" + it.id); }
      else { window.scrollTo({ top: 0, behavior: behavior }); history.replaceState(null, "", location.pathname + location.search); }
      if (e.detail) a.blur(); /* a mouse click should not keep the list open through focus */
    });

    /* the current section is the last one whose heading has passed a line near the top of the window */
    var current = -1, queued = false;
    function update() {
      queued = false;
      var mark = Math.min(window.innerHeight * 0.3, 240), act = 0, doc = document.documentElement;
      for (var i = 1; i < items.length; i++) if (items[i].el.getBoundingClientRect().top <= mark) act = i;
      if (window.innerHeight + window.scrollY >= doc.scrollHeight - 4) act = items.length - 1;
      if (act === current) return;
      if (current >= 0) { items[current].line.classList.remove("active"); items[current].link.classList.remove("active"); items[current].link.removeAttribute("aria-current"); }
      current = act;
      items[act].line.classList.add("active"); items[act].link.classList.add("active"); items[act].link.setAttribute("aria-current", "true");
    }
    function queue() { if (!queued) { queued = true; requestAnimationFrame(update); } }
    window.addEventListener("scroll", queue, { passive: true });
    window.addEventListener("resize", queue);
    update();
  }

  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", init); else init();
})();
