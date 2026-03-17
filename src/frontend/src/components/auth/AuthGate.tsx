import { Button } from "@/components/ui/button";
import { AlertTriangle, Loader2 } from "lucide-react";
import { type ReactNode, useEffect, useState } from "react";
import { useActor } from "../../hooks/useActor";
import { useInternetIdentity } from "../../hooks/useInternetIdentity";
import { useCallerProfile, useIsCallerApproved } from "../../hooks/useQueries";
import LandingPage from "../../pages/LandingPage";
import InviteCodeScreen from "./InviteCodeScreen";
import ProfileSetupModal from "./ProfileSetupModal";

function LoadingScreen() {
  return (
    <div className="min-h-screen bg-background flex items-center justify-center">
      <div className="flex flex-col items-center gap-4">
        <div className="relative">
          <div className="w-12 h-12 rounded-full border-2 border-primary/20" />
          <Loader2 className="w-12 h-12 text-primary animate-spin absolute inset-0" />
        </div>
        <p className="text-muted-foreground text-sm font-mono tracking-wide">
          Initializing...
        </p>
      </div>
    </div>
  );
}

function ConfigErrorScreen() {
  return (
    <div
      className="min-h-screen bg-background flex items-center justify-center p-4"
      data-ocid="config.error_state"
    >
      <div className="max-w-md w-full space-y-4">
        <div className="flex items-center gap-3">
          <AlertTriangle className="w-6 h-6 text-destructive flex-shrink-0" />
          <h2 className="font-display text-lg font-semibold text-foreground">
            Connection Error
          </h2>
        </div>
        <p className="text-muted-foreground text-sm leading-relaxed">
          Unable to connect to the backend. Please try refreshing the page. If
          the problem persists, the canister may be temporarily unavailable.
        </p>
        <Button
          variant="outline"
          onClick={() => window.location.reload()}
          className="w-full"
          data-ocid="config.primary_button"
        >
          Refresh Page
        </Button>
      </div>
    </div>
  );
}

export default function AuthGate({ children }: { children: ReactNode }) {
  const { identity, isInitializing } = useInternetIdentity();
  const { actor, isFetching } = useActor();
  const profileQuery = useCallerProfile();
  const approvedQuery = useIsCallerApproved();
  const [profileSetupOpen, setProfileSetupOpen] = useState(false);
  const [actorFailed, setActorFailed] = useState(false);

  const isAuthenticated = !!identity;

  // Only mark actor as failed after a genuine fetch attempt
  useEffect(() => {
    if (!isFetching && !actor && isAuthenticated) {
      const timer = setTimeout(() => setActorFailed(true), 5000);
      return () => clearTimeout(timer);
    }
    if (actor) setActorFailed(false);
  }, [actor, isFetching, isAuthenticated]);

  // Show profile setup when logged in, approved, profile is null
  useEffect(() => {
    if (
      isAuthenticated &&
      actor &&
      approvedQuery.data === true &&
      !profileQuery.isLoading &&
      profileQuery.data === null
    ) {
      setProfileSetupOpen(true);
    }
  }, [
    isAuthenticated,
    actor,
    approvedQuery.data,
    profileQuery.isLoading,
    profileQuery.data,
  ]);

  if (isInitializing) return <LoadingScreen />;

  if (!isAuthenticated) return <LandingPage />;

  if (isFetching && !actor) return <LoadingScreen />;

  if (actorFailed && !actor) return <ConfigErrorScreen />;

  // Wait for approval check to complete
  if (approvedQuery.isLoading) return <LoadingScreen />;

  // Not approved — show invite gate
  if (approvedQuery.data === false) {
    return <InviteCodeScreen onVerified={() => void approvedQuery.refetch()} />;
  }

  return (
    <>
      {profileSetupOpen && (
        <ProfileSetupModal
          open={profileSetupOpen}
          onComplete={() => setProfileSetupOpen(false)}
        />
      )}
      {children}
    </>
  );
}
