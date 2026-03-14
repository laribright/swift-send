"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { createTransfer } from "@/actions/transfer.actions";
import type { Recipient } from "@/actions/transfer.actions";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { formatCurrency } from "@/lib/format";
import { Loader2Icon } from "lucide-react";
import { toast } from "sonner";

export type Sender = {
  id: string;
  firstName: string;
  lastName: string;
  avatarUrl: string | null;
};

interface TransferConfirmProps {
  sender: Sender;
  recipient: Recipient;
  transferData: { amount: number; note?: string };
  onBack: () => void;
}

export function TransferConfirm({
  sender,
  recipient,
  transferData,
  onBack,
}: TransferConfirmProps) {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleConfirm = async () => {
    setIsSubmitting(true);
    try {
      const result = await createTransfer({
        senderId: sender.id,
        receiverId: recipient.id,
        amount: transferData.amount,
        currency: "USD",
        note: transferData.note,
      });

      if ("error" in result) {
        toast.error(result.error);
        return;
      }

      toast.success("Transfer successful!");
      router.push(`/transfer/success?id=${result.data.transferId}`);
    } catch {
      toast.error("Something went wrong");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Confirm transfer</CardTitle>
        <p className="text-sm text-muted-foreground">
          Review the details below before sending.
        </p>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="space-y-3 rounded-lg border bg-muted/30 p-4">
          <div className="flex items-center gap-3">
            <div className="flex size-10 shrink-0 items-center justify-center overflow-hidden rounded-full bg-muted text-sm font-medium text-muted-foreground">
              {sender.avatarUrl ? (
                <img
                  src={sender.avatarUrl}
                  alt=""
                  className="size-10 rounded-full object-cover"
                />
              ) : (
                <span>
                  {sender.firstName[0]}
                  {sender.lastName[0]}
                </span>
              )}
            </div>
            <div>
              <p className="text-xs text-muted-foreground">From</p>
              <p className="font-medium">
                {sender.firstName} {sender.lastName}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <div className="flex size-10 shrink-0 items-center justify-center overflow-hidden rounded-full bg-muted text-sm font-medium text-muted-foreground">
              {recipient.avatarUrl ? (
                <img
                  src={recipient.avatarUrl}
                  alt=""
                  className="size-10 rounded-full object-cover"
                />
              ) : (
                <span>
                  {recipient.firstName[0]}
                  {recipient.lastName[0]}
                </span>
              )}
            </div>
            <div>
              <p className="text-xs text-muted-foreground">To</p>
              <p className="font-medium">
                {recipient.firstName} {recipient.lastName}
              </p>
            </div>
          </div>
          <div className="border-t pt-3">
            <p className="text-xs text-muted-foreground">Amount</p>
            <p className="text-xl font-semibold tabular-nums">
              {formatCurrency(transferData.amount, "USD")}
            </p>
          </div>
          {transferData.note && (
            <div className="border-t pt-3">
              <p className="text-xs text-muted-foreground">Note</p>
              <p className="text-sm">{transferData.note}</p>
            </div>
          )}
        </div>

        <div className="flex gap-2">
          <Button
            type="button"
            variant="outline"
            onClick={onBack}
            disabled={isSubmitting}
          >
            Back
          </Button>
          <Button onClick={handleConfirm} disabled={isSubmitting}>
            {isSubmitting ? (
              <Loader2Icon className="size-4 animate-spin" />
            ) : (
              "Confirm & Send"
            )}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
