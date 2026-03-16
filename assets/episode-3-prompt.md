I'm building SwiftSend, a full-stack Wise clone.
Episode 3 — I need to build the main dashboard UI with real data from Prisma.

---

## WHAT'S ALREADY DONE
- Next.js App Router + TypeScript
- Supabase Auth working — user can sign up, sign in, sign out
- Prisma schema migrated (User, Account, Transaction, Transfer, PlaidItem)
- dashboard/page.tsx exists with session check
- shadcn/ui installed, Tailwind configured

---

## 1. SERVER ACTIONS
Create `actions/account.actions.ts` with these three functions:

// getAccountsWithBalance(userId: string)
- Prisma: findMany accounts where userId matches
- Return accounts[] with id, name, type, balance, currency, mask

// getDashboardStats(userId: string)
- Prisma aggregate:
  - Sum of all DEBIT transactions across user's accounts = totalSent
  - Sum of all CREDIT transactions across user's accounts = totalReceived
  - Sum of all account balances = totalBalance
- Return { totalSent, totalReceived, totalBalance }

// getRecentTransactions(userId: string, limit = 5)
- Prisma: findMany transactions
- Where: account.userId = userId
- OrderBy: date desc
- Take: limit
- Include: account name
- Return Transaction[] with account info

---

## 2. COMPONENTS

Create these components in `components/shared/`:

### sidebar.tsx
- Fixed left sidebar, full height
- SwiftSend logo + name at top
- Nav links with icons (use lucide-react):
  - Dashboard → /dashboard
  - Transactions → /transactions
  - Transfer Money → /transfer
  - Profile → /profile
- Active link highlighted
- User avatar + full name + email at bottom
- Sign out button at bottom

### mobile-nav.tsx
- Hamburger menu button (top left)
- Opens a sheet/drawer (shadcn Sheet component)
- Same nav links as sidebar
- Visible only on mobile (md:hidden)

### balance-card.tsx
- Props: { totalBalance: number, currency: string }
- Large balance display
- "Total Balance" label
- Subtle card styling with shadcn Card

### stat-card.tsx
- Props: { label: string, amount: number, icon: ReactNode, color: string }
- Reusable for both "Total Sent" and "Total Received"
- Icon on the left, amount + label on the right

### recent-transactions.tsx
- Props: { transactions: Transaction[] }
- Title: "Recent Transactions"
- Maps over transactions and renders transaction-item.tsx
- "View all" link to /transactions
- Empty state if no transactions

### transaction-item.tsx
- Props: { transaction: Transaction }
- Shows: description, amount (red for DEBIT, green for CREDIT),
  date formatted as "Mar 13, 2026", status badge
- Category icon on the left (use lucide-react based on category string)

### linked-account-strip.tsx
- Props: { accounts: Account[] }
- Horizontal strip showing each linked bank account
- Shows: account name, mask (last 4 digits), balance
- "Link Account" button if no accounts linked (placeholder for Ep 5)

---

## 3. SKELETON LOADING STATES
Create `components/shared/dashboard-skeleton.tsx`:
- Skeleton for balance card
- Skeleton for stat cards (x2)
- Skeleton for recent transactions list (x5 rows)
- Use shadcn Skeleton component

---

## 4. DASHBOARD PAGE
Update `app/(root)/dashboard/page.tsx`:
- Get session and userId from Supabase server client
- Call all three server actions in parallel using Promise.all:
  const [stats, accounts, transactions] = await Promise.all([
    getDashboardStats(userId),
    getAccountsWithBalance(userId),
    getRecentTransactions(userId)
  ])
- Wrap in Suspense with <DashboardSkeleton /> as fallback
- Layout:
  - Sidebar on the left (hidden on mobile)
  - MobileNav at top (visible on mobile only)
  - Main content area on the right:
    - Welcome message: "Good morning, {firstName} 👋"
    - BalanceCard
    - Two StatCards side by side (Total Sent + Total Received)
    - RecentTransactions
    - LinkedAccountStrip

---

## 5. LAYOUT
Update `app/(root)/layout.tsx`:
- Flex row layout
- Sidebar on left (fixed width: 280px)
- Main content takes remaining width
- Protect all (root) routes — redirect to /sign-in if no session

---

## RULES TO FOLLOW
- All files in kebab-case
- Fetch all data server-side in page.tsx using Server Components
- Pass data down as props to Client Components — no client-side fetching
- Use Promise.all for parallel data fetching — never sequential awaits
- All amounts formatted as currency using Intl.NumberFormat
- Use shadcn Card, Skeleton, Badge, Button, Sheet components
- Use lucide-react for all icons
- Mobile-first responsive design
- Use cn() for conditional classNames
- TypeScript strictly — no 'any' types
- Empty states for all lists
- No hardcoded colors — use Tailwind semantic classesI'm building SwiftSend, a full-stack Wise clone.
Episode 3 — I need to build the main dashboard UI with real data from Prisma.

---

## WHAT'S ALREADY DONE
- Next.js App Router + TypeScript
- Supabase Auth working — user can sign up, sign in, sign out
- Prisma schema migrated (User, Account, Transaction, Transfer, PlaidItem)
- dashboard/page.tsx exists with session check
- shadcn/ui installed, Tailwind configured

---

## 1. SERVER ACTIONS
Create `actions/account.actions.ts` with these three functions:

// getAccountsWithBalance(userId: string)
- Prisma: findMany accounts where userId matches
- Return accounts[] with id, name, type, balance, currency, mask

// getDashboardStats(userId: string)
- Prisma aggregate:
  - Sum of all DEBIT transactions across user's accounts = totalSent
  - Sum of all CREDIT transactions across user's accounts = totalReceived
  - Sum of all account balances = totalBalance
- Return { totalSent, totalReceived, totalBalance }

// getRecentTransactions(userId: string, limit = 5)
- Prisma: findMany transactions
- Where: account.userId = userId
- OrderBy: date desc
- Take: limit
- Include: account name
- Return Transaction[] with account info

---

## 2. COMPONENTS

Create these components in `components/shared/`:

### sidebar.tsx
- Fixed left sidebar, full height
- SwiftSend logo + name at top
- Nav links with icons (use lucide-react):
  - Dashboard → /dashboard
  - Transactions → /transactions
  - Transfer Money → /transfer
  - Profile → /profile
- Active link highlighted
- User avatar + full name + email at bottom
- Sign out button at bottom

### mobile-nav.tsx
- Hamburger menu button (top left)
- Opens a sheet/drawer (shadcn Sheet component)
- Same nav links as sidebar
- Visible only on mobile (md:hidden)

### balance-card.tsx
- Props: { totalBalance: number, currency: string }
- Large balance display
- "Total Balance" label
- Subtle card styling with shadcn Card

### stat-card.tsx
- Props: { label: string, amount: number, icon: ReactNode, color: string }
- Reusable for both "Total Sent" and "Total Received"
- Icon on the left, amount + label on the right

### recent-transactions.tsx
- Props: { transactions: Transaction[] }
- Title: "Recent Transactions"
- Maps over transactions and renders transaction-item.tsx
- "View all" link to /transactions
- Empty state if no transactions

### transaction-item.tsx
- Props: { transaction: Transaction }
- Shows: description, amount (red for DEBIT, green for CREDIT),
  date formatted as "Mar 13, 2026", status badge
- Category icon on the left (use lucide-react based on category string)

### linked-account-strip.tsx
- Props: { accounts: Account[] }
- Horizontal strip showing each linked bank account
- Shows: account name, mask (last 4 digits), balance
- "Link Account" button if no accounts linked (placeholder for Ep 5)

---

## 3. SKELETON LOADING STATES
Create `components/shared/dashboard-skeleton.tsx`:
- Skeleton for balance card
- Skeleton for stat cards (x2)
- Skeleton for recent transactions list (x5 rows)
- Use shadcn Skeleton component

---

## 4. DASHBOARD PAGE
Update `app/(root)/dashboard/page.tsx`:
- Get session and userId from Supabase server client
- Call all three server actions in parallel using Promise.all:
  const [stats, accounts, transactions] = await Promise.all([
    getDashboardStats(userId),
    getAccountsWithBalance(userId),
    getRecentTransactions(userId)
  ])
- Wrap in Suspense with <DashboardSkeleton /> as fallback
- Layout:
  - Sidebar on the left (hidden on mobile)
  - MobileNav at top (visible on mobile only)
  - Main content area on the right:
    - Welcome message: "Good morning, {firstName} 👋"
    - BalanceCard
    - Two StatCards side by side (Total Sent + Total Received)
    - RecentTransactions
    - LinkedAccountStrip

---

## 5. LAYOUT
Update `app/(root)/layout.tsx`:
- Flex row layout
- Sidebar on left (fixed width: 280px)
- Main content takes remaining width
- Protect all (root) routes — redirect to /sign-in if no session

---

## RULES TO FOLLOW
- All files in kebab-case
- Fetch all data server-side in page.tsx using Server Components
- Pass data down as props to Client Components — no client-side fetching
- Use Promise.all for parallel data fetching — never sequential awaits
- All amounts formatted as currency using Intl.NumberFormat
- Use shadcn Card, Skeleton, Badge, Button, Sheet components
- Use lucide-react for all icons
- Mobile-first responsive design
- Use cn() for conditional classNames
- TypeScript strictly — no 'any' types
- Empty states for all lists
- No hardcoded colors — use Tailwind semantic classes