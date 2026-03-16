# 🏦 SwiftSend — Series Blueprint
> Build a Wise Clone with Next.js, Supabase, Plaid & Stripe
> Code with Lari • 8 Episodes • 50+ Features

---

## ⚡ The Stack

| Layer | Technology |
|---|---|
| Framework | Next.js (App Router, TypeScript) |
| Styling | Tailwind CSS + shadcn/ui |
| Auth | Supabase Auth |
| Database | Supabase (PostgreSQL) |
| ORM | Prisma |
| Bank Linking | Plaid (sandbox mode) |
| Payments | Stripe |
| Validation | Zod + useServerAction |
| Deployment | Vercel |
| AI Co-pilot | Cursor |

---

## 🗃️ Prisma Schema (Full App)

> Built incrementally across episodes.

```prisma
// prisma/schema.prisma

generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider  = "postgresql"
  url       = env("DATABASE_URL")
  directUrl = env("DIRECT_URL")
}

model User {
  id                String      @id @default(uuid())
  email             String      @unique
  firstName         String
  lastName          String
  avatarUrl         String?
  createdAt         DateTime    @default(now())
  accounts          Account[]
  sentTransfers     Transfer[]  @relation("SentTransfers")
  receivedTransfers Transfer[]  @relation("ReceivedTransfers")
  plaidItems        PlaidItem[]
}

model Account {
  id           String        @id @default(uuid())
  userId       String
  user         User          @relation(fields: [userId], references: [id])
  name         String
  type         AccountType   @default(CHECKING)
  balance      Decimal       @default(0)
  currency     String        @default("USD")
  mask         String?       // last 4 digits
  createdAt    DateTime      @default(now())
  transactions Transaction[]
}

model Transaction {
  id          String          @id @default(uuid())
  accountId   String
  account     Account         @relation(fields: [accountId], references: [id])
  amount      Decimal
  type        TransactionType
  status      TxStatus        @default(PENDING)
  description String?
  category    String?
  date        DateTime        @default(now())
  transferId  String?
  transfer    Transfer?       @relation(fields: [transferId], references: [id])
}

model Transfer {
  id              String         @id @default(uuid())
  senderId        String
  sender          User           @relation("SentTransfers", fields: [senderId], references: [id])
  receiverId      String
  receiver        User           @relation("ReceivedTransfers", fields: [receiverId], references: [id])
  amount          Decimal
  currency        String         @default("USD")
  note            String?
  status          TransferStatus @default(PENDING)
  stripePaymentId String?
  createdAt       DateTime       @default(now())
  transactions    Transaction[]
}

model PlaidItem {
  id              String   @id @default(uuid())
  userId          String
  user            User     @relation(fields: [userId], references: [id])
  accessToken     String
  itemId          String   @unique
  institutionId   String?
  institutionName String?
  createdAt       DateTime @default(now())
}

enum AccountType    { CHECKING SAVINGS }
enum TransactionType { DEBIT CREDIT }
enum TxStatus       { PENDING COMPLETED FAILED }
enum TransferStatus { PENDING COMPLETED FAILED CANCELLED }
```

---

## 🚀 Episode 1 — Setup & Architecture

**Goal:** Get a production-ready Next.js app live on Vercel with Supabase + Prisma connected before writing a single feature.

| | |
|---|---|
| Duration | ~45 mins on camera |
| Cursor Moment | Prompt Cursor to scaffold the full folder structure from a plain English description |

### 📁 Pages & Routes
- `/` — Root redirect: authenticated → `/dashboard`, guest → `/sign-in`
- `/sign-in` — Login page (placeholder)
- `/sign-up` — Register page (placeholder)
- `/dashboard` — Protected main dashboard (placeholder layout)

### 📦 Features Built
- Initialize Next.js project with App Router and TypeScript
- Install and configure Tailwind CSS
- Install shadcn/ui and set up component library
- Create Supabase project, get connection strings
- Install Prisma, init schema, connect to Supabase
- Run first migration and verify DB connection
- Set up `.env.local` with all environment variable placeholders
- Configure path aliases (`@/components`, `@/lib`, `@/actions`)
- Push initial commit and deploy to Vercel

### 📂 Folder Structure
```
swiftsend/
├── app/
│   ├── (auth)/
│   │   ├── sign-in/page.tsx
│   │   └── sign-up/page.tsx
│   ├── (root)/
│   │   └── dashboard/page.tsx
│   ├── layout.tsx
│   └── globals.css
├── components/
│   ├── ui/           ← shadcn components
│   └── shared/       ← reusable app components
├── lib/
│   ├── prisma.ts     ← Prisma client singleton
│   ├── supabase.ts   ← Supabase client
│   └── utils.ts
├── actions/          ← all server actions live here
├── prisma/
│   └── schema.prisma
└── .env.local
```

### 🎯 Cursor Prompts
- **Prompt 1:** "Generate a Next.js App Router folder structure for a banking app called SwiftSend with auth routes, dashboard, and a shared components folder"
- **Prompt 2:** "Write a Prisma singleton client for Next.js to prevent multiple instances in development"
- **Prompt 3:** "Write a .env.local template with placeholders for Supabase, Prisma, Plaid and Stripe"

---

## 🔐 Episode 2 — Authentication

**Goal:** Users can sign up, sign in, sign out, and get redirected correctly. User profile stored in DB on register.

| | |
|---|---|
| Duration | ~50 mins on camera |
| Cursor Moment | Prompt Cursor to write the Supabase auth helper functions and explain each line |

### 📁 Pages & Routes
- `/sign-in` — Email + password login form with error handling
- `/sign-up` — Registration form: first name, last name, email, password, confirm password
- `/auth/callback` — Supabase OAuth callback route handler
- `/dashboard` — Redirect destination after login

### 📦 Features Built
- Sign up with email & password via Supabase Auth
- Sign in with email & password
- Sign out with redirect to `/sign-in`
- Auth callback route to handle Supabase session exchange
- Redirect unauthenticated users to `/sign-in`
- On sign up: create `User` record in Postgres via Prisma
- Show inline validation errors (wrong password, email taken, etc.)
- Loading states on form submit buttons

### ⚡ Server Actions

```ts
// actions/auth.actions.ts

// signUpAction(formData)
//   - Zod schema: { firstName, lastName, email, password, confirmPassword }
//   - Validates passwords match
//   - Calls supabase.auth.signUp()
//   - Creates User in Prisma DB
//   - Returns { success } or { error }

// signInAction(formData)
//   - Zod schema: { email, password }
//   - Calls supabase.auth.signInWithPassword()
//   - Returns { success } or { error }

// signOutAction()
//   - Calls supabase.auth.signOut()
//   - Redirects to /sign-in
```

### ✅ Zod Schemas

```ts
// lib/validations/auth.ts

export const signUpSchema = z.object({
  firstName:       z.string().min(2),
  lastName:        z.string().min(2),
  email:           z.string().email(),
  password:        z.string().min(8),
  confirmPassword: z.string()
}).refine(d => d.password === d.confirmPassword, {
  message: "Passwords don't match",
  path: ["confirmPassword"]
});

export const signInSchema = z.object({
  email:    z.string().email(),
  password: z.string().min(1, "Password is required")
});
```

### 🎯 Cursor Prompts
- **Prompt 1:** "Write a signUpAction server action using Supabase auth that also creates a user in Prisma after successful registration"
- **Prompt 2:** "Write Zod validation schemas for sign up and sign in forms for a banking app"
- **Prompt 3:** "Write a Supabase auth callback route handler for Next.js App Router"

---

## 🎨 Episode 3 — Dashboard UI

**Goal:** A beautiful, data-driven dashboard that feels like a real banking app.

| | |
|---|---|
| Duration | ~60 mins on camera |
| Cursor Moment | Prompt Cursor to generate Prisma queries and explain the data relationships |

### 📁 Pages & Routes
- `/dashboard` — Main dashboard with sidebar, balance, stats, recent transactions

### 📦 Features Built
- Sidebar navigation with links to all main pages
- Mobile hamburger menu / collapsible sidebar
- Account balance card — total balance across all accounts
- Total sent and total received stat cards
- Recent transactions list (last 5) with amount, name, date, category icon
- Linked bank accounts summary strip
- Skeleton loading states for all data sections
- User avatar and name in sidebar header

### 🧩 Components
```
components/shared/
├── sidebar.tsx
├── mobile-nav.tsx
├── balance-card.tsx
├── stat-card.tsx
├── recent-transactions.tsx
├── transaction-item.tsx
└── linked-account-strip.tsx
```

### ⚡ Server Actions

```ts
// actions/account.actions.ts

// getAccountsWithBalance(userId)
//   - Prisma: find all accounts for user
//   - Returns accounts[] with balance

// getDashboardStats(userId)
//   - Prisma aggregate: sum of all DEBIT transactions (sent)
//   - Prisma aggregate: sum of all CREDIT transactions (received)
//   - Returns { totalSent, totalReceived, totalBalance }

// getRecentTransactions(userId, limit = 5)
//   - Prisma: latest 5 transactions across all user accounts
//   - Returns Transaction[] with account info
```

### 🎯 Cursor Prompts
- **Prompt 1:** "Build a sidebar component for a banking app using shadcn and Tailwind with nav links for Dashboard, Transactions, Transfer Money and Profile"
- **Prompt 2:** "Write a Prisma query to get total sent and received amounts for a user across all their accounts"
- **Prompt 3:** "Create skeleton loading components for a bank dashboard balance card and transaction list"

---

## 📊 Episode 4 — Transactions

**Goal:** A full, filterable transaction history page. Teaches Server Components, data fetching patterns, and Prisma queries.

| | |
|---|---|
| Duration | ~55 mins on camera |
| Cursor Moment | Prompt Cursor to write the Prisma query with dynamic filters |

### 📁 Pages & Routes
- `/transactions` — Full transaction history with filters and search

### 📦 Features Built
- Full paginated transaction list (20 per page)
- Filter by type: All / Sent / Received
- Filter by date range with date picker
- Search by description or amount
- Transaction status badges (Pending / Completed / Failed)
- Category icons per transaction
- Empty state when no transactions match filters
- Loading skeleton while data fetches
- URL-based filter state (searchParams) — shareable filtered URLs

### ⚡ Server Actions

```ts
// actions/transaction.actions.ts

// getTransactions({ userId, type, dateFrom, dateTo, search, page })
//   - Zod schema validates all filter params
//   - Prisma: dynamic where clause based on active filters
//   - Returns { transactions[], totalCount, totalPages }

// Prisma query pattern:
// prisma.transaction.findMany({
//   where: {
//     account: { userId },
//     ...(type !== 'all' && { type }),
//     ...(search && { description: { contains: search } }),
//     ...(dateFrom && { date: { gte: dateFrom } }),
//     ...(dateTo  && { date: { lte: dateTo } })
//   },
//   orderBy: { date: 'desc' },
//   skip: (page - 1) * 20,
//   take: 20
// })
```

### ✅ Zod Schemas

```ts
// lib/validations/transaction.ts

export const transactionFilterSchema = z.object({
  type:     z.enum(['all', 'DEBIT', 'CREDIT']).default('all'),
  search:   z.string().optional(),
  dateFrom: z.string().optional(),
  dateTo:   z.string().optional(),
  page:     z.coerce.number().default(1)
});
```

### 🎯 Cursor Prompts
- **Prompt 1:** "Write a Prisma query for transactions with dynamic filters for type, date range, and search — paginated at 20 per page"
- **Prompt 2:** "Build a transaction filter bar component in Next.js that updates URL searchParams without a full page reload"
- **Prompt 3:** "Create a reusable transaction-item component with amount, category icon, status badge and date"

---

## 🏦 Episode 5 — Bank Linking with Plaid

**Goal:** Connect an external bank account using Plaid's sandbox.

| | |
|---|---|
| Duration | ~60 mins on camera |
| Cursor Moment | Prompt Cursor to scaffold the Plaid API route handlers and token exchange flow |

### 📁 Pages & Routes
- `/dashboard` — Add bank button + linked accounts section updated
- `/api/plaid/create-link-token` — API route: creates Plaid Link token
- `/api/plaid/exchange-token` — API route: exchanges public token for access token

### 📦 Features Built
- Plaid Link button — opens the Plaid modal to connect a bank
- Create link token API route (server-side, never expose keys client-side)
- Handle Plaid `onSuccess` callback and send `public_token` to server
- Exchange `public_token` for `access_token` securely on server
- Store `PlaidItem` (access token + item ID) in Supabase via Prisma
- Fetch linked account details from Plaid (institution name, mask)
- Display linked bank accounts on dashboard
- Handle Plaid errors and edge cases (already linked, cancelled)

### ⚡ Server Actions

```ts
// actions/plaid.actions.ts

// createLinkToken(userId)
//   - Server-side Plaid client call
//   - Returns { link_token } for Plaid Link component

// exchangePublicToken({ publicToken, userId })
//   - Zod schema: { publicToken: z.string(), userId: z.string() }
//   - Exchanges token with Plaid API
//   - Stores PlaidItem in Prisma (access_token, item_id)
//   - Fetches account details from Plaid
//   - Creates Account records in Prisma with Plaid data
//   - Returns { success } or { error }

// getLinkedAccounts(userId)
//   - Prisma: get PlaidItems for user
//   - For each: fetch live balances from Plaid API
//   - Returns accounts[] with institution name and balances
```

### ✅ Zod Schemas

```ts
// lib/validations/plaid.ts

export const exchangeTokenSchema = z.object({
  publicToken: z.string().min(1),
  userId:      z.string().uuid()
});
```

### 🎯 Cursor Prompts
- **Prompt 1:** "Write a Next.js API route to create a Plaid link token server-side using the Plaid Node SDK"
- **Prompt 2:** "Write a server action to exchange a Plaid public token for an access token and save it to Prisma"
- **Prompt 3:** "Build a plaid-link-button React component that calls createLinkToken and opens the Plaid modal"

---

## 💸 Episode 6 — Fund Transfers with Stripe

**Goal:** Users can send money to other SwiftSend users. Stripe handles payment logic, Prisma handles the ledger.

| | |
|---|---|
| Duration | ~60 mins on camera |
| Cursor Moment | Prompt Cursor to build the full transfer server action and watch it reason through financial logic |

### 📁 Pages & Routes
- `/transfer` — Transfer money form page
- `/transfer/confirm` — Confirmation screen before sending
- `/transfer/success` — Success screen with transaction summary

### 📦 Features Built
- Transfer form: recipient email, amount, currency, optional note
- Recipient lookup by email — validate they're a SwiftSend user
- Transfer confirmation step before sending
- Stripe Payment Intent creation for the transfer amount
- On success: debit sender account, credit receiver account (Prisma transaction)
- Create `Transaction` records for both sender and receiver
- Create `Transfer` record linking both transactions
- Success screen with full transfer summary
- Error handling: insufficient funds, invalid recipient, Stripe failure
- Loading states at every async step

### ⚡ Server Actions

```ts
// actions/transfer.actions.ts

// lookupRecipient({ email })
//   - Zod schema: { email: z.string().email() }
//   - Prisma: find user by email
//   - Returns { id, firstName, lastName, avatarUrl } or { error }

// createTransfer({ senderId, receiverId, amount, note })
//   - Zod schema: transferSchema
//   - Check sender has sufficient balance
//   - Create Stripe PaymentIntent
//   - Prisma transaction (atomic):
//       1. Deduct from sender Account.balance
//       2. Add to receiver Account.balance
//       3. Create Transfer record
//       4. Create DEBIT Transaction for sender
//       5. Create CREDIT Transaction for receiver
//   - Returns { transferId, success } or { error }

// getTransferById(transferId)
//   - Prisma: find transfer with sender + receiver info
//   - Returns full transfer details for success screen
```

### ✅ Zod Schemas

```ts
// lib/validations/transfer.ts

export const transferSchema = z.object({
  senderId:   z.string().uuid(),
  receiverId: z.string().uuid(),
  amount:     z.number().positive().max(10000),
  currency:   z.string().default('USD'),
  note:       z.string().max(100).optional()
});

export const recipientSchema = z.object({
  email: z.string().email()
});
```

### 🎯 Cursor Prompts
- **Prompt 1:** "Write a server action that creates a Stripe payment intent then performs an atomic Prisma transaction to debit one user and credit another"
- **Prompt 2:** "Build a multi-step transfer form: step 1 recipient lookup, step 2 amount + note, step 3 confirmation"
- **Prompt 3:** "Write a Prisma transaction that atomically debits sender balance, credits receiver balance, and creates transaction records for both"

---

## 👤 Episode 7 — Profile & Settings

**Goal:** A complete profile management page. Teaches file uploads, Zod validation, and password flows.

| | |
|---|---|
| Duration | ~45 mins on camera |
| Cursor Moment | Prompt Cursor to generate Zod schema and form validation — discuss the output live |

### 📁 Pages & Routes
- `/profile` — View and edit user profile, avatar, password

### 📦 Features Built
- Display current profile info (name, email, avatar)
- Edit first name and last name with inline validation
- Avatar upload to Supabase Storage with image preview
- Change password flow (current password + new + confirm)
- Delete account with confirmation dialog
- Success toast notifications on save
- Form dirty state — warn before leaving with unsaved changes

### ⚡ Server Actions

```ts
// actions/user.actions.ts

// updateProfile({ userId, firstName, lastName })
//   - Zod schema: updateProfileSchema
//   - Prisma: update User firstName, lastName
//   - Returns { success } or { error }

// updateAvatar({ userId, file })
//   - Upload file to Supabase Storage (avatars bucket)
//   - Get public URL
//   - Prisma: update User.avatarUrl
//   - Returns { avatarUrl } or { error }

// changePassword({ currentPassword, newPassword })
//   - Zod schema: changePasswordSchema
//   - Verify current password with Supabase Auth
//   - Update password via Supabase Auth
//   - Returns { success } or { error }

// deleteAccount({ userId })
//   - Prisma: delete all user data (cascade)
//   - Supabase Auth: delete auth user
//   - Redirect to /sign-up
```

### ✅ Zod Schemas

```ts
// lib/validations/user.ts

export const updateProfileSchema = z.object({
  firstName: z.string().min(2).max(50),
  lastName:  z.string().min(2).max(50)
});

export const changePasswordSchema = z.object({
  currentPassword: z.string().min(1),
  newPassword:     z.string().min(8),
  confirmPassword: z.string()
}).refine(d => d.newPassword === d.confirmPassword, {
  message: "Passwords don't match",
  path: ["confirmPassword"]
});
```

### 🎯 Cursor Prompts
- **Prompt 1:** "Write a server action to upload an avatar image to Supabase Storage and update the user's avatarUrl in Prisma"
- **Prompt 2:** "Build a profile edit form using react-hook-form and Zod with useServerAction for the submit handler"
- **Prompt 3:** "Write a delete account server action that removes all user data from Prisma then deletes the Supabase auth user"

---

## 🚀 Episode 8 — Deploy & Ship

**Goal:** Ship SwiftSend to production. Vercel + Supabase production setup, env vars, final checklist.

| | |
|---|---|
| Duration | ~35 mins on camera |
| Cursor Moment | Prompt Cursor to write the full project README and deployment checklist |

### 📦 Features Built
- Supabase: create production project, run migrations
- Configure production environment variables in Vercel dashboard
- Set up Stripe production keys (or keep test mode for the series)
- Set up Plaid production credentials (or keep sandbox)
- Vercel production deployment from GitHub
- Test all critical flows on production (auth, transfer, Plaid link)
- Custom domain setup walkthrough (optional)
- Generate README with Cursor — project overview, setup guide, env vars
- Series recap and Season 2 teaser

### ✅ Production Checklist

```
[ ] DATABASE_URL                      → Supabase production connection string
[ ] DIRECT_URL                        → Supabase direct URL (for Prisma migrations)
[ ] NEXT_PUBLIC_SUPABASE_URL          → Production Supabase URL
[ ] NEXT_PUBLIC_SUPABASE_ANON_KEY     → Production anon key
[ ] PLAID_CLIENT_ID                   → Plaid credentials
[ ] PLAID_SECRET                      → Plaid secret
[ ] PLAID_ENV                         → 'sandbox' | 'production'
[ ] STRIPE_SECRET_KEY                 → Stripe secret key
[ ] NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY
[ ] NEXT_PUBLIC_APP_URL               → Your Vercel domain
```

### 🎯 Cursor Prompts
- **Prompt 1:** "Write a production deployment checklist for a Next.js app using Supabase, Prisma, Plaid and Stripe"
- **Prompt 2:** "Write a README.md for SwiftSend — a full-stack Wise clone — with setup instructions, tech stack, and environment variables"

---

## 📋 Series At a Glance

| Ep | Title | Key Tech | Viewer Takeaway |
|---|---|---|---|
| 1 | Setup & Architecture | Next.js, Supabase, Prisma, Vercel | How to scaffold a production app from scratch |
| 2 | Authentication | Supabase Auth, Server Actions, Zod | Auth flows + syncing auth users to a DB |
| 3 | Dashboard UI | shadcn/ui, Tailwind, Prisma queries | Data-driven dashboards and component design |
| 4 | Transactions | Server Components, Prisma filters | Dynamic queries + URL-based filter state |
| 5 | Bank Linking | Plaid SDK, token exchange | Third-party financial API integration |
| 6 | Fund Transfers | Stripe, atomic Prisma transactions | Payment processing + financial ledger logic |
| 7 | Profile & Settings | Supabase Storage, Zod, useServerAction | File uploads + form validation patterns |
| 8 | Deploy & Ship | Vercel, production env vars | Shipping a full-stack app to production |