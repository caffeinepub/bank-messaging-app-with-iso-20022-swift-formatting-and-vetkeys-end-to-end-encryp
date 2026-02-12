export interface SwiftMessage {
  messageType: string;
  senderBIC: string;
  receiverBIC: string;
  transactionRef: string;
  valueDate: string;
  currency: string;
  amount: string;
  orderingCustomer: string;
  beneficiaryCustomer: string;
  remittanceInfo: string;
}

export function createEmptySwiftMessage(): SwiftMessage {
  const now = new Date();
  const dateStr = now.toISOString().slice(0, 10);
  
  return {
    messageType: '103',
    senderBIC: '',
    receiverBIC: '',
    transactionRef: `TRN${now.toISOString().slice(0, 10).replace(/-/g, '')}001`,
    valueDate: dateStr,
    currency: 'USD',
    amount: '',
    orderingCustomer: '',
    beneficiaryCustomer: '',
    remittanceInfo: '',
  };
}

export function generateSwiftRaw(message: SwiftMessage): string {
  const formatDate = (dateStr: string) => {
    return dateStr.replace(/-/g, '').slice(2); // YYMMDD format
  };

  return `{1:F01${message.senderBIC}0000000000}
{2:O${message.messageType}${formatDate(message.valueDate)}${message.receiverBIC}0000000000}
{4:
:20:${message.transactionRef}
:32A:${formatDate(message.valueDate)}${message.currency}${message.amount}
:50K:${message.orderingCustomer}
:59:${message.beneficiaryCustomer}
:70:${message.remittanceInfo}
-}`;
}

export function parseSwiftRaw(raw: string): SwiftMessage | null {
  try {
    const lines = raw.split('\n');
    const fields: Record<string, string> = {};
    
    lines.forEach(line => {
      const match = line.match(/^:(\d+[A-Z]?):(.*)/);
      if (match) {
        fields[match[1]] = match[2];
      }
    });

    const block1Match = raw.match(/\{1:F01([A-Z0-9]+)/);
    const block2Match = raw.match(/\{2:O(\d+)\d+([A-Z0-9]+)/);

    return {
      messageType: block2Match?.[1] || '',
      senderBIC: block1Match?.[1] || '',
      receiverBIC: block2Match?.[2] || '',
      transactionRef: fields['20'] || '',
      valueDate: fields['32A']?.slice(0, 6) || '',
      currency: fields['32A']?.slice(6, 9) || '',
      amount: fields['32A']?.slice(9) || '',
      orderingCustomer: fields['50K'] || '',
      beneficiaryCustomer: fields['59'] || '',
      remittanceInfo: fields['70'] || '',
    };
  } catch (error) {
    console.error('Failed to parse SWIFT message:', error);
    return null;
  }
}
