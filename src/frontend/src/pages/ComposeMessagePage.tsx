import { MessageType } from "@/backend";
import DiagnosticsPanel from "@/components/messages/DiagnosticsPanel";
import Iso20022Composer from "@/components/messages/Iso20022Composer";
import SwiftComposer from "@/components/messages/SwiftComposer";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useGetUserProfile } from "@/hooks/useProfiles";
import { useSendMessage } from "@/hooks/useQueries";
import { useGetRelationshipStatus } from "@/hooks/useSyncStatus";
import { useTransportKey } from "@/hooks/useTransportKey";
import { useGetTrustedContacts } from "@/hooks/useTrustedContacts";
import { encryptPayload } from "@/lib/crypto/e2ee";
import {
  type Iso20022Message,
  createEmptyIso20022Message,
  generateIso20022Raw,
} from "@/lib/messageFormats/iso20022";
import {
  type SwiftMessage,
  createEmptySwiftMessage,
  generateSwiftRaw,
} from "@/lib/messageFormats/swift";
import { getPersistedUrlParameter } from "@/utils/urlParams";
import { Principal } from "@dfinity/principal";
import { useNavigate, useSearch } from "@tanstack/react-router";
import {
  AlertCircle,
  CheckCircle2,
  RefreshCw,
  Send,
  XCircle,
} from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";

export default function ComposeMessagePage() {
  const navigate = useNavigate();
  const search = useSearch({ from: "/compose" });
  const { data: contacts = [] } = useGetTrustedContacts();
  const [selectedRecipient, setSelectedRecipient] = useState<string>("");
  const [messageType, setMessageType] = useState<"iso20022" | "swift">(
    "iso20022",
  );
  const [iso20022Data, setIso20022Data] = useState<Iso20022Message>(
    createEmptyIso20022Message(),
  );
  const [swiftData, setSwiftData] = useState<SwiftMessage>(
    createEmptySwiftMessage(),
  );

  // Get vetKey from URL or session (used for transport key persistence)
  const [vetKeyFromUrl, setVetKeyFromUrl] = useState<string | null>(null);

  useEffect(() => {
    // Try to get vetKey from URL search params or session
    const urlVetKey =
      (search as any)?.vetKey || getPersistedUrlParameter("vetKey");
    setVetKeyFromUrl(urlVetKey);
  }, [search]);

  const recipientPrincipal = selectedRecipient
    ? Principal.fromText(selectedRecipient)
    : null;
  const { data: recipientProfile, refetch: refetchProfile } =
    useGetUserProfile(recipientPrincipal);
  const {
    data: syncStatus,
    refetch: refetchSyncStatus,
    isLoading: syncStatusLoading,
  } = useGetRelationshipStatus(recipientPrincipal);
  const { keyPair, vetKey } = useTransportKey(vetKeyFromUrl);
  const sendMessage = useSendMessage();

  const handleRefreshStatus = async () => {
    if (!recipientPrincipal) return;
    try {
      await Promise.all([refetchProfile(), refetchSyncStatus()]);
      toast.success("Status refreshed");
    } catch (_error) {
      toast.error("Failed to refresh status");
    }
  };

  const getSyncStatusMessage = () => {
    if (!syncStatus) return null;

    if (!syncStatus.callerHasPublicKey) {
      return {
        type: "error" as const,
        message:
          "Your transport key is not registered. Go to Dashboard and generate or rotate your key.",
      };
    }

    if (!syncStatus.otherHasPublicKey) {
      return {
        type: "error" as const,
        message:
          "Recipient has not registered a transport key. They need to open the app and generate a key in their Dashboard.",
      };
    }

    if (!syncStatus.isMutuallyTrusted) {
      if (!syncStatus.callerTrustsOther) {
        return {
          type: "error" as const,
          message: "You have not added this recipient as a trusted contact.",
        };
      }
      if (!syncStatus.otherTrustsCaller) {
        return {
          type: "error" as const,
          message:
            "Recipient has not added you as a trusted contact. They need to add your principal to their contacts list.",
        };
      }
    }

    return {
      type: "success" as const,
      message: "Ready to send encrypted messages. Both accounts are in sync.",
    };
  };

  const canSend =
    syncStatus?.callerHasPublicKey &&
    syncStatus?.otherHasPublicKey &&
    syncStatus?.isMutuallyTrusted &&
    !!keyPair;

  const handleSend = async () => {
    if (!selectedRecipient) {
      toast.error("Please select a recipient");
      return;
    }

    if (!canSend) {
      toast.error("Cannot send message. Check sync status below.");
      return;
    }

    if (!recipientProfile?.publicKey) {
      toast.error(
        "Recipient public key not available. Cannot encrypt message.",
      );
      return;
    }

    if (!keyPair) {
      toast.error("Your transport key is not available on this device");
      return;
    }

    try {
      // Generate plaintext message locally
      const plaintext =
        messageType === "iso20022"
          ? generateIso20022Raw(iso20022Data)
          : generateSwiftRaw(swiftData);

      // Encrypt using E2EE: AES-GCM for payload, RSA-OAEP for key wrapping
      // The encryptedSymmetricKey is the per-message AES key wrapped with recipient's public key
      const { encryptedPayload, encryptedSymmetricKey } = await encryptPayload(
        plaintext,
        recipientProfile.publicKey,
      );

      const recipient = Principal.fromText(selectedRecipient);
      const msgType =
        messageType === "iso20022" ? MessageType.iso20022 : MessageType.swift;

      // Send only encrypted data to backend - no plaintext transmitted
      await sendMessage.mutateAsync({
        to: recipient,
        messageType: msgType,
        encryptedPayload,
        encryptedSymmetricKey,
      });

      toast.success("Encrypted message sent successfully");
      navigate({ to: "/inbox" });
    } catch (error: unknown) {
      console.error("Failed to send message:", error);
      const message =
        error instanceof Error ? error.message : "Failed to send message";
      toast.error(message);
    }
  };

  const statusInfo = getSyncStatusMessage();

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div>
        <h1 className="text-3xl font-semibold tracking-tight">
          Compose Message
        </h1>
        <p className="text-muted-foreground mt-1">
          Create and send encrypted ISO 20022 or SWIFT messages
        </p>
      </div>

      {!vetKey && (
        <Alert>
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            No vetKey detected. Your transport key may not be available. Go to
            the Dashboard to generate a key and get your vetKey.
          </AlertDescription>
        </Alert>
      )}

      {contacts.length === 0 ? (
        <Alert>
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            You need to add trusted contacts before you can send messages. Go to
            the Contacts page to add users.
          </AlertDescription>
        </Alert>
      ) : (
        <>
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Recipient</CardTitle>
              <CardDescription>
                Select a trusted contact to send the message to
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-2">
                <Label htmlFor="recipient">Recipient</Label>
                <Select
                  value={selectedRecipient}
                  onValueChange={setSelectedRecipient}
                >
                  <SelectTrigger id="recipient">
                    <SelectValue placeholder="Select a contact" />
                  </SelectTrigger>
                  <SelectContent>
                    {contacts.map((principal) => (
                      <SelectItem
                        key={principal.toString()}
                        value={principal.toString()}
                      >
                        {principal.toString()}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>

          {selectedRecipient && (
            <>
              <Card>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle className="text-base">Sync Status</CardTitle>
                      <CardDescription>
                        Check if both accounts are ready to exchange messages
                      </CardDescription>
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={handleRefreshStatus}
                      disabled={syncStatusLoading}
                      className="gap-2"
                    >
                      <RefreshCw
                        className={`h-4 w-4 ${syncStatusLoading ? "animate-spin" : ""}`}
                      />
                      Refresh
                    </Button>
                  </div>
                </CardHeader>
                <CardContent>
                  {statusInfo && (
                    <Alert
                      variant={
                        statusInfo.type === "error" ? "destructive" : "default"
                      }
                    >
                      {statusInfo.type === "success" ? (
                        <CheckCircle2 className="h-4 w-4" />
                      ) : (
                        <XCircle className="h-4 w-4" />
                      )}
                      <AlertDescription>{statusInfo.message}</AlertDescription>
                    </Alert>
                  )}
                </CardContent>
              </Card>

              <DiagnosticsPanel
                callerHasPublicKey={syncStatus?.callerHasPublicKey ?? false}
                otherHasPublicKey={syncStatus?.otherHasPublicKey ?? false}
                isMutuallyTrusted={syncStatus?.isMutuallyTrusted ?? false}
                keyPairLoaded={!!keyPair}
                vetKeyPresent={!!vetKey}
              />

              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Message Content</CardTitle>
                  <CardDescription>
                    Choose message type and fill in the required fields
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <Tabs
                    value={messageType}
                    onValueChange={(v) =>
                      setMessageType(v as "iso20022" | "swift")
                    }
                  >
                    <TabsList className="grid w-full grid-cols-2">
                      <TabsTrigger value="iso20022">ISO 20022</TabsTrigger>
                      <TabsTrigger value="swift">SWIFT</TabsTrigger>
                    </TabsList>
                    <TabsContent value="iso20022" className="mt-4">
                      <Iso20022Composer
                        value={iso20022Data}
                        onChange={setIso20022Data}
                      />
                    </TabsContent>
                    <TabsContent value="swift" className="mt-4">
                      <SwiftComposer
                        value={swiftData}
                        onChange={setSwiftData}
                      />
                    </TabsContent>
                  </Tabs>
                </CardContent>
              </Card>

              <div className="flex justify-end">
                <Button
                  onClick={handleSend}
                  disabled={!canSend || sendMessage.isPending}
                  size="lg"
                  className="gap-2"
                >
                  {sendMessage.isPending ? (
                    <>
                      <RefreshCw className="h-4 w-4 animate-spin" />
                      Sending...
                    </>
                  ) : (
                    <>
                      <Send className="h-4 w-4" />
                      Send Encrypted Message
                    </>
                  )}
                </Button>
              </div>
            </>
          )}
        </>
      )}
    </div>
  );
}
