/**
 * EXIT-VO.O — CS-001 Navigation Patch  v5 FINAL
 * File:  cs-001/cs001_nav_patch.js
 * Load:  AFTER last </script> in cs-001/cs-001.html
 * Navigate -> /Mroom2/room2_html.html
 *
 * FIX: Hooks closeM() so DONE/CONTINUE click fires navigation.
 *      MutationObserver alone fails because closeM() removes 'show'
 *      immediately after the user clicks — we intercept at click time.
 */
(function () {
  'use strict';

  GS.injectHUD();

  let _earned = 0;
  let _saved  = false;

  /* Capture score from cs-001's updateScore(pts) */
  const _origUpdateScore = window.updateScore;
  window.updateScore = function (p) {
    _earned = (typeof p === 'number') ? p : parseInt(p, 10) || 0;
    if (_origUpdateScore) _origUpdateScore(p);
  };

  /* These are the modals whose DONE/CONTINUE ends the CS-001 journey */
  const FINAL_MODALS = new Set(['m-perfect', 'm-good-done', 'm-partial-done', 'm-key-zero']);

  /* Hook closeM() — fires when user clicks DONE or CONTINUE */
  function hookCloseM() {
    if (typeof window.closeM !== 'function') {
      setTimeout(hookCloseM, 80);
      return;
    }
    const _origCloseM = window.closeM;
    window.closeM = function (id) {
      _origCloseM(id);
      if (FINAL_MODALS.has(id) && !_saved) {
        _saved = true;
        GS.addScore(_earned);
        GS.logRoom('cs001', _earned);
        GS.refreshHUDScore();
        setTimeout(() => {
          GS.celebrate(
            'CS-001 SOLVED',
            `+${_earned} PTS · FAST EXPONENTIATION`,
            () => GS.goTo('/Mroom2/room2_html.html'),
            _earned
          );
        }, 300);
      }
    };
  }

  hookCloseM();
})();