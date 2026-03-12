import { z } from "zod/v4";

export const createTransferSchema = z.object({
  receiverId: z.uuid("Invalid receiver ID"),
  amount: z.number().positive("Amount must be positive"),
  currency: z.string().default("USD"),
  note: z.string().optional(),
});

export type CreateTransferInput = z.infer<typeof createTransferSchema>;
