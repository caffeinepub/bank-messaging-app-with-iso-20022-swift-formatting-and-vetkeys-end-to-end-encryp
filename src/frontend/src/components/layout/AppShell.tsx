import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Link, useRouter } from "@tanstack/react-router";
import {
  ChevronDown,
  Inbox,
  LayoutDashboard,
  Lock,
  LogOut,
  Menu,
  PenSquare,
  Users,
  X,
} from "lucide-react";
import type { ReactNode } from "react";
import { useState } from "react";
import { useInternetIdentity } from "../../hooks/useInternetIdentity";
import { useCallerProfile } from "../../hooks/useQueries";

const navLinks = [
  { to: "/", label: "Dashboard", icon: LayoutDashboard },
  { to: "/contacts", label: "Contacts", icon: Users },
  { to: "/compose", label: "Compose", icon: PenSquare },
  { to: "/inbox", label: "Inbox", icon: Inbox },
];

export default function AppShell({ children }: { children: ReactNode }) {
  const { identity, clear } = useInternetIdentity();
  const { data: profile } = useCallerProfile();
  const router = useRouter();
  const [mobileOpen, setMobileOpen] = useState(false);

  const currentPath = router.state.location.pathname;
  const principal = identity?.getPrincipal().toString() ?? "";
  const shortPrincipal = principal
    ? `${principal.slice(0, 5)}...${principal.slice(-3)}`
    : "";

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Header */}
      <header className="sticky top-0 z-50 border-b border-border bg-background/95 backdrop-blur-sm">
        <div className="max-w-6xl mx-auto px-4 h-14 flex items-center justify-between">
          {/* Logo */}
          <Link
            to="/"
            className="flex items-center gap-2 group"
            data-ocid="nav.link"
          >
            <div className="w-7 h-7 rounded border border-primary/40 bg-primary/10 flex items-center justify-center">
              <Lock className="w-3.5 h-3.5 text-primary" />
            </div>
            <span className="font-mono text-sm font-bold tracking-tight text-foreground">
              OP_DUP
            </span>
          </Link>

          {/* Desktop Nav */}
          <nav className="hidden md:flex items-center gap-1">
            {navLinks.map(({ to, label, icon: Icon }) => (
              <Link
                key={to}
                to={to}
                className={`flex items-center gap-2 px-3 py-1.5 rounded-md text-sm transition-colors ${
                  currentPath === to
                    ? "bg-primary/15 text-primary font-medium"
                    : "text-muted-foreground hover:text-foreground hover:bg-secondary"
                }`}
                data-ocid={`nav.${label.toLowerCase()}.link`}
              >
                <Icon className="w-3.5 h-3.5" />
                {label}
              </Link>
            ))}
          </nav>

          {/* User Menu */}
          <div className="flex items-center gap-2">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="ghost"
                  size="sm"
                  className="hidden md:flex items-center gap-2 text-muted-foreground hover:text-foreground"
                  data-ocid="nav.dropdown_menu"
                >
                  <span className="font-mono text-xs">
                    {profile?.name ?? shortPrincipal}
                  </span>
                  <ChevronDown className="w-3.5 h-3.5" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-48">
                <DropdownMenuItem className="text-sm font-mono text-muted-foreground cursor-default">
                  {shortPrincipal}
                </DropdownMenuItem>
                <DropdownMenuItem
                  onClick={clear}
                  className="text-destructive focus:text-destructive cursor-pointer"
                  data-ocid="nav.logout.button"
                >
                  <LogOut className="w-3.5 h-3.5 mr-2" />
                  Sign Out
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>

            {/* Mobile menu toggle */}
            <Button
              variant="ghost"
              size="icon"
              className="md:hidden w-8 h-8"
              onClick={() => setMobileOpen((v) => !v)}
              data-ocid="nav.mobile.toggle"
            >
              {mobileOpen ? (
                <X className="w-4 h-4" />
              ) : (
                <Menu className="w-4 h-4" />
              )}
            </Button>
          </div>
        </div>

        {/* Mobile Nav */}
        {mobileOpen && (
          <div className="md:hidden border-t border-border bg-card">
            <nav className="max-w-6xl mx-auto px-4 py-3 flex flex-col gap-1">
              {navLinks.map(({ to, label, icon: Icon }) => (
                <Link
                  key={to}
                  to={to}
                  onClick={() => setMobileOpen(false)}
                  className={`flex items-center gap-3 px-3 py-2 rounded-md text-sm transition-colors ${
                    currentPath === to
                      ? "bg-primary/15 text-primary font-medium"
                      : "text-muted-foreground hover:text-foreground hover:bg-secondary"
                  }`}
                  data-ocid={`nav.mobile.${label.toLowerCase()}.link`}
                >
                  <Icon className="w-4 h-4" />
                  {label}
                </Link>
              ))}
              <button
                type="button"
                onClick={clear}
                className="flex items-center gap-3 px-3 py-2 rounded-md text-sm text-destructive hover:bg-destructive/10 transition-colors"
                data-ocid="nav.mobile.logout.button"
              >
                <LogOut className="w-4 h-4" />
                Sign Out
              </button>
            </nav>
          </div>
        )}
      </header>

      {/* Main Content */}
      <main className="flex-1 max-w-6xl w-full mx-auto px-4 py-6">
        {children}
      </main>

      {/* Footer */}
      <footer className="border-t border-border py-4 mt-auto">
        <div className="max-w-6xl mx-auto px-4 text-center">
          <p className="text-xs text-muted-foreground">
            © {new Date().getFullYear()}. Built with ♥ using{" "}
            <a
              href={`https://caffeine.ai?utm_source=caffeine-footer&utm_medium=referral&utm_content=${encodeURIComponent(window.location.hostname)}`}
              target="_blank"
              rel="noopener noreferrer"
              className="text-primary hover:underline"
            >
              caffeine.ai
            </a>
          </p>
        </div>
      </footer>
    </div>
  );
}
