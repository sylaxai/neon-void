import { FIELD, PALETTE as C, FONT, ENEMIES, PICKUPS, PARTICLES, VISUAL } from './config.js';
import { createRandom } from './random.js';
export function createRenderer(canvas,seed=7){
 const ctx=canvas.getContext('2d'),random=createRandom(seed^0x51a7);
 const stars=Array.from({length:VISUAL.stars},(_,i)=>({x:random()*FIELD.width,y:random()*FIELD.height,layer:i%3,size:0.6+random()*1.2}));
 const waves=Array.from({length:2048},(_,i)=>'WAVE '+i);
 const left=Array.from({length:10000},(_,i)=>i+' HOSTILES REMAINING');
 const combos=Array.from({length:9},(_,i)=>'×'+i+' COMBO');
 const point={x:0,y:0};let scale=1,ox=0,oy=0,cw=0,ch=0;
 function view(){const dpr=Math.min(window.devicePixelRatio||1,2),w=Math.round(innerWidth*dpr),h=Math.round(innerHeight*dpr);if(w!==cw||h!==ch){canvas.width=cw=w;canvas.height=ch=h;}scale=Math.min(cw/FIELD.width,ch/FIELD.height);ox=(cw-FIELD.width*scale)/2;oy=(ch-FIELD.height*scale)/2;}
 function text(value,x,y,font=FONT.body,color=C.text,align='left'){ctx.font=font;ctx.textAlign=align;ctx.fillStyle=color;ctx.fillText(value,x,y);}
 function glow(color,blur=14){ctx.strokeStyle=color;ctx.fillStyle=color;ctx.shadowColor=color;ctx.shadowBlur=blur;}
 function polygon(x,y,r,sides,angle){ctx.beginPath();for(let i=0;i<sides;i++){const a=angle+i*Math.PI*2/sides;const px=x+Math.cos(a)*r,py=y+Math.sin(a)*r;if(i===0)ctx.moveTo(px,py);else ctx.lineTo(px,py);}ctx.closePath();}
 function ship(x,y,angle,size=18){ctx.save();ctx.translate(x,y);ctx.rotate(angle);ctx.beginPath();ctx.moveTo(size,0);ctx.lineTo(-size*0.75,-size*0.65);ctx.lineTo(-size*0.4,0);ctx.lineTo(-size*0.75,size*0.65);ctx.closePath();ctx.fillStyle='#092b3a';ctx.fill();ctx.stroke();ctx.restore();}
 function panel(screen,s,ui){ctx.shadowBlur=0;ctx.fillStyle='#050310a8';ctx.fillRect(0,0,1280,720);ctx.fillStyle='#100b24ee';ctx.fillRect(230,128,820,470);ctx.strokeStyle='#35f2ff55';ctx.lineWidth=1;ctx.strokeRect(230.5,128.5,819,469);ctx.fillStyle=C.player;ctx.fillRect(230,128,90,3);ctx.fillRect(960,595,90,3);
  text('◈  S U R V I V A L   P R O T O C O L  /  0 1',640,169,FONT.small,C.muted,'center');
  if(screen==='title'){glow(C.player,24);text('NEON VOID',640,282,FONT.title,C.player,'center');ctx.shadowBlur=0;text('Survive the void. Shoot everything.',640,329,FONT.body,C.text,'center');text('WASD / ARROWS   Move     MOUSE   Aim',640,393,FONT.body,C.muted,'center');text('HOLD CLICK   Shoot     SPACE   Bomb',640,425,FONT.body,C.muted,'center');text('P / ESC   Pause     M   Mute',640,457,FONT.small,C.muted,'center');text('BEST '+ui.best,640,501,FONT.body,C.pickup,'center');text('Click or press Space to start',640,555,FONT.body,C.player,'center');}
  else if(screen==='paused'){text('VOID ON HOLD',640,295,FONT.heading,C.player,'center');text('PAUSED',640,351,FONT.body,C.text,'center');text('P / Esc or click to resume',640,442,FONT.body,C.muted,'center');text('M   Toggle sound',640,483,FONT.small,C.muted,'center');}
  else {glow(C.shooter,18);text('GAME OVER',640,271,FONT.heading,C.shooter,'center');ctx.shadowBlur=0;text('Score '+s.score,640,332,FONT.score,C.text,'center');text(waves[Math.min(2047,s.wave)],640,377,FONT.body,C.muted,'center');text('BEST '+ui.best,640,421,FONT.body,C.pickup,'center');if(ui.newBest)text('NEW BEST!',640,465,FONT.body,C.pickup,'center');text('Press Space or click to play again',640,548,FONT.body,C.player,'center');}
 }
 function draw(s,screen,ui){view();ctx.setTransform(1,0,0,1,0,0);ctx.globalAlpha=1;ctx.shadowBlur=0;ctx.fillStyle=C.background;ctx.fillRect(0,0,cw,ch);ctx.setTransform(scale,0,0,scale,ox,oy);ctx.save();ctx.beginPath();ctx.rect(0,0,1280,720);ctx.clip();ctx.fillStyle=C.background;ctx.fillRect(0,0,1280,720);
  const time=s.time;ctx.strokeStyle=C.violet;ctx.lineWidth=1;ctx.beginPath();for(let x=0;x<=1280;x+=VISUAL.grid){ctx.moveTo(x,0);ctx.lineTo(x,720);}for(let y=0;y<=720;y+=VISUAL.grid){ctx.moveTo(0,y);ctx.lineTo(1280,y);}ctx.stroke();
  for(const star of stars){ctx.globalAlpha=0.25+star.layer*0.2;ctx.fillStyle=star.layer===2?'#a8d9ff':'#8b73bd';const x=(star.x+time*(star.layer+1)*3-s.player.x*(star.layer+1)*0.012+1280)%1280,y=(star.y+time*(star.layer+1)*5-s.player.y*(star.layer+1)*0.012+720)%720;ctx.fillRect(x,y,star.size,star.size);}ctx.globalAlpha=1;
  ctx.save();const trauma=s.shake*s.shake*PARTICLES.shakePixels;ctx.translate(Math.sin(time*93)*trauma,Math.cos(time*117)*trauma);
  for(const p of s.pickups)if(p.active){ctx.globalAlpha=p.life<2?0.5+0.5*Math.sin(time*18):1;glow(C.pickup);polygon(p.x,p.y,20,4,0);ctx.fillStyle='#29220d';ctx.fill();ctx.stroke();ctx.shadowBlur=0;text(p.kind==='rapid'?'R':p.kind==='spread'?'S':p.kind==='shield'?'+':'B',p.x,p.y+6,FONT.body,C.pickup,'center');}ctx.globalAlpha=1;
  ctx.lineWidth=2;
  for(const e of s.enemies)if(e.active){const c=ENEMIES[e.kind];glow(C[e.kind],16);if(c.sides)polygon(e.x,e.y,c.radius,c.sides,e.angle+(e.kind==='drone'?0:time*0.3));else{ctx.beginPath();ctx.arc(e.x,e.y,c.radius,0,Math.PI*2);}ctx.fillStyle=C.violet;ctx.fill();ctx.stroke();ctx.shadowBlur=0;ctx.fillStyle=C[e.kind];ctx.beginPath();ctx.arc(e.x,e.y,3,0,Math.PI*2);ctx.fill();if(c.hp>1){for(let i=0;i<c.hp;i++){ctx.fillStyle=i<e.hp?C[e.kind]:'#3b2945';ctx.fillRect(e.x-c.hp*4+i*8,e.y+c.radius+8,5,3);}}}
  glow(C.player,12);ctx.lineWidth=3;ctx.beginPath();for(const b of s.bullets)if(b.active){ctx.moveTo(b.x,b.y);ctx.lineTo(b.x-b.vx*0.018,b.y-b.vy*0.018);}ctx.stroke();
  glow(C.shooter,15);for(const b of s.enemyBullets)if(b.active){ctx.beginPath();ctx.arc(b.x,b.y,7,0,Math.PI*2);ctx.fill();}
  ctx.globalCompositeOperation='lighter';for(const p of s.particles)if(p.active){ctx.globalAlpha=Math.max(0,p.life/p.maxLife);ctx.fillStyle=p.color;ctx.shadowColor=p.color;ctx.shadowBlur=6;ctx.fillRect(p.x-p.size/2,p.y-p.size/2,p.size,p.size);}ctx.globalCompositeOperation='source-over';ctx.globalAlpha=1;ctx.shadowBlur=0;
  const p=s.player;if(!s.over&&(p.invulnerable<=0||Math.floor(time*12)%2===0)){glow(C.player,20);ctx.lineWidth=2;ship(p.x,p.y,p.angle);if(p.moving){ctx.beginPath();ctx.moveTo(p.x-Math.cos(p.angle)*14,p.y-Math.sin(p.angle)*14);ctx.lineTo(p.x-Math.cos(p.angle)*(28+5*Math.sin(time*65)),p.y-Math.sin(p.angle)*(28+5*Math.sin(time*65)));ctx.stroke();}ctx.shadowBlur=0;}
  for(const t of s.texts)if(t.active){ctx.globalAlpha=t.life/0.8;text(t.text,t.x,t.y,FONT.body,C.pickup,'center');}ctx.globalAlpha=1;
  if(s.shockwave>0){glow(C.player,25);ctx.lineWidth=5;ctx.globalAlpha=s.shockwave/VISUAL.shockwaveTime;ctx.beginPath();ctx.arc(p.x,p.y,(1-s.shockwave/VISUAL.shockwaveTime)*1100,0,Math.PI*2);ctx.stroke();ctx.fillStyle='#35f2ff';ctx.globalAlpha*=0.12;ctx.fillRect(0,0,1280,720);ctx.globalAlpha=1;ctx.shadowBlur=0;}
  ctx.restore();
  ctx.fillStyle='#0a0618ba';ctx.fillRect(0,0,1280,120);text('S C O R E',32,27,FONT.label,C.muted);text(String(s.score),30,74,FONT.score);text(combos[s.multiplier],32,99,FONT.body,C.player);text('BEST '+ui.best,204,99,FONT.small,C.muted);text(waves[Math.min(2047,s.wave)],640,41,FONT.body,C.text,'center');text(left[Math.min(9999,s.enemyCount+s.spawnCount)],640,66,FONT.small,C.muted,'center');
  glow(C.player,8);ctx.lineWidth=1.5;for(let i=0;i<p.shields;i++)ship(1124+i*30,32,-Math.PI/2,10);glow(C.pickup,6);for(let i=0;i<Math.min(p.bombs,8);i++){ctx.beginPath();ctx.arc(1124+i*20,65,5,0,Math.PI*2);ctx.stroke();}ctx.shadowBlur=0;text(ui.muted?'M  SOUND OFF':'M  SOUND ON',1248,98,FONT.small,C.muted,'right');
  if(p.rapidTimer>0){ctx.fillStyle=C.pickup;ctx.fillRect(32,111,200*p.rapidTimer/PICKUPS.duration,3);}if(p.spreadTimer>0){ctx.fillStyle=C.splitter;ctx.fillRect(32,118,200*p.spreadTimer/PICKUPS.duration,3);}
  if(screen==='play'&&s.banner>0){ctx.globalAlpha=Math.min(1,s.banner,Math.max(0,(VISUAL.bannerTime-s.banner)*3));text(waves[Math.min(2047,s.wave)],640,304,FONT.banner,C.player,'center');ctx.globalAlpha=1;}if(screen==='play'&&s.waveState==='clear'){text('SECTOR CLEAR',640,310,FONT.heading,C.player,'center');text('BONUS INCOMING · RECHARGE',640,348,FONT.body,C.pickup,'center');}
  text('NEON VOID  /  DEEP SPACE SURVIVAL',32,696,FONT.small,C.muted);text('CLICK  FIRE   /   SPACE  BOMB   /   P  PAUSE',1248,696,FONT.small,C.muted,'right');
  if(screen!=='play')panel(screen,s,ui);ctx.shadowBlur=0;ctx.restore();
 }
 return {draw,clientToField(cx,cy){const rect=canvas.getBoundingClientRect();point.x=((cx-rect.left)*canvas.width/rect.width-ox)/scale;point.y=((cy-rect.top)*canvas.height/rect.height-oy)/scale;return point;}};
}
