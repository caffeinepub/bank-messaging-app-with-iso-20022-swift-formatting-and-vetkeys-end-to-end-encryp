import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Copy, Check, AlertCircle, CheckCircle, XCircle, Bug, RefreshCw } from 'lucide-react';
import { toast } from 'sonner';
import { useTokenLedgerDiagnostics } from '@/hooks/useTokenLedgerDiagnostics';

export function TokenLedgerDiagnosticsPanel() {
  const { data: diagnostics, isLoading, error, refetch, isFetching } = useTokenLedgerDiagnostics();
  const [copied, setCopied] = useState(false);

  const handleCopyDiagnostics = async () => {
    if (!diagnostics) {
      toast.error('No diagnostics data available');
      return;
    }

    const diagnosticsReport = {
      timestamp: new Date().toISOString(),
      tokens: diagnostics.map((d) => ({
        symbol: d.symbol,
        configuredLedgerCanisterId: d.configuredLedgerCanisterId || null,
        expectedLedgerCanisterId: d.expectedLedgerCanisterId,
        matchesExpected: d.matchesExpected,
        metadataCheck: d.metadataCheck
          ? {
              success: d.metadataCheck.success,
              metadata: d.metadataCheck.metadata || null,
              error: d.metadataCheck.error || null,
            }
          : null,
      })),
    };

    try {
      await navigator.clipboard.writeText(JSON.stringify(diagnosticsReport, null, 2));
      setCopied(true);
      toast.success('Diagnostics copied to clipboard');
      setTimeout(() => setCopied(false), 2000);
    } catch (error) {
      toast.error('Failed to copy diagnostics');
    }
  };

  const handleRefresh = () => {
    refetch();
    toast.info('Refreshing token diagnostics...');
  };

  return (
    <Card className="border-dashed">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Bug className="h-4 w-4 text-muted-foreground" />
            <CardTitle className="text-base">Token Ledger Diagnostics</CardTitle>
          </div>
          <div className="flex gap-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={handleRefresh}
              disabled={isFetching}
              className="h-8 gap-2"
            >
              <RefreshCw className={`h-3.5 w-3.5 ${isFetching ? 'animate-spin' : ''}`} />
              <span className="text-xs">Refresh</span>
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={handleCopyDiagnostics}
              disabled={!diagnostics}
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
        </div>
        <CardDescription className="text-xs">
          Verify mainnet ledger IDs and connectivity without performing transfers
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {isLoading && (
          <div className="flex items-center justify-center py-8">
            <RefreshCw className="h-5 w-5 animate-spin text-muted-foreground" />
            <span className="ml-2 text-sm text-muted-foreground">Loading diagnostics...</span>
          </div>
        )}

        {error && (
          <div className="flex gap-2 p-3 bg-destructive/10 rounded-md">
            <AlertCircle className="h-4 w-4 text-destructive shrink-0 mt-0.5" />
            <div className="space-y-1">
              <p className="text-xs font-medium text-destructive">Failed to load diagnostics</p>
              <p className="text-xs text-muted-foreground">{String(error)}</p>
            </div>
          </div>
        )}

        {diagnostics && (
          <div className="space-y-4">
            {diagnostics.map((token) => (
              <div key={token.symbol} className="space-y-3">
                <div className="flex items-center justify-between">
                  <h4 className="text-sm font-semibold">{token.symbol}</h4>
                  <Badge
                    variant={token.matchesExpected ? 'default' : 'destructive'}
                    className="text-xs"
                  >
                    {token.matchesExpected ? (
                      <CheckCircle className="h-3 w-3 mr-1" />
                    ) : (
                      <XCircle className="h-3 w-3 mr-1" />
                    )}
                    {token.matchesExpected ? 'Matches Expected' : 'Mismatch'}
                  </Badge>
                </div>

                <div className="space-y-2 text-xs">
                  <div>
                    <p className="text-muted-foreground mb-1">Configured Ledger ID:</p>
                    {token.configuredLedgerCanisterId ? (
                      <code className="bg-muted p-1.5 rounded block break-all font-mono-code">
                        {token.configuredLedgerCanisterId}
                      </code>
                    ) : (
                      <p className="text-muted-foreground italic">Not configured</p>
                    )}
                  </div>

                  <div>
                    <p className="text-muted-foreground mb-1">Expected Mainnet ID:</p>
                    <code className="bg-muted p-1.5 rounded block break-all font-mono-code">
                      {token.expectedLedgerCanisterId}
                    </code>
                  </div>

                  {token.metadataCheck && (
                    <>
                      <Separator className="my-2" />
                      <div>
                        <div className="flex items-center justify-between mb-2">
                          <p className="text-muted-foreground">Metadata Check:</p>
                          <Badge
                            variant={token.metadataCheck.success ? 'default' : 'destructive'}
                            className="text-xs"
                          >
                            {token.metadataCheck.success ? 'Success' : 'Failed'}
                          </Badge>
                        </div>

                        {token.metadataCheck.success && token.metadataCheck.metadata && (
                          <div className="space-y-1 bg-muted/50 p-2 rounded">
                            <div className="flex justify-between">
                              <span className="text-muted-foreground">Name:</span>
                              <span className="font-medium">{token.metadataCheck.metadata.name}</span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-muted-foreground">Symbol:</span>
                              <span className="font-medium">{token.metadataCheck.metadata.symbol}</span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-muted-foreground">Decimals:</span>
                              <span className="font-medium">{token.metadataCheck.metadata.decimals}</span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-muted-foreground">Fee:</span>
                              <span className="font-medium">
                                {token.metadataCheck.metadata.fee.toString()}
                              </span>
                            </div>
                          </div>
                        )}

                        {!token.metadataCheck.success && token.metadataCheck.error && (
                          <div className="bg-destructive/10 p-2 rounded">
                            <p className="text-destructive text-xs">{token.metadataCheck.error}</p>
                          </div>
                        )}
                      </div>
                    </>
                  )}
                </div>

                {token !== diagnostics[diagnostics.length - 1] && <Separator />}
              </div>
            ))}
          </div>
        )}

        <Separator />

        <div className="flex gap-2 p-3 bg-muted/50 rounded-md">
          <AlertCircle className="h-4 w-4 text-primary shrink-0 mt-0.5" />
          <div className="space-y-1">
            <p className="text-xs font-medium">Read-Only Verification</p>
            <p className="text-xs text-muted-foreground">
              This diagnostic performs only read-only metadata queries. No token transfers are
              executed during this check.
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
