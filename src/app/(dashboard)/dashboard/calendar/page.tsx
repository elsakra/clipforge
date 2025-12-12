'use client';

import { useState, useEffect } from 'react';
import { DashboardHeader } from '@/components/layout/dashboard-header';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Calendar } from '@/components/ui/calendar';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Calendar as CalendarIcon,
  Clock,
  Twitter,
  Linkedin,
  Instagram,
  Plus,
  Edit2,
  Trash2,
  Send,
} from 'lucide-react';
import { format, isSameDay, addDays, startOfWeek, endOfWeek } from 'date-fns';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

interface ScheduledPost {
  id: string;
  content: string;
  platform: string;
  scheduledAt: Date;
  status: 'scheduled' | 'published' | 'failed';
  generatedContentId: string;
}

const platformIcons: Record<string, React.ReactNode> = {
  twitter: <Twitter className="w-4 h-4" />,
  linkedin: <Linkedin className="w-4 h-4" />,
  instagram: <Instagram className="w-4 h-4" />,
};

const platformColors: Record<string, string> = {
  twitter: 'bg-blue-500',
  linkedin: 'bg-blue-700',
  instagram: 'bg-pink-500',
};

export default function CalendarPage() {
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [scheduledPosts, setScheduledPosts] = useState<ScheduledPost[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [newPost, setNewPost] = useState({
    content: '',
    platform: 'twitter',
    scheduledDate: new Date(),
    scheduledTime: '09:00',
  });

  useEffect(() => {
    fetchScheduledPosts();
  }, []);

  const fetchScheduledPosts = async () => {
    try {
      const response = await fetch('/api/schedule');
      const data = await response.json();
      if (data.success) {
        setScheduledPosts(
          data.posts.map((p: ScheduledPost) => ({
            ...p,
            scheduledAt: new Date(p.scheduledAt),
          }))
        );
      }
    } catch (error) {
      console.error('Error fetching scheduled posts:', error);
      // Mock data for demo
      setScheduledPosts([
        {
          id: '1',
          content: 'Excited to share our Q4 marketing results! 📈',
          platform: 'twitter',
          scheduledAt: addDays(new Date(), 1),
          status: 'scheduled',
          generatedContentId: '1',
        },
        {
          id: '2',
          content: 'New product launch coming soon...',
          platform: 'linkedin',
          scheduledAt: addDays(new Date(), 2),
          status: 'scheduled',
          generatedContentId: '2',
        },
        {
          id: '3',
          content: 'Behind the scenes of our latest project ✨',
          platform: 'instagram',
          scheduledAt: addDays(new Date(), 3),
          status: 'scheduled',
          generatedContentId: '3',
        },
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSchedulePost = async () => {
    try {
      const scheduledAt = new Date(newPost.scheduledDate);
      const [hours, minutes] = newPost.scheduledTime.split(':');
      scheduledAt.setHours(parseInt(hours), parseInt(minutes));

      const response = await fetch('/api/schedule', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          content: newPost.content,
          platform: newPost.platform,
          scheduledAt: scheduledAt.toISOString(),
        }),
      });

      if (response.ok) {
        toast.success('Post scheduled successfully');
        setIsDialogOpen(false);
        fetchScheduledPosts();
      }
    } catch (error) {
      toast.error('Failed to schedule post');
    }
  };

  const handleDeleteScheduledPost = async (postId: string) => {
    try {
      const response = await fetch(`/api/schedule?postId=${postId}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        setScheduledPosts(scheduledPosts.filter((p) => p.id !== postId));
        toast.success('Scheduled post deleted');
      }
    } catch (error) {
      toast.error('Failed to delete scheduled post');
    }
  };

  const postsForSelectedDate = scheduledPosts.filter((post) =>
    isSameDay(post.scheduledAt, selectedDate)
  );

  const getPostsForDate = (date: Date) =>
    scheduledPosts.filter((post) => isSameDay(post.scheduledAt, date));

  // Get week view posts
  const weekStart = startOfWeek(selectedDate);
  const weekEnd = endOfWeek(selectedDate);
  const weekDays = Array.from({ length: 7 }, (_, i) => addDays(weekStart, i));

  return (
    <div className="min-h-screen">
      <DashboardHeader
        title="Content Calendar"
        description="Schedule and manage your social media posts"
      />

      <div className="p-6">
        <div className="grid lg:grid-cols-3 gap-6">
          {/* Calendar */}
          <Card className="lg:col-span-1">
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="text-lg">Calendar</CardTitle>
              <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                <DialogTrigger asChild>
                  <Button size="sm">
                    <Plus className="w-4 h-4 mr-1" />
                    Schedule
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Schedule New Post</DialogTitle>
                    <DialogDescription>
                      Create and schedule a post for your social media accounts.
                    </DialogDescription>
                  </DialogHeader>

                  <div className="space-y-4 py-4">
                    <div className="space-y-2">
                      <Label>Platform</Label>
                      <Select
                        value={newPost.platform}
                        onValueChange={(v) => setNewPost({ ...newPost, platform: v })}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="twitter">Twitter/X</SelectItem>
                          <SelectItem value="linkedin">LinkedIn</SelectItem>
                          <SelectItem value="instagram">Instagram</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-2">
                      <Label>Content</Label>
                      <Textarea
                        placeholder="What do you want to share?"
                        value={newPost.content}
                        onChange={(e) => setNewPost({ ...newPost, content: e.target.value })}
                        rows={4}
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label>Date</Label>
                        <Input
                          type="date"
                          value={format(newPost.scheduledDate, 'yyyy-MM-dd')}
                          onChange={(e) =>
                            setNewPost({ ...newPost, scheduledDate: new Date(e.target.value) })
                          }
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>Time</Label>
                        <Input
                          type="time"
                          value={newPost.scheduledTime}
                          onChange={(e) => setNewPost({ ...newPost, scheduledTime: e.target.value })}
                        />
                      </div>
                    </div>
                  </div>

                  <DialogFooter>
                    <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
                      Cancel
                    </Button>
                    <Button onClick={handleSchedulePost}>Schedule Post</Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
            </CardHeader>
            <CardContent>
              <Calendar
                mode="single"
                selected={selectedDate}
                onSelect={(date) => date && setSelectedDate(date)}
                className="rounded-md"
                modifiers={{
                  hasPost: (date) => getPostsForDate(date).length > 0,
                }}
                modifiersStyles={{
                  hasPost: {
                    fontWeight: 'bold',
                    textDecoration: 'underline',
                    textDecorationColor: 'hsl(var(--primary))',
                  },
                }}
              />
            </CardContent>
          </Card>

          {/* Week View */}
          <Card className="lg:col-span-2">
            <CardHeader>
              <CardTitle className="text-lg">
                Week of {format(weekStart, 'MMM d')} - {format(weekEnd, 'MMM d, yyyy')}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-7 gap-2">
                {weekDays.map((day) => {
                  const dayPosts = getPostsForDate(day);
                  const isSelected = isSameDay(day, selectedDate);
                  const isToday = isSameDay(day, new Date());

                  return (
                    <div
                      key={day.toISOString()}
                      className={cn(
                        'min-h-[120px] p-2 rounded-lg border cursor-pointer transition-colors',
                        isSelected && 'border-primary bg-primary/5',
                        isToday && !isSelected && 'border-accent',
                        !isSelected && !isToday && 'hover:bg-secondary/50'
                      )}
                      onClick={() => setSelectedDate(day)}
                    >
                      <div className="text-xs font-medium mb-1">
                        {format(day, 'EEE')}
                      </div>
                      <div
                        className={cn(
                          'text-lg font-semibold mb-2',
                          isToday && 'text-primary'
                        )}
                      >
                        {format(day, 'd')}
                      </div>

                      <div className="space-y-1">
                        {dayPosts.slice(0, 3).map((post) => (
                          <div
                            key={post.id}
                            className={cn(
                              'text-xs p-1 rounded truncate text-white',
                              platformColors[post.platform]
                            )}
                          >
                            {format(post.scheduledAt, 'HH:mm')}
                          </div>
                        ))}
                        {dayPosts.length > 3 && (
                          <div className="text-xs text-muted-foreground">
                            +{dayPosts.length - 3} more
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Selected Day Posts */}
        <Card className="mt-6">
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <CalendarIcon className="w-5 h-5" />
              {format(selectedDate, 'EEEE, MMMM d, yyyy')}
              <Badge variant="secondary">{postsForSelectedDate.length} posts</Badge>
            </CardTitle>
          </CardHeader>
          <CardContent>
            {postsForSelectedDate.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <CalendarIcon className="w-12 h-12 mx-auto mb-4 opacity-50" />
                <p>No posts scheduled for this day</p>
                <Button variant="outline" className="mt-4" onClick={() => setIsDialogOpen(true)}>
                  <Plus className="w-4 h-4 mr-2" />
                  Schedule a Post
                </Button>
              </div>
            ) : (
              <div className="space-y-4">
                {postsForSelectedDate
                  .sort((a, b) => a.scheduledAt.getTime() - b.scheduledAt.getTime())
                  .map((post) => (
                    <div
                      key={post.id}
                      className="flex gap-4 p-4 rounded-lg bg-secondary/30"
                    >
                      <div
                        className={cn(
                          'w-10 h-10 rounded-lg flex items-center justify-center text-white',
                          platformColors[post.platform]
                        )}
                      >
                        {platformIcons[post.platform]}
                      </div>

                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="font-medium capitalize">{post.platform}</span>
                          <Badge
                            variant={post.status === 'published' ? 'default' : 'secondary'}
                            className="capitalize"
                          >
                            {post.status}
                          </Badge>
                        </div>
                        <p className="text-sm text-muted-foreground line-clamp-2">
                          {post.content}
                        </p>
                        <div className="flex items-center gap-1 mt-2 text-xs text-muted-foreground">
                          <Clock className="w-3 h-3" />
                          {format(post.scheduledAt, 'h:mm a')}
                        </div>
                      </div>

                      <div className="flex items-start gap-1">
                        <Button variant="ghost" size="icon">
                          <Edit2 className="w-4 h-4" />
                        </Button>
                        <Button variant="ghost" size="icon">
                          <Send className="w-4 h-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleDeleteScheduledPost(post.id)}
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}


