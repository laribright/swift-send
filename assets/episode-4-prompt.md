I'm building SwiftSend, a full-stack Wise clone.
Episode 4 — I need to build a full filterable transaction history page.

---

## WHAT'S ALREADY DONE
- Next.js App Router + TypeScript
- Supabase Auth working
- Prisma schema migrated (User, Account, Transaction, Transfer, PlaidItem)
- Dashboard page built with sidebar, balance card, stat cards
- components/shared/transaction-item.tsx exists
- shadcn/ui installed, Tailwind configured

---

## 1. ZOD SCHEMA
Create `lib/validations/transaction.ts`:

export const transactionFilterSchema = z.object({
  type:     z.enum(['all', 'DEBIT', 'CREDIT']).default('all'),
  search:   z.string().optional(),
  dateFrom: z.string().optional(),
  dateTo:   z.string().optional(),
  page:     z.coerce.number().default(1)
})

---

## 2. SERVER ACTION
Create `actions/transaction.actions.ts`:

// getTransactions({ userId, type, dateFrom, dateTo, search, page })
- Validate all params with transactionFilterSchema
- Build dynamic Prisma where clause:

  prisma.transaction.findMany({
    where: {
      account: { userId },
      ...(type !== 'all' && { type }),
      ...(search && {
        OR: [
          { description: { contains: search, mode: 'insensitive' } },
          { amount: { equals: parseFloat(search) || undefined } }
        ]
      }),
      ...(dateFrom && { date: { gte: new Date(dateFrom) } }),
      ...(dateTo   && { date: { lte: new Date(dateTo) } })
    },
    orderBy: { date: 'desc' },
    skip: (page - 1) * 20,
    take: 20,
    include: { account: { select: { name: true } } }
  })

- Run a separate prisma.transaction.count() with same where clause
- Return { transactions[], totalCount, totalPages }

---

## 3. COMPONENTS

### transaction-filter-bar.tsx
- Client component
- Three filter controls side by side:
  1. Type tabs: All | Sent | Received (shadcn Tabs)
  2. Search input with search icon (shadcn Input)
  3. Date range: two date inputs (From / To)
- "Clear filters" button — resets all filters
- Each filter change updates URL searchParams using useRouter
  and router.push() — NO full page reload
- Read initial values from searchParams to populate inputs on load
- Debounce search input by 300ms

### transaction-table.tsx
- Client component
- Props: { transactions: Transaction[], totalPages: number, currentPage: number }
- Renders list of transaction-item.tsx rows
- Pagination at the bottom:
  - Previous / Next buttons
  - "Page X of Y" display
  - Clicking updates ?page= in URL searchParams
- Empty state: icon + "No transactions found" + "Try adjusting your filters"

### transactions-skeleton.tsx
- Skeleton rows x8 using shadcn Skeleton
- Skeleton for filter bar at top

---

## 4. TRANSACTIONS PAGE
Create `app/(root)/transactions/page.tsx`:

- This is a Server Component
- Read searchParams from props: { type, search, dateFrom, dateTo, page }
- Get userId from Supabase server client session
- Call getTransactions({ userId, ...searchParams })
- Layout:
  - Page title: "Transaction History"
  - Total count: "Showing X transactions"
  - TransactionFilterBar at top (client component)
  - Suspense boundary around TransactionTable
    with TransactionsSkeleton as fallback
  - TransactionTable with results and pagination

---

## RULES TO FOLLOW
- All files in kebab-case
- Page is a Server Component — read searchParams directly from props
- Never fetch data client-side — all data fetching in server actions
- URL searchParams are the single source of truth for all filter state
- Never use useState for filter values — always sync with URL
- Use router.push() to update filters — not router.replace()
- Debounce search input 300ms before updating URL
- All amounts formatted with Intl.NumberFormat
- DEBIT amounts shown in red, CREDIT amounts shown in green
- Use shadcn Tabs, Input, Button, Badge, Skeleton components
- Use lucide-react for icons
- TypeScript strictly — no 'any' types
- Always show totalCount above the list
- Pagination only shown when totalPages > 1