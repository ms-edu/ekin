'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase'
import { TUPOKSI_LIST, BUKTI_DOKUMEN, NAMA_BULAN, NAMA_HARI } from '@/types'
import toast from 'react-hot-toast'
import { Printer, ChevronDown, Loader2 } from 'lucide-react'

export default function LaporanPage() {
  const supabase = createClient()
  const now = new Date()
  const [bulan, setBulan] = useState(String(now.getMonth()))
  const [tahun, setTahun] = useState(String(now.getFullYear()))
  const [loading, setLoading] = useState(false)

  const years = Array.from({ length: 5 }, (_, i) => now.getFullYear() - 2 + i)

  async function generateLaporan() {
    setLoading(true)
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('Not authenticated')

      const bulanNum = parseInt(bulan)
      const tahunNum = parseInt(tahun)
      const bulanDB  = bulanNum + 1

      const startDate = tahunNum + '-' + String(bulanDB).padStart(2, '0') + '-01'
      const endDate   = bulanNum === 11
        ? (tahunNum + 1) + '-01-01'
        : tahunNum + '-' + String(bulanDB + 1).padStart(2, '0') + '-01'

      const [identitasRes, schoolRes, kegiatanRes, jadwalRes, kaldikRes] = await Promise.all([
        supabase.from('users').select('*').eq('id', user.id).single(),
        supabase.from('school_settings').select('*').limit(1).single(),
        supabase.from('kegiatan').select('*').eq('user_id', user.id)
          .gte('tanggal', startDate).lt('tanggal', endDate).order('tanggal'),
        supabase.from('jadwal').select('*').eq('user_id', user.id),
        supabase.from('kaldik').select('*'),
      ])

      const identitas = identitasRes.data
      const school    = schoolRes.data
      const kegiatan  = kegiatanRes.data || []
      const jadwal    = jadwalRes.data || []
      const libur     = (kaldikRes.data || []).map((k: any) => k.tanggal as string)

      const kegiatanMap: { [key: string]: any[] } = {}
      kegiatan.forEach((k: any) => {
        if (!kegiatanMap[k.tanggal]) kegiatanMap[k.tanggal] = []
        kegiatanMap[k.tanggal].push(k)
      })

      const kelompok: { [key: string]: any[] } = {}
      const rekapVolume: { [key: string]: number } = {}
      let tanggalTerakhir: Date | null = null

      const daysInMonth = new Date(tahunNum, bulanNum + 1, 0).getDate()

      for (let d = 1; d <= daysInMonth; d++) {
        const date      = new Date(tahunNum, bulanNum, d)
        const dow       = date.getDay() // 0=Sun,1=Mon...6=Sat
        const mm        = String(bulanNum + 1).padStart(2, '0')
        const dd        = String(d).padStart(2, '0')
        const dateStr   = tahunNum + '-' + mm + '-' + dd

        // Skip weekend
        if (dow === 0 || dow === 6) continue
        // Skip holidays
        if (libur.includes(dateStr)) continue

        const kegiatanHari = kegiatanMap[dateStr] || []
        // DB hari: 1=Mon...5=Fri, same as getDay() 1-5
        const jadwalHari   = jadwal.filter((j: any) => j.hari === dow)

        let baris: any[] = []

        if (kegiatanHari.length > 0) {
          const fullday = kegiatanHari.find((k: any) => k.fullday === true)
          if (fullday) {
            // Fullday only - ignore jadwal
            baris = [fullday]
          } else {
            // Non-fullday: jadwal + extra activities
            baris = [
              ...jadwalHari.map((j: any) => ({ ...j, id: '', fromJadwal: true, tanggal: dateStr })),
              ...kegiatanHari,
            ]
          }
        } else {
          // No manual activity - use jadwal only
          baris = jadwalHari.map((j: any) => ({ ...j, id: '', fromJadwal: true, tanggal: dateStr }))
        }

        if (baris.length > 0) {
          kelompok[dateStr]  = baris
          tanggalTerakhir    = date
          baris.forEach((b: any) => {
            if (!rekapVolume[b.tupoksi]) rekapVolume[b.tupoksi] = 0
            rekapVolume[b.tupoksi] += Number(b.volume) || 0
          })
        }
      }

      if (!tanggalTerakhir) tanggalTerakhir = new Date(tahunNum, bulanNum + 1, 0)

      const namaBulan      = NAMA_BULAN[bulanNum]
      const kota           = school?.kota || 'Singkawang'
      const tanggalLaporan = kota + ', ' + tanggalTerakhir.getDate() + ' ' + namaBulan + ' ' + tahunNum

      const html = buildLaporanHTML({
        identitas, school, kelompok, rekapVolume,
        tanggalLaporan, namaBulan, tahunNum,
      })

      const pw = window.open('', '_blank')
      if (!pw) {
        toast.error('Pop-up diblokir browser. Izinkan pop-up untuk mencetak.')
        return
      }
      pw.document.write(html)
      pw.document.close()
      setTimeout(() => pw.print(), 800)

    } catch (err: any) {
      toast.error('Gagal: ' + err.message)
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
                {years.map(y => <option key={y} value={y}>{y}</option>)}
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
          {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Printer className="w-4 h-4" />}
          {loading ? 'Memproses...' : 'Cetak Laporan ' + NAMA_BULAN[parseInt(bulan)] + ' ' + tahun}
        </button>
      </div>

      <div className="card p-4 space-y-3">
        <h3 className="text-sm font-semibold text-slate-700">Yang akan dicetak:</h3>
        <div className="flex gap-3">
          <span className="text-lg flex-shrink-0">{'📋'}</span>
          <div>
            <p className="text-sm font-medium text-slate-700">Laporan Capaian Kinerja Harian</p>
            <p className="text-xs text-slate-500 mt-0.5">Per hari kerja Senin-Jumat. Fullday menggantikan jadwal; non-fullday digabung jadwal rutin.</p>
          </div>
        </div>
        <div className="flex gap-3">
          <span className="text-lg flex-shrink-0">{'📊'}</span>
          <div>
            <p className="text-sm font-medium text-slate-700">Laporan Kinerja Bulanan</p>
            <p className="text-xs text-slate-500 mt-0.5">Rekap volume per tupoksi dengan bukti dukung dokumen</p>
          </div>
        </div>
        <div className="flex gap-3">
          <span className="text-lg flex-shrink-0">{'✍️'}</span>
          <div>
            <p className="text-sm font-medium text-slate-700">Lembar Pengesahan</p>
            <p className="text-xs text-slate-500 mt-0.5">Tanda tangan guru dan atasan langsung dengan stempel sekolah</p>
          </div>
        </div>
      </div>
    </div>
  )
}

function buildLaporanHTML({ identitas, school, kelompok, rekapVolume, tanggalLaporan, namaBulan, tahunNum }: any) {
  const sortedDates = Object.keys(kelompok).sort()
  let tableRows = ''

  sortedDates.forEach((dateStr, i) => {
    const baris = kelompok[dateStr]
    const parts = dateStr.split('-')
    const yyyy  = parseInt(parts[0])
    const mm    = parseInt(parts[1])
    const dd    = parseInt(parts[2])
    const date  = new Date(yyyy, mm - 1, dd)
    const namaHari = NAMA_HARI[date.getDay()]
    const tgl      = String(dd).padStart(2,'0') + '/' + String(mm).padStart(2,'0') + '/' + yyyy

    baris.forEach((item: any, idx: number) => {
      const firstCols = idx === 0
        ? '<td class="no-col" rowspan="' + baris.length + '">' + (i + 1) + '</td>' +
          '<td class="tanggal-col" rowspan="' + baris.length + '"><strong>' + namaHari + '</strong><br>' + tgl + '</td>'
        : ''
      tableRows += '<tr>' + firstCols +
        '<td>' + (item.kegiatan || '') + '</td>' +
        '<td>' + (item.output || '') + '</td>' +
        '<td class="center">' + (item.volume || '') + '</td>' +
        '<td class="center">' + (item.satuan || '') + '</td>' +
        '</tr>'
    })
  })

  let bulananRows = ''
  TUPOKSI_LIST.forEach((tupoksi, i) => {
    const vol = rekapVolume[tupoksi] !== undefined ? rekapVolume[tupoksi] : '-'
    bulananRows += '<tr>' +
      '<td class="center">' + (i + 1) + '</td>' +
      '<td>' + tupoksi + '</td>' +
      '<td class="center">' + vol + '</td>' +
      '<td>' + (BUKTI_DOKUMEN[tupoksi] || '-') + '</td>' +
      '</tr>'
  })

  const pengesahan = buildPengesahan(identitas, school, tanggalLaporan)

  const css = [
    '*{box-sizing:border-box}',
    '@page{size:legal portrait;margin:20mm 25mm 20mm 25mm}',
    'body{font-family:\"Times New Roman\",Times,serif;margin:0;padding:0;line-height:1.5;color:#000;font-size:11pt}',
    'h1{text-align:center;font-size:14pt;font-weight:bold;margin:0 0 4px}',
    'h2{text-align:center;font-size:13pt;font-weight:bold;margin:0 0 20px}',
    '.info-table{width:100%;margin-bottom:20px;border-collapse:collapse}',
    '.info-table td{padding:2px 5px;border:none}',
    '.info-label{width:40%}',
    '.info-value{font-weight:bold}',
    'table.data{width:100%;border-collapse:collapse;margin-bottom:30px}',
    'table.data th,table.data td{border:1px solid #000;padding:6px 8px;vertical-align:top}',
    'table.data th{background:#f0f0f0;font-weight:bold;text-align:center}',
    '.no-col{width:35px;text-align:center}',
    '.tanggal-col{width:110px}',
    '.center{text-align:center}',
    '.page-break{page-break-before:always;padding-top:20px}',
    '.pengesahan{page-break-inside:avoid;width:100%;border-collapse:collapse;margin-top:30px;position:relative}',
  ].join('')

  const infoRows = (label: string, val: string) =>
    '<tr><td class="info-label">' + label + '</td><td>:</td><td class="info-value">' + (val || '-') + '</td></tr>'

  const infoTable = '<table class="info-table">' +
    infoRows('NAMA', identitas?.nama) +
    infoRows('NIP', identitas?.nip) +
    infoRows('JABATAN', identitas?.jabatan) +
    infoRows('UNIT KERJA', identitas?.unit_kerja) +
    infoRows('UNIT ORGANISASI', identitas?.unit_organisasi) +
    infoRows('BULAN', namaBulan.toUpperCase() + ' ' + tahunNum) +
    '</table>'

  const dataTable = '<table class="data"><thead><tr>' +
    '<th class="no-col">NO</th>' +
    '<th class="tanggal-col">TANGGAL</th>' +
    '<th>KEGIATAN</th><th>OUTPUT</th>' +
    '<th style="width:50px">VOL</th>' +
    '<th style="width:70px">SATUAN</th>' +
    '</tr></thead><tbody>' +
    (tableRows || '<tr><td colspan="6" class="center">Tidak ada data</td></tr>') +
    '</tbody></table>'

  const bulananTable = '<table class="data"><thead><tr>' +
    '<th class="no-col">No</th>' +
    '<th>Uraian Tugas / Kegiatan</th>' +
    '<th style="width:60px">Volume</th>' +
    '<th>Bukti Dukung</th>' +
    '</tr></thead><tbody>' + bulananRows + '</tbody></table>'

  const infoTableBulanan = '<table class="info-table" style="margin-bottom:30px">' +
    infoRows('NAMA', identitas?.nama) +
    infoRows('JABATAN', identitas?.jabatan) +
    infoRows('UNIT KERJA', identitas?.unit_kerja) +
    '</table>'

  return '<!DOCTYPE html><html><head>' +
    '<title>Laporan Kinerja ' + namaBulan + ' ' + tahunNum + '</title>' +
    '<meta charset="UTF-8">' +
    '<style>' + css + '</style>' +
    '</head><body>' +
    '<h1>LAPORAN CAPAIAN KINERJA HARIAN</h1>' +
    '<h2>PEGAWAI NEGERI SIPIL KEMENTERIAN AGAMA</h2>' +
    infoTable + dataTable + pengesahan +
    '<div class="page-break">' +
    '<h1>LAPORAN KINERJA BULANAN</h1>' +
    '<h2>BULAN ' + namaBulan.toUpperCase() + ' ' + tahunNum + '</h2>' +
    infoTableBulanan + bulananTable + pengesahan +
    '</div></body></html>'
}

function buildPengesahan(identitas: any, school: any, tanggalLaporan: string) {
  const ttdKepala = school?.ttd_kepala_url
    ? '<img src="' + school.ttd_kepala_url + '" style="height:85px;max-width:200px;display:block;margin:0 auto;position:relative;z-index:1;" alt="TTD Kepala" />'
    : '<div style="height:85px;"></div>'

  const ttdGuru = identitas?.tanda_tangan_url
    ? '<img src="' + identitas.tanda_tangan_url + '" style="height:85px;max-width:200px;display:block;margin:0 auto;" alt="TTD" />'
    : '<div style="height:85px;"></div>'

  // TTD kepala digeser kanan 45px agar stempel menimpa 30% bagian kirinya
  const ttdKepalaShifted = school?.stempel_url
    ? '<div style="margin-left:45px;display:inline-block;position:relative;z-index:1;">' + ttdKepala + '</div>'
    : ttdKepala

  // Stempel 4cm=151px.
  // Diletakkan position:absolute di dalam <td> kolom kiri yang position:relative.
  // bottom:0 = bawah stempel sejajar bawah cell (= baris NIP).
  // left:0 = sisi kiri cell.
  const stempel = school?.stempel_url
    ? '<img src="' + school.stempel_url + '"' +
      ' style="position:absolute;bottom:0;left:0;width:151px;height:151px;' +
      'object-fit:contain;opacity:0.88;z-index:2;" alt="Stempel" />'
    : ''

  // Padding bawah cell = padding baris NIP (8px) agar bottom:0 stempel sejajar teks NIP
  const tdKiriStyle = 'width:50%;text-align:center;padding:0 10px;position:relative;'

  return (
    '<table class="pengesahan">' +

    // BARIS 1: Label — sejajar kiri & kanan
    '<tr>' +
    '<td style="width:50%;text-align:center;padding:0 10px 8px;font-weight:bold;vertical-align:bottom;">' +
      'Atasan Langsung' +
    '</td>' +
    '<td style="width:50%;text-align:center;padding:0 10px 8px;vertical-align:bottom;">' +
      '<div>' + tanggalLaporan + '</div>' +
      '<div style="font-weight:bold;">Pegawai yang Dinilai,</div>' +
    '</td>' +
    '</tr>' +

    // BARIS 2: TTD — height 85px sejajar kiri & kanan
    '<tr>' +
    '<td style="' + tdKiriStyle + 'height:85px;vertical-align:middle;">' +
      stempel +
      '<div style="height:85px;display:flex;align-items:center;justify-content:center;">' +
        ttdKepalaShifted +
      '</div>' +
    '</td>' +
    '<td style="width:50%;text-align:center;padding:0 10px;height:85px;vertical-align:middle;">' +
      '<div style="height:85px;display:flex;align-items:center;justify-content:center;">' +
        ttdGuru +
      '</div>' +
    '</td>' +
    '</tr>' +

    // BARIS 3: Nama — sejajar
    '<tr>' +
    '<td style="' + tdKiriStyle + 'padding-top:6px;padding-bottom:2px;font-weight:bold;">' +
      (school?.nama_kepala || 'Nama Kepala Sekolah') +
    '</td>' +
    '<td style="width:50%;text-align:center;padding:6px 10px 2px;font-weight:bold;">' +
      (identitas?.nama || '-') +
    '</td>' +
    '</tr>' +

    // BARIS 4: NIP — sejajar, padding-bottom:8px = acuan bottom:0 stempel
    '<tr>' +
    '<td style="' + tdKiriStyle + 'padding-bottom:8px;">' +
      (school?.nip_kepala || 'NIP. -') +
    '</td>' +
    '<td style="width:50%;text-align:center;padding:0 10px 8px;">' +
      'NIP. ' + (identitas?.nip || '-') +
    '</td>' +
    '</tr>' +

    '</table>'
  )
}
