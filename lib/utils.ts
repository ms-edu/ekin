import { NAMA_BULAN, NAMA_HARI } from '@/types'

/**
 * Parse 'YYYY-MM-DD' sebagai LOCAL time (bukan UTC).
 * Hindari bug timezone: new Date('2024-01-01') = UTC midnight = 31 Des di WIB (UTC+7).
 */
export function parseLocalDate(dateStr: string): Date {
  const [y, m, d] = dateStr.split('-').map(Number)
  return new Date(y, m - 1, d)
}

export function formatTanggal(dateStr: string): string {
  const d = parseLocalDate(dateStr)
  if (isNaN(d.getTime())) return dateStr
  const dd = String(d.getDate()).padStart(2, '0')
  const mm = String(d.getMonth() + 1).padStart(2, '0')
  const yyyy = d.getFullYear()
  return `${dd}/${mm}/${yyyy}`
}

export function formatTanggalLengkap(dateStr: string): string {
  const d = parseLocalDate(dateStr)
  if (isNaN(d.getTime())) return dateStr
  return `${d.getDate()} ${NAMA_BULAN[d.getMonth()]} ${d.getFullYear()}`
}

export function getNamaHari(dateStr: string): string {
  const d = parseLocalDate(dateStr)
  return NAMA_HARI[d.getDay()]
}

export function isWeekend(dateStr: string): boolean {
  const d = parseLocalDate(dateStr)
  const day = d.getDay()
  return day === 0 || day === 6
}

export function dateToInputValue(dateStr: string): string {
  if (!dateStr) return ''
  return dateStr.split('T')[0]
}

export function cn(...classes: (string | undefined | null | false)[]): string {
  return classes.filter(Boolean).join(' ')
}

// DB: 1=Senin, 2=Selasa, 3=Rabu, 4=Kamis, 5=Jumat
export function hariToString(hari: number): string {
  const map: Record<number, string> = {
    1: 'Senin', 2: 'Selasa', 3: 'Rabu', 4: 'Kamis', 5: 'Jumat',
  }
  return map[hari] || '-'
}
