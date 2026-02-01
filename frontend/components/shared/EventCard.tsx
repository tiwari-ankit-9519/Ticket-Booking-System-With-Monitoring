"use client";

import Link from "next/link";
import Image from "next/image";
import { MapPin, Clock } from "lucide-react";
import { format, parseISO } from "date-fns";
import type { Event } from "@/types";
import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";

const CATEGORY_STYLES: Record<
  string,
  { bg: string; text: string; border: string }
> = {
  Music: {
    bg: "bg-pink-100 dark:bg-pink-950/40",
    text: "text-pink-700 dark:text-pink-300",
    border: "border-pink-200 dark:border-pink-800",
  },
  Sports: {
    bg: "bg-green-100 dark:bg-green-950/40",
    text: "text-green-700 dark:text-green-300",
    border: "border-green-200 dark:border-green-800",
  },
  Arts: {
    bg: "bg-amber-100 dark:bg-amber-950/40",
    text: "text-amber-700 dark:text-amber-300",
    border: "border-amber-200 dark:border-amber-800",
  },
  Technology: {
    bg: "bg-cyan-100 dark:bg-cyan-950/40",
    text: "text-cyan-700 dark:text-cyan-300",
    border: "border-cyan-200 dark:border-cyan-800",
  },
  Business: {
    bg: "bg-blue-100 dark:bg-blue-950/40",
    text: "text-blue-700 dark:text-blue-300",
    border: "border-blue-200 dark:border-blue-800",
  },
  Education: {
    bg: "bg-indigo-100 dark:bg-indigo-950/40",
    text: "text-indigo-700 dark:text-indigo-300",
    border: "border-indigo-200 dark:border-indigo-800",
  },
  Food: {
    bg: "bg-orange-100 dark:bg-orange-950/40",
    text: "text-orange-700 dark:text-orange-300",
    border: "border-orange-200 dark:border-orange-800",
  },
  Health: {
    bg: "bg-emerald-100 dark:bg-emerald-950/40",
    text: "text-emerald-700 dark:text-emerald-300",
    border: "border-emerald-200 dark:border-emerald-800",
  },
  Entertainment: {
    bg: "bg-violet-100 dark:bg-violet-950/40",
    text: "text-violet-700 dark:text-violet-300",
    border: "border-violet-200 dark:border-violet-800",
  },
  Other: {
    bg: "bg-gray-100 dark:bg-gray-800",
    text: "text-gray-600 dark:text-gray-300",
    border: "border-gray-200 dark:border-gray-700",
  },
};

function getCategoryStyle(cat: string) {
  return CATEGORY_STYLES[cat] || CATEGORY_STYLES["Other"];
}

function AvailabilityBar({ event }: { event: Event }) {
  const pct =
    event.totalSeats > 0
      ? Math.round((event.availableSeats / event.totalSeats) * 100)
      : 0;
  const isSoldOut = event.availableSeats === 0;
  const isLow = pct > 0 && pct <= 20;

  const barColor = isSoldOut
    ? "bg-destructive"
    : isLow
      ? "bg-amber-500"
      : "bg-emerald-500";

  return (
    <div className="flex items-center gap-2">
      <div className="flex-1 h-1.5 bg-muted rounded-full overflow-hidden">
        <div
          className={cn("h-full rounded-full transition-all", barColor)}
          style={{ width: `${100 - pct}%` }}
        />
      </div>
      <span
        className={cn(
          "text-xs font-medium whitespace-nowrap",
          isSoldOut
            ? "text-destructive"
            : isLow
              ? "text-amber-600 dark:text-amber-400"
              : "text-emerald-600 dark:text-emerald-400",
        )}
      >
        {isSoldOut
          ? "Sold Out"
          : isLow
            ? `${pct}% left`
            : `${event.availableSeats} seats`}
      </span>
    </div>
  );
}

interface EventCardProps {
  event: Event;
  className?: string;
  compact?: boolean;
}

export default function EventCard({ event, className }: EventCardProps) {
  const catStyle = getCategoryStyle(event.category);
  const startDate = parseISO(event.startDate);
  const isSoldOut = event.availableSeats === 0;

  return (
    <Link
      href={`/events/${event.id}`}
      className={cn(
        "group flex flex-col hover:shadow-md dark:hover:shadow-black/20 transition-all duration-200 hover:-translate-y-0.5",
        isSoldOut && "opacity-75",
        className,
      )}
    >
      <Card className="flex flex-col h-full overflow-hidden">
        <div className="relative h-44 bg-linear-to-br from-violet-100 to-blue-100 dark:from-violet-950/30 dark:to-blue-950/30 overflow-hidden">
          {event.imageUrl ? (
            <Image
              src={event.imageUrl}
              alt={event.title}
              fill
              sizes="(max-width:640px) 100vw, (max-width:1024px) 50vw, 33vw"
              className="object-cover group-hover:scale-105 transition-transform duration-300"
            />
          ) : (
            <div className="absolute inset-0 flex items-center justify-center">
              <span className="text-6xl opacity-20">
                {event.category === "Music"
                  ? "🎵"
                  : event.category === "Sports"
                    ? "⚽"
                    : event.category === "Arts"
                      ? "🎨"
                      : event.category === "Technology"
                        ? "💻"
                        : event.category === "Food"
                          ? "🍽️"
                          : "🎯"}
              </span>
            </div>
          )}

          {event.isFeatured && (
            <span className="absolute top-3 left-3 inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-violet-600 text-white text-xs font-semibold shadow-sm">
              ✦ Featured
            </span>
          )}

          {isSoldOut && (
            <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
              <span className="px-4 py-1.5 rounded-full bg-destructive text-white text-sm font-bold shadow">
                Sold Out
              </span>
            </div>
          )}
        </div>

        <CardContent className="flex flex-col flex-1 p-4 gap-2.5">
          <span
            className={cn(
              "self-start inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold border",
              catStyle.bg,
              catStyle.text,
              catStyle.border,
            )}
          >
            {event.category}
          </span>

          <h3 className="text-base font-semibold text-foreground leading-snug line-clamp-2 group-hover:text-violet-600 dark:group-hover:text-violet-400 transition-colors">
            {event.title}
          </h3>

          <div className="flex flex-col gap-1.5 text-sm text-muted-foreground">
            <span className="flex items-center gap-1.5">
              <Clock className="h-3.5 w-3.5 shrink-0" />
              {format(startDate, "EEE, MMM d · h:mm a")}
            </span>
            <span className="flex items-center gap-1.5">
              <MapPin className="h-3.5 w-3.5 shrink-0" />
              <span className="truncate">
                {event.venue}, {event.city}
              </span>
            </span>
          </div>

          <div className="mt-auto">
            <AvailabilityBar event={event} />
          </div>

          <div className="flex items-center justify-between pt-2 border-t border-border">
            <div>
              <span className="text-lg font-bold text-foreground">
                ₹{Number(event.price).toLocaleString()}
              </span>
              <span className="text-xs text-muted-foreground"> / seat</span>
            </div>
            {!isSoldOut && (
              <span className="text-xs font-medium text-violet-600 dark:text-violet-400 group-hover:underline transition-colors">
                Book now →
              </span>
            )}
          </div>
        </CardContent>
      </Card>
    </Link>
  );
}
