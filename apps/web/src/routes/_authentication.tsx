import { createFileRoute } from '@tanstack/react-router';

import { ErrorBoundary } from '@src/components/atoms/ErrorBoundary';
import { Button } from '@src/components/atoms/button';
import { Card, CardContent, CardHeader, CardTitle } from '@src/components/atoms/card';
import { DashboardLayout } from '@src/components/templates/DashboardLayout';

export const Route = createFileRoute('/_authentication')({
  component: AuthenticatedLayout,
  errorComponent: () => (
    <div className="flex min-h-screen items-center justify-center bg-background">
      <Card className="w-full max-w-md text-center">
        <CardHeader>
          <CardTitle className="text-destructive">Something went wrong</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col gap-4">
          <p className="text-sm text-muted-foreground">
            An error occurred while loading this page.
          </p>
          <Button onClick={() => window.location.reload()}>Reload page</Button>
        </CardContent>
      </Card>
    </div>
  ),
});

function AuthenticatedLayout() {
  return (
    <ErrorBoundary>
      <DashboardLayout />
    </ErrorBoundary>
  );
}
