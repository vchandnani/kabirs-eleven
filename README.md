# Kabir's Eleven

Kabir's Eleven is a lightweight cricket management web app for:
- Managing players (create, edit, delete)
- Managing teams (create, edit, delete) with roster validation
- Managing matches between teams with batter runs, bowler wickets, team totals, and winner tracking

Data is persisted in browser `localStorage` (no backend required).

## Quick Start (Under 15 Minutes)

1. Install prerequisites (see below).
2. Clone the repo.
3. Install Node dependencies.
4. Start a static local server.
5. Open the app in your browser.

```bash
git clone https://github.com/vchandnani/kabirs-eleven.git
cd kabirs-eleven
npm install
python3 -m http.server 4173
```

Open: [http://127.0.0.1:4173](http://127.0.0.1:4173)

## Prerequisites

Required:
- `Node.js` 22.x (validated with Node `v22.9.0`)
- `npm` 11.x (validated with npm `11.9.0`)
- `Python` 3.x (for local static hosting via `python3 -m http.server`)

Recommended:
- `git` latest stable
- A modern browser (Chrome, Edge, Safari, or Firefox)

## Local Development

### 1. Install dependencies

```bash
npm install
```

### 2. Run the app locally

```bash
python3 -m http.server 4173
```

Then open [http://127.0.0.1:4173](http://127.0.0.1:4173).

### 3. Run automated tests

```bash
npm test
```

### 4. Run coverage checks (with thresholds)

```bash
npm run test:coverage
```

## Testing and Coverage

[![Coverage CI](https://github.com/vchandnani/kabirs-eleven/actions/workflows/coverage.yml/badge.svg?branch=main)](https://github.com/vchandnani/kabirs-eleven/actions/workflows/coverage.yml)

- Hosted browser coverage report: [https://vchandnani.github.io/kabirs-eleven/](https://vchandnani.github.io/kabirs-eleven/)
- Each GitHub Actions run also uploads `coverage-html` as a downloadable artifact.
- Coverage thresholds are enforced in CI (`lines`, `functions`, and `branches`).

## Technical Qualification Card

The `qual-card/` directory contains onboarding artifacts designed to bring a new developer up to speed quickly:

- System architecture diagram:
  - [system-architecture-diagram.pdf](/Users/vishalchandnani/dev/kabirs-eleven/qual-card/system-architecture-diagram.pdf)
- Capability deep-dives (one page each):
  - [manage-players-capability.pdf](/Users/vishalchandnani/dev/kabirs-eleven/qual-card/manage-players-capability.pdf)
  - [manage-teams-capability.pdf](/Users/vishalchandnani/dev/kabirs-eleven/qual-card/manage-teams-capability.pdf)
  - [manage-matches-capability.pdf](/Users/vishalchandnani/dev/kabirs-eleven/qual-card/manage-matches-capability.pdf)
- Regenerators for these PDFs:
  - [generate_architecture_pdf.py](/Users/vishalchandnani/dev/kabirs-eleven/qual-card/generate_architecture_pdf.py)
  - [generate_capability_guides.py](/Users/vishalchandnani/dev/kabirs-eleven/qual-card/generate_capability_guides.py)

## Project Structure

```text
.
├── index.html                # Main UI layout
├── styles.css                # Styling and responsive layout
├── app.js                    # UI behavior + localStorage wiring
├── player-validation.js      # Player validation rules
├── team-validation.js        # Team validation rules
├── match-validation.js       # Match parsing, totals, and winner logic
├── test/
│   ├── app-ui.test.js        # Integration-style UI tests (jsdom)
│   ├── player-validation.test.js
│   ├── team-validation.test.js
│   └── match-validation.test.js
└── .github/workflows/
    └── coverage.yml          # CI tests + coverage publishing
```

## Troubleshooting

- If port `4173` is busy, run on another port:
  - `python3 -m http.server 4174`
- If stale `localStorage` data affects testing, clear site data in browser dev tools.
- If coverage site returns 404, ensure GitHub Pages source is set to **GitHub Actions** in repository settings.

## Notes for New Developers

- This project intentionally avoids backend complexity for fast onboarding.
- Core business rules are in validation modules so behavior is testable and easy to extend.
- UI tests use `jsdom`, while unit tests cover validation and scoring logic.
