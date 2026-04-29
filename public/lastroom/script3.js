/* ═══════════════════════════════════════
   PEARL ABYSS  ·  script2.js
   Complete Game Engine
═══════════════════════════════════════ */

/* ── BUBBLE PARTICLES ── */
(function(){
  const cv=document.getElementById('bubbles'),cx=cv.getContext('2d');
  let W,H;
  const rsz=()=>{W=cv.width=window.innerWidth;H=cv.height=window.innerHeight;};
  rsz();window.addEventListener('resize',rsz);
  const C=['rgba(0,180,216,','rgba(155,93,229,','rgba(240,234,255,','rgba(0,120,160,'];
  const pts=Array.from({length:55},()=>({
    x:Math.random()*1920,y:Math.random()*1080,
    vx:(Math.random()-.5)*.22,vy:-(Math.random()*.28+.05),
    r:Math.random()*2+.3,a:Math.random()*.3+.04,
    col:C[Math.floor(Math.random()*C.length)],life:Math.random()
  }));
  (function draw(){
    cx.clearRect(0,0,W,H);
    pts.forEach(p=>{
      p.x+=p.vx;p.y+=p.vy;p.life-=.0014;
      if(p.life<=0||p.y<-5){p.x=Math.random()*W;p.y=H+5;p.life=1;}
      cx.globalAlpha=p.a*Math.sin(p.life*Math.PI);
      cx.beginPath();cx.arc(p.x,p.y,p.r,0,Math.PI*2);
      cx.fillStyle=p.col+'1)';cx.fill();
    });
    cx.globalAlpha=1;requestAnimationFrame(draw);
  })();
})();

/* ── CONFETTI (WIN) ── */
function runConfetti(){
  const cv=document.getElementById('confetti-cv');
  cv.width=window.innerWidth;cv.height=window.innerHeight;
  const cx=cv.getContext('2d');
  const cols=['#e9c46a','#00b4d8','#9b5de5','#e63946','#f0eaff'];
  const pts=Array.from({length:100},()=>({
    x:Math.random()*cv.width,y:Math.random()*-200,
    vx:(Math.random()-.5)*3,vy:Math.random()*4+2,
    r:Math.random()*6+3,col:cols[Math.floor(Math.random()*cols.length)],
    rot:Math.random()*360,rotV:(Math.random()-.5)*6
  }));
  let alive=true;
  (function drop(){
    if(!alive)return;
    cx.clearRect(0,0,cv.width,cv.height);
    pts.forEach(p=>{
      p.x+=p.vx;p.y+=p.vy;p.rot+=p.rotV;
      if(p.y>cv.height+20){p.y=-10;p.x=Math.random()*cv.width;}
      cx.save();cx.translate(p.x,p.y);cx.rotate(p.rot*Math.PI/180);
      cx.fillStyle=p.col;cx.fillRect(-p.r,-p.r/2,p.r*2,p.r);
      cx.restore();
    });
    requestAnimationFrame(drop);
  })();
  setTimeout(()=>alive=false,8000);
}

/* ═══════════════════════════════════════
   MAIN GAME OBJECT
═══════════════════════════════════════ */
const G2 = {

  /* ── STATE ── */
  s:{
    name:'EXPLORER', usn:'—', score:100,
    screen:'main', panelBack:'main',
    shelf:[],    // [{type,img,label}]
    sel:null,    // selected item type

    /* flags */
    bookRead:       false,
    moonUnlocked:   false,
    gateSolved:     false,
    img36Hub:       false,
    img47Visited:   false,

    /* lion */
    lion:{pearl:false,star:false,redstone:false},

    /* gate */
    gateVals:[0,0,0,0,0],

    /* timer */
    timerStart:null, timerRef:null,
  },

  SYMBOLS:['#','$','^','*','`',')','~'],
  GATE_ANS:['^','^','*','`','~'],

  /* ── TITLES ── */
  T:{
    main:'THE GREAT HALL',
    img32:'THE ABYSS GATE',
    img33:'THE VAULT',
    img34:'THE DOOM CHAMBER',
    img35:'THE SANCTUM',
    img36:'THE OCEAN PALACE',
    img37:'THE PEARL THRONE',
    img38:'ANCIENT TOME',
    img39:'MOON WINDOW',
    img40:'TELESCOPE VIEW',
    img41:'THE SANCTUM DESK',
    img42:'CYBER CAT',
    img43:'THE WATCHER',
    img44:'THE SERPENT',
    img47:'CORAL GARDEN',
    img46:'CORAL FLUTE',
    img49:'FLUTE CLOSEUP',
    img50:'THE LABORATORY',
  },

  /* ── IMAGE MAP ── */
  IMG:{
    main:'image31.jpg', img32:'image32.jpg', img33:'image33.jpg',
    img34:'image34.jpg', img35:'image35.jpg', img36:'image36.jpg',
    img37:'image37.jpg', img38:'image38.jpg', img39:'image39.jpg',
    img40:'image40.jpg', img41:'image41.jpg', img42:'image42.jpg',
    img43:'image43.jpg', img44:'image44.jpg', img46:'image46.jpg',
    img47:'image47.jpg', img49:'image49.jpg', img50:'image50.jpg',
  },

  /* ── HOTSPOT REGISTRY ── */
  /* x,y,w,h in % — invisible, no hover style */
  HS:{
    main:[
      {id:'h-sculp1',  x:36,  y:54, w:5,  h:20, a:'SCULP1'},
      {id:'h-sculp2',  x:20, y:54, w:5,  h:20, a:'SCULP2'},
      {id:'h-sculp3',  x:73, y:54, w:5,  h:20, a:'SCULP3'},
      {id:'h-sculp4',  x:63, y:55, w:5,  h:20, a:'SCULP4'},
      {id:'h-lion',    x:42, y:15,  w:17, h:40, a:'LION'},
      {id:'h-water',   x:30, y:80, w:40, h:20, a:'WATER'},
      {id:'h-door1',   x:5,  y:18, w:7,  h:56, a:'DOOR1'},
      {id:'h-door2',   x:66, y:18, w:7,  h:40, a:'DOOR2'},
      {id:'h-door3',   x:87, y:18, w:7,  h:56, a:'DOOR3'},
    ],
    img32:[
      {id:'h-gate',    x:27, y:8,  w:23, h:82, a:'GATE'},
    ],
    img33:[
      {id:'h-cat',     x:80, y:55, w:15, h:20, a:'CAT'},
      {id:'h-doll',    x:65, y:50, w:14, h:20, a:'DOLL'},
    ],
    img34:[
      {id:'h-tv',      x:60, y:42, w:10, h:20, a:'TV34'},
      {id:'h-snake',   x:60, y:72, w:10, h:20, a:'SNAKE34'},
      {id:'h-moon',    x:45,  y:3,  w:20, h:10, a:'MOON34'},
    ],
    img35:[
      {id:'h-tele',    x:20,  y:8,  w:38, h:38, a:'TELE35'},
      {id:'h-book',    x:48, y:52, w:32, h:20, a:'BOOK35'},
      {id:'h-desk',    x:80, y:66, w:26, h:14, a:'DESK35'},
    ],
    img36:[
      {id:'h-ctr',     x:22, y:5,  w:36, h:65, a:'CTR36'},
      {id:'h-herbs',   x:0,  y:70, w:22, h:30, a:'HERB36'},
    ],
    img37:[
      {id:'h-pearl',   x:17, y:70, w:30, h:30, a:'PEARL37'},
    ],
    img40:[
      {id:'h-lens',    x:14, y:5,  w:72, h:88, a:'LENS40'},
    ],
    img41:[
      {id:'h-screw',   x:26, y:50, w:50, h:30, a:'SCREW41'},
    ],
    img42:[
      {id:'h-cd',      x:24, y:52, w:52, h:38, a:'CD42'},
    ],
    img43:[
      {id:'h-dollin',  x:10, y:5,  w:80, h:88, a:'DOLLIN43'},
    ],
    img44:[
      {id:'h-gem',     x:44, y:30,  w:14, h:18, a:'GEM44'},
    ],
    img47:[
      /* no flute here — coral garden is observation only */
    ],
    img46:[
      {id:'h-flute46', x:26, y:12, w:50, h:68, a:'FLUTE46'},
    ],
    img49:[
      {id:'h-flute49', x:20, y:5,  w:65, h:90, a:'FLUTE49'},
    ],
    img50:[
      {id:'h-monitor', x:46, y:25,  w:38, h:60, a:'MONITOR50'},
    ],
    img39:[
      {id:'h-star',    x:68, y:4,  w:28, h:38, a:'STAR39'},
    ],
  },

  /* ═══ ENTRY POINTS ═══ */
  showInfo(){
    /* Skip name/USN — go straight to game */
    document.getElementById('landing').style.opacity='0';
    document.getElementById('landing').style.transition='opacity .6s';
    setTimeout(()=>{
      document.getElementById('landing').style.display='none';
      document.getElementById('game').style.display='flex';
      this._load('main');
      this._refreshShelf();
    },620);
  },

  beginGame(){ /* unused */ },

  /* ═══ TIMER — removed ═══ */
  _startTimer(){ /* disabled */ },

  /* ═══ NAVIGATION ═══ */
  goto(id){
    const v=document.getElementById('veil');
    v.classList.add('in');
    setTimeout(()=>{this._load(id);v.classList.remove('in');},300);
  },

  _load(id){
    this.s.screen=id;
    const sc=document.getElementById('scene');
    sc.style.opacity='0';
    setTimeout(()=>{
      if(this.IMG[id]) sc.style.backgroundImage=`url('${this.IMG[id]}')`;
      sc.style.opacity='1';
    },280);

    document.getElementById('room-label').textContent=this.T[id]||id;

    /* Back button */
    const bb=document.getElementById('back-btn');
    bb.style.display=(id==='main')?'none':'block';

    /* Back target */
    const backMap={
      img32:'main',img33:'main',img34:'main',img35:'main',
      img36:'main',img37:'img36',img38:'img35',img39:'img35',
      img40:'img35',img41:'img35',img42:'img33',img43:'img33',
      img44:'img34',img47:'img50',img46:'img36',img49:'img36',img50:'img34',
    };
    this.s.panelBack=backMap[id]||'main';
    if(id==='img36') this.s.panelBack='main';

    /* Build hotspots */
    const hl=document.getElementById('hotlayer');
    hl.innerHTML='';
    (this.HS[id]||[]).forEach(h=>{
      const d=document.createElement('div');
      d.className='hs';d.id=h.id;
      d.style.cssText=`left:${h.x}%;top:${h.y}%;width:${h.w}%;height:${h.h}%`;
      d.onclick=(e)=>{e.stopPropagation();this.act(h.a);};
      hl.appendChild(d);
    });

    /* Screen hooks */
    if(id==='img38') this.s.bookRead=true;
    this._pips();
    this._updateScore();
  },

  goBack(){
    if(document.getElementById('gate-modal').style.display!=='none'){
      this.closeGate();return;
    }
    this.goto(this.s.panelBack);
  },

  /* ═══ ACTION DISPATCHER ═══ */
  act(a){
    switch(a){

      /* ── MAIN HALL SCULPTURES ── */
      case 'SCULP1':
        this.showMsg('"In the heart of the ocean, a magical pearl glows only for those whose wishes are pure."');
        break;
      case 'SCULP2':
        this.showMsg('"May the universal star guide my mind, power my spirit, and light my path."');
        break;
      case 'SCULP3':
        this.showMsg('"The serpent guards the stone, but only the fearless heart can hold its light."');
        break;
      case 'SCULP4':
        this.showMsg('"Silence speaks louder than words. The answer lies within."');
        break;

      /* ── LION ── */
      case 'LION': this.openLion(); break;

      /* ── DOORS ── */
      case 'DOOR1': this.goto('img34'); break;
      case 'DOOR2': this.goto('img33'); break;
      case 'DOOR3': this.goto('img35'); break;

      /* ── WATER → GATE ── */
      case 'WATER':
        this.goto('img32');
        break;

      /* ── UNDERWATER GATE ── */
      case 'GATE':
        if(this.s.gateSolved){ this.goto('img36'); }
        else { this.openGate(); }
        break;

      /* ── HACKER ROOM ── */
      case 'CAT':    this.goto('img42'); break;
      case 'DOLL':   this.goto('img43'); break;

      /* ── CD COLLECT ── */
      case 'CD42':
        if(!this._has('cd')){
          this._collect('cd','image48.jpg','CD Disc');
          this.toast('CD DISC OBTAINED');
        } else { this.showMsg('You already have the disc.'); }
        break;

      /* ── DOLL + KEY = LENSE ── */
      case 'DOLLIN43':
        if(this._has('key')&&this.s.sel==='key'){
          if(!this._has('lense')){
            this._remove('key');
            this._collect('lense','image52.jpg','Magic Lense');
            this.toast('MAGIC LENSE OBTAINED');
          } else { this.showMsg('You already have the lense.'); }
        } else {
          this.showMsg('The doll\’s eye, once sealed, opens only with a key. Made of magical glass lenses, it holds the power to see the entire world..');
        }
        break;

      /* ── DOOM ROOM ── */
      case 'TV34':    this.goto('img50'); break;
      case 'SNAKE34': this.goto('img44'); break;
      case 'MOON34':
        if(this.s.moonUnlocked){ this.goto('img39'); }
        else { this.showMsg('The moon is hidden from this angle. Find a way to see through the mist first.'); }
        break;

      /* ── LAB MONITOR + CD ── */
      case 'MONITOR50':
        if(this._has('cd')&&this.s.sel==='cd'){
          /* Show coral → go to image47 */
          this.goto('img47');
        } else {
          this.showMsg('Turn on the television… and let it whisper where the enchanted relic is hidden—an object so powerful it could bend even the most poisonous queen to its will.');
        }
        break;

      /* ── SNAKE + FLUTE = REDSTONE ── */
      case 'GEM44':
        if(this._has('flute')&&this.s.sel==='flute'){
          if(!this._has('redstone')){
            this._remove('flute');
            this._collect('redstone','image53.jpg','Redstone Gem');
            this.toast('REDSTONE GEM OBTAINED');
        
          } else { this.showMsg('You already hold the redstone.'); }
        } else {
          this.showMsg('"The serpent guards the stone, but only the fearless heart can hold its light." ');
        }
        break;

      /* ── SANCTUM ── */
      case 'TELE35':  this.goto('img40'); break;
      case 'BOOK35':  this.goto('img38'); break;
      case 'DESK35':  this.goto('img41'); break;

      /* ── TELESCOPE LENS VIEW ── */
      case 'LENS40':
        if(this._has('lense')&&this.s.sel==='lense'){
          this._remove('lense');
          this.s.moonUnlocked=true;
          this.toast('MOON PATH UNLOCKED');
          setTimeout(()=>this.goto('img39'),600);
        } else {
          this.showMsg('The telescope lens is clouded. Place the magic lense to see through the darkness.');
        }
        break;

      /* ── DESK SCREWDRIVER → KEY ── */
      case 'SCREW41':
        if(!this._has('key')){
          this._collect('key','image55.jpg','Ancient Key');
          this.toast('ANCIENT KEY OBTAINED');
        } else { this.showMsg('The key is already in your possession.'); }
        break;

      /* ── OCEAN PALACE ── */
      case 'CTR36':  this.goto('img37'); break;
      case 'HERB36': this.goto('img46'); break;

      /* ── FLUTE — collect from image46 (coral closeup) ── */
      case 'FLUTE46':
        if(!this._has('flute')){
          this._collect('flute','image49.jpg','Purple Flute');
          this.toast('PURPLE FLUTE OBTAINED');
        } else { this.showMsg('You already carry the purple flute.'); }
        break;

      /* ── CORAL FLUTE (image47 — observation only, no collect) ── */
      case 'FLUTE47': break;

      /* ── PEARL THRONE ── */
      case 'PEARL37':
        if(!this._has('pearl')){
          this._collect('pearl','image54.jpg','Pearl Gem');
          this.toast('PEARL GEM OBTAINED');
        } else { this.showMsg('The pearl gem is already yours.'); }
        break;

      /* ── CORAL FLUTE (image47 view) ── */
      case 'FLUTE47':
        if(!this._has('flute')){
          this._collect('flute','image49.jpg','Purple Flute');
          this.toast('PURPLE FLUTE OBTAINED');
        } else { this.showMsg('You already carry the purple flute.'); }
        break;

      /* ── FLUTE CLOSEUP (image49) ── */
      case 'FLUTE49':
        if(!this._has('flute')){
          this._collect('flute','image49.jpg','Purple Flute');
          this.toast('PURPLE FLUTE OBTAINED');
        } else { this.showMsg('You already carry the purple flute.'); }
        break;

      /* ── MOON STAR ── */
      case 'STAR39':
        if(!this._has('star')){
          this._collect('star','image51.jpg','Star Gem');
          this.toast('STAR GEM OBTAINED');
        } else { this.showMsg('The star gem is already yours.'); }
        break;
    }
  },

  /* ═══ INVENTORY HELPERS ═══ */
  _collect(type,img,label){
    this.s.shelf.push({type,img,label});
    this._refreshShelf();
    this._flash('ok');
    this._pips();
  },
  _remove(type){
    const i=this.s.shelf.findIndex(x=>x.type===type);
    if(i>-1) this.s.shelf.splice(i,1);
    if(this.s.sel===type) this.s.sel=null;
    this._refreshShelf();
    this._pips();
  },
  _has(type){ return !!this.s.shelf.find(x=>x.type===type); },

  _refreshShelf(){
    const c=document.getElementById('shelf-slots');
    c.innerHTML='';
    if(!this.s.shelf.length){
      c.innerHTML='<div class="shelf-empty">EMPTY</div>';return;
    }
    this.s.shelf.forEach(item=>{
      const s=document.createElement('div');
      s.className='slot'+(this.s.sel===item.type?' sel':'');
      s.innerHTML=`
        <img src="${item.img}" alt="${item.label}"
          onerror="this.style.display='none';this.nextElementSibling.style.display='block'">
        <div style="display:none;font-size:20px">◈</div>
        <div class="slot-lbl">${item.label.substring(0,9)}</div>`;
      s.onclick=()=>{
        this.s.sel=(this.s.sel===item.type)?null:item.type;
        this._refreshShelf();
      };
      c.appendChild(s);
    });
  },

  /* ═══ MESSAGE OVERLAY ═══ */
  showMsg(txt){
    document.getElementById('msg-text').textContent=txt;
    document.getElementById('msg-ov').style.display='flex';
  },
  closeMsg(){ document.getElementById('msg-ov').style.display='none'; },

  /* ═══ TOAST ACHIEVEMENT ═══ */
  toast(txt){
    const t=document.getElementById('toast');
    document.getElementById('toast-text').textContent=txt;
    t.style.display='block';
    clearTimeout(this._toastTimer);
    this._toastTimer=setTimeout(()=>t.style.display='none',2800);
  },

  /* ═══ LION MODAL ═══ */
  openLion(){
    document.getElementById('lion-modal').style.display='flex';
    this._updateLionUI();
    this._injectLionShelf();
  },
  closeLion(){ document.getElementById('lion-modal').style.display='none'; },

  _injectLionShelf(){
    /* Mirror the main shelf inside the lion modal so player can see inventory */
    let shelf=document.getElementById('lion-shelf');
    if(!shelf){
      shelf=document.createElement('div');
      shelf.id='lion-shelf';
      shelf.style.cssText=`display:flex;gap:10px;justify-content:center;
        flex-wrap:wrap;margin:18px 0 4px;padding:12px 16px;
        border:1px solid rgba(0,180,216,.15);background:rgba(0,0,20,.5);`;
      shelf.innerHTML=`<div style="width:100%;text-align:center;font-family:'Share Tech Mono',monospace;
        font-size:9px;letter-spacing:4px;color:rgba(0,180,216,.4);margin-bottom:8px;">YOUR RELICS</div>`;
      const gemRow=document.getElementById('lion-result');
      gemRow.parentNode.insertBefore(shelf,gemRow);
    }
    /* Re-render shelf items */
    const existing=shelf.querySelectorAll('.ls-item');
    existing.forEach(e=>e.remove());
    if(!this.s.shelf.length){
      const empty=document.createElement('div');
      empty.className='ls-item';
      empty.style.cssText='font-family:Share Tech Mono,monospace;font-size:8px;color:rgba(0,180,216,.2);letter-spacing:2px;';
      empty.textContent='EMPTY';
      shelf.appendChild(empty);
    } else {
      this.s.shelf.forEach(item=>{
        const d=document.createElement('div');
        d.className='ls-item';
        d.style.cssText=`width:64px;height:64px;border:1px dashed rgba(0,180,216,.22);
          border-radius:4px;display:flex;flex-direction:column;align-items:center;
          justify-content:center;background:rgba(0,180,216,.02);
          ${this.s.sel===item.type?'border-color:var(--gold);box-shadow:0 0 12px rgba(233,196,106,.3);':''}`;
        d.innerHTML=`<img src="${item.img}" alt="${item.label}" style="max-width:84%;max-height:70%;object-fit:contain;"
            onerror="this.style.display='none'">
          <div style="font-family:'Share Tech Mono',monospace;font-size:6px;color:rgba(0,180,216,.3);margin-top:2px;">${item.label.substring(0,8)}</div>`;
        d.onclick=()=>{
          this.s.sel=(this.s.sel===item.type)?null:item.type;
          this._refreshShelf();
          this._injectLionShelf();
        };
        shelf.appendChild(d);
      });
    }
  },

  placeGem(type){
    if(this.s.lion[type]){ return; }
    if(!this._has(type)){
      document.getElementById('lion-result').innerHTML=
        `<div class="lion-partial">You need the ${type} gem. Go explore!</div>`;
      return;
    }
    this._remove(type);
    this.s.lion[type]=true;
    this._flash('ok');
    this._updateLionUI();
    const done=Object.values(this.s.lion).filter(Boolean).length;
    if(done===3){
      document.getElementById('lion-result').innerHTML=
        '<div class="lion-ok">✦ SUCCESSFULLY FOUND THE PATH ✦</div>';
      this._flash('win');
      this._pips();
      setTimeout(()=>{ this.closeLion(); this._win(); },2000);
    } else {
      const rem=3-done;
      document.getElementById('lion-result').innerHTML=
        `<div class="lion-partial">${rem} gem${rem>1?'s':''} remaining...</div>`;
    }
  },

  _updateLionUI(){
    [
      {k:'pearl', ci:'gci-pearl',cl:'gcl-pearl',cr:'gcr-pearl',s:'image54.jpg'},
      {k:'star',  ci:'gci-star', cl:'gcl-star', cr:'gcr-star', s:'image51.jpg'},
      {k:'redstone',ci:'gci-red',cl:'gcl-red',  cr:'gcr-red',  s:'image53.jpg'},
    ].forEach(g=>{
      if(this.s.lion[g.k]){
        const img=document.getElementById(g.ci);
        img.src=g.s;img.style.display='block';
        document.getElementById(g.cl).style.display='none';
        document.getElementById(g.cr).classList.add('gc-placed');
      }
    });
  },

  /* ═══ GATE SYMBOL PUZZLE ═══ */
  openGate(){
    document.getElementById('gate-modal').style.display='flex';
    this._buildGateOrbs();
  },
  closeGate(){ document.getElementById('gate-modal').style.display='none'; },

  _buildGateOrbs(){
    const col=document.getElementById('gate-orbs');
    col.innerHTML='';
    this.s.gateVals.forEach((v,i)=>{
      const btn=document.createElement('div');
      btn.className='sorb';btn.id=`so${i}`;
      btn.textContent=this.SYMBOLS[v];
      btn.onclick=()=>{
        this.s.gateVals[i]=(this.s.gateVals[i]+1)%this.SYMBOLS.length;
        btn.textContent=this.SYMBOLS[this.s.gateVals[i]];
      };
      col.appendChild(btn);
    });
  },

  decodeGate(){
    if(!this.s.bookRead){
      this.closeGate();
      this.showMsg('The gate will not respond. Seek the ancient knowledge first — find the book in the sanctum.');
      return;
    }
    const cur=this.s.gateVals.map(v=>this.SYMBOLS[v]);
    const ok=cur.every((s,i)=>s===this.GATE_ANS[i]);
    if(ok){
      this.s.gateSolved=true;
      this._flash('win');
      this.s.gateVals.forEach((_,i)=>{
        const b=document.getElementById(`so${i}`);
        if(b) b.classList.add('correct');
      });
      setTimeout(()=>{ this.closeGate(); this.s.img36Hub=true; this.goto('img36'); },1000);
    } else {
      this._flash('err');
      const gw=document.querySelector('.gate-orbs');
      gw.classList.add('shk');
      setTimeout(()=>gw.classList.remove('shk'),400);
      this.showMsg('The gate rejects the pattern. Study the ancient tome carefully...');
    }
  },

  /* ═══ FX ═══ */
  _flash(t){
    const f=document.getElementById('flash');
    f.className=`fl-${t}`;
    setTimeout(()=>f.className='',t==='win'?1600:540);
  },
  _updateScore(){
    document.getElementById('score-disp').textContent=this.s.score;
  },
  _pips(){
    document.getElementById('gp-pearl').classList.toggle('lit',
      this._has('pearl')||this.s.lion.pearl);
    document.getElementById('gp-star').classList.toggle('lit',
      this._has('star')||this.s.lion.star);
    document.getElementById('gp-red').classList.toggle('lit',
      this._has('redstone')||this.s.lion.redstone);
  },

  /* Hint system (-3 pts) */
  showHint(){
    this.s.score=Math.max(0,this.s.score-3);
    this._updateScore();
    const hints={
      main:'Examine the sculptures, the lion, and the water closely.',
    };
    this.showMsg('💡 HINT: '+(hints[this.s.screen]||'Explore everything carefully.'));
  },

  /* ═══ WIN ═══ */
  _win(){
    this._flash('win');
    document.getElementById('ws-name').textContent='OCEAN EXPLORER';
    document.getElementById('ws-usn').textContent='—';
    document.getElementById('ws-score').textContent=this.s.score;
    document.getElementById('ws-time').textContent='—';
    setTimeout(()=>{
      document.getElementById('win-screen').style.display='flex';
      runConfetti();
    },900);
  },
};

/* Expose hint button to HTML (added via goBack btn area in HUD) */
document.addEventListener('DOMContentLoaded',()=>{
  /* Add hint button to HUD */
  const hr=document.querySelector('.hud-right');
  const hb=document.createElement('button');
  hb.className='ocean-btn sec-btn';
  hb.style.cssText='font-size:9px;padding:7px 14px;';
  hb.textContent='💡 HINT';
  hb.onclick=()=>G2.showHint();
  hr.appendChild(hb);
});