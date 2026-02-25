export interface User {
  id: string
  email: string
  nama?: string
  nip?: string
  jabatan?: string
  unit_kerja?: string
  unit_organisasi?: string
  tanda_tangan_url?: string
  created_at?: string
  updated_at?: string
}

export interface SchoolSettings {
  id?: string
  nama_sekolah?: string
  nama_kepala?: string
  nip_kepala?: string
  ttd_kepala_url?: string
  stempel_url?: string
  kota?: string
  updated_at?: string
}

export interface Kegiatan {
  id: string
  user_id: string
  tanggal: string
  tupoksi: string
  kegiatan: string
  output: string
  volume: number
  satuan: string
  fullday: boolean
  created_at?: string
  updated_at?: string
}

export interface Jadwal {
  id: string
  user_id: string
  hari: number // 1=Senin, 7=Minggu
  tupoksi: string
  kegiatan: string
  output: string
  volume: number
  satuan: string
  created_at?: string
}

export interface Kaldik {
  id: string
  tanggal: string
  keterangan?: string
  created_at?: string
}

export interface KegiatanHarian {
  id: string
  tanggal: string
  tupoksi: string
  kegiatan: string
  output: string
  volume: number
  satuan: string
  fullday: boolean
  fromJadwal?: boolean
}

export const TUPOKSI_LIST = [
  'Menyusun kurikulum',
  'Menyusun silabus/ATP',
  'Menyusun RPP/Modul Ajar',
  'Melaksanakan KBM',
  'Menyusun instrumen penilaian',
  'Melaksanakan asesmen',
  'Menganalisis hasil asesmen',
  'Melaksanakan program pengayaan/perbaikan',
  'Menjadi pengawas asesmen',
  'Menjadi pengawas asesmen nasional',
  'Melaksanakan pengembangan diri',
  'Melaksanakan publikasi ilmiah',
  'Melaksanakan kegiatan di sekolah',
]

export const BUKTI_DOKUMEN: Record<string, string> = {
  'Menyusun kurikulum': 'Kurikulum Madrasah',
  'Menyusun silabus/ATP': 'Silabus/ATP',
  'Menyusun RPP/Modul Ajar': 'RPP/Modul Ajar',
  'Melaksanakan KBM': 'Jadwal/Jurnal',
  'Menyusun instrumen penilaian': 'Kisi-kisi/Soal',
  'Melaksanakan asesmen': 'Daftar Nilai',
  'Menganalisis hasil asesmen': 'Lembar Analisis',
  'Melaksanakan program pengayaan/perbaikan': 'Program',
  'Menjadi pengawas asesmen': 'SK/Laporan',
  'Menjadi pengawas asesmen nasional': 'SK/Laporan',
  'Melaksanakan pengembangan diri': 'Laporan/Sertifikat',
  'Melaksanakan publikasi ilmiah': 'Laporan',
  'Melaksanakan kegiatan di sekolah': 'Jadwal/Daftar Hadir',
}

export const NAMA_HARI = ['Minggu', 'Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu']
export const NAMA_BULAN = [
  'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
  'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember',
]
