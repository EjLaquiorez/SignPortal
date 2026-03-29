# SignPortal — Interface & functionality overview

This document **informs** anyone reading the repo what the application **already does**, what is **thin or missing**, and **where to look next**. It is not a spec; it is a snapshot you can refresh when major features land.

---

## Purpose

- **Stakeholders & reviewers:** Quick sense of scope without running the app.  
- **Developers:** Rough backlog aligned with the real codebase.  
- **Presenters:** Honest talking points for demos (what to show vs what to call “future work”).

For **file-by-file locations**, use [CODEBASE.md](CODEBASE.md). For **setup and run**, use [README.md](README.md).

---

## What the application does today

### Identity and access

Users **register** and **log in** with **JWT** auth. The UI and API enforce **roles**: **Personnel** (upload and participate in signing), **Authority** (approve/review), and **Admin** (route exists; see below). Invalid or expired tokens typically **clear the session** and send the user back to login.

### Documents

Users can **upload** files (with size validation and drag-and-drop on the upload flow), **list and filter** documents, **download** them, and see **status** (for example pending, in progress, completed, rejected). The app supports **metadata** (titles, dates, etc.), **document-level deadlines** with overdue handling in several screens, **attachments** separate from the main file, and **signed file versions** (history of uploaded signed copies).

### Workflow and approvals

Uploading can **create a multi-stage workflow**. Users see **stage progress**, a **pending approvals** view, and **rejection** with **reason** shown when the backend provides it. Workflow shape is partly driven by **server-side templates**, not necessarily a full visual “template designer” in the UI.

### Signatures

Users can **draw** a signature on a pad or **upload** a signature image; signatures are **stored and displayed** in document context.

### Notifications

There is an **in-app notification center** (with polling and marking items read). There is **no full email or push** product yet.

### Dashboard and UI

A **dashboard** shows useful counts and entry points. The app uses **responsive** layout patterns, **toasts** for feedback, and shared **loading / skeleton / empty-state** components in many places.

### Admin

The **admin URL is protected**, but the **admin screen is largely a placeholder** (“coming soon”). Day-to-day user and system administration is not fully implemented in the interface.

### Quality and operations

The backend includes a **functional/smoke test script** (`npm run test` from `backend` — see [backend/docs/TEST_GUIDE.md](backend/docs/TEST_GUIDE.md)). **Production-grade** hardening (HTTPS, rate limiting, advanced scanning, full E2E suites) is **not** described as complete here.

---

## Known gaps and typical next steps

Priorities depend on your course or product goals; these are **common** follow-ons:

| Theme | Examples |
|--------|----------|
| **Admin** | User list/CRUD, roles, system settings, audit log viewer, SMTP when email exists |
| **Documents** | In-browser **preview** (PDF/images first), **search**, bulk actions, tags/comments, upload progress bar |
| **Workflow** | Email when action needed, richer **visual** flow, parallel/conditional stages, escalation |
| **Account** | Password **reset**, email **verification**, profile and change-password |
| **Security & scale** | HTTPS, CSP, rate limits, tighter upload checks, token storage review |
| **Tests & docs** | Frontend unit tests, CI, E2E; end-user or admin guides |

---

## How to keep this document useful

1. After a **meaningful release**, skim the **“What the application does today”** section and fix anything that is no longer true.  
2. Move finished items out of **“Known gaps”** (or delete them).  
3. Add one-line bullets for **new** gaps instead of long specs.

---

## Related documentation

| Document | Role |
|----------|------|
| [README.md](README.md) | Install, run, default accounts |
| [CODEBASE.md](CODEBASE.md) | Where each folder and major file lives |
| [backend/docs/](backend/docs/) | Testing, access control, sample users |
| [samples/](samples/) | Sample data and seeding notes |

---

*Last updated: 2026-03-23*
