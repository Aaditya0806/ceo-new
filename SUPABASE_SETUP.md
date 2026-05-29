# Supabase Setup Guide — CEO HR Consultancy CMS

This is a **non-developer-friendly** guide to wire up the admin panel that comes with this site. By the end, your client will be able to log in to `/admin.html`, edit any text or image on the site, click **Publish**, and visitors will see the change in 1–2 seconds — no rebuilds, no developer needed.

You only have to do this once. Plan for ~20 minutes.

---

## What you'll need

- A free [Supabase](https://supabase.com) account
- Access to your hosting dashboard (Netlify, Vercel, GitHub, etc.)
- A code editor (VS Code, Sublime, or even Notepad) to edit one config file

---

## Step 1 — Create a Supabase account

1. Go to **[supabase.com](https://supabase.com)** and click **Start your project**.
2. Sign up with **GitHub** (fastest) or with an email + password.
3. You'll land on the Supabase dashboard.

---

## Step 2 — Create a new project

1. Click **New project** (top right).
2. Fill in:
   - **Name:** `ceo-hr-cms` (or anything you like)
   - **Database Password:** click **Generate a password** → **copy it somewhere safe**. You will rarely need it, but losing it means resetting it.
   - **Region:** pick the one closest to your visitors. For India: **Mumbai (ap-south-1)**. For the US: **N. Virginia (us-east-1)**. For Europe: **Frankfurt (eu-central-1)**. Closer = faster page loads for visitors.
   - **Pricing plan:** **Free** is more than enough for a typical business site.
3. Click **Create new project**. It takes ~1 minute to provision.

---

## Step 3 — Copy your API keys into the site

1. In the Supabase dashboard, go to **Project Settings** (gear icon, bottom-left) → **API**.
2. You'll see two values you need:
   - **Project URL** — looks like `https://abcdwxyz.supabase.co`
   - **Project API keys → `anon` `public`** — a long string that starts with `eyJ…`

3. Open **`supabase-config.js`** in your project folder and replace the placeholders:

   ```js
   window.CMS_CONFIG = {
     SUPABASE_URL:        'https://abcdwxyz.supabase.co',           // ← from Project Settings → API
     SUPABASE_ANON_KEY:   'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...', // ← anon public key
     CONTENT_TABLE:       'site_content',
     CONTENT_ROW_ID:      1,
     STORAGE_BUCKET:      'uploads',
     ALLOWED_ADMIN_EMAILS: ['admin@example.com']                    // ← we'll set this in Step 6
   };
   ```

> ⚠️ **Safety note:** use the **`anon` public** key only.
> The `service_role` key, which appears just below, has full admin powers and **must never go into a public file**. It would let anyone edit your database. If you accidentally pasted it, regenerate it from the same page (the **Reset** button), and use the `anon` key instead.

---

## Step 4 — Create the database table

1. In the left sidebar of Supabase, open **SQL Editor**.
2. Click **New query**, paste the SQL below in full, and press **Run**:

   ```sql
   create table public.site_content (
     id integer primary key,
     data jsonb not null default '{}'::jsonb,
     updated_at timestamp with time zone default now()
   );

   alter table public.site_content enable row level security;

   create policy "Anyone can read site content"
     on public.site_content for select using (true);

   create policy "Authenticated users can insert"
     on public.site_content for insert
     to authenticated with check (true);

   create policy "Authenticated users can update"
     on public.site_content for update
     to authenticated using (true) with check (true);

   alter publication supabase_realtime add table public.site_content;
   ```

3. You should see **Success. No rows returned**. The table is now ready.

What this does, in plain English:
- Creates a table called `site_content` with a single column (`data`) that stores **all** of your site's text and image URLs as one JSON blob.
- Lets the **public** read it (so visitors see your site).
- Lets only **logged-in admin users** edit it.
- Turns on **realtime updates**, so visitors see changes instantly.

---

## Step 5 — Create the image storage bucket

1. In the Supabase sidebar, open **Storage**.
2. Click **New bucket**.
   - **Name:** `uploads` (must be exactly this; matches `STORAGE_BUCKET` in `supabase-config.js`)
   - Tick **Public bucket** ✅ (so the URLs to images work on your live site)
   - Click **Save**.
3. Now we need to let your admin user upload images. Click on the new `uploads` bucket → **Policies** tab → **New policy** → **For full customization**.
   - **Policy name:** `Authenticated users can upload`
   - **Allowed operation:** check **INSERT** only
   - **Target roles:** `authenticated`
   - **WITH CHECK expression:** `true`
   - Click **Review** → **Save policy**.

(SELECT is already allowed because the bucket is public.)

---

## Step 6 — Create your admin login

1. In the Supabase sidebar, go to **Authentication** → **Users**.
2. Click **Add user** → **Create new user**.
   - **Email:** the email your client will sign in with (e.g., `client@yourcompany.com`)
   - **Password:** a strong password (12+ chars, mix of letters/numbers/symbols)
   - **Auto Confirm User:** turn this **ON** ✅ (otherwise sign-in will fail with "email not confirmed")
   - Click **Create user**.
3. Open **`supabase-config.js`** again and update the allow-list to match:

   ```js
   ALLOWED_ADMIN_EMAILS: ['client@yourcompany.com']
   ```

   (lower-case the email here; the admin panel will reject any email not in this list.)

4. Configure where password-reset links should go: in the sidebar open **Authentication → URL Configuration**:
   - **Site URL:** `https://your-live-domain.com` (your actual site URL)
   - **Redirect URLs:** add `https://your-live-domain.com/admin.html`

   Without this, the "Forgot password" link in the admin will send broken email links.

---

## Step 7 — Upload the files to your hosting

The files that need to be on your live site:

```
/index.html              (and every other .html page — already updated with data-cms attributes)
/supabase-config.js      ← edited in steps 3 and 6
/cms-reader.js           ← powers the public-site live updates
/admin.html              ← the admin panel
/admin.js                ← admin panel logic
/SUPABASE_SETUP.md       ← optional, for your own reference
```

### If you use **Netlify drag-and-drop**:
1. Zip the whole site folder.
2. Open your Netlify dashboard → site overview → **Deploys** → drop the zip onto the page.

### If you use **Git (Netlify, Vercel, GitHub Pages, etc.)**:
1. Commit and push the new files (`supabase-config.js`, `cms-reader.js`, `admin.html`, `admin.js`, plus the updated `.html` pages).
2. Hosting will auto-deploy.

---

## Step 8 — First login & smoke test

1. Open `https://your-live-domain.com/admin.html` in a browser.
2. Sign in with the email + password you created in Step 6.
3. You should land in the **Content Manager**. The sidebar lists every page; the form is pre-filled with your existing content.
4. Open another tab to your live site (`https://your-live-domain.com/`) and place it side-by-side.
5. In the admin: change something obvious like the hero heading → click **Publish**.
6. Look at the live-site tab — within 1–2 seconds it should update **without** a refresh.
7. Test image upload: open any page section that has an image, click **Upload from computer**, pick an image, click **Publish**, watch the live site.

If all three of those work, you're done. ✅

---

## Free-tier limits

Supabase's free plan is generous and covers most small/medium business sites:

| Resource | Free tier limit | What this means for you |
|---|---|---|
| Database storage | 500 MB | The whole site's text fits in **<1 MB**. You'll never hit this. |
| File storage (Storage bucket) | 1 GB | Roughly 1,000–5,000 images depending on size. |
| Bandwidth | 5 GB/month (egress) | Comfortably handles tens of thousands of monthly visitors. |
| Monthly Active Users (MAU) | 50,000 | This counts admin logins, not site visitors. You'll have 1–2 admins. |
| Realtime concurrent connections | 200 | Each browser tab = one connection. 200 simultaneous viewers is fine. |
| Project pause | After 7 days idle | If no admin logs in for a week, Supabase pauses the project; one click to unpause. To prevent: log in to the dashboard once a week, or upgrade to a paid plan. |

If you outgrow Free, the **Pro plan ($25/mo)** removes pausing and bumps every limit ~10×.

---

## Troubleshooting

### "This email is not authorized to manage content."
- The email you typed isn't in `ALLOWED_ADMIN_EMAILS` in `supabase-config.js`. Add it (lowercase) and redeploy.

### "Email or password is incorrect."
- Wrong password — reset via **Forgot password**, or in Supabase **Authentication → Users → ⋯ → Send password recovery**.
- Or the user was never created — go back to **Step 6**.

### "This account email is not confirmed yet."
- You forgot to tick **Auto Confirm User** when creating the user. Open **Authentication → Users → ⋯ → Confirm email** to fix without re-creating.

### Login works but Content Manager is blank / spinning forever
- Open browser **DevTools → Console**. Likely you'll see one of:
  - `Failed to fetch` → wrong `SUPABASE_URL`. Check Step 3.
  - `Invalid API key` → wrong `SUPABASE_ANON_KEY`. Check Step 3 (and that you didn't accidentally use `service_role`).
  - `permission denied for table site_content` → SQL from Step 4 didn't run. Re-run it.

### Image upload fails: "new row violates row-level security policy"
- Step 5's **policy** on the bucket wasn't created or wasn't set to the `authenticated` role. Re-do that part of Step 5.

### Image upload fails: "bucket not found"
- The bucket name in Storage doesn't match `STORAGE_BUCKET` in `supabase-config.js`. Default is `uploads` — must be exact (case-sensitive).

### I clicked Publish but the live site doesn't change
- **Hard-reload** the live-site tab (Cmd/Ctrl + Shift + R). If it now shows the new content, the change *was* saved — the browser was just caching the old `cms-reader.js`. Add `?v=2` to the script tag URL to bust cache.
- If hard-reload still shows old content: open the live-site **DevTools Console** and look for errors. Most often: `cms-reader.js` not deployed, or `supabase-config.js` not deployed.

### "Forgot password" email never arrives
- Check spam folder.
- In Supabase: **Authentication → URL Configuration → Site URL** must be set (Step 6). Without it, links are invalid and emails are not sent.

### Real-time updates don't work but Publish saves
- Did you run the line `alter publication supabase_realtime add table public.site_content;` in Step 4? Re-run it in **SQL Editor**.

---

## Security tips

1. **Never commit `supabase-config.js` to a public GitHub repo.** Even though the `anon` key is safe to expose to *site visitors* (it's a "public" key), publishing it lets anyone with the key try to brute-force your admin login. If your repo is public, add `supabase-config.js` to `.gitignore` and ship it only via your hosting deploy.
2. **Use the `anon` key only.** Never paste the `service_role` key anywhere visitor-facing.
3. **Use a strong admin password.** 12+ characters, ideally generated by a password manager. The whole site's content is one stolen password away.
4. **Keep `ALLOWED_ADMIN_EMAILS` short.** Only the people who actually need to edit should be in this list.

---

## Adding another admin user

1. Supabase → **Authentication → Users → Add user → Create new user**. Set their email + password, tick **Auto Confirm User**.
2. Open `supabase-config.js`, append the new email to `ALLOWED_ADMIN_EMAILS`:
   ```js
   ALLOWED_ADMIN_EMAILS: ['admin1@example.com', 'admin2@example.com']
   ```
3. Redeploy the site (Netlify will auto-deploy on git push).
4. Send them the URL `https://your-live-domain.com/admin.html` and their password.

---

## Removing an admin / changing a password

- **Remove**: Supabase → **Authentication → Users**, click the **⋯** menu next to the user → **Delete user**, and remove their email from `ALLOWED_ADMIN_EMAILS`.
- **Change password**: same menu → **Send password recovery** (the user picks a new one), or **Update user** to set one directly.

---

That's everything. Once steps 1–8 are done, your client never has to touch this guide again — they just go to `/admin.html`, log in, edit, publish.
