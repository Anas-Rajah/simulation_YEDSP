/* =====================================================================
   YEDSP DEMO — js/views/donor.js — مساحة المانح (3 شاشات)
   ===================================================================== */
(function (global) {
  "use strict";
  var YEDSP = global.YEDSP, ui = YEDSP.ui, actions = YEDSP.actions, sel = YEDSP.selectors;

  function myDonor() {
    var s = actions.getState();
    var me = actions.currentUser();
    return s.donors.filter(function (d) { return d.contactUserId === (me ? me.id : null); })[0] || s.donors[0];
  }

  function dashboard(container) {
    var donor = myDonor();
    var totalGrant = donor.grants.reduce(function (s, g) { return s + g.totalAmount; }, 0);
    var totalSpent = donor.grants.reduce(function (s, g) { return s + sel.grantSpent(g); }, 0);
    var totalBenef = donor.grants.reduce(function (s, g) { return s + sel.grantBeneficiaries(g); }, 0);

    container.innerHTML =
      ui.PageHead("لوحة منحي — " + donor.name, "متابعة حيّة لاستهلاك منحك وأثرها على المستفيدين",
        ui.Button({ label: "التقارير وشهادات الأثر", variant: "primary", icon: "printer", id: "go-reports" })) +
      '<div class="grid g4 section-block">' +
      ui.MetricCard({ value: ui.fmtMoney(totalGrant), label: "إجمالي قيمة المنح" }) +
      ui.MetricCard({ value: ui.fmtMoney(totalSpent), label: "إجمالي المصروف" }) +
      ui.MetricCard({ value: (totalGrant ? Math.round(totalSpent / totalGrant * 100) : 0) + "%", label: "نسبة الاستهلاك" }) +
      ui.MetricCard({ value: ui.fmtNum(totalBenef), label: "مستفيدون تحقّقوا فعلياً" }) +
      "</div>" +
      '<h2 class="h-section">منحي</h2>' +
      '<div class="grid g2">' + donor.grants.map(function (g) {
        var spent = sel.grantSpent(g), pct = g.totalAmount ? Math.round(spent / g.totalAmount * 100) : 0;
        var sc = sel.sector(g.sectorId);
        return ui.Card(
          '<div class="hint" style="margin-bottom:10px">' + ui.esc(sc ? sc.name : "") + " · " + g.allocations.length + " محافظة مستهدَفة</div>" +
          '<div class="row" style="justify-content:space-between;margin-bottom:6px"><span style="font-size:12.5px">المصروف: ' + ui.fmtMoney(spent) + '</span><b class="mono" style="font-size:12.5px">' + pct + '%</b></div>' +
          '<div style="height:8px;background:var(--line-2);border-radius:4px;overflow:hidden;margin-bottom:14px"><div style="height:100%;width:' + pct + '%;background:var(--green-700)"></div></div>' +
          ui.Button({ label: "عرض التوزيع الجغرافي", variant: "secondary", sm: true, id: "geo-" + g.id }),
          { title: g.name }
        );
      }).join("") + "</div>";

    container.querySelector("#go-reports").addEventListener("click", function () { YEDSP.router.navigate("#/donor/reports"); });
    donor.grants.forEach(function (g) {
      var b = container.querySelector("#geo-" + g.id);
      if (b) b.addEventListener("click", function () { YEDSP.router.navigate("#/donor/geographic/" + g.id); });
    });
  }

  function geographic(container, params) {
    var donor = myDonor();
    var gId = params[0];
    var grant = donor.grants.filter(function (g) { return g.id === gId; })[0] || donor.grants[0];
    if (!grant) { container.innerHTML = ui.EmptyState({ icon: "map", title: "لا توجد منحة" }); return; }
    var s = actions.getState();
    var allocGovs = grant.allocations.map(function (a) { return sel.governorate(a.governorateId); }).filter(Boolean);

    function spentFor(alloc) {
      return s.vouchers.filter(function (v) { return v.status === "delivered" && v.sectorId === grant.sectorId && v.governorateId === alloc.governorateId; })
        .reduce(function (sum, v) { return sum + v.amount; }, 0);
    }
    function pctFor(alloc) { return alloc.targetAmount ? Math.min(100, Math.round(spentFor(alloc) / alloc.targetAmount * 100)) : 0; }

    container.innerHTML =
      ui.PageHead("التوزيع الجغرافي — " + grant.name, "حسب تخصيص المنحة على المحافظات",
        ui.Button({ label: "تصدير كشف التوزيع", variant: "primary", icon: "download", id: "export-geo" })) +
      ui.Card('<div id="map-host"></div>' + ui.mapLegend(), { title: "خارطة المحافظات المستهدَفة" }) +
      ui.Table({
        columns: [
          { label: "المحافظة", render: function (a) { var g = sel.governorate(a.governorateId); return ui.esc(g ? g.name : ""); } },
          { label: "المستهدف", render: function (a) { return ui.fmtMoney(a.targetAmount); } },
          { label: "المصروف", render: function (a) { return ui.fmtMoney(spentFor(a)); } },
          { label: "نسبة الاستهلاك", render: function (a) { return ui.Badge(pctFor(a) + "%", pctFor(a) >= 70 ? "ok" : pctFor(a) >= 40 ? "warn" : "crit"); } },
          { label: "المستفيدون المستهدفون", render: function (a) { return ui.fmtNum(a.targetBeneficiaries); } }
        ], rows: grant.allocations,
        empty: { title: "لا توجد تخصيصات جغرافية لهذه المنحة", hint: "" }
      });

    container.querySelector("#map-host").innerHTML = ui.GovMap(allocGovs, function (g) {
      var alloc = grant.allocations.filter(function (a) { return a.governorateId === g.id; })[0];
      return alloc ? pctFor(alloc) : 0;
    });
    ui.bindGovMapTooltip(container, function (govId) {
      var alloc = grant.allocations.filter(function (a) { return a.governorateId === govId; })[0];
      var g = sel.governorate(govId);
      if (!g) return "";
      if (!alloc) return "<b>" + ui.esc(g.name) + '</b><div class="tr"><span>خارج نطاق هذه المنحة</span><span>—</span></div>';
      return "<b>" + ui.esc(g.name) + "</b>" +
        '<div class="tr"><span>المستهدف</span><span>' + ui.fmtNum(alloc.targetAmount) + "</span></div>" +
        '<div class="tr"><span>المصروف</span><span>' + ui.fmtNum(spentFor(alloc)) + "</span></div>" +
        '<div class="tr"><span>نسبة الاستهلاك</span><span>' + pctFor(alloc) + "%</span></div>" +
        '<div class="tr"><span>مستفيدون مستهدفون</span><span>' + ui.fmtNum(alloc.targetBeneficiaries) + "</span></div>";
    });
    container.querySelector("#export-geo").addEventListener("click", function () { actions.exportPlaceholder("كشف التوزيع الجغرافي"); });
  }

  function reports(container) {
    var donor = myDonor();
    var open = container.__openCert;
    container.innerHTML =
      ui.PageHead("التقارير وشهادات الأثر", "شهادة أثر لكل منحة مبنية على القسائم المصروفة فعلياً",
        ui.Button({ label: "تصدير كل التقارير", variant: "primary", icon: "download", id: "export-all" })) +
      '<div class="grid g2">' + donor.grants.map(function (g) {
        var spent = sel.grantSpent(g), benef = sel.grantBeneficiaries(g);
        return ui.Card(
          '<p style="font-size:12.5px;color:var(--ink-2);margin-bottom:14px">إجمالي منصرف موثّق: ' + ui.fmtMoney(spent) + " لعدد " + ui.fmtNum(benef) + " مستفيد فعلي</p>" +
          ui.Button({ label: "عرض شهادة الأثر", variant: "secondary", sm: true, id: "cert-" + g.id }),
          { title: g.name }
        );
      }).join("") + "</div>" +
      '<div id="cert-host" class="section-block" style="margin-top:20px">' + (open ? certificateHtml(donor, open) : "") + "</div>";

    container.querySelector("#export-all").addEventListener("click", function () { actions.exportPlaceholder("كل تقارير المانح"); });
    donor.grants.forEach(function (g) {
      var b = container.querySelector("#cert-" + g.id);
      if (b) b.addEventListener("click", function () {
        container.__openCert = g.id;
        YEDSP.router.refresh();
        setTimeout(function () { var el = document.getElementById("cert-host"); if (el) el.scrollIntoView({ behavior: "smooth", block: "start" }); }, 260);
      });
    });
    var printBtn = container.querySelector("#print-cert");
    if (printBtn) printBtn.addEventListener("click", function () { window.print(); });
  }

  function certificateHtml(donor, grantId) {
    var grant = donor.grants.filter(function (g) { return g.id === grantId; })[0];
    if (!grant) return "";
    var spent = sel.grantSpent(grant), benef = sel.grantBeneficiaries(grant);
    var lastAudit = actions.getState().auditTrail.slice(-1)[0];
    return '<div class="certificate">' +
      '<div class="seal">' + ui.icon("shield", 30) + "</div>" +
      "<h2>شهادة أثر إنساني</h2>" +
      '<p style="font-size:12.5px;color:var(--ink-2)">تصدرها المنصة الوطنية للخدمات الرقمية الطارئة تصديقاً على أثر المنحة التالية</p>' +
      '<div class="amt">' + ui.fmtMoney(spent) + "</div>" +
      '<p style="font-size:13px">تم صرفها فعلياً إلى <b>' + ui.fmtNum(benef) + "</b> مستفيداً موثّقاً ضمن منحة</p>" +
      '<p style="font-size:14px;font-weight:700;color:var(--green-800);margin-bottom:16px">' + ui.esc(grant.name) + "</p>" +
      '<div class="row" style="justify-content:center;gap:24px;font-size:11.5px;color:var(--ink-3);border-top:1px solid var(--line);padding-top:14px">' +
      '<span>الجهة المانحة: ' + ui.esc(donor.name) + "</span>" +
      '<span>تاريخ الإصدار: ' + ui.fmtDate(Date.now()) + "</span>" +
      (lastAudit ? '<span class="mono">مرجع التدقيق: ' + lastAudit.hash.slice(0, 16) + "…</span>" : "") +
      "</div>" +
      '<div class="no-print" style="margin-top:18px">' + ui.Button({ label: "طباعة الشهادة", variant: "secondary", sm: true, id: "print-cert", icon: "printer" }) + "</div>" +
      "</div>";
  }

  YEDSP.views = YEDSP.views || {};
  YEDSP.views.donor = { dashboard: dashboard, geographic: geographic, reports: reports };
})(window);
