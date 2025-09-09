// Simple client-side metrics service backed by localStorage
// Collects verification events and provides aggregated metrics for the Analytics dashboard

export type VerificationCategory = 'identity' | 'financial' | 'business' | 'academic'
export type VerificationOutcome = 'verified' | 'unverified' | 'suspicious' | 'failed'

export interface VerificationEvent {
  id: string
  documentName: string
  bytes: number
  category: VerificationCategory
  outcome: VerificationOutcome
  confidence: number | null
  startedAt: number // epoch ms
  completedAt: number // epoch ms
}

export type TimeRange = '7d' | '30d' | '90d' | '1y'

const STORAGE_KEY = 'verifiai:events:v1'
const API_BASE: string = (import.meta as any)?.env?.VITE_API_BASE || 'http://localhost:3000'

function readAll(): VerificationEvent[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return []
    const parsed = JSON.parse(raw)
    if (!Array.isArray(parsed)) return []
    return parsed as VerificationEvent[]
  } catch {
    return []
  }
}

function writeAll(events: VerificationEvent[]) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(events))
  } catch {
    // ignore quota errors in demo
  }
}

export function addEvent(evt: VerificationEvent) {
  const all = readAll()
  all.push(evt)
  writeAll(all)
  // Best-effort: forward to backend metrics endpoint
  try {
    fetch(`${API_BASE}/api/metrics`, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify(evt),
      keepalive: true,
    }).catch(() => {})
  } catch {
    // ignore network errors in demo
  }
}

function rangeToSinceMs(range: TimeRange): number {
  const now = Date.now()
  switch (range) {
    case '7d':
      return now - 7 * 24 * 60 * 60 * 1000
    case '30d':
      return now - 30 * 24 * 60 * 60 * 1000
    case '90d':
      return now - 90 * 24 * 60 * 60 * 1000
    case '1y':
      return now - 365 * 24 * 60 * 60 * 1000
  }
}

export function getEvents(range: TimeRange): VerificationEvent[] {
  const since = rangeToSinceMs(range)
  return readAll().filter(e => e.completedAt >= since)
}

export interface AggregatedMetrics {
  totalVerifications: number
  successRate: number
  avgProcessingTime: number // seconds
  activeUsers: number // demo proxy: verifications today
  dailyVerifications: number[]
  documentTypeDistribution: Array<{ type: string; count: number; percentage: number }>
  confidenceDistribution: Array<{ range: string; count: number; percentage: number }>
  hourlyActivity: Array<{ hour: string; verifications: number }>
}

export function getAggregatedMetrics(range: TimeRange): AggregatedMetrics | null {
  const events = getEvents(range)
  if (events.length === 0) return null

  const now = new Date()

  // total & success rate
  const total = events.length
  const successful = events.filter(e => e.outcome === 'verified').length
  const successRate = total > 0 ? (successful / total) * 100 : 0

  // avg processing time (seconds)
  const avgProcessingTime =
    total > 0
      ? events.reduce((acc, e) => acc + Math.max(0, (e.completedAt - e.startedAt) / 1000), 0) / total
      : 0

  // active users proxy: verifications done today
  const startOfDay = new Date(now)
  startOfDay.setHours(0, 0, 0, 0)
  const activeUsers = events.filter(e => e.completedAt >= startOfDay.getTime()).length

  // time buckets for daily verifications
  const days = range === '7d' ? 7 : range === '30d' ? 30 : range === '90d' ? 90 : 365
  const dayCounts = new Array(days).fill(0)
  const startDate = new Date(now.getTime() - (days - 1) * 24 * 60 * 60 * 1000)
  startDate.setHours(0, 0, 0, 0)
  for (const e of events) {
    const d = new Date(e.completedAt)
    d.setHours(0, 0, 0, 0)
    const idx = Math.floor((d.getTime() - startDate.getTime()) / (24 * 60 * 60 * 1000))
    if (idx >= 0 && idx < days) {
      dayCounts[idx]++
    }
  }

  // document type distribution
  const typeCounts = new Map<string, number>()
  for (const e of events) {
    typeCounts.set(e.category, (typeCounts.get(e.category) || 0) + 1)
  }
  const docDist = Array.from(typeCounts.entries())
    .map(([type, count]) => ({ type: labelForCategory(type as VerificationCategory), count }))
    .sort((a, b) => b.count - a.count)
  const docDistTotal = docDist.reduce((a, b) => a + b.count, 0)
  const documentTypeDistribution = docDist.map(({ type, count }) => ({
    type,
    count,
    percentage: docDistTotal ? Math.round((count / docDistTotal) * 1000) / 10 : 0,
  }))

  // confidence distribution
  const buckets = [
    { range: '90-100%', count: 0 },
    { range: '80-89%', count: 0 },
    { range: '70-79%', count: 0 },
    { range: '60-69%', count: 0 },
    { range: 'Below 60%', count: 0 },
  ]
  for (const e of events) {
    const c = e.confidence ?? 0
    if (c >= 90) buckets[0].count++
    else if (c >= 80) buckets[1].count++
    else if (c >= 70) buckets[2].count++
    else if (c >= 60) buckets[3].count++
    else buckets[4].count++
  }
  const confTotal = buckets.reduce((a, b) => a + b.count, 0) || 1
  const confidenceDistribution = buckets.map(b => ({
    range: b.range,
    count: b.count,
    percentage: Math.round((b.count / confTotal) * 1000) / 10,
  }))

  // hourly activity (today)
  const hourly = new Array(12).fill(0) // show every 2 hours across 24h
  const startOfToday = startOfDay.getTime()
  for (const e of events) {
    if (e.completedAt >= startOfToday) {
      const hour = new Date(e.completedAt).getHours()
      const slot = Math.floor(hour / 2)
      hourly[slot]++
    }
  }
  const hourlyActivity = hourly.map((count, i) => ({
    hour: `${String(i * 2).padStart(2, '0')}:00`,
    verifications: count,
  }))

  return {
    totalVerifications: total,
    successRate: Math.round(successRate * 10) / 10,
    avgProcessingTime: Math.round(avgProcessingTime * 10) / 10,
    activeUsers,
    dailyVerifications: dayCounts,
    documentTypeDistribution,
    confidenceDistribution,
    hourlyActivity,
  }
}

function labelForCategory(cat: VerificationCategory): string {
  switch (cat) {
    case 'identity':
      return 'Identity Documents'
    case 'financial':
      return 'Financial Documents'
    case 'business':
      return 'Business Documents'
    case 'academic':
      return 'Academic Documents'
  }
}
