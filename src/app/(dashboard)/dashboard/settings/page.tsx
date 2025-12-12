'use client';

import { useEffect, useState, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { useUser } from '@clerk/nextjs';
import { DashboardHeader } from '@/components/layout/dashboard-header';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Switch } from '@/components/ui/switch';
import { Separator } from '@/components/ui/separator';
import {
  User,
  CreditCard,
  Bell,
  Link2,
  Shield,
  Check,
  Twitter,
  Linkedin,
  Instagram,
  ExternalLink,
  Loader2,
} from 'lucide-react';
import { toast } from 'sonner';

function SettingsContent() {
  const { user, isLoaded } = useUser();
  const searchParams = useSearchParams();
  const [activeTab, setActiveTab] = useState('account');
  const [subscription, setSubscription] = useState<{
    plan: string;
    status: string;
    currentPeriodEnd: string | null;
  } | null>(null);
  const [isLoadingPortal, setIsLoadingPortal] = useState(false);

  useEffect(() => {
    // Check for success param
    if (searchParams.get('success')) {
      toast.success('Subscription activated! Welcome to ClipForge Pro.');
      setActiveTab('billing');
    }

    // Check for tab param
    const tab = searchParams.get('tab');
    if (tab && ['account', 'billing', 'notifications', 'integrations', 'security'].includes(tab)) {
      setActiveTab(tab);
    }

    // Fetch subscription info
    fetchSubscription();
  }, [searchParams]);

  const fetchSubscription = async () => {
    try {
      const response = await fetch('/api/user/subscription');
      const data = await response.json();
      if (data.success) {
        setSubscription(data.subscription);
      }
    } catch (error) {
      console.error('Error fetching subscription:', error);
    }
  };

  const handleManageBilling = async () => {
    setIsLoadingPortal(true);
    try {
      const response = await fetch('/api/stripe/portal', { method: 'POST' });
      const data = await response.json();
      if (data.url) {
        window.location.href = data.url;
      }
    } catch (error) {
      toast.error('Failed to open billing portal');
    } finally {
      setIsLoadingPortal(false);
    }
  };

  const connectedAccounts = [
    { platform: 'Twitter', icon: Twitter, connected: false, username: null },
    { platform: 'LinkedIn', icon: Linkedin, connected: true, username: 'john-doe' },
    { platform: 'Instagram', icon: Instagram, connected: false, username: null },
  ];

  return (
    <div className="min-h-screen">
      <DashboardHeader title="Settings" description="Manage your account and preferences" />

      <div className="p-6 max-w-4xl">
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="mb-6">
            <TabsTrigger value="account" className="gap-2">
              <User className="w-4 h-4" />
              Account
            </TabsTrigger>
            <TabsTrigger value="billing" className="gap-2">
              <CreditCard className="w-4 h-4" />
              Billing
            </TabsTrigger>
            <TabsTrigger value="notifications" className="gap-2">
              <Bell className="w-4 h-4" />
              Notifications
            </TabsTrigger>
            <TabsTrigger value="integrations" className="gap-2">
              <Link2 className="w-4 h-4" />
              Integrations
            </TabsTrigger>
            <TabsTrigger value="security" className="gap-2">
              <Shield className="w-4 h-4" />
              Security
            </TabsTrigger>
          </TabsList>

          {/* Account Tab */}
          <TabsContent value="account">
            <Card>
              <CardHeader>
                <CardTitle>Profile Information</CardTitle>
                <CardDescription>Update your account details</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid sm:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>First Name</Label>
                    <Input defaultValue={user?.firstName || ''} />
                  </div>
                  <div className="space-y-2">
                    <Label>Last Name</Label>
                    <Input defaultValue={user?.lastName || ''} />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label>Email</Label>
                  <Input
                    type="email"
                    defaultValue={user?.emailAddresses[0]?.emailAddress || ''}
                    disabled
                  />
                  <p className="text-xs text-muted-foreground">
                    Email is managed by your authentication provider
                  </p>
                </div>
                <Button>Save Changes</Button>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Billing Tab */}
          <TabsContent value="billing" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Current Plan</CardTitle>
                <CardDescription>Manage your subscription</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex items-center justify-between">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-2xl font-bold capitalize">
                        {subscription?.plan || 'Free'}
                      </span>
                      <Badge variant={subscription?.status === 'active' ? 'default' : 'secondary'}>
                        {subscription?.status || 'Active'}
                      </Badge>
                    </div>
                    {subscription?.currentPeriodEnd && (
                      <p className="text-sm text-muted-foreground mt-1">
                        Next billing date:{' '}
                        {new Date(subscription.currentPeriodEnd).toLocaleDateString()}
                      </p>
                    )}
                  </div>
                  <div className="flex gap-2">
                    {subscription && subscription.plan !== 'free' ? (
                      <Button variant="outline" onClick={handleManageBilling} disabled={isLoadingPortal}>
                        {isLoadingPortal ? (
                          <Loader2 className="w-4 h-4 animate-spin" />
                        ) : (
                          <>
                            Manage Billing
                            <ExternalLink className="w-4 h-4 ml-2" />
                          </>
                        )}
                      </Button>
                    ) : (
                      <Button asChild>
                        <a href="/pricing">Upgrade Plan</a>
                      </Button>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Usage This Month</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div>
                    <div className="flex justify-between text-sm mb-2">
                      <span>Videos Processed</span>
                      <span>3 / 10</span>
                    </div>
                    <div className="h-2 bg-secondary rounded-full">
                      <div className="h-full bg-primary rounded-full w-[30%]" />
                    </div>
                  </div>
                  <div>
                    <div className="flex justify-between text-sm mb-2">
                      <span>Storage Used</span>
                      <span>1.2 GB / 5 GB</span>
                    </div>
                    <div className="h-2 bg-secondary rounded-full">
                      <div className="h-full bg-primary rounded-full w-[24%]" />
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Notifications Tab */}
          <TabsContent value="notifications">
            <Card>
              <CardHeader>
                <CardTitle>Notification Preferences</CardTitle>
                <CardDescription>Choose how you want to be notified</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                {[
                  {
                    title: 'Processing Complete',
                    description: 'Get notified when your video is processed',
                    enabled: true,
                  },
                  {
                    title: 'Scheduled Posts',
                    description: 'Reminders before scheduled posts go live',
                    enabled: true,
                  },
                  {
                    title: 'Weekly Summary',
                    description: 'Weekly email with your analytics summary',
                    enabled: false,
                  },
                  {
                    title: 'Product Updates',
                    description: 'New features and improvements',
                    enabled: true,
                  },
                ].map((item, i) => (
                  <div key={i} className="flex items-center justify-between">
                    <div>
                      <p className="font-medium">{item.title}</p>
                      <p className="text-sm text-muted-foreground">{item.description}</p>
                    </div>
                    <Switch defaultChecked={item.enabled} />
                  </div>
                ))}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Integrations Tab */}
          <TabsContent value="integrations">
            <Card>
              <CardHeader>
                <CardTitle>Connected Accounts</CardTitle>
                <CardDescription>
                  Connect your social media accounts to publish content directly
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {connectedAccounts.map((account, i) => (
                  <div
                    key={i}
                    className="flex items-center justify-between p-4 rounded-lg bg-secondary/30"
                  >
                    <div className="flex items-center gap-3">
                      <account.icon className="w-5 h-5" />
                      <div>
                        <p className="font-medium">{account.platform}</p>
                        {account.connected && account.username && (
                          <p className="text-sm text-muted-foreground">@{account.username}</p>
                        )}
                      </div>
                    </div>
                    {account.connected ? (
                      <div className="flex items-center gap-2">
                        <Badge variant="secondary" className="gap-1">
                          <Check className="w-3 h-3" />
                          Connected
                        </Badge>
                        <Button variant="ghost" size="sm">
                          Disconnect
                        </Button>
                      </div>
                    ) : (
                      <Button size="sm">Connect</Button>
                    )}
                  </div>
                ))}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Security Tab */}
          <TabsContent value="security">
            <Card>
              <CardHeader>
                <CardTitle>Security Settings</CardTitle>
                <CardDescription>Manage your account security</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium">Two-Factor Authentication</p>
                    <p className="text-sm text-muted-foreground">
                      Add an extra layer of security to your account
                    </p>
                  </div>
                  <Button variant="outline">Enable 2FA</Button>
                </div>
                <Separator />
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium">Active Sessions</p>
                    <p className="text-sm text-muted-foreground">
                      Manage devices where you&apos;re logged in
                    </p>
                  </div>
                  <Button variant="outline">View Sessions</Button>
                </div>
                <Separator />
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium text-destructive">Delete Account</p>
                    <p className="text-sm text-muted-foreground">
                      Permanently delete your account and all data
                    </p>
                  </div>
                  <Button variant="destructive">Delete Account</Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}

export default function SettingsPage() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center">Loading...</div>}>
      <SettingsContent />
    </Suspense>
  );
}


