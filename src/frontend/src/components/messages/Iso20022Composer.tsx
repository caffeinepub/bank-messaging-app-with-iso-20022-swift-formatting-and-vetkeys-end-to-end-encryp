import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import RawPreview from './RawPreview';
import { generateIso20022Raw, type Iso20022Message } from '@/lib/messageFormats/iso20022';

interface Iso20022ComposerProps {
  value: Iso20022Message;
  onChange: (value: Iso20022Message) => void;
}

export default function Iso20022Composer({ value, onChange }: Iso20022ComposerProps) {
  const [rawPreview, setRawPreview] = useState('');

  useEffect(() => {
    setRawPreview(generateIso20022Raw(value));
  }, [value]);

  const handleFieldChange = (field: keyof Iso20022Message, fieldValue: string) => {
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
            <CardTitle className="text-base">Message Identification</CardTitle>
            <CardDescription>Core message identifiers</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-2">
              <Label htmlFor="messageId">Message ID</Label>
              <Input
                id="messageId"
                value={value.messageId}
                onChange={(e) => handleFieldChange('messageId', e.target.value)}
                placeholder="MSG-20260210-001"
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="creationDateTime">Creation Date/Time</Label>
              <Input
                id="creationDateTime"
                type="datetime-local"
                value={value.creationDateTime}
                onChange={(e) => handleFieldChange('creationDateTime', e.target.value)}
              />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Payment Information</CardTitle>
            <CardDescription>Transaction details</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-2">
              <Label htmlFor="instructionId">Instruction ID</Label>
              <Input
                id="instructionId"
                value={value.instructionId}
                onChange={(e) => handleFieldChange('instructionId', e.target.value)}
                placeholder="INSTR-001"
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="endToEndId">End-to-End ID</Label>
              <Input
                id="endToEndId"
                value={value.endToEndId}
                onChange={(e) => handleFieldChange('endToEndId', e.target.value)}
                placeholder="E2E-001"
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="amount">Amount</Label>
              <Input
                id="amount"
                value={value.amount}
                onChange={(e) => handleFieldChange('amount', e.target.value)}
                placeholder="1000.00"
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="currency">Currency</Label>
              <Input
                id="currency"
                value={value.currency}
                onChange={(e) => handleFieldChange('currency', e.target.value)}
                placeholder="USD"
                maxLength={3}
              />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Parties</CardTitle>
            <CardDescription>Debtor and creditor information</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-2">
              <Label htmlFor="debtorName">Debtor Name</Label>
              <Input
                id="debtorName"
                value={value.debtorName}
                onChange={(e) => handleFieldChange('debtorName', e.target.value)}
                placeholder="John Doe"
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="debtorAccount">Debtor Account (IBAN)</Label>
              <Input
                id="debtorAccount"
                value={value.debtorAccount}
                onChange={(e) => handleFieldChange('debtorAccount', e.target.value)}
                placeholder="GB29NWBK60161331926819"
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="creditorName">Creditor Name</Label>
              <Input
                id="creditorName"
                value={value.creditorName}
                onChange={(e) => handleFieldChange('creditorName', e.target.value)}
                placeholder="Jane Smith"
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="creditorAccount">Creditor Account (IBAN)</Label>
              <Input
                id="creditorAccount"
                value={value.creditorAccount}
                onChange={(e) => handleFieldChange('creditorAccount', e.target.value)}
                placeholder="DE89370400440532013000"
              />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Additional Information</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-2">
              <Label htmlFor="remittanceInfo">Remittance Information</Label>
              <Textarea
                id="remittanceInfo"
                value={value.remittanceInfo}
                onChange={(e) => handleFieldChange('remittanceInfo', e.target.value)}
                placeholder="Invoice payment reference"
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
