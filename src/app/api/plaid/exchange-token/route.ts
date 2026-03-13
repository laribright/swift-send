import { NextRequest, NextResponse } from "next/server";
import { CountryCode } from "plaid";
import { plaidClient } from "@/lib/plaid";
import { prisma } from "@/lib/prisma";
import { exchangeTokenSchema } from "@/lib/validations/plaid";
import { AccountType as PrismaAccountType } from "@/generated/prisma/enums";

function mapPlaidToAccountType(
  type: string,
  subtype: string | null
): PrismaAccountType {
  if (type === "depository" && subtype?.toLowerCase() === "savings") {
    return PrismaAccountType.SAVINGS;
  }
  return PrismaAccountType.CHECKING;
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const parsed = exchangeTokenSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: "Invalid request body" },
        { status: 400 }
      );
    }

    const { publicToken, userId } = parsed.data;

    const exchangeResponse = await plaidClient.itemPublicTokenExchange({
      public_token: publicToken,
    });

    const accessToken = exchangeResponse.data.access_token;
    const itemId = exchangeResponse.data.item_id;

    const itemResponse = await plaidClient.itemGet({
      access_token: accessToken,
    });

    const institutionId = itemResponse.data.item.institution_id ?? null;

    let institutionName: string | null = null;
    if (institutionId) {
      try {
        const instResponse = await plaidClient.institutionsGetById({
          institution_id: institutionId,
          country_codes: [CountryCode.Us],
        });
        institutionName = instResponse.data.institution.name ?? null;
      } catch {
        institutionName = null;
      }
    }

    const accountsResponse = await plaidClient.accountsGet({
      access_token: accessToken,
    });

    await prisma.plaidItem.create({
      data: {
        userId,
        accessToken,
        itemId,
        institutionId,
        institutionName,
      },
    });

    for (const account of accountsResponse.data.accounts) {
      await prisma.account.create({
        data: {
          userId,
          name: account.name,
          type: mapPlaidToAccountType(account.type, account.subtype),
          balance: account.balances.current ?? 0,
          currency: "USD",
          mask: account.mask ?? undefined,
        },
      });
    }

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("Plaid exchange token error:", err);
    const message =
      err && typeof err === "object" && "response" in err
        ? String(
            (err as { response?: { data?: { error_message?: string } } })
              .response?.data?.error_message ?? "Failed to link account"
          )
        : "Failed to link account";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
