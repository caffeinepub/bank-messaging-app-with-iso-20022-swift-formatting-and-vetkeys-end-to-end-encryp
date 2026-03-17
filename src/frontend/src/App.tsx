import { Toaster } from "@/components/ui/sonner";
import {
  Outlet,
  RouterProvider,
  createRootRoute,
  createRoute,
  createRouter,
} from "@tanstack/react-router";
import AuthGate from "./components/auth/AuthGate";
import AppShell from "./components/layout/AppShell";
import ComposeMessagePage from "./pages/ComposeMessagePage";
import ContactsPage from "./pages/ContactsPage";
import DashboardPage from "./pages/DashboardPage";
import InboxPage from "./pages/InboxPage";
import MessageDetailPage from "./pages/MessageDetailPage";
import SendTokensPage from "./pages/SendTokensPage";

const rootRoute = createRootRoute({
  component: () => (
    <AuthGate>
      <AppShell>
        <Outlet />
      </AppShell>
    </AuthGate>
  ),
});

const indexRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/",
  component: DashboardPage,
});

const contactsRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/contacts",
  component: ContactsPage,
});

const composeRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/compose",
  component: ComposeMessagePage,
});

const inboxRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/inbox",
  component: InboxPage,
});

const sendTokensRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/send-tokens",
  component: SendTokensPage,
});

const messageDetailRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/message/$messageId",
  component: MessageDetailPage,
});

const routeTree = rootRoute.addChildren([
  indexRoute,
  contactsRoute,
  composeRoute,
  inboxRoute,
  sendTokensRoute,
  messageDetailRoute,
]);

const router = createRouter({ routeTree });

declare module "@tanstack/react-router" {
  interface Register {
    router: typeof router;
  }
}

export default function App() {
  return (
    <>
      <RouterProvider router={router} />
      <Toaster />
    </>
  );
}
