import { useState, useEffect } from 'react';
import { useParams, useNavigate } from '@tanstack/react-router';
import { useGetMessages } from '@/hooks/useQueries';
import { useGetUserProfile } from '@/hooks/useProfiles';
import { useInternetIdentity } from '@/hooks/useInternetIdentity';
import { useTransportKey } from '@/hooks/useTransportKey';
import { MessageType } from '@/backend';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Alert, AlertDescription } from '@/components/ui/alert';
import RawPreview from '@/components/messages/RawPreview';
import { decryptPayload } from '@/lib/crypto/e2ee';
import { parseIso20022Raw, type Iso20022Message } from '@/lib/messageFormats/iso20022';
import { parseSwiftRaw, type SwiftMessage } from '@/lib/messageFormats/swift';
import { ArrowLeft, Lock, Unlock, AlertCircle } from 'lucide-react';

export default function MessageDetailPage() {
  const { messageId } = useParams({ from: '/message/$messageId' });
  const navigate = useNavigate();
  const { identity } = useInternetIdentity();
  const { data: messages = [] } = useGetMessages();
  const { keyPair } = useTransportKey();
  const [decryptedContent, setDecryptedContent] = useState<string | null>(null);
  const [decryptError, setDecryptError] = useState<string | null>(null);
  const [isDecrypting, setIsDecrypting] = useState(false);

  const message = messages.find((m) => m.id.toString() === messageId);
  const { data: senderProfile } = useGetUserProfile(message?.from || null);
  const { data: recipientProfile } = useGetUserProfile(message?.to || null);

  const currentPrincipal = identity?.getPrincipal().toString();
  const isReceived = message?.to.toString() === currentPrincipal;

  useEffect(() => {
    if (message && keyPair && !decryptedContent && !decryptError && !isDecrypting) {
      // Only attempt decryption for received messages
      if (!isReceived) {
        setDecryptError('You cannot decrypt sent messages. Only the recipient can decrypt messages.');
        return;
      }

      setIsDecrypting(true);
      decryptPayload(message.encryptedPayload, message.encryptedSymmetricKey, keyPair.privateKey)
        .then((plaintext) => {
          setDecryptedContent(plaintext);
          setDecryptError(null);
        })
        .catch((error) => {
          console.error('Decryption failed:', error);
          setDecryptError('Failed to decrypt message. Your private key may not match the encrypted key, or the message was not intended for you.');
        })
        .finally(() => {
          setIsDecrypting(false);
        });
    }
  }, [message, keyPair, decryptedContent, decryptError, isDecrypting, isReceived]);

  if (!message) {
    return (
      <div className="max-w-4xl mx-auto space-y-6">
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>Message not found</AlertDescription>
        </Alert>
        <Button variant="outline" onClick={() => navigate({ to: '/inbox' })}>
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Inbox
        </Button>
      </div>
    );
  }

  const formatDate = (timestamp: bigint) => {
    const date = new Date(Number(timestamp) / 1000000);
    return date.toLocaleString();
  };

  const parsedMessage: Iso20022Message | SwiftMessage | null = decryptedContent
    ? message.messageType === MessageType.iso20022
      ? parseIso20022Raw(decryptedContent)
      : parseSwiftRaw(decryptedContent)
    : null;

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-semibold tracking-tight">Message Details</h1>
          <p className="text-muted-foreground mt-1">
            {isReceived ? 'Received' : 'Sent'} message #{message.id.toString()}
          </p>
        </div>
        <Button variant="outline" onClick={() => navigate({ to: '/inbox' })}>
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Inbox
        </Button>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="text-base">Message Information</CardTitle>
            <div className="flex gap-2">
              <Badge variant={isReceived ? 'default' : 'secondary'}>
                {isReceived ? 'Received' : 'Sent'}
              </Badge>
              <Badge variant="outline">
                {message.messageType === MessageType.iso20022 ? 'ISO 20022' : 'SWIFT'}
              </Badge>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-sm font-medium text-muted-foreground">From</p>
              <p className="text-sm font-mono">
                {senderProfile?.name || message.from.toString()}
              </p>
            </div>
            <div>
              <p className="text-sm font-medium text-muted-foreground">To</p>
              <p className="text-sm font-mono">
                {recipientProfile?.name || message.to.toString()}
              </p>
            </div>
            <div>
              <p className="text-sm font-medium text-muted-foreground">Date</p>
              <p className="text-sm">{formatDate(message.timestamp)}</p>
            </div>
            <div>
              <p className="text-sm font-medium text-muted-foreground">Encryption Status</p>
              <div className="flex items-center gap-2 text-sm">
                {decryptedContent ? (
                  <>
                    <Unlock className="h-4 w-4 text-green-600" />
                    <span className="text-green-600">Decrypted</span>
                  </>
                ) : (
                  <>
                    <Lock className="h-4 w-4 text-muted-foreground" />
                    <span className="text-muted-foreground">Encrypted</span>
                  </>
                )}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {!keyPair && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            Your transport key is not available on this device. You cannot decrypt messages without your private key.
          </AlertDescription>
        </Alert>
      )}

      {decryptError && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{decryptError}</AlertDescription>
        </Alert>
      )}

      {isDecrypting && (
        <Alert>
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>Decrypting message...</AlertDescription>
        </Alert>
      )}

      {decryptedContent && parsedMessage && (
        <>
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Message Content</CardTitle>
              <CardDescription>Decrypted message fields</CardDescription>
            </CardHeader>
            <CardContent>
              {message.messageType === MessageType.iso20022 ? (
                <div className="space-y-4">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Message ID</p>
                    <p className="text-sm">{(parsedMessage as Iso20022Message).messageId}</p>
                  </div>
                  <Separator />
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Creation Date/Time</p>
                    <p className="text-sm">{(parsedMessage as Iso20022Message).creationDateTime}</p>
                  </div>
                  <Separator />
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Debtor Name</p>
                    <p className="text-sm">{(parsedMessage as Iso20022Message).debtorName}</p>
                  </div>
                  <Separator />
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Debtor Account</p>
                    <p className="text-sm font-mono">{(parsedMessage as Iso20022Message).debtorAccount}</p>
                  </div>
                  <Separator />
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Creditor Name</p>
                    <p className="text-sm">{(parsedMessage as Iso20022Message).creditorName}</p>
                  </div>
                  <Separator />
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Creditor Account</p>
                    <p className="text-sm font-mono">{(parsedMessage as Iso20022Message).creditorAccount}</p>
                  </div>
                  <Separator />
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Amount</p>
                    <p className="text-sm">{(parsedMessage as Iso20022Message).amount}</p>
                  </div>
                  <Separator />
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Currency</p>
                    <p className="text-sm">{(parsedMessage as Iso20022Message).currency}</p>
                  </div>
                  <Separator />
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Remittance Information</p>
                    <p className="text-sm">{(parsedMessage as Iso20022Message).remittanceInfo}</p>
                  </div>
                </div>
              ) : (
                <div className="space-y-4">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Message Type</p>
                    <p className="text-sm">{(parsedMessage as SwiftMessage).messageType}</p>
                  </div>
                  <Separator />
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Sender BIC</p>
                    <p className="text-sm font-mono">{(parsedMessage as SwiftMessage).senderBIC}</p>
                  </div>
                  <Separator />
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Receiver BIC</p>
                    <p className="text-sm font-mono">{(parsedMessage as SwiftMessage).receiverBIC}</p>
                  </div>
                  <Separator />
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Transaction Reference</p>
                    <p className="text-sm">{(parsedMessage as SwiftMessage).transactionRef}</p>
                  </div>
                  <Separator />
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Value Date</p>
                    <p className="text-sm">{(parsedMessage as SwiftMessage).valueDate}</p>
                  </div>
                  <Separator />
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Currency</p>
                    <p className="text-sm">{(parsedMessage as SwiftMessage).currency}</p>
                  </div>
                  <Separator />
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Amount</p>
                    <p className="text-sm">{(parsedMessage as SwiftMessage).amount}</p>
                  </div>
                  <Separator />
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Ordering Customer</p>
                    <p className="text-sm">{(parsedMessage as SwiftMessage).orderingCustomer}</p>
                  </div>
                  <Separator />
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Beneficiary Customer</p>
                    <p className="text-sm">{(parsedMessage as SwiftMessage).beneficiaryCustomer}</p>
                  </div>
                  <Separator />
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Remittance Information</p>
                    <p className="text-sm">{(parsedMessage as SwiftMessage).remittanceInfo}</p>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-base">Raw Message</CardTitle>
              <CardDescription>Original decrypted message format</CardDescription>
            </CardHeader>
            <CardContent>
              <RawPreview content={decryptedContent} />
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
}
