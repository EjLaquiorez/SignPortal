# SignPortal — Interface functionality checklist

Use this list to **manually verify** that main screens and flows work after you run the app. For setup, vocabulary, and how the stack fits together, start with **[BEGINNERS_GUIDE.md](BEGINNERS_GUIDE.md)** and [README.md](README.md).

**How to use:** With backend + frontend dev servers running, log in (or register) and check each item. Roles matter for some routes—use accounts with **Personnel**, **Authority**, and **Admin** as needed.

---

## Public

- [ ] **Home** (`/`) loads and navigation to login/register works.
- [ ] **Register** (`/register`) can create a new user (if enabled in your build).
- [ ] **Login** (`/login`) succeeds with a known user; invalid credentials show a sensible error.

## Authenticated (any logged-in user)

- [ ] **Dashboard** (`/dashboard`) loads without errors.
- [ ] **Documents** (`/documents`) lists documents (may be empty on a fresh DB).
- [ ] **Upload** (`/upload`) accepts a file and creates a document you can see in the list.
- [ ] **Document detail** (`/documents/:id`) opens from the list; metadata and workflow area render.
- [ ] **Pending approvals** (`/pending`) loads (may be empty if nothing is waiting on this user).

## Workflow & signing (as appropriate for the test user’s role)

- [ ] Workflow stages or status update in a way that matches the happy path (upload → personnel → authority → completed, per [README.md](README.md)).
- [ ] **Signature** capture or attach works when it is the user’s step.
- [ ] **Notifications** (nav or bell, if present) can be opened; mark read/unread behaves reasonably.

## Admin only

- [ ] **Admin** (`/admin`) is reachable with an **admin** account and blocked or redirected for non-admin users.

## Cross-cutting

- [ ] **Logout** clears session and protected routes send you back to login.
- [ ] **Developer tools → Network:** actions on documents/auth hit `localhost:5000` (or your configured API base).

---

*Last updated: 28 April 2026.*
