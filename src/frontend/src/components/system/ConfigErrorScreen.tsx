import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { AlertCircle } from "lucide-react";

interface ConfigErrorScreenProps {
  error: string;
}

export default function ConfigErrorScreen({ error }: ConfigErrorScreenProps) {
  const isLocalError = error.includes("dfx deploy") || error.includes("local");
  const isMainnetError =
    error.includes("mainnet") || error.includes("VITE_BACKEND_CANISTER_ID");

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <Card className="max-w-2xl w-full border-destructive">
        <CardHeader>
          <div className="flex items-center gap-3 mb-2">
            <AlertCircle className="h-8 w-8 text-destructive" />
            <CardTitle className="text-2xl">Configuration Error</CardTitle>
          </div>
          <CardDescription>
            The application cannot start due to a configuration issue
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>Error Details</AlertTitle>
            <AlertDescription className="mt-2 font-mono text-sm">
              {error}
            </AlertDescription>
          </Alert>

          {isLocalError && (
            <div className="space-y-4">
              <h3 className="font-semibold text-lg">Local Development Setup</h3>
              <p className="text-sm text-muted-foreground">
                To run the application locally, you need to deploy the backend
                canister first:
              </p>
              <div className="bg-muted p-4 rounded-lg">
                <code className="text-sm">
                  dfx start --clean --background
                  <br />
                  dfx deploy
                </code>
              </div>
              <p className="text-sm text-muted-foreground">
                This will create local canisters and generate the required
                configuration files.
              </p>
            </div>
          )}

          {isMainnetError && (
            <div className="space-y-4">
              <h3 className="font-semibold text-lg">IC Mainnet Deployment</h3>
              <p className="text-sm text-muted-foreground">
                To deploy to IC mainnet, you need to:
              </p>
              <ol className="list-decimal list-inside space-y-2 text-sm text-muted-foreground ml-2">
                <li>Deploy your backend canister to IC mainnet</li>
                <li>Set the VITE_BACKEND_CANISTER_ID environment variable</li>
                <li>Rebuild the frontend with the mainnet configuration</li>
              </ol>
              <div className="bg-muted p-4 rounded-lg">
                <code className="text-sm">
                  dfx deploy --network ic
                  <br /># Set VITE_BACKEND_CANISTER_ID to your deployed canister
                  ID
                  <br />
                  npm run build
                </code>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
