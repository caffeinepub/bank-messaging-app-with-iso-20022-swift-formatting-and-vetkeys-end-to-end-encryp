import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { HttpAgent } from "@icp-sdk/core/agent";
import { Principal } from "@icp-sdk/core/principal";
import {
  AlertCircle,
  ArrowRight,
  CheckCircle2,
  Coins,
  ExternalLink,
  Loader2,
  RefreshCw,
  Send,
} from "lucide-react";
import { useCallback, useState } from "react";
import { toast } from "sonner";
import { loadConfig } from "../config";
import { useInternetIdentity } from "../hooks/useInternetIdentity";
import {
  TOKENS,
  type TokenSymbol,
  formatTokenAmount,
  getBalance,
  parseTokenAmount,
  transfer,
} from "../lib/icrc/icrcLedgerClient";

type SendStatus =
  | { state: "idle" }
  | { state: "loading" }
  | { state: "success"; blockIndex: string }
  | { state: "error"; message: string };

export default function SendTokensPage() {
  const { identity } = useInternetIdentity();

  const [selectedToken, setSelectedToken] = useState<TokenSymbol>("ckUSDC");
  const [sendTo, setSendTo] = useState("");
  const [sendAmount, setSendAmount] = useState("");
  const [sendStatus, setSendStatus] = useState<SendStatus>({ state: "idle" });
  const [balances, setBalances] = useState<Record<string, string | null>>({});
  const [loadingBalances, setLoadingBalances] = useState(false);

  const tokenConfig = TOKENS.find((t) => t.symbol === selectedToken);
  const currentBalance = balances[selectedToken];

  const principal = identity?.getPrincipal().toString() ?? "";

  const handleLoadBalances = useCallback(async () => {
    if (!identity) return;
    setLoadingBalances(true);
    try {
      const config = await loadConfig();
      const agent = new HttpAgent({
        identity,
        host: config.backend_host || "https://ic0.app",
      });
      const userPrincipal = identity.getPrincipal();
      const results = await Promise.all(
        TOKENS.map(async (token) => {
          try {
            const bal = await getBalance(
              token.canisterId,
              userPrincipal,
              agent,
            );
            return {
              symbol: token.symbol,
              value: formatTokenAmount(bal, token.decimals),
            };
          } catch {
            return { symbol: token.symbol, value: null };
          }
        }),
      );
      const newBalances: Record<string, string | null> = {};
      for (const r of results) newBalances[r.symbol] = r.value;
      setBalances(newBalances);
    } catch (err) {
      toast.error(
        err instanceof Error ? err.message : "Failed to load balances",
      );
    } finally {
      setLoadingBalances(false);
    }
  }, [identity]);

  const handleSend = useCallback(async () => {
    if (!identity || !tokenConfig) return;
    setSendStatus({ state: "loading" });
    try {
      const recipientPrincipal = Principal.fromText(sendTo.trim());
      const amount = parseTokenAmount(sendAmount, tokenConfig.decimals);
      if (amount <= 0n) throw new Error("Amount must be greater than zero");

      const config = await loadConfig();
      const agent = new HttpAgent({
        identity,
        host: config.backend_host || "https://ic0.app",
      });
      const blockIndex = await transfer(
        tokenConfig.canisterId,
        recipientPrincipal,
        amount,
        agent,
      );
      setSendStatus({ state: "success", blockIndex: blockIndex.toString() });
      setSendTo("");
      setSendAmount("");
      // Refresh balances after send
      void handleLoadBalances();
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Transfer failed";
      setSendStatus({ state: "error", message: msg });
    }
  }, [identity, tokenConfig, sendTo, sendAmount, handleLoadBalances]);

  const explorerUrl = (canisterId: string) =>
    `https://dashboard.internetcomputer.org/canister/${canisterId}`;

  return (
    <div className="space-y-6 animate-fade-up" data-ocid="send_tokens.page">
      {/* Header */}
      <div>
        <h1 className="font-display text-2xl font-bold text-foreground flex items-center gap-2">
          <Coins className="w-5 h-5 text-primary" />
          Send Tokens
        </h1>
        <p className="text-sm text-muted-foreground mt-0.5">
          Transfer ckBTC, ckETH, or ckUSDC to any principal on the Internet
          Computer.
        </p>
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        {/* Send form */}
        <Card className="card-glow" data-ocid="send_tokens.card">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Send className="w-4 h-4 text-primary" />
              Transfer
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Token selector */}
            <div className="space-y-1.5">
              <Label className="text-xs text-muted-foreground">Token</Label>
              <Select
                value={selectedToken}
                onValueChange={(v) => {
                  setSelectedToken(v as TokenSymbol);
                  setSendStatus({ state: "idle" });
                }}
              >
                <SelectTrigger
                  className="h-10 bg-input border-border"
                  data-ocid="send_tokens.select"
                >
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {TOKENS.map((t) => (
                    <SelectItem key={t.symbol} value={t.symbol}>
                      <span className="font-mono font-semibold">
                        {t.symbol}
                      </span>
                      <span className="text-muted-foreground ml-2 text-xs">
                        {t.name}
                      </span>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Balance display */}
            {currentBalance !== undefined && (
              <div className="text-xs text-muted-foreground flex items-center gap-1">
                Balance:{" "}
                <span className="font-mono text-foreground">
                  {currentBalance ?? "—"} {selectedToken}
                </span>
              </div>
            )}

            {/* Recipient */}
            <div className="space-y-1.5">
              <Label
                htmlFor="send-to"
                className="text-xs text-muted-foreground"
              >
                Recipient Principal
              </Label>
              <Input
                id="send-to"
                placeholder="xxxxx-xxxxx-..."
                value={sendTo}
                onChange={(e) => {
                  setSendTo(e.target.value);
                  setSendStatus({ state: "idle" });
                }}
                className="h-10 font-mono text-xs bg-input border-border"
                data-ocid="send_tokens.input"
              />
            </div>

            {/* Amount */}
            <div className="space-y-1.5">
              <Label
                htmlFor="send-amount"
                className="text-xs text-muted-foreground"
              >
                Amount ({selectedToken})
              </Label>
              <Input
                id="send-amount"
                type="number"
                placeholder={
                  tokenConfig
                    ? `e.g. 0.${"0".repeat(Math.min(tokenConfig.decimals, 4))}1`
                    : "0.001"
                }
                value={sendAmount}
                onChange={(e) => {
                  setSendAmount(e.target.value);
                  setSendStatus({ state: "idle" });
                }}
                className="h-10 font-mono text-xs bg-input border-border"
                data-ocid="send_tokens.textarea"
              />
            </div>

            {/* Send button */}
            <Button
              onClick={() => void handleSend()}
              disabled={
                !sendTo.trim() || !sendAmount || sendStatus.state === "loading"
              }
              className="w-full primary-glow"
              data-ocid="send_tokens.submit_button"
            >
              {sendStatus.state === "loading" ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Sending...
                </>
              ) : (
                <>
                  <Send className="w-4 h-4 mr-2" />
                  Send {selectedToken}
                </>
              )}
            </Button>

            {/* Status messages */}
            {sendStatus.state === "success" && (
              <div
                className="flex items-start gap-2 text-xs bg-chart-2/5 border border-chart-2/20 rounded-md p-3"
                data-ocid="send_tokens.success_state"
              >
                <CheckCircle2 className="w-3.5 h-3.5 text-chart-2 shrink-0 mt-0.5" />
                <div className="space-y-1">
                  <p className="text-chart-2 font-medium">
                    Transfer successful
                  </p>
                  <p className="text-muted-foreground">
                    Block index:{" "}
                    <span className="font-mono text-foreground">
                      {sendStatus.blockIndex}
                    </span>
                  </p>
                  {tokenConfig && (
                    <a
                      href={explorerUrl(tokenConfig.canisterId)}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1 text-primary hover:underline"
                    >
                      Verify on ICP Dashboard
                      <ExternalLink className="w-3 h-3" />
                    </a>
                  )}
                </div>
              </div>
            )}

            {sendStatus.state === "error" && (
              <div
                className="flex items-start gap-2 text-xs bg-destructive/5 border border-destructive/20 rounded-md p-3"
                data-ocid="send_tokens.error_state"
              >
                <AlertCircle className="w-3.5 h-3.5 text-destructive shrink-0 mt-0.5" />
                <p className="text-destructive">{sendStatus.message}</p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Balances */}
        <Card className="card-glow" data-ocid="send_tokens.balances.card">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm font-medium flex items-center gap-2">
                <Coins className="w-4 h-4 text-primary" />
                Your Balances
              </CardTitle>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => void handleLoadBalances()}
                disabled={loadingBalances || !identity}
                className="h-8 px-2 text-xs"
                data-ocid="send_tokens.balances.button"
              >
                {loadingBalances ? (
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                ) : (
                  <RefreshCw className="w-3.5 h-3.5" />
                )}
                <span className="ml-1.5">
                  {loadingBalances ? "Loading..." : "Refresh"}
                </span>
              </Button>
            </div>
          </CardHeader>
          <CardContent className="space-y-3">
            {/* Wallet info */}
            <div className="rounded-md border border-border bg-secondary/30 p-3 space-y-1">
              <p className="text-xs text-muted-foreground">Your principal</p>
              <p className="font-mono text-xs text-foreground break-all">
                {principal || "—"}
              </p>
            </div>

            {/* Token balances */}
            <div className="space-y-2">
              {TOKENS.map((token) => (
                <div
                  key={token.symbol}
                  className="flex items-center justify-between p-3 rounded-md border border-border bg-secondary/30"
                >
                  <div className="flex items-center gap-2.5">
                    <div
                      className="w-1.5 h-1.5 rounded-full"
                      style={{ background: token.color }}
                    />
                    <div>
                      <div
                        className="font-mono font-semibold text-sm"
                        style={{ color: token.color }}
                      >
                        {token.symbol}
                      </div>
                      <div className="text-xs text-muted-foreground">
                        {token.name}
                      </div>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="font-mono text-sm text-foreground">
                      {balances[token.symbol] !== undefined
                        ? (balances[token.symbol] ?? "—")
                        : "—"}
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Explorer links */}
            <div className="space-y-1.5 pt-2">
              <p className="text-xs text-muted-foreground">Ledger explorers</p>
              {TOKENS.map((token) => (
                <a
                  key={token.symbol}
                  href={explorerUrl(token.canisterId)}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-2 text-xs text-muted-foreground hover:text-primary transition-colors"
                >
                  <ArrowRight className="w-3 h-3" />
                  <span className="font-mono">{token.symbol}</span>
                  <span className="text-muted-foreground/50 truncate">
                    {token.canisterId}
                  </span>
                  <ExternalLink className="w-3 h-3 shrink-0" />
                </a>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
