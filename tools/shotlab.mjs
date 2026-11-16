#!/usr/bin/env node
// NEON VOID shot lab — headless replay of the staged screenshots (SUNWRIGHT
// pattern: tools/stageplan.mjs + tools/check-shot-truth.mjs).
// The sim (world.js + shots.js + config.js + random.js) is DOM-free, so the
// exact staging code the browser runs can be replayed here from a seed, in
// Node, with no browser at all.
//
//   node tools/shotlab.mjs scan [--seeds 1..300] [--shots start,play,action,end]
//     Scan seeds for the best staged moment per shot and print the top 5.
//     Cover targets (per shot, from the staged moment's own state):
//       start  most ambient enemies visible around the title panel
//       play   dense wave-2 frame, player framed, combo climbing, pickups
//       action dense wave-8 frame, combo >= x6, player framed, pickups
//       end    furthest progress (wave, then score) before the bad pilot dies
//   node tools/shotlab.mjs truth [--sidecar tools/shots-truth.json]
//     Replay every shot in shots.json headlessly and assert the sim state
//     equals the sidecar the browser recorded at capture time. Every HUD
//     number is drawn from that state, so equal state means no fake numbers.
import { cpSync, mkdtempSync, readFileSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, dirname } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

const root = dirname(fileURLToPath(import.meta.url)); // tools/
const repo = join(root, '..');
const src = join(repo, 'game', 'src');
// The game files are .js ES modules with no package.json type field, so run
// them under fresh copies in a temp dir with a {"type":"module"} package.json
// (same trick as the node --check pass, which copies them to .mjs names).
// The copies are byte-identical to game/src at the time of the run.
const work = mkdtempSync(join(tmpdir(), 'neon-void-shotlab-'));
for (const f of ['config.js', 'random.js', 'world.js', 'shots.js'])
  cpSync(join(src, f), join(work, f));
writeFileSync(join(work, 'package.json'), '{"type":"module"}\n');
const { createWorld } = await import(pathToFileURL(join(work, 'world.js')).href);
const { createRandom } = await import(pathToFileURL(join(work, 'random.js')).href);
const { stageShot } = await import(pathToFileURL(join(work, 'shots.js')).href);
const shotsJson = JSON.parse(readFileSync(join(repo, 'shots.json'), 'utf-8'));

function replay(shot, seed) {
  const world = createWorld(createRandom(seed >>> 0));
  const out = stageShot(shot, world);
  const s = world.state;
  let near = 0, pickups = 0, outside = 0;
  for (const e of s.enemies) {
    if (!e.active) continue;
    if (Math.hypot(e.x - s.player.x, e.y - s.player.y) < 420) near++;
    // Title panel covers x 230..1050, y 128..598; enemies outside it read.
    if (e.x < 230 || e.x > 1050 || e.y < 128 || e.y > 598) outside++;
  }
  for (const it of s.pickups) if (it.active) pickups++;
  const composed = s.player.y > 150 && s.player.y < 620 && s.player.x > 80 && s.player.x < 1200;
  const rank = s.enemyCount * 100 + near * 10 + (composed ? 200 : 0) + s.multiplier * 100 + pickups * 40;
  return {
    shot, seed, screen: out.screen, best: out.best, score: s.score, wave: s.wave,
    waveState: s.waveState, enemyCount: s.enemyCount, spawnCount: s.spawnCount,
    hostiles: s.enemyCount + s.spawnCount, combo: s.combo, multiplier: s.multiplier,
    shields: s.player.shields, bombs: s.player.bombs, pickups, near, outside,
    composed, rank, over: s.over, time: +s.time.toFixed(3),
    px: Math.round(s.player.x), py: Math.round(s.player.y),
  };
}

// Seed score: how well the captured moment meets the shot's cover targets.
function targetScore(r) {
  if (r.shot === 'start') return r.outside + 0.5 * (r.enemyCount - r.outside);
  if (r.shot === 'end') return r.wave * 10000 + r.score;
  return r.rank;
}

function parseRange(text, fallback) {
  const m = /^(\d+)\.\.(\d+)$/.exec(text || '');
  if (!m) return fallback;
  return [Number(m[1]), Number(m[2])];
}

const mode = process.argv[2];
if (mode === 'scan') {
  const seedsArg = process.argv.find((a) => a.startsWith('--seeds='));
  const shotsArg = process.argv.find((a) => a.startsWith('--shots='));
  const [lo, hi] = parseRange(seedsArg && seedsArg.slice(8), [1, 300]);
  const wanted = shotsArg ? shotsArg.slice(8).split(',') : ['start', 'play', 'action', 'end'];
  for (const shot of wanted) {
    const t0 = Date.now();
    const results = [];
    for (let seed = lo; seed <= hi; seed++) {
      const r = replay(shot, seed);
      const wantScreen = shot === 'start' ? 'title' : shot === 'end' ? 'over' : 'play';
      if (r.screen !== wantScreen) continue;
      results.push({ ...r, target: targetScore(r) });
    }
    results.sort((a, b) => b.target - a.target);
    console.log(`--- ${shot}: ${results.length} usable seeds ${lo}..${hi} (${((Date.now() - t0) / 1000).toFixed(1)}s)`);
    for (const r of results.slice(0, 5))
      console.log(`  seed=${r.seed} target=${r.target} score=${r.score} wave=${r.wave} enemies=${r.enemyCount} hostiles=${r.hostiles} near=${r.near} combo=x${r.multiplier} pickups=${r.pickups} composed=${r.composed} shields=${r.shields} bombs=${r.bombs} t=${r.time}s`);
    if (!results.length) console.log('  (no usable seed in range)');
  }
} else if (mode === 'truth') {
  const sidecarArg = process.argv.find((a) => a.startsWith('--sidecar='));
  const sidecarPath = sidecarArg ? sidecarArg.slice(10) : join(root, 'shots-truth.json');
  const sidecar = JSON.parse(readFileSync(sidecarPath, 'utf-8'));
  // Fields the renderer draws into the HUD (derived from this state).
  const hudFields = ['score', 'wave', 'hostiles', 'multiplier', 'shields', 'bombs', 'best', 'screen', 'over'];
  let ok = true;
  for (const entry of shotsJson) {
    const query = new URLSearchParams(entry.query.replace(/^\?/, ''));
    const shot = query.get('shot'), seed = Number(query.get('seed') || 7);
    const want = sidecar[entry.name];
    if (!want) { console.log(`${entry.name}: NO SIDECAR ENTRY`); ok = false; continue; }
    const got = replay(shot, seed);
    const bad = [];
    for (const f of [...hudFields, 'enemyCount', 'spawnCount', 'combo', 'pickups', 'time'])
      if (got[f] !== want[f]) bad.push(`${f}: replay=${got[f]} sidecar=${want[f]}`);
    // The HUD strings the renderer paints from this state:
    const hud = `SCORE ${got.score} | WAVE ${got.wave} | ${got.hostiles} HOSTILES REMAINING | x${got.multiplier} COMBO | BEST ${got.best} | shields ${got.shields} bombs ${got.bombs}`;
    if (bad.length) { console.log(`${entry.name} (shot=${shot} seed=${seed}): MISMATCH\n  ${bad.join('\n  ')}`); ok = false; }
    else console.log(`${entry.name} (shot=${shot} seed=${seed}): OK  ${hud}`);
  }
  console.log(ok ? 'TRUTH: PASS — every HUD number recomputed from a headless replay matches the captured frame.' : 'TRUTH: FAIL');
  process.exit(ok ? 0 : 1);
} else {
  console.log('usage: node tools/shotlab.mjs scan [--seeds=1..300] [--shots=start,play,action,end]\n       node tools/shotlab.mjs truth [--sidecar=tools/shots-truth.json]');
  process.exit(2);
}
