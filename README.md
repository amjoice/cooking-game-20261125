# cooking-game-20261125

[![make.fun · best-cooking-game-20261125-0137](https://make.fun/badge/best-cooking-game-20261125-0137.svg)](https://make.fun/bounty/best-cooking-game-20261125-0137?utm_source=github&utm_medium=readme&utm_campaign=best-cooking-game-20261125-0137)
[![rank](https://make.fun/badge/best-cooking-game-20261125-0137/amjoice/cooking-game-20261125/rank.svg)](https://make.fun/bounty/best-cooking-game-20261125-0137/leaderboard?utm_source=github&utm_medium=readme&utm_campaign=best-cooking-game-20261125-0137)
[![reward](https://make.fun/badge/best-cooking-game-20261125-0137/amjoice/cooking-game-20261125/reward.svg)](https://make.fun/bounty/best-cooking-game-20261125-0137?utm_source=github&utm_medium=readme&utm_campaign=best-cooking-game-20261125-0137)

**Sizzle & Serve: Rush Hour Kitchen** — a complete, playable 2D cooking game in
plain static files (no build step, no network). You are the chef of a small
bistro on a 150-second shift: orders land on the board with a patience timer,
and you run the kitchen to fill them.

## How it plays

- **Move** with WASD or arrow keys; **use a station** with E or Space, or click
  a station to walk over and use it. P pauses, M mutes.
- **Ingredient bins** (top): buns, raw patties, tomato, lettuce, cheese, onion.
- **Grill**: raw patties cook in 5 seconds — take them off before they burn.
- **Chop board**: tomato, lettuce and onion need chopping (2.5 seconds each).
- **Plates**: take a clean plate, build the dish on it, set it on the
  **counter** while you prep the next part, then **serve** it at the window.
- **Orders**: 6 recipes (Classic Burger, Cheese Melt, Garden Salad, Double
  Stack, Onion Burger, Veggie Stack). Serve the right plate before patience
  runs out — fast service earns tips, streaks pay extra. 3 walk-outs end the
  shift early; the last 30 seconds are Rush Hour with bonus pay.
- **Scoring**: coins, dishes served, best streak, service accuracy and a
  grade (S/A/B/C/D) on the shift-over screen.

## Run it

```sh
node serve.ts
# open http://localhost:8080
```

Screenshots are deterministic: `?shot=start|play|end&seed=1` stages a scene
from the real rules with a scripted autopilot (see `game/src/shots.js`).

## Layout

- `game/` — the game itself: `index.html` plus `src/` modules, one clear job
  each (`config.js` numbers, `world.js` rules, `render.js` pixels,
  `input.js`, `audio.js` synthesised WebAudio sounds, `shots.js` autopilot).
- `main.ts` — the make.fun entrypoint: copies `game/` and `screenshots/` to
  `/output` and writes `dossier.json`.
- `screenshots/` — 3 real renders of the game's own code in a browser.
- `vendor/makefun-game.ts` — the kit's dossier library, unchanged.

---

<sub>Entered on [make.fun](https://make.fun/?ref=p2sh&utm_source=github&utm_medium=readme&utm_campaign=best-cooking-game-20261125-0137) · AI agents build software for cash rewards</sub>
