"use client";

import { useState } from "react";
import {
  AlertDialogRoot,
  AlertDialogTrigger,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogCancel,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { deleteAccount } from "@/actions/user.actions";
import { useServerAction } from "@/hooks/use-server-action";
import { Loader2Icon, AlertTriangleIcon } from "lucide-react";

const CONFIRM_TEXT = "DELETE";

interface DeleteAccountDialogProps {
  userId: string;
}

export function DeleteAccountDialog({ userId }: DeleteAccountDialogProps) {
  const [confirmValue, setConfirmValue] = useState("");
  const [open, setOpen] = useState(false);

  const { execute, isLoading } = useServerAction(deleteAccount);

  const canConfirm =
    confirmValue === CONFIRM_TEXT && !isLoading;

  const handleDelete = async () => {
    if (!canConfirm) return;
    await execute({ userId });
    setOpen(false);
    setConfirmValue("");
  };

  return (
    <AlertDialogRoot open={open} onOpenChange={setOpen}>
      <AlertDialogTrigger asChild>
        <Button variant="destructive">Delete Account</Button>
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <div className="flex items-center gap-3">
            <div className="flex size-10 shrink-0 items-center justify-center rounded-full bg-destructive/10 text-destructive">
              <AlertTriangleIcon className="size-5" />
            </div>
            <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
          </div>
          <AlertDialogDescription>
            This will permanently delete your account, all transactions, and
            transfer history. This cannot be undone.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <div className="space-y-2">
          <label htmlFor="delete-confirm" className="text-sm font-medium">
            Type <strong>{CONFIRM_TEXT}</strong> to confirm
          </label>
          <Input
            id="delete-confirm"
            type="text"
            value={confirmValue}
            onChange={(e) => setConfirmValue(e.target.value)}
            placeholder={CONFIRM_TEXT}
            className="font-mono"
            disabled={isLoading}
          />
        </div>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={isLoading}>Cancel</AlertDialogCancel>
          <Button
            variant="destructive"
            onClick={handleDelete}
            disabled={!canConfirm}
          >
            {isLoading ? (
              <Loader2Icon className="size-4 animate-spin" />
            ) : (
              "Delete My Account"
            )}
          </Button>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialogRoot>
  );
}
