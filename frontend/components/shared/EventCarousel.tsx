"use client";

import { useRef, useState, useEffect, useCallback } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import EventCard from "@/components/shared/EventCard";
import { Button } from "@/components/ui/button";
import type { Event } from "@/types";
import { cn } from "@/lib/utils";

interface EventCarouselProps {
  events: Event[];
  title: string;
  subtitle?: string;
  className?: string;
  autoPlay?: boolean;
  interval?: number;
}

export default function EventCarousel({
  events,
  title,
  subtitle,
  className,
  autoPlay = false,
  interval = 4000,
}: EventCarouselProps) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const [canPrev, setCanPrev] = useState(false);
  const [canNext, setCanNext] = useState(false);

  const updateButtons = useCallback(() => {
    const el = scrollRef.current;
    if (!el) return;
    setCanPrev(el.scrollLeft > 4);
    setCanNext(el.scrollLeft < el.scrollWidth - el.clientWidth - 4);
  }, []);

  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;
    updateButtons();
    el.addEventListener("scroll", updateButtons, { passive: true });
    const ro = new ResizeObserver(updateButtons);
    ro.observe(el);
    return () => {
      el.removeEventListener("scroll", updateButtons);
      ro.disconnect();
    };
  }, [events, updateButtons]);

  useEffect(() => {
    if (!autoPlay || events.length === 0) return;
    const el = scrollRef.current;
    if (!el) return;
    const timer = setInterval(() => {
      const cardWidth = 320 + 16;
      if (el.scrollLeft >= el.scrollWidth - el.clientWidth - 4) {
        el.scrollTo({ left: 0, behavior: "smooth" });
      } else {
        el.scrollBy({ left: cardWidth, behavior: "smooth" });
      }
    }, interval);
    return () => clearInterval(timer);
  }, [autoPlay, interval, events.length]);

  const scroll = (dir: "left" | "right") => {
    const el = scrollRef.current;
    if (!el) return;
    const cardWidth = 320 + 16;
    el.scrollBy({
      left: dir === "right" ? cardWidth : -cardWidth,
      behavior: "smooth",
    });
  };

  if (events.length === 0) return null;

  return (
    <section className={cn("w-full", className)}>
      <div className="flex items-end justify-between mb-4 px-1">
        <div>
          <h2 className="text-xl font-bold text-foreground">{title}</h2>
          {subtitle && (
            <p className="text-sm text-muted-foreground mt-0.5">{subtitle}</p>
          )}
        </div>
        <div className="flex gap-1.5">
          <Button
            variant="outline"
            size="icon"
            onClick={() => scroll("left")}
            disabled={!canPrev}
            className="h-8 w-8 text-muted-foreground hover:text-foreground disabled:opacity-30"
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <Button
            variant="outline"
            size="icon"
            onClick={() => scroll("right")}
            disabled={!canNext}
            className="h-8 w-8 text-muted-foreground hover:text-foreground disabled:opacity-30"
          >
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      </div>

      <div
        ref={scrollRef}
        className="flex gap-4 overflow-x-auto scrollbar-hide"
        style={{ scrollSnapType: "x mandatory" }}
      >
        {events.map((event) => (
          <div
            key={event.id}
            className="shrink-0 w-72"
            style={{ scrollSnapAlign: "start" }}
          >
            <EventCard event={event} />
          </div>
        ))}
      </div>
    </section>
  );
}
