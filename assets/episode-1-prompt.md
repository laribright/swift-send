I'm building SwiftSend, a full-stack Wise clone using Next.js App Router, 
Supabase, Prisma, Plaid and Stripe.

I need you to help me set up the foundation. Here's what's already done:
- Next.js with App Router and TypeScript
- Tailwind CSS configured
- shadcn/ui installed
- Deployed to Vercel

Here's what I need you to do now:

---

## 1. ENV SETUP
Create a `.env.local` file with these placeholders:

DATABASE_URL=
DIRECT_URL=
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
PLAID_CLIENT_ID=
PLAID_SECRET=
PLAID_ENV=sandbox
STRIPE_SECRET_KEY=
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=
NEXT_PUBLIC_APP_URL=http://localhost:3000

---

## 2. TYPESCRIPT PATH ALIASES
Update `tsconfig.json` to include:

"paths": {
  "@/*": ["./*"],
  "@/components/*": ["./components/*"],
  "@/lib/*": ["./lib/*"],
  "@/actions/*": ["./actions/*"]
}

---

## 3. PRISMA SETUP
Install Prisma and create `prisma/schema.prisma` with this exact schema:

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
  mask         String?
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

---

## 4. PRISMA CLIENT SINGLETON
Create `lib/prisma.ts`:

import { PrismaClient } from '@prisma/client'

const globalForPrisma = globalThis as unknown as { prisma: PrismaClient }
export const prisma = globalForPrisma.prisma || new PrismaClient()
if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma

---

## 5. SUPABASE CLIENT
Create two Supabase clients:

lib/supabase/client.ts  ← browser client (for client components)
lib/supabase/server.ts  ← server client (for server actions and API routes)

Use @supabase/ssr package. Skeleton only, I'll fill in the logic.

---

## 6. FOLDER STRUCTURE
Create empty index files to establish this structure:

actions/
  auth.actions.ts
  account.actions.ts
  transaction.actions.ts
  transfer.actions.ts
  plaid.actions.ts
  user.actions.ts

lib/
  validations/
    auth.ts
    transfer.ts
    transaction.ts
    user.ts

components/
  shared/
    sidebar.tsx
    mobile-nav.tsx
    balance-card.tsx
    stat-card.tsx
    transaction-item.tsx

---

Rules to follow:
- All files in kebab-case
- All server actions use useServerAction pattern with Zod validation
- Always return { success, data } or { error } — never throw
- Use TypeScript strictly, no 'any' types