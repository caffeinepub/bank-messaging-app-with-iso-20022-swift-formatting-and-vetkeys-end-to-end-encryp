export interface Iso20022Message {
  messageId: string;
  creationDateTime: string;
  instructionId: string;
  endToEndId: string;
  amount: string;
  currency: string;
  debtorName: string;
  debtorAccount: string;
  creditorName: string;
  creditorAccount: string;
  remittanceInfo: string;
}

export function createEmptyIso20022Message(): Iso20022Message {
  const now = new Date();
  const dateTimeStr = now.toISOString().slice(0, 16);
  
  return {
    messageId: `MSG-${now.toISOString().slice(0, 10).replace(/-/g, '')}-001`,
    creationDateTime: dateTimeStr,
    instructionId: '',
    endToEndId: '',
    amount: '',
    currency: 'USD',
    debtorName: '',
    debtorAccount: '',
    creditorName: '',
    creditorAccount: '',
    remittanceInfo: '',
  };
}

export function generateIso20022Raw(message: Iso20022Message): string {
  return `<?xml version="1.0" encoding="UTF-8"?>
<Document xmlns="urn:iso:std:iso:20022:tech:xsd:pain.001.001.03">
  <CstmrCdtTrfInitn>
    <GrpHdr>
      <MsgId>${message.messageId}</MsgId>
      <CreDtTm>${message.creationDateTime}</CreDtTm>
      <NbOfTxs>1</NbOfTxs>
      <CtrlSum>${message.amount}</CtrlSum>
    </GrpHdr>
    <PmtInf>
      <PmtInfId>${message.instructionId}</PmtInfId>
      <PmtMtd>TRF</PmtMtd>
      <ReqdExctnDt>${message.creationDateTime.split('T')[0]}</ReqdExctnDt>
      <Dbtr>
        <Nm>${message.debtorName}</Nm>
      </Dbtr>
      <DbtrAcct>
        <Id>
          <IBAN>${message.debtorAccount}</IBAN>
        </Id>
      </DbtrAcct>
      <CdtTrfTxInf>
        <PmtId>
          <InstrId>${message.instructionId}</InstrId>
          <EndToEndId>${message.endToEndId}</EndToEndId>
        </PmtId>
        <Amt>
          <InstdAmt Ccy="${message.currency}">${message.amount}</InstdAmt>
        </Amt>
        <Cdtr>
          <Nm>${message.creditorName}</Nm>
        </Cdtr>
        <CdtrAcct>
          <Id>
            <IBAN>${message.creditorAccount}</IBAN>
          </Id>
        </CdtrAcct>
        <RmtInf>
          <Ustrd>${message.remittanceInfo}</Ustrd>
        </RmtInf>
      </CdtTrfTxInf>
    </PmtInf>
  </CstmrCdtTrfInitn>
</Document>`;
}

export function parseIso20022Raw(raw: string): Iso20022Message | null {
  try {
    const parser = new DOMParser();
    const doc = parser.parseFromString(raw, 'text/xml');
    
    const getValue = (tagName: string): string => {
      const element = doc.getElementsByTagName(tagName)[0];
      return element?.textContent || '';
    };

    return {
      messageId: getValue('MsgId'),
      creationDateTime: getValue('CreDtTm'),
      instructionId: getValue('InstrId'),
      endToEndId: getValue('EndToEndId'),
      amount: getValue('InstdAmt'),
      currency: doc.getElementsByTagName('InstdAmt')[0]?.getAttribute('Ccy') || 'USD',
      debtorName: doc.getElementsByTagName('Dbtr')[0]?.getElementsByTagName('Nm')[0]?.textContent || '',
      debtorAccount: getValue('IBAN'),
      creditorName: doc.getElementsByTagName('Cdtr')[0]?.getElementsByTagName('Nm')[0]?.textContent || '',
      creditorAccount: doc.getElementsByTagName('CdtrAcct')[0]?.getElementsByTagName('IBAN')[0]?.textContent || '',
      remittanceInfo: getValue('Ustrd'),
    };
  } catch (error) {
    console.error('Failed to parse ISO 20022 message:', error);
    return null;
  }
}
