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
      setIsDecrypting(true);
      decryptPayload(message.encryptedPayload, message.keyId, keyPair.privateKey)
        .then((plaintext) => {
          setDecryptedContent(plaintext);
          setDecryptError(null);
        })
        .catch((error) => {
          console.error('Decryption failed:', error);
          setDecryptError('Failed to decrypt message. The message may not be intended for you.');
        })
        .finally(() => {
          setIsDecrypting(false);
        });
    }
  }, [message, keyPair, decryptedContent, decryptError, isDecrypting]);

  if (!message) {
    return (
      <div className="max-w-4xl mx-auto">
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>Message not found</AlertDescription>
        </Alert>
      </div>
    );
  }

  const formatDate = (timestamp: bigint) => {
    const date = new Date(Number(timestamp) / 1000000);
    return date.toLocaleString();
  };

  const parsedIso20022Message =
    decryptedContent && message.messageType === MessageType.iso20022
      ? parseIso20022Raw(decryptedContent)
      : null;

  const parsedSwiftMessage =
    decryptedContent && message.messageType === MessageType.swift
      ? parseSwiftRaw(decryptedContent)
      : null;

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="sm" onClick={() => navigate({ to: '/inbox' })}>
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Messages
        </Button>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Message Details</CardTitle>
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
              <p className="text-sm mt-1">{senderProfile?.name || 'Unknown'}</p>
              <p className="text-xs text-muted-foreground font-mono-code mt-0.5">
                {message.from.toString().slice(0, 20)}...
              </p>
            </div>
            <div>
              <p className="text-sm font-medium text-muted-foreground">To</p>
              <p className="text-sm mt-1">{recipientProfile?.name || 'Unknown'}</p>
              <p className="text-xs text-muted-foreground font-mono-code mt-0.5">
                {message.to.toString().slice(0, 20)}...
              </p>
            </div>
          </div>
          <Separator />
          <div>
            <p className="text-sm font-medium text-muted-foreground">Timestamp</p>
            <p className="text-sm mt-1">{formatDate(message.timestamp)}</p>
          </div>
        </CardContent>
      </Card>

      {isDecrypting && (
        <Alert>
          <Lock className="h-4 w-4 animate-pulse" />
          <AlertDescription>Decrypting message...</AlertDescription>
        </Alert>
      )}

      {decryptError && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{decryptError}</AlertDescription>
        </Alert>
      )}

      {decryptedContent && (
        <>
          <Alert>
            <Unlock className="h-4 w-4 text-primary" />
            <AlertDescription>Message successfully decrypted</AlertDescription>
          </Alert>

          {parsedIso20022Message && (
            <Card>
              <CardHeader>
                <CardTitle className="text-base">ISO 20022 Message Fields</CardTitle>
                <CardDescription>Structured payment information</CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Message ID</p>
                    <p className="text-sm mt-1">{parsedIso20022Message.messageId}</p>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Creation Date/Time</p>
                    <p className="text-sm mt-1">{parsedIso20022Message.creationDateTime}</p>
                  </div>
                </div>
                <Separator />
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Amount</p>
                    <p className="text-sm mt-1">
                      {parsedIso20022Message.amount} {parsedIso20022Message.currency}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">End-to-End ID</p>
                    <p className="text-sm mt-1">{parsedIso20022Message.endToEndId}</p>
                  </div>
                </div>
                <Separator />
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Debtor</p>
                  <p className="text-sm mt-1">{parsedIso20022Message.debtorName}</p>
                  <p className="text-xs text-muted-foreground mt-0.5">{parsedIso20022Message.debtorAccount}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Creditor</p>
                  <p className="text-sm mt-1">{parsedIso20022Message.creditorName}</p>
                  <p className="text-xs text-muted-foreground mt-0.5">{parsedIso20022Message.creditorAccount}</p>
                </div>
                {parsedIso20022Message.remittanceInfo && (
                  <>
                    <Separator />
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">Remittance Information</p>
                      <p className="text-sm mt-1">{parsedIso20022Message.remittanceInfo}</p>
                    </div>
                  </>
                )}
              </CardContent>
            </Card>
          )}

          {parsedSwiftMessage && (
            <Card>
              <CardHeader>
                <CardTitle className="text-base">SWIFT Message Fields</CardTitle>
                <CardDescription>Transaction details</CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Message Type</p>
                    <p className="text-sm mt-1">MT{parsedSwiftMessage.messageType}</p>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Transaction Reference</p>
                    <p className="text-sm mt-1">{parsedSwiftMessage.transactionRef}</p>
                  </div>
                </div>
                <Separator />
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Sender BIC</p>
                    <p className="text-sm mt-1">{parsedSwiftMessage.senderBIC}</p>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Receiver BIC</p>
                    <p className="text-sm mt-1">{parsedSwiftMessage.receiverBIC}</p>
                  </div>
                </div>
                <Separator />
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Amount</p>
                    <p className="text-sm mt-1">
                      {parsedSwiftMessage.amount} {parsedSwiftMessage.currency}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Value Date</p>
                    <p className="text-sm mt-1">{parsedSwiftMessage.valueDate}</p>
                  </div>
                </div>
                {parsedSwiftMessage.orderingCustomer && (
                  <>
                    <Separator />
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">Ordering Customer</p>
                      <p className="text-sm mt-1 whitespace-pre-wrap">{parsedSwiftMessage.orderingCustomer}</p>
                    </div>
                  </>
                )}
                {parsedSwiftMessage.beneficiaryCustomer && (
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Beneficiary Customer</p>
                    <p className="text-sm mt-1 whitespace-pre-wrap">{parsedSwiftMessage.beneficiaryCustomer}</p>
                  </div>
                )}
                {parsedSwiftMessage.remittanceInfo && (
                  <>
                    <Separator />
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">Remittance Information</p>
                      <p className="text-sm mt-1 whitespace-pre-wrap">{parsedSwiftMessage.remittanceInfo}</p>
                    </div>
                  </>
                )}
              </CardContent>
            </Card>
          )}

          <RawPreview content={decryptedContent} />
        </>
      )}
    </div>
  );
}
