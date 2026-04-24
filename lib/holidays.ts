const CACHE_TTL_MS = 86_400_000 // 24 hours

const memoryCache = new Map<number, { data: Record<string, string>; fetchedAt: number }>()

export async function getJapaneseHolidays(year: number): Promise<Record<string, string>> {
  const cached = memoryCache.get(year)
  if (cached && Date.now() - cached.fetchedAt < CACHE_TTL_MS) {
    return cached.data
  }

  try {
    const res = await fetch(`https://holidays-jp.github.io/api/v1/${year}/date.json`, {
      next: { revalidate: 86400 },
    })
    if (!res.ok) return cached?.data ?? {}
    const data: Record<string, string> = await res.json()
    memoryCache.set(year, { data, fetchedAt: Date.now() })
    return data
  } catch {
    return cached?.data ?? {}
  }
}

export async function getHolidaysForYears(years: number[]): Promise<Record<string, string>> {
  const results = await Promise.all(years.map(getJapaneseHolidays))
  return Object.assign({}, ...results)
}
