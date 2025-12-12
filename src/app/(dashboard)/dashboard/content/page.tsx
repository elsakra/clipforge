'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { DashboardHeader } from '@/components/layout/dashboard-header';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Input } from '@/components/ui/input';
import {
  Play,
  FileText,
  Scissors,
  MoreVertical,
  Search,
  Upload,
  Clock,
  Sparkles,
  Trash2,
} from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { formatDuration, formatRelativeDate } from '@/lib/utils';
import { toast } from 'sonner';

interface Content {
  id: string;
  title: string;
  description: string | null;
  status: string;
  duration: number | null;
  thumbnailUrl: string | null;
  sourceType: string;
  createdAt: string;
  clipCount?: number;
}

export default function ContentPage() {
  const [contents, setContents] = useState<Content[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    fetchContents();
  }, []);

  const fetchContents = async () => {
    try {
      const response = await fetch('/api/content');
      const data = await response.json();
      if (data.success) {
        setContents(data.contents);
      }
    } catch (error) {
      console.error('Error fetching contents:', error);
      // Use mock data for demo
      setContents([
        {
          id: '1',
          title: 'Marketing Strategy Q4 2024',
          description: 'Quarterly review of marketing initiatives',
          status: 'ready',
          duration: 1847,
          thumbnailUrl: null,
          sourceType: 'upload',
          createdAt: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
          clipCount: 5,
        },
        {
          id: '2',
          title: 'Product Launch Webinar',
          description: null,
          status: 'processing',
          duration: null,
          thumbnailUrl: null,
          sourceType: 'youtube',
          createdAt: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(),
          clipCount: 0,
        },
        {
          id: '3',
          title: 'Interview with CEO',
          description: 'Annual company vision discussion',
          status: 'ready',
          duration: 3624,
          thumbnailUrl: null,
          sourceType: 'upload',
          createdAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
          clipCount: 8,
        },
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeleteContent = async (contentId: string) => {
    try {
      const response = await fetch(`/api/content?contentId=${contentId}`, {
        method: 'DELETE',
      });
      if (response.ok) {
        setContents(contents.filter((c) => c.id !== contentId));
        toast.success('Content deleted');
      }
    } catch (error) {
      toast.error('Failed to delete content');
    }
  };

  const filteredContents = contents.filter((content) =>
    content.title.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'ready':
        return 'default';
      case 'processing':
      case 'transcribing':
      case 'analyzing':
        return 'secondary';
      case 'error':
        return 'destructive';
      default:
        return 'outline';
    }
  };

  return (
    <div className="min-h-screen">
      <DashboardHeader
        title="Content Library"
        description="Manage your uploaded videos and audio files"
      />

      <div className="p-6">
        {/* Search */}
        <div className="flex gap-4 mb-6">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Search content..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9"
            />
          </div>
          <Button asChild>
            <Link href="/dashboard/upload">
              <Upload className="w-4 h-4 mr-2" />
              Upload New
            </Link>
          </Button>
        </div>

        {/* Content List */}
        {isLoading ? (
          <div className="space-y-4">
            {[...Array(3)].map((_, i) => (
              <Card key={i}>
                <CardContent className="p-4 flex gap-4">
                  <Skeleton className="w-40 h-24 rounded-lg" />
                  <div className="flex-1 space-y-2">
                    <Skeleton className="h-5 w-1/3" />
                    <Skeleton className="h-4 w-1/2" />
                    <Skeleton className="h-4 w-1/4" />
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : filteredContents.length === 0 ? (
          <Card className="p-12 text-center">
            <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center mx-auto mb-4">
              <FileText className="w-8 h-8 text-primary" />
            </div>
            <h3 className="text-lg font-semibold mb-2">No content yet</h3>
            <p className="text-sm text-muted-foreground mb-4">
              Upload your first video or audio to get started
            </p>
            <Button asChild>
              <Link href="/dashboard/upload">
                <Upload className="w-4 h-4 mr-2" />
                Upload Content
              </Link>
            </Button>
          </Card>
        ) : (
          <div className="space-y-4">
            {filteredContents.map((content) => (
              <Card key={content.id} className="group hover:border-primary/50 transition-colors">
                <CardContent className="p-4">
                  <div className="flex gap-4">
                    {/* Thumbnail */}
                    <Link
                      href={`/dashboard/content/${content.id}`}
                      className="relative w-40 h-24 rounded-lg bg-muted flex items-center justify-center overflow-hidden flex-shrink-0"
                    >
                      {content.thumbnailUrl ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                          src={content.thumbnailUrl}
                          alt={content.title}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <Play className="w-8 h-8 text-muted-foreground/50" />
                      )}
                      
                      {content.duration && (
                        <div className="absolute bottom-1 right-1 px-1.5 py-0.5 rounded bg-black/70 text-xs text-white">
                          {formatDuration(content.duration)}
                        </div>
                      )}
                    </Link>

                    {/* Info */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <Link
                            href={`/dashboard/content/${content.id}`}
                            className="font-medium hover:text-primary transition-colors line-clamp-1"
                          >
                            {content.title}
                          </Link>
                          {content.description && (
                            <p className="text-sm text-muted-foreground line-clamp-1 mt-0.5">
                              {content.description}
                            </p>
                          )}
                        </div>

                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon">
                              <MoreVertical className="w-4 h-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem asChild>
                              <Link href={`/dashboard/content/${content.id}`}>
                                <FileText className="w-4 h-4 mr-2" />
                                View Details
                              </Link>
                            </DropdownMenuItem>
                            {content.status === 'ready' && (
                              <DropdownMenuItem asChild>
                                <Link href={`/dashboard/content/${content.id}?tab=clips`}>
                                  <Scissors className="w-4 h-4 mr-2" />
                                  View Clips
                                </Link>
                              </DropdownMenuItem>
                            )}
                            <DropdownMenuItem
                              className="text-destructive"
                              onClick={() => handleDeleteContent(content.id)}
                            >
                              <Trash2 className="w-4 h-4 mr-2" />
                              Delete
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>

                      <div className="flex items-center gap-3 mt-3">
                        <Badge variant={getStatusColor(content.status)} className="capitalize">
                          {content.status === 'ready' && <Sparkles className="w-3 h-3 mr-1" />}
                          {content.status}
                        </Badge>
                        
                        <span className="text-xs text-muted-foreground flex items-center gap-1">
                          <Clock className="w-3 h-3" />
                          {formatRelativeDate(new Date(content.createdAt))}
                        </span>

                        {content.clipCount !== undefined && content.clipCount > 0 && (
                          <span className="text-xs text-muted-foreground flex items-center gap-1">
                            <Scissors className="w-3 h-3" />
                            {content.clipCount} clips
                          </span>
                        )}

                        <Badge variant="outline" className="text-xs capitalize">
                          {content.sourceType}
                        </Badge>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}


