/* =====================================================================
   YEDSP DEMO — js/components.js
   مكوّنات واجهة قابلة لإعادة الاستخدام. كل دالة تُعيد نص HTML جاهزاً
   للحقن عبر innerHTML، ما عدا الحوار والتنبيه اللذين يُداران كعنصرين
   وحيدين ثابتين في DOM (singleton) لتفادي تضارب إعادة الرسم.
   ===================================================================== */
(function (global) {
  "use strict";
  var YEDSP = global.YEDSP = global.YEDSP || {};
  var AR_MONTHS = ["يناير", "فبراير", "مارس", "أبريل", "مايو", "يونيو", "يوليو", "أغسطس", "سبتمبر", "أكتوبر", "نوفمبر", "ديسمبر"];

  function esc(str) {
    if (str === null || str === undefined) return "";
    return String(str).replace(/[&<>"']/g, function (c) {
      return ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c];
    });
  }
  function fmtNum(n) { return Number(n || 0).toLocaleString("en-US"); }
  function fmtMoney(n) { return fmtNum(n) + " ر.ي."; }
  function pad2(n) { return n < 10 ? "0" + n : "" + n; }
  function fmtDate(ts) {
    if (!ts) return "—";
    var d = new Date(ts);
    return pad2(d.getDate()) + " " + AR_MONTHS[d.getMonth()] + " " + d.getFullYear();
  }
  function fmtDateTime(ts) {
    if (!ts) return "—";
    var d = new Date(ts);
    return fmtDate(ts) + " · " + pad2(d.getHours()) + ":" + pad2(d.getMinutes());
  }
  function fmtCountdown(deadline) {
    var diff = deadline - Date.now();
    var abs = Math.abs(diff);
    var h = Math.floor(abs / 3600000);
    var m = Math.floor((abs % 3600000) / 60000);
    var txt = (h > 0 ? h + " س " : "") + m + " د";
    return diff >= 0 ? ("متبقٍ " + txt) : ("متجاوز منذ " + txt);
  }

  /* ---------------- الأيقونات (SVG بسيطة بخط، بلا مكتبة) ---------------- */
  var ICON_PATHS = {
    home: "M3 11l9-7 9 7M5 10v10h14V10",
    id: "M3 5h18v14H3z M7 10a2 2 0 104 0 2 2 0 00-4 0 M6 17c.5-2 2-3 3-3s2.5 1 3 3 M14 9h5 M14 13h5",
    filePlus: "M6 3h9l4 4v14H6z M12 11v6 M9 14h6",
    list: "M8 6h13 M8 12h13 M8 18h13 M3 6h.01 M3 12h.01 M3 18h.01",
    qr: "M4 4h6v6H4z M14 4h6v6h-6z M4 14h6v6H4z M14 14h3v3h-3z M20 17v3h-3",
    flag: "M5 3v18 M5 4h13l-3 4 3 4H5",
    users: "M9 11a3 3 0 100-6 3 3 0 000 6z M2 20c0-3.3 3-6 7-6s7 2.7 7 6 M17 8a3 3 0 110-6 M16 14c2.8.3 5 2.7 5 6",
    check: "M4 12l5 5 11-11",
    x: "M5 5l14 14M19 5L5 19",
    map: "M9 4L3 6v14l6-2 6 2 6-2V4l-6 2-6-2z M9 4v14 M15 6v14",
    briefcase: "M4 8h16v11H4z M9 8V6a2 2 0 012-2h2a2 2 0 012 2v2 M4 13h16",
    alert: "M12 3l10 18H2z M12 10v4 M12 17h.01",
    shield: "M12 3l8 3v6c0 5-3.5 7.5-8 9-4.5-1.5-8-4-8-9V6z",
    gift: "M4 9h16v11H4z M12 9v11 M4 9V7a2 2 0 012-2h1a2.5 2.5 0 000-5c-2 0-3 3-3 7 M12 9V7a2 2 0 012-2h1a2.5 2.5 0 000-5c-2 0-3 3-3 7",
    settings: "M12 15a3 3 0 100-6 3 3 0 000 6z M19 12a7 7 0 00-.1-1.2l2-1.6-2-3.4-2.4 1a7 7 0 00-2-1.2L14 3h-4l-.5 2.6a7 7 0 00-2 1.2l-2.4-1-2 3.4 2 1.6A7 7 0 005 12c0 .4 0 .8.1 1.2l-2 1.6 2 3.4 2.4-1c.6.5 1.3.9 2 1.2L10 21h4l.5-2.6c.7-.3 1.4-.7 2-1.2l2.4 1 2-3.4-2-1.6c.1-.4.1-.8.1-1.2z",
    sync: "M4 12a8 8 0 0114-5.3M20 12a8 8 0 01-14 5.3 M15 4h5v5 M9 20H4v-5",
    search: "M11 19a8 8 0 100-16 8 8 0 000 16z M21 21l-4.3-4.3",
    clock: "M12 21a9 9 0 100-18 9 9 0 000 18z M12 7v5l4 2",
    chevron: "M9 6l6 6-6 6",
    download: "M12 3v13 M7 12l5 5 5-5 M5 21h14",
    printer: "M6 9V3h12v6 M6 18H4a1 1 0 01-1-1v-6a1 1 0 011-1h16a1 1 0 011 1v6a1 1 0 01-1 1h-2 M6 14h12v7H6z",
    plus: "M12 5v14M5 12h14",
    scan: "M4 7V4h3 M17 4h3v3 M20 17v3h-3 M7 20H4v-3 M4 12h16",
    lock: "M5 11h14v9H5z M8 11V7a4 4 0 118 0v4",
    truck: "M2 16V6h10v10H2z M12 10h5l3 3v3h-8z M6 19a2 2 0 100-4 2 2 0 000 4z M17 19a2 2 0 100-4 2 2 0 000 4z",
    link: "M9 15l6-6 M9 9h-2a4 4 0 000 8h2 M15 15h2a4 4 0 000-8h-2",
    arrowStart: "M15 6l-6 6 6 6",
    kanban: "M4 4h4v16H4z M10 4h4v10h-4z M16 4h4v13h-4z",
    eye: "M2 12s3.6-7 10-7 10 7 10 7-3.6 7-10 7-10-7-10-7z M12 15a3 3 0 100-6 3 3 0 000 6z",
    eyeOff: "M4 4l16 16 M10.5 6.3A9.6 9.6 0 0112 6c6.4 0 10 6 10 6a17 17 0 01-3.6 4.3 M6.5 7.6A17 17 0 002 12s3.6 6 10 6a9.7 9.7 0 003.6-.7",
    phone: "M6.5 3h4l2 5-2.5 1.5a12 12 0 005.5 5.5L17 12.5l5 2v4a2 2 0 01-2.2 2A17 17 0 014 5.2 2 2 0 016.5 3z",
    globe: "M12 21a9 9 0 100-18 9 9 0 000 18z M3 12h18 M12 3a15 15 0 010 18 M12 3a15 15 0 000 18",
    bolt: "M13 2L4 14h7l-1 8 9-12h-7l1-8z",
    layers: "M12 3l9 5-9 5-9-5 9-5z M3 13l9 5 9-5 M3 17l9 5 9-5"
  };
  function icon(name, size, cls) {
    var d = ICON_PATHS[name] || ICON_PATHS.list;
    size = size || 18;
    return '<svg width="' + size + '" height="' + size + '" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" class="' + (cls || "") + '">' +
      d.split(" M").map(function (seg, i) { return '<path d="' + (i === 0 ? seg : "M" + seg) + '"/>'; }).join("") + "</svg>";
  }

  /* ---------------- علامة المنصة ---------------- */
  function brandMarkSvg(size) {
    size = size || 34;
    return '<svg class="mk" width="' + size + '" height="' + size + '" viewBox="0 0 40 40" fill="none" aria-hidden="true">' +
      '<rect width="40" height="40" rx="11" fill="#0B3F33"/>' +
      '<path d="M20 8.6 30 12.4v7.9c0 6.1-4.3 9.8-10 11.6-5.7-1.8-10-5.5-10-11.6v-7.9L20 8.6z" fill="none" stroke="#fff" stroke-width="1.9" stroke-linejoin="round"/>' +
      '<path d="m15.6 19.8 3.1 3.1 5.9-6.3" fill="none" stroke="#B8862B" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"/>' +
      "</svg>";
  }
  function BrandMark(opts) {
    opts = opts || {};
    return '<a class="brandmark' + (opts.onDark ? " on-dark" : "") + '" href="' + (opts.href || "#/") + '">' +
      brandMarkSvg(opts.size) +
      '<span class="txt"><b>' + (opts.title || "المنصة الوطنية للخدمات الرقمية الطارئة") + "</b>" +
      '<i>' + (opts.sub || "YEDSP · الجمهورية اليمنية") + "</i></span></a>";
  }

  /* ---------------- عناصر النموذج ---------------- */
  function Field(opts) {
    opts = opts || {};
    var cls = "field" + (opts.error ? " has-error" : "");
    var tag = opts.textarea ? "textarea" : "input";
    var attrs = 'id="' + esc(opts.id) + '" name="' + esc(opts.id) + '"' +
      (opts.type && !opts.textarea ? ' type="' + opts.type + '"' : "") +
      (opts.placeholder ? ' placeholder="' + esc(opts.placeholder) + '"' : "") +
      (opts.required ? " required" : "") +
      (opts.disabled ? " disabled" : "") +
      (opts.rows ? ' rows="' + opts.rows + '"' : "") +
      (opts.min !== undefined ? ' min="' + opts.min + '"' : "") +
      (opts.max !== undefined ? ' max="' + opts.max + '"' : "") +
      (opts.attrs || "");
    var control = opts.textarea
      ? "<textarea " + attrs + ">" + esc(opts.value || "") + "</textarea>"
      : '<input ' + attrs + ' value="' + esc(opts.value === undefined ? "" : opts.value) + '">';
    return '<div class="' + cls + '">' +
      (opts.label ? '<label for="' + esc(opts.id) + '">' + esc(opts.label) + (opts.required ? ' *' : '') + '</label>' : "") +
      control +
      (opts.hint ? '<div class="hint">' + esc(opts.hint) + '</div>' : "") +
      (opts.error ? '<div class="err">' + esc(opts.error) + '</div>' : "") +
      "</div>";
  }
  function Select(opts) {
    opts = opts || {};
    var options = (opts.options || []).map(function (o) {
      var val = typeof o === "object" ? o.value : o;
      var label = typeof o === "object" ? o.label : o;
      var sel = String(val) === String(opts.value) ? " selected" : "";
      return '<option value="' + esc(val) + '"' + sel + ">" + esc(label) + "</option>";
    }).join("");
    return '<div class="field' + (opts.error ? " has-error" : "") + '">' +
      (opts.label ? '<label for="' + esc(opts.id) + '">' + esc(opts.label) + (opts.required ? ' *' : '') + '</label>' : "") +
      '<select id="' + esc(opts.id) + '" name="' + esc(opts.id) + '"' + (opts.required ? " required" : "") + '>' +
      (opts.placeholder ? '<option value="">' + esc(opts.placeholder) + '</option>' : "") +
      options + "</select>" +
      (opts.hint ? '<div class="hint">' + esc(opts.hint) + '</div>' : "") +
      "</div>";
  }
  function Checkbox(opts) {
    opts = opts || {};
    return '<div class="field"><div class="checkbox-row">' +
      '<input type="checkbox" id="' + esc(opts.id) + '" name="' + esc(opts.id) + '"' + (opts.checked ? " checked" : "") + '>' +
      '<label for="' + esc(opts.id) + '" style="margin:0">' + esc(opts.label) + '</label>' +
      "</div></div>";
  }
  function Button(opts) {
    opts = opts || {};
    var variant = "btn-" + (opts.variant || "secondary");
    return '<button type="' + (opts.type || "button") + '" id="' + esc(opts.id || "") + '" class="btn ' + variant + (opts.block ? " btn-block" : "") + (opts.sm ? " btn-sm" : "") + '"' +
      (opts.disabled ? " disabled" : "") + (opts.attrs || "") + ">" +
      (opts.icon ? icon(opts.icon, 18) : "") + "<span>" + esc(opts.label) + "</span></button>";
  }

  /* ---------------- بطاقة، شارة، جدول ---------------- */
  function Card(bodyHtml, opts) {
    opts = opts || {};
    return '<div class="card' + (opts.tight ? " tight" : "") + (opts.className ? " " + opts.className : "") + '">' +
      (opts.title ? '<div class="card-head"><h3>' + esc(opts.title) + '</h3>' + (opts.headerRight || "") + '</div>' : "") +
      bodyHtml + "</div>";
  }
  function Badge(text, tone) { return '<span class="badge b-' + (tone || "neutral") + '">' + esc(text) + "</span>"; }
  function PageHead(title, sub, actionsHtml) {
    return '<div class="page-head"><div class="txt"><div class="page-title">' + esc(title) + '</div>' +
      (sub ? '<div class="page-sub">' + esc(sub) + '</div>' : "") + '</div>' +
      (actionsHtml ? '<div class="row">' + actionsHtml + '</div>' : "") + '</div>';
  }

  var REQUEST_STATUS_META = {
    draft: { label: "مسودة", tone: "neutral" }, submitted: { label: "مُقدَّم", tone: "info" },
    reviewing: { label: "قيد الفحص", tone: "warn" }, approved: { label: "معتمد", tone: "ok" },
    rejected: { label: "مرفوض", tone: "crit" }, voucher: { label: "قسيمة صادرة", tone: "gold" },
    delivered: { label: "مصروف", tone: "ok" }
  };
  var VOUCHER_STATUS_META = { issued: { label: "صادرة", tone: "gold" }, delivered: { label: "مصروفة", tone: "ok" }, expired: { label: "منتهية", tone: "crit" } };
  var GENERIC_TONE = { "جديد": "info", "قيد الفرز": "warn", "قيد التحقيق": "crit", "مغلق": "neutral", "مفتوحة": "crit", "قيد المعالجة": "warn", "مغلقة": "ok", "نشط": "info", "مكتمل": "ok", "متأخر": "crit" };
  var SEVERITY_TONE = { "منخفضة": "ok", "متوسطة": "warn", "عالية": "crit" };

  function StatusBadge(kind, value) {
    if (kind === "request") { var m = REQUEST_STATUS_META[value] || { label: value, tone: "neutral" }; return Badge(m.label, m.tone); }
    if (kind === "voucher") { var v = VOUCHER_STATUS_META[value] || { label: value, tone: "neutral" }; return Badge(v.label, v.tone); }
    if (kind === "severity") return Badge(value, SEVERITY_TONE[value] || "neutral");
    return Badge(value, GENERIC_TONE[value] || "neutral");
  }

  function Table(opts) {
    opts = opts || {};
    var rows = opts.rows || [];
    if (!rows.length) return EmptyState(opts.empty || {});
    var thead = "<thead><tr>" + opts.columns.map(function (c) { return "<th" + (c.width ? ' style="width:' + c.width + '"' : "") + ">" + esc(c.label) + "</th>"; }).join("") + "</tr></thead>";
    var body = rows.map(function (r) {
      var attrs = opts.rowAttrs ? opts.rowAttrs(r) : "";
      var tds = opts.columns.map(function (c) {
        var content = c.render ? c.render(r) : esc(r[c.key]);
        return '<td data-label="' + esc(c.label) + '">' + content + "</td>";
      }).join("");
      return "<tr " + attrs + ">" + tds + "</tr>";
    }).join("");
    return '<div class="tbl-wrap"><table class="yt">' + thead + "<tbody>" + body + "</tbody></table></div>";
  }

  function MetricCard(opts) {
    opts = opts || {};
    var trendCls = opts.trend ? opts.trend.dir : "flat";
    var trendIcon = opts.trend ? (opts.trend.dir === "up" ? "▲" : opts.trend.dir === "down" ? "▼" : "—") : "";
    return '<div class="metric"><span class="mv">' + esc(opts.value) + "</span>" +
      '<div class="ml">' + esc(opts.label) + "</div>" +
      (opts.trend ? '<div class="mt ' + trendCls + '">' + trendIcon + " " + esc(opts.trend.text) + "</div>" : "") +
      "</div>";
  }

  function ProgressSteps(steps) {
    return '<div class="steps">' + steps.map(function (s, i) {
      return '<div class="step ' + s.state + '"><div class="bar"></div><div class="dot">' + (s.state === "done" ? icon("check", 13) : s.state === "rejected" ? icon("x", 13) : (i + 1)) + '</div><div class="lbl">' + esc(s.label) + "</div></div>";
    }).join("") + "</div>";
  }

  function EmptyState(opts) {
    opts = opts || {};
    return '<div class="empty">' +
      '<div class="ic">' + icon(opts.icon || "list", 30) + "</div>" +
      "<b>" + esc(opts.title || "لا توجد بيانات") + "</b>" +
      "<p>" + esc(opts.hint || "لا يوجد ما يُعرض هنا حالياً.") + "</p>" +
      (opts.action || "") + "</div>";
  }

  function Skeleton(kind) {
    if (kind === "cards") {
      return '<div class="grid g3">' + Array(3).fill('<div class="skel skel-block"></div>').join("") + "</div>";
    }
    if (kind === "detail") {
      return '<div class="skel skel-line" style="width:40%"></div><div class="skel skel-block"></div><div class="skel skel-line"></div><div class="skel skel-line" style="width:70%"></div>';
    }
    return '<div class="skel skel-line" style="width:30%"></div>' + Array(5).fill('<div class="skel skel-line"></div>').join("");
  }

  /* ---------------- الخارطة (SVG حقيقي لحدود محافظات اليمن الـ 22) ---------------- */
  function covColor(pct) { return pct >= 70 ? "#2E7D5B" : pct >= 40 ? "#B5811F" : "#B03A2E"; }
  var MUTED_FILL = "#D7DEDA";

  /* تخصيصات عرض التسميات:
     - short: اسم مختصر يُكتب على الخارطة بدل الاسم الكامل الطويل
     - callout: المحافظات الصغيرة جداً التي لا تتسع لاسمها، يُخرج اسمها إلى فراغ
       مجاور مع خط استدلال — أسلوب كارتوغرافي معتاد للجيوب الصغيرة */
  var MAP_LABELS = {
    "gov-sanaa-c": { short: "أمانة العاصمة", callout: { x: 62, y: 258 } },
    "gov-aden": { short: "عدن", callout: { x: 356, y: 664 } },
    "gov-socotra": { short: "سقطرى" }
  };
  // clearance = مدى اتساع المحافظة حول نقطة تسميتها (محسوب في data/geo.js).
  // نختار حجم الخط بناءً عليه بدل عرض الإطار، لأن الأشكال الوتدية إطارها أوسع من جسمها.
  var TIGHT_CLEARANCE = 30;

  function GovMap(highlightGovernorates, valueFn, opts) {
    opts = opts || {};
    var GEO = global.YEDSP_GEO;
    var showNames = opts.showNames !== false;
    var highlightMap = {};
    highlightGovernorates.forEach(function (g) { highlightMap[g.id] = g; });

    var idx = 0;
    var shapes = Object.keys(GEO.governorates).map(function (id) {
      var geo = GEO.governorates[id];
      var meta = MAP_LABELS[id] || {};
      var isHighlighted = !!highlightMap[id];
      var pct = isHighlighted ? valueFn(highlightMap[id]) : null;
      var color = isHighlighted ? covColor(pct) : MUTED_FILL;
      var bb = geo.bbox;
      var la = geo.labelAt || { x: bb.cx, y: bb.cy, clearance: 99 };
      var sel = opts.selectedId === id ? ' stroke="#101820" stroke-width="3"' : "";
      var clickable = isHighlighted || opts.clickableAll;
      var name = meta.short || geo.name;
      var delay = (idx++ * 22);

      var labelSvg = "";
      if (isHighlighted && showNames) {
        if (meta.callout) {
          // نقطة على الجيب + خط استدلال + التسمية في الفراغ المجاور
          labelSvg =
            '<line class="gov-callout-line" x1="' + meta.callout.x + '" y1="' + meta.callout.y + '" x2="' + la.x + '" y2="' + la.y + '"></line>' +
            '<circle class="gov-callout-dot" cx="' + la.x + '" cy="' + la.y + '" r="3.6"></circle>' +
            '<text class="gov-callout-name" x="' + meta.callout.x + '" y="' + (meta.callout.y - 4) + '" text-anchor="middle">' + esc(name) + "</text>" +
            '<text class="gov-callout-pct" x="' + meta.callout.x + '" y="' + (meta.callout.y + 12) + '" text-anchor="middle">' + pct + "%</text>";
        } else {
          var narrow = la.clearance < TIGHT_CLEARANCE;
          labelSvg =
            '<text class="gov-name' + (narrow ? " narrow" : "") + '" x="' + la.x + '" y="' + (la.y - 3) + '" text-anchor="middle">' + esc(name) + "</text>" +
            '<text class="gov-tile-pct' + (narrow ? " narrow" : "") + '" x="' + la.x + '" y="' + (la.y + (narrow ? 9 : 14)) + '" text-anchor="middle">' + pct + "%</text>";
        }
      } else if (isHighlighted && pct !== null) {
        labelSvg = '<text class="gov-tile-pct" x="' + la.x + '" y="' + la.y + '" text-anchor="middle">' + pct + "%</text>";
      }

      return '<g class="gov-g"' + (clickable ? ' data-gov="' + id + '" tabindex="0" role="button"' : "") +
        ' style="animation-delay:' + delay + 'ms"' +
        ' aria-label="' + esc(geo.name) + (isHighlighted ? " — التغطية " + pct + "%" : "") + '">' +
        '<path class="gov-tile' + (clickable ? "" : " gov-tile-muted") + '" d="' + geo.d + '" fill="' + color + '"' + sel + '><title>' + esc(geo.name) + (isHighlighted ? " — " + pct + "%" : "") + "</title></path>" +
        labelSvg +
        "</g>";
    }).join("");

    return '<div class="gov-map-wrap' + (showNames ? " named" : "") + '">' +
      '<svg class="gov-map" viewBox="' + GEO.viewBox + '" xmlns="http://www.w3.org/2000/svg">' + shapes + "</svg></div>";
  }

  // الربط على عنصر الـ svg نفسه (يُعاد إنشاؤه مع كل رسم) لا على الحاوية الثابتة،
  // حتى لا تتراكم المستمعات عند إعادة رسم الشاشة.
  function bindGovMap(container, onClick) {
    var svg = container.querySelector(".gov-map");
    if (!svg) return;
    svg.addEventListener("click", function (e) {
      var g = e.target.closest("[data-gov]");
      if (g) onClick(g.getAttribute("data-gov"));
    });
    svg.addEventListener("keydown", function (e) {
      if (e.key !== "Enter" && e.key !== " ") return;
      var g = e.target.closest("[data-gov]");
      if (g) { e.preventDefault(); onClick(g.getAttribute("data-gov")); }
    });
  }

  /* تلميح تفاعلي يتبع المؤشر — contentFn(govId) تُعيد HTML */
  function bindGovMapTooltip(container, contentFn) {
    var wrap = container.querySelector(".gov-map-wrap");
    if (!wrap) return;
    wrap.style.position = "relative";
    var tip = document.createElement("div");
    tip.className = "gov-tip hidden";
    wrap.appendChild(tip);

    function place(e, g) {
      var html = contentFn(g.getAttribute("data-gov"));
      if (!html) { tip.classList.add("hidden"); return; }
      tip.innerHTML = html;
      tip.classList.remove("hidden");
      // إحداثيات فيزيائية مقصودة هنا: طبقة عائمة تتبع المؤشر، لا تخطيط مستند
      var wr = wrap.getBoundingClientRect();
      var x = e.clientX - wr.left, y = e.clientY - wr.top;
      var tw = tip.offsetWidth, th = tip.offsetHeight;
      var left = Math.max(6, Math.min(wr.width - tw - 6, x - tw / 2));
      var top = (y - th - 14 < 6) ? y + 18 : y - th - 14;
      tip.style.transform = "translate(" + Math.round(left) + "px," + Math.round(top) + "px)";
    }
    wrap.addEventListener("mousemove", function (e) {
      var g = e.target.closest("[data-gov]");
      if (g) place(e, g); else tip.classList.add("hidden");
    });
    wrap.addEventListener("mouseleave", function () { tip.classList.add("hidden"); });
  }
  function mapLegend() {
    return '<div class="map-legend">' +
      '<span class="lg"><i class="sw" style="background:#2E7D5B"></i> تغطية جيدة (٧٠٪ فأعلى)</span>' +
      '<span class="lg"><i class="sw" style="background:#B5811F"></i> تغطية متوسطة (٤٠–٦٩٪)</span>' +
      '<span class="lg"><i class="sw" style="background:#B03A2E"></i> تغطية منخفضة (أقل من ٤٠٪)</span>' +
      "</div>";
  }

  /* ---------------- الرسوم البيانية (SVG بلا مكتبة) ---------------- */
  function BarChart(data, opts) {
    opts = opts || {};
    var W = opts.width || 560, rowH = 30, labelW = opts.labelWidth || 140;
    var max = opts.max || Math.max.apply(null, data.map(function (d) { return d.value; }).concat([1]));
    var H = data.length * rowH + 10;
    var valueColW = 46; // مساحة محجوزة أقصى اليسار لرقم القيمة عندما يكون الشريط قصيراً جداً
    var trackStartX = valueColW, trackEndX = W - labelW; // الشريط يبدأ ملاصقاً للتسمية (اليمين) ويكبر يساراً
    var barAreaW = trackEndX - trackStartX;
    var rows = data.map(function (d, i) {
      var y = i * rowH + 8;
      var w = Math.max(2, (d.value / max) * barAreaW);
      var barX = trackEndX - w;
      return '<text x="' + (W - 4) + '" y="' + (y + 14) + '" text-anchor="end" font-size="12" fill="#495259">' + esc(d.label) + "</text>" +
        '<rect x="' + trackStartX + '" y="' + y + '" width="' + barAreaW + '" height="16" rx="4" class="chart-bar-track"></rect>' +
        '<rect x="' + barX + '" y="' + y + '" width="' + w + '" height="16" rx="4" class="chart-bar"></rect>' +
        '<text x="' + (barX - 6) + '" y="' + (y + 13) + '" text-anchor="end" font-size="11.5" font-family="Courier New,monospace" fill="#101820">' + (opts.formatValue ? opts.formatValue(d.value) : fmtNum(d.value)) + "</text>";
    }).join("");
    return '<svg viewBox="0 0 ' + W + " " + H + '" style="width:100%;height:auto;display:block;direction:ltr">' + rows + "</svg>";
  }

  function DonutChart(data, opts) {
    opts = opts || {};
    var size = opts.size || 180, r = size / 2 - 14, cx = size / 2, cy = size / 2;
    var total = data.reduce(function (s, d) { return s + d.value; }, 0) || 1;
    var circumference = 2 * Math.PI * r;
    var offset = 0;
    var colors = opts.colors || ["#0E5140", "#B8862B", "#215E7C", "#B03A2E", "#7C868D"];
    var segs = data.map(function (d, i) {
      var frac = d.value / total;
      var len = frac * circumference;
      var seg = '<circle cx="' + cx + '" cy="' + cy + '" r="' + r + '" fill="none" stroke="' + (d.color || colors[i % colors.length]) + '" stroke-width="20" stroke-dasharray="' + len + " " + (circumference - len) + '" stroke-dashoffset="' + (-offset) + '" transform="rotate(-90 ' + cx + " " + cy + ')"></circle>';
      offset += len;
      return seg;
    }).join("");
    var legend = '<div class="stack" style="gap:6px">' + data.map(function (d, i) {
      return '<div class="row" style="gap:8px"><span style="width:11px;height:11px;border-radius:3px;background:' + (d.color || colors[i % colors.length]) + ';display:inline-block;flex-shrink:0"></span><span style="font-size:12.5px;flex:1">' + esc(d.label) + '</span><b class="mono" style="font-size:12px">' + fmtNum(d.value) + "</b></div>";
    }).join("") + "</div>";
    return '<div class="row" style="align-items:center;gap:20px;flex-wrap:wrap"><svg width="' + size + '" height="' + size + '" viewBox="0 0 ' + size + " " + size + '">' + segs +
      '<text x="' + cx + '" y="' + (cy - 2) + '" text-anchor="middle" font-size="20" font-weight="700" fill="#101820" font-family="Courier New,monospace">' + fmtNum(total) + '</text>' +
      '<text x="' + cx + '" y="' + (cy + 16) + '" text-anchor="middle" font-size="10.5" fill="#7C868D">' + esc(opts.centerLabel || "الإجمالي") + '</text>' +
      "</svg><div style='flex:1;min-width:160px'>" + legend + "</div></div>";
  }

  function LineChart(points, opts) {
    opts = opts || {};
    var W = opts.width || 560, H = opts.height || 160, pad = 24;
    var max = Math.max.apply(null, points.map(function (p) { return p.value; }).concat([1]));
    var stepX = (W - pad * 2) / Math.max(1, points.length - 1);
    var coords = points.map(function (p, i) {
      var x = pad + i * stepX, y = H - pad - (p.value / max) * (H - pad * 2);
      return x + "," + y;
    });
    var dots = points.map(function (p, i) {
      var xy = coords[i].split(",");
      return '<circle cx="' + xy[0] + '" cy="' + xy[1] + '" r="3.5" fill="#146953"></circle>' +
        '<text x="' + xy[0] + '" y="' + (H - 4) + '" text-anchor="middle" font-size="10.5" fill="#7C868D">' + esc(p.label) + '</text>';
    }).join("");
    return '<svg viewBox="0 0 ' + W + " " + H + '" style="width:100%;height:auto;display:block;direction:ltr">' +
      '<polyline points="' + coords.join(" ") + '" fill="none" stroke="#146953" stroke-width="2.5"></polyline>' + dots + "</svg>";
  }

  /* ---------------- الحوار (Dialog) — عنصر وحيد ثابت ---------------- */
  function initDialogHost() {
    if (document.getElementById("dlg-overlay")) return;
    var el = document.createElement("div");
    el.id = "dlg-overlay"; el.className = "hidden";
    el.innerHTML = '<div id="dlg-box" role="dialog" aria-modal="true"><h3 id="dlg-title"></h3><p id="dlg-body"></p><div class="dlg-actions"><button class="btn btn-quiet" id="dlg-cancel">إلغاء</button><button class="btn btn-primary" id="dlg-confirm">تأكيد</button></div></div>';
    document.body.appendChild(el);
    el.addEventListener("click", function (e) { if (e.target === el) hideDialog(); });
  }
  function showDialog(opts) {
    initDialogHost();
    document.getElementById("dlg-title").textContent = opts.title || "تأكيد الإجراء";
    document.getElementById("dlg-body").textContent = opts.body || "";
    var confirmBtn = document.getElementById("dlg-confirm");
    confirmBtn.textContent = opts.confirmLabel || "تأكيد";
    confirmBtn.className = "btn " + (opts.tone === "crit" ? "btn-crit" : "btn-primary");
    var cancelBtn = document.getElementById("dlg-cancel");
    cancelBtn.textContent = opts.cancelLabel || "إلغاء";
    var newConfirm = confirmBtn.cloneNode(true);
    confirmBtn.parentNode.replaceChild(newConfirm, confirmBtn);
    newConfirm.addEventListener("click", function () { hideDialog(); if (opts.onConfirm) opts.onConfirm(); });
    var newCancel = cancelBtn.cloneNode(true);
    cancelBtn.parentNode.replaceChild(newCancel, cancelBtn);
    newCancel.addEventListener("click", hideDialog);
    document.getElementById("dlg-overlay").classList.remove("hidden");
  }
  function hideDialog() { var el = document.getElementById("dlg-overlay"); if (el) el.classList.add("hidden"); }

  /* ---------------- التنبيه (Toast) — عنصر وحيد ثابت ---------------- */
  function initToastHost() {
    if (document.getElementById("toast-host")) return;
    var el = document.createElement("div");
    el.id = "toast-host";
    document.body.appendChild(el);
  }
  function toast(message, tone) {
    initToastHost();
    var host = document.getElementById("toast-host");
    var t = document.createElement("div");
    t.className = "toast " + (tone || "ok");
    t.innerHTML = icon(tone === "crit" ? "alert" : tone === "warn" ? "alert" : "check", 16) + "<span>" + esc(message) + "</span>";
    host.appendChild(t);
    setTimeout(function () { if (t.parentNode) t.parentNode.removeChild(t); }, 4200);
  }

  YEDSP.ui = {
    esc: esc, fmtNum: fmtNum, fmtMoney: fmtMoney, fmtDate: fmtDate, fmtDateTime: fmtDateTime, fmtCountdown: fmtCountdown,
    icon: icon, brandMarkSvg: brandMarkSvg, BrandMark: BrandMark,
    Field: Field, Select: Select, Checkbox: Checkbox, Button: Button,
    Card: Card, Badge: Badge, StatusBadge: StatusBadge, PageHead: PageHead, Table: Table, MetricCard: MetricCard,
    ProgressSteps: ProgressSteps, EmptyState: EmptyState, Skeleton: Skeleton,
    GovMap: GovMap, bindGovMap: bindGovMap, bindGovMapTooltip: bindGovMapTooltip,
    mapLegend: mapLegend, covColor: covColor,
    BarChart: BarChart, DonutChart: DonutChart, LineChart: LineChart,
    showDialog: showDialog, hideDialog: hideDialog, initDialogHost: initDialogHost,
    toast: toast, initToastHost: initToastHost
  };
})(window);
