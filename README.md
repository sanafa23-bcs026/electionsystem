# VoteSecure — Secure Online Election Management System

A full-stack, production-ready election management platform built with **React + Supabase**.

---

## 🚀 Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | React 18, React Router 6 |
| Styling | Tailwind CSS 3 (dark mode) |
| Backend/DB | Supabase (PostgreSQL) |
| Auth | Supabase Auth |
| Charts | Recharts |
| PDF | jsPDF + autoTable |
| QR Codes | qrcode.react |
| Animations | Framer Motion |
| Deployment | Vercel |

---

## 📁 Project Structure

```
src/
├── components/
│   ├── layout/       # AdminLayout, CreatorLayout, VoterLayout
│   └── ui/           # Navbar, Modal, CountdownTimer, ElectionCard
├── context/
│   ├── AuthContext.jsx   # Auth state, roles, sign in/out
│   └── ThemeContext.jsx  # Dark mode
├── lib/
│   └── supabase.js       # Supabase client + full DB schema
├── pages/
│   ├── auth/         # Login, Register, ForgotPassword, Reset
│   ├── public/       # LandingPage, ElectionDetailPage
│   ├── admin/        # Dashboard, Requests, Elections, Users, Logs
│   ├── creator/      # Dashboard, Create/Edit Election, Candidates, Voters, Results
│   └── voter/        # Dashboard, Browse Polls, VotingPage, RequestAccess
└── App.jsx           # All routes + role guards
```

---

## ⚙️ STEP-BY-STEP SETUP GUIDE

### Step 1: Create Supabase Project

1. Go to [supabase.com](https://supabase.com) → **New Project**
2. Fill in project name (e.g. `votesecure`), set a strong database password, choose a region
3. Wait ~2 minutes for the project to initialize

### Step 2: Run the Database Schema

1. In your Supabase dashboard → **SQL Editor** → **New Query**
2. Open `src/lib/supabase.js` in this project
3. Copy everything inside the large comment block (everything between `/*` and `*/`)
4. Paste it into the SQL editor and click **Run**
5. You should see "Success" with no errors

### Step 3: Create the Storage Bucket

1. In Supabase → **Storage** → **New Bucket**
2. Name: `election-media`
3. Check **Public bucket** → Create
4. This allows candidate photos to be uploaded

### Step 4: Create the Super Admin Account

1. In Supabase → **Authentication** → **Users** → **Add User**
2. Enter your email and a strong password
3. After creating, go to **Table Editor** → `profiles` table
4. Find your user row, click it, change `role` from `voter` to `super_admin`
5. Save the row

> ⚠️ **Important:** The admin user must be set manually in the database because we don't expose an admin signup route publicly (security!)

### Step 5: Configure Environment Variables

1. Copy `.env.example` to `.env.local`:
   ```bash
   cp .env.example .env.local
   ```

2. In Supabase → **Settings** → **API**, copy:
   - **Project URL** → `REACT_APP_SUPABASE_URL`
   - **anon public key** → `REACT_APP_SUPABASE_ANON_KEY`

3. Fill in `.env.local`:
   ```
   REACT_APP_SUPABASE_URL=https://yourprojectid.supabase.co
   REACT_APP_SUPABASE_ANON_KEY=your_anon_key_here
   REACT_APP_APP_URL=http://localhost:3000
   ```

### Step 6: Install & Run

```bash
npm install
npm start
```

Open [http://localhost:3000](http://localhost:3000) — you should see the landing page.

---

## 🔐 Roles & Access

| Role | How to Get It | Access |
|------|--------------|--------|
| `voter` | Default on signup | Browse & join elections, vote |
| `election_creator` | Request via app + admin approves | Create/manage elections |
| `super_admin` | Set manually in Supabase DB | Full platform access |

---

## 🗺️ User Flows

### Voter Flow
1. Register → Verify email → Login
2. Browse elections on landing page
3. Click election → "I Want to Participate"
4. Wait for election to start → receive Secret Voter ID via email
5. Go to voting page → Enter Secret ID → Select candidate → Confirm → Done!

### Election Creator Flow
1. Register as voter → Request creator access (fill form)
2. Admin approves → Role updated to `election_creator`
3. Login → Creator Dashboard → Create Election
4. Add candidates with photos
5. Publish → Start → View live results → End → Download PDF report

### Admin Flow
1. Login with admin credentials (set via Supabase)
2. Review creator requests → Approve/Reject
3. Monitor all elections, users, audit logs

---

## 🌐 Deployment to Vercel

### Option A: Vercel Dashboard (Easiest)

1. Push code to GitHub:
   ```bash
   git init
   git add .
   git commit -m "Initial commit - VoteSecure"
   git remote add origin https://github.com/yourusername/votesecure.git
   git push -u origin main
   ```

2. Go to [vercel.com](https://vercel.com) → **Import Project** → Select your repo

3. Add Environment Variables in Vercel dashboard:
   - `REACT_APP_SUPABASE_URL`
   - `REACT_APP_SUPABASE_ANON_KEY`

4. Click **Deploy** — done! 🎉

### Option B: Vercel CLI

```bash
npm i -g vercel
vercel login
vercel --prod
```

### Update Supabase Auth Settings for Production

1. Supabase → **Authentication** → **URL Configuration**
2. Set **Site URL** to your Vercel URL: `https://your-app.vercel.app`
3. Add to **Redirect URLs**: `https://your-app.vercel.app/auth/callback`

---

## 🔒 Security Features

- ✅ **Row Level Security (RLS)** — enforced at database level on all tables
- ✅ **Email Verification** — required before login
- ✅ **Role-Based Access Control** — protected routes for each role
- ✅ **Duplicate Vote Prevention** — unique voter token per election
- ✅ **Anonymous Voting** — votes stored with hashed token, not user ID
- ✅ **Secret Voter IDs** — unique per election, validated before voting
- ✅ **Audit Logs** — every action (login, vote, approval, edit) is logged
- ✅ **Voter List Locking** — auto-locks when max voters reached
- ✅ **Admin Override Logging** — any admin unlock is recorded

---

## ✨ Features Implemented

### Core Modules (All 15)
- [x] Authentication (signup, login, email verify, forgot/reset password)
- [x] Admin Approval Module (review, approve, reject with reason)
- [x] Election Creation (title, desc, category, dates, max voters)
- [x] Candidate Management (photo upload, manifesto, CRUD)
- [x] Public Landing Page (search, filter, live counters)
- [x] Voter Registration (join, eligibility, duplicate prevention)
- [x] Voter Locking (auto-lock + admin override with logs)
- [x] Secret ID Generation (unique per poll)
- [x] Voting Module (verify ID → select → confirm → submit)
- [x] Live Results (bar chart, pie chart, progress bars)
- [x] Audit & Transparency (full action log, CSV export)
- [x] Notifications (Supabase native)
- [x] Security (RLS, anonymous votes, role guards)
- [x] Dashboards (admin, creator, voter)
- [x] Deployment (Vercel + GitHub)

### Bonus Features
- [x] 🌙 Dark Mode
- [x] 📄 Download Results PDF
- [x] 🔗 QR Code sharing for elections

---

## 📊 Database Tables

| Table | Purpose |
|-------|---------|
| `profiles` | Extended user data + roles |
| `creator_requests` | Creator approval requests |
| `elections` | Election metadata |
| `candidates` | Candidates per election |
| `voter_registrations` | Voter enrollment + secret IDs |
| `votes` | Anonymous votes (no user link!) |
| `audit_logs` | Complete action history |
| `notifications` | User notifications |

---

## 🆘 Troubleshooting

**"relation does not exist" error**
→ Make sure you ran the full SQL schema from `src/lib/supabase.js`

**Login redirects back to login**
→ Check if your user's email is verified in Supabase → Auth → Users

**Can't see admin dashboard**
→ Make sure the `profiles` row for your user has `role = 'super_admin'`

**Photo upload fails**
→ Create the `election-media` bucket in Supabase Storage and set it to public

**Voting fails with "column doesn't exist"**
→ The `increment_vote` RPC is optional. The app handles this gracefully with a fallback.

---

## 📝 License

MIT — Free to use, modify, and deploy.

---

Built with ❤️ using React + Supabase | VoteSecure 2025
