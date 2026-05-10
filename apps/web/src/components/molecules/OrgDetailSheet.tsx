import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { AlertTriangle } from 'lucide-react';

import { Badge } from '@src/components/atoms/badge';
import { Button } from '@src/components/atoms/button';
import { Skeleton } from '@src/components/atoms/skeleton';
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from '@src/components/atoms/sheet';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@src/components/atoms/tabs';
import { ConfirmDialog } from '@src/components/molecules/ConfirmDialog';
import { apiClient } from '@src/lib/queries/defaultQueryFn';
import { formatRelativeTime } from '@src/lib/formatters';

import type { ApiOkResponse, PlanType, ScanStatus, UserRole } from '@zivodoc/shared';

interface OrgDetail {
  organization: {
    id: string;
    name: string;
    slug: string;
    plan: PlanType;
    scanQuota: number;
    scansUsedThisMonth: number;
    maxPages: number;
    maxProjects: number;
    createdAt: string;
  };
  users: {
    id: string;
    email: string;
    firstName: string;
    lastName: string;
    role: UserRole;
    isDisabled: boolean;
  }[];
  projects: {
    id: string;
    name: string;
    siteUrl: string | null;
    repoUrl: string | null;
    scanMode: 'site' | 'repo';
  }[];
  recentScans: {
    id: string;
    projectId: string;
    status: ScanStatus;
    findingsCount: number;
    duration: number | null;
    createdAt: string;
  }[];
}

interface Props {
  orgId: string | null;
  onClose: () => void;
}

export function OrgDetailSheet({ orgId, onClose }: Props) {
  const queryClient = useQueryClient();
  const [confirmSuspend, setConfirmSuspend] = useState(false);

  const { data, isLoading } = useQuery({
    enabled: orgId != null,
    queryKey: ['admin', 'organizations', orgId, 'detail'],
    queryFn: async () => {
      const r = await apiClient.get<ApiOkResponse<OrgDetail>>(
        `/admin/organizations/${orgId}/detail`,
      );
      return r.data.payload;
    },
  });

  const suspend = useMutation({
    mutationFn: async () => {
      const r = await apiClient.post<ApiOkResponse<{ disabledCount: number }>>(
        `/admin/organizations/${orgId}/suspend`,
      );
      return r.data.payload;
    },
    onSuccess: ({ disabledCount }) => {
      toast.success(`Disabled ${disabledCount} member${disabledCount === 1 ? '' : 's'}.`);
      queryClient.invalidateQueries({ queryKey: ['admin', 'organizations'] });
      queryClient.invalidateQueries({ queryKey: ['admin', 'users'] });
      setConfirmSuspend(false);
    },
    onError: () => toast.error('Failed to suspend organization.'),
  });

  return (
    <Sheet open={orgId != null} onOpenChange={(open) => !open && onClose()}>
      <SheetContent className="w-full sm:max-w-2xl overflow-y-auto p-6">
        {isLoading || !data ? (
          <div className="flex flex-col gap-4">
            <Skeleton className="h-8 w-1/2" />
            <Skeleton className="h-32 w-full" />
            <Skeleton className="h-32 w-full" />
          </div>
        ) : (
          <>
            <SheetHeader>
              <SheetTitle>{data.organization.name}</SheetTitle>
              <SheetDescription>
                <code className="text-xs">{data.organization.slug}</code> · created{' '}
                {formatRelativeTime(data.organization.createdAt)}
              </SheetDescription>
            </SheetHeader>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-6">
              <Stat label="Plan" value={data.organization.plan} />
              <Stat
                label="Scans"
                value={`${data.organization.scansUsedThisMonth} / ${data.organization.scanQuota}`}
              />
              <Stat label="Projects max" value={data.organization.maxProjects} />
              <Stat label="Pages max" value={data.organization.maxPages} />
            </div>

            <Tabs defaultValue="users" className="mt-6">
              <TabsList>
                <TabsTrigger value="users">Users ({data.users.length})</TabsTrigger>
                <TabsTrigger value="projects">Projects ({data.projects.length})</TabsTrigger>
                <TabsTrigger value="scans">Recent scans ({data.recentScans.length})</TabsTrigger>
              </TabsList>

              <TabsContent value="users" className="flex flex-col gap-2 mt-4">
                {data.users.length === 0 ? (
                  <Empty text="No users in this org." />
                ) : (
                  data.users.map((u) => (
                    <Row
                      key={u.id}
                      title={u.email}
                      subtitle={`${u.firstName} ${u.lastName}`.trim()}
                      right={
                        <div className="flex items-center gap-2">
                          <Badge variant="muted">{u.role}</Badge>
                          {u.isDisabled && <Badge variant="destructive">disabled</Badge>}
                        </div>
                      }
                    />
                  ))
                )}
              </TabsContent>

              <TabsContent value="projects" className="flex flex-col gap-2 mt-4">
                {data.projects.length === 0 ? (
                  <Empty text="No projects." />
                ) : (
                  data.projects.map((p) => (
                    <Row
                      key={p.id}
                      title={p.name}
                      subtitle={p.siteUrl ?? p.repoUrl ?? '—'}
                      right={<Badge variant="muted">{p.scanMode}</Badge>}
                    />
                  ))
                )}
              </TabsContent>

              <TabsContent value="scans" className="flex flex-col gap-2 mt-4">
                {data.recentScans.length === 0 ? (
                  <Empty text="No scans yet." />
                ) : (
                  data.recentScans.map((s) => (
                    <Row
                      key={s.id}
                      title={`${s.findingsCount} finding${s.findingsCount === 1 ? '' : 's'}`}
                      subtitle={`${formatRelativeTime(s.createdAt)} · ${s.duration ?? '—'}ms`}
                      right={<ScanBadge status={s.status} />}
                    />
                  ))
                )}
              </TabsContent>
            </Tabs>

            <div className="mt-8 pt-6 border-t flex justify-end">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setConfirmSuspend(true)}
                className="text-destructive hover:text-destructive"
              >
                <AlertTriangle className="size-4 mr-1.5" /> Suspend org (disable all members)
              </Button>
            </div>

            <ConfirmDialog
              open={confirmSuspend}
              onOpenChange={(o) => !o && setConfirmSuspend(false)}
              title="Suspend organization"
              description="Disables login for every user in this org. They can be re-enabled individually from the Users page."
              confirmLabel="Suspend all"
              variant="destructive"
              loading={suspend.isPending}
              onConfirm={() => suspend.mutate()}
            />
          </>
        )}
      </SheetContent>
    </Sheet>
  );
}

function Stat({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="border rounded-md p-3">
      <p className="text-[11px] uppercase tracking-wider text-muted-foreground">{label}</p>
      <p className="font-medium tabular-nums mt-0.5">{value}</p>
    </div>
  );
}

function Row({
  title,
  subtitle,
  right,
}: {
  title: string;
  subtitle?: string;
  right?: React.ReactNode;
}) {
  return (
    <div className="flex items-center justify-between border rounded-md px-3 py-2">
      <div className="min-w-0">
        <p className="text-sm font-medium truncate">{title}</p>
        {subtitle && <p className="text-xs text-muted-foreground truncate">{subtitle}</p>}
      </div>
      {right}
    </div>
  );
}

function Empty({ text }: { text: string }) {
  return <p className="text-sm text-muted-foreground py-4 text-center">{text}</p>;
}

function ScanBadge({ status }: { status: ScanStatus }) {
  const variant =
    status === 'completed'
      ? 'muted'
      : status === 'failed'
        ? 'destructive'
        : status === 'running'
          ? 'muted'
          : 'muted';
  return <Badge variant={variant}>{status}</Badge>;
}
