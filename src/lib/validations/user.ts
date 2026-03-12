import { z } from "zod/v4";

export const updateUserSchema = z.object({
  firstName: z.string().min(1, "First name is required").optional(),
  lastName: z.string().min(1, "Last name is required").optional(),
  avatarUrl: z.url("Invalid URL").optional(),
});

export type UpdateUserInput = z.infer<typeof updateUserSchema>;
