"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { usePlaidLink } from "react-plaid-link";
import { Loader2Icon } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";

interface PlaidLinkButtonProps {
  userId: string;
  variant?: "default" | "outline" | "ghost" | "link" | "destructive" | "secondary";
  size?: "default" | "sm" | "lg" | "icon";
  className?: string;
  children?: React.ReactNode;
}

export function PlaidLinkButton({
  userId,
  variant = "outline",
  size = "sm",
  className,
  children,
}: PlaidLinkButtonProps) {
  const router = useRouter();
  const [linkToken, setLinkToken] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;

    async function createLinkToken() {
      try {
        const res = await fetch("/api/plaid/create-link-token", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ userId }),
        });

        const data = await res.json();

        if (!res.ok) {
          throw new Error(data.error ?? "Failed to create link token");
        }

        if (data.link_token && !cancelled) {
          setLinkToken(data.link_token);
        }
      } catch (err) {
        if (!cancelled) {
          toast.error(err instanceof Error ? err.message : "Failed to load Plaid");
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    createLinkToken();
    return () => {
      cancelled = true;
    };
  }, [userId]);

  const onSuccess = useCallback(
    async (public_token: string) => {
      try {
        const res = await fetch("/api/plaid/exchange-token", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ publicToken: public_token, userId }),
        });

        const data = await res.json();

        if (!res.ok) {
          throw new Error(data.error ?? "Failed to link account");
        }

        toast.success("Bank account linked successfully");
        router.refresh();
      } catch (err) {
        toast.error(err instanceof Error ? err.message : "Failed to link account");
      }
    },
    [userId, router]
  );

  const onExit = useCallback((err: unknown) => {
    if (err != null) {
      toast.error("Linking was cancelled or failed");
    }
  }, []);

  const config = {
    token: linkToken,
    onSuccess,
    onExit,
  };

  const { open, ready } = usePlaidLink(config);

  const isDisabled = loading || !linkToken || !ready;

  return (
    <Button
      variant={variant}
      size={size}
      className={className}
      onClick={() => open()}
      disabled={isDisabled}
    >
      {loading ? (
        <Loader2Icon className="size-4 animate-spin" />
      ) : (
        children ?? "Connect Bank Account"
      )}
    </Button>
  );
}
