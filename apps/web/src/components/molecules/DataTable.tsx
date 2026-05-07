import { type ReactNode, useState, useMemo } from 'react';
import { ChevronLeft, ChevronRight, Loader2, SearchIcon, XIcon } from 'lucide-react';

import { Button } from '@src/components/atoms/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@src/components/atoms/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@src/components/atoms/table';
import { cn } from '@src/lib/utils';

export interface DataTableColumn<T> {
  key: string;
  header: string;
  className?: string;
  headerClassName?: string;
  render: (row: T) => ReactNode;
  /** Enable searching within this column's text content */
  searchable?: boolean;
  /** Value accessor for search — defaults to render().toString() */
  accessorFn?: (row: T) => string;
}

export interface DataTableFilter {
  key: string;
  label: string;
  options: Array<{ value: string; label: string }>;
  value: string;
  onChange: (value: string) => void;
}

export interface DataTablePagination {
  /** Total items on the server (for server-side pagination) */
  total: number;
  /** Current page (0-indexed) */
  page: number;
  /** Items per page */
  pageSize: number;
  /** Called when page changes */
  onPageChange: (page: number) => void;
}

interface DataTableProps<T> {
  columns: DataTableColumn<T>[];
  data: T[];
  keyExtractor: (row: T) => string;

  // States
  loading?: boolean;
  emptyIcon?: ReactNode;
  emptyMessage?: string;
  emptyDescription?: string;

  // Interaction
  onRowClick?: (row: T) => void;

  // Pagination (server-side — API handles paging)
  pagination?: DataTablePagination;

  // Filters (rendered as dropdowns above the table)
  filters?: DataTableFilter[];

  // Client-side search (searches across searchable columns)
  searchable?: boolean;
  searchPlaceholder?: string;

  // Layout
  className?: string;
  toolbar?: ReactNode;
}

export function DataTable<T>({
  columns,
  data,
  keyExtractor,
  loading = false,
  emptyIcon,
  emptyMessage = 'No results found.',
  emptyDescription,
  onRowClick,
  pagination,
  filters,
  searchable = false,
  searchPlaceholder = 'Search...',
  className,
  toolbar,
}: DataTableProps<T>) {
  const [search, setSearch] = useState('');

  // Client-side search filtering
  const filteredData = useMemo(() => {
    if (!searchable || !search.trim()) return data;

    const q = search.toLowerCase();
    return data.filter((row) =>
      columns.some((col) => {
        if (!col.searchable && !col.accessorFn) return false;
        const text = col.accessorFn ? col.accessorFn(row) : '';
        return text.toLowerCase().includes(q);
      }),
    );
  }, [data, search, searchable, columns]);

  const displayData = filteredData;
  const totalPages = pagination ? Math.ceil(pagination.total / pagination.pageSize) : 0;
  const hasToolbar = searchable || (filters && filters.length > 0) || toolbar;
  const hasPagination = pagination && totalPages > 1;
  const currentPage = pagination?.page ?? 0;
  const totalItems = pagination?.total ?? filteredData.length;
  const currentPageSize = pagination?.pageSize ?? filteredData.length;

  return (
    <div className={cn('space-y-3', className)}>
      {/* Toolbar: search + filters */}
      {hasToolbar && (
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            {searchable && (
              <div className="relative">
                <SearchIcon className="absolute left-2.5 top-1/2 size-3.5 -translate-y-1/2 text-muted-foreground" />
                <input
                  type="text"
                  value={search}
                  onChange={(e) => {
                    setSearch(e.target.value);
                  }}
                  placeholder={searchPlaceholder}
                  className="h-8 w-[200px] rounded-md border border-input bg-transparent pl-8 pr-8 text-xs outline-none placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50"
                />
                {search && (
                  <button
                    type="button"
                    onClick={() => setSearch('')}
                    className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                  >
                    <XIcon className="size-3" />
                  </button>
                )}
              </div>
            )}
            {toolbar}
          </div>
          {filters && filters.length > 0 && (
            <div className="flex items-center gap-2">
              {filters.map((filter) => (
                <Select key={filter.key} value={filter.value} onValueChange={filter.onChange}>
                  <SelectTrigger className="h-8 w-[140px] text-xs">
                    <SelectValue placeholder={filter.label} />
                  </SelectTrigger>
                  <SelectContent>
                    {filter.options.map((opt) => (
                      <SelectItem key={opt.value} value={opt.value}>
                        {opt.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              ))}
            </div>
          )}
        </div>
      )}

      {loading && (
        <div className="flex items-center justify-center rounded-lg border py-16">
          <Loader2 className="size-5 animate-spin text-muted-foreground" />
        </div>
      )}

      {!loading && displayData.length === 0 && (
        <div className="flex flex-col items-center justify-center rounded-lg border border-dashed py-14 text-center">
          {emptyIcon && <div className="mb-3">{emptyIcon}</div>}
          <p className="text-sm font-medium text-muted-foreground">{emptyMessage}</p>
          {emptyDescription && (
            <p className="mt-1 text-xs text-muted-foreground">{emptyDescription}</p>
          )}
        </div>
      )}

      {/* Table */}
      {!loading && displayData.length > 0 && (
        <div className="rounded-xl border bg-card shadow-sm overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow className="hover:bg-transparent">
                {columns.map((col) => (
                  <TableHead
                    key={col.key}
                    className={cn('text-xs', col.headerClassName ?? col.className)}
                  >
                    {col.header}
                  </TableHead>
                ))}
              </TableRow>
            </TableHeader>
            <TableBody>
              {displayData.map((row) => (
                <TableRow
                  key={keyExtractor(row)}
                  className={onRowClick ? 'cursor-pointer' : undefined}
                  onClick={onRowClick ? () => onRowClick(row) : undefined}
                >
                  {columns.map((col) => (
                    <TableCell key={col.key} className={col.className}>
                      {col.render(row)}
                    </TableCell>
                  ))}
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}

      {/* Pagination — split layout: count left, controls right (Stripe/Shadcn pattern) */}
      {hasPagination && !loading && displayData.length > 0 && (
        <div className="flex items-center justify-between pt-1">
          <p className="text-xs text-muted-foreground tabular-nums">
            {currentPage * currentPageSize + 1}–
            {Math.min((currentPage + 1) * currentPageSize, totalItems)} of {totalItems}
          </p>
          <div className="flex items-center gap-2">
            <span className="text-xs text-muted-foreground tabular-nums">
              Page {currentPage + 1} of {totalPages}
            </span>
            <Button
              variant="outline"
              size="icon-xs"
              onClick={() => pagination?.onPageChange(currentPage - 1)}
              disabled={currentPage === 0}
            >
              <ChevronLeft className="size-3.5" />
            </Button>
            <Button
              variant="outline"
              size="icon-xs"
              onClick={() => pagination?.onPageChange(currentPage + 1)}
              disabled={currentPage >= totalPages - 1}
            >
              <ChevronRight className="size-3.5" />
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
