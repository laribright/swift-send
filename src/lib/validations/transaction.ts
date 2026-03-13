import { z } from "zod/v4";

export const transactionFilterSchema = z.object({
  type: z.enum(["all", "DEBIT", "CREDIT"]).default("all"),
  search: z.string().optional(),
  dateFrom: z.string().optional(),
  dateTo: z.string().optional(),
  page: z.coerce.number().default(1),
});

export type TransactionFilterInput = z.infer<typeof transactionFilterSchema>;

export const createTransactionSchema = z.object({
  accountId: z.uuid("Invalid account ID"),
  amount: z.number().positive("Amount must be positive"),
  type: z.enum(["DEBIT", "CREDIT"]),
  description: z.string().optional(),
  category: z.string().optional(),
});

export type CreateTransactionInput = z.infer<typeof createTransactionSchema>;
