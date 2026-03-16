I'm building SwiftSend, a full-stack Wise clone. 
Episode 2 — I need to implement full authentication using Supabase Auth + Prisma.

---

## WHAT'S ALREADY DONE
- Next.js App Router + TypeScript
- Supabase project created and connected
- Prisma schema migrated (User, Account, Transaction, Transfer, PlaidItem)
- lib/supabase/client.ts and lib/supabase/server.ts exist
- lib/prisma.ts singleton exists
- .env.local is populated

---

## 1. ZOD SCHEMAS
Create `lib/validations/auth.ts`:

export const signUpSchema = z.object({
  firstName:       z.string().min(2),
  lastName:        z.string().min(2),
  email:           z.string().email(),
  password:        z.string().min(8),
  confirmPassword: z.string()
}).refine(d => d.password === d.confirmPassword, {
  message: "Passwords don't match",
  path: ["confirmPassword"]
})

export const signInSchema = z.object({
  email:    z.string().email(),
  password: z.string().min(1, "Password is required")
})

---

## 2. SERVER ACTIONS
Create `actions/auth.actions.ts` with these three actions:

// signUpAction
- Validate with signUpSchema
- Call supabase.auth.signUp({ email, password })
- If successful, create User in Prisma:
  prisma.user.create({ 
    data: { 
      id: supabaseUser.id,  ← use Supabase auth user ID as Prisma User ID
      email, 
      firstName, 
      lastName 
    } 
  })
- Redirect to /dashboard on success
- Return { error } on failure

// signInAction
- Validate with signInSchema
- Call supabase.auth.signInWithPassword({ email, password })
- Redirect to /dashboard on success
- Return { error } on failure

// signOutAction
- Call supabase.auth.signOut()
- Redirect to /sign-in

---

## 3. AUTH CALLBACK ROUTE
Create `app/auth/callback/route.ts`:
- Handle the Supabase OAuth code exchange
- Exchange code for session using supabase.auth.exchangeCodeForSession()
- Redirect to /dashboard on success
- Redirect to /sign-in on error

---

## 4. PAGES & FORMS

Create `app/(auth)/sign-in/page.tsx`:
- Email + password form
- Uses react-hook-form + zodResolver(signInSchema)
- Calls signInAction via useServerAction
- Shows inline field errors
- Disables submit button while loading
- Link to /sign-up

Create `app/(auth)/sign-up/page.tsx`:
- First name, last name, email, password, confirm password form
- Uses react-hook-form + zodResolver(signUpSchema)
- Calls signUpAction via useServerAction
- Shows inline field errors
- Disables submit button while loading
- Link to /sign-in

Create `app/(auth)/layout.tsx`:
- Centered layout for auth pages
- SwiftSend logo/name at top
- Clean minimal design using Tailwind

---

## 5. REDIRECT PROTECTION
Update `app/(root)/dashboard/page.tsx`:
- Check for Supabase session using server client
- If no session, redirect to /sign-in
- If session exists, show dashboard (placeholder for now)

---

## RULES TO FOLLOW
- All files in kebab-case
- Use server client (lib/supabase/server.ts) in server actions and route handlers
- Use browser client (lib/supabase/client.ts) in client components only
- All server actions return { success, data } or { error } — never throw
- Use useServerAction hook for all form submissions
- Show toast on success and error using shadcn/ui toast
- TypeScript strictly — no 'any' types
- Use cn() for conditional classNames
- All form inputs use shadcn/ui Input and Button components