'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import { createClient } from '@/lib/supabase'
import toast from 'react-hot-toast'
import {
  User, School, Upload, Save, Camera, Trash2,
  ChevronRight, Shield, LogOut, Eye
} from 'lucide-react'
import Image from 'next/image'
import { useRouter } from 'next/navigation'

type Section = 'identitas' | 'sekolah' | null

export default function PengaturanPage() {
  const supabase = createClient()
  const router = useRouter()
  const [activeSection, setActiveSection] = useState<Section>(null)
  const [saving, setSaving] = useState(false)
  const [loading, setLoading] = useState(true)

  // User identity state
  const [identitas, setIdentitas] = useState({
    nama: '',
    nip: '',
    jabatan: '',
    unit_kerja: '',
    unit_organisasi: '',
  })
  const [ttdGuru, setTtdGuru] = useState<string | null>(null)
  const [ttdGuruPreview, setTtdGuruPreview] = useState<string | null>(null)
  const [ttdGuruFile, setTtdGuruFile] = useState<File | null>(null)

  // School settings state
  const [school, setSchool] = useState({
    nama_sekolah: '',
    nama_kepala: '',
    nip_kepala: '',
    kota: 'Singkawang',
  })
  const [ttdKepala, setTtdKepala] = useState<string | null>(null)
  const [ttdKepalaPreview, setTtdKepalaPreview] = useState<string | null>(null)
  const [ttdKepalaFile, setTtdKepalaFile] = useState<File | null>(null)
  const [stempel, setStempel] = useState<string | null>(null)
  const [stempelPreview, setStempelPreview] = useState<string | null>(null)
  const [stempelFile, setStempelFile] = useState<File | null>(null)

  const ttdGuruRef = useRef<HTMLInputElement>(null)
  const ttdKepalaRef = useRef<HTMLInputElement>(null)
  const stempelRef = useRef<HTMLInputElement>(null)

  const loadData = useCallback(async () => {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    const [userRes, schoolRes] = await Promise.all([
      supabase.from('users').select('*').eq('id', user.id).single(),
      supabase.from('school_settings').select('*').limit(1).single(),
    ])

    if (userRes.data) {
      setIdentitas({
        nama: userRes.data.nama || '',
        nip: userRes.data.nip || '',
        jabatan: userRes.data.jabatan || '',
        unit_kerja: userRes.data.unit_kerja || '',
        unit_organisasi: userRes.data.unit_organisasi || '',
      })
      if (userRes.data.tanda_tangan_url) setTtdGuru(userRes.data.tanda_tangan_url)
    }

    if (schoolRes.data) {
      setSchool({
        nama_sekolah: schoolRes.data.nama_sekolah || '',
        nama_kepala: schoolRes.data.nama_kepala || '',
        nip_kepala: schoolRes.data.nip_kepala || '',
        kota: schoolRes.data.kota || 'Singkawang',
      })
      if (schoolRes.data.ttd_kepala_url) setTtdKepala(schoolRes.data.ttd_kepala_url)
      if (schoolRes.data.stempel_url) setStempel(schoolRes.data.stempel_url)
    }
    setLoading(false)
  }, [supabase])

  useEffect(() => { loadData() }, [loadData])

  async function uploadFile(file: File, bucket: string, path: string): Promise<string | null> {
    const { error } = await supabase.storage.from(bucket).upload(path, file, { upsert: true })
    if (error) throw error
    const { data } = supabase.storage.from(bucket).getPublicUrl(path)
    return data.publicUrl
  }

  function handleImageFile(
    file: File,
    setPreview: (v: string) => void,
    setFileState: (v: File) => void
  ) {
    if (!file.type.startsWith('image/')) {
      toast.error('File harus berupa gambar')
      return
    }
    if (file.size > 2 * 1024 * 1024) {
      toast.error('Ukuran file maksimal 2MB')
      return
    }
    const reader = new FileReader()
    reader.onload = e => setPreview(e.target?.result as string)
    reader.readAsDataURL(file)
    setFileState(file)
  }

  async function saveIdentitas() {
    setSaving(true)
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('Not authenticated')

      let ttdUrl = ttdGuru
      if (ttdGuruFile) {
        ttdUrl = await uploadFile(ttdGuruFile, 'signatures', `${user.id}/ttd-guru.${ttdGuruFile.name.split('.').pop()}`)
      }

      const { error } = await supabase.from('users').update({
        ...identitas,
        tanda_tangan_url: ttdUrl,
        updated_at: new Date().toISOString(),
      }).eq('id', user.id)

      if (error) throw error
      toast.success('Identitas berhasil disimpan')
      setTtdGuru(ttdUrl)
      setTtdGuruFile(null)
      setTtdGuruPreview(null)
    } catch (err: any) {
      toast.error('Gagal: ' + err.message)
    } finally {
      setSaving(false)
    }
  }

  async function saveSchool() {
    setSaving(true)
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('Not authenticated')

      let kepalaUrl = ttdKepala
      let stempelUrl = stempel

      if (ttdKepalaFile) {
        kepalaUrl = await uploadFile(ttdKepalaFile, 'signatures', `school/ttd-kepala.${ttdKepalaFile.name.split('.').pop()}`)
      }
      if (stempelFile) {
        stempelUrl = await uploadFile(stempelFile, 'stamps', `school/stempel.${stempelFile.name.split('.').pop()}`)
      }

      // Upsert school settings (only one row)
      const { data: existing } = await supabase.from('school_settings').select('id').limit(1).single()
      
      if (existing) {
        const { error } = await supabase.from('school_settings').update({
          ...school,
          ttd_kepala_url: kepalaUrl,
          stempel_url: stempelUrl,
          updated_at: new Date().toISOString(),
        }).eq('id', existing.id)
        if (error) throw error
      } else {
        const { error } = await supabase.from('school_settings').insert({
          ...school,
          ttd_kepala_url: kepalaUrl,
          stempel_url: stempelUrl,
        })
        if (error) throw error
      }

      toast.success('Pengaturan sekolah disimpan')
      setTtdKepala(kepalaUrl)
      setStempel(stempelUrl)
      setTtdKepalaFile(null)
      setTtdKepalaPreview(null)
      setStempelFile(null)
      setStempelPreview(null)
    } catch (err: any) {
      toast.error('Gagal: ' + err.message)
    } finally {
      setSaving(false)
    }
  }

  async function handleLogout() {
    await supabase.auth.signOut()
    router.push('/login')
  }

  function ImageUploader({
    label, current, preview, inputRef, bucket,
    onFileChange, onRemove
  }: {
    label: string
    current: string | null
    preview: string | null
    inputRef: React.RefObject<HTMLInputElement>
    bucket: string
    onFileChange: (file: File) => void
    onRemove: () => void
  }) {
    const displayUrl = preview || current
    return (
      <div>
        <label className="label">{label}</label>
        <div className="border-2 border-dashed border-slate-200 rounded-xl p-4 bg-slate-50">
          {displayUrl ? (
            <div className="relative">
              <img
                src={displayUrl}
                alt={label}
                className="max-h-24 mx-auto object-contain rounded-lg"
              />
              <div className="flex gap-2 mt-3 justify-center">
                <button
                  type="button"
                  onClick={() => inputRef.current?.click()}
                  className="flex items-center gap-1.5 text-xs text-primary-600 bg-primary-50 px-3 py-1.5 rounded-full"
                >
                  <Upload className="w-3 h-3" /> Ganti
                </button>
                <button
                  type="button"
                  onClick={onRemove}
                  className="flex items-center gap-1.5 text-xs text-red-500 bg-red-50 px-3 py-1.5 rounded-full"
                >
                  <Trash2 className="w-3 h-3" /> Hapus
                </button>
              </div>
            </div>
          ) : (
            <button
              type="button"
              onClick={() => inputRef.current?.click()}
              className="w-full flex flex-col items-center gap-2 py-4 text-slate-500"
            >
              <Camera className="w-8 h-8 text-slate-300" />
              <span className="text-sm">Tap untuk upload gambar</span>
              <span className="text-xs text-slate-400">PNG/JPG, maks 2MB</span>
            </button>
          )}
          <input
            ref={inputRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={e => {
              const file = e.target.files?.[0]
              if (file) onFileChange(file)
            }}
          />
        </div>
      </div>
    )
  }

  if (loading) {
    return (
      <div className="space-y-3">
        {[1,2,3].map(i => (
          <div key={i} className="card p-4 animate-pulse">
            <div className="h-4 bg-slate-200 rounded w-1/3" />
          </div>
        ))}
      </div>
    )
  }

  return (
    <div className="animate-fade-in">
      <div className="mb-5">
        <h1 className="section-title text-xl">Pengaturan</h1>
        <p className="text-xs text-slate-500 mt-0.5">Kelola identitas dan konfigurasi aplikasi</p>
      </div>

      {/* Section: Identitas Diri */}
      <div className="card mb-3 overflow-hidden">
        <button
          onClick={() => setActiveSection(activeSection === 'identitas' ? null : 'identitas')}
          className="w-full p-4 flex items-center justify-between"
        >
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-primary-100 flex items-center justify-center">
              <User className="w-4 h-4 text-primary-600" />
            </div>
            <div className="text-left">
              <p className="text-sm font-semibold text-slate-800">Identitas Diri</p>
              <p className="text-xs text-slate-400">Nama, NIP, jabatan, TTD pribadi</p>
            </div>
          </div>
          <ChevronRight className={`w-4 h-4 text-slate-400 transition-transform ${
            activeSection === 'identitas' ? 'rotate-90' : ''
          }`} />
        </button>

        {activeSection === 'identitas' && (
          <div className="px-4 pb-5 border-t border-slate-50 animate-slide-up">
            <div className="space-y-3 mt-4">
              {[
                { field: 'nama', label: 'Nama Lengkap', placeholder: 'Nama sesuai SK' },
                { field: 'nip', label: 'NIP', placeholder: '19XXXXXXXXXXXX' },
                { field: 'jabatan', label: 'Jabatan', placeholder: 'Guru Mata Pelajaran' },
                { field: 'unit_kerja', label: 'Unit Kerja', placeholder: 'MTs/MA ...' },
                { field: 'unit_organisasi', label: 'Unit Organisasi', placeholder: 'Kemenag Kota/Kab ...' },
              ].map(({ field, label, placeholder }) => (
                <div key={field}>
                  <label className="label">{label}</label>
                  <input
                    value={(identitas as any)[field]}
                    onChange={e => setIdentitas(prev => ({ ...prev, [field]: e.target.value }))}
                    placeholder={placeholder}
                    className="input-field"
                  />
                </div>
              ))}

              <ImageUploader
                label="Tanda Tangan Anda"
                current={ttdGuru}
                preview={ttdGuruPreview}
                inputRef={ttdGuruRef}
                bucket="signatures"
                onFileChange={f => handleImageFile(f, setTtdGuruPreview, setTtdGuruFile)}
                onRemove={() => { setTtdGuru(null); setTtdGuruPreview(null); setTtdGuruFile(null) }}
              />

              <button
                onClick={saveIdentitas}
                disabled={saving}
                className="btn-primary w-full flex items-center justify-center gap-2 mt-2"
              >
                {saving ? (
                  <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                ) : (
                  <Save className="w-4 h-4" />
                )}
                {saving ? 'Menyimpan...' : 'Simpan Identitas'}
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Section: Pengaturan Sekolah */}
      <div className="card mb-3 overflow-hidden">
        <button
          onClick={() => setActiveSection(activeSection === 'sekolah' ? null : 'sekolah')}
          className="w-full p-4 flex items-center justify-between"
        >
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-emerald-100 flex items-center justify-center">
              <School className="w-4 h-4 text-emerald-600" />
            </div>
            <div className="text-left">
              <p className="text-sm font-semibold text-slate-800">Pengaturan Sekolah</p>
              <p className="text-xs text-slate-400">Kepala sekolah, NIP, TTD & stempel</p>
            </div>
          </div>
          <ChevronRight className={`w-4 h-4 text-slate-400 transition-transform ${
            activeSection === 'sekolah' ? 'rotate-90' : ''
          }`} />
        </button>

        {activeSection === 'sekolah' && (
          <div className="px-4 pb-5 border-t border-slate-50 animate-slide-up">
            <div className="space-y-3 mt-4">
              {[
                { field: 'nama_sekolah', label: 'Nama Sekolah', placeholder: 'MTs Negeri 1 ...' },
                { field: 'nama_kepala', label: 'Nama Kepala Sekolah', placeholder: 'Drs. Nama Kepala, M.Pd' },
                { field: 'nip_kepala', label: 'NIP Kepala Sekolah', placeholder: 'NIP. 19XX...' },
                { field: 'kota', label: 'Kota/Kabupaten', placeholder: 'Singkawang' },
              ].map(({ field, label, placeholder }) => (
                <div key={field}>
                  <label className="label">{label}</label>
                  <input
                    value={(school as any)[field]}
                    onChange={e => setSchool(prev => ({ ...prev, [field]: e.target.value }))}
                    placeholder={placeholder}
                    className="input-field"
                  />
                </div>
              ))}

              <ImageUploader
                label="Tanda Tangan Kepala Sekolah"
                current={ttdKepala}
                preview={ttdKepalaPreview}
                inputRef={ttdKepalaRef}
                bucket="signatures"
                onFileChange={f => handleImageFile(f, setTtdKepalaPreview, setTtdKepalaFile)}
                onRemove={() => { setTtdKepala(null); setTtdKepalaPreview(null); setTtdKepalaFile(null) }}
              />

              <ImageUploader
                label="Stempel Sekolah"
                current={stempel}
                preview={stempelPreview}
                inputRef={stempelRef}
                bucket="stamps"
                onFileChange={f => handleImageFile(f, setStempelPreview, setStempelFile)}
                onRemove={() => { setStempel(null); setStempelPreview(null); setStempelFile(null) }}
              />

              <button
                onClick={saveSchool}
                disabled={saving}
                className="btn-primary w-full flex items-center justify-center gap-2 mt-2"
              >
                {saving ? (
                  <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                ) : (
                  <Save className="w-4 h-4" />
                )}
                {saving ? 'Menyimpan...' : 'Simpan Pengaturan Sekolah'}
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Danger zone */}
      <div className="card overflow-hidden mt-4">
        <button
          onClick={handleLogout}
          className="w-full p-4 flex items-center gap-3 text-red-600 hover:bg-red-50 transition-colors"
        >
          <div className="w-9 h-9 rounded-xl bg-red-100 flex items-center justify-center">
            <LogOut className="w-4 h-4 text-red-500" />
          </div>
          <div className="text-left">
            <p className="text-sm font-semibold">Keluar</p>
            <p className="text-xs text-red-400">Logout dari akun ini</p>
          </div>
        </button>
      </div>

      <p className="text-center text-xs text-slate-300 mt-6">E-Kinerja Guru v1.0</p>
    </div>
  )
}
