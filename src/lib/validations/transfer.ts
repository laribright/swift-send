import { z } from "zod/v4";

export const recipientSchema = z.object({
  email: z.string().email("Invalid email"),
});

export const transferSchema = z.object({
  senderId: z.string().uuid("Invalid sender ID"),
  receiverId: z.string().uuid("Invalid receiver ID"),
  amount: z.number().positive("Amount must be positive").max(10000),
  currency: z.string().default("USD"),
  note: z.string().max(100).optional(),
});

export const createTransferSchema = z.object({
  receiverId: z.string().uuid("Invalid receiver ID"),
  amount: z.number().positive("Amount must be positive"),
  currency: z.string().default("USD"),
  note: z.string().optional(),
});

export type RecipientInput = z.infer<typeof recipientSchema>;
export type TransferInput = z.infer<typeof transferSchema>;
export type CreateTransferInput = z.infer<typeof createTransferSchema>;
