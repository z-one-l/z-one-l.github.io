# Site notes for coding agents

This is a personal site built on al-folio v1.x. Layouts, includes and Sass come from the `al_folio_*` gems pinned in `Gemfile`; this repo only holds content, config and site-specific assets. Local `_layouts/`, `_includes/` or `_sass/` files would override gem files and are allowed here, but none exist yet.

- Preview: `docker compose up -d` → http://localhost:8080/ (config edits restart Jekyll automatically).
- The interactive IrisFlow demos are plain JS/CSS in `assets/js/irisflow/irisflow.js` and `assets/css/irisflow.css`; they live on the home page (`_pages/about.md`), which opts in with `data-if-map`, `data-if-idea="joint"`, `data-if-pipeline` and `data-if-studio`. `_projects/irisflow.md` only redirects there.
- Panels must keep a constant height while they animate (text that changes is given a reserved height via `reserveHeight` / `reserveWidth`), so content below never jumps.
- The home page includes a Notion-style line outline (`assets/js/outline.js`, `assets/css/outline.css`) built from the page title and the article's h2/h3; `data-toc` on a heading overrides its label. It hides below 1100px viewport width.
- `protect_email: true`: this theme version does not pass the home page's contact icons through `al_email_protect`, so `_pages/about.md` sets `social: false` and renders them itself with the `al_email_protect_html` filter; `socials_in_search: false` keeps a percent-encoded copy out of the search box. Built pages must never contain the address whole or a `mailto:`.
- Commits in this repo carry no AI co-author trailer (owner's request).
- `jekyll-terser` minifies JS under `assets/` and drops `console.*` calls in production builds.
- Site URL is the root of `https://z-one-l.github.io` (`baseurl` is empty). Always build links with `relative_url`.
