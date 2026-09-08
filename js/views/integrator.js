/* =====================================================================
   YEDSP DEMO — js/views/integrator.js — حساب النظام (شاشة واحدة)
   ملاحظة: خريطة الشاشات في مواصفة العرض لم تُفرد شاشات لهذا الدور
   لأنه حساب آلي لا واجهة بشرية له في المنتج الحقيقي. أضفنا شاشة
   خفيفة واحدة هنا فقط حتى يحصل كل دور على صفحة رئيسية مكتملة، كما
   يشترط تعريف "تم" في هذا العرض التجريبي.
   ===================================================================== */
(function (global) {
  "use strict";
  var YEDSP = global.YEDSP, ui = YEDSP.ui, actions = YEDSP.actions, sel = YEDSP.selectors;

  var ENDPOINTS = [
    { method: "GET", path: "/api/v1/refs/{resource}", desc: "المحافظات والمراكز والقطاعات" },
    { method: "GET", path: "/api/v1/analytics/coverage", desc: "نسبة التغطية لكل محافظة" },
    { method: "GET", path: "/api/v1/analytics/performance", desc: "مؤشرات الأداء التشغيلية" },
    { method: "GET", path: "/api/v1/audit/trail", desc: "قراءة سلسلة التدقيق (بلا كتابة)" }
  ];

  function fakeKey() { return "yedsp_live_" + window.YEDSP_SEED.helpers.fakeHash(String(Date.now())).slice(0, 28); }

  function console_(container) {
    var revealed = !!container.__revealed;
    var key = container.__key || (container.__key = fakeKey());
    var s = actions.getState();
    var sample = s.governorates.slice(0, 4).map(function (g) { return { governorate: g.name, coveragePercent: sel.coveragePercent(g.id) }; });

    container.innerHTML =
      ui.PageHead("لوحة المطوّر — حساب تكامل آلي", "وصول للقراءة فقط، مقيّد المعدّل، لا واجهة بشرية له في المنتج الحقيقي",
        ui.Button({ label: "توليد مفتاح جديد", variant: "primary", icon: "lock", id: "regen-key" })) +
      '<div class="grid g2">' +
      ui.Card(
        '<div class="row" style="justify-content:space-between;align-items:center">' +
        '<span class="mono" style="font-size:13px">' + (revealed ? key : key.slice(0, 11) + "••••••••••••••••••") + '</span>' +
        ui.Button({ label: revealed ? "إخفاء" : "إظهار", variant: "quiet", sm: true, id: "toggle-reveal" }) +
        "</div>" +
        '<p class="hint" style="margin-top:10px">60 طلباً في الدقيقة كحد أقصى. القراءة فقط — لا مسارات كتابة متاحة لهذا الحساب.</p>',
        { title: "مفتاح API" }
      ) +
      ui.Card(
        '<pre style="white-space:pre-wrap;font-family:\'Courier New\',monospace;font-size:11.5px;direction:ltr;text-align:left;background:var(--line-2);border-radius:6px;padding:12px;margin:0">' +
        ui.esc(JSON.stringify({ ok: true, data: sample, meta: { generatedAt: new Date().toISOString() } }, null, 2)) + "</pre>",
        { title: "نموذج استجابة — GET /analytics/coverage" }
      ) +
      "</div>" +
      ui.Card(ui.Table({
        columns: [
          { label: "Method", render: function (e) { return '<span class="mono">' + e.method + "</span>"; } },
          { label: "المسار", render: function (e) { return '<span class="mono">' + e.path + "</span>"; } },
          { label: "الوصف", key: "desc" }
        ], rows: ENDPOINTS, empty: { title: "لا مسارات متاحة", hint: "" }
      }), { title: "المسارات المتاحة لهذا الحساب" });

    container.querySelector("#regen-key").addEventListener("click", function () {
      container.__key = fakeKey(); container.__revealed = true; YEDSP.router.refresh();
      ui.toast("تم توليد مفتاح API جديد — المفتاح القديم أُلغي فوراً", "ok");
    });
    container.querySelector("#toggle-reveal").addEventListener("click", function () { container.__revealed = !revealed; YEDSP.router.refresh(); });
  }

  YEDSP.views = YEDSP.views || {};
  YEDSP.views.integrator = { console: console_ };
})(window);
