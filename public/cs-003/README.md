# ⚡ CodeSpot — Problem Rooms

## Files
```
codespot-final/
├── server.js            ← Node.js backend (real local GCC/MinGW)
├── package.json
└── public/
    ├── index.html       ← Problem picker (home page)
    ├── cs-001.html      ← CS-001: Fast Exponentiation   (15 pts)
    └── cs-002.html      ← CS-002: The Infinite Loop     (30 pts)
```

## Option A — Standalone (no server needed)
Open any .html file directly in Chrome/Edge/Firefox.
Uses Piston/Wandbox online GCC, or browser interpreter offline.

## Option B — Local GCC server (recommended)
```bash
npm install
npm start
# Open: http://localhost:3000
```

## Scoring Summary

| Problem | O(n) / optimal | O(n²) / other | Wrong |
|---------|---------------|--------------|-------|
| CS-001  | 15 pts        | 3 pts        | 0     |
| CS-002  | 30 pts        | 20 pts       | 0     |

## Hint Penalty
- CS-001: −3 pts per hint (max 3 hints)
- CS-002: −5 pts per hint (max 3 hints)

## Room Keys
- CS-001 key: `CS-001` → 0 marks
- CS-002 key: `CS-002` → 0 marks
