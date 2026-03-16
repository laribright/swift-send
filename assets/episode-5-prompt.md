I'm building SwiftSend, a full-stack Wise clone.
Episode 5 — I need to integrate Plaid to let users link their bank accounts.

---

## WHAT'S ALREADY DONE
- Next.js App Router + TypeScript
- Supabase Auth working
- Prisma schema migrated (User, Account, Transaction, Transfer, PlaidItem)
- Dashboard page built with LinkedAccountStrip component (placeholder)
- .env.local has PLAID_CLIENT_ID, PLAID_SECRET, PLAID_ENV=sandbox

---

## 1. INSTALL DEPENDENCIES
Run:
npm install plaid react-plaid-link

---

## 2. PLAID CLIENT SETUP
Create `lib/plaid.ts`:

import { Configuration, PlaidApi, PlaidEnvironments } from 'plaid'

const configuration = new Configuration({
  basePath: PlaidEnvironments[process.env.PLAID_ENV as string],
  baseOptions: {
    headers: {
      'PLAID-CLIENT-ID': process.env.PLAID_CLIENT_ID,
      'PLAID-SECRET':    process.env.PLAID_SECRET,
    }
  }
})

export const plaidClient = new PlaidApi(configuration)

---

## 3. ZOD SCHEMA
Create `lib/validations/plaid.ts`:

export const exchangeTokenSchema = z.object({
  publicToken: z.string().min(1),
  userId:      z.string().uuid()
})

---

## 4. API ROUTES

Create `app/api/plaid/create-link-token/route.ts`:
- POST route
- Get userId from request body
- Call plaidClient.linkTokenCreate():
  {
    user: { client_user_id: userId },
    client_name: 'SwiftSend',
    products: ['auth', 'transactions'],
    language: 'en',
    country_codes: ['US'],
  }
- Return { link_token }
- Handle errors gracefully

Create `app/api/plaid/exchange-token/route.ts`:
- POST route
- Validate body with exchangeTokenSchema
- Call plaidClient.itemPublicTokenExchange({ public_token: publicToken })
- Get accessToken and itemId from response
- Call plaidClient.institutionsGetById() to get institution name
- Call plaidClient.accountsGet() to get account details
- Store in Prisma:
  1. Create PlaidItem: { userId, accessToken, itemId, institutionId, institutionName }
  2. For each account from Plaid, create Account:
     { userId, name: account.name, mask: account.mask, type: 'CHECKING', balance: account.balances.current }
- Return { success }
- Handle errors gracefully

---

## 5. SERVER ACTIONS
Create `actions/plaid.actions.ts`:

// getLinkedAccounts(userId: string)
- Prisma: findMany PlaidItems where userId matches
- For each PlaidItem, call plaidClient.accountsGet({ access_token })
- Return accounts[] with:
  { id, name, mask, balance, currency, institutionName }
- Handle Plaid API errors per item gracefully

---

## 6. COMPONENTS

### plaid-link-button.tsx (Client Component)
- On mount, call POST /api/plaid/create-link-token to get link_token
- Use usePlaidLink from react-plaid-link:
  const { open, ready } = usePlaidLink({
    token: linkToken,
    onSuccess: async (public_token, metadata) => {
      // POST to /api/plaid/exchange-token
      // On success: refresh page to show new account
      // Show success toast
    },
    onExit: (err) => {
      // Handle user exit or error
      // Show error toast if err exists
    }
  })
- Render shadcn Button that calls open() when clicked
- Disabled when !ready or loading
- Button text: "Connect Bank Account"
- Show loading spinner while fetching link token

### linked-account-strip.tsx (update existing)
- Props: { accounts: Account[] }
- Call getLinkedAccounts(userId) to get fresh data
- Horizontal scrollable strip of account cards
- Each card shows:
  - Institution name
  - Account name + last 4 digits (mask)
  - Current balance
  - Account type badge
- If no accounts: show PlaidLinkButton
- If accounts exist: show accounts + "Add another" PlaidLinkButton

---

## 7. DASHBOARD UPDATE
Update `app/(root)/dashboard/page.tsx`:
- Import and call getLinkedAccounts(userId)
- Pass accounts to LinkedAccountStrip component
- Add to Promise.all:
  const [stats, accounts, transactions, linkedAccounts] = await Promise.all([...])

---

## RULES TO FOLLOW
- All files in kebab-case
- NEVER expose PLAID_SECRET or access tokens to the client
- All Plaid API calls happen server-side only (API routes or server actions)
- plaid-link-button.tsx is a Client Component — mark with 'use client'
- All API routes validate input before processing
- Always handle Plaid errors per item — one failing account shouldn't break the whole list
- Store access tokens in Prisma only — never in localStorage or cookies
- Use shadcn Button, Toast components
- Use lucide-react for icons
- TypeScript strictly — no 'any' types
- Return { success } or { error } from all actions — never throw