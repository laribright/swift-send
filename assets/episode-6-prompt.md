I'm building SwiftSend, a full-stack Wise clone.
Episode 6 — I need to build the full fund transfer flow using Stripe + Prisma.

---

## WHAT'S ALREADY DONE
- Next.js App Router + TypeScript
- Supabase Auth working
- Prisma schema migrated (User, Account, Transaction, Transfer, PlaidItem)
- Dashboard, Transactions, and Plaid bank linking all working
- lib/prisma.ts uses DATABASE_URL (pooled) for ALL queries including transactions
- Prisma $transaction uses BATCH/ARRAY syntax only — NOT interactive callbacks
- shadcn/ui installed, Tailwind configured
- .env.local has STRIPE_SECRET_KEY and NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY

---

## 1. INSTALL DEPENDENCIES
Run:
npm install stripe @stripe/stripe-js @stripe/react-stripe-js

---

## 2. STRIPE CLIENT SETUP

Create `lib/stripe.ts` (server-side only):

import Stripe from 'stripe'

export const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2024-06-20',
  typescript: true,
})

---

## 3. ZOD SCHEMAS
Create `lib/validations/transfer.ts`:

export const recipientSchema = z.object({
  email: z.string().email()
})

export const transferSchema = z.object({
  senderId:   z.string().uuid(),
  receiverId: z.string().uuid(),
  amount:     z.number().positive().max(10000),
  currency:   z.string().default('USD'),
  note:       z.string().max(100).optional()
})

---

## 4. SERVER ACTIONS
Create `actions/transfer.actions.ts`:

// lookupRecipient({ email })
- Validate with recipientSchema
- Prisma: findUnique user by email
- If not found return { error: 'No SwiftSend user found with that email' }
- Never return sensitive data — only { id, firstName, lastName, avatarUrl }

// createTransfer({ senderId, receiverId, amount, note, currency })
- Validate with transferSchema
- Step 1: Fetch all required data BEFORE the transaction:
    const senderAccount = await prisma.account.findFirst({
      where: { userId: senderId },
      orderBy: { balance: 'desc' }
    })
    if (!senderAccount || senderAccount.balance < amount) {
      return { error: 'Insufficient funds' }
    }
    const receiverAccount = await prisma.account.findFirst({
      where: { userId: receiverId }
    })
    if (!receiverAccount) {
      return { error: 'Receiver account not found' }
    }

- Step 2: Create Stripe PaymentIntent:
    const paymentIntent = await stripe.paymentIntents.create({
      amount: Math.round(amount * 100), // convert to cents
      currency: currency.toLowerCase(),
      metadata: { senderId, receiverId }
    })

- Step 3: Generate Transfer ID upfront so we can reference it
    in Transaction records inside the batch:
    const transferId = crypto.randomUUID()

- Step 4: Batch Prisma transaction — use ARRAY syntax only,
    NEVER interactive callback syntax:

    await prisma.$transaction([
      // 1. Deduct from sender account
      prisma.account.update({
        where: { id: senderAccount.id },
        data: { balance: { decrement: amount } }
      }),
      // 2. Add to receiver account
      prisma.account.update({
        where: { id: receiverAccount.id },
        data: { balance: { increment: amount } }
      }),
      // 3. Create Transfer record
      prisma.transfer.create({
        data: {
          id: transferId,
          senderId,
          receiverId,
          amount,
          currency,
          note,
          status: 'COMPLETED',
          stripePaymentId: paymentIntent.id
        }
      }),
      // 4. Create DEBIT transaction for sender
      prisma.transaction.create({
        data: {
          accountId: senderAccount.id,
          amount,
          type: 'DEBIT',
          status: 'COMPLETED',
          description: `Transfer to ${receiverId}`,
          transferId
        }
      }),
      // 5. Create CREDIT transaction for receiver
      prisma.transaction.create({
        data: {
          accountId: receiverAccount.id,
          amount,
          type: 'CREDIT',
          status: 'COMPLETED',
          description: `Transfer from ${senderId}`,
          transferId
        }
      }),
    ])

- Returns { transferId, success } or { error }
- If Stripe succeeds but Prisma fails — log stripePaymentId for reconciliation

// getTransferById(transferId)
- Prisma: findUnique Transfer where id matches
- Include: sender (id, firstName, lastName, avatarUrl)
- Include: receiver (id, firstName, lastName, avatarUrl)
- Include: transactions[]
- Returns full transfer details for success screen

---

## 5. PAGES & COMPONENTS

### Multi-step transfer form
Create `app/(root)/transfer/page.tsx`:
- Client component with 3 steps managed by useState
- step: 1 | 2 | 3
- Store recipient, transferData in state across steps

#### Step 1 — Recipient Lookup
Create `components/shared/recipient-lookup.tsx`:
- Single email input + "Find User" button
- Calls lookupRecipient() on submit
- On success: show recipient card with avatar, full name
- "Continue" button advances to Step 2
- Zod validation with recipientSchema
- Inline error if user not found
- Cannot send to yourself — show error if email matches sender

#### Step 2 — Amount & Note
Create `components/shared/transfer-form.tsx`:
- Props: { recipient: User, senderId: string }
- Amount input with USD label
- Optional note textarea (max 100 chars)
- Show sender current balance below amount input
- Validate: amount cannot exceed sender balance
- "Review Transfer" button advances to Step 3
- Zod validation with transferSchema
- Back button returns to Step 1

#### Step 3 — Confirmation
Create `components/shared/transfer-confirm.tsx`:
- Props: { transferData, recipient, sender }
- Summary card showing:
  - From: sender name + avatar
  - To: recipient name + avatar
  - Amount: formatted with Intl.NumberFormat
  - Note (if provided)
- "Confirm & Send" button calls createTransfer()
- Loading spinner while processing
- Back button returns to Step 2
- On success: redirect to /transfer/success?id={transferId}

### Success Page
Create `app/(root)/transfer/success/page.tsx`:
- Server component
- Read transferId from searchParams
- Call getTransferById(transferId)
- Show full transfer summary:
  - Green checkmark icon
  - "Transfer Successful!" heading
  - Amount sent
  - Recipient name + avatar
  - Transaction ID
  - Date and time
  - Note (if provided)
- "Back to Dashboard" button → /dashboard
- "Send Another" button → /transfer

---

## RULES TO FOLLOW
- All files in kebab-case
- ALWAYS use prisma.$transaction([...]) ARRAY syntax — NEVER callback syntax
- Fetch all data needed for the transaction BEFORE calling $transaction([])
- Generate IDs with crypto.randomUUID() upfront when records reference each other
- Never expose Stripe secret key to the client
- All Stripe calls happen server-side only in server actions
- Amount always stored in database as full value (not cents)
- Amount always sent to Stripe in cents (multiply by 100)
- Always check sufficient balance BEFORE creating Stripe PaymentIntent
- If Stripe succeeds but Prisma fails — log stripePaymentId for reconciliation
- Multi-step form state managed with useState — no URL state needed
- Cannot transfer to yourself — validate senderId !== receiverId
- TypeScript strictly — no 'any' types
- Show loading states at every async step
- Show toast on success and error
- All amounts formatted with Intl.NumberFormat
- Use shadcn Card, Button, Input, Textarea, Avatar, Badge components
- Use lucide-react for icons