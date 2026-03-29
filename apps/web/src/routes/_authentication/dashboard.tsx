import { createFileRoute } from '@tanstack/react-router';
import { Activity, Building2, Users } from 'lucide-react';

import { Card, CardContent, CardHeader, CardTitle } from '@src/components/atoms/card';
import { Skeleton } from '@src/components/atoms/skeleton';
import { useProfile } from '@src/hooks/useProfile';

export const Route = createFileRoute('/_authentication/dashboard')({
  component: DashboardPage,
});

function DashboardPage() {
  const { data: profile, isLoading, isError, error } = useProfile();

  if (isError) {
    return (
      <div className="flex flex-col gap-6">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Dashboard</h2>
        </div>
        <Card className="border-destructive/50 bg-destructive/10">
          <CardContent className="py-6 text-center">
            <p className="text-sm text-destructive">
              Failed to load dashboard: {error?.message || 'An unexpected error occurred.'}
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h2 className="text-2xl font-bold tracking-tight">Dashboard</h2>
        <p className="text-muted-foreground">
          {isLoading ? (
            <Skeleton className="mt-1 h-4 w-48" />
          ) : (
            <>Welcome back{profile ? `, ${profile.firstName}` : ''}.</>
          )}
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Users</CardTitle>
            <Users className="size-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <Skeleton className="h-8 w-16" />
            ) : (
              <div className="text-2xl font-bold">&mdash;</div>
            )}
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Sessions</CardTitle>
            <Activity className="size-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <Skeleton className="h-8 w-16" />
            ) : (
              <div className="text-2xl font-bold">&mdash;</div>
            )}
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Organizations</CardTitle>
            <Building2 className="size-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <Skeleton className="h-8 w-16" />
            ) : (
              <div className="text-2xl font-bold">&mdash;</div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
