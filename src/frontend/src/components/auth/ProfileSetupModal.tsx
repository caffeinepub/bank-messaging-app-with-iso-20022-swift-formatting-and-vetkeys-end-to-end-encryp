import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Loader2, User } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { useSaveProfile } from "../../hooks/useQueries";
import { loadOrGenerateKeyPair } from "../../lib/crypto/transportKeys";

interface ProfileSetupModalProps {
  open: boolean;
  onComplete: () => void;
}

export default function ProfileSetupModal({
  open,
  onComplete,
}: ProfileSetupModalProps) {
  const [name, setName] = useState("");
  const saveProfile = useSaveProfile();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    try {
      // loadOrGenerateKeyPair is async — must await
      const keyPair = await loadOrGenerateKeyPair();
      await saveProfile.mutateAsync({
        name: name.trim(),
        publicKey: keyPair.publicKeyRaw,
      });
      toast.success("Profile created successfully");
      onComplete();
    } catch (err) {
      toast.error(
        err instanceof Error ? err.message : "Failed to save profile",
      );
    }
  };

  return (
    <Dialog open={open}>
      <DialogContent
        className="sm:max-w-md border-border bg-card"
        data-ocid="profile_setup.dialog"
        onInteractOutside={(e) => e.preventDefault()}
      >
        <DialogHeader>
          <div className="flex items-center gap-3 mb-1">
            <div className="w-10 h-10 rounded-md bg-primary/10 flex items-center justify-center">
              <User className="w-5 h-5 text-primary" />
            </div>
            <DialogTitle className="font-display text-lg">
              Set Up Your Profile
            </DialogTitle>
          </div>
          <DialogDescription className="text-muted-foreground text-sm">
            Choose a display name. Your encryption keys will be generated and
            stored locally on this device.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={(e) => void handleSubmit(e)} className="space-y-4 pt-2">
          <div className="space-y-2">
            <Label htmlFor="profile-name" className="text-sm font-medium">
              Display Name
            </Label>
            <Input
              id="profile-name"
              placeholder="e.g. Alice"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="bg-input border-border"
              autoFocus
              data-ocid="profile_setup.input"
            />
          </div>

          <Button
            type="submit"
            className="w-full"
            disabled={!name.trim() || saveProfile.isPending}
            data-ocid="profile_setup.submit_button"
          >
            {saveProfile.isPending ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Creating Profile...
              </>
            ) : (
              "Create Profile"
            )}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}
