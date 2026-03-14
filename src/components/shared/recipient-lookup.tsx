"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { createZodResolver } from "@/lib/form-resolver";
import { recipientSchema, type RecipientInput } from "@/lib/validations/transfer";
import { lookupRecipient, type Recipient } from "@/actions/transfer.actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader2Icon, UserIcon } from "lucide-react";
import { cn } from "@/lib/utils";

interface RecipientLookupProps {
  senderEmail: string;
  onRecipientFound: (recipient: Recipient) => void;
}

export function RecipientLookup({
  senderEmail,
  onRecipientFound,
}: RecipientLookupProps) {
  const [recipient, setRecipient] = useState<Recipient | null>(null);
  const [lookupError, setLookupError] = useState<string | null>(null);
  const [isLookingUp, setIsLookingUp] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<RecipientInput>({
    resolver: createZodResolver(recipientSchema),
    defaultValues: { email: "" },
  });

  const onSubmit = async (data: RecipientInput) => {
    if (data.email.toLowerCase() === senderEmail.toLowerCase()) {
      setLookupError("You cannot send money to yourself");
      setRecipient(null);
      return;
    }
    setLookupError(null);
    setRecipient(null);
    setIsLookingUp(true);
    const result = await lookupRecipient({ email: data.email });
    setIsLookingUp(false);
    if ("error" in result) {
      setLookupError(result.error);
      return;
    }
    setRecipient(result.data);
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Find recipient</CardTitle>
        <p className="text-sm text-muted-foreground">
          Enter the email of the person you want to send money to.
        </p>
      </CardHeader>
      <CardContent className="space-y-4">
        <form onSubmit={handleSubmit(onSubmit)} className="flex gap-2">
          <div className="min-w-0 flex-1 space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              type="email"
              placeholder="colleague@example.com"
              {...register("email")}
              className={cn(errors.email && "border-destructive")}
            />
            {errors.email && (
              <p className="text-xs text-destructive">{errors.email.message}</p>
            )}
          </div>
          <div className="flex items-end">
            <Button type="submit" disabled={isLookingUp}>
              {isLookingUp ? (
                <Loader2Icon className="size-4 animate-spin" />
              ) : (
                "Find User"
              )}
            </Button>
          </div>
        </form>

        {lookupError && (
          <p className="text-sm text-destructive">{lookupError}</p>
        )}

        {recipient && (
          <div className="rounded-lg border bg-muted/30 p-4">
            <div className="flex items-center gap-3">
              <div className="flex size-10 shrink-0 items-center justify-center overflow-hidden rounded-full bg-muted text-sm font-medium text-muted-foreground">
                {recipient.avatarUrl ? (
                  <img
                    src={recipient.avatarUrl}
                    alt=""
                    className="size-10 rounded-full object-cover"
                  />
                ) : (
                  <UserIcon className="size-5" />
                )}
              </div>
              <div className="min-w-0 flex-1">
                <p className="font-medium">
                  {recipient.firstName} {recipient.lastName}
                </p>
                <p className="text-sm text-muted-foreground">
                  Recipient found — you can continue
                </p>
              </div>
              <Button onClick={() => onRecipientFound(recipient)}>
                Continue
              </Button>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
