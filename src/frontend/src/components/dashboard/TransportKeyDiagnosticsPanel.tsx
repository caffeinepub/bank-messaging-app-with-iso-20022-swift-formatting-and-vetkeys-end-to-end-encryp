import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Copy, Check, AlertCircle, Bug } from 'lucide-react';
import { toast } from 'sonner';

interface TransportKeyDiagnosticsProps {
  keyPairLoaded: boolean;
  isRegistered: boolean;
  isGenerating: boolean;
  profileLoaded: boolean;
  vetKey?: string | null;
}

export function TransportKeyDiagnosticsPanel({
  keyPairLoaded,
  isRegistered,
  isGenerating,
  profileLoaded,
  vetKey,
}: TransportKeyDiagnosticsProps) {
  const [copied, setCopied] = useState(false);

  const handleCopyDiagnostics = async () => {
    const diagnostics = {
      timestamp: new Date().toISOString(),
      keyPairLoaded,
      isRegistered,
      isGenerating,
      profileLoaded,
      vetKeyPresent: !!vetKey,
      vetKey: vetKey || null,
    };

    try {
      await navigator.clipboard.writeText(JSON.stringify(diagnostics, null, 2));
      setCopied(true);
      toast.success('Diagnostics copied to clipboard');
      setTimeout(() => setCopied(false), 2000);
    } catch (error) {
      toast.error('Failed to copy diagnostics');
    }
  };

  return (
    <Card className="border-dashed">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Bug className="h-4 w-4 text-muted-foreground" />
            <CardTitle className="text-base">Transport Key Diagnostics</CardTitle>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={handleCopyDiagnostics}
            className="h-8 gap-2"
          >
            {copied ? (
              <>
                <Check className="h-3.5 w-3.5" />
                <span className="text-xs">Copied</span>
              </>
            ) : (
              <>
                <Copy className="h-3.5 w-3.5" />
                <span className="text-xs">Copy JSON</span>
              </>
            )}
          </Button>
        </div>
        <CardDescription className="text-xs">
          Debug information for troubleshooting transport key state
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="grid grid-cols-2 gap-3 text-sm">
          <div className="space-y-1">
            <p className="text-xs text-muted-foreground">Key Pair Loaded</p>
            <Badge variant={keyPairLoaded ? 'default' : 'secondary'} className="text-xs">
              {keyPairLoaded ? 'True' : 'False'}
            </Badge>
          </div>
          <div className="space-y-1">
            <p className="text-xs text-muted-foreground">Is Registered</p>
            <Badge variant={isRegistered ? 'default' : 'secondary'} className="text-xs">
              {isRegistered ? 'True' : 'False'}
            </Badge>
          </div>
          <div className="space-y-1">
            <p className="text-xs text-muted-foreground">Is Generating</p>
            <Badge variant={isGenerating ? 'default' : 'secondary'} className="text-xs">
              {isGenerating ? 'True' : 'False'}
            </Badge>
          </div>
          <div className="space-y-1">
            <p className="text-xs text-muted-foreground">Profile Loaded</p>
            <Badge variant={profileLoaded ? 'default' : 'secondary'} className="text-xs">
              {profileLoaded ? 'True' : 'False'}
            </Badge>
          </div>
          <div className="space-y-1 col-span-2">
            <p className="text-xs text-muted-foreground">VetKey Present</p>
            <Badge variant={vetKey ? 'default' : 'secondary'} className="text-xs">
              {vetKey ? 'True' : 'False'}
            </Badge>
          </div>
        </div>

        {vetKey && (
          <>
            <Separator />
            <div className="space-y-1">
              <p className="text-xs text-muted-foreground">Active VetKey</p>
              <code className="text-xs bg-muted p-2 rounded block break-all font-mono-code">
                {vetKey}
              </code>
            </div>
          </>
        )}

        {!keyPairLoaded && (
          <>
            <Separator />
            <div className="flex gap-2 p-3 bg-muted/50 rounded-md">
              <AlertCircle className="h-4 w-4 text-warning shrink-0 mt-0.5" />
              <div className="space-y-1">
                <p className="text-xs font-medium">Transport private key not loaded in this tab</p>
                <p className="text-xs text-muted-foreground">
                  The transport private key is not currently loaded in memory. This will prevent
                  sending messages even if registration is active. Press "Generate Key" or "Rotate
                  Key" above to load the key into this tab.
                </p>
              </div>
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
}
