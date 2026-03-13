"use server";

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { prisma } from "@/lib/prisma";
import {
  signUpSchema,
  signInSchema,
  type SignUpInput,
  type SignInInput,
} from "@/lib/validations/auth";

export async function signUpAction(data: SignUpInput) {
  const parsed = signUpSchema.safeParse(data);

  if (!parsed.success) {
    return { error: "Invalid form data" };
  }

  const { firstName, lastName, email, password } = parsed.data;

  const supabase = await createClient();

  const { data: authData, error: authError } = await supabase.auth.signUp({
    email,
    password,
  });

  if (authError || !authData.user) {
    console.error("Supabase signUp error:", authError);
    return { error: authError?.message ?? "Failed to create account" };
  }

  try {
    await prisma.user.create({
      data: {
        id: authData.user.id, // This is the user's ID from Supabase
        email,
        firstName,
        lastName,
      },
    });
  } catch (err) {
    console.error("Prisma user create error:", err);
    return { error: "Failed to create user profile" };
  }

  redirect("/dashboard");
}

export async function signInAction(data: SignInInput) {
  const parsed = signInSchema.safeParse(data);

  if (!parsed.success) {
    return { error: "Invalid form data" };
  }

  const { email, password } = parsed.data;

  const supabase = await createClient();

  const { error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });

  if (error) {
    console.error("Supabase signIn error:", error);
    return { error: "Invalid email or password" };
  }

  redirect("/dashboard");
}

export async function signOutAction() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect("/sign-in");
}
