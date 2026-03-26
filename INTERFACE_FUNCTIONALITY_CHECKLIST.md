# SignPortal — Interface & functionality checklist (short)

What works today vs what to build next. Update when you ship; see [CODEBASE.md](CODEBASE.md) for where things live.

---

## Core features

| Area | Done | Next (examples) |
|------|------|------------------|
| **Auth** | Login/register, JWT, protected routes, Personnel / Authority / Admin, 401 → logout | Password reset, verification, strength hints, profile & change-password, optional 2FA / lockout |
| **Documents** | Upload (size/type checks, drag-drop), list/filter/sort, download, status, metadata, **versions**, **attachments**, **deadlines**, overdue cues | In-browser preview, search, bulk actions, tags, comments, stricter type allowlist, upload progress %, archive/export |
| **Workflow** | Multi-stage flows, pending queue, stage deadlines, rejection reason in UI, config-level templates | Visual flowchart, user-editable templates, parallel/conditional stages, **email** nudges, escalation, stage comments, cancel/bulk/delegate, analytics |
| **Signatures** | Draw + upload image, store, show on document | Overlay placement, multiple fields, PKI (if needed), templates, better pad controls |
| **Notifications** | In-app center, polling, mark read | Email, WebSocket/SSE, preferences, browser push |
| **Admin** | Route locked to admin | Replace “coming soon”: user CRUD, settings, audit viewer, SMTP when email exists |

---

## UI & UX

**Done:** Responsive shell, dashboard, toasts, skeleton/loading/empty components, theme CSS.

**Next:** Consistent empty/skeleton everywhere, clearer errors, a11y pass, dark mode, mobile polish, breadcrumbs/help, pagination/virtual lists for huge tables.

---

## Quality, security & production

**Done:** Basic API errors; upload validation; bcrypt password hashing; role checks.

**Next:** Inline form validation, error boundaries, retry/offline messaging; lazy routes, server pagination, bundle trim; **HTTPS**, CSP, rate limits, tighter file checks (magic bytes), token storage review, security audit logging.

---

## Reports, i18n, mobile, API

**Done:** Per-user dashboard stats; English; responsive web; REST API for the app.

**Next:** Saved/export reports and charts; locales + RTL; native apps only if required; OpenAPI, webhooks, API keys.

---

## Engineering & docs

**Done:** Backend smoke tests (`npm run test`); README, CODEBASE, `backend/docs/`, samples.

**Next:** FE unit tests, API integration + E2E in CI; user/admin guides, changelog habit.

---

## Priorities

- **High** — Real admin tools, email alerts, production security basics, anything you promise in demo.  
- **Medium** — Preview, search, bulk ops, workflow polish.  
- **Low** — Themes, shortcuts, extra integrations.

---

**Last updated:** 2026-03-23  
