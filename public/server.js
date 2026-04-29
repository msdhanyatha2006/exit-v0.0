/**
 * EXIT-VO.O — Unified Server v3.0  (Piston-Only Compiler)
 * ═══════════════════════════════════════════════════════════════
 * NO GCC NEEDED. NO MINGW. NO LOCAL COMPILER.
 *
 * C code is compiled via the FREE Piston API (emkc.org).
 * Works on ANY host, ANY OS, out of the box.
 *
 *  ✅ Serves all game pages from /public
 *  ✅ /gcc-info  → always returns { available: true }
 *  ✅ /compile   → proxies to Piston API, returns exact format the CS pages expect
 *  ✅ Socket.io  → Sentinel proctoring (Conductor dashboard)
 *
 * START:   npm install  →  npm start
 * HOSTING: Push to Render / Railway / any Node host. Zero config.
 */

'use strict';

const express    = require('express');
const http       = require('http');
const { Server } = require('socket.io');
const cors       = require('cors');
const rateLimit  = require('express-rate-limit');
const https      = require('https');
const path       = require('path');
const os         = require('os');

const app    = express();
const server = http.createServer(app);
const io     = new Server(server, {
  cors: { origin: '*', methods: ['GET', 'POST'] },
  pingTimeout : 60000,
  pingInterval: 25000,
});
const PORT = process.env.PORT || 3000;

// ═══════════════════════════════════════════════════════════════
//  MIDDLEWARE
// ═══════════════════════════════════════════════════════════════
app.use(cors({ origin: true, methods: ['GET', 'POST', 'OPTIONS'], allowedHeaders: ['Content-Type'] }));
app.options('*', cors());
app.use(express.json({ limit: '128kb' }));

// ─── Serve ALL game files ─────────────────────────────────────
const PUBLIC = path.join(__dirname, 'public');
app.use(express.static(PUBLIC));

app.get('/',           (_req, res) => res.sendFile(path.join(PUBLIC, 'main1screen', 'index.html')));
app.get('/conductor',  (_req, res) => res.sendFile(path.join(PUBLIC, 'result', 'conductor.html')));
app.get('/result',     (_req, res) => res.sendFile(path.join(PUBLIC, 'result', 'result.html')));

app.get('/api/status', (_req, res) => res.json({
  status    : 'EXIT_VOO_ONLINE',
  compiler  : 'Piston API (emkc.org)',
  platform  : process.platform,
  node      : process.version,
  students  : state.students.size,
  conductors: state.conductors.size,
}));

// ═══════════════════════════════════════════════════════════════
//  /gcc-info  ← cs-001/002/003 poll this on load
//  Always returns available:true  →  browser shows green pill ✅
//  Engine is set to 'local' → all compile calls go to /compile below
// ═══════════════════════════════════════════════════════════════
app.get('/gcc-info', (_req, res) => {
  res.json({
    available : true,
    version   : 'GCC 10.2.0 (C11) · Piston Cloud API',
    binary    : 'piston',
    engine    : 'piston-cloud',
  });
});

// ═══════════════════════════════════════════════════════════════
//  PISTON API  — server-side proxy (no CORS issues for browser)
// ═══════════════════════════════════════════════════════════════
function callPiston(code, stdin) {
  return new Promise((resolve, reject) => {
    const payload = JSON.stringify({
      language        : 'c',
      version         : '*',
      files           : [{ name: 'sol.c', content: code }],
      stdin           : stdin || '',
      compile_timeout : 15000,
      run_timeout     : 10000,
      compile_args    : ['-Wall', '-Wextra', '-std=c11', '-O2', '-lm'],
    });

    const options = {
      hostname: 'emkc.org',
      path    : '/api/v2/piston/execute',
      method  : 'POST',
      headers : {
        'Content-Type'  : 'application/json',
        'Content-Length': Buffer.byteLength(payload),
        'User-Agent'    : 'exit-voo-server/3.0',
      },
      timeout: 30000,
    };

    const req = https.request(options, (res) => {
      let raw = '';
      res.setEncoding('utf8');
      res.on('data',  chunk => { raw += chunk; });
      res.on('end', () => {
        if (res.statusCode !== 200) {
          return reject(new Error(`Piston HTTP ${res.statusCode}`));
        }
        try {
          const d = JSON.parse(raw);

          // compile.code: 0 = success, non-zero = compile error
          // compile key may be absent for interpreted languages (not C)
          const compileStderr = (d.compile && d.compile.stderr) ? d.compile.stderr.trim() : '';
          const compileCode   = (d.compile && typeof d.compile.code === 'number') ? d.compile.code : 0;
          const compileFailed = compileCode !== 0;

          const runOut  = (!compileFailed && d.run && d.run.stdout) ? d.run.stdout : '';
          const runErr  = (!compileFailed && d.run && d.run.stderr) ? d.run.stderr.trim() : '';
          const runCode = (!compileFailed && d.run && typeof d.run.code === 'number') ? d.run.code : 0;

          resolve({
            compileErr : compileStderr,
            compileCode: compileFailed ? (compileCode || 1) : 0,
            runOut,
            runErr,
            runCode,
            engine     : `GCC ${d.language || 'c'} · Piston (Cloud)`,
          });
        } catch (parseErr) {
          reject(new Error('Piston parse error: ' + parseErr.message));
        }
      });
    });

    req.on('timeout', () => { req.destroy(); reject(new Error('Piston timed out after 30s')); });
    req.on('error',   (e) => reject(new Error('Piston network error: ' + e.message)));
    req.write(payload);
    req.end();
  });
}

// ═══════════════════════════════════════════════════════════════
//  /compile  — THE ONLY COMPILE ENDPOINT
//  cs-001, cs-002, cs-003 all POST here.
//  Returns the exact JSON shape localGCCRun() expects in the frontend.
// ═══════════════════════════════════════════════════════════════
const compileLimiter = rateLimit({
  windowMs: 60_000,
  max     : 60,
  message : { error: 'Too many compile requests — wait a moment and try again.' },
});

app.post('/compile', compileLimiter, async (req, res) => {
  const { code, stdin = '' } = req.body;

  if (!code || typeof code !== 'string')
    return res.status(400).json({ error: 'No code provided.' });

  if (code.length > 100_000)
    return res.status(400).json({ error: 'Code too large (max 100 KB).' });

  try {
    const result = await callPiston(code, stdin);
    return res.json(result);

  } catch (err) {
    console.error('[Piston Error]', err.message);

    // Return a user-friendly error in the same format cs pages expect
    return res.status(503).json({
      compileErr : `⚠ Compilation service temporarily unavailable.\n\nReason: ${err.message}\n\nThe Piston API (emkc.org) could not be reached. Please wait a few seconds and try again.`,
      compileCode: 1,
      runOut     : '',
      runErr     : '',
      runCode    : 0,
      engine     : 'Piston (unavailable)',
    });
  }
});

// ═══════════════════════════════════════════════════════════════
//  SENTINEL PROCTOR  — Socket.io real-time proctoring
// ═══════════════════════════════════════════════════════════════
const state = {
  examActive   : false,
  activeExamUrl: null,
  examStartedAt: null,
  students     : new Map(),
  conductors   : new Set(),
  leaderboard  : new Map(),   // keyed by USN — one entry per player
};

function broadcastStudentList() {
  const list = Array.from(state.students.values()).map(s => ({
    id: s.id, name: s.name, usn: s.usn, division: s.division,
    joinedAt: s.joinedAt, violations: s.violations, auditLog: s.auditLog,
    terminated: s.terminated, online: s.online,
    result: s.result || null, currentRoom: s.currentRoom || null,
    fullscreen: s.fullscreen,
  }));
  io.to('conductors').emit('student_list_update', list);
}

function broadcastLeaderboard() {
  const sorted = Array.from(state.leaderboard.values()).sort((a, b) =>
    b.score !== a.score ? b.score - a.score : a.timeSec - b.timeSec
  );
  io.to('conductors').emit('leaderboard_update', sorted);
}

function addViolation(studentId, category, reason) {
  const student = state.students.get(studentId);
  if (!student) return;
  if      (category === 'tabs' ) student.violations.tabs++;
  else if (category === 'mouse') student.violations.mouse++;
  else if (category === 'keys' ) student.violations.keys++;
  const entry = { time: new Date().toISOString(), reason, category, count: student.violations[category] };
  student.auditLog.unshift(entry);
  if (student.auditLog.length > 200) student.auditLog.length = 200;
  state.students.set(studentId, student);
  io.to('conductors').emit('violation_update', {
    studentId, violations: student.violations, newEntry: entry, name: student.name,
  });
}

io.on('connection', (socket) => {
  // ── Conductor ─────────────────────────────────────
  socket.on('register_conductor', () => {
    socket.join('conductors');
    state.conductors.add(socket.id);
    socket.emit('system_state', {
      examActive   : state.examActive,
      activeExamUrl: state.activeExamUrl,
      examStartedAt: state.examStartedAt,
    });
    broadcastStudentList();
  });

  // ── Student ───────────────────────────────────────
  socket.on('register_student', ({ name, usn, division }) => {
    socket.join('students');
    const studentData = {
      id        : socket.id,
      name      : name || `Candidate_${socket.id.slice(0, 5)}`,
      usn       : (usn || '').trim().toUpperCase() || socket.id.slice(0, 8),
      division  : (division || '—').trim().toUpperCase(),
      joinedAt  : new Date().toISOString(),
      violations: { tabs: 0, mouse: 0, keys: 0 },
      auditLog  : [],
      terminated: false,
      online    : true,
    };
    state.students.set(socket.id, studentData);
    if (state.examActive && state.activeExamUrl)
      socket.emit('load_exam', { url: state.activeExamUrl, message: 'Session in progress.' });
    broadcastStudentList();
    io.to('conductors').emit('student_joined', { id: socket.id, name: studentData.name, joinedAt: studentData.joinedAt });
  });

  // ── Proctor commands ──────────────────────────────
  socket.on('deploy_exam', ({ url }) => {
    if (!state.conductors.has(socket.id)) return;
    state.activeExamUrl = url;
    state.examActive    = true;
    state.examStartedAt = new Date().toISOString();
    io.to('students').emit('load_exam', { url, message: 'Exam deployed.' });
    io.to('conductors').emit('exam_deployed', { url, startedAt: state.examStartedAt, studentCount: state.students.size });
  });

  socket.on('end_exam', () => {
    if (!state.conductors.has(socket.id)) return;
    state.examActive    = false;
    state.activeExamUrl = null;
    io.to('students').emit('exam_ended', { message: 'Exam closed.' });
    io.to('conductors').emit('exam_ended_confirm', { endedAt: new Date().toISOString() });
  });

  socket.on('terminate_student', ({ targetId, reason }) => {
    if (!state.conductors.has(socket.id)) return;
    const student = state.students.get(targetId);
    if (!student) return;
    student.terminated = true;
    state.students.set(targetId, student);
    io.to(targetId).emit('session_terminated', { reason: reason || 'Session terminated by proctor.' });
    broadcastStudentList();
  });

  socket.on('warn_student', ({ targetId, message }) => {
    if (!state.conductors.has(socket.id)) return;
    io.to(targetId).emit('proctor_warning', {
      message  : message || '⚠️ Follow exam rules.',
      timestamp: new Date().toISOString(),
    });
  });

  socket.on('clear_violations', ({ targetId }) => {
    if (!state.conductors.has(socket.id)) return;
    const student = state.students.get(targetId);
    if (!student) return;
    student.violations = { tabs: 0, mouse: 0, keys: 0 };
    student.auditLog.unshift({ time: new Date().toISOString(), reason: 'Cleared by proctor', category: 'system' });
    state.students.set(targetId, student);
    broadcastStudentList();
  });

  socket.on('reset_leaderboard', () => {
    if (!state.conductors.has(socket.id)) return;
    state.leaderboard.clear();
    broadcastLeaderboard();
  });

  // ── Violation reports from students ──────────────
  socket.on('violation_tabs',  ({ reason }) => { if (state.students.has(socket.id)) addViolation(socket.id, 'tabs',  reason); });
  socket.on('violation_mouse', ({ reason }) => { if (state.students.has(socket.id)) addViolation(socket.id, 'mouse', reason); });
  socket.on('violation_keys',  ({ reason }) => { if (state.students.has(socket.id)) addViolation(socket.id, 'keys',  reason); });

  socket.on('heartbeat', ({ fullscreen, currentRoom }) => {
    const s = state.students.get(socket.id);
    if (s) {
      s.lastHeartbeat = new Date().toISOString();
      s.fullscreen = fullscreen;
      if (currentRoom) s.currentRoom = currentRoom;
    }
  });

  // ── Game result ───────────────────────────────────
  socket.on('game_result', ({ name, usn, division, score, timeSec, log }) => {
    const key = (usn || '').trim().toUpperCase() || socket.id.slice(0, 8);
    const entry = {
      name    : (name || 'Unknown').trim(),
      usn     : key,
      division: (division || '—').trim().toUpperCase(),
      score   : typeof score === 'number' ? score : (parseInt(score, 10) || 0),
      timeSec : typeof timeSec === 'number' ? timeSec : (parseInt(timeSec, 10) || 0),
      log     : log || {},
      savedAt : new Date().toISOString(),
    };
    const existing = state.leaderboard.get(key);
    if (!existing ||
        entry.score > existing.score ||
        (entry.score === existing.score && entry.timeSec < existing.timeSec)) {
      state.leaderboard.set(key, entry);
    }
    const student = state.students.get(socket.id);
    if (student) { student.result = entry; state.students.set(socket.id, student); }
    broadcastLeaderboard();
    broadcastStudentList();
    console.log(`[RESULT] ${entry.name} | ${entry.usn} | DIV:${entry.division} | score:${entry.score} | time:${entry.timeSec}s`);
  });

  // ── Disconnect ────────────────────────────────────
  socket.on('disconnect', (reason) => {
    state.conductors.delete(socket.id);
    if (state.students.has(socket.id)) {
      const student  = state.students.get(socket.id);
      student.online = false;
      state.students.set(socket.id, student);
      io.to('conductors').emit('student_disconnected', { id: socket.id, name: student.name, reason });
      broadcastStudentList();
    }
  });
});

// ═══════════════════════════════════════════════════════════════
//  START
// ═══════════════════════════════════════════════════════════════
server.listen(PORT, () => {
  console.log(`
╔══════════════════════════════════════════════════════════╗
║         EXIT-VO.O  UNIFIED SERVER v3.0 — ONLINE          ║
╠══════════════════════════════════════════════════════════╣
║  Game      : http://localhost:${PORT}/                      ║
║  Conductor : http://localhost:${PORT}/conductor             ║
║  Compile   : http://localhost:${PORT}/compile  [POST]       ║
║  GCC Info  : http://localhost:${PORT}/gcc-info [GET]        ║
╚══════════════════════════════════════════════════════════╝
  Compiler : Piston API (emkc.org) — GCC C11
  Platform : ${process.platform} / ${os.arch()}
  Node.js  : ${process.version}
  ✅ No local GCC needed. Works on any machine with internet.
  `);
});
