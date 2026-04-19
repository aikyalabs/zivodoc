import {
  LayoutDashboard,
  Users,
  Building2,
  Shield,
  Settings,
  FolderSearch,
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
    ],
  },
];
