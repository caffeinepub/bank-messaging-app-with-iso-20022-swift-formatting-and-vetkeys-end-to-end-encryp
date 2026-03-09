/**
 * Network and canister configuration resolver for IC mainnet vs local development.
 * Provides a single source of truth for canister IDs and host selection.
 */

export interface NetworkConfig {
  host: string;
  isLocal: boolean;
}

export interface CanisterConfig {
  backendCanisterId: string;
  network: NetworkConfig;
}

/**
 * Determines the network configuration based on environment and runtime context.
 */
export function getNetworkConfig(): NetworkConfig {
  // Check for explicit VITE_HOST override (used in production builds)
  const envHost = import.meta.env.VITE_HOST;
  if (envHost) {
    return {
      host: envHost,
      isLocal: envHost.includes("localhost") || envHost.includes("127.0.0.1"),
    };
  }

  // Runtime detection based on window.location
  const hostname = window.location.hostname;
  const isLocal =
    hostname.includes("localhost") || hostname.includes("127.0.0.1");

  return {
    host: isLocal ? "http://localhost:4943" : "https://ic0.app",
    isLocal,
  };
}

/**
 * Resolves the backend canister ID based on environment and network.
 * Throws actionable errors if required values are missing.
 */
export function getBackendCanisterId(): string {
  const network = getNetworkConfig();

  // For local development, use the local canister ID from env.json
  if (network.isLocal) {
    const localId = import.meta.env.VITE_BACKEND_CANISTER_ID;
    if (!localId) {
      throw new Error(
        'Local backend canister ID not found. Run "dfx deploy" to create local canisters.',
      );
    }
    return localId;
  }

  // For IC mainnet, require explicit canister ID
  const mainnetId = import.meta.env.VITE_BACKEND_CANISTER_ID;
  if (!mainnetId) {
    throw new Error(
      "Mainnet backend canister ID not configured. Set VITE_BACKEND_CANISTER_ID in your build environment or deploy to IC mainnet first.",
    );
  }

  return mainnetId;
}

/**
 * Gets the complete canister configuration with validation.
 */
export function getCanisterConfig(): CanisterConfig {
  const network = getNetworkConfig();
  const backendCanisterId = getBackendCanisterId();

  return {
    backendCanisterId,
    network,
  };
}
