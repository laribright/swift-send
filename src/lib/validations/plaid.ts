import { z } from "zod/v4";

export const exchangeTokenSchema = z.object({
  publicToken: z.string().min(1, "Public token is required"),
  userId: z.string().uuid("Invalid user ID"),
});

export type ExchangeTokenInput = z.infer<typeof exchangeTokenSchema>;
