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
  const { actor, isFetching } = useActor();
  const queryClient = useQueryClient();
  const {
    data: userProfile,
    isLoading: profileLoading,
    isFetched,
  } = useGetCallerUserProfile();
  const [showProfileSetup, setShowProfileSetup] = useState(false);
  const [configError, setConfigError] = useState<string | null>(null);

  const isAuthenticated = !!identity;

  // Detect configuration errors by attempting to use the actor
  useEffect(() => {
    if (!isFetching && !actor && !isInitializing) {
      // If we're not fetching, not initializing, but still don't have an actor, there's likely a config error
      setConfigError(
        "Failed to initialize backend connection. Please check your configuration.",
      );
    } else if (actor) {
      setConfigError(null);
    }
  }, [actor, isFetching, isInitializing]);

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

  // Show config error screen if there's a configuration issue
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
