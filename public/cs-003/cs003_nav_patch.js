/**
 * EXIT-VO.O — CS-003 Navigation Patch  v8 FINAL
 * File:  cs-003/cs003_nav_patch.js
 *
 * FLOW:  cs-003/ → /result/result.html  (Final Results)
 *
 * HINTS: −5 pts per hint, real-time deduction from GS score.
 *   CS-003 internally tracks hintPenalty (+=5 per confirmHint).
 *   The final updateScore(pts) passes pts = 30 - hintPenalty.
 *   We deduct 5 from GS immediately on confirmHint, then restore
 *   full room pts on completion to avoid double-counting.
 *
 * WIN:   Hooks closeM() — fires when DONE/CONTINUE is clicked.
 *        On win: stopTimer → saveToLeaderboard → result screen.
 */
(function () {
  'use strict';

  GS.injectHUD();

  var _earned       = 0;
  var _hintDedTotal = 0;
  var _saved        = false;

  /* ── Capture room score ─────────────────────── */
  var _origUpdateScore = window.updateScore;
  window.updateScore = function(p) {
    var raw = (typeof p === 'number') ? p : (parseInt(p, 10) || 0);
    /* Offset hint deductions already applied to GS */
    _earned = raw + _hintDedTotal;
    if (_origUpdateScore) _origUpdateScore(p);
  };

  /* ── Real-time hint deduction (−5 per hint) ─── */
  function hookConfirmHint() {
    if (typeof window.confirmHint !== 'function') { setTimeout(hookConfirmHint, 100); return; }
    var _origCH = window.confirmHint;
    window.confirmHint = function(n) {
      _origCH(n);
      GS.deductScore(5);
      _hintDedTotal += 5;
      GS.refreshHUDScore();
    };
  }
  hookConfirmHint();

  /* ── Win via closeM() ─────────────────────── */
  var FINAL_MODALS = new Set(['m-perfect', 'm-partial-done', 'm-key-zero']);

  function hookCloseM() {
    if (typeof window.closeM !== 'function') { setTimeout(hookCloseM, 80); return; }
    var _origCloseM = window.closeM;
    window.closeM = function(id) {
      _origCloseM(id);
      if (FINAL_MODALS.has(id) && !_saved) {
        _saved = true;
        GS.addScore(_earned);
        GS.logRoom('cs003', _earned);
        GS.refreshHUDScore();
        setTimeout(function() {
          GS.celebrate(
            'CHALLENGE COMPLETE',
            '+' + _earned + ' PTS · FINAL CHALLENGE',
            function() {
              GS.stopTimer();
              GS.saveToLeaderboard();   /* broadcasts to Conductor live */
              GS.goTo('/result/result.html');
            },
            _earned
          );
        }, 300);
      }
    };
  }
  hookCloseM();

})();