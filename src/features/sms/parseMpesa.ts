export interface ParsedMpesa {
  amount: number;
  sender: string;
  code: string;
  timestamp: Date;
  payment_method?: string;
}

const AMOUNT_REGEX = /KSh?\s*([\d,]+(?:\.\d{2})?)/i;

function parseAmount(text: string): number | null {
  const match = text.match(AMOUNT_REGEX);
  if (!match) return null;
  const numStr = match[1].replace(/,/g, '');
  const num = parseFloat(numStr);
  return isNaN(num) ? null : num;
}

function parseDateDMYHM(dateStr: string, timeStr: string): Date | null {
  const dateMatch = dateStr.match(/(\d{1,2})\/(\d{1,2})\/(\d{2,4})/);
  const timeMatch = timeStr.match(/(\d{1,2}):(\d{2})/i);

  if (!dateMatch || !timeMatch) return null;

  const day = parseInt(dateMatch[1], 10);
  const month = parseInt(dateMatch[2], 10) - 1;
  let year = parseInt(dateMatch[3], 10);
  if (year < 100) year += 2000;

  const hour = parseInt(timeMatch[1], 10);
  const minute = parseInt(timeMatch[2], 10);

  return new Date(year, month, day, hour, minute);
}

export function parseMpesaSMS(text: string): ParsedMpesa | null {
  const cleanText = text.trim().replace(/\s+/g, ' ');

  // Pattern A: "You have received KSh X from NAME PHONECODE on DD/MM/YY at HH:MM"
  const patternA = /You have received KSh?\s*([\d,]+(?:\.\d{2})?)\s+from\s+([A-Za-z\s]+?)\s+([A-Z0-9]{6,10})\s+on\s+(\d{1,2}\/\d{1,2}\/\d{2,4})\s+at\s+(\d{1,2}:\d{2})/i;
  let match = cleanText.match(patternA);
  if (match) {
    const amount = parseAmount(`KSh ${match[1]}`);
    if (amount === null) return null;
    const timestamp = parseDateDMYHM(match[4], match[5]);
    if (!timestamp) return null;
    return {
      amount,
      sender: match[2].trim(),
      code: match[3],
      timestamp,
      payment_method: 'mpesa_send_money',
    };
  }

  // Pattern B: "Confirmed. KSh X received from NAME PHONECODE"
  const patternB = /Confirmed\.?\s+KSh?\s*([\d,]+(?:\.\d{2})?)\s+received\s+from\s+([A-Za-z\s]+?)\s+([A-Z0-9]{6,10})/i;
  match = cleanText.match(patternB);
  if (match) {
    const amount = parseAmount(`KSh ${match[1]}`);
    if (amount === null) return null;
    return {
      amount,
      sender: match[2].trim(),
      code: match[3],
      timestamp: new Date(),
      payment_method: 'mpesa_send_money',
    };
  }

  // Pattern C: "Umepokea KSh X kutoka kwa NAME"
  const patternC = /Umepokea\s+KSh?\s*([\d,]+(?:\.\d{2})?)\s+kutoka\s+kwa\s+([A-Za-z\s]+)/i;
  match = cleanText.match(patternC);
  if (match) {
    const amount = parseAmount(`KSh ${match[1]}`);
    if (amount === null) return null;
    return {
      amount,
      sender: match[2].trim(),
      code: '',
      timestamp: new Date(),
      payment_method: 'mpesa_send_money',
    };
  }

  // Pattern D: Pochi La Biashara
  // "You have received KSh X from NAME PHONE to Pochi la Biashara on DD/MM/YY"
  const patternD = /You have received KSh?\s*([\d,]+(?:\.\d{2})?)\s+from\s+([A-Za-z\s]+?)\s+([A-Z0-9]{6,10})\s+to\s+Pochi la Biashara/i;
  match = cleanText.match(patternD);
  if (match) {
    const amount = parseAmount(`KSh ${match[1]}`);
    if (amount === null) return null;
    return {
      amount,
      sender: match[2].trim(),
      code: '',
      timestamp: new Date(),
      payment_method: 'pochi_la_biashara',
    };
  }

  // Pattern E: Till Number (Buy Goods)
  // "BUSINESS_NAME has received KSh X from NAME PHONE. Trans ID CODE"
  const patternE = /has received KSh?\s*([\d,]+(?:\.\d{2})?)\s+from\s+([A-Za-z\s]+?)\s+([A-Z0-9]{6,10})/i;
  match = cleanText.match(patternE);
  if (match) {
    const amount = parseAmount(`KSh ${match[1]}`);
    if (amount === null) return null;
    return {
      amount,
      sender: match[2].trim(),
      code: '',
      timestamp: new Date(),
      payment_method: 'till_number',
    };
  }

  // Pattern F: Paybill
  // "BUSINESS_NAME received KSh X from NAME PHONE. Account ACC. Trans CODE"
  const patternF = /received KSh?\s*([\d,]+(?:\.\d{2})?)\s+from\s+([A-Za-z\s]+?)\s+([A-Z0-9]{6,10})\.?\s+Account/i;
  match = cleanText.match(patternF);
  if (match) {
    const amount = parseAmount(`KSh ${match[1]}`);
    if (amount === null) return null;
    return {
      amount,
      sender: match[2].trim(),
      code: '',
      timestamp: new Date(),
      payment_method: 'paybill',
    };
  }

  // Pattern G: Airtel Money
  // "You have received Ksh X from NAME PHONE via Airtel Money. Ref: CODE"
  const patternG = /via Airtel Money/i;
  const matchG = cleanText.match(patternG);
  if (matchG) {
    const baseMatch = cleanText.match(/received\s+Ksh?\s*([\d,]+(?:\.\d{2})?)\s+from\s+([A-Za-z\s]+?)\s+([A-Z0-9]{6,10})/i);
    if (baseMatch) {
      const amount = parseAmount(`KSh ${baseMatch[1]}`);
      if (amount === null) return null;
      return {
        amount,
        sender: baseMatch[2].trim(),
        code: '',
        timestamp: new Date(),
        payment_method: 'airtel_money',
      };
    }
  }

  // Simpler fallback pattern
  const fallback = /received\s+KSh?\s*([\d,]+(?:\.\d{2})?)\s+from\s+([A-Za-z\s]+)/i;
  match = cleanText.match(fallback);
  if (match) {
    const amount = parseAmount(`KSh ${match[1]}`);
    if (amount === null) return null;
    return {
      amount,
      sender: match[2].trim(),
      code: '',
      timestamp: new Date(),
    };
  }

  return null;
}
