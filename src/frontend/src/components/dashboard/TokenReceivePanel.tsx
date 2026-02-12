import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Copy, Check, AlertCircle } from 'lucide-react';
import { toast } from 'sonner';
import { getTokenGlyph } from '@/config/tokens';

interface TokenReceivePanelProps {
  tokenSymbol: string;
  receivingAddress: string;
}

export function TokenReceivePanel({ tokenSymbol, receivingAddress }: TokenReceivePanelProps) {
  const [copied, setCopied] = useState(false);
  const glyph = getTokenGlyph(tokenSymbol);

  const handleCopy = async () => {
    if (!receivingAddress) {
      toast.error('No receiving address available');
      return;
    }

    try {
      await navigator.clipboard.writeText(receivingAddress);
      setCopied(true);
      toast.success('Address copied to clipboard');
      setTimeout(() => setCopied(false), 2000);
    } catch (error) {
      toast.error('Failed to copy address');
    }
  };

  if (!receivingAddress) {
    return (
      <div className="flex items-center gap-3 p-4 bg-muted/50 rounded-lg border border-border">
        <AlertCircle className="h-5 w-5 text-muted-foreground shrink-0" />
        <div className="flex-1">
          <p className="text-sm font-medium">Not available</p>
          <p className="text-xs text-muted-foreground mt-0.5">
            Please log in to view your receiving address
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <div>
        <p className="text-sm font-medium mb-2">
          Your {glyph} {tokenSymbol} Receiving Address
        </p>
        <div className="flex items-start gap-2">
          <code className="flex-1 text-xs bg-muted p-3 rounded font-mono-code break-all border border-border">
            {receivingAddress}
          </code>
          <Button
            variant="outline"
            size="sm"
            onClick={handleCopy}
            className="shrink-0"
          >
            {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
          </Button>
        </div>
      </div>
      <p className="text-xs text-muted-foreground">
        Share this address to receive {glyph} {tokenSymbol} tokens. This is your Internet Computer Principal.
      </p>
    </div>
  );
}
