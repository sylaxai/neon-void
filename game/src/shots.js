import { STEP, FIELD } from './config.js';
// The pilot observes exactly the same threats as a human player. No staged entities.
export function stageShot(name,world){
 world.reset();const s=world.state,p=s.player;
 const input={mx:0,my:0,aimX:900,aimY:360,firing:false,bomb:false};
 let dead=false;
 if(name==='start'){
  s.ambient=true;
  for(let i=0;i<5/STEP;i++){input.aimX=640+Math.cos(i*STEP)*300;input.aimY=360+Math.sin(i*STEP)*200;world.step(STEP,input);}
  return {screen:'title',best:0};
 }
 const bad=name==='end',target=name==='action'?8:2;
 let linger=0, reaction=0, firePhase=0;
 for(let tick=0;tick<60*600;tick++){
  reaction-=STEP;firePhase=(firePhase+STEP)%1.2;
  if(!bad||reaction<=0){
  reaction=bad?0.9:0;
  let nearest=null,dist=Infinity,threat=null,td=bad?90:220;
  for(const e of s.enemies){if(!e.active)continue;const d=Math.hypot(e.x-p.x,e.y-p.y);if(d<dist){nearest=e;dist=d;}if(d<td){td=d;threat=e;}}
  for(const b of s.enemyBullets){if(!b.active)continue;const d=Math.hypot(b.x-p.x,b.y-p.y);if(d<td){td=d;threat=b;}}
  let dx=0,dy=0;
  if(threat){dx=p.x-threat.x;dy=p.y-threat.y;}else if(nearest){const direction=dist>300?1:dist<260?-1:0;dx=(nearest.x-p.x)*direction;dy=(nearest.y-p.y)*direction;}
  // Wall avoidance blends into the dodge instead of pinning the pilot to an edge.
  if(!bad){dx+=Math.max(0,140-p.x)*3-Math.max(0,p.x-(FIELD.width-140))*3;dy+=Math.max(0,130-p.y)*3-Math.max(0,p.y-(FIELD.height-130))*3;}
  const length=Math.hypot(dx,dy)||1;input.mx=dx/length;input.my=dy/length;
  if(nearest){input.aimX=nearest.x;input.aimY=nearest.y;}input.firing=!!nearest&&dist<(bad?520:380)&&!(bad&&threat)&&(bad||firePhase<0.5);input.bomb=!bad&&p.shields<3&&p.bombs>0&&s.enemyCount>6;
  }
  world.step(STEP,input);
  if(s.over){dead=true;break;}
  if(!bad&&s.wave>target)break;
  if(!bad&&s.wave===target&&s.waveState==='fight'){linger++;if(linger>(name==='action'?15:12)/STEP)break;}
 }
 return {screen:dead?'over':'play',best:s.score,newBest:dead&&s.score>0};
}
