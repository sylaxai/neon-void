export const ACTION_CONFIRM=1, ACTION_PAUSE=2, ACTION_BOMB=4, ACTION_MUTE=8;
export function createInput(canvas, toField) {
 const held = new Set();
 const move = {x:0,y:0};
 const pointer = {x:960,y:360};
 let actions=0, down=false;
 window.addEventListener('keydown', e=>{
  if (['Space','ArrowUp','ArrowDown','ArrowLeft','ArrowRight'].includes(e.code)) e.preventDefault();
  held.add(e.code);
  if (e.repeat) return;
  if (e.code==='Space') actions |= ACTION_CONFIRM | ACTION_BOMB;
  if (e.code==='Enter') actions |= ACTION_CONFIRM;
  if (e.code==='KeyP'||e.code==='Escape') actions |= ACTION_PAUSE;
  if (e.code==='KeyM') actions |= ACTION_MUTE;
 });
 window.addEventListener('keyup',e=>held.delete(e.code));
 window.addEventListener('blur',()=>{held.clear();down=false;actions=0;});
 canvas.addEventListener('pointermove',e=>{const p=toField(e.clientX,e.clientY);pointer.x=p.x;pointer.y=p.y;});
 canvas.addEventListener('pointerdown',e=>{if(e.button===0){down=true;actions|=ACTION_CONFIRM;const p=toField(e.clientX,e.clientY);pointer.x=p.x;pointer.y=p.y;}});
 window.addEventListener('pointerup',()=>{down=false;});
 return {
  moveVector(){move.x=Number(held.has('KeyD')||held.has('ArrowRight'))-Number(held.has('KeyA')||held.has('ArrowLeft'));move.y=Number(held.has('KeyS')||held.has('ArrowDown'))-Number(held.has('KeyW')||held.has('ArrowUp'));const n=Math.hypot(move.x,move.y);if(n>1){move.x/=n;move.y/=n;}return move;},
  aim(){return pointer;}, firing(){return down||held.has('Space');},
  takeActions(){const a=actions;actions=0;return a;}
 };
}
