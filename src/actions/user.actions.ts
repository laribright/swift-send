"use server";

import { cache } from "react";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { createClient } from "@/lib/supabase/server";
import { supabaseAdmin } from "@/lib/supabase/admin";
import {
  updateProfileSchema,
  changePasswordSchema,
} from "@/lib/validations/user";

const ALLOWED_AVATAR_TYPES = [
  "image/jpeg",
  "image/png",
  "image/webp",
] as const;
const MAX_AVATAR_SIZE_BYTES = 2 * 1024 * 1024; // 2MB

export const getCurrentUser = cache(async (userId: string) => {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      id: true,
      email: true,
      firstName: true,
      lastName: true,
      avatarUrl: true,
      createdAt: true,
    },
  });

  if (!user) return null;

  return {
    id: user.id,
    email: user.email,
    firstName: user.firstName,
    lastName: user.lastName,
    avatarUrl: user.avatarUrl,
    createdAt: user.createdAt,
  };
});

export type CurrentUser = NonNullable<Awaited<ReturnType<typeof getCurrentUser>>>;

export async function updateProfile(input: {
  userId: string;
  firstName: string;
  lastName: string;
}): Promise<{ success: true, data: true } | { error: string }> {
  const parsed = updateProfileSchema.safeParse({
    firstName: input.firstName,
    lastName: input.lastName,
  });

  if (!parsed.success) {
    return { error: "Invalid name" };
  }

  try {
    await prisma.user.update({
      where: { id: input.userId },
      data: {
        firstName: parsed.data.firstName,
        lastName: parsed.data.lastName,
      },
    });
    revalidatePath("/profile");
    return { success: true, data: true };
  } catch {
    return { error: "Failed to update profile" };
  }
}

export async function updateAvatar(input: {
  userId: string;
  formData: FormData;
}): Promise<
  | { success: true; data: { avatarUrl: string } }
  | { error: string }
> {
  const file = input.formData.get("avatar");
  if (!file || !(file instanceof File)) {
    return { error: "No file provided" };
  }

  if (
    !ALLOWED_AVATAR_TYPES.includes(file.type as (typeof ALLOWED_AVATAR_TYPES)[number])
  ) {
    return { error: "Invalid file type. Use JPEG, PNG, or WebP." };
  }

  if (file.size > MAX_AVATAR_SIZE_BYTES) {
    return { error: "File must be 2MB or less." };
  }

  const supabase = await createClient();
  const path = `${input.userId}/avatar`;

  const { error: uploadError } = await supabase.storage
    .from("avatars")
    .upload(path, file, {
      upsert: true,
      contentType: file.type,
    });

  if (uploadError) {
    console.error("Avatar upload error:", uploadError);
    return { error: "Failed to upload image." };
  }

  const {
    data: { publicUrl },
  } = supabase.storage.from("avatars").getPublicUrl(path);

  try {
    await prisma.user.update({
      where: { id: input.userId },
      data: { avatarUrl: publicUrl },
    });
    revalidatePath("/profile");
    return { success: true, data: { avatarUrl: publicUrl } };
  } catch {
    return { error: "Failed to save profile." };
  }
}

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

  const {
    data: { user },
  } = await supabase.auth.getUser();
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

export async function deleteAccount(input: {
  userId: string;
}): Promise<{ success: true, data: true } | { error: string }> {
  try {
    await prisma.transaction.deleteMany({
      where: { account: { userId: input.userId } },
    });
    await prisma.transfer.deleteMany({
      where: {
        OR: [{ senderId: input.userId }, { receiverId: input.userId }],
      },
    });
    await prisma.account.deleteMany({ where: { userId: input.userId } });
    await prisma.plaidItem.deleteMany({ where: { userId: input.userId } });
    await prisma.user.delete({ where: { id: input.userId } });
  } catch (err) {
    console.error("Delete account DB error:", err);
    return { error: "Failed to delete account." };
  }

  const supabase = await createClient();
  await supabase.auth.signOut();

  const { error: deleteError } =
    await supabaseAdmin.auth.admin.deleteUser(input.userId);
  if (deleteError) {
    console.error("Delete auth user error:", deleteError);
    // DB is already cleaned; still redirect
  }

  redirect("/sign-up");
}
