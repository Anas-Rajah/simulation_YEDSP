/* =====================================================================
   YEDSP DEMO — js/views/distributor.js — مساحة التوزيع (3 شاشات، يعمل بلا اتصال)
   ===================================================================== */
(function (global) {
  "use strict";
  var YEDSP = global.YEDSP, ui = YEDSP.ui, actions = YEDSP.actions, sel = YEDSP.selectors;

  function scan(container) {
    var pendingCount = sel.vouchersByStatus("issued").length;
    container.innerHTML =
      ui.PageHead("مسح رمز القسيمة", "وجّه الماسح نحو رمز QR الظاهر على هاتف المستفيد") +
      '<div class="card" style="max-width:420px;margin:0 auto;text-align:center;padding:40px 20px">' +
      '<div style="width:200px;height:200px;margin:0 auto 20px;border:2px dashed var(--line);border-radius:12px;display:flex;align-items:center;justify-content:center;color:var(--ink-3)">' + ui.icon("scan", 64) + '</div>' +
      '<p class="hint" style="margin-bottom:18px">' + ui.fmtNum(pendingCount) + ' قسيمة صادرة بانتظار الصرف في النظام</p>' +
      ui.Button({ label: "مسح قسيمة الآن", variant: "primary", icon: "scan", block: true, id: "scan-btn" }) +
      "</div>";

    container.querySelector("#scan-btn").addEventListener("click", function () {
      var v = actions.pickRandomPendingVoucher();
      if (!v) { ui.toast("لا توجد قسائم صادرة بانتظار الصرف حالياً", "warn"); return; }
      YEDSP.router.navigate("#/distribution/confirm/" + v.id);
    });
  }

  function confirm(container, params) {
    var id = params[0];
    var v = actions.byId(actions.getState().vouchers, id);
    if (!v) { container.innerHTML = ui.EmptyState({ icon: "alert", title: "لم يُعثر على القسيمة", hint: "عد إلى شاشة المسح وحاول مجدداً." }); return; }
    if (v.status !== "issued") {
      container.innerHTML = ui.EmptyState({ icon: "check", title: "هذه القسيمة ليست بانتظار الصرف", hint: "الحالة الحالية: " + v.status });
      return;
    }
    var c = sel.citizen(v.citizenId), sc = sel.sector(v.sectorId), site = sel.site(v.siteId);
    container.innerHTML =
      ui.PageHead("تأكيد الصرف", '<span class="mono">' + v.id + "</span>",
        ui.Button({ label: "تأكيد الصرف", variant: "primary", icon: "check", id: "confirm-deliver" })) +
      '<div class="grid g2">' +
      ui.Card(
        kv("المستفيد", c ? c.name : "—") + kv("الرقم الوطني", c ? '<span class="mono">' + c.maskedNationalId + "</span>" : "—") +
        kv("القطاع", sc ? sc.name : "—") + kv("القيمة", ui.fmtMoney(v.amount)) + kv("المركز", site ? site.name : "—"),
        { title: "بيانات القسيمة" }
      ) +
      ui.Card(
        ui.Field({ id: "pin", label: "الرمز السري الذي يذكره المستفيد", placeholder: "••••", attrs: ' maxlength="4" inputmode="numeric"' }) +
        '<p class="hint">للتجربة: أدخل أي أربعة أرقام. الرمز الحقيقي لا يظهر لأي موظف في أي شاشة — يُقارَن في الخادم فقط.</p>',
        { title: "التحقق بالرمز السري" }
      ) + "</div>";

    function kv(l, v2) { return '<div class="row" style="justify-content:space-between;border-bottom:1px solid var(--line-2);padding:8px 0"><span class="label-mini">' + ui.esc(l) + '</span><b style="font-size:13px">' + v2 + "</b></div>"; }

    container.querySelector("#confirm-deliver").addEventListener("click", function () {
      var pin = container.querySelector("#pin").value.trim();
      if (!/^\d{4}$/.test(pin)) { ui.toast("أدخل الرمز السري المكوَّن من أربعة أرقام", "warn"); return; }
      ui.showDialog({
        title: "تأكيد صرف القسيمة", body: "سيتم تسجيل صرف القسيمة " + v.id + " للمستفيد " + (c ? c.name : "") + " بشكل نهائي.",
        confirmLabel: "تأكيد الصرف",
        onConfirm: function () { actions.deliverVoucher(v.id); YEDSP.router.navigate("#/distribution/log"); }
      });
    });
  }

  function log(container) {
    var s = actions.getState();
    var me = actions.currentUser();
    var delivered = s.vouchers.filter(function (v) { return v.status === "delivered"; }).sort(function (a, b) { return b.deliveredAt - a.deliveredAt; });
    var total = delivered.reduce(function (sum, v) { return sum + v.amount; }, 0);

    container.innerHTML =
      ui.PageHead("سجل الصرف اليومي", "كل عمليات الصرف المسجَّلة في هذا المركز",
        ui.Button({ label: "تصدير السجل", variant: "primary", icon: "download", id: "export-log" })) +
      '<div class="grid g3 section-block">' +
      ui.MetricCard({ value: ui.fmtNum(delivered.length), label: "قسيمة مصروفة" }) +
      ui.MetricCard({ value: ui.fmtMoney(total), label: "إجمالي المبلغ المصروف" }) +
      ui.MetricCard({ value: me ? ui.esc(me.name) : "—", label: "الموظف الحالي" }) +
      "</div>" +
      ui.Table({
        columns: [
          { label: "القسيمة", render: function (v) { return '<span class="mono">' + v.id + "</span>"; } },
          { label: "المستفيد", render: function (v) { var c = sel.citizen(v.citizenId); return c ? ui.esc(c.name) : "—"; } },
          { label: "القطاع", render: function (v) { var sc = sel.sector(v.sectorId); return ui.esc(sc ? sc.name : ""); } },
          { label: "المبلغ", render: function (v) { return ui.fmtMoney(v.amount); } },
          { label: "وقت الصرف", render: function (v) { return ui.fmtDateTime(v.deliveredAt); } }
        ], rows: delivered,
        empty: { icon: "list", title: "لم يُصرف أي شيء بعد", hint: "ستظهر عمليات الصرف هنا فور تأكيدها." }
      });
    container.querySelector("#export-log").addEventListener("click", function () { actions.exportPlaceholder("سجل الصرف اليومي"); });
  }

  YEDSP.views = YEDSP.views || {};
  YEDSP.views.distribution = { scan: scan, confirm: confirm, log: log };
})(window);
