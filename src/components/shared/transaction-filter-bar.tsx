"use client";

import { useRouter, usePathname, useSearchParams } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import { SearchIcon, XIcon } from "lucide-react";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

const SEARCH_DEBOUNCE_MS = 300;

function buildSearchString(params: {
  type?: string;
  search?: string;
  dateFrom?: string;
  dateTo?: string;
  page?: number;
}): string {
  const sp = new URLSearchParams();
  if (params.type && params.type !== "all") sp.set("type", params.type);
  if (params.search) sp.set("search", params.search);
  if (params.dateFrom) sp.set("dateFrom", params.dateFrom);
  if (params.dateTo) sp.set("dateTo", params.dateTo);
  if (params.page && params.page > 1) sp.set("page", String(params.page));
  return sp.toString();
}

export function TransactionFilterBar() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const type = searchParams.get("type") ?? "all";
  const dateFrom = searchParams.get("dateFrom") ?? "";
  const dateTo = searchParams.get("dateTo") ?? "";

  const [searchInput, setSearchInput] = useState(
    () => searchParams.get("search") ?? ""
  );

  const pushParams = useCallback(
    (updates: {
      type?: string;
      search?: string;
      dateFrom?: string;
      dateTo?: string;
      page?: number;
    }) => {
      const next = buildSearchString({
        type: updates.type ?? type,
        search: updates.search ?? (searchParams.get("search") ?? undefined),
        dateFrom: updates.dateFrom ?? (dateFrom || undefined),
        dateTo: updates.dateTo ?? (dateTo || undefined),
        page: updates.page ?? 1,
      });
      router.push(next ? `${pathname}?${next}` : pathname);
    },
    [router, pathname, type, dateFrom, dateTo, searchParams]
  );

  useEffect(() => {
    const t = setTimeout(() => {
      const current = searchParams.get("search") ?? "";
      if (searchInput !== current) {
        pushParams({ search: searchInput || undefined, page: 1 });
      }
    }, SEARCH_DEBOUNCE_MS);
    return () => clearTimeout(t);
  }, [searchInput]); // eslint-disable-line react-hooks/exhaustive-deps -- only run when searchInput changes for debounce

  const handleClearFilters = () => {
    setSearchInput("");
    router.push(pathname);
  };

  const hasActiveFilters =
    type !== "all" || searchParams.get("search") || dateFrom || dateTo;

  return (
    <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
      <div className="flex flex-wrap items-end gap-4">
        <Tabs
          value={type}
          onValueChange={(value) =>
            pushParams({
              type: value as "all" | "DEBIT" | "CREDIT",
              page: 1,
            })
          }
        >
          <TabsList>
            <TabsTrigger value="all">All</TabsTrigger>
            <TabsTrigger value="DEBIT">Sent</TabsTrigger>
            <TabsTrigger value="CREDIT">Received</TabsTrigger>
          </TabsList>
        </Tabs>

        <div className="relative flex-1 sm:min-w-[200px]">
          <SearchIcon className="absolute left-2.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            type="search"
            placeholder="Search..."
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            className="pl-8"
          />
        </div>

        <div className="flex gap-2">
          <Input
            type="date"
            placeholder="From"
            value={dateFrom}
            onChange={(e) =>
              pushParams({ dateFrom: e.target.value || undefined, page: 1 })
            }
            className="w-[130px]"
          />
          <Input
            type="date"
            placeholder="To"
            value={dateTo}
            onChange={(e) =>
              pushParams({ dateTo: e.target.value || undefined, page: 1 })
            }
            className="w-[130px]"
          />
        </div>
      </div>

      {hasActiveFilters && (
        <Button
          variant="ghost"
          size="sm"
          onClick={handleClearFilters}
          className="shrink-0"
        >
          <XIcon className="mr-1 size-4" />
          Clear filters
        </Button>
      )}
    </div>
  );
}
