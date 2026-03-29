import {
  LayoutDashboard,
  Users,
  Building2,
  Shield,
  Settings,
  Lock,
  type LucideIcon,
} from 'lucide-react';

import type { UserRole } from '@template/shared';

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
    label: 'Management',
    items: [
      {
        title: 'Users',
        url: '/users',
        icon: Users,
        roles: ['admin', 'owner'],
        items: [
          {
            title: 'All Users',
            url: '/users',
          },
        ],
      },
      {
        title: 'Organizations',
        url: '/organizations',
        icon: Building2,
        roles: ['admin', 'owner'],
      },
      {
        title: 'Roles & Permissions',
        url: '/roles',
        icon: Shield,
        roles: ['admin', 'owner'],
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
        title: 'Security',
        url: '/settings/security',
        icon: Lock,
      },
    ],
  },
];
