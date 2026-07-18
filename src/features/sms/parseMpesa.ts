export interface ParsedMpesa {
  amount: number;
  sender: string;
  code: string;
  timestamp: Date;
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
  // Example: "You have received KSh 1,500 from John Doe QW12RT34 on 05/06/26 at 14:30"
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
    };
  }

  // Pattern B: "Confirmed. KSh X received from NAME PHONECODE"
  // Example: "Confirmed. KSh 2,000 received from Jane Smith XY98ZT12"
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
    };
  }

  // Pattern C: "Umepokea KSh X kutoka kwa NAME"
  // Example: "Umepokea KSh 500 kutoka kwa Ali Hassan"
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
    };
  }

  // Simpler fallback patterns
  // "received KSh X from NAME"
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
