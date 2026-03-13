import { Skeleton } from "@/components/ui/skeleton";
import { TransactionsSkeleton } from "@/components/shared/transactions-skeleton";

export default function TransactionsLoading() {
  return (
    <div className="space-y-6">
      <div>
        <Skeleton className="h-8 w-48" />
        <Skeleton className="mt-1 h-4 w-32" />
      </div>
      <TransactionsSkeleton />
    </div>
  );
}
