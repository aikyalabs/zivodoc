import { QueryClient } from '@tanstack/react-query';
import { createRootRouteWithContext, Link, Outlet } from '@tanstack/react-router';
import { lazy } from 'react';

import { ErrorBoundary } from '@src/components/atoms/ErrorBoundary';
import { Button } from '@src/components/atoms/button';
import { Card, CardContent, CardHeader, CardTitle } from '@src/components/atoms/card';

const TanStackRouterDevtools = import.meta.env.DEV
  ? lazy(() =>
      import('@tanstack/react-router-devtools').then((mod) => ({
        default: mod.TanStackRouterDevtools,
      })),
    )
  : () => null;

interface RouterContext {
  queryClient: QueryClient;
}

function RootErrorComponent() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-background">
      <Card className="w-full max-w-md text-center">
        <CardHeader>
          <CardTitle className="text-destructive">Something went wrong</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col gap-4">
          <p className="text-sm text-muted-foreground">
            An unexpected error occurred. Please try again.
          </p>
          <Button onClick={() => window.location.reload()}>Reload page</Button>
        </CardContent>
      </Card>
    </div>
  );
}

function NotFoundComponent() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-background">
      <Card className="w-full max-w-md text-center">
        <CardHeader>
          <CardTitle className="text-4xl">404</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col gap-4">
          <p className="text-lg text-muted-foreground">Page not found</p>
          <p className="text-sm text-muted-foreground">
            The page you are looking for does not exist.
          </p>
          <Button asChild>
            <Link to="/dashboard">Go to Dashboard</Link>
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}

export const Route = createRootRouteWithContext<RouterContext>()({
  component: () => (
    <ErrorBoundary>
      <Outlet />
      <TanStackRouterDevtools position="bottom-right" />
    </ErrorBoundary>
  ),
  errorComponent: RootErrorComponent,
  notFoundComponent: NotFoundComponent,
});
