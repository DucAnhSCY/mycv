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
- `style.css`: colors, layout, responsive breakpoints, reduced-motion support and print styles.
- `script.js`: accessible mobile navigation, section tracking, project filters and native printing.
- `favicon.svg`: portfolio icon.

**Save CV** opens the browser's print dialog; choose **Save as PDF** to export. The print layout includes every project even if a category filter is active. Main content and navigation also remain available without JavaScript.

## Publishing

The existing GitHub Actions workflow deploys the static files to GitHub Pages when changes are merged into `main`.

## Research project attribution

[WindowsBehaviorMonitor](https://github.com/zyond26/WindowsBehaviorMonitor) is a team internship research project. Phùng Đức Anh contributed its Process & Memory Monitoring (PMM) module; the portfolio distinguishes that contribution from the tool's overall scope.
