export function parseRecordId(value: string) {
  const cleaned = value.trim()
  if (!/^\d+$/.test(cleaned)) return null
  const id = Number(cleaned)
  return Number.isSafeInteger(id) && id > 0 ? id : null
}
