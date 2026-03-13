"use server";

import { prisma } from "@/lib/prisma";
import {
  transactionFilterSchema,
  type TransactionFilterInput,
} from "@/lib/validations/transaction";

const PAGE_SIZE = 20;

export async function getTransactions(params: TransactionFilterInput & { userId: string }) {
  const parsed = transactionFilterSchema.safeParse({
    type: params.type,
    search: params.search,
    dateFrom: params.dateFrom,
    dateTo: params.dateTo,
    page: params.page,
  });

  if (!parsed.success) {
    return { transactions: [], totalCount: 0, totalPages: 0 };
  }

  const { type, search, dateFrom, dateTo, page } = parsed.data;
  const userId = params.userId;

  const searchNum = search ? parseFloat(search) : NaN;
  const hasAmountSearch = !isNaN(searchNum);

  const where = {
    account: { userId },
    ...(type !== "all" && { type }),
    ...(search && {
      OR: [
        { description: { contains: search, mode: "insensitive" as const } },
        ...(hasAmountSearch ? [{ amount: searchNum }] : []),
      ],
    }),
    ...(dateFrom && { date: { gte: new Date(dateFrom) } }),
    ...(dateTo && { date: { lte: new Date(dateTo) } }),
  };

  const [transactions, totalCount] = await Promise.all([
    prisma.transaction.findMany({
      where,
      orderBy: { date: "desc" },
      skip: (page - 1) * PAGE_SIZE,
      take: PAGE_SIZE,
      include: { account: { select: { name: true } } },
    }),
    prisma.transaction.count({ where }),
  ]);

  const totalPages = Math.ceil(totalCount / PAGE_SIZE) || 1;

  const serialized = transactions.map((t) => ({
    id: t.id,
    amount: Number(t.amount),
    type: t.type,
    status: t.status,
    description: t.description,
    category: t.category,
    date: t.date,
    account: { name: t.account.name },
  }));

  return {
    transactions: serialized,
    totalCount,
    totalPages,
  };
}

export type PaginatedTransaction = Awaited<
  ReturnType<typeof getTransactions>
>["transactions"][number];
