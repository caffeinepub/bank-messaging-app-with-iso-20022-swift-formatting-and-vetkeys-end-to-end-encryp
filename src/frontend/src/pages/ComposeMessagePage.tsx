import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Principal } from "@icp-sdk/core/principal";
import {
  AlertCircle,
  CheckCircle2,
  Loader2,
  PenSquare,
  Send,
} from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import { useActor } from "../hooks/useActor";
import { useInternetIdentity } from "../hooks/useInternetIdentity";
import {
  MessageType,
  useRelationshipStatus,
  useSendMessage,
  useTrustedContacts,
} from "../hooks/useQueries";
import {
  type KeyPair,
  encryptMessage,
  loadOrGenerateKeyPair,
} from "../lib/crypto/transportKeys";
import { generateVetKey } from "../lib/crypto/vetKey";

export default function ComposeMessagePage() {
  const { identity } = useInternetIdentity();
  const { actor } = useActor();
  const contactsQuery = useTrustedContacts();
  const sendMessage = useSendMessage();

  const [recipientInput, setRecipientInput] = useState("");
  const [parsedRecipient, setParsedRecipient] = useState<Principal | null>(
    null,
  );
  const [messageBody, setMessageBody] = useState("");
  const [sentMessageId, setSentMessageId] = useState<string | null>(null);
  const [sendError, setSendError] = useState<string | null>(null);

  // useRef for vetKey and keyPair — loaded async on mount
  const vetKeyRef = useRef<string | null>(null);
  const keyPairRef = useRef<KeyPair | null>(null);

  // Load keys on mount (async — ECDH key pair from localStorage)
  useEffect(() => {
    const principal = identity?.getPrincipal().toString();
    if (!principal) return;
    vetKeyRef.current = generateVetKey(principal);
    void loadOrGenerateKeyPair().then((kp) => {
      keyPairRef.current = kp;
    });
  }, [identity]);

  // Parse recipient principal when input changes
  useEffect(() => {
    const text = recipientInput.trim();
    if (!text) {
      setParsedRecipient(null);
      return;
    }
    try {
      setParsedRecipient(Principal.fromText(text));
    } catch {
      setParsedRecipient(null);
    }
  }, [recipientInput]);

  const relationshipQuery = useRelationshipStatus(parsedRecipient);

  const contacts = contactsQuery.data ?? [];

  const relationship = relationshipQuery.data;
  const canSend =
    !!parsedRecipient &&
    !!messageBody.trim() &&
    (relationship?.callerHasPublicKey ?? false) &&
    (relationship?.otherHasPublicKey ?? false) &&
    (relationship?.isMutuallyTrusted ?? false);

  const sendReadiness = (() => {
    if (!parsedRecipient)
      return { ok: false, reason: "Enter a recipient principal" };
    if (relationshipQuery.isLoading)
      return { ok: false, reason: "Checking relationship..." };
    if (!relationship?.callerHasPublicKey)
      return {
        ok: false,
        reason: "Load your transport key on the Dashboard first",
      };
    if (!relationship?.otherHasPublicKey)
      return { ok: false, reason: "Recipient has no public key registered" };
    if (!relationship?.isMutuallyTrusted)
      return {
        ok: false,
        reason: "Not mutually trusted — both parties must add each other",
      };
    if (!messageBody.trim()) return { ok: false, reason: "Enter a message" };
    return { ok: true, reason: "All checks passed - ready to send" };
  })();

  const handleSend = useCallback(async () => {
    if (!actor || !parsedRecipient || !messageBody.trim()) return;

    setSendError(null);
    setSentMessageId(null);

    // Ensure key pair is loaded (should already be set by useEffect)
    let keyPair = keyPairRef.current;
    if (!keyPair) {
      keyPair = await loadOrGenerateKeyPair();
      keyPairRef.current = keyPair;
    }

    // Fetch recipient public key fresh at send time
    let recipientPublicKey: Uint8Array | null = null;
    try {
      recipientPublicKey = await actor.getContactPublicKey(parsedRecipient);
    } catch (err) {
      setSendError(
        `Failed to fetch recipient public key: ${
          err instanceof Error ? err.message : String(err)
        }`,
      );
      return;
    }

    if (!recipientPublicKey || recipientPublicKey.length === 0) {
      setSendError(
        "Recipient public key not available. Ask them to load their transport key first.",
      );
      return;
    }

    // Encrypt using ECDH + AES-GCM
    let encrypted: {
      encryptedPayload: Uint8Array;
      encryptedSymmetricKey: Uint8Array;
    };
    try {
      encrypted = await encryptMessage(messageBody.trim(), recipientPublicKey);
    } catch (err) {
      setSendError(
        `Encryption failed: ${
          err instanceof Error ? err.message : String(err)
        }`,
      );
      return;
    }

    try {
      const messageId = await sendMessage.mutateAsync({
        to: parsedRecipient,
        messageType: MessageType.swift,
        encryptedPayload: encrypted.encryptedPayload,
        encryptedSymmetricKey: encrypted.encryptedSymmetricKey,
      });
      setSentMessageId(messageId.toString());
      setMessageBody("");
      toast.success(`Message sent! ID: ${messageId}`);
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Send failed";
      setSendError(msg);
      toast.error(msg);
    }
  }, [actor, parsedRecipient, messageBody, sendMessage]);

  return (
    <div className="space-y-6 animate-fade-up max-w-2xl">
      <div>
        <h1 className="font-display text-2xl font-bold text-foreground flex items-center gap-2">
          <PenSquare className="w-5 h-5 text-primary" />
          Compose Message
        </h1>
        <p className="text-sm text-muted-foreground mt-0.5">
          Messages are end-to-end encrypted before transmission.
        </p>
      </div>

      <div className="rounded-lg border border-border bg-card p-5 space-y-5">
        {/* Recipient */}
        <div className="space-y-2">
          <Label className="text-sm font-medium">Recipient Principal</Label>
          <Input
            placeholder="Principal ID (e.g. aaaaa-aa)"
            value={recipientInput}
            onChange={(e) => setRecipientInput(e.target.value)}
            className="font-mono text-xs"
            data-ocid="compose.input"
          />
          {contacts.length > 0 && (
            <div className="flex flex-wrap gap-1.5 pt-1">
              {contacts.map((p) => {
                const str = p.toString();
                const short = `${str.slice(0, 8)}...${str.slice(-4)}`;
                return (
                  <button
                    key={str}
                    type="button"
                    onClick={() => setRecipientInput(str)}
                    className="font-mono text-xs px-2 py-0.5 rounded border border-border hover:border-primary/50 hover:bg-primary/5 text-muted-foreground hover:text-primary transition-colors"
                  >
                    {short}
                  </button>
                );
              })}
            </div>
          )}
        </div>

        {/* Message body */}
        <div className="space-y-2">
          <Label className="text-sm font-medium">Message</Label>
          <Textarea
            placeholder="Type your encrypted message here..."
            value={messageBody}
            onChange={(e) => setMessageBody(e.target.value)}
            className="min-h-[120px] resize-none font-sans text-sm"
            data-ocid="compose.textarea"
          />
        </div>

        {/* Send Readiness Diagnostics */}
        <div className="rounded-md border border-border bg-secondary/30 p-3 space-y-2">
          <p className="text-xs font-mono text-muted-foreground">
            Send Diagnostics
          </p>
          <div className="flex items-start gap-2">
            {sendReadiness.ok ? (
              <CheckCircle2 className="w-3.5 h-3.5 text-primary shrink-0 mt-0.5" />
            ) : (
              <AlertCircle className="w-3.5 h-3.5 text-muted-foreground shrink-0 mt-0.5" />
            )}
            <span className="text-xs text-muted-foreground">
              {sendReadiness.reason}
            </span>
          </div>
          {relationship && (
            <pre className="text-xs font-mono text-foreground/60 mt-2 overflow-auto whitespace-pre-wrap">
              {JSON.stringify(
                {
                  timestamp: new Date().toISOString(),
                  callerHasPublicKey: relationship.callerHasPublicKey,
                  otherHasPublicKey: relationship.otherHasPublicKey,
                  isMutuallyTrusted: relationship.isMutuallyTrusted,
                  keyPairLoaded: !!keyPairRef.current,
                  vetKeyPresent: !!vetKeyRef.current,
                  canSend,
                  disabledReason: sendReadiness.reason,
                },
                null,
                2,
              )}
            </pre>
          )}
        </div>

        {/* Send button */}
        <Button
          onClick={() => void handleSend()}
          disabled={!canSend || sendMessage.isPending}
          className="w-full"
          data-ocid="compose.submit_button"
        >
          {sendMessage.isPending ? (
            <>
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              Encrypting &amp; Sending...
            </>
          ) : (
            <>
              <Send className="w-4 h-4 mr-2" />
              Send Encrypted Message
            </>
          )}
        </Button>

        {/* Success */}
        {sentMessageId && (
          <div
            className="text-xs text-primary font-mono bg-primary/5 border border-primary/20 rounded p-3"
            data-ocid="compose.success_state"
          >
            <div className="flex items-center gap-2 mb-1">
              <CheckCircle2 className="w-3.5 h-3.5" />
              <span className="font-semibold">Message sent successfully</span>
            </div>
            <div>Message ID: {sentMessageId}</div>
          </div>
        )}

        {/* Error */}
        {sendError && (
          <div
            className="text-xs text-destructive bg-destructive/5 border border-destructive/20 rounded p-3"
            data-ocid="compose.error_state"
          >
            <div className="flex items-center gap-2">
              <AlertCircle className="w-3.5 h-3.5" />
              <span>{sendError}</span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
