import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Lock, ShieldCheck } from "lucide-react";
import { useEffect, useState } from "react";
import { useSubmitRSVP } from "../../hooks/useQueries";

interface InviteCodeScreenProps {
  onVerified: () => void;
}

export default function InviteCodeScreen({
  onVerified,
}: InviteCodeScreenProps) {
  const [code, setCode] = useState("");
  const [error, setError] = useState("");
  const submitRSVP = useSubmitRSVP();

  // Auto-populate from URL param
  useEffect(() => {
    const urlCode = new URLSearchParams(window.location.search).get("code");
    if (urlCode) {
      setCode(urlCode.toUpperCase());
    }
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    try {
      await submitRSVP.mutateAsync({
        name: "User",
        attending: true,
        inviteCode: code,
      });
      onVerified();
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Invalid or already used invite code",
      );
    }
  };

  return (
    <div
      className="min-h-screen bg-background flex items-center justify-center p-4"
      data-ocid="invite.panel"
    >
      <div className="w-full max-w-sm space-y-8">
        {/* Logo / Icon */}
        <div className="flex flex-col items-center gap-4">
          <div className="w-14 h-14 rounded-2xl bg-primary/10 border border-primary/20 flex items-center justify-center">
            <ShieldCheck className="w-7 h-7 text-primary" />
          </div>
          <div className="text-center">
            <h1 className="font-display text-2xl font-bold text-foreground tracking-tight">
              OP_DUP Secure Messages
            </h1>
            <p className="text-sm text-muted-foreground mt-1.5 leading-relaxed">
              This app is invite-only. Enter your invite code to continue.
            </p>
          </div>
        </div>

        {/* Form */}
        <form onSubmit={(e) => void handleSubmit(e)} className="space-y-4">
          <div className="space-y-2">
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder="XXXX-XXXX-XXXX"
                value={code}
                onChange={(e) => {
                  setCode(e.target.value.toUpperCase());
                  setError("");
                }}
                className="pl-10 font-mono tracking-widest text-center h-12 text-sm uppercase"
                autoFocus
                data-ocid="invite.input"
              />
            </div>
            {error && (
              <p
                className="text-xs text-destructive text-center"
                data-ocid="invite.error_state"
              >
                {error}
              </p>
            )}
          </div>

          <Button
            type="submit"
            className="w-full h-11"
            disabled={!code.trim() || submitRSVP.isPending}
            data-ocid="invite.submit_button"
          >
            {submitRSVP.isPending ? "Verifying..." : "Continue"}
          </Button>
        </form>

        <p className="text-center text-xs text-muted-foreground">
          No invite code? Contact the app administrator.
        </p>
      </div>
    </div>
  );
}
