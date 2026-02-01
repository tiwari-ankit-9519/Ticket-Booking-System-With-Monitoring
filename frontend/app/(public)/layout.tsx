import Navbar from "@/components/shared/Navbar";
import Link from "next/link";
import { Ticket } from "lucide-react";

interface PublicLayoutProps {
  children: React.ReactNode;
}

export default function PublicLayout({ children }: PublicLayoutProps) {
  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Navbar />

      {/* Main content — top padding clears the fixed navbar */}
      <main className="flex-1 pt-16">{children}</main>

      {/* Footer */}
      <footer className="border-t border-border bg-background">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-10">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-8">
            {/* Brand */}
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-lg bg-linear-to-br from-violet-600 to-blue-600 flex items-center justify-center">
                  <Ticket className="h-4 w-4 text-white" />
                </div>
                <span className="text-base font-bold text-foreground">
                  Event<span className="text-violet-600">Ticket</span>
                </span>
              </div>
              <p className="text-sm text-muted-foreground leading-relaxed">
                Discover and book tickets for amazing events near you. Your
                one-stop destination for live experiences.
              </p>
            </div>

            {/* Links */}
            <div className="space-y-3">
              <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                Explore
              </h4>
              <nav className="flex flex-col gap-1.5">
                {[
                  { label: "All Events", href: "/events" },
                  { label: "Featured", href: "/events?isFeatured=true" },
                  {
                    label: "Upcoming",
                    href: "/events?sortBy=eventDate&sortOrder=asc",
                  },
                ].map((l) => (
                  <Link
                    key={l.label}
                    href={l.href}
                    className="text-sm text-muted-foreground hover:text-violet-600 dark:hover:text-violet-400 transition-colors"
                  >
                    {l.label}
                  </Link>
                ))}
              </nav>
            </div>

            {/* Legal */}
            <div className="space-y-3">
              <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                Legal
              </h4>
              <nav className="flex flex-col gap-1.5">
                {[
                  { label: "Privacy Policy", href: "/privacy" },
                  { label: "Terms of Service", href: "/terms" },
                  { label: "Contact Us", href: "/contact" },
                ].map((l) => (
                  <Link
                    key={l.label}
                    href={l.href}
                    className="text-sm text-muted-foreground hover:text-violet-600 dark:hover:text-violet-400 transition-colors"
                  >
                    {l.label}
                  </Link>
                ))}
              </nav>
            </div>
          </div>

          {/* Bottom bar */}
          <div className="mt-10 pt-6 border-t border-border flex flex-col sm:flex-row items-center justify-between gap-2">
            <p className="text-xs text-muted-foreground">
              © {new Date().getFullYear()} EventTicket. All rights reserved.
            </p>
            <p className="text-xs text-muted-foreground">
              Built with Next.js · Powered by TypeScript
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
