import { createFileRoute } from '@tanstack/react-router';
import { Building2, Calendar, Globe } from 'lucide-react';

import { Badge } from '@src/components/atoms/badge';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@src/components/atoms/card';
import { Skeleton } from '@src/components/atoms/skeleton';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@src/components/atoms/table';
import { CreateOrganizationDialog } from '@src/components/molecules/CreateOrganizationDialog';
import { useOrganization } from '@src/hooks/queries/useOrganization';
import { useProfile } from '@src/hooks/useProfile';

export const Route = createFileRoute('/_authentication/organizations')({
  component: OrganizationsPage,
});

function OrganizationsPage() {
  const { data, isLoading, isError, error } = useOrganization();
  const { data: profile } = useProfile();

  const isAdmin = profile?.role === 'admin';
  const orgs = data?.payload ?? [];

  if (isError) {
    return (
      <div className="flex flex-col gap-6">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Organizations</h2>
          <p className="text-muted-foreground">
            {isAdmin
              ? 'Manage all organizations on the platform.'
              : 'View your organization details.'}
          </p>
        </div>
        <Card className="border-destructive/50 bg-destructive/10">
          <CardContent className="py-6 text-center">
            <p className="text-sm text-destructive">
              Failed to load organizations: {error?.message || 'An unexpected error occurred.'}
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Platform admin: show all orgs as a table
  if (isAdmin) {
    return (
      <div className="flex flex-col gap-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold tracking-tight">Organizations</h2>
            <p className="text-muted-foreground">Manage all organizations on the platform.</p>
          </div>
          <CreateOrganizationDialog />
        </div>

        <Table>
          <TableHeader>
            <TableRow className="hover:bg-transparent">
              <TableHead className="px-4">Name</TableHead>
              <TableHead className="px-4">Slug</TableHead>
              <TableHead className="px-4">Created</TableHead>
              <TableHead className="px-4">Last Updated</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              Array.from({ length: 3 }).map((_, i) => (
                <TableRow key={i}>
                  <TableCell className="px-4 py-3">
                    <Skeleton className="h-4 w-40" />
                  </TableCell>
                  <TableCell className="px-4 py-3">
                    <Skeleton className="h-4 w-28" />
                  </TableCell>
                  <TableCell className="px-4 py-3">
                    <Skeleton className="h-4 w-24" />
                  </TableCell>
                  <TableCell className="px-4 py-3">
                    <Skeleton className="h-4 w-32" />
                  </TableCell>
                </TableRow>
              ))
            ) : orgs.length === 0 ? (
              <TableRow className="hover:bg-transparent">
                <TableCell colSpan={4} className="h-32 text-center text-muted-foreground">
                  No organizations found.
                </TableCell>
              </TableRow>
            ) : (
              orgs.map((org) => (
                <TableRow key={org.id}>
                  <TableCell className="px-4 py-3 font-medium">{org.name}</TableCell>
                  <TableCell className="px-4 py-3">
                    <Badge variant="outline" className="font-mono">
                      {org.slug}
                    </Badge>
                  </TableCell>
                  <TableCell className="px-4 py-3 text-muted-foreground">
                    {new Date(org.createdAt).toLocaleDateString()}
                  </TableCell>
                  <TableCell className="px-4 py-3 text-muted-foreground">
                    {new Date(org.updatedAt).toLocaleString()}
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
    );
  }

  // Org user: show single org details
  const org = orgs[0];

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h2 className="text-2xl font-bold tracking-tight">Organization</h2>
        <p className="text-muted-foreground">View your organization details.</p>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Organization Name</CardTitle>
            <Building2 className="size-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <Skeleton className="h-7 w-40" />
            ) : (
              <div className="text-2xl font-bold">{org?.name ?? '—'}</div>
            )}
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Slug</CardTitle>
            <Globe className="size-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <Skeleton className="h-7 w-32" />
            ) : (
              <div className="text-2xl font-bold">{org?.slug ?? '—'}</div>
            )}
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Created</CardTitle>
            <Calendar className="size-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <Skeleton className="h-7 w-28" />
            ) : (
              <div className="text-2xl font-bold">
                {org?.createdAt ? new Date(org.createdAt).toLocaleDateString() : '—'}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {org && (
        <Card>
          <CardHeader>
            <CardTitle>Details</CardTitle>
            <CardDescription>Full organization information</CardDescription>
          </CardHeader>
          <CardContent>
            <dl className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-1">
                <dt className="text-sm font-medium text-muted-foreground">ID</dt>
                <dd className="font-mono text-sm">{org.id}</dd>
              </div>
              <div className="space-y-1">
                <dt className="text-sm font-medium text-muted-foreground">Name</dt>
                <dd className="text-sm">{org.name}</dd>
              </div>
              <div className="space-y-1">
                <dt className="text-sm font-medium text-muted-foreground">Slug</dt>
                <dd className="font-mono text-sm">{org.slug}</dd>
              </div>
              <div className="space-y-1">
                <dt className="text-sm font-medium text-muted-foreground">Last Updated</dt>
                <dd className="text-sm">{new Date(org.updatedAt).toLocaleString()}</dd>
              </div>
            </dl>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
