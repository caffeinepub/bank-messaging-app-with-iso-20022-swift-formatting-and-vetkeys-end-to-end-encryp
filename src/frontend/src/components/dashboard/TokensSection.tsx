import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { TOKENS, isTokenConfigured } from "@/config/tokens";
import { fetchIcrcBalance } from "@/lib/icrc/icrcLedgerClient";
import { Coins, RefreshCw } from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import { TokenReceivePanel } from "./TokenReceivePanel";
import { TokenSendPanel } from "./TokenSendPanel";

interface TokensSectionProps {
  principal: string;
}

type BalanceMap = Record<
  string,
  { loading: boolean; value: bigint | null; error: string | null }
>;

function formatBalance(value: bigint, decimals: number): string {
  const divisor = BigInt(10 ** decimals);
  const whole = value / divisor;
  const remainder = value % divisor;
  if (remainder === 0n) return whole.toString();
  const fracStr = remainder
    .toString()
    .padStart(decimals, "0")
    .replace(/0+$/, "");
  return `${whole}.${fracStr}`;
}

export function TokensSection({ principal }: TokensSectionProps) {
  const tokens = ["ckBTC", "ckETH", "ckUSDC"];

  const initialBalances: BalanceMap = {};
  for (const sym of tokens) {
    initialBalances[sym] = { loading: true, value: null, error: null };
  }
  const [balances, setBalances] = useState<BalanceMap>(initialBalances);

  const fetchAll = useCallback(async () => {
    setBalances((prev) => {
      const next = { ...prev };
      for (const sym of tokens)
        next[sym] = { loading: true, value: null, error: null };
      return next;
    });
    await Promise.all(
      tokens.map(async (sym) => {
        const cfg = TOKENS[sym];
        if (!cfg?.ledgerCanisterId) {
          setBalances((prev) => ({
            ...prev,
            [sym]: { loading: false, value: null, error: "Not configured" },
          }));
          return;
        }
        const result = await fetchIcrcBalance(cfg.ledgerCanisterId, principal);
        if (result.success) {
          setBalances((prev) => ({
            ...prev,
            [sym]: { loading: false, value: result.balance, error: null },
          }));
        } else {
          setBalances((prev) => ({
            ...prev,
            [sym]: { loading: false, value: null, error: result.error },
          }));
        }
      }),
    );
  }, [principal]);

  useEffect(() => {
    if (principal) fetchAll();
  }, [principal, fetchAll]);

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Coins className="h-5 w-5 text-primary" />
            <CardTitle>Tokens</CardTitle>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={fetchAll}
            data-ocid="tokens.secondary_button"
          >
            <RefreshCw className="h-4 w-4 mr-1" />
            Refresh
          </Button>
        </div>
        <CardDescription>Send and receive chain-key tokens</CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {tokens.map((tokenSymbol) => {
          const tokenConfig = TOKENS[tokenSymbol];
          const configured = isTokenConfigured(tokenSymbol);
          const bal = balances[tokenSymbol];

          return (
            <div key={tokenSymbol} className="space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-semibold text-lg flex items-center gap-2">
                    <span className="text-primary">{tokenConfig.glyph}</span>
                    <span>{tokenSymbol}</span>
                  </h3>
                  <p className="text-xs text-muted-foreground">
                    {tokenConfig.name}
                  </p>
                </div>
                <div
                  className="text-right"
                  data-ocid={`tokens.${tokenSymbol.toLowerCase()}.card`}
                >
                  {bal.loading ? (
                    <p
                      className="text-sm text-muted-foreground animate-pulse"
                      data-ocid={`tokens.${tokenSymbol.toLowerCase()}.loading_state`}
                    >
                      Loading...
                    </p>
                  ) : bal.error ? (
                    <p
                      className="text-xs text-destructive"
                      data-ocid={`tokens.${tokenSymbol.toLowerCase()}.error_state`}
                    >
                      Balance unavailable
                    </p>
                  ) : (
                    <div>
                      <p
                        className="text-lg font-bold tabular-nums"
                        data-ocid={`tokens.${tokenSymbol.toLowerCase()}.panel`}
                      >
                        {formatBalance(bal.value!, tokenConfig.decimals)}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {tokenSymbol}
                      </p>
                    </div>
                  )}
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

              {tokenSymbol !== "ckUSDC" && (
                <div className="border-t border-border pt-6" />
              )}
            </div>
          );
        })}
      </CardContent>
    </Card>
  );
}
