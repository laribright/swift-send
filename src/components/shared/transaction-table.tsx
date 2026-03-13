"use client";

import { useRouter, usePathname, useSearchParams } from "next/navigation";
import { ChevronLeftIcon, ChevronRightIcon, ReceiptIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { TransactionItem } from "@/components/shared/transaction-item";
import type { PaginatedTransaction } from "@/actions/transaction.actions";

interface TransactionTableProps {
  transactions: PaginatedTransaction[];
  totalPages: number;
  currentPage: number;
}

export function TransactionTable({
  transactions,
  totalPages,
  currentPage,
}: TransactionTableProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const setPage = (page: number) => {
    const sp = new URLSearchParams(searchParams.toString());
    if (page <= 1) {
      sp.delete("page");
    } else {
      sp.set("page", String(page));
    }
    const q = sp.toString();
    router.push(q ? `${pathname}?${q}` : pathname);
  };

  if (transactions.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center rounded-lg border border-dashed py-16 text-center">
        <ReceiptIcon className="size-12 text-muted-foreground" />
        <p className="mt-4 font-medium">No transactions found</p>
        <p className="mt-1 text-sm text-muted-foreground">
          Try adjusting your filters
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="divide-y rounded-lg border">
        {transactions.map((transaction) => (
          <TransactionItem
            key={transaction.id}
            transaction={transaction}
          />
        ))}
      </div>

      {totalPages > 1 && (
        <div className="flex items-center justify-between">
          <p className="text-sm text-muted-foreground">
            Page {currentPage} of {totalPages}
          </p>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setPage(currentPage - 1)}
              disabled={currentPage <= 1}
            >
              <ChevronLeftIcon className="size-4" />
              Previous
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setPage(currentPage + 1)}
              disabled={currentPage >= totalPages}
            >
              Next
              <ChevronRightIcon className="size-4" />
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
