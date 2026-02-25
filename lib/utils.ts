import { NAMA_BULAN, NAMA_HARI } from '@/types'

export function formatTanggal(dateStr: string): string {
  const d = new Date(dateStr)
  if (isNaN(d.getTime())) return dateStr
  const dd = String(d.getDate()).padStart(2, '0')
  const mm = String(d.getMonth() + 1).padStart(2, '0')
  const yyyy = d.getFullYear()
  return `${dd}/${mm}/${yyyy}`
}

export function formatTanggalLengkap(dateStr: string): string {
  const d = new Date(dateStr)
  if (isNaN(d.getTime())) return dateStr
  return `${d.getDate()} ${NAMA_BULAN[d.getMonth()]} ${d.getFullYear()}`
}

export function getNamaHari(dateStr: string): string {
  const d = new Date(dateStr)
  return NAMA_HARI[d.getDay()]
}

export function isWeekend(dateStr: string): boolean {
  const d = new Date(dateStr)
  const day = d.getDay()
  return day === 0 || day === 6
}

export function getHariKerja(bulan: number, tahun: number, libur: string[]): Date[] {
  const result: Date[] = []
  const daysInMonth = new Date(tahun, bulan + 1, 0).getDate()
  
  for (let d = 1; d <= daysInMonth; d++) {
    const date = new Date(tahun, bulan, d)
    const day = date.getDay()
    if (day >= 1 && day <= 5) {
      const dateStr = date.toISOString().split('T')[0]
      if (!libur.includes(dateStr)) {
        result.push(date)
      }
    }
  }
  return result
}

export function dateToInputValue(dateStr: string): string {
  if (!dateStr) return ''
  const d = new Date(dateStr)
  if (isNaN(d.getTime())) return ''
  return d.toISOString().split('T')[0]
}

export function cn(...classes: (string | undefined | null | false)[]): string {
  return classes.filter(Boolean).join(' ')
}

export function hariToString(hari: number): string {
  const map: Record<number, string> = {
    1: 'Senin', 2: 'Selasa', 3: 'Rabu', 4: 'Kamis', 5: 'Jumat', 6: 'Sabtu', 7: 'Minggu'
  }
  return map[hari] || '-'
}
