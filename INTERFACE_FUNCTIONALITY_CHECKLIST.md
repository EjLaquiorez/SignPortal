# SignPortal — Interface walkthrough checklist

This page is a **simple click-through list** for beginners. You go screen by screen in the browser and tick each box when it **works the way you expect**. You are not writing code here—just confirming the app behaves correctly after you follow [README.md](README.md) to start the backend and frontend.

**If you have not run the app yet:** read **[BEGINNERS_GUIDE.md](BEGINNERS_GUIDE.md)** first (how to open two terminals, what “frontend” and “backend” mean, and where to log in).

---

## Before you start ticking boxes

1. **Backend** is running (usually **http://localhost:5000**) and **frontend** is running (Vite often prints **http://localhost:5173**).
2. You can log in. After a fresh database, the default admin from the README is often **admin@signingportal.com** / **admin123**—change that password outside a demo.
3. **Roles** in this app are like job types: **Personnel** (often uploads), **Authority** (often approves), **Admin** (extra settings). Some screens only make sense for one role—skip or come back with another account if needed.

*Tip:* An **empty list** (no documents yet, nothing pending) is normal. You are checking that the **page loads** and **nothing crashes**, not that data is always there.

The short paths in parentheses (like `/login`) are the **URL tail** you see in the browser’s address bar—they help you know you are on the right screen.

---

## Screens anyone can see (before login)

- [ ] **Home** (`/`): The landing page opens. You can find links or buttons to **Login** and **Register**.
- [ ] **Register** (`/register`): You can create a new account (if your project allows registration). If something blocks sign-up, note it—you may rely on seeded users from the README instead.
- [ ] **Login** (`/login`): Signing in with a **correct** email and password works. With a **wrong** password, you get a clear message—not a broken blank page.

---

## After you log in (any normal user)

- [ ] **Dashboard** (`/dashboard`): The main “home” after login loads. You should not see a full-screen error.
- [ ] **Documents** (`/documents`): The documents list page opens. It may list zero items on a new database—that is fine.
- [ ] **Upload** (`/upload`): You can choose a file, submit, and then see that new item on **Documents** (or open it from there).
- [ ] **Document detail** (`/documents/…`): Clicking a document opens its detail page. You should see information about the file and something related to **workflow** or **steps** (words may vary in the UI).
- [ ] **Pending approvals** (`/pending`): This page opens. It may be empty if no item is waiting on you—still counts as “works.”

---

## Workflow and signing (try when it is “your turn”)

These steps depend on **who you are logged in as**. Use a Personnel or Authority account when the [README](README.md) happy path says that role acts.

- [ ] **Happy path:** After an upload, status or steps move forward toward **completion** in a way that matches the README story (upload → personnel steps → authority → done). You do not need perfect labels—just that progress feels logical.
- [ ] **Signatures:** When the app says it is your step to sign, you can **draw** or **attach** a signature (however the UI offers it) and save without a cryptic failure.
- [ ] **Notifications:** If the layout has a **bell**, **alerts**, or a notifications entry, open it. Marking read/unread (if offered) should not crash the app.

---

## Admin-only area

Log in as a user whose role is **Admin** (often the default admin account).

- [ ] **Admin** (`/admin`): The admin screen loads for an admin user.
- [ ] **Same URL as a non-admin:** Open `/admin` while logged in as **Personnel** or **Authority**. You should be **blocked** or **sent elsewhere**—not see full admin powers. (Security is enforced on the server too; this is just a quick UI check.)

---

## Good habits for beginners

- [ ] **Logout:** After logging out, visiting **Dashboard** or **Documents** should ask you to log in again (or redirect to login)—not show private data while “logged out.”
- [ ] **Browser Network tab (optional but useful):** Press **F12** → **Network**. Click something that loads documents or saves login. You should see requests going to your API (often **localhost:5000**). If you changed the API URL in config, expect that host instead.

---

*Last updated: 28 April 2026.*
