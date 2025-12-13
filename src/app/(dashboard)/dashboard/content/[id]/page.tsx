'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { DashboardHeader } from '@/components/layout/dashboard-header';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  Play,
  FileText,
  Scissors,
  Clock,
  ArrowLeft,
  Sparkles,
  RefreshCw,
  TrendingUp,
  Copy,
  Check,
  Download,
  Share2,
  Trash2,
  Twitter,
  Linkedin,
  Instagram,
} from 'lucide-react';
import { formatDuration, formatRelativeDate } from '@/lib/utils';
import { toast } from 'sonner';

interface Content {
  id: string;
  title: string;
  description: string | null;
  status: string;
  duration: number | null;
  thumbnailUrl: string | null;
  fileUrl: string | null;
  sourceType: string;
  sourceUrl: string | null;
  transcription: string | null;
  transcriptionSegments: Array<{
    id: string;
    start: number;
    end: number;
    text: string;
    isHighlight: boolean;
  }> | null;
  createdAt: string;
  updatedAt: string;
}

interface Clip {
  id: string;
  title: string;
  startTime: number;
  endTime: number;
  duration: number;
  aspectRatio: string;
  status: string;
  viralScore: number | null;
  thumbnailUrl: string | null;
  fileUrl: string | null;
}

interface GeneratedContent {
  id: string;
  type: string;
  platform: string;
  content: string;
  status: string;
  metadata: Record<string, unknown>;
  createdAt: string;
}

export default function ContentDetailPage() {
  const params = useParams();
  const router = useRouter();
  const searchParams = useSearchParams();
  const defaultTab = searchParams.get('tab') || 'overview';
  
  const contentId = params.id as string;

  const [content, setContent] = useState<Content | null>(null);
  const [clips, setClips] = useState<Clip[]>([]);
  const [generatedContents, setGeneratedContents] = useState<GeneratedContent[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isGenerating, setIsGenerating] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  useEffect(() => {
    fetchContentDetails();
  }, [contentId]);

  const fetchContentDetails = async () => {
    setIsLoading(true);
    try {
      // Fetch content details
      const contentRes = await fetch(`/api/content?contentId=${contentId}`);
      if (contentRes.ok) {
        const contentData = await contentRes.json();
        if (contentData.success && contentData.content) {
          setContent(contentData.content);
        }
      }

      // Fetch clips
      const clipsRes = await fetch(`/api/clips?contentId=${contentId}`);
      if (clipsRes.ok) {
        const clipsData = await clipsRes.json();
        if (clipsData.success) {
          setClips(clipsData.clips || []);
        }
      }

      // Fetch generated content
      const generatedRes = await fetch(`/api/content?contentId=${contentId}&include=generated`);
      if (generatedRes.ok) {
        const generatedData = await generatedRes.json();
        if (generatedData.success && generatedData.generatedContents) {
          setGeneratedContents(generatedData.generatedContents);
        }
      }
    } catch (error) {
      console.error('Error fetching content details:', error);
      toast.error('Failed to load content details');
    } finally {
      setIsLoading(false);
    }
  };

  const handleGenerateContent = async () => {
    if (!content) return;
    
    setIsGenerating(true);
    try {
      const response = await fetch('/api/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contentId: content.id,
          platforms: ['twitter', 'linkedin'],
        }),
      });

      if (response.ok) {
        toast.success('Content generated successfully!');
        fetchContentDetails();
      } else {
        const error = await response.json();
        toast.error(error.error || 'Failed to generate content');
      }
    } catch (error) {
      toast.error('Failed to generate content');
    } finally {
      setIsGenerating(false);
    }
  };

  const handleReprocess = async () => {
    if (!content) return;
    
    try {
      const response = await fetch('/api/process', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ contentId: content.id }),
      });

      if (response.ok) {
        toast.success('Reprocessing started');
        fetchContentDetails();
      } else {
        toast.error('Failed to start reprocessing');
      }
    } catch (error) {
      toast.error('Failed to start reprocessing');
    }
  };

  const handleCopyContent = async (text: string, id: string) => {
    await navigator.clipboard.writeText(text);
    setCopiedId(id);
    toast.success('Copied to clipboard');
    setTimeout(() => setCopiedId(null), 2000);
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
        fetchContentDetails();
      }
    } catch (error) {
      toast.error('Failed to generate clip');
    }
  };

  const getPlatformIcon = (platform: string) => {
    switch (platform) {
      case 'twitter':
        return <Twitter className="w-4 h-4" />;
      case 'linkedin':
        return <Linkedin className="w-4 h-4" />;
      case 'instagram':
        return <Instagram className="w-4 h-4" />;
      default:
        return <FileText className="w-4 h-4" />;
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen">
        <DashboardHeader title="Loading..." />
        <div className="p-6 space-y-6">
          <Skeleton className="h-64 w-full" />
          <Skeleton className="h-32 w-full" />
          <Skeleton className="h-32 w-full" />
        </div>
      </div>
    );
  }

  if (!content) {
    return (
      <div className="min-h-screen">
        <DashboardHeader title="Content Not Found" />
        <div className="p-6 text-center">
          <p className="text-muted-foreground mb-4">The content you&apos;re looking for doesn&apos;t exist.</p>
          <Button asChild>
            <Link href="/dashboard/content">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Content
            </Link>
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen">
      <DashboardHeader
        title={content.title}
        description={content.description || undefined}
        action={
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={fetchContentDetails}>
              <RefreshCw className="w-4 h-4 mr-2" />
              Refresh
            </Button>
            <Button variant="outline" size="sm" asChild>
              <Link href="/dashboard/content">
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back
              </Link>
            </Button>
          </div>
        }
      />

      <div className="p-6">
        {/* Status Banner */}
        {content.status !== 'ready' && (
          <Card className="mb-6 border-primary/50 bg-primary/5">
            <CardContent className="p-4 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <RefreshCw className={`w-5 h-5 text-primary ${content.status === 'processing' || content.status === 'transcribing' || content.status === 'analyzing' ? 'animate-spin' : ''}`} />
                <div>
                  <p className="font-medium capitalize">{content.status}</p>
                  <p className="text-sm text-muted-foreground">
                    {content.status === 'error' 
                      ? 'Processing failed. Try reprocessing.'
                      : 'Your content is being processed...'}
                  </p>
                </div>
              </div>
              {content.status === 'error' && (
                <Button size="sm" onClick={handleReprocess}>
                  Reprocess
                </Button>
              )}
            </CardContent>
          </Card>
        )}

        {/* Content Overview */}
        <div className="grid gap-6 lg:grid-cols-3 mb-6">
          {/* Video/Audio Preview */}
          <Card className="lg:col-span-1">
            <CardContent className="p-4">
              <div className="aspect-video bg-muted rounded-lg flex items-center justify-center overflow-hidden">
                {content.thumbnailUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={content.thumbnailUrl}
                    alt={content.title}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <Play className="w-12 h-12 text-muted-foreground/50" />
                )}
              </div>
              <div className="mt-4 space-y-2">
                <div className="flex items-center justify-between">
                  <Badge variant="secondary" className="capitalize">
                    {content.sourceType}
                  </Badge>
                  <Badge variant={content.status === 'ready' ? 'default' : 'secondary'} className="capitalize">
                    {content.status}
                  </Badge>
                </div>
                {content.duration && (
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Clock className="w-4 h-4" />
                    {formatDuration(content.duration)}
                  </div>
                )}
                <p className="text-xs text-muted-foreground">
                  Uploaded {formatRelativeDate(new Date(content.createdAt))}
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Stats */}
          <Card className="lg:col-span-2">
            <CardHeader>
              <CardTitle className="text-lg">Content Stats</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-3 gap-4">
                <div className="p-4 rounded-lg bg-secondary/50 text-center">
                  <div className="text-3xl font-bold">{clips.length}</div>
                  <p className="text-sm text-muted-foreground">Clips</p>
                </div>
                <div className="p-4 rounded-lg bg-secondary/50 text-center">
                  <div className="text-3xl font-bold">{generatedContents.length}</div>
                  <p className="text-sm text-muted-foreground">Posts</p>
                </div>
                <div className="p-4 rounded-lg bg-secondary/50 text-center">
                  <div className="text-3xl font-bold">
                    {content.transcriptionSegments?.filter(s => s.isHighlight).length || 0}
                  </div>
                  <p className="text-sm text-muted-foreground">Highlights</p>
                </div>
              </div>
              
              {content.status === 'ready' && generatedContents.length === 0 && (
                <Button 
                  className="w-full mt-4" 
                  onClick={handleGenerateContent}
                  disabled={isGenerating}
                >
                  {isGenerating ? (
                    <>
                      <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                      Generating...
                    </>
                  ) : (
                    <>
                      <Sparkles className="w-4 h-4 mr-2" />
                      Generate Social Posts
                    </>
                  )}
                </Button>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Tabs */}
        <Tabs defaultValue={defaultTab} className="w-full">
          <TabsList className="grid w-full grid-cols-4 lg:w-auto lg:inline-grid">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="clips">Clips ({clips.length})</TabsTrigger>
            <TabsTrigger value="posts">Posts ({generatedContents.length})</TabsTrigger>
            <TabsTrigger value="transcript">Transcript</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="mt-6">
            <div className="grid gap-6 lg:grid-cols-2">
              {/* Highlights */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg flex items-center gap-2">
                    <Sparkles className="w-5 h-5 text-primary" />
                    AI-Detected Highlights
                  </CardTitle>
                  <CardDescription>Key moments identified for clips</CardDescription>
                </CardHeader>
                <CardContent>
                  <ScrollArea className="h-64">
                    {content.transcriptionSegments?.filter(s => s.isHighlight).length ? (
                      <div className="space-y-3">
                        {content.transcriptionSegments
                          .filter(s => s.isHighlight)
                          .map((segment, i) => (
                            <div key={segment.id} className="p-3 rounded-lg bg-secondary/50">
                              <div className="flex items-center gap-2 mb-1">
                                <Badge variant="outline" className="text-xs">
                                  {formatDuration(segment.start)} - {formatDuration(segment.end)}
                                </Badge>
                              </div>
                              <p className="text-sm">&quot;{segment.text}&quot;</p>
                            </div>
                          ))}
                      </div>
                    ) : (
                      <p className="text-sm text-muted-foreground text-center py-8">
                        {content.status === 'ready' 
                          ? 'No highlights detected'
                          : 'Highlights will appear after processing'}
                      </p>
                    )}
                  </ScrollArea>
                </CardContent>
              </Card>

              {/* Recent Clips */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg flex items-center gap-2">
                    <Scissors className="w-5 h-5 text-accent" />
                    Suggested Clips
                  </CardTitle>
                  <CardDescription>Auto-generated clip suggestions</CardDescription>
                </CardHeader>
                <CardContent>
                  <ScrollArea className="h-64">
                    {clips.length > 0 ? (
                      <div className="space-y-3">
                        {clips.slice(0, 5).map((clip) => (
                          <div key={clip.id} className="p-3 rounded-lg bg-secondary/50">
                            <div className="flex items-center justify-between mb-1">
                              <span className="font-medium text-sm truncate flex-1">{clip.title}</span>
                              {clip.viralScore && (
                                <Badge variant="secondary" className="ml-2">
                                  <TrendingUp className="w-3 h-3 mr-1" />
                                  {clip.viralScore}%
                                </Badge>
                              )}
                            </div>
                            <div className="flex items-center gap-2 text-xs text-muted-foreground">
                              <Clock className="w-3 h-3" />
                              {formatDuration(clip.duration)}
                              <Badge variant="outline" className="text-xs">{clip.aspectRatio}</Badge>
                              <Badge variant={clip.status === 'ready' ? 'default' : 'secondary'} className="capitalize text-xs">
                                {clip.status}
                              </Badge>
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="text-sm text-muted-foreground text-center py-8">
                        {content.status === 'ready' 
                          ? 'No clips generated yet'
                          : 'Clips will appear after processing'}
                      </p>
                    )}
                  </ScrollArea>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="clips" className="mt-6">
            {clips.length > 0 ? (
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {clips.map((clip) => (
                  <Card key={clip.id} className="overflow-hidden">
                    <div className="aspect-video bg-muted relative">
                      {clip.thumbnailUrl ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                          src={clip.thumbnailUrl}
                          alt={clip.title}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center">
                          <Play className="w-8 h-8 text-muted-foreground/50" />
                        </div>
                      )}
                      <div className="absolute bottom-2 right-2 px-2 py-1 rounded bg-black/70 text-xs text-white">
                        {formatDuration(clip.duration)}
                      </div>
                      <Badge 
                        className="absolute top-2 left-2 capitalize"
                        variant={clip.status === 'ready' ? 'default' : 'secondary'}
                      >
                        {clip.status}
                      </Badge>
                      {clip.viralScore && (
                        <div className="absolute top-2 right-2 px-2 py-1 rounded bg-accent text-accent-foreground text-xs">
                          <TrendingUp className="w-3 h-3 inline mr-1" />
                          {clip.viralScore}%
                        </div>
                      )}
                    </div>
                    <CardContent className="p-4">
                      <h3 className="font-medium truncate">{clip.title}</h3>
                      <div className="flex items-center gap-2 mt-2">
                        <Badge variant="outline" className="text-xs">{clip.aspectRatio}</Badge>
                        {clip.status === 'pending' && (
                          <Button size="sm" variant="secondary" onClick={() => handleGenerateClip(clip.id)}>
                            <Sparkles className="w-3 h-3 mr-1" />
                            Generate
                          </Button>
                        )}
                        {clip.status === 'ready' && clip.fileUrl && (
                          <Button size="sm" variant="secondary" asChild>
                            <a href={clip.fileUrl} download>
                              <Download className="w-3 h-3 mr-1" />
                              Download
                            </a>
                          </Button>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : (
              <Card className="p-12 text-center">
                <Scissors className="w-12 h-12 text-muted-foreground/50 mx-auto mb-4" />
                <h3 className="text-lg font-semibold mb-2">No clips yet</h3>
                <p className="text-sm text-muted-foreground">
                  Clips will be generated after content processing
                </p>
              </Card>
            )}
          </TabsContent>

          <TabsContent value="posts" className="mt-6">
            {generatedContents.length > 0 ? (
              <div className="grid gap-4 lg:grid-cols-2">
                {generatedContents.map((post) => (
                  <Card key={post.id}>
                    <CardHeader className="pb-3">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          {getPlatformIcon(post.platform)}
                          <CardTitle className="text-base capitalize">{post.platform}</CardTitle>
                          <Badge variant="outline" className="text-xs capitalize">{post.type}</Badge>
                        </div>
                        <Badge variant={post.status === 'published' ? 'default' : 'secondary'} className="capitalize">
                          {post.status}
                        </Badge>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <p className="text-sm whitespace-pre-wrap bg-secondary/50 p-3 rounded-lg max-h-40 overflow-y-auto">
                        {post.content}
                      </p>
                      <div className="flex items-center gap-2 mt-3">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleCopyContent(post.content, post.id)}
                        >
                          {copiedId === post.id ? (
                            <>
                              <Check className="w-3 h-3 mr-1" />
                              Copied
                            </>
                          ) : (
                            <>
                              <Copy className="w-3 h-3 mr-1" />
                              Copy
                            </>
                          )}
                        </Button>
                        {post.status === 'draft' && (
                          <Button size="sm" variant="secondary">
                            <Share2 className="w-3 h-3 mr-1" />
                            Publish
                          </Button>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : (
              <Card className="p-12 text-center">
                <FileText className="w-12 h-12 text-muted-foreground/50 mx-auto mb-4" />
                <h3 className="text-lg font-semibold mb-2">No posts generated</h3>
                <p className="text-sm text-muted-foreground mb-4">
                  Generate social media posts from your content
                </p>
                {content.status === 'ready' && (
                  <Button onClick={handleGenerateContent} disabled={isGenerating}>
                    {isGenerating ? (
                      <>
                        <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                        Generating...
                      </>
                    ) : (
                      <>
                        <Sparkles className="w-4 h-4 mr-2" />
                        Generate Posts
                      </>
                    )}
                  </Button>
                )}
              </Card>
            )}
          </TabsContent>

          <TabsContent value="transcript" className="mt-6">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Full Transcript</CardTitle>
                <CardDescription>
                  {content.transcription 
                    ? `${content.transcription.split(' ').length} words`
                    : 'Transcript will appear after processing'}
                </CardDescription>
              </CardHeader>
              <CardContent>
                {content.transcription ? (
                  <>
                    <div className="flex justify-end mb-4">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleCopyContent(content.transcription || '', 'transcript')}
                      >
                        {copiedId === 'transcript' ? (
                          <>
                            <Check className="w-3 h-3 mr-1" />
                            Copied
                          </>
                        ) : (
                          <>
                            <Copy className="w-3 h-3 mr-1" />
                            Copy All
                          </>
                        )}
                      </Button>
                    </div>
                    <ScrollArea className="h-96">
                      <div className="space-y-4 pr-4">
                        {content.transcriptionSegments?.map((segment) => (
                          <div
                            key={segment.id}
                            className={`p-3 rounded-lg transition-colors ${
                              segment.isHighlight 
                                ? 'bg-primary/10 border border-primary/30' 
                                : 'bg-secondary/30'
                            }`}
                          >
                            <div className="flex items-center gap-2 mb-1">
                              <Badge variant="outline" className="text-xs font-mono">
                                {formatDuration(segment.start)}
                              </Badge>
                              {segment.isHighlight && (
                                <Badge variant="default" className="text-xs">
                                  <Sparkles className="w-3 h-3 mr-1" />
                                  Highlight
                                </Badge>
                              )}
                            </div>
                            <p className="text-sm">{segment.text}</p>
                          </div>
                        )) || (
                          <p className="text-sm whitespace-pre-wrap">{content.transcription}</p>
                        )}
                      </div>
                    </ScrollArea>
                  </>
                ) : (
                  <div className="text-center py-12">
                    <FileText className="w-12 h-12 text-muted-foreground/50 mx-auto mb-4" />
                    <p className="text-muted-foreground">
                      {content.status === 'ready'
                        ? 'No transcript available'
                        : 'Transcript will appear after processing'}
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}

