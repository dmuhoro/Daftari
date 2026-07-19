let dailySequence = 0
let currentDate = ''

function getTodayNairobi(): string {
  const now = new Date()
  const nairobi = new Date(now.toLocaleString('en-US', { timeZone: 'Africa/Nairobi' }))
  return nairobi.toISOString().slice(0, 10)
}

export function generateReceiptId(): string {
  const today = getTodayNairobi()
  if (today !== currentDate) {
    currentDate = today
    dailySequence = 0
  }
  dailySequence += 1
  const short = today.replace(/-/g, '').slice(2)
  return `REC-${short}-${String(dailySequence).padStart(4, '0')}`
}
