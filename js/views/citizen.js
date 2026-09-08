/* =====================================================================
   YEDSP DEMO — js/views/citizen.js — بوابة المواطن (7 شاشات)
   ===================================================================== */
(function (global) {
  "use strict";
  var YEDSP = global.YEDSP, ui = YEDSP.ui, actions = YEDSP.actions, sel = YEDSP.selectors;

  function me() { return sel.citizen(actions.getState().currentUserId); }
  function myRequests() { var c = me(); return actions.getState().aidRequests.filter(function (r) { return r.citizenId === c.id; }); }

  var STEP_ORDER = ["submitted", "reviewing", "approved", "voucher", "delivered"];
  function stepsFor(req) {
    if (req.status === "rejected") {
      return [
        { label: "مقدَّم", state: "done" },
        { label: "قيد الفحص", state: "done" },
        { label: "مرفوض", state: "rejected" },
        { label: "قسيمة", state: "upcoming" },
        { label: "مصروف", state: "upcoming" }
      ];
    }
    var idx = STEP_ORDER.indexOf(req.status);
    var labels = ["مقدَّم", "قيد الفحص", "معتمد", "قسيمة صادرة", "مصروف"];
    return labels.map(function (l, i) {
      return { label: l, state: i < idx ? "done" : i === idx ? "current" : "upcoming" };
    });
  }

  function home(container) {
    var c = me();
    var gov = sel.governorate(c.governorateId);
    var reqs = myRequests();
    var pending = reqs.filter(function (r) { return r.status === "submitted" || r.status === "reviewing"; });
    var vouchers = actions.getState().vouchers.filter(function (v) { return v.citizenId === c.id && v.status === "issued"; });
    var recent = reqs.slice().sort(function (a, b) { return b.submittedAt - a.submittedAt; }).slice(0, 3);

    container.innerHTML =
      ui.PageHead("مرحباً، " + c.name, "محافظة " + (gov ? gov.name : "—") + " · " + c.maskedNationalId,
        ui.Button({ label: "تقديم طلب مساعدة", variant: "primary", icon: "filePlus", id: "go-new-request" })) +
      '<div class="grid g4 section-block">' +
      ui.MetricCard({ value: reqs.length, label: "إجمالي طلباتي" }) +
      ui.MetricCard({ value: pending.length, label: "قيد المعالجة" }) +
      ui.MetricCard({ value: vouchers.length, label: "قسائم بانتظار الاستلام" }) +
      ui.MetricCard({ value: c.familySize, label: "أفراد الأسرة المسجَّلون" }) +
      "</div>" +
      '<h2 class="h-section">أحدث طلباتي</h2>' +
      (recent.length ? '<div class="grid g3">' + recent.map(function (r) {
        var s = sel.sector(r.sectorId);
        return ui.Card(
          '<div class="row" style="justify-content:space-between;margin-bottom:8px">' + ui.StatusBadge("request", r.status) + '<span class="mono" style="font-size:11.5px;color:var(--ink-3)">' + r.id + '</span></div>' +
          '<b style="font-size:14px">' + ui.esc(s ? s.name : "") + '</b>' +
          '<div class="hint" style="margin-top:6px">تاريخ التقديم: ' + ui.fmtDate(r.submittedAt) + '</div>',
          { className: "clickable" }
        ).replace("<div class=\"card clickable\">", '<div class="card clickable" data-goto="' + r.id + '">');
      }).join("") + "</div>" : ui.EmptyState({ icon: "filePlus", title: "لا توجد طلبات بعد", hint: "قدّم طلب مساعدتك الأول من الزر أعلى الصفحة.", action: ui.Button({ label: "تقديم طلب", variant: "secondary", id: "go-new-request-2" }) }));

    container.querySelectorAll("[data-goto]").forEach(function (el) {
      el.addEventListener("click", function () { YEDSP.router.navigate("#/citizen/request-detail/" + el.getAttribute("data-goto")); });
    });
    var b1 = container.querySelector("#go-new-request"); if (b1) b1.addEventListener("click", function () { YEDSP.router.navigate("#/citizen/new-request"); });
    var b2 = container.querySelector("#go-new-request-2"); if (b2) b2.addEventListener("click", function () { YEDSP.router.navigate("#/citizen/new-request"); });
  }

  function identity(container) {
    var c = me();
    var gov = sel.governorate(c.governorateId);
    container.innerHTML =
      ui.PageHead("هويتي الرقمية", "بيانات موحّدة يتحقق منها النظام في كل خدمة تطلبها",
        ui.Button({ label: "تأكيد صحة بياناتي", variant: "primary", id: "confirm-identity" })) +
      '<div class="grid g2">' +
      ui.Card(
        '<div class="stack">' +
        row("الاسم الكامل", c.name) + row("الرقم الوطني", '<span class="mono">' + c.maskedNationalId + '</span>') +
        row("المحافظة", gov ? gov.name : "—") + row("عدد أفراد الأسرة", ui.fmtNum(c.familySize)) +
        row("قناة التسجيل", c.registrationChannel) + row("تاريخ التسجيل", ui.fmtDate(c.registeredAt)) +
        row("حالة التحقق", ui.StatusBadge("generic", "موثّقة") ) +
        "</div>", { title: "البطاقة الأساسية" }
      ) +
      ui.Card(
        '<div class="qr-box">' + fakeQr(c.id, 150) + '</div>' +
        '<p class="hint" style="text-align:center;margin-top:10px">هذا الرمز يمثّل هويتك الرقمية الموحّدة. يُستخدم للتحقق الميداني دون اتصال بالإنترنت.</p>',
        { title: "بطاقة العرض الميداني" }
      ) +
      "</div>" +
      '<div class="note" style="background:#fff;border:1px solid var(--line);border-inline-start:3px solid var(--green-700);border-radius:0 8px 8px 0;padding:14px 16px;margin-top:20px">' +
      '<b style="display:block;margin-bottom:4px;font-size:12.5px;color:var(--green-800)">لماذا لا يظهر رقمي الوطني كاملاً؟</b>' +
      '<p style="font-size:12.5px;color:var(--ink-2);margin:0">يُخزَّن رقمك الوطني مجزّأً ولا يُعرض كاملاً في أي شاشة — هذا يمنع أي طرف من انتحال هويتك حتى لو اطّلع على الشاشة.</p></div>';

    container.querySelector("#confirm-identity").addEventListener("click", function () { ui.toast("تم تأكيد صحة بياناتك، شكراً لك", "ok"); });
    function row(l, v) { return '<div class="row" style="justify-content:space-between;border-bottom:1px solid var(--line-2);padding:8px 0"><span class="label-mini">' + ui.esc(l) + '</span><b style="font-size:13.5px">' + v + '</b></div>'; }
  }

  function newRequest(container) {
    var s = actions.getState();
    container.innerHTML =
      ui.PageHead("تقديم طلب مساعدة", "اختر القطاع الذي تحتاج فيه المساعدة، وسنراجع طلبك خلال 24 ساعة") +
      '<div class="grid g2"><div>' +
      '<form id="req-form">' +
      ui.Select({ id: "sector", label: "قطاع المساعدة", required: true, placeholder: "اختر القطاع", options: s.sectors.map(function (x) { return { value: x.id, label: x.name }; }) }) +
      ui.Field({ id: "notes", label: "تفاصيل إضافية (اختياري)", textarea: true, rows: 4, placeholder: "مثال: أسرتي مكوّنة من سبعة أفراد وفقدنا مصدر الدخل الأساسي" }) +
      ui.Checkbox({ id: "confirm", label: "أقرّ بأن البيانات المقدَّمة صحيحة وأتحمّل مسؤوليتها" }) +
      ui.Button({ label: "إرسال الطلب", variant: "primary", type: "submit", block: true, icon: "filePlus" }) +
      "</form></div><div>" +
      ui.Card(
        '<p style="font-size:12.5px;color:var(--ink-2)">تُحتسب أولوية طلبك تلقائياً من بيانات ملفك (حجم الأسرة، الدخل، حالات الإعاقة أو الحمل) ولا يمكنك التأثير فيها من هذه الشاشة.</p>' +
        '<p style="font-size:12.5px;color:var(--ink-2);margin-top:8px">لا يمكن وجود أكثر من طلب نشط واحد لك في القطاع نفسه في آنٍ واحد.</p>',
        { title: "كيف تُدرس طلباتك؟" }
      ) + "</div></div>";

    container.querySelector("#req-form").addEventListener("submit", function (e) {
      e.preventDefault();
      var sectorId = container.querySelector("#sector").value;
      var notes = container.querySelector("#notes").value;
      var confirmed = container.querySelector("#confirm").checked;
      if (!sectorId) { ui.toast("يرجى اختيار قطاع المساعدة", "warn"); return; }
      if (!confirmed) { ui.toast("يرجى الإقرار بصحة البيانات أولاً", "warn"); return; }
      var c = me();
      var hasActive = actions.getState().aidRequests.some(function (r) {
        return r.citizenId === c.id && r.sectorId === sectorId && ["submitted", "reviewing", "voucher"].indexOf(r.status) !== -1;
      });
      if (hasActive) { ui.toast("لديك طلب نشط بالفعل في هذا القطاع", "warn"); return; }
      var req = actions.submitAidRequest(c.id, sectorId, notes);
      YEDSP.router.navigate("#/citizen/request-detail/" + req.id);
    });
  }

  function requests(container, params) {
    var s = actions.getState();
    var all = myRequests();
    var status = (container.__filterStatus) || "all";
    container.innerHTML =
      ui.PageHead("تتبّع طلباتي", "جميع الطلبات التي قدّمتها عبر المنصة",
        ui.Button({ label: "تقديم طلب جديد", variant: "primary", icon: "filePlus", id: "go-new" })) +
      '<div class="filters"><div style="min-width:200px">' +
      ui.Select({ id: "f-status", label: "تصفية بالحالة", value: status, options: [{ value: "all", label: "كل الحالات" }, { value: "submitted", label: "مُقدَّم" }, { value: "reviewing", label: "قيد الفحص" }, { value: "voucher", label: "قسيمة صادرة" }, { value: "delivered", label: "مصروف" }, { value: "rejected", label: "مرفوض" }] }) +
      "</div></div>" +
      '<div id="req-table"></div>';

    function draw() {
      var filtered = status === "all" ? all : all.filter(function (r) { return r.status === status; });
      filtered.sort(function (a, b) { return b.submittedAt - a.submittedAt; });
      container.querySelector("#req-table").innerHTML = ui.Table({
        columns: [
          { label: "رقم الطلب", render: function (r) { return '<span class="mono">' + r.id + "</span>"; } },
          { label: "القطاع", render: function (r) { var sc = sel.sector(r.sectorId); return ui.esc(sc ? sc.name : "—"); } },
          { label: "تاريخ التقديم", render: function (r) { return ui.fmtDate(r.submittedAt); } },
          { label: "الحالة", render: function (r) { return ui.StatusBadge("request", r.status); } },
          { label: "", render: function () { return '<span class="btn-quiet btn" style="height:auto">عرض التفاصيل</span>'; } }
        ],
        rows: filtered,
        rowAttrs: function (r) { return 'data-id="' + r.id + '" style="cursor:pointer"'; },
        empty: { icon: "list", title: "لا توجد طلبات مطابقة", hint: "جرّب تغيير عامل التصفية أعلاه، أو قدّم طلباً جديداً." }
      });
      container.querySelectorAll("#req-table tr[data-id]").forEach(function (tr) {
        tr.addEventListener("click", function () { YEDSP.router.navigate("#/citizen/request-detail/" + tr.getAttribute("data-id")); });
      });
    }
    draw();
    container.querySelector("#f-status").addEventListener("change", function (e) { status = e.target.value; container.__filterStatus = status; draw(); });
    container.querySelector("#go-new").addEventListener("click", function () { YEDSP.router.navigate("#/citizen/new-request"); });
  }

  function requestDetail(container, params) {
    var id = params[0];
    var req = actions.byId(actions.getState().aidRequests, id);
    if (!req || req.citizenId !== me().id) {
      container.innerHTML = ui.EmptyState({ icon: "alert", title: "لم يُعثر على الطلب", hint: "قد يكون الرابط غير صحيح." });
      return;
    }
    var sc = sel.sector(req.sectorId);
    var voucher = actions.getState().vouchers.filter(function (v) { return v.requestId === req.id; })[0];
    var gold = voucher
      ? ui.Button({ label: "عرض قسيمتي", variant: "primary", icon: "qr", id: "go-voucher" })
      : ui.Button({ label: "الرجوع إلى طلباتي", variant: "primary", id: "go-list" });

    container.innerHTML =
      ui.PageHead("تفاصيل الطلب — " + req.id, ui.esc(sc ? sc.name : ""), gold) +
      ui.ProgressSteps(stepsFor(req)) +
      '<div class="grid g2">' +
      ui.Card(
        kv("رقم الطلب", '<span class="mono">' + req.id + "</span>") +
        kv("القطاع", sc ? sc.name : "—") +
        kv("تاريخ التقديم", ui.fmtDateTime(req.submittedAt)) +
        (req.status === "submitted" || req.status === "reviewing"
          ? kv("مهلة الفحص", ui.fmtCountdown(req.slaDeadline))
          : kv("تاريخ القرار", req.decidedAt ? ui.fmtDateTime(req.decidedAt) : "—")) +
        (req.rejectionReason ? '<div class="note" style="border:1px solid #F0D5D0;background:var(--crit-bg);border-radius:8px;padding:12px;margin-top:10px"><b style="color:var(--crit);display:block;margin-bottom:4px;font-size:12.5px">سبب الرفض</b><p style="font-size:12.5px;margin:0">' + ui.esc(req.rejectionReason) + "</p></div>" : ""),
        { title: "بيانات الطلب" }
      ) +
      ui.Card(
        req.history.slice().reverse().map(function (h) {
          return '<div class="chain-item"><div class="ico">' + ui.icon("check", 13) + '</div><div><b style="font-size:12.5px;display:block">' + ui.esc(h.action) + '</b><span style="font-size:11.5px;color:var(--ink-3)">' + ui.esc(h.actor) + " · " + ui.fmtDateTime(h.at) + '</span>' + (h.note ? '<div style="font-size:12px;margin-top:3px">' + ui.esc(h.note) + "</div>" : "") + "</div></div>";
        }).join(""),
        { title: "سجل الإجراءات" }
      ) +
      "</div>";

    function kv(l, v) { return '<div class="row" style="justify-content:space-between;border-bottom:1px solid var(--line-2);padding:8px 0"><span class="label-mini">' + ui.esc(l) + '</span><b style="font-size:13px">' + v + "</b></div>"; }
    var gv = container.querySelector("#go-voucher"); if (gv) gv.addEventListener("click", function () { YEDSP.router.navigate("#/citizen/voucher/" + voucher.id); });
    var gl = container.querySelector("#go-list"); if (gl) gl.addEventListener("click", function () { YEDSP.router.navigate("#/citizen/requests"); });
  }

  function voucher(container, params) {
    var id = params[0];
    var v = actions.byId(actions.getState().vouchers, id);
    if (!v || v.citizenId !== me().id) {
      container.innerHTML = ui.EmptyState({ icon: "alert", title: "لم يُعثر على القسيمة" });
      return;
    }
    var sc = sel.sector(v.sectorId), site = sel.site(v.siteId);
    container.innerHTML =
      ui.PageHead("قسيمتي", ui.esc(sc ? sc.name : ""),
        ui.Button({ label: "إعادة إرسال الرمز عبر SMS", variant: "primary", icon: "sync", id: "resend-pin" })) +
      '<div class="grid g2">' +
      ui.Card(
        '<div class="qr-box">' + fakeQr(v.id, 150) + '</div>' +
        '<p style="text-align:center;margin-top:10px" class="mono">' + ui.esc(v.code) + '</p>' +
        '<div class="pin-box" style="margin-top:14px">' + v.pinMasked + '</div>' +
        '<p class="hint" style="text-align:center;margin-top:8px">تم إرسال الرمز السري عبر رسالة نصية إلى هاتفك المسجَّل. لا يظهر لأي موظف في أي شاشة.</p>',
        { title: "رمز الاستلام" }
      ) +
      ui.Card(
        row("الحالة", ui.StatusBadge("voucher", v.status)) +
        row("القيمة", ui.fmtMoney(v.amount)) +
        row("مركز الاستلام", site ? site.name : "—") +
        row("تاريخ الإصدار", ui.fmtDate(v.issuedAt)) +
        row("صالحة حتى", ui.fmtDate(v.expiresAt)) +
        (v.deliveredAt ? row("تاريخ الاستلام", ui.fmtDate(v.deliveredAt)) : ""),
        { title: "بيانات القسيمة" }
      ) + "</div>";

    function row(l, val) { return '<div class="row" style="justify-content:space-between;border-bottom:1px solid var(--line-2);padding:8px 0"><span class="label-mini">' + ui.esc(l) + '</span><b style="font-size:13px">' + val + "</b></div>"; }
    container.querySelector("#resend-pin").addEventListener("click", function () { ui.toast("تم إرسال الرمز السري مجدداً إلى هاتفك", "ok"); });
  }

  function complaints(container) {
    var s = actions.getState();
    var cats = s.complaintCategories;
    container.innerHTML =
      '<div class="grid g2">' +
      '<div>' + ui.PageHead("تقديم بلاغ", "بلاغك يصل مباشرة إلى فريق الحماية والمساءلة") +
      '<form id="cmp-form">' +
      ui.Select({ id: "category", label: "نوع البلاغ", required: true, options: cats.map(function (c) { return { value: c.code, label: c.name + " — استجابة خلال " + c.slaHours + " ساعة" }; }) }) +
      ui.Select({ id: "gov", label: "المحافظة", required: true, options: s.governorates.map(function (g) { return { value: g.id, label: g.name }; }) }) +
      ui.Field({ id: "desc", label: "تفاصيل البلاغ", textarea: true, rows: 4, required: true, placeholder: "صف ما حدث بالتفصيل ومتى وأين" }) +
      ui.Checkbox({ id: "anon", label: "أريد تقديم هذا البلاغ دون كشف هويتي" }) +
      '<div id="reporter-fields">' +
      ui.Field({ id: "rname", label: "الاسم" }) + ui.Field({ id: "rphone", label: "رقم الهاتف", type: "tel" }) +
      "</div>" +
      ui.Button({ label: "إرسال البلاغ", variant: "primary", type: "submit", block: true, icon: "flag" }) +
      "</form></div>" +
      '<div>' + ui.PageHead("متابعة بلاغ سابق", "أدخل رقم المتابعة الذي استلمته عند التقديم") +
      ui.Field({ id: "track", label: "رقم المتابعة", placeholder: "مثال: YSP-482913" }) +
      ui.Button({ label: "بحث", variant: "secondary", id: "track-btn", block: true, icon: "search" }) +
      '<div id="track-result" style="margin-top:16px"></div>' +
      "</div></div>";

    var anonEl = container.querySelector("#anon");
    var reporterFields = container.querySelector("#reporter-fields");
    anonEl.addEventListener("change", function () { reporterFields.classList.toggle("hidden", anonEl.checked); });

    container.querySelector("#cmp-form").addEventListener("submit", function (e) {
      e.preventDefault();
      var category = container.querySelector("#category").value;
      var govId = container.querySelector("#gov").value;
      var desc = container.querySelector("#desc").value.trim();
      var anon = anonEl.checked;
      if (!category || !govId || !desc) { ui.toast("يرجى تعبئة كل الحقول المطلوبة", "warn"); return; }
      var c = actions.submitComplaint({
        category: category, governorateId: govId, description: desc, anonymous: anon,
        reporterName: container.querySelector("#rname").value, reporterPhone: container.querySelector("#rphone").value
      });
      container.querySelector("#cmp-form").reset();
      reporterFields.classList.remove("hidden");
      ui.showDialog({ title: "تم استلام بلاغك", body: "رقم المتابعة الخاص بك هو " + c.trackingCode + ". يمكنك استخدامه لمتابعة حالة البلاغ في أي وقت.", confirmLabel: "حسناً" });
    });

    container.querySelector("#track-btn").addEventListener("click", function () {
      var code = container.querySelector("#track").value.trim();
      var found = actions.getState().complaints.filter(function (c) { return c.trackingCode === code; })[0];
      var box = container.querySelector("#track-result");
      if (!found) { box.innerHTML = ui.EmptyState({ icon: "search", title: "لم يُعثر على بلاغ بهذا الرقم", hint: "تأكد من رقم المتابعة وحاول مجدداً." }); return; }
      box.innerHTML = ui.Card(
        '<div class="row" style="justify-content:space-between;margin-bottom:8px">' + ui.StatusBadge("generic", found.status) + '<span class="mono" style="font-size:11px;color:var(--ink-3)">' + found.trackingCode + '</span></div>' +
        '<p style="font-size:12.5px">' + ui.esc(found.description) + '</p>' +
        '<div class="hint" style="margin-top:8px">النوع: ' + ui.esc(found.categoryName) + " · تاريخ التقديم: " + ui.fmtDate(found.createdAt) + "</div>",
        { title: "نتيجة البحث" }
      );
    });
  }

  function fakeQr(seedStr, size) {
    var hash = window.YEDSP_SEED.helpers.fakeHash(seedStr);
    var cells = 11, cell = Math.floor((size - 20) / cells);
    var s = '<svg width="' + size + '" height="' + size + '" viewBox="0 0 ' + size + " " + size + '">' + '<rect width="' + size + '" height="' + size + '" fill="#fff"/>';
    var k = 0;
    for (var y = 0; y < cells; y++) {
      for (var x = 0; x < cells; x++) {
        var bit = parseInt(hash[(k++) % hash.length], 16) % 2;
        var isFinder = (x < 3 && y < 3) || (x > cells - 4 && y < 3) || (x < 3 && y > cells - 4);
        if (bit || isFinder) s += '<rect x="' + (10 + x * cell) + '" y="' + (10 + y * cell) + '" width="' + cell + '" height="' + cell + '" fill="#101820"/>';
      }
    }
    return s + "</svg>";
  }

  YEDSP.views = YEDSP.views || {};
  YEDSP.views.citizen = {
    home: home, identity: identity, newRequest: newRequest, requests: requests,
    requestDetail: requestDetail, voucher: voucher, complaints: complaints
  };
})(window);
