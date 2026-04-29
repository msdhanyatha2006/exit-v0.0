/**
 * EXIT-VO.O — Mroom3 Navigation Patch  v8 FINAL
 * File:  lastroom/room3_nav_patch.js
 * Load:  AFTER script3.js in lastroom/index.html
 *
 * FLOW:   lastroom/ → ../cs-003/cs-003.html
 * HINTS:  ✅ NO SCORE DEDUCTION — hints are FREE in Mystery Room 3.
 *
 * HOW IT WORKS:
 *   script3.js has G2.showHint() which deducts from G2.s.score.
 *   We override it to call the original but NOT touch GS.score.
 *   The room's own score display still works normally.
 *
 * WIN:    Watches #win-screen for style.display='flex'
 *         (script3.js sets display directly, not via class).
 */
(function () {
  'use strict';

  GS.injectHUD();

  var _won = false;

  function patchG2() {
    if (typeof G2 === 'undefined') { setTimeout(patchG2, 100); return; }

    /* ── Override showHint to NOT deduct from GS ───
       The room's internal score can still change as normal,
       but GS.score (the global persistent score) is untouched. */
    if (typeof G2.showHint === 'function') {
      var _origShowHint = G2.showHint.bind(G2);
      G2.showHint = function() {
        /* Call original (updates room's own display) — do NOT touch GS */
        _origShowHint();
        /* Explicitly do NOT call GS.deductScore() here */
      };
    }
  }

  var _origLoad = window.onload;
  window.onload = function() {
    if (_origLoad) _origLoad();
    setTimeout(patchG2, 200);
  };

  /* ── Win detection ─────────────────────────────
     script3.js triggers win via:
       document.getElementById('win-screen').style.display = 'flex'
     So we watch the 'style' attribute, NOT class.             */
  var ws = document.getElementById('win-screen');
  if (!ws) return;

  new MutationObserver(function() {
    if (_won) return;
    var visible = ws.style.display === 'flex' || ws.classList.contains('on');
    if (!visible) return;
    _won = true;
    GS.addScore(GS.BONUS.mroom3);
    GS.logRoom('mroom3', GS.BONUS.mroom3);
    GS.refreshHUDScore();
    GS.celebrate(
      'THE PEARL IS YOURS',
      '+40 BONUS · MYSTERY ROOM 3',
      function() { GS.goTo('/cs-003/cs-003.html'); },
      GS.BONUS.mroom3
    );
  }).observe(ws, { attributes: true, attributeFilter: ['class', 'style'] });

})();