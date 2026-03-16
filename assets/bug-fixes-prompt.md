I'm building SwiftSend, a full-stack Wise clone.
I have 4 bugs to fix. Fix each one exactly as described — do not change 
anything outside of what is specified for each bug.

---

## BUG 1 — Redirect throws error caught by useServerAction

### Problem
Next.js redirect() throws a special error internally called NEXT_REDIRECT.
When called inside a try/catch in useServerAction, it gets caught and
triggers toast.error("Something went wrong") even though the redirect
succeeds.

### Fix
In `hooks/use-server-action.ts`, check if the caught error is a Next.js
redirect before showing the toast. If it is a redirect, re-throw it so
Next.js can handle it correctly:

import { isRedirectError } from 'next/dist/client/components/redirect-error'

// In the catch block, replace:
} catch {
  toast.error("Something went wrong");
}

// With:
} catch (err) {
  if (isRedirectError(err)) {
    throw err; // let Next.js handle the redirect
  }
  toast.error("Something went wrong");
}

Do not change anything else in useServerAction.

---

## BUG 2 — Authenticated users can visit auth pages

### Problem
The auth layout has no session check so logged-in users can visit
/sign-in and /sign-up freely.

### Fix
Convert `app/(auth)/layout.tsx` to an async server component.
Check for a Supabase session at the top. If a session exists,
redirect to /dashboard:

import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'

export default async function AuthLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const supabase = await createClient()
  const { data: { session } } = await supabase.auth.getSession()

  if (session) {
    redirect('/dashboard')
  }

  return (
    // keep existing JSX exactly as-is
  )
}

Do not change the JSX markup at all — only add the session check.

---

## BUG 3 — Dashboard not responsive with linked accounts

### Problem
LinkedAccountStrip uses a horizontal flex with overflow-x-auto which
breaks the dashboard layout on mobile. The cards have fixed min-width
causing horizontal overflow on small screens.

### Fix
Update `components/shared/linked-account-strip.tsx`:

1. Wrap the scrollable area in a relative container that constrains
   width properly on mobile:

// Replace the outer scroll div:
<div className="flex gap-3 overflow-x-auto pb-2">

// With:
<div className="-mx-4 flex gap-3 overflow-x-auto px-4 pb-2 sm:mx-0 sm:px-0">

2. Make account cards slightly narrower on mobile:

// Replace:
className="min-w-[220px] shrink-0 rounded-lg border bg-card p-4"

// With:
className="min-w-[180px] sm:min-w-[220px] shrink-0 rounded-lg border bg-card p-4"

3. Make the "Add another" card match:

// Replace:
className="flex min-w-[220px] shrink-0 items-center justify-center rounded-lg border border-dashed"

// With:
className="flex min-w-[180px] sm:min-w-[220px] shrink-0 items-center justify-center rounded-lg border border-dashed"

Do not change any other part of the component.

---

## BUG 4 — Wrong current password still updates successfully

### Problem
Supabase's supabase.auth.updateUser() does not verify the current
password — it just updates it directly using the active session.
So a wrong current password is never actually checked.

### Fix
In `actions/user.actions.ts`, inside changePassword():

Before calling supabase.auth.updateUser(), verify the current password
by signing in with the user's email and current password first:

// Step 1: Get current user's email from session
const { data: { user } } = await supabase.auth.getUser()
if (!user?.email) {
  return { error: 'Not authenticated' }
}

// Step 2: Re-authenticate with current password to verify it
const { error: signInError } = await supabase.auth.signInWithPassword({
  email: user.email,
  password: parsed.data.currentPassword
})

if (signInError) {
  return { error: 'Current password is incorrect' }
}

// Step 3: Now safe to update password
const { error } = await supabase.auth.updateUser({
  password: parsed.data.newPassword
})

if (error) {
  return { error: error.message ?? 'Failed to update password.' }
}

return { success: true, data: true }

The full updated function should look like:

export async function changePassword(input: {
  currentPassword: string;
  newPassword: string;
  confirmPassword: string;
}): Promise<{ success: true; data: true } | { error: string }> {
  const parsed = changePasswordSchema.safeParse(input);
  if (!parsed.success) {
    const msg =
      parsed.error.flatten().fieldErrors.confirmPassword?.[0] ??
      parsed.error.flatten().fieldErrors.newPassword?.[0] ??
      "Invalid input";
    return { error: msg };
  }

  const supabase = await createClient();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user?.email) {
    return { error: "Not authenticated" };
  }

  const { error: signInError } = await supabase.auth.signInWithPassword({
    email: user.email,
    password: parsed.data.currentPassword,
  });

  if (signInError) {
    return { error: "Current password is incorrect" };
  }

  const { error } = await supabase.auth.updateUser({
    password: parsed.data.newPassword,
  });

  if (error) {
    return { error: error.message ?? "Failed to update password." };
  }

  return { success: true, data: true };
}

---

## RULES TO FOLLOW
- Fix each bug in isolation — do not refactor surrounding code
- Do not change any UI styling beyond what is specified in Bug 3
- Do not change any Zod schemas
- Do not change any other server actions
- TypeScript strictly — no 'any' types
- Keep all existing imports — only add what is needed for each fix