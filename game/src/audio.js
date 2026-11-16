export function createAudio(){
 let context=null,master=null,muted=false,playing=false,tick=0,shots=0,noise=null;
 function tone(frequency,duration,gain=0.025,type='sine',delay=0,end=frequency){if(!context||muted)return;const t=context.currentTime+delay,o=context.createOscillator(),g=context.createGain();o.type=type;o.frequency.setValueAtTime(frequency,t);o.frequency.exponentialRampToValueAtTime(Math.max(10,end),t+duration);g.gain.setValueAtTime(gain,t);g.gain.exponentialRampToValueAtTime(0.0001,t+duration);o.connect(g);g.connect(master);o.start(t);o.stop(t+duration);}
 function burst(duration,gain){if(!context||muted)return;const t=context.currentTime,s=context.createBufferSource(),g=context.createGain(),filter=context.createBiquadFilter();s.buffer=noise;filter.type='lowpass';filter.frequency.value=1800;g.gain.setValueAtTime(gain,t);g.gain.exponentialRampToValueAtTime(0.0001,t+duration);s.connect(filter);filter.connect(g);g.connect(master);s.start(t);s.stop(t+duration);}
 function notes(values,speed){for(let i=0;i<values.length;i++)tone(values[i],0.25,0.025,'sine',i*speed);}
 return {
  unlock(){if(!context){const Audio=window.AudioContext||window.webkitAudioContext;if(!Audio)return;context=new Audio();master=context.createGain();master.gain.value=muted?0:0.6;master.connect(context.destination);noise=context.createBuffer(1,context.sampleRate,context.sampleRate);const data=noise.getChannelData(0);let seed=917;for(let i=0;i<data.length;i++){seed=(Math.imul(seed,1664525)+1013904223)|0;data[i]=(seed>>>0)/2147483648-1;}setInterval(()=>{if(playing&&!muted&&context.state==='running'){tone(tick++%4===3?82.41:55,0.22,0.012);}},400);}if(context.state==='suspended')context.resume().catch(()=>{});},
  shoot(){if(++shots%2===0)tone(760,0.055,0.012,'square',0,320);},
  explosion(size=1){burst(0.15+size*0.04,0.035);tone(130,0.22,0.035,'sine',0,32);},
  hit(){tone(110,0.22,0.028,'sawtooth',0,40);burst(0.2,0.04);},
  pickup(){notes([660,990],0.08);},waveClear(){notes([330,440,660,880],0.12);},gameOver(){notes([330,262,196,110],0.2);},
  bomb(){burst(0.7,0.06);tone(80,0.65,0.07,'sine',0,20);},
  toggleMute(){muted=!muted;if(master)master.gain.value=muted?0:0.6;return muted;},
  setPlaying(value){playing=value;}
 };
}
