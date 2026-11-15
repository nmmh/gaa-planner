# GAA Match Planner

A one-page planner for underage hurling and gaelic football coaches: keep a panel, tick who's here, set the formation, and get a fair substitution plan by quarter.

**Open it:** https://nmmh.github.io/gaa-planner/

- Everything is stored on your own phone (browser storage). No player data is uploaded or kept in this repository.
- **Send to another phone** (share button) creates a link to your plan. They can save it to their Plans or replace their current plan with it.
- **Load ClubZap RSVP report** reads a ClubZap RSVP `.csv` to build the panel or tick who's coming.

To update the app, replace `index.html` and push to `main`.

## Test version

`test/index.html` is a trial copy at https://nmmh.github.io/gaa-planner/test/ (red TEST badge). It keeps its own saved data, so trying things there never touches the live page. Changes go to the test copy first; to release, copy `test/index.html` over `index.html`.

## Versions

Still in development (0.x). The bottom of the page shows the version and the commit it was published from, linked to that commit here. See [help.md](help.md) for how to use it.

- **v0.10** — Throw-in and meet-up times (meet-up defaults to 30 min before; shown on the Plan tab, picture and WhatsApp text; ClubZap start time fills throw-in). 📁 Plans moved to the title bar beside a labelled Share button. Wand reads Suggest team / Re-shuffle. Three-line B / 🔒 / ⏱ key. Start a new match moved into Saved plans. Saving blocked when there's nothing to save. Tap anywhere on a substitution row to tick it. UI polish: heading fonts, 40px tap targets, pitch badges no longer cover names, better outdoor contrast.
- **v0.9** — **B now means rotation player:** B players share the bench places and everyone unmarked plays the whole match (when more are marked B than there are bench places; otherwise B starts on the bench and everyone rotates, with a warning). Live line on Here today shows how many B players share how many places. Warning when a B player gets under half a match. Removed the "On this phone" label and the Image button (use the share menu → Pitch as a picture).
- **v0.8** — Picture is now the pitch exactly as on screen (heading, boxes with their sub/position-change lines, bench) for the period you're viewing; the separate Changes list and the Whole plan / All quarters options are gone. Opening a link no longer previews: choose **Save to Plans** (keeps your plan) or **Replace my current plan** (auto-saved first, ↶ to undo). Only players in the sender's plan are added to your panel. Screen and picture are drawn from the same data, with a test that their text matches.
- **v0.7.1** — A position swap now sticks for the rest of the match even when one of the two players is subbed later (the sub comes on in the spot of the player they replace). Send-to-phone wording updated for previews. No false "Saved" message if the phone can't store it.
- **v0.7** — Saved plans (📁 Plans): save, open and delete named versions per match on this phone; auto-save before 🪄, opening a plan, saving a copy or a new match (last 5 kept). Links now open as a read-only **preview** with **Save a copy** (players matched by name, missing ones added) and **Back to mine**; nothing changes until you save.
- **v0.6** — Picture: **Whole plan** (starting team, subs, every change under its minute) is the default; this quarter / all quarters still available. Swapping two pitch players now changes positions only, never who sits out later. Sub ticks survive edits. Pitch labels use minutes when change times aren't quarters. Wand evens minutes better when change times are uneven. Undo history clears when you load a link. Automated tests in `tests/` (`npm install && npm test`).
- **v0.5** — Renamed **GAA Match Planner**. Nothing is placed automatically until you press the 🪄 wand (top left of the pitch); then tweak by hand with ↶ undo / ↷ redo (top right). Your adjustments section removed (undo/redo replaces it). Pitch as a picture (one quarter or all four) to share to WhatsApp. 🔒 replaces ⚓ for "stays in position"; **B** (sub, starts on the bench) is back; core (©) and per-quarter Off picks removed. Subs default to no limit. Team size and formation live on the Plan tab; sub settings on Here today. Help link in the footer.
- **v0.4** — Pick which quarter(s) each player sits out (commit 709271c, shown in-app as v1.3).
- **v0.3** — © core players; ⚓ position lock; list-first Panel tab; share menu (commit 5496de0, in-app v1.2).
- **v0.2** — Your adjustments section; version in footer (commits acccd77, bc82b66, in-app v1.1).
- **v0.1** — First version: panel, attendance, ClubZap RSVP import, equal-time quarters, tap/drag swaps, send to another phone (commit 69e3733).
