import { useState } from 'react';
import { useNavigate } from '@tanstack/react-router';
import { useInternetIdentity } from '@/hooks/useInternetIdentity';
import { useGetCallerUserProfile } from '@/hooks/useProfiles';
import { useTransportKey } from '@/hooks/useTransportKey';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Copy, Check, Key, RefreshCw, User, Shield, ExternalLink } from 'lucide-react';
import { toast } from 'sonner';
import { TransportKeyDiagnosticsPanel } from '@/components/dashboard/TransportKeyDiagnosticsPanel';
import { TokensSection } from '@/components/dashboard/TokensSection';

export default function DashboardPage() {
  const navigate = useNavigate();
  const { identity } = useInternetIdentity();
  const { data: userProfile, isFetched: profileFetched } = useGetCallerUserProfile();
  const { keyPair, isRegistered, isGenerating, generateAndRegister, vetKey } = useTransportKey();
  const [copiedPrincipal, setCopiedPrincipal] = useState(false);
  const [copiedVetKey, setCopiedVetKey] = useState(false);

  const principal = identity?.getPrincipal().toString() || '';

  const handleCopyPrincipal = async () => {
    try {
      await navigator.clipboard.writeText(principal);
      setCopiedPrincipal(true);
      toast.success('Principal copied to clipboard');
      setTimeout(() => setCopiedPrincipal(false), 2000);
    } catch (error) {
      toast.error('Failed to copy principal');
    }
  };

  const handleCopyVetKey = async () => {
    if (!vetKey) {
      toast.error('No vetKey available');
      return;
    }
    try {
      await navigator.clipboard.writeText(vetKey);
      setCopiedVetKey(true);
      toast.success('VetKey copied to clipboard');
      setTimeout(() => setCopiedVetKey(false), 2000);
    } catch (error) {
      toast.error('Failed to copy vetKey');
    }
  };

  const handleGoToCompose = () => {
    if (!vetKey) {
      toast.error('No vetKey available. Generate a transport key first.');
      return;
    }
    navigate({ to: '/compose', search: { vetKey } });
  };

  const handleCopyComposeLink = async () => {
    if (!vetKey) {
      toast.error('No vetKey available. Generate a transport key first.');
      return;
    }
    try {
      const composeUrl = `${window.location.origin}${window.location.pathname}#/compose?vetKey=${encodeURIComponent(vetKey)}`;
      await navigator.clipboard.writeText(composeUrl);
      toast.success('Compose link copied to clipboard');
    } catch (error) {
      toast.error('Failed to copy compose link');
    }
  };

  // Derive diagnostics state
  const keyPairLoaded = !!keyPair;
  const profileLoaded = profileFetched && !!userProfile;

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div>
        <h1 className="text-3xl font-semibold tracking-tight">Dashboard</h1>
        <p className="text-muted-foreground mt-1">
          Secure messaging system status and identity information
        </p>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <User className="h-5 w-5 text-primary" />
              <CardTitle>Identity</CardTitle>
            </div>
            <CardDescription>Your profile and public address</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <p className="text-sm font-medium mb-1">Name</p>
              <p className="text-lg">{userProfile?.name || 'Not set'}</p>
            </div>
            <Separator />
            <div>
              <p className="text-sm font-medium mb-2">Public Address (Principal)</p>
              <div className="flex items-start gap-2">
                <code className="flex-1 text-xs bg-muted p-2 rounded font-mono-code break-all">
                  {principal}
                </code>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleCopyPrincipal}
                  className="shrink-0"
                >
                  {copiedPrincipal ? (
                    <Check className="h-4 w-4" />
                  ) : (
                    <Copy className="h-4 w-4" />
                  )}
                </Button>
              </div>
              <p className="text-xs text-muted-foreground mt-2">
                Share this address with others to allow them to add you as a trusted contact
              </p>
            </div>
          </CardContent>
        </Card>

        <div className="space-y-4">
          <Card>
            <CardHeader>
              <div className="flex items-center gap-2">
                <Key className="h-5 w-5 text-primary" />
                <CardTitle>Transport Key</CardTitle>
              </div>
              <CardDescription>End-to-end encryption key status</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium">Registration Status</p>
                  <p className="text-xs text-muted-foreground mt-1">
                    {isRegistered
                      ? 'Your transport key is active'
                      : 'No transport key registered'}
                  </p>
                </div>
                <Badge variant={isRegistered ? 'default' : 'secondary'}>
                  {isRegistered ? 'Active' : 'Inactive'}
                </Badge>
              </div>
              <Separator />
              <div>
                <p className="text-sm text-muted-foreground mb-3">
                  Transport keys enable secure end-to-end encryption. Your private key never leaves
                  this device.
                </p>
                <Button
                  onClick={generateAndRegister}
                  disabled={isGenerating}
                  variant="outline"
                  className="w-full gap-2"
                >
                  <RefreshCw className={`h-4 w-4 ${isGenerating ? 'animate-spin' : ''}`} />
                  {isGenerating
                    ? 'Generating...'
                    : isRegistered
                      ? 'Rotate Key'
                      : 'Generate Key'}
                </Button>
              </div>
            </CardContent>
          </Card>

          <TransportKeyDiagnosticsPanel
            keyPairLoaded={keyPairLoaded}
            isRegistered={isRegistered}
            isGenerating={isGenerating}
            profileLoaded={profileLoaded}
            vetKey={vetKey}
          />
        </div>
      </div>

      {vetKey && (
        <Card>
          <CardHeader>
            <CardTitle>Session Key Access</CardTitle>
            <CardDescription>
              Use your vetKey to access your transport key in the Compose page
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <p className="text-sm font-medium mb-2">VetKey (Session Identifier)</p>
              <div className="flex items-start gap-2">
                <code className="flex-1 text-xs bg-muted p-2 rounded font-mono-code break-all">
                  {vetKey}
                </code>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleCopyVetKey}
                  className="shrink-0"
                >
                  {copiedVetKey ? (
                    <Check className="h-4 w-4" />
                  ) : (
                    <Copy className="h-4 w-4" />
                  )}
                </Button>
              </div>
              <p className="text-xs text-muted-foreground mt-2">
                This session key allows you to access your transport keypair across tabs and page reloads
              </p>
            </div>
            <Separator />
            <div className="flex gap-2">
              <Button
                onClick={handleGoToCompose}
                className="flex-1 gap-2"
              >
                <ExternalLink className="h-4 w-4" />
                Go to Compose
              </Button>
              <Button
                onClick={handleCopyComposeLink}
                variant="outline"
                className="flex-1 gap-2"
              >
                <Copy className="h-4 w-4" />
                Copy Compose Link
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      <TokensSection principal={principal} />

      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Shield className="h-5 w-5 text-primary" />
            <CardTitle>Security Information</CardTitle>
          </div>
        </CardHeader>
        <CardContent className="space-y-3 text-sm">
          <div className="flex gap-3">
            <div className="shrink-0 mt-0.5">
              <div className="h-2 w-2 rounded-full bg-primary" />
            </div>
            <div>
              <p className="font-medium">Device-Only Private Keys</p>
              <p className="text-muted-foreground">
                Your transport private key is generated on this device and never transmitted to the
                backend or any other party.
              </p>
            </div>
          </div>
          <div className="flex gap-3">
            <div className="shrink-0 mt-0.5">
              <div className="h-2 w-2 rounded-full bg-primary" />
            </div>
            <div>
              <p className="font-medium">End-to-End Encryption</p>
              <p className="text-muted-foreground">
                All message payloads are encrypted locally before sending and decrypted only on the
                recipient's device.
              </p>
            </div>
          </div>
          <div className="flex gap-3">
            <div className="shrink-0 mt-0.5">
              <div className="h-2 w-2 rounded-full bg-primary" />
            </div>
            <div>
              <p className="font-medium">Permissioned Messaging</p>
              <p className="text-muted-foreground">
                You can only exchange messages with users you've added as trusted contacts, and who
                have also added you.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
