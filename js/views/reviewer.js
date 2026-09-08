/* =====================================================================
   YEDSP DEMO — js/views/reviewer.js — مساحة الفحص (4 شاشات)
   ===================================================================== */
(function (global) {
  "use strict";
  var YEDSP = global.YEDSP, ui = YEDSP.ui, actions = YEDSP.actions, sel = YEDSP.selectors;

  function queue(container) {
    var list = sel.reviewQueue();
    var top = list[0];
    container.innerHTML =
      ui.PageHead("طابور الطلبات", "مرتّب حسب تجاوز المهلة ثم درجة الهشاشة تنازلياً",
        top ? ui.Button({ label: "فحص التالي في الطابور", variant: "primary", icon: "list", id: "next-in-queue" }) : "") +
      '<div class="grid g4 section-block">' +
      ui.MetricCard({ value: list.length, label: "طلبات بانتظار الفحص" }) +
      ui.MetricCard({ value: list.filter(sel.isSlaBreached).length, label: "تجاوزت المهلة", trend: { dir: "down", text: "بحاجة إلى إجراء فوري" } }) +
      ui.MetricCard({ value: sel.avgReviewTimeHours() + " س", label: "متوسط زمن الفحص" }) +
      ui.MetricCard({ value: sel.slaBreachRate() + "%", label: "نسبة تجاوز المهلة" }) +
      "</div>" +
      '<div id="queue-table"></div>';

    container.querySelector("#queue-table").innerHTML = ui.Table({
      columns: [
        { label: "رقم الطلب", render: function (r) { return '<span class="mono">' + r.id + "</span>"; } },
        { label: "المستفيد", render: function (r) { var c = sel.citizen(r.citizenId); return c ? ui.esc(c.name) : "—"; } },
        { label: "القطاع", render: function (r) { var s = sel.sector(r.sectorId); return ui.esc(s ? s.name : ""); } },
        { label: "الهشاشة", render: function (r) { return '<b class="mono">' + r.vulnerabilityScore + '</b>'; } },
        { label: "المهلة", render: function (r) { return ui.Badge(ui.fmtCountdown(r.slaDeadline), sel.isSlaBreached(r) ? "crit" : "info"); } },
        { label: "", render: function () { return '<span class="btn-quiet btn" style="height:auto">فحص</span>'; } }
      ],
      rows: list,
      rowAttrs: function (r) { return 'data-id="' + r.id + '" style="cursor:pointer"'; },
      empty: { icon: "check", title: "لا توجد طلبات بانتظار الفحص", hint: "الطابور فارغ حالياً — عمل ممتاز." }
    });
    container.querySelectorAll("#queue-table tr[data-id]").forEach(function (tr) {
      tr.addEventListener("click", function () { YEDSP.router.navigate("#/review/review-detail/" + tr.getAttribute("data-id")); });
    });
    var nq = container.querySelector("#next-in-queue");
    if (nq) nq.addEventListener("click", function () { YEDSP.router.navigate("#/review/review-detail/" + top.id); });
  }

  function reviewDetail(container, params) {
    var id = params[0];
    var req = actions.byId(actions.getState().aidRequests, id);
    if (!req) { container.innerHTML = ui.EmptyState({ icon: "alert", title: "لم يُعثر على الطلب" }); return; }
    var c = sel.citizen(req.citizenId), sc = sel.sector(req.sectorId), gov = sel.governorate(req.governorateId);
    var canApprove = actions.hasPermission("approve_requests");
    var decided = req.status !== "submitted" && req.status !== "reviewing";
    var showReject = !!container.__showReject;

    var primaryGold = (!decided && canApprove)
      ? ui.Button({ label: "اعتماد الطلب وإصدار القسيمة", variant: "primary", icon: "check", id: "approve-btn" })
      : ui.Button({ label: "العودة إلى طابور الفحص", variant: "primary", icon: "list", id: "back-to-queue" });

    container.innerHTML =
      ui.PageHead("فحص الطلب — " + req.id, ui.esc(sc ? sc.name : ""), primaryGold) +
      '<div class="grid g2">' +
      ui.Card(
        kv("المستفيد", c ? c.name : "—") + kv("الرقم الوطني", c ? '<span class="mono">' + c.maskedNationalId + "</span>" : "—") +
        kv("المحافظة", gov ? gov.name : "—") + kv("حجم الأسرة", c ? ui.fmtNum(c.familySize) : "—") +
        kv("حالة المعيل", c ? breadwinnerLabel(c.breadwinnerStatus) : "—") +
        kv("ملاحظات المستفيد", req.notes || "لا توجد"),
        { title: "بيانات المستفيد" }
      ) +
      ui.Card(
        (decided ? kv("نتيجة الفحص", ui.StatusBadge("request", req.status)) : "") +
        kv("درجة الهشاشة", '<b class="mono" style="font-size:18px">' + req.vulnerabilityScore + '</b> / 100') +
        kv("تاريخ التقديم", ui.fmtDateTime(req.submittedAt)) +
        (decided ? kv("تاريخ القرار", ui.fmtDateTime(req.decidedAt)) : kv("مهلة الفحص", ui.fmtCountdown(req.slaDeadline))) +
        (req.rejectionReason ? kv("سبب الرفض", req.rejectionReason) : ""),
        { title: "تقييم الطلب" }
      ) +
      "</div>" +
      (!decided && canApprove ? '<div id="reject-zone" style="margin-top:16px">' +
        (showReject ?
          ui.Card(
            ui.Field({ id: "reject-reason", label: "سبب الرفض (إلزامي)", textarea: true, rows: 3, required: true, placeholder: "سيظهر هذا السبب للمواطن في شاشة تتبّع طلبه" }) +
            '<div class="row">' + ui.Button({ label: "تأكيد الرفض", variant: "crit", id: "confirm-reject" }) + ui.Button({ label: "تراجع", variant: "quiet", id: "cancel-reject" }) + "</div>",
            { title: "رفض الطلب" }
          ) :
          ui.Button({ label: "رفض الطلب", variant: "secondary", id: "start-reject" })
        ) + "</div>" : "");

    function kv(l, v) { return '<div class="row" style="justify-content:space-between;border-bottom:1px solid var(--line-2);padding:8px 0"><span class="label-mini">' + ui.esc(l) + '</span><b style="font-size:13px">' + v + "</b></div>"; }
    function breadwinnerLabel(v) { return { present: "موجود", absent: "غائب", female: "معيلة أنثى", disabled: "معيل من ذوي الإعاقة" }[v] || v; }

    var ap = container.querySelector("#approve-btn");
    if (ap) ap.addEventListener("click", function () {
      ui.showDialog({
        title: "اعتماد الطلب", body: "سيتم اعتماد الطلب " + req.id + " وإصدار قسيمة مساعدة له فوراً. هل تريد المتابعة؟",
        confirmLabel: "اعتماد وإصدار القسيمة",
        onConfirm: function () { actions.approveRequest(req.id); YEDSP.router.navigate("#/review/queue"); }
      });
    });
    var btq = container.querySelector("#back-to-queue");
    if (btq) btq.addEventListener("click", function () { YEDSP.router.navigate("#/review/queue"); });
    var sr = container.querySelector("#start-reject");
    if (sr) sr.addEventListener("click", function () { container.__showReject = true; YEDSP.router.refresh(); });
    var cr = container.querySelector("#cancel-reject");
    if (cr) cr.addEventListener("click", function () { container.__showReject = false; YEDSP.router.refresh(); });
    var cfr = container.querySelector("#confirm-reject");
    if (cfr) cfr.addEventListener("click", function () {
      var reason = container.querySelector("#reject-reason").value.trim();
      if (!reason) { ui.toast("سبب الرفض إلزامي", "warn"); return; }
      actions.rejectRequest(req.id, reason);
      container.__showReject = false;
      YEDSP.router.navigate("#/review/queue");
    });
  }

  function decisions(container) {
    var me = actions.currentUser();
    var mine = actions.getState().aidRequests.filter(function (r) { return r.decidedByUserId === (me ? me.id : null); })
      .sort(function (a, b) { return b.decidedAt - a.decidedAt; });
    container.innerHTML =
      ui.PageHead("سجل قراراتي", "كل طلب اتخذت فيه قراراً باعتماد أو رفض",
        ui.Button({ label: "تصدير السجل", variant: "primary", icon: "download", id: "export-log" })) +
      ui.Table({
        columns: [
          { label: "رقم الطلب", render: function (r) { return '<span class="mono">' + r.id + "</span>"; } },
          { label: "المستفيد", render: function (r) { var c = sel.citizen(r.citizenId); return c ? ui.esc(c.name) : "—"; } },
          { label: "القرار", render: function (r) { return ui.StatusBadge("request", r.status); } },
          { label: "تاريخ القرار", render: function (r) { return ui.fmtDateTime(r.decidedAt); } }
        ], rows: mine,
        empty: { icon: "check", title: "لم تتخذ أي قرار بعد", hint: "قراراتك على طلبات الفحص ستظهر هنا." }
      });
    container.querySelector("#export-log").addEventListener("click", function () { actions.exportPlaceholder("سجل القرارات"); });
  }

  function search(container) {
    var s = actions.getState();
    var q = container.__q || "", govFilter = container.__gov || "";
    container.innerHTML =
      ui.PageHead("بحث في المستفيدين", "ابحث عن مستفيد لاستعراض طلباته وحالته") +
      '<form id="s-form" class="filters">' +
      '<div style="flex:2;min-width:220px">' + ui.Field({ id: "q", label: "الاسم أو المعرّف أو الرقم المقنَّع", value: q }) + "</div>" +
      '<div style="flex:1">' + ui.Select({ id: "gov", label: "المحافظة", value: govFilter, placeholder: "كل المحافظات", options: s.governorates.map(function (g) { return { value: g.id, label: g.name }; }) }) + "</div>" +
      ui.Button({ label: "بحث", variant: "primary", type: "submit", icon: "search" }) +
      "</form>" +
      '<div id="s-results"></div>';

    function draw() {
      var results = s.citizens.filter(function (c) {
        var matchQ = !q || c.name.indexOf(q) !== -1 || c.id.indexOf(q) !== -1 || c.maskedNationalId.indexOf(q) !== -1;
        var matchG = !govFilter || c.governorateId === govFilter;
        return matchQ && matchG;
      });
      container.querySelector("#s-results").innerHTML = ui.Table({
        columns: [
          { label: "الاسم", render: function (c) { return ui.esc(c.name); } },
          { label: "المعرّف", render: function (c) { return '<span class="mono">' + c.id + "</span>"; } },
          { label: "الرقم الوطني", render: function (c) { return '<span class="mono">' + c.maskedNationalId + "</span>"; } },
          { label: "المحافظة", render: function (c) { var g = sel.governorate(c.governorateId); return ui.esc(g ? g.name : ""); } },
          { label: "عدد الطلبات", render: function (c) { return ui.fmtNum(s.aidRequests.filter(function (r) { return r.citizenId === c.id; }).length); } }
        ],
        rows: results.slice(0, 25),
        empty: { icon: "search", title: "لا توجد نتائج مطابقة", hint: "جرّب مصطلح بحث أو محافظة أخرى." }
      });
    }
    draw();
    container.querySelector("#s-form").addEventListener("submit", function (e) {
      e.preventDefault();
      q = container.querySelector("#q").value.trim(); govFilter = container.querySelector("#gov").value;
      container.__q = q; container.__gov = govFilter;
      draw();
    });
  }

  YEDSP.views = YEDSP.views || {};
  YEDSP.views.review = { queue: queue, reviewDetail: reviewDetail, decisions: decisions, search: search };
})(window);
