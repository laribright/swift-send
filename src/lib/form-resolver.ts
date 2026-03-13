import type { FieldValues, Resolver } from "react-hook-form";
import { zodResolver as baseZodResolver } from "@hookform/resolvers/zod";
import type { z } from "zod/v4";

/**
 * Wrapper around zodResolver for Zod v4 schemas.
 * Resolves type mismatch between zod@4.3.x and @hookform/resolvers@5.2.x (branded version).
 */
export function createZodResolver<T extends FieldValues>(
  schema: z.ZodType<T>
): Resolver<T> {
  return baseZodResolver(
    schema as unknown as Parameters<typeof baseZodResolver>[0]
  ) as unknown as Resolver<T>;
}
