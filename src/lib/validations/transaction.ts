import { z } from "zod/v4";

export const createTransactionSchema = z.object({
  accountId: z.uuid("Invalid account ID"),
  amount: z.number().positive("Amount must be positive"),
  type: z.enum(["DEBIT", "CREDIT"]),
  description: z.string().optional(),
  category: z.string().optional(),
});

export type CreateTransactionInput = z.infer<typeof createTransactionSchema>;
