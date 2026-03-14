"use client";

import { useState, useEffect } from "react";
import { useForm, useWatch } from "react-hook-form";
import { createZodResolver } from "@/lib/form-resolver";
import { transferSchema, type TransferInput } from "@/lib/validations/transfer";
import { getSenderBalance } from "@/actions/transfer.actions";
import type { Recipient } from "@/actions/transfer.actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { formatCurrency } from "@/lib/format";
import { cn } from "@/lib/utils";

interface TransferFormProps {
  senderId: string;
  recipient: Recipient;
  onNext: (data: { amount: number; note?: string }) => void;
  onBack: () => void;
}

export function TransferForm({
  senderId,
  recipient,
  onNext,
  onBack,
}: TransferFormProps) {
  const [balance, setBalance] = useState<number | null>(null);

  const {
    register,
    handleSubmit,
    control,
    setError,
    formState: { errors },
  } = useForm<TransferInput>({
    resolver: createZodResolver(transferSchema),
    defaultValues: {
      senderId,
      receiverId: recipient.id,
      amount: 0,
      currency: "USD",
      note: "",
    },
  });

  const amount = useWatch({ control, name: "amount", defaultValue: 0 });

  useEffect(() => {
    let cancelled = false;
    getSenderBalance(senderId).then((result) => {
      if (cancelled) return;
      if ("data" in result) setBalance(result.data);
    });
    return () => {
      cancelled = true;
    };
  }, [senderId]);

  const onSubmit = (data: TransferInput) => {
    const numAmount = Number(data.amount);
    if (balance != null && numAmount > balance) {
      setError("amount", { message: "Amount cannot exceed your balance" });
      return;
    }
    onNext({
      amount: numAmount,
      note: data.note?.trim() || undefined,
    });
  };

  const numAmount = typeof amount === "string" ? parseFloat(amount) || 0 : Number(amount);
  const exceedsBalance = balance != null && numAmount > balance;

  return (
    <Card>
      <CardHeader>
        <CardTitle>Amount & note</CardTitle>
        <p className="text-sm text-muted-foreground">
          Sending to {recipient.firstName} {recipient.lastName}
        </p>
      </CardHeader>
      <CardContent className="space-y-4">
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <input type="hidden" {...register("senderId")} />
          <input type="hidden" {...register("receiverId")} />
          <input type="hidden" {...register("currency")} />

          <div className="space-y-2">
            <Label htmlFor="amount">Amount (USD)</Label>
            <Input
              id="amount"
              type="number"
              step="0.01"
              min="0"
              placeholder="0.00"
              {...register("amount", { valueAsNumber: true })}
              className={cn(
                (errors.amount || exceedsBalance) && "border-destructive"
              )}
            />
            {balance != null && (
              <p className="text-xs text-muted-foreground">
                Available: {formatCurrency(balance, "USD")}
              </p>
            )}
            {errors.amount && (
              <p className="text-xs text-destructive">{errors.amount.message}</p>
            )}
            {exceedsBalance && !errors.amount && (
              <p className="text-xs text-destructive">
                Amount cannot exceed your balance
              </p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="note">Note (optional, max 100 characters)</Label>
            <textarea
              id="note"
              maxLength={100}
              rows={2}
              placeholder="What's this for?"
              {...register("note")}
              className="w-full rounded-lg border border-input bg-transparent px-2.5 py-1.5 text-sm outline-none placeholder:text-muted-foreground focus-visible:ring-2 focus-visible:ring-ring"
            />
            {errors.note && (
              <p className="text-xs text-destructive">{errors.note.message}</p>
            )}
          </div>

          <div className="flex gap-2">
            <Button type="button" variant="outline" onClick={onBack}>
              Back
            </Button>
            <Button type="submit">Review Transfer</Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
