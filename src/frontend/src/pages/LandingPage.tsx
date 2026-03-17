import { Button } from "@/components/ui/button";
import { Key, Loader2, Lock, Shield, Zap } from "lucide-react";
import { useInternetIdentity } from "../hooks/useInternetIdentity";

export default function LandingPage() {
  const { login, isLoggingIn } = useInternetIdentity();

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Header */}
      <header className="border-b border-border/50 px-6 py-4">
        <div className="max-w-5xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded border border-primary/40 bg-primary/10 flex items-center justify-center">
              <Lock className="w-4 h-4 text-primary" />
            </div>
            <span className="font-mono font-bold text-sm tracking-tight">
              OP_DUP
            </span>
          </div>
          <Button
            onClick={login}
            disabled={isLoggingIn}
            size="sm"
            data-ocid="landing.primary_button"
          >
            {isLoggingIn ? (
              <>
                <Loader2 className="w-3.5 h-3.5 mr-2 animate-spin" />
                Connecting...
              </>
            ) : (
              "Sign In"
            )}
          </Button>
        </div>
      </header>

      {/* Hero */}
      <main className="flex-1 flex flex-col">
        <section className="max-w-5xl mx-auto px-6 pt-20 pb-16 w-full">
          <div className="max-w-2xl">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-primary/30 bg-primary/5 mb-6">
              <div className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse" />
              <span className="text-xs font-mono text-primary">
                Live on Internet Computer
              </span>
            </div>

            <h1 className="font-display text-4xl md:text-5xl font-bold text-foreground leading-tight mb-4">
              OP_DUP{" "}
              <span className="text-primary terminal-glow">
                Secure Messages
              </span>
            </h1>

            <p className="text-lg text-muted-foreground mb-8 leading-relaxed">
              Decentralized end-to-end encrypted messaging on the Internet
              Computer. Private keys never leave your device. Nodes only see
              encrypted bytes.
            </p>

            <div className="flex flex-col sm:flex-row gap-3">
              <Button
                size="lg"
                onClick={login}
                disabled={isLoggingIn}
                className="primary-glow"
                data-ocid="landing.hero.primary_button"
              >
                {isLoggingIn ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Connecting...
                  </>
                ) : (
                  <>
                    <Key className="w-4 h-4 mr-2" />
                    Sign In with Internet Identity
                  </>
                )}
              </Button>
            </div>
          </div>
        </section>

        {/* Features */}
        <section className="max-w-5xl mx-auto px-6 pb-16 w-full">
          <div className="grid md:grid-cols-3 gap-4">
            <div className="p-5 rounded-lg border border-border bg-card space-y-3">
              <div className="w-9 h-9 rounded-md bg-primary/10 flex items-center justify-center">
                <Shield className="w-4.5 h-4.5 text-primary" />
              </div>
              <h3 className="font-display font-semibold text-foreground">
                End-to-End Encrypted
              </h3>
              <p className="text-sm text-muted-foreground leading-relaxed">
                Messages are encrypted on your device before transmission and
                can only be decrypted by the intended recipient. Nodes and
                canisters only see encrypted bytes.
              </p>
            </div>

            <div className="p-5 rounded-lg border border-border bg-card space-y-3">
              <div className="w-9 h-9 rounded-md bg-accent/10 flex items-center justify-center">
                <Zap className="w-4.5 h-4.5 text-accent" />
              </div>
              <h3 className="font-display font-semibold text-foreground">
                Chain-Key Tokens
              </h3>
              <p className="text-sm text-muted-foreground leading-relaxed">
                Send and receive{" "}
                <strong className="text-foreground">ckBTC</strong>,{" "}
                <strong className="text-foreground">ckETH</strong>, and{" "}
                <strong className="text-foreground">ckUSDC</strong> — chain-key
                tokens backed by real Bitcoin, Ethereum, and USDC on the
                Internet Computer.
              </p>
            </div>

            <div className="p-5 rounded-lg border border-border bg-card space-y-3">
              <div className="w-9 h-9 rounded-md bg-secondary flex items-center justify-center">
                <Lock className="w-4.5 h-4.5 text-muted-foreground" />
              </div>
              <h3 className="font-display font-semibold text-foreground">
                Mutual Trust Model
              </h3>
              <p className="text-sm text-muted-foreground leading-relaxed">
                Messaging is restricted to mutually trusted contacts. Both
                parties must add each other before messages can be exchanged,
                preventing unsolicited contact.
              </p>
            </div>
          </div>
        </section>

        {/* Token details */}
        <section className="max-w-5xl mx-auto px-6 pb-16 w-full">
          <div className="rounded-lg border border-border bg-card p-6">
            <h2 className="font-display font-semibold text-foreground mb-1">
              Supported Tokens
            </h2>
            <p className="text-sm text-muted-foreground mb-5">
              Transfer chain-key tokens directly between trusted contacts using
              the Internet Computer's native ledger canisters.
            </p>
            <div className="grid sm:grid-cols-3 gap-3">
              {[
                {
                  symbol: "ckBTC",
                  desc: "Chain-Key Bitcoin",
                  id: "mxzaz-hqaaa-aaaar-qaada-cai",
                },
                {
                  symbol: "ckETH",
                  desc: "Chain-Key Ether",
                  id: "ss2fx-dyaaa-aaaar-qacoq-cai",
                },
                {
                  symbol: "ckUSDC",
                  desc: "Chain-Key USDC",
                  id: "xevnm-gaaaa-aaaar-qafnq-cai",
                },
              ].map((token) => (
                <div
                  key={token.symbol}
                  className="p-3 rounded-md border border-border bg-secondary/30 space-y-1"
                >
                  <div className="font-mono font-bold text-sm text-primary">
                    {token.symbol}
                  </div>
                  <div className="text-xs text-muted-foreground">
                    {token.desc}
                  </div>
                  <div className="font-mono text-xs text-muted-foreground/60 truncate">
                    {token.id}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Disclaimer */}
        <section className="max-w-5xl mx-auto px-6 pb-20 w-full">
          <div className="rounded-lg border border-border/50 bg-secondary/20 p-5">
            <p className="text-xs text-muted-foreground leading-relaxed">
              <strong className="text-foreground/70">Disclaimer:</strong> OP_DUP
              Dapp operates without a central authority and does not offer
              warranties or guarantees, consistent with its foundational
              principle of eliminating reliance on trusted intermediaries. This
              application is provided as-is. Use at your own risk.
            </p>
          </div>
        </section>
      </main>
    </div>
  );
}
