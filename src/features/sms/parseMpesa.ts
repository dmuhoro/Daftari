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

function extractSenderPhone(text: string): { sender: string; phone: string } | null {
  const m = text.match(/from\s+([A-Za-z\s]+?)\s+(\d{6,12})/i);
  if (m) {
    return { sender: m[1].trim(), phone: m[2] };
  }
  const m2 = text.match(/from\s+([A-Za-z\s]+?)(?:\s+via|\s*\.|\s*$)/i);
  if (m2) {
    return { sender: m2[1].trim(), phone: '' };
  }
  return null;
}

function extractDate(text: string): Date | null {
  const m = text.match(/on\s+(\d{1,2}\/\d{1,2}\/\d{2,4})\s+at\s+(\d{1,2}:\d{2})/i);
  if (m) return parseDateDMYHM(m[1], m[2]);
  return null;
}

function extractCode(text: string): string {
  const m = text.match(/Trans(?:action)?(?:\s+ID)?[:\s]+([A-Z0-9]+)/i);
  if (m) return m[1];
  const m2 = text.match(/Ref(?:erence)?[:\s]+([A-Z0-9]+)/i);
  if (m2) return m2[1];
  const m3 = text.match(/Code[:\s]+([A-Z0-9]+)/i);
  if (m3) return m3[1];
  return '';
}

export function parseMpesaSMS(text: string): ParsedMpesa | null {
  const cleanText = text.trim().replace(/\s+/g, ' ');

  // --- Specific patterns checked before generic ones ---

  // Pattern D: Pochi La Biashara
  // "You have received KSh X from NAME PHONE to Pochi la Biashara on DD/MM/YY at HH:MM"
  const patternD = /to Pochi la Biashara/i;
  if (patternD.test(cleanText)) {
    const amount = parseAmount(cleanText);
    if (amount === null) return null;
    const sp = extractSenderPhone(cleanText);
    return {
      amount,
      sender: sp?.sender ?? '',
      code: extractCode(cleanText),
      timestamp: extractDate(cleanText) ?? new Date(),
      payment_method: 'pochi_la_biashara',
    };
  }

  // Pattern G: Airtel Money (check before other "received" patterns)
  // "You have received Ksh X from NAME PHONE via Airtel Money. Ref: CODE"
  if (/via Airtel Money/i.test(cleanText)) {
    const amount = parseAmount(cleanText);
    if (amount === null) return null;
    const sp = extractSenderPhone(cleanText);
    return {
      amount,
      sender: sp?.sender ?? '',
      code: extractCode(cleanText),
      timestamp: new Date(),
      payment_method: 'airtel_money',
    };
  }

  // Pattern F: Paybill (check before Till, because "has received" may also appear)
  // "BUSINESS has received KSh X from NAME PHONE. Account ACC. Trans CODE"
  // "BUSINESS received KSh X from NAME PHONE. Account ACC. Trans CODE"
  if (/Account/i.test(cleanText) && /received/i.test(cleanText)) {
    const amount = parseAmount(cleanText);
    if (amount === null) return null;
    const sp = extractSenderPhone(cleanText);
    return {
      amount,
      sender: sp?.sender ?? '',
      code: extractCode(cleanText),
      timestamp: new Date(),
      payment_method: 'paybill',
    };
  }

  // Pattern E: Till Number (Buy Goods)
  // "BUSINESS has received KSh X from NAME PHONE. Trans ID CODE"
  if (/has received/i.test(cleanText)) {
    const amount = parseAmount(cleanText);
    if (amount === null) return null;
    const sp = extractSenderPhone(cleanText);
    return {
      amount,
      sender: sp?.sender ?? '',
      code: extractCode(cleanText),
      timestamp: new Date(),
      payment_method: 'till_number',
    };
  }

  // --- Generic patterns ---

  // Pattern A: "You have received KSh X from NAME PHONE on DD/MM/YY at HH:MM"
  const patternA = /You have received KSh?\s*([\d,]+(?:\.\d{2})?)\s+from\s+([A-Za-z\s]+?)\s+(\d{6,12})\s+on\s+(\d{1,2}\/\d{1,2}\/\d{2,4})\s+at\s+(\d{1,2}:\d{2})/i;
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

  // Pattern B: "Confirmed. KSh X received from NAME PHONE"
  const patternB = /Confirmed\.?\s+KSh?\s*([\d,]+(?:\.\d{2})?)\s+received\s+from\s+([A-Za-z\s]+?)\s+(\d{6,12})/i;
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
      code: extractCode(cleanText),
      timestamp: new Date(),
      payment_method: 'mpesa_send_money',
    };
  }

  // Generic fallback: "received KSh X from NAME"
  if (/received\s+KSh/i.test(cleanText)) {
    const amount = parseAmount(cleanText);
    if (amount === null) return null;
    const sp = extractSenderPhone(cleanText);
    return {
      amount,
      sender: sp?.sender ?? '',
      code: extractCode(cleanText),
      timestamp: new Date(),
    };
  }

  return null;
}
