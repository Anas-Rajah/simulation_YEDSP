# DEMO_PROMPT.md — YEDSP Click-Through Simulation (Frontend Only)

> **Purpose of this prompt:** build a **fully clickable visual simulation** of the entire YEDSP platform — every screen, every role, every space — with **zero backend, zero database, zero real auth**. This is not BUILD_SPEC.md. This is a fast, smooth, self-contained prototype to demo the full product vision before real engineering begins.
>
> **How to use:** put this file in a fresh empty folder (separate from the real BUILD_SPEC.md project) and tell Claude Code: `Read DEMO_PROMPT.md, then build it.` This can be done in one pass — no phases, no waiting for approval between steps, unless you hit a wall.

---

## 1. What you are building

A **static, self-contained, click-through simulation** of the Yemen Emergency Digital Services Platform (YEDSP). It looks and feels like the real product, lets a reviewer click through every screen and every role, and shows realistic Arabic data everywhere — but nothing is real:

- No server, no API, no database.
- No real authentication — a "role switcher" lets the demo user jump straight into any of the 10 roles.
- All data is fake, pre-written, and baked into the app at load time.
- Any "action" (approve a request, deliver a voucher, close a complaint) updates the in-memory state instantly and visibly, so the demo *feels* alive, but nothing persists past a page reload unless you use `localStorage` purely for demo continuity (see section 7).

**The single goal: someone opens this in a browser, picks a role, clicks around, and experiences the entire product end to end, smoothly, with no errors, no dead links, no "coming soon."**

---

## 2. Hard constraints

1. **One static site. No build step required to view it.** Plain HTML/CSS/vanilla JavaScript. No React, no Vue, no bundler, no npm build pipeline the reviewer has to run. Opening `index.html` (or running one trivial static server) must just work.
2. **No backend of any kind.** No FastAPI, no database, no API calls. Everything lives in a single JavaScript data file loaded at startup.
3. **No real security anything.** No password hashing, no JWT, no encryption. This is a facade — treat it accordingly and don't over-engineer it.
4. **Every screen must be reachable and populated.** No "Screen not implemented yet" placeholders. If a screen is in the map in section 5, it exists, it has fake data, and it works.
5. **Smoothness over completeness of logic.** Prioritize: does every click do something sensible and instant? Over: is the business logic exactly correct? This is a demo of the *experience*, not a certified implementation.
6. **Everything in Arabic, RTL.** All numerals are Latin (0-9).
7. **Follow the visual identity in section 4 exactly.** This is what makes it look like a real product instead of a wireframe.
8. **No `TODO`, no `Lorem ipsum`, no placeholder Arabic gibberish.** Every piece of fake data should read like something a real Yemeni humanitarian platform would actually contain — real-sounding names, real governorate names, plausible amounts, plausible dates within 2026.

---

## 3. Tech approach

| Piece | Choice |
|---|---|
| Structure | One `index.html` shell + client-side view router (hash-based, e.g. `#/citizen/home`) |
| Styling | Plain CSS with custom properties (design tokens below). No framework. |
| Interactivity | Vanilla JS, ES modules. `Alpine.js` via CDN is allowed if it makes state binding meaningfully easier — optional, not required. |
| State | A single in-memory JS store (`window.demoState` or a module-scoped object) seeded from `data/seed.js` at load. |
| Persistence | `localStorage`, **only** to remember which role is active and to persist demo actions across a reload within the same browser session (see section 7). Never treat this as a real requirement — if it's easier to skip persistence entirely and just reset on reload, that's acceptable too. |
| Charts / maps | Inline SVG, hand-built or generated from the seed data at render time. No charting library, no map library. |
| Icons | Simple inline SVG icons you draw yourself (16-24px, stroke-based, minimal). No icon font, no external icon library dependency that requires a build step. |
| Assets | No external images. Everything is CSS, SVG, and text. |

**Folder structure:**

```
yedsp-demo/
├── index.html
├── css/
│   ├── tokens.css
│   ├── components.css
│   └── layout.css
├── js/
│   ├── router.js          # hash-based view router
│   ├── state.js            # in-memory store + localStorage bridge
│   ├── components.js       # reusable render functions (button, card, badge, table, etc.)
│   └── views/               # one file per screen or per space
│       ├── citizen.js
│       ├── field.js
│       ├── reviewer.js
│       ├── distributor.js
│       ├── operations.js
│       ├── protection.js
│       ├── donor.js
│       └── admin.js
├── data/
│   └── seed.js              # ALL fake data lives here, nowhere else
└── README.md                 # "open index.html" instructions
```

---

## 4. Visual identity (must match exactly)

```css
:root{
  /* Institutional base */
  --green-900:#0B3F33;  --green-800:#0E5140;  --green-700:#146953;
  --green-100:#DDEBE5;
  /* Gold — primary action ONLY, one button per screen */
  --gold-700:#8F6417;   --gold-600:#B8862B;   --gold-100:#FBF1DC;
  /* Text and surfaces */
  --ink:#101820;  --ink-2:#495259;  --ink-3:#7C868D;
  --paper:#F4F6F5; --card:#FFFFFF; --line:#DDE3E0;
  /* Semantic */
  --ok:#2E7D5B; --warn:#B5811F; --crit:#B03A2E; --info:#215E7C;
  /* Spacing — 4px unit */
  --s1:4px; --s2:8px; --s3:12px; --s4:16px; --s6:24px; --s8:32px; --s12:48px;
  --radius:8px; --radius-sm:4px;
}
```

**Rules:**
- Gold is used for exactly one primary action button per screen. Nothing else is gold.
- No web fonts anywhere in this demo. Use `system-ui, 'Noto Sans Arabic', sans-serif` for everything, including staff screens — this is a demo, load speed matters more than typographic polish.
- No shadows. Borders only.
- Type scale: 24px page title · 18px section heading · 15px body · 13px secondary · 12px label minimum.
- Single column layout under 768px width; tables become stacked cards.
- Every status must be legible from its text label alone, not colour alone.
- Logical CSS only: `margin-inline-start`, never `margin-left`.

**The 12 reusable components** (build each once in `components.js`, reuse everywhere):
1. Button — primary (gold) / secondary (green outline) / quiet (text)
2. Input field — label above, never inside
3. Card — white, 1px border, 8px radius, no shadow
4. Status badge — text + light background colour
5. Table — collapses to stacked cards on mobile
6. Map — inline SVG of Yemen's 22 governorates with a coverage colour ramp
7. Metric card — big number + label + trend arrow
8. Chart — SVG bar / line / donut, generated from seed data
9. Progress steps — for the request lifecycle
10. Dialog — confirmation modal for irreversible-feeling actions
11. Alert / toast — for "action succeeded" feedback after clicks
12. Empty state — friendly explanation + suggested next step

---

## 5. The screen map — build every one of these

### Role switcher (entry point)
A landing screen before anything else: a grid of 10 role cards (citizen, surveyor, field coordinator, ops manager, reviewer, distributor, auditor, donor, admin, integrator). Clicking one "logs in" as that role and drops the user into that role's home screen with the right navigation. A persistent "switch role" control stays visible in the header at all times so the reviewer never has to reload to change roles.

### Citizen portal (7 screens)
Home · Identity registration · Submit a request · My requests · Request detail · My voucher (QR + PIN placeholder, PIN never shown as a real value — show "••••" with a note "sent via SMS") · Submit and track a complaint (supports anonymous submission)

### Field app (5 screens)
My assignments · Register a beneficiary · Verify identity · Report a crisis · Sync status and queue (show a fake pending-operations counter and a "simulate going offline / back online" toggle that visibly changes the status bar)

### Review space (4 screens)
Request queue (sorted by vulnerability score and SLA countdown) · Review a request (approve/reject buttons that actually update the queue) · My decisions log · Beneficiary search

### Distribution space (3 screens)
Scan voucher (a fake "scan" button that picks a random pending voucher) · Confirm delivery with PIN · Daily site delivery log

### Operations space (6 screens)
National map (interactive SVG, all 22 governorates, clickable, colour-coded by coverage) · Governorate detail · Field assignments · Crisis log · Performance indicators · Operational reports

### Protection space (3 screens)
Complaint triage board (kanban-style columns by status) · Complaint detail and investigation · Audit trail viewer (show a scrolling list of fake hash-chained entries with a "verify chain" button that always succeeds with a satisfying animation)

### Donor space (3 screens)
My grants dashboard · Geographic distribution of a grant (map + breakdown table) · Reports and impact certificates (a certificate-style printable view)

### Admin console (3 screens)
Accounts · Permission matrix (a real toggleable grid — role × permission checkboxes that visibly update) · References and SLA settings

**Total: 34 screens across 9 spaces plus the role switcher. Every single one must render with real-looking fake data and be reachable via navigation, not just via URL.**

---

## 6. Fake data requirements (`data/seed.js`)

Build one JS module exporting everything below. This is the heart of the demo — invest real effort here, because good fake data is what makes the simulation feel alive.

- **22 governorates**, real Arabic names, matching Yemen's actual governorates (أمانة العاصمة، صنعاء، مأرب، الجوف، البيضاء، شبوة، حضرموت، المهرة، صعدة، عمران، ذمار، عدن، تعز، الحديدة، أرخبيل سقطرى، لحج، أبين، الضالع، إب، حجة، المحويت، ريمة), each with a random-but-plausible coverage percentage between 20% and 95%.
- **5 sectors**: الأمن الغذائي · المياه والإصحاح · الصحة والتغذية · المأوى والمواد · التعليم والحماية
- **~40 citizens** with realistic Yemeni names, masked national IDs (`***-***-4821` style), assigned to governorates.
- **~60 aid requests** spread across all statuses (draft, submitted, reviewing, approved, rejected, voucher, delivered), with vulnerability scores, sectors, and dates within 2026.
- **~30 vouchers** in mixed states (issued, delivered, expired) linked to approved requests.
- **~15 complaints** across all three categories (S/F/O) and all statuses, at least 3 of them anonymous, at least 2 already escalated to a linked crisis.
- **~10 crises** across severities and statuses, distributed across governorates.
- **~20 field assignments** for a handful of named surveyors.
- **A risk register** with 6-8 entries, varied probability/impact.
- **4-5 donors** (e.g. WFP, GIZ, FCDO-style names) each with 1-2 grants and several governorate allocations.
- **~10 users**, one or more per role, with Arabic names and titles, so the admin screens have something real to display.
- **A pre-built fake audit trail** of ~50 chained entries with plausible-looking hex hashes (they don't need to be real SHA-256 output — just 64 hex-looking characters is enough for the demo).

Every number that appears on a dashboard (coverage %, SLA breach rate, average review time, etc.) should be **computed from this seed data at render time**, not hardcoded separately — so that when a demo action changes something (e.g. approving a request), the dashboards visibly reflect it.

---

## 7. Making actions feel real

Since there's no backend, "real" actions must still produce visible, immediate feedback:

- **Approving a request** → moves it to `approved`, generates a fake voucher, shows a success toast, updates the reviewer's queue count and the citizen's request-tracking screen (if the reviewer switches role to citizen and looks it up).
- **Delivering a voucher** → moves it to `delivered`, appends a fake audit entry to the in-memory trail, nudges the relevant governorate's coverage percentage on the map and dashboards.
- **Escalating a complaint** → creates a linked crisis, and it appears immediately in the operations space's crisis log.
- **Toggling a permission** in the admin matrix → immediately changes what that role's navigation shows if you switch into it.
- **The offline/online toggle in the field app** → visibly changes the status bar text and the pending-operations counter; clicking "sync now" clears the counter with a short animated delay (even just a `setTimeout`) so it feels like something happened.

Use `localStorage` to persist this in-memory state across a page reload **only if it's low-effort to do so** — otherwise, resetting to the fresh seed data on every reload is a perfectly acceptable and simpler choice. State whichever you chose in the README.

---

## 8. Definition of done for this demo

- [ ] Opening `index.html` in a browser (or via `python -m http.server`) works immediately, no build step, no console errors.
- [ ] The role switcher works and every one of the 10 roles lands on a populated, correct home screen.
- [ ] All 34 screens listed in section 5 are reachable through in-app navigation (not just by typing a URL) and none show a placeholder.
- [ ] The national map renders all 22 governorates and is clickable.
- [ ] At least one approve → voucher → deliver flow can be clicked through start to finish and the change is visible on more than one screen.
- [ ] At least one complaint → escalate → crisis flow can be clicked through and the new crisis appears in the operations space.
- [ ] The admin permission matrix visibly changes navigation for a role when toggled.
- [ ] Every screen implements a **loading flash** (even a brief artificial 200-300ms skeleton state is enough to sell the feel), an **empty state** demo path is not required everywhere but should exist somewhere (e.g. filter the citizen's request list to show zero results), and an obvious **error state is not required** since nothing can actually fail — skip it here, unlike the real BUILD_SPEC.
- [ ] No horizontal scroll anywhere at 375px width.
- [ ] Exactly one gold button per screen.
- [ ] Total page weight stays reasonably light — this is a demo, not the real citizen-portal-under-500KB build, so this is a soft target, not a hard one.

---

## 9. What NOT to do

- Do not wire this to any real API, even a mock one behind `fetch`. Just read from the in-memory store directly.
- Do not implement real password checking, real hashing, or real JWTs. The "login" is just clicking a role card.
- Do not build this with React/Vue or any framework requiring a build step — the whole point is that anyone can open `index.html` and see it work with zero setup.
- Do not reuse or reference the real BUILD_SPEC.md database schema, migrations, or API contract — this is a completely separate, disposable, frontend-only artifact.
- Do not spend time on business-logic correctness edge cases (idempotency keys, hash chain math, SLA precision). This demo optimizes for *looking and feeling* like the real product, not for being correct.

---

## Start now

Build the whole thing in this session — there is no need to stop between phases for this prompt, since there's no risk of breaking real infrastructure. If you hit a genuinely ambiguous product decision not covered here, make the most visually convincing choice and move on; note it briefly in the README rather than stopping to ask.

When done, report:
1. The file tree you created
2. How to run it (should be a one-liner)
3. A short list of anything you simplified or faked more than the spec implied
