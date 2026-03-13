import Link from "next/link";
import { formatCurrency } from "@/lib/format";
import { Button } from "@/components/ui/button";
import type { AccountWithBalance } from "@/actions/account.actions";

interface LinkedAccountStripProps {
  accounts: AccountWithBalance[];
}

export function LinkedAccountStrip({ accounts }: LinkedAccountStripProps) {
  if (accounts.length === 0) {
    return (
      <div className="rounded-lg border border-dashed p-6 text-center">
        <p className="text-sm text-muted-foreground">
          No linked accounts yet.
        </p>
        <Button variant="outline" size="sm" className="mt-3" asChild>
          <Link href="/link-account">Link Account</Link>
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <h2 className="text-lg font-semibold">Linked Accounts</h2>
      <div className="flex gap-3 overflow-x-auto pb-2">
        {accounts.map((account) => (
          <div
            key={account.id}
            className="min-w-[200px] shrink-0 rounded-lg border bg-card p-4"
          >
            <p className="truncate text-sm font-medium">{account.name}</p>
            <p className="text-xs text-muted-foreground">
              •••• {account.mask ?? "****"}
            </p>
            <p className="mt-2 text-lg font-semibold tabular-nums">
              {formatCurrency(account.balance, account.currency)}
            </p>
          </div>
        ))}
        <div className="flex min-w-[200px] shrink-0 items-center justify-center rounded-lg border border-dashed">
          <Button variant="ghost" size="sm" asChild>
            <Link href="/link-account">Link Account</Link>
          </Button>
        </div>
      </div>
    </div>
  );
}
