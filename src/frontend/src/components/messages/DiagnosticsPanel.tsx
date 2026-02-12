import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Copy, Check, Bug } from 'lucide-react';
import { toast } from 'sonner';

interface DiagnosticsPanelProps {
  callerHasPublicKey: boolean;
  otherHasPublicKey: boolean;
  isMutuallyTrusted: boolean;
  keyPairLoaded: boolean;
  vetKeyPresent?: boolean;
}

export default function DiagnosticsPanel({
  callerHasPublicKey,
  otherHasPublicKey,
  isMutuallyTrusted,
  keyPairLoaded,
  vetKeyPresent = false,
}: DiagnosticsPanelProps) {
  const [copied, setCopied] = useState(false);

  const canSend = callerHasPublicKey && otherHasPublicKey && isMutuallyTrusted && keyPairLoaded;

  const getDisabledReason = (): string => {
    if (!callerHasPublicKey) {
      return 'Your transport key is not registered on the backend';
    }
    if (!keyPairLoaded) {
      return 'Your transport private key is not loaded in this tab/device';
    }
    if (!otherHasPublicKey) {
      return 'Recipient has not registered a transport key';
    }
    if (!isMutuallyTrusted) {
      return 'You and the recipient are not mutually trusted contacts';
    }
    return 'All checks passed - ready to send';
  };

  const handleCopyDiagnostics = async () => {
    const diagnostics = {
      timestamp: new Date().toISOString(),
      callerHasPublicKey,
      otherHasPublicKey,
      isMutuallyTrusted,
      keyPairLoaded,
      vetKeyPresent,
      canSend,
      disabledReason: getDisabledReason(),
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
            <CardTitle className="text-base">Send Eligibility Diagnostics</CardTitle>
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
          Debug information for troubleshooting message send issues
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="grid grid-cols-2 gap-3 text-sm">
          <div className="space-y-1">
            <p className="text-xs text-muted-foreground">Your Public Key Registered</p>
            <Badge variant={callerHasPublicKey ? 'default' : 'secondary'} className="text-xs">
              {callerHasPublicKey ? 'True' : 'False'}
            </Badge>
          </div>
          <div className="space-y-1">
            <p className="text-xs text-muted-foreground">Recipient Public Key Registered</p>
            <Badge variant={otherHasPublicKey ? 'default' : 'secondary'} className="text-xs">
              {otherHasPublicKey ? 'True' : 'False'}
            </Badge>
          </div>
          <div className="space-y-1">
            <p className="text-xs text-muted-foreground">Mutually Trusted</p>
            <Badge variant={isMutuallyTrusted ? 'default' : 'secondary'} className="text-xs">
              {isMutuallyTrusted ? 'True' : 'False'}
            </Badge>
          </div>
          <div className="space-y-1">
            <p className="text-xs text-muted-foreground">Your Private Key Loaded</p>
            <Badge variant={keyPairLoaded ? 'default' : 'secondary'} className="text-xs">
              {keyPairLoaded ? 'True' : 'False'}
            </Badge>
          </div>
          <div className="space-y-1">
            <p className="text-xs text-muted-foreground">VetKey Present</p>
            <Badge variant={vetKeyPresent ? 'default' : 'secondary'} className="text-xs">
              {vetKeyPresent ? 'True' : 'False'}
            </Badge>
          </div>
          <div className="space-y-1">
            <p className="text-xs text-muted-foreground">Can Send</p>
            <Badge variant={canSend ? 'default' : 'destructive'} className="text-xs">
              {canSend ? 'True' : 'False'}
            </Badge>
          </div>
        </div>

        <Separator />

        <div className="space-y-1">
          <p className="text-xs font-medium text-muted-foreground">Status</p>
          <p className="text-sm">{getDisabledReason()}</p>
        </div>
      </CardContent>
    </Card>
  );
}
