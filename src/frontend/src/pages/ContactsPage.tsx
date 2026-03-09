import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useGetUserProfile } from "@/hooks/useProfiles";
import { useGetRelationshipStatus } from "@/hooks/useSyncStatus";
import {
  useAddTrustedContact,
  useGetTrustedContacts,
  useRemoveTrustedContact,
} from "@/hooks/useTrustedContacts";
import { Principal } from "@dfinity/principal";
import {
  AlertCircle,
  CheckCircle2,
  RefreshCw,
  Trash2,
  UserPlus,
  XCircle,
} from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

function ContactRow({ principal }: { principal: Principal }) {
  const { data: profile } = useGetUserProfile(principal);
  const {
    data: syncStatus,
    refetch: refetchStatus,
    isLoading: statusLoading,
  } = useGetRelationshipStatus(principal);
  const removeTrustedContact = useRemoveTrustedContact();

  const handleRemove = async () => {
    try {
      await removeTrustedContact.mutateAsync(principal);
      toast.success("Contact removed");
    } catch (error: unknown) {
      const message =
        error instanceof Error ? error.message : "Failed to remove contact";
      toast.error(message);
    }
  };

  const handleRefresh = async () => {
    try {
      await refetchStatus();
      toast.success("Status refreshed");
    } catch (_error) {
      toast.error("Failed to refresh status");
    }
  };

  const getReadinessInfo = () => {
    if (!syncStatus) return { ready: false, hint: "Unable to check status" };

    if (!syncStatus.callerHasPublicKey) {
      return {
        ready: false,
        hint: "You need to register a transport key in Dashboard",
      };
    }

    if (!syncStatus.otherHasPublicKey) {
      return {
        ready: false,
        hint: "They need to register a transport key",
      };
    }

    if (!syncStatus.otherTrustsCaller) {
      return {
        ready: false,
        hint: "They need to add you back as a trusted contact",
      };
    }

    return {
      ready: true,
      hint: "Ready to exchange messages",
    };
  };

  const readinessInfo = getReadinessInfo();

  return (
    <TableRow>
      <TableCell className="font-medium">
        {profile?.name || "Unknown"}
      </TableCell>
      <TableCell className="font-mono text-xs">
        {principal.toString()}
      </TableCell>
      <TableCell>
        <div className="flex items-center gap-2">
          {statusLoading ? (
            <Badge variant="outline" className="gap-1">
              <RefreshCw className="h-3 w-3 animate-spin" />
              Checking...
            </Badge>
          ) : readinessInfo.ready ? (
            <Badge
              variant="default"
              className="gap-1 bg-success text-success-foreground"
            >
              <CheckCircle2 className="h-3 w-3" />
              Ready
            </Badge>
          ) : (
            <Badge variant="destructive" className="gap-1">
              <XCircle className="h-3 w-3" />
              Not ready
            </Badge>
          )}
        </div>
      </TableCell>
      <TableCell className="text-sm text-muted-foreground">
        {readinessInfo.hint}
      </TableCell>
      <TableCell className="text-right">
        <div className="flex items-center justify-end gap-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={handleRefresh}
            disabled={statusLoading}
            title="Refresh status"
          >
            <RefreshCw
              className={`h-4 w-4 ${statusLoading ? "animate-spin" : ""}`}
            />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={handleRemove}
            disabled={removeTrustedContact.isPending}
            title="Remove contact"
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      </TableCell>
    </TableRow>
  );
}

export default function ContactsPage() {
  const [principalInput, setPrincipalInput] = useState("");
  const { data: contacts = [] } = useGetTrustedContacts();
  const addTrustedContact = useAddTrustedContact();

  const handleAddContact = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!principalInput.trim()) {
      toast.error("Please enter a principal address");
      return;
    }

    try {
      const principal = Principal.fromText(principalInput.trim());
      await addTrustedContact.mutateAsync(principal);
      toast.success("Contact added successfully");
      setPrincipalInput("");
    } catch (error: unknown) {
      const message =
        error instanceof Error ? error.message : "Failed to add contact";
      toast.error(message);
    }
  };

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      <div>
        <h1 className="text-3xl font-semibold tracking-tight">
          Trusted Contacts
        </h1>
        <p className="text-muted-foreground mt-1">
          Manage users authorized to exchange encrypted messages with you
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Add New Contact</CardTitle>
          <CardDescription>
            Enter the principal address of the user you want to add as a trusted
            contact
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleAddContact} className="space-y-4">
            <div className="grid gap-2">
              <Label htmlFor="principal">Principal Address</Label>
              <Input
                id="principal"
                value={principalInput}
                onChange={(e) => setPrincipalInput(e.target.value)}
                placeholder="xxxxx-xxxxx-xxxxx-xxxxx-xxxxx-xxxxx-xxxxx-xxxxx-xxx"
                className="font-mono text-sm"
              />
            </div>
            <Button
              type="submit"
              disabled={addTrustedContact.isPending}
              className="gap-2"
            >
              <UserPlus className="h-4 w-4" />
              {addTrustedContact.isPending ? "Adding..." : "Add Contact"}
            </Button>
          </form>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Your Trusted Contacts</CardTitle>
          <CardDescription>
            Users you have authorized for secure messaging
          </CardDescription>
        </CardHeader>
        <CardContent>
          {contacts.length === 0 ? (
            <Alert>
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                You haven't added any trusted contacts yet. Add contacts to
                start exchanging encrypted messages.
              </AlertDescription>
            </Alert>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Principal</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Details</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {contacts.map((principal) => (
                  <ContactRow
                    key={principal.toString()}
                    principal={principal}
                  />
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      <Alert>
        <AlertCircle className="h-4 w-4" />
        <AlertDescription>
          <strong>Note:</strong> Both you and the other user must add each other
          as trusted contacts before you can exchange messages. This ensures
          mutual consent for secure communication.
        </AlertDescription>
      </Alert>
    </div>
  );
}
