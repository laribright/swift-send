"use client";

import { useState, useCallback } from "react";
import { isRedirectError } from "next/dist/client/components/redirect-error";
import { toast } from "sonner";

interface UseServerActionOptions {
  successMessage?: string;
}

export function useServerAction<TInput, TOutput = void>(
  action: (
    input: TInput
  ) => Promise<{ error: string } | { success: true; data: TOutput } | void>,
  options?: UseServerActionOptions
) {
  const [isLoading, setIsLoading] = useState(false);

  const execute = useCallback(
    async (input: TInput) => {
      setIsLoading(true);

      try {
        const result = await action(input);

        if (!result) return;

        if ("error" in result) {
          toast.error(result.error);
          return;
        }

        if (options?.successMessage) {
          toast.success(options.successMessage);
        }

        return result.data;
      } catch (err) {
        if (isRedirectError(err)) {
          throw err;
        }
        toast.error("Something went wrong");
      } finally {
        setIsLoading(false);
      }
    },
    [action, options]
  );

  return { execute, isLoading };
}
