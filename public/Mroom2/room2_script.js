/* ── PARTICLES ── */
(function () {
  const cv = document.getElementById('fx-canvas');
  const cx = cv.getContext('2d');
  let W, H;

  const rsz = () => {
    W = cv.width = window.innerWidth;
    H = cv.height = window.innerHeight;
  };

  rsz();
  window.addEventListener('resize', rsz);

  const C = [
    'rgba(0,242,255,',
    'rgba(155,0,255,',
    'rgba(251,255,0,',
    'rgba(255,30,80,'
  ];

  const pts = Array.from({ length: 65 }, () => ({
    x:   Math.random() * 1920,
    y:   Math.random() * 1080,
    vx:  (Math.random() - .5) * .42,
    vy:  -(Math.random() * .36 + .07),
    r:   Math.random() * 1.6 + .35,
    a:   Math.random() * .36 + .05,
    col: C[Math.floor(Math.random() * C.length)],
    life: Math.random()
  }));

  (function draw() {
    cx.clearRect(0, 0, W, H);
    pts.forEach(p => {
      p.x += p.vx;
      p.y += p.vy;
      p.life -= .0017;
      if (p.life <= 0 || p.y < -5) {
        p.x = Math.random() * W;
        p.y = H + 5;
        p.life = 1;
      }
      cx.globalAlpha = p.a * Math.sin(p.life * Math.PI);
      cx.beginPath();
      cx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
      cx.fillStyle = p.col + '1)';
      cx.fill();
    });
    cx.globalAlpha = 1;
    requestAnimationFrame(draw);
  })();
})();


/* ════════════════════════════════════════════════
   GAME ENGINE
════════════════════════════════════════════════ */
const G = {

  /* ─── STATE ─── */
  s: {
    credits:      100,
    bars:         [50, 50],
    barState:     new Array(11).fill(0),
    dialVals:     new Array(12).fill(0),
    inv:          [],
    sel:          null,
    entryIn:      [],
    ritualIn:     [],
    ballsGiven:   0,
    dollDone:     { left: false, center: false, right: false },

    /* Completion flags */
    barDone:      false,
    showDone:     false,
    witchValDone: false,
    witchDone:    false,
    entryDone:    false,
    revealSeen:   false,

    /* Navigation */
    screen:       'hub1',
    panelBack:    'hub1',
    hintKey:      null,
    floatHintKey: null,

    /* First-click-per-subroom hint tracking (−3 pts, once per key) */
    _panelHintUsed: {},
    _floatHintUsed: {},

    /*
     * RESUME STATE — tracks last screen visited per subroom area.
     * When re-entering a subroom, player resumes from where they left.
     * null  = show the puzzle panel (fresh start)
     * 'imgX' = navigate directly to that image
     */
    resume: {
      show:  null,
      bar:   null,
      witch: null,
      entry: null,
      roof:  null,
      doll:  null
    }
  },

  /* ─── HINTS ─── */
  H: {
    doll:   '"He born without breath, yet dressed with care,they watch the room, when you leave the room, they change my place—Yet no one saw me move an inch..Years may pass, but I stay the same,A childhood friend will always help me .',
    show:   'The world is wispering for you.',
    candle: 'I become shorter as I grow older.. I\'m alive and present around you making the path visible and match height to find the way.',
    witch:  'See the your future to get the cosmos ',
    bar:    'Pattern: a Joker is handelling the pattern which glow and bring bright light, but can you guess which one? and ask him to show the change to find the right one.(look closely to the pattern and the changes it makes.)',
    entry:  'the monsoon forest with flowers hidding a secret that, ocean where waves crash in a rhythmic dance. Each realm holds a clue to the sequence you seek.',
    dial:   'Thespellcaster\'s ring holds the key, with numbers that dance in a whimsical spree. Turn each dial to find the rhyme, and unlock the secrets lost in time.',
    roof:   'Make them happy, to be happy by fullfilling their needs.'
  },

  /* ─── IMAGE MAP ─── */
  IMGS: {
    hub1:  'image1.jpg',
    hub2:  'image4.jpg',
    img2:  'image2.jpg',
    img3:  'image3.jpg',
    img5:  'image5.jpg',
    img6:  'image6.jpg',
    img7:  'image7.jpg',
    img8:  'image8.jpg',
    img9:  'image9.jpg',
    img11: 'image11.jpg',
    img13: 'image13.jpg',
    img15: 'image15.jpg',
    img16: 'image14.jpg',
    img12: 'image12.jpg',
    sun: 'sun.jpg',
    moon: 'moon.jpg',
    star: 'star.jpg',
    grn: 'green.jpg',
    pnk: 'pink.jpg',
    pur: 'purple.jpg'
    
  },

  /* ─── HOTSPOT MAP ─── */
  HS: {
    hub1: [
      { id: 'hs-doll',    x: 82, y: 35, w: 12, h: 55, a: 'DOLL'  },
      { id: 'hs-joker',   x: 18,  y: 60, w: 18, h: 27, a: 'JOKER' },
      { id: 'hs-center',  x: 36, y: 28, w: 35, h: 52, a: 'HUB2'  }
    ],
    hub2: [
      { id: 'hs-show',     x: 60, y: 27, w: 18, h: 24, a: 'SHOW'   },
      { id: 'hs-witch',    x: 19, y: 63, w: 18, h: 30, a: 'WITCH'  },
      { id: 'hs-bar',      x: 60, y: 63, w: 19, h: 30, a: 'BAR'    },
      { id: 'hs-entry',    x: 40, y: 60, w: 20, h: 25, a: 'ENTRY'  },
      { id: 'hs-roof',     x: 36, y: 0,  w: 27, h: 21, a: 'ROOF'   },
      { id: 'hs-hub1back', x: 0,  y: 0,  w: 8,  h: 9,  a: 'HUB1'  },
      { id: 'hs-joker16',  x: 37, y: 24, w: 27, h: 30, a: 'IMG16' }
    ],
    img7: [
      { id: 'hs-wcircle', x: 41, y: 10,  w: 18, h: 32, a: 'DIAL'   },
      { id: 'hs-wbody',   x: 40, y: 40, w: 23, h: 43, a: 'POTION' }
    ],
    img9: [
      { id: 'hs-ppur', x: 52, y: 7,  w: 16, h: 44, a: 'COL_PUR' },
      { id: 'hs-porg', x: 64, y: 18, w: 13, h: 44, a: 'COL_ORG' },
      { id: 'hs-pblu', x: 2,  y: 16, w: 13, h: 52, a: 'COL_BLU' },
      { id: 'hs-pgrn', x: 32,  y: 49, w: 12, h: 36, a: 'COL_GRN' }
    ],
    img11: [
      { id: 'hs-balls', x: 25, y: 24, w: 15, h: 15, a: 'COL_BALL'},
      { id: 'hs-balls', x: 65, y: 26, w: 15, h: 15, a: 'COL_BALL'},
      {id: 'hs-balls', x: 63, y: 10, w: 15, h: 15, a: 'COL_BALL' }
    ],
    img15: [
      { id: 'hs-dl', x: 7,  y: 14, w: 23, h: 70, a: 'BALL_L' },
      { id: 'hs-dc', x: 65, y: 4,  w: 28, h: 80, a: 'BALL_C' },
      { id: 'hs-dr', x: 79, y: 14, w: 24, h: 74, a: 'BALL_R' }
    ]
  },

  /* ─── DIAL POSITIONS (clockwise from 12:00 on jester ring) ─── */
  DPOS: [
    { l: '50%', t: '21%' }, { l: '65%', t: '23.4%' }, { l: '76%', t: '34%' },
    { l: '82%', t: '50%' }, { l: '76%', t: '66%' }, { l: '64%', t: '77%' },
    { l: '50%', t: '82%' }, { l: '35%', t: '77%' }, { l: '24%', t: '66.7%' },
    { l: '18%', t: '50%' }, { l: '24%', t: '34%' }, { l: '35%', t: '23.4%' }
  ],
  DANS: [2, 0, 0, 3, 0, 0, 0, 0, 0, 9, 1, 2],

  /* ════════ NAVIGATION ════════ */
  goto(id) {
    const v = document.getElementById('trans-veil');
    v.classList.add('in');
    setTimeout(() => { this._load(id); v.classList.remove('in'); }, 310);
  },

  _load(id) {
    this.s.screen = id;

    /* Update resume state whenever player visits a subroom screen */
    const resumeOf = {
      img5: 'show', img6: 'show',
      img9: 'bar',
      img7: 'witch', img8: 'witch',
      img11: 'entry',
      img15: 'roof',
      img2: 'doll'
    };
    if (resumeOf[id]) this.s.resume[resumeOf[id]] = id;

    document.getElementById('scene-canvas').style.backgroundImage = `url('${this.IMGS[id] || 'image1.jpg'}')`;
    document.getElementById('hitbox-layer').innerHTML = '';
    document.getElementById('float-layer').innerHTML = '';
    document.getElementById('ball-counter').style.display = 'none';
    this._closePanel();
    document.getElementById('dial-modal').classList.remove('open');

    /* Back button — show everywhere except hub1 / hub2 */
    const bb = document.getElementById('global-back-btn');
    if (id === 'hub1' || id === 'hub2') {
      bb.classList.remove('show');
    } else {
      bb.classList.add('show');
    }

    /* Set back-navigation target */
    if (id === 'img2' || id === 'img3')       this.s.panelBack = 'hub1';
    else if (id === 'img13')                   this.s.panelBack = 'img7';
    else if (id !== 'hub1' && id !== 'hub2')   this.s.panelBack = 'hub2';

    /* Build hotspots */
    (this.HS[id] || []).forEach(h => {
      const d = document.createElement('div');
      d.className = 'hotspot';
      d.id = h.id;
      d.style.cssText = `left:${h.x}%;top:${h.y}%;width:${h.w}%;height:${h.h}%`;
      d.onclick = (e) => { e.stopPropagation(); this.act(h.a); };
      document.getElementById('hitbox-layer').appendChild(d);
    });

    this._onLoad(id);
    this._pips();
    this._updateScore();

    /* Float hint button — show on all non-hub screens, set contextual key */
    const fhb = document.getElementById('float-hint-btn');
    const fhp = document.getElementById('float-hint-popup');
    fhp.className = '';

    if (id === 'hub1' || id === 'hub2') {
      fhb.classList.remove('show');
    } else {
      fhb.classList.add('show');
      const hintMap = {
        img2: 'doll',   img3: 'doll',
        img5: 'candle', img6: 'candle',
        img7: 'witch',  img8: 'witch',  img13: 'dial',
        img9: 'bar',    img11: 'entry',
        img15: 'roof',  img16: 'roof'
      };
      this.s.floatHintKey = hintMap[id] || null;
    }
  },

  _onLoad(id) {
    if (id === 'img2')  this._panelDoll();
    if (id === 'img5')  this._panelCandle();
    if (id === 'img7')  this._onImg7();
    if (id === 'img15') this._onRoof();
  },

  goBack() {
    const pw = document.getElementById('glass-panel-wrapper');
    if (pw.classList.contains('visible')) { this._closePanel(); return; }
    if (document.getElementById('dial-modal').classList.contains('open')) { this.closeDial(); return; }
    this.goto(this.s.panelBack);
  },

  /* ════════ PANEL SYSTEM ════════ */
  _panel(title, html, hintKey) {
    const ui = document.getElementById('interaction-ui');
    const pw = document.getElementById('glass-panel-wrapper');
    const bb = document.getElementById('global-back-btn');

    ui.classList.remove('hidden');
    ui.classList.add('dimmed');
    ui.style.pointerEvents = 'auto';
    pw.classList.add('visible');
    bb.classList.add('show');

    document.getElementById('ui-title').innerHTML   = title;
    document.getElementById('ui-body').innerHTML    = html;
    document.getElementById('ui-feedback').innerHTML = '';
    document.getElementById('ui-hint-box').className = '';
    this.s.hintKey = hintKey || null;

    /* Hide floating hint while panel is open */
    document.getElementById('float-hint-btn').classList.remove('show');
    document.getElementById('float-hint-popup').className = '';
  },

  _closePanel() {
    const ui = document.getElementById('interaction-ui');
    const pw = document.getElementById('glass-panel-wrapper');

    ui.classList.add('hidden');
    ui.classList.remove('dimmed');
    ui.style.pointerEvents = 'none';
    pw.classList.remove('visible');

    /* Restore floating hint if not on a hub */
    if (this.s.screen !== 'hub1' && this.s.screen !== 'hub2') {
      document.getElementById('float-hint-btn').classList.add('show');
    }
  },

  toggleFloatHint() {
    const key = this.s.floatHintKey;
    if (!key) return;

    const popup  = document.getElementById('float-hint-popup');
    const isOpen = popup.classList.contains('show');

    if (isOpen) { popup.className = ''; return; }

    /* Deduct only on first reveal per key */
    if (!this.s._floatHintUsed[key]) {
      this.s._floatHintUsed[key] = true;
      this.s.credits = Math.max(0, this.s.credits - 3);
      this._updateScore();
    }
    popup.innerHTML = `${this.H[key]}<span id="float-hint-score">−3 POINTS DEDUCTED</span>`;
    popup.className = 'show';
  },

  toggleHint() {
    if (!this.s.hintKey) return;
    const box  = document.getElementById('ui-hint-box');
    const open = box.classList.contains('show');
    if (!open) {
      /* Deduct only on first reveal per key */
      if (!this.s._panelHintUsed[this.s.hintKey]) {
        this.s._panelHintUsed[this.s.hintKey] = true;
        this.s.credits = Math.max(0, this.s.credits - 3);
        this._updateScore();
      }
      box.textContent = this.H[this.s.hintKey];
    }
    box.className = open ? '' : 'show';
  },

  /* ════════ DOLL PASSWORD ════════ */
  _panelDoll() {
    this._panel(
      '🐰 DOLL SYNC',
      `<p style="font-size:11px;color:rgba(255,255,255,.28);margin-bottom:14px;letter-spacing:3px">ENTER THE WELCOME CODE</p>
       <input type="text" class="pro-input" id="pi-doll" placeholder="_ _ _ _ _ _ _" maxlength="14"
         onkeydown="if(event.key==='Enter')G._checkDoll()">
       <br><button class="btn-3d yellow" onclick="G._checkDoll()">⚡ SYNC</button>`,
      'doll'
    );
    this.s.panelBack = 'hub1';
  },

  _checkDoll() {
    if (!this.s.revealSeen) return; /* silent lock */
    const v = (document.getElementById('pi-doll').value || '').toUpperCase().trim();
    if (v === 'WELCOME') {
      this._flash('win');
      setTimeout(() => this._win(), 1400);
    } else {
      this._flash('err');
      this._shake();
      document.getElementById('ui-feedback').innerHTML = '<span class="fb-err">INCORRECT CODE</span>';
    }
  },

  /* ════════ MAGICAL SHOW + CANDLE ════════ */
  _panelShow() {
    this._panel(
      '✦ MAGICAL SHOW',
      `<p style="font-size:11px;color:rgba(255,255,255,.28);margin-bottom:14px;letter-spacing:3px">ENTER ACCESS CIPHER. place where you can see your feature.</p>
       <input type="text" class="pro-input" id="pi-show" placeholder="- - - -" maxlength="8"
         onkeydown="if(event.key==='Enter')G._checkShow()">
       <br><button class="btn-3d neon" onclick="G._checkShow()">AUTHORIZE</button>`,
      'show'
    );
    this.s.panelBack = 'hub2';
  },

  _checkShow() {
    if ((document.getElementById('pi-show').value || '').trim() === '@49)') {
      this._flash('ok');
      this._closePanel();
      setTimeout(() => this.goto('img5'), 360);
    } else {
      this._flash('err');
      this._shake();
      document.getElementById('ui-feedback').innerHTML = '<span class="fb-err">ACCESS DENIED</span>';
    }
  },

  _panelCandle() {
    this._panel(
      '🕯 RITUAL',
      `<div class="bar-system">
         <div class="bar-col">
           <div class="neon-candle" id="cb1" style="height:${this.s.bars[0]}px"></div>
           <div class="bar-lbl">I</div>
         </div>
         <div class="bar-col">
           <div class="neon-candle" id="cb2" style="height:${this.s.bars[1]}px"></div>
           <div class="bar-lbl">II</div>
         </div>
       </div>
       <div style="display:flex;gap:10px;justify-content:center;margin-top:6px">
         <button class="btn-3d neon" onclick="G._bar(0)">RAISE I</button>
         <button class="btn-3d neon" onclick="G._bar(1)">RAISE II</button>
       </div>
       <button class="btn-3d yellow" style="margin-top:16px;width:78%" onclick="G._checkCandle()"> IGNITE</button>`,
      'candle'
    );
    this.s.panelBack = 'hub2';
  },

  _bar(i) {
    this.s.bars[i] = (this.s.bars[i] + 25) % 175 || 25;
    const el = document.getElementById(`cb${i + 1}`);
    if (el) el.style.height = this.s.bars[i] + 'px';
  },

  _checkCandle() {
    if (this.s.bars[0] > this.s.bars[1]) {
      this.s.showDone = true;
      this._pips();
      this._flash('ok');
      this._closePanel();
      setTimeout(() => this.goto('img6'), 370);
    } else {
      this._flash('err');
      this._shake();
      document.getElementById('ui-feedback').innerHTML = '<span class="fb-err">ALIGNMENT INCORRECT</span>';
    }
  },

  /* ════════ WITCH RITUAL (fully parallel — no lock) ════════ */
  _panelWitch() {
    this.s.ritualIn = [];
    this._panel(
      '🌙 WITCH RITUAL',
      `<p style="font-size:11px;color:rgba(255,255,255,.26);margin-bottom:8px;letter-spacing:3px">INVOKE THE ANCIENT SEQUENCE</p>
       <div class="symbol-grid">
   <button class="sym-btn sym-img" onclick="G._ritual('star')">
  <img src="star.jpg" alt="Star" style="width:100%;height:100%;object-fit:cover;border-radius:50%;">
</button>     

<button class="sym-btn sym-img" onclick="G._ritual('moon')">
  <img src="moon.jpg" alt="Moon" style="width:100%;height:100%;object-fit:cover;border-radius:50%;">
</button>
<button class="sym-btn sym-img" onclick="G._ritual('sun')">
  <img src="sun.jpg" alt="Sun" style="width:100%;height:100%;object-fit:cover;border-radius:50%;">
</button>
       </div>
       <div class="dots-row">
         <div class="dot" id="rd0"></div>
         <div class="dot" id="rd1"></div>
         <div class="dot" id="rd2"></div>
       </div>`,
      'witch'
    );
    this.s.panelBack = 'hub2';
  },

  _ritual(v) {
    const seq = ['moon', 'sun', 'star'];
    this.s.ritualIn.push(v);
    const i = this.s.ritualIn.length - 1;

    if (this.s.ritualIn[i] !== seq[i]) {
      this.s.ritualIn = [];
      ['rd0', 'rd1', 'rd2'].forEach(id => {
        const d = document.getElementById(id);
        if (d) d.classList.remove('lit');
      });
      this._flash('err');
      return;
    }

    const dot = document.getElementById('rd' + i);
    if (dot) dot.classList.add('lit');

    if (this.s.ritualIn.length === 3) {
      this._flash('ok');
      this._closePanel();
      setTimeout(() => this.goto('img7'), 380);
    }
  },

  _onImg7() {
    if (this.s.witchValDone) {
      document.getElementById('float-layer').innerHTML =
        '<div class="witch-demand">“I seek a potion to restore and enhance my Ethernal Youth — a brew crafted only from the pure elements of nature:"</div>';
    }
  },

  /* ════════ DIAL PUZZLE (image13) ════════ */
  openDial() {
    document.getElementById('dial-modal').classList.add('open');
    
    document.querySelectorAll('.dial-btn').forEach(d => d.remove());
   
    const box = document.getElementById('dial-box');
    this.DPOS.forEach((pos, i) => {
      const btn = document.createElement('button');
      btn.className = 'dial-btn' + (this.s.dialVals[i] === this.DANS[i] ? ' ok' : '');
      btn.id = `db${i}`;
      btn.style.left = pos.l;
      btn.style.top  = pos.t;
      btn.textContent = this.s.dialVals[i];
      btn.onclick = () => {
        this.s.dialVals[i] = (this.s.dialVals[i] + 1) % 10;
        btn.textContent = this.s.dialVals[i];
        btn.classList.toggle('ok', this.s.dialVals[i] === this.DANS[i]);
      };
       
      box.appendChild(btn);
    
    });
  },

  checkDial() {
    const ok = this.DANS.every((v, i) => this.s.dialVals[i] === v);
    if (ok) {
      this.s.witchValDone = true;
      this._flash('ok');
      document.querySelectorAll('.dial-btn').forEach(b => {
        b.style.background   = 'rgba(251,255,0,.22)';
        b.style.borderColor  = 'var(--y)';
        b.style.color        = 'var(--y)';
      });
      setTimeout(() => { this.closeDial(); this.goto('img7'); }, 900);
    } else {
      this._flash('err');
      const b = document.getElementById('dial-box');
      b.style.animation = 'shake .35s ease';
      setTimeout(() => b.style.animation = '', 400);
    }
  },

  closeDial() {
    document.getElementById('dial-modal').classList.remove('open');
    /* Player stays on current screen */
  },

  /* ════════ GIVE POTION ════════ */
  _givePotion() {
    if (!this.s.witchValDone) return;
    if (this.s.sel !== 'purple') { this._flash('err'); return; }

    const idx = this.s.inv.findIndex(i => i.type === 'purple');
    if (idx < 0) { this._flash('err'); return; }

    this.s.inv.splice(idx, 1);
    this.s.sel = null;
    this._refreshShelf();
    this._flash('ok');
    this.s.witchDone = true;
    this._pips();
    setTimeout(() => this.goto('img8'), 400);
  },

  /* ════════ MAGICAL BAR ════════ */
  _panelBar() {
    this._panel(
      '⚡ Jokers shelf',
      `<p style="font-size:10px;color:rgba(255,255,255,.25);letter-spacing:3px;margin-bottom:16px">ACTIVATE THE CORRECT PATTERN</p>
       <div class="mix-grid" id="mgrid"></div>
       <button class="btn-3d yellow" style="margin-top:18px;width:78%" onclick="G._checkBar()"> IGNITE</button>`,
      'bar'
    );
    this.s.panelBack = 'hub2';

    const grid = document.getElementById('mgrid');
    if (!grid) return;

    this.s.barState.forEach((v, i) => {
      const btn = document.createElement('button');
      btn.className = 'mbtn' + (v ? ' yellow' : '');
      btn.id = `mb${i}`;
      btn.textContent = i + 1;
      btn.onclick = () => { this.s.barState[i] ^= 1; btn.classList.toggle('yellow'); };
      grid.appendChild(btn);
    });
  },

  _checkBar() {
    const ans = [1, 1, 0, 1, 1, 1, 1, 0, 1, 1, 1];
    if (ans.every((v, i) => this.s.barState[i] === v)) {
      this.s.barDone = true;
      this._pips();
      this._flash('ok');
      this._closePanel();
      setTimeout(() => this.goto('img9'), 380);
    } else {
      this._flash('err');
      this._shake();
      document.getElementById('ui-feedback').innerHTML = '<span class="fb-err">PATTERN MISMATCH</span>';
    }
  },

  /* ════════ SPECIAL ENTRY ════════ */
  _panelEntry() {
    this.s.entryIn = [];
    this._panel(
      '🚪 SPECIAL ENTRY',
      `<p style="font-size:10px;color:rgba(255,255,255,.25);letter-spacing:3px;margin-bottom:16px">SELECT THE CORRECT SEQUENCE</p>
       <div class="entry-row">
       <button class="ebtn ebtn-img" onclick="G._entry('pink')">
    <img src="pink.jpg" alt="Pink" style="width:100%;height:100%;object-fit:cover;border-radius:50%;pointer-events:none;">
  </button>
  <button class="ebtn ebtn-img" onclick="G._entry('purple')">
    <img src="purple.jpg" alt="Purple" style="width:100%;height:100%;object-fit:cover;border-radius:50%;pointer-events:none;">
  </button>
  <button class="ebtn ebtn-img" onclick="G._entry('green')">
    <img src="green.jpg" alt="Green" style="width:100%;height:100%;object-fit:cover;border-radius:50%;pointer-events:none;">
  </button>
</div>
       <div class="dots-row">
         <div class="dot" id="ed0"></div>
         <div class="dot" id="ed1"></div>
         <div class="dot" id="ed2"></div>
       </div>`,
      'entry'
    );
    this.s.panelBack = 'hub2';
  },

  _entry(c) {
    if (!this.s.witchDone) return; /* silent lock — requires witch room */
    const seq = ['green', 'pink', 'purple'];
    const i   = this.s.entryIn.length;

    if (c !== seq[i]) {
      this.s.entryIn = [];
      ['ed0', 'ed1', 'ed2'].forEach(id => {
        const d = document.getElementById(id);
        if (d) d.classList.remove('lit');
      });
      this._flash('err');
      return;
    }

    this.s.entryIn.push(c);
    const dot = document.getElementById('ed' + i);
    if (dot) dot.classList.add('lit');

    if (this.s.entryIn.length === 3) {
      this.s.entryDone = true;
      this._pips();
      this._flash('ok');
      this._closePanel();
      setTimeout(() => this.goto('img11'), 380);
    }
  },

  /* ════════ COLLECT ITEMS ════════ */
  _collectPotion(type, img, label) {
    if (this.s.inv.find(i => i.type === type)) return;
    this.s.inv.push({ type, img, label });
    this._refreshShelf();
    this._flash('ok');
  },

  _collectBall() {
    const cnt = this.s.inv.filter(i => i.type === 'ball').length;
    if (cnt >= 4) return;
    this.s.inv.push({ type: 'ball', img: 'image12.jpg', label: `Ball ${cnt + 1}` });
    this._refreshShelf();
    this._flash('ok');
  },

  /* ════════ ROOF DOLLS ════════ */
  _onRoof() {
    this._updateBC();
    if (this.s.ballsGiven >= 3) {
      document.getElementById('float-layer').innerHTML =
        `<div class="carrot-speech">"The carrot eater will let you go out<br>
         if you <span style="color:var(--y)">WELCOME</span> it..."</div>`;
    }
  },

  _giveBall(doll) {
    if (this.s.dollDone[doll]) return;

    if (this.s.sel !== 'ball') {
      document.getElementById('float-layer').innerHTML =
        '<div class="doll-speech">"WE WANT BALLS TO PLAY!"</div>';
      return;
    }

    const idx = this.s.inv.findIndex(i => i.type === 'ball');
    if (idx < 0) {
      document.getElementById('float-layer').innerHTML =
        '<div class="doll-speech">"WE WANT BALLS TO PLAY!"</div>';
      return;
    }

    this.s.inv.splice(idx, 1);
    this.s.sel = null;
    this.s.dollDone[doll] = true;
    this.s.ballsGiven++;
    this._refreshShelf();
    this._flash('ok');
    this._updateBC();

    /* Briefly highlight the doll's hotspot */
    const keyMap = { left: 'l', center: 'c', right: 'r' };
    const el = document.getElementById(`hs-d${keyMap[doll]}`);
    if (el) {
      el.style.outline   = '3px solid rgba(0,242,255,.8)';
      el.style.boxShadow = '0 0 20px rgba(0,242,255,.5)';
      setTimeout(() => {
        if (el) { el.style.outline = ''; el.style.boxShadow = ''; }
      }, 650);
    }

    if (this.s.ballsGiven >= 3) {
      this.s.revealSeen = true;
      this._pips();
      document.getElementById('float-layer').innerHTML =
        `<div class="carrot-speech">"The carrot eater will let you go out<br>
         if you <span style="color:var(--y)">WELCOME</span> it..."</div>`;
    } else {
      const need = 3 - this.s.ballsGiven;
      document.getElementById('float-layer').innerHTML =
        `<div class="doll-speech">"GIVE US ${need} MORE BALL${need > 1 ? 'S' : ''}!"</div>`;
    }
  },

  _updateBC() {
    const bc   = document.getElementById('ball-counter');
    const held = this.s.inv.filter(i => i.type === 'ball').length;
    bc.style.display = 'block';
    bc.textContent   = `GIVEN: ${this.s.ballsGiven}/3  ·  HELD: ${held}`;
  },

  /* ════════ ACTION DISPATCHER ════════ */
  act(a) {
    switch (a) {
      case 'HUB1':  return this.goto('hub1');
      case 'HUB2':  return this.goto('hub2');
      case 'JOKER': return this.goto('img3');
      case 'IMG16': return this.goto('img16');

      case 'DOLL':  return this.goto(this.s.resume.doll  || 'img2');
      case 'ROOF':  return this.goto(this.s.resume.roof  || 'img15');
      case 'SHOW':  return this.s.resume.show  ? this.goto(this.s.resume.show)  : this._panelShow();
      case 'BAR':   return this.s.resume.bar   ? this.goto(this.s.resume.bar)   : this._panelBar();
      case 'WITCH': return this.s.resume.witch ? this.goto(this.s.resume.witch) : this._panelWitch();
      case 'ENTRY': return this.s.resume.entry ? this.goto(this.s.resume.entry) : this._panelEntry();

      case 'DIAL':     return this.openDial();
      case 'POTION':   return this._givePotion();
      case 'BALL_L':   return this._giveBall('left');
      case 'BALL_C':   return this._giveBall('center');
      case 'BALL_R':   return this._giveBall('right');
      case 'COL_BALL': return this._collectBall();
      case 'COL_PUR':  return this._collectPotion('purple', 'image20.jpg', 'Purple Elixir');
      case 'COL_ORG':  return this._collectPotion('orange', 'image21.jpg', 'Amber Brew');
      case 'COL_BLU':  return this._collectPotion('blue',   'image22.jpg', 'Azure Vial');
      case 'COL_GRN':  return this._collectPotion('green',  'image23.jpg', 'Verdant Tonic');
    }
  },

  /* ════════ INVENTORY SHELF ════════ */
  _refreshShelf() {
    const c = document.getElementById('slots-container');
    c.innerHTML = '';

    if (!this.s.inv.length) {
      c.innerHTML = '<div class="shelf-empty">EMPTY</div>';
      return;
    }

    this.s.inv.forEach(item => {
      const s = document.createElement('div');
      s.className = 'slot' + (this.s.sel === item.type ? ' selected' : '');
      s.innerHTML = `
        <img src="${item.img}" alt="${item.label}"
          onerror="this.style.display='none';this.nextElementSibling.style.display='block'">
        <div style="display:none;font-size:26px">image12.jpg</div>
        <div class="slot-lbl">${item.label.substring(0, 9)}</div>`;
      s.onclick = () => {
        this.s.sel = (this.s.sel === item.type) ? null : item.type;
        this._refreshShelf();
      };
      c.appendChild(s);
    });
  },

  /* ════════ FX HELPERS ════════ */
  _flash(t) {
    const f = document.getElementById('flash-fx');
    f.className = `f-${t}`;
    setTimeout(() => f.className = '', t === 'win' ? 1600 : 540);
  },

  _shake() {
    const p = document.getElementById('glass-panel-wrapper');
    p.classList.add('shake');
    setTimeout(() => p.classList.remove('shake'), 380);
  },

  _updateScore() {
    document.getElementById('cr-val').textContent = this.s.credits;
  },

  _pips() {
    [
      ['pip-show',  this.s.showDone],
      ['pip-bar',   this.s.barDone],
      ['pip-witch', this.s.witchDone],
      ['pip-entry', this.s.entryDone]
    ].forEach(([id, v]) => {
      const el = document.getElementById(id);
      if (el) el.classList.toggle('on', v);
    });
  },

  _win() {
    this._flash('win');
    setTimeout(() => document.getElementById('win-screen').classList.add('on'), 1000);
  },

  /* ════════ INIT ════════ */
  init() {
    this._load('hub1');
    this._refreshShelf();
  }
};

window.onload = () => G.init();