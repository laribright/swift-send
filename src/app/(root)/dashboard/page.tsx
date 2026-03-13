import {
  getDashboardStats,
  getAccountsWithBalance,
  getRecentTransactions,
} from "@/actions/account.actions";
import { getCurrentUser } from "@/actions/user.actions";
import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { ArrowDownLeftIcon, ArrowUpRightIcon } from "lucide-react";
import { BalanceCard } from "@/components/shared/balance-card";
import { StatCard } from "@/components/shared/stat-card";
import { RecentTransactions } from "@/components/shared/recent-transactions";
import { LinkedAccountStrip } from "@/components/shared/linked-account-strip";

function getGreeting(): string {
  const hour = new Date().getHours();
  if (hour < 12) return "Good morning";
  if (hour < 18) return "Good afternoon";
  return "Good evening";
}

export default async function DashboardPage() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/sign-in");
  }

  const [stats, accounts, transactions, currentUser] = await Promise.all([
    getDashboardStats(user.id),
    getAccountsWithBalance(user.id),
    getRecentTransactions(user.id),
    getCurrentUser(user.id),
  ]);

  const firstName = currentUser?.firstName ?? "there";

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">
          {getGreeting()}, {firstName} 👋
        </h1>
        <p className="text-muted-foreground">
          Here&apos;s an overview of your account.
        </p>
      </div>

      <BalanceCard
        totalBalance={stats.totalBalance}
        currency="USD"
      />

      <div className="grid gap-4 sm:grid-cols-2">
        <StatCard
          label="Total Sent"
          amount={stats.totalSent}
          icon={<ArrowUpRightIcon className="size-5" />}
          color="destructive"
        />
        <StatCard
          label="Total Received"
          amount={stats.totalReceived}
          icon={<ArrowDownLeftIcon className="size-5" />}
          color="success"
        />
      </div>

      <RecentTransactions transactions={transactions} />

      <LinkedAccountStrip accounts={accounts} />
    </div>
  );
}
