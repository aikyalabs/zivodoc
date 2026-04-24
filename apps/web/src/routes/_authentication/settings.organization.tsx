import { useState } from 'react';
import { createFileRoute } from '@tanstack/react-router';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { AlertTriangle, FileSearch, FolderKanban, Layers, ScanLine } from 'lucide-react';

import { Badge } from '@src/components/atoms/badge';
import { Button } from '@src/components/atoms/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@src/components/atoms/card';
import { Input } from '@src/components/atoms/input';
import { Label } from '@src/components/atoms/label';
import { Skeleton } from '@src/components/atoms/skeleton';
import { PageHeader } from '@src/components/molecules/PageHeader';
import { StatCard } from '@src/components/molecules/StatCard';
import { useProfile } from '@src/hooks/useProfile';
import { apiClient } from '@src/lib/queries/defaultQueryFn';

import type { ApiOkResponse } from '@zivodoc/shared';
import type { z } from 'zod';
import type { organizationModelSchema } from '@zivodoc/shared';

type Organization = z.output<typeof organizationModelSchema>;

export const Route = createFileRoute('/_authentication/settings/organization')({
  component: OrganizationSettingsPage,
});

const planBadgeVariant: Record<string, 'default' | 'info' | 'success'> = {
  free: 'default',
  pro: 'info',
  team: 'success',
};

function OrganizationSettingsPage() {
  const { data: profile } = useProfile();
  const queryClient = useQueryClient();
  const organizationId = profile?.organizationId;

  const {
    data: organization,
    isLoading,
    isError,
    error,
  } = useQuery({
    queryKey: ['organizations', organizationId],
    queryFn: async () => {
      const response = await apiClient.get<ApiOkResponse<Organization>>(
        `/organizations/${organizationId}`,
      );
      return response.data.payload;
    },
    enabled: !!organizationId,
  });

  const updateOrg = useMutation({
    mutationFn: async (data: { name?: string }) => {
      await apiClient.patch(`/organizations/${organizationId}`, data);
    },
    onSuccess: () => {
      toast.success('Organization updated successfully.');
      queryClient.invalidateQueries({ queryKey: ['organizations', organizationId] });
    },
    onError: () => {
      toast.error('Failed to update organization.');
    },
  });

  const [name, setName] = useState<string | null>(null);
  const currentName = name ?? organization?.name ?? '';
  const hasChanges = organization != null && currentName !== organization.name;

  const handleSave = () => {
    if (!organization || !hasChanges) return;
    updateOrg.mutate({ name: currentName }, { onSuccess: () => setName(null) });
  };

  if (!organizationId) {
    return (
      <div className="flex flex-col gap-6">
        <PageHeader
          title="Organization Settings"
          description="Manage your workspace configuration."
        />
        <Card className="border-destructive/50 bg-destructive/10">
          <CardContent className="py-6 text-center">
            <p className="text-sm text-destructive">
              No organization associated with your account.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (isError) {
    return (
      <div className="flex flex-col gap-6">
        <PageHeader
          title="Organization Settings"
          description="Manage your workspace configuration."
        />
        <Card className="border-destructive/50 bg-destructive/10">
          <CardContent className="py-6 text-center">
            <p className="text-sm text-destructive">
              Failed to load organization: {error?.message || 'An unexpected error occurred.'}
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="Organization Settings"
        description="Manage your workspace configuration."
      />

      <Card>
        <CardHeader>
          <CardTitle>Workspace Name</CardTitle>
          <CardDescription>The display name for your organization.</CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <Skeleton className="h-9 w-full" />
          ) : (
            <form
              className="flex flex-col gap-4"
              onSubmit={(e) => {
                e.preventDefault();
                handleSave();
              }}
            >
              <div className="flex flex-col gap-2">
                <Label htmlFor="orgName">Name</Label>
                <Input id="orgName" value={currentName} onChange={(e) => setName(e.target.value)} />
              </div>
              <div className="flex justify-end">
                <Button type="submit" disabled={!hasChanges || updateOrg.isPending}>
                  {updateOrg.isPending ? 'Saving...' : 'Save'}
                </Button>
              </div>
            </form>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            Plan & Usage
            {organization && (
              <Badge variant={planBadgeVariant[organization.plan] ?? 'default'}>
                {organization.plan}
              </Badge>
            )}
          </CardTitle>
          <CardDescription>Current plan limits and usage for this billing cycle.</CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
              <Skeleton className="h-24 w-full" />
              <Skeleton className="h-24 w-full" />
              <Skeleton className="h-24 w-full" />
            </div>
          ) : organization ? (
            <div className="flex flex-col gap-4">
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
                <StatCard
                  label="Scans Used This Month"
                  value={`${organization.scansUsedThisMonth} / ${organization.scanQuota}`}
                  icon={ScanLine}
                  variant={
                    organization.scansUsedThisMonth >= organization.scanQuota
                      ? 'warning'
                      : 'default'
                  }
                />
                <StatCard
                  label="Max Pages Per Scan"
                  value={organization.maxPages}
                  icon={FileSearch}
                />
                <StatCard
                  label="Max Projects"
                  value={organization.maxProjects}
                  icon={FolderKanban}
                />
              </div>
              <div className="flex justify-end">
                <Button variant="outline" disabled>
                  <Layers className="mr-2 size-4" />
                  Upgrade
                </Button>
              </div>
            </div>
          ) : null}
        </CardContent>
      </Card>

      <Card className="border-destructive/30">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-destructive">
            <AlertTriangle className="size-4" />
            Danger Zone
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">
            Organization deletion is not currently supported. Contact support if you need to delete
            your organization.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
