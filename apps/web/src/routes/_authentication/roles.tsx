import { createFileRoute } from '@tanstack/react-router';

import { Badge } from '@src/components/atoms/badge';
import { Card, CardContent } from '@src/components/atoms/card';
import { Skeleton } from '@src/components/atoms/skeleton';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@src/components/atoms/table';
import { useProfile } from '@src/hooks/useProfile';
import { useRoles } from '@src/hooks/queries/useRoles';

export const Route = createFileRoute('/_authentication/roles')({
  component: RolesPage,
});

function RolesPage() {
  const { data: profile } = useProfile();
  const { data, isLoading, isError, error } = useRoles();

  const isAdmin = profile?.role === 'admin' || profile?.role === 'owner';

  const roles = data?.payload ?? [];

  const colCount = isAdmin ? 5 : 4;

  if (isError) {
    return (
      <div className="flex flex-col gap-6">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Roles</h2>
          <p className="text-muted-foreground">View roles and permissions.</p>
        </div>
        <Card className="border-destructive/50 bg-destructive/10">
          <CardContent className="py-6 text-center">
            <p className="text-sm text-destructive">
              Failed to load roles: {error?.message || 'An unexpected error occurred.'}
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h2 className="text-2xl font-bold tracking-tight">Roles</h2>
        <p className="text-muted-foreground">View roles and permissions.</p>
      </div>

      <Table>
        <TableHeader>
          <TableRow className="hover:bg-transparent">
            <TableHead className="px-4">Name</TableHead>
            <TableHead className="px-4">Description</TableHead>
            <TableHead className="px-4">Permissions</TableHead>
            {isAdmin && <TableHead className="px-4">Organization</TableHead>}
            <TableHead className="px-4">Created</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {isLoading ? (
            Array.from({ length: 5 }).map((_, i) => (
              <TableRow key={i}>
                <TableCell className="px-4 py-3">
                  <Skeleton className="h-4 w-24" />
                </TableCell>
                <TableCell className="px-4 py-3">
                  <Skeleton className="h-4 w-40" />
                </TableCell>
                <TableCell className="px-4 py-3">
                  <Skeleton className="h-5 w-32" />
                </TableCell>
                {isAdmin && (
                  <TableCell className="px-4 py-3">
                    <Skeleton className="h-4 w-24" />
                  </TableCell>
                )}
                <TableCell className="px-4 py-3">
                  <Skeleton className="h-4 w-24" />
                </TableCell>
              </TableRow>
            ))
          ) : roles.length === 0 ? (
            <TableRow className="hover:bg-transparent">
              <TableCell colSpan={colCount} className="h-32 text-center text-muted-foreground">
                No roles found.
              </TableCell>
            </TableRow>
          ) : (
            roles.map((role) => (
              <TableRow key={role.id}>
                <TableCell className="px-4 py-3 font-medium">{role.name}</TableCell>
                <TableCell className="px-4 py-3 text-muted-foreground">
                  {role.description || '--'}
                </TableCell>
                <TableCell className="px-4 py-3">
                  <div className="flex flex-wrap gap-1">
                    {role.permissions.length === 0 ? (
                      <span className="text-muted-foreground">None</span>
                    ) : (
                      role.permissions.map((perm) => (
                        <Badge key={perm.resource} variant="secondary">
                          {perm.resource}: {perm.actions.join(', ')}
                        </Badge>
                      ))
                    )}
                  </div>
                </TableCell>
                {isAdmin && (
                  <TableCell className="px-4 py-3 text-muted-foreground">
                    {role.organizationId}
                  </TableCell>
                )}
                <TableCell className="px-4 py-3 text-muted-foreground">
                  {new Date(role.createdAt).toLocaleDateString()}
                </TableCell>
              </TableRow>
            ))
          )}
        </TableBody>
      </Table>
    </div>
  );
}
