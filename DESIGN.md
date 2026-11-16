# NEON VOID — design brief (best-game-01)

Build this game exactly as specified. You are the coding agent: write every file
listed below fresh, from this spec. Do NOT copy the kit starter's game code
(Block Dodger) — different genre, different mechanics, different art. Only the
kit's `vendor/makefun-game.ts` (already in this repo, byte-identical to the kit)
and the MIT LICENSE are reused. No libraries, no network requests, no assets:
plain ES modules + canvas 2D + WebAudio, all files under `game/`.

## Concept

NEON VOID: a neon arena survival shooter. You pilot a lone cyan ship in a
violet void. Waves of geometric enemy ships close in; you dodge, aim with the
mouse and shoot them down. Kills build a combo multiplier; pickups grant rapid
fire, spread shot, shields and bombs. Survive as many waves as you can, beat
your best score.

Art direction: deep violet-black space, three-layer parallax starfield, faint
grid, neon glow (canvas shadowBlur) on everything. Palette: background
#0a0618, violet #1a0f33, player cyan #35f2ff, drone magenta #ff3df0, weaver
orange #ff9a3d, shooter red #ff4d5e, splitter green #4dff88, pickup gold
#ffd94d, text #eef1f5, muted #8b93a3. Everything reads at a glance when the
screenshot is shrunk: big score, big wave banner, bright shapes on dark field.

## Files (one clear job each)

- `game/index.html` — canvas `#game` + screen-reader `#status` line + module
  script `./src/main.js`. Dark background, canvas fixed full-window.
- `game/src/config.js` — every tuning number and colour (FIELD 1280x720,
  STEP 1/60, PLAYER, ENEMIES, WAVES, PICKUPS, COMBO, PARTICLES, PALETTE,
  FONT, BEST_KEY `neon-void.best`). No logic.
- `game/src/random.js` — mulberry32 seeded RNG `createRandom(seed)`.
- `game/src/input.js` — keyboard (WASD/arrows move, Space fire, P/Esc pause,
  M mute, Enter/Space confirm) + mouse (position aims, hold left button fires,
  click confirms). Held keys give a move vector; one-shot presses are queued
  as bit flags `ACTION_CONFIRM`, `ACTION_PAUSE`, `ACTION_BOMB`, `ACTION_MUTE`
  and taken once by the loop. Exposes `moveVector()`, `aim()` (mouse position
  in field coordinates, via the renderer's view transform — pass a function
  that converts client coords to field coords), `firing()`, `takeActions()`.
- `game/src/audio.js` — WebAudio synth only, no assets. `createAudio()`:
  `unlock()` on first gesture; `shoot()` (short square blip, throttle so at
  most every other shot makes sound); `explosion(size)` (noise burst + sine
  drop); `hit()` (harsh buzz); `pickup()` (two-note arpeggio); `waveClear()`
  (four-note chime); `gameOver()` (descending notes); `bomb()` (deep boom);
  `toggleMute()`; a quiet bass-pulse music loop (sine 55 Hz pattern, very
  low gain) that runs during play. All functions safe to call before unlock
  (no-ops) and when muted. Keep gains low so nothing clips.
- `game/src/world.js` — the rules and state, no drawing, no browser in it.
  `createWorld(random)` returns `{ state, reset, step }`. State: player
  `{x, y, angle, shields, invulnerable, fireTimer, rapidTimer, spreadTimer,
  bombs}`, `enemies[]`, `bullets[]` (player), `enemyBullets[]`, `particles[]`,
  `texts[]` (floating score popups), `pickups[]`, `score`, `best` (passed in
  by main.js, not stored here), `combo`, `comboTimer`, `multiplier`, `wave`,
  `waveState` (`'fight' | 'clear'`, `waveTimer`), `spawnTimer`, `toSpawn`
  (queue of enemy kinds for the current wave), `shake` (trauma 0..1),
  `events` bit flags returned by step(): `EVENT_HIT`, `EVENT_KILL`,
  `EVENT_PICKUP`, `EVENT_WAVE_CLEAR`, `EVENT_OVER`, `EVENT_BOMB`.
  - Enemy kinds: `drone` (hp 1, speed 90–140, score 50, magenta diamond,
    chases player); `weaver` (hp 1, speed 120, sine weave amplitude 90,
    freq 2.2, score 75, orange circle, drifts toward player); `shooter`
    (hp 2, speed 70, keeps 260–340 range, fires an orb every 2.2 s at the
    player — orb speed 200, score 150, red pentagon); `splitter` (hp 3,
    speed 60, slow chase, splits into 2 drones on death, score 100, green
    hexagon).
  - Waves: wave N spawns `6 + 4*N` drones, `2 + N` weavers (from wave 2),
    `N - 1` shooters (from wave 3), `N - 2` splitters (from wave 4),
    shuffled into `toSpawn`. Spawn interval starts 1.1 s, ×0.92 per wave,
    min 0.35 s. Spawn at a random edge point at least 220 px from the player.
    When `toSpawn` is empty and no enemies remain: wave clear — bonus
    `250 * wave`, `waveState = 'clear'`, 2.5 s breather, then wave + 1.
  - Player: radius 14, speed 420, fire interval 0.125 s (0.06 s with rapid),
    bullet speed 720, bullet radius 4, damage 1. Spread shot fires 3 bullets
    at -12°, 0°, +12°. Bomb (Space, if bombs > 0): clears all enemy bullets,
    damages every enemy 3, big flash + shockwave, 0.6 s cooldown.
  - Combo: a kill within 2.5 s of the previous kill raises combo by 1 (cap
    24); multiplier = min(8, 1 + floor(combo / 3)); combo resets on player
    hit or when comboTimer expires. Score for a kill = base × multiplier.
  - Pickups: 12% drop chance per kill, kind weighted: rapid 30%, spread
    25%, shield 20% (only if shields < 4, else reroll to bomb), bomb 25%.
    Pickup drifts down at 40 px/s, magnet toward player within 100 px,
    expires after 9 s. Rapid/spread last 8 s.
  - Collisions: circle tests. Enemy bullet or enemy touching the player
    (and invulnerable == 0): shields -= 1, invulnerable = 1.5, combo = 0,
    shake = 1, big particle burst; shields == 0 → EVENT_OVER. Player bullet
    vs enemy: enemy hp -= 1, spark particles; hp 0 → kill: score, combo,
    explosion particles (14), maybe pickup, splitter spawns 2 drones.
  - Particles: fixed pool of 512, each `{active, x, y, vx, vy, life, maxLife,
    size, color}`. Explosion: 14 particles speed 60–260. Thruster: 2 per
    frame while the player moves. Floating texts: `{x, y, text, life}` rise
    40 px/s, life 0.8 s. Shake trauma decays 1.6/s; render offset uses
    trauma² × 12 px.
  - Nothing allocates after `createWorld` returns (reuse pool slots).
  - `step(dt, input, sound)` where input is `{mx, my, aimX, aimY, firing,
    bomb}` — the world reads movement + aim + firing from it and returns
    event flags; the caller plays sounds from the flags. Keep world free of
    audio/DOM. `reset()` restores a fresh run (wave 1, score 0, 3 shields,
    1 bomb, player centred).
- `game/src/render.js` — drawing only. `createRenderer(canvas)` returns
  `{ draw(state, screen, ui), clientToField(cx, cy) }` where `ui` is
  `{best, muted}`. Fixed 1280×720 field scaled to fit the window, centred,
  letterboxed with the backdrop colour. Draws: starfield (3 parallax layers,
  seeded positions, drift by time), faint grid, pickups (gold diamonds with
  letter R/S/+/B), enemies (glow shapes with distinct silhouettes + hp pips
  for shooter/splitter), player ship (cyan triangle with glow, engine flame
  when moving, blink while invulnerable), bullets (cyan streaks), enemy orbs
  (red glow circles), particles (additive-ish bright dots), floating texts,
  shockwave ring on bomb. HUD: score big top-left with combo `×N` under it
  and `BEST n`; wave + enemies left top-centre; shields as ship icons and
  bombs as circles top-right; power-up timers as thin bars under the score.
  Panels (title / paused / game over) as centred translucent panels with the
  game name in huge letters, controls, and prompts. Title panel: `NEON VOID`,
  `Survive the void. Shoot everything.`, controls lines, best score,
  `Click or press Space to start`. Game-over panel: `GAME OVER`, `Score n`,
  `Wave n`, `Best n`, `NEW BEST!` when beaten, `Press Space or click to play
  again`. Wave banner: `WAVE N` big centre, fading. All text via cached
  fonts; frame allocates nothing.
- `game/src/shots.js` — staged screenshot scenes behind `?shot=`. Each plays
  the real rules forward from a fresh world with a fixed seed and an
  autopilot, then returns `{ screen, best }` for the renderer. Scenes:
  `start` (5 s ambient: title screen over drifting enemies, harmless),
  `play` (wave 2, ~20 s, good autopilot: dodges + shoots, all lives kept),
  `action` (wave 4, good autopilot, dense field with many enemies and
  particles), `end` (bad autopilot: reacts only within 90 px and never fires
  while fleeing, so it dies — game-over screen with a real score). Autopilot:
  each tick, find the nearest threat (enemy or enemy bullet) within 220 px
  and steer away from it; else steer toward the nearest enemy at ~300 px;
  aim at the nearest enemy; fire when any enemy is within 520 px. Exposes
  `stageShot(name, world)` returning `{ screen, best }`.
- `game/src/main.js` — boot + the one loop. Reads `?seed=` and `?shot=`
  (with `&seed=`). Shot mode: stage the scene, paint it twice, set
  `window.__shotReady = true`. Game mode: fixed 1/60 s steps (catch up on
  slow frames, drop stalls over 0.25 s), screens title/play/paused/over,
  best score in localStorage (`BEST_KEY`), announces screen changes on the
  `#status` line for screen readers, pauses on `visibilitychange` when hidden,
  Space/click starts and restarts, P/Esc pauses, M mutes, Space during play
  fires a bomb. Wire input → world → audio (from event flags) → renderer.
  Unlock audio on the first pointer/key gesture.

## Repo-root files (write fresh, same behaviour as the kit starter describes)

- `main.ts` — Node 22, stdlib only. Copies `game/` and `screenshots/` from
  beside this file to `/output` (or `$MAKEFUN_OUTPUT_DIR` outside the
  grader), then writes `/output/dossier.json` with `buildDossier` from
  `./vendor/makefun-game.ts` using caps: `text_max_bytes: 163840`,
  `screenshots: { max: 4, max_bytes: 262144 }`, `game_max_files: 993`,
  `game_max_bytes: 50331648`, `game_path_max_bytes: 1000`. No other behaviour.
- `serve.ts` — tiny static server for `game/` on http://localhost:8080
  (default port 8080, `--port` overrides), stdlib only, correct MIME types,
  refuses paths outside `game/`. Dev convenience only.
- `shots.json` — the four staged shots, in dossier order (first is the
  cover):
  `[{ "name": "1-cover.jpg", "query": "?shot=start&seed=7" }, { "name":
  "2-play.jpg", "query": "?shot=play&seed=7" }, { "name": "3-action.jpg",
  "query": "?shot=action&seed=11" }, { "name": "4-over.jpg", "query":
  "?shot=end&seed=7" }]`
- `README.md` — from the make.fun template, placeholders filled:
  title `neon-void`, badges for best-game-01, description `NEON VOID is a
  neon arena survival shooter: pilot a lone ship through endless waves of
  geometric enemies, build combos, grab power-ups and beat your best score.`,
  run block:
  ```sh
  node serve.ts
  # open http://localhost:8080
  ```
  footer referral code `wgbpxxkc`, owner `sylaxai`, repo `neon-void`.

## Hard constraints

- No network request at run time: every script, font and sound is a file
  under `game/` or a `data:` URI (there are no external files at all — all
  art is canvas-drawn, all sound is WebAudio-synthesised).
- ES modules only, no build step. Verify syntax by copying each `.js` file
  to a `.mjs` name under `/tmp` and running `node --check` on it; fix any
  error. Full play-testing in Chromium is done by the reviewer afterwards —
  report anything you could not verify.
- Deterministic screenshots: `?shot=` + `&seed=` must always produce the
  same frame. No `Math.random()` in game code — use the seeded RNG everywhere
  (including starfield positions, derived from the seed).
- Screenshots must be 3–4 images, each ≤ 256 KiB, long side ≤ 1280 px,
  short side ≥ 480 px. Take them at 1280×720.
- Keep the dossier small: total game source should stay well under the
  160 KiB text cap so the judge's outline sees whole files.
- Do not use names, characters, art or music from any existing commercial
  game. NEON VOID is original.

## Definition of done for this run

All files above exist and are complete; the game loads in Chromium with zero
console errors; title → play → pause → game over → restart all work from
keyboard and mouse; `?shot=start|play|action|end&seed=N` each paint and set
`window.__shotReady`; waves progress, combo/score/pickups/bombs all function.
Report the file list with line counts and any behaviour you could not verify.
