import {
  LayoutDashboard,
  Users,
  Building2,
  Settings,
  FolderSearch,
  Building,
  KeyRound,
  Github,
  Sparkles,
  ScrollText,
  Activity,
  Radar,
  ShieldCheck,
  type LucideIcon,
} from 'lucide-react';

import type { UserRole } from '@zivodoc/shared';

export interface NavSubItem {
  title: string;
  url: string;
  roles?: UserRole[];
}

export interface NavItem {
  title: string;
  url: string;
  icon: LucideIcon;
  roles?: UserRole[];
  items?: NavSubItem[];
}

export interface NavGroup {
  label: string;
  items: NavItem[];
}

const ORG_ROLES: UserRole[] = ['owner', 'member'];

export const navigation: NavGroup[] = [
  {
    label: 'Overview',
    items: [
      {
        title: 'Dashboard',
        url: '/dashboard',
        icon: LayoutDashboard,
        roles: ORG_ROLES,
      },
    ],
  },
  {
    label: 'Docs QA',
    items: [
      {
        title: 'Projects',
        url: '/projects',
        icon: FolderSearch,
        roles: ORG_ROLES,
      },
    ],
  },
  {
    label: 'Platform',
    items: [
      {
        title: 'Overview',
        url: '/admin',
        icon: Activity,
        roles: ['admin'],
      },
      {
        title: 'Users',
        url: '/admin/users',
        icon: Users,
        roles: ['admin'],
      },
      {
        title: 'Organizations',
        url: '/admin/organizations',
        icon: Building2,
        roles: ['admin'],
      },
      {
        title: 'Scans',
        url: '/admin/scans',
        icon: Radar,
        roles: ['admin'],
      },
      {
        title: 'Sessions',
        url: '/admin/sessions',
        icon: ShieldCheck,
        roles: ['admin'],
      },
      {
        title: 'GitHub Apps',
        url: '/admin/github',
        icon: Github,
        roles: ['admin'],
      },
      {
        title: 'AI Keys',
        url: '/admin/ai-keys',
        icon: Sparkles,
        roles: ['admin'],
      },
      {
        title: 'Audit Logs',
        url: '/admin/audit-logs',
        icon: ScrollText,
        roles: ['admin'],
      },
    ],
  },
  {
    label: 'Settings',
    items: [
      {
        title: 'General',
        url: '/settings',
        icon: Settings,
      },
      {
        title: 'Organization',
        url: '/settings/organization',
        icon: Building,
        roles: ORG_ROLES,
      },
      {
        title: 'API Keys',
        url: '/settings/api-keys',
        icon: KeyRound,
      },
      {
        title: 'GitHub',
        url: '/settings/github',
        icon: Github,
        roles: ORG_ROLES,
      },
      {
        title: 'AI Keys',
        url: '/settings/ai-keys',
        icon: Sparkles,
        roles: ORG_ROLES,
      },
    ],
  },
];
