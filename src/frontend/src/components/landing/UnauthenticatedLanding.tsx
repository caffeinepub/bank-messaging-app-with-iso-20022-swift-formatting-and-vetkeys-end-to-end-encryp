import LoginButton from "@/components/auth/LoginButton";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Key, Lock, MessageSquare, Shield, Users } from "lucide-react";
import ImportantTokenInformation from "./ImportantTokenInformation";

export default function UnauthenticatedLanding() {
  return (
    <div className="min-h-screen bg-background">
      {/* Hero Section */}
      <div className="container mx-auto px-4 py-16 md:py-24">
        <div className="max-w-4xl mx-auto text-center space-y-6">
          <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold tracking-tight">
            OP_DUP Secure Messages
          </h1>
          <p className="text-xl md:text-2xl text-muted-foreground max-w-2xl mx-auto">
            Military-grade end-to-end encrypted messaging on the blockchain
          </p>
          <div className="max-w-3xl mx-auto py-4">
            <p className="text-sm md:text-base text-muted-foreground border border-border rounded-lg p-4 bg-muted/30">
              OP_DUP Dapp operates without a central authority and does not
              offer warranties or guarantees, consistent with its foundational
              principle of eliminating reliance on trusted intermediaries
            </p>
          </div>
          <div className="pt-4 flex justify-center">
            <LoginButton />
          </div>
        </div>
      </div>

      {/* Key Features Section */}
      <div className="container mx-auto px-4 py-16">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-3xl md:text-4xl font-bold text-center mb-12">
            Key Features
          </h2>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            <Card>
              <CardHeader>
                <Lock className="h-10 w-10 text-primary mb-2" />
                <CardTitle>End-to-End Encryption</CardTitle>
              </CardHeader>
              <CardContent>
                <CardDescription className="text-base">
                  Messages are encrypted on your device before transmission and
                  can only be decrypted by the intended recipient.
                </CardDescription>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <Users className="h-10 w-10 text-primary mb-2" />
                <CardTitle>Trusted Contacts</CardTitle>
              </CardHeader>
              <CardContent>
                <CardDescription className="text-base">
                  Build your network of verified contacts. Only mutually trusted
                  parties can exchange messages.
                </CardDescription>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <Key className="h-10 w-10 text-primary mb-2" />
                <CardTitle>Device-Only Keys</CardTitle>
              </CardHeader>
              <CardContent>
                <CardDescription className="text-base">
                  Your private encryption keys never leave your device, ensuring
                  complete control over your security.
                </CardDescription>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <MessageSquare className="h-10 w-10 text-primary mb-2" />
                <CardTitle>Secure Message Storage</CardTitle>
              </CardHeader>
              <CardContent>
                <CardDescription className="text-base">
                  All messages are stored encrypted on the blockchain,
                  accessible only to authorized participants.
                </CardDescription>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <Shield className="h-10 w-10 text-primary mb-2" />
                <CardTitle>Internet Identity</CardTitle>
              </CardHeader>
              <CardContent>
                <CardDescription className="text-base">
                  Passwordless authentication using Internet Computer's secure
                  identity framework with biometric support.
                </CardDescription>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>

      {/* Important Token Information Section */}
      <ImportantTokenInformation />

      {/* Security Information Section */}
      <div className="container mx-auto px-4 py-16 bg-muted/30">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-12">
            <Shield className="h-16 w-16 text-primary mx-auto mb-4" />
            <h2 className="text-3xl md:text-4xl font-bold mb-4">
              Security Information
            </h2>
            <p className="text-lg text-muted-foreground">
              Your security and privacy are our top priorities
            </p>
          </div>

          <div className="space-y-6">
            <Card className="border-2 border-primary/20">
              <CardHeader>
                <CardTitle className="flex items-center gap-3">
                  <Key className="h-6 w-6 text-primary" />
                  Private Keys Stay on Your Device
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">
                  Your private encryption keys are generated locally on your
                  device and never transmitted to any server. You maintain
                  complete control over your cryptographic identity, ensuring
                  that no third party can access your private keys.
                </p>
              </CardContent>
            </Card>

            <Card className="border-2 border-primary/20">
              <CardHeader>
                <CardTitle className="flex items-center gap-3">
                  <Lock className="h-6 w-6 text-primary" />
                  End-to-End Encryption
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">
                  Messages are encrypted locally on your device before being
                  sent and can only be decrypted by the intended recipient. Even
                  the platform infrastructure cannot read your messages -- only
                  you and your recipient hold the keys.
                </p>
              </CardContent>
            </Card>

            <Card className="border-2 border-primary/20">
              <CardHeader>
                <CardTitle className="flex items-center gap-3">
                  <Users className="h-6 w-6 text-primary" />
                  Permissioned Messaging
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">
                  Messaging is restricted to mutually trusted contacts only.
                  Both parties must explicitly add each other as trusted
                  contacts before any messages can be exchanged, preventing
                  unsolicited communications and ensuring a secure, verified
                  network.
                </p>
              </CardContent>
            </Card>

            <Card className="border-2 border-primary/20">
              <CardHeader>
                <CardTitle className="flex items-center gap-3">
                  <Shield className="h-6 w-6 text-primary" />
                  Blockchain-Backed Security
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">
                  Built on the Internet Computer blockchain, the platform
                  benefits from tamper-proof storage, transparent operations,
                  and decentralized infrastructure that eliminates single points
                  of failure.
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>

      {/* Footer CTA */}
      <div className="container mx-auto px-4 py-16">
        <div className="max-w-2xl mx-auto text-center space-y-6">
          <h2 className="text-2xl md:text-3xl font-bold">
            Ready to Get Started?
          </h2>
          <p className="text-lg text-muted-foreground">
            Authenticate with Internet Identity to access the secure messaging
            platform
          </p>
          <LoginButton />
        </div>
      </div>
    </div>
  );
}
