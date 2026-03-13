"use server";

import { plaidClient } from "@/lib/plaid";
import { prisma } from "@/lib/prisma";

export type LinkedAccount = {
  id: string;
  name: string;
  mask: string | null;
  balance: number;
  currency: string;
  institutionName: string | null;
  type: string;
};

export async function getLinkedAccounts(userId: string): Promise<{
  data?: LinkedAccount[];
  error?: string;
}> {
  try {
    const items = await prisma.plaidItem.findMany({
      where: { userId },
      select: { accessToken: true, institutionName: true },
    });

    const results: LinkedAccount[] = [];

    for (const item of items) {
      try {
        const response = await plaidClient.accountsGet({
          access_token: item.accessToken,
        });

        const institutionName = item.institutionName ?? null;

        for (const account of response.data.accounts) {
          const balance = account.balances.current ?? 0;
          const type =
            account.subtype?.replace(/\s+/g, " ").replace(/^./, (c) => c.toUpperCase()) ??
            account.type;

          results.push({
            id: account.account_id,
            name: account.name,
            mask: account.mask ?? null,
            balance,
            currency: "USD",
            institutionName,
            type,
          });
        }
      } catch (itemErr) {
        console.error("Plaid accountsGet error for item:", itemErr);
        // Continue with other items; do not fail the whole list
      }
    }

    return { data: results };
  } catch (err) {
    console.error("getLinkedAccounts error:", err);
    return {
      error: "Failed to load linked accounts",
    };
  }
}
