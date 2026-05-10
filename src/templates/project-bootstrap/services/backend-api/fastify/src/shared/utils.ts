export function slugify(text: string): string {
  return text
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '')
}

export function generateId(): string {
  return crypto.randomUUID()
}

export function toISODate(date: Date): string {
  return date.toISOString().split('T')[0]
}

export function parsePageParams(page: unknown, limit: unknown) {
  const p = Math.max(1, Number(page) || 1)
  const l = Math.min(100, Math.max(1, Number(limit) || 20))
  return { page: p, limit: l, offset: (p - 1) * l }
}
