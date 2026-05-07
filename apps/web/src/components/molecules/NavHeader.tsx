import { ChevronDown } from 'lucide-react';
import { useSidebar } from '@src/components/atoms/sidebar';

export function NavHeader() {
  const { state } = useSidebar();
  const isCollapsed = state === 'collapsed';

  return (
    <div className="border-b border-sidebar-border flex items-center gap-2 cursor-pointer px-3 py-3">
      <div className="w-[26px] h-[26px] rounded-md bg-sidebar-primary text-sidebar-primary-foreground flex items-center justify-center font-bold text-[13px] tracking-tight shrink-0">
        Z
      </div>
      {!isCollapsed && (
        <>
          <div className="flex-1 min-w-0">
            <div className="text-[12.5px] font-semibold text-sidebar-primary leading-tight truncate">
              zivodoc
            </div>
            <div className="text-[10.5px] text-sidebar-foreground font-mono">Docs QA</div>
          </div>
          <ChevronDown size={13} className="text-sidebar-foreground" />
        </>
      )}
    </div>
  );
}
