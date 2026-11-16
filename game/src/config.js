export const FIELD = { width: 1280, height: 720 };
export const STEP = 1 / 60;
export const BEST_KEY = 'neon-void.best';
export const PALETTE = { background:'#0a0618', violet:'#1a0f33', player:'#35f2ff', drone:'#ff3df0', weaver:'#ff9a3d', shooter:'#ff4d5e', splitter:'#4dff88', pickup:'#ffd94d', text:'#eef1f5', muted:'#8b93a3' };
export const FONT = { small:'14px monospace', body:'18px monospace', label:'bold 14px monospace', score:'bold 42px monospace', banner:'bold 64px sans-serif', title:'900 92px sans-serif', heading:'bold 56px sans-serif' };
export const PLAYER = { radius:14, speed:420, shields:3, maxShields:4, bombs:1, fireInterval:0.125, rapidInterval:0.06, bulletSpeed:720, bulletRadius:4, damage:1, spread:Math.PI/15, invulnerable:1.5, bombDamage:3, bombCooldown:0.6 };
export const ENEMIES = {
 drone:{hp:1,speed:90,speedRange:50,radius:17,score:50,sides:4},
 weaver:{hp:1,speed:120,speedRange:0,radius:17,score:75,sides:0,amplitude:90,frequency:2.2},
 shooter:{hp:2,speed:70,speedRange:0,radius:22,score:150,sides:5,near:260,far:340,interval:2.2,orbSpeed:200,orbRadius:7},
 splitter:{hp:3,speed:60,speedRange:0,radius:26,score:100,sides:6}
};
export const WAVES = { drones:6, droneGrowth:4, weavers:2, interval:1.1, acceleration:0.92, minInterval:0.35, safeDistance:220, breather:2.5, bonus:250, queue:8192 };
export const PICKUPS = { chance:0.12, rapidWeight:0.30, spreadWeight:0.25, shieldWeight:0.20, duration:8, drift:40, magnet:100, magnetSpeed:280, life:9, radius:14 };
export const COMBO = { duration:2.5, cap:24, divisor:3, maxMultiplier:8 };
export const PARTICLES = { count:512, explosion:14, minSpeed:60, maxSpeed:260, thruster:2, textLife:0.8, textSpeed:40, shakeDecay:1.6, shakePixels:12 };
export const LIMITS = { enemies:1024, bullets:256, orbs:512, pickups:128, texts:128, bulletLife:2, orbLife:8 };
export const VISUAL = { stars:180, grid:80, bannerTime:2.5, shockwaveTime:0.6 };
// Feel tiers (presentation only — no rule or tuning number lives here):
// small kill = shake 0.2 + 14 particles, no hit-stop; splitter (the wave's
// heavy) = shake 0.45 + 30 particles + 0.05 s hit-stop + white flash;
// bomb = shake 1 + shockwave + 0.08 s hit-stop; player hurt = shake 1 +
// 40 particles + 0.06 s hit-stop. Hit-stop pauses stepping for a real-time
// interval and is restored by the frame clock, never by a scaled timer.
export const FEEL = { hitStopBig:0.05, hitStopBomb:0.08, hitStopHurt:0.06 };
// Story that emerges from play — text only, never a mechanic. One
// transmission under the wave banner (index capped at the last line, so late
// waves keep the deep-end voice) and one callout each time the score crosses
// another 10,000 (index capped the same way).
export const TRANSMISSIONS = [
 'FIRST CONTACT — DRONES ON SCAN',
 'WEAVERS INBOUND — THEY DON\u2019T FLY STRAIGHT',
 'SHOOTERS HOLDING RANGE — CLOSE THE GAP',
 'SPLITTER ON SCAN — KILL ONE, MEET TWO',
 'SWARM THICKENING — WATCH YOUR SIX',
 'SIGNALS MULTIPLYING — NO QUIET SECTOR',
 'THE VOID IS SENDING EVERYTHING IT HAS',
 'WAVE 8 — THIS IS THE DEEP END, PILOT',
 'DEEP WATER NOW — NOTHING LEFT BUT THE FIGHT'
];
export const MILESTONES = [
 '10K — THE VOID NOTICES YOU',
 '20K — SOMETHING OUT THERE IS COUNTING TOO',
 '30K — HOLD THE LINE, PILOT',
 '40K — THE SWARM KNOWS YOUR NAME NOW',
 '50K — HALF A HUNDRED THOUSAND. KEEP FIRING.',
 'THE SCORE KEEPS CLIMBING — THE VOID DOESN\u2019T BLINK'
];
