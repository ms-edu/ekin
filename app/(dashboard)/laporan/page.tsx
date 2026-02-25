'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase'
import { TUPOKSI_LIST, BUKTI_DOKUMEN, NAMA_BULAN, NAMA_HARI } from '@/types'
import toast from 'react-hot-toast'
import { FileText, Printer, ChevronDown, Loader2 } from 'lucide-react'

export default function LaporanPage() {
  const supabase = createClient()
  const [bulan, setBulan] = useState(String(new Date().getMonth()))
  const [tahun, setTahun] = useState(String(new Date().getFullYear()))
  const [loading, setLoading] = useState(false)

  const years = Array.from({ length: 5 }, (_, i) => new Date().getFullYear() - 2 + i)

  async function generateLaporan() {
    setLoading(true)
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('Not authenticated')

      const bulanNum = parseInt(bulan)
      const tahunNum = parseInt(tahun)

      // Fetch all data in parallel
      const [identitasRes, schoolRes, kegiatanRes, jadwalRes, kaldikRes] = await Promise.all([
        supabase.from('users').select('*').eq('id', user.id).single(),
        supabase.from('school_settings').select('*').limit(1).single(),
        supabase.from('kegiatan').select('*').eq('user_id', user.id)
          .gte('tanggal', `${tahunNum}-${String(bulanNum + 1).padStart(2, '0')}-01`)
          .lte('tanggal', `${tahunNum}-${String(bulanNum + 1).padStart(2, '0')}-31`)
          .order('tanggal'),
        supabase.from('jadwal').select('*').eq('user_id', user.id),
        supabase.from('kaldik').select('*'),
      ])

      const identitas = identitasRes.data
      const school = schoolRes.data
      const kegiatan = kegiatanRes.data || []
      const jadwal = jadwalRes.data || []
      const libur = (kaldikRes.data || []).map((k: any) => k.tanggal)

      // Build data structure
      const kegiatanMap: Record<string, any[]> = {}
      kegiatan.forEach((k: any) => {
        const dateStr = k.tanggal
        if (!kegiatanMap[dateStr]) kegiatanMap[dateStr] = []
        kegiatanMap[dateStr].push(k)
      })

      // Calculate working days and build table
      const kelompok: Record<string, any[]> = {}
      const rekapVolume: Record<string, number> = {}
      let tanggalTerakhir: Date | null = null

      const daysInMonth = new Date(tahunNum, bulanNum + 1, 0).getDate()

      for (let d = 1; d <= daysInMonth; d++) {
        const date = new Date(tahunNum, bulanNum, d)
        const dateStr = date.toISOString().split('T')[0]
        const dayOfWeek = date.getDay()

        if (dayOfWeek === 0 || dayOfWeek === 6) continue
        if (libur.includes(dateStr)) continue

        const kegiatanHari = kegiatanMap[dateStr] || []
        const jadwalHari = jadwal.filter((j: any) => j.hari === dayOfWeek)

        let baris: any[] = []

        if (kegiatanHari.length > 0) {
          const fullday = kegiatanHari.find((k: any) => k.fullday)
          if (fullday) {
            baris = [fullday]
          } else {
            // Jadwal + manual
            baris = [
              ...jadwalHari.map((j: any) => ({ ...j, fromJadwal: true, tanggal: dateStr })),
              ...kegiatanHari,
            ]
          }
        } else {
          baris = jadwalHari.map((j: any) => ({ ...j, fromJadwal: true, tanggal: dateStr }))
        }

        if (baris.length > 0) {
          kelompok[dateStr] = baris
          tanggalTerakhir = date
          baris.forEach((b: any) => {
            if (!rekapVolume[b.tupoksi]) rekapVolume[b.tupoksi] = 0
            rekapVolume[b.tupoksi] += Number(b.volume) || 0
          })
        }
      }

      if (!tanggalTerakhir) tanggalTerakhir = new Date(tahunNum, bulanNum + 1, 0)

      const tanggalLaporan = `${school?.kota || 'Singkawang'}, ${tanggalTerakhir.getDate()} ${NAMA_BULAN[bulanNum]} ${tahunNum}`
      const namaBulan = NAMA_BULAN[bulanNum]

      // Generate HTML
      const html = buildLaporanHTML({
        identitas, school, kelompok, rekapVolume,
        tanggalLaporan, namaBulan, tahunNum, bulanNum
      })

      const printWindow = window.open('', '_blank')
      if (!printWindow) {
        toast.error('Pop-up diblokir browser. Izinkan pop-up untuk mencetak.')
        return
      }

      printWindow.document.write(html)
      printWindow.document.close()
      setTimeout(() => {
        printWindow.print()
      }, 800)

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
        <p className="text-xs text-slate-500 mt-0.5">Laporan Capaian Kinerja Harian & Bulanan</p>
      </div>

      <div className="card p-5 mb-4">
        <h2 className="text-sm font-semibold text-slate-700 mb-4">Pilih Periode</h2>
        
        <div className="grid grid-cols-2 gap-3 mb-5">
          <div>
            <label className="label">Bulan</label>
            <div className="relative">
              <select
                value={bulan}
                onChange={e => setBulan(e.target.value)}
                className="select-field pr-10"
              >
                {NAMA_BULAN.map((b, i) => (
                  <option key={i} value={i}>{b}</option>
                ))}
              </select>
              <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
            </div>
          </div>
          <div>
            <label className="label">Tahun</label>
            <div className="relative">
              <select
                value={tahun}
                onChange={e => setTahun(e.target.value)}
                className="select-field pr-10"
              >
                {years.map(y => (
                  <option key={y} value={y}>{y}</option>
                ))}
              </select>
              <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
            </div>
          </div>
        </div>

        <button
          onClick={generateLaporan}
          disabled={loading}
          className="btn-primary w-full flex items-center justify-center gap-2"
        >
          {loading ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            <Printer className="w-4 h-4" />
          )}
          {loading ? 'Memproses...' : `Cetak Laporan ${NAMA_BULAN[parseInt(bulan)]} ${tahun}`}
        </button>
      </div>

      {/* Info */}
      <div className="card p-4 space-y-3">
        <h3 className="text-sm font-semibold text-slate-700">Yang akan dicetak:</h3>
        {[
          { icon: '📋', title: 'Laporan Capaian Kinerja Harian', desc: 'Rincian kegiatan per hari kerja dengan kolom kegiatan, output, volume dan satuan' },
          { icon: '📊', title: 'Laporan Kinerja Bulanan', desc: 'Rekap volume per tupoksi dengan bukti dukung dokumen' },
          { icon: '✍️', title: 'Lembar Pengesahan', desc: 'Tanda tangan guru & atasan langsung dengan stempel sekolah' },
        ].map(item => (
          <div key={item.title} className="flex gap-3">
            <span className="text-lg flex-shrink-0">{item.icon}</span>
            <div>
              <p className="text-sm font-medium text-slate-700">{item.title}</p>
              <p className="text-xs text-slate-500 mt-0.5">{item.desc}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

function buildLaporanHTML({ identitas, school, kelompok, rekapVolume, tanggalLaporan, namaBulan, tahunNum, bulanNum }: any) {
  const sortedDates = Object.keys(kelompok).sort()
  
  let tableRows = ''
  sortedDates.forEach((dateStr, i) => {
    const baris = kelompok[dateStr]
    const date = new Date(dateStr)
    const namaHari = NAMA_HARI[date.getDay()]
    const [yyyy, mm, dd] = dateStr.split('-')
    const tanggalFormatted = `${dd}/${mm}/${yyyy}`

    baris.forEach((item: any, idx: number) => {
      tableRows += `<tr>
        ${idx === 0 ? `
          <td class="no-col" rowspan="${baris.length}">${i + 1}</td>
          <td class="tanggal-col" rowspan="${baris.length}">
            <strong>${namaHari}</strong><br>${tanggalFormatted}
          </td>` : ''}
        <td>${item.kegiatan || ''}</td>
        <td>${item.output || ''}</td>
        <td class="center">${item.volume || ''}</td>
        <td class="center">${item.satuan || ''}</td>
      </tr>`
    })
  })

  let bulananRows = ''
  TUPOKSI_LIST.forEach((tupoksi, i) => {
    bulananRows += `<tr>
      <td class="center">${i + 1}</td>
      <td>${tupoksi}</td>
      <td class="center">${rekapVolume[tupoksi] ?? '-'}</td>
      <td>${BUKTI_DOKUMEN[tupoksi] || '-'}</td>
    </tr>`
  })

  const pengesahan = buildPengesahan(identitas, school, tanggalLaporan)

  return `<!DOCTYPE html>
<html>
<head>
<title>Laporan Kinerja ${namaBulan} ${tahunNum}</title>
<meta charset="UTF-8">
<style>
  * { box-sizing: border-box; }
  body { font-family: "Times New Roman", Times, serif; margin: 0; padding: 20px 40px; line-height: 1.5; color: #000; font-size: 12pt; }
  h1 { text-align: center; font-size: 14pt; font-weight: bold; margin: 0 0 4px; }
  h2 { text-align: center; font-size: 13pt; font-weight: bold; margin: 0 0 20px; }
  .info-table { width: 100%; margin-bottom: 20px; border-collapse: collapse; }
  .info-table td { padding: 2px 5px; border: none; }
  .info-label { width: 40%; }
  .info-value { font-weight: bold; }
  table.data { width: 100%; border-collapse: collapse; margin-bottom: 30px; }
  table.data th, table.data td { border: 1px solid #000; padding: 6px 8px; vertical-align: top; }
  table.data th { background: #f0f0f0; font-weight: bold; text-align: center; }
  .no-col { width: 35px; text-align: center; }
  .tanggal-col { width: 110px; }
  .center { text-align: center; }
  .page-break { page-break-before: always; padding-top: 20px; }
  @media print {
    body { padding: 10px 20px; }
    .page-break { page-break-before: always; }
  }
</style>
</head>
<body>

<h1>LAPORAN CAPAIAN KINERJA HARIAN</h1>
<h2>PEGAWAI NEGERI SIPIL KEMENTERIAN AGAMA</h2>

<table class="info-table">
  <tr><td class="info-label">NAMA</td><td>:</td><td class="info-value">${identitas?.nama || '-'}</td></tr>
  <tr><td class="info-label">NIP</td><td>:</td><td class="info-value">${identitas?.nip || '-'}</td></tr>
  <tr><td class="info-label">JABATAN</td><td>:</td><td class="info-value">${identitas?.jabatan || '-'}</td></tr>
  <tr><td class="info-label">UNIT KERJA</td><td>:</td><td class="info-value">${identitas?.unit_kerja || '-'}</td></tr>
  <tr><td class="info-label">UNIT ORGANISASI</td><td>:</td><td class="info-value">${identitas?.unit_organisasi || '-'}</td></tr>
  <tr><td class="info-label">BULAN</td><td>:</td><td class="info-value">${namaBulan.toUpperCase()} ${tahunNum}</td></tr>
</table>

<table class="data">
  <thead>
    <tr>
      <th class="no-col">NO</th>
      <th class="tanggal-col">TANGGAL</th>
      <th>KEGIATAN</th>
      <th>OUTPUT</th>
      <th style="width:50px">VOL</th>
      <th style="width:70px">SATUAN</th>
    </tr>
  </thead>
  <tbody>
    ${tableRows || '<tr><td colspan="6" class="center">Tidak ada data</td></tr>'}
  </tbody>
</table>

${pengesahan}

<div class="page-break">
  <h1>LAPORAN KINERJA BULANAN</h1>
  <h2>BULAN ${namaBulan.toUpperCase()} ${tahunNum}</h2>

  <table class="info-table">
    <tr><td class="info-label">NAMA</td><td>:</td><td class="info-value">${identitas?.nama || '-'}</td></tr>
    <tr><td class="info-label">JABATAN</td><td>:</td><td class="info-value">${identitas?.jabatan || '-'}</td></tr>
    <tr><td class="info-label">UNIT KERJA</td><td>:</td><td class="info-value">${identitas?.unit_kerja || '-'}</td></tr>
  </table>

  <table class="data">
    <thead>
      <tr>
        <th class="no-col">No</th>
        <th>Uraian Tugas / Kegiatan</th>
        <th style="width:60px">Volume</th>
        <th>Bukti Dukung</th>
      </tr>
    </thead>
    <tbody>${bulananRows}</tbody>
  </table>

  ${pengesahan}
</div>

</body>
</html>`
}

function buildPengesahan(identitas: any, school: any, tanggalLaporan: string) {
  const ttdGuru = identitas?.tanda_tangan_url 
    ? `<img src="${identitas.tanda_tangan_url}" style="height:80px;max-width:200px;" alt="TTD" />`
    : '<div style="height:80px;"></div>'

  const ttdKepala = school?.ttd_kepala_url
    ? `<img src="${school.ttd_kepala_url}" style="height:80px;max-width:200px;" alt="TTD Kepala" />`
    : '<div style="height:80px;"></div>'

  const stempel = school?.stempel_url
    ? `<img src="${school.stempel_url}" style="height:120px;width:auto;opacity:0.85;position:absolute;top:0;left:-10px;z-index:-1;" alt="Stempel" />`
    : ''

  return `<table style="width:100%;margin-top:40px;">
    <tr>
      <td style="width:50%;text-align:center;vertical-align:top;padding:5px;">
        <div style="font-weight:bold;">Atasan Langsung</div>
        <div style="position:relative;min-height:100px;display:flex;align-items:center;justify-content:center;">
          ${stempel}
          ${ttdKepala}
        </div>
        <div style="font-weight:bold;">${school?.nama_kepala || 'Nama Kepala Sekolah'}</div>
        <div>${school?.nip_kepala || 'NIP. -'}</div>
      </td>
      <td style="width:50%;text-align:center;vertical-align:top;padding:5px;">
        <div>${tanggalLaporan}</div>
        <div style="font-weight:bold;margin-bottom:5px;">Pegawai yang Dinilai,</div>
        <div style="min-height:100px;display:flex;align-items:center;justify-content:center;">
          ${ttdGuru}
        </div>
        <div style="font-weight:bold;">${identitas?.nama || '-'}</div>
        <div>NIP. ${identitas?.nip || '-'}</div>
      </td>
    </tr>
  </table>`
}
