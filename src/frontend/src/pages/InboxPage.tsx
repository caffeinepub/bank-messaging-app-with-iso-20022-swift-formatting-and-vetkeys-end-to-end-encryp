import { useNavigate } from '@tanstack/react-router';
import { useGetMessages } from '@/hooks/useQueries';
import { useGetUserProfile } from '@/hooks/useProfiles';
import { useInternetIdentity } from '@/hooks/useInternetIdentity';
import { MessageType } from '@/backend';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Inbox, AlertCircle } from 'lucide-react';

function MessageRow({ message }: { message: any }) {
  const navigate = useNavigate();
  const { identity } = useInternetIdentity();
  const { data: senderProfile } = useGetUserProfile(message.from);
  const { data: recipientProfile } = useGetUserProfile(message.to);
  
  const currentPrincipal = identity?.getPrincipal().toString();
  const isReceived = message.to.toString() === currentPrincipal;
  const otherParty = isReceived ? message.from : message.to;
  const otherProfile = isReceived ? senderProfile : recipientProfile;

  const formatDate = (timestamp: bigint) => {
    const date = new Date(Number(timestamp) / 1000000);
    return date.toLocaleString();
  };

  const handleClick = () => {
    navigate({ to: '/message/$messageId', params: { messageId: message.id.toString() } });
  };

  return (
    <TableRow className="cursor-pointer hover:bg-muted/50" onClick={handleClick}>
      <TableCell>
        <Badge variant={isReceived ? 'default' : 'secondary'}>
          {isReceived ? 'Received' : 'Sent'}
        </Badge>
      </TableCell>
      <TableCell>
        <Badge variant="outline">
          {message.messageType === MessageType.iso20022 ? 'ISO 20022' : 'SWIFT'}
        </Badge>
      </TableCell>
      <TableCell className="font-medium">
        {otherProfile?.name || otherParty.toString().slice(0, 20) + '...'}
      </TableCell>
      <TableCell className="text-sm text-muted-foreground">
        {formatDate(message.timestamp)}
      </TableCell>
    </TableRow>
  );
}

export default function InboxPage() {
  const { data: messages = [], isLoading } = useGetMessages();

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      <div>
        <h1 className="text-3xl font-semibold tracking-tight">Messages</h1>
        <p className="text-muted-foreground mt-1">
          View your received and sent encrypted messages
        </p>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Inbox className="h-5 w-5 text-primary" />
            <CardTitle className="text-base">All Messages</CardTitle>
          </div>
          <CardDescription>
            Click on a message to view details and decrypt content
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="text-center py-8 text-muted-foreground">Loading messages...</div>
          ) : messages.length === 0 ? (
            <Alert>
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                No messages yet. Compose a new message to get started.
              </AlertDescription>
            </Alert>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Direction</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Contact</TableHead>
                  <TableHead>Date</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {messages.map((message) => (
                  <MessageRow key={message.id.toString()} message={message} />
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
