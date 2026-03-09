import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { TOKENS } from "@/config/tokens";
import { AlertCircle, Info } from "lucide-react";

export default function ImportantTokenInformation() {
  const tokenList = [
    { key: "ckBTC", config: TOKENS.ckBTC },
    { key: "ckETH", config: TOKENS.ckETH },
    { key: "ckUSDC", config: TOKENS.ckUSDC },
  ];

  return (
    <div className="container mx-auto px-4 py-16 bg-muted/20">
      <div className="max-w-5xl mx-auto">
        <div className="text-center mb-12">
          <Info className="h-16 w-16 text-primary mx-auto mb-4" />
          <h2 className="text-3xl md:text-4xl font-bold mb-4">
            Important Information
          </h2>
          <p className="text-lg text-muted-foreground max-w-3xl mx-auto">
            Chain-key tokens on the Internet Computer blockchain
          </p>
        </div>

        <div className="space-y-6">
          <Card className="border-2 border-primary/20">
            <CardHeader>
              <CardTitle className="flex items-center gap-3">
                <Info className="h-6 w-6 text-primary" />
                What are Chain-Key Tokens?
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-muted-foreground">
                Chain-key tokens (ckBTC, ckETH, ckUSDC) are digital assets on
                the Internet Computer blockchain that are backed 1:1 by their
                native counterparts (Bitcoin, Ethereum, USDC). They enable fast,
                low-cost transactions while maintaining the security and value
                of the original assets.
              </p>
              <p className="text-muted-foreground">
                These tokens use the Internet Computer's chain-key cryptography
                to provide seamless integration with other blockchains, allowing
                you to hold and transfer Bitcoin, Ethereum, and USDC directly on
                the Internet Computer network.
              </p>
            </CardContent>
          </Card>

          <Card className="border-2 border-amber-500/30">
            <CardHeader>
              <CardTitle className="flex items-center gap-3">
                <AlertCircle className="h-6 w-6 text-amber-500" />
                Verify Ledger Canister IDs Before Sending Funds
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground mb-6">
                Always verify the ledger canister IDs below before sending any
                funds. Sending tokens to an incorrect canister ID may result in
                permanent loss of funds.
              </p>

              <div className="space-y-4">
                {tokenList.map(({ key, config }) => (
                  <div key={key} className="border rounded-lg p-4 bg-card">
                    <div className="flex items-start justify-between gap-4 mb-3">
                      <div>
                        <h3 className="font-semibold text-lg flex items-center gap-2">
                          <span className="text-2xl">{config.glyph}</span>
                          {config.name} ({config.symbol})
                        </h3>
                      </div>
                    </div>
                    <div className="space-y-2 text-sm">
                      <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-2">
                        <span className="font-medium text-muted-foreground min-w-[140px]">
                          Ledger Canister ID:
                        </span>
                        <code className="bg-muted px-2 py-1 rounded text-xs font-mono break-all">
                          {config.ledgerCanisterId}
                        </code>
                      </div>
                      <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-2">
                        <span className="font-medium text-muted-foreground min-w-[140px]">
                          Decimals:
                        </span>
                        <span className="text-foreground">
                          {config.decimals}
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
