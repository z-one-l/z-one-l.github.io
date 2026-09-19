# z-one-l.github.io

Personal academic website of Zhiyi Li, built on the [al-folio](https://github.com/alshedivat/al-folio) Jekyll starter (v1.x, gem-based runtime).

The home page is built around [IrisFlow](https://z-one-l.github.io/#irisflow): after a short bio, it shows four animated, interactive schematics of how the model works (an advantages map, the coupling of the two flows, the data pipeline and a four-step design studio), drawn by `assets/js/irisflow/irisflow.js`.

## Local preview

```bash
docker compose up -d      # then open http://localhost:8080/
docker compose down
```

## Deploy

Push to `main`. The `deploy.yml` workflow builds the site and publishes it to the `gh-pages` branch; GitHub Pages must be set to serve from `gh-pages`.

## Where content lives

- `_pages/about.md` — home page: bio and the IrisFlow sections
- `_projects/irisflow.md` — project card only; the page redirects to the home page's IrisFlow section
- `_projects/fp-acoustic.md` — Fabry–Pérot acoustic sensing
- `_bibliography/papers.bib` — papers (the IrisFlow entry is listed on the home page)
- `_data/socials.yml` — contact links
- `assets/js/irisflow/`, `assets/css/irisflow.css` — interactive demo code
- `assets/js/outline.js`, `assets/css/outline.css` — Notion-style line outline at the right edge of the home page (any page can include it)
- `assets/img/irisflow/` — project card and link-preview image (a frame of the pipeline animation)
