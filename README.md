# GAA Match Planner

A one-page planner for underage hurling and gaelic football coaches: keep a panel, tick who's here, set the formation, and get a fair substitution plan by quarter.

**Open it:** https://nmmh.github.io/gaa-planner/

- Everything is stored on your own phone (browser storage). No player data is uploaded or kept in this repository.
- **Send to another phone** (share button) creates a link that loads the whole setup (panel, attendance, formation, subs) on another mentor's phone.
- **Load ClubZap RSVP report** reads a ClubZap RSVP `.csv` to build the panel or tick who's coming.

To update the app, replace `index.html` and push to `main`.

## Versions

Still in development (0.x). The bottom of the page shows the version and the commit it was published from, linked to that commit here. See [help.md](help.md) for how to use it.

- **v0.5** — Renamed **GAA Match Planner**. Nothing is placed automatically until you press the 🪄 wand (top left of the pitch); then tweak by hand with ↶ undo / ↷ redo (top right). Your adjustments section removed (undo/redo replaces it). Pitch as a picture (one quarter or all four) to share to WhatsApp. 🔒 replaces ⚓ for "stays in position"; **B** (sub, starts on the bench) is back; core (©) and per-quarter Off picks removed. Subs default to no limit. Team size and formation live on the Plan tab; sub settings on Here today. Help link in the footer.
- **v0.4** — Pick which quarter(s) each player sits out (commit 709271c, shown in-app as v1.3).
- **v0.3** — © core players; ⚓ position lock; list-first Panel tab; share menu (commit 5496de0, in-app v1.2).
- **v0.2** — Your adjustments section; version in footer (commits acccd77, bc82b66, in-app v1.1).
- **v0.1** — First version: panel, attendance, ClubZap RSVP import, equal-time quarters, tap/drag swaps, send to another phone (commit 69e3733).
