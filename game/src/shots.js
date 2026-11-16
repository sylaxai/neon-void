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
 let linger=0, reaction=0, firePhase=0, peak=null, unleashed=false, waveTicks=0;
 // Peak-density capture (staging only — the sim is untouched): remember the
 // best on-screen moment of the target wave and paint that frame. The pilot
 // normally kills faster than wave 8 spawns, so a straight linger ends on a
 // near-empty field even with 39 hostiles left in the queue.
 // Rank: enemies on screen first, then enemies near the player, then the
 // player framed clear of the HUD bar and edges, then the combo multiplier
 // (the hook: the combo is the weapon), then visible pickups.
 function considerPeak(){let near=0,pickups=0;for(const e of s.enemies)if(e.active&&Math.hypot(e.x-p.x,e.y-p.y)<420)near++;for(const it of s.pickups)if(it.active)pickups++;const composed=p.y>150&&p.y<620&&p.x>80&&p.x<1200;const rank=s.enemyCount*100+near*10+(composed?200:0)+s.multiplier*100+pickups*40;if(!peak||rank>=peak.rank)peak={count:s.enemyCount,near,rank,snap:structuredClone(s)};}
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
  if(nearest){input.aimX=nearest.x;input.aimY=nearest.y;}
  // During the target wave the pilot first holds fire except at point-blank
  // range, so the swarm builds into a dense frame instead of being thinned
  // as fast as it spawns; once the swarm is built (or time runs short) it
  // unleashes at full lethality and the combo climbs while the field is
  // still crowded. Outside the target wave it plays at full lethality.
  // Still the real rules, no staged entities — a dodging pilot that lets
  // the swarm in and then cuts through it, not a diorama.
  const inTarget=!bad&&s.wave===target&&s.waveState==='fight';
  if(inTarget){waveTicks++;if(!unleashed&&(s.enemyCount>=(name==='action'?20:12)||waveTicks>((name==='action'?13:6)/STEP)))unleashed=true;}
  const holding=inTarget&&!unleashed;
  input.firing=!!nearest&&dist<(holding?200:bad?520:380)&&!(bad&&threat)&&(bad||firePhase<(holding?0.15:0.5));input.bomb=!bad&&p.shields<3&&p.bombs>0&&s.enemyCount>6;
  }
  world.step(STEP,input);
  if(s.over){dead=true;break;}
  if(!bad&&s.wave>target)break;
  if(!bad&&s.wave===target&&s.waveState==='fight'){considerPeak();linger++;if(linger>(name==='action'?22:12)/STEP)break;}
 }
 if(peak){Object.assign(s,peak.snap);dead=false;} // Paint the densest moment, alive.
 return {screen:dead?'over':'play',best:s.score,newBest:dead&&s.score>0};
}
