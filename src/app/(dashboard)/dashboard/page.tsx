'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { 
  Upload, 
  Scissors, 
  FileText, 
  Clock, 
  TrendingUp, 
  Play,
  ArrowRight,
  Sparkles,
  Zap,
  RefreshCw
} from 'lucide-react';
import { DashboardHeader } from '@/components/layout/dashboard-header';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Progress } from '@/components/ui/progress';
import { formatRelativeDate, formatTimeSaved } from '@/lib/utils';

interface DashboardStats {
  totalContent: number;
  totalClips: number;
  totalPosts: number;
  timeSaved: number;
  recentContent: Array<{
    id: string;
    title: string;
    status: string;
    thumbnailUrl: string | null;
    createdAt: string;
    clipsCount: number;
  }>;
  usage: {
    current: number;
    limit: number;
    plan: string;
  };
}

export default function DashboardPage() {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchStats = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await fetch('/api/dashboard/stats');
      if (!response.ok) {
        throw new Error('Failed to fetch stats');
      }
      const data = await response.json();
      setStats(data);
    } catch (err) {
      console.error('Error fetching stats:', err);
      setError('Failed to load dashboard data');
      // Set default stats for demo/error state
      setStats({
        totalContent: 0,
        totalClips: 0,
        totalPosts: 0,
        timeSaved: 0,
        recentContent: [],
        usage: { current: 0, limit: 3, plan: 'free' },
      });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchStats();
  }, []);

  const statCards = [
    {
      title: 'Total Content',
      value: stats?.totalContent || 0,
      icon: Upload,
      color: 'text-primary',
      bgColor: 'bg-primary/10',
    },
    {
      title: 'Clips Generated',
      value: stats?.totalClips || 0,
      icon: Scissors,
      color: 'text-accent',
      bgColor: 'bg-accent/10',
    },
    {
      title: 'Posts Created',
      value: stats?.totalPosts || 0,
      icon: FileText,
      color: 'text-chart-3',
      bgColor: 'bg-chart-3/10',
    },
    {
      title: 'Time Saved',
      value: formatTimeSaved(stats?.timeSaved || 0),
      icon: Clock,
      color: 'text-chart-4',
      bgColor: 'bg-chart-4/10',
      isText: true,
    },
  ];

  const usagePercentage = stats?.usage 
    ? Math.min(100, (stats.usage.current / stats.usage.limit) * 100)
    : 0;

  return (
    <div className="min-h-screen">
      <DashboardHeader
        title="Dashboard"
        description="Welcome back! Here's an overview of your content."
        action={
          <Button variant="outline" size="sm" onClick={fetchStats} disabled={isLoading}>
            <RefreshCw className={`w-4 h-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
        }
      />

      <div className="p-6 space-y-8">
        {error && (
          <div className="bg-destructive/10 border border-destructive/20 rounded-lg p-4 text-sm text-destructive">
            {error}. Showing placeholder data.
          </div>
        )}

        {/* Usage Card */}
        {stats?.usage && stats.usage.plan !== 'agency' && (
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <Badge variant="secondary" className="capitalize">{stats.usage.plan} Plan</Badge>
                  <span className="text-sm text-muted-foreground">
                    {stats.usage.current} / {stats.usage.limit} videos this month
                  </span>
                </div>
                <Button variant="outline" size="sm" asChild>
                  <Link href="/pricing">Upgrade</Link>
                </Button>
              </div>
              <Progress value={usagePercentage} className="h-2" />
            </CardContent>
          </Card>
        )}

        {/* Stats Grid */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {statCards.map((stat, index) => (
            <Card key={index} className="relative overflow-hidden">
              <CardContent className="p-6">
                {isLoading ? (
                  <div className="space-y-3">
                    <Skeleton className="h-10 w-10 rounded-lg" />
                    <Skeleton className="h-8 w-20" />
                    <Skeleton className="h-4 w-24" />
                  </div>
                ) : (
                  <>
                    <div className={`w-10 h-10 rounded-lg ${stat.bgColor} flex items-center justify-center mb-3`}>
                      <stat.icon className={`w-5 h-5 ${stat.color}`} />
                    </div>
                    <p className="text-3xl font-bold">
                      {stat.isText ? stat.value : stat.value.toLocaleString()}
                    </p>
                    <p className="text-sm text-muted-foreground">{stat.title}</p>
                  </>
                )}
              </CardContent>
              {/* Decorative gradient */}
              <div className={`absolute top-0 right-0 w-20 h-20 ${stat.bgColor} blur-3xl opacity-50`} />
            </Card>
          ))}
        </div>

        {/* Quick Actions & Recent Content */}
        <div className="grid gap-6 lg:grid-cols-3">
          {/* Quick Actions */}
          <Card className="lg:col-span-1">
            <CardHeader>
              <CardTitle className="text-lg">Quick Actions</CardTitle>
              <CardDescription>Get started with common tasks</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <Button asChild className="w-full justify-start gap-3 h-12" variant="secondary">
                <Link href="/dashboard/upload">
                  <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
                    <Upload className="w-4 h-4 text-primary" />
                  </div>
                  Upload New Content
                </Link>
              </Button>
              <Button asChild className="w-full justify-start gap-3 h-12" variant="secondary">
                <Link href="/dashboard/clips">
                  <div className="w-8 h-8 rounded-lg bg-accent/10 flex items-center justify-center">
                    <Scissors className="w-4 h-4 text-accent" />
                  </div>
                  View All Clips
                </Link>
              </Button>
              <Button asChild className="w-full justify-start gap-3 h-12" variant="secondary">
                <Link href="/dashboard/content">
                  <div className="w-8 h-8 rounded-lg bg-chart-3/10 flex items-center justify-center">
                    <FileText className="w-4 h-4 text-chart-3" />
                  </div>
                  Generate Content
                </Link>
              </Button>
              <Button asChild className="w-full justify-start gap-3 h-12" variant="secondary">
                <Link href="/dashboard/calendar">
                  <div className="w-8 h-8 rounded-lg bg-chart-4/10 flex items-center justify-center">
                    <TrendingUp className="w-4 h-4 text-chart-4" />
                  </div>
                  Schedule Posts
                </Link>
              </Button>
            </CardContent>
          </Card>

          {/* Recent Content */}
          <Card className="lg:col-span-2">
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle className="text-lg">Recent Content</CardTitle>
                <CardDescription>Your latest uploads and their status</CardDescription>
              </div>
              <Button variant="ghost" size="sm" asChild>
                <Link href="/dashboard/clips" className="gap-1">
                  View All
                  <ArrowRight className="w-4 h-4" />
                </Link>
              </Button>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <div className="space-y-4">
                  {[1, 2, 3].map((i) => (
                    <div key={i} className="flex items-center gap-4 p-4 rounded-lg bg-secondary/30">
                      <Skeleton className="w-16 h-16 rounded-lg" />
                      <div className="flex-1 space-y-2">
                        <Skeleton className="h-4 w-48" />
                        <Skeleton className="h-3 w-24" />
                      </div>
                      <Skeleton className="h-8 w-20" />
                    </div>
                  ))}
                </div>
              ) : stats?.recentContent.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-12 text-center">
                  <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center mb-4">
                    <Sparkles className="w-8 h-8 text-primary" />
                  </div>
                  <h3 className="text-lg font-semibold mb-2">No content yet</h3>
                  <p className="text-sm text-muted-foreground mb-4">
                    Upload your first video or audio to get started
                  </p>
                  <Button asChild>
                    <Link href="/dashboard/upload" className="gap-2">
                      <Upload className="w-4 h-4" />
                      Upload Content
                    </Link>
                  </Button>
                </div>
              ) : (
                <div className="space-y-3">
                  {stats?.recentContent.map((content) => (
                    <Link
                      key={content.id}
                      href={`/dashboard/content/${content.id}`}
                      className="flex items-center gap-4 p-4 rounded-lg bg-secondary/30 hover:bg-secondary/50 transition-colors group"
                    >
                      <div className="w-16 h-16 rounded-lg bg-muted flex items-center justify-center overflow-hidden">
                        {content.thumbnailUrl ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img
                            src={content.thumbnailUrl}
                            alt={content.title}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <Play className="w-6 h-6 text-muted-foreground" />
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <h4 className="font-medium truncate group-hover:text-primary transition-colors">
                          {content.title}
                        </h4>
                        <div className="flex items-center gap-2 mt-1">
                          <span className="text-xs text-muted-foreground">
                            {formatRelativeDate(new Date(content.createdAt))}
                          </span>
                          {content.clipsCount > 0 && (
                            <>
                              <span className="text-muted-foreground">•</span>
                              <span className="text-xs text-muted-foreground">
                                {content.clipsCount} clips
                              </span>
                            </>
                          )}
                        </div>
                      </div>
                      <Badge
                        variant={content.status === 'ready' ? 'default' : 'secondary'}
                        className="capitalize"
                      >
                        {content.status === 'ready' && <Zap className="w-3 h-3 mr-1" />}
                        {content.status}
                      </Badge>
                    </Link>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* AI Suggestions Card */}
        <Card className="relative overflow-hidden border-primary/20">
          <div className="absolute inset-0 bg-gradient-to-r from-primary/5 via-transparent to-accent/5" />
          <CardContent className="relative p-6">
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 rounded-xl bg-gradient-brand flex items-center justify-center flex-shrink-0">
                <Sparkles className="w-6 h-6 text-white" />
              </div>
              <div className="flex-1">
                <h3 className="text-lg font-semibold mb-1">AI Suggestions</h3>
                <p className="text-sm text-muted-foreground mb-4">
                  Based on your recent content, here are some recommendations to maximize engagement.
                </p>
                <div className="flex flex-wrap gap-2">
                  <Badge variant="secondary" className="gap-1">
                    <TrendingUp className="w-3 h-3" />
                    Post at 9 AM for best engagement
                  </Badge>
                  <Badge variant="secondary" className="gap-1">
                    <Scissors className="w-3 h-3" />
                    {stats?.totalClips || 0} clips ready to publish
                  </Badge>
                  <Badge variant="secondary" className="gap-1">
                    <FileText className="w-3 h-3" />
                    LinkedIn posts performing well
                  </Badge>
                </div>
              </div>
              <Button variant="outline" className="flex-shrink-0" asChild>
                <Link href="/dashboard/content">View All Tips</Link>
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
