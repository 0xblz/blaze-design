# blaze-design

Personal portfolio site built with Jekyll, hosted on GitHub Pages.

## Stack

- **Jekyll** static site generator (Ruby)
- **SCSS** for styles (`assets/css/style.scss`) — compiled by Jekyll's built-in Sass pipeline
- **Vanilla JS** (`assets/js/gallery.js`) — handles card flip, 3D tilt, color picker, lightbox gallery, and share
- **Font Awesome** via kit CDN for icons
- **Google Fonts** — Archivo Black (headings) + Manrope variable (body, 200–800)

## Project Structure

```
_config.yml          — Jekyll config, plugins, defaults
_layouts/default.html — Base HTML layout (head, meta, OG tags, scripts)
_includes/
  gallery.html       — Lightbox markup + gallery image array (Liquid)
  analytics.html     — Analytics snippet
index.html           — Main page content (front matter + card markup)
assets/
  css/style.scss     — All styles (design tokens, card, guides, lightbox, responsive)
  js/gallery.js      — All JS (flip, tilt, share, lightbox)
  images/            — Avatar, project SVGs, favicon, OG image, gallery images
llms.txt             — LLM-readable site summary
```

## Architecture

### Business Card UI
The site is a single-page centered business card with a 3D flip interaction:
- **Front face** (`.card-front`): white in light mode, dark (`#111`) in dark mode. Holographic glow (`::before`, multiply/screen blend) and dot pattern (`::after`, dark/white dots) adapt per theme. Share button top-right
- **Back face** (`.card-back`): colored surface with soft white glow (`::after`) on hover, paper grain texture (`::before`), gallery button top-right, color picker on right edge
- **Color picker** (`.color-picker`): 3 dot buttons on the card back right edge — blue (`#2563eb`), pink (`#db2777`), purple (`#7c3aed`). Sets `data-color` attribute on `.card-back`, CSS applies colors via `[data-color]` selectors
- Clicking the card toggles `.flipped` class (rotateY 180deg)
- `.card-frame` provides perspective; `.card` handles flip + tilt transforms

### 3D Tilt Effect (desktop only)
- Mousemove on `.card-frame` applies `rotateX`/`rotateY` to `.card` via JS
- Dynamic shadow shifts opposite to tilt direction
- CSS custom properties `--mx`, `--my`, `--angle` set on `.card` for cursor-relative glow/dot effects on both faces
- Guarded by `(hover: hover)` media query — no tilt on touch devices
- Tilt composes with flip by building the full transform string in JS

### Guide Lines
Four 1px lines (`.guide` elements) positioned absolutely on `.card-frame`, extending to viewport edges:
- Two vertical lines aligned to card left/right edges
- Two horizontal lines aligned to card top/bottom edges
- Creates a print/architectural crop-mark aesthetic

### Theming
- Light/dark mode via `prefers-color-scheme` + manual toggle via `data-theme` attribute on `<html>`
- Theme toggle button (`.theme-toggle`) fixed top-right, swaps sun/moon FA icon
- `data-theme="light|dark"` overrides system preference — token blocks in CSS mirror the `@media` blocks
- Card front: white (`--card-bg`) in light, dark (`#111`) in dark. Text uses `--text`/`--text-muted` tokens
- Card front effects adapt: dark dots + multiply blend in light, white dots + screen blend in dark
- Card back: colored surface (blue/pink/purple) — same in both modes
- Front accent border uses `--accent` (from color picker) in dark mode, `--border` in light
- Description tagline (`.page-tagline`) sits at page bottom as fine print

### Lightbox Gallery
- Images sourced from `/assets/images/gallery/` via Liquid `site.static_files`
- Gallery link opens lightbox at first image
- Keyboard nav (arrows, Escape), touch swipe, crossfade transitions

## Build & Serve

```sh
bundle exec jekyll build
bundle exec jekyll serve
```

## Key Conventions

- Styles use CSS custom properties for design tokens (colors, shadows)
- SCSS nesting for component scoping (`.card-front { h1 { ... } }`)
- All JS in one file, no build step, no dependencies
- Front matter `js: gallery` loads the JS file via the layout
- Front matter `standalone: true` bypasses the `<main>` wrapper and default stylesheet
- `aspect-ratio: 1.75` on desktop for business card proportions; `1.5` on mobile
