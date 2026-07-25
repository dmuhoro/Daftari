import { todayNairobi } from './dates'

let dailySequence = 0
let currentDate = ''

export function generateReceiptId(): string {
  const today = todayNairobi()
  if (today !== currentDate) {
    currentDate = today
    dailySequence = 0
  }
  dailySequence += 1
  const short = today.replace(/-/g, '').slice(2)
  return `REC-${short}-${String(dailySequence).padStart(4, '0')}`
}
