/**
 * EXIT-VO.O — CS-002 Navigation Patch  v5 FINAL
 * File:  cs-002/cs002_nav_patch.js
 * Load:  AFTER last </script> in cs-002/cs-002.html
 * Navigate -> /lastroom/index.html
 *
 * Hooks closeM() so DONE/CONTINUE click fires navigation.
 * Also hooks confirmHint() for real-time -4 pt deductions.
 * Modelled exactly on cs001_nav_patch.js (the working reference).
 */
(function () {
  'use strict';

  GS.injectHUD();

  var _earned       = 0;
  var _hintDedTotal = 0;
  var _saved        = false;

  /* Capture score from cs-002's updateScore(pts).
     cs-002 deducts hints internally before calling updateScore,
     so raw pts already reflects deductions -- but we also track
     what we already deducted live from GS and add it back
     to avoid double-counting. */
  var _origUpdateScore = window.updateScore;
  window.updateScore = function (p) {
    var raw = (typeof p === 'number') ? p : (parseInt(p, 10) || 0);
    _earned = raw + _hintDedTotal;
    if (_origUpdateScore) _origUpdateScore(p);
  };

  /* Hook confirmHint() for real-time -4 pt deduction from GS HUD */
  function hookConfirmHint() {
    if (typeof window.confirmHint !== 'function') {
      setTimeout(hookConfirmHint, 80);
      return;
    }
    var _origConfirmHint = window.confirmHint;
    window.confirmHint = function (n) {
      _origConfirmHint(n);
      GS.deductScore(4);
      _hintDedTotal += 4;
      GS.refreshHUDScore();
    };
  }
  hookConfirmHint();

  /* These are the modals whose DONE/CONTINUE ends the CS-002 journey */
  var FINAL_MODALS = new Set(['m-perfect', 'm-partial-done', 'm-key-zero']);

  /* Hook closeM() -- fires when user clicks DONE or CONTINUE */
  function hookCloseM() {
    if (typeof window.closeM !== 'function') {
      setTimeout(hookCloseM, 80);
      return;
    }
    var _origCloseM = window.closeM;
    window.closeM = function (id) {
      _origCloseM(id);
      if (FINAL_MODALS.has(id) && !_saved) {
        _saved = true;
        GS.addScore(_earned);
        GS.logRoom('cs002', _earned);
        GS.refreshHUDScore();
        setTimeout(function () {
          GS.celebrate(
            'CS-002 SOLVED',
            '+' + _earned + ' PTS · THE INFINITE LOOP',
            function () { GS.goTo('/lastroom/index.html'); },
            _earned
          );
        }, 300);
      }
    };
  }

  hookCloseM();

})();