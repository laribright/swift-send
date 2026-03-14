"use server";

import { prisma } from "@/lib/prisma";
import { stripe } from "@/lib/stripe";
import { recipientSchema, transferSchema } from "@/lib/validations/transfer";

export type Recipient = {
  id: string;
  firstName: string;
  lastName: string;
  avatarUrl: string | null;
};

export async function lookupRecipient(input: { email: string }): Promise<
  | { data: Recipient }
  | { error: string }
> {
  const parsed = recipientSchema.safeParse(input);
  if (!parsed.success) {
    return { error: "Invalid email" };
  }

  const user = await prisma.user.findUnique({
    where: { email: parsed.data.email },
    select: { id: true, firstName: true, lastName: true, avatarUrl: true },
  });

  if (!user) {
    return { error: "No SwiftSend user found with that email" };
  }

  return {
    data: {
      id: user.id,
      firstName: user.firstName,
      lastName: user.lastName,
      avatarUrl: user.avatarUrl,
    },
  };
}

export async function getSenderBalance(senderId: string): Promise<
  | { data: number }
  | { error: string }
> {
  const account = await prisma.account.findFirst({
    where: { userId: senderId },
    orderBy: { balance: "desc" },
    select: { balance: true },
  });

  if (!account) {
    return { data: 0 };
  }

  return { data: Number(account.balance) };
}

export async function createTransfer(input: {
  senderId: string;
  receiverId: string;
  amount: number;
  currency?: string;
  note?: string;
}): Promise<
  | { success: true; data: { transferId: string } }
  | { error: string }
> {
  const parsed = transferSchema.safeParse({
    senderId: input.senderId,
    receiverId: input.receiverId,
    amount: input.amount,
    currency: input.currency ?? "USD",
    note: input.note,
  });

  if (!parsed.success) {
    return { error: "Invalid transfer data" };
  }

  const { senderId, receiverId, amount, currency, note } = parsed.data;

  if (senderId === receiverId) {
    return { error: "You cannot send money to yourself" };
  }

  const senderAccount = await prisma.account.findFirst({
    where: { userId: senderId },
    orderBy: { balance: "desc" },
  });

  if (!senderAccount || Number(senderAccount.balance) < amount) {
    return { error: "Insufficient funds" };
  }

  const receiverAccount = await prisma.account.findFirst({
    where: { userId: receiverId },
  });

  if (!receiverAccount) {
    return { error: "Receiver account not found" };
  }

  let paymentIntentId: string;

  try {
    const charge = await stripe.charges.create({
      amount: Math.round(amount * 100),
      currency: currency.toLowerCase(),
      source: "tok_visa",
      description: `SwiftSend transfer from ${senderId} to ${receiverId}`,
      metadata: { senderId, receiverId },
    });
    paymentIntentId = charge.id;
  } catch (stripeErr) {
    console.error("Stripe Charge error:", stripeErr);
    return { error: "Payment could not be initiated" };
  }

  const transferId = crypto.randomUUID();

  try {
    await prisma.$transaction([
      prisma.account.update({
        where: { id: senderAccount.id },
        data: { balance: { decrement: amount } },
      }),
      prisma.account.update({
        where: { id: receiverAccount.id },
        data: { balance: { increment: amount } },
      }),
      prisma.transfer.create({
        data: {
          id: transferId,
          senderId,
          receiverId,
          amount,
          currency,
          note: note ?? null,
          status: "COMPLETED",
          stripePaymentId: paymentIntentId, // charge.id
        },
      }),
      prisma.transaction.create({
        data: {
          accountId: senderAccount.id,
          amount,
          type: "DEBIT",
          status: "COMPLETED",
          description: `Transfer to ${receiverId}`,
          transferId,
        },
      }),
      prisma.transaction.create({
        data: {
          accountId: receiverAccount.id,
          amount,
          type: "CREDIT",
          status: "COMPLETED",
          description: `Transfer from ${senderId}`,
          transferId,
        },
      }),
    ]);
  } catch (prismaErr) {
    console.error("Prisma transaction error. stripePaymentId:", paymentIntentId, prismaErr);
    return { error: "Transfer failed. Please try again." };
  }

  return { success: true, data: { transferId } };
}

export type TransferWithDetails = {
  id: string;
  amount: number;
  currency: string;
  note: string | null;
  status: string;
  createdAt: Date;
  sender: { id: string; firstName: string; lastName: string; avatarUrl: string | null };
  receiver: { id: string; firstName: string; lastName: string; avatarUrl: string | null };
  transactions: Array<{ id: string; amount: number; type: string; status: string }>;
};

export async function getTransferById(transferId: string): Promise<
  | { data: TransferWithDetails }
  | { error: string }
> {
  const transfer = await prisma.transfer.findUnique({
    where: { id: transferId },
    include: {
      sender: {
        select: { id: true, firstName: true, lastName: true, avatarUrl: true },
      },
      receiver: {
        select: { id: true, firstName: true, lastName: true, avatarUrl: true },
      },
      transactions: {
        select: { id: true, amount: true, type: true, status: true },
      },
    },
  });

  if (!transfer) {
    return { error: "Transfer not found" };
  }

  return {
    data: {
      id: transfer.id,
      amount: Number(transfer.amount),
      currency: transfer.currency,
      note: transfer.note,
      status: transfer.status,
      createdAt: transfer.createdAt,
      sender: transfer.sender,
      receiver: transfer.receiver,
      transactions: transfer.transactions.map((t) => ({
        id: t.id,
        amount: Number(t.amount),
        type: t.type,
        status: t.status,
      })),
    },
  };
}
