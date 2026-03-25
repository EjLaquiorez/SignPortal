# SignPortal — Interface & functionality checklist

This file tracks **what the app already does** versus **sensible next steps**. Sections follow a **user-journey order** (sign in → documents → workflow → signatures → alerts → admin), then **UI and quality**, then **platform and engineering**.

**How to use it:** skim top to bottom for planning; update checkboxes when you ship something; keep “Gaps” honest so demos and README stay accurate.

---

## Table of contents

1. [Authentication & authorization](#1-authentication--authorization)  
2. [Document management](#2-document-management)  
3. [Workflow & approval](#3-workflow--approval)  
4. [Signatures](#4-signatures)  
5. [Notifications & communication](#5-notifications--communication)  
6. [Admin panel](#6-admin-panel)  
7. [UI & UX](#7-ui--ux)  
8. [Error handling & validation](#8-error-handling--validation)  
9. [Performance & optimization](#9-performance--optimization)  
10. [Security (production hardening)](#10-security-production-hardening)  
11. [Reporting & analytics](#11-reporting--analytics)  
12. [Internationalization](#12-internationalization)  
13. [Native mobile (future)](#13-native-mobile-future)  
14. [Integrations & API](#14-integrations--api)  
15. [Testing & QA](#15-testing--qa)  
16. [Documentation](#16-documentation)  

---

## 1. Authentication & authorization

### Implemented

- [x] Login and registration  
- [x] JWT-based authentication  
- [x] Protected routes (frontend) and protected API routes (backend)  
- [x] Role-based access: Personnel, Authority, Admin  
- [x] Expired/invalid token handling (API 401 clears client session and redirects to login)  

### Gaps and improvements

- [ ] Password strength rules and inline hints  
- [ ] Password reset (email or admin-assisted)  
- [ ] Email verification on registration  
- [ ] Optional “remember me” / longer-lived session policy (document tradeoffs)  
- [ ] Optional token refresh before expiry (smoother than hard logout)  
- [ ] Two-factor authentication (2FA)  
- [ ] Account lockout after repeated failed logins  
- [ ] User profile: edit name, change password  
- [ ] Per-user activity history in the UI (beyond server logs)  

---

## 2. Document management

### Implemented

- [x] Upload with validation (size limit; configurable, often ~50MB)  
- [x] Listing with filters and status  
- [x] Sorting (e.g. by deadline) where exposed in the documents UI  
- [x] Download  
- [x] Status tracking: pending, in_progress, completed, rejected  
- [x] Metadata (title, dates, uploader, etc., per schema)  
- [x] **Signed file versions** — upload/list/download version history for a document  
- [x] **Attachments** on a document (separate from main file)  
- [x] **Document-level deadline** (capture, display, overdue highlighting in several views)  
- [x] **Drag-and-drop** file choice on upload (where implemented on upload flow)  

### Gaps and improvements

- [ ] Rich **preview** in-browser (PDF/images first; Office formats harder)  
- [ ] **Search** across title/metadata (full-text optional)  
- [ ] Bulk select / bulk actions on the list  
- [ ] Categories, tags, or folders  
- [ ] Sharing to specific users (beyond workflow assignment)  
- [ ] Threaded comments or notes on a document  
- [ ] Tighter **allowlist** of file types (beyond basic checks) + clearer UX when rejected  
- [ ] Upload **progress bar** (percentage) for large files  
- [ ] Soft delete, archive, or restore  
- [ ] Export document list (CSV/Excel)  

---

## 3. Workflow & approval

### Implemented

- [x] Multi-stage workflow creation (including automatic creation on upload)  
- [x] Stage display, assignment, and status  
- [x] Pending approvals view  
- [x] **Deadlines** at document and stage level (display + overdue treatment in UI)  
- [x] Rejection path with **reason** surfaced in the UI when provided  
- [x] Backend **workflow templates** (configuration-driven; not necessarily a user-facing template editor)  

### Gaps and improvements

- [ ] Standalone **flow diagram** (visual graph beyond step list)  
- [ ] **User-defined** saved workflow templates (create/edit in UI)  
- [ ] Drag-and-drop **reorder** of stages before submission  
- [ ] **Parallel** approvers at one stage  
- [ ] **Conditional** branching between stages  
- [ ] **Email** (or SMS) when a stage is waiting on someone  
- [ ] Automatic **escalation** when overdue (notify manager, reassign, etc.)  
- [ ] Full **timeline** / audit view dedicated to one workflow run  
- [ ] Comments per stage (threaded)  
- [ ] **Require** rejection reason (if not already enforced end-to-end)  
- [ ] Cancel in-flight workflow  
- [ ] Bulk approve  
- [ ] Delegation (“approve on my behalf”)  
- [ ] Analytics: time-in-stage, bottlenecks  

---

## 4. Signatures

### Implemented

- [x] Draw signature on pad  
- [x] Upload signature image  
- [x] Persist and display signatures with document context  

### Gaps and improvements

- [ ] Place signature on a **coordinates** overlay of a rendered document  
- [ ] Multiple signature fields / anchors  
- [ ] Prominent **timestamp** on saved signature display (if not already stored visibly)  
- [ ] Cryptographic / PKI verification (out of scope for many class projects; note if asked)  
- [ ] Saved personal signature templates  
- [ ] Preview on document before commit  
- [ ] Resize / rotate signature graphic  
- [ ] Signature-focused audit log in UI  
- [ ] Bulk sign  
- [ ] Pad UX: undo/redo, pen width, color, stronger touch targets  

---

## 5. Notifications & communication

### Implemented

- [x] **In-app** notification center (header), list + unread count  
- [x] Polling for updates (periodic refresh)  
- [x] Mark one / mark all as read (via API)  

### Gaps and improvements

- [ ] **Email** notifications (uploaded, needs signature, needs approval, completed, rejected, etc.)  
- [ ] True **real-time** delivery (WebSocket/SSE) instead of or in addition to polling  
- [ ] User **preferences** (which events, email vs in-app only)  
- [ ] Browser **push** notifications  

---

## 6. Admin panel

### Implemented

- [x] Admin-only route protection  

### Gaps and improvements (high impact for “operations” use cases)

- [ ] **Replace placeholder admin screen** (“coming soon”) with real admin tools  
- [ ] User management: list, create/edit/deactivate, roles, password reset  
- [ ] System settings: defaults, upload limits, allowed types  
- [ ] Audit log viewer (filter, export)  
- [ ] Analytics beyond the main user dashboard (system-wide)  
- [ ] Optional: custom roles and permission matrix  
- [ ] Optional: override/delete documents, force-complete workflow (dangerous; audit required)  
- [ ] Backup/restore documentation or scripts for operators  
- [ ] SMTP settings for email features once added  

---

## 7. UI & UX

### Implemented

- [x] Responsive layout (sidebar, header, mobile menu patterns)  
- [x] Dashboard with statistics and links  
- [x] **Toast** feedback for actions (`ToastContext`)  
- [x] **Skeleton** and **Loading** components  
- [x] **EmptyState** component for empty lists  
- [x] Theme-oriented styling (`theme.css`, `responsive.css`)  

### Gaps and improvements

- [ ] Apply skeletons/empty states **consistently** on every slow or empty view  
- [ ] Friendlier, consistent **error** copy (map API errors to human text)  
- [ ] Dark mode toggle  
- [ ] Accessibility pass: keyboard paths, focus rings, ARIA, contrast (WCAG-oriented)  
- [ ] Stronger **mobile** polish (tables, modals, touch targets)  
- [ ] Breadcrumbs  
- [ ] Contextual help / tooltips  
- [ ] Onboarding tour for first login  
- [ ] Keyboard shortcuts  
- [ ] Pagination or virtualized lists for very large datasets  
- [ ] Optional grid vs list view for documents  
- [ ] Print / export from UI where reports exist  

---

## 8. Error handling & validation

### Implemented

- [x] Basic API error responses and client handling  
- [x] File size and basic type checks on upload  

### Gaps and improvements

- [ ] Form-level validation with inline field errors  
- [ ] React **error boundary** on route or app shell  
- [ ] Offline / flaky network detection and retry  
- [ ] Client error logging (e.g. to a service) in production  
- [ ] Stronger input sanitization story for rich text if added later  
- [ ] Virus/malware scanning on upload (organizational requirement)  

---

## 9. Performance & optimization

### Implemented

- [x] Standard React + Vite dev/build pipeline  

### Gaps and improvements

- [ ] Lazy-loaded routes (code splitting)  
- [ ] Memoization where lists are heavy  
- [ ] Server-side pagination/filtering for huge document sets  
- [ ] Virtual scrolling for long lists  
- [ ] Debounced search when implemented  
- [ ] Bundle analysis and trim  
- [ ] Service worker / offline (only if product needs it)  
- [ ] CDN for static assets in production  

---

## 10. Security (production hardening)

### Implemented (baseline)

- [x] JWT authentication  
- [x] Password hashing (bcrypt)  
- [x] Role checks on sensitive operations  

### Gaps and improvements

- [ ] HTTPS-only deployment configuration  
- [ ] Content Security Policy and other security headers  
- [ ] Rate limiting on auth and upload endpoints  
- [ ] Token storage strategy review (httpOnly cookies vs localStorage tradeoffs)  
- [ ] File inspection: magic-byte type check, quarantine, scanning  
- [ ] Structured security/audit logging  
- [ ] Optional: login history, alerts, IP allowlists  

---

## 11. Reporting & analytics

### Implemented

- [x] Dashboard statistics for the logged-in user’s scope  

### Gaps and improvements

- [ ] Saved reports (by status, date range, user)  
- [ ] Workflow timing / bottleneck reports  
- [ ] Export PDF/Excel  
- [ ] Charts  
- [ ] Scheduled reports  

---

## 12. Internationalization

### Implemented

- [x] English UI only  

### Gaps and improvements

- [ ] Language selector and translation files  
- [ ] Locale-aware dates/numbers  
- [ ] RTL layout support if targeting RTL languages  

---

## 13. Native mobile (future)

### Implemented

- [x] Responsive web (primary mobile strategy today)  

### Gaps and improvements

- [ ] Native iOS/Android apps  
- [ ] Camera capture, offline, OS-level push (if native)  

---

## 14. Integrations & API

### Implemented

- [x] REST API consumed by the SPA  

### Gaps and improvements

- [ ] OpenAPI/Swagger documentation  
- [ ] Webhooks for external systems  
- [ ] Integrations: cloud storage, calendar, CRM (product-dependent)  
- [ ] API versioning and API keys for machine clients  

---

## 15. Testing & QA

### Implemented

- [x] Backend **smoke / functionality** script (`npm run test` in backend — see backend docs)  

### Gaps and improvements

- [ ] Frontend unit tests (components/hooks)  
- [ ] API integration test suite in CI  
- [ ] End-to-end tests (Playwright/Cypress)  
- [ ] Accessibility and performance testing as part of release habit  
- [ ] Cross-browser and device matrix for major releases  

---

## 16. Documentation

### Implemented

- [x] Root `README.md`, `CODEBASE.md`, `backend/docs/`, samples guides  

### Gaps and improvements

- [ ] End-user manual (PDF or in-app help)  
- [ ] Admin runbook (deploy, backup, rotate secrets)  
- [ ] Video walkthroughs  
- [ ] FAQ and changelog discipline  

---

## Prioritization

Use **product risk** and **demo promises** to order work, not this file’s order.

| Priority | Meaning |
|----------|---------|
| **High** | Blocks real use, security, or a committed roadmap item (e.g. admin tools, email alerts). |
| **Medium** | Clear user pain or competitive parity (preview, search, bulk actions). |
| **Low** | Nice-to-have polish (themes, shortcuts, extra integrations). |

---

## Maintenance

- Revisit after major features merge; fix “Implemented” if the code drifted.  
- Prefer a short note and date in git when you bulk-update this file.  

**Last updated:** 2026-03-23  
