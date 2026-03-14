import { notFound } from "next/navigation";
import Link from "next/link";
import { getTransferById } from "@/actions/transfer.actions";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { formatCurrency } from "@/lib/format";
import { CheckCircleIcon, ArrowLeftIcon, SendIcon } from "lucide-react";

interface TransferSuccessPageProps {
  searchParams: Promise<{ id?: string }>;
}

export default async function TransferSuccessPage({
  searchParams,
}: TransferSuccessPageProps) {
  const { id: transferId } = await searchParams;

  if (!transferId) {
    notFound();
  }

  const result = await getTransferById(transferId);

  if ("error" in result) {
    notFound();
  }

  const transfer = result.data;
  const dateTime = new Intl.DateTimeFormat("en-US", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(transfer.createdAt);

  return (
    <div className="mx-auto max-w-lg space-y-6">
      <div className="flex flex-col items-center text-center">
        <div className="mb-4 flex size-16 items-center justify-center rounded-full bg-green-500/20 text-green-600 dark:text-green-400">
          <CheckCircleIcon className="size-10" />
        </div>
        <h1 className="text-2xl font-bold tracking-tight">
          Transfer Successful!
        </h1>
        <p className="mt-1 text-muted-foreground">
          Your money has been sent successfully.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">
            {formatCurrency(transfer.amount, transfer.currency)} sent
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center gap-3">
            <div className="flex size-10 shrink-0 items-center justify-center overflow-hidden rounded-full bg-muted text-sm font-medium text-muted-foreground">
              {transfer.receiver.avatarUrl ? (
                <img
                  src={transfer.receiver.avatarUrl}
                  alt=""
                  className="size-10 rounded-full object-cover"
                />
              ) : (
                <span>
                  {transfer.receiver.firstName[0]}
                  {transfer.receiver.lastName[0]}
                </span>
              )}
            </div>
            <div>
              <p className="text-xs text-muted-foreground">To</p>
              <p className="font-medium">
                {transfer.receiver.firstName} {transfer.receiver.lastName}
              </p>
            </div>
          </div>

          <dl className="grid gap-2 text-sm">
            <div className="flex justify-between">
              <dt className="text-muted-foreground">Transaction ID</dt>
              <dd className="font-mono text-xs">{transfer.id}</dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-muted-foreground">Date and time</dt>
              <dd>{dateTime}</dd>
            </div>
            {transfer.note && (
              <div className="flex justify-between">
                <dt className="text-muted-foreground">Note</dt>
                <dd>{transfer.note}</dd>
              </div>
            )}
          </dl>
        </CardContent>
      </Card>

      <div className="flex flex-col gap-2 sm:flex-row sm:justify-center">
        <Button asChild variant="outline">
          <Link href="/dashboard">
            <ArrowLeftIcon className="mr-2 size-4" />
            Back to Dashboard
          </Link>
        </Button>
        <Button asChild>
          <Link href="/transfer">
            <SendIcon className="mr-2 size-4" />
            Send Another
          </Link>
        </Button>
      </div>
    </div>
  );
}
