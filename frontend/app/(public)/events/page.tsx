"use client";

import { useSearchParams, useRouter, usePathname } from "next/navigation";
import { Search, SlidersHorizontal } from "lucide-react";
import EventCard from "@/components/shared/EventCard";
import EventFilters from "@/components/shared/EventFilters";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetTrigger,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { useEvents } from "@/hooks/useEvents";
import type { EventsQueryParams } from "@/types";
import { cn } from "@/lib/utils";

function CardSkeleton() {
  return (
    <div className="rounded-xl border border-border overflow-hidden bg-card">
      <div className="h-44 bg-muted animate-pulse" />
      <div className="p-4 space-y-2.5">
        <div className="h-2.5 w-16 rounded bg-muted animate-pulse" />
        <div className="h-4 w-full rounded bg-muted animate-pulse" />
        <div className="h-3 w-36 rounded bg-muted animate-pulse" />
        <div className="h-3 w-40 rounded bg-muted animate-pulse" />
        <div className="h-1.5 w-full rounded bg-muted animate-pulse mt-3" />
        <div className="flex justify-between pt-3 border-t border-border">
          <div className="h-5 w-20 rounded bg-muted animate-pulse" />
          <div className="h-3 w-16 rounded bg-muted animate-pulse" />
        </div>
      </div>
    </div>
  );
}

function Pagination({
  currentPage,
  totalPages,
}: {
  currentPage: number;
  totalPages: number;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  if (totalPages <= 1) return null;

  const goToPage = (p: number) => {
    const params = new URLSearchParams(searchParams.toString());
    params.set("page", String(p));
    router.push(`${pathname}?${params.toString()}`);
  };

  const pages: (number | "…")[] = [];
  if (totalPages <= 7) {
    for (let i = 1; i <= totalPages; i++) pages.push(i);
  } else {
    pages.push(1);
    if (currentPage > 3) pages.push("…");
    for (
      let i = Math.max(2, currentPage - 1);
      i <= Math.min(totalPages - 1, currentPage + 1);
      i++
    )
      pages.push(i);
    if (currentPage < totalPages - 2) pages.push("…");
    pages.push(totalPages);
  }

  return (
    <div className="flex items-center justify-center gap-1.5 pt-6">
      <Button
        variant="outline"
        size="sm"
        disabled={currentPage === 1}
        onClick={() => goToPage(currentPage - 1)}
        className="text-muted-foreground hover:text-foreground disabled:opacity-30"
      >
        ← Prev
      </Button>

      {pages.map((p, i) =>
        p === "…" ? (
          <span key={`e${i}`} className="px-1 text-muted-foreground text-sm">
            …
          </span>
        ) : (
          <Button
            key={p}
            variant={p === currentPage ? "default" : "ghost"}
            size="icon"
            onClick={() => goToPage(p)}
            className={cn(
              "h-8 w-8 text-sm font-medium",
              p === currentPage
                ? "bg-violet-600 hover:bg-violet-700 text-white shadow-sm"
                : "text-muted-foreground hover:text-foreground",
            )}
          >
            {p}
          </Button>
        ),
      )}

      <Button
        variant="outline"
        size="sm"
        disabled={currentPage === totalPages}
        onClick={() => goToPage(currentPage + 1)}
        className="text-muted-foreground hover:text-foreground disabled:opacity-30"
      >
        Next →
      </Button>
    </div>
  );
}

export default function EventsPage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();

  const params: EventsQueryParams = {
    page: Number(searchParams.get("page")) || 1,
    limit: 20,
    category: searchParams.get("category") || undefined,
    city: searchParams.get("city") || undefined,
    search: searchParams.get("search") || undefined,
    sortBy:
      (searchParams.get("sortBy") as EventsQueryParams["sortBy"]) || undefined,
    sortOrder:
      (searchParams.get("sortOrder") as "asc" | "desc" | undefined) ||
      undefined,
    minPrice: searchParams.get("minPrice")
      ? Number(searchParams.get("minPrice"))
      : undefined,
    maxPrice: searchParams.get("maxPrice")
      ? Number(searchParams.get("maxPrice"))
      : undefined,
    startDate: searchParams.get("startDate") || undefined,
    endDate: searchParams.get("endDate") || undefined,
  };

  const { data, isLoading, isFetching } = useEvents(params);

  const events = data?.events || [];
  const pagination = data?.pagination;
  const currentPage = params.page || 1;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8">
      <div className="mb-6">
        <h1 className="text-2xl sm:text-3xl font-bold text-foreground">
          {params.search ? (
            <>
              Search: <span className="text-violet-600">{params.search}</span>
            </>
          ) : params.category ? (
            <>{params.category} Events</>
          ) : (
            <>All Events</>
          )}
        </h1>
        <p className="text-sm text-muted-foreground mt-1">
          {pagination
            ? `${pagination.total} event${pagination.total !== 1 ? "s" : ""} found`
            : "Loading…"}
        </p>
      </div>

      <div className="flex gap-6">
        <aside className="hidden lg:block w-64 shrink-0">
          <div className="sticky top-20">
            <EventFilters />
          </div>
        </aside>

        <div className="flex-1 min-w-0">
          <div className="lg:hidden mb-4">
            <Sheet>
              <SheetTrigger asChild>
                <Button variant="outline" size="sm">
                  <SlidersHorizontal className="h-4 w-4" />
                  Filters
                </Button>
              </SheetTrigger>
              <SheetContent side="left" className="w-75 sm:w-[320px]">
                <SheetHeader>
                  <SheetTitle>Filters</SheetTitle>
                </SheetHeader>
                <div className="mt-4">
                  <EventFilters />
                </div>
              </SheetContent>
            </Sheet>
          </div>

          {/* Grid */}
          {isLoading ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
              {[...Array(6)].map((_, i) => (
                <CardSkeleton key={i} />
              ))}
            </div>
          ) : events.length > 0 ? (
            <>
              <div
                className={cn(
                  "grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4",
                  isFetching && "opacity-60 transition-opacity",
                )}
              >
                {events.map((event) => (
                  <EventCard key={event.id} event={event} />
                ))}
              </div>

              {/* Pagination */}
              {pagination && (
                <Pagination
                  currentPage={currentPage}
                  totalPages={pagination.totalPages}
                />
              )}
            </>
          ) : (
            /* Empty state */
            <div className="flex flex-col items-center justify-center py-24 text-center">
              <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center mb-4">
                <Search className="h-7 w-7 text-muted-foreground" />
              </div>
              <h3 className="text-lg font-semibold text-foreground">
                No events found
              </h3>
              <p className="text-sm text-muted-foreground mt-1 max-w-md">
                Try adjusting your filters or searching for something different.
              </p>
              <Button
                onClick={() => router.push(pathname)}
                className="mt-4 bg-violet-600 hover:bg-violet-700 text-white"
              >
                Clear all filters
              </Button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
