/* =====================================================================
   YEDSP DEMO — js/views/landing.js
   الصفحة التعريفية العامة للمنصة (قبل تسجيل الدخول).
   كل الأرقام المعروضة هنا محسوبة من بيانات التشغيل نفسها لا مكتوبة يدوياً.
   ===================================================================== */
(function (global) {
  "use strict";
  var YEDSP = global.YEDSP, ui = YEDSP.ui, actions = YEDSP.actions, sel = YEDSP.selectors;

  var SERVICES = [
    { icon: "id", title: "هوية رقمية موحّدة", text: "معرّف واحد لكل مستفيد يُتحقق منه ميدانياً حتى بلا إنترنت، ويمنع الازدواجية في التسجيل." },
    { icon: "filePlus", title: "طلب مساعدة بأربع قنوات", text: "عبر الويب أو USSD أو المسّاح الميداني أو الخط الساخن، مع مهلة فحص ملزمة مدتها 24 ساعة." },
    { icon: "qr", title: "قسيمة برمز وتحقق مزدوج", text: "رمز QR موقّع ورمز سري يصل المستفيد وحده، ولا يظهر لأي موظف في أي شاشة." },
    { icon: "flag", title: "بلاغ مسموع ومجهول", text: "ثلاث فئات بمُهل مختلفة تبدأ من أربع ساعات، مع دعم كامل للبلاغ دون كشف الهوية." }
  ];

  var MODULES = [
    { id: "M1", title: "الهوية والمصادقة", text: "معرّف موحّد، فحص ازدواجية، ومصادقة ثنائية للأدوار الحساسة." },
    { id: "M2", title: "سجل المستفيدين", text: "بيانات مشفّرة على مستوى الحقل، وإدارة السجلات المكررة بلا حذف." },
    { id: "M3", title: "طلبات المساعدة", text: "نقاط هشاشة محسوبة في الخادم، وطابور فحص مرتّب بالأولوية والمهلة." },
    { id: "M4", title: "القسائم والصرف", text: "توليد القسيمة عند الاعتماد، وصرفها بعاملين: مسح الرمز ومطابقة الرمز السري." },
    { id: "M5", title: "العمليات الميدانية", text: "خارطة تفاعلية لاثنتين وعشرين محافظة، وتكليفات المسّاحين، وسجل الأزمات." },
    { id: "M6", title: "الحماية والبلاغات", text: "فرز البلاغات وتحقيقها، وتصعيد آلي للفئة الأمنية إلى أزمة ميدانية." },
    { id: "M7", title: "التمويل والشفافية", text: "محفظة المنح وتخصيصها جغرافياً، ولوحة مانح تربط كل مبلغ بمستفيد فعلي." },
    { id: "M8", title: "التحليلات والمؤشرات", text: "تغطية وأداء ومُهل — محسوبة من الجداول التشغيلية لا من أرقام مخزّنة." },
    { id: "M9", title: "التدقيق التشفيري", text: "سلسلة أحداث مترابطة للإضافة فقط، يفتحها المانح والرقيب متى شاء." }
  ];

  var FLOW = [
    { t: "التسجيل", s: "ميدانياً أو ذاتياً، ولو بلا اتصال" },
    { t: "التحقق", s: "من الهوية ومنع الازدواجية" },
    { t: "الفحص", s: "ضمن مهلة 24 ساعة ملزمة" },
    { t: "الاعتماد", s: "بقرار موثّق وسبب إلزامي" },
    { t: "الصرف", s: "بالرمز والرمز السري معاً", gold: true },
    { t: "التدقيق", s: "حلقة تشفيرية غير قابلة للتعديل" }
  ];

  function stat(value, label) {
    return '<div class="st"><b>' + ui.esc(value) + "</b><span>" + ui.esc(label) + "</span></div>";
  }

  function render(container) {
    var s = actions.getState();
    var deliveredCount = sel.vouchersByStatus("delivered").length;
    var processed = s.aidRequests.filter(function (r) { return r.status === "delivered" || r.status === "voucher"; }).length;
    var lastAudit = s.auditTrail.slice(-3).reverse();

    container.innerHTML =
      '<div class="pub">' +

      /* ===== الرأس ===== */
      '<header class="pub-header"><div class="pub-wrap"><div class="bar">' +
      ui.BrandMark({ onDark: true }) +
      '<nav>' +
      '<a href="#about">عن المنصة</a><a href="#services">الخدمات</a><a href="#modules">الوحدات</a>' +
      '<a href="#coverage">التغطية</a><a href="#trust">الشفافية</a>' +
      "</nav>" +
      '<div class="actions">' +
      '<a class="btn-ghost-light" href="#/login">' + ui.icon("lock", 15) + " تسجيل الدخول</a>" +
      "</div></div></div></header>" +

      /* ===== الواجهة ===== */
      '<section class="hero"><div class="pub-wrap"><div class="hero-in">' +
      "<div>" +
      '<div class="eyebrow"><span class="dot"></span> منصة وطنية واحدة · 22 محافظة</div>' +
      "<h1>كل دولار مساعدة، من تعهّد المانح حتى يد المستفيد</h1>" +
      '<p class="lede">منصة وطنية تمنح كل مواطن هوية رقمية موحّدة يُتحقق منها حتى بلا إنترنت، وتتيح له طلب المساعدة عبر أي قناة متاحة، وتتتبّع كل عملية بسجل تشفيري غير قابل للتعديل.</p>' +
      '<div class="hero-cta">' +
      '<a class="btn btn-primary" href="#/login">' + ui.icon("lock", 18) + "<span>الدخول إلى المنصة</span></a>" +
      '<a class="btn-ghost-light" href="#services">' + ui.icon("chevron", 15) + " تعرّف على الخدمات</a>" +
      "</div>" +
      '<div class="hero-trust">' +
      '<span class="ht">' + ui.icon("shield", 16) + " تشفير الحقول الحساسة</span>" +
      '<span class="ht">' + ui.icon("sync", 16) + " يعمل بلا اتصال في الميدان</span>" +
      '<span class="ht">' + ui.icon("lock", 16) + " سجل تدقيق غير قابل للتعديل</span>" +
      "</div></div>" +

      '<div class="hero-card">' +
      '<div class="hc-head">' +
      '<div><b>التغطية الوطنية الحيّة</b><span>محدَّثة من عمليات الصرف</span></div>' +
      '<div class="hc-stat"><b>' + sel.nationalCoverage() + '%</b><span>متوسط الجمهورية</span></div>' +
      "</div>" +
      '<div id="hero-map-host"></div>' +
      '<div class="hero-legend">' +
      '<span><i style="background:#2E7D5B"></i>70% فأعلى</span>' +
      '<span><i style="background:#B5811F"></i>40–69%</span>' +
      '<span><i style="background:#B03A2E"></i>أقل من 40%</span>' +
      "</div>" +
      "</div>" +
      "</div></div></section>" +

      /* ===== شريط الأرقام ===== */
      '<section class="stat-strip"><div class="pub-wrap"><div class="sg">' +
      stat(ui.fmtNum(s.governorates.length), "محافظة مغطّاة") +
      stat(ui.fmtNum(sel.verifiedBeneficiariesCount()), "مستفيد تحقّق فعلياً") +
      stat(ui.fmtNum(deliveredCount), "قسيمة مصروفة") +
      stat(ui.fmtNum(s.auditTrail.length), "حلقة في سجل التدقيق") +
      "</div></div></section>" +

      /* ===== عن المنصة ===== */
      '<section class="section" id="about"><div class="pub-wrap"><div class="split">' +
      "<div>" +
      '<div class="section-head" style="margin-bottom:0">' +
      '<div class="kicker">تعريف المنتج</div>' +
      "<h2>منصة واحدة، لا ثلاثة أنظمة متجاورة</h2>" +
      "<p>نموذج بيانات واحد، وواجهة برمجية واحدة، وهوية بصرية واحدة. يُقاس نجاح المنصة بمعيار واحد: أن يُنتج رقم وطني واحد أثراً مترابطاً عبر النظام كله — من التسجيل الميداني حتى ظهور الحدث في خارطة التغطية ولوحة المانح.</p>" +
      "</div>" +
      '<ul class="checklist">' +
      '<li><span class="ck">' + ui.icon("check", 14) + "</span><div><b>مصدر حقيقة واحد للهوية</b><span>الرقم الوطني يُخزَّن مجزّأً بقيد تفرّد، ولا يُحفظ خاماً في أي مكان.</span></div></li>" +
      '<li><span class="ck">' + ui.icon("check", 14) + "</span><div><b>الأرقام المتحققة تُحسب لا تُخزَّن</b><span>عدد من وصلتهم المساعدة = عدّ القسائم المصروفة فعلاً، فلا رقمان متعارضان.</span></div></li>" +
      '<li><span class="ck">' + ui.icon("check", 14) + "</span><div><b>كل منطق حسّاس في الخادم</b><span>نقاط الهشاشة والمُهل وأرقام القسائم — لا يمكن التأثير فيها من المتصفح.</span></div></li>" +
      "</ul></div>" +
      '<div class="panel-dark">' +
      "<h3>أحدث ما وُثّق في السلسلة</h3>" +
      lastAudit.map(function (e) {
        return '<div class="chain-row"><span class="cd">' + ui.icon("lock", 15) + "</span>" +
          '<span class="ct"><b>' + ui.esc(e.eventType) + " · " + ui.esc(e.entityId) + "</b>" +
          "<span>" + e.hash.slice(0, 34) + "…</span></span></div>";
      }).join("") +
      '<p style="font-size:12px;color:rgba(255,255,255,.55);margin-top:16px;line-height:1.8">سبعة أحداث فقط تُوثَّق في السلسلة — إصدار هوية، اعتماد ورفض طلب، إصدار وصرف قسيمة، تعديل صلاحيات، وتخصيص منحة.</p>' +
      "</div></div></div></section>" +

      /* ===== الخدمات ===== */
      '<section class="section alt" id="services"><div class="pub-wrap">' +
      '<div class="section-head center">' +
      '<div class="kicker">للمواطن</div>' +
      "<h2>أربع خدمات أساسية، بلا وسيط</h2>" +
      "<p>كل ما يحتاجه المستفيد من لحظة التسجيل حتى استلام المساعدة وتقديم بلاغ عند الحاجة.</p>" +
      "</div>" +
      '<div class="svc-grid">' + SERVICES.map(function (v) {
        return '<div class="svc"><div class="ic">' + ui.icon(v.icon, 22) + "</div>" +
          "<h3>" + ui.esc(v.title) + "</h3><p>" + ui.esc(v.text) + "</p></div>";
      }).join("") + "</div></div></section>" +

      /* ===== دورة الحياة ===== */
      '<section class="section"><div class="pub-wrap">' +
      '<div class="section-head center">' +
      '<div class="kicker">كيف تعمل</div>' +
      "<h2>الخيط الواحد من التسجيل حتى التدقيق</h2>" +
      "<p>ست خطوات مترابطة؛ إن انقطع الخيط في أي نقطة فنحن أمام وحدات متجاورة لا منصة واحدة.</p>" +
      "</div>" +
      '<div class="flow">' + FLOW.map(function (f, i) {
        return '<div class="fl' + (f.gold ? " gold" : "") + '"><div class="n">' + (i + 1) + "</div>" +
          "<b>" + ui.esc(f.t) + "</b><span>" + ui.esc(f.s) + "</span></div>";
      }).join("") + "</div></div></section>" +

      /* ===== الوحدات ===== */
      '<section class="section alt" id="modules"><div class="pub-wrap">' +
      '<div class="section-head center">' +
      '<div class="kicker">البنية</div>' +
      "<h2>تسع وحدات وظيفية في منتج واحد</h2>" +
      "<p>لا وحدة تقرأ من قاعدة وحدة أخرى مباشرة، وكل وحدة تكتب في سجل التدقيق عند كل عملية حسّاسة.</p>" +
      "</div>" +
      '<div class="mod-grid">' + MODULES.map(function (m) {
        return '<div class="modc"><span class="id">' + m.id + "</span>" +
          "<div><h4>" + ui.esc(m.title) + "</h4><p>" + ui.esc(m.text) + "</p></div></div>";
      }).join("") + "</div></div></section>" +

      /* ===== التغطية ===== */
      '<section class="section" id="coverage"><div class="pub-wrap">' +
      '<div class="section-head center">' +
      '<div class="kicker">الوصول</div>' +
      "<h2>خارطة تغطية محسوبة من الصرف الفعلي</h2>" +
      "<p>لا رقم تغطية مخزّن يدوياً: ما تراه هنا هو نفسه ما يراه المانح والرقيب في لوحاتهم.</p>" +
      "</div>" +
      '<div class="card" style="padding:26px"><div id="cov-map-host"></div>' + ui.mapLegend() + "</div>" +
      '<div class="grid g4" style="margin-top:var(--s4)">' +
      ui.MetricCard({ value: sel.nationalCoverage() + "%", label: "التغطية الوطنية" }) +
      ui.MetricCard({ value: ui.fmtNum(processed), label: "طلب وصل مرحلة القسيمة" }) +
      ui.MetricCard({ value: sel.avgReviewTimeHours() + " س", label: "متوسط زمن الفحص" }) +
      ui.MetricCard({ value: ui.fmtNum(s.distributionSites.length), label: "مركز توزيع" }) +
      "</div></div></section>" +

      /* ===== الشفافية ===== */
      '<section class="section alt" id="trust"><div class="pub-wrap"><div class="split">' +
      '<div class="panel-dark">' +
      "<h3>قنوات المساءلة</h3>" +
      '<div class="chain-row"><span class="cd">' + ui.icon("alert", 15) + '</span><span class="ct"><b>فئة أمنية وحماية</b><span style="font-family:inherit;direction:rtl">استجابة خلال 4 ساعات · تفتح أزمة ميدانية تلقائياً</span></span></div>' +
      '<div class="chain-row"><span class="cd">' + ui.icon("briefcase", 15) + '</span><span class="ct"><b>فئة مالية وفساد</b><span style="font-family:inherit;direction:rtl">استجابة خلال 24 ساعة · تحقيق موثّق</span></span></div>' +
      '<div class="chain-row"><span class="cd">' + ui.icon("clock", 15) + '</span><span class="ct"><b>فئة تشغيلية</b><span style="font-family:inherit;direction:rtl">استجابة خلال 48 ساعة · متابعة برقم بلا تسجيل دخول</span></span></div>' +
      "</div>" +
      "<div>" +
      '<div class="section-head" style="margin-bottom:0">' +
      '<div class="kicker">الحماية والمساءلة</div>' +
      "<h2>البلاغ المجهول مقبول، لأن اشتراط الهوية يقتل القناة</h2>" +
      "<p>من يتعرّض لابتزاز أو منع وصول لا يستطيع كشف اسمه. لذلك حقل الاسم اختياري تماماً، ويتابع المواطن بلاغه برقم متابعة دون أي تسجيل دخول.</p>" +
      "</div>" +
      '<ul class="checklist">' +
      '<li><span class="ck">' + ui.icon("check", 14) + "</span><div><b>تصعيد آلي</b><span>البلاغ الأمني يفتح أزمة ميدانية في محافظته ويُخطر منسق الطوارئ فوراً.</span></div></li>" +
      '<li><span class="ck">' + ui.icon("check", 14) + "</span><div><b>لا إغلاق قبل المعالجة</b><span>لا يمكن إغلاق البلاغ قبل إغلاق الأزمة المرتبطة به.</span></div></li>" +
      '<li><span class="ck">' + ui.icon("check", 14) + "</span><div><b>سجل يُقرأ ولا يُكتب من الخارج</b><span>لا مسار كتابة عام في سجل التدقيق — السجل الذي يُكتب فيه من الخارج ليس سجل تدقيق.</span></div></li>" +
      "</ul></div>" +
      "</div></div></section>" +

      /* ===== الشركاء ===== */
      '<section class="section"><div class="pub-wrap">' +
      '<div class="section-head center"><div class="kicker">التمويل</div>' +
      "<h2>جهات ممولة ترى أثر منحها لحظياً</h2>" +
      "<p>كل مانح يرى منحه هو فقط، بعزل على مستوى الاستعلام لا على مستوى الواجهة.</p></div>" +
      '<div class="partners">' + s.donors.map(function (d) {
        return '<div class="partner"><span class="pc">' + ui.esc(d.code) + "</span>" + ui.esc(d.name) + "</div>";
      }).join("") + "</div></div></section>" +

      /* ===== دعوة ===== */
      '<section class="cta-band"><div class="pub-wrap"><div class="cta-in">' +
      "<div><h2>ادخل بأي دور وجرّب المنصة كاملة</h2>" +
      "<p>عشرة أدوار، أربع وثلاثون شاشة، وبيانات واقعية جاهزة — يمكنك تتبّع طلب من لحظة تقديمه حتى صرف قسيمته وظهوره في سجل التدقيق.</p></div>" +
      '<a class="btn-light" href="#/login">' + ui.icon("chevron", 18) + "<span>ابدأ التجربة الآن</span></a>" +
      "</div></div></section>" +

      /* ===== التذييل ===== */
      '<footer class="pub-footer"><div class="pub-wrap">' +
      '<div class="foot-grid">' +
      "<div>" + ui.BrandMark({ onDark: true }) +
      "<p>منصة وطنية واحدة للخدمات الرقمية الطارئة: هوية موحّدة، ودورة مساعدة كاملة، وشفافية تشفيرية تفتحها الجهات الرقابية متى شاءت.</p></div>" +
      '<div class="foot-col"><b>الخدمات</b><a href="#/login">تقديم طلب مساعدة</a><a href="#/login">تتبّع طلب</a><a href="#/login">استعراض قسيمة</a><a href="#/login">تقديم بلاغ</a></div>' +
      '<div class="foot-col"><b>المنصة</b><a href="#about">عن المنصة</a><a href="#modules">الوحدات التسع</a><a href="#coverage">خارطة التغطية</a><a href="#trust">الشفافية</a></div>' +
      '<div class="foot-col"><b>الوصول</b><a href="#/login">لوحات الموظفين</a><a href="#/login">بوابة المانح</a><a href="#/login">حساب التكامل (API)</a><a href="#/login">تطبيق الميدان</a></div>' +
      "</div>" +
      '<div class="foot-bottom"><span>NAT-2026-YEDSP · جميع الأرقام بصيغة لاتينية (0-9) في كل الواجهات والتصدير</span>' +
      '<span class="demo-note">عرض تجريبي — لا خادم ولا بيانات حقيقية</span></div>' +
      "</div></footer>" +
      "</div>";

    /* الخرائط: نسخة مصغّرة في الواجهة ونسخة كاملة في قسم التغطية */
    // خارطة الواجهة صغيرة الحجم: نسب فقط بلا أسماء حتى تبقى مقروءة
    var heroHost = container.querySelector("#hero-map-host");
    if (heroHost) {
      heroHost.innerHTML = ui.GovMap(s.governorates, function (g) { return sel.coveragePercent(g.id); }, { showNames: false })
        .replace('class="gov-map"', 'class="gov-map hero-map"');
    }

    // خارطة قسم التغطية: بالأسماء والتلميح التفاعلي
    var openCrises = {};
    s.crises.forEach(function (c) {
      if (c.status !== "مغلقة") openCrises[c.governorateId] = (openCrises[c.governorateId] || 0) + 1;
    });
    var covHost = container.querySelector("#cov-map-host");
    if (covHost) {
      covHost.innerHTML = ui.GovMap(s.governorates, function (g) { return sel.coveragePercent(g.id); });
      ui.bindGovMap(covHost, function () { YEDSP.router.navigate("#/login"); });
      ui.bindGovMapTooltip(covHost, function (govId) {
        var g = sel.governorate(govId);
        if (!g) return "";
        var delivered = s.vouchers.filter(function (v) { return v.governorateId === govId && v.status === "delivered"; }).length;
        var crises = openCrises[govId] || 0;
        return "<b>" + ui.esc(g.name) + "</b>" +
          '<div class="tr"><span>نسبة التغطية</span><span>' + sel.coveragePercent(govId) + "%</span></div>" +
          '<div class="tr"><span>قسائم مصروفة</span><span>' + ui.fmtNum(delivered) + "</span></div>" +
          '<div class="tr' + (crises ? " tcrit" : "") + '"><span>أزمات مفتوحة</span><span>' + ui.fmtNum(crises) + "</span></div>";
      });
    }

    /* تمرير ناعم لروابط الأقسام الداخلية دون تغيير الهاش (حتى لا يلتقطها الموجّه) */
    container.querySelectorAll('a[href^="#"]:not([href^="#/"])').forEach(function (a) {
      a.addEventListener("click", function (e) {
        var target = container.querySelector(a.getAttribute("href"));
        if (target) { e.preventDefault(); target.scrollIntoView({ behavior: "smooth", block: "start" }); }
      });
    });
  }

  YEDSP.views = YEDSP.views || {};
  YEDSP.views.landing = { render: render };
})(window);
