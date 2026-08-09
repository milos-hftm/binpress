# Codex Instructions For BinPress Website

## Project

- This repo is a static German one-page website for the HFTM BinPress project.
- GitHub Pages serves the site from the repository root on `main`.
- Main files: `index.html`, `style.css`, `script.js`, `viewer.js`, and `assets/`.
- There is no package manager, bundler, or build step. Do not add one unless the user explicitly asks for it.

## Local Preview

- Preferred preview command from the repo root:

```bash
python -m http.server 8000
```

- Open `http://localhost:8000`.
- If port `8000` is occupied, use the next free port and report it.
- Opening `index.html` directly is acceptable for quick checks, but use a local server for video, WebGL, browser-console, and asset-path verification.

## Verification

- For UI or behavior changes, verify the page in a real browser before finishing.
- Check at least one desktop viewport and one narrow mobile viewport for layout, navigation, theme toggle, overflow, and readable text.
- For JavaScript changes, check the browser console for errors.
- For changes touching `viewer.js` or the 3D section, verify that the model loads or that the fallback/explosion view remains usable.
- In the final response, state which checks were run and mention anything not verified.

## Content Rules

- Keep public copy in German unless the user asks otherwise.
- Preserve the distinction between measured facts, design assumptions, goals, requirements, and values still awaiting prototype tests.
- Do not invent validated test results, contacts, team roles, prices, or launch claims.
- Keep AI-generated product imagery clearly labeled as `KI-Visualisierung`.
- Treat `README.md` and `ANPASSUNGEN.txt` as source-of-truth notes before changing technical or project-status copy.

## Design And Code Style

- Preserve the static HTML/CSS/vanilla JS architecture.
- Reuse existing CSS custom properties, spacing patterns, and component class naming.
- Keep the site product-focused and engineering-marketing oriented, not a generic landing page.
- Maintain responsive behavior, accessible labels, keyboard-friendly controls, and `prefers-reduced-motion` support.
- Avoid decorative dependencies or external UI frameworks for small changes.
- Keep `viewer.js` standalone and free of external runtime dependencies unless explicitly requested.

## Git Safety

- Check `git status --short` before editing when starting substantial work.
- Do not revert or overwrite changes that were not made by Codex in the current task.
- Avoid destructive git commands unless the user explicitly asks for them.
