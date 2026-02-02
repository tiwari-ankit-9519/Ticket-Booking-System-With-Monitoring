"use client";

import { useParams } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import { MapPin, Calendar, ArrowLeft, Ticket } from "lucide-react";
import { format, parseISO } from "date-fns";
import { useEventDetail, useEventAvailability } from "@/hooks/useEvents";
import { useAuthStore } from "@/stores/useAuthStore";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";

function AvailabilitySection({ eventId }: { eventId: string }) {
  const { data: avail, isLoading } = useEventAvailability(eventId);
  console.log(avail);

  if (isLoading || !avail) {
    return (
      <div className="space-y-2">
        <div className="h-3 w-32 rounded bg-muted animate-pulse" />
        <div className="h-2 w-full rounded bg-muted animate-pulse" />
        <div className="h-3 w-24 rounded bg-muted animate-pulse" />
      </div>
    );
  }

  const pct =
    avail.totalSeats > 0
      ? Math.round((avail.availableSeats / avail.totalSeats) * 100)
      : 0;
  const isSoldOut = avail.isSoldOut;
  const isLow = pct > 0 && pct <= 20;

  return (
    <div className="space-y-2">
      <div className="flex justify-between items-center">
        <span className="text-sm font-semibold text-foreground">
          Seat Availability
        </span>
        <span
          className={cn(
            "text-xs font-bold px-2 py-0.5 rounded-full",
            isSoldOut
              ? "bg-red-100 dark:bg-red-950/40 text-red-700 dark:text-red-300"
              : isLow
                ? "bg-amber-100 dark:bg-amber-950/40 text-amber-700 dark:text-amber-300"
                : "bg-emerald-100 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300",
          )}
        >
          {isSoldOut ? "Sold Out" : isLow ? "Almost Gone!" : "Available"}
        </span>
      </div>

      {/* Progress bar */}
      <div className="h-2.5 bg-muted rounded-full overflow-hidden">
        <div
          className={cn(
            "h-full rounded-full transition-all duration-500",
            isSoldOut
              ? "bg-red-500"
              : isLow
                ? "bg-amber-500"
                : "bg-emerald-500",
          )}
          style={{ width: `${100 - pct}%` }}
        />
      </div>

      <div className="flex justify-between text-xs text-muted-foreground">
        <span>{avail.bookedSeats} booked</span>
        <span>
          {avail.availableSeats} remaining of {avail.totalSeats}
        </span>
      </div>
    </div>
  );
}

export default function EventDetailPage() {
  const { id } = useParams<{ id: string }>();
  const { data: event, isLoading } = useEventDetail(id);
  const { isAuthenticated } = useAuthStore();

  console.log(event);

  if (isLoading) {
    return (
      <div className="max-w-5xl mx-auto px-4 sm:px-6 py-8 space-y-6">
        <div className="h-64 w-full rounded-2xl bg-muted animate-pulse" />
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 space-y-4">
            <div className="h-8 w-3/4 rounded bg-muted animate-pulse" />
            <div className="h-4 w-full rounded bg-muted animate-pulse" />
            <div className="h-4 w-5/6 rounded bg-muted animate-pulse" />
            <div className="h-4 w-full rounded bg-muted animate-pulse" />
          </div>
          <div className="rounded-xl border border-border p-5 space-y-4">
            <div className="h-6 w-1/2 rounded bg-muted animate-pulse" />
            <div className="h-3 w-full rounded bg-muted animate-pulse" />
            <div className="h-10 w-full rounded bg-muted animate-pulse" />
          </div>
        </div>
      </div>
    );
  }

  if (!event) {
    return (
      <div className="max-w-3xl mx-auto px-4 sm:px-6 py-24 text-center">
        <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center mx-auto mb-4">
          <Ticket className="h-7 w-7 text-muted-foreground" />
        </div>
        <h2 className="text-xl font-bold text-foreground">Event not found</h2>
        <p className="text-sm text-muted-foreground mt-1">
          This event may have been removed or the link is incorrect.
        </p>
        <Link
          href="/events"
          className="inline-flex items-center gap-1.5 mt-4 text-sm text-violet-600 dark:text-violet-400 hover:underline"
        >
          <ArrowLeft className="h-3.5 w-3.5" /> Back to events
        </Link>
      </div>
    );
  }

  const startDate = parseISO(event.startDate ?? new Date().toISOString());
  const endDate = parseISO(event.endDate ?? new Date().toISOString());
  const isSoldOut = event.availableSeats === 0;

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 py-8">
      <Link
        href="/events"
        className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-violet-600 dark:hover:text-violet-400 transition-colors mb-6"
      >
        <ArrowLeft className="h-3.5 w-3.5" /> Back to events
      </Link>

      <div className="relative w-full h-64 sm:h-80 rounded-2xl overflow-hidden bg-linear-to-br from-violet-100 to-blue-100 dark:from-violet-950/30 dark:to-blue-950/30 mb-8">
        {event.imageUrl ? (
          <Image
            src={event.imageUrl}
            alt={event.title}
            fill
            sizes="(max-width:1024px) 100vw, 1024px"
            className="object-cover"
            priority
          />
        ) : (
          <div className="absolute inset-0 flex items-center justify-center">
            <span className="text-8xl opacity-15">
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

        <div className="absolute top-4 left-4 flex gap-2">
          <span className="px-3 py-1 rounded-full bg-white/90 dark:bg-black/60 backdrop-blur text-sm font-semibold text-foreground border border-border">
            {event.category}
          </span>
          {event.isFeatured && (
            <span className="px-3 py-1 rounded-full bg-violet-600 text-white text-sm font-semibold shadow">
              ✦ Featured
            </span>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-6">
          <div>
            <h1 className="text-3xl sm:text-4xl font-bold text-foreground leading-tight">
              {event.title}
            </h1>
            {event?.tags?.length > 0 && (
              <div className="flex flex-wrap gap-1.5 mt-3">
                {event.tags.map((tag) => (
                  <span
                    key={tag}
                    className="px-2.5 py-0.5 rounded-full bg-muted text-xs font-medium text-muted-foreground"
                  >
                    #{tag}
                  </span>
                ))}
              </div>
            )}
          </div>

          <p className="text-base text-muted-foreground leading-relaxed">
            {event.description}
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="flex items-start gap-3 p-4 rounded-xl bg-muted/50 border border-border">
              <div className="w-9 h-9 rounded-lg bg-violet-100 dark:bg-violet-950/40 flex items-center justify-center shrink-0">
                <Calendar className="h-4.5 w-4.5 text-violet-600 dark:text-violet-400" />
              </div>
              <div>
                <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                  Date & Time
                </p>
                <p className="text-sm font-medium text-foreground mt-0.5">
                  {format(startDate, "EEE, MMM d, yyyy")}
                </p>
                <p className="text-xs text-muted-foreground">
                  {format(startDate, "h:mm a")} – {format(endDate, "h:mm a")}
                </p>
              </div>
            </div>

            <div className="flex items-start gap-3 p-4 rounded-xl bg-muted/50 border border-border">
              <div className="w-9 h-9 rounded-lg bg-blue-100 dark:bg-blue-950/40 flex items-center justify-center shrink-0">
                <MapPin className="h-4.5 w-4.5 text-blue-600 dark:text-blue-400" />
              </div>
              <div>
                <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                  Venue
                </p>
                <p className="text-sm font-medium text-foreground mt-0.5">
                  {event.venue}
                </p>
                <p className="text-xs text-muted-foreground">
                  {event.address}, {event.city}
                </p>
              </div>
            </div>
          </div>

          {/* Organiser */}
          <div className="flex items-center gap-3 p-4 rounded-xl border border-border">
            <div className="w-10 h-10 rounded-full bg-linear-to-br from-violet-500 to-blue-500 flex items-center justify-center text-white text-sm font-bold shrink-0">
              {event.organizer?.firstName?.[0] || "O"}
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Organised by</p>
              <p className="text-sm font-semibold text-foreground">
                {event.organizer
                  ? `${event.organizer.firstName} ${event.organizer.lastName}`
                  : "EventTicket"}
              </p>
            </div>
          </div>
        </div>

        <div className="lg:col-span-1">
          <Card className="sticky top-24">
            <CardContent className="p-5 space-y-5">
              {/* Price */}
              <div className="flex items-end gap-1.5">
                <span className="text-3xl font-bold text-foreground">
                  ₹{event?.pricePerSeat}
                </span>
                <span className="text-sm text-muted-foreground pb-1">
                  /seat
                </span>
              </div>

              {/* Live availability */}
              <AvailabilitySection eventId={event.id} />

              {/* CTA */}
              {isSoldOut ? (
                <Button
                  disabled
                  className="w-full bg-muted text-muted-foreground hover:bg-muted cursor-not-allowed"
                >
                  Sold Out
                </Button>
              ) : isAuthenticated ? (
                <Link href={`/events/${event.id}/book`} passHref legacyBehavior>
                  <Button className="w-full bg-violet-600 hover:bg-violet-700 text-white shadow-sm shadow-violet-500/20">
                    Book Tickets
                  </Button>
                </Link>
              ) : (
                <Link href="/login" passHref legacyBehavior>
                  <Button className="w-full bg-violet-600 hover:bg-violet-700 text-white shadow-sm shadow-violet-500/20">
                    Sign in to Book
                  </Button>
                </Link>
              )}

              <p className="text-xs text-center text-muted-foreground">
                Free cancellation up to 24 hours before the event
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
