import * as React from 'react';
import { SearchIcon, XIcon } from 'lucide-react';

import { cn } from '@src/lib/utils';

interface SearchInputProps extends Omit<React.ComponentProps<'input'>, 'type'> {
  onClear?: () => void;
}

export function SearchInput({ className, value, onClear, ...props }: SearchInputProps) {
  const hasValue = typeof value === 'string' ? value.length > 0 : false;

  return (
    <div className="relative">
      <SearchIcon className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
      <input
        data-slot="search-input"
        type="search"
        value={value}
        className={cn(
          'h-9 w-full rounded-md border border-input bg-transparent pl-9 pr-9 text-sm shadow-xs outline-none transition-[color,box-shadow]',
          'placeholder:text-muted-foreground',
          'focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50',
          'disabled:cursor-not-allowed disabled:opacity-50',
          className,
        )}
        {...props}
      />
      {hasValue && onClear && (
        <button
          type="button"
          onClick={onClear}
          className="absolute right-2 top-1/2 -translate-y-1/2 rounded-sm p-0.5 text-muted-foreground hover:text-foreground transition-colors"
        >
          <XIcon className="size-3.5" />
        </button>
      )}
    </div>
  );
}
