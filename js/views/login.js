/* =====================================================================
   YEDSP DEMO — js/views/login.js
   شاشة الدخول. لا مصادقة حقيقية إطلاقاً: النموذج واجهة فقط، والدخول
   الفعلي يتم باختيار الدور — وهذا مقصود ومعلن في هذا العرض التجريبي.
   ===================================================================== */
(function (global) {
  "use strict";
  var YEDSP = global.YEDSP, ui = YEDSP.ui, actions = YEDSP.actions;

  var ROLE_ICON = {
    citizen: "id", surveyor: "search", field_coordinator: "flag", ops_manager: "map",
    reviewer: "check", distributor: "truck", auditor: "shield", donor: "gift",
    admin: "settings", integrator: "link"
  };
  var TWO_FACTOR_ROLES = ["reviewer", "distributor", "auditor", "admin"];

  function enterRole(roleCode) {
    actions.login(roleCode);
    YEDSP.router.navigate(YEDSP.router.HOME_HASH[roleCode]);
  }

  function render(container) {
    var s = actions.getState();
    var busy = !!container.__authBusy;

    container.innerHTML =
      '<div class="pub"><div class="auth">' +

      /* ===== لوحة العلامة ===== */
      '<aside class="auth-brand">' +
      '<div id="auth-map" class="map-watermark"></div>' +
      '<div style="position:relative;z-index:2">' + ui.BrandMark({ onDark: true }) + "</div>" +
      '<div class="ab-body">' +
      "<h2>بوابة واحدة لكل من يعمل على استجابة واحدة</h2>" +
      "<p>مواطنون ومسّاحون وموظفو فحص ومراكز توزيع وجهات ممولة ورقابة — كلٌّ يرى مساحته وصلاحياته فقط، من قاعدة كود واحدة.</p>" +
      '<div class="auth-points">' +
      "<div>" + ui.icon("shield", 17) + "<span>مصادقة ثنائية إلزامية للأدوار الحساسة: الفحص والتوزيع والحماية والإدارة.</span></div>" +
      "<div>" + ui.icon("sync", 17) + "<span>تطبيق الميدان ومراكز الصرف تعمل بلا اتصال، وتُزامن دفعةً واحدة عند عودة التغطية.</span></div>" +
      "<div>" + ui.icon("lock", 17) + "<span>كل عملية حسّاسة تُكتب في سلسلة تدقيق تشفيرية لا تقبل التعديل ولا الحذف.</span></div>" +
      "</div></div>" +
      '<div class="ab-foot">NAT-2026-YEDSP · واجهة عرض تجريبية بلا خادم وبلا بيانات حقيقية</div>' +
      "</aside>" +

      /* ===== لوحة النموذج ===== */
      '<main class="auth-panel"><div class="auth-card">' +
      '<div class="mob-brand">' + ui.BrandMark({}) + "</div>" +
      "<h1>تسجيل الدخول</h1>" +
      '<p class="sub">أدخل بياناتك للوصول إلى مساحة عملك، أو اختر دوراً من الوصول السريع لتجربة المنصة مباشرة.</p>' +

      '<div class="auth-box">' +
      '<form id="auth-form">' +
      ui.Field({ id: "identifier", label: "المعرّف أو الرقم الوطني", value: "YE-1073-2026", attrs: ' autocomplete="username" dir="ltr" style="text-align:start"' }) +
      '<div class="field"><label for="password">كلمة المرور</label><div class="pw-wrap">' +
      '<input id="password" name="password" type="password" value="demo-access" autocomplete="current-password">' +
      '<button type="button" class="pw-toggle" id="pw-toggle" aria-label="إظهار كلمة المرور">' + ui.icon("eye", 18) + "</button>" +
      "</div></div>" +
      ui.Select({
        id: "role", label: "مساحة العمل",
        options: s.roles.map(function (r) { return { value: r.code, label: r.label }; })
      }) +
      '<div class="auth-row">' +
      '<label><input type="checkbox" id="remember" checked> تذكّر هذا الجهاز</label>' +
      '<a href="#/login" id="forgot">نسيت كلمة المرور؟</a>' +
      "</div>" +
      ui.Button({
        label: busy ? "جارٍ التحقق…" : "تسجيل الدخول",
        variant: "primary", type: "submit", block: true, icon: "lock", disabled: busy
      }) +
      "</form>" +
      '<div class="auth-note">' + ui.icon("shield", 15) +
      "<span>الأدوار الحساسة (الفحص، التوزيع، الحماية، الإدارة) تتطلب مصادقة ثنائية في النظام الفعلي؛ هذا العرض التجريبي يتخطّاها.</span></div>" +
      "</div>" +

      '<div class="auth-sep">الوصول السريع للتجربة</div>' +
      '<div class="role-chips">' + s.roles.map(function (r) {
        return '<button class="role-chip" data-role="' + r.code + '" type="button">' +
          '<span class="rc-ic">' + ui.icon(ROLE_ICON[r.code] || "id", 16) + "</span>" +
          '<span class="rc-tx"><b>' + ui.esc(r.label) + "</b><span>" + r.code + "</span></span></button>";
      }).join("") + "</div>" +

      '<div class="auth-back"><a href="#/">' + ui.icon("chevron", 14) + " العودة إلى الصفحة الرئيسية</a></div>" +
      "</div></main>" +
      "</div></div>";

    /* خارطة اليمن كعلامة مائية في لوحة العلامة */
    var mapHost = container.querySelector("#auth-map");
    if (mapHost && global.YEDSP_GEO) {
      var geo = global.YEDSP_GEO;
      mapHost.innerHTML = '<svg viewBox="' + geo.viewBox + '" xmlns="http://www.w3.org/2000/svg">' +
        Object.keys(geo.governorates).map(function (id) {
          return '<path d="' + geo.governorates[id].d + '"></path>';
        }).join("") + "</svg>";
    }

    /* إظهار/إخفاء كلمة المرور */
    var pwBtn = container.querySelector("#pw-toggle");
    pwBtn.addEventListener("click", function () {
      var input = container.querySelector("#password");
      var shown = input.type === "text";
      input.type = shown ? "password" : "text";
      pwBtn.innerHTML = ui.icon(shown ? "eye" : "eyeOff", 18);
    });

    container.querySelector("#forgot").addEventListener("click", function (e) {
      e.preventDefault();
      ui.showDialog({
        title: "استعادة كلمة المرور",
        body: "في النظام الفعلي يُرسل رابط استعادة إلى القناة المسجَّلة للحساب. هذا العرض التجريبي لا يملك خادماً، فاختر دوراً من الوصول السريع للمتابعة.",
        confirmLabel: "حسناً"
      });
    });

    container.querySelector("#auth-form").addEventListener("submit", function (e) {
      e.preventDefault();
      if (container.__authBusy) return;
      var role = container.querySelector("#role").value;
      container.__authBusy = true;
      render(container);
      setTimeout(function () {
        container.__authBusy = false;
        if (TWO_FACTOR_ROLES.indexOf(role) !== -1) {
          ui.toast("تم تجاوز خطوة المصادقة الثنائية في العرض التجريبي", "warn");
        }
        enterRole(role);
      }, 650);
    });

    container.querySelectorAll(".role-chip").forEach(function (chip) {
      chip.addEventListener("click", function () { enterRole(chip.getAttribute("data-role")); });
    });
  }

  YEDSP.views = YEDSP.views || {};
  YEDSP.views.login = { render: render };
})(window);
