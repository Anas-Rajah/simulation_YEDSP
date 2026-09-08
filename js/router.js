/* =====================================================================
   YEDSP DEMO — js/router.js
   موجّه بسيط قائم على الهاش (hash-based)، بلا مكتبة توجيه خارجية.
   ===================================================================== */
(function (global) {
  "use strict";
  var YEDSP = global.YEDSP;
  var ui = YEDSP.ui;
  var actions = YEDSP.actions;

  var ROLE_SPACE = {
    citizen: "citizen", surveyor: "field", field_coordinator: "ops", ops_manager: "ops",
    reviewer: "review", distributor: "distribution", auditor: "protection",
    donor: "donor", admin: "admin", integrator: "integrator"
  };
  var SPACE_LABEL = {
    citizen: "بوابة المواطن", field: "تطبيق الميدان", review: "مساحة الفحص",
    distribution: "مساحة التوزيع", ops: "مساحة العمليات", protection: "مساحة الحماية",
    donor: "مساحة المانح", admin: "لوحة الإدارة", integrator: "حساب التكامل"
  };
  var HOME_HASH = {
    citizen: "#/citizen/home", surveyor: "#/field/assignments", field_coordinator: "#/ops/map",
    ops_manager: "#/ops/map", reviewer: "#/review/queue", distributor: "#/distribution/scan",
    auditor: "#/protection/triage", donor: "#/donor/dashboard", admin: "#/admin/accounts",
    integrator: "#/integrator/console"
  };
  var ROLE_ICON = { citizen: "id", surveyor: "search", field_coordinator: "flag", ops_manager: "map", reviewer: "check", distributor: "truck", auditor: "shield", donor: "gift", admin: "settings", integrator: "link" };

  var NAV = {
    citizen: [
      { seg: "home", label: "الرئيسية", short: "الرئيسية", icon: "home" },
      { seg: "identity", label: "التسجيل بالهوية", short: "هويتي", icon: "id" },
      { seg: "new-request", label: "تقديم طلب مساعدة", short: "طلب جديد", icon: "filePlus", perm: "apply_aid" },
      { seg: "requests", label: "تتبّع طلباتي", short: "طلباتي", icon: "list" },
      { seg: "complaints", label: "تقديم ومتابعة بلاغ", short: "بلاغ", icon: "flag", perm: "submit_complaint" }
    ],
    field: [
      { seg: "assignments", label: "تكليفاتي", short: "تكليفاتي", icon: "briefcase" },
      { seg: "register", label: "تسجيل مستفيد", short: "تسجيل", icon: "id" },
      { seg: "verify", label: "التحقق من هوية", short: "تحقّق", icon: "search", perm: "verify_identity" },
      { seg: "crisis", label: "بلاغ أزمة", short: "أزمة", icon: "alert", perm: "manage_crises" },
      { seg: "sync", label: "حالة المزامنة والطابور", short: "المزامنة", icon: "sync" }
    ],
    review: [
      { seg: "queue", label: "طابور الطلبات", short: "الطابور", icon: "list", perm: "review_requests" },
      { seg: "decisions", label: "سجل قراراتي", short: "قراراتي", icon: "check" },
      { seg: "search", label: "بحث في المستفيدين", short: "بحث", icon: "search", perm: "review_requests" }
    ],
    distribution: [
      { seg: "scan", label: "مسح رمز القسيمة", short: "مسح", icon: "scan", perm: "scan_vouchers" },
      { seg: "log", label: "سجل الصرف اليومي", short: "السجل", icon: "list" }
    ],
    ops: [
      { seg: "map", label: "الخارطة الوطنية", short: "الخارطة", icon: "map", perm: "view_coverage" },
      { seg: "assignments", label: "التكليفات الميدانية", short: "التكليفات", icon: "briefcase", perm: "manage_assignments" },
      { seg: "crises", label: "سجل الأزمات", short: "الأزمات", icon: "alert", perm: "manage_crises" },
      { seg: "performance", label: "مؤشرات الأداء", short: "المؤشرات", icon: "clock", perm: "view_coverage" },
      { seg: "reports", label: "التقارير التشغيلية", short: "التقارير", icon: "printer", perm: "export_reports" }
    ],
    protection: [
      { seg: "triage", label: "لوحة فرز البلاغات", short: "الفرز", icon: "kanban", perm: "triage_complaints" },
      { seg: "audit", label: "سجل التدقيق", short: "التدقيق", icon: "lock", perm: "view_audit_trail" }
    ],
    donor: [
      { seg: "dashboard", label: "لوحة منحي", short: "منحي", icon: "gift" },
      { seg: "reports", label: "التقارير وشهادات الأثر", short: "التقارير", icon: "printer", perm: "export_reports" }
    ],
    admin: [
      { seg: "accounts", label: "الحسابات", short: "الحسابات", icon: "users", perm: "manage_users" },
      { seg: "permissions", label: "مصفوفة الصلاحيات", short: "الصلاحيات", icon: "lock", perm: "manage_settings" },
      { seg: "references", label: "المرجعيات وإعدادات المُهل", short: "المرجعيات", icon: "settings", perm: "manage_references" }
    ],
    integrator: [
      { seg: "console", label: "لوحة المطوّر (API)", short: "المطوّر", icon: "link" }
    ]
  };
  var DETAIL_PARENT = {
    "request-detail": "requests", "voucher": "requests", "review-detail": "queue",
    "confirm": "scan", "governorate": "map", "complaint-detail": "triage", "geographic": "dashboard"
  };

  function kebabToCamel(s) { return s.replace(/-([a-z0-9])/g, function (_, c) { return c.toUpperCase(); }); }

  function parseHash() {
    var raw = location.hash || "";
    // مسارات النظام تبدأ بـ "#/" دائماً؛ أي هاش آخر (#about وأمثاله) مرساة
    // داخل الصفحة التعريفية لا مسار توجيه.
    if (raw.indexOf("#/") !== 0) return { landing: true };
    var parts = raw.slice(2).split("/").filter(Boolean);
    if (!parts.length) return { landing: true };
    if (parts[0] === "login") return { login: true };
    return { space: parts[0], screen: parts[1] || "home", params: parts.slice(2) };
  }

  var current = { space: null, screen: null, params: [] };

  function navigate(hash) {
    if (location.hash === hash) { handleRoute(); } else { location.hash = hash; }
  }

  function showPublic(renderFn) {
    var publicRoot = document.getElementById("public-root");
    document.getElementById("app-header").classList.add("hidden");
    document.getElementById("app-shell").classList.add("hidden");
    document.getElementById("app-tabbar").classList.add("hidden");
    publicRoot.classList.remove("hidden");
    window.scrollTo(0, 0);
    renderFn(publicRoot);
  }

  function handleRoute() {
    var state = actions.getState();
    var r = parseHash();
    var publicRoot = document.getElementById("public-root");

    if (r.landing) { showPublic(YEDSP.views.landing.render); return; }
    if (r.login) { showPublic(YEDSP.views.login.render); return; }
    if (!state.currentRole) { location.hash = "#/login"; return; }

    var space = ROLE_SPACE[state.currentRole];
    if (r.space !== space) { location.hash = HOME_HASH[state.currentRole]; return; }

    document.getElementById("app-header").classList.remove("hidden");
    document.getElementById("app-shell").classList.remove("hidden");
    publicRoot.classList.add("hidden");
    publicRoot.innerHTML = "";
    renderShell();
    mountView(space, r.screen, r.params);
  }

  function mountView(space, screen, params) {
    current = { space: space, screen: screen, params: params || [] };
    var view = document.getElementById("app-view");
    view.innerHTML = ui.Skeleton("detail");
    window.scrollTo(0, 0);
    setTimeout(renderCurrent, 210 + Math.floor(Math.random() * 90));
  }

  function renderCurrent() {
    var view = document.getElementById("app-view");
    if (!view) return;
    var viewModule = YEDSP.views[current.space];
    var fnName = kebabToCamel(current.screen);
    if (!viewModule || typeof viewModule[fnName] !== "function") {
      view.innerHTML = ui.EmptyState({ title: "الشاشة غير متاحة", hint: "تعذّر العثور على هذه الشاشة في هذا العرض التجريبي." });
      return;
    }
    viewModule[fnName](view, current.params || []);
    highlightNav();
  }

  function highlightNav() {
    var activeSeg = DETAIL_PARENT[current.screen] || current.screen;
    document.querySelectorAll("#app-nav a, #app-tabbar a").forEach(function (a) {
      var on = a.getAttribute("data-seg") === activeSeg;
      a.classList.toggle("active", on);
      if (a.closest("#app-tabbar")) a.setAttribute("aria-current", on ? "page" : "false");
    });
  }

  function renderShell() {
    var state = actions.getState();
    var role = state.currentRole;
    var space = ROLE_SPACE[role];
    var roleDef = state.roles.filter(function (r) { return r.code === role; })[0];
    var user = actions.currentUser();

    var header = document.getElementById("app-header");
    header.innerHTML =
      '<a class="hdr-brand" href="#/">' + ui.brandMarkSvg(30) +
      '<span class="hb-tx"><b>YEDSP</b><i>' + ui.esc(SPACE_LABEL[space] || "") + "</i></span></a>" +
      '<div class="sp"></div>' +
      '<div class="role-pill">' + ui.icon(ROLE_ICON[role] || "id", 15) + '<b>' + ui.esc(roleDef ? roleDef.label : role) + '</b>' +
      (user ? '<i>' + ui.esc(user.name) + '</i>' : '') + '</div>' +
      '<button class="hdr-btn" id="btn-reset-demo" title="إعادة تعيين بيانات العرض">' + ui.icon("sync", 14) + '<span> إعادة التعيين</span></button>' +
      '<button class="hdr-btn" id="btn-switch-role" title="تبديل الدور">' + ui.icon("users", 14) + '<span> تبديل الدور</span></button>';

    document.getElementById("btn-switch-role").addEventListener("click", function () { navigate("#/login"); });
    document.getElementById("btn-reset-demo").addEventListener("click", function () {
      ui.showDialog({
        title: "إعادة تعيين بيانات العرض", body: "سيُعاد ضبط كل الطلبات والقسائم والبلاغات والصلاحيات إلى حالتها الأصلية. هل تريد المتابعة؟",
        confirmLabel: "إعادة التعيين", tone: "crit",
        onConfirm: function () { actions.resetDemoData(); navigate("#/login"); }
      });
    });

    var navItems = (NAV[space] || []).filter(function (it) { return !it.perm || actions.hasPermission(it.perm, role); });
    var nav = document.getElementById("app-nav");
    nav.innerHTML = '<div class="nav-space">' + ui.esc(SPACE_LABEL[space] || "") + '</div>' +
      navItems.map(function (it) {
        return '<a href="#/' + space + '/' + it.seg + '" data-seg="' + it.seg + '">' + ui.icon(it.icon, 17) + '<span>' + ui.esc(it.label) + '</span></a>';
      }).join("");

    // شريط تبويب سفلي للهاتف — من نفس عناصر التنقّل المصفّاة بالصلاحيات
    var tabbar = document.getElementById("app-tabbar");
    tabbar.classList.remove("hidden");
    tabbar.innerHTML = navItems.map(function (it) {
      return '<a href="#/' + space + '/' + it.seg + '" data-seg="' + it.seg + '">' +
        ui.icon(it.icon, 20) + '<span>' + ui.esc(it.short || it.label) + "</span></a>";
    }).join("");

    highlightNav();
  }

  actions.subscribe(function (state) {
    // إعادة رسم الرأس والتنقّل فقط (بدون وميض تحميل) عند أي تغيّر حالة —
    // هذا ما يجعل تبديل صلاحية في لوحة الإدارة ينعكس فوراً على قائمة أي دور آخر.
    if (state.currentRole && !document.getElementById("app-shell").classList.contains("hidden")) {
      renderShell();
    }
  });

  YEDSP.router = { navigate: navigate, refresh: renderCurrent, handleRoute: handleRoute, renderShell: renderShell, HOME_HASH: HOME_HASH };
})(window);
