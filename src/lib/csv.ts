import type { Transaction } from './db'

export function transactionsToCSV(transactions: Transaction[]): string {
  const headers = [
    'Receipt ID',
    'Type',
    'Category',
    'Amount (KES)',
    'Description',
    'Date',
    'Time',
    'Payment Method',
    'M-Pesa Code',
    'M-Pesa Sender',
    'Recorded At',
  ]

  const rows = transactions.map((tx) => [
    tx.receipt_id ?? '',
    tx.type,
    tx.category,
    tx.amount.toString(),
    tx.description ?? '',
    tx.recorded_at.slice(0, 10),
    tx.recorded_at.slice(11, 16),
    tx.payment_method ?? '',
    tx.mpesa_code ?? '',
    tx.mpesa_sender ?? '',
    tx.recorded_at,
  ])

  const escape = (val: string) => {
    if (val.includes(',') || val.includes('"') || val.includes('\n')) {
      return `"${val.replace(/"/g, '""')}"`
    }
    return val
  }

  return [
    headers.map(escape).join(','),
    ...rows.map((row) => row.map(escape).join(',')),
  ].join('\n')
}

export function downloadCSV(csv: string, filename: string) {
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = filename
  link.click()
  URL.revokeObjectURL(url)
}

export function shareCSV(csv: string, filename: string) {
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
  const file = new File([blob], filename, { type: 'text/csv' })
  if (navigator.canShare && navigator.canShare({ files: [file] })) {
    navigator.share({ files: [file] }).catch(() => {})
  } else {
    downloadCSV(csv, filename)
  }
}
