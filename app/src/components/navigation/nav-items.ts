// Stage 21 sections 19-20. The navigation structures exist now even though
// most target routes are M2+ stubs. `implemented: false` items render but
// route to a placeholder page.

import {
  LayoutDashboard,
  UserRound,
  Briefcase,
  ClipboardList,
  Bell,
  Settings,
  Users,
  UsersRound,
  BadgeCheck,
  BarChart3,
  type LucideIcon,
} from "lucide-react";

export interface NavItem {
  label: string;
  href: string;
  icon: LucideIcon;
  implemented: boolean;
}

// Stage 21 section 19.
export const MEMBER_NAV: NavItem[] = [
  { label: "Dashboard", href: "/dashboard", icon: LayoutDashboard, implemented: true },
  { label: "My Profile", href: "/profile", icon: UserRound, implemented: true },
  { label: "Opportunities", href: "/opportunities", icon: Briefcase, implemented: true },
  { label: "Applications", href: "/applications", icon: ClipboardList, implemented: true },
  { label: "Notifications", href: "/notifications", icon: Bell, implemented: true },
  { label: "Settings", href: "/settings", icon: Settings, implemented: false },
];

// Stage 21 section 20.
export const ADMIN_NAV: NavItem[] = [
  { label: "Dashboard", href: "/admin/dashboard", icon: LayoutDashboard, implemented: true },
  { label: "Members", href: "/admin/members", icon: Users, implemented: false },
  { label: "Professionals", href: "/admin/professionals", icon: UsersRound, implemented: true },
  { label: "Verification", href: "/admin/verification", icon: BadgeCheck, implemented: true },
  { label: "Opportunities", href: "/admin/opportunities", icon: Briefcase, implemented: true },
  { label: "Applications", href: "/admin/applications", icon: ClipboardList, implemented: false },
  { label: "Analytics", href: "/admin/analytics", icon: BarChart3, implemented: false },
  { label: "Settings", href: "/admin/settings", icon: Settings, implemented: false },
];

// Stage 21 section 18 mobile bottom nav -- a 4-item subset.
export const MEMBER_MOBILE_NAV: NavItem[] = [
  MEMBER_NAV[0],
  MEMBER_NAV[1],
  MEMBER_NAV[2],
  MEMBER_NAV[4],
];
