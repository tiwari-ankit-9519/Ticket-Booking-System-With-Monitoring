"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { Search, X, MapPin, Tag, TrendingUp } from "lucide-react";
import { useSearchSuggestions } from "@/hooks/useEvents";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface SearchSuggestions {
  events: string[];
  cities: string[];
  tags: string[];
}

interface SearchBarProps {
  className?: string;
  placeholder?: string;
  onSearch?: (query: string) => void;
}

export default function SearchBar({
  className,
  placeholder = "Search events, cities, or topics...",
  onSearch,
}: SearchBarProps) {
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const [query, setQuery] = useState("");
  const [debouncedQuery, setDebouncedQuery] = useState("");
  const [isOpen, setIsOpen] = useState(false);
  const [focusIndex, setFocusIndex] = useState(-1);
  const { data: rawSuggestions, isLoading } =
    useSearchSuggestions(debouncedQuery);
  const suggestions = rawSuggestions as SearchSuggestions | undefined;

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedQuery(query), 300);
    return () => clearTimeout(timer);
  }, [query]);

  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(e.target as Node)
      ) {
        setIsOpen(false);
        setFocusIndex(-1);
      }
    };
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  const allSuggestions = useCallback(() => {
    if (!suggestions) return [];
    const items: { label: string; type: string; href: string }[] = [];
    suggestions.events.forEach((e) =>
      items.push({
        label: e,
        type: "event",
        href: `/events?search=${encodeURIComponent(e)}`,
      }),
    );
    suggestions.cities.forEach((c) =>
      items.push({
        label: c,
        type: "city",
        href: `/events?city=${encodeURIComponent(c)}`,
      }),
    );
    suggestions.tags.forEach((t) =>
      items.push({
        label: t,
        type: "tag",
        href: `/events?search=${encodeURIComponent(t)}`,
      }),
    );
    return items;
  }, [suggestions]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    const items = allSuggestions();
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setFocusIndex((i) => Math.min(i + 1, items.length - 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setFocusIndex((i) => Math.max(i - 1, -1));
    } else if (e.key === "Enter") {
      e.preventDefault();
      if (focusIndex >= 0 && items[focusIndex]) {
        router.push(items[focusIndex].href);
        setIsOpen(false);
      } else if (query.trim()) {
        handleSearch();
      }
    } else if (e.key === "Escape") {
      setIsOpen(false);
      setFocusIndex(-1);
    }
  };

  const handleSearch = () => {
    if (!query.trim()) return;
    if (onSearch) onSearch(query);
    router.push(`/events?search=${encodeURIComponent(query.trim())}`);
    setIsOpen(false);
  };

  const hasSuggestions =
    suggestions &&
    (suggestions.events.length > 0 ||
      suggestions.cities.length > 0 ||
      suggestions.tags.length > 0);

  let itemIndex = -1;

  return (
    <div ref={dropdownRef} className={cn("relative w-full", className)}>
      <div className="flex items-center rounded-xl border border-border bg-background shadow-sm focus-within:ring-2 focus-within:ring-violet-500 focus-within:border-violet-500 transition-all">
        <Search className="ml-3 h-5 w-5 text-muted-foreground shrink-0" />
        <Input
          ref={inputRef}
          type="text"
          value={query}
          onChange={(e) => {
            setQuery(e.target.value);
            setIsOpen(true);
            setFocusIndex(-1);
          }}
          onFocus={() => setIsOpen(true)}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
          className="flex-1 border-0 shadow-none rounded-none focus-visible:ring-0 focus-visible:ring-offset-0 bg-transparent placeholder-muted-foreground"
        />
        {query && (
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="h-8 w-8 text-muted-foreground hover:text-foreground hover:bg-muted"
            onClick={() => {
              setQuery("");
              setDebouncedQuery("");
              inputRef.current?.focus();
            }}
          >
            <X className="h-4 w-4" />
          </Button>
        )}
        <Button
          type="button"
          onClick={handleSearch}
          size="sm"
          className="mr-1 bg-violet-600 hover:bg-violet-700 text-white rounded-lg shadow-sm shadow-violet-500/25 transition-all hover:shadow-md hover:shadow-violet-500/25"
        >
          Search
        </Button>
      </div>

      {isOpen && (isLoading || hasSuggestions || !query) && (
        <div className="absolute top-full left-0 right-0 mt-2 bg-background border border-border rounded-xl shadow-lg shadow-black/10 dark:shadow-black/30 z-50 overflow-hidden">
          {isLoading && (
            <div className="px-4 py-3 text-sm text-muted-foreground flex items-center gap-2">
              <div className="w-3.5 h-3.5 border-2 border-muted border-t-violet-500 rounded-full animate-spin" />
              Searching…
            </div>
          )}

          {!isLoading && hasSuggestions && (
            <>
              {suggestions!.events.length > 0 && (
                <div>
                  <p className="px-4 pt-3 pb-1 text-xs font-semibold text-muted-foreground uppercase tracking-wider flex items-center gap-1.5">
                    <TrendingUp className="h-3 w-3" /> Events
                  </p>
                  {suggestions!.events.map((evt) => {
                    itemIndex++;
                    const idx = itemIndex;
                    return (
                      <Button
                        key={`evt-${evt}`}
                        variant="ghost"
                        className={cn(
                          "w-full justify-start rounded-none px-4 py-2 text-sm gap-2.5 hover:bg-violet-50 dark:hover:bg-violet-950/40",
                          focusIndex === idx &&
                            "bg-violet-50 dark:bg-violet-950/40",
                        )}
                        onClick={() => {
                          router.push(
                            `/events?search=${encodeURIComponent(evt)}`,
                          );
                          setIsOpen(false);
                        }}
                      >
                        <Search className="h-3.5 w-3.5 text-muted-foreground" />
                        <span className="text-foreground">{evt}</span>
                      </Button>
                    );
                  })}
                </div>
              )}

              {suggestions!.cities.length > 0 && (
                <div>
                  <p className="px-4 pt-2.5 pb-1 text-xs font-semibold text-muted-foreground uppercase tracking-wider flex items-center gap-1.5">
                    <MapPin className="h-3 w-3" /> Cities
                  </p>
                  {suggestions!.cities.map((city) => {
                    itemIndex++;
                    const idx = itemIndex;
                    return (
                      <Button
                        key={`city-${city}`}
                        variant="ghost"
                        className={cn(
                          "w-full justify-start rounded-none px-4 py-2 text-sm gap-2.5 hover:bg-violet-50 dark:hover:bg-violet-950/40",
                          focusIndex === idx &&
                            "bg-violet-50 dark:bg-violet-950/40",
                        )}
                        onClick={() => {
                          router.push(
                            `/events?city=${encodeURIComponent(city)}`,
                          );
                          setIsOpen(false);
                        }}
                      >
                        <MapPin className="h-3.5 w-3.5 text-violet-500" />
                        <span className="text-foreground">{city}</span>
                      </Button>
                    );
                  })}
                </div>
              )}

              {suggestions!.tags.length > 0 && (
                <div className="border-t border-border mt-1">
                  <p className="px-4 pt-2.5 pb-1 text-xs font-semibold text-muted-foreground uppercase tracking-wider flex items-center gap-1.5">
                    <Tag className="h-3 w-3" /> Topics
                  </p>
                  {suggestions!.tags.map((tag) => {
                    itemIndex++;
                    const idx = itemIndex;
                    return (
                      <Button
                        key={`tag-${tag}`}
                        variant="ghost"
                        className={cn(
                          "w-full justify-start rounded-none px-4 py-2 text-sm gap-2.5 hover:bg-violet-50 dark:hover:bg-violet-950/40",
                          focusIndex === idx &&
                            "bg-violet-50 dark:bg-violet-950/40",
                        )}
                        onClick={() => {
                          router.push(
                            `/events?search=${encodeURIComponent(tag)}`,
                          );
                          setIsOpen(false);
                        }}
                      >
                        <Tag className="h-3.5 w-3.5 text-blue-500" />
                        <span className="text-foreground">{tag}</span>
                      </Button>
                    );
                  })}
                </div>
              )}
            </>
          )}

          {!isLoading && !hasSuggestions && query.length >= 2 && (
            <div className="px-4 py-3 text-sm text-muted-foreground">
              No suggestions found —{" "}
              <kbd className="px-1.5 py-0.5 rounded bg-muted text-xs font-mono">
                Enter
              </kbd>{" "}
              to search
            </div>
          )}
        </div>
      )}
    </div>
  );
}
