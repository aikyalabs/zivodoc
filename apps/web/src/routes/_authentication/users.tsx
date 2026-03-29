import { createFileRoute, useNavigate } from '@tanstack/react-router';
import { ChevronLeft, ChevronRight, MoreHorizontal } from 'lucide-react';
import { z } from 'zod';

import { Badge } from '@src/components/atoms/badge';
import { Button } from '@src/components/atoms/button';
import { Card, CardContent } from '@src/components/atoms/card';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@src/components/atoms/dropdown-menu';
import { Skeleton } from '@src/components/atoms/skeleton';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@src/components/atoms/table';
import { CreateUserDialog } from '@src/components/molecules/CreateUserDialog';
import { useToggleUserStatus } from '@src/hooks/mutations/useToggleUserStatus';
import { useProfile } from '@src/hooks/useProfile';
import { useUsers, usersQueryOptions } from '@src/hooks/queries/useUsers';

const usersSearchSchema = z.object({
  page: z.number().optional().default(1),
});

const LIMIT = 20;

export const Route = createFileRoute('/_authentication/users')({
  validateSearch: usersSearchSchema,
  loaderDeps: ({ search: { page } }) => ({ page }),
  loader: ({ context: { queryClient }, deps: { page } }) => {
    const offset = (page - 1) * LIMIT;
    return queryClient.ensureQueryData(usersQueryOptions({ limit: LIMIT, offset }));
  },
  component: UsersPage,
});

function getPageNumbers(current: number, total: number): (number | 'ellipsis')[] {
  if (total <= 7) return Array.from({ length: total }, (_, i) => i + 1);
  const pages: (number | 'ellipsis')[] = [1];
  if (current > 3) pages.push('ellipsis');
  for (let i = Math.max(2, current - 1); i <= Math.min(total - 1, current + 1); i++) {
    pages.push(i);
  }
  if (current < total - 2) pages.push('ellipsis');
  pages.push(total);
  return pages;
}

function UsersPage() {
  const { page } = Route.useSearch();
  const navigate = useNavigate();
  const { data: profile } = useProfile();
  const toggleStatus = useToggleUserStatus();

  const isPrivileged = profile?.role === 'admin' || profile?.role === 'owner';

  const offset = (page - 1) * LIMIT;
  const { data, isLoading, isError, error } = useUsers({ limit: LIMIT, offset });

  const users = data?.payload ?? [];
  const total = data?.meta?.total ?? 0;
  const totalPages = Math.ceil(total / LIMIT);

  const goToPage = (newPage: number) => {
    navigate({ search: { page: newPage } });
  };

  if (isError) {
    return (
      <div className="flex flex-col gap-6">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Users</h2>
          <p className="text-muted-foreground">Manage your organization's users.</p>
        </div>
        <Card className="border-destructive/50 bg-destructive/10">
          <CardContent className="py-6 text-center">
            <p className="text-sm text-destructive">
              Failed to load users: {error?.message || 'An unexpected error occurred.'}
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  const colCount = isPrivileged ? 6 : 5;

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Users</h2>
          <p className="text-muted-foreground">Manage your organization's users.</p>
        </div>
        {isPrivileged && <CreateUserDialog />}
      </div>

      <Table>
        <TableHeader>
          <TableRow className="hover:bg-transparent">
            <TableHead className="px-4">Name</TableHead>
            <TableHead className="px-4">Email</TableHead>
            <TableHead className="px-4">Role</TableHead>
            <TableHead className="px-4">Status</TableHead>
            <TableHead className="px-4">Created</TableHead>
            {isPrivileged && <TableHead className="w-10 px-4" />}
          </TableRow>
        </TableHeader>
        <TableBody>
          {isLoading ? (
            Array.from({ length: 5 }).map((_, i) => (
              <TableRow key={i}>
                <TableCell className="px-4 py-3">
                  <Skeleton className="h-4 w-32" />
                </TableCell>
                <TableCell className="px-4 py-3">
                  <Skeleton className="h-4 w-48" />
                </TableCell>
                <TableCell className="px-4 py-3">
                  <Skeleton className="h-5 w-16" />
                </TableCell>
                <TableCell className="px-4 py-3">
                  <Skeleton className="h-5 w-16" />
                </TableCell>
                <TableCell className="px-4 py-3">
                  <Skeleton className="h-4 w-24" />
                </TableCell>
                {isPrivileged && (
                  <TableCell className="px-4 py-3">
                    <Skeleton className="size-8" />
                  </TableCell>
                )}
              </TableRow>
            ))
          ) : users.length === 0 ? (
            <TableRow className="hover:bg-transparent">
              <TableCell colSpan={colCount} className="h-32 text-center text-muted-foreground">
                No users found.
              </TableCell>
            </TableRow>
          ) : (
            users.map((user) => (
              <TableRow key={user.id} className={user.isDisabled ? 'opacity-50' : undefined}>
                <TableCell className="px-4 py-3 font-medium">
                  {user.firstName} {user.lastName}
                </TableCell>
                <TableCell className="px-4 py-3 text-muted-foreground">{user.email}</TableCell>
                <TableCell className="px-4 py-3">
                  <Badge
                    variant={
                      user.role === 'owner'
                        ? 'default'
                        : user.role === 'admin'
                          ? 'secondary'
                          : 'outline'
                    }
                  >
                    {user.role}
                  </Badge>
                </TableCell>
                <TableCell className="px-4 py-3">
                  <Badge variant={user.isDisabled ? 'destructive' : 'outline'}>
                    {user.isDisabled ? 'Disabled' : 'Active'}
                  </Badge>
                </TableCell>
                <TableCell className="px-4 py-3 text-muted-foreground">
                  {new Date(user.createdAt).toLocaleDateString()}
                </TableCell>
                {isPrivileged && (
                  <TableCell className="px-4 py-3">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" className="size-8">
                          <MoreHorizontal className="size-4" />
                          <span className="sr-only">Actions</span>
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem
                          onClick={() =>
                            toggleStatus.mutate({
                              userId: user.id,
                              isDisabled: !user.isDisabled,
                            })
                          }
                          disabled={user.role === 'owner'}
                        >
                          {user.isDisabled ? 'Enable User' : 'Disable User'}
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem
                          className="text-destructive focus:text-destructive"
                          disabled
                        >
                          Delete User
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                )}
              </TableRow>
            ))
          )}
        </TableBody>
      </Table>

      {totalPages > 1 && (
        <div className="flex items-center justify-between pt-2">
          <p className="text-sm text-muted-foreground">
            Showing {offset + 1}–{Math.min(offset + LIMIT, total)} of {total}
          </p>
          <div className="flex items-center gap-1">
            <Button
              variant="ghost"
              size="icon-sm"
              onClick={() => goToPage(page - 1)}
              disabled={page <= 1}
            >
              <ChevronLeft className="size-4" />
            </Button>
            {getPageNumbers(page, totalPages).map((p, i) =>
              p === 'ellipsis' ? (
                <span key={`e${i}`} className="px-1 text-sm text-muted-foreground">
                  ...
                </span>
              ) : (
                <Button
                  key={p}
                  variant={p === page ? 'default' : 'ghost'}
                  size="icon-sm"
                  onClick={() => goToPage(p)}
                >
                  {p}
                </Button>
              ),
            )}
            <Button
              variant="ghost"
              size="icon-sm"
              onClick={() => goToPage(page + 1)}
              disabled={page >= totalPages}
            >
              <ChevronRight className="size-4" />
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
