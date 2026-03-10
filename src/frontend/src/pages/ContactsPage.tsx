import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Principal } from "@icp-sdk/core/principal";
import {
  CheckCircle2,
  Clock,
  Loader2,
  Trash2,
  UserPlus,
  Users,
} from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { useInternetIdentity } from "../hooks/useInternetIdentity";
import {
  useAddTrustedContact,
  useContactProfile,
  useRelationshipStatus,
  useRemoveTrustedContact,
  useTrustedContacts,
} from "../hooks/useQueries";

function ContactRow({
  principal,
  index,
  onRemove,
}: {
  principal: Principal;
  index: number;
  onRemove: (p: Principal) => void;
}) {
  const profileQuery = useContactProfile(principal);
  const statusQuery = useRelationshipStatus(principal);
  const principalStr = principal.toString();
  const short = `${principalStr.slice(0, 10)}...${principalStr.slice(-4)}`;

  const isMutual = statusQuery.data?.isMutuallyTrusted ?? false;
  const hasPubKey = statusQuery.data?.otherHasPublicKey ?? false;

  return (
    <TableRow data-ocid={`contacts.item.${index}`}>
      <TableCell>
        <div className="font-medium text-sm">
          {profileQuery.data?.name ?? (
            <span className="text-muted-foreground italic">Unknown</span>
          )}
        </div>
        <div className="font-mono text-xs text-muted-foreground mt-0.5">
          {short}
        </div>
      </TableCell>
      <TableCell>
        <div className="flex flex-col gap-1">
          {isMutual ? (
            <Badge
              variant="outline"
              className="text-xs w-fit border-primary/30 text-primary"
            >
              <CheckCircle2 className="w-2.5 h-2.5 mr-1" />
              Mutual
            </Badge>
          ) : (
            <Badge
              variant="outline"
              className="text-xs w-fit text-muted-foreground"
            >
              <Clock className="w-2.5 h-2.5 mr-1" />
              Pending
            </Badge>
          )}
          {hasPubKey && (
            <Badge
              variant="outline"
              className="text-xs w-fit border-accent/30 text-accent"
            >
              Key ✓
            </Badge>
          )}
        </div>
      </TableCell>
      <TableCell className="text-right">
        <AlertDialog>
          <AlertDialogTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              className="w-7 h-7 text-muted-foreground hover:text-destructive"
              data-ocid={`contacts.delete_button.${index}`}
            >
              <Trash2 className="w-3.5 h-3.5" />
            </Button>
          </AlertDialogTrigger>
          <AlertDialogContent data-ocid="contacts.dialog">
            <AlertDialogHeader>
              <AlertDialogTitle>Remove Contact</AlertDialogTitle>
              <AlertDialogDescription>
                Remove <span className="font-mono text-xs">{short}</span> from
                your trusted contacts? You will no longer be able to send each
                other messages.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel data-ocid="contacts.cancel_button">
                Cancel
              </AlertDialogCancel>
              <AlertDialogAction
                onClick={() => onRemove(principal)}
                className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                data-ocid="contacts.confirm_button"
              >
                Remove
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </TableCell>
    </TableRow>
  );
}

export default function ContactsPage() {
  const { identity } = useInternetIdentity();
  const contactsQuery = useTrustedContacts();
  const addContact = useAddTrustedContact();
  const removeContact = useRemoveTrustedContact();
  const [newPrincipal, setNewPrincipal] = useState("");

  const currentPrincipal = identity?.getPrincipal().toString() ?? "";

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    const text = newPrincipal.trim();
    if (!text) return;

    if (text === currentPrincipal) {
      toast.error("You cannot add yourself as a contact");
      return;
    }

    try {
      const principal = Principal.fromText(text);
      await addContact.mutateAsync(principal);
      setNewPrincipal("");
      toast.success("Contact added");
    } catch (err) {
      toast.error(
        err instanceof Error
          ? err.message
          : "Invalid principal or failed to add",
      );
    }
  };

  const handleRemove = async (principal: Principal) => {
    try {
      await removeContact.mutateAsync(principal);
      toast.success("Contact removed");
    } catch (err) {
      toast.error(
        err instanceof Error ? err.message : "Failed to remove contact",
      );
    }
  };

  const contacts = contactsQuery.data ?? [];

  return (
    <div className="space-y-6 animate-fade-up">
      <div>
        <h1 className="font-display text-2xl font-bold text-foreground">
          Trusted Contacts
        </h1>
        <p className="text-sm text-muted-foreground mt-0.5">
          Only mutually trusted contacts can exchange encrypted messages.
        </p>
      </div>

      {/* Add Contact */}
      <div className="rounded-lg border border-border bg-card p-5">
        <h2 className="font-medium text-sm mb-3 flex items-center gap-2">
          <UserPlus className="w-4 h-4 text-primary" />
          Add Contact
        </h2>
        <form onSubmit={(e) => void handleAdd(e)} className="flex gap-2">
          <Input
            placeholder="Principal ID (e.g. aaaaa-aa)"
            value={newPrincipal}
            onChange={(e) => setNewPrincipal(e.target.value)}
            className="font-mono text-xs flex-1"
            data-ocid="contacts.input"
          />
          <Button
            type="submit"
            size="sm"
            disabled={!newPrincipal.trim() || addContact.isPending}
            data-ocid="contacts.primary_button"
          >
            {addContact.isPending ? (
              <Loader2 className="w-3.5 h-3.5 animate-spin" />
            ) : (
              "Add"
            )}
          </Button>
        </form>
      </div>

      {/* Contact List */}
      <div className="rounded-lg border border-border bg-card overflow-hidden">
        <div className="px-5 py-3 border-b border-border flex items-center gap-2">
          <Users className="w-4 h-4 text-muted-foreground" />
          <span className="text-sm font-medium">
            {contacts.length} Contact{contacts.length !== 1 ? "s" : ""}
          </span>
        </div>

        {contactsQuery.isLoading ? (
          <div
            className="p-8 flex items-center justify-center"
            data-ocid="contacts.loading_state"
          >
            <Loader2 className="w-5 h-5 animate-spin text-muted-foreground" />
          </div>
        ) : contacts.length === 0 ? (
          <div
            className="p-8 text-center text-muted-foreground text-sm"
            data-ocid="contacts.empty_state"
          >
            No trusted contacts yet. Add someone by their principal ID above.
          </div>
        ) : (
          <Table data-ocid="contacts.table">
            <TableHeader>
              <TableRow>
                <TableHead>Contact</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {contacts.map((p, i) => (
                <ContactRow
                  key={p.toString()}
                  principal={p}
                  index={i + 1}
                  onRemove={(p) => void handleRemove(p)}
                />
              ))}
            </TableBody>
          </Table>
        )}
      </div>
    </div>
  );
}
