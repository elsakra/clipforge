'use client';

import { useEffect, useState } from 'react';
import { Sidebar } from '@/components/layout/sidebar';
import { useUIStore } from '@/store';
import { cn } from '@/lib/utils';

interface UserUsage {
  current: number;
  limit: number;
  plan: string;
}

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { sidebarCollapsed } = useUIStore();
  const [usage, setUsage] = useState<UserUsage | null>(null);

  useEffect(() => {
    // Fetch user usage data
    fetch('/api/user/usage')
      .then((res) => res.json())
      .then((data) => {
        if (data.success) {
          setUsage(data.usage);
        }
      })
      .catch(console.error);
  }, []);

  return (
    <div className="min-h-screen bg-background">
      <Sidebar usage={usage || undefined} />
      <main
        className={cn(
          'min-h-screen transition-all duration-300',
          sidebarCollapsed ? 'ml-[72px]' : 'ml-64'
        )}
      >
        {children}
      </main>
    </div>
  );
}
