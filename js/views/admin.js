/* =====================================================================
   YEDSP DEMO — js/views/admin.js — لوحة الإدارة (3 شاشات)
   ===================================================================== */
(function (global) {
  "use strict";
  var YEDSP = global.YEDSP, ui = YEDSP.ui, actions = YEDSP.actions, sel = YEDSP.selectors;

  function accounts(container) {
    var s = actions.getState();
    var showForm = !!container.__showForm;
    container.innerHTML =
      ui.PageHead("الحسابات", "كل الحسابات الموظّفية على المنصة (المستفيدون في جدول مستقل)",
        ui.Button({ label: showForm ? "إغلاق النموذج" : "إضافة حساب جديد", variant: "primary", icon: "plus", id: "toggle-form" })) +
      (showForm ? ui.Card(
        '<form id="u-form" class="grid g3" style="align-items:end">' +
        ui.Field({ id: "name", label: "الاسم الكامل", required: true }) +
        ui.Select({ id: "role", label: "الدور", options: s.roles.filter(function (r) { return r.code !== "citizen"; }).map(function (r) { return { value: r.code, label: r.label }; }) }) +
        ui.Field({ id: "title", label: "المسمى الوظيفي" }) +
        '<div style="grid-column:1/-1">' + ui.Button({ label: "إنشاء الحساب", variant: "primary", type: "submit" }) + "</div>" +
        "</form>", { title: "حساب جديد" }
      ) : "") +
      '<div id="u-table" style="margin-top:16px"></div>';

    function draw() {
      container.querySelector("#u-table").innerHTML = ui.Table({
        columns: [
          { label: "الاسم", key: "name" },
          { label: "الدور", render: function (u) { var r = s.roles.filter(function (x) { return x.code === u.role; })[0]; return ui.esc(r ? r.label : u.role); } },
          { label: "المسمى", key: "title" },
          { label: "المصادقة الثنائية", render: function (u) { return u.twoFactorEnabled ? ui.Badge("مفعّلة", "ok") : ui.Badge("غير مفعّلة", "neutral"); } },
          { label: "الحالة", render: function (u) { return u.active ? ui.Badge("نشط", "ok") : ui.Badge("معطّل", "crit"); } },
          { label: "", render: function (u) { return '<button class="btn btn-secondary btn-sm" data-toggle="' + u.id + '">' + (u.active ? "تعطيل" : "تفعيل") + "</button>"; } }
        ],
        rows: s.users, empty: { title: "لا توجد حسابات", hint: "" }
      });
      container.querySelectorAll("[data-toggle]").forEach(function (b) {
        b.addEventListener("click", function () { actions.toggleUserActive(b.getAttribute("data-toggle")); YEDSP.router.refresh(); });
      });
    }
    draw();
    container.querySelector("#toggle-form").addEventListener("click", function () { container.__showForm = !showForm; YEDSP.router.refresh(); });
    var form = container.querySelector("#u-form");
    if (form) form.addEventListener("submit", function (e) {
      e.preventDefault();
      var name = container.querySelector("#name").value.trim();
      if (!name) { ui.toast("يرجى إدخال الاسم الكامل", "warn"); return; }
      actions.addUser({ name: name, role: container.querySelector("#role").value, title: container.querySelector("#title").value });
      container.__showForm = false;
      YEDSP.router.refresh();
    });
  }

  function permissions(container) {
    var s = actions.getState();
    var roles = s.roles;
    container.innerHTML =
      ui.PageHead("مصفوفة الصلاحيات", "التبديل هنا يُطبَّق فوراً — جرّب تبديل صلاحية ثم تبديل الدور لرؤية الأثر على القائمة الجانبية",
        ui.Button({ label: "تصدير المصفوفة", variant: "primary", icon: "download", id: "export-pm" })) +
      '<p class="hint" style="margin-bottom:8px">مرّر يميناً ويساراً لعرض بقية الأدوار على الشاشات الصغيرة ←</p>' +
      '<div class="perm-matrix"><table class="pm"><thead><tr><th>الصلاحية</th>' +
      roles.map(function (r) { return "<th>" + ui.esc(r.label) + "</th>"; }).join("") +
      "</tr></thead><tbody>" +
      s.permissions.map(function (p) {
        return "<tr><td>" + ui.esc(p.domain) + " — " + ui.esc(p.label) + "</td>" +
          roles.map(function (r) {
            var on = s.rolePermissions[r.code][p.code];
            return '<td><button class="pm-toggle ' + (on ? "on" : "") + '" data-role="' + r.code + '" data-perm="' + p.code + '" aria-label="' + ui.esc(p.label) + " — " + ui.esc(r.label) + '">' + (on ? ui.icon("check", 13) : "") + "</button></td>";
          }).join("") + "</tr>";
      }).join("") + "</tbody></table></div>";

    container.querySelectorAll(".pm-toggle").forEach(function (btn) {
      btn.addEventListener("click", function () {
        actions.togglePermission(btn.getAttribute("data-role"), btn.getAttribute("data-perm"));
        YEDSP.router.refresh();
      });
    });
    container.querySelector("#export-pm").addEventListener("click", function () { actions.exportPlaceholder("مصفوفة الصلاحيات"); });
  }

  function references(container) {
    var s = actions.getState();
    container.innerHTML =
      ui.PageHead("المرجعيات وإعدادات المُهل", "قيم تشغيلية أساسية يعتمد عليها النظام كله",
        ui.Button({ label: "حفظ الإعدادات", variant: "primary", icon: "check", id: "save-settings" })) +
      '<div class="grid g2">' +
      ui.Card(
        '<form id="sla-form">' +
        s.complaintCategories.map(function (c) {
          return ui.Field({ id: "sla-" + c.code, label: "مهلة فئة " + c.name + " (" + c.code + ") — بالساعات", type: "number", value: c.slaHours, min: 1 });
        }).join("") +
        "</form>", { title: "مُهل البلاغات" }
      ) +
      ui.Card(
        '<form id="gen-form">' +
        ui.Field({ id: "review-sla", label: "مهلة فحص طلبات المساعدة (ساعة)", type: "number", value: s.settings.requestReviewSlaHours, min: 1 }) +
        ui.Field({ id: "voucher-days", label: "صلاحية القسيمة (يوم)", type: "number", value: s.settings.voucherValidityDays, min: 1 }) +
        ui.Field({ id: "max-pending", label: "سقف العمليات المعلَّقة بلا اتصال", type: "number", value: s.settings.maxPendingOfflineOps, min: 10 }) +
        "</form>", { title: "إعدادات عامة" }
      ) + "</div>" +
      ui.Card(
        '<div class="grid g3">' +
        miniStat(s.governorates.length, "محافظة") + miniStat(s.sectors.length, "قطاع") + miniStat(s.distributionSites.length, "مركز توزيع") +
        "</div>",
        { title: "المرجعيات الثابتة" }
      );

    function miniStat(v, l) { return '<div style="text-align:center"><div class="mono" style="font-size:22px;font-weight:700">' + ui.fmtNum(v) + '</div><div class="hint">' + ui.esc(l) + "</div></div>"; }

    container.querySelector("#save-settings").addEventListener("click", function () {
      var slaHours = {};
      s.complaintCategories.forEach(function (c) {
        var input = container.querySelector("#sla-" + c.code);
        if (input) slaHours[c.code] = input.value;
      });
      actions.saveReferenceSettings({
        slaHours: slaHours,
        requestReviewSlaHours: container.querySelector("#review-sla").value,
        voucherValidityDays: container.querySelector("#voucher-days").value,
        maxPendingOfflineOps: container.querySelector("#max-pending").value
      });
    });
  }

  YEDSP.views = YEDSP.views || {};
  YEDSP.views.admin = { accounts: accounts, permissions: permissions, references: references };
})(window);
