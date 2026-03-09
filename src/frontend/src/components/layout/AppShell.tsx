import LoginButton from "@/components/auth/LoginButton";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { useNavigate, useRouterState } from "@tanstack/react-router";
import { Home, Inbox, Send, Users } from "lucide-react";
import type { ReactNode } from "react";
import { SiCoffeescript } from "react-icons/si";

interface AppShellProps {
  children: ReactNode;
}

export default function AppShell({ children }: AppShellProps) {
  const navigate = useNavigate();
  const routerState = useRouterState();
  const currentPath = routerState.location.pathname;

  const navItems = [
    { path: "/", label: "Dashboard", icon: Home },
    { path: "/contacts", label: "Contacts", icon: Users },
    { path: "/compose", label: "Compose", icon: Send },
    { path: "/inbox", label: "Inbox", icon: Inbox },
  ];

  return (
    <div className="flex min-h-screen flex-col bg-background">
      <header className="sticky top-0 z-50 w-full border-b bg-card/95 backdrop-blur supports-[backdrop-filter]:bg-card/60">
        <div className="container flex h-16 items-center justify-between px-4">
          <div className="flex items-center gap-6">
            <h1 className="text-lg font-semibold tracking-tight">
              OP_DUP Secure Messages
            </h1>
            <nav className="hidden md:flex items-center gap-1">
              {navItems.map((item) => {
                const Icon = item.icon;
                const isActive = currentPath === item.path;
                return (
                  <Button
                    key={item.path}
                    variant={isActive ? "secondary" : "ghost"}
                    size="sm"
                    onClick={() => navigate({ to: item.path })}
                    className="gap-2"
                  >
                    <Icon className="h-4 w-4" />
                    {item.label}
                  </Button>
                );
              })}
            </nav>
          </div>
          <LoginButton />
        </div>
      </header>

      <main className="flex-1 container px-4 py-6">{children}</main>

      <footer className="border-t bg-card/50 py-6">
        <div className="container px-4 text-center text-sm text-muted-foreground">
          <p className="flex items-center justify-center gap-1">
            © {new Date().getFullYear()} • Built with{" "}
            <SiCoffeescript className="h-4 w-4 text-primary" /> using{" "}
            <a
              href={`https://caffeine.ai/?utm_source=Caffeine-footer&utm_medium=referral&utm_content=${encodeURIComponent(
                window.location.hostname || "op-dup-secure-messages",
              )}`}
              target="_blank"
              rel="noopener noreferrer"
              className="font-medium text-foreground hover:text-primary transition-colors"
            >
              caffeine.ai
            </a>
          </p>
        </div>
      </footer>
    </div>
  );
}
