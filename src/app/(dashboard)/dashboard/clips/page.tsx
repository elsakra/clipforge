'use client';

import { useEffect, useState } from 'react';
import { DashboardHeader } from '@/components/layout/dashboard-header';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Play,
  Download,
  Share2,
  Trash2,
  MoreVertical,
  Filter,
  Search,
  Sparkles,
  Clock,
  TrendingUp,
} from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { formatDuration } from '@/lib/utils';
import { toast } from 'sonner';

interface Clip {
  id: string;
  title: string;
  duration: number;
  aspectRatio: string;
  status: string;
  viralScore: number | null;
  thumbnailUrl: string | null;
  fileUrl: string | null;
  createdAt: string;
  contents: { title: string };
}

export default function ClipsPage() {
  const [clips, setClips] = useState<Clip[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [sortBy, setSortBy] = useState<string>('newest');

  useEffect(() => {
    fetchClips();
  }, []);

  const fetchClips = async () => {
    try {
      const response = await fetch('/api/clips');
      const data = await response.json();
      if (data.success) {
        setClips(data.clips);
      }
    } catch (error) {
      console.error('Error fetching clips:', error);
      toast.error('Failed to load clips');
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeleteClip = async (clipId: string) => {
    try {
      const response = await fetch(`/api/clips?clipId=${clipId}`, {
        method: 'DELETE',
      });
      if (response.ok) {
        setClips(clips.filter((c) => c.id !== clipId));
        toast.success('Clip deleted');
      }
    } catch (error) {
      toast.error('Failed to delete clip');
    }
  };

  const handleGenerateClip = async (clipId: string) => {
    try {
      const response = await fetch('/api/clips', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ clipId }),
      });
      
      if (response.ok) {
        toast.success('Clip generation started');
        fetchClips();
      }
    } catch (error) {
      toast.error('Failed to generate clip');
    }
  };

  // Filter and sort clips
  const filteredClips = clips
    .filter((clip) => {
      const matchesSearch = clip.title.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesStatus = statusFilter === 'all' || clip.status === statusFilter;
      return matchesSearch && matchesStatus;
    })
    .sort((a, b) => {
      switch (sortBy) {
        case 'newest':
          return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
        case 'oldest':
          return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
        case 'viral':
          return (b.viralScore || 0) - (a.viralScore || 0);
        default:
          return 0;
      }
    });

  return (
    <div className="min-h-screen">
      <DashboardHeader
        title="Clips"
        description="View and manage your generated video clips"
      />

      <div className="p-6">
        {/* Filters */}
        <div className="flex flex-wrap gap-4 mb-6">
          <div className="relative flex-1 min-w-[200px] max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Search clips..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9"
            />
          </div>
          
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-[150px]">
              <Filter className="w-4 h-4 mr-2" />
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Status</SelectItem>
              <SelectItem value="ready">Ready</SelectItem>
              <SelectItem value="processing">Processing</SelectItem>
              <SelectItem value="pending">Pending</SelectItem>
              <SelectItem value="error">Error</SelectItem>
            </SelectContent>
          </Select>

          <Select value={sortBy} onValueChange={setSortBy}>
            <SelectTrigger className="w-[150px]">
              <SelectValue placeholder="Sort by" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="newest">Newest First</SelectItem>
              <SelectItem value="oldest">Oldest First</SelectItem>
              <SelectItem value="viral">Viral Score</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Clips Grid */}
        {isLoading ? (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {[...Array(8)].map((_, i) => (
              <Card key={i}>
                <Skeleton className="aspect-video w-full" />
                <CardContent className="p-4">
                  <Skeleton className="h-4 w-3/4 mb-2" />
                  <Skeleton className="h-3 w-1/2" />
                </CardContent>
              </Card>
            ))}
          </div>
        ) : filteredClips.length === 0 ? (
          <Card className="p-12 text-center">
            <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center mx-auto mb-4">
              <Sparkles className="w-8 h-8 text-primary" />
            </div>
            <h3 className="text-lg font-semibold mb-2">No clips found</h3>
            <p className="text-sm text-muted-foreground mb-4">
              {searchQuery || statusFilter !== 'all'
                ? 'Try adjusting your filters'
                : 'Upload content to start generating clips'}
            </p>
            <Button asChild>
              <a href="/dashboard/upload">Upload Content</a>
            </Button>
          </Card>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {filteredClips.map((clip) => (
              <Card key={clip.id} className="group overflow-hidden">
                {/* Thumbnail */}
                <div className="relative aspect-video bg-muted">
                  {clip.thumbnailUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={clip.thumbnailUrl}
                      alt={clip.title}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <Play className="w-12 h-12 text-muted-foreground/50" />
                    </div>
                  )}
                  
                  {/* Overlay */}
                  <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                    {clip.status === 'ready' && clip.fileUrl && (
                      <>
                        <Button size="icon" variant="secondary">
                          <Play className="w-4 h-4" />
                        </Button>
                        <Button size="icon" variant="secondary">
                          <Download className="w-4 h-4" />
                        </Button>
                        <Button size="icon" variant="secondary">
                          <Share2 className="w-4 h-4" />
                        </Button>
                      </>
                    )}
                    {clip.status === 'pending' && (
                      <Button
                        size="sm"
                        onClick={() => handleGenerateClip(clip.id)}
                      >
                        <Sparkles className="w-4 h-4 mr-2" />
                        Generate
                      </Button>
                    )}
                  </div>

                  {/* Duration badge */}
                  <div className="absolute bottom-2 right-2 px-2 py-1 rounded bg-black/70 text-xs text-white flex items-center gap-1">
                    <Clock className="w-3 h-3" />
                    {formatDuration(clip.duration)}
                  </div>

                  {/* Status badge */}
                  <Badge
                    className="absolute top-2 left-2 capitalize"
                    variant={
                      clip.status === 'ready'
                        ? 'default'
                        : clip.status === 'error'
                        ? 'destructive'
                        : 'secondary'
                    }
                  >
                    {clip.status}
                  </Badge>

                  {/* Viral score */}
                  {clip.viralScore && (
                    <div className="absolute top-2 right-2 px-2 py-1 rounded bg-accent text-accent-foreground text-xs flex items-center gap-1">
                      <TrendingUp className="w-3 h-3" />
                      {clip.viralScore}%
                    </div>
                  )}
                </div>

                {/* Info */}
                <CardContent className="p-4">
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <h3 className="font-medium truncate">{clip.title}</h3>
                      <p className="text-xs text-muted-foreground truncate">
                        {clip.contents?.title}
                      </p>
                    </div>
                    
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" className="flex-shrink-0">
                          <MoreVertical className="w-4 h-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        {clip.status === 'pending' && (
                          <DropdownMenuItem onClick={() => handleGenerateClip(clip.id)}>
                            <Sparkles className="w-4 h-4 mr-2" />
                            Generate Clip
                          </DropdownMenuItem>
                        )}
                        {clip.status === 'ready' && clip.fileUrl && (
                          <>
                            <DropdownMenuItem>
                              <Download className="w-4 h-4 mr-2" />
                              Download
                            </DropdownMenuItem>
                            <DropdownMenuItem>
                              <Share2 className="w-4 h-4 mr-2" />
                              Share
                            </DropdownMenuItem>
                          </>
                        )}
                        <DropdownMenuItem
                          className="text-destructive"
                          onClick={() => handleDeleteClip(clip.id)}
                        >
                          <Trash2 className="w-4 h-4 mr-2" />
                          Delete
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>

                  <div className="flex items-center gap-2 mt-2">
                    <Badge variant="outline" className="text-xs">
                      {clip.aspectRatio}
                    </Badge>
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


