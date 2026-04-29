/**
 * EXIT-VO.O  —  Shared Game State Manager  v8 FINAL + Sentinel Patch
 * =====================================================================
 * PATCH: saveToLeaderboard() now also emits 'game_result' via Socket.IO
 * to the Sentinel server so the conductor dashboard gets live updates.
 *
 * Copy this IDENTICAL file into EVERY folder:
 *   main1screen/  Mroom1/  cs-001/  Mroom2/  cs-002/
 *   lastroom/  cs-003/  result/
 *
 * ROOM FLOW:
 *   Landing → Mroom1 → cs-001 → Mroom2 → cs-002 → lastroom → cs-003 → result
 *
 * SCORING:
 *   Start:           100 pts
 *   Mroom1 hints:   −3 each (first click per subroom)
 *   Mroom1 clear:   +20 pts
 *   CS-001:         +0 to +15 pts
 *   Mroom2 hints:   −3 each (first click per subroom)
 *   Mroom2 clear:   +25 pts
 *   CS-002:         +0 to +20 pts  |  hints: −4 each (real-time)
 *   lastroom hints: −3 each
 *   lastroom clear: +40 pts
 *   CS-003:         +0 to +30 pts  |  hints: −5 each (real-time)
 *   ──────────────────────────────────
 *   MAX POSSIBLE:   365 pts
 *
 * BROADCAST:
 *   Uses BroadcastChannel('exitvo_sync') for same-browser tab sync.
 *   Also emits 'game_result' via Socket.IO to Sentinel server for
 *   cross-device live leaderboard on conductor dashboard.
 */
const GS = (function () {

  /* ── localStorage keys ─────────────────────────── */
  var K = {
    name:        'gx_name',
    usn:         'gx_usn',
    score:       'gx_score',
    log:         'gx_log',
    progress:    'gx_progress',
    startTime:   'gx_start',
    endTime:     'gx_end',
    leaderboard: 'gx_leaders',
  };

  function g(k)    { return localStorage.getItem(k); }
  function s(k, v) { localStorage.setItem(k, String(v)); }
  function gJ(k)   { try { return JSON.parse(g(k)) || {}; } catch(e) { return {}; } }
  function sJ(k,v) { s(k, JSON.stringify(v)); }
  function gA(k)   { try { return JSON.parse(g(k)) || []; } catch(e) { return []; } }

  /* ── BroadcastChannel (live sync to Conductor tab) ─ */
  var _bc = null;
  function _broadcast(msg) {
    if (!_bc) {
      try { _bc = new BroadcastChannel('exitvo_sync'); } catch(e) { return; }
    }
    try { _bc.postMessage(msg); } catch(e) {}
  }

  /* ── Socket.IO — connect to Sentinel server ────── */
  /* Connects to the same origin (same host:port as server.js) */
  var _socket = null;
  function _getSocket() {
    if (_socket) return _socket;
    try {
      if (typeof io !== 'undefined') {
        _socket = io(window.location.origin, { transports: ['websocket','polling'] });
      }
    } catch(e) { _socket = null; }
    return _socket;
  }

  /* Emit game result to Sentinel server (non-blocking, best-effort) */
  function _emitResult(entry) {
    try {
      var sock = _getSocket();
      if (sock) {
        sock.emit('game_result', {
          name:    entry.name,
          usn:     entry.usn,
          score:   entry.score,
          timeSec: entry.time,
          log:     entry.log,
        });
      }
    } catch(e) { /* silent fail — localStorage save already happened */ }
  }

  /* ── Constants ──────────────────────────────────── */
  var ORDER = ['mroom1','cs001','mroom2','cs002','mroom3','cs003'];
  var BONUS = { mroom1: 20, mroom2: 25, mroom3: 40 };
  var INFO  = {
    mroom1: { label: 'Mystery Room 1',               max: 20  },
    cs001:  { label: 'CS-001  Fast Exponentiation',  max: 15  },
    mroom2: { label: 'Mystery Room 2',               max: 25  },
    cs002:  { label: 'CS-002  The Infinite Loop',    max: 20  },
    mroom3: { label: 'Mystery Room 3  (Pearl Abyss)',max: 40  },
    cs003:  { label: 'CS-003  Final Challenge',      max: 30  },
  };
  var MAX_SCORE = 365;

  return {
    ORDER: ORDER, INFO: INFO, BONUS: BONUS, MAX_SCORE: MAX_SCORE,

    /* ── Player ─────────────────────────────────── */
    initPlayer: function(name, usn) {
      s(K.name,     name.trim());
      s(K.usn,      usn.trim().toUpperCase());
      s(K.score,    '100');
      sJ(K.log,     {});
      s(K.progress, '0');
      localStorage.removeItem(K.startTime);
      localStorage.removeItem(K.endTime);
    },

    /* ── Timer ──────────────────────────────────── */
    startTimer: function() {
      if (!g(K.startTime)) s(K.startTime, Date.now());
    },
    stopTimer: function() {
      if (!g(K.endTime)) s(K.endTime, Date.now());
    },
    resumeTimer: function() {
      if (g(K.startTime) && g(K.endTime)) {
        var drift = Date.now() - (+g(K.endTime));
        s(K.startTime, +g(K.startTime) + drift);
        localStorage.removeItem(K.endTime);
      }
    },
    elapsedSec: function() {
      var t = +g(K.startTime) || 0;
      if (!t) return 0;
      return Math.max(0, Math.floor(((+g(K.endTime) || Date.now()) - t) / 1000));
    },
    fmtTime: function(sec) {
      var s2 = Math.max(0, sec);
      var h = Math.floor(s2/3600), m = Math.floor((s2%3600)/60), sc = s2%60;
      var p = function(n){ return String(n).padStart(2,'0'); };
      return h > 0 ? (p(h)+':'+p(m)+':'+p(sc)) : (p(m)+':'+p(sc));
    },

    /* ── Score ──────────────────────────────────── */
    getScore:    function()  { return Math.max(0, parseInt(g(K.score)||'100', 10)); },
    setScore:    function(n) { s(K.score, Math.max(0, Math.round(n))); },
    addScore:    function(n) { this.setScore(this.getScore() + n); },
    deductScore: function(n) { this.setScore(this.getScore() - n); },

    /* ── Log / progress ─────────────────────────── */
    logRoom: function(key, pts) {
      var log = gJ(K.log);
      log[key] = pts;
      sJ(K.log, log);
      var idx = ORDER.indexOf(key);
      var cur = parseInt(g(K.progress)||'0', 10);
      if (idx + 1 > cur) s(K.progress, idx + 1);
    },
    getLog:      function() { return gJ(K.log); },
    getProgress: function() { return parseInt(g(K.progress)||'0', 10); },
    getName:     function() { return g(K.name) || 'UNKNOWN'; },
    getUSN:      function() { return g(K.usn)  || '—'; },

    /* ── Leaderboard ────────────────────────────── */
    saveToLeaderboard: function() {
      var entry = {
        name:  this.getName(),
        usn:   this.getUSN(),
        score: this.getScore(),
        time:  this.elapsedSec(),
        log:   this.getLog(),
        saved: Date.now(),
      };
      var board    = gA(K.leaderboard);
      var filtered = board.filter(function(e){ return e.usn !== entry.usn; });
      filtered.push(entry);
      sJ(K.leaderboard, filtered);

      /* ✅ Broadcast to same-browser Conductor tab */
      _broadcast({ type: 'player_saved', entry: entry });

      /* ✅ NEW: Emit to Sentinel server → live conductor dashboard */
      _emitResult(entry);

      return entry;
    },
    getLeaderboard: function() {
      return gA(K.leaderboard).sort(function(a,b){
        return b.score - a.score || a.time - b.time;
      });
    },
    clearLeaderboard: function() {
      localStorage.removeItem(K.leaderboard);
      _broadcast({ type: 'leaderboard_cleared' });
    },

    /* ── Navigation ─────────────────────────────── */
    goTo: function(path) {
      document.body.style.transition = 'opacity 0.5s ease';
      document.body.style.opacity    = '0';
      setTimeout(function(){ window.location.href = path; }, 480);
    },
    goToResult: function() {
      this.stopTimer();
      this.saveToLeaderboard();
      this.goTo('/result/result.html');
    },

    /* ── HUD injection ──────────────────────────── */
    injectHUD: function() {
      if (document.getElementById('gs-hud')) return;
      var self = this;
      this.resumeTimer();

      /* Load Socket.IO from Sentinel server if not already loaded */
      if (typeof io === 'undefined') {
        var scr = document.createElement('script');
        scr.src = window.location.origin + '/socket.io/socket.io.js';
        scr.onload = function() { _getSocket(); };
        document.head.appendChild(scr);
      } else {
        _getSocket();
      }

      var div = document.createElement('div');
      div.id  = 'gs-hud';
      div.innerHTML =
        '<span id="gs-room-lbl">◈ ROOM ' + this.getProgress() + '/6</span>' +
        '<span id="gs-score-wrap">⚡ <b id="gs-score-val">' + this.getScore() + '</b> PTS</span>' +
        '<span id="gs-time-wrap">⏱ <span id="gs-time-val">' + this.fmtTime(this.elapsedSec()) + '</span></span>' +
        '<button id="gs-stop-btn" onclick="GS._confirmStop()">■ STOP</button>';
      document.body.prepend(div);

      setInterval(function(){
        var tv = document.getElementById('gs-time-val');
        if (tv) tv.textContent = self.fmtTime(self.elapsedSec());
        var sv = document.getElementById('gs-score-val');
        if (sv) sv.textContent = self.getScore();
        var rl = document.getElementById('gs-room-lbl');
        if (rl) rl.textContent = '◈ ROOM ' + self.getProgress() + '/6';
      }, 1000);
    },

    refreshHUDScore: function() {
      var sv = document.getElementById('gs-score-val');
      if (sv) sv.textContent = this.getScore();
      var rl = document.getElementById('gs-room-lbl');
      if (rl) rl.textContent = '◈ ROOM ' + this.getProgress() + '/6';
    },

    _confirmStop: function() {
      if (confirm('Stop game and go to results?\nYour current score and time will be saved.')) {
        this.stopTimer();
        this.saveToLeaderboard();
        this.goTo('/result/result.html');
      }
    },

    /* ══════════════════════════════════════════════════════════════
       AAA CINEMATIC VICTORY SCREEN  v8 FINAL
    ══════════════════════════════════════════════════════════════ */
    celebrate: function(msg, subMsg, onContinue, roomPts) {
      if (document.getElementById('gs-victory')) return;

      var sc   = this.getScore();
      var el   = this.elapsedSec();
      var pct  = Math.min(100, Math.round(sc / this.MAX_SCORE * 100));
      var prog = this.getProgress();
      var pts  = (roomPts != null) ? roomPts : 0;
      var p    = sc / this.MAX_SCORE;
      var rank = p >= .88 ? 'S' : p >= .70 ? 'A' : p >= .48 ? 'B' : 'C';
      var MAX  = this.MAX_SCORE;
      var self = this;

      var RD = {
        S:{icon:'🏆',label:'RANK S',sub:'LEGENDARY', col:'#e8c56a',glow:'rgba(232,197,106,.9)', shadow:'rgba(232,197,106,.22)',badge:'◈ FLAWLESS EXECUTION ◈'},
        A:{icon:'⚡',label:'RANK A',sub:'ELITE',     col:'#00ff99',glow:'rgba(0,255,153,.85)',  shadow:'rgba(0,255,153,.2)',   badge:'◈ SUPERIOR PERFORMANCE ◈'},
        B:{icon:'🔑',label:'RANK B',sub:'CAPABLE',   col:'#00d4ff',glow:'rgba(0,212,255,.8)',   shadow:'rgba(0,212,255,.18)',  badge:'◈ SOLID EXECUTION ◈'},
        C:{icon:'💀',label:'RANK C',sub:'SURVIVOR',  col:'#ff4466',glow:'rgba(255,68,102,.75)', shadow:'rgba(255,68,102,.16)', badge:'◈ YOU ESCAPED · BARELY ◈'},
      };
      var rd = RD[rank];

      var pipHTML = '';
      for (var i = 0; i < 6; i++) {
        if      (i < prog-1)  pipHTML += '<div class="v7p done"><div class="v7pf"></div></div>';
        else if (i === prog-1) pipHTML += '<div class="v7p cur"><div class="v7pf"></div></div>';
        else                  pipHTML += '<div class="v7p"><div class="v7pf"></div></div>';
      }

      var ov = document.createElement('div');
      ov.id  = 'gs-victory';
      ov.innerHTML = `
<style>
#gs-victory *{box-sizing:border-box;margin:0;padding:0}
#gs-victory{position:fixed;inset:0;z-index:999999;display:flex;align-items:center;
  justify-content:center;font-family:'Share Tech Mono','Courier New',monospace;overflow:hidden}
#v7bg{position:absolute;inset:0;z-index:0;
  background:radial-gradient(ellipse 80% 60% at 50% 40%,rgba(6,12,35,.98),rgba(1,2,10,.995))}
#v7grid{position:absolute;inset:0;z-index:1;pointer-events:none;
  background-image:linear-gradient(rgba(79,158,255,.025) 1px,transparent 1px),
    linear-gradient(90deg,rgba(79,158,255,.025) 1px,transparent 1px);background-size:44px 44px}
#v7scan{position:absolute;inset:0;z-index:2;pointer-events:none;
  background:repeating-linear-gradient(0deg,transparent,transparent 2px,rgba(0,0,0,.06) 2px,rgba(0,0,0,.06) 4px)}
#v7vign{position:absolute;inset:0;z-index:3;pointer-events:none;
  background:radial-gradient(ellipse 100% 100% at 50% 50%,transparent 35%,rgba(0,0,0,.75) 100%)}
#v7cvbg,#v7cvconf{position:absolute;inset:0;pointer-events:none}
#v7cvbg{z-index:1}#v7cvconf{z-index:4}
#v7sweep{position:absolute;left:0;right:0;height:2px;top:-2px;z-index:5;pointer-events:none;
  background:linear-gradient(90deg,transparent,rgba(0,212,255,.5) 30%,${rd.col} 50%,rgba(0,212,255,.5) 70%,transparent);
  box-shadow:0 0 18px rgba(0,212,255,.35);animation:v7sw 3s ease .1s both}
@keyframes v7sw{0%{top:-2px;opacity:0}4%{opacity:1}100%{top:100%;opacity:0}}
#v7panel{position:relative;z-index:10;width:min(700px,97vw);background:rgba(4,8,22,.97);
  border:1px solid rgba(232,197,106,.18);border-radius:3px;overflow:hidden;
  box-shadow:0 0 0 1px rgba(0,212,255,.04),0 0 80px rgba(232,197,106,.07),0 60px 120px rgba(0,0,0,.96);
  animation:v7pi .52s cubic-bezier(.16,1,.3,1) .04s both}
@keyframes v7pi{from{transform:scale(.87) translateY(34px);opacity:0}to{transform:none;opacity:1}}
.v7c{position:absolute;width:20px;height:20px;z-index:20}
.v7c::before,.v7c::after{content:'';position:absolute;background:rgba(232,197,106,.65)}
.v7c::before{height:2px;width:100%}.v7c::after{width:2px;height:100%}
.v7c.tl{top:0;left:0}.v7c.tl::before,.v7c.tl::after{top:0;left:0}
.v7c.tr{top:0;right:0}.v7c.tr::before{top:0;right:0}.v7c.tr::after{top:0;right:0}
.v7c.bl{bottom:0;left:0}.v7c.bl::before{bottom:0;left:0}.v7c.bl::after{bottom:0;left:0}
.v7c.br{bottom:0;right:0}.v7c.br::before{bottom:0;right:0}.v7c.br::after{bottom:0;right:0}
.v7tl{height:2px;background:linear-gradient(90deg,transparent,rgba(0,212,255,.4) 10%,${rd.col} 35%,rgba(255,255,255,.85) 50%,${rd.col} 65%,rgba(0,212,255,.4) 90%,transparent);
  box-shadow:0 0 12px ${rd.shadow};animation:v7tlg 2.5s ease-in-out infinite}
@keyframes v7tlg{0%,100%{opacity:.75}50%{opacity:1}}
.v7hero{position:relative;padding:28px 32px 24px;display:flex;align-items:center;gap:24px;
  background:linear-gradient(135deg,rgba(232,197,106,.04),transparent 55%);
  border-bottom:1px solid rgba(255,255,255,.04);overflow:hidden}
.v7hero::after{content:'';position:absolute;right:-50px;top:-50px;width:180px;height:180px;
  border-radius:50%;background:radial-gradient(circle,${rd.shadow},transparent 70%);pointer-events:none}
.v7badge{flex-shrink:0;width:82px;height:82px;position:relative;display:flex;align-items:center;justify-content:center;
  animation:v7bi .55s cubic-bezier(.34,1.56,.64,1) .32s both}
@keyframes v7bi{from{transform:scale(0) rotate(-18deg);opacity:0}to{transform:none;opacity:1}}
.v7bhex{position:absolute;inset:0;background:rgba(4,8,22,.95);border:2px solid ${rd.col};
  clip-path:polygon(50% 0%,93% 25%,93% 75%,50% 100%,7% 75%,7% 25%);
  box-shadow:0 0 22px ${rd.shadow},inset 0 0 18px ${rd.shadow};
  animation:v7bh 2s ease-in-out infinite}
@keyframes v7bh{0%,100%{box-shadow:0 0 22px ${rd.shadow},inset 0 0 18px ${rd.shadow}}50%{box-shadow:0 0 38px ${rd.glow},inset 0 0 26px ${rd.shadow}}}
.v7bico{position:relative;z-index:2;font-size:2rem;filter:drop-shadow(0 0 9px ${rd.col})}
.v7bltr{position:absolute;bottom:2px;right:3px;z-index:3;font-size:.58rem;font-weight:700;letter-spacing:1px;color:${rd.col};text-shadow:0 0 8px ${rd.glow}}
.v7tb{flex:1;min-width:0}
.v7ey{font-size:.48rem;letter-spacing:4px;color:rgba(0,212,255,.55);margin-bottom:6px;animation:v7fu .38s ease .38s both}
.v7hl{font-size:clamp(1.1rem,3.5vw,1.75rem);font-weight:700;letter-spacing:5px;color:${rd.col};text-shadow:0 0 26px ${rd.shadow};line-height:1;margin-bottom:8px;animation:v7fu .38s ease .46s both}
.v7sl{font-size:.62rem;letter-spacing:2px;color:rgba(180,200,230,.42);animation:v7fu .38s ease .52s both}
.v7rb{display:inline-block;margin-top:9px;padding:4px 11px;background:rgba(232,197,106,.07);border:1px solid rgba(232,197,106,.18);border-radius:2px;font-size:.47rem;letter-spacing:3px;color:${rd.col};animation:v7fu .38s ease .58s both}
@keyframes v7fu{from{opacity:0;transform:translateY(9px)}to{opacity:1;transform:none}}
.v7stats{display:grid;grid-template-columns:repeat(3,1fr);background:rgba(255,255,255,.02);border-bottom:1px solid rgba(255,255,255,.04)}
.v7st{padding:18px 14px 16px;text-align:center;border-right:1px solid rgba(255,255,255,.04);animation:v7sti .38s ease both;position:relative}
.v7st::before{content:'';position:absolute;top:0;left:0;right:0;height:1px;background:linear-gradient(90deg,transparent,rgba(255,255,255,.055),transparent)}
.v7st:last-child{border-right:none}
.v7st:nth-child(1){animation-delay:.26s}.v7st:nth-child(2){animation-delay:.34s}.v7st:nth-child(3){animation-delay:.42s}
@keyframes v7sti{from{opacity:0;transform:translateY(13px)}to{opacity:1;transform:none}}
.v7sl2{font-size:.46rem;letter-spacing:3px;color:rgba(79,120,170,.65);margin-bottom:9px}
.v7sv{font-size:2rem;font-weight:700;letter-spacing:1px;line-height:1;margin-bottom:4px}
.v7sv.gold{color:#e8c56a;text-shadow:0 0 18px rgba(232,197,106,.42)}
.v7sv.cyan{color:#00d4ff;text-shadow:0 0 14px rgba(0,212,255,.38)}
.v7sv.grn{color:#00ff99;text-shadow:0 0 13px rgba(0,255,153,.32)}
.v7su{font-size:.48rem;letter-spacing:2px;color:rgba(79,120,170,.55)}
.v7prog{padding:14px 26px;border-bottom:1px solid rgba(255,255,255,.04);background:rgba(0,0,0,.12);animation:v7fu .38s ease .5s both}
.v7ph{display:flex;justify-content:space-between;align-items:center;font-size:.47rem;letter-spacing:2.5px;color:rgba(79,120,170,.65);margin-bottom:8px}
.v7pp2{color:${rd.col};font-size:.56rem}
.v7bo{height:4px;background:rgba(255,255,255,.05);border-radius:2px;overflow:hidden;position:relative}
.v7bi2{height:100%;width:0;border-radius:2px;background:linear-gradient(90deg,rgba(0,212,255,.8),${rd.col});box-shadow:0 0 10px ${rd.shadow};transition:width 1.3s cubic-bezier(.4,0,.2,1) .5s}
.v7bs{position:absolute;top:0;left:-100%;width:60%;height:100%;background:linear-gradient(90deg,transparent,rgba(255,255,255,.38),transparent);animation:v7shine 2s ease 1.8s both}
@keyframes v7shine{0%{left:-60%}100%{left:120%}}
.v7prow{display:flex;align-items:center;gap:5px;padding:10px 26px 11px;border-bottom:1px solid rgba(255,255,255,.04);animation:v7fu .38s ease .56s both}
.v7plbl{font-size:.44rem;letter-spacing:2.5px;color:rgba(79,120,170,.55);margin-right:5px;white-space:nowrap}
.v7p{flex:1;height:4px;border-radius:2px;background:rgba(255,255,255,.05);overflow:hidden}
.v7pf{height:100%;width:0;border-radius:2px;transition:width .6s ease}
.v7p.done .v7pf{width:100%;background:#00ff99;box-shadow:0 0 7px rgba(0,255,153,.45)}
.v7p.cur .v7pf{width:100%;background:${rd.col};box-shadow:0 0 9px ${rd.shadow};animation:v7pp 1s ease-in-out infinite}
@keyframes v7pp{0%,100%{opacity:1}50%{opacity:.5}}
.v7ft{display:flex;align-items:center;justify-content:space-between;padding:18px 26px 22px;gap:18px;animation:v7fu .38s ease .64s both}
.v7pi{display:flex;flex-direction:column;gap:3px;flex:1;min-width:0}
.v7pn{font-size:.82rem;letter-spacing:1.5px;color:rgba(220,232,248,.8);white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
.v7pu{font-size:.52rem;letter-spacing:2px;color:rgba(79,120,170,.65)}
.v7sys{font-size:.47rem;letter-spacing:1.8px;color:rgba(79,120,170,.45);display:flex;align-items:center;gap:5px;margin-top:4px}
.v7dot{width:5px;height:5px;border-radius:50%;background:#00ff99;flex-shrink:0;box-shadow:0 0 7px rgba(0,255,153,.7);animation:v7d 1s ease-in-out infinite}
@keyframes v7d{0%,100%{opacity:1}50%{opacity:.18}}
.v7cta{position:relative;overflow:hidden;padding:13px 36px;background:transparent;border:1px solid ${rd.col};border-radius:2px;color:${rd.col};font-family:'Share Tech Mono','Courier New',monospace;font-size:.9rem;font-weight:700;letter-spacing:5px;cursor:pointer;white-space:nowrap;flex-shrink:0;transition:color .25s,box-shadow .25s}
.v7cta::before{content:'';position:absolute;inset:0;background:${rd.col};transform:translateX(-100%) skewX(-8deg);transition:transform .3s cubic-bezier(.4,0,.2,1);z-index:0}
.v7cta span{position:relative;z-index:1}
.v7cta:hover{color:#000;box-shadow:0 0 28px ${rd.shadow}}
.v7cta:hover::before{transform:translateX(0) skewX(-8deg)}
.v7cta:active{transform:scale(.97)}
.v7bl{height:1px;background:linear-gradient(90deg,transparent,rgba(232,197,106,.12),transparent)}
</style>
<div id="v7bg"></div><div id="v7grid"></div><div id="v7scan"></div><div id="v7vign"></div>
<canvas id="v7cvbg"></canvas><canvas id="v7cvconf"></canvas><div id="v7sweep"></div>
<div id="v7panel">
  <div class="v7c tl"></div><div class="v7c tr"></div><div class="v7c bl"></div><div class="v7c br"></div>
  <div class="v7tl"></div>
  <div class="v7hero">
    <div class="v7badge"><div class="v7bhex"></div><div class="v7bico">${rd.icon}</div><div class="v7bltr">${rank}</div></div>
    <div class="v7tb">
      <div class="v7ey">◈ EXIT-VO.O · ROOM ${prog}/6 · CLEARED</div>
      <div class="v7hl">${msg}</div>
      <div class="v7sl">${subMsg||''}</div>
      <div class="v7rb">${rd.sub} · ${rd.badge}</div>
    </div>
  </div>
  <div class="v7stats">
    <div class="v7st"><div class="v7sl2">TOTAL SCORE</div><div class="v7sv gold" id="v7sc">0</div><div class="v7su">POINTS</div></div>
    <div class="v7st"><div class="v7sl2">THIS ROOM</div><div class="v7sv cyan">+${pts}</div><div class="v7su">EARNED</div></div>
    <div class="v7st"><div class="v7sl2">TIME ELAPSED</div><div class="v7sv grn">${this.fmtTime(el)}</div><div class="v7su">MM:SS</div></div>
  </div>
  <div class="v7prog">
    <div class="v7ph"><span>SCORE PROGRESS</span><span class="v7pp2">${pct}% OF MAX ${MAX}</span></div>
    <div class="v7bo"><div class="v7bi2" id="v7bar"></div><div class="v7bs"></div></div>
  </div>
  <div class="v7prow"><div class="v7plbl">ROOMS</div>${pipHTML}</div>
  <div class="v7ft">
    <div class="v7pi">
      <div class="v7pn">${this.getName()}</div>
      <div class="v7pu">${this.getUSN()}</div>
      <div class="v7sys"><span class="v7dot"></span>SYSTEM UNLOCKED · NEXT SECTOR READY</div>
    </div>
    <button class="v7cta" id="v7cont"><span>CONTINUE →</span></button>
  </div>
  <div class="v7bl"></div>
</div>`;

      document.body.appendChild(ov);
      window._gsContinueFn = onContinue || null;

      /* Animated score counter */
      (function(){
        var el2=document.getElementById('v7sc');if(!el2)return;
        var end=sc,dur=850,st=null;
        function ease(t){return 1-Math.pow(1-t,3);}
        function step(ts){if(!st)st=ts;var pr=Math.min((ts-st)/dur,1);el2.textContent=Math.round(ease(pr)*end);if(pr<1)requestAnimationFrame(step);else el2.textContent=end;}
        setTimeout(function(){requestAnimationFrame(step);},320);
      })();
      setTimeout(function(){var b=document.getElementById('v7bar');if(b)b.style.width=pct+'%';},140);

      document.getElementById('v7cont').onclick=function(){
        ov.style.transition='opacity .32s ease';ov.style.opacity='0';
        setTimeout(function(){ov.remove();if(window._gsContinueFn)window._gsContinueFn();},330);
      };

      _v7Particles(document.getElementById('v7cvbg'));
      if(rank==='S'||rank==='A')_v7Confetti(document.getElementById('v7cvconf'),rd.col);
    },

    reset: function() {
      ['gx_name','gx_usn','gx_score','gx_log','gx_progress','gx_start','gx_end']
        .forEach(function(k){localStorage.removeItem(k);});
    },
  };
})();

function _v7Particles(cv){
  if(!cv)return;var cx=cv.getContext('2d');
  function rsz(){cv.width=innerWidth;cv.height=innerHeight;}rsz();window.addEventListener('resize',rsz);
  var C=['#e8c56a','#00d4ff','#00ff99','#fff','#9b5de5','#ff4466'];
  var pts=Array.from({length:60},function(){return{x:Math.random(),y:Math.random(),vx:(Math.random()-.5)*.2,vy:-(Math.random()*.28+.04),r:Math.random()*1.4+.2,a:Math.random()*.38+.05,col:C[Math.floor(Math.random()*C.length)],ph:Math.random()*Math.PI*2};});
  function draw(){
    if(!document.getElementById('gs-victory'))return;
    cx.clearRect(0,0,cv.width,cv.height);var t=Date.now()*.001;
    pts.forEach(function(p){p.x+=p.vx*.001;p.y+=p.vy*.001;if(p.y<-.01){p.y=1.01;p.x=Math.random();}if(p.x<-.01)p.x=1.01;if(p.x>1.01)p.x=-.01;cx.beginPath();cx.arc(p.x*cv.width,p.y*cv.height,p.r,0,Math.PI*2);cx.fillStyle=p.col;cx.globalAlpha=p.a*(.45+.55*Math.sin(t*1.1+p.ph));cx.fill();});
    requestAnimationFrame(draw);
  }draw();
}
function _v7Confetti(cv,ac){
  if(!cv)return;var cx=cv.getContext('2d');cv.width=innerWidth;cv.height=innerHeight;
  var C=[ac,'#00d4ff','#00ff99','#ff4466','#fff','#9b5de5','#ffdd88','#ff9d6c'];
  var bits=Array.from({length:220},function(){return{x:cv.width*.25+Math.random()*cv.width*.5,y:-20-Math.random()*150,w:Math.random()*12+4,h:Math.random()*6+3,c:C[Math.floor(Math.random()*C.length)],vx:(Math.random()-.5)*5.5,vy:Math.random()*4+1.8,rot:Math.random()*Math.PI*2,rv:(Math.random()-.5)*.18};});
  var f=0;(function draw(){if(++f>460){cx.clearRect(0,0,cv.width,cv.height);return;}cx.clearRect(0,0,cv.width,cv.height);var fade=Math.max(0,1-f/390);bits.forEach(function(b){b.x+=b.vx;b.y+=b.vy;b.vy+=.04;b.rot+=b.rv;cx.save();cx.translate(b.x,b.y);cx.rotate(b.rot);cx.globalAlpha=fade;cx.fillStyle=b.c;cx.fillRect(-b.w/2,-b.h/2,b.w,b.h);cx.restore();});requestAnimationFrame(draw);})();
}