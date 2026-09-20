/** 数字安全解析：非法/空值回退到 0 */
export function toNumber(v: unknown): number {
  const n = typeof v === 'number' ? v : Number(v)
  return Number.isFinite(n) ? n : 0
}

/** 参考单价展示：空/非法值显示占位符，最多保留两位小数 */
export function formatPrice(v: unknown): string {
  const n = typeof v === 'number' ? v : Number(v)
  if (!Number.isFinite(n) || n <= 0) return '—'
  return `¥${trimNumber(n)}`
}

/** 金额展示：无有效单价时显示占位符 */
export function formatAmount(v: unknown): string {
  const n = typeof v === 'number' ? v : Number(v)
  if (!Number.isFinite(n) || n <= 0) return '—'
  return `约 ¥${trimNumber(n)}`
}

/** 去掉数值末尾多余的 0（最多两位小数） */
function trimNumber(n: number): string {
  return n.toFixed(2).replace(/\.?0+$/, '')
}

/** 时间戳 → YYYY-MM-DD */
export function formatDate(ts: number): string {
  const d = new Date(ts)
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${y}-${m}-${day}`
}

/** 判断某个时间戳是否属于本月 */
export function isCurrentMonth(ts: number): boolean {
  const d = new Date(ts)
  const now = new Date()
  return d.getFullYear() === now.getFullYear() && d.getMonth() === now.getMonth()
}

/** 判断 ISO 日期字符串 a 是否 <= b（YYYY-MM-DD 可直接字典序比较） */
export function isOnOrBefore(a: string, b: string): boolean {
  return a <= b
}

/** 当前日期 YYYY-MM-DD */
export function today(): string {
  return formatDate(Date.now())
}

/** 判断是否已逾期：期望归还日期 < 今天且未归还 */
export function isOverdue(expectedReturnDate: string): boolean {
  return expectedReturnDate < today()
}
