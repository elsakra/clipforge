'use client';

import { Bell, Search, Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import Link from 'next/link';

interface DashboardHeaderProps {
  title: string;
  description?: string;
  showSearch?: boolean;
  showUploadButton?: boolean;
  action?: React.ReactNode;
}

export function DashboardHeader({
  title,
  description,
  showSearch = false,
  showUploadButton = true,
  action,
}: DashboardHeaderProps) {
  return (
    <header className="sticky top-0 z-30 flex items-center justify-between h-16 px-6 bg-background/80 backdrop-blur-sm border-b border-border">
      <div>
        <h1 className="text-xl font-semibold">{title}</h1>
        {description && (
          <p className="text-sm text-muted-foreground">{description}</p>
        )}
      </div>

      <div className="flex items-center gap-4">
        {showSearch && (
          <div className="relative w-64">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Search..."
              className="pl-9 h-9 bg-secondary/50"
            />
          </div>
        )}

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" className="relative">
              <Bell className="w-5 h-5" />
              <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-accent" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-80">
            <DropdownMenuLabel>Notifications</DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem className="flex flex-col items-start gap-1 py-3">
              <span className="font-medium">Video processed successfully</span>
              <span className="text-xs text-muted-foreground">
                Your video &ldquo;Marketing Q4 Review&rdquo; is ready for clipping
              </span>
            </DropdownMenuItem>
            <DropdownMenuItem className="flex flex-col items-start gap-1 py-3">
              <span className="font-medium">5 clips generated</span>
              <span className="text-xs text-muted-foreground">
                AI found 5 viral moments in your latest upload
              </span>
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem className="justify-center text-primary">
              View all notifications
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>

        {action}

        {showUploadButton && (
          <Button asChild className="gap-2">
            <Link href="/dashboard/upload">
              <Plus className="w-4 h-4" />
              New Upload
            </Link>
          </Button>
        )}
      </div>
    </header>
  );
}


