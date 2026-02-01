"use client";

import { Sparkles, Calendar, Users, TrendingUp } from "lucide-react";
import Link from "next/link";
import SearchBar from "@/components/shared/SearchBar";
import EventCarousel from "@/components/shared/EventCarousel";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { useFeaturedEvents, useUpcomingEvents } from "@/hooks/useEvents";

function CarouselSkeleton() {
  return (
    <div className="space-y-3">
      <div className="h-5 w-40 rounded bg-muted animate-pulse" />
      <div className="flex gap-4 overflow-hidden">
        {[...Array(3)].map((_, i) => (
          <div
            key={i}
            className="shrink-0 w-72 rounded-xl border border-border overflow-hidden bg-card"
          >
            <div className="h-44 bg-muted animate-pulse" />
            <div className="p-4 space-y-2.5">
              <div className="h-2.5 w-16 rounded bg-muted animate-pulse" />
              <div className="h-4 w-48 rounded bg-muted animate-pulse" />
              <div className="h-3 w-36 rounded bg-muted animate-pulse" />
              <div className="h-3 w-40 rounded bg-muted animate-pulse" />
              <div className="h-1.5 w-full rounded bg-muted animate-pulse mt-2" />
              <div className="flex justify-between pt-2 border-t border-border">
                <div className="h-5 w-20 rounded bg-muted animate-pulse" />
                <div className="h-3 w-16 rounded bg-muted animate-pulse" />
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

const STATS = [
  { icon: Calendar, label: "Live Events", value: "500+" },
  { icon: Users, label: "Happy Attendees", value: "50K+" },
  { icon: TrendingUp, label: "Cities", value: "25+" },
];

const CATEGORIES = ["Music", "Sports", "Technology", "Food", "Arts"];

function StatsBar() {
  return (
    <div className="max-w-4xl mx-auto">
      <Separator />
      <div className="grid grid-cols-3 gap-4 sm:gap-8 py-6">
        {STATS.map((s) => (
          <div key={s.label} className="flex flex-col items-center gap-1">
            <div className="w-10 h-10 rounded-lg bg-violet-100 dark:bg-violet-950/40 flex items-center justify-center">
              <s.icon className="h-5 w-5 text-violet-600 dark:text-violet-400" />
            </div>
            <span className="text-xl font-bold text-foreground">{s.value}</span>
            <span className="text-xs text-muted-foreground text-center">
              {s.label}
            </span>
          </div>
        ))}
      </div>
      <Separator />
    </div>
  );
}

export default function HomePage() {
  const { data: featured, isLoading: featuredLoading } = useFeaturedEvents();
  const { data: upcoming, isLoading: upcomingLoading } = useUpcomingEvents(12);

  return (
    <div className="min-h-screen">
      {/* ── Hero ── */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 bg-linear-to-br from-violet-50 via-background to-blue-50 dark:from-violet-950/20 dark:via-background dark:to-blue-950/20" />
        <div className="absolute top-10 left-10 w-80 h-80 bg-violet-200 dark:bg-violet-900/20 rounded-full mix-blend-multiply dark:mix-blend-soft-light filter blur-3xl opacity-50 animate-blob" />
        <div className="absolute top-24 right-10 w-72 h-72 bg-blue-200 dark:bg-blue-900/20 rounded-full mix-blend-multiply dark:mix-blend-soft-light filter blur-3xl opacity-50 animate-blob animation-delay-2000" />
        <div className="absolute -bottom-16 left-1/2 w-80 h-80 bg-pink-200 dark:bg-pink-900/20 rounded-full mix-blend-multiply dark:mix-blend-soft-light filter blur-3xl opacity-50 animate-blob animation-delay-4000" />

        <div className="relative z-10 max-w-5xl mx-auto px-4 sm:px-6 pt-24 pb-20 text-center">
          {/* Badge */}
          <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-violet-100 dark:bg-violet-950/40 text-violet-700 dark:text-violet-300 text-sm font-medium mb-6">
            <Sparkles className="w-4 h-4" />
            Discover your next great experience
          </div>

          {/* Headline */}
          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-foreground leading-tight tracking-tight">
            Find & Book{" "}
            <span className="bg-linear-to-r from-violet-600 to-blue-600 bg-clip-text text-transparent">
              Amazing Events
            </span>{" "}
            Near You
          </h1>
          <p className="mt-4 text-lg text-muted-foreground max-w-2xl mx-auto leading-relaxed">
            From live concerts to tech conferences, sports tournaments to food
            festivals — your perfect event is waiting.
          </p>

          {/* Hero search */}
          <div className="mt-8 max-w-2xl mx-auto">
            <SearchBar className="shadow-lg" />
          </div>

          {/* Popular categories quick-links */}
          <div className="mt-6 flex flex-wrap justify-center gap-2">
            {CATEGORIES.map((cat) => (
              <Link
                key={cat}
                href={`/events?category=${cat}`}
                passHref
                legacyBehavior
              >
                <Button
                  variant="outline"
                  size="sm"
                  className="rounded-full text-muted-foreground bg-background/80 backdrop-blur-sm hover:border-violet-400 hover:text-violet-600 dark:hover:text-violet-400"
                >
                  {cat}
                </Button>
              </Link>
            ))}
          </div>
        </div>

        <style>{`
          @keyframes blob {
            0%   { transform: translate(0px, 0px) scale(1); }
            33%  { transform: translate(30px, -50px) scale(1.1); }
            66%  { transform: translate(-20px, 20px) scale(0.9); }
            100% { transform: translate(0px, 0px) scale(1); }
          }
          .animate-blob { animation: blob 7s infinite; }
          .animation-delay-2000 { animation-delay: 2s; }
          .animation-delay-4000 { animation-delay: 4s; }
        `}</style>
      </section>

      <StatsBar />

      <section className="max-w-7xl mx-auto px-4 sm:px-6 py-12">
        {featuredLoading ? (
          <CarouselSkeleton />
        ) : (
          <EventCarousel
            events={featured || []}
            title="⭐ Featured Events"
            subtitle="Handpicked events you don't want to miss"
            autoPlay
          />
        )}
      </section>

      {/* ── Upcoming Events ── */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 pb-16">
        {upcomingLoading ? (
          <CarouselSkeleton />
        ) : (
          <EventCarousel
            events={upcoming || []}
            title="📅 Upcoming Events"
            subtitle="What's happening soon in your area"
          />
        )}
      </section>

      {/* ── CTA Banner ── */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 pb-20">
        <div className="relative overflow-hidden rounded-2xl bg-linear-to-r from-violet-600 to-blue-600 p-8 sm:p-12 text-center">
          <div className="absolute -top-16 -right-16 w-48 h-48 bg-white/10 rounded-full" />
          <div className="absolute -bottom-12 -left-12 w-40 h-40 bg-white/10 rounded-full" />
          <div className="relative z-10">
            <h2 className="text-2xl sm:text-3xl font-bold text-white">
              Ready to experience something amazing?
            </h2>
            <p className="mt-2 text-violet-100 text-base max-w-xl mx-auto">
              Browse thousands of events or sign up to get personalised
              recommendations straight to your inbox.
            </p>
            <div className="mt-6 flex flex-col sm:flex-row items-center justify-center gap-3">
              <Link href="/events" passHref legacyBehavior>
                <Button className="px-6 h-10 rounded-lg bg-white text-violet-700 hover:bg-white/90 font-semibold shadow hover:shadow-md transition-all hover:-translate-y-0.5">
                  Browse Events
                </Button>
              </Link>
              <Link href="/register" passHref legacyBehavior>
                <Button
                  variant="outline"
                  className="px-6 h-10 rounded-lg border-white/40 text-white hover:bg-white/10 hover:text-white hover:border-white/60 font-semibold"
                >
                  Sign Up Free
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
