import {
  type TransportKeyPair,
  exportPublicKey,
  exportTransportKeyPair,
  generateTransportKeyPair,
  importTransportKeyPair,
} from "@/lib/crypto/transportKeys";
import {
  clearTransportKeyData,
  generateVetKey,
  getActiveVetKey,
  getTransportKeyStorageKey,
  isValidVetKey,
  storeActiveVetKey,
} from "@/utils/vetKey";
import { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";
import {
  useGetCallerUserProfile,
  useSaveCallerUserProfile,
} from "./useProfiles";

export function useTransportKey(externalVetKey?: string | null) {
  const [keyPair, setKeyPair] = useState<TransportKeyPair | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [currentVetKey, setCurrentVetKey] = useState<string | null>(null);
  const { data: userProfile } = useGetCallerUserProfile();
  const saveProfile = useSaveCallerUserProfile();

  const isRegistered = !!userProfile?.publicKey;

  // Persist keypair to sessionStorage under the current vetKey
  const persistKeyPair = useCallback(
    async (kp: TransportKeyPair, vetKey: string) => {
      try {
        const exported = await exportTransportKeyPair(kp);
        const storageKey = getTransportKeyStorageKey(vetKey);
        sessionStorage.setItem(storageKey, JSON.stringify(exported));
      } catch (error) {
        console.error("Failed to persist keypair:", error);
      }
    },
    [],
  );

  // Restore keypair from sessionStorage using the vetKey
  const restoreKeyPair = useCallback(
    async (vetKey: string): Promise<TransportKeyPair | null> => {
      try {
        const storageKey = getTransportKeyStorageKey(vetKey);
        const stored = sessionStorage.getItem(storageKey);
        if (!stored) {
          return null;
        }
        const exported = JSON.parse(stored);
        return await importTransportKeyPair(exported);
      } catch (error) {
        console.error("Failed to restore keypair:", error);
        return null;
      }
    },
    [],
  );

  // Initialize or restore keypair based on vetKey
  useEffect(() => {
    const initializeKeyPair = async () => {
      // Determine which vetKey to use
      let vetKey: string | null = null;

      // Priority 1: External vetKey (from URL/props)
      if (externalVetKey && isValidVetKey(externalVetKey)) {
        vetKey = externalVetKey;
        storeActiveVetKey(vetKey);
      } else {
        // Priority 2: Active vetKey from session
        vetKey = getActiveVetKey();
      }

      if (vetKey) {
        // Try to restore existing keypair
        const restored = await restoreKeyPair(vetKey);
        if (restored) {
          setKeyPair(restored);
          setCurrentVetKey(vetKey);
          return;
        }
      }

      // No keypair available
      setKeyPair(null);
      setCurrentVetKey(vetKey);
    };

    initializeKeyPair();
  }, [externalVetKey, restoreKeyPair]);

  const generateAndRegister = useCallback(async () => {
    if (!userProfile) {
      toast.error("User profile not loaded");
      return;
    }

    setIsGenerating(true);
    try {
      // Generate new keypair
      const newKeyPair = await generateTransportKeyPair();

      // Generate new vetKey for this keypair
      const newVetKey = generateVetKey();

      // Persist keypair locally
      await persistKeyPair(newKeyPair, newVetKey);

      // Store as active vetKey
      storeActiveVetKey(newVetKey);

      // Update state
      setKeyPair(newKeyPair);
      setCurrentVetKey(newVetKey);

      // Register public key to backend
      const publicKeyBytes = await exportPublicKey(newKeyPair.publicKey);
      await saveProfile.mutateAsync({
        name: userProfile.name,
        publicKey: publicKeyBytes,
      });

      toast.success("Transport key generated and registered");
    } catch (error) {
      console.error("Failed to generate/register transport key:", error);
      toast.error("Failed to generate transport key");
    } finally {
      setIsGenerating(false);
    }
  }, [userProfile, saveProfile, persistKeyPair]);

  // Auto-generate on first load if not registered
  useEffect(() => {
    if (userProfile && !keyPair && !isRegistered && !isGenerating) {
      generateAndRegister();
    }
  }, [userProfile, keyPair, isRegistered, isGenerating, generateAndRegister]);

  return {
    keyPair,
    isRegistered,
    isGenerating,
    generateAndRegister,
    vetKey: currentVetKey,
  };
}
