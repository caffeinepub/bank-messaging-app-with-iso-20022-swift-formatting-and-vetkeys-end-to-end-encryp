import UnauthenticatedLanding from "@/components/landing/UnauthenticatedLanding";
import ConfigErrorScreen from "@/components/system/ConfigErrorScreen";
import { useActor } from "@/hooks/useActor";
import { useInternetIdentity } from "@/hooks/useInternetIdentity";
import { useGetCallerUserProfile } from "@/hooks/useProfiles";
import ProfileSetupModal from "@/pages/ProfileSetupModal";
import { useQueryClient } from "@tanstack/react-query";
import { type ReactNode, useEffect, useState } from "react";

interface AuthGateProps {
  children: ReactNode;
}

export default function AuthGate({ children }: AuthGateProps) {
  const { identity, isInitializing } = useInternetIdentity();
  const { actor, isError } = useActor();
  const queryClient = useQueryClient();
  const {
    data: userProfile,
    isLoading: profileLoading,
    isFetched,
  } = useGetCallerUserProfile();
  const [showProfileSetup, setShowProfileSetup] = useState(false);
  const [configError, setConfigError] = useState<string | null>(null);

  const isAuthenticated = !!identity;

  // Only show config error when the actor query has actually failed.
  // This prevents false-positive error screens during the initial load.
  useEffect(() => {
    if (isError && !isInitializing) {
      setConfigError(
        "Failed to initialize backend connection. Please check your configuration.",
      );
    } else if (actor) {
      setConfigError(null);
    }
  }, [actor, isError, isInitializing]);

  useEffect(() => {
    if (!isAuthenticated) {
      queryClient.clear();
      setConfigError(null);
    }
  }, [isAuthenticated, queryClient]);

  useEffect(() => {
    if (
      isAuthenticated &&
      !profileLoading &&
      isFetched &&
      userProfile === null
    ) {
      setShowProfileSetup(true);
    } else {
      setShowProfileSetup(false);
    }
  }, [isAuthenticated, profileLoading, isFetched, userProfile]);

  // Show config error screen only on genuine backend failures
  if (configError && !isInitializing) {
    return <ConfigErrorScreen error={configError} />;
  }

  if (isInitializing) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <div className="text-center">
          <div className="mb-4 h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent mx-auto" />
          <p className="text-sm text-muted-foreground">Initializing...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <UnauthenticatedLanding />;
  }

  return (
    <>
      {children}
      {showProfileSetup && (
        <ProfileSetupModal
          open={showProfileSetup}
          onClose={() => setShowProfileSetup(false)}
        />
      )}
    </>
  );
}
