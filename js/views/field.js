/* =====================================================================
   YEDSP DEMO — js/views/field.js — تطبيق الميدان (5 شاشات، يعمل بلا اتصال)
   ===================================================================== */
(function (global) {
  "use strict";
  var YEDSP = global.YEDSP, ui = YEDSP.ui, actions = YEDSP.actions, sel = YEDSP.selectors;

  function me() { return actions.currentUser(); }
  function myAssignments() { var s = actions.getState(); var u = me(); return s.fieldAssignments.filter(function (a) { return a.surveyorName === (u ? u.name : ""); }); }

  function statusBar() {
    var s = actions.getState();
    var online = !s.fieldOffline;
    return '<div class="statusbar ' + (online ? "online" : "offline") + '">' +
      '<span class="dot2"></span>' +
      '<span>' + (online ? "متصل — كل شيء متزامن" : "بلا اتصال — " + s.fieldPendingOps + " عملية بانتظار المزامنة") + '</span>' +
      '<span class="sp"></span>' +
      (s.fieldPendingOps > 0 ? '<a href="#/field/sync" style="font-size:12px;text-decoration:underline">فتح شاشة المزامنة</a>' : "") +
      "</div>";
  }

  function assignments(container) {
    var list = myAssignments();
    container.innerHTML =
      statusBar() +
      ui.PageHead("تكليفاتي", "التكليفات الميدانية الموكلة إليك حالياً",
        ui.Button({ label: "تسجيل مستفيد جديد", variant: "primary", icon: "id", id: "go-register" })) +
      (list.length ? '<div class="grid g2">' + list.map(function (a) {
        var gov = sel.governorate(a.governorateId), site = sel.site(a.siteId);
        var pct = sel.assignmentCompletionRate(a);
        return ui.Card(
          '<div class="row" style="justify-content:space-between;margin-bottom:8px"><span class="mono" style="font-size:11.5px;color:var(--ink-3)">' + a.id + '</span>' + ui.StatusBadge("generic", a.status) + '</div>' +
          '<b style="font-size:14px;display:block;margin-bottom:4px">' + ui.esc(gov ? gov.name : "") + ' — ' + ui.esc(site ? site.name : "") + '</b>' +
          '<div class="hint" style="margin-bottom:8px">الإنجاز: ' + a.completed + ' من ' + a.target + ' (' + pct + '%)</div>' +
          '<div style="height:8px;background:var(--line-2);border-radius:4px;overflow:hidden"><div style="height:100%;width:' + pct + '%;background:var(--green-700)"></div></div>' +
          '<div class="row" style="margin-top:10px">' + ui.Button({ label: "+1 عملية إنجاز", variant: "secondary", sm: true, id: "bump-" + a.id }) + "</div>",
          {}
        );
      }).join("") + "</div>" : ui.EmptyState({ icon: "briefcase", title: "لا توجد تكليفات مسندة إليك حالياً", hint: "راجع منسق الطوارئ في محافظتك." }));

    container.querySelector("#go-register").addEventListener("click", function () { YEDSP.router.navigate("#/field/register"); });
    list.forEach(function (a) {
      var b = container.querySelector("#bump-" + a.id);
      if (b) b.addEventListener("click", function () { actions.updateAssignmentProgress(a.id, a.completed + 1); YEDSP.router.refresh(); });
    });
  }

  function register(container) {
    var s = actions.getState();
    container.innerHTML =
      statusBar() +
      ui.PageHead("تسجيل مستفيد جديد", "يُسجَّل المستفيد بلا هاتف ولا حساب — سجلّ مستقل يمنحه معرّفاً موحّداً") +
      '<div class="grid g2"><form id="reg-form">' +
      ui.Field({ id: "name", label: "الاسم الكامل", required: true }) +
      '<div class="grid g2">' +
      ui.Select({ id: "gender", label: "الجنس", options: [{ value: "m", label: "ذكر" }, { value: "f", label: "أنثى" }] }) +
      ui.Select({ id: "gov", label: "المحافظة", required: true, options: s.governorates.map(function (g) { return { value: g.id, label: g.name }; }) }) +
      "</div>" +
      ui.Field({ id: "phone", label: "رقم الهاتف (إن وُجد)" }) +
      ui.Field({ id: "family", label: "عدد أفراد الأسرة", type: "number", min: 1, max: 20, value: 1, required: true }) +
      '<div class="grid g2">' +
      ui.Select({ id: "income", label: "مستوى الدخل", options: [{ value: "none", label: "بلا دخل" }, { value: "low", label: "منخفض" }, { value: "medium", label: "متوسط" }] }) +
      ui.Select({ id: "breadwinner", label: "حالة المعيل", options: [{ value: "present", label: "موجود" }, { value: "absent", label: "غائب" }, { value: "female", label: "معيلة أنثى" }, { value: "disabled", label: "معيل من ذوي الإعاقة" }] }) +
      "</div>" +
      ui.Checkbox({ id: "disability", label: "يوجد فرد من ذوي الإعاقة في الأسرة" }) +
      ui.Checkbox({ id: "pregnant", label: "يوجد حامل أو مرضع في الأسرة" }) +
      ui.Button({ label: "تسجيل المستفيد", variant: "primary", type: "submit", block: true, icon: "id" }) +
      "</form>" +
      "<div>" + ui.Card('<p style="font-size:12.5px;color:var(--ink-2)">هذه الشاشة تعمل بلا اتصال. إن كنت في وضع «بلا اتصال» فسيُحفظ التسجيل محلياً ويُضاف إلى طابور المزامنة حتى تعود التغطية.</p>', { title: "تنبيه العمل بلا اتصال" }) + "</div>" +
      "</div>";

    container.querySelector("#reg-form").addEventListener("submit", function (e) {
      e.preventDefault();
      var name = container.querySelector("#name").value.trim();
      var govId = container.querySelector("#gov").value;
      if (!name || !govId) { ui.toast("يرجى تعبئة الاسم والمحافظة", "warn"); return; }
      actions.registerCitizenField({
        name: name, gender: container.querySelector("#gender").value, governorateId: govId,
        phone: container.querySelector("#phone").value, familySize: Number(container.querySelector("#family").value || 1),
        incomeLevel: container.querySelector("#income").value, breadwinnerStatus: container.querySelector("#breadwinner").value,
        hasDisability: container.querySelector("#disability").checked, hasPregnantOrNursing: container.querySelector("#pregnant").checked
      });
      YEDSP.router.refresh();
    });
  }

  function verify(container) {
    container.innerHTML =
      statusBar() +
      ui.PageHead("التحقق من الهوية", "ابحث باسم المستفيد أو رقمه المقنَّع أو معرّفه") +
      '<form id="v-form" class="row" style="align-items:flex-end;gap:10px;max-width:520px">' +
      '<div style="flex:1">' + ui.Field({ id: "q", label: "بحث", placeholder: "مثال: CIT-0007 أو جزء من الاسم" }) + "</div>" +
      ui.Button({ label: "تحقّق", variant: "primary", type: "submit", icon: "search" }) +
      "</form>" +
      '<div id="v-results" style="margin-top:20px"></div>';

    container.querySelector("#v-form").addEventListener("submit", function (e) {
      e.preventDefault();
      var q = container.querySelector("#q").value;
      var results = actions.verifyIdentityLookup(q);
      var box = container.querySelector("#v-results");
      if (!results.length) { box.innerHTML = ui.EmptyState({ icon: "search", title: "لا توجد نتائج", hint: "تأكد من الاسم أو المعرّف وحاول مجدداً." }); return; }
      box.innerHTML = '<div class="grid g2">' + results.map(function (c) {
        var gov = sel.governorate(c.governorateId);
        return ui.Card(
          '<b style="font-size:14px">' + ui.esc(c.name) + '</b>' +
          '<div class="hint" style="margin:4px 0 10px">' + c.maskedNationalId + ' · ' + ui.esc(gov ? gov.name : "") + '</div>' +
          ui.Button({ label: "تأكيد التحقق من الهوية", variant: "secondary", sm: true, id: "cf-" + c.id }),
          {}
        );
      }).join("") + "</div>";
      results.forEach(function (c) {
        var b = box.querySelector("#cf-" + c.id);
        if (b) b.addEventListener("click", function () {
          actions.confirmIdentityCheck(c.id);
          var bar = container.querySelector(".statusbar");
          if (bar) bar.outerHTML = statusBar();
        });
      });
    });
  }

  function crisis(container) {
    var s = actions.getState();
    container.innerHTML =
      statusBar() +
      ui.PageHead("رفع بلاغ أزمة", "أبلغ فريق العمليات فوراً عن أي طارئ ميداني") +
      '<form id="cr-form" style="max-width:560px">' +
      ui.Field({ id: "title", label: "وصف الأزمة", required: true, placeholder: "مثال: نقص حاد في مياه الشرب الآمنة" }) +
      '<div class="grid g2">' +
      ui.Select({ id: "gov", label: "المحافظة", required: true, options: s.governorates.map(function (g) { return { value: g.id, label: g.name }; }) }) +
      ui.Select({ id: "severity", label: "درجة الخطورة", options: [{ value: "منخفضة", label: "منخفضة" }, { value: "متوسطة", label: "متوسطة" }, { value: "عالية", label: "عالية" }] }) +
      "</div>" +
      ui.Button({ label: "رفع البلاغ", variant: "primary", type: "submit", block: true, icon: "alert" }) +
      "</form>";

    container.querySelector("#cr-form").addEventListener("submit", function (e) {
      e.preventDefault();
      var title = container.querySelector("#title").value.trim();
      var govId = container.querySelector("#gov").value;
      if (!title || !govId) { ui.toast("يرجى تعبئة وصف الأزمة والمحافظة", "warn"); return; }
      actions.reportCrisis({ title: title, governorateId: govId, severity: container.querySelector("#severity").value });
      YEDSP.router.refresh();
    });
  }

  function sync(container) {
    var s = actions.getState();
    var syncing = !!container.__syncing;
    container.innerHTML =
      ui.PageHead("حالة المزامنة والطابور", "تحكّم تجريبي لمحاكاة العمل بلا اتصال ثم العودة للمزامنة",
        ui.Button({ label: syncing ? "جارٍ المزامنة…" : "مزامنة الآن", variant: "primary", icon: "sync", id: "sync-now", disabled: syncing || s.fieldPendingOps === 0 })) +
      statusBar() +
      '<div class="grid g2">' +
      ui.Card(
        '<div class="row" style="justify-content:space-between"><b>محاكاة الانقطاع</b>' +
        '<button class="toggle-sw ' + (s.fieldOffline ? "on" : "") + '" id="toggle-offline" aria-label="تبديل وضع الاتصال"></button></div>' +
        '<p class="hint" style="margin-top:8px">فعّل هذا المفتاح لمحاكاة انقطاع التغطية في الميدان. كل تسجيل أو تحقق سيُضاف إلى طابور محلي بدلاً من الإرسال الفوري.</p>',
        { title: "وضع الاتصال" }
      ) +
      ui.MetricCard({ value: s.fieldPendingOps, label: "عملية بانتظار المزامنة", trend: s.fieldPendingOps > 0 ? { dir: "down", text: "بحاجة إلى مزامنة" } : { dir: "flat", text: "لا شيء معلّق" } }) +
      "</div>";

    container.querySelector("#toggle-offline").addEventListener("click", function () { actions.toggleFieldOffline(); YEDSP.router.refresh(); });
    var syncBtn = container.querySelector("#sync-now");
    if (syncBtn && !syncBtn.disabled) {
      syncBtn.addEventListener("click", function () {
        container.__syncing = true;
        YEDSP.router.refresh();
        actions.syncNow(function () { container.__syncing = false; YEDSP.router.refresh(); });
      });
    }
  }

  YEDSP.views = YEDSP.views || {};
  YEDSP.views.field = { assignments: assignments, register: register, verify: verify, crisis: crisis, sync: sync };
})(window);
