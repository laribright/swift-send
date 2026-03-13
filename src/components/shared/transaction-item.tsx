import {
  CircleDollarSignIcon,
  ShoppingBagIcon,
  UtensilsCrossedIcon,
  HomeIcon,
  CarIcon,
  PlaneIcon,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { formatCurrency } from "@/lib/format";
import { cn } from "@/lib/utils";
import type { RecentTransaction } from "@/actions/account.actions";

function CategoryIcon({
  category,
  className,
}: {
  category: string | null;
  className?: string;
}) {
  const key = category ? category.toLowerCase() : "default";
  switch (key) {
    case "shopping":
      return <ShoppingBagIcon className={className} />;
    case "food":
      return <UtensilsCrossedIcon className={className} />;
    case "travel":
      return <PlaneIcon className={className} />;
    case "transport":
      return <CarIcon className={className} />;
    case "housing":
      return <HomeIcon className={className} />;
    default:
      return <CircleDollarSignIcon className={className} />;
  }
}

function formatDate(date: Date): string {
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  }).format(date);
}

const statusVariant = {
  PENDING: "secondary" as const,
  COMPLETED: "default" as const,
  FAILED: "destructive" as const,
};

interface TransactionItemProps {
  transaction: RecentTransaction;
}

export function TransactionItem({ transaction }: TransactionItemProps) {
  const isDebit = transaction.type === "DEBIT";

  return (
    <div className="flex items-center gap-4 py-3">
      <div className="flex size-9 shrink-0 items-center justify-center rounded-full bg-muted">
        <CategoryIcon
          category={transaction.category}
          className="size-4 text-muted-foreground"
        />
      </div>
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-medium">
          {transaction.description ?? "Transaction"}
        </p>
        <p className="text-xs text-muted-foreground">
          {transaction.account.name} · {formatDate(transaction.date)}
        </p>
      </div>
      <div className="flex shrink-0 items-center gap-2">
        <p
          className={cn(
            "text-sm font-medium tabular-nums",
            isDebit ? "text-destructive" : "text-emerald-600 dark:text-emerald-400"
          )}
        >
          {isDebit ? "-" : "+"}
          {formatCurrency(transaction.amount)}
        </p>
        <Badge variant={statusVariant[transaction.status]} className="text-xs">
          {transaction.status}
        </Badge>
      </div>
    </div>
  );
}
