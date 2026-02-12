import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Coins } from 'lucide-react';
import { TokenReceivePanel } from './TokenReceivePanel';
import { TokenSendPanel } from './TokenSendPanel';
import { TOKENS, isTokenConfigured } from '@/config/tokens';

interface TokensSectionProps {
  principal: string;
}

export function TokensSection({ principal }: TokensSectionProps) {
  const tokens = ['ckBTC', 'ckETH', 'ckUSDC'];

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center gap-2">
          <Coins className="h-5 w-5 text-primary" />
          <CardTitle>Tokens</CardTitle>
        </div>
        <CardDescription>Send and receive chain-key tokens</CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {tokens.map((tokenSymbol) => {
          const tokenConfig = TOKENS[tokenSymbol];
          const configured = isTokenConfigured(tokenSymbol);

          return (
            <div key={tokenSymbol} className="space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-semibold text-lg flex items-center gap-2">
                    <span className="text-primary">{tokenConfig.glyph}</span>
                    <span>{tokenSymbol}</span>
                  </h3>
                  <p className="text-xs text-muted-foreground">{tokenConfig.name}</p>
                </div>
              </div>

              <Tabs defaultValue="receive" className="w-full">
                <TabsList className="grid w-full grid-cols-2">
                  <TabsTrigger value="receive">Receive</TabsTrigger>
                  <TabsTrigger value="send">Send</TabsTrigger>
                </TabsList>
                <TabsContent value="receive" className="mt-4">
                  <TokenReceivePanel
                    tokenSymbol={tokenSymbol}
                    receivingAddress={principal}
                  />
                </TabsContent>
                <TabsContent value="send" className="mt-4">
                  <TokenSendPanel
                    tokenSymbol={tokenSymbol}
                    isConfigured={configured}
                    decimals={tokenConfig.decimals}
                  />
                </TabsContent>
              </Tabs>

              {tokenSymbol !== 'ckUSDC' && (
                <div className="border-t border-border pt-6" />
              )}
            </div>
          );
        })}
      </CardContent>
    </Card>
  );
}
