/* =====================================================================
   YEDSP DEMO — data/seed.js
   كل البيانات الوهمية تعيش هنا فقط. يُبنى الملف مرة واحدة عند التحميل
   عبر مولّد أرقام عشوائية بذرته ثابتة (deterministic) حتى تبدو المنصة
   حيّة وواقعية لكن مستقرة بين مرات التحميل المتكررة لنفس الجلسة.
   ===================================================================== */
(function (global) {
  "use strict";

  /* ---------- مولّد أرقام شبه عشوائي بذرة ثابتة ---------- */
  function mulberry32(a) {
    return function () {
      a |= 0; a = (a + 0x6D2B79F5) | 0;
      var t = Math.imul(a ^ (a >>> 15), 1 | a);
      t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
  }
  var rnd = mulberry32(20260908);
  function pick(arr) { return arr[Math.floor(rnd() * arr.length)]; }
  function pickWeighted(pairs) {
    // pairs: [[value, weight], ...]
    var total = pairs.reduce(function (s, p) { return s + p[1]; }, 0);
    var r = rnd() * total;
    for (var i = 0; i < pairs.length; i++) {
      r -= pairs[i][1];
      if (r <= 0) return pairs[i][0];
    }
    return pairs[pairs.length - 1][0];
  }
  function randInt(min, max) { return Math.floor(rnd() * (max - min + 1)) + min; }
  function pad(n, len) { n = String(n); while (n.length < len) n = "0" + n; return n; }
  function fakeHash(seedStr) {
    var s = String(seedStr), out = "";
    var h1 = 0x811c9dc5 >>> 0;
    for (var i = 0; i < s.length; i++) {
      h1 ^= s.charCodeAt(i);
      h1 = Math.imul(h1, 0x01000193) >>> 0;
    }
    var g = mulberry32(h1);
    var hex = "0123456789abcdef";
    for (var k = 0; k < 64; k++) out += hex[Math.floor(g() * 16)];
    return out;
  }
  function hoursAgo(h) { return Date.now() - h * 3600 * 1000; }
  function daysAgo(d) { return hoursAgo(d * 24); }

  /* ================= المرجعيات: المحافظات ================= */
  // إحداثيات الحدود الحقيقية لكل محافظة موجودة في data/geo.js (مسارات SVG)
  // وتُقرأ من هناك عبر المعرّف id — هذا الجدول للبيانات الوصفية فقط.
  var GOVERNORATES = [
    { id: "gov-sadah",    name: "صعدة",             weight: "med" },
    { id: "gov-hajjah",   name: "حجة",              weight: "med" },
    { id: "gov-jawf",     name: "الجوف",             weight: "low" },
    { id: "gov-amran",    name: "عمران",            weight: "med" },
    { id: "gov-mahwit",   name: "المحويت",          weight: "low" },
    { id: "gov-sanaa-c",  name: "أمانة العاصمة",     weight: "high" },
    { id: "gov-marib",    name: "مأرب",             weight: "med" },
    { id: "gov-mahra",    name: "المهرة",           weight: "low" },
    { id: "gov-raymah",   name: "ريمة",             weight: "low" },
    { id: "gov-hodeidah", name: "الحديدة",          weight: "high" },
    { id: "gov-sanaa",    name: "صنعاء",            weight: "high" },
    { id: "gov-hadhramout", name: "حضرموت",         weight: "high" },
    { id: "gov-dhamar",   name: "ذمار",             weight: "med" },
    { id: "gov-bayda",    name: "البيضاء",          weight: "med" },
    { id: "gov-shabwah",  name: "شبوة",             weight: "low" },
    { id: "gov-ibb",      name: "إب",               weight: "high" },
    { id: "gov-taiz",     name: "تعز",              weight: "high" },
    { id: "gov-dhalie",   name: "الضالع",           weight: "low" },
    { id: "gov-lahj",     name: "لحج",              weight: "med" },
    { id: "gov-aden",     name: "عدن",              weight: "med" },
    { id: "gov-abyan",    name: "أبين",             weight: "med" },
    { id: "gov-socotra",  name: "أرخبيل سقطرى",     weight: "low" }
  ];
  var WEIGHT_VAL = { high: 5, med: 3, low: 1.4 };
  GOVERNORATES.forEach(function (g) { g.popWeight = WEIGHT_VAL[g.weight]; });

  /* ================= القطاعات ================= */
  var SECTORS = [
    { id: "sec-food",   name: "الأمن الغذائي" },
    { id: "sec-wash",   name: "المياه والإصحاح" },
    { id: "sec-health", name: "الصحة والتغذية" },
    { id: "sec-shelter", name: "المأوى والمواد" },
    { id: "sec-edu",    name: "التعليم والحماية" }
  ];

  /* ================= مراكز التوزيع ================= */
  var DISTRIBUTION_SITES = [];
  (function buildSites() {
    var seq = 1;
    GOVERNORATES.forEach(function (g) {
      var count = g.weight === "high" ? 2 : 1;
      for (var i = 0; i < count; i++) {
        DISTRIBUTION_SITES.push({
          id: "site-" + pad(seq++, 3),
          name: "مركز توزيع " + g.name + (i === 1 ? " — الطرف الشرقي" : ""),
          governorateId: g.id
        });
      }
    });
  })();
  function sitesFor(govId) { return DISTRIBUTION_SITES.filter(function (s) { return s.governorateId === govId; }); }

  /* ================= بنوك الأسماء ================= */
  var MALE_NAMES = ["أحمد", "محمد", "علي", "عبدالله", "خالد", "ياسر", "سامي", "فيصل", "وليد", "ماجد",
    "حسين", "عمر", "طارق", "نبيل", "رامي", "هاني", "سعيد", "فهد", "بندر", "ناصر", "عادل", "زياد", "منصور", "صالح"];
  var FEMALE_NAMES = ["فاطمة", "مريم", "سارة", "نور", "هدى", "أمل", "رنا", "سمر", "إيمان", "لمياء",
    "بشرى", "وفاء", "نجاة", "سلمى", "ريم", "أسماء", "غادة", "منى", "هيفاء", "شيماء", "آمنة", "خديجة", "زينب", "عبير"];
  var FAMILY_NAMES = ["الحضرمي", "العولقي", "الشرعبي", "الحميري", "القحطاني", "الزبيدي", "المخلافي", "الصبري",
    "العمري", "الجنيد", "باعباد", "باوزير", "الشامي", "الربيعي", "السامعي", "المقطري", "الشميري", "الآنسي",
    "الوصابي", "الحيدري", "المطري", "النهاري", "الكميم", "السقاف"];
  function personName() {
    var isMale = rnd() < 0.52;
    var first = isMale ? pick(MALE_NAMES) : pick(FEMALE_NAMES);
    return { name: first + " " + pick(FAMILY_NAMES), gender: isMale ? "m" : "f" };
  }
  function govByWeight() {
    return pickWeighted(GOVERNORATES.map(function (g) { return [g, g.popWeight]; }));
  }

  /* ================= المستفيدون (المواطنون) ================= */
  var CITIZENS = [];
  (function buildCitizens() {
    for (var i = 1; i <= 40; i++) {
      var p = personName();
      var gov = govByWeight();
      var income = pickWeighted([["none", 3], ["low", 5], ["medium", 2]]);
      CITIZENS.push({
        id: "CIT-" + pad(i, 4),
        name: p.name,
        gender: p.gender,
        maskedNationalId: "***-***-" + pad(randInt(1000, 9999), 4),
        governorateId: gov.id,
        phone: "7" + pick(["7", "3", "1", "0"]) + randInt(1000000, 9999999),
        familySize: randInt(1, 9),
        hasDisability: rnd() < 0.15,
        hasPregnantOrNursing: p.gender === "f" && rnd() < 0.18,
        incomeLevel: income,
        breadwinnerStatus: pickWeighted([["present", 5], ["absent", 2], ["female", 2], ["disabled", 1]]),
        registrationChannel: pickWeighted([["ميداني", 5], ["ويب", 2], ["USSD", 2], ["خط ساخن", 1]]),
        registeredAt: daysAgo(randInt(10, 240))
      });
    }
  })();

  function vulnerabilityScore(c) {
    var s = 0;
    s += Math.min(c.familySize, 9) * 4.2;
    s += c.hasDisability ? 16 : 0;
    s += c.hasPregnantOrNursing ? 12 : 0;
    s += c.incomeLevel === "none" ? 22 : c.incomeLevel === "low" ? 12 : 2;
    s += c.breadwinnerStatus === "absent" ? 18 : c.breadwinnerStatus === "female" ? 10 : c.breadwinnerStatus === "disabled" ? 14 : 0;
    return Math.max(5, Math.min(99, Math.round(s)));
  }

  /* ================= المستخدمون (الحسابات الموظّفية) ================= */
  var USERS = [];
  (function buildUsers() {
    var defs = [
      ["surveyor", "مسّاح ميداني"], ["surveyor", "مسّاحة ميدانية"],
      ["field_coordinator", "منسق طوارئ"],
      ["ops_manager", "مدير الاستجابة"],
      ["reviewer", "موظف فحص"], ["reviewer", "موظفة فحص"],
      ["distributor", "موظف مركز توزيع"],
      ["auditor", "مسؤول حماية ومساءلة"],
      ["donor", "منسّق شراكات المانح"],
      ["admin", "مشرف عام للمنصة"],
      ["integrator", "حساب نظام آلي"]
    ];
    defs.forEach(function (d, i) {
      var p = personName();
      USERS.push({
        id: "USR-" + pad(i + 1, 3),
        name: d[0] === "integrator" ? "حساب المزامنة — منظمة الشريك التقني" : p.name,
        role: d[0],
        title: d[1],
        governorateId: govByWeight().id,
        active: true,
        twoFactorEnabled: ["reviewer", "distributor", "auditor", "admin"].indexOf(d[0]) >= 0
      });
    });
  })();
  function usersByRole(role) { return USERS.filter(function (u) { return u.role === role; }); }

  /* ================= الطلبات ================= */
  var REJECTION_REASONS = [
    "عدم استيفاء معايير الأهلية المعتمدة لهذا القطاع",
    "ازدواجية مع طلب نشط سابق لنفس المستفيد في القطاع نفسه",
    "نقص في وثائق التحقق من الهوية عند المسّاح الميداني",
    "المستفيد مسجَّل ضمن دورة صرف سابقة لم تنتهِ مهلتها بعد"
  ];
  var STATUS_FLOW = ["draft", "submitted", "reviewing", "approved", "rejected", "voucher", "delivered"];
  var AID_REQUESTS = [];
  (function buildRequests() {
    var statusPool = []
      .concat(Array(3).fill("draft"))
      .concat(Array(9).fill("submitted"))
      .concat(Array(11).fill("reviewing"))
      .concat(Array(8).fill("approved"))
      .concat(Array(6).fill("rejected"))
      .concat(Array(11).fill("voucher"))
      .concat(Array(12).fill("delivered"));
    for (var i = 0; i < 60; i++) {
      var citizen = pick(CITIZENS);
      var sector = pick(SECTORS);
      var status = statusPool[i] || pick(STATUS_FLOW);
      var submittedAt = daysAgo(randInt(0, 26)) - randInt(0, 20) * 3600 * 1000;
      var sla = submittedAt + 24 * 3600 * 1000;
      var vscore = Math.min(99, Math.max(5, vulnerabilityScore(citizen) + randInt(-6, 6)));
      var reviewer = pick(usersByRole("reviewer"));
      var req = {
        id: "REQ-2026-" + pad(1000 + i, 4),
        citizenId: citizen.id,
        sectorId: sector.id,
        governorateId: citizen.governorateId,
        status: status,
        vulnerabilityScore: vscore,
        submittedAt: submittedAt,
        slaDeadline: sla,
        decidedAt: null,
        decidedByUserId: null,
        rejectionReason: null,
        notes: "طلب مساعدة ضمن قطاع " + sector.name + " لأسرة مكوّنة من " + citizen.familySize + " أفراد.",
        history: [
          { at: submittedAt, actor: citizen.name, action: "تقديم الطلب", note: "عبر قناة " + citizen.registrationChannel }
        ]
      };
      if (status !== "draft" && status !== "submitted") {
        var decideAt = submittedAt + randInt(2, 30) * 3600 * 1000;
        req.decidedAt = Math.min(decideAt, Date.now() - 1000);
        req.decidedByUserId = reviewer ? reviewer.id : null;
        req.history.push({ at: req.decidedAt, actor: reviewer ? reviewer.name : "موظف فحص", action: "بدء الفحص", note: "" });
        if (status === "rejected") {
          req.rejectionReason = pick(REJECTION_REASONS);
          req.history.push({ at: req.decidedAt, actor: reviewer ? reviewer.name : "موظف فحص", action: "رفض الطلب", note: req.rejectionReason });
        } else {
          req.history.push({ at: req.decidedAt, actor: reviewer ? reviewer.name : "موظف فحص", action: "اعتماد الطلب", note: "" });
        }
      }
      AID_REQUESTS.push(req);
    }
  })();

  /* ================= القسائم ================= */
  var SECTOR_AMOUNTS = { "sec-food": 65000, "sec-wash": 38000, "sec-health": 52000, "sec-shelter": 120000, "sec-edu": 45000 };
  var VOUCHERS = [];
  (function buildVouchers() {
    var seq = 1;
    AID_REQUESTS.filter(function (r) { return r.status === "voucher" || r.status === "delivered"; })
      .forEach(function (r) {
        var citizen = CITIZENS.filter(function (c) { return c.id === r.citizenId; })[0];
        var sites = sitesFor(r.governorateId);
        var site = sites.length ? pick(sites) : pick(DISTRIBUTION_SITES);
        var issuedAt = r.decidedAt + 3600 * 1000;
        var v = {
          id: "VCH-2026-" + pad(seq++, 4),
          requestId: r.id,
          citizenId: r.citizenId,
          sectorId: r.sectorId,
          governorateId: r.governorateId,
          siteId: site.id,
          amount: SECTOR_AMOUNTS[r.sectorId] + randInt(-3000, 3000),
          code: "YEDSP-" + r.id + "-" + fakeHash(r.id).slice(0, 8).toUpperCase(),
          pinMasked: "••••",
          pinHash: fakeHash(r.id + "pin"),
          issuedAt: issuedAt,
          expiresAt: issuedAt + 30 * 24 * 3600 * 1000,
          status: r.status === "delivered" ? "delivered" : "issued",
          deliveredAt: null,
          deliveredByUserId: null
        };
        if (v.status === "delivered") {
          var dist = pick(usersByRole("distributor"));
          v.deliveredAt = issuedAt + randInt(4, 200) * 3600 * 1000;
          v.deliveredByUserId = dist ? dist.id : null;
        }
        VOUCHERS.push(v);
      });
    // إضافة قسائم منتهية الصلاحية لإثراء التنويع
    for (var i = 0; i < 3; i++) {
      var oldReq = pick(AID_REQUESTS.filter(function (r) { return r.status === "voucher"; }));
      if (!oldReq) continue;
      var oldIssued = daysAgo(randInt(32, 55));
      VOUCHERS.push({
        id: "VCH-2026-" + pad(seq++, 4),
        requestId: oldReq.id, citizenId: oldReq.citizenId, sectorId: oldReq.sectorId,
        governorateId: oldReq.governorateId, siteId: pick(DISTRIBUTION_SITES).id,
        amount: SECTOR_AMOUNTS[oldReq.sectorId], code: "YEDSP-" + oldReq.id + "-EXP" + i,
        pinMasked: "••••", pinHash: fakeHash(oldReq.id + "exp"), issuedAt: oldIssued,
        expiresAt: oldIssued + 30 * 24 * 3600 * 1000, status: "expired", deliveredAt: null, deliveredByUserId: null
      });
    }
  })();

  /* ================= البلاغات ================= */
  var COMPLAINT_CATS = [
    { code: "S", name: "أمنية وحماية", slaHours: 4 },
    { code: "F", name: "مالية وفساد", slaHours: 24 },
    { code: "O", name: "تشغيلية", slaHours: 48 }
  ];
  var COMPLAINT_SAMPLES = {
    S: ["تهديد من أحد الوسطاء مقابل تسريع الطلب", "منع امرأة من الوصول إلى نقطة التوزيع", "محاولة ابتزاز مقابل تسليم القسيمة", "استغلال مسّاح ميداني لبيانات مستفيدة"],
    F: ["طلب مبلغ مالي مقابل تسريع الاعتماد", "اقتطاع جزء من كمية المساعدة عند التسليم", "محاباة أقارب أحد الموظفين في الطابور", "بيع قسائم مساعدة في السوق المحلي"],
    O: ["تأخر توزيع المساعدة عن الموعد المعلن أكثر من أسبوع", "نقص في كمية المواد الغذائية المسلَّمة", "بُعد مركز التوزيع عن مكان سكن المستفيدين", "ازدحام شديد بلا تنظيم عند نقطة الصرف"]
  };
  var COMPLAINT_STATUSES = ["جديد", "قيد الفرز", "قيد التحقيق", "مغلق"];
  var COMPLAINTS = [];
  (function buildComplaints() {
    var counts = { S: 4, F: 5, O: 6 };
    var seq = 1, anonCount = 0, escCount = 0;
    Object.keys(counts).forEach(function (code) {
      for (var i = 0; i < counts[code]; i++) {
        var gov = govByWeight();
        var isAnon = (anonCount < 3 && (rnd() < 0.45 || (counts[code] - i) <= (3 - anonCount)));
        if (isAnon) anonCount++;
        var createdAt = daysAgo(randInt(0, 20));
        var status = pick(COMPLAINT_STATUSES);
        var mustEscalate = code === "S" && escCount < 2 && status !== "جديد";
        var c = {
          id: "CMP-2026-" + pad(seq++, 4),
          trackingCode: "YSP-" + randInt(100000, 999999),
          category: code,
          categoryName: COMPLAINT_CATS.filter(function (x) { return x.code === code; })[0].name,
          slaHours: COMPLAINT_CATS.filter(function (x) { return x.code === code; })[0].slaHours,
          governorateId: gov.id,
          description: pick(COMPLAINT_SAMPLES[code]),
          anonymous: isAnon,
          reporterName: isAnon ? null : personName().name,
          reporterPhone: isAnon ? null : "7" + randInt(10000000, 99999999),
          createdAt: createdAt,
          status: mustEscalate ? "قيد التحقيق" : status,
          linkedCrisisId: null,
          channel: pick(["هاتف", "ويب", "USSD", "ميداني"])
        };
        if (mustEscalate) { c._pendingEscalation = true; escCount++; }
        COMPLAINTS.push(c);
      }
    });
  })();

  /* ================= الأزمات ================= */
  var CRISIS_SEVERITIES = ["منخفضة", "متوسطة", "عالية"];
  var CRISIS_STATUSES = ["مفتوحة", "قيد المعالجة", "مغلقة"];
  var CRISIS_SAMPLES = ["نقص حاد في مياه الشرب الآمنة", "انتشار حالات إسهال حاد بين الأطفال", "نزوح جماعي مفاجئ لعدة أسر",
    "تضرر خط إمداد المساعدات بسبب السيول", "اشتباك مسلح بالقرب من نقطة التوزيع", "انهيار جزئي في طريق الوصول الرئيسي",
    "تفشي مرض جلدي في مخيم نزوح", "نقص حاد في الوقود اللازم لنقل المساعدات", "ارتفاع غير معتاد في حالات سوء التغذية", "تعطل شبكة الاتصالات في المنطقة"];
  var CRISES = [];
  (function buildCrises() {
    var escalatable = COMPLAINTS.filter(function (c) { return c._pendingEscalation; });
    var seq = 1;
    escalatable.forEach(function (c) {
      var openedAt = c.createdAt + randInt(1, 3) * 3600 * 1000;
      var crisis = {
        id: "CRS-2026-" + pad(seq++, 3),
        title: "تصعيد بلاغ أمني: " + c.description,
        governorateId: c.governorateId,
        severity: "عالية",
        status: pick(["مفتوحة", "قيد المعالجة"]),
        openedAt: openedAt,
        linkedComplaintId: c.id,
        reportedByUserId: null
      };
      CRISES.push(crisis);
      c.linkedCrisisId = crisis.id;
      delete c._pendingEscalation;
    });
    while (CRISES.length < 10) {
      var gov = govByWeight();
      var coord = pick(usersByRole("field_coordinator").concat(usersByRole("surveyor")));
      CRISES.push({
        id: "CRS-2026-" + pad(seq++, 3),
        title: pick(CRISIS_SAMPLES),
        governorateId: gov.id,
        severity: pick(CRISIS_SEVERITIES),
        status: pick(CRISIS_STATUSES),
        openedAt: daysAgo(randInt(0, 25)),
        linkedComplaintId: null,
        reportedByUserId: coord ? coord.id : null
      });
    }
  })();

  /* ================= التكليفات الميدانية ================= */
  var SURVEYORS = usersByRole("surveyor");
  var EXTRA_SURVEYOR_NAMES = ["أنور الحيدري", "سلمى العولقي", "يحيى القحطاني", "رشا الزبيدي", "فارس الصبري"];
  // نضمن أن أول حساب مسّاح (وهو من "يسجّل دخوله" في تبديل الأدوار) يملك حصة واضحة
  // من التكليفات حتى تكون شاشة "تكليفاتي" ذات معنى فور الدخول بدور المسّاح.
  var SURVEYOR_NAME_POOL = SURVEYORS.map(function (u) { return u.name; }).concat(EXTRA_SURVEYOR_NAMES);
  var PRIMARY_SURVEYOR_NAME = SURVEYORS.length ? SURVEYORS[0].name : EXTRA_SURVEYOR_NAMES[0];
  var FIELD_ASSIGNMENTS = [];
  (function buildAssignments() {
    for (var i = 1; i <= 20; i++) {
      var gov = govByWeight();
      var sites = sitesFor(gov.id);
      var target = randInt(15, 60);
      var completed = randInt(0, target);
      var status = completed >= target ? "مكتمل" : (rnd() < 0.25 ? "متأخر" : "نشط");
      FIELD_ASSIGNMENTS.push({
        id: "ASG-" + pad(i, 3),
        surveyorName: i <= 7 ? PRIMARY_SURVEYOR_NAME : pick(SURVEYOR_NAME_POOL),
        governorateId: gov.id,
        siteId: sites.length ? pick(sites).id : pick(DISTRIBUTION_SITES).id,
        target: target,
        completed: completed,
        status: status,
        startedAt: daysAgo(randInt(2, 30)),
        dueAt: daysAgo(randInt(-10, 5))
      });
    }
  })();

  /* ================= سجل المخاطر ================= */
  var RISK_REGISTER = [
    { id: "RSK-01", title: "انقطاع الاتصال في مناطق خطوط التماس", probability: "عالية", impact: "عالية", mitigation: "تفعيل وضع العمل بلا اتصال ومزامنة مجدولة" },
    { id: "RSK-02", title: "تأخر تحويلات المانحين عن الموعد المعلن", probability: "متوسطة", impact: "عالية", mitigation: "احتفاظ باحتياطي تشغيلي لثلاثين يوماً" },
    { id: "RSK-03", title: "نزوح جماعي مفاجئ يغيّر توزيع الاحتياج", probability: "متوسطة", impact: "عالية", mitigation: "مراجعة أسبوعية لتوزيع التكليفات الميدانية" },
    { id: "RSK-04", title: "تصعيد أمني يمنع الوصول إلى محافظة بأكملها", probability: "متوسطة", impact: "عالية", mitigation: "خطة توزيع بديلة عبر محافظات مجاورة" },
    { id: "RSK-05", title: "محاولات ازدواجية تسجيل مستفيدين", probability: "عالية", impact: "متوسطة", mitigation: "فحص الازدواجية عبر تجزئة الرقم الوطني" },
    { id: "RSK-06", title: "نقص الكوادر الميدانية المدرَّبة في المواسم الحرجة", probability: "متوسطة", impact: "متوسطة", mitigation: "برنامج تدريب سريع للمسّاحين الاحتياط" },
    { id: "RSK-07", title: "تقلّب سعر الصرف يؤثر على قيمة القسائم", probability: "عالية", impact: "متوسطة", mitigation: "مراجعة شهرية لقيم القسائم حسب القطاع" },
    { id: "RSK-08", title: "انقطاع الكهرباء في مراكز التوزيع أثناء الصرف", probability: "منخفضة", impact: "متوسطة", mitigation: "أجهزة صرف تعمل بلا اتصال وبطاريات احتياطية" }
  ];

  /* ================= المانحون والمنح ================= */
  var DONORS = [];
  (function buildDonors() {
    var defs = [
      { name: "برنامج الأغذية العالمي", code: "WFP" },
      { name: "الوكالة الألمانية للتعاون الدولي", code: "GIZ" },
      { name: "المكتب البريطاني للتنمية الدولية", code: "FCDO" },
      { name: "مكتب الأمم المتحدة لتنسيق الشؤون الإنسانية", code: "OCHA" },
      { name: "الصندوق السعودي للتنمية", code: "SFD" }
    ];
    defs.forEach(function (d, di) {
      var grantCount = di < 2 ? 2 : 1;
      var grants = [];
      for (var gi = 0; gi < grantCount; gi++) {
        var total = randInt(8, 40) * 1000000;
        var govCount = randInt(3, 6);
        var chosenGovs = [];
        while (chosenGovs.length < govCount) {
          var g = govByWeight();
          if (chosenGovs.indexOf(g) === -1) chosenGovs.push(g);
        }
        var remaining = total;
        var allocations = chosenGovs.map(function (g, idx) {
          var share = idx === chosenGovs.length - 1 ? remaining : Math.round(remaining * randInt(15, 35) / 100);
          remaining -= share;
          return { governorateId: g.id, targetAmount: Math.max(share, 200000), targetBeneficiaries: Math.round(Math.max(share, 200000) / 55000) };
        });
        grants.push({
          id: "GRT-" + d.code + "-" + (gi + 1),
          name: d.name + " — منحة " + SECTORS[gi % SECTORS.length].name + " ٢٠٢٦",
          sectorId: SECTORS[(gi + di) % SECTORS.length].id,
          totalAmount: total,
          startDate: daysAgo(randInt(60, 180)),
          endDate: daysAgo(-randInt(60, 200)),
          allocations: allocations
        });
      }
      DONORS.push({ id: "DNR-" + d.code, name: d.name, code: d.code, contactUserId: null, grants: grants });
    });
    // اربط أول مانح بحساب المستخدم "donor" في USERS لتسجيل الدخول التجريبي
    var donorUser = usersByRole("donor")[0];
    if (donorUser) { DONORS[0].contactUserId = donorUser.id; donorUser.donorId = DONORS[0].id; }
  })();

  /* ================= الصلاحيات ================= */
  var PERMISSIONS = [
    { code: "apply_aid", label: "تقديم طلب مساعدة", domain: "المواطن" },
    { code: "submit_complaint", label: "تقديم بلاغ", domain: "المواطن" },
    { code: "verify_identity", label: "التحقق من الهوية", domain: "الميدان" },
    { code: "manage_assignments", label: "إدارة التكليفات", domain: "الميدان" },
    { code: "manage_crises", label: "إدارة الأزمات", domain: "الميدان" },
    { code: "view_coverage", label: "عرض التغطية والخارطة", domain: "الميدان" },
    { code: "review_requests", label: "فحص الطلبات", domain: "الطلبات" },
    { code: "approve_requests", label: "اعتماد أو رفض الطلبات", domain: "الطلبات" },
    { code: "scan_vouchers", label: "مسح القسائم", domain: "التوزيع" },
    { code: "deliver_packages", label: "تأكيد الصرف", domain: "التوزيع" },
    { code: "triage_complaints", label: "فرز البلاغات", domain: "الحماية" },
    { code: "investigate_reports", label: "التحقيق في البلاغات", domain: "الحماية" },
    { code: "view_audit_trail", label: "عرض سجل التدقيق", domain: "الرقابة" },
    { code: "manage_grants", label: "إدارة المنح والتخصيصات", domain: "التمويل" },
    { code: "export_reports", label: "تصدير التقارير", domain: "التمويل" },
    { code: "manage_users", label: "إدارة الحسابات", domain: "الإدارة" },
    { code: "manage_settings", label: "إدارة الإعدادات والصلاحيات", domain: "الإدارة" },
    { code: "manage_references", label: "إدارة المرجعيات والمُهل", domain: "الإدارة" }
  ];

  var ROLES = [
    { code: "citizen", label: "مواطن مستفيد" },
    { code: "surveyor", label: "مسّاح ميداني" },
    { code: "field_coordinator", label: "منسق طوارئ" },
    { code: "ops_manager", label: "مدير الاستجابة" },
    { code: "reviewer", label: "موظف فحص" },
    { code: "distributor", label: "موظف مركز توزيع" },
    { code: "auditor", label: "مسؤول حماية ومساءلة" },
    { code: "donor", label: "جهة ممولة" },
    { code: "admin", label: "مشرف عام" },
    { code: "integrator", label: "حساب نظام (تكامل)" }
  ];

  function buildDefaultRolePermissions() {
    var m = {};
    ROLES.forEach(function (r) { m[r.code] = {}; PERMISSIONS.forEach(function (p) { m[r.code][p.code] = false; }); });
    function grant(role) { for (var i = 1; i < arguments.length; i++) m[role][arguments[i]] = true; }
    grant("citizen", "apply_aid", "submit_complaint");
    grant("surveyor", "verify_identity", "manage_assignments", "manage_crises");
    grant("field_coordinator", "manage_assignments", "manage_crises", "view_coverage");
    grant("ops_manager", "view_coverage", "manage_assignments", "manage_crises", "export_reports");
    grant("reviewer", "review_requests", "approve_requests");
    grant("distributor", "scan_vouchers", "deliver_packages");
    grant("auditor", "triage_complaints", "investigate_reports", "view_audit_trail");
    grant("donor", "manage_grants", "export_reports", "view_coverage");
    grant("integrator", "view_coverage", "export_reports");
    PERMISSIONS.forEach(function (p) { m.admin[p.code] = true; });
    return m;
  }

  /* ================= سجل التدقيق (سلسلة مترابطة) ================= */
  var AUDIT_EVENT_TYPES = ["إصدار هوية", "اعتماد طلب", "رفض طلب", "إصدار قسيمة", "صرف قسيمة", "تعديل صلاحيات", "تخصيص أو تعديل منحة"];
  var AUDIT_TRAIL = [];
  (function buildAuditTrail() {
    var prevHash = "0".repeat(64);
    var sourceEvents = [];
    AID_REQUESTS.forEach(function (r) {
      if (r.decidedAt) sourceEvents.push({ ts: r.decidedAt, type: r.status === "rejected" ? "رفض طلب" : "اعتماد طلب", entityType: "aid_request", entityId: r.id, actor: r.decidedByUserId });
    });
    VOUCHERS.forEach(function (v) {
      sourceEvents.push({ ts: v.issuedAt, type: "إصدار قسيمة", entityType: "voucher", entityId: v.id, actor: null });
      if (v.deliveredAt) sourceEvents.push({ ts: v.deliveredAt, type: "صرف قسيمة", entityType: "voucher", entityId: v.id, actor: v.deliveredByUserId });
    });
    CITIZENS.forEach(function (c) { sourceEvents.push({ ts: c.registeredAt, type: "إصدار هوية", entityType: "citizen", entityId: c.id, actor: null }); });
    sourceEvents.sort(function (a, b) { return a.ts - b.ts; });
    sourceEvents = sourceEvents.slice(-50);
    if (sourceEvents.length < 50) {
      var need = 50 - sourceEvents.length;
      for (var i = 0; i < need; i++) {
        sourceEvents.unshift({ ts: daysAgo(60 + i), type: pick(AUDIT_EVENT_TYPES), entityType: "grant", entityId: "GRT-SEED-" + i, actor: null });
      }
      sourceEvents.sort(function (a, b) { return a.ts - b.ts; });
    }
    sourceEvents.forEach(function (ev, idx) {
      var actorUser = ev.actor ? USERS.filter(function (u) { return u.id === ev.actor; })[0] : null;
      var payload = idx + "|" + ev.ts + "|" + ev.type + "|" + ev.entityType + "|" + ev.entityId;
      var hash = fakeHash(prevHash + payload);
      AUDIT_TRAIL.push({
        index: idx + 1,
        ts: ev.ts,
        eventType: ev.type,
        entityType: ev.entityType,
        entityId: ev.entityId,
        actorName: actorUser ? actorUser.name : "النظام",
        prevHash: prevHash,
        hash: hash
      });
      prevHash = hash;
    });
  })();

  /* ================= إعدادات المرجعيات والمُهل ================= */
  var SETTINGS = {
    requestReviewSlaHours: 24,
    voucherValidityDays: 30,
    complaintSlaHours: { S: 4, F: 24, O: 48 },
    maxPendingOfflineOps: 1000
  };

  /* ================= تصدير الحزمة ================= */
  global.YEDSP_SEED = {
    meta: { generatedAt: Date.now(), seed: 20260908 },
    governorates: GOVERNORATES,
    sectors: SECTORS,
    distributionSites: DISTRIBUTION_SITES,
    citizens: CITIZENS,
    users: USERS,
    roles: ROLES,
    aidRequests: AID_REQUESTS,
    vouchers: VOUCHERS,
    complaints: COMPLAINTS,
    complaintCategories: COMPLAINT_CATS,
    crises: CRISES,
    fieldAssignments: FIELD_ASSIGNMENTS,
    riskRegister: RISK_REGISTER,
    donors: DONORS,
    permissions: PERMISSIONS,
    rolePermissions: buildDefaultRolePermissions(),
    auditTrail: AUDIT_TRAIL,
    auditEventTypes: AUDIT_EVENT_TYPES,
    settings: SETTINGS,
    helpers: { fakeHash: fakeHash, vulnerabilityScore: vulnerabilityScore, pad: pad, randInt: randInt, pick: pick }
  };
})(window);
