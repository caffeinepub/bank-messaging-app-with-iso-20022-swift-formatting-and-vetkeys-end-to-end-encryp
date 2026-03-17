import { Button } from "@/components/ui/button";
import { ArrowRight, Bitcoin, Key, Lock, Shield, Zap } from "lucide-react";
import { motion } from "motion/react";
import { useInternetIdentity } from "../hooks/useInternetIdentity";

const features = [
  {
    icon: Lock,
    title: "End-to-End Encrypted",
    desc: "Messages are encrypted on your device before leaving. Nodes and canisters only ever see opaque ciphertext. Your private keys never leave your browser.",
    color: "text-primary",
    bg: "bg-primary/10 border-primary/20",
  },
  {
    icon: Shield,
    title: "Mutual Trust Model",
    desc: "Both parties must add each other as trusted contacts before any messages can be exchanged. No unsolicited contact. No spam. No surprises.",
    color: "text-chart-2",
    bg: "bg-chart-2/10 border-chart-2/20",
  },
  {
    icon: Bitcoin,
    title: "On-Chain Token Transfers",
    desc: "Send ckBTC, ckETH, and ckUSDC directly to trusted contacts — no bank, no intermediary, no permission required. Transfers verified on-chain.",
    color: "text-chart-3",
    bg: "bg-chart-3/10 border-chart-3/20",
  },
];

const tokens = [
  {
    symbol: "ckBTC",
    name: "Chain-Key Bitcoin",
    canister: "mxzaz-hqaaa-aaaar-qaada-cai",
    color: "oklch(0.72 0.18 60)",
  },
  {
    symbol: "ckETH",
    name: "Chain-Key Ether",
    canister: "ss2fx-dyaaa-aaaar-qacoq-cai",
    color: "oklch(0.68 0.19 195)",
  },
  {
    symbol: "ckUSDC",
    name: "Chain-Key USDC",
    canister: "xevnm-gaaaa-aaaar-qafnq-cai",
    color: "oklch(0.74 0.22 142)",
  },
];

export default function LandingPage() {
  const { login, isLoggingIn } = useInternetIdentity();

  return (
    <div className="min-h-screen bg-background flex flex-col overflow-hidden">
      {/* Grid background */}
      <div className="fixed inset-0 bg-grid opacity-40 pointer-events-none" />

      {/* Top gradient */}
      <div
        className="fixed inset-0 pointer-events-none"
        style={{
          background:
            "radial-gradient(ellipse 80% 50% at 50% -20%, oklch(0.73 0.19 196 / 0.12), transparent)",
        }}
      />

      {/* Header */}
      <header className="relative z-10 border-b border-border/40 px-6 py-4">
        <div className="max-w-5xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded border border-primary/40 bg-primary/10 flex items-center justify-center">
              <Lock className="w-4 h-4 text-primary" />
            </div>
            <span className="font-display font-bold text-sm tracking-widest text-foreground uppercase">
              OP_DUP
            </span>
          </div>
          <Button
            onClick={login}
            disabled={isLoggingIn}
            size="sm"
            variant="outline"
            className="border-primary/40 text-primary hover:bg-primary/10 hover:border-primary/60"
            data-ocid="landing.primary_button"
          >
            {isLoggingIn ? "Connecting..." : "Sign In"}
          </Button>
        </div>
      </header>

      <main className="relative z-10 flex-1 flex flex-col">
        {/* Hero */}
        <section className="max-w-5xl mx-auto px-6 pt-24 pb-20 w-full">
          <motion.div
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, ease: "easeOut" }}
            className="max-w-3xl"
          >
            {/* Status pill */}
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full border border-primary/30 bg-primary/5 mb-8">
              <span className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse-glow" />
              <span className="text-xs font-mono text-primary tracking-wide">
                Live on Internet Computer Mainnet
              </span>
            </div>

            <h1 className="font-display text-5xl md:text-6xl font-bold text-foreground leading-[1.05] mb-6 tracking-tight">
              Encrypted.
              <br />
              <span
                className="terminal-glow"
                style={{ color: "oklch(0.73 0.19 196)" }}
              >
                Decentralized.
              </span>
              <br />
              Ours.
            </h1>

            <p className="text-lg text-muted-foreground mb-10 leading-relaxed max-w-xl">
              OP_DUP is a fully on-chain encrypted messaging and token transfer
              platform. No servers. No intermediaries. No backdoors. Private
              keys never leave your device.
            </p>

            <div className="flex flex-col sm:flex-row gap-3">
              <Button
                size="lg"
                onClick={login}
                disabled={isLoggingIn}
                className="primary-glow font-display font-semibold tracking-wide"
                data-ocid="landing.hero.primary_button"
              >
                {isLoggingIn ? (
                  "Connecting..."
                ) : (
                  <>
                    <Key className="w-4 h-4 mr-2" />
                    Launch App
                    <ArrowRight className="w-4 h-4 ml-2" />
                  </>
                )}
              </Button>
            </div>
          </motion.div>
        </section>

        {/* Features */}
        <section className="max-w-5xl mx-auto px-6 pb-20 w-full">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.15, ease: "easeOut" }}
            className="grid md:grid-cols-3 gap-4"
          >
            {features.map((f) => (
              <div
                key={f.title}
                className="p-5 rounded-lg border border-border bg-card/60 backdrop-blur-sm space-y-3 hover:border-primary/30 transition-colors"
              >
                <div
                  className={`w-9 h-9 rounded-md border flex items-center justify-center ${f.bg}`}
                >
                  <f.icon className={`w-4.5 h-4.5 ${f.color}`} />
                </div>
                <h3 className="font-display font-semibold text-foreground">
                  {f.title}
                </h3>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  {f.desc}
                </p>
              </div>
            ))}
          </motion.div>
        </section>

        {/* Tokens */}
        <section className="max-w-5xl mx-auto px-6 pb-20 w-full">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.25, ease: "easeOut" }}
          >
            <div className="rounded-lg border border-border bg-card/60 p-6">
              <div className="flex items-center gap-2 mb-1">
                <Zap className="w-4 h-4 text-primary" />
                <h2 className="font-display font-semibold text-foreground">
                  Supported Tokens
                </h2>
              </div>
              <p className="text-sm text-muted-foreground mb-5">
                Transfer chain-key tokens between trusted contacts using ICP's
                native ledger canisters.
              </p>
              <div className="grid sm:grid-cols-3 gap-3">
                {tokens.map((t) => (
                  <div
                    key={t.symbol}
                    className="p-3 rounded-md border border-border bg-secondary/40 space-y-1.5"
                  >
                    <div
                      className="font-mono font-bold text-sm"
                      style={{ color: t.color }}
                    >
                      {t.symbol}
                    </div>
                    <div className="text-xs text-muted-foreground">
                      {t.name}
                    </div>
                    <div className="font-mono text-xs text-muted-foreground/50 truncate">
                      {t.canister}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </motion.div>
        </section>

        {/* Disclaimer */}
        <section className="max-w-5xl mx-auto px-6 pb-16 w-full">
          <div className="rounded-lg border border-border/40 bg-secondary/20 p-5 space-y-2">
            <p className="text-xs text-muted-foreground leading-relaxed">
              <span className="text-foreground/60 font-medium">
                Disclaimer:
              </span>{" "}
              OP_DUP Secure Messages operates without a central authority and
              provides no warranties or guarantees. This application does not
              connect to banking networks and does not support SWIFT or ISO
              20022 messaging. Use at your own risk.
            </p>
            <p className="text-xs text-muted-foreground/60">
              All frontend assets are cryptographically certified by the
              Internet Computer. Private keys are generated locally and never
              transmitted.
            </p>
          </div>
        </section>
      </main>
    </div>
  );
}
