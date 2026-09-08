/* =====================================================================
   YEDSP DEMO — js/state.js
   مخزن الحالة في الذاكرة + جسر localStorage + كل أفعال المحاكاة.
   لا نداءات شبكة هنا إطلاقاً — كل شيء يقرأ ويكتب في هذا الكائن مباشرة.
   ===================================================================== */
(function (global) {
  "use strict";
  var YEDSP = global.YEDSP = global.YEDSP || {};
  var SEED = global.YEDSP_SEED;
  var H = SEED.helpers;
  var STORAGE_KEY = "yedsp_demo_state_v1";

  var state = null;
  var subscribers = [];

  function deepClone(obj) { return JSON.parse(JSON.stringify(obj)); }

  function baselineCoverageFor(govId) {
    var hex = H.fakeHash("coverage-" + govId).slice(0, 4);
    var n = parseInt(hex, 16) % 76; // 0..75
    return 20 + n; // 20..95
  }

  function freshState() {
    var s = {
      currentRole: null,
      currentUserId: null,
      fieldOffline: false,
      fieldPendingOps: 0,
      liveDeliveryBumps: {},
      governorates: deepClone(SEED.governorates),
      sectors: deepClone(SEED.sectors),
      distributionSites: deepClone(SEED.distributionSites),
      citizens: deepClone(SEED.citizens),
      users: deepClone(SEED.users),
      roles: deepClone(SEED.roles),
      aidRequests: deepClone(SEED.aidRequests),
      vouchers: deepClone(SEED.vouchers),
      complaints: deepClone(SEED.complaints),
      complaintCategories: deepClone(SEED.complaintCategories),
      crises: deepClone(SEED.crises),
      fieldAssignments: deepClone(SEED.fieldAssignments),
      riskRegister: deepClone(SEED.riskRegister),
      donors: deepClone(SEED.donors),
      permissions: deepClone(SEED.permissions),
      rolePermissions: deepClone(SEED.rolePermissions),
      auditTrail: deepClone(SEED.auditTrail),
      auditEventTypes: deepClone(SEED.auditEventTypes),
      settings: deepClone(SEED.settings),
      requestCounter: SEED.aidRequests.length + 1,
      complaintCounter: SEED.complaints.length + 1,
      crisisCounter: SEED.crises.length + 1,
      citizenCounter: SEED.citizens.length + 1,
      voucherCounter: SEED.vouchers.length + 1
    };
    s.governorates.forEach(function (g) { g.baselineCoverage = baselineCoverageFor(g.id); s.liveDeliveryBumps[g.id] = 0; });
    return s;
  }

  function load() {
    try {
      var raw = localStorage.getItem(STORAGE_KEY);
      if (raw) {
        var parsed = JSON.parse(raw);
        if (parsed && parsed.governorates && parsed.governorates.length === SEED.governorates.length) {
          return parsed;
        }
      }
    } catch (e) { /* localStorage غير متاح — نتجاهل بهدوء */ }
    return freshState();
  }

  function persist() {
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify(state)); } catch (e) { /* تجاهل */ }
  }

  function notify() { subscribers.forEach(function (fn) { try { fn(state); } catch (e) { console.error(e); } }); }

  function subscribe(fn) { subscribers.push(fn); return function () { subscribers = subscribers.filter(function (f) { return f !== fn; }); }; }

  function toast(message, tone) {
    if (YEDSP.ui && YEDSP.ui.toast) YEDSP.ui.toast(message, tone || "ok");
  }

  /* ---------- مساعدات بحث سريعة ---------- */
  function byId(arr, id) { for (var i = 0; i < arr.length; i++) if (arr[i].id === id) return arr[i]; return null; }

  function addAudit(eventType, entityType, entityId, actorName) {
    var last = state.auditTrail[state.auditTrail.length - 1];
    var prevHash = last ? last.hash : "0".repeat(64);
    var idx = state.auditTrail.length + 1;
    var payload = idx + "|" + Date.now() + "|" + eventType + "|" + entityType + "|" + entityId;
    var hash = H.fakeHash(prevHash + payload);
    state.auditTrail.push({
      index: idx, ts: Date.now(), eventType: eventType, entityType: entityType,
      entityId: entityId, actorName: actorName || "النظام", prevHash: prevHash, hash: hash
    });
  }

  function currentUser() {
    if (!state.currentUserId) return null;
    if (state.currentRole === "citizen") return byId(state.citizens, state.currentUserId);
    return byId(state.users, state.currentUserId);
  }

  /* =========================== الأفعال =========================== */
  var actions = {

    init: function () {
      state = load();
      YEDSP.state = state;
    },

    getState: function () { return state; },
    subscribe: subscribe,
    currentUser: currentUser,
    byId: byId,

    login: function (roleCode) {
      state.currentRole = roleCode;
      if (roleCode === "citizen") {
        state.currentUserId = state.citizens[0].id;
      } else {
        var u = state.users.filter(function (x) { return x.role === roleCode; })[0];
        state.currentUserId = u ? u.id : null;
      }
      persist();
      notify();
    },

    logout: function () {
      state.currentRole = null;
      state.currentUserId = null;
      persist();
      notify();
    },

    resetDemoData: function () {
      try { localStorage.removeItem(STORAGE_KEY); } catch (e) {}
      state = freshState();
      YEDSP.state = state;
      notify();
      toast("تمت إعادة تعيين بيانات العرض التجريبي", "ok");
    },

    hasPermission: function (permCode, roleCode) {
      roleCode = roleCode || state.currentRole;
      return !!(state.rolePermissions[roleCode] && state.rolePermissions[roleCode][permCode]);
    },

    /* ---- المواطن ---- */
    submitAidRequest: function (citizenId, sectorId, notes) {
      var citizen = byId(state.citizens, citizenId);
      var vscore = H.vulnerabilityScore(citizen);
      var now = Date.now();
      var req = {
        id: "REQ-2026-" + H.pad(9000 + state.requestCounter++, 4),
        citizenId: citizenId, sectorId: sectorId, governorateId: citizen.governorateId,
        status: "submitted", vulnerabilityScore: vscore, submittedAt: now,
        slaDeadline: now + state.settings.requestReviewSlaHours * 3600 * 1000,
        decidedAt: null, decidedByUserId: null, rejectionReason: null,
        notes: notes || "", history: [{ at: now, actor: citizen.name, action: "تقديم الطلب", note: "عبر بوابة المواطن" }]
      };
      state.aidRequests.unshift(req);
      persist(); notify();
      toast("تم تقديم طلبك برقم " + req.id, "ok");
      return req;
    },

    /* ---- الفحص ---- */
    approveRequest: function (requestId) {
      var req = byId(state.aidRequests, requestId);
      if (!req) return;
      req.status = "voucher";
      req.decidedAt = Date.now();
      var reviewer = currentUser();
      req.decidedByUserId = reviewer ? reviewer.id : null;
      req.history.push({ at: Date.now(), actor: reviewer ? reviewer.name : "موظف فحص", action: "اعتماد الطلب", note: "" });
      addAudit("اعتماد طلب", "aid_request", req.id, reviewer ? reviewer.name : "موظف فحص");

      var site = state.distributionSites.filter(function (s) { return s.governorateId === req.governorateId; })[0] || state.distributionSites[0];
      var sectorAmounts = { "sec-food": 65000, "sec-wash": 38000, "sec-health": 52000, "sec-shelter": 120000, "sec-edu": 45000 };
      var voucher = {
        id: "VCH-2026-" + H.pad(9000 + state.voucherCounter++, 4),
        requestId: req.id, citizenId: req.citizenId, sectorId: req.sectorId, governorateId: req.governorateId,
        siteId: site.id, amount: sectorAmounts[req.sectorId] || 50000,
        code: "YEDSP-" + req.id + "-" + H.fakeHash(req.id).slice(0, 8).toUpperCase(),
        pinMasked: "••••", pinHash: H.fakeHash(req.id + "pin"),
        issuedAt: Date.now(), expiresAt: Date.now() + state.settings.voucherValidityDays * 24 * 3600 * 1000,
        status: "issued", deliveredAt: null, deliveredByUserId: null
      };
      state.vouchers.unshift(voucher);
      addAudit("إصدار قسيمة", "voucher", voucher.id, reviewer ? reviewer.name : "النظام");
      persist(); notify();
      toast("تم اعتماد الطلب " + req.id + " وإصدار القسيمة " + voucher.id, "ok");
      return voucher;
    },

    rejectRequest: function (requestId, reason) {
      var req = byId(state.aidRequests, requestId);
      if (!req) return;
      req.status = "rejected";
      req.decidedAt = Date.now();
      req.rejectionReason = reason || "لا يستوفي معايير الأهلية المعتمدة";
      var reviewer = currentUser();
      req.decidedByUserId = reviewer ? reviewer.id : null;
      req.history.push({ at: Date.now(), actor: reviewer ? reviewer.name : "موظف فحص", action: "رفض الطلب", note: req.rejectionReason });
      addAudit("رفض طلب", "aid_request", req.id, reviewer ? reviewer.name : "موظف فحص");
      persist(); notify();
      toast("تم رفض الطلب " + req.id, "warn");
    },

    /* ---- التوزيع ---- */
    pickRandomPendingVoucher: function () {
      var pending = state.vouchers.filter(function (v) { return v.status === "issued"; });
      if (!pending.length) return null;
      return pending[Math.floor(Math.random() * pending.length)];
    },

    deliverVoucher: function (voucherId) {
      var v = byId(state.vouchers, voucherId);
      if (!v || v.status !== "issued") return { ok: false, message: "القسيمة غير صالحة للصرف" };
      v.status = "delivered";
      v.deliveredAt = Date.now();
      var dist = currentUser();
      v.deliveredByUserId = dist ? dist.id : null;
      var req = byId(state.aidRequests, v.requestId);
      if (req) { req.status = "delivered"; req.history.push({ at: Date.now(), actor: dist ? dist.name : "موظف مركز توزيع", action: "صرف القسيمة", note: "" }); }
      state.liveDeliveryBumps[v.governorateId] = (state.liveDeliveryBumps[v.governorateId] || 0) + 2.5;
      addAudit("صرف قسيمة", "voucher", v.id, dist ? dist.name : "موظف مركز توزيع");
      persist(); notify();
      toast("تم تأكيد صرف القسيمة " + v.id, "ok");
      return { ok: true, voucher: v };
    },

    /* ---- الحماية / البلاغات ---- */
    submitComplaint: function (data) {
      var cat = state.complaintCategories.filter(function (c) { return c.code === data.category; })[0];
      var c = {
        id: "CMP-2026-" + H.pad(9000 + state.complaintCounter++, 4),
        trackingCode: "YSP-" + H.randInt(100000, 999999),
        category: data.category, categoryName: cat ? cat.name : data.category,
        slaHours: cat ? cat.slaHours : 48,
        governorateId: data.governorateId, description: data.description,
        anonymous: !!data.anonymous, reporterName: data.anonymous ? null : (data.reporterName || null),
        reporterPhone: data.anonymous ? null : (data.reporterPhone || null),
        createdAt: Date.now(), status: "جديد", linkedCrisisId: null, channel: "ويب"
      };
      state.complaints.unshift(c);
      persist(); notify();
      toast("تم استلام بلاغك برقم متابعة " + c.trackingCode, "ok");
      return c;
    },

    updateComplaintStatus: function (complaintId, status) {
      var c = byId(state.complaints, complaintId);
      if (!c) return;
      c.status = status;
      persist(); notify();
      toast("تم تحديث حالة البلاغ إلى «" + status + "»", "ok");
    },

    escalateComplaint: function (complaintId) {
      var c = byId(state.complaints, complaintId);
      if (!c) return;
      c.status = "قيد التحقيق";
      var crisis = {
        id: "CRS-2026-" + H.pad(900 + state.crisisCounter++, 3),
        title: "تصعيد بلاغ: " + c.description,
        governorateId: c.governorateId, severity: "عالية", status: "مفتوحة",
        openedAt: Date.now(), linkedComplaintId: c.id, reportedByUserId: null
      };
      state.crises.unshift(crisis);
      c.linkedCrisisId = crisis.id;
      var actor = currentUser();
      addAudit("تصعيد بلاغ إلى أزمة", "complaint", c.id, actor ? actor.name : "مسؤول حماية");
      persist(); notify();
      toast("تم تصعيد البلاغ إلى أزمة ميدانية جديدة " + crisis.id, "crit");
      return crisis;
    },

    closeComplaint: function (complaintId) {
      var c = byId(state.complaints, complaintId);
      if (!c) return;
      if (c.linkedCrisisId) {
        var crisis = byId(state.crises, c.linkedCrisisId);
        if (crisis && crisis.status !== "مغلقة") { toast("لا يمكن إغلاق البلاغ قبل إغلاق الأزمة المرتبطة " + crisis.id, "warn"); return; }
      }
      c.status = "مغلق";
      persist(); notify();
      toast("تم إغلاق البلاغ " + c.id, "ok");
    },

    closeCrisis: function (crisisId) {
      var crisis = byId(state.crises, crisisId);
      if (!crisis) return;
      crisis.status = "مغلقة";
      persist(); notify();
      toast("تم إغلاق الأزمة " + crisis.id, "ok");
    },

    /* ---- الميدان ---- */
    registerCitizenField: function (data) {
      var c = {
        id: "CIT-" + H.pad(9000 + state.citizenCounter++, 4),
        name: data.name, gender: data.gender || "m",
        maskedNationalId: "***-***-" + H.pad(H.randInt(1000, 9999), 4),
        governorateId: data.governorateId, phone: data.phone || "7" + H.randInt(10000000, 99999999),
        familySize: data.familySize || 1, hasDisability: !!data.hasDisability,
        hasPregnantOrNursing: !!data.hasPregnantOrNursing, incomeLevel: data.incomeLevel || "low",
        breadwinnerStatus: data.breadwinnerStatus || "present", registrationChannel: "ميداني",
        registeredAt: Date.now()
      };
      state.citizens.unshift(c);
      var actor = currentUser();
      addAudit("إصدار هوية", "citizen", c.id, actor ? actor.name : "مسّاح ميداني");
      if (state.fieldOffline) state.fieldPendingOps++;
      persist(); notify();
      toast("تم تسجيل المستفيد " + c.name + " برقم " + c.id, "ok");
      return c;
    },

    verifyIdentityLookup: function (query) {
      query = (query || "").trim();
      if (!query) return [];
      return state.citizens.filter(function (c) {
        return c.name.indexOf(query) !== -1 || c.maskedNationalId.indexOf(query) !== -1 || c.id.indexOf(query) !== -1;
      }).slice(0, 8);
    },

    confirmIdentityCheck: function (citizenId) {
      var c = byId(state.citizens, citizenId);
      if (state.fieldOffline) state.fieldPendingOps++;
      persist(); notify();
      toast("تم التحقق من هوية " + (c ? c.name : "المستفيد") + " بنجاح", "ok");
    },

    reportCrisis: function (data) {
      var crisis = {
        id: "CRS-2026-" + H.pad(900 + state.crisisCounter++, 3),
        title: data.title, governorateId: data.governorateId, severity: data.severity || "متوسطة",
        status: "مفتوحة", openedAt: Date.now(), linkedComplaintId: null,
        reportedByUserId: (currentUser() || {}).id || null
      };
      state.crises.unshift(crisis);
      if (state.fieldOffline) state.fieldPendingOps++;
      persist(); notify();
      toast("تم رفع بلاغ الأزمة " + crisis.id, "warn");
      return crisis;
    },

    toggleFieldOffline: function () {
      state.fieldOffline = !state.fieldOffline;
      if (state.fieldOffline) state.fieldPendingOps = Math.max(state.fieldPendingOps, 0);
      persist(); notify();
      toast(state.fieldOffline ? "تم التحول إلى وضع بلا اتصال" : "تم استعادة الاتصال بالشبكة", state.fieldOffline ? "warn" : "ok");
    },

    syncNow: function (done) {
      var n = state.fieldPendingOps;
      setTimeout(function () {
        state.fieldPendingOps = 0;
        persist(); notify();
        toast(n > 0 ? ("تمت مزامنة " + n + " عملية بنجاح") : "لا توجد عمليات بحاجة إلى مزامنة", "ok");
        if (done) done();
      }, 900);
    },

    createAssignment: function (data) {
      var a = {
        id: "ASG-" + H.pad(900 + state.fieldAssignments.length + 1, 3),
        surveyorName: data.surveyorName, governorateId: data.governorateId,
        siteId: (state.distributionSites.filter(function (s) { return s.governorateId === data.governorateId; })[0] || state.distributionSites[0]).id,
        target: Number(data.target) || 20, completed: 0, status: "نشط",
        startedAt: Date.now(), dueAt: Date.now() + 14 * 24 * 3600 * 1000
      };
      state.fieldAssignments.unshift(a);
      persist(); notify();
      toast("تم إنشاء تكليف جديد لـ " + a.surveyorName, "ok");
      return a;
    },

    updateAssignmentProgress: function (assignmentId, completed) {
      var a = byId(state.fieldAssignments, assignmentId);
      if (!a) return;
      a.completed = Math.min(a.target, Math.max(0, completed));
      if (a.completed >= a.target) a.status = "مكتمل";
      persist(); notify();
    },

    /* ---- الإدارة ---- */
    togglePermission: function (roleCode, permCode) {
      if (!state.rolePermissions[roleCode]) return;
      state.rolePermissions[roleCode][permCode] = !state.rolePermissions[roleCode][permCode];
      var actor = currentUser();
      addAudit("تعديل صلاحيات", "role_permission", roleCode + ":" + permCode, actor ? actor.name : "مشرف عام");
      persist(); notify();
      toast("تم تحديث صلاحية «" + permCode + "» للدور " + roleCode, "ok");
    },

    toggleUserActive: function (userId) {
      var u = byId(state.users, userId);
      if (!u) return;
      u.active = !u.active;
      persist(); notify();
      toast(u.active ? "تم تفعيل الحساب" : "تم تعطيل الحساب", u.active ? "ok" : "warn");
    },

    addUser: function (data) {
      var u = {
        id: "USR-" + H.pad(900 + state.users.length + 1, 3),
        name: data.name, role: data.role, title: data.title || "", governorateId: data.governorateId || null,
        active: true, twoFactorEnabled: ["reviewer", "distributor", "auditor", "admin"].indexOf(data.role) >= 0
      };
      state.users.unshift(u);
      persist(); notify();
      toast("تم إنشاء حساب جديد لـ " + u.name, "ok");
      return u;
    },

    saveReferenceSettings: function (data) {
      Object.keys(data.slaHours || {}).forEach(function (code) {
        state.settings.complaintSlaHours[code] = Number(data.slaHours[code]);
        state.complaintCategories.forEach(function (c) { if (c.code === code) c.slaHours = Number(data.slaHours[code]); });
      });
      if (data.requestReviewSlaHours !== undefined) state.settings.requestReviewSlaHours = Number(data.requestReviewSlaHours);
      if (data.voucherValidityDays !== undefined) state.settings.voucherValidityDays = Number(data.voucherValidityDays);
      if (data.maxPendingOfflineOps !== undefined) state.settings.maxPendingOfflineOps = Number(data.maxPendingOfflineOps);
      persist(); notify();
      toast("تم حفظ إعدادات المرجعيات والمُهل", "ok");
    },

    verifyAuditChain: function () {
      return { ok: true, checked: state.auditTrail.length };
    },

    /* ---- المانح ---- */
    exportPlaceholder: function (label) {
      toast("تم تجهيز " + (label || "الملف") + " للتنزيل (محاكاة)", "ok");
    }
  };

  YEDSP.actions = actions;
  YEDSP.selectors = null; // يُملأ في selectors.js عبر YEDSP.selectors أدناه (مضمّن هنا لتفادي ملف إضافي)

  /* =========================== المُشتقّات (Selectors) =========================== */
  YEDSP.selectors = {
    governorate: function (id) { return byId(state.governorates, id); },
    sector: function (id) { return byId(state.sectors, id); },
    site: function (id) { return byId(state.distributionSites, id); },
    citizen: function (id) { return byId(state.citizens, id); },
    user: function (id) { return byId(state.users, id); },

    coveragePercent: function (govId) {
      var g = byId(state.governorates, govId);
      if (!g) return 0;
      var bump = state.liveDeliveryBumps[govId] || 0;
      return Math.max(0, Math.min(100, Math.round(g.baselineCoverage + bump)));
    },

    nationalCoverage: function () {
      var total = 0;
      state.governorates.forEach(function (g) { total += YEDSP.selectors.coveragePercent(g.id); });
      return Math.round(total / state.governorates.length);
    },

    requestsByStatus: function (status) { return state.aidRequests.filter(function (r) { return r.status === status; }); },
    isSlaBreached: function (req) { return (req.status === "submitted" || req.status === "reviewing") && Date.now() > req.slaDeadline; },

    reviewQueue: function () {
      return state.aidRequests
        .filter(function (r) { return r.status === "submitted" || r.status === "reviewing"; })
        .slice()
        .sort(function (a, b) {
          var ab = YEDSP.selectors.isSlaBreached(a) ? 1 : 0;
          var bb = YEDSP.selectors.isSlaBreached(b) ? 1 : 0;
          if (ab !== bb) return bb - ab;
          return b.vulnerabilityScore - a.vulnerabilityScore;
        });
    },

    avgReviewTimeHours: function () {
      var decided = state.aidRequests.filter(function (r) { return r.decidedAt; });
      if (!decided.length) return 0;
      var sum = decided.reduce(function (s, r) { return s + (r.decidedAt - r.submittedAt); }, 0);
      return Math.round((sum / decided.length) / 3600000 * 10) / 10;
    },

    slaBreachRate: function () {
      var relevant = state.aidRequests.filter(function (r) { return r.decidedAt || r.status === "submitted" || r.status === "reviewing"; });
      if (!relevant.length) return 0;
      var breached = relevant.filter(function (r) {
        if (r.decidedAt) return r.decidedAt > r.slaDeadline;
        return Date.now() > r.slaDeadline;
      });
      return Math.round((breached.length / relevant.length) * 100);
    },

    vouchersByStatus: function (status) { return state.vouchers.filter(function (v) { return v.status === status; }); },
    verifiedBeneficiariesCount: function () {
      var ids = {};
      state.vouchers.filter(function (v) { return v.status === "delivered"; }).forEach(function (v) { ids[v.citizenId] = 1; });
      return Object.keys(ids).length;
    },

    complaintsByStatus: function (status) { return state.complaints.filter(function (c) { return c.status === status; }); },
    complaintSlaBreached: function (c) {
      if (c.status === "مغلق") return false;
      return Date.now() > (c.createdAt + c.slaHours * 3600 * 1000);
    },
    complaintBreachRate: function () {
      if (!state.complaints.length) return 0;
      var breached = state.complaints.filter(YEDSP.selectors.complaintSlaBreached);
      return Math.round((breached.length / state.complaints.length) * 100);
    },

    crisesByStatus: function (status) { return state.crises.filter(function (c) { return c.status === status; }); },
    openCrisesCount: function () { return state.crises.filter(function (c) { return c.status !== "مغلقة"; }).length; },

    assignmentCompletionRate: function (a) { return a.target ? Math.round((a.completed / a.target) * 100) : 0; },
    overallAssignmentCompletion: function () {
      var t = 0, c = 0;
      state.fieldAssignments.forEach(function (a) { t += a.target; c += a.completed; });
      return t ? Math.round((c / t) * 100) : 0;
    },

    grantSpent: function (grant) {
      var spent = 0;
      state.vouchers.filter(function (v) { return v.status === "delivered" && v.sectorId === grant.sectorId; })
        .forEach(function (v) {
          var inAlloc = grant.allocations.some(function (a) { return a.governorateId === v.governorateId; });
          if (inAlloc) spent += v.amount;
        });
      return spent;
    },
    grantBeneficiaries: function (grant) {
      var ids = {};
      state.vouchers.filter(function (v) { return v.status === "delivered" && v.sectorId === grant.sectorId; })
        .forEach(function (v) {
          if (grant.allocations.some(function (a) { return a.governorateId === v.governorateId; })) ids[v.citizenId] = 1;
        });
      return Object.keys(ids).length;
    },

    requestsTrend7d: function () {
      var days = [];
      var AR_DAYS = ["أحد", "اثنين", "ثلاثاء", "أربعاء", "خميس", "جمعة", "سبت"];
      for (var i = 6; i >= 0; i--) {
        var dayStart = new Date(); dayStart.setHours(0, 0, 0, 0); dayStart.setDate(dayStart.getDate() - i);
        var dayEnd = dayStart.getTime() + 24 * 3600 * 1000;
        var count = state.aidRequests.filter(function (r) { return r.submittedAt >= dayStart.getTime() && r.submittedAt < dayEnd; }).length;
        days.push({ label: AR_DAYS[dayStart.getDay()], value: count });
      }
      return days;
    },

    requestsBySector: function () {
      return state.sectors.map(function (s) {
        return { sector: s, count: state.aidRequests.filter(function (r) { return r.sectorId === s.id; }).length };
      });
    },

    navPermittedRoles: function () { return state.roles; }
  };

  actions.init();
})(window);
