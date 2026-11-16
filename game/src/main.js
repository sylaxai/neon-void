// NEON VOID — where things live (read top-down: config → sim → systems → render).
//   config.js  every tuning number, colour, font, wave table, feel tier,
//              transmission and milestone line. No logic.
//   random.js  mulberry32 seeded RNG. The only source of randomness.
//   world.js   the simulation: player, enemies, bullets, pickups, combo,
//              waves, particles, shake trauma, event flags. No drawing,
//              no audio, no DOM. Pure rules over the seeded RNG.
//   input.js   keyboard + mouse → move vector, aim, fire, one-shot actions.
//   audio.js   WebAudio synth SFX + bass-pulse music. No assets.
//   shots.js   staged screenshots: an autopilot plays the real rules from
//              a fixed seed and the best on-screen moment is painted.
//   render.js  canvas 2D drawing only: starfield, grid, entities, HUD,
//              panels, wave banner + transmissions, milestone callouts.
//   main.js    this file: boot, screens, the fixed-step loop, hit-stop,
//              flash, milestone detection, best score in localStorage.
// The hook: THE COMBO IS THE WEAPON. Chain kills, raise the multiplier,
// survive the swarm.
import { STEP, BEST_KEY, FEEL, MILESTONES } from './config.js';
import { createRandom } from './random.js';
import { createInput, ACTION_CONFIRM, ACTION_PAUSE, ACTION_BOMB, ACTION_MUTE } from './input.js';
import { createAudio } from './audio.js';
import { createWorld, EVENT_SHOOT, EVENT_HIT, EVENT_KILL, EVENT_BIG_KILL, EVENT_PICKUP, EVENT_WAVE_CLEAR, EVENT_OVER, EVENT_BOMB } from './world.js';
import { createRenderer } from './render.js';
import { stageShot } from './shots.js';
const params=new URLSearchParams(location.search),seed=Number(params.get('seed')||7)>>>0;
const canvas=document.querySelector('#game'),status=document.querySelector('#status');
const renderer=createRenderer(canvas,seed),world=createWorld(createRandom(seed)),audio=createAudio();
const input=createInput(canvas,renderer.clientToField),s=world.state;
const ui={best:0,muted:false,newBest:false,milestone:0,callout:null,calloutUntil:0,flash:0};
try{ui.best=Math.max(0,Math.floor(Number(localStorage.getItem(BEST_KEY))||0));}catch{}
s.best=ui.best;
let screen='title',accumulator=0,last=0,hitStop=0;
function change(next){screen=next;status.textContent=next==='title'?'NEON VOID. Click or press Space to start.':next==='play'?'Playing. WASD to move, mouse to aim and fire, Space to bomb.':next==='paused'?'Paused. Press P or Escape to resume.':'Game over. Score '+s.score+'. Press Space or click to restart.';audio.setPlaying(next==='play');}
function start(){world.reset();s.best=ui.best;ui.newBest=false;ui.milestone=0;ui.callout=null;ui.calloutUntil=0;ui.flash=0;accumulator=0;hitStop=0;change('play');}
function sounds(events){if(events&EVENT_SHOOT)audio.shoot();if(events&EVENT_KILL)audio.explosion(1);if(events&EVENT_BIG_KILL){hitStop=Math.max(hitStop,FEEL.hitStopBig);ui.flash=1;}if(events&EVENT_BOMB){audio.bomb();hitStop=Math.max(hitStop,FEEL.hitStopBomb);}if(events&EVENT_HIT){audio.hit();hitStop=Math.max(hitStop,FEEL.hitStopHurt);}if(events&EVENT_PICKUP)audio.pickup();if(events&EVENT_WAVE_CLEAR)audio.waveClear();if(events&EVENT_OVER){ui.newBest=s.score>ui.best;ui.best=Math.max(ui.best,s.score);s.best=ui.best;try{localStorage.setItem(BEST_KEY,String(ui.best));}catch{}audio.gameOver();change('over');}}
window.addEventListener('pointerdown',()=>audio.unlock(),{once:true});
window.addEventListener('keydown',()=>audio.unlock(),{once:true});
document.addEventListener('visibilitychange',()=>{if(document.hidden&&screen==='play')change('paused');accumulator=0;last=0;});
const frameInput={mx:0,my:0,aimX:900,aimY:360,firing:false,bomb:false};
if(params.has('shot')){
 const shot=stageShot(params.get('shot'),world);ui.best=shot.best;ui.newBest=!!shot.newBest;s.best=ui.best;screen=shot.screen;
 // Truth-check sidecar: the exact sim state behind this frame, so a headless
 // replay can recompute every HUD number and assert it equal. No number on
 // any screenshot is ever drawn from anything but this state.
 window.__shotState={shot:params.get('shot'),seed,best:shot.best,screen:shot.screen,score:s.score,wave:s.wave,waveState:s.waveState,enemyCount:s.enemyCount,spawnCount:s.spawnCount,hostiles:s.enemyCount+s.spawnCount,combo:s.combo,multiplier:s.multiplier,shields:s.player.shields,bombs:s.player.bombs,pickups:s.pickups.filter(p=>p.active).length,over:s.over,time:+s.time.toFixed(3)};
 renderer.draw(s,screen,ui);renderer.draw(s,screen,ui);window.__shotReady=true;
}else{
 change('title');s.ambient=true;
 function frame(now){const elapsed=last?Math.min((now-last)/1000,0.25):0;last=now;let actions=input.takeActions();
  if(actions&ACTION_MUTE)ui.muted=audio.toggleMute();
  if((screen==='title'||screen==='over')&&(actions&ACTION_CONFIRM)){start();actions=0;}
  else if((actions&ACTION_PAUSE)||screen==='paused'&&(actions&ACTION_CONFIRM)){if(screen==='play')change('paused');else if(screen==='paused')change('play');}
  if(ui.flash>0)ui.flash=Math.max(0,ui.flash-elapsed*5);
  if(hitStop>0){ // Freeze frame: step nothing, spend only real time, drop any
   hitStop-=elapsed;if(hitStop<=0){hitStop=0;accumulator=0;} // backlog so the game never fast-forwards.
   renderer.draw(s,screen,ui);requestAnimationFrame(frame);return;}
  if(screen==='play'||screen==='title'){
   accumulator+=elapsed;const movement=input.moveVector(),aim=input.aim();frameInput.mx=screen==='play'?movement.x:0;frameInput.my=screen==='play'?movement.y:0;frameInput.aimX=aim.x;frameInput.aimY=aim.y;frameInput.firing=screen==='play'&&input.firing();frameInput.bomb=screen==='play'&&!!(actions&ACTION_BOMB);
   while(accumulator>=STEP){sounds(world.step(STEP,frameInput));frameInput.bomb=false;accumulator-=STEP;if(screen==='over')break;}
   const m=Math.floor(s.score/10000); // Score-milestone story beat (text only).
   if(m>ui.milestone){ui.milestone=m;ui.callout=MILESTONES[Math.min(m-1,MILESTONES.length-1)];ui.calloutUntil=s.time+3;}
  }else accumulator=0;
  renderer.draw(s,screen,ui);requestAnimationFrame(frame);
 }
 requestAnimationFrame(frame);
}
