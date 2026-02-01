"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Menu, Ticket } from "lucide-react";
import { useAuthStore } from "@/stores/useAuthStore";
import SearchBar from "@/components/shared/SearchBar";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetTrigger,
  SheetClose,
} from "@/components/ui/sheet";
import { cn } from "@/lib/utils";

export default function Navbar() {
  const { user, isAuthenticated } = useAuthStore();
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const navLinks = [
    { label: "Events", href: "/events" },
    { label: "About", href: "/about" },
  ];

  const dashboardHref =
    user?.role === "USER"
      ? "/bookings"
      : user?.role === "ORGANIZER"
        ? "/organizer-dashboard"
        : "/admin-dashboard";

  return (
    <nav
      className={cn(
        "fixed top-0 inset-x-0 z-40 transition-all duration-300",
        scrolled
          ? "bg-background/90 backdrop-blur-md border-b border-border shadow-sm"
          : "bg-transparent",
      )}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6">
        <div className="flex items-center h-16 gap-4">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-2 shrink-0">
            <div className="w-8 h-8 rounded-lg bg-linear-to-br from-violet-600 to-blue-600 flex items-center justify-center shadow-sm">
              <Ticket className="h-4.5 w-4.5 text-white" />
            </div>
            <span className="text-lg font-bold text-foreground">
              Event<span className="text-violet-600">Ticket</span>
            </span>
          </Link>

          {/* Desktop nav links */}
          <div className="hidden md:flex items-center gap-1 shrink-0">
            {navLinks.map((l) => (
              <Link
                key={l.label}
                href={l.href}
                className="px-3 py-1.5 text-sm font-medium text-muted-foreground hover:text-foreground rounded-lg hover:bg-muted transition-colors"
              >
                {l.label}
              </Link>
            ))}
          </div>

          {/* Desktop search — grows to fill remaining space */}
          <div className="flex-1 max-w-xl mx-auto hidden md:block">
            <SearchBar />
          </div>

          {/* Desktop auth area */}
          <div className="hidden md:flex items-center gap-2 shrink-0 ml-auto">
            {isAuthenticated && user ? (
              <Link
                href={dashboardHref}
                className="flex items-center gap-2 px-3 py-1.5 rounded-lg hover:bg-muted transition-colors"
              >
                <div className="w-7 h-7 rounded-full bg-linear-to-br from-violet-500 to-blue-500 flex items-center justify-center text-white text-xs font-bold">
                  {user.firstName[0]}
                </div>
                <span className="text-sm font-medium text-foreground">
                  {user.firstName}
                </span>
              </Link>
            ) : (
              <>
                <Link href="/login">
                  <Button variant="ghost" size="sm">
                    Sign in
                  </Button>
                </Link>
                <Link href="/register">
                  <Button
                    size="sm"
                    className="bg-violet-600 hover:bg-violet-700 text-white shadow-sm shadow-violet-500/25"
                  >
                    Sign up
                  </Button>
                </Link>
              </>
            )}
          </div>

          {/* Mobile — Sheet trigger */}
          <Sheet>
            <SheetTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="md:hidden ml-auto text-muted-foreground hover:text-foreground"
              >
                <Menu className="h-5 w-5" />
              </Button>
            </SheetTrigger>

            <SheetContent
              side="right"
              className="w-75 sm:w-90 p-0 flex flex-col bg-background/95 backdrop-blur-md"
            >
              {/* Sheet header — logo row with close already rendered by SheetContent */}
              <div className="flex items-center gap-2 px-5 pt-5 pb-4">
                <div className="w-7 h-7 rounded-lg bg-linear-to-br from-violet-600 to-blue-600 flex items-center justify-center shadow-sm">
                  <Ticket className="h-3.5 w-3.5 text-white" />
                </div>
                <span className="text-base font-bold text-foreground">
                  Event<span className="text-violet-600">Ticket</span>
                </span>
              </div>

              {/* Search */}
              <div className="px-4 pb-3">
                <SearchBar />
              </div>

              {/* Nav links */}
              <div className="flex flex-col gap-0.5 px-3 border-t border-border pt-3">
                {navLinks.map((l) => (
                  <SheetClose key={l.label} asChild>
                    <Link
                      href={l.href}
                      className="px-3 py-2.5 text-sm font-medium text-foreground rounded-lg hover:bg-muted transition-colors"
                    >
                      {l.label}
                    </Link>
                  </SheetClose>
                ))}
              </div>

              {/* Auth section — pushed to bottom */}
              <div className="mt-auto border-t border-border px-3 py-4 flex flex-col gap-2">
                {isAuthenticated && user ? (
                  <SheetClose asChild>
                    <Link
                      href={dashboardHref}
                      className="flex items-center gap-2.5 px-3 py-2.5 rounded-lg hover:bg-muted transition-colors"
                    >
                      <div className="w-8 h-8 rounded-full bg-linear-to-br from-violet-500 to-blue-500 flex items-center justify-center text-white text-xs font-bold">
                        {user.firstName[0]}
                      </div>
                      <div className="flex flex-col">
                        <span className="text-sm font-medium text-foreground">
                          {user.firstName}
                        </span>
                        <span className="text-xs text-muted-foreground">
                          {user.role.charAt(0) +
                            user.role.slice(1).toLowerCase()}
                        </span>
                      </div>
                    </Link>
                  </SheetClose>
                ) : (
                  <>
                    <SheetClose asChild>
                      <Link href="/login">
                        <Button variant="outline" className="w-full">
                          Sign in
                        </Button>
                      </Link>
                    </SheetClose>
                    <SheetClose asChild>
                      <Link href="/register">
                        <Button className="w-full bg-violet-600 hover:bg-violet-700 text-white shadow-sm shadow-violet-500/25">
                          Sign up
                        </Button>
                      </Link>
                    </SheetClose>
                  </>
                )}
              </div>
            </SheetContent>
          </Sheet>
        </div>
      </div>
    </nav>
  );
}
