'use client';

import { useRouter } from 'next/navigation';
import { DashboardHeader } from '@/components/layout/dashboard-header';
import { UploadZone } from '@/components/upload/upload-zone';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Sparkles, Zap, Clock, Target } from 'lucide-react';

export default function UploadPage() {
  const router = useRouter();

  const handleUploadComplete = (contentId: string) => {
    // Redirect to content page after upload
    setTimeout(() => {
      router.push(`/dashboard/content/${contentId}`);
    }, 2000);
  };

  const features = [
    {
      icon: Sparkles,
      title: 'AI Transcription',
      description: 'Automatic speech-to-text with speaker detection',
    },
    {
      icon: Zap,
      title: 'Viral Clip Detection',
      description: 'AI identifies the most engaging moments',
    },
    {
      icon: Clock,
      title: 'Quick Processing',
      description: 'Most videos processed in under 5 minutes',
    },
    {
      icon: Target,
      title: 'Multi-Platform',
      description: 'Optimized content for every social platform',
    },
  ];

  return (
    <div className="min-h-screen">
      <DashboardHeader
        title="Upload Content"
        description="Upload your video or audio to start creating"
        showUploadButton={false}
      />

      <div className="p-6 max-w-5xl mx-auto">
        <Card className="mb-8">
          <CardHeader>
            <CardTitle>Upload New Content</CardTitle>
            <CardDescription>
              Upload a video or audio file, or import directly from YouTube or TikTok
            </CardDescription>
          </CardHeader>
          <CardContent>
            <UploadZone onUploadComplete={handleUploadComplete} />
          </CardContent>
        </Card>

        {/* Features */}
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4">
          {features.map((feature, index) => (
            <Card key={index} className="bg-card/50">
              <CardContent className="p-4">
                <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center mb-3">
                  <feature.icon className="w-5 h-5 text-primary" />
                </div>
                <h3 className="font-medium mb-1">{feature.title}</h3>
                <p className="text-sm text-muted-foreground">{feature.description}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </div>
  );
}


