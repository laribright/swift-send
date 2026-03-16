I'm building SwiftSend, a full-stack Wise clone.
Episode 7 — I need to build the full profile and settings page.

---

## WHAT'S ALREADY DONE
- Next.js App Router + TypeScript
- Supabase Auth working
- Prisma schema migrated (User, Account, Transaction, Transfer, PlaidItem)
- Dashboard, Transactions, Plaid linking, and Transfers all working
- lib/supabase/client.ts and lib/supabase/server.ts exist
- lib/prisma.ts singleton exists
- shadcn/ui installed, Tailwind configured

---

## 1. ZOD SCHEMAS
Create `lib/validations/user.ts`:

export const updateProfileSchema = z.object({
  firstName: z.string().min(2).max(50),
  lastName:  z.string().min(2).max(50)
})

export const changePasswordSchema = z.object({
  currentPassword: z.string().min(1),
  newPassword:     z.string().min(8),
  confirmPassword: z.string()
}).refine(d => d.newPassword === d.confirmPassword, {
  message: "Passwords don't match",
  path: ["confirmPassword"]
})

---

## 2. SERVER ACTIONS
Create `actions/user.actions.ts`:

// updateProfile({ userId, firstName, lastName })
- Validate with updateProfileSchema
- Prisma: update User where id = userId
  data: { firstName, lastName }
- Revalidate /profile path after update
- Return { success: true } or { error }

// updateAvatar({ userId, formData })
- Extract file from formData: formData.get('avatar') as File
- Validate: file must be image (image/jpeg, image/png, image/webp)
- Validate: file size max 2MB
- Upload to Supabase Storage:
  const { data, error } = await supabase.storage
    .from('avatars')
    .upload(`${userId}/avatar`, file, {
      upsert: true,
      contentType: file.type
    })
- Get public URL:
  const { data: { publicUrl } } = supabase.storage
    .from('avatars')
    .getPublicUrl(`${userId}/avatar`)
- Prisma: update User.avatarUrl = publicUrl
- Revalidate /profile path
- Return { success: true, avatarUrl: publicUrl } or { error }

// changePassword({ newPassword })
- Validate with changePasswordSchema
- Update password via Supabase Auth:
  const { error } = await supabase.auth.updateUser({
    password: newPassword
  })
- Note: Supabase handles current password verification
  via the active session — no need to verify manually
- Return { success: true } or { error }

// deleteAccount({ userId })
- Prisma: delete in this order to respect relations:
  1. prisma.transaction.deleteMany({ where: { account: { userId } } })
  2. prisma.transfer.deleteMany({ where: { OR: [{ senderId: userId }, { receiverId: userId }] } })
  3. prisma.account.deleteMany({ where: { userId } })
  4. prisma.plaidItem.deleteMany({ where: { userId } })
  5. prisma.user.delete({ where: { id: userId } })
- Sign out Supabase auth session
- Delete Supabase auth user using admin client with service role key
- Redirect to /sign-up
- Return { success: true } or { error }

// getCurrentUser(userId)
- Prisma: findUnique User where id = userId
- Select: id, email, firstName, lastName, avatarUrl, createdAt
- Return user data for profile page

---

## 3. SUPABASE ADMIN CLIENT
Create `lib/supabase/admin.ts`:
- Use createClient with SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY
- This is for server-side admin operations only (delete auth user)
- NEVER expose this client to the browser

import { createClient } from '@supabase/supabase-js'

export const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

---

## 4. PROFILE PAGE
Create `app/(root)/profile/page.tsx`:
- Server component
- Get userId from Supabase server session
- Call getCurrentUser(userId)
- Pass user data to client components below
- Layout:
  - Page title: "Profile & Settings"
  - Three sections stacked vertically:
    1. Avatar section
    2. Personal info section
    3. Password section
    4. Danger zone section

---

## 5. COMPONENTS

### profile-avatar.tsx (Client Component)
- Props: { userId: string, avatarUrl: string | null, fullName: string }
- Show current avatar using shadcn Avatar component
- Fallback: initials from fullName if no avatar
- "Change Photo" button triggers hidden file input
- On file select:
  - Show image preview immediately (URL.createObjectURL)
  - Show file size and name
  - "Save Photo" button calls updateAvatar() via useServerAction
  - "Cancel" button resets preview
- Only accept: image/jpeg, image/png, image/webp
- Max size: 2MB — show error if exceeded
- Loading spinner while uploading
- Success toast on save

### profile-form.tsx (Client Component)
- Props: { userId: string, firstName: string, lastName: string, email: string }
- Two inputs: First Name, Last Name
- Email shown as read-only (cannot change email)
- Uses react-hook-form + zodResolver(updateProfileSchema)
- Calls updateProfile() via useServerAction on submit
- Track dirty state with formState.isDirty
- "Save Changes" button disabled when form is not dirty or loading
- Show unsaved changes warning badge when form is dirty
- Success toast on save
- Inline field errors

### password-form.tsx (Client Component)
- Three inputs: Current Password, New Password, Confirm Password
- All inputs have show/hide password toggle (eye icon)
- Uses react-hook-form + zodResolver(changePasswordSchema)
- Calls changePassword() via useServerAction on submit
- Reset form after successful password change
- Success toast on save
- Inline field errors
- Password strength indicator for new password:
  - Weak (red): less than 8 chars
  - Medium (yellow): 8+ chars, no special chars
  - Strong (green): 8+ chars with numbers and special chars

### delete-account-dialog.tsx (Client Component)
- Props: { userId: string }
- "Delete Account" button styled in red (destructive variant)
- Opens shadcn AlertDialog on click
- Dialog content:
  - Warning icon
  - "Are you absolutely sure?"
  - "This will permanently delete your account, all transactions,
     and transfer history. This cannot be undone."
  - Type-to-confirm input: user must type "DELETE" to enable confirm button
  - "Cancel" button closes dialog
  - "Delete My Account" button (red) calls deleteAccount() via useServerAction
- Loading state while deleting

---

## RULES TO FOLLOW
- All files in kebab-case
- updateAvatar uses FormData — not JSON — because it handles file uploads
- Use supabase server client for changePassword (needs active session)
- Use supabaseAdmin (service role) ONLY for deleteAccount auth deletion
- NEVER import supabaseAdmin in client components
- All server actions return { success, data } or { error } — never throw
- Revalidate /profile after every successful update
- Use react-hook-form for all forms with zodResolver
- Use useServerAction hook for all form submissions
- Track dirty state — disable save button when nothing has changed
- Show toast on every success and error using shadcn toast
- Avatar upload uses FormData.append('avatar', file) pattern
- TypeScript strictly — no 'any' types
- Use shadcn Avatar, Card, Input, Button, AlertDialog,
  Separator, Badge components
- Use lucide-react for icons