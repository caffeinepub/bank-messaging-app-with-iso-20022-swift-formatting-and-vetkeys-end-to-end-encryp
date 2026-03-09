import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { getTokenConfig, getTokenGlyph } from "@/config/tokens";
import { useInternetIdentity } from "@/hooks/useInternetIdentity";
import { icrc1Transfer } from "@/lib/icrc/icrcLedgerClient";
import { Principal } from "@dfinity/principal";
import { AlertCircle, Send } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

interface TokenSendPanelProps {
  tokenSymbol: string;
  isConfigured: boolean;
  decimals: number;
}

export function TokenSendPanel({
  tokenSymbol,
  isConfigured,
  decimals,
}: TokenSendPanelProps) {
  const [destination, setDestination] = useState("");
  const [amount, setAmount] = useState("");
  const [isSending, setIsSending] = useState(false);
  const [errors, setErrors] = useState<{
    destination?: string;
    amount?: string;
  }>({});
  const glyph = getTokenGlyph(tokenSymbol);
  const { identity } = useInternetIdentity();

  const validateInputs = (): boolean => {
    const newErrors: { destination?: string; amount?: string } = {};

    if (!destination.trim()) {
      newErrors.destination = "Destination address is required";
    } else {
      try {
        Principal.fromText(destination.trim());
      } catch {
        newErrors.destination = "Invalid principal address";
      }
    }

    if (!amount.trim()) {
      newErrors.amount = "Amount is required";
    } else {
      const numAmount = Number.parseFloat(amount);
      if (Number.isNaN(numAmount) || numAmount <= 0) {
        newErrors.amount = "Amount must be a positive number";
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSend = async () => {
    if (!validateInputs()) return;

    if (!identity) {
      toast.error("You must be logged in to send tokens");
      return;
    }

    const tokenConfig = getTokenConfig(tokenSymbol);
    if (!tokenConfig?.ledgerCanisterId) {
      toast.error("Token ledger canister ID is not configured");
      return;
    }

    setIsSending(true);
    try {
      const result = await icrc1Transfer({
        ledgerCanisterId: tokenConfig.ledgerCanisterId,
        identity,
        to: destination.trim(),
        amount: Number.parseFloat(amount),
        decimals,
      });

      if (result.success) {
        toast.success(
          `${amount} ${glyph} ${tokenSymbol} sent successfully. Block index: ${result.blockIndex}`,
        );
        setDestination("");
        setAmount("");
        setErrors({});
      } else {
        toast.error(result.error);
      }
    } catch (error: any) {
      toast.error(error?.message || "Failed to send tokens");
    } finally {
      setIsSending(false);
    }
  };

  if (!isConfigured) {
    return (
      <div className="flex items-center gap-3 p-4 bg-muted/50 rounded-lg border border-border">
        <AlertCircle className="h-5 w-5 text-muted-foreground shrink-0" />
        <div className="flex-1">
          <p className="text-sm font-medium">Not configured</p>
          <p className="text-xs text-muted-foreground mt-0.5">
            {tokenSymbol} sending is not configured. Ledger canister ID is
            required.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor={`destination-${tokenSymbol}`}>
          Destination Address
        </Label>
        <Input
          id={`destination-${tokenSymbol}`}
          placeholder="Enter recipient's principal"
          value={destination}
          onChange={(e) => {
            setDestination(e.target.value);
            if (errors.destination) {
              setErrors({ ...errors, destination: undefined });
            }
          }}
          disabled={isSending}
          className={errors.destination ? "border-destructive" : ""}
          data-ocid="token-send.input"
        />
        {errors.destination && (
          <p
            className="text-xs text-destructive"
            data-ocid="token-send.error_state"
          >
            {errors.destination}
          </p>
        )}
      </div>

      <div className="space-y-2">
        <Label htmlFor={`amount-${tokenSymbol}`}>Amount</Label>
        <Input
          id={`amount-${tokenSymbol}`}
          type="text"
          placeholder={`0.00 ${tokenSymbol}`}
          value={amount}
          onChange={(e) => {
            setAmount(e.target.value);
            if (errors.amount) {
              setErrors({ ...errors, amount: undefined });
            }
          }}
          disabled={isSending}
          className={errors.amount ? "border-destructive" : ""}
        />
        {errors.amount && (
          <p className="text-xs text-destructive">{errors.amount}</p>
        )}
        <p className="text-xs text-muted-foreground">Decimals: {decimals}</p>
      </div>

      <Button
        onClick={handleSend}
        disabled={isSending || !identity}
        className="w-full gap-2"
        data-ocid="token-send.primary_button"
      >
        <Send className={`h-4 w-4 ${isSending ? "animate-pulse" : ""}`} />
        {isSending ? "Sending..." : `Send ${glyph} ${tokenSymbol}`}
      </Button>

      {!identity && (
        <p className="text-xs text-muted-foreground text-center">
          Log in to send tokens
        </p>
      )}
    </div>
  );
}
