const WHATSAPP_BASE = 'https://wa.me/'

export function shareViaWhatsApp(text: string, phoneNumber?: string): void {
  const encoded = encodeURIComponent(text)
  const url = phoneNumber
    ? `${WHATSAPP_BASE}${phoneNumber}?text=${encoded}`
    : `https://api.whatsapp.com/send?text=${encoded}`
  window.open(url, '_blank')
}

export function formatReceiptText(
  businessName: string,
  receiptId: string,
  amount: number,
  type: string,
  description?: string
): string {
  const lines = [
    `🧾 *${businessName}*`,
    `---`,
    `${type === 'income' ? '✓' : '✗'} *${type === 'income' ? 'Sale' : type === 'expense' ? 'Expense' : 'Withdrawal'}*`,
    `KES ${amount.toLocaleString('en-KE')}`,
    `Receipt: ${receiptId}`,
  ]
  if (description) lines.push(`Note: ${description}`)
  lines.push(``, `Powered by Daftari`)
  return lines.join('\n')
}

export function formatDailySummaryText(
  businessName: string,
  date: string,
  revenue: number,
  expenses: number,
  profit: number,
  txCount: number
): string {
  const lines = [
    `📊 *${businessName}* — ${date}`,
    `---`,
    `Revenue: KES ${revenue.toLocaleString('en-KE')}`,
    `Expenses: KES ${expenses.toLocaleString('en-KE')}`,
    `Profit: KES ${profit.toLocaleString('en-KE')}`,
    `Transactions: ${txCount}`,
    ``,
    `Powered by Daftari`,
  ]
  return lines.join('\n')
}
