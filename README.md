# Phùng Đức Anh — Portfolio

A responsive, static CV and portfolio for cybersecurity research and backend development. Built with HTML, CSS and vanilla JavaScript; no build step or application dependencies are required.

## Preview locally

Open `index.html` directly, or serve the repository with Python:

```sh
python -m http.server 8000 --bind 127.0.0.1
```

Then visit `http://127.0.0.1:8000`.

## Editing

- `index.html`: profile, experience, five projects, skills, education, credentials and contact details.
- `style.css`: portfolio colors, layout, responsive breakpoints and reduced-motion support.
- `resume.css`: the dedicated one-page A4 CV used when printing or exporting.
- `script.js`: accessible mobile navigation, section tracking and project filters.
- `assets/phung-duc-anh-cv.pdf`: the downloadable, one-page CV.
- `scripts/export-cv.cjs`: generates the PDF and rejects multi-page or overflowing layouts.
- `favicon.svg`: portfolio icon.

**Download CV** downloads the ready-made one-page PDF directly, including when JavaScript is disabled. Browser printing uses the same concise CV rather than the full portfolio. The CV is independent of project filters and includes WindowsBehaviorMonitor under internship experience plus the four other projects.

## Update the downloadable CV

Edit the `.resume-document` article in `index.html` and, if needed, its print layout in `resume.css`. Keep shared profile facts consistent with the website. Then regenerate the PDF:

```sh
npm ci
npx playwright install chromium
npm run export:cv
```

To use an installed Chrome browser instead, set `CV_BROWSER_CHANNEL=chrome` before running the export command. In PowerShell: `$env:CV_BROWSER_CHANNEL = 'chrome'`.

The exporter renders at 100% scale with 12 mm margins, checks content overflow, and requires exactly one A4 page before writing `assets/phung-duc-anh-cv.pdf`. A local review copy is also written to `output/pdf/Phung-Duc-Anh-CV.pdf` (ignored by Git). Review the PDF visually and commit the updated downloadable asset together with the source changes. Export dependencies are only needed for this maintenance step; the website itself remains static.

## Publishing

The existing GitHub Actions workflow deploys the static files to GitHub Pages when changes are merged into `main`.

## Research project attribution

[WindowsBehaviorMonitor](https://github.com/zyond26/WindowsBehaviorMonitor) is a team internship research project. Phùng Đức Anh contributed its Process & Memory Monitoring (PMM) module; the portfolio distinguishes that contribution from the tool's overall scope.
