import { z } from "zod/v4";

export const updateProfileSchema = z.object({
  firstName: z.string().min(2, "At least 2 characters").max(50),
  lastName: z.string().min(2, "At least 2 characters").max(50),
});

export const changePasswordSchema = z
  .object({
    currentPassword: z.string().min(1, "Current password is required"),
    newPassword: z.string().min(6, "At least 6 characters"),
    confirmPassword: z.string().min(1, "Confirm your password"),
  })
  .refine((d) => d.newPassword === d.confirmPassword, {
    message: "Passwords don't match",
    path: ["confirmPassword"],
  });

export const updateUserSchema = z.object({
  firstName: z.string().min(1, "First name is required").optional(),
  lastName: z.string().min(1, "Last name is required").optional(),
  avatarUrl: z.url("Invalid URL").optional(),
});

export type UpdateProfileInput = z.infer<typeof updateProfileSchema>;
export type ChangePasswordInput = z.infer<typeof changePasswordSchema>;
export type UpdateUserInput = z.infer<typeof updateUserSchema>;
