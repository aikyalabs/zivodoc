import { useQuery } from '@tanstack/react-query';

import { apiClient } from '@src/lib/queries/defaultQueryFn';

import type { ApiOkResponse } from '@zivodoc/shared';

interface DashboardStats {
  totalProjects: number;
  totalScans: number;
  openFindings: number;
  resolvedFindings: number;
  recentScans: Array<{
    id: string;
    projectId: string;
    status: string;
    pagesScanned: number;
    findingsCount: number;
    duration: number | null;
    createdAt: string;
  }>;
  topFindings: Array<{
    id: string;
    category: string;
    severity: string;
    title: string;
    source: string;
    projectId: string;
    createdAt: string;
  }>;
}

export const useDashboardStats = () => {
  return useQuery({
    queryKey: ['dashboard', 'stats'],
    queryFn: async () => {
      const response = await apiClient.get<ApiOkResponse<DashboardStats>>('/dashboard/stats');
      return response.data.payload;
    },
  });
};
