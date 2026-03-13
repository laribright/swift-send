"use server";

import { prisma } from "@/lib/prisma";

export async function getAccountsWithBalance(userId: string) {
  const accounts = await prisma.account.findMany({
    where: { userId },
    select: {
      id: true,
      name: true,
      type: true,
      balance: true,
      currency: true,
      mask: true,
    },
  });

  return accounts.map((a) => ({
    id: a.id,
    name: a.name,
    type: a.type,
    balance: Number(a.balance),
    currency: a.currency,
    mask: a.mask,
  }));
}

export type AccountWithBalance = Awaited<
  ReturnType<typeof getAccountsWithBalance>
>[number];

export async function getDashboardStats(userId: string) {
  const [debitSum, creditSum, balanceSum] = await Promise.all([
    prisma.transaction.aggregate({
      where: {
        account: { userId },
        type: "DEBIT",
      },
      _sum: { amount: true },
    }),
    prisma.transaction.aggregate({
      where: {
        account: { userId },
        type: "CREDIT",
      },
      _sum: { amount: true },
    }),
    prisma.account.aggregate({
      where: { userId },
      _sum: { balance: true },
    }),
  ]);

  return {
    totalSent: Number(debitSum._sum.amount ?? 0),
    totalReceived: Number(creditSum._sum.amount ?? 0),
    totalBalance: Number(balanceSum._sum.balance ?? 0),
  };
}

export type DashboardStats = Awaited<ReturnType<typeof getDashboardStats>>;

export async function getRecentTransactions(userId: string, limit = 5) {
  const transactions = await prisma.transaction.findMany({
    where: { account: { userId } },
    orderBy: { date: "desc" },
    take: limit,
    include: {
      account: { select: { name: true } },
    },
  });

  return transactions.map((t) => ({
    id: t.id,
    amount: Number(t.amount),
    type: t.type,
    status: t.status,
    description: t.description,
    category: t.category,
    date: t.date,
    account: { name: t.account.name },
  }));
}

export type RecentTransaction = Awaited<
  ReturnType<typeof getRecentTransactions>
>[number];
