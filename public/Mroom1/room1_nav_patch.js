/**
 * EXIT-VO.O — Mroom1 Navigation Patch  v5 FINAL
 * File:  Mroom1/room1_nav_patch.js
 * Load:  AFTER room1_script.js in Mroom1/room1.html
 * Navigate -> ../cs-001/cs-001.html
 */
(function () {
  'use strict';

  GS.startTimer();
  GS.injectHUD();

  const hintUsed = { fridge: false, robot: false, guitar: false, vr: false };

  const _origGetHint = window.getHint;
  window.getHint = function (lvl) {
    if (hintUsed[lvl] === false) {
      hintUsed[lvl] = true;
      GS.deductScore(3);
      GS.refreshHUDScore();
    }
    if (_origGetHint) _origGetHint(lvl);
  };

  const finalModal = document.getElementById('modal-final');
  if (!finalModal) return;

  let won = false;
  new MutationObserver(() => {
    if (!finalModal.classList.contains('active') || won) return;
    won = true;

    GS.addScore(GS.BONUS.mroom1);
    GS.logRoom('mroom1', GS.getScore());
    GS.refreshHUDScore();

    const wt = document.getElementById('win-txt');
    if (wt) wt.style.display = 'block';

    GS.celebrate(
      'ROOM 1 CLEARED',
      '+20 BONUS · MYSTERY ROOM 1',
      () => GS.goTo('/cs-001/cs-001.html'),
      GS.BONUS.mroom1
    );
  }).observe(finalModal, { attributes: true, attributeFilter: ['class'] });

})();