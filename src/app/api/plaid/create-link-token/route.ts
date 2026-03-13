import { NextRequest, NextResponse } from "next/server";
import { plaidClient } from "@/lib/plaid";
import { Products, CountryCode } from "plaid";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const userId = typeof body.userId === "string" ? body.userId : null;

    if (!userId) {
      return NextResponse.json(
        { error: "userId is required" },
        { status: 400 }
      );
    }

    const response = await plaidClient.linkTokenCreate({
      user: { client_user_id: userId },
      client_name: "SwiftSend",
      products: [Products.Auth, Products.Transactions],
      language: "en",
      country_codes: [CountryCode.Us],
    });

    return NextResponse.json({
      link_token: response.data.link_token,
    });
  } catch (err) {
    console.error("Plaid createLinkToken error:", err);
    const message =
      err && typeof err === "object" && "response" in err
        ? String((err as { response?: { data?: { error_message?: string } } }).response?.data?.error_message ?? "Failed to create link token")
        : "Failed to create link token";
    return NextResponse.json(
      { error: message },
      { status: 500 }
    );
  }
}
