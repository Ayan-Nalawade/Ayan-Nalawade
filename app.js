const $=s=>document.querySelector(s);
const reduce=matchMedia('(prefers-reduced-motion: reduce)').matches;
const safe=f=>{try{return f()}catch(e){}};
const clamp=v=>v<0?0:v>1?1:v;
let scene=null,panelled=false,flowApply=()=>{};
function clearFx(els){for(const el of els){el.style.opacity='';el.style.transform='';el.style.visibility='';el.style.maskImage='';el.style.webkitMaskImage='';}}
const BLOG='https://ayannalawade-blog.vercel.app/';
const IMG=BLOG+'image_data/';
const THUMB=/^(?!.*\.\.)[\w./ -]+\.(png|jpe?g|gif|webp)$/i;
function pin(title,thumb){
  const a=document.createElement('a');
  a.className='pin pin-photo';
  a.href=BLOG;
  if(thumb&&THUMB.test(thumb)){
    const img=document.createElement('img');
    img.src=IMG+thumb;img.alt=title;img.loading='lazy';img.referrerPolicy='no-referrer';
    a.appendChild(img);
  }else a.classList.add('title-only');
  const t=document.createElement('span');
  t.className='pin-title';
  t.textContent=title;
  a.appendChild(t);
  return a;
}
function initBlog(){
  const host=$('#pins');
  if(!host||!window.fetch) return;
  const ac=safe(()=>new AbortController());
  const bail=ac?setTimeout(()=>ac.abort(),4000):null;
  window.blogReady=fetch(BLOG+'api/blogs',ac?{signal:ac.signal}:undefined).then(r=>r.ok?r.json():Promise.reject(r.status)).then(list=>{
    clearTimeout(bail);
    if(!Array.isArray(list)) return 0;
    const posts=list.filter(p=>p&&p.name!=='sample-post.txt'&&p.title);
    const shot=p=>p.thumbnail&&THUMB.test(p.thumbnail);
    const first=['FullAdder.txt','sumo-bot.txt','ChessHacks.txt','DocsGPT.txt','spurhacks.txt','Catalyst.txt'];
    const rank=p=>{const i=first.indexOf(p.name);return i<0?first.length:i;};
    const pick=posts.filter(shot).sort((a,b)=>rank(a)-rank(b)).slice(0,6);
    for(const p of posts){if(pick.length>=6) break;if(!shot(p)) pick.push(p);}
    if(!pick.length) return 0;
    host.replaceChildren(...pick.map(p=>pin(String(p.title),p.thumbnail)));
    return pick.length;
  }).catch(()=>{clearTimeout(bail);return 0;});
}
const GRAIN=[];
function buildGrain(){
  const S=120,cell=2,n=12;
  for(let k=1;k<=n;k++){
    const keep=1-k/(n+1);
    const c=document.createElement('canvas');c.width=c.height=S;
    const g=c.getContext('2d');
    g.fillStyle='#fff';
    for(let y=0;y<S;y+=cell) for(let x=0;x<S;x+=cell){if(Math.random()<keep) g.fillRect(x,y,cell,cell);}
    GRAIN.push(`url("${c.toDataURL('image/png')}")`);
  }
}
function setGrain(el,t){
  if(!GRAIN.length||t<=.02){if(el.style.maskImage||el.style.webkitMaskImage){el.style.maskImage='';el.style.webkitMaskImage='';}return;}
  const u=GRAIN[Math.min(GRAIN.length-1,Math.floor(t*GRAIN.length))];
  if(el.style.maskImage===u) return;
  el.style.webkitMaskImage=u;el.style.maskImage=u;
  el.style.webkitMaskSize='120px 120px';el.style.maskSize='120px 120px';
}
function drive(p){if(scene) safe(()=>scene.set({progress:clamp(p)}));}
function initPanels(){
  if(reduce) return false;
  const panels=[...document.querySelectorAll('.panel')];
  if(panels.length<2) return false;
  const last=panels.length-1;
  let space=null;
  const roomy=()=>matchMedia('(min-width:860px) and (min-height:620px)').matches;
  const fits=()=>panels.every(p=>p.scrollHeight<=innerHeight+2);
  function engage(){
    if(panelled) return true;
    document.body.classList.add('panels');
    if(!roomy()||!fits()){document.body.classList.remove('panels');return false;}
    if(!space){space=document.createElement('div');space.className='scroll-space';space.setAttribute('aria-hidden','true');document.body.appendChild(space);}
    space.style.height=(panels.length*100)+'vh';
    clearFx(document.querySelectorAll('.stop'));
    panelled=true;
    return true;
  }
  function drop(){
    if(!panelled) return;
    panelled=false;
    document.body.classList.remove('panels');
    clearFx(panels);
    flowApply();
  }
  function apply(){
    if(!panelled) return;
    const max=document.documentElement.scrollHeight-innerHeight;
    const pos=(max>0?scrollY/max:0)*last;
    panels.forEach((el,i)=>{
      const d=pos-i,a=Math.abs(d);
      const t=a<=.34?0:clamp((a-.34)/.46);
      setGrain(el,t);
      el.style.opacity=clamp(1-(t-.7)/.3).toFixed(3);
      el.style.transform=`translateY(${(d*-46).toFixed(1)}px)`;
      el.style.visibility=t<1?'visible':'hidden';
    });
    drive(pos/last);
  }
  const started=engage();
  if(started) apply();
  addEventListener('scroll',apply,{passive:true});
  addEventListener('resize',()=>{if(panelled&&!(roomy()&&fits())) drop();else if(!panelled) engage();if(panelled){space.style.height=(panels.length*100)+'vh';apply();}},{passive:true});
  addEventListener('load',apply);
  if(document.fonts) document.fonts.ready.then(apply).catch(()=>{});
  return started;
}
function initPageDissolve(){
  const stops=[...document.querySelectorAll('.stop')];
  function apply(){
    if(panelled) return;
    const doc=document.documentElement.scrollHeight-innerHeight;
    drive(doc>0?scrollY/doc:0);
    if(reduce) return;
    const vh=innerHeight;
    for(const el of stops){
      const r=el.getBoundingClientRect();
      const ramp=Math.max(1,Math.min(r.height,vh)*.5);
      const inR=clamp((vh-r.top)/ramp),outR=clamp(r.bottom/ramp);
      const t=1-Math.min(inR,outR);
      setGrain(el,t);
      el.style.opacity=clamp(1-(t-.7)/.3).toFixed(3);
      el.style.transform=`translateY(${((1-inR)*22-(1-outR)*22).toFixed(1)}px)`;
    }
  }
  flowApply=apply;
  apply();
  addEventListener('scroll',apply,{passive:true});
  addEventListener('resize',apply,{passive:true});
  addEventListener('load',apply);
  if(document.fonts) document.fonts.ready.then(apply).catch(()=>{});
}
function initGreeting(){
  if(reduce) return;
  const s=$('.stop-street');
  if(!s) return;
  s.classList.add('armed');
  setTimeout(()=>s.classList.add('in'),40);
  setTimeout(()=>s.classList.remove('armed'),2200);
}
let started=false;
function runInits(){
  if(started) return;
  started=true;
  if(window.ParkScene) scene=safe(()=>ParkScene.mount($('#park'),{progress:0}))||null;
  if(scene){window.park=scene;document.body.classList.add('scene');safe(()=>scene.setAmbient(!reduce));}
  safe(buildGrain);
  safe(initPageDissolve);
  safe(initPanels);
  if(!panelled) document.body.classList.remove('panels');
  safe(initGreeting);
  safe(initBlog);
  const mark=()=>document.body.classList.toggle('scrolled',scrollY>40);
  mark();
  addEventListener('scroll',mark,{passive:true});
  if(panelled) safe(()=>dispatchEvent(new Event('scroll')));
}
requestAnimationFrame(runInits);
