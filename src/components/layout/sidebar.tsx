'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { UserButton } from '@clerk/nextjs';
import {
  Sparkles,
  LayoutDashboard,
  Upload,
  Scissors,
  FileText,
  Calendar,
  BarChart3,
  Settings,
  HelpCircle,
  ChevronLeft,
  ChevronRight,
  Zap,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { useUIStore } from '@/store';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';

const navigation = [
  { name: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
  { name: 'Upload', href: '/dashboard/upload', icon: Upload },
  { name: 'Clips', href: '/dashboard/clips', icon: Scissors },
  { name: 'Content', href: '/dashboard/content', icon: FileText },
  { name: 'Calendar', href: '/dashboard/calendar', icon: Calendar },
  { name: 'Analytics', href: '/dashboard/analytics', icon: BarChart3 },
];

const secondaryNavigation = [
  { name: 'Settings', href: '/dashboard/settings', icon: Settings },
  { name: 'Help', href: '/dashboard/help', icon: HelpCircle },
];

interface SidebarProps {
  usage?: { current: number; limit: number; plan: string };
}

export function Sidebar({ usage }: SidebarProps) {
  const pathname = usePathname();
  const { sidebarCollapsed, toggleSidebar } = useUIStore();

  const usagePercentage = usage ? (usage.current / usage.limit) * 100 : 0;

  return (
    <aside
      className={cn(
        'fixed left-0 top-0 z-40 h-screen bg-sidebar border-r border-sidebar-border transition-all duration-300',
        sidebarCollapsed ? 'w-[72px]' : 'w-64'
      )}
    >
      <div className="flex flex-col h-full">
        {/* Logo */}
        <div className="flex items-center h-16 px-4 border-b border-sidebar-border">
          <Link href="/dashboard" className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-brand flex items-center justify-center glow-sm flex-shrink-0">
              <Sparkles className="w-6 h-6 text-white" />
            </div>
            {!sidebarCollapsed && (
              <span className="text-xl font-bold text-gradient">ClipForge</span>
            )}
          </Link>
        </div>

        {/* Main Navigation */}
        <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
          {navigation.map((item) => {
            const isActive = pathname === item.href || pathname.startsWith(item.href + '/');
            return (
              <Link
                key={item.name}
                href={item.href}
                className={cn(
                  'flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all',
                  isActive
                    ? 'bg-sidebar-accent text-sidebar-accent-foreground'
                    : 'text-sidebar-foreground/70 hover:bg-sidebar-accent/50 hover:text-sidebar-foreground'
                )}
              >
                <item.icon className={cn('w-5 h-5 flex-shrink-0', isActive && 'text-primary')} />
                {!sidebarCollapsed && <span>{item.name}</span>}
              </Link>
            );
          })}
        </nav>

        {/* Usage Stats */}
        {!sidebarCollapsed && usage && (
          <div className="px-4 py-4 mx-3 mb-2 rounded-xl bg-sidebar-accent/50">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-medium text-sidebar-foreground/70">Monthly Usage</span>
              <Badge variant="secondary" className="text-xs capitalize">
                {usage.plan}
              </Badge>
            </div>
            <Progress value={usagePercentage} className="h-1.5 mb-2" />
            <p className="text-xs text-sidebar-foreground/60">
              {usage.current} of {usage.limit === -1 ? '∞' : usage.limit} videos
            </p>
            {usagePercentage >= 80 && usage.plan !== 'agency' && (
              <Button size="sm" className="w-full mt-3 gap-2" asChild>
                <Link href="/dashboard/settings?tab=billing">
                  <Zap className="w-3.5 h-3.5" />
                  Upgrade
                </Link>
              </Button>
            )}
          </div>
        )}

        <Separator className="bg-sidebar-border" />

        {/* Secondary Navigation */}
        <div className="px-3 py-4 space-y-1">
          {secondaryNavigation.map((item) => {
            const isActive = pathname === item.href;
            return (
              <Link
                key={item.name}
                href={item.href}
                className={cn(
                  'flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all',
                  isActive
                    ? 'bg-sidebar-accent text-sidebar-accent-foreground'
                    : 'text-sidebar-foreground/70 hover:bg-sidebar-accent/50 hover:text-sidebar-foreground'
                )}
              >
                <item.icon className="w-5 h-5 flex-shrink-0" />
                {!sidebarCollapsed && <span>{item.name}</span>}
              </Link>
            );
          })}
        </div>

        {/* User & Collapse Toggle */}
        <div className="flex items-center justify-between p-4 border-t border-sidebar-border">
          <UserButton
            appearance={{
              elements: {
                avatarBox: 'w-9 h-9',
              },
            }}
          />
          <Button
            variant="ghost"
            size="icon"
            onClick={toggleSidebar}
            className="text-sidebar-foreground/70 hover:text-sidebar-foreground hover:bg-sidebar-accent/50"
          >
            {sidebarCollapsed ? (
              <ChevronRight className="w-4 h-4" />
            ) : (
              <ChevronLeft className="w-4 h-4" />
            )}
          </Button>
        </div>
      </div>
    </aside>
  );
}


