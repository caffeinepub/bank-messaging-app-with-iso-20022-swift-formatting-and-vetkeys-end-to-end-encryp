import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useParams } from "@tanstack/react-router";
import { Link } from "@tanstack/react-router";
import {
  ArrowDownLeft,
  ArrowLeft,
  ArrowUpRight,
  Loader2,
  Lock,
  Unlock,
} from "lucide-react";
import { useState } from "react";
import { useInternetIdentity } from "../hooks/useInternetIdentity";
import { useMessageById } from "../hooks/useQueries";
import { decryptMessage, loadKeyPair } from "../lib/crypto/transportKeys";

function formatDate(timestamp: bigint): string {
  const ms = Number(timestamp / 1_000_000n);
  return new Date(ms).toLocaleString(undefined, {
    year: "numeric",
    month: "long",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export default function MessageDetailPage() {
  const { messageId } = useParams({ from: "/message/$messageId" });
  const { identity } = useInternetIdentity();
  const [decrypted, setDecrypted] = useState<string | null>(null);
  const [decryptError, setDecryptError] = useState<string | null>(null);

  const msgId = messageId ? BigInt(messageId) : null;
  const messageQuery = useMessageById(msgId);

  const currentPrincipal = identity?.getPrincipal().toString() ?? "";

  const handleDecrypt = () => {
    const msg = messageQuery.data;
    if (!msg) return;

    const keyPair = loadKeyPair();
    if (!keyPair) {
      setDecryptError(
        "Transport key not loaded. Go to the Dashboard and load your transport key first.",
      );
      return;
    }

    try {
      const plaintext = decryptMessage(
        msg.encryptedPayload,
        msg.encryptedSymmetricKey,
        keyPair.privateKey,
      );
      setDecrypted(plaintext);
      setDecryptError(null);
    } catch {
      setDecryptError("Failed to decrypt message. The key may not match.");
    }
  };

  if (messageQuery.isLoading) {
    return (
      <div
        className="flex items-center justify-center py-20"
        data-ocid="message.loading_state"
      >
        <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!messageQuery.data) {
    return (
      <div className="py-20 text-center" data-ocid="message.error_state">
        <p className="text-muted-foreground">Message not found.</p>
        <Link to="/inbox">
          <Button
            variant="ghost"
            size="sm"
            className="mt-4"
            data-ocid="message.back.button"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Inbox
          </Button>
        </Link>
      </div>
    );
  }

  const msg = messageQuery.data;
  const isSent = msg.from.toString() === currentPrincipal;

  return (
    <div className="space-y-6 animate-fade-up max-w-2xl">
      {/* Back */}
      <Link to="/inbox" data-ocid="message.back.link">
        <Button
          variant="ghost"
          size="sm"
          className="h-8 px-2 text-muted-foreground"
        >
          <ArrowLeft className="w-3.5 h-3.5 mr-1" />
          Back to Inbox
        </Button>
      </Link>

      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="font-display text-xl font-bold text-foreground">
            Message Detail
          </h1>
          <p className="text-xs font-mono text-muted-foreground mt-1">
            ID: {msg.id.toString()}
          </p>
        </div>
        {isSent ? (
          <Badge
            variant="outline"
            className="text-xs border-muted-foreground/30 text-muted-foreground shrink-0"
          >
            <ArrowUpRight className="w-2.5 h-2.5 mr-1" />
            Sent
          </Badge>
        ) : (
          <Badge
            variant="outline"
            className="text-xs border-primary/30 text-primary shrink-0"
          >
            <ArrowDownLeft className="w-2.5 h-2.5 mr-1" />
            Received
          </Badge>
        )}
      </div>

      {/* Metadata */}
      <div className="rounded-lg border border-border bg-card p-5 space-y-3">
        <div className="grid sm:grid-cols-2 gap-3 text-sm">
          <div>
            <p className="text-xs text-muted-foreground mb-1">From</p>
            <p className="font-mono text-xs text-foreground break-all">
              {msg.from.toString()}
            </p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground mb-1">To</p>
            <p className="font-mono text-xs text-foreground break-all">
              {msg.to.toString()}
            </p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground mb-1">Date</p>
            <p className="text-xs text-foreground">
              {formatDate(msg.timestamp)}
            </p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground mb-1">Type</p>
            <p className="font-mono text-xs text-foreground">
              {msg.messageType}
            </p>
          </div>
        </div>
      </div>

      {/* Encrypted payload */}
      <div className="rounded-lg border border-border bg-card p-5 space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Lock className="w-3.5 h-3.5 text-muted-foreground" />
            <span className="text-sm font-medium">Encrypted Message</span>
          </div>
          {!decrypted && (
            <Button
              size="sm"
              variant="outline"
              onClick={handleDecrypt}
              className="h-7 px-3 text-xs"
              data-ocid="message.primary_button"
            >
              <Unlock className="w-3 h-3 mr-1.5" />
              Decrypt
            </Button>
          )}
        </div>

        <div className="font-mono text-xs text-muted-foreground/60 bg-secondary/30 rounded p-3 break-all">
          {Array.from(msg.encryptedPayload)
            .slice(0, 64)
            .map((b) => b.toString(16).padStart(2, "0"))
            .join("")}
          {msg.encryptedPayload.length > 64 ? "..." : ""}
        </div>

        {decrypted !== null && (
          <div
            className="rounded-md border border-primary/20 bg-primary/5 p-4"
            data-ocid="message.success_state"
          >
            <div className="flex items-center gap-2 mb-2">
              <Unlock className="w-3.5 h-3.5 text-primary" />
              <span className="text-xs font-medium text-primary">
                Decrypted
              </span>
            </div>
            <p className="text-sm text-foreground whitespace-pre-wrap">
              {decrypted}
            </p>
          </div>
        )}

        {decryptError && (
          <div
            className="rounded-md border border-destructive/20 bg-destructive/5 p-3"
            data-ocid="message.error_state"
          >
            <p className="text-xs text-destructive">{decryptError}</p>
          </div>
        )}
      </div>
    </div>
  );
}
