---
name: new-page
description: Scaffold a new frontend page with TanStack Router route, query/mutation hooks, and components following exact React patterns.
user-invocable: true
argument-hint: "[page-name]"
---

# Scaffold a New Frontend Page

Create a complete frontend page for `$ARGUMENTS`.

## Step 1: Determine Page Details

Ask the user (if not provided):
1. Resource name (e.g., `invoices`, `products`)
2. Features needed: list view, detail view, create form, edit form, delete
3. Which roles can access this page
4. API endpoints it will consume

## Step 2: Create Route Files

### List Route (`routes/_authentication/{resource}.tsx`)

```tsx
import { createFileRoute } from '@tanstack/react-router';
import { useQuery } from '@tanstack/react-query';
import { apiClient } from '@src/lib/queries/defaultQueryFn';
import { usePagination } from '@src/hooks/usePagination';
import type { ApiPaginatedResponse } from '@zivodoc/shared';

export const Route = createFileRoute('/_authentication/{resource}')({
  component: {Resource}Page,
});

function {Resource}Page() {
  const { offset, limit, nextPage, prevPage, page } = usePagination();
  const { data, isLoading } = useQuery({
    queryKey: ['{resource}', String(offset)],
    queryFn: async () => {
      const res = await apiClient.get<ApiPaginatedResponse<{Resource}>>(`/{resource}?limit=${limit}&offset=${offset}`);
      return res.data;
    },
  });
  // Render table with pagination...
}
```

## Step 3: Create Query Hooks

Create `hooks/queries/use{Resources}.ts`:

```typescript
import { useQuery } from '@tanstack/react-query';
import { apiClient } from '@src/lib/queries/defaultQueryFn';
import type { ApiPaginatedResponse } from '@zivodoc/shared';

export const use{Resources} = (options?: { limit?: number; offset?: number }) => {
  return useQuery({
    queryKey: ['{resource}', String(options?.offset ?? 0)],
    queryFn: async () => {
      const res = await apiClient.get<ApiPaginatedResponse<{Resource}>>(
        `/{resource}?limit=${options?.limit ?? 20}&offset=${options?.offset ?? 0}`
      );
      return res.data;
    },
  });
};
```

## Step 4: Create Mutation Hooks

Create in `hooks/mutations/`:

```typescript
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { apiClient } from '@src/lib/queries/defaultQueryFn';

export const useCreate{Resource} = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (data: Create{Resource}Input) => {
      const res = await apiClient.post('/{resource}', data);
      return res.data;
    },
    onSuccess: () => {
      toast.success('{Resource} created successfully.');
      queryClient.invalidateQueries({ queryKey: ['{resource}'] });
    },
    onError: () => toast.error('Failed to create {resource}.'),
  });
};
```

## Step 5: Add to Sidebar

Update `routes/_authentication.tsx` to add navigation link for the new resource.

## Step 6: Verify

- Run `pnpm --filter @zivodoc/web dev` and navigate to the new route
- TanStack Router auto-generates the route tree
- Test data fetching and mutations
