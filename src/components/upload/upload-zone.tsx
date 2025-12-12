'use client';

import { useCallback, useState } from 'react';
import { useDropzone } from 'react-dropzone';
import { Upload, Link2, Loader2, CheckCircle2, AlertCircle, Film, Music } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Progress } from '@/components/ui/progress';
import { cn, formatBytes, isValidYouTubeUrl, isValidTikTokUrl } from '@/lib/utils';
import { SUPPORTED_VIDEO_TYPES, SUPPORTED_AUDIO_TYPES } from '@/lib/storage/r2';
import { toast } from 'sonner';

interface UploadZoneProps {
  onUploadComplete?: (contentId: string) => void;
  onUploadStart?: () => void;
  className?: string;
}

type UploadStatus = 'idle' | 'preparing' | 'uploading' | 'processing' | 'complete' | 'error';

export function UploadZone({ onUploadComplete, onUploadStart, className }: UploadZoneProps) {
  const [uploadStatus, setUploadStatus] = useState<UploadStatus>('idle');
  const [uploadProgress, setUploadProgress] = useState(0);
  const [currentFile, setCurrentFile] = useState<File | null>(null);
  const [urlInput, setUrlInput] = useState('');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const uploadFile = async (file: File) => {
    setCurrentFile(file);
    setUploadStatus('preparing');
    setUploadProgress(0);
    setErrorMessage(null);
    onUploadStart?.();

    try {
      // Get pre-signed upload URL
      const response = await fetch('/api/upload', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          filename: file.name,
          contentType: file.type,
          fileSize: file.size,
          title: file.name.replace(/\.[^/.]+$/, ''),
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to prepare upload');
      }

      const { uploadUrl, contentId } = await response.json();

      // Upload file to R2
      setUploadStatus('uploading');
      
      const xhr = new XMLHttpRequest();
      
      await new Promise<void>((resolve, reject) => {
        xhr.upload.addEventListener('progress', (event) => {
          if (event.lengthComputable) {
            const progress = Math.round((event.loaded / event.total) * 100);
            setUploadProgress(progress);
          }
        });

        xhr.addEventListener('load', () => {
          if (xhr.status >= 200 && xhr.status < 300) {
            resolve();
          } else {
            reject(new Error('Upload failed'));
          }
        });

        xhr.addEventListener('error', () => reject(new Error('Upload failed')));
        xhr.addEventListener('abort', () => reject(new Error('Upload cancelled')));

        xhr.open('PUT', uploadUrl);
        xhr.setRequestHeader('Content-Type', file.type);
        xhr.send(file);
      });

      // Confirm upload completion
      setUploadStatus('processing');
      const confirmResponse = await fetch('/api/upload', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ contentId }),
      });

      if (!confirmResponse.ok) {
        throw new Error('Failed to confirm upload');
      }

      setUploadStatus('complete');
      toast.success('Upload complete! Processing your content...');
      onUploadComplete?.(contentId);

      // Reset after a delay
      setTimeout(() => {
        setUploadStatus('idle');
        setCurrentFile(null);
        setUploadProgress(0);
      }, 3000);
    } catch (error) {
      console.error('Upload error:', error);
      setUploadStatus('error');
      setErrorMessage(error instanceof Error ? error.message : 'Upload failed');
      toast.error(error instanceof Error ? error.message : 'Upload failed');
    }
  };

  const handleUrlSubmit = async () => {
    if (!urlInput.trim()) {
      toast.error('Please enter a URL');
      return;
    }

    const isYouTube = isValidYouTubeUrl(urlInput);
    const isTikTok = isValidTikTokUrl(urlInput);

    if (!isYouTube && !isTikTok) {
      toast.error('Please enter a valid YouTube or TikTok URL');
      return;
    }

    setUploadStatus('preparing');
    setErrorMessage(null);
    onUploadStart?.();

    try {
      const response = await fetch('/api/import-url', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          url: urlInput,
          sourceType: isYouTube ? 'youtube' : 'tiktok',
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to import content');
      }

      const { contentId } = await response.json();
      
      setUploadStatus('complete');
      toast.success('Content imported! Processing...');
      onUploadComplete?.(contentId);

      setTimeout(() => {
        setUploadStatus('idle');
        setUrlInput('');
      }, 3000);
    } catch (error) {
      console.error('Import error:', error);
      setUploadStatus('error');
      setErrorMessage(error instanceof Error ? error.message : 'Import failed');
      toast.error(error instanceof Error ? error.message : 'Import failed');
    }
  };

  const onDrop = useCallback((acceptedFiles: File[]) => {
    const file = acceptedFiles[0];
    if (file) {
      uploadFile(file);
    }
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'video/*': SUPPORTED_VIDEO_TYPES.map(t => `.${t.split('/')[1]}`),
      'audio/*': SUPPORTED_AUDIO_TYPES.map(t => `.${t.split('/')[1]}`),
    },
    maxFiles: 1,
    disabled: uploadStatus !== 'idle',
  });

  const getStatusIcon = () => {
    switch (uploadStatus) {
      case 'preparing':
      case 'uploading':
      case 'processing':
        return <Loader2 className="w-12 h-12 text-primary animate-spin" />;
      case 'complete':
        return <CheckCircle2 className="w-12 h-12 text-green-500" />;
      case 'error':
        return <AlertCircle className="w-12 h-12 text-destructive" />;
      default:
        return <Upload className="w-12 h-12 text-muted-foreground" />;
    }
  };

  const getStatusText = () => {
    switch (uploadStatus) {
      case 'preparing':
        return 'Preparing upload...';
      case 'uploading':
        return `Uploading... ${uploadProgress}%`;
      case 'processing':
        return 'Processing your content...';
      case 'complete':
        return 'Upload complete!';
      case 'error':
        return errorMessage || 'Upload failed';
      default:
        return isDragActive
          ? 'Drop your file here...'
          : 'Drag & drop your video or audio file here';
    }
  };

  return (
    <div className={cn('w-full', className)}>
      <Tabs defaultValue="upload" className="w-full">
        <TabsList className="grid w-full grid-cols-2 mb-6">
          <TabsTrigger value="upload" className="gap-2">
            <Upload className="w-4 h-4" />
            Upload File
          </TabsTrigger>
          <TabsTrigger value="url" className="gap-2">
            <Link2 className="w-4 h-4" />
            Import URL
          </TabsTrigger>
        </TabsList>

        <TabsContent value="upload" className="mt-0">
          <div
            {...getRootProps()}
            className={cn(
              'relative flex flex-col items-center justify-center w-full min-h-[300px] p-8',
              'border-2 border-dashed rounded-xl transition-all duration-300 cursor-pointer',
              'bg-card/50 hover:bg-card/80',
              isDragActive && 'border-primary bg-primary/5 scale-[1.02]',
              uploadStatus === 'error' && 'border-destructive bg-destructive/5',
              uploadStatus === 'complete' && 'border-green-500 bg-green-500/5',
              uploadStatus !== 'idle' && uploadStatus !== 'error' && uploadStatus !== 'complete' && 'pointer-events-none'
            )}
          >
            <input {...getInputProps()} />
            
            {/* Animated background */}
            {isDragActive && (
              <div className="absolute inset-0 overflow-hidden rounded-xl">
                <div className="absolute inset-0 bg-gradient-to-r from-primary/10 via-accent/10 to-primary/10 animate-pulse" />
              </div>
            )}

            <div className="relative z-10 flex flex-col items-center text-center">
              {getStatusIcon()}
              
              <p className="mt-4 text-lg font-medium">
                {getStatusText()}
              </p>

              {uploadStatus === 'idle' && (
                <>
                  <p className="mt-2 text-sm text-muted-foreground">
                    or click to browse files
                  </p>
                  <div className="flex items-center gap-4 mt-4 text-xs text-muted-foreground">
                    <div className="flex items-center gap-1">
                      <Film className="w-4 h-4" />
                      MP4, MOV, WebM
                    </div>
                    <div className="flex items-center gap-1">
                      <Music className="w-4 h-4" />
                      MP3, WAV, M4A
                    </div>
                  </div>
                </>
              )}

              {uploadStatus === 'uploading' && (
                <div className="w-full max-w-xs mt-4">
                  <Progress value={uploadProgress} className="h-2" />
                  {currentFile && (
                    <p className="mt-2 text-xs text-muted-foreground">
                      {currentFile.name} ({formatBytes(currentFile.size)})
                    </p>
                  )}
                </div>
              )}

              {uploadStatus === 'error' && (
                <Button
                  variant="outline"
                  className="mt-4"
                  onClick={(e) => {
                    e.stopPropagation();
                    setUploadStatus('idle');
                    setErrorMessage(null);
                  }}
                >
                  Try Again
                </Button>
              )}
            </div>
          </div>
        </TabsContent>

        <TabsContent value="url" className="mt-0">
          <div className="flex flex-col items-center justify-center w-full min-h-[300px] p-8 border-2 border-dashed rounded-xl bg-card/50">
            <Link2 className="w-12 h-12 text-muted-foreground mb-4" />
            
            <div className="w-full max-w-md space-y-4">
              <div className="space-y-2">
                <Label htmlFor="url-input">YouTube or TikTok URL</Label>
                <Input
                  id="url-input"
                  type="url"
                  placeholder="https://youtube.com/watch?v=... or https://tiktok.com/@user/video/..."
                  value={urlInput}
                  onChange={(e) => setUrlInput(e.target.value)}
                  disabled={uploadStatus !== 'idle'}
                  className="h-12"
                />
              </div>

              <Button
                onClick={handleUrlSubmit}
                disabled={uploadStatus !== 'idle' || !urlInput.trim()}
                className="w-full h-12 gap-2"
              >
                {uploadStatus === 'preparing' ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Importing...
                  </>
                ) : (
                  <>
                    <Link2 className="w-4 h-4" />
                    Import Content
                  </>
                )}
              </Button>

              <p className="text-xs text-center text-muted-foreground">
                We&apos;ll download and process the content automatically
              </p>
            </div>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}


