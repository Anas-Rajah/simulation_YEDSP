/* =====================================================================
   YEDSP DEMO — js/views/protection.js — مساحة الحماية (3 شاشات)
   ===================================================================== */
(function (global) {
  "use strict";
  var YEDSP = global.YEDSP, ui = YEDSP.ui, actions = YEDSP.actions, sel = YEDSP.selectors;

  var COLUMNS = ["جديد", "قيد الفرز", "قيد التحقيق", "مغلق"];

  function triage(container) {
    var s = actions.getState();
    container.innerHTML =
      ui.PageHead("لوحة فرز البلاغات", "بطاقات مرتّبة حسب حالة المعالجة",
        ui.Button({ label: "تصدير تقرير البلاغات", variant: "primary", icon: "download", id: "export-cmp" })) +
      '<div class="kanban">' + COLUMNS.map(function (col) {
        var items = s.complaints.filter(function (c) { return c.status === col; });
        return '<div class="kanban-col"><h4>' + ui.esc(col) + '<span>' + items.length + '</span></h4>' +
          items.map(function (c) {
            var breached = sel.complaintSlaBreached(c);
            return '<div class="kanban-card" data-id="' + c.id + '">' +
              '<span class="kid">' + c.trackingCode + '</span>' +
              '<div class="row" style="justify-content:space-between;margin-bottom:6px">' + ui.Badge(c.category, "gold") + (breached ? ui.Badge("متجاوز المهلة", "crit") : "") + "</div>" +
              '<div style="font-size:12.5px">' + ui.esc(c.description.slice(0, 60)) + (c.description.length > 60 ? "…" : "") + "</div>" +
              (c.anonymous ? '<div class="hint" style="margin-top:6px">بلاغ مجهول</div>' : "") +
              (col === "جديد" ? '<button class="btn btn-secondary btn-sm" style="margin-top:8px" data-quick="' + c.id + '">بدء الفرز</button>' : "") +
              "</div>";
          }).join("") + "</div>";
      }).join("") + "</div>";

    container.querySelectorAll(".kanban-card").forEach(function (card) {
      card.addEventListener("click", function (e) {
        if (e.target.closest("[data-quick]")) return;
        YEDSP.router.navigate("#/protection/complaint-detail/" + card.getAttribute("data-id"));
      });
    });
    container.querySelectorAll("[data-quick]").forEach(function (btn) {
      btn.addEventListener("click", function (e) {
        e.stopPropagation();
        actions.updateComplaintStatus(btn.getAttribute("data-quick"), "قيد الفرز");
        YEDSP.router.refresh();
      });
    });
    container.querySelector("#export-cmp").addEventListener("click", function () { actions.exportPlaceholder("تقرير البلاغات"); });
  }

  function complaintDetail(container, params) {
    var id = params[0];
    var c = actions.byId(actions.getState().complaints, id);
    if (!c) { container.innerHTML = ui.EmptyState({ icon: "alert", title: "لم يُعثر على البلاغ" }); return; }
    var gov = sel.governorate(c.governorateId);
    var crisis = c.linkedCrisisId ? actions.byId(actions.getState().crises, c.linkedCrisisId) : null;
    var breached = sel.complaintSlaBreached(c);

    var primary = null, note = "";
    if (c.status !== "مغلق") {
      if (c.category === "S" && !c.linkedCrisisId) primary = { label: "تصعيد إلى أزمة ميدانية", act: "escalate", tone: "primary" };
      else if (c.status === "جديد") primary = { label: "بدء الفرز", act: "triage" };
      else if (c.status === "قيد الفرز") primary = { label: "بدء التحقيق", act: "investigate" };
      else if (c.status === "قيد التحقيق") {
        var blocked = crisis && crisis.status !== "مغلقة";
        if (blocked) note = "لا يمكن إغلاق هذا البلاغ قبل إغلاق الأزمة المرتبطة " + crisis.id + " (الحالة الحالية: " + crisis.status + ")";
        else primary = { label: "إغلاق البلاغ", act: "close" };
      }
    }

    container.innerHTML =
      ui.PageHead("تفاصيل البلاغ — " + c.trackingCode, c.categoryName,
        primary
          ? ui.Button({ label: primary.label, variant: "primary", icon: primary.act === "escalate" ? "alert" : "check", id: "primary-act" })
          : ui.Button({ label: "العودة إلى لوحة الفرز", variant: "primary", icon: "kanban", id: "back-to-triage" })) +
      '<div class="grid g2">' +
      ui.Card(
        kv("الفئة", c.categoryName + " (" + c.category + ")") +
        kv("الحالة", ui.StatusBadge("generic", c.status)) +
        kv("مهلة الاستجابة", (breached ? ui.Badge("متجاوزة", "crit") : ui.Badge("ضمن المهلة", "ok")) + " — " + c.slaHours + " ساعة") +
        kv("المحافظة", gov ? gov.name : "—") + kv("القناة", c.channel) + kv("تاريخ الاستلام", ui.fmtDateTime(c.createdAt)) +
        kv("مقدّم البلاغ", c.anonymous ? "بلاغ مجهول الهوية" : (c.reporterName || "—") + (c.reporterPhone ? " · " + c.reporterPhone : "")),
        { title: "بيانات البلاغ" }
      ) +
      ui.Card(
        '<p style="font-size:13px">' + ui.esc(c.description) + "</p>" +
        (crisis ? '<div class="note" style="margin-top:14px;border-inline-start:3px solid var(--gold-600);background:var(--gold-100);border-radius:0 8px 8px 0;padding:12px"><b style="display:block;font-size:12.5px;margin-bottom:4px">مرتبط بأزمة ميدانية</b><span style="font-size:12.5px">' + crisis.id + " — " + ui.esc(crisis.title) + " (" + crisis.status + ")</span></div>" : "") +
        (note ? '<div class="note" style="margin-top:14px;border-inline-start:3px solid var(--warn);background:var(--warn-bg);border-radius:0 8px 8px 0;padding:12px;font-size:12.5px">' + ui.esc(note) + "</div>" : ""),
        { title: "الوصف" }
      ) + "</div>";

    function kv(l, v) { return '<div class="row" style="justify-content:space-between;border-bottom:1px solid var(--line-2);padding:8px 0"><span class="label-mini">' + ui.esc(l) + '</span><b style="font-size:13px">' + v + "</b></div>"; }

    var btt = container.querySelector("#back-to-triage");
    if (btt) btt.addEventListener("click", function () { YEDSP.router.navigate("#/protection/triage"); });
    var pb = container.querySelector("#primary-act");
    if (pb) pb.addEventListener("click", function () {
      if (primary.act === "escalate") {
        ui.showDialog({
          title: "تصعيد البلاغ", body: "سيتم فتح أزمة ميدانية جديدة مرتبطة بهذا البلاغ وإخطار منسق الطوارئ في المحافظة.",
          confirmLabel: "تصعيد إلى أزمة", tone: "crit",
          onConfirm: function () { actions.escalateComplaint(c.id); YEDSP.router.refresh(); }
        });
      } else if (primary.act === "triage") { actions.updateComplaintStatus(c.id, "قيد الفرز"); YEDSP.router.refresh(); }
      else if (primary.act === "investigate") { actions.updateComplaintStatus(c.id, "قيد التحقيق"); YEDSP.router.refresh(); }
      else if (primary.act === "close") {
        ui.showDialog({
          title: "إغلاق البلاغ", body: "سيُعتبر هذا البلاغ مغلقاً نهائياً. تأكد من اكتمال التحقيق قبل المتابعة.",
          confirmLabel: "إغلاق البلاغ",
          onConfirm: function () { actions.closeComplaint(c.id); YEDSP.router.refresh(); }
        });
      }
    });
  }

  function audit(container) {
    var s = actions.getState();
    var verifying = !!container.__verifying;
    var verified = container.__verified;
    var entries = s.auditTrail.slice().reverse();

    container.innerHTML =
      ui.PageHead("سجل التدقيق التشفيري", "سلسلة أحداث مترابطة — كل حلقة تحمل بصمة الحلقة السابقة",
        ui.Button({ label: verifying ? "جارٍ التحقق…" : "التحقق من سلامة السلسلة", variant: "primary", icon: "lock", id: "verify-btn", disabled: verifying })) +
      (verified ? '<div class="note ok" style="border:1px solid #CDE5D8;background:var(--ok-bg);border-inline-start:3px solid var(--ok);border-radius:0 8px 8px 0;padding:14px 16px;margin-bottom:18px">' +
        '<b style="color:var(--ok);display:block;margin-bottom:4px">' + ui.icon("check", 15) + ' السلسلة سليمة</b>' +
        '<p style="font-size:12.5px;margin:0">تم التحقق من ' + verified + ' حلقة بلا أي انقطاع أو تعديل.</p></div>' : "") +
      '<div class="grid g4 section-block">' +
      ui.MetricCard({ value: ui.fmtNum(entries.length), label: "إجمالي الحلقات" }) +
      ui.MetricCard({ value: ui.fmtNum(s.crises.length), label: "أزمات مسجَّلة" }) +
      ui.MetricCard({ value: ui.fmtNum(s.complaints.length), label: "بلاغات مسجَّلة" }) +
      ui.MetricCard({ value: sel.complaintBreachRate() + "%", label: "بلاغات متجاوزة لمهلتها" }) +
      "</div>" +
      ui.Card('<div id="chain-list" style="max-height:520px;overflow-y:auto">' + entries.map(chainRow).join("") + "</div>", { title: "آخر الأحداث الموثّقة" });

    function chainRow(e) {
      return '<div class="chain-item"><div class="ico">' + ui.icon("lock", 13) + '</div><div style="flex:1;min-width:0">' +
        '<div class="row" style="justify-content:space-between"><b style="font-size:12.5px">' + ui.esc(e.eventType) + '</b><span style="font-size:11px;color:var(--ink-3)">' + ui.fmtDateTime(e.ts) + "</span></div>" +
        '<div style="font-size:11.5px;color:var(--ink-2);margin:2px 0">' + ui.esc(e.actorName) + " · " + ui.esc(e.entityType) + " · " + ui.esc(e.entityId) + "</div>" +
        '<div class="hh">hash: ' + e.hash.slice(0, 24) + "…</div>" +
        "</div></div>";
    }

    container.querySelector("#verify-btn").addEventListener("click", function () {
      if (verifying) return;
      container.__verifying = true;
      YEDSP.router.refresh();
      setTimeout(function () {
        var result = actions.verifyAuditChain();
        container.__verifying = false;
        container.__verified = result.checked;
        YEDSP.router.refresh();
        ui.toast("تم التحقق من السلسلة بنجاح — لا يوجد أي انقطاع", "ok");
      }, 1100);
    });
  }

  YEDSP.views = YEDSP.views || {};
  YEDSP.views.protection = { triage: triage, complaintDetail: complaintDetail, audit: audit };
})(window);
