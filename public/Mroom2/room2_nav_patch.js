/**
 * EXIT-VO.O — Mroom2 Navigation Patch  v9 FIXED
 * File:  Mroom2/room2_nav_patch.js
 * Load:  BEFORE room2_script.js in Mroom2/room2_html.html
 *
 * FLOW:   Mroom2/ → ../cs-002/cs-002.html
 * HINTS:  −3 pts, FIRST CLICK PER SUBROOM KEY ONLY
 *
 * FIX:  The key check now reads G.s.hintKey / G.s.floatHintKey
 *       INSIDE the overridden function (after G exists), and
 *       guards against null keys so different subrooms each
 *       deduct independently on their first reveal.
 *
 * WIN:    Watches #win-screen for class 'on'.
 */
(function () {
  'use strict';

  GS.injectHUD();

  var _won       = false;
  var _panelUsed = {};   /* keyed by hintKey string — one deduction per key */
  var _floatUsed = {};   /* keyed by floatHintKey string */

  /* ── Patch G after room2_script's window.onload fires ── */
  function patchG() {
    if (typeof G === 'undefined' || typeof G.toggleHint !== 'function') {
      setTimeout(patchG, 80);
      return;
    }

    /* ── Panel hint (inside puzzle panel) ── */
    var _origToggleHint = G.toggleHint.bind(G);
    G.toggleHint = function () {
      /* Read key NOW — after G is fully initialised */
      var key  = G.s && G.s.hintKey;
      var box  = document.getElementById('ui-hint-box');
      var open = box && box.classList.contains('show');

      /* Deduct ONLY when: opening the hint + valid key + first time for this key */
      if (key && !open && !_panelUsed[key]) {
        _panelUsed[key] = true;
        GS.deductScore(3);
        GS.refreshHUDScore();
      }
      _origToggleHint();
    };

    /* ── Float hint (scene-level hint button) ── */
    var _origToggleFloat = G.toggleFloatHint.bind(G);
    G.toggleFloatHint = function () {
      var key    = G.s && G.s.floatHintKey;
      var popup  = document.getElementById('float-hint-popup');
      var isOpen = popup && popup.classList.contains('show');

      /* Deduct ONLY when: opening the hint + valid key + first time for this key */
      if (key && !isOpen && !_floatUsed[key]) {
        _floatUsed[key] = true;
        GS.deductScore(3);
        GS.refreshHUDScore();
      }
      _origToggleFloat();
    };
  }

  /* Use addEventListener instead of window.onload assignment.
     room2_script.js does:  window.onload = () => G.init()
     That assignment would OVERWRITE a window.onload set here.
     addEventListener is additive — both handlers fire safely. */
  window.addEventListener('load', function () {
    /* Small delay so G.init() (set by room2_script) runs first */
    setTimeout(patchG, 100);
  });

  /* ── Win detection ──────────────────────────────────────
     room2_script adds class 'on' to #win-screen on solve   */
  var ws = document.getElementById('win-screen');
  if (!ws) return;

  new MutationObserver(function () {
    if (!ws.classList.contains('on') || _won) return;
    _won = true;
    GS.addScore(GS.BONUS.mroom2);
    GS.logRoom('mroom2', GS.BONUS.mroom2);
    GS.refreshHUDScore();
    GS.celebrate(
      'CARNIVAL ESCAPED',
      '+25 BONUS · MYSTERY ROOM 2',
      function () { GS.goTo('/cs-002/cs-002.html'); },
      GS.BONUS.mroom2
    );
  }).observe(ws, { attributes: true, attributeFilter: ['class'] });

})();