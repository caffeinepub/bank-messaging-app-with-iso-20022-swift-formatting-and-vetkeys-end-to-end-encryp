import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Link } from "@tanstack/react-router";
import { ArrowDownLeft, ArrowUpRight, Inbox, Loader2 } from "lucide-react";
import { useInternetIdentity } from "../hooks/useInternetIdentity";
import { useAllMessages } from "../hooks/useQueries";

function formatDate(timestamp: bigint): string {
  const ms = Number(timestamp / 1_000_000n);
  return new Date(ms).toLocaleString();
}

function truncatePrincipal(p: string): string {
  return `${p.slice(0, 8)}...${p.slice(-4)}`;
}

export default function InboxPage() {
  const { identity } = useInternetIdentity();
  const messagesQuery = useAllMessages();
  const currentPrincipal = identity?.getPrincipal().toString() ?? "";

  const messages = messagesQuery.data ?? [];

  // Sort by timestamp descending
  const sorted = [...messages].sort((a, b) =>
    Number(b.timestamp - a.timestamp),
  );

  return (
    <div className="space-y-6 animate-fade-up">
      <div>
        <h1 className="font-display text-2xl font-bold text-foreground flex items-center gap-2">
          <Inbox className="w-5 h-5 text-primary" />
          Messages
        </h1>
        <p className="text-sm text-muted-foreground mt-0.5">
          All sent and received encrypted messages.
        </p>
      </div>

      <div className="rounded-lg border border-border bg-card overflow-hidden">
        {messagesQuery.isLoading ? (
          <div
            className="p-12 flex items-center justify-center"
            data-ocid="inbox.loading_state"
          >
            <Loader2 className="w-5 h-5 animate-spin text-muted-foreground" />
          </div>
        ) : sorted.length === 0 ? (
          <div className="p-12 text-center" data-ocid="inbox.empty_state">
            <Inbox className="w-8 h-8 text-muted-foreground/40 mx-auto mb-3" />
            <p className="text-muted-foreground text-sm">No messages yet.</p>
            <p className="text-muted-foreground/60 text-xs mt-1">
              Send a message to a trusted contact to get started.
            </p>
          </div>
        ) : (
          <Table data-ocid="inbox.table">
            <TableHeader>
              <TableRow>
                <TableHead className="w-20">Type</TableHead>
                <TableHead>Contact</TableHead>
                <TableHead>Date</TableHead>
                <TableHead className="w-16" />
              </TableRow>
            </TableHeader>
            <TableBody>
              {sorted.map((msg, i) => {
                const isSent = msg.from.toString() === currentPrincipal;
                const contact = isSent
                  ? msg.to.toString()
                  : msg.from.toString();
                return (
                  <TableRow
                    key={msg.id.toString()}
                    className="hover:bg-secondary/30 cursor-pointer"
                    data-ocid={`inbox.item.${i + 1}`}
                  >
                    <TableCell>
                      {isSent ? (
                        <Badge
                          variant="outline"
                          className="text-xs border-muted-foreground/30 text-muted-foreground"
                        >
                          <ArrowUpRight className="w-2.5 h-2.5 mr-1" />
                          Sent
                        </Badge>
                      ) : (
                        <Badge
                          variant="outline"
                          className="text-xs border-primary/30 text-primary"
                        >
                          <ArrowDownLeft className="w-2.5 h-2.5 mr-1" />
                          Received
                        </Badge>
                      )}
                    </TableCell>
                    <TableCell>
                      <span className="font-mono text-xs text-muted-foreground">
                        {truncatePrincipal(contact)}
                      </span>
                    </TableCell>
                    <TableCell>
                      <span className="text-xs text-muted-foreground">
                        {formatDate(msg.timestamp)}
                      </span>
                    </TableCell>
                    <TableCell>
                      <Link
                        to="/message/$messageId"
                        params={{ messageId: msg.id.toString() }}
                        className="text-xs text-primary hover:underline"
                        data-ocid={`inbox.message.link.${i + 1}`}
                      >
                        View
                      </Link>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        )}
      </div>
    </div>
  );
}
