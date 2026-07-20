// Web Bluetooth API type augmentation
interface BluetoothRemoteGATTCharacteristic {
  properties: { write: boolean };
  writeValue(data: Uint8Array): Promise<void>;
}

export interface ReceiptData {
  businessName: string;
  receiptId: string;
  amount: number;
  type: 'income' | 'expense' | 'withdrawal';
  description?: string;
  items?: Array<{ name: string; qty: number; price: number }>;
  paymentMethod?: string;
  date: string;
  customerName?: string;
  loyaltyEarned?: number;
  loyaltyRedeemed?: number;
  discount?: number;
}

function escp(text: string): Uint8Array {
  const encoder = new TextEncoder();
  return encoder.encode(text);
}

function escpLine(text: string, opts?: { bold?: boolean; double?: boolean; center?: boolean }): Uint8Array {
  const parts: Uint8Array[] = [];
  if (opts?.center) parts.push(new Uint8Array([0x1B, 0x61, 0x01]));
  else parts.push(new Uint8Array([0x1B, 0x61, 0x00]));
  if (opts?.bold) parts.push(new Uint8Array([0x1B, 0x45, 0x01]));
  if (opts?.double) parts.push(new Uint8Array([0x1D, 0x21, 0x11]));
  parts.push(escp(text + '\n'));
  if (opts?.bold) parts.push(new Uint8Array([0x1B, 0x45, 0x00]));
  if (opts?.double) parts.push(new Uint8Array([0x1D, 0x21, 0x00]));
  return concat(parts);
}

function concat(arrays: Uint8Array[]): Uint8Array {
  const total = arrays.reduce((s, a) => s + a.length, 0);
  const result = new Uint8Array(total);
  let offset = 0;
  for (const a of arrays) { result.set(a, offset); offset += a.length; }
  return result;
}

function escpReceipt(data: ReceiptData): Uint8Array {
  const lines: Uint8Array[] = [];
  lines.push(new Uint8Array([0x1B, 0x40]));
  lines.push(escpLine(''));
  lines.push(escpLine(data.businessName, { center: true, bold: true, double: true }));
  lines.push(escpLine(''));
  lines.push(escpLine('Receipt: ' + data.receiptId, { center: true }));
  lines.push(escpLine(new Date(data.date).toLocaleString('en-KE'), { center: true }));
  if (data.customerName) lines.push(escpLine('Customer: ' + data.customerName, { center: true }));
  lines.push(escpLine(''));
  lines.push(escpLine('─'.repeat(32)));
  lines.push(escpLine(''));
  if (data.items) {
    for (const item of data.items) {
      lines.push(escpLine(`${item.name} x${item.qty}  KES ${item.price.toLocaleString('en-KE')}`));
    }
    lines.push(escpLine(''));
  }
  if (data.description) lines.push(escpLine(data.description));
  lines.push(escpLine(''));
  lines.push(escpLine('─'.repeat(32)));
  if (data.discount) {
    const subtotal = data.amount + data.discount;
    lines.push(escpLine(`Subtotal:    KES ${subtotal.toLocaleString('en-KE')}`));
    lines.push(escpLine(`Discount:   -KES ${data.discount.toLocaleString('en-KE')}`));
  }
  lines.push(escpLine(`TOTAL:       KES ${data.amount.toLocaleString('en-KE')}`, { bold: true, double: true }));
  if (data.paymentMethod) lines.push(escpLine(`Payment: ${data.paymentMethod}`, { center: true }));
  if (data.loyaltyEarned) lines.push(escpLine(`Points earned: ${data.loyaltyEarned}`, { center: true }));
  if (data.loyaltyRedeemed) lines.push(escpLine(`Points redeemed: ${data.loyaltyRedeemed}`, { center: true }));
  lines.push(escpLine(''));
  lines.push(escpLine('Thank you for your business!', { center: true }));
  lines.push(escpLine(''));
  lines.push(escpLine(''));
  lines.push(new Uint8Array([0x1D, 0x56, 0x00]));
  return concat(lines);
}

export async function printBrowserReceipt(data: ReceiptData): Promise<void> {
  const printWindow = window.open('', '_blank');
  if (!printWindow) return;
  printWindow.document.write(`
    <html><head><title>Receipt ${data.receiptId}</title>
    <style>
      body { font-family: 'Courier New', monospace; width: 80mm; margin: 0 auto; padding: 10px; color: #000; }
      h1 { text-align: center; font-size: 18px; margin: 0 0 4px; }
      .center { text-align: center; }
      .line { border-top: 1px dashed #000; margin: 8px 0; }
      .total { font-size: 16px; font-weight: bold; text-align: right; }
      table { width: 100%; border-collapse: collapse; }
      td { padding: 2px 0; }
      td:last-child { text-align: right; }
      @media print { @page { margin: 0; size: 80mm auto; } body { margin: 5px; } }
    </style></head><body>
    <h1>${data.businessName}</h1>
    <p class="center">Receipt: ${data.receiptId}</p>
    <p class="center">${new Date(data.date).toLocaleString('en-KE')}</p>
    ${data.customerName ? `<p class="center">Customer: ${data.customerName}</p>` : ''}
    <div class="line"></div>
    ${data.items ? `<table>${data.items.map(i => `<tr><td>${i.name} x${i.qty}</td><td>KES ${i.price.toLocaleString('en-KE')}</td></tr>`).join('')}</table><div class="line"></div>` : ''}
    ${data.description ? `<p>${data.description}</p>` : ''}
    <div class="line"></div>
    ${data.discount ? `<p>Subtotal: KES ${(data.amount + data.discount).toLocaleString('en-KE')}</p><p>Discount: -KES ${data.discount.toLocaleString('en-KE')}</p>` : ''}
    <p class="total">TOTAL: KES ${data.amount.toLocaleString('en-KE')}</p>
    ${data.paymentMethod ? `<p class="center">Payment: ${data.paymentMethod}</p>` : ''}
    ${data.loyaltyEarned ? `<p class="center">Points earned: ${data.loyaltyEarned}</p>` : ''}
    ${data.loyaltyRedeemed ? `<p class="center">Points redeemed: ${data.loyaltyRedeemed}</p>` : ''}
    <p class="center">Thank you for your business!</p>
    </body></html>
  `);
  printWindow.document.close();
  await new Promise(r => setTimeout(r, 500));
  printWindow.print();
}

export async function printBluetoothReceipt(data: ReceiptData): Promise<void> {
  try {
    const device = await (navigator as unknown as { bluetooth: { requestDevice(options: { acceptAllDevices?: boolean; optionalServices?: string[] }): Promise<{ gatt?: { connect(): Promise<{ getPrimaryService(service: string): Promise<{ getCharacteristics(): Promise<BluetoothRemoteGATTCharacteristic[]> }> }> } }> } }).bluetooth.requestDevice({
      acceptAllDevices: true,
      optionalServices: ['000018f0-0000-1000-8000-00805f9b34fb'],
    });
    const server = await device.gatt?.connect();
    if (!server) throw new Error('Failed to connect');
    const service = await server.getPrimaryService('000018f0-0000-1000-8000-00805f9b34fb');
    const characteristics = await service.getCharacteristics();
    const writeChar = characteristics.find((c: BluetoothRemoteGATTCharacteristic) => c.properties.write);
    if (!writeChar) throw new Error('No writable characteristic');
    const dataBytes = escpReceipt(data);
    await writeChar.writeValue(dataBytes);
  } catch (cause) {
    throw new Error(cause instanceof Error ? cause.message : 'Bluetooth print failed');
  }
}

export function formatReceiptText(data: ReceiptData): string {
  const lines = [
    data.businessName,
    '─'.repeat(24),
    `Receipt: ${data.receiptId}`,
    new Date(data.date).toLocaleString('en-KE'),
    data.customerName ? `Customer: ${data.customerName}` : '',
    '─'.repeat(24),
  ];
  if (data.items) {
    for (const item of data.items) {
      lines.push(`${item.name} x${item.qty}  KES ${item.price.toLocaleString('en-KE')}`);
    }
    lines.push('─'.repeat(24));
  }
  if (data.description) lines.push(data.description);
  if (data.discount) {
    lines.push(`Subtotal: KES ${(data.amount + data.discount).toLocaleString('en-KE')}`);
    lines.push(`Discount: -KES ${data.discount.toLocaleString('en-KE')}`);
  }
  lines.push(`TOTAL: KES ${data.amount.toLocaleString('en-KE')}`);
  if (data.loyaltyEarned) lines.push(`Points earned: ${data.loyaltyEarned}`);
  if (data.loyaltyRedeemed) lines.push(`Points redeemed: ${data.loyaltyRedeemed}`);
  lines.push('Thank you!');
  return lines.filter(Boolean).join('\n');
}
