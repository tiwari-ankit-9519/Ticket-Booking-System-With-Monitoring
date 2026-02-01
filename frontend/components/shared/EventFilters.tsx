"use client";

import { useCallback } from "react";
import { useSearchParams, useRouter, usePathname } from "next/navigation";
import { SlidersHorizontal } from "lucide-react";
import { EVENT_CATEGORIES } from "@/lib/constants";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const CITIES = [
  "Mumbai",
  "Delhi",
  "Bangalore",
  "Hyderabad",
  "Chennai",
  "Kolkata",
  "Pune",
  "Jaipur",
  "Ahmedabad",
  "Lucknow",
];

const SORT_OPTIONS = [
  { value: "eventDate-asc", label: "Date: Soonest" },
  { value: "eventDate-desc", label: "Date: Latest" },
  { value: "price-asc", label: "Price: Low → High" },
  { value: "price-desc", label: "Price: High → Low" },
  { value: "createdAt-desc", label: "Newest" },
];

// Shared className for native <select>s — mirrors shadcn Input's base styles
// so border, radius, focus ring, and text size stay in sync with <Input>.
const selectClassName =
  "flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-violet-500 focus-visible:border-violet-500 cursor-pointer";

export default function EventFilters({ className }: { className?: string }) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const get = (key: string) => searchParams.get(key) || "";

  const update = useCallback(
    (key: string, value: string | null) => {
      const params = new URLSearchParams(searchParams.toString());
      if (value) {
        params.set(key, value);
      } else {
        params.delete(key);
      }
      params.delete("page");
      router.push(`${pathname}?${params.toString()}`);
    },
    [searchParams, router, pathname],
  );

  const resetAll = () => {
    router.push(pathname);
  };

  const activeFilters =
    (get("category") ? 1 : 0) +
    (get("city") ? 1 : 0) +
    (get("minPrice") || get("maxPrice") ? 1 : 0) +
    (get("startDate") || get("endDate") ? 1 : 0);

  const sortBy = get("sortBy") || "eventDate";
  const sortOrder = get("sortOrder") || "asc";
  const currentSort = `${sortBy}-${sortOrder}`;

  const handleSortChange = (val: string) => {
    const [by, order] = val.split("-");
    const params = new URLSearchParams(searchParams.toString());
    params.set("sortBy", by);
    params.set("sortOrder", order);
    params.delete("page");
    router.push(`${pathname}?${params.toString()}`);
  };

  return (
    <aside className={cn("space-y-5", className)}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <SlidersHorizontal className="h-4 w-4 text-muted-foreground" />
          <h3 className="text-sm font-semibold text-foreground">Filters</h3>
          {activeFilters > 0 && (
            <span className="inline-flex items-center justify-center w-5 h-5 rounded-full bg-violet-100 dark:bg-violet-950/40 text-violet-700 dark:text-violet-300 text-xs font-bold">
              {activeFilters}
            </span>
          )}
        </div>
        {activeFilters > 0 && (
          <Button
            variant="ghost"
            size="sm"
            onClick={resetAll}
            className="h-auto px-0 text-xs text-muted-foreground hover:text-foreground hover:bg-transparent underline underline-offset-2"
          >
            Clear all
          </Button>
        )}
      </div>

      {/* Category */}
      <div className="space-y-2">
        <Label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
          Category
        </Label>
        <div className="flex flex-wrap gap-1.5">
          {EVENT_CATEGORIES.map((cat) => {
            const active = get("category") === cat;
            return (
              <Button
                key={cat}
                variant={active ? "default" : "outline"}
                size="sm"
                onClick={() => update("category", active ? null : cat)}
                className={cn(
                  "rounded-full px-3 h-7 text-xs font-medium",
                  active
                    ? "bg-violet-600 hover:bg-violet-700 text-white border-violet-600 shadow-sm"
                    : "text-muted-foreground hover:border-violet-400 hover:text-violet-600 dark:hover:text-violet-400",
                )}
              >
                {cat}
              </Button>
            );
          })}
        </div>
      </div>

      {/* City */}
      <div className="space-y-2">
        <Label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
          City
        </Label>
        <select
          value={get("city")}
          onChange={(e) => update("city", e.target.value || null)}
          className={selectClassName}
        >
          <option value="">All Cities</option>
          {CITIES.map((c) => (
            <option key={c} value={c}>
              {c}
            </option>
          ))}
        </select>
      </div>

      {/* Price Range */}
      <div className="space-y-2">
        <Label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
          Price Range (₹)
        </Label>
        <div className="flex items-center gap-2">
          <Input
            type="number"
            placeholder="Min"
            value={get("minPrice")}
            onChange={(e) => update("minPrice", e.target.value || null)}
            className="focus-visible:ring-violet-500"
          />
          <span className="text-muted-foreground text-sm">–</span>
          <Input
            type="number"
            placeholder="Max"
            value={get("maxPrice")}
            onChange={(e) => update("maxPrice", e.target.value || null)}
            className="focus-visible:ring-violet-500"
          />
        </div>
      </div>

      {/* Date Range */}
      <div className="space-y-2">
        <Label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
          Date Range
        </Label>
        <div className="flex flex-col gap-2">
          <div>
            <span className="text-xs text-muted-foreground">From</span>
            <Input
              type="date"
              value={get("startDate")}
              onChange={(e) => update("startDate", e.target.value || null)}
              className="mt-0.5 focus-visible:ring-violet-500"
            />
          </div>
          <div>
            <span className="text-xs text-muted-foreground">To</span>
            <Input
              type="date"
              value={get("endDate")}
              onChange={(e) => update("endDate", e.target.value || null)}
              className="mt-0.5 focus-visible:ring-violet-500"
            />
          </div>
        </div>
      </div>

      {/* Sort */}
      <div className="space-y-2">
        <Label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
          Sort By
        </Label>
        <select
          value={currentSort}
          onChange={(e) => handleSortChange(e.target.value)}
          className={selectClassName}
        >
          {SORT_OPTIONS.map((s) => (
            <option key={s.value} value={s.value}>
              {s.label}
            </option>
          ))}
        </select>
      </div>
    </aside>
  );
}
