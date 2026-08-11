/**
 * @module monitoring
 * @description Production monitoring — Web Vitals + performance metrics.
 * Sends to Sentry (already wired) and optionally to an OTLP endpoint (Dash0, etc.).
 */

import { captureError } from './sentry'
import { APP } from './constants'

const OTLP_ENDPOINT = import.meta.env.VITE_OTLP_ENDPOINT as string | undefined

interface MetricEntry {
  name: string
  value: number
  rating: 'good' | 'needs-improvement' | 'poor'
  delta?: number
  id: string
}

function sendToOTLP(metric: MetricEntry) {
  if (!OTLP_ENDPOINT) return

  const body = JSON.stringify({
    resourceSpans: [{
      resource: { attributes: [
        { key: 'service.name', value: { stringValue: 'daftari-web' } },
        { key: 'service.version', value: { stringValue: APP.VERSION } },
      ]},
      scopeSpans: [{
        scope: { name: 'web-vitals' },
        spans: [{
          name: metric.name,
          startTimeUnixNano: String(Date.now() * 1_000_000),
          endTimeUnixNano: String(Date.now() * 1_000_000),
          attributes: [
            { key: 'metric.value', value: { doubleValue: metric.value } },
            { key: 'metric.rating', value: { stringValue: metric.rating } },
            { key: 'metric.id', value: { stringValue: metric.id } },
            ...(metric.delta !== undefined ? [{ key: 'metric.delta', value: { doubleValue: metric.delta } }] : []),
          ],
        }],
      }],
    }],
  })

  navigator.sendBeacon(OTLP_ENDPOINT, new Blob([body], { type: 'application/json' }))
}

function classify(name: string, value: number): 'good' | 'needs-improvement' | 'poor' {
  const thresholds: Record<string, [number, number]> = {
    CLS: [0.1, 0.25],
    FID: [100, 300],
    LCP: [2500, 4000],
    FCP: [1800, 3000],
    TTFB: [800, 1800],
    INP: [200, 500],
  }
  const [good, poor] = thresholds[name] ?? [Infinity, Infinity]
  if (value <= good) return 'good'
  if (value <= poor) return 'needs-improvement'
  return 'poor'
}

export function initMonitoring() {
  if (typeof window === 'undefined' || !('PerformanceObserver' in window)) return

  // CLS
  try {
    let clsValue = 0
    let clsId = ''
    new PerformanceObserver((list) => {
      for (const entry of list.getEntries()) {
        if (!(entry as PerformanceEntry & { hadRecentInput?: boolean }).hadRecentInput) {
          clsValue += (entry as PerformanceEntry & { value?: number }).value ?? 0
          clsId = (entry as PerformanceEntry & { id?: string }).id || String(Date.now())
        }
      }
      const metric: MetricEntry = { name: 'CLS', value: clsValue, rating: classify('CLS', clsValue), id: clsId }
      sendToOTLP(metric)
    }).observe({ type: 'layout-shift', buffered: true })
  } catch { /* observer not supported */ }

  // LCP
  try {
    new PerformanceObserver((list) => {
      const entries = list.getEntries()
      const last = entries[entries.length - 1]
      if (last) {
        const metric: MetricEntry = { name: 'LCP', value: last.startTime, rating: classify('LCP', last.startTime), id: (last as PerformanceEntry & { id?: string }).id || String(Date.now()) }
        sendToOTLP(metric)
      }
    }).observe({ type: 'largest-contentful-paint', buffered: true })
  } catch { /* observer not supported */ }

  // FCP
  try {
    new PerformanceObserver((list) => {
      for (const entry of list.getEntries()) {
        if (entry.name === 'first-contentful-paint') {
          const metric: MetricEntry = { name: 'FCP', value: entry.startTime, rating: classify('FCP', entry.startTime), id: (entry as PerformanceEntry & { id?: string }).id || String(Date.now()) }
          sendToOTLP(metric)
        }
      }
    }).observe({ type: 'paint', buffered: true })
  } catch { /* observer not supported */ }

  // Report unhandled errors to monitoring
  window.addEventListener('error', (event) => {
    captureError(event.error ?? new Error(event.message), { feature: 'monitoring', action: 'unhandled-error' })
  })

  window.addEventListener('unhandledrejection', (event) => {
    captureError(event.reason ?? new Error('Unhandled promise rejection'), { feature: 'monitoring', action: 'unhandled-rejection' })
  })
}
