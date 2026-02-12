import { RouterProvider, createRouter, createRoute, createRootRoute, Outlet } from '@tanstack/react-router';
import { ThemeProvider } from 'next-themes';
import { Toaster } from '@/components/ui/sonner';
import AuthGate from './components/auth/AuthGate';
import AppShell from './components/layout/AppShell';
import DashboardPage from './pages/DashboardPage';
import ContactsPage from './pages/ContactsPage';
import ComposeMessagePage from './pages/ComposeMessagePage';
import InboxPage from './pages/InboxPage';
import MessageDetailPage from './pages/MessageDetailPage';

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
  path: '/',
  component: DashboardPage,
});

const contactsRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/contacts',
  component: ContactsPage,
});

const composeRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/compose',
  component: ComposeMessagePage,
});

const inboxRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/inbox',
  component: InboxPage,
});

const messageDetailRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/message/$messageId',
  component: MessageDetailPage,
});

const routeTree = rootRoute.addChildren([
  indexRoute,
  contactsRoute,
  composeRoute,
  inboxRoute,
  messageDetailRoute,
]);

const router = createRouter({ routeTree });

declare module '@tanstack/react-router' {
  interface Register {
    router: typeof router;
  }
}

export default function App() {
  return (
    <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
      <RouterProvider router={router} />
      <Toaster />
    </ThemeProvider>
  );
}
