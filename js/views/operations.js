/* =====================================================================
   YEDSP DEMO — js/views/operations.js — مساحة العمليات (6 شاشات)
   ===================================================================== */
(function (global) {
  "use strict";
  var YEDSP = global.YEDSP, ui = YEDSP.ui, actions = YEDSP.actions, sel = YEDSP.selectors;

  function map(container) {
    var s = actions.getState();
    container.innerHTML =
      ui.PageHead("الخارطة الوطنية", "التغطية محسوبة من القسائم المصروفة فعلياً في كل محافظة",
        ui.Button({ label: "عرض التقارير التشغيلية", variant: "primary", icon: "printer", id: "go-reports" })) +
      '<div class="grid g4 section-block">' +
      ui.MetricCard({ value: sel.nationalCoverage() + "%", label: "التغطية الوطنية" }) +
      ui.MetricCard({ value: ui.fmtNum(sel.verifiedBeneficiariesCount()), label: "مستفيدون تحقّقوا فعلياً" }) +
      ui.MetricCard({ value: sel.openCrisesCount(), label: "أزمات مفتوحة" }) +
      ui.MetricCard({ value: sel.slaBreachRate() + "%", label: "تجاوز مهلة الطلبات" }) +
      "</div>" +
      ui.Card('<div id="map-host"></div>' + ui.mapLegend(), { title: "التغطية حسب المحافظة" });

    // عدد الأزمات المفتوحة لكل محافظة — يظهر في تلميح المحافظة عند المرور عليها
    var openCrises = {};
    s.crises.forEach(function (c) {
      if (c.status !== "مغلقة") openCrises[c.governorateId] = (openCrises[c.governorateId] || 0) + 1;
    });

    container.querySelector("#map-host").innerHTML = ui.GovMap(
      s.governorates, function (g) { return sel.coveragePercent(g.id); }
    );
    ui.bindGovMap(container, function (govId) { YEDSP.router.navigate("#/ops/governorate/" + govId); });
    ui.bindGovMapTooltip(container, function (govId) {
      var g = sel.governorate(govId);
      if (!g) return "";
      var reqs = s.aidRequests.filter(function (r) { return r.governorateId === govId; });
      var delivered = s.vouchers.filter(function (v) { return v.governorateId === govId && v.status === "delivered"; }).length;
      var crises = openCrises[govId] || 0;
      return "<b>" + ui.esc(g.name) + "</b>" +
        '<div class="tr"><span>نسبة التغطية</span><span>' + sel.coveragePercent(govId) + "%</span></div>" +
        '<div class="tr"><span>الطلبات</span><span>' + ui.fmtNum(reqs.length) + "</span></div>" +
        '<div class="tr"><span>قسائم مصروفة</span><span>' + ui.fmtNum(delivered) + "</span></div>" +
        '<div class="tr' + (crises ? " tcrit" : "") + '"><span>أزمات مفتوحة</span><span>' + ui.fmtNum(crises) + "</span></div>" +
        '<div class="thint">انقر لفتح تفاصيل المحافظة</div>';
    });
    container.querySelector("#go-reports").addEventListener("click", function () { YEDSP.router.navigate("#/ops/reports"); });
  }

  function governorate(container, params) {
    var id = params[0];
    var s = actions.getState();
    var g = sel.governorate(id);
    if (!g) { container.innerHTML = ui.EmptyState({ icon: "map", title: "محافظة غير معروفة" }); return; }
    var sites = s.distributionSites.filter(function (x) { return x.governorateId === id; });
    var reqs = s.aidRequests.filter(function (r) { return r.governorateId === id; });
    var crises = s.crises.filter(function (c) { return c.governorateId === id; });
    var assignments = s.fieldAssignments.filter(function (a) { return a.governorateId === id; });
    var pct = sel.coveragePercent(id);

    container.innerHTML =
      ui.PageHead("محافظة " + g.name, "التغطية الحالية: " + pct + "%",
        ui.Button({ label: "عرض التكليفات الميدانية", variant: "primary", icon: "briefcase", id: "go-assign" })) +
      '<div class="grid g4 section-block">' +
      ui.MetricCard({ value: pct + "%", label: "نسبة التغطية" }) +
      ui.MetricCard({ value: ui.fmtNum(reqs.length), label: "إجمالي الطلبات" }) +
      ui.MetricCard({ value: crises.filter(function (c) { return c.status !== "مغلقة"; }).length, label: "أزمات مفتوحة" }) +
      ui.MetricCard({ value: sites.length, label: "مراكز توزيع" }) +
      "</div>" +
      '<div class="grid g2">' +
      ui.Card(ui.Table({
        columns: [{ label: "المركز", key: "name" }],
        rows: sites, empty: { title: "لا توجد مراكز مسجَّلة", hint: "" }
      }), { title: "مراكز التوزيع" }) +
      ui.Card(ui.Table({
        columns: [
          { label: "الأزمة", render: function (c) { return ui.esc(c.title); } },
          { label: "الخطورة", render: function (c) { return ui.StatusBadge("severity", c.severity); } },
          { label: "الحالة", render: function (c) { return ui.StatusBadge("generic", c.status); } }
        ], rows: crises, empty: { title: "لا توجد أزمات مسجَّلة", hint: "المحافظة مستقرة حالياً." }
      }), { title: "الأزمات في المحافظة" }) +
      "</div>" +
      ui.Card(ui.BarChart(s.sectors.map(function (sc) { return { label: sc.name, value: reqs.filter(function (r) { return r.sectorId === sc.id; }).length }; })), { title: "توزيع الطلبات على القطاعات" }) +
      ui.Card(ui.Table({
        columns: [
          { label: "المسّاح", key: "surveyorName" },
          { label: "الإنجاز", render: function (a) { return a.completed + " / " + a.target; } },
          { label: "الحالة", render: function (a) { return ui.StatusBadge("generic", a.status); } }
        ], rows: assignments, empty: { title: "لا توجد تكليفات في هذه المحافظة", hint: "" }
      }), { title: "التكليفات الميدانية" });

    container.querySelector("#go-assign").addEventListener("click", function () { YEDSP.router.navigate("#/ops/assignments"); });
  }

  function assignments(container) {
    var s = actions.getState();
    var showForm = !!container.__showForm;
    container.innerHTML =
      ui.PageHead("التكليفات الميدانية", "كل تكليفات المسّاحين على مستوى الجمهورية",
        ui.Button({ label: showForm ? "إغلاق النموذج" : "تكليف ميداني جديد", variant: "primary", icon: "plus", id: "toggle-form" })) +
      (showForm ? ui.Card(
        '<form id="a-form" class="grid g3" style="align-items:end">' +
        ui.Field({ id: "name", label: "اسم المسّاح", required: true }) +
        ui.Select({ id: "gov", label: "المحافظة", required: true, options: s.governorates.map(function (g) { return { value: g.id, label: g.name }; }) }) +
        ui.Field({ id: "target", label: "المستهدف", type: "number", value: 20, min: 1 }) +
        '<div style="grid-column:1/-1">' + ui.Button({ label: "إنشاء التكليف", variant: "primary", type: "submit" }) + "</div>" +
        "</form>", { title: "تكليف جديد" }
      ) : "") +
      '<div id="a-table" style="margin-top:16px"></div>';

    function draw() {
      container.querySelector("#a-table").innerHTML = ui.Table({
        columns: [
          { label: "المسّاح", key: "surveyorName" },
          { label: "المحافظة", render: function (a) { var g = sel.governorate(a.governorateId); return ui.esc(g ? g.name : ""); } },
          { label: "الإنجاز", render: function (a) { return a.completed + " / " + a.target + " (" + sel.assignmentCompletionRate(a) + "%)"; } },
          { label: "الحالة", render: function (a) { return ui.StatusBadge("generic", a.status); } }
        ],
        rows: s.fieldAssignments.slice().sort(function (x, y) { return y.startedAt - x.startedAt; }),
        empty: { title: "لا توجد تكليفات", hint: "أنشئ أول تكليف ميداني." }
      });
    }
    draw();
    container.querySelector("#toggle-form").addEventListener("click", function () { container.__showForm = !showForm; YEDSP.router.refresh(); });
    var form = container.querySelector("#a-form");
    if (form) form.addEventListener("submit", function (e) {
      e.preventDefault();
      var name = container.querySelector("#name").value.trim(), gov = container.querySelector("#gov").value;
      if (!name || !gov) { ui.toast("يرجى تعبئة اسم المسّاح والمحافظة", "warn"); return; }
      actions.createAssignment({ surveyorName: name, governorateId: gov, target: container.querySelector("#target").value });
      container.__showForm = false;
      YEDSP.router.refresh();
    });
  }

  function crises(container) {
    var s = actions.getState();
    var showForm = !!container.__showForm;
    container.innerHTML =
      ui.PageHead("سجل الأزمات", "كل الأزمات الميدانية المفتوحة والمغلقة",
        ui.Button({ label: showForm ? "إغلاق النموذج" : "فتح أزمة جديدة", variant: "primary", icon: "alert", id: "toggle-form" })) +
      (showForm ? ui.Card(
        '<form id="c-form" class="grid g3" style="align-items:end">' +
        ui.Field({ id: "title", label: "وصف الأزمة", required: true }) +
        ui.Select({ id: "gov", label: "المحافظة", required: true, options: s.governorates.map(function (g) { return { value: g.id, label: g.name }; }) }) +
        ui.Select({ id: "severity", label: "الخطورة", options: ["منخفضة", "متوسطة", "عالية"].map(function (v) { return { value: v, label: v }; }) }) +
        '<div style="grid-column:1/-1">' + ui.Button({ label: "فتح الأزمة", variant: "primary", type: "submit" }) + "</div>" +
        "</form>", { title: "أزمة جديدة" }
      ) : "") +
      '<div id="c-table" style="margin-top:16px"></div>';

    function draw() {
      var list = s.crises.slice().sort(function (a, b) { return b.openedAt - a.openedAt; });
      container.querySelector("#c-table").innerHTML = ui.Table({
        columns: [
          { label: "الأزمة", render: function (c) { return ui.esc(c.title); } },
          { label: "المحافظة", render: function (c) { var g = sel.governorate(c.governorateId); return ui.esc(g ? g.name : ""); } },
          { label: "الخطورة", render: function (c) { return ui.StatusBadge("severity", c.severity); } },
          { label: "الحالة", render: function (c) { return ui.StatusBadge("generic", c.status); } },
          { label: "تاريخ الفتح", render: function (c) { return ui.fmtDate(c.openedAt); } },
          { label: "", render: function (c) { return c.status !== "مغلقة" ? '<button class="btn btn-secondary btn-sm" data-close="' + c.id + '">إغلاق</button>' : ""; } }
        ], rows: list,
        empty: { title: "لا توجد أزمات مسجَّلة", hint: "الوضع مستقر في كل المحافظات حالياً." }
      });
      container.querySelectorAll("[data-close]").forEach(function (btn) {
        btn.addEventListener("click", function () { actions.closeCrisis(btn.getAttribute("data-close")); YEDSP.router.refresh(); });
      });
    }
    draw();
    container.querySelector("#toggle-form").addEventListener("click", function () { container.__showForm = !showForm; YEDSP.router.refresh(); });
    var form = container.querySelector("#c-form");
    if (form) form.addEventListener("submit", function (e) {
      e.preventDefault();
      var title = container.querySelector("#title").value.trim(), gov = container.querySelector("#gov").value;
      if (!title || !gov) { ui.toast("يرجى تعبئة وصف الأزمة والمحافظة", "warn"); return; }
      actions.reportCrisis({ title: title, governorateId: gov, severity: container.querySelector("#severity").value });
      container.__showForm = false;
      YEDSP.router.refresh();
    });
  }

  function performance(container) {
    container.innerHTML =
      ui.PageHead("مؤشرات الأداء", "محسوبة مباشرة من بيانات التشغيل الحالية",
        ui.Button({ label: "تصدير المؤشرات", variant: "primary", icon: "download", id: "export-kpi" })) +
      '<div class="grid g4 section-block">' +
      ui.MetricCard({ value: sel.avgReviewTimeHours() + " س", label: "متوسط زمن الفحص" }) +
      ui.MetricCard({ value: sel.slaBreachRate() + "%", label: "تجاوز مهلة الطلبات" }) +
      ui.MetricCard({ value: sel.overallAssignmentCompletion() + "%", label: "معدل إنجاز المسّاحين" }) +
      ui.MetricCard({ value: sel.complaintBreachRate() + "%", label: "بلاغات متجاوزة لمهلتها" }) +
      "</div>" +
      '<div class="grid g2">' +
      ui.Card(ui.BarChart(sel.requestsBySector().map(function (x) { return { label: x.sector.name, value: x.count }; })), { title: "توزيع الطلبات على القطاعات" }) +
      ui.Card(ui.LineChart(sel.requestsTrend7d()), { title: "الطلبات المقدَّمة — آخر سبعة أيام" }) +
      "</div>" +
      ui.Card(ui.DonutChart([
        { label: "قسائم مصروفة", value: sel.vouchersByStatus("delivered").length, color: "#2E7D5B" },
        { label: "قسائم صادرة بانتظار الصرف", value: sel.vouchersByStatus("issued").length, color: "#B8862B" },
        { label: "قسائم منتهية الصلاحية", value: sel.vouchersByStatus("expired").length, color: "#B03A2E" }
      ], { centerLabel: "إجمالي القسائم" }), { title: "حالة القسائم" });

    container.querySelector("#export-kpi").addEventListener("click", function () { actions.exportPlaceholder("تقرير المؤشرات"); });
  }

  function reports(container) {
    var reportDefs = [
      { title: "تقرير التغطية الشهري", desc: "نسبة التغطية والمستفيدون الفعليون في كل محافظة" },
      { title: "تقرير الأداء الميداني", desc: "إنجاز المسّاحين ومتوسط زمن الفحص" },
      { title: "تقرير الأزمات والاستجابة", desc: "الأزمات المفتوحة والمغلقة حسب الخطورة" },
      { title: "تقرير الشكاوى والمساءلة", desc: "البلاغات حسب الفئة ونسبة الالتزام بالمهلة" }
    ];
    container.innerHTML =
      ui.PageHead("التقارير التشغيلية", "تقارير جاهزة للتصدير بترميز يدعم العربية",
        ui.Button({ label: "توليد تقرير مخصّص", variant: "primary", icon: "printer", id: "gen-report" })) +
      '<div class="grid g2">' + reportDefs.map(function (r) {
        return ui.Card('<p style="font-size:12.5px;color:var(--ink-2);margin-bottom:14px">' + ui.esc(r.desc) + '</p>' +
          ui.Button({ label: "تنزيل PDF", variant: "secondary", sm: true, icon: "download", id: "dl-" + r.title.length }),
          { title: r.title });
      }).join("") + "</div>";

    container.querySelectorAll("[id^='dl-']").forEach(function (b) { b.addEventListener("click", function () { actions.exportPlaceholder("التقرير"); }); });
    container.querySelector("#gen-report").addEventListener("click", function () {
      ui.showDialog({
        title: "توليد تقرير مخصّص", body: "سيتم تجميع المؤشرات الحالية في تقرير واحد قابل للتنزيل.",
        confirmLabel: "توليد التقرير",
        onConfirm: function () { actions.exportPlaceholder("التقرير المخصّص"); }
      });
    });
  }

  YEDSP.views = YEDSP.views || {};
  YEDSP.views.ops = { map: map, governorate: governorate, assignments: assignments, crises: crises, performance: performance, reports: reports };
})(window);
