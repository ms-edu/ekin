'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase'
import { TUPOKSI_LIST, BUKTI_DOKUMEN, NAMA_BULAN, NAMA_HARI } from '@/types'
import toast from 'react-hot-toast'
import { Printer, ChevronDown, Loader2 } from 'lucide-react'

export default function LaporanPage() {
  const supabase = createClient()
  const [bulan, setBulan] = useState(String(new Date().getMonth()))
  const [tahun, setTahun] = useState(String(new Date().getFullYear()))
  const [loading, setLoading] = useState(false)

  const years = Array.from({ length: 5 }, (_, i) => new Date().getFullYear() - 2 + i)

  // Parse 'YYYY-MM-DD' as LOCAL time (avoid UTC off-by-one bug)
  function parseLocalDate(dateStr: string): Date {
    const [y, m, d] = dateStr.split('-').map(Number)
    return new Date(y, m - 1, d)
  }

  async function generateLaporan() {
    setLoading(true)
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('Not authenticated')

      const bulanNum = parseInt(bulan)      // 0-indexed (0=Jan)
      const tahunNum = parseInt(tahun)
      const bulanDB  = bulanNum + 1         // 1-indexed untuk filter DB

      const [identitasRes, schoolRes, kegiatanRes, jadwalRes, kaldikRes] = await Promise.all([
        supabase.from('users').select('*').eq('id', user.id).single(),
        supabase.from('school_settings').select('*').limit(1).single(),
        supabase.from('kegiatan').select('*').eq('user_id', user.id)
          .gte('tanggal', `${tahunNum}-${String(bulanDB).padStart(2, '0')}-01`)
          .lt('tanggal', bulanNum === 11
            ? `${tahunNum + 1}-01-01`
            : `${tahunNum}-${String(bulanDB + 1).padStart(2, '0')}-01`)
          .order('tanggal'),
        supabase.from('jadwal').select('*').eq('user_id', user.id),
        supabase.from('kaldik').select('*'),
      ])

      const identitas = identitasRes.data
      const school    = schoolRes.data
      const kegiatan  = kegiatanRes.data || []
      const jadwal    = jadwalRes.data || []
      const libur     = (kaldikRes.data || []).map((k: any) => k.tanggal as string)

      const kegiatanMap: Record<string, any[]> = {}
      kegiatan.forEach((k: any) => {
        if (!kegiatanMap[k.tanggal]) kegiatanMap[k.tanggal] = []
        kegiatanMap[k.tanggal].push(k)
      })

      const kelompok: Record<string, any[]> = {}
      const rekapVolume: Record<string, number> = {}
      let tanggalTerakhir: Date | null = null

      const daysInMonth = new Date(tahunNum, bulanNum + 1, 0).getDate()

      for (let d = 1; d <= daysInMonth; d++) {
        // Local date constructor – TIDAK pakai ISO string – hindari timezone bug
        const date      = new Date(tahunNum, bulanNum, d)
        const dayOfWeek = date.getDay()  // 0=Minggu, 1=Senin ... 6=Sabtu
        const dateStr   = `${tahunNum}-${String(bulanNum + 1).padStart(2,'0')}-${String(d).padStart(2,'0')}`

        // Lewati Sabtu (6) dan Minggu (0)
        if (dayOfWeek === 0 || dayOfWeek === 6) continue

        // Lewati hari libur kaldik
        if (libur.includes(dateStr)) continue

        const kegiatanHari = kegiatanMap[dateStr] || []

        // DB: 1=Senin…5=Jumat → cocok dengan getDay() 1-5
        const jadwalHari = jadwal.filter((j: any) => j.hari === dayOfWeek)

        let baris: any[] = []

        if (kegiatanHari.length > 0) {
          const fullday = kegiatanHari.find((k: any) => k.fullday === true)
          if (fullday) {
            // Fullday: hanya kegiatan ini, jadwal diabaikan
            baris = [fullday]
          } else {
            // Non-fullday: jadwal rutin + kegiatan tambahan
            baris = [
              ...jadwalHari.map((j: any) => ({ ...j, id: '', fromJadwal: true, tanggal: dateStr })),
              ...kegiatanHari,
            ]
          }
        } else {
          // Tidak ada kegiatan manual → jadwal rutin saja
          baris = jadwalHari.map((j: any) => ({ ...j, id: '', fromJadwal: true, tanggal: dateStr }))
        }

        if (baris.length > 0) {
          kelompok[dateStr] = baris
          tanggalTerakhir   = date
          baris.forEach((b: any) => {
            if (!rekapVolume[b.tupoksi]) rekapVolume[b.tupoksi] = 0
            rekapVolume[b.tupoksi] += Number(b.volume) || 0
          })
        }
      }

      if (!tanggalTerakhir) tanggalTerakhir = new Date(tahunNum, bulanNum + 1, 0)

      const namaBulan      = NAMA_BULAN[bulanNum]
      const tanggalLaporan = `${school?.kota || 'Singkawang'}, ${tanggalTerakhir.getDate()} ${namaBulan} ${tahunNum}`
      const html           = buildLaporanHTML({ identitas, school, kelompok, rekapVolume, tanggalLaporan, namaBulan, tahunNum, bulanNum })

      const printWindow = window.open('', '_blank')
      if (!printWindow) {
        toast.error('Pop-up diblokir browser. Izinkan pop-up untuk mencetak.')
        return
      }
      printWindow.document.write(html)
      printWindow.document.close()
      setTimeout(() => printWindow.print(), 800)

    } catch (err: any) {
      toast.error('Gagal membuat laporan: ' + err.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="animate-fade-in">
      <div className="mb-6">
        <h1 className="section-title text-xl">Cetak Laporan</h1>
        <p className="text-xs text-slate-500 mt-0.5">Laporan Capaian Kinerja Harian &amp; Bulanan</p>
      </div>

      <div className="card p-5 mb-4">
        <h2 className="text-sm font-semibold text-slate-700 mb-4">Pilih Periode</h2>
        <div className="grid grid-cols-2 gap-3 mb-5">
          <div>
            <label className="label">Bulan</label>
            <div className="relative">
              <select value={bulan} onChange={e => setBulan(e.target.value)} className="select-field pr-10">
                {NAMA_BULAN.map((b, i) => <option key={i} value={i}>{b}</option>)}
              </select>
              <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
            </div>
          </div>
          <div>
            <label className="label">Tahun</label>
            <div className="relative">
              <select value={tahun} onChange={e => setTahun(e.target.value)} className="select-field pr-10">
                {years.map(y =
