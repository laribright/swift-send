import { formatCurrency } from "@/lib/format";
import { PlaidLinkButton } from "@/components/shared/plaid-link-button";
import type { LinkedAccount } from "@/actions/plaid.actions";
import { Badge } from "@/components/ui/badge";

interface LinkedAccountStripProps {
  linkedAccounts: LinkedAccount[];
  userId: string;
}

export function LinkedAccountStrip({
  linkedAccounts,
  userId,
}: LinkedAccountStripProps) {
  if (linkedAccounts.length === 0) {
    return (
      <div className="rounded-lg border border-dashed p-6 text-center">
        <p className="text-sm text-muted-foreground">
          No linked accounts yet.
        </p>
        <PlaidLinkButton userId={userId} variant="outline" size="sm" className="mt-3" />
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <h2 className="text-lg font-semibold">Linked Accounts</h2>
      <div className="flex gap-3 overflow-x-auto pb-2">
        {linkedAccounts.map((account) => (
          <div
            key={account.id}
            className="min-w-[220px] shrink-0 rounded-lg border bg-card p-4"
          >
            <p className="truncate text-xs font-medium uppercase text-muted-foreground">
              {account.institutionName ?? "Bank"}
            </p>
            <p className="mt-1 truncate text-sm font-medium">{account.name}</p>
            <p className="text-xs text-muted-foreground">
              •••• {account.mask ?? "****"}
            </p>
            <p className="mt-2 text-lg font-semibold tabular-nums">
              {formatCurrency(account.balance, account.currency)}
            </p>
            <Badge variant="secondary" className="mt-2 text-xs">
              {account.type}
            </Badge>
          </div>
        ))}
        <div className="flex min-w-[220px] shrink-0 items-center justify-center rounded-lg border border-dashed">
          <PlaidLinkButton userId={userId} variant="ghost" size="sm">
            Add another
          </PlaidLinkButton>
        </div>
      </div>
    </div>
  );
}
