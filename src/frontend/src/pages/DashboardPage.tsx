import { Badge } from "@/components/ui/badge";
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
  CheckCircle2,
  Coins,
  Copy,
  Key,
  Link,
  Loader2,
  RefreshCw,
  Send,
  UserPlus,
} from "lucide-react";
import { useCallback, useState } from "react";
import { toast } from "sonner";
import { loadConfig } from "../config";
import { useActor } from "../hooks/useActor";
import { useInternetIdentity } from "../hooks/useInternetIdentity";
import {
  useCallerProfile,
  useGenerateInviteCode,
  useGetInviteCodes,
  useIsCurrentUserAdmin,
  useRelationshipStatus,
} from "../hooks/useQueries";
import { loadOrGenerateKeyPair } from "../lib/crypto/transportKeys";
import { generateVetKey, loadVetKey } from "../lib/crypto/vetKey";
import {
  TOKENS,
  type TokenSymbol,
  formatTokenAmount,
  getBalance,
  parseTokenAmount,
  transfer,
} from "../lib/icrc/icrcLedgerClient";

interface TransportDiagnostics {
  timestamp: string;
  keyPairLoaded: boolean;
  isRegistered: boolean;
  isGenerating: boolean;
  profileLoaded: boolean;
  vetKeyPresent: boolean;
  vetKey: string | null;
  canSend: boolean;
  disabledReason: string;
}

export default function DashboardPage() {
  const { identity } = useInternetIdentity();
  const { actor } = useActor();
  const profileQuery = useCallerProfile();
  const isAdminQuery = useIsCurrentUserAdmin();
  const inviteCodesQuery = useGetInviteCodes();
  const generateInviteCode = useGenerateInviteCode();

  const principal = identity?.getPrincipal().toString() ?? "";

  // Transport key state
  const [transportDiag, setTransportDiag] =
    useState<TransportDiagnostics | null>(null);
  const [loadingKey, setLoadingKey] = useState(false);

  // Token balances
  const [balances, setBalances] = useState<Record<string, string | null>>({});
  const [loadingBalances, setLoadingBalances] = useState(false);

  // Token send
  const [selectedToken, setSelectedToken] = useState<TokenSymbol>("ckUSDC");
  const [sendTo, setSendTo] = useState("");
  const [sendAmount, setSendAmount] = useState("");
  const [sendStatus, setSendStatus] = useState<
    | { state: "idle" }
    | { state: "loading" }
    | { state: "success"; blockIndex: string }
    | { state: "error"; message: string }
  >({ state: "idle" });

  // Relationship diagnostics
  const [checkPrincipal, setCheckPrincipal] = useState("");
  const [parsedCheckPrincipal, setParsedCheckPrincipal] =
    useState<Principal | null>(null);
  const relationshipQuery = useRelationshipStatus(parsedCheckPrincipal);

  const handleLoadTransportKey = useCallback(async () => {
    setLoadingKey(true);
    try {
      const vetKey = generateVetKey(principal);
      const keyPair = await loadOrGenerateKeyPair();
      const profile = profileQuery.data;
      const hasProfile = !!profile;

      if (actor && profile) {
        const existingKey = profile.publicKey;
        const newKey = keyPair.publicKeyRaw;
        if (
          !existingKey ||
          existingKey.length !== newKey.length ||
          !existingKey.every((b, i) => b === newKey[i])
        ) {
          await actor.saveCallerUserProfile({
            name: profile.name,
            publicKey: newKey,
          });
        }
      }

      setTransportDiag({
        timestamp: new Date().toISOString(),
        keyPairLoaded: true,
        isRegistered: hasProfile,
        isGenerating: false,
        profileLoaded: hasProfile,
        vetKeyPresent: true,
        vetKey,
        canSend: hasProfile,
        disabledReason: hasProfile
          ? "All checks passed - ready to send"
          : "Profile not loaded",
      });
      toast.success("Transport key loaded");
    } catch (err) {
      toast.error("Failed to load transport key");
      console.error(err);
    } finally {
      setLoadingKey(false);
    }
  }, [principal, actor, profileQuery.data]);

  const handleRefreshBalances = useCallback(async () => {
    if (!identity || !principal) return;
    setLoadingBalances(true);
    try {
      const config = await loadConfig();
      const agent = new HttpAgent({ host: config.backend_host, identity });
      const callerPrincipal = identity.getPrincipal();

      const results = await Promise.all(
        TOKENS.map(async (token) => {
          try {
            const bal = await getBalance(
              token.canisterId,
              callerPrincipal,
              agent,
            );
            return {
              symbol: token.symbol,
              balance: formatTokenAmount(bal, token.decimals),
            };
          } catch {
            return { symbol: token.symbol, balance: "Error" };
          }
        }),
      );

      const balanceMap: Record<string, string> = {};
      for (const { symbol, balance } of results) {
        balanceMap[symbol] = balance;
      }
      setBalances(balanceMap);
    } catch {
      toast.error("Failed to fetch balances");
    } finally {
      setLoadingBalances(false);
    }
  }, [identity, principal]);

  const handleSendToken = useCallback(async () => {
    if (!identity || !sendTo || !sendAmount) return;
    setSendStatus({ state: "loading" });
    try {
      const recipientPrincipal = Principal.fromText(sendTo.trim());
      const token = TOKENS.find((t) => t.symbol === selectedToken)!;
      const rawAmount = parseTokenAmount(sendAmount, token.decimals);

      const config = await loadConfig();
      const agent = new HttpAgent({ host: config.backend_host, identity });

      const blockIndex = await transfer(
        token.canisterId,
        recipientPrincipal,
        rawAmount,
        agent,
      );
      setSendStatus({ state: "success", blockIndex: blockIndex.toString() });
      toast.success(`${selectedToken} sent! Block: ${blockIndex}`);
      setSendTo("");
      setSendAmount("");
    } catch (err) {
      const message = err instanceof Error ? err.message : "Transfer failed";
      setSendStatus({ state: "error", message });
      toast.error(message);
    }
  }, [identity, sendTo, sendAmount, selectedToken]);

  const handleCheckRelationship = () => {
    try {
      const p = Principal.fromText(checkPrincipal.trim());
      setParsedCheckPrincipal(p);
    } catch {
      toast.error("Invalid principal format");
    }
  };

  const handleGenerateInvite = async () => {
    try {
      await generateInviteCode.mutateAsync();
      toast.success("Invite link generated");
    } catch {
      toast.error("Failed to generate invite link");
    }
  };

  const handleCopyInviteLink = (code: string) => {
    const url = `${window.location.origin}${window.location.pathname}?code=${code}`;
    void navigator.clipboard.writeText(url);
    toast.success("Invite link copied!");
  };

  const storedVetKey = loadVetKey(principal);
  const isAdmin = isAdminQuery.data === true;
  const inviteCodes = inviteCodesQuery.data ?? [];
  const unusedCodes = inviteCodes.filter((c) => !c.used);

  return (
    <div className="space-y-6 animate-fade-up">
      {/* Page Header */}
      <div>
        <h1 className="font-display text-2xl font-bold text-foreground">
          Dashboard
        </h1>
        <p className="text-sm text-muted-foreground mt-0.5">
          Manage your keys, balances, and connections
        </p>
      </div>

      {/* Principal ID */}
      <Card className="card-glow" data-ocid="dashboard.panel">
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-medium text-muted-foreground">
            Your Principal ID
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-3">
            <code className="font-mono text-xs text-primary bg-primary/5 px-3 py-2 rounded border border-primary/20 flex-1 truncate">
              {principal}
            </code>
            <Button
              variant="ghost"
              size="icon"
              className="w-8 h-8 shrink-0"
              onClick={() => {
                void navigator.clipboard.writeText(principal);
                toast.success("Copied!");
              }}
              data-ocid="dashboard.copy.button"
            >
              <Copy className="w-3.5 h-3.5" />
            </Button>
          </div>
          {profileQuery.data && (
            <p className="text-xs text-muted-foreground mt-2">
              Profile:{" "}
              <span className="text-foreground">{profileQuery.data.name}</span>
            </p>
          )}
        </CardContent>
      </Card>

      {/* Transport Key */}
      <Card className="card-glow" data-ocid="transport_key.panel">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Key className="w-4 h-4 text-primary" />
              Transport Key
            </CardTitle>
            {storedVetKey ? (
              <Badge
                variant="outline"
                className="text-xs border-primary/30 text-primary"
              >
                <CheckCircle2 className="w-3 h-3 mr-1" />
                Loaded
              </Badge>
            ) : (
              <Badge
                variant="outline"
                className="text-xs text-muted-foreground"
              >
                <AlertCircle className="w-3 h-3 mr-1" />
                Not loaded
              </Badge>
            )}
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-xs text-muted-foreground">
            Load your transport key to enable sending encrypted messages. Keys
            are generated and stored locally — they never leave this device.
          </p>
          <Button
            onClick={() => void handleLoadTransportKey()}
            disabled={loadingKey}
            variant={storedVetKey ? "outline" : "default"}
            size="sm"
            data-ocid="transport_key.primary_button"
          >
            {loadingKey ? (
              <>
                <Loader2 className="w-3.5 h-3.5 mr-2 animate-spin" />
                Loading...
              </>
            ) : storedVetKey ? (
              <>
                <RefreshCw className="w-3.5 h-3.5 mr-2" />
                Refresh Key
              </>
            ) : (
              <>
                <Key className="w-3.5 h-3.5 mr-2" />
                Load Transport Key
              </>
            )}
          </Button>

          {transportDiag && (
            <div className="rounded-md border border-border bg-secondary/30 p-3">
              <p className="text-xs font-mono text-muted-foreground mb-2">
                Diagnostics
              </p>
              <pre className="text-xs font-mono text-foreground/80 overflow-auto whitespace-pre-wrap">
                {JSON.stringify(transportDiag, null, 2)}
              </pre>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Token Balances */}
      <Card className="card-glow" data-ocid="tokens.panel">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Coins className="w-4 h-4 text-accent" />
              Token Balances
            </CardTitle>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => void handleRefreshBalances()}
              disabled={loadingBalances}
              className="h-7 px-2 text-xs"
              data-ocid="tokens.refresh.button"
            >
              {loadingBalances ? (
                <Loader2 className="w-3 h-3 animate-spin" />
              ) : (
                <>
                  <RefreshCw className="w-3 h-3 mr-1" />
                  Refresh
                </>
              )}
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-3 gap-3">
            {TOKENS.map((token) => (
              <div
                key={token.symbol}
                className="p-3 rounded-md border border-border bg-secondary/20 space-y-1"
                data-ocid={`tokens.${token.symbol.toLowerCase()}.card`}
              >
                <div className="font-mono text-xs font-bold text-primary">
                  {token.symbol}
                </div>
                <div className="font-mono text-sm font-semibold text-foreground">
                  {loadingBalances ? (
                    <Loader2 className="w-3.5 h-3.5 animate-spin text-muted-foreground" />
                  ) : balances[token.symbol] !== undefined ? (
                    balances[token.symbol]
                  ) : (
                    <span className="text-muted-foreground">—</span>
                  )}
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Token Send */}
      <Card className="card-glow" data-ocid="token_send.panel">
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-medium flex items-center gap-2">
            <Send className="w-4 h-4 text-muted-foreground" />
            Send Tokens
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid sm:grid-cols-3 gap-3">
            <div className="space-y-1.5">
              <Label className="text-xs">Token</Label>
              <Select
                value={selectedToken}
                onValueChange={(v) => setSelectedToken(v as TokenSymbol)}
              >
                <SelectTrigger className="h-9" data-ocid="token_send.select">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {TOKENS.map((t) => (
                    <SelectItem key={t.symbol} value={t.symbol}>
                      {t.symbol}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs">Amount</Label>
              <Input
                placeholder="0.00"
                value={sendAmount}
                onChange={(e) => setSendAmount(e.target.value)}
                className="h-9 font-mono text-sm"
                data-ocid="token_send.input"
              />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs">Recipient Principal</Label>
              <Input
                placeholder="aaaaa-aa"
                value={sendTo}
                onChange={(e) => setSendTo(e.target.value)}
                className="h-9 font-mono text-xs"
                data-ocid="token_send.recipient.input"
              />
            </div>
          </div>

          <Button
            onClick={() => void handleSendToken()}
            disabled={!sendTo || !sendAmount || sendStatus.state === "loading"}
            size="sm"
            data-ocid="token_send.submit_button"
          >
            {sendStatus.state === "loading" ? (
              <>
                <Loader2 className="w-3.5 h-3.5 mr-2 animate-spin" />
                Sending...
              </>
            ) : (
              <>
                <Send className="w-3.5 h-3.5 mr-2" />
                Send {selectedToken}
              </>
            )}
          </Button>

          {sendStatus.state === "success" && (
            <div
              className="text-xs text-primary font-mono bg-primary/5 border border-primary/20 rounded p-2"
              data-ocid="token_send.success_state"
            >
              ✓ Sent successfully. Block index: {sendStatus.blockIndex}
            </div>
          )}
          {sendStatus.state === "error" && (
            <div
              className="text-xs text-destructive bg-destructive/5 border border-destructive/20 rounded p-2"
              data-ocid="token_send.error_state"
            >
              {sendStatus.message}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Relationship Check */}
      <Card className="card-glow" data-ocid="relationship.panel">
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-medium">
            Check Relationship Status
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex gap-2">
            <Input
              placeholder="Enter principal ID"
              value={checkPrincipal}
              onChange={(e) => setCheckPrincipal(e.target.value)}
              className="h-9 font-mono text-xs flex-1"
              data-ocid="relationship.input"
            />
            <Button
              size="sm"
              variant="outline"
              onClick={handleCheckRelationship}
              className="h-9 shrink-0"
              data-ocid="relationship.primary_button"
            >
              Check
            </Button>
          </div>

          {relationshipQuery.isLoading && (
            <div
              className="flex items-center gap-2 text-xs text-muted-foreground"
              data-ocid="relationship.loading_state"
            >
              <Loader2 className="w-3 h-3 animate-spin" />
              Checking...
            </div>
          )}

          {relationshipQuery.data && (
            <div className="rounded-md border border-border bg-secondary/30 p-3">
              <pre className="text-xs font-mono text-foreground/80 overflow-auto whitespace-pre-wrap">
                {JSON.stringify(
                  {
                    timestamp: new Date().toISOString(),
                    ...relationshipQuery.data,
                    canSend:
                      relationshipQuery.data.callerHasPublicKey &&
                      relationshipQuery.data.otherHasPublicKey &&
                      relationshipQuery.data.isMutuallyTrusted,
                    disabledReason: !relationshipQuery.data.callerHasPublicKey
                      ? "Caller has no public key — load transport key"
                      : !relationshipQuery.data.otherHasPublicKey
                        ? "Contact has no public key"
                        : !relationshipQuery.data.isMutuallyTrusted
                          ? "Not mutually trusted"
                          : "All checks passed - ready to send",
                  },
                  null,
                  2,
                )}
              </pre>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Invite Links (admin only) */}
      {isAdmin && (
        <Card className="card-glow border-primary/20" data-ocid="invite.panel">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm font-medium flex items-center gap-2">
                <UserPlus className="w-4 h-4 text-primary" />
                Invite Links
              </CardTitle>
              <Badge
                variant="outline"
                className="text-xs border-primary/30 text-primary"
              >
                Admin
              </Badge>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-xs text-muted-foreground">
              Generate invite links to share with trusted users. Each link
              contains a unique code that allows a new user to register.
            </p>

            <Button
              size="sm"
              onClick={() => void handleGenerateInvite()}
              disabled={generateInviteCode.isPending}
              data-ocid="invite.generate_button"
            >
              {generateInviteCode.isPending ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 mr-2 animate-spin" />
                  Generating...
                </>
              ) : (
                <>
                  <Link className="w-3.5 h-3.5 mr-2" />
                  Generate Invite Link
                </>
              )}
            </Button>

            {/* Code list */}
            {inviteCodes.length > 0 && (
              <div className="space-y-2" data-ocid="invite.list">
                <p className="text-xs font-medium text-muted-foreground">
                  Generated codes ({unusedCodes.length} unused)
                </p>
                <div className="space-y-1.5">
                  {inviteCodes.map((entry, index) => (
                    <div
                      key={entry.code}
                      className="flex items-center gap-2 p-2 rounded border border-border bg-secondary/20"
                      data-ocid={`invite.item.${index + 1}`}
                    >
                      <code className="font-mono text-xs text-foreground flex-1 truncate">
                        {entry.code}
                      </code>
                      {entry.used ? (
                        <Badge
                          variant="outline"
                          className="text-xs text-muted-foreground shrink-0"
                        >
                          Used
                        </Badge>
                      ) : (
                        <Button
                          variant="ghost"
                          size="icon"
                          className="w-7 h-7 shrink-0"
                          onClick={() => handleCopyInviteLink(entry.code)}
                          data-ocid={`invite.copy_button.${index + 1}`}
                        >
                          <Copy className="w-3.5 h-3.5" />
                        </Button>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {inviteCodes.length === 0 && (
              <div
                className="text-center py-4 text-xs text-muted-foreground"
                data-ocid="invite.empty_state"
              >
                No invite codes yet. Generate one above.
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
