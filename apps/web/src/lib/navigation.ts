import {
  LayoutDashboard,
  Users,
  Building2,
  Shield,
  Settings,
  FolderSearch,
  Building,
  KeyRound,
  Github,
  Sparkles,
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

export const navigation: NavGroup[] = [
  {
    label: 'Overview',
    items: [
      {
        title: 'Dashboard',
        url: '/dashboard',
        icon: LayoutDashboard,
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
      },
    ],
  },
  {
    label: 'Platform',
    items: [
      {
        title: 'Users',
        url: '/users',
        icon: Users,
        roles: ['admin'],
      },
      {
        title: 'Organizations',
        url: '/organizations',
        icon: Building2,
        roles: ['admin'],
      },
      {
        title: 'Roles & Permissions',
        url: '/roles',
        icon: Shield,
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
      },
      {
        title: 'AI Keys',
        url: '/settings/ai-keys',
        icon: Sparkles,
      },
    ],
  },
];
