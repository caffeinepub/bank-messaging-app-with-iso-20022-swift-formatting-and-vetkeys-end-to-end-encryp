import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Send, AlertCircle } from 'lucide-react';
import { toast } from 'sonner';

interface TokenSendPanelProps {
  tokenSymbol: string;
  isConfigured: boolean;
  decimals: number;
}

export function TokenSendPanel({ tokenSymbol, isConfigured, decimals }: TokenSendPanelProps) {
  const [destination, setDestination] = useState('');
  const [amount, setAmount] = useState('');
  const [isSending, setIsSending] = useState(false);
  const [errors, setErrors] = useState<{ destination?: string; amount?: string }>({});

  const validateInputs = (): boolean => {
    const newErrors: { destination?: string; amount?: string } = {};

    if (!destination.trim()) {
      newErrors.destination = 'Destination address is required';
    }

    if (!amount.trim()) {
      newErrors.amount = 'Amount is required';
    } else {
      const numAmount = parseFloat(amount);
      if (isNaN(numAmount) || numAmount <= 0) {
        newErrors.amount = 'Amount must be a positive number';
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSend = async () => {
    if (!validateInputs()) {
      toast.error('Please fix validation errors');
      return;
    }

    setIsSending(true);
    try {
      // Placeholder for actual send logic
      await new Promise((resolve) => setTimeout(resolve, 1500));
      toast.success(`${amount} ${tokenSymbol} sent successfully`);
      setDestination('');
      setAmount('');
      setErrors({});
    } catch (error) {
      toast.error('Failed to send tokens');
    } finally {
      setIsSending(false);
    }
  };

  if (!isConfigured) {
    return (
      <div className="flex items-center gap-3 p-4 bg-muted/50 rounded-lg border border-border">
        <AlertCircle className="h-5 w-5 text-muted-foreground shrink-0" />
        <div className="flex-1">
          <p className="text-sm font-medium">Not configured</p>
          <p className="text-xs text-muted-foreground mt-0.5">
            {tokenSymbol} sending is not configured. Ledger canister ID is required.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor={`destination-${tokenSymbol}`}>Destination Address</Label>
        <Input
          id={`destination-${tokenSymbol}`}
          placeholder="Enter recipient's principal or address"
          value={destination}
          onChange={(e) => {
            setDestination(e.target.value);
            if (errors.destination) {
              setErrors({ ...errors, destination: undefined });
            }
          }}
          disabled={isSending}
          className={errors.destination ? 'border-destructive' : ''}
        />
        {errors.destination && (
          <p className="text-xs text-destructive">{errors.destination}</p>
        )}
      </div>

      <div className="space-y-2">
        <Label htmlFor={`amount-${tokenSymbol}`}>Amount</Label>
        <Input
          id={`amount-${tokenSymbol}`}
          type="text"
          placeholder={`0.00 ${tokenSymbol}`}
          value={amount}
          onChange={(e) => {
            setAmount(e.target.value);
            if (errors.amount) {
              setErrors({ ...errors, amount: undefined });
            }
          }}
          disabled={isSending}
          className={errors.amount ? 'border-destructive' : ''}
        />
        {errors.amount && (
          <p className="text-xs text-destructive">{errors.amount}</p>
        )}
        <p className="text-xs text-muted-foreground">
          Decimals: {decimals}
        </p>
      </div>

      <Button
        onClick={handleSend}
        disabled={isSending}
        className="w-full gap-2"
      >
        <Send className={`h-4 w-4 ${isSending ? 'animate-pulse' : ''}`} />
        {isSending ? 'Sending...' : `Send ${tokenSymbol}`}
      </Button>
    </div>
  );
}
