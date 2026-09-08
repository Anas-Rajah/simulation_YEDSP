/* =====================================================================
   YEDSP DEMO — js/app.js — نقطة الإقلاع
   ===================================================================== */
(function (global) {
  "use strict";
  var YEDSP = global.YEDSP;

  function boot() {
    YEDSP.ui.initToastHost();
    YEDSP.ui.initDialogHost();
    window.addEventListener("hashchange", YEDSP.router.handleRoute);
    YEDSP.router.handleRoute();
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", boot);
  } else {
    boot();
  }
})(window);
