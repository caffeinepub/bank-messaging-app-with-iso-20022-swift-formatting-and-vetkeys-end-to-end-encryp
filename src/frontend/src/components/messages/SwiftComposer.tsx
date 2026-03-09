import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import {
  type SwiftMessage,
  generateSwiftRaw,
} from "@/lib/messageFormats/swift";
import { useEffect, useState } from "react";
import RawPreview from "./RawPreview";

interface SwiftComposerProps {
  value: SwiftMessage;
  onChange: (value: SwiftMessage) => void;
}

export default function SwiftComposer({ value, onChange }: SwiftComposerProps) {
  const [rawPreview, setRawPreview] = useState("");

  useEffect(() => {
    setRawPreview(generateSwiftRaw(value));
  }, [value]);

  const handleFieldChange = (field: keyof SwiftMessage, fieldValue: string) => {
    onChange({ ...value, [field]: fieldValue });
  };

  return (
    <Tabs defaultValue="form" className="w-full">
      <TabsList className="grid w-full grid-cols-2">
        <TabsTrigger value="form">Form</TabsTrigger>
        <TabsTrigger value="preview">Raw Preview</TabsTrigger>
      </TabsList>

      <TabsContent value="form" className="space-y-4">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Basic Header (Block 1)</CardTitle>
            <CardDescription>
              Application and service identifiers
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-2">
              <Label htmlFor="messageType">Message Type (MT)</Label>
              <Input
                id="messageType"
                value={value.messageType}
                onChange={(e) =>
                  handleFieldChange("messageType", e.target.value)
                }
                placeholder="103"
                maxLength={3}
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="senderBIC">Sender BIC</Label>
              <Input
                id="senderBIC"
                value={value.senderBIC}
                onChange={(e) => handleFieldChange("senderBIC", e.target.value)}
                placeholder="BANKGB2LXXX"
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="receiverBIC">Receiver BIC</Label>
              <Input
                id="receiverBIC"
                value={value.receiverBIC}
                onChange={(e) =>
                  handleFieldChange("receiverBIC", e.target.value)
                }
                placeholder="BANKUS33XXX"
              />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Transaction Details</CardTitle>
            <CardDescription>Payment information</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-2">
              <Label htmlFor="transactionRef">Transaction Reference (20)</Label>
              <Input
                id="transactionRef"
                value={value.transactionRef}
                onChange={(e) =>
                  handleFieldChange("transactionRef", e.target.value)
                }
                placeholder="TRN20260210001"
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="valueDate">Value Date (32A)</Label>
              <Input
                id="valueDate"
                type="date"
                value={value.valueDate}
                onChange={(e) => handleFieldChange("valueDate", e.target.value)}
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="currency">Currency</Label>
              <Input
                id="currency"
                value={value.currency}
                onChange={(e) => handleFieldChange("currency", e.target.value)}
                placeholder="USD"
                maxLength={3}
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="amount">Amount</Label>
              <Input
                id="amount"
                value={value.amount}
                onChange={(e) => handleFieldChange("amount", e.target.value)}
                placeholder="1000000.00"
              />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Account Information</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-2">
              <Label htmlFor="orderingCustomer">Ordering Customer (50K)</Label>
              <Textarea
                id="orderingCustomer"
                value={value.orderingCustomer}
                onChange={(e) =>
                  handleFieldChange("orderingCustomer", e.target.value)
                }
                placeholder="Account number and customer name"
                rows={3}
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="beneficiaryCustomer">
                Beneficiary Customer (59)
              </Label>
              <Textarea
                id="beneficiaryCustomer"
                value={value.beneficiaryCustomer}
                onChange={(e) =>
                  handleFieldChange("beneficiaryCustomer", e.target.value)
                }
                placeholder="Account number and beneficiary name"
                rows={3}
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="remittanceInfo">
                Remittance Information (70)
              </Label>
              <Textarea
                id="remittanceInfo"
                value={value.remittanceInfo}
                onChange={(e) =>
                  handleFieldChange("remittanceInfo", e.target.value)
                }
                placeholder="Payment details"
                rows={3}
              />
            </div>
          </CardContent>
        </Card>
      </TabsContent>

      <TabsContent value="preview">
        <RawPreview content={rawPreview} />
      </TabsContent>
    </Tabs>
  );
}
