"use client";

import { useState } from "react";
import type { Recipient } from "@/actions/transfer.actions";
import type { Sender } from "@/components/shared/transfer-confirm";
import { RecipientLookup } from "@/components/shared/recipient-lookup";
import { TransferForm } from "@/components/shared/transfer-form";
import { TransferConfirm } from "@/components/shared/transfer-confirm";

interface TransferFlowProps {
  senderId: string;
  senderEmail: string;
  sender: Sender;
}

export function TransferFlow({
  senderId,
  senderEmail,
  sender,
}: TransferFlowProps) {
  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [recipient, setRecipient] = useState<Recipient | null>(null);
  const [transferData, setTransferData] = useState<{
    amount: number;
    note?: string;
  } | null>(null);

  return (
    <div className="mx-auto max-w-lg space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Send money</h1>
        <p className="text-muted-foreground">
          {step === 1 && "Find your recipient by email."}
          {step === 2 && "Enter the amount and an optional note."}
          {step === 3 && "Confirm and send."}
        </p>
      </div>

      {step === 1 && (
        <RecipientLookup
          senderEmail={senderEmail}
          onRecipientFound={(r) => {
            setRecipient(r);
            setStep(2);
          }}
        />
      )}

      {step === 2 && recipient && (
        <TransferForm
          senderId={senderId}
          recipient={recipient}
          onNext={(data) => {
            setTransferData(data);
            setStep(3);
          }}
          onBack={() => setStep(1)}
        />
      )}

      {step === 3 && recipient && transferData && (
        <TransferConfirm
          sender={sender}
          recipient={recipient}
          transferData={transferData}
          onBack={() => setStep(2)}
        />
      )}
    </div>
  );
}
