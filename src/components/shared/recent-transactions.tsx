import Link from "next/link";
import { TransactionItem } from "@/components/shared/transaction-item";
import type { RecentTransaction } from "@/actions/account.actions";

interface RecentTransactionsProps {
  transactions: RecentTransaction[];
}

export function RecentTransactions({ transactions }: RecentTransactionsProps) {
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold">Recent Transactions</h2>
        <Link
          href="/transactions"
          className="text-sm font-medium text-primary hover:underline"
        >
          View all
        </Link>
      </div>

      {transactions.length === 0 ? (
        <div className="rounded-lg border border-dashed py-12 text-center">
          <p className="text-sm text-muted-foreground">
            No transactions yet. Your recent activity will appear here.
          </p>
        </div>
      ) : (
        <div className="divide-y rounded-lg border">
          {transactions.map((transaction) => (
            <TransactionItem
              key={transaction.id}
              transaction={transaction}
            />
          ))}
        </div>
      )}
    </div>
  );
}
