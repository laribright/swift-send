import { Suspense } from "react";
import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { getTransactions } from "@/actions/transaction.actions";
import { TransactionFilterBar } from "@/components/shared/transaction-filter-bar";
import { TransactionTable } from "@/components/shared/transaction-table";
import { TransactionsSkeleton } from "@/components/shared/transactions-skeleton";

type SearchParams = { [key: string]: string | string[] | undefined };

interface TransactionsPageProps {
  searchParams: Promise<SearchParams> | SearchParams;
}

export default async function TransactionsPage({
  searchParams,
}: TransactionsPageProps) {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/sign-in");
  }

  const params =
    searchParams instanceof Promise ? await searchParams : searchParams;
  const type = typeof params.type === "string" ? params.type : undefined;
  const search = typeof params.search === "string" ? params.search : undefined;
  const dateFrom =
    typeof params.dateFrom === "string" ? params.dateFrom : undefined;
  const dateTo =
    typeof params.dateTo === "string" ? params.dateTo : undefined;
  const pageParam = params.page;
  const page =
    typeof pageParam === "string"
      ? parseInt(pageParam, 10)
      : Array.isArray(pageParam)
        ? parseInt(pageParam[0], 10)
        : 1;

  const { transactions, totalCount, totalPages } = await getTransactions({
    userId: user.id,
    type: type as "all" | "DEBIT" | "CREDIT" ?? "all",
    search,
    dateFrom,
    dateTo,
    page: Number.isNaN(page) || page < 1 ? 1 : page,
  });

  const currentPage = Number.isNaN(page) || page < 1 ? 1 : page;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">
          Transaction History
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Showing {totalCount} transaction{totalCount === 1 ? "" : "s"}
        </p>
      </div>

      <TransactionFilterBar
        key={`${type ?? "all"}-${search ?? ""}-${dateFrom ?? ""}-${dateTo ?? ""}`}
      />

      <Suspense fallback={<TransactionsSkeleton />}>
        <TransactionTable
          transactions={transactions}
          totalPages={totalPages}
          currentPage={currentPage}
        />
      </Suspense>
    </div>
  );
}
