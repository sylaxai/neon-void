import { STEP, BEST_KEY } from './config.js';
import { createRandom } from './random.js';
import { createInput, ACTION_CONFIRM, ACTION_PAUSE, ACTION_BOMB, ACTION_MUTE } from './input.js';
import { createAudio } from './audio.js';
import { createWorld, EVENT_SHOOT, EVENT_HIT, EVENT_KILL, EVENT_PICKUP, EVENT_WAVE_CLEAR, EVENT_OVER, EVENT_BOMB } from './world.js';
import { createRenderer } from './render.js';
import { stageShot } from './shots.js';
const params=new URLSearchParams(location.search),seed=Number(params.get('seed')||7)>>>0;
const canvas=document.querySelector('#game'),status=document.querySelector('#status');
const renderer=createRenderer(canvas,seed),world=createWorld(createRandom(seed)),audio=createAudio();
const input=createInput(canvas,renderer.clientToField),s=world.state;
const ui={best:0,muted:false,newBest:false};
try{ui.best=Math.max(0,Math.floor(Number(localStorage.getItem(BEST_KEY))||0));}catch{}
s.best=ui.best;
let screen='title',accumulator=0,last=0;
function change(next){screen=next;status.textContent=next==='title'?'NEON VOID. Click or press Space to start.':next==='play'?'Playing. WASD to move, mouse to aim and fire, Space to bomb.':next==='paused'?'Paused. Press P or Escape to resume.':'Game over. Score '+s.score+'. Press Space or click to restart.';audio.setPlaying(next==='play');}
function start(){world.reset();s.best=ui.best;ui.newBest=false;accumulator=0;change('play');}
function sounds(events){if(events&EVENT_SHOOT)audio.shoot();if(events&EVENT_KILL)audio.explosion(1);if(events&EVENT_HIT)audio.hit();if(events&EVENT_PICKUP)audio.pickup();if(events&EVENT_WAVE_CLEAR)audio.waveClear();if(events&EVENT_BOMB)audio.bomb();if(events&EVENT_OVER){ui.newBest=s.score>ui.best;ui.best=Math.max(ui.best,s.score);s.best=ui.best;try{localStorage.setItem(BEST_KEY,String(ui.best));}catch{}audio.gameOver();change('over');}}
window.addEventListener('pointerdown',()=>audio.unlock(),{once:true});
window.addEventListener('keydown',()=>audio.unlock(),{once:true});
document.addEventListener('visibilitychange',()=>{if(document.hidden&&screen==='play')change('paused');accumulator=0;last=0;});
const frameInput={mx:0,my:0,aimX:900,aimY:360,firing:false,bomb:false};
if(params.has('shot')){
 const shot=stageShot(params.get('shot'),world);ui.best=shot.best;ui.newBest=!!shot.newBest;s.best=ui.best;screen=shot.screen;renderer.draw(s,screen,ui);renderer.draw(s,screen,ui);window.__shotReady=true;
}else{
 change('title');s.ambient=true;
 function frame(now){const elapsed=last?Math.min((now-last)/1000,0.25):0;last=now;let actions=input.takeActions();
  if(actions&ACTION_MUTE)ui.muted=audio.toggleMute();
  if((screen==='title'||screen==='over')&&(actions&ACTION_CONFIRM)){start();actions=0;}
  else if((actions&ACTION_PAUSE)||screen==='paused'&&(actions&ACTION_CONFIRM)){if(screen==='play')change('paused');else if(screen==='paused')change('play');}
  if(screen==='play'||screen==='title'){
   accumulator+=elapsed;const movement=input.moveVector(),aim=input.aim();frameInput.mx=screen==='play'?movement.x:0;frameInput.my=screen==='play'?movement.y:0;frameInput.aimX=aim.x;frameInput.aimY=aim.y;frameInput.firing=screen==='play'&&input.firing();frameInput.bomb=screen==='play'&&!!(actions&ACTION_BOMB);
   while(accumulator>=STEP){sounds(world.step(STEP,frameInput));frameInput.bomb=false;accumulator-=STEP;if(screen==='over')break;}
  }else accumulator=0;
  renderer.draw(s,screen,ui);requestAnimationFrame(frame);
 }
 requestAnimationFrame(frame);
}
